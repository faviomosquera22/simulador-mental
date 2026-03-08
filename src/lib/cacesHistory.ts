import type { CacesHistoryEntry } from "./types";

const CACES_HISTORY_KEY = "cacesHistory:v1";

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCacesHistory(): CacesHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse(localStorage.getItem(CACES_HISTORY_KEY));
  return Array.isArray(parsed) ? (parsed as CacesHistoryEntry[]) : [];
}

export function saveCacesHistory(entries: CacesHistoryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACES_HISTORY_KEY, JSON.stringify(entries.slice(0, 60)));
}

export function addCacesHistory(entry: CacesHistoryEntry) {
  const current = getCacesHistory();
  current.unshift(entry);
  saveCacesHistory(current);
}
