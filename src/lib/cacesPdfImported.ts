import type { CacesOptionId, CacesQuestion, CacesQuestionOption } from "./types";
import rawImportedQuestions from "./data/cacesPdfImportedRaw.json";

type RawImportedQuestion = {
  id: string;
  category: string;
  topic: string;
  type: "directa" | "caso_clinico";
  difficulty: "basica" | "intermedia" | "alta";
  question: string;
  options: [string, string, string, string];
  tags: string[];
  source: string;
};

const DEFAULT_SUBCOMPONENT = "Banco importado CACES";
const DEFAULT_SOURCE_REFERENCE = "Banco de preguntas CACES importado desde PDF oficial (2022-2023).";
const SCORE_MAMA_2025_SUBCOMPONENT = "Score MAMÁ y Claves Obstétricas 2025";
const SCORE_MAMA_2025_REFERENCE =
  "Protocolo Score MAMÁ y Claves Obstétricas 2025, MSP Ecuador, Registro Oficial Suplemento No. 154, 29 de octubre de 2025.";
const GYNE_CATEGORY = "Ginecología y salud sexual";
const SCORE_MAMA_GYNE_TARGET = 100;

function resolveImportedSubcomponent(item: RawImportedQuestion) {
  if (item.source === "score_mama_2025") {
    return SCORE_MAMA_2025_SUBCOMPONENT;
  }

  return DEFAULT_SUBCOMPONENT;
}

function resolveImportedReference(item: RawImportedQuestion) {
  if (item.source === "score_mama_2025") {
    return SCORE_MAMA_2025_REFERENCE;
  }

  return DEFAULT_SOURCE_REFERENCE;
}

function normalizeImportedTopic(item: RawImportedQuestion) {
  return String(item.topic ?? "").trim();
}

function stripImportedNoise(value: string) {
  let compact = String(value ?? "")
    .replace(/…/g, "")
    .replace(/\s+/g, " ")
    .trim();

  compact = compact
    .replace(/^(?:\d+\.\s*){2,}/, "")
    .replace(/^\d+\.\d+\s+/, "")
    .replace(/^\d+\s+/, "")
    .replace(
      /^(?:desarrollo\s+)?7\.1\s+protocolo score mamá,\s*evaluación,\s*registro y manejo$/i,
      "evaluación, registro y manejo del protocolo Score MAMÁ"
    )
    .replace(
      /^16\s+7\.1\s+protocolo score mamá,\s*evaluación,\s*registro y manejo$/i,
      "evaluación, registro y manejo del protocolo Score MAMÁ"
    )
    .replace(/^(?:desarrollo\s+)?7\.1\s+/i, "")
    .trim();

  return compact;
}

const TRAILING_FRAGMENT_WORDS = new Set([
  "a",
  "al",
  "ante",
  "bajo",
  "con",
  "contra",
  "de",
  "del",
  "desde",
  "durante",
  "el",
  "en",
  "entre",
  "hacia",
  "hasta",
  "la",
  "las",
  "lo",
  "los",
  "para",
  "por",
  "segun",
  "sin",
  "so",
  "sobre",
  "su",
  "sus",
  "tras",
  "un",
  "una",
  "y",
]);

function trimTrailingFragment(value: string) {
  const normalized = stripImportedNoise(value).replace(/[,:;.-]+$/u, "").trim();
  if (!normalized) return "";

  const parts = normalized.split(/\s+/);
  const last = parts.at(-1)?.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (parts.length >= 6 && last && TRAILING_FRAGMENT_WORDS.has(last)) {
    parts.pop();
    return parts.join(" ").trim();
  }

  return normalized;
}

function normalizeAnswerText(value: string) {
  return stripImportedNoise(value).replace(/[.]+$/u, "").trim();
}

function buildImportedClueSnippet(item: RawImportedQuestion) {
  const cleanedQuestion = stripImportedNoise(String(item.question ?? ""));
  const base = cleanedQuestion.includes("¿")
    ? cleanedQuestion.split("¿")[0]?.trim() ?? cleanedQuestion
    : cleanedQuestion;
  const normalized = base.replace(/[,:;.-]+$/u, "").trim();

  if (!normalized) return "los datos clínicos y conceptuales del enunciado";
  return normalized.length > 220 ? `${normalized.slice(0, 217).trim()}...` : normalized;
}

