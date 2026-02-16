// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.https//qttwhladyplifvsbwluh.supabase.co;
const anon = process.env.sb_publishable_9qKfrqWMJkPW2lCFBvxqog_zxSlfn8K;

if (!url || !anon) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(url, anon);