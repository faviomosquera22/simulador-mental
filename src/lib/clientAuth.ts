import { getSupabaseClient } from "./supabaseClient";

export async function getAuthFetchHeaders(
  baseHeaders: Record<string, string> = {}
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...baseHeaders };

  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // If session/token cannot be read, API will return 401 and UI can handle it.
  }

  return headers;
}

