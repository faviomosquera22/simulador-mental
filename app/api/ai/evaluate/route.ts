import { NextResponse } from "next/server";
import type { CaseObject } from "../../../../src/lib/types";
import {
  enforceRateLimit,
  requireAuthenticatedUser,
} from "../../../../src/lib/serverGuards";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const CEREBRAS_BASE_URL = process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1";
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || "llama-3.3-70b";

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || "qwen-plus";

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

function buildChatCompletionsUrl(baseUrl: string) {
  const clean = String(baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!clean) return "/chat/completions";
  if (/\/chat\/completions$/i.test(clean)) return clean;
  return `${clean}/chat/completions`;
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

    let provider: "cerebras" | "alibaba" = "cerebras";
    if (FORCE_PROVIDER === "alibaba") provider = "alibaba";
    else if (FORCE_PROVIDER === "cerebras") provider = "cerebras";
    else if (
      FORCE_PROVIDER === "gemini" ||
      FORCE_PROVIDER === "groq" ||
      FORCE_PROVIDER === "openrouter"
    ) {
      console.warn("AI_PROVIDER old value ignored. Active providers are Cerebras/Alibaba Cloud.");
    }

    const callCerebras = async () => {
      if (!CEREBRAS_API_KEY) throw new Error("CEREBRAS_API_KEY not set");
      provider = "cerebras";
      return openAICompatChatJSON({
        url: buildChatCompletionsUrl(CEREBRAS_BASE_URL),
        apiKey: CEREBRAS_API_KEY,
        model: CEREBRAS_MODEL,
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

    const callAlibaba = async () => {
      if (!DASHSCOPE_API_KEY) throw new Error("DASHSCOPE_API_KEY not set");
      provider = "alibaba";
      return openAICompatChatJSON({
        url: buildChatCompletionsUrl(DASHSCOPE_BASE_URL),
        apiKey: DASHSCOPE_API_KEY,
        model: DASHSCOPE_MODEL,
        temperature: 0.3,
        timeoutMs: 60_000,
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
      if (provider === "cerebras") {
        if (!CEREBRAS_API_KEY) {
          console.warn("AI_PROVIDER=cerebras but CEREBRAS_API_KEY is missing; falling back.");
          if (DASHSCOPE_API_KEY) return callAlibaba();
          throw new Error("No AI provider configured: missing CEREBRAS_API_KEY and DASHSCOPE_API_KEY.");
        }
        return callCerebras();
      }

      if (!DASHSCOPE_API_KEY) {
        console.warn("AI_PROVIDER=alibaba but DASHSCOPE_API_KEY is missing; falling back to Cerebras.");
        if (CEREBRAS_API_KEY) return callCerebras();
        throw new Error("No AI provider configured: missing DASHSCOPE_API_KEY and CEREBRAS_API_KEY.");
      }
      return callAlibaba();
    })().catch(async (e1: any) => {
      if (provider !== "cerebras" || !DASHSCOPE_API_KEY) throw e1;
      const msg1 = String(e1?.message ?? "");
      const status1 = Number(e1?.status ?? e1?.statusCode ?? NaN);
      console.warn("Cerebras failed evaluating interview, trying Alibaba fallback:", { status: status1, msg: msg1 });
      return callAlibaba();
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
