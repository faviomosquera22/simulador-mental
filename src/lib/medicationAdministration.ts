export type MedicationMode = "practice" | "evaluation";

export type MedicationDifficulty = "basic" | "intermediate" | "advanced";

export type MedicationCategory =
  | "antibiotics"
  | "insulin"
  | "cardiovascular"
  | "electrolytes"
  | "anticoagulation"
  | "emergency";

export type MedicationDecision = "administer" | "hold" | "clarify";

export type MedicationSafetyCheckId =
  | "patient"
  | "medication"
  | "dose"
  | "route"
  | "time"
  | "allergy"
  | "dilution"
  | "infusion_rate"
  | "renal_function"
  | "contraindication";

export type MedicationPatient = {
  name: string;
  age: number;
  sex: "female" | "male" | "unspecified";
  weightKg?: number;
  allergies: string[];
  diagnoses: string[];
  alerts?: string[];
};

export type MedicationOrder = {
  medication: string;
  doseLabel: string;
  route: string;
  schedule: string;
  presentation: string;
  indication: string;
  dilution?: string;
  infusionRate?: string;
  volumePrompt?: string;
};

export type MedicationCase = {
  id: string;
  name: string;
  category: MedicationCategory;
  difficulty: MedicationDifficulty;
  patient: MedicationPatient;
  context: string;
  order: MedicationOrder;
  correctDecision: MedicationDecision;
  correctRoute: string;
  correctVolumeMl?: number;
  volumeToleranceMl?: number;
  expectedSafetyChecks: MedicationSafetyCheckId[];
  correctExplanation: string;
  explanationKeywords: string[];
  commonErrors: string[];
};

export type MedicationInput = {
  decision: MedicationDecision | "";
  route: string;
  volumeMl: string;
  selectedChecks: MedicationSafetyCheckId[];
  justification: string;
};

export type MedicationEvaluation = {
  totalScore: number;
  rubric: {
    decision: number;
    route: number;
    volume: number;
    safety: number;
    justification: number;
  };
  outcome: "excellent" | "good" | "partial" | "unsafe";
  feedback: {
    decision: string;
    route: string;
    volume: string;
    safety: string;
    justification: string;
    summary: string;
  };
};

