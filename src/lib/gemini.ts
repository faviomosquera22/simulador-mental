// src/lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

type Role = "system" | "user" | "assistant";
export type LLMMessage = { role: Role; content: string };
export const ollamaChatJSON = geminiChatJSON;

function extractFirstJSONObject(text: string) {
  const s = String(text ?? "").trim();
  if (!s) throw new Error("gemini_empty_response");

  // intento directo
  try {
    return JSON.parse(s);
  } catch {}

  // scan robusto (ignora llaves dentro de strings)
  let inString = false;
  let escaped = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') { inString = true; continue; }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}") {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) {
        const candidate = s.slice(start, i + 1);
        try { return JSON.parse(candidate); } catch { start = -1; }
      }
    }
  }

  throw new Error("gemini_no_json_returned");
}

export async function geminiChatJSON(args: {
  model?: string;
  messages: LLMMessage[];
  temperature?: number;
}) {
  const model = args.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const temperature = args.temperature ?? 0.4;

  // La lib toma GEMINI_API_KEY desde env var (recomendado por docs)
  const ai = new GoogleGenAI({});

  // Convertimos a “contents” como pide el SDK
  // system va separado (systemInstruction)
  const systemMsg = args.messages.find((m) => m.role === "system")?.content ?? "";
  const nonSystem = args.messages.filter((m) => m.role !== "system");

  const contents = nonSystem.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const resp = await ai.models.generateContent({
    model,
    contents,
    // fuerza salida tipo JSON (si el modelo igual mete texto extra, lo “rescatamos” con extractFirstJSONObject)
    config: {
      temperature,
      responseMimeType: "application/json",
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
    },
  });

  const text = (resp as any)?.text ?? "";
  return extractFirstJSONObject(text);
}