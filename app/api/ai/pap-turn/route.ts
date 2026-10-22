import { NextResponse } from "next/server";
import { SchemaType } from "@google/generative-ai";
import { generateJsonWithGeminiFallback } from "@/src/lib/ai/geminiFallback";
import { enforceRateLimit, requireAuthenticatedUser } from "@/src/lib/serverGuards";
import { PAP_AI_INTENTS, PAP_AI_PROMPT_VERSION, buildPapAiMessages, parsePapAiRequest, parsePapAiTurn } from "@/src/lib/papAi";

export const maxDuration = 35;
export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit({ key: `pap-turn:${auth.data.userId}`, limit: 20, windowMs: 60_000 });
  if (!limited.ok) return limited.response;
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ code: "AI_UNAVAILABLE", detail: "Gemini no está configurado en este servidor." }, { status: 503 });
  let input;
  try {
    const text = await req.text();
    if (text.length > 40_000) return NextResponse.json({ code: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    input = parsePapAiRequest(JSON.parse(text));
  } catch {
    return NextResponse.json({ code: "INVALID_INPUT", detail: "El mensaje o el estado del caso no es válido." }, { status: 400 });
  }
  try {
    const generated = await generateJsonWithGeminiFallback<unknown>({
      messages: buildPapAiMessages(input.run, input.message, input.kind),
      models: [process.env.GEMINI_PAP_MODEL || process.env.GEMINI_PRIMARY_MODEL || "gemini-2.5-flash", process.env.GEMINI_FALLBACK_MODEL_1 || "gemini-2.5-flash-lite"],
      timeoutMs: 12_000,
      generationConfig: { temperature: .55, maxOutputTokens: 1400, responseMimeType: "application/json", responseSchema: { type: SchemaType.OBJECT, properties: { intent: { type: SchemaType.STRING, format: "enum", enum: Object.keys(PAP_AI_INTENTS) }, message: { type: SchemaType.STRING } }, required: ["intent", "message"] } },
    });
    const turn = parsePapAiTurn(generated.output);
    return NextResponse.json({ turn, provider: "gemini", model: generated.modelUsed, promptVersion: PAP_AI_PROMPT_VERSION }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Never return provider exceptions, configuration or student text to clients/logs.
    return NextResponse.json({ code: "AI_UNAVAILABLE", detail: "Gemini no pudo responder en este momento. Puedes continuar con el guion del caso." }, { status: 503 });
  }
}
