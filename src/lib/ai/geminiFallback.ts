import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeminiFallbackRole = "system" | "user" | "assistant";

export type GeminiFallbackMessage = {
  role: GeminiFallbackRole;
  content: string;
};

export type GeminiFallbackGenerationConfig = {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  stopSequences?: string[];
};

export type GeminiFallbackAttempt = {
  provider: "gemini";
  model: string;
  ok: boolean;
  retriable?: boolean;
  status?: number;
  code?: string;
  reason?: string;
  durationMs: number;
  outputChars?: number;
};

export type GeminiFallbackSuccess<T> = {
  provider: "gemini";
  output: T;
  text: string;
  modelUsed: string;
  fallbackUsed: boolean;
  attempts: GeminiFallbackAttempt[];
};

export class GeminiFallbackExecutionError extends Error {
  attempts: GeminiFallbackAttempt[];
  modelsTried: string[];
  status?: number;
  retriable: boolean;

  constructor(
    message: string,
    args: {
      attempts: GeminiFallbackAttempt[];
      modelsTried: string[];
      status?: number;
      retriable: boolean;
    }
  ) {
    super(message);
    this.name = "GeminiFallbackExecutionError";
    this.attempts = args.attempts;
    this.modelsTried = args.modelsTried;
    this.status = args.status;
    this.retriable = args.retriable;
  }
}

type GeminiSimpleContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type GeminiLogger = Pick<Console, "info" | "warn" | "error">;

export type GenerateWithGeminiFallbackArgs = {
  messages: GeminiFallbackMessage[];
  generationConfig?: GeminiFallbackGenerationConfig;
  models?: string[];
  timeoutMs?: number;
  logger?: GeminiLogger;
};

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
];

function dedupeModels(models: string[]) {
  const out: string[] = [];
  for (const raw of models) {
    const model = String(raw ?? "").trim();
    if (!model || out.includes(model)) continue;
    out.push(model);
  }
  return out;
}

function resolveGeminiModels(customModels?: string[]) {
  if (Array.isArray(customModels) && customModels.length > 0) {
    const custom = dedupeModels(customModels);
    if (custom.length > 0) return custom;
  }

  return dedupeModels([
    process.env.GEMINI_PRIMARY_MODEL || DEFAULT_GEMINI_MODELS[0],
    process.env.GEMINI_FALLBACK_MODEL_1 || DEFAULT_GEMINI_MODELS[1],
    process.env.GEMINI_FALLBACK_MODEL_2 || DEFAULT_GEMINI_MODELS[2],
    process.env.GEMINI_FALLBACK_MODEL_3 || DEFAULT_GEMINI_MODELS[3],
  ]);
}

function toGeminiPayload(messages: GeminiFallbackMessage[]) {
  const systemInstruction = messages.find((m) => m.role === "system")?.content?.trim() || undefined;
  const contents: GeminiSimpleContent[] = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    }));
  return { systemInstruction, contents };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const timeoutError = new Error("gemini_timeout");
      (timeoutError as any).code = "TIMEOUT";
      reject(timeoutError);
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function parseStatusFromMessage(message: string) {
  const m = message.match(/\b(429|503)\b/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function classifyGeminiError(error: unknown) {
  const err = error as any;
  const message = String(err?.message ?? err ?? "unknown_error");
  const upperMsg = message.toUpperCase();
  const codeRaw = String(
    err?.code ??
      err?.status ??
      err?.error?.status ??
      err?.details?.status ??
      err?.cause?.code ??
      ""
  );
  const code = codeRaw.toUpperCase();

  const statusCandidate = Number(
    err?.status ??
      err?.statusCode ??
      err?.response?.status ??
      err?.cause?.status ??
      parseStatusFromMessage(message) ??
      NaN
  );
  const status = Number.isFinite(statusCandidate) ? statusCandidate : undefined;

  const isAuthOrInvalid =
    status === 400 ||
    status === 401 ||
    status === 403 ||
    /INVALID[_\s-]?ARGUMENT|FAILED_PRECONDITION|PERMISSION_DENIED|UNAUTHENTICATED/.test(code) ||
    /INVALID[_\s-]?ARGUMENT|FAILED_PRECONDITION|PERMISSION_DENIED|UNAUTHENTICATED/.test(upperMsg) ||
    /API KEY|AUTH|UNAUTH|PERMISSION|MALFORMED|BAD REQUEST|REQUEST INVALID|PROMPT TOO LARGE|PAYLOAD TOO LARGE/.test(
      upperMsg
    );

  if (isAuthOrInvalid) {
    return {
      message,
      code: code || "INVALID_REQUEST",
      status,
      retriable: false,
    };
  }

  const isRetriable =
    status === 429 ||
    status === 503 ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|INTERNAL/.test(code) ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|INTERNAL/.test(upperMsg) ||
    /TIMEOUT|ETIMEDOUT|ECONNRESET|EAI_AGAIN|TEMPORARY|NETWORK/.test(upperMsg) ||
    (typeof status === "number" && status >= 500);

  return {
    message,
    code: code || "UNKNOWN",
    status,
    retriable: isRetriable,
  };
}

function extractReasonForLog(message: string) {
  const clean = String(message ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "unknown_error";
  if (clean.length <= 180) return clean;
  return clean.slice(0, 177) + "...";
}

async function runGeminiFallback<T>(args: GenerateWithGeminiFallbackArgs, parseOutput: (text: string) => T) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiFallbackExecutionError("missing_GEMINI_API_KEY", {
      attempts: [],
      modelsTried: [],
      retriable: false,
    });
  }

  const models = resolveGeminiModels(args.models);
  if (models.length === 0) {
    throw new GeminiFallbackExecutionError("no_gemini_models_configured", {
      attempts: [],
      modelsTried: [],
      retriable: false,
    });
  }

  const logger = args.logger ?? console;
  const timeoutMs = Number(args.timeoutMs ?? 60_000);
  const generationConfig: GeminiFallbackGenerationConfig = {
    responseMimeType: "application/json",
    ...(args.generationConfig ?? {}),
  };

  const { systemInstruction, contents } = toGeminiPayload(args.messages);
  const client = new GoogleGenerativeAI(apiKey);
  const attempts: GeminiFallbackAttempt[] = [];

  for (let index = 0; index < models.length; index++) {
    const modelName = models[index];
    const startedAt = Date.now();
    logger.info(`[gemini-fallback] intentando modelo=${modelName}`);

    try {
      const model = client.getGenerativeModel({
        model: modelName,
        ...(systemInstruction ? { systemInstruction } : {}),
      });

      const result = await withTimeout(
        model.generateContent({
          contents,
          generationConfig,
        }),
        timeoutMs
      );

      const text = String(result?.response?.text?.() ?? "").trim();
      if (!text) {
        const durationMs = Date.now() - startedAt;
        attempts.push({
          provider: "gemini",
          model: modelName,
          ok: false,
          retriable: true,
          code: "EMPTY_RESPONSE",
          reason: "Respuesta vacía del modelo",
          durationMs,
        });
        logger.warn(`[gemini-fallback] modelo=${modelName} falló motivo=EMPTY_RESPONSE`);
        continue;
      }

      let parsed: T;
      try {
        parsed = parseOutput(text);
      } catch (parseError: unknown) {
        const durationMs = Date.now() - startedAt;
        const parseMessage = extractReasonForLog(
          parseError instanceof Error ? parseError.message : String(parseError ?? "response_parse_failed")
        );
        attempts.push({
          provider: "gemini",
          model: modelName,
          ok: false,
          retriable: true,
          code: "INVALID_RESPONSE",
          reason: parseMessage,
          durationMs,
          outputChars: text.length,
        });
        logger.warn(`[gemini-fallback] modelo=${modelName} falló motivo=INVALID_RESPONSE ${parseMessage}`);
        continue;
      }

      const durationMs = Date.now() - startedAt;
      attempts.push({
        provider: "gemini",
        model: modelName,
        ok: true,
        durationMs,
        outputChars: text.length,
      });
      logger.info(
        `[gemini-fallback] modelo final=${modelName} fallbackUsed=${index > 0 ? "true" : "false"}`
      );

      return {
        provider: "gemini",
        output: parsed,
        text,
        modelUsed: modelName,
        fallbackUsed: index > 0,
        attempts,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - startedAt;
      const classification = classifyGeminiError(error);
      attempts.push({
        provider: "gemini",
        model: modelName,
        ok: false,
        retriable: classification.retriable,
        status: classification.status,
        code: classification.code,
        reason: extractReasonForLog(classification.message),
        durationMs,
      });
      logger.warn(
        `[gemini-fallback] modelo=${modelName} falló retriable=${classification.retriable ? "true" : "false"} status=${classification.status ?? "-"} code=${classification.code}`
      );

      if (!classification.retriable) {
        throw new GeminiFallbackExecutionError(
          `gemini_non_retriable_error:${classification.code}:${extractReasonForLog(classification.message)}`,
          {
            attempts,
            modelsTried: models,
            status: classification.status,
            retriable: false,
          }
        );
      }
    }
  }

  throw new GeminiFallbackExecutionError(
    `gemini_all_models_failed:${models.join(",")}`,
    {
      attempts,
      modelsTried: models,
      status: attempts[attempts.length - 1]?.status,
      retriable: true,
    }
  );
}

export function extractFirstJSONObject(text: string) {
  const s = String(text ?? "").trim();
  if (!s) throw new Error("gemini_empty_response");

  try {
    return JSON.parse(s);
  } catch {
    // noop
  }

  let inString = false;
  let escaped = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      continue;
    }

    if (ch === "\"") {
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

export async function generateWithGeminiFallback(args: GenerateWithGeminiFallbackArgs) {
  return runGeminiFallback<string>(args, (text) => text);
}

export async function generateJsonWithGeminiFallback<T = any>(args: GenerateWithGeminiFallbackArgs) {
  return runGeminiFallback<T>(args, (text) => extractFirstJSONObject(text) as T);
}
