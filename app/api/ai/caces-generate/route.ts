import { NextResponse } from "next/server";

import {
  CACES_CATEGORIES,
  alignQuestionToEhepManual,
  buildCacesQuestionKey,
  dedupeCacesQuestions,
} from "@/src/lib/caces";
import { generateJsonWithGeminiFallback } from "@/src/lib/ai/geminiFallback";
import { enforceRateLimit, requireAuthenticatedUser } from "@/src/lib/serverGuards";
import type { CacesDifficulty, CacesOptionId, CacesQuestion, CacesQuestionType } from "@/src/lib/types";

const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_CACES_GENERATE = Number(process.env.AI_RATE_LIMIT_CACES_GENERATE ?? 12);
const MAX_GENERATE_COUNT = Number(process.env.AI_CACES_MAX_GENERATE_COUNT ?? 80);

type CacesGenerateRequest = {
  count?: number;
  filters?: {
    category?: string;
    categories?: string[];
    component?: string;
    subcomponent?: string;
    topic?: string;
    difficulty?: CacesDifficulty;
    type?: CacesQuestionType;
    mix_categories?: boolean;
  };
  exclude_question_keys?: string[];
};

type CacesGenerateLLMResponse = {
  questions?: Array<{
    component?: string;
    subcomponent?: string;
    topic?: string;
    category?: string;
    type?: CacesQuestionType;
    question?: string;
    options?: Array<{
      id?: CacesOptionId;
      text?: string;
      rationale?: string;
    }>;
    correctAnswer?: CacesOptionId;
    explanation?: string;
    difficulty?: CacesDifficulty;
    tags?: string[];
  }>;
};

function cleanText(value: unknown, fallback = "") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function normalizeType(value: unknown, fallback: CacesQuestionType): CacesQuestionType {
  return value === "caso_clinico" ? "caso_clinico" : value === "directa" ? "directa" : fallback;
}

function normalizeDifficulty(value: unknown, fallback: CacesDifficulty): CacesDifficulty {
  if (value === "basica" || value === "intermedia" || value === "alta") return value;
  return fallback;
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const tag of value) {
    const clean = cleanText(tag);
    if (!clean || out.includes(clean)) continue;
    out.push(clean);
    if (out.length >= 8) break;
  }
  return out;
}

