import type { PapEntry } from "./psychologicalFirstAid";

export type PapReplyPart = { kind: "speech" | "scene"; text: string };
const sceneOnly = new Set(["scene", "observe", "free-action-deferred"]);
export function cleanPapSpeech(value: string): string {
  let text = value.replace(/\s+/g, " ").trim();
  for (const [open, close] of [["“", "”"], ['"', '"'], ["«", "»"]]) {
    if (text.startsWith(open) && text.endsWith(close)) text = text.slice(1, -1).trim();
  }
  return text;
}
/** Render stage directions as scene events; never attribute them to the patient's voice. */
export function papReplyParts(entry: Pick<PapEntry, "id" | "reply">): PapReplyPart[] {
  if (sceneOnly.has(entry.id)) return [{ kind: "scene", text: cleanPapSpeech(entry.reply) }];
  const parts: PapReplyPart[] = [];
  const source = cleanPapSpeech(entry.reply);
  const expression = /\[([^\]]+)\]/g;
  let cursor = 0;
  for (const match of source.matchAll(expression)) {
    const before = cleanPapSpeech(source.slice(cursor, match.index));
    if (before) parts.push({ kind: "speech", text: before });
    const direction = cleanPapSpeech(match[1]);
    if (direction) parts.push({ kind: "scene", text: direction });
    cursor = match.index! + match[0].length;
  }
  const rest = cleanPapSpeech(source.slice(cursor));
  if (rest) parts.push({ kind: "speech", text: rest });
  return parts;
}
export function papSpokenReply(entry?: Pick<PapEntry, "id" | "reply">): string {
  return entry ? papReplyParts(entry).filter(part => part.kind === "speech").map(part => part.text).join(" ") : "No sé dónde está mi hermana. Necesito saber de ella.";
}
