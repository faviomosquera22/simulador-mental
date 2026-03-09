import { NextResponse } from "next/server";
import type {
  ActiveInstrumentContext,
  CaseObject,
  EmotionState,
  InterviewMode,
  PatientTurnOutput,
  SpeakerRole,
} from "../../../../src/lib/types";
import { geminiChatJSON } from "../../../../src/lib/gemini";
import { detectSelfHarm } from "../../../../src/lib/guardrails";
import {
  enforceRateLimit,
  requireAuthenticatedUser,
} from "../../../../src/lib/serverGuards";
import { deriveAgeGroup, isPediatricCase, normalizeSpeakerRole } from "../../../../src/lib/clinicalRuntime";

// === AI Providers (Gemini primary + Groq/OpenRouter fallbacks) ===
// Groq (OpenAI-compatible)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// OpenRouter (OpenAI-compatible)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL; // optional
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME; // optional

// Optional: force provider (useful for debugging / quota situations)
// AI_PROVIDER=gemini | groq | openrouter
const FORCE_PROVIDER = String(process.env.AI_PROVIDER ?? "").toLowerCase().trim();
const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_PATIENT_TURN = Number(process.env.AI_RATE_LIMIT_PATIENT_TURN ?? 60);


// === Prompt size controls (prevent saturation) ===
const MAX_TRANSCRIPT_TURNS = Number(process.env.AI_MAX_TRANSCRIPT_TURNS ?? 12);
const MAX_SUMMARY_CHARS = Number(process.env.AI_MAX_SUMMARY_CHARS ?? 1800);
const MAX_FACTS = Number(process.env.AI_MAX_FACTS ?? 18);
const MAX_FACTS_FOCUS = Number(process.env.AI_MAX_FACTS_FOCUS ?? 8);
const MAX_FACTS_CORE = Number(process.env.AI_MAX_FACTS_CORE ?? 4);
const MIN_KEYWORD_LEN = Number(process.env.AI_MIN_KEYWORD_LEN ?? 4);
// === Mini-retrieval: pick only relevant facts from facts_bank to avoid bloating prompts ===
const ES_STOPWORDS = new Set(
  [
    "de","la","que","el","en","y","a","los","del","se","las","por","un","para","con","no","una","su","al","lo",
    "como","más","pero","sus","le","ya","o","este","sí","porque","esta","entre","cuando","muy","sin","sobre","también",
    "me","hasta","hay","donde","quien","desde","todo","nos","durante","todos","uno","les","ni","contra","otros","ese",
    "eso","ante","ellos","e","esto","mí","antes","algunos","qué","unos","yo","otro","otras","otra","él","tanto","esa",
    "estos","mucho","quienes","nada","muchos","cual","poco","ella","estar","estas","algunas","algo","nosotros","mi","mis",
    "tú","te","tu","tus","usted","ustedes","su","sus","es","son","fue","eran","ser","soy","eres","estoy","está","están",
    "hacer","hace","hacen","hizo","he","han","haber","tener","tengo","tiene","tienen","tenía","ir","va","voy","vamos",
    "muy","mas","aquí","ahí","allí","ayer","hoy","mañana","pues","entonces","solo","sólo","quizá","quizás","tal","tan",
    "cada","casi","si","sí","ok","vale","bien","hola","gracias","porfavor","porfavor",
  ].map((s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, ""))
);

function normalizeToken(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s_-]/g, " ")
    .trim();
}

