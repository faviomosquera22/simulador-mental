import { supabase } from "@/src/lib/supabaseClient";
import type {
  LabCaseSet,
  LabCategory,
  LabClinicalContext,
  LabDifficulty,
  LabPanel,
  LabParameter,
  LabStatus,
} from "@/src/lib/laboratoryModule";

type DbLabRow = {
  id: string;
  external_id: string;
  name: string;
  context: string;
  difficulty: string;
  patient: unknown;
  panels: unknown;
  main_finding: string;
  interpretation_expected: string;
  suggested_action: string;
  educational_explanation: string;
  expected_altered_ids: unknown;
  suspicion_keywords: unknown;
  action_keywords: unknown;
  is_active: boolean;
};

function isStatus(value: string): value is LabStatus {
  return value === "low" || value === "normal" || value === "high";
}

function isCategory(value: string): value is LabCategory {
  return (
    value === "hemograma" ||
    value === "quimica_basica" ||
    value === "electrolitos" ||
    value === "orina" ||
    value === "inflamatorio" ||
    value === "hepatico"
  );
}

function isDifficulty(value: string): value is LabDifficulty {
  return value === "basic" || value === "intermediate" || value === "advanced";
}

function isContext(value: string): value is LabClinicalContext {
  return (
    value === "infection" ||
    value === "renal" ||
    value === "anemia" ||
    value === "metabolic" ||
    value === "urinary" ||
    value === "hepatobiliary" ||
    value === "chest_pain" ||
    value === "general"
  );
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item)).filter(Boolean);
}

function normalizePatient(value: unknown): LabCaseSet["patient"] | null {
  const item = value as Record<string, unknown>;
  if (!item || typeof item !== "object") return null;

  const name = String(item.name ?? "").trim();
  const age = Number(item.age ?? NaN);
  const sexRaw = String(item.sex ?? "unspecified").toLowerCase();
  const complaint = String(item.chiefComplaint ?? item.chief_complaint ?? "").trim();

  if (!name || !Number.isFinite(age) || !complaint) return null;

  const sex: LabCaseSet["patient"]["sex"] =
    sexRaw === "female" || sexRaw === "male" ? sexRaw : "unspecified";

  return {
    name,
    age: Math.max(1, Math.round(age)),
    sex,
    chiefComplaint: complaint,
  };
}

function normalizeParameter(value: unknown): LabParameter | null {
  const item = value as Record<string, unknown>;
  if (!item || typeof item !== "object") return null;

  const id = String(item.id ?? "").trim();
  const name = String(item.name ?? "").trim();
  const category = String(item.category ?? "").trim();
  const status = String(item.status ?? "").trim();
  const unit = String(item.unit ?? "").trim();
  const referenceRange = String(item.referenceRange ?? item.reference_range ?? "").trim();
  const interpretationHint = String(item.interpretationHint ?? item.interpretation_hint ?? "").trim();
  const rawValue = item.value;

  if (!id || !name || !isCategory(category) || !isStatus(status) || !referenceRange) {
    return null;
  }

  const valueNormalized =
    typeof rawValue === "number" || typeof rawValue === "string"
      ? rawValue
      : String(rawValue ?? "").trim();

  return {
    id,
    name,
    category,
    value: valueNormalized,
    unit,
    referenceRange,
    status,
    interpretationHint,
  };
}

function normalizePanels(value: unknown): LabPanel[] {
  if (!Array.isArray(value)) return [];
  const panels = value
    .map((panelEntry) => {
      const panel = panelEntry as Record<string, unknown>;
      if (!panel || typeof panel !== "object") return null;

      const id = String(panel.id ?? "").trim();
      const name = String(panel.name ?? "").trim();
      if (!id || !name) return null;

      const rawParams = Array.isArray(panel.parameters) ? panel.parameters : [];
      const parameters = rawParams.map(normalizeParameter).filter(Boolean) as LabParameter[];
      if (!parameters.length) return null;

      return {
        id,
        name,
        parameters,
      };
    })
    .filter(Boolean) as LabPanel[];

  return panels;
}

function mapRow(row: DbLabRow): LabCaseSet | null {
  const context = String(row.context);
  const difficulty = String(row.difficulty);
  if (!isContext(context) || !isDifficulty(difficulty)) return null;

  const patient = normalizePatient(row.patient);
  if (!patient) return null;

  const panels = normalizePanels(row.panels);
  if (!panels.length) return null;

  const expectedAlteredIds = normalizeStringArray(row.expected_altered_ids);
  const suspicionKeywords = normalizeStringArray(row.suspicion_keywords);
  const actionKeywords = normalizeStringArray(row.action_keywords);

  return {
    id: String(row.external_id || row.id),
    name: String(row.name),
    context,
    difficulty,
    patient,
    panels,
    mainFinding: String(row.main_finding),
    interpretationExpected: String(row.interpretation_expected),
    suggestedAction: String(row.suggested_action),
    educationalExplanation: String(row.educational_explanation),
    expectedAlteredIds,
    suspicionKeywords,
    actionKeywords,
  };
}

export async function fetchLaboratoryCasesFromDb(limit = 1200) {
  const safeLimit = Math.max(1, Math.min(5000, limit));
  const { data, error } = await supabase
    .from("clinical_laboratory_cases")
    .select(
      "id, external_id, name, context, difficulty, patient, panels, main_finding, interpretation_expected, suggested_action, educational_explanation, expected_altered_ids, suspicion_keywords, action_keywords, is_active"
    )
    .eq("is_active", true)
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message || "Error al cargar casos de laboratorio desde base de datos.");
  }

  const rows = Array.isArray(data) ? (data as DbLabRow[]) : [];
  return rows.map(mapRow).filter(Boolean) as LabCaseSet[];
}
