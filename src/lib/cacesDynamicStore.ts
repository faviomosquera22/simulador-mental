import type { CacesQuestion } from "./types";
import { buildCacesProgressKey, dedupeCacesQuestions } from "./caces";

const GENERATED_KEY = "cacesGeneratedBank:v1";
const SEEN_KEYS = "cacesSeenKeys:v1";
const MAX_GENERATED = 800;
const MAX_SEEN = 4000;

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isValidQuestion(value: unknown): value is CacesQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as CacesQuestion;
  if (!q.id || typeof q.id !== "string") return false;
  if (!q.question || typeof q.question !== "string") return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  return true;
}

function normalizeSeenKeys(input: string[]) {
  const out: string[] = [];
  for (const key of input) {
    const value = String(key ?? "").trim();
    if (!value || out.includes(value)) continue;
    out.push(value);
    if (out.length >= MAX_SEEN) break;
  }
  return out;
}

export function getGeneratedCacesBank(): CacesQuestion[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse(localStorage.getItem(GENERATED_KEY));
  if (!Array.isArray(parsed)) return [];

  const cleaned = parsed.filter(isValidQuestion);
  return dedupeCacesQuestions(cleaned).slice(0, MAX_GENERATED);
}

export function saveGeneratedCacesBank(questions: CacesQuestion[]) {
  if (typeof window === "undefined") return;
  const cleaned = dedupeCacesQuestions(questions.filter(isValidQuestion)).slice(0, MAX_GENERATED);
  localStorage.setItem(GENERATED_KEY, JSON.stringify(cleaned));
}

export function appendGeneratedCacesBank(questions: CacesQuestion[]) {
  const current = getGeneratedCacesBank();
  const merged = dedupeCacesQuestions([...current, ...questions]).slice(0, MAX_GENERATED);
  saveGeneratedCacesBank(merged);
  return merged;
}

export function getSeenCacesQuestionKeys(): string[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse(localStorage.getItem(SEEN_KEYS));
  if (!Array.isArray(parsed)) return [];
  return normalizeSeenKeys(parsed.map((x) => String(x ?? "")));
}

export function markSeenCacesQuestions(questions: CacesQuestion[]) {
  if (typeof window === "undefined") return;
  const existing = getSeenCacesQuestionKeys();
  const next = normalizeSeenKeys([
    ...existing,
    ...questions.map((q) => buildCacesProgressKey(q)),
  ]);
  localStorage.setItem(SEEN_KEYS, JSON.stringify(next));
}