function extractKeywords(text: string, max = 14) {
  const norm = normalizeToken(text);
  const parts = norm.split(/\s+/g).filter(Boolean);
  const freq = new Map<string, number>();
  for (const p of parts) {
    if (p.length < MIN_KEYWORD_LEN) continue;
    if (ES_STOPWORDS.has(p)) continue;
    // drop very generic clinical fillers
    if (p === "paciente" || p === "persona" || p === "sintomas" || p === "sintoma" || p === "problema") continue;
    freq.set(p, (freq.get(p) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, max);
}

function getFactsArray(caseObject: any): string[] {
  const fb = (caseObject as any)?.facts_bank;
  if (Array.isArray(fb)) return fb.map((x: any) => String(x ?? "")).filter(Boolean);
  if (typeof fb === "string") {
    return fb
      .split(/\r?\n|\u2022|\u2023|\-/g)
      .map((x) => String(x ?? "").trim())
      .filter((x) => x.length > 0);
  }
  return [];
}

function scoreFact(fact: string, keywords: string[]) {
  const f = normalizeToken(fact);
  let score = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    if (f.includes(kw)) score += 3;
    // minor boost for partials
    else if (kw.length >= 6 && f.includes(kw.slice(0, Math.max(4, Math.floor(kw.length * 0.7))))) score += 1;
  }
  // boost for safety terms
  if (/(suicid|autoles|matar|morir|cort|dañ|violenc|abuso|arma|plan)/.test(f)) score += 2;
  return score;
}

function pickRelevantFacts(caseObject: any, queryText: string) {
  const facts = getFactsArray(caseObject);
  if (!facts.length) return { focused: undefined as any, core: undefined as any };

  const keywords = extractKeywords(queryText);
  // CORE = first N facts as stable anchor (already curated by generator)
  const core = facts.slice(0, Math.min(MAX_FACTS_CORE, facts.length)).map((s) => clampStr(s, 240));

  if (!keywords.length) {
    const focused = facts.slice(0, Math.min(MAX_FACTS_FOCUS, facts.length)).map((s) => clampStr(s, 240));
    return { focused, core, keywords };
  }

  const scored = facts
    .map((f) => ({ f, s: scoreFact(f, keywords) }))
    .sort((a, b) => b.s - a.s);

  // Keep only facts with some relevance; if none, fall back to first N
  const keep = scored.filter((x) => x.s > 0).slice(0, MAX_FACTS_FOCUS).map((x) => clampStr(x.f, 240));
  const focused = keep.length ? keep : facts.slice(0, Math.min(MAX_FACTS_FOCUS, facts.length)).map((s) => clampStr(s, 240));

  return { focused, core, keywords };
}

function clampStr(s: string, maxChars: number) {
  const str = String(s ?? "");
  if (str.length <= maxChars) return str;
  return str.slice(0, Math.max(0, maxChars - 12)) + "…(recortado)";
}

function trimTranscript(
  transcript: Array<{ role: "user" | "patient" | "caregiver" | "tutor"; content: string }>,
  maxTurns = MAX_TRANSCRIPT_TURNS
) {
  if (!Array.isArray(transcript)) return [];
  if (transcript.length <= maxTurns) return transcript;
  return transcript.slice(Math.max(0, transcript.length - maxTurns));
}

function pickFacts(caseObject: any) {
  const fb = (caseObject as any)?.facts_bank;
  if (Array.isArray(fb)) return fb.slice(0, MAX_FACTS);
  if (typeof fb === "string") return clampStr(fb, 1200);
  return undefined;
}

function buildCaseSnapshot(caseObject: any) {
  // Keep this small: only the essentials + a capped facts bank.
  const meta = (caseObject as any)?.meta ?? {};
  const patient = (caseObject as any)?.patient ?? (caseObject as any)?.persona ?? {};
  const presentation = (caseObject as any)?.presentation ?? (caseObject as any)?.complaint ?? {};
  const companion = (caseObject as any)?.companion_profile ?? {};

  return {
    id: (caseObject as any)?.id,
    title: (caseObject as any)?.title,
    approach: meta?.approach ?? (caseObject as any)?.approach,
    demographics: {
      age: patient?.age ?? meta?.age,
      sex: patient?.sex ?? meta?.sex,
      occupation: patient?.occupation ?? meta?.occupation,
    },
    chief_complaint:
      presentation?.chief_complaint ??
      presentation?.chiefComplaint ??
      (caseObject as any)?.chief_complaint ??
      (caseObject as any)?.chiefComplaint,
    context:
      presentation?.context ??
      presentation?.context_summary ??
      (caseObject as any)?.context ??
      (caseObject as any)?.context_summary,
    mse_seed:
      (caseObject as any)?.mse_seed ??
      (caseObject as any)?.mental_status_seed ??
      (caseObject as any)?.exam_seed,
    risks_seed:
      (caseObject as any)?.risks_seed ??
      (caseObject as any)?.risk_seed ??
      meta?.risks,
    age_group:
      meta?.age_group ??
      (caseObject as any)?.age_group ??
      deriveAgeGroup(caseObject),
    pediatric_mode:
      Boolean(meta?.pediatric_mode ?? (caseObject as any)?.pediatric_mode) ||
      isPediatricCase(caseObject),
    companion_available: Boolean(
      meta?.companion_available ??
      (caseObject as any)?.companion_available ??
      companion?.display_name
    ),
    companion_profile:
      companion && typeof companion === "object"
        ? {
            display_name: clampStr(companion?.display_name ?? "Acompañante", 64),
            relation: clampStr(companion?.relation ?? meta?.companion_role ?? "cuidador", 24),
            cooperativeness: clampStr(companion?.cooperativeness ?? "medium", 12),
            reliability: clampStr(companion?.reliability ?? "medium", 12),
            narrative_style: clampStr(companion?.narrative_style ?? "detailed", 14),
          }
        : undefined,
    facts_bank: pickFacts(caseObject),
    facts_focus: undefined,
    facts_core: undefined,
    retrieval_keywords: undefined,
  };
}

function updateRollingSummary(opts: {
  prev?: string;
  lastTurns: Array<{ role: "user" | "patient" | "caregiver" | "tutor"; content: string }>;
  userMessage: string;
  patientMessage?: string;
}) {
  // Simple, deterministic rolling summary to reduce prompt growth.
  // We append only compact bullets from the latest interaction and then clamp.
  const prev = String(opts.prev ?? "").trim();
  const latestTurns = opts.lastTurns
    .slice(-6)
    .map((t) => {
      const label =
        t.role === "user"
          ? "Estudiante"
          : t.role === "caregiver"
          ? "Acompañante"
          : t.role === "tutor"
          ? "Tutor IA"
          : "Paciente";
      return `- ${label}: ${clampStr(t.content, 220)}`;
    })
    .join("\n");

  const add = [
    latestTurns ? `\n\nÚltimos turnos relevantes:\n${latestTurns}` : "",
    opts.userMessage ? `\n\nMensaje actual del estudiante:\n- ${clampStr(opts.userMessage, 280)}` : "",
    opts.patientMessage ? `\n\nRespuesta del paciente:\n- ${clampStr(opts.patientMessage, 280)}` : "",
  ].join("");

  const merged = (prev ? prev + "\n\n---" : "") + add.trim();
  return clampStr(merged.trim(), MAX_SUMMARY_CHARS);
}

function extractJSON(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract the first JSON object block
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.slice(start, end + 1);
      return JSON.parse(candidate);
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
    try {
      return extractJSON(content);
    } catch {
      const e: any = new Error("OpenAI-compatible provider returned non-JSON output");
      e.raw_model_output = content;
      throw e;
    }
  } catch (err: any) {
    const name = String(err?.name ?? "");
    const msg = String(err?.message ?? "");
    if (name === "AbortError" || /aborted/i.test(msg)) {
      const e = new Error("provider_timeout");
      (e as any).name = "AbortError";
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}


const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) return auth.response;

    const limited = enforceRateLimit({
      key: `patient-turn:${auth.data.userId}`,
      limit: Number.isFinite(RATE_LIMIT_PATIENT_TURN) && RATE_LIMIT_PATIENT_TURN > 0 ? RATE_LIMIT_PATIENT_TURN : 60,
      windowMs: Number.isFinite(RATE_LIMIT_WINDOW_MS) && RATE_LIMIT_WINDOW_MS >= 1000 ? RATE_LIMIT_WINDOW_MS : 60_000,
    });
    if (!limited.ok) return limited.response;

    const body = await req.json();
    const { caseObject, transcript, userMessage, tutorEnabled = true, rollingSummary, interviewMode, instrumentContext, targetSpeaker } = body as {
      caseObject: CaseObject;
      transcript: Array<{ role: "user" | "patient" | "caregiver" | "tutor"; content: string }>;
      userMessage: string;
      tutorEnabled?: boolean;
      rollingSummary?: string;
      interviewMode?: InterviewMode;
      instrumentContext?: ActiveInstrumentContext | null;
      targetSpeaker?: SpeakerRole;
    };

    const tutorOn = Boolean(tutorEnabled);
    const mode: InterviewMode =
      interviewMode === "scale" || interviewMode === "test" || interviewMode === "quiz"
        ? interviewMode
        : "free";

    const selfHarm = detectSelfHarm(userMessage);

    const approach = String((caseObject as any)?.meta?.approach ?? (caseObject as any)?.approach ?? "humanistic").toLowerCase();
    const caseDomain: "medical" | "mental" =
      String((caseObject as any)?.meta?.domain ?? "").toLowerCase() === "medical" ? "medical" : "mental";
    const pediatricMode = isPediatricCase(caseObject);
    const requestedSpeaker = normalizeSpeakerRole(targetSpeaker);
    const activeSpeaker: SpeakerRole = pediatricMode ? requestedSpeaker : "patient";

    function approachLabel(a: string) {
      if (a === "cbt") return "Cognitivo-conductual (TCC)";
      if (a === "psychodynamic") return "Psicodinámico";
      if (a === "systemic") return "Sistémico / familiar";
      return "Humanístico";
    }

    function approachTutorStyle(a: string) {
      if (caseDomain === "medical") {
        return "Enfoque clínico médico/enfermería: guía al estudiante a precisar síntomas, cronología, signos de alarma, impacto funcional, antecedentes y seguridad.";
      }
      // Estilo educativo: cómo orientar preguntas y feedback (no terapia real)
      switch (a) {
        case "cbt":
          return "Enfoque TCC: guía al estudiante a explorar pensamientos automáticos, emociones, conductas, evitación/activación, y a usar preguntas concretas (A-B-C).";
        case "psychodynamic":
          return "Enfoque psicodinámico: guía al estudiante a explorar patrones repetidos, relaciones significativas, significados, conflictos y defensas, con curiosidad y sin interpretar en exceso.";
        case "systemic":
          return "Enfoque sistémico: guía al estudiante a explorar contexto, red de apoyo, dinámica familiar, roles, comunicación, estresores y recursos.";
        default:
          return "Enfoque humanístico: guía al estudiante a priorizar empatía, validación, reflejos, escucha activa y preguntas abiertas centradas en la experiencia.";
      }
    }

    const system = `
Eres el "Patient Actor" de un simulador educativo.
Dominio del caso: ${caseDomain === "medical" ? "medicina/enfermería" : "salud mental"}.
Enfoque seleccionado (educativo): ${approachLabel(approach)}.
${approachTutorStyle(approach)}
Tu fuente de verdad es el caseSnapshot (facts_core + facts_focus + facts_bank). No inventes hechos fuera de esos facts.
Revelación gradual: máximo 2 hechos nuevos por turno. Si no hay suficiente información, pide 1 pregunta aclaratoria.
Nunca diagnostiques. Nunca des instrucciones de daño.
Devuelve SIEMPRE SOLO JSON válido con tipo PatientTurnOutput:
{ message_text, speaker_role, emotion_state, emotion_intensity, optional arousal, rapport, flags, optional instrument_answer }.

Modo de interacción actual: ${mode}.
Caso pediátrico: ${pediatricMode ? "sí" : "no"}.
Fuente solicitada: ${activeSpeaker}.

Reglas pediátricas:
- Si speaker_role="caregiver", responde como acompañante (madre/padre/tutor/cuidador), aportando historia de desarrollo, conducta en casa/escuela, sueño, alimentación y antecedentes.
- Si speaker_role="patient" y es niño, usa lenguaje simple y respuestas breves.
- Si speaker_role="patient" y es adolescente, permite respuestas más elaboradas con resistencia variable.
- Si source="both", elige UNA voz predominante para este turno e indica speaker_role correctamente.

${caseDomain === "medical"
  ? `Reglas de caso médico:
- Prioriza descripción clínica concreta (síntomas, tiempo de evolución, severidad, factores agravantes/aliviantes).
- Mantén coherencia con signos de alarma y nivel de urgencia del caso.
- Puedes referir antecedentes médicos, medicación y barreras de adherencia si existen en facts.`
  : `Reglas de salud mental:
- Prioriza experiencia subjetiva, impacto funcional, factores precipitantes y protectores.
- Mantén tono clínico-educativo, sin confirmar diagnósticos.`}

Reglas para escalas/tests:
- Si mode es "scale" o "test", NO hagas entrevista libre extensa: responde específicamente al ítem del instrumento.
- El campo instrument_answer es obligatorio en mode "scale"/"test" y debe incluir:
  { item_id, option_id, option_index, option_label, option_value, confidence, rationale }.
- option_index es 0-based y debe corresponder a la lista de opciones provista en instrument_context.
- message_text debe seguir siendo natural y coherente con la opción elegida.

${tutorOn ? `Además, si detectas un punto clínico educativo importante (p. ej. falta explorar seguridad, impacto funcional, o diferenciales), incluye opcionalmente:
{ tutor_message, tutor_kind }
- tutor_kind ∈ "tip" | "alert"` : `No incluyas tutor_message ni tutor_kind.`}
flags: lista corta de strings tipo "risk:passive_ideation", "mse:sleep", "mse:appetite", "function:work", etc. (máx 8 flags)
emotion_state ∈ neutral, calm, anxious, sad, irritable, confused, fearful, hopeful
emotion_intensity 0-100
`;

    const trimmedTranscript = trimTranscript(transcript);
    const caseSnapshot = buildCaseSnapshot(caseObject);
    const summaryIn = typeof rollingSummary === "string" ? rollingSummary : "";

    // Build a compact query from user message + last turns + rolling summary
    const lastTurnsText = trimmedTranscript
      .slice(-8)
      .map((t) => `${t.role}: ${t.content}`)
      .join("\n");
    const queryText = `${summaryIn}\n${lastTurnsText}\n${userMessage}`;

    // Mini-RAG: select only the most relevant facts for this turn
    const picked = pickRelevantFacts(caseObject, queryText);
    (caseSnapshot as any).facts_focus = picked.focused;
    (caseSnapshot as any).facts_core = picked.core;
    (caseSnapshot as any).retrieval_keywords = picked.keywords;

    const user = JSON.stringify({
      // IMPORTANT: we send a compact snapshot instead of the full CaseObject to prevent prompt saturation.
      caseSnapshot,
      domain: caseDomain,
      approach: approachLabel(approach),
      mode,
      targetSpeaker: activeSpeaker,
      rollingSummary: clampStr(summaryIn, MAX_SUMMARY_CHARS),
      transcript: trimmedTranscript,
      userMessage,
      instrumentContext:
        mode === "scale" || mode === "test"
          ? {
              instrument_id: instrumentContext?.instrument_id,
              instrument_name: instrumentContext?.instrument_name,
              item_index: instrumentContext?.item_index,
              total_items: instrumentContext?.total_items,
              item_id: instrumentContext?.item_id,
              item_prompt: instrumentContext?.item_prompt,
              response_type: instrumentContext?.response_type,
              options: instrumentContext?.options,
            }
          : undefined,
      safety: { selfHarm },
      instruction: selfHarm
        ? "Responde con contención educativa y recomendación genérica de buscar ayuda profesional/servicios locales, sin consejos personalizados."
        : mode === "scale" || mode === "test"
          ? "Responde al ítem del instrumento con coherencia clínica y devuelve instrument_answer válido."
          : "Responde como paciente consistente con el caso y con revelación gradual.",
    });

    let provider: "gemini" | "groq" | "openrouter" = "gemini";

    // Allow forcing provider via env (useful for debugging / quota situations)
    if (FORCE_PROVIDER === "groq") provider = "groq";
    else if (FORCE_PROVIDER === "openrouter") provider = "openrouter";
    else if (FORCE_PROVIDER === "gemini") provider = "gemini";

    const out = (await (async () => {
      // Helper to call Groq
      const callGroq = async () => {
        if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
        provider = "groq";
        return await openAICompatChatJSON({
          url: "https://api.groq.com/openai/v1/chat/completions",
          apiKey: GROQ_API_KEY,
          model: GROQ_MODEL,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: system + "\n\nRESPONDE SOLO CON JSON VÁLIDO. NO incluyas ningún texto fuera del JSON.",
            },
            { role: "user", content: user },
          ],
          timeoutMs: 45_000,
        });
      };

      // Helper to call OpenRouter
      const callOpenRouter = async () => {
        if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");
        provider = "openrouter";
        const extraHeaders: Record<string, string> = {};
        if (OPENROUTER_SITE_URL) extraHeaders["HTTP-Referer"] = OPENROUTER_SITE_URL;
        if (OPENROUTER_APP_NAME) extraHeaders["X-Title"] = OPENROUTER_APP_NAME;

        return await openAICompatChatJSON({
          url: "https://openrouter.ai/api/v1/chat/completions",
          apiKey: OPENROUTER_API_KEY,
          model: OPENROUTER_MODEL,
          temperature: 0.7,
          headers: extraHeaders,
          messages: [
            {
              role: "system",
              content: system + "\n\nRESPONDE SOLO CON JSON VÁLIDO. NO incluyas ningún texto fuera del JSON.",
            },
            { role: "user", content: user },
          ],
          timeoutMs: 60_000,
        });
      };

      // 1) Forced provider paths
      if (provider === "groq") {
        if (!GROQ_API_KEY) {
          console.warn("AI_PROVIDER=groq but GROQ_API_KEY is missing; falling back.");
          if (OPENROUTER_API_KEY) return await callOpenRouter();
        } else {
          return await callGroq();
        }
      }
      if (provider === "openrouter") {
        if (!OPENROUTER_API_KEY) {
          console.warn("AI_PROVIDER=openrouter but OPENROUTER_API_KEY is missing; falling back to Gemini.");
          if (GROQ_API_KEY) return await callGroq();
        } else {
          return await callOpenRouter();
        }
      }

      // 2) Gemini primary with fallbacks: Groq -> OpenRouter
      try {
        provider = "gemini";
        return await geminiChatJSON({
          model: MODEL,
          temperature: 0.7,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
      } catch (e1: any) {
        const msg1 = String(e1?.message ?? "");
        const status1 = Number(e1?.status ?? e1?.statusCode ?? NaN);
        console.warn("Gemini failed, trying Groq fallback:", { status: status1, msg: msg1 });

        if (!GROQ_API_KEY) {
          if (!OPENROUTER_API_KEY) throw e1;
          return await callOpenRouter();
        }

        try {
          return await callGroq();
        } catch (e2: any) {
          const msg2 = String(e2?.message ?? "");
          const status2 = Number(e2?.status ?? e2?.statusCode ?? NaN);
          if (!OPENROUTER_API_KEY) {
            console.warn("Groq failed and OpenRouter is not configured:", { status: status2, msg: msg2 });
            throw e2;
          }
          console.warn("Groq failed, trying OpenRouter fallback:", { status: status2, msg: msg2 });

          try {
            return await callOpenRouter();
          } catch (e3: any) {
            const msg3 = String(e3?.message ?? "");
            const status3 = Number(e3?.status ?? e3?.statusCode ?? NaN);
            console.warn("OpenRouter failed:", { status: status3, msg: msg3 });
            throw e3;
          }
        }
      }
    })()) as PatientTurnOutput;

    // Attach provider for debugging/telemetry
    (out as any).provider = provider;

    // Emit an updated rolling summary so the client can store it and resend it next turn.
    // We keep it deterministic and short to avoid growing prompts.
    (out as any).rolling_summary = updateRollingSummary({
      prev: summaryIn,
      lastTurns: trimmedTranscript,
      userMessage,
      patientMessage: (out as any)?.message_text,
    });
    (out as any).interaction_mode = mode;

    if (!tutorOn || mode === "scale" || mode === "test") {
      delete (out as any).tutor_message;
      delete (out as any).tutor_kind;
    }

    // Normaliza fuente de respuesta (paciente/acompañante)
    const modelSpeaker = normalizeSpeakerRole((out as any)?.speaker_role);
    if (pediatricMode) {
      if (activeSpeaker === "caregiver") (out as any).speaker_role = "caregiver";
      else if (activeSpeaker === "patient") (out as any).speaker_role = "patient";
      else (out as any).speaker_role = modelSpeaker === "caregiver" ? "caregiver" : "patient";
    } else {
      (out as any).speaker_role = "patient";
    }

    // Ensure flags is always an array
    (out as any).flags = Array.isArray((out as any).flags) ? (out as any).flags : [];

    if (mode === "scale" || mode === "test") {
      const payload = (out as any)?.instrument_answer;
      const options = Array.isArray(instrumentContext?.options) ? instrumentContext.options : [];
      const fallbackOption = options[0];
      const fallback = {
        item_id: instrumentContext?.item_id,
        option_id: fallbackOption?.id,
        option_index: 0,
        option_label: fallbackOption?.label,
        option_value: fallbackOption?.value,
        confidence: 0.4,
        rationale: "Fallback técnico: opción por defecto.",
      };

      if (!payload || typeof payload !== "object") {
        (out as any).instrument_answer = fallback;
      } else {
        const idx = Number(payload?.option_index);
        const safeIdx = Number.isFinite(idx) && idx >= 0 && idx < options.length ? idx : 0;
        const optionByIndex = options[safeIdx] ?? fallbackOption;
        (out as any).instrument_answer = {
          item_id: String(payload?.item_id ?? instrumentContext?.item_id ?? ""),
          option_id: String(payload?.option_id ?? optionByIndex?.id ?? ""),
          option_index: safeIdx,
          option_label: String(payload?.option_label ?? optionByIndex?.label ?? ""),
          option_value: Number.isFinite(Number(payload?.option_value))
            ? Number(payload.option_value)
            : Number(optionByIndex?.value ?? 0),
          confidence: Math.max(0, Math.min(1, Number(payload?.confidence ?? 0.6))),
          rationale: clampStr(String(payload?.rationale ?? "Respuesta consistente con el caso."), 180),
        };
      }
    } else {
      delete (out as any).instrument_answer;
    }

    // Self-harm risk: strengthen flags and tutor message
    if (selfHarm) {
      const flags = (out as any).flags as string[];
      if (!flags.some((f) => String(f).toLowerCase().startsWith("risk:"))) {
        flags.push("risk:self_harm");
      }
      // Encourage the tutor message to be an alert if none exists (only if tutor is enabled)
      if (tutorOn && !(out as any).tutor_message) {
        (out as any).tutor_kind = "alert";
        (out as any).tutor_message =
          `⚠ Contenido sensible detectado. (${approachLabel(approach)}) Responde con contención educativa y sugiere buscar ayuda profesional/servicios locales. Evita instrucciones o consejos personalizados.`;
      }
    }

    const validStates: EmotionState[] = [
      "neutral",
      "calm",
      "anxious",
      "sad",
      "irritable",
      "confused",
      "fearful",
      "hopeful",
    ];
    // Optional Tutor IA guidance (non-diagnostic, educational)
    const flags = (out as any).flags as string[];
    const hasTutor = typeof (out as any).tutor_message === "string" && String((out as any).tutor_message).trim().length > 0;

    if (tutorOn && mode === "free" && !hasTutor) {
      const riskFlags = flags.filter((f) => f.toLowerCase().startsWith("risk:"));
      const missingSafety = riskFlags.length > 0;
      const missingFunction = flags.some((f) => f.toLowerCase().includes("function")) === false;
      const missingSleep = flags.some((f) => f.toLowerCase().includes("sleep")) === false;
      const missingAppetite = flags.some((f) => f.toLowerCase().includes("appetite")) === false;

      if (missingSafety) {
        (out as any).tutor_kind = "alert";
        (out as any).tutor_message =
          `⚠ Señales de seguridad detectadas. (${approachLabel(approach)}) Prioriza un tamizaje breve: ideación, plan, intención, acceso a medios y factores protectores. Mantén tono empático y educativo.`;
      } else if (missingFunction) {
        (out as any).tutor_kind = "tip";
        (out as any).tutor_message =
          approach === "systemic"
            ? "Tip (Sistémico): explora impacto funcional en el sistema (familia/pareja/trabajo), roles, apoyos y estresores actuales."
            : approach === "psychodynamic"
            ? "Tip (Psicodinámico): explora impacto funcional y patrones repetidos (relaciones, conflictos, defensas) antes de cerrar."
            : approach === "cbt"
            ? "Tip (TCC): explora impacto funcional con ejemplos y conecta pensamiento-emoción-conducta (evitación/activación) para orientar el plan."
            : "Tip (Humanístico): explora impacto funcional (trabajo/estudio, autocuidado, relaciones) con ejemplos concretos y validación.";
      } else if (missingSleep || missingAppetite) {
        (out as any).tutor_kind = "tip";
        (out as any).tutor_message =
          approach === "cbt"
            ? "Tip (TCC): completa síntomas vegetativos y mide su efecto en conducta (energía, activación, evitación). Pregunta por sueño, apetito/peso y concentración."
            : approach === "psychodynamic"
            ? "Tip (Psicodinámico): completa síntomas vegetativos (sueño/apetito/energía) y observa cómo se relacionan con afecto y funcionamiento."
            : approach === "systemic"
            ? "Tip (Sistémico): completa síntomas vegetativos y explora cómo el contexto familiar/estresores los modulan (sueño, apetito/peso, energía)."
            : "Tip (Humanístico): completa síntomas vegetativos. Pregunta por sueño, apetito/peso, energía y concentración para afinar el cuadro (sin diagnosticar).";
      }
    }

    if (!validStates.includes(out.emotion_state)) out.emotion_state = "neutral";
    out.emotion_intensity = Math.max(
      0,
      Math.min(100, Number(out.emotion_intensity ?? 40))
    );

    return NextResponse.json(out);
  } catch (e: any) {
    const name = String(e?.name ?? "");
    const msg = String(e?.message ?? "unknown");
    const aborted = name === "AbortError" || /aborted/i.test(msg);

    if (aborted) {
      return NextResponse.json(
        { error: "timeout", detail: "El modelo tardó demasiado y la solicitud se canceló (120s)." },
        { status: 504 }
      );
    }

    const isQuota = /429|quota|rate|Too Many Requests/i.test(msg);
    const isJSONParse = /non-JSON output|Could not parse JSON|Unexpected token|JSON/i.test(msg);
    const rawModel = String((e as any)?.raw_model_output ?? "");
    const dev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      {
        error: "patient_turn_failed",
        detail: isQuota
          ? "El proveedor principal está limitado por cuota (429). Se intentó fallback (Groq/OpenRouter) si están configurados. Detalle: " + msg
          : isJSONParse
            ? "El modelo devolvió texto que NO es JSON válido (Qwen a veces agrega texto extra). Detalle: " + msg
            : msg,
        provider_hint: FORCE_PROVIDER || "auto",
        ...(dev && rawModel ? { raw_model_output: rawModel.slice(0, 2000) } : {}),
      },
      { status: 500 }
    );
  }
}
