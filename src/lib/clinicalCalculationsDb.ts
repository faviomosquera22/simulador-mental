import { supabase } from "@/src/lib/supabaseClient";
import type {
  CalculationCategory,
  CalculationDifficulty,
  CalculationExerciseType,
  ClinicalCalculationExercise,
  CalculationTolerance,
} from "@/src/lib/clinicalCalculations";

type DbCalculationRow = {
  id: string;
  external_id: string;
  title: string;
  category: string;
  difficulty: string;
  exercise_type: string;
  statement: string;
  patient_data: unknown;
  answer_unit: string;
  formula: string;
  correct_answer: number;
  tolerance_kind: string;
  tolerance_value: number;
  hints: unknown;
  step_by_step: unknown;
  common_errors: unknown;
  is_active: boolean;
};

function isCategory(value: string): value is CalculationCategory {
  return (
    value === "dose_medication" ||
    value === "infusion_drip" ||
    value === "fluid_balance" ||
    value === "anthropometry"
  );
}

function isDifficulty(value: string): value is CalculationDifficulty {
  return value === "basic" || value === "intermediate" || value === "advanced";
}

function isExerciseType(value: string): value is CalculationExerciseType {
  return value === "single" || value === "mini_case" || value === "quick_test";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizePatientData(value: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const label = String(item?.label ?? "").trim();
      const val = String(item?.value ?? "").trim();
      if (!label || !val) return null;
      return { label, value: val };
    })
    .filter(Boolean) as Array<{ label: string; value: string }>;
}

function normalizeTolerance(kind: string, value: number): CalculationTolerance {
  if (kind === "percent") {
    return {
      kind: "percent",
      value: Number.isFinite(value) ? value : 2,
    };
  }

  return {
    kind: "absolute",
    value: Number.isFinite(value) ? value : 1,
  };
}

function mapRow(row: DbCalculationRow): ClinicalCalculationExercise | null {
  const category = String(row.category);
  const difficulty = String(row.difficulty);
  const exerciseType = String(row.exercise_type);

  if (!isCategory(category)) return null;
  if (!isDifficulty(difficulty)) return null;
  if (!isExerciseType(exerciseType)) return null;
  if (!Number.isFinite(Number(row.correct_answer))) return null;

  const patientData = normalizePatientData(row.patient_data);
  if (!patientData.length) return null;

  return {
    id: String(row.external_id || row.id),
    title: String(row.title),
    category,
    difficulty,
    type: exerciseType,
    statement: String(row.statement),
    patientData,
    answerUnit: String(row.answer_unit),
    formula: String(row.formula),
    correctAnswer: Number(row.correct_answer),
    tolerance: normalizeTolerance(String(row.tolerance_kind), Number(row.tolerance_value)),
    hints: normalizeStringArray(row.hints),
    stepByStep: normalizeStringArray(row.step_by_step),
    commonErrors: normalizeStringArray(row.common_errors),
  };
}

export async function fetchClinicalExercisesFromDb(args?: {
  category?: CalculationCategory | "all";
  difficulty?: CalculationDifficulty | "all";
  limit?: number;
}) {
  const category = args?.category ?? "all";
  const difficulty = args?.difficulty ?? "all";
  const limit = Math.max(1, Math.min(3000, args?.limit ?? 2500));

  let query = supabase
    .from("clinical_calculation_exercises")
    .select(
      "id, external_id, title, category, difficulty, exercise_type, statement, patient_data, answer_unit, formula, correct_answer, tolerance_kind, tolerance_value, hints, step_by_step, common_errors, is_active"
    )
    .eq("is_active", true)
    .limit(limit);

  if (category !== "all") {
    query = query.eq("category", category);
  }

  if (difficulty !== "all") {
    query = query.eq("difficulty", difficulty);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Error al obtener ejercicios de cálculo clínico.");
  }

  const rows = Array.isArray(data) ? (data as DbCalculationRow[]) : [];
  return rows.map(mapRow).filter(Boolean) as ClinicalCalculationExercise[];
}
