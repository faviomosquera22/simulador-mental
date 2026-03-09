import { NextResponse } from "next/server";
import type { CaseObject } from "../../../../src/lib/types";
import {
  enforceRateLimit,
  requireAuthenticatedUser,
} from "../../../../src/lib/serverGuards";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL_RAW = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
const OPENROUTER_MODEL = /gemini/i.test(OPENROUTER_MODEL_RAW)
  ? "meta-llama/llama-3.3-70b-instruct:free"
  : OPENROUTER_MODEL_RAW;
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL;
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME;

const FORCE_PROVIDER = String(process.env.AI_PROVIDER ?? "").toLowerCase().trim();
const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_EVALUATE = Number(process.env.AI_RATE_LIMIT_EVALUATE ?? 20);

type TranscriptTurn = { role: "user" | "patient" | "caregiver" | "tutor"; content: string };

type EvalOut = {
  summary: string;
  strengths: string[];
  improvements: string[];
  coverage: Record<string, number>;
  overall_score: number;
  next_steps: string[];
  red_flags: string[];
};

function safeArray(v: any) {
  return Array.isArray(v) ? v : [];
}

function toNumber(n: any, fallback = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return x;
}

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
    temperature = 0.3,
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
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) return auth.response;

    const limited = enforceRateLimit({
      key: `evaluate:${auth.data.userId}`,
      limit: Number.isFinite(RATE_LIMIT_EVALUATE) && RATE_LIMIT_EVALUATE > 0 ? RATE_LIMIT_EVALUATE : 20,
      windowMs: Number.isFinite(RATE_LIMIT_WINDOW_MS) && RATE_LIMIT_WINDOW_MS >= 1000 ? RATE_LIMIT_WINDOW_MS : 60_000,
    });
    if (!limited.ok) return limited.response;

    const body = await req.json();

    const caseObject: CaseObject | any = body?.caseObject;
    const transcript: TranscriptTurn[] = Array.isArray(body?.transcript) ? body.transcript : [];

    if (!caseObject || transcript.length === 0) {
      return NextResponse.json({ detail: "Falta caseObject o transcript." }, { status: 400 });
    }

    // recorta conversación para no explotar tokens
    const convo = transcript
      .slice(-40)
      .map(
        (t) =>
          `${t.role === "user" ? "ENTREVISTADOR" : t.role === "caregiver" ? "ACOMPAÑANTE" : t.role === "tutor" ? "TUTOR_IA" : "PACIENTE"}: ${String(t.content ?? "").slice(0, 600)}`
      )
      .join("\n");

    const patient = {
      name: caseObject?.patient_profile?.display_name ?? "Paciente",
      sex: caseObject?.patient_profile?.sex ?? caseObject?.patient_profile?.gender ?? "(no especificado)",
      age: caseObject?.patient_profile?.age ?? "(no especificado)",
    };

    const topic = String(caseObject?.meta?.topic ?? caseObject?.topic ?? "(no especificado)");
    const mode = String(caseObject?.meta?.mode ?? caseObject?.mode ?? "training");

    const system = `Eres un evaluador educativo de entrevistas clínicas en salud mental (NO diagnóstico).
Evalúas habilidades comunicacionales y estructura de entrevista.
Devuelve SIEMPRE solo JSON válido (sin markdown, sin texto extra) con este esquema:
{
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "coverage": { "Pregunta abierta": number, "Reflejo emocional": number, "Clarificación": number, "Resumen": number, "Plan/cierre": number, "Seguridad": number },
  "overall_score": number,
  "next_steps": string[],
  "red_flags": string[]
}
Reglas:
- Puntajes 0-100.
- "summary" máximo 70 palabras.
- "strengths" y "improvements": 3 a 6 bullets, concretos.
- "next_steps": 3 a 5 acciones, aplicables.
- "red_flags": solo si hubo contenido de riesgo o mala práctica (máx 3). Si no hay, [].
- No inventes datos fuera del caso/conversación.`;

    const user = JSON.stringify({ topic, mode, patient, conversation: convo }, null, 2);

    let provider: "groq" | "openrouter" = "groq";
    if (FORCE_PROVIDER === "openrouter") provider = "openrouter";
    else if (FORCE_PROVIDER === "groq") provider = "groq";
    else if (FORCE_PROVIDER === "gemini") {
      console.warn("AI_PROVIDER=gemini ignored: Gemini is temporarily disabled. Using Groq/OpenRouter.");
    }

    const callGroq = async () => {
      if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
      provider = "groq";
      return openAICompatChatJSON({
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: GROQ_API_KEY,
        model: GROQ_MODEL,
        temperature: 0.3,
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
        temperature: 0.3,
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

    const out = await (async () => {
      if (provider === "groq") {
        if (!GROQ_API_KEY) {
          console.warn("AI_PROVIDER=groq but GROQ_API_KEY is missing; falling back.");
          if (OPENROUTER_API_KEY) return callOpenRouter();
          throw new Error("No AI provider configured: missing GROQ_API_KEY and OPENROUTER_API_KEY.");
        }
        return callGroq();
      }

      if (!OPENROUTER_API_KEY) {
        console.warn("AI_PROVIDER=openrouter but OPENROUTER_API_KEY is missing; falling back to Groq.");
        if (GROQ_API_KEY) return callGroq();
        throw new Error("No AI provider configured: missing OPENROUTER_API_KEY and GROQ_API_KEY.");
      }
      return callOpenRouter();
    })().catch(async (e1: any) => {
      if (provider !== "groq" || !OPENROUTER_API_KEY) throw e1;
      const msg1 = String(e1?.message ?? "");
      const status1 = Number(e1?.status ?? e1?.statusCode ?? NaN);
      console.warn("Groq failed evaluating interview, trying OpenRouter fallback:", { status: status1, msg: msg1 });
      return callOpenRouter();
    });

    const raw = out ?? {};
    const normalized: EvalOut = {
      summary: String(raw.summary ?? "—"),
      strengths: safeArray(raw.strengths).map(String).slice(0, 8),
      improvements: safeArray(raw.improvements).map(String).slice(0, 8),
      coverage: typeof raw.coverage === "object" && raw.coverage ? raw.coverage : {},
      overall_score: Math.max(0, Math.min(100, toNumber(raw.overall_score, 0))),
      next_steps: safeArray(raw.next_steps).map(String).slice(0, 8),
      red_flags: safeArray(raw.red_flags).map(String).slice(0, 5),
    };

    return NextResponse.json(normalized);
  } catch (e: any) {
    const msg = String(e?.message ?? "Error en /api/ai/evaluate");
    const status = Number(e?.status ?? NaN);
    if (status === 429 || /\b429\b|too many requests|quota|rate limit/i.test(msg)) {
      return NextResponse.json(
        { detail: "Se alcanzó un límite del proveedor de IA. Intenta nuevamente en unos segundos." },
        { status: 429 }
      );
    }
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
