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
