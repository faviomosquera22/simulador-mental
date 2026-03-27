type ImportedQuestionLike = {
  id?: string;
  options?: string[];
};

const MERGED_PROMPT_PATTERNS = [
  /esta definici[oó]n pertenece a:/i,
  /a qu[eé] tipo de integralidad corresponde/i,
  /esta definici[oó]n/i,
  /definici[oó]n de:/i,
];

function normalizeImportedOption(value: string) {
  return String(value ?? "")
    .replace(/…/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorruptedImportedOption(value: string) {
  const text = normalizeImportedOption(value);
  if (!text) return true;
  if (/[¿?]/u.test(text)) return true;
  return MERGED_PROMPT_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasDuplicateImportedOptions(item: ImportedQuestionLike) {
  const options = Array.isArray(item.options) ? item.options.map(normalizeImportedOption) : [];
  return new Set(options.map((value) => value.toLowerCase())).size < options.length;
}

export function isStructurallyCoherentImportedQuestion(item: ImportedQuestionLike) {
  const options = Array.isArray(item.options) ? item.options.map(normalizeImportedOption) : [];
  if (options.length !== 4) return false;
  if (options.some((value) => !value)) return false;
  if (hasDuplicateImportedOptions({ options })) return false;
  if (options.some((value) => isCorruptedImportedOption(value))) return false;
  return true;
}