export const MEDICATION_SAFETY_CHECKS: Array<{ id: MedicationSafetyCheckId; label: string }> = [
  { id: "patient", label: "Paciente correcto" },
  { id: "medication", label: "Medicamento correcto" },
  { id: "dose", label: "Dosis correcta" },
  { id: "route", label: "Vía correcta" },
  { id: "time", label: "Hora correcta" },
  { id: "allergy", label: "Verificar alergias" },
  { id: "dilution", label: "Verificar dilución" },
  { id: "infusion_rate", label: "Verificar velocidad de infusión" },
  { id: "renal_function", label: "Revisar función renal" },
  { id: "contraindication", label: "Buscar contraindicación" },
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumericInput(value: string) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function overlapScore(answer: string, keywords: string[], maxScore: number) {
  const normalized = normalizeText(answer);
  const hits = keywords.filter((keyword) => normalized.includes(normalizeText(keyword))).length;
  if (hits >= 3) return maxScore;
  if (hits >= 2) return Math.round(maxScore * 0.7);
  if (hits >= 1) return Math.round(maxScore * 0.4);
  return 0;
}

export function medicationDifficultyLabel(value: MedicationDifficulty) {
  if (value === "basic") return "Básico";
  if (value === "intermediate") return "Intermedio";
  return "Avanzado";
}

export function medicationCategoryLabel(value: MedicationCategory) {
  if (value === "antibiotics") return "Antibióticos";
  if (value === "insulin") return "Insulina";
  if (value === "cardiovascular") return "Cardiovascular";
  if (value === "electrolytes") return "Electrolitos";
  if (value === "anticoagulation") return "Anticoagulación";
  return "Urgencias";
}

export function medicationDecisionLabel(value: MedicationDecision) {
  if (value === "administer") return "Administrar";
  if (value === "hold") return "Retener";
  return "Aclarar antes de administrar";
}

export const MEDICATION_LIBRARY: MedicationCase[] = [
  {
    id: "ceftriaxone_iv_safe",
    name: "Antibiótico IV sin alertas mayores",
    category: "antibiotics",
    difficulty: "basic",
    patient: {
      name: "Daniela C.",
      age: 45,
      sex: "female",
      allergies: [],
      diagnoses: ["Neumonía adquirida en la comunidad"],
    },
    context: "Paciente hospitalizada con orden de ceftriaxona 1 g IV cada 24 h.",
    order: {
      medication: "Ceftriaxona",
      doseLabel: "1 g",
      route: "IV",
      schedule: "Ahora",
      presentation: "Vial 1 g reconstituido en 10 mL",
      indication: "Cobertura antibiótica inicial",
      dilution: "Diluir según protocolo institucional para administrar IV",
      volumePrompt: "¿Cuántos mL corresponden a 1 g?",
    },
    correctDecision: "administer",
    correctRoute: "IV",
    correctVolumeMl: 10,
    volumeToleranceMl: 0.2,
    expectedSafetyChecks: ["patient", "medication", "dose", "route", "time", "allergy", "dilution"],
    correctExplanation: "La orden es consistente con la indicación y no hay alergias ni contraindicaciones inmediatas.",
    explanationKeywords: ["alergia", "dilucion", "antibiotico", "orden correcta", "via iv"],
    commonErrors: ["Administrar sin verificar reconstitución y dilución."],
  },
  {
    id: "insulin_sc_calculation",
    name: "Insulina regular subcutánea",
    category: "insulin",
    difficulty: "basic",
    patient: {
      name: "Mauricio R.",
      age: 52,
      sex: "male",
      diagnoses: ["Hiperglucemia"],
      allergies: [],
    },
    context: "Control glucémico con indicación de 10 U de insulina regular subcutánea.",
    order: {
      medication: "Insulina regular",
      doseLabel: "10 U",
      route: "SC",
      schedule: "Ahora",
      presentation: "Frasco 100 U/mL",
      indication: "Corrección de hiperglucemia",
      volumePrompt: "¿Qué volumen en mL corresponde a 10 U?",
    },
    correctDecision: "administer",
    correctRoute: "SC",
    correctVolumeMl: 0.1,
    volumeToleranceMl: 0.02,
    expectedSafetyChecks: ["patient", "medication", "dose", "route", "time"],
    correctExplanation: "La dosis está indicada y requiere verificación precisa del volumen por concentración.",
    explanationKeywords: ["volumen", "insulina", "concentracion", "subcutanea", "dosis"],
    commonErrors: ["Confundir 10 U con 1 mL."],
  },
  {
    id: "potassium_iv_push",
    name: "Potasio prescrito de forma insegura",
    category: "electrolytes",
    difficulty: "intermediate",
    patient: {
      name: "Marta V.",
      age: 61,
      sex: "female",
      diagnoses: ["Hipopotasemia"],
      allergies: [],
      alerts: ["Medicamento de alto riesgo"],
    },
    context: "Se recibe una indicación verbal de cloruro de potasio IV en bolo directo.",
    order: {
      medication: "Cloruro de potasio",
      doseLabel: "20 mEq",
      route: "IV push",
      schedule: "Inmediato",
      presentation: "Ampolla 10 mEq / 5 mL",
      indication: "Corrección rápida de potasio",
      infusionRate: "No administrar IV push",
    },
    correctDecision: "hold",
    correctRoute: "No administrar",
    expectedSafetyChecks: ["patient", "medication", "dose", "route", "contraindication", "dilution", "infusion_rate"],
    correctExplanation: "El potasio no debe administrarse en bolo IV directo; requiere dilución y velocidad controlada.",
    explanationKeywords: ["alto riesgo", "no iv push", "dilucion", "velocidad", "seguridad"],
    commonErrors: ["Aceptar una administración IV directa de potasio."],
  },
  {
    id: "ampicillin_allergy",
    name: "Alergia relevante al medicamento indicado",
    category: "antibiotics",
    difficulty: "intermediate",
    patient: {
      name: "Elisa P.",
      age: 28,
      sex: "female",
      diagnoses: ["Infección urinaria"],
      allergies: ["Penicilina"],
    },
    context: "La paciente tiene antecedente claro de alergia a penicilina y orden de ampicilina.",
    order: {
      medication: "Ampicilina",
      doseLabel: "1 g",
      route: "IV",
      schedule: "Ahora",
      presentation: "Vial 1 g",
      indication: "Cobertura antibiótica",
    },
    correctDecision: "hold",
    correctRoute: "No administrar",
    expectedSafetyChecks: ["patient", "medication", "dose", "route", "time", "allergy", "contraindication"],
    correctExplanation: "La alergia reportada obliga a detener y aclarar la orden antes de administrar.",
    explanationKeywords: ["alergia", "penicilina", "no administrar", "clarificar", "seguridad"],
    commonErrors: ["Administrar solo porque la dosis y la vía coinciden."],
  },
  {
    id: "metoprolol_bradycardia",
    name: "Betabloqueador con bradicardia",
    category: "cardiovascular",
    difficulty: "intermediate",
    patient: {
      name: "Sergio T.",
      age: 70,
      sex: "male",
      diagnoses: ["HTA", "Insuficiencia cardíaca"],
      allergies: [],
      alerts: ["FC actual 48 lpm", "PA 92/58 mmHg"],
    },
    context: "Paciente con bradicardia e hipotensión previa a medicación programada.",
    order: {
      medication: "Metoprolol",
      doseLabel: "50 mg",
      route: "VO",
      schedule: "Dosis programada 08:00",
      presentation: "Tableta 50 mg",
      indication: "Control cardiovascular",
    },
    correctDecision: "hold",
    correctRoute: "VO",
    expectedSafetyChecks: ["patient", "medication", "dose", "route", "time", "contraindication"],
    correctExplanation: "Con bradicardia e hipotensión, la administración debe reevaluarse y reportarse antes de continuar.",
    explanationKeywords: ["bradicardia", "hipotension", "reevaluar", "retener", "reportar"],
    commonErrors: ["Administrar sin revisar signos vitales previos."],
  },
  {
    id: "enoxaparin_safe",
    name: "Profilaxis anticoagulante subcutánea",
    category: "anticoagulation",
    difficulty: "basic",
    patient: {
      name: "Claudia N.",
      age: 59,
      sex: "female",
      diagnoses: ["Postoperatorio", "Riesgo trombótico"],
      allergies: [],
    },
    context: "Profilaxis antitrombótica programada sin sangrado activo.",
    order: {
      medication: "Enoxaparina",
      doseLabel: "40 mg",
      route: "SC",
      schedule: "21:00",
      presentation: "Jeringa prellenada 40 mg/0.4 mL",
      indication: "Profilaxis tromboembólica",
      volumePrompt: "¿Qué volumen corresponde a la dosis indicada?",
    },
    correctDecision: "administer",
    correctRoute: "SC",
    correctVolumeMl: 0.4,
    volumeToleranceMl: 0.03,
    expectedSafetyChecks: ["patient", "medication", "dose", "route", "time"],
    correctExplanation: "La orden es estándar y la presentación coincide con la dosis indicada.",
    explanationKeywords: ["profilaxis", "subcutanea", "dosis correcta", "presentacion", "segura"],
    commonErrors: ["Cambiar innecesariamente el volumen de una jeringa prellenada."],
  },
];

export function evaluateMedicationCase(args: {
  caseSet: MedicationCase;
  input: MedicationInput;
}): MedicationEvaluation {
  const { caseSet, input } = args;
  const decisionScore = input.decision === caseSet.correctDecision ? 25 : 0;
  const routeScore = normalizeText(input.route) === normalizeText(caseSet.correctRoute) ? 15 : 0;

  let volumeScore = 20;
  if (typeof caseSet.correctVolumeMl === "number") {
    const parsed = parseNumericInput(input.volumeMl);
    if (parsed == null) {
      volumeScore = 0;
    } else {
      const tolerance = caseSet.volumeToleranceMl ?? 0.05;
      volumeScore = Math.abs(parsed - caseSet.correctVolumeMl) <= tolerance ? 20 : 0;
    }
  }

  const expected = caseSet.expectedSafetyChecks;
  const selectedHits = expected.filter((item) => input.selectedChecks.includes(item)).length;
  const safetyScore = expected.length ? Math.round((selectedHits / expected.length) * 25) : 25;
  const justificationScore = overlapScore(input.justification, caseSet.explanationKeywords, 15);
  const totalScore = decisionScore + routeScore + volumeScore + safetyScore + justificationScore;

  const outcome =
    totalScore >= 85
      ? "excellent"
      : totalScore >= 70
      ? "good"
      : totalScore >= 45
      ? "partial"
      : "unsafe";

  return {
    totalScore,
    rubric: {
      decision: decisionScore,
      route: routeScore,
      volume: volumeScore,
      safety: safetyScore,
      justification: justificationScore,
    },
    outcome,
    feedback: {
      decision:
        decisionScore > 0
          ? "La decisión principal de administrar, retener o aclarar es adecuada."
          : `La decisión más segura era: ${medicationDecisionLabel(caseSet.correctDecision)}.`,
      route:
        routeScore > 0
          ? "La vía seleccionada coincide con la conducta segura esperada."
          : `La vía o conducta de administración esperada era: ${caseSet.correctRoute}.`,
      volume:
        volumeScore > 0
          ? "El cálculo o validación de volumen es correcto."
          : typeof caseSet.correctVolumeMl === "number"
          ? `El volumen esperado era ${caseSet.correctVolumeMl} mL.`
          : "En este caso el volumen no era el punto crítico.",
      safety:
        safetyScore >= 18
          ? "Verificaste la mayoría de controles de seguridad relevantes."
          : `Faltó cubrir controles clave: ${caseSet.expectedSafetyChecks.join(", ")}.`,
      justification:
        justificationScore >= 10
          ? "La justificación clínica es coherente."
          : `Integra esta lógica: ${caseSet.correctExplanation}`,
      summary:
        outcome === "excellent"
          ? "Administración segura y bien razonada."
          : outcome === "good"
          ? "Buena ejecución; todavía puedes afinar controles de seguridad."
          : outcome === "partial"
          ? "Hay razonamiento útil, pero persisten brechas en verificación o conducta."
          : "La propuesta no es segura. En administración de medicamentos, la seguridad básica no es negociable.",
    },
  };
}
