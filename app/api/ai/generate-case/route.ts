import { NextResponse } from "next/server";
import { geminiChatJSON } from "../../../../src/lib/gemini";

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

// === Output size controls (prevent huge cases that bloat prompts/UI) ===
const MAX_FACTS = Number(process.env.AI_CASE_MAX_FACTS ?? 26);
const MAX_FACT_CHARS = Number(process.env.AI_CASE_MAX_FACT_CHARS ?? 240);
const MAX_TEXT_CHARS = Number(process.env.AI_CASE_MAX_TEXT_CHARS ?? 1200);
const MAX_TIMELINE_EVENTS = Number(process.env.AI_CASE_MAX_TIMELINE_EVENTS ?? 6);
const MAX_CHIPS = Number(process.env.AI_CASE_MAX_CHIPS ?? 10);
const MAX_MSE_SECTIONS = Number(process.env.AI_CASE_MAX_MSE_SECTIONS ?? 8);
const MAX_MSE_CHIPS = Number(process.env.AI_CASE_MAX_MSE_CHIPS ?? 10);
const MAX_DSM_DIFFERENTIALS = Number(process.env.AI_CASE_MAX_DSM_DIFFS ?? 6);

function clampStr(s: any, maxChars: number) {
  const str = String(s ?? "").trim();
  if (str.length <= maxChars) return str;
  return str.slice(0, Math.max(0, maxChars - 12)) + "…(recortado)";
}

