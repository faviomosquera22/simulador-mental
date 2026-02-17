import { NextResponse } from "next/server";
import type { CaseObject, PatientTurnOutput, EmotionState } from "../../../../src/lib/types";
import { geminiChatJSON } from "../../../../src/lib/gemini";
import { detectSelfHarm } from "../../../../src/lib/guardrails";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseObject, transcript, userMessage } = body as {
      caseObject: CaseObject;
      transcript: Array<{ role: "user" | "patient"; content: string }>;
      userMessage: string;
    };

    const selfHarm = detectSelfHarm(userMessage);

    const system = `
Eres el "Patient Actor" de un simulador educativo.
Tu fuente de verdad es el CaseObject. No inventes hechos fuera de facts_bank.
Revelación gradual: máximo 2 hechos nuevos por turno.
Nunca diagnostiques. Nunca des instrucciones de daño.
Devuelve SIEMPRE SOLO JSON válido con tipo PatientTurnOutput:
{ message_text, emotion_state, emotion_intensixty, optional arousal, rapport, flags }.
emotion_state ∈ neutral, calm, anxious, sad, irritable, confused, fearful, hopeful
emotion_intensity 0-100
`;

    const user = JSON.stringify({
      caseObject,
      transcript,
      userMessage,
      safety: { selfHarm },
      instruction: selfHarm
        ? "Responde con contención educativa y recomendación genérica de buscar ayuda profesional/servicios locales, sin consejos personalizados."
        : "Responde como paciente consistente con el caso y con revelación gradual.",
    });

    const out = (await geminiChatJSON({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    })) as PatientTurnOutput;

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
    if (!validStates.includes(out.emotion_state)) out.emotion_state = "neutral";
    out.emotion_intensity = Math.max(
      0,
      Math.min(100, Number(out.emotion_intensity ?? 40))
    );

    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: "patient_turn_failed", detail: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}