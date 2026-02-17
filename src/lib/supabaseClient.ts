// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// These must be set in .env.local (dev) and in Vercel Environment Variables (prod)
// Example:
// NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (local dev) and in Vercel Project Settings → Environment Variables (Production/Preview)."
  );
}

export const supabase = createClient(url, anon);