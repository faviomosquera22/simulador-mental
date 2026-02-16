// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

type Role = "system" | "user" | "assistant";
export type LLMMessage = { role: Role; content: string };

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

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}") {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) {
        const candidate = s.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          start = -1;
        }
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
  const modelName = args.model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const temperature = args.temperature ?? 0.4;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("missing_GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);

  // system va separado (systemInstruction)
  const systemMsg = args.messages.find((m) => m.role === "system")?.content ?? "";
  const nonSystem = args.messages.filter((m) => m.role !== "system");

  const contents = nonSystem.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(systemMsg ? { systemInstruction: systemMsg } : {}),
  });

  const result = await model.generateContent({
    contents,
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return extractFirstJSONObject(text);
}

// Backward-compat: algunas rutas todavía importan `ollamaChatJSON`
export const ollamaChatJSON = geminiChatJSON;