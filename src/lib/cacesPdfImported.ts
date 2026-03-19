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
  const raw = String(item.topic ?? "").trim();
  if (item.source !== "score_mama_2025") return raw;

  return raw.replace(/^\d+\s+7\.1\s+/i, "7.1 ");
}

function cleanTopicLabel(value: string) {
  const compact = String(value ?? "")
    .replace(/…/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact) return "manejo obstétrico basado en Score MAMÁ";
  return compact.length > 120 ? `${compact.slice(0, 117).trim()}...` : compact;
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

function buildGyneQuestionStem(item: RawImportedQuestion, serial: number) {
  const topicLabel = cleanTopicLabel(normalizeImportedTopic(item));
  if (item.type === "caso_clinico") {
    return `Caso clínico obstétrico ${serial}: en ginecología y salud sexual, según Score MAMÁ 2025, identifica la afirmación correcta sobre ${topicLabel}.`;
  }

  return `En ginecología y salud sexual, según el protocolo Score MAMÁ 2025, ¿cuál enunciado es correcto sobre ${topicLabel}?`;
}

function option(id: CacesOptionId, text: string, isCorrect: boolean): CacesQuestionOption {
  if (isCorrect) {
    return {
      id,
      text,
      rationale: "Alternativa de referencia en el banco importado.",
    };
  }

  return {
    id,
    text,
    rationale: "Distractor del banco importado.",
  };
}

const LETTERS: CacesOptionId[] = ["A", "B", "C", "D"];

export const CACES_IMPORTED_PDF_BANK: CacesQuestion[] = (rawImportedQuestions as RawImportedQuestion[]).map((item) => {
  const builtOptions = LETTERS.map((letter, idx) =>
    option(letter, String(item.options[idx] ?? ""), idx === 0)
  ) as [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption];

  return {
    id: item.id,
    component: item.category,
    subcomponent: resolveImportedSubcomponent(item),
    topic: normalizeImportedTopic(item),
    category: item.category,
    type: item.type,
    question: item.question,
    options: builtOptions,
    correctAnswer: "A",
    explanation:
      "Pregunta importada desde banco PDF CACES; se mantiene la alternativa de referencia del documento fuente.",
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
  .map((item, idx) => {
    const builtOptions = LETTERS.map((letter, optionIdx) =>
      option(letter, String(item.options[optionIdx] ?? ""), optionIdx === 0)
    ) as [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption];

    return {
      id: `${item.id}-gss`,
      component: GYNE_CATEGORY,
      subcomponent: SCORE_MAMA_2025_SUBCOMPONENT,
      topic: `Score MAMÁ 2025 - ${cleanTopicLabel(normalizeImportedTopic(item))}`,
      category: GYNE_CATEGORY,
      type: item.type,
      question: buildGyneQuestionStem(item, idx + 1),
      options: builtOptions,
      correctAnswer: "A",
      explanation:
        "Pregunta derivada del protocolo oficial Score MAMÁ 2025, reubicada para práctica focalizada en ginecología y salud sexual.",
      difficulty: item.difficulty,
      tags: [...new Set([...(item.tags ?? []), "score_mama_2025", "ginecologia_salud_sexual"])],
      references: [SCORE_MAMA_2025_REFERENCE],
    };
  });