function normalizeLite(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFallbackExplanation(correct: CacesOptionId, rationale: string) {
  const base = cleanText(rationale, "responde mejor al escenario clínico planteado")
    .replace(/\.$/, "")
    .toLowerCase();
  return `La opción ${correct} es la más adecuada porque ${base}.`;
}

function isGeneratedQuestionQualityAcceptable(args: {
  stem: string;
  options: CacesQuestion["options"];
  explanation: string;
  difficulty: CacesDifficulty;
}) {
  const { stem, options, explanation, difficulty } = args;
  const normalizedStem = normalizeLite(stem);
  if (normalizedStem.length < 24) return false;
  if (!stem.includes("?") && !stem.includes("¿")) return false;
  if (explanation.trim().length < 24) return false;

  const optionTexts = options.map((opt) => cleanText(opt.text));
  const normalizedOptions = optionTexts.map((text) => normalizeLite(text));
  const uniqueOptions = new Set(normalizedOptions.filter(Boolean));
  if (uniqueOptions.size < 4) return false;
  if (optionTexts.some((text) => text.length < 14)) return false;

  const hasBadAbsolute = optionTexts.some((text) => /\bsiempre\b|\bnunca\b|\btodas\b|\bninguna\b/i.test(text));
  if (hasBadAbsolute) return false;

  if (difficulty === "alta") {
    const lengths = optionTexts.map((text) => text.length);
    const spread = Math.max(...lengths) - Math.min(...lengths);
    if (spread > 95) return false;
  }

  return true;
}

function sanitizeGeneratedQuestions(args: {
  raw: CacesGenerateLLMResponse;
  fallbackCategory?: string;
  fallbackComponent?: string;
  fallbackSubcomponent?: string;
  fallbackTopic?: string;
  fallbackDifficulty?: CacesDifficulty;
  fallbackType?: CacesQuestionType;
}): CacesQuestion[] {
  const {
    raw,
    fallbackCategory = "Fundamentos del cuidado enfermero",
    fallbackComponent = "Fundamentos del cuidado enfermero",
    fallbackSubcomponent = "General",
    fallbackTopic = "Pregunta clínica",
    fallbackDifficulty = "intermedia",
    fallbackType = "directa",
  } = args;

  const rows = Array.isArray(raw?.questions) ? raw.questions : [];
  const out: CacesQuestion[] = [];
  const now = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const q = rows[i];
    const optionsRaw = Array.isArray(q?.options) ? q.options : [];
    if (optionsRaw.length < 4) continue;

    const mappedOptions = optionsRaw.slice(0, 4).map((opt, idx) => ({
      id: (["A", "B", "C", "D"][idx] as CacesOptionId),
      text: cleanText(opt?.text, `Opción ${idx + 1}`),
      rationale: cleanText(opt?.rationale, "No es la mejor opción en este caso."),
    })) as CacesQuestion["options"];

    const answerInput = String(q?.correctAnswer ?? "").toUpperCase();
    const correctAnswer: CacesOptionId =
      answerInput === "A" || answerInput === "B" || answerInput === "C" || answerInput === "D"
        ? (answerInput as CacesOptionId)
        : "A";
    const correctOption = mappedOptions.find((opt) => opt.id === correctAnswer);

    const categoryRaw = cleanText(q?.category, fallbackCategory);
    const category = CACES_CATEGORIES.includes(categoryRaw as (typeof CACES_CATEGORIES)[number])
      ? categoryRaw
      : fallbackCategory;
    const stemRaw = cleanText(q?.question, "Pregunta académica de práctica");
    const stem = /[?¿]/.test(stemRaw) ? stemRaw : `${stemRaw}?`;
    const difficulty = normalizeDifficulty(q?.difficulty, fallbackDifficulty);
    const explanationRaw = cleanText(q?.explanation);
    const explanation =
      explanationRaw.length >= 24
        ? explanationRaw
        : buildFallbackExplanation(correctAnswer, correctOption?.rationale ?? "");
    const candidate: CacesQuestion = {
      id: `caces-ai-${now}-${i + 1}-${Math.floor(Math.random() * 10_000)}`,
      component: cleanText(q?.component, fallbackComponent),
      subcomponent: cleanText(q?.subcomponent, fallbackSubcomponent),
      topic: cleanText(q?.topic, fallbackTopic),
      category,
      type: normalizeType(q?.type, fallbackType),
      question: stem,
      options: mappedOptions,
      correctAnswer,
      explanation,
      difficulty,
      tags: cleanTags(q?.tags),
    };
    if (
      !isGeneratedQuestionQualityAcceptable({
        stem: candidate.question,
        options: candidate.options,
        explanation: candidate.explanation,
        difficulty: candidate.difficulty,
      })
    ) {
      continue;
    }

    out.push(candidate);
  }

  return dedupeCacesQuestions(out).map(alignQuestionToEhepManual);
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) return auth.response;

    const limited = enforceRateLimit({
      key: `caces-generate:${auth.data.userId}`,
      limit:
        Number.isFinite(RATE_LIMIT_CACES_GENERATE) && RATE_LIMIT_CACES_GENERATE > 0
          ? RATE_LIMIT_CACES_GENERATE
          : 12,
      windowMs:
        Number.isFinite(RATE_LIMIT_WINDOW_MS) && RATE_LIMIT_WINDOW_MS >= 1000
          ? RATE_LIMIT_WINDOW_MS
          : 60_000,
    });
    if (!limited.ok) return limited.response;

    const body = (await req.json()) as CacesGenerateRequest;
    const countRaw = Number(body?.count ?? 10);
    const count = Math.max(1, Math.min(MAX_GENERATE_COUNT, Number.isFinite(countRaw) ? Math.trunc(countRaw) : 10));

    const filters = body?.filters ?? {};
    const requestedCategories = Array.isArray(filters?.categories)
      ? filters.categories
          .map((value) => cleanText(value))
          .filter((value) => CACES_CATEGORIES.includes(value as (typeof CACES_CATEGORIES)[number]))
      : [];
    const fallbackDifficulty = filters?.difficulty ?? "intermedia";
    const fallbackType = filters?.type ?? "directa";
    const categoryForPrompt = requestedCategories.length > 0
      ? requestedCategories.length === 1
        ? requestedCategories[0]
        : `mezcla de categorías (${requestedCategories.join(", ")})`
      : filters?.mix_categories
        ? "mezcla de categorías"
        : cleanText(filters?.category, "todas");
    const componentForPrompt = cleanText(filters?.component, "todos");
    const subcomponentForPrompt = cleanText(filters?.subcomponent, "todos");
    const topicForPrompt = cleanText(filters?.topic, "todos");
    const previousStems = Array.isArray(body?.exclude_question_keys)
      ? body.exclude_question_keys.map((k) => cleanText(k).slice(0, 240)).filter(Boolean).slice(-80)
      : [];

    const provider = "gemini";

    const system = `
Eres un generador de preguntas tipo CACES para entrenamiento académico de enfermería.
Devuelve SOLO JSON válido (sin markdown, sin texto extra), con estructura:
{
  "questions": [
    {
      "component": "string",
      "subcomponent": "string",
      "topic": "string",
      "category": "string",
      "type": "directa|caso_clinico",
      "question": "string",
      "options": [
        {"id":"A","text":"string","rationale":"string"},
        {"id":"B","text":"string","rationale":"string"},
        {"id":"C","text":"string","rationale":"string"},
        {"id":"D","text":"string","rationale":"string"}
      ],
      "correctAnswer": "A|B|C|D",
      "explanation": "string",
      "difficulty": "basica|intermedia|alta",
      "tags": ["string","string"]
    }
  ]
}

Reglas:
- Preguntas originales. No copiar reactivos oficiales.
- Estilo académico profesional con razonamiento clínico.
- 4 opciones plausibles, una correcta.
- Todas las opciones deben ser coherentes con el enunciado y pertenecer al mismo contexto clínico.
- En preguntas de caso clínico, incluir escenario clínico breve, valoración y una instrucción interrogativa clara.
- Evitar defectos técnicos: términos absolutos ("siempre", "nunca"), "ninguna/todas las anteriores", pistas gramaticales o lógicas.
- Mantener opciones de la misma categoría conceptual y extensión relativa similar.
- En dificultad "alta", las 4 opciones deben ser clínicamente cercanas entre sí, con diferencias sutiles.
- Explicación breve y didáctica que justifique por qué la respuesta correcta es la mejor opción.
- Uso educativo.
- Evita repetir o parafrasear demasiado preguntas previas.
- No incluir contenido morboso ni sensacionalista.
`;

    const user = JSON.stringify(
      {
        instruction: "Genera preguntas nuevas y variadas para ampliar el banco del simulador CACES.",
        count,
        filters: {
          category: categoryForPrompt,
          categories: requestedCategories,
          component: componentForPrompt,
          subcomponent: subcomponentForPrompt,
          topic: topicForPrompt,
          difficulty: fallbackDifficulty,
          type: fallbackType,
          mix_categories: Boolean(filters?.mix_categories),
          balance_by_category: Boolean(filters?.mix_categories),
        },
        allowed_categories: CACES_CATEGORIES,
        avoid_similar_to_previous: previousStems,
      },
      null,
      2
    );

    const llm = await generateJsonWithGeminiFallback<CacesGenerateLLMResponse>({
      messages: [
        {
          role: "system",
          content: `${system}\nRESPONDE SOLO CON JSON VÁLIDO.`,
        },
        { role: "user", content: user },
      ],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      },
      timeoutMs: 60_000,
    });

    const generated = sanitizeGeneratedQuestions({
      raw: llm.output,
      fallbackCategory: requestedCategories[0] || filters?.category,
      fallbackComponent: filters?.component || requestedCategories[0] || filters?.category || "General",
      fallbackSubcomponent: filters?.subcomponent || "General",
      fallbackTopic: filters?.topic || "Práctica académica",
      fallbackDifficulty,
      fallbackType,
    });

    const excludedSet = new Set(previousStems);
    const deduped = dedupeCacesQuestions(generated).filter((q) => {
      const key = buildCacesQuestionKey(q);
      return key && !excludedSet.has(key);
    });

    return NextResponse.json({
      questions: deduped.slice(0, count),
      provider,
      modelUsed: llm.modelUsed,
      fallbackUsed: llm.fallbackUsed,
      attempts: llm.attempts,
      requested: count,
      generated: deduped.slice(0, count).length,
      educational_note: "Contenido de uso educativo; no corresponde a reactivos oficiales.",
    });
  } catch (e: any) {
    const status = Number(
      e?.status ??
      e?.attempts?.[Array.isArray(e?.attempts) ? e.attempts.length - 1 : 0]?.status ??
      NaN
    );
    const msg = String(e?.message ?? "");

    const isRateLimited =
      status === 429 ||
      /\b429\b/.test(msg) ||
      /rate limit|quota|too many requests|resource_exhausted/i.test(msg);
    if (isRateLimited) {
      return NextResponse.json(
        {
          code: "RATE_LIMIT",
          detail: "Límite alcanzado al generar preguntas CACES con IA. Intenta de nuevo en breve.",
          attempts: Array.isArray(e?.attempts) ? e.attempts : undefined,
        },
        { status: 429 }
      );
    }

    if (/gemini_all_models_failed/i.test(msg)) {
      return NextResponse.json(
        {
          code: "GEMINI_ALL_MODELS_FAILED",
          detail: "Todos los modelos Gemini configurados fallaron temporalmente.",
          attempts: Array.isArray(e?.attempts) ? e.attempts : undefined,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        code: "CACES_GENERATION_FAILED",
        detail: String(e?.message ?? "No se pudo generar preguntas con IA."),
        attempts: Array.isArray(e?.attempts) ? e.attempts : undefined,
      },
      { status: 500 }
    );
  }
}
