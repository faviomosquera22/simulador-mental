import { NextResponse } from "next/server";

import {
  CACES_CATEGORIES,
  alignQuestionToEhepManual,
  buildCacesQuestionKey,
  dedupeCacesQuestions,
} from "@/src/lib/caces";
import { geminiChatJSON } from "@/src/lib/gemini";
import { enforceRateLimit, requireAuthenticatedUser } from "@/src/lib/serverGuards";
import type { CacesDifficulty, CacesOptionId, CacesQuestion, CacesQuestionType } from "@/src/lib/types";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL;
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME;

const FORCE_PROVIDER = String(process.env.AI_PROVIDER ?? "").toLowerCase().trim();
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_CACES_GENERATE = Number(process.env.AI_RATE_LIMIT_CACES_GENERATE ?? 12);
const MAX_GENERATE_COUNT = Number(process.env.AI_CACES_MAX_GENERATE_COUNT ?? 80);

type CacesGenerateRequest = {
  count?: number;
  filters?: {
    category?: string;
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

function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Could not parse JSON from model output");
  }
}

async function openAICompatChatJSON(opts: {
  url: string;
  apiKey: string;
  model: string;
  temperature?: number;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}) {
  const {
    url,
    apiKey,
    model,
    temperature = 0.7,
    messages,
    headers = {},
    timeoutMs = 60_000,
  } = opts;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...headers,
      },
      body: JSON.stringify({
        model,
        temperature,
        stream: false,
        messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err: any = new Error(`openai_compat_http_${res.status}: ${txt}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const content = String(data?.choices?.[0]?.message?.content ?? "");
    return extractJSON(content);
  } finally {
    clearTimeout(t);
  }
}

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

    const categoryRaw = cleanText(q?.category, fallbackCategory);
    const category = CACES_CATEGORIES.includes(categoryRaw as (typeof CACES_CATEGORIES)[number])
      ? categoryRaw
      : fallbackCategory;

    out.push({
      id: `caces-ai-${now}-${i + 1}-${Math.floor(Math.random() * 10_000)}`,
      component: cleanText(q?.component, fallbackComponent),
      subcomponent: cleanText(q?.subcomponent, fallbackSubcomponent),
      topic: cleanText(q?.topic, fallbackTopic),
      category,
      type: normalizeType(q?.type, fallbackType),
      question: cleanText(q?.question, "Pregunta académica de práctica."),
      options: mappedOptions,
      correctAnswer,
      explanation: cleanText(q?.explanation, "Respuesta orientativa de uso educativo."),
      difficulty: normalizeDifficulty(q?.difficulty, fallbackDifficulty),
      tags: cleanTags(q?.tags),
    });
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
    const fallbackDifficulty = filters?.difficulty ?? "intermedia";
    const fallbackType = filters?.type ?? "directa";
    const categoryForPrompt = filters?.mix_categories ? "mezcla de categorías" : cleanText(filters?.category, "todas");
    const componentForPrompt = cleanText(filters?.component, "todos");
    const subcomponentForPrompt = cleanText(filters?.subcomponent, "todos");
    const topicForPrompt = cleanText(filters?.topic, "todos");
    const previousStems = Array.isArray(body?.exclude_question_keys)
      ? body.exclude_question_keys.map((k) => cleanText(k).slice(0, 240)).filter(Boolean).slice(-80)
      : [];

    let provider: "gemini" | "groq" | "openrouter" = "gemini";
    if (FORCE_PROVIDER === "groq") provider = "groq";
    else if (FORCE_PROVIDER === "openrouter") provider = "openrouter";
    else if (FORCE_PROVIDER === "gemini") provider = "gemini";

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
- En preguntas de caso clínico, incluir escenario clínico breve, valoración y una instrucción interrogativa clara.
- Evitar defectos técnicos: términos absolutos ("siempre", "nunca"), "ninguna/todas las anteriores", pistas gramaticales o lógicas.
- Mantener opciones de la misma categoría conceptual y extensión relativa similar.
- Explicación breve y didáctica.
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
          component: componentForPrompt,
          subcomponent: subcomponentForPrompt,
          topic: topicForPrompt,
          difficulty: fallbackDifficulty,
          type: fallbackType,
          mix_categories: Boolean(filters?.mix_categories),
        },
        allowed_categories: CACES_CATEGORIES,
        avoid_similar_to_previous: previousStems,
      },
      null,
      2
    );

    const callGroq = async () => {
      if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
      provider = "groq";
      return openAICompatChatJSON({
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: GROQ_API_KEY,
        model: GROQ_MODEL,
        temperature: 0.8,
        timeoutMs: 45_000,
        messages: [
          {
            role: "system",
            content: `${system}\nRESPONDE SOLO CON JSON VÁLIDO.`,
          },
          { role: "user", content: user },
        ],
      });
    };

    const callOpenRouter = async () => {
      if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
      provider = "openrouter";
      const extraHeaders: Record<string, string> = {};
      if (OPENROUTER_SITE_URL) extraHeaders["HTTP-Referer"] = OPENROUTER_SITE_URL;
      if (OPENROUTER_APP_NAME) extraHeaders["X-Title"] = OPENROUTER_APP_NAME;

      return openAICompatChatJSON({
        url: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: OPENROUTER_API_KEY,
        model: OPENROUTER_MODEL,
        temperature: 0.8,
        timeoutMs: 60_000,
        headers: extraHeaders,
        messages: [
          {
            role: "system",
            content: `${system}\nRESPONDE SOLO CON JSON VÁLIDO.`,
          },
          { role: "user", content: user },
        ],
      });
    };

    const callGemini = async () => {
      provider = "gemini";
      return geminiChatJSON({
        model: MODEL,
        temperature: 0.8,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
    };

    const rawJson = await (async () => {
      if (provider === "groq") {
        if (!GROQ_API_KEY) {
          console.warn("AI_PROVIDER=groq but GROQ_API_KEY is missing; falling back.");
          if (OPENROUTER_API_KEY) return callOpenRouter();
        } else {
          return callGroq();
        }
      }
      if (provider === "openrouter") {
        if (!OPENROUTER_API_KEY) {
          console.warn("AI_PROVIDER=openrouter but OPENROUTER_API_KEY is missing; falling back to Gemini.");
          if (GROQ_API_KEY) return callGroq();
        } else {
          return callOpenRouter();
        }
      }

      try {
        return await callGemini();
      } catch {
        if (!GROQ_API_KEY) {
          if (!OPENROUTER_API_KEY) throw new Error("No fallback provider configured");
          return await callOpenRouter();
        }
        try {
          return await callGroq();
        } catch (groqErr: any) {
          if (!OPENROUTER_API_KEY) throw groqErr;
          return await callOpenRouter();
        }
      }
    })();

    const generated = sanitizeGeneratedQuestions({
      raw: rawJson as CacesGenerateLLMResponse,
      fallbackCategory: filters?.category,
      fallbackComponent: filters?.component || filters?.category || "General",
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
      requested: count,
      generated: deduped.slice(0, count).length,
      educational_note: "Contenido de uso educativo; no corresponde a reactivos oficiales.",
    });
  } catch (e: any) {
    const status = Number(e?.status ?? NaN);
    if (status === 429) {
      return NextResponse.json(
        {
          code: "RATE_LIMIT",
          detail: "Límite alcanzado al generar preguntas CACES con IA. Intenta de nuevo en breve.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        code: "CACES_GENERATION_FAILED",
        detail: String(e?.message ?? "No se pudo generar preguntas con IA."),
      },
      { status: 500 }
    );
  }
}
