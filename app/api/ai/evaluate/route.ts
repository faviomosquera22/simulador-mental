import { NextResponse } from "next/server";
import type { CaseObject } from "../../../../src/lib/types";
// Gemini client (the exported function name in src/lib/gemini is legacy)
import { geminiChatJSON } from "../../../../src/lib/gemini";

// Gemini model (fallbacks kept for backwards-compat)
const MODEL =
  process.env.GEMINI_MODEL ||
  process.env.NEXT_PUBLIC_GEMINI_MODEL ||
  "gemini-2.0-flash";

type TranscriptTurn = { role: "user" | "patient"; content: string };

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

export async function POST(req: Request) {
  try {
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
          `${t.role === "user" ? "ENTREVISTADOR" : "PACIENTE"}: ${String(t.content ?? "").slice(0, 600)}`
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

    const out = await geminiChatJSON({
      model: MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
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
    return NextResponse.json({ detail: e?.message ?? "Error en /api/ai/evaluate" }, { status: 500 });
  }
}