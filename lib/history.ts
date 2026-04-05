export type EndReason = "manual" | "timeout";
export type SessionRecord = {
  sessionId: string;
  caseId: string;
  caseTitle: string;
  patientName: string;
  score?: number;
  moduleId?: string;
  moduleLabel?: string;
  mode?: string;
  riskLevel?: "Bajo" | "Moderado" | "Alto" | "—";

  startedAt: string; // ISO
  endedAt: string;   // ISO
  endReason: EndReason; 

  targetMinutes?: number;
  durationSec: number;

  lastMeta?: {
    state?: string;
    intensity?: number;
    rapport?: number;
    flags?: string[];
  };

  transcript?: { role: "user" | "patient" | "caregiver" | "tutor"; content: string }[];
};

const KEY = "caseHistory:v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export function getHistory(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse<SessionRecord[]>(localStorage.getItem(KEY)) ?? [];
}

export function saveHistory(list: SessionRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200))); // cap
}

export function addSession(record: SessionRecord) {
  const list = getHistory();
  list.unshift(record); // newest first
  saveHistory(list);
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function deleteSession(sessionId: string) {
  const list = getHistory().filter(s => s.sessionId !== sessionId);
  saveHistory(list);
}