function cleanTopicLabel(value: string) {
  const compact = trimTrailingFragment(value);

  if (!compact) return "tema clínico importado";
  return compact.length > 120 ? `${compact.slice(0, 117).trim()}...` : compact;
}

function isScoreMamaCaseItem(item: RawImportedQuestion) {
  return /^caso de entrenamiento obstétrico:/i.test(String(item.question ?? "").trim());
}

function resolveImportedType(item: RawImportedQuestion): RawImportedQuestion["type"] {
  if (item.source === "score_mama_2025" && isScoreMamaCaseItem(item)) {
    return "caso_clinico";
  }

  return item.type;
}

function buildScoreMamaSourceGroup(item: RawImportedQuestion) {
  return `score_mama_2025:${cleanTopicLabel(normalizeImportedTopic(item))
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()}`;
}

function buildImportedQuestionStem(item: RawImportedQuestion) {
  if (item.source !== "score_mama_2025") {
    return stripImportedNoise(String(item.question ?? "").trim());
  }

  const topicLabel = cleanTopicLabel(normalizeImportedTopic(item));
  if (resolveImportedType(item) === "caso_clinico") {
    return `Caso clínico obstétrico: con base en Score MAMÁ 2025, identifica la afirmación correcta sobre ${topicLabel}.`;
  }

  return `Según el protocolo Score MAMÁ 2025, ¿cuál enunciado es correcto sobre ${topicLabel}?`;
}

