import { pickDeterministic } from "./caseExpansion";

export const ADVANCED_MODULE_LIBRARY_SIZE = 180;

export type AdvancedDifficulty = "basic" | "intermediate" | "advanced";

export type AdvancedMode = "practice" | "evaluation";

export type ModeCompatibility = AdvancedMode | "both";

export type AdvancedVitals = {
  hr: number;
  sbp: number;
  dbp: number;
  spo2: number;
  rr: number;
  temp: number;
};

export type AdvancedPatientProfile = {
  name: string;
  age: number;
  sex: "female" | "male" | "unspecified";
  chiefComplaint: string;
  weightKg?: number;
  gestationalAgeWeeks?: number;
  ageLabel?: string;
  setting?: string;
};

export type StepwiseAction = {
  id: string;
  label: string;
  score: number;
  feedback: string;
  impact?: string;
  revealsStudyIds?: string[];
  resultingRhythm?: string;
  resultingStatus?: string;
  vitalDelta?: Partial<AdvancedVitals>;
};

export type StepwiseStage = {
  id: string;
  title: string;
  prompt: string;
  actions: StepwiseAction[];
};

export type StepwiseEvaluation = {
  totalScore: number;
  maxScore: number;
  outcome: "excellent" | "good" | "partial" | "unsafe";
  summary: string;
  stageFeedback: Array<{
    stageTitle: string;
    actionLabel: string;
    feedback: string;
    score: number;
  }>;
};

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keywordScore(answer: string, keywords: string[], maxScore: number) {
  const normalized = normalizeText(answer);
  const hits = keywords.filter((keyword) => normalized.includes(normalizeText(keyword))).length;
  if (hits >= 3) return maxScore;
  if (hits >= 2) return Math.round(maxScore * 0.72);
  if (hits >= 1) return Math.round(maxScore * 0.44);
  return 0;
}

export function isModeCompatible(modeCompatibility: ModeCompatibility, mode: AdvancedMode) {
  return modeCompatibility === "both" || modeCompatibility === mode;
}

export function advancedDifficultyLabel(value: AdvancedDifficulty) {
  if (value === "basic") return "Básico";
  if (value === "intermediate") return "Intermedio";
  return "Avanzado";
}

export function applyAdvancedVitals(
  current: AdvancedVitals,
  delta?: Partial<AdvancedVitals>
): AdvancedVitals {
  if (!delta) return current;
  return {
    hr: clamp(current.hr + (delta.hr ?? 0), 0, 240),
    sbp: clamp(current.sbp + (delta.sbp ?? 0), 0, 240),
    dbp: clamp(current.dbp + (delta.dbp ?? 0), 0, 160),
    spo2: clamp(current.spo2 + (delta.spo2 ?? 0), 0, 100),
    rr: clamp(current.rr + (delta.rr ?? 0), 0, 80),
    temp: Number((current.temp + (delta.temp ?? 0)).toFixed(1)),
  };
}

export function evaluateStepwiseScenario(args: {
  stages: StepwiseStage[];
  selectedActionIds: string[];
  timedOut?: boolean;
  timeoutPenalty?: number;
  excellentSummary: string;
  goodSummary: string;
  partialSummary: string;
  unsafeSummary: string;
}): StepwiseEvaluation {
  const {
    stages,
    selectedActionIds,
    timedOut = false,
    timeoutPenalty = 0,
    excellentSummary,
    goodSummary,
    partialSummary,
    unsafeSummary,
  } = args;

  const stageFeedback = stages.map((stage, index) => {
    const selectedId = selectedActionIds[index];
    const action = stage.actions.find((item) => item.id === selectedId) ?? stage.actions[0];
    return {
      stageTitle: stage.title,
      actionLabel: action.label,
      feedback: action.feedback,
      score: selectedId ? action.score : 0,
    };
  });

  const maxScore = stages.reduce((acc, stage) => acc + Math.max(...stage.actions.map((action) => action.score)), 0);
  const totalScore = Math.max(0, stageFeedback.reduce((acc, item) => acc + item.score, 0) - (timedOut ? timeoutPenalty : 0));
  const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const outcome =
    pct >= 85
      ? "excellent"
      : pct >= 70
      ? "good"
      : pct >= 45
      ? "partial"
      : "unsafe";

  return {
    totalScore,
    maxScore,
    outcome,
    summary:
      outcome === "excellent"
        ? excellentSummary
        : outcome === "good"
        ? goodSummary
        : outcome === "partial"
        ? partialSummary
        : unsafeSummary,
    stageFeedback,
  };
}

export function sampleItem<T>(pool: T[]) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function pickDifficultyPool<T extends { difficulty: AdvancedDifficulty }>(
  pool: T[],
  difficulty: AdvancedDifficulty | "all"
) {
  if (difficulty === "all") return pool;
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  return filtered.length ? filtered : pool;
}

export function seededChoice<T>(items: T[], seed: number) {
  return pickDeterministic(items, seed);
}

export function formatAdvancedPressure(sbp: number, dbp: number) {
  if (sbp <= 0 || dbp <= 0) return "No detectable";
  return `${sbp}/${dbp} mmHg`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
