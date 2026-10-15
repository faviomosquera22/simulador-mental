import imported from "./data/ecotecQuestions.json";
import type { CacesQuestion, CacesOptionId } from "./types";

export const CACES_STUDY_COMPONENTS = [
  { id: 1, label: "Cuidado y procedimientos clínicos de enfermería", summary: "Fundamentos, procedimientos y seguridad del cuidado." },
  { id: 2, label: "Mujer, recién nacido, niño y adolescente", summary: "Cuidado materno, neonatal, pediátrico y adolescente." },
  { id: 3, label: "Adulto y adulto mayor", summary: "Valoración y cuidado de personas adultas y mayores." },
  { id: 4, label: "Cuidado familiar, comunitario e intercultural", summary: "Familia, comunidad, promoción y prevención." },
  { id: 5, label: "Bases educativas, administrativas, investigativas y epidemiológicas", summary: "Educación, gestión, investigación y epidemiología." },
] as const;
export const CACES_ECOTEC_CATEGORIES = CACES_STUDY_COMPONENTS.map(component => component.label);
const letters: CacesOptionId[] = ["A", "B", "C", "D"];
export const CACES_ECOTEC_QUESTION_BANK: CacesQuestion[] = imported.map(item => {
  const category = CACES_STUDY_COMPONENTS[item.component - 1].label;
  const answer = item.correctAnswer as CacesOptionId;
  return {
    id: `ecotec-${item.sourceId}`,
    sourceGroup: `ecotec-${item.contentKey}`,
    component: category, category,
    subcomponent: "Banco Ecotec",
    topic: item.sourceLabel,
    question: item.question,
    options: item.options.map((text, index) => ({ id: letters[index], text, rationale: letters[index] === answer ? `La clave del banco de origen marca la alternativa ${answer}.` : "Esta alternativa no coincide con la clave importada del banco de origen." })) as CacesQuestion["options"],
    correctAnswer: answer,
    explanation: item.explanation || `La clave explícita del banco de origen es ${answer}.`,
    difficulty: "intermedia", // Compatibility field; the source has no comparable difficulty scale.
    type: /\b(paciente|gestante|puérpera|puerpera|acude|ingresa)\b/i.test(item.question) ? "caso_clinico" : "directa",
    tags: ["ecotec_local", `componente_${item.component}`, "dificultad_no_clasificada"],
    source: { bank: "Ecotec", id: item.sourceId, file: item.sourceFile, label: item.sourceLabel },
    ...("image" in item && item.image ? { image: item.image } : {}),
    references: [`Banco local CACES Ecotec · ${item.sourceFile} · ${item.sourceId}`],
  };
});
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
function fullQuestionKey(question: CacesQuestion) {
  return `${normalize(question.question)}|${question.options.map(option => normalize(option.text)).sort().join("|")}`;
}
export function mergeEcotecQuestionBank(additional: CacesQuestion[] = []) {
  const seen = new Set(CACES_ECOTEC_QUESTION_BANK.map(fullQuestionKey));
  const accepted: CacesQuestion[] = [];
  for (const question of additional) {
    const category = question.category === "Fundamentos del cuidado enfermero" ? CACES_STUDY_COMPONENTS[0].label : question.category;
    if (!CACES_ECOTEC_CATEGORIES.some(allowed => allowed === category)) continue;
    const key = fullQuestionKey(question);
    if (seen.has(key)) continue;
    seen.add(key);
    accepted.push({ ...question, category, component: category });
  }
  return [...CACES_ECOTEC_QUESTION_BANK, ...accepted];
}
