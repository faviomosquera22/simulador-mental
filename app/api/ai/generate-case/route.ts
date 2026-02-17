import { NextResponse } from "next/server";
import { geminiChatJSON } from "../../../../src/lib/gemini";

// Gemini model (override with env). Examples: gemini-2.0-flash, gemini-2.0-pro
// (If GEMINI_MODEL is not set, we default to a currently supported model.)
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category = "ansiedad", difficulty = 2, target_minutes = 20 } = body ?? {};

    const system = `
Eres un "Case Generator" para un simulador educativo de ENTREVISTAS EN SALUD MENTAL.
Devuelve SOLO JSON válido (sin markdown, sin texto extra).

Reglas duras:
- Caso 100% ficticio, sin datos personales reales.
- Enfocado SOLO en salud mental: depresión, ansiedad, psicosis/delirio, crisis de pánico, duelo, estrés, etc.
- NO diagnostiques ni sugieras tratamiento. Es entrenamiento de entrevista.
- Idioma: ESPAÑOL (LatAm). Usa nombres ficticios latinoamericanos.

El JSON debe incluir como mínimo:
meta { title, difficulty, category, target_minutes },
patient_profile { display_name, age, sex, context },
chief_complaint (string),
brief_context (string),
learning_objective (string),
learning_objectives (array),
areas (array: motivo, historia, sintomas, funcionamiento, antecedentes, riesgo, cierre),
facts_bank (array),
reveal_plan (obj),
conversation_style (obj),
truth_reveal (obj).

Además:
- En patient_profile.context NO uses temas médicos físicos (p.ej. dolor torácico, disnea). Mantén el contexto psicológico/funcional.
- chief_complaint, brief_context y learning_objective deben venir llenos (no guiones, no vacíos).
`;

    const user = `Genera un caso de salud mental. category="${category}" (si category no es de salud mental, usa "ansiedad" por defecto), difficulty=${difficulty}, target_minutes=${target_minutes}.`;

    const json = await geminiChatJSON({
      model: MODEL,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json(
      { error: "generate_case_failed", detail: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}