function scoreMamaGynePriority(item: RawImportedQuestion) {
  const haystack = [
    item.category,
    item.topic,
    item.question,
    ...(Array.isArray(item.options) ? item.options : []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const weightedTerms: Array<[RegExp, number]> = [
    [/\bscore mamá\b/g, 1],
    [/\bobst/g, 4],
    [/\bembar/g, 4],
    [/\bgestan/g, 4],
    [/\bparto\b/g, 4],
    [/\bpuer/g, 4],
    [/\beclamp/g, 4],
    [/\bpreecl/g, 4],
    [/\bhemorrag/g, 4],
    [/\bsepsis\b/g, 3],
    [/\buter/g, 3],
    [/\bplacenta\b/g, 3],
    [/\bfeto\b/g, 3],
    [/\bcesa/g, 3],
    [/\baborto\b/g, 3],
    [/\bamnio/g, 3],
    [/\bta[s|d]\b/g, 1],
    [/\bfrecuencia cardiaca\b/g, 1],
    [/\bfrecuencia respiratoria\b/g, 1],
  ];

  for (const [pattern, weight] of weightedTerms) {
    if (pattern.test(haystack)) score += weight;
  }

  if (/^16\s+7\.1/i.test(String(item.topic ?? "").trim())) score -= 3;
  if (String(item.topic ?? "").includes("…")) score -= 1;

  return score;
}

function buildGyneQuestionStem(item: RawImportedQuestion) {
  const topicLabel = cleanTopicLabel(normalizeImportedTopic(item));
  if (resolveImportedType(item) === "caso_clinico") {
    return `Caso clínico obstétrico: en ginecología y salud sexual, según Score MAMÁ 2025, identifica la afirmación correcta sobre ${topicLabel}.`;
  }

  return `En ginecología y salud sexual, según el protocolo Score MAMÁ 2025, ¿cuál enunciado es correcto sobre ${topicLabel}?`;
}

function buildImportedOption(
  item: RawImportedQuestion,
  id: CacesOptionId,
  text: string,
  isCorrect: boolean
): CacesQuestionOption {
  const clueSnippet = buildImportedClueSnippet(item);
  if (item.source === "score_mama_2025") {
    const topicLabel = cleanTopicLabel(normalizeImportedTopic(item));
    return {
      id,
      text,
      rationale: isCorrect
        ? `Es la alternativa que mejor coincide con el protocolo Score MAMÁ 2025 y con los datos del enunciado sobre ${topicLabel}.`
        : `No coincide de forma suficiente con el protocolo Score MAMÁ 2025 ni con los datos del enunciado sobre ${topicLabel}.`,
    };
  }

  if (isCorrect) {
    return {
      id,
      text,
      rationale: `Se ajusta mejor a los datos clave del enunciado: ${clueSnippet}.`,
    };
  }

  return {
    id,
    text,
    rationale: `No explica de forma consistente los datos clave del enunciado: ${clueSnippet}.`,
  };
}

function buildImportedExplanation(item: RawImportedQuestion) {
  const answer = normalizeAnswerText(String(item.options[0] ?? "la alternativa correcta"));
  const clueSnippet = buildImportedClueSnippet(item);
  if (item.source === "score_mama_2025") {
    const topicLabel = cleanTopicLabel(normalizeImportedTopic(item));
    return `La respuesta correcta es ${answer} porque es la opción que mejor coincide con el protocolo oficial Score MAMÁ 2025 para ${topicLabel} y con los datos del enunciado.`;
  }

  return `La respuesta correcta es ${answer} porque es la opción que mejor se ajusta a los datos clave del enunciado: ${clueSnippet}.`;
}

const LETTERS: CacesOptionId[] = ["A", "B", "C", "D"];

export const CACES_IMPORTED_PDF_BANK: CacesQuestion[] = (rawImportedQuestions as RawImportedQuestion[]).map((item) => {
  const builtOptions = LETTERS.map((letter, idx) =>
    buildImportedOption(item, letter, String(item.options[idx] ?? ""), idx === 0)
  ) as [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption];

  return {
    id: item.id,
    component: item.category,
    subcomponent: resolveImportedSubcomponent(item),
    topic: cleanTopicLabel(normalizeImportedTopic(item)),
    sourceGroup: item.source === "score_mama_2025" ? buildScoreMamaSourceGroup(item) : item.id,
    category: item.category,
    type: resolveImportedType(item),
    question: buildImportedQuestionStem(item),
    options: builtOptions,
    correctAnswer: "A",
    explanation: buildImportedExplanation(item),
    difficulty: item.difficulty,
    tags: item.tags,
    references: [resolveImportedReference(item)],
  };
});

export const CACES_SCORE_MAMA_GYNE_BANK: CacesQuestion[] = (rawImportedQuestions as RawImportedQuestion[])
  .filter((item) => item.source === "score_mama_2025")
  .sort((a, b) => {
    const byPriority = scoreMamaGynePriority(b) - scoreMamaGynePriority(a);
    if (byPriority !== 0) return byPriority;
    return String(a.id).localeCompare(String(b.id), "es", { numeric: true, sensitivity: "base" });
  })
  .slice(0, SCORE_MAMA_GYNE_TARGET)
  .map((item) => {
    const builtOptions = LETTERS.map((letter, optionIdx) =>
      buildImportedOption(item, letter, String(item.options[optionIdx] ?? ""), optionIdx === 0)
    ) as [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption];

    return {
      id: `${item.id}-gss`,
      component: GYNE_CATEGORY,
      subcomponent: SCORE_MAMA_2025_SUBCOMPONENT,
      topic: `Score MAMÁ 2025 - ${cleanTopicLabel(normalizeImportedTopic(item))}`,
      sourceGroup: buildScoreMamaSourceGroup(item),
      category: GYNE_CATEGORY,
      type: resolveImportedType(item),
      question: buildGyneQuestionStem(item),
      options: builtOptions,
      correctAnswer: "A",
      explanation: `Pregunta derivada del protocolo oficial Score MAMÁ 2025 para práctica focalizada en ginecología y salud sexual sobre ${cleanTopicLabel(normalizeImportedTopic(item))}.`,
      difficulty: item.difficulty,
      tags: [...new Set([...(item.tags ?? []), "score_mama_2025", "ginecologia_salud_sexual"])],
      references: [SCORE_MAMA_2025_REFERENCE],
    };
  });