function uniqList(list: any[], max = 10) {
  const out: string[] = [];
  for (const v of Array.isArray(list) ? list : []) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    if (!out.includes(s)) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function normalizeCaseSize(caseJson: any) {
  const j: any = caseJson ?? {};

  // clamp big text fields
  j.chief_complaint = clampStr(j.chief_complaint, 360);
  j.brief_context = clampStr(j.brief_context, 520);
  j.learning_objective = clampStr(j.learning_objective, 380);
  if (typeof j.learning_objectives !== "undefined") {
    j.learning_objectives = uniqList(j.learning_objectives, 6).map((s) => clampStr(s, 220));
  }

  // patient profile
  if (j.patient_profile) {
    j.patient_profile.context = clampStr(j.patient_profile.context, 520);
    j.patient_profile.referral_source = clampStr(j.patient_profile.referral_source, 80);
    j.patient_profile.occupation = clampStr(j.patient_profile.occupation, 80);
    j.patient_profile.marital_status = clampStr(j.patient_profile.marital_status, 60);
  }

  // facts bank (atomic + capped)
  if (Array.isArray(j.facts_bank)) {
    const cleaned = j.facts_bank
      .map((x: any) => clampStr(x, MAX_FACT_CHARS))
      .filter((s: string) => s.length > 0);
    j.facts_bank = uniqList(cleaned, MAX_FACTS);
  }

  // chips & timeline
  if (Array.isArray(j.background_chips)) {
    j.background_chips = uniqList(j.background_chips, MAX_CHIPS).map((s) => clampStr(s, 44));
  }
  if (Array.isArray(j.timeline)) {
    j.timeline = j.timeline
      .slice(0, MAX_TIMELINE_EVENTS)
      .map((ev: any) => ({
        date_label: clampStr(ev?.date_label, 18),
        text: clampStr(ev?.text, 120),
        level: (ev?.level === "warning" || ev?.level === "neutral" || ev?.level === "normal") ? ev.level : "neutral",
      }));
  }

  // DSM section
  if (j.dsm) {
    if (j.dsm?.primary) {
      j.dsm.primary.label = clampStr(j.dsm.primary.label, 36);
      const crit = Array.isArray(j.dsm.primary.criteria) ? j.dsm.primary.criteria : [];
      j.dsm.primary.criteria = crit.slice(0, 12).map((c: any) => ({
        id: clampStr(c?.id, 10),
        text: clampStr(c?.text, 140),
        status: c?.status === "yes" || c?.status === "partial" || c?.status === "no" ? c.status : "partial",
      }));
    }
    if (Array.isArray(j.dsm?.differentials)) {
      j.dsm.differentials = uniqList(j.dsm.differentials, MAX_DSM_DIFFERENTIALS).map((s) => clampStr(s, 48));
    }
  }

  // Safety section
  if (j.safety) {
    j.safety.summary = clampStr(j.safety.summary, 240);
    if (Array.isArray(j.safety.risk_factors)) {
      j.safety.risk_factors = uniqList(j.safety.risk_factors, 6).map((s) => clampStr(s, 80));
    }
    if (Array.isArray(j.safety.protective_factors)) {
      j.safety.protective_factors = uniqList(j.safety.protective_factors, 6).map((s) => clampStr(s, 80));
    }
    if (Array.isArray(j.safety.cssrs_hint)) {
      j.safety.cssrs_hint = uniqList(j.safety.cssrs_hint, 6).map((s) => clampStr(s, 90));
    }
  }

  // MSE template (cap sections and chips)
  if (Array.isArray(j.mse_template)) {
    j.mse_template = j.mse_template.slice(0, MAX_MSE_SECTIONS).map((sec: any) => ({
      key: clampStr(sec?.key, 24),
      title: clampStr(sec?.title, 44),
      chips: uniqList(sec?.chips, MAX_MSE_CHIPS).map((s) => clampStr(s, 44)),
      default_selected: Array.isArray(sec?.default_selected)
        ? sec.default_selected.filter((n: any) => Number.isFinite(Number(n))).slice(0, 6)
        : [],
      note_prompt: clampStr(sec?.note_prompt, 140),
    }));
  }

  // reveal_plan / conversation_style / truth_reveal can get huge
  if (j.reveal_plan) j.reveal_plan = JSON.parse(clampStr(JSON.stringify(j.reveal_plan), MAX_TEXT_CHARS));
  if (j.conversation_style) j.conversation_style = JSON.parse(clampStr(JSON.stringify(j.conversation_style), MAX_TEXT_CHARS));
  if (j.truth_reveal) j.truth_reveal = JSON.parse(clampStr(JSON.stringify(j.truth_reveal), MAX_TEXT_CHARS));

  return j;
}

// (llmJSONWithFallback removed)

function ensureSuggestedQuestions(caseJson: any) {
  const sq = (caseJson?.suggested_questions ?? {}) as any;

  const defaults = {
    openers: [
      "¿Qué es lo que te trajo hoy aquí?",
      "¿Qué te gustaría trabajar en esta sesión?",
      "Cuéntame qué ha sido lo más difícil últimamente.",
      "¿Qué cambió recientemente que te hizo buscar ayuda?",
    ],
    symptoms: [
      "¿Qué síntomas has notado y cómo han cambiado últimamente?",
      "¿Qué pasa en tu cuerpo y en tu mente cuando te sientes así?",
      "¿Con qué frecuencia te ocurre y cuánto dura?",
      "¿Hay algo que lo empeore o lo alivie?",
    ],
    duration: [
      "¿Desde cuándo exactamente empezaste a sentirte así?",
      "¿Recuerdas cuándo fue la primera vez que te pasó?",
      "En una línea de tiempo, ¿qué cambió antes de que esto empezara?",
      "¿Ha sido continuo o viene por episodios?",
    ],
    function: [
      "¿Cómo han afectado estos síntomas tu trabajo o tu vida diaria?",
      "¿Qué cosas has dejado de hacer por sentirte así?",
      "¿Cómo está tu rendimiento en estudio/trabajo y tus relaciones?",
      "¿Qué áreas de tu vida se han visto más afectadas?",
    ],
    safety: [
      "¿Has pensado en hacerte daño o en que sería mejor no estar aquí?",
      "En los últimos días, ¿has tenido pensamientos de no querer vivir?",
      "¿Has pensado en lastimarte o en suicidarte?",
      "Si esos pensamientos aparecen, ¿qué tan intensos son y qué te detiene?",
    ],
  } as const;

  const toList = (value: any, fallback: string[]) => {
    const out = Array.isArray(value)
      ? value
          .map((x) => String(x ?? "").trim())
          .filter((s) => s.length > 0)
      : [];

    const merged = [...out, ...fallback].filter(Boolean);
    const uniq: string[] = [];
    for (const s of merged) {
      if (!uniq.includes(s)) uniq.push(s);
      if (uniq.length >= 4) break;
    }
    return uniq.slice(0, 4);
  };

  caseJson.suggested_questions = {
    openers: toList(sq.openers, defaults.openers as unknown as string[]),
    symptoms: toList(sq.symptoms, defaults.symptoms as unknown as string[]),
    duration: toList(sq.duration, defaults.duration as unknown as string[]),
    function: toList(sq.function, defaults.function as unknown as string[]),
    safety: toList(sq.safety, defaults.safety as unknown as string[]),
  };

  return caseJson;
}

// Gemini model (override with env). Examples: gemini-2.0-flash, gemini-2.0-pro
// (If GEMINI_MODEL is not set, we default to a currently supported model.)
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category = "ansiedad", difficulty = 2, target_minutes = 20 } = body ?? {};

    let provider: "gemini" | "groq" | "openrouter" = "gemini";

    // Allow forcing provider via env (useful for debugging / quota situations)
    if (FORCE_PROVIDER === "groq") provider = "groq";
    else if (FORCE_PROVIDER === "openrouter") provider = "openrouter";
    else if (FORCE_PROVIDER === "gemini") provider = "gemini";

    const system = `
Eres un "Case Generator" para un simulador educativo de ENTREVISTAS EN SALUD MENTAL.
Devuelve SOLO JSON válido (sin markdown, sin texto extra).

Reglas duras:
- Mantén todo COMPACTO: facts_bank máximo 26 hechos y cada hecho <= 240 caracteres.
- Evita texto redundante. Prefiere listas cortas y frases breves.
- No incluyas campos extra fuera del esquema.
- Caso 100% ficticio, sin datos personales reales.
- Enfocado SOLO en salud mental: depresión, ansiedad, psicosis/delirio, crisis de pánico, duelo, estrés, etc.
- NO diagnostiques ni sugieras tratamiento. Es entrenamiento de entrevista.
- Idioma: ESPAÑOL (LatAm). Usa nombres ficticios latinoamericanos.

El JSON debe incluir como mínimo:
meta { title, difficulty, category, target_minutes, dsm_tag, cie11_code (opcional), risk_level (bajo|moderado|alto) },
patient_profile {
  display_name,
  age,
  sex,
  occupation (string),
  marital_status (string),
  referral_source (string),
  context (string)
},
chief_complaint (string),
brief_context (string),
learning_objective (string),
learning_objectives (array),
areas (array: motivo, historia, sintomas, funcionamiento, antecedentes, riesgo, cierre),

// Base del guion
facts_bank (array de hechos atómicos),
reveal_plan (obj),
conversation_style (obj),
truth_reveal (obj),

// Para UI “Paciente” (panel derecho)
background_chips (array de strings cortos; ej: "Sin tx previo", "Episodio previo (2020)", "Red apoyo: limitada", "Sin sustancias"),
timeline (array de objetos { date_label, text, level (normal|neutral|warning) }),

// Para UI “DSM-5”
dsm {
  primary { label, confidence (0-100), criteria (array de { id, text, status (yes|partial|no) }) },
  differentials (array de strings)
},

// Para UI “Seguridad”
safety {
  risk_level (bajo|moderado|alto),
  summary (string breve),
  risk_factors (array),
  protective_factors (array),
  cssrs_hint (array de strings con ítems sugeridos)
},

// Para UI “MSE”
mse_template (array de secciones { key, title, chips (array), default_selected (array de índices), note_prompt }),

// Para “chips” del input y panel educativo
suggested_questions {
  openers (array),
  symptoms (array),
  duration (array),
  function (array),
  safety (array)
}

Además:
- En patient_profile.context NO uses temas médicos físicos (p.ej. dolor torácico, disnea). Mantén el contexto psicológico/funcional.
- chief_complaint, brief_context y learning_objective deben venir llenos (no guiones, no vacíos).
- dsm_tag debe ser una etiqueta corta y consistente (ej: "TDM", "TAG", "Pánico", "Psicosis", "Duelo", "TLP").
- timeline debe tener 4–6 eventos en orden (de pasado a hoy), con date_label tipo "2020", "Mar 2025", "Hoy".
- suggested_questions debe tener frases listas para copiar/pegar (preguntas en segunda persona).
- mse_template debe cubrir al menos: Apariencia/Conducta, Habla/Lenguaje, Ánimo/Afecto, Pensamiento, Percepción, Cognición, Insight/Juicio.
`;

    const user = `Genera un caso de salud mental. category="${category}" (si category no es de salud mental, usa "ansiedad" por defecto), difficulty=${difficulty}, target_minutes=${target_minutes}.`;

    const callGemini = async () =>
      geminiChatJSON({
        model: MODEL,
        temperature: 0.6,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

    const callGroq = async () => {
      if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
      provider = "groq";
      return await openAICompatChatJSON({
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: GROQ_API_KEY,
        model: GROQ_MODEL,
        temperature: 0.6,
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
        temperature: 0.6,
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


    const json = await (async () => {
      // 1) Forced provider paths
      if (provider === "groq") return await callGroq();
      if (provider === "openrouter") return await callOpenRouter();

      // 2) Gemini primary with fallbacks: Groq -> OpenRouter
      try {
        provider = "gemini";
        return await callGemini();
      } catch (e1: any) {
        const msg1 = String(e1?.message ?? "");
        const status1 = Number(e1?.status ?? e1?.statusCode ?? NaN);
        console.warn("Gemini failed generating case, trying Groq fallback:", { status: status1, msg: msg1 });

        try {
          return await callGroq();
        } catch (e2: any) {
          const msg2 = String(e2?.message ?? "");
          const status2 = Number(e2?.status ?? e2?.statusCode ?? NaN);
          console.warn("Groq failed generating case, trying OpenRouter fallback:", { status: status2, msg: msg2 });

          try {
            return await callOpenRouter();
          } catch (e3: any) {
            const msg3 = String(e3?.message ?? "");
            const status3 = Number(e3?.status ?? e3?.statusCode ?? NaN);
            console.warn("OpenRouter failed generating case:", { status: status3, msg: msg3 });
            throw e3;
          }
        }
      }
    })();

    const normalized = normalizeCaseSize(ensureSuggestedQuestions(json));
    return NextResponse.json(normalized);
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    const status = Number(e?.status ?? e?.response?.status ?? e?.cause?.status);

    const isJSONParse = /non-JSON output|Could not parse JSON|Unexpected token|JSON/i.test(msg);
    const rawModel = String((e as any)?.raw_model_output ?? "");
    const dev = process.env.NODE_ENV !== "production";

    const is429 =
      status === 429 ||
      /\b429\b/.test(msg) ||
      /too many requests/i.test(msg) ||
      /quota/i.test(msg) ||
      /rate limit/i.test(msg);

    if (is429) {
      return NextResponse.json(
        {
          code: "RATE_LIMIT",
          detail:
            "Se alcanzó un límite (429) al generar el caso. Se intentó fallback (Groq/OpenRouter) si están configurados. Si persiste, espera y reintenta o fuerza AI_PROVIDER=groq/openrouter.",
          retry_after_ms: 120000,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        code: "GENERATE_CASE_FAILED",
        detail: isJSONParse
          ? "El modelo devolvió texto que NO es JSON válido al generar el caso (Qwen a veces agrega texto extra). Intenta de nuevo o reduce la complejidad."
          : "No se pudo generar el caso. Intenta nuevamente.",
        provider_hint: FORCE_PROVIDER || "auto",
        ...(dev && rawModel ? { raw_model_output: rawModel.slice(0, 2000) } : {}),
      },
      { status: 500 }
    );
  }
}