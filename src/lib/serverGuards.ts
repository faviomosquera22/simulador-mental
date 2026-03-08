import "server-only";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type RateBucket = {
  count: number;
  resetAt: number;
};

type GuardOk<T> = { ok: true; data: T };
type GuardFail = { ok: false; response: NextResponse };

const RATE_LIMIT_STORE_KEY = "__psyke_rate_limit_store__";
const RATE_LIMIT_SWEEP_KEY = "__psyke_rate_limit_sweep__";

function getRateLimitStore() {
  const g = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, RateBucket>;
    [RATE_LIMIT_SWEEP_KEY]?: number;
  };

  if (!g[RATE_LIMIT_STORE_KEY]) {
    g[RATE_LIMIT_STORE_KEY] = new Map<string, RateBucket>();
  }

  return g[RATE_LIMIT_STORE_KEY]!;
}

function sweepExpiredBuckets(now: number) {
  const g = globalThis as typeof globalThis & {
    [RATE_LIMIT_SWEEP_KEY]?: number;
  };

  const lastSweep = g[RATE_LIMIT_SWEEP_KEY] ?? 0;
  if (now - lastSweep < 30_000) return;

  const store = getRateLimitStore();
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  g[RATE_LIMIT_SWEEP_KEY] = now;
}

function unauthorizedResponse() {
  return NextResponse.json(
    { code: "UNAUTHORIZED", detail: "Inicia sesión para usar esta función." },
    { status: 401 }
  );
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) return null;

  const token = m[1].trim();
  return token.length > 0 ? token : null;
}

export async function requireAuthenticatedUser(
  req: Request
): Promise<GuardOk<{ userId: string }> | GuardFail> {
  const token = getBearerToken(req);
  if (!token) return { ok: false, response: unauthorizedResponse() };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "AUTH_CONFIG_MISSING",
          detail:
            "Falta configuración de Supabase en el servidor (NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY).",
        },
        { status: 500 }
      ),
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      return { ok: false, response: unauthorizedResponse() };
    }

    return { ok: true, data: { userId: data.user.id } };
  } catch {
    return { ok: false, response: unauthorizedResponse() };
  }
}

export function enforceRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): GuardOk<{ remaining: number; resetAt: number }> | GuardFail {
  const key = String(opts.key ?? "").trim();
  const limit = Number.isFinite(opts.limit) && opts.limit > 0 ? Math.floor(opts.limit) : 30;
  const windowMs =
    Number.isFinite(opts.windowMs) && opts.windowMs >= 1_000
      ? Math.floor(opts.windowMs)
      : 60_000;

  if (!key) {
    return { ok: false, response: NextResponse.json({ detail: "rate_limit_key_missing" }, { status: 500 }) };
  }

  const now = Date.now();
  sweepExpiredBuckets(now);

  const store = getRateLimitStore();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, data: { remaining: Math.max(0, limit - 1), resetAt } };
  }

  if (existing.count >= limit) {
    const retryAfterMs = Math.max(0, existing.resetAt - now);
    return {
      ok: false,
      response: NextResponse.json(
        {
          code: "RATE_LIMIT",
          detail: "Demasiadas solicitudes. Intenta nuevamente en unos segundos.",
          retry_after_ms: retryAfterMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
          },
        }
      ),
    };
  }

  existing.count += 1;
  store.set(key, existing);
  return {
    ok: true,
    data: { remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt },
  };
}

