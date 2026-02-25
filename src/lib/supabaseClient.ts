import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _client: SupabaseClient | null = null;
let _warned = false;

function ensureEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Do NOT throw during module evaluation (breaks Next dev server + Turbopack overlay).
    // Throw only when someone actually tries to use the client.
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Agregalas en .env.local y reinicia el servidor (npm run dev)."
    );
  }
}

export function getSupabaseClient(): SupabaseClient {
  ensureEnv();
  if (_client) return _client;
  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

// Back-compat export for existing imports: `import { supabase } from ...`
// This is a Proxy so importing the module never crashes; it will throw only when accessed.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    try {
      return (getSupabaseClient() as any)[prop];
    } catch (err) {
      if (!_warned) {
        _warned = true;
        // Helpful log for dev
        // eslint-disable-next-line no-console
        console.error(err);
      }
      throw err;
    }
  },
}) as SupabaseClient;
