import { getWoundCaseById } from "@/src/lib/wound-care/cases";
import {
  type WoundAssessmentState,
  type WoundCaseData,
  type WoundClassificationState,
  type WoundCompetencyKey,
  type WoundDocumentationState,
  type WoundEvaluationResult,
  type WoundFlowStep,
  type WoundModuleMode,
  type WoundPreventionState,
  type WoundProcedureState,
  type WoundSimulationSession,
  WOUND_COMPETENCY_LABELS,
} from "@/src/lib/wound-care/types";

export const WOUND_FLOW_STEPS: Array<{ id: WoundFlowStep; label: string }> = [
  { id: "summary", label: "Resumen" },
  { id: "assessment", label: "Valorar" },
  { id: "classification", label: "Clasificar" },
  { id: "procedure", label: "Intervenir" },
  { id: "prevention", label: "Prevenir" },
  { id: "documentation", label: "Documentar" },
  { id: "results", label: "Evaluar evolución" },
];

export function createEmptyAssessment(caseData: WoundCaseData): WoundAssessmentState {
  return {
    reviewedDomains: [],
    selectedRiskFactors: [],
    selectedAlerts: [],
    hotspotFindings: [],
    bradenInterpretation: caseData.patient.braden?.interpretation ?? "",
    riskSummary: "",
    location: caseData.wound.location,
    lengthCm: String(caseData.wound.lengthCm),
    widthCm: String(caseData.wound.widthCm),
    depthCm: String(caseData.wound.depthCm),
    edges: "",
    tissue: "",
    exudate: "",
    odor: "",
    periwoundSkin: "",
    pain: "",
    infectionSigns: [],
    hasSlough: caseData.wound.hasSlough,
    hasNecrosis: caseData.wound.hasNecrosis,
  };
}

export function createEmptyClassification(): WoundClassificationState {
  return {
    stage: "",
    justification: "",
    differentialChecked: false,
  };
}

export function createEmptyProcedure(): WoundProcedureState {
  return {
    selectedMaterialIds: [],
    selectedSequence: [],
    tutorMessages: [],
  };
}

export function createEmptyPrevention(): WoundPreventionState {
  return {
    selectedMeasures: [],
    followUpPlan: "",
  };
}

export function createEmptyDocumentation(caseData: WoundCaseData): WoundDocumentationState {
  return {
    location: caseData.wound.location,
    classification: "",
    woundBed: "",
    exudate: "",
    odor: "",
    pain: "",
    intervention: "",
    dressing: "",
    patientResponse: "",
    followUpPlan: "",
  };
}

export function createWoundSession(caseId: string, mode: WoundModuleMode): WoundSimulationSession | null {
  const caseData = getWoundCaseById(caseId);
  if (!caseData) return null;

  const startedAt = new Date().toISOString();

  return {
    sessionId: `wound-${caseId}-${mode}-${Date.now()}`,
    caseId,
    mode,
    startedAt,
    updatedAt: startedAt,
    currentStep: "summary",
    assessment: createEmptyAssessment(caseData),
    classification: createEmptyClassification(),
    procedure: createEmptyProcedure(),
    prevention: createEmptyPrevention(),
    documentation: createEmptyDocumentation(caseData),
  };
}

function uniq<T>(items: T[]) {
  return Array.from(new Set(items));
}

function clamp(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function scoreOverlap(expected: string[], actual: string[]) {
  if (!expected.length) return 100;
  const actualSet = new Set(actual);
  const hits = expected.filter((item) => actualSet.has(item)).length;
  return clamp((hits / expected.length) * 100);
}

function scoreDimensions(caseData: WoundCaseData, assessment: WoundAssessmentState) {
  const targets = [caseData.wound.lengthCm, caseData.wound.widthCm, caseData.wound.depthCm];
  const actual = [toNumber(assessment.lengthCm), toNumber(assessment.widthCm), toNumber(assessment.depthCm)];
  let score = 0;

  for (let index = 0; index < targets.length; index += 1) {
    const diff = Math.abs((actual[index] ?? NaN) - targets[index]);
    if (Number.isNaN(diff)) continue;
    if (diff <= 0.2) score += 34;
    else if (diff <= 0.5) score += 20;
  }

  return clamp(score);
}

function scoreAssessment(caseData: WoundCaseData, assessment: WoundAssessmentState) {
  const domains = scoreOverlap(caseData.expected.reviewedDomains, uniq(assessment.reviewedDomains));
  const risks = scoreOverlap(caseData.expected.riskFactors, uniq(assessment.selectedRiskFactors));
  const alerts = caseData.expected.priorityAlerts.length
    ? scoreOverlap(caseData.expected.priorityAlerts, uniq(assessment.selectedAlerts))
    : 100;
  const hotspots = caseData.wound.hotspots.length
    ? scoreOverlap(
        caseData.wound.hotspots.map((hotspot) => hotspot.id),
        uniq(assessment.hotspotFindings)
      )
    : 100;

  const woundFields = clamp(
    (assessment.location.trim().toLowerCase() === caseData.wound.location.toLowerCase() ? 10 : 0) +
      (assessment.edges === normalizeChoiceId(caseData.wound.edges) ? 10 : 0) +
      (assessment.tissue === normalizeChoiceId(caseData.wound.tissue) ? 15 : 0) +
      (assessment.exudate === normalizeChoiceId(caseData.wound.exudate) ? 10 : 0) +
      (assessment.odor === normalizeChoiceId(caseData.wound.odor) ? 8 : 0) +
      (assessment.periwoundSkin === normalizeChoiceId(caseData.wound.periwoundSkin) ? 10 : 0) +
      (assessment.pain === normalizeChoiceId(caseData.wound.pain) ? 8 : 0) +
      scoreOverlap(
        caseData.wound.infectionSigns.map(normalizeChoiceId),
        uniq(assessment.infectionSigns)
      ) *
        0.12 +
      (assessment.hasSlough === caseData.wound.hasSlough ? 7 : 0) +
      (assessment.hasNecrosis === caseData.wound.hasNecrosis ? 5 : 0) +
      scoreDimensions(caseData, assessment) * 0.15
  );

  return {
    integralAssessment: clamp(domains * 0.5 + risks * 0.35 + alerts * 0.15),
    woundAssessment: clamp(woundFields * 0.7 + hotspots * 0.15 + scoreDimensions(caseData, assessment) * 0.15),
    missingAlerts: caseData.expected.priorityAlerts.filter((alert) => !assessment.selectedAlerts.includes(alert)),
  };
}

function normalizeChoiceId(label: string) {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("integros") || normalized.includes("intacta")) return normalized.includes("eritema") ? "intact-erythema" : "intact";
  if (normalized.includes("macerad")) return "macerated";
  if (normalized.includes("enroll")) return "rolled";
  if (normalized.includes("irregular")) return "irregular";
  if (normalized.includes("rosado") || normalized.includes("rojo")) return "pink-red";
  if (normalized.includes("granulacion")) return "granulation-slough";
  if (normalized.includes("esfacelos") || normalized.includes("necrosis")) return "slough-necrosis";
  if (normalized.includes("nulo")) return "none";
  if (normalized.includes("escaso")) return "scant";
  if (normalized.includes("moderado")) return "moderate";
  if (normalized.includes("abundante")) return "high";
  if (normalized.includes("sin olor")) return "none";
  if (normalized.includes("leve")) return "mild";
  if (normalized.includes("fetido")) return "foul";
  if (normalized.includes("eritematosa")) return "erythematous";
  if (normalized.includes("fragil")) return "fragile";
  if (normalized.includes("dolor moderado")) return "moderate";
  if (normalized.includes("dolor intenso")) return "severe";
  if (normalized.includes("dolor leve")) return "mild";
  if (normalized.includes("sin dolor")) return "none";
  if (normalized.includes("eritema progresivo")) return "erythema";
  if (normalized.includes("temperatura local")) return "heat";
  if (normalized.includes("purulento")) return "purulence";
  if (normalized.includes("olor persistente")) return "odor";
  if (normalized.includes("sin signos")) return "none";
  return normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function scoreClassification(caseData: WoundCaseData, classification: WoundClassificationState) {
  const isCorrect = classification.stage === caseData.wound.stage;
  const justification = normalizeLoose(classification.justification);
  const keywordHits = caseData.expected.classificationKeywords.filter((keyword) =>
    justification.includes(normalizeLoose(keyword))
  ).length;

  return clamp((isCorrect ? 75 : 20) + Math.min(25, keywordHits * 8) + (classification.justification.trim().length >= 30 ? 5 : 0));
}

function normalizeLoose(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function scoreMaterials(caseData: WoundCaseData, procedure: WoundProcedureState) {
  const selected = uniq(procedure.selectedMaterialIds);
  const expectedScore = scoreOverlap(caseData.expected.materialIds, selected);
  const penalties = caseData.expected.inappropriateMaterialIds.filter((item) => selected.includes(item)).length * 18;
  return clamp(expectedScore - penalties);
}

function scoreProcedure(caseData: WoundCaseData, procedure: WoundProcedureState) {
  const expected = caseData.expected.procedureSequence;
  const sequence = procedure.selectedSequence;
  let score = 0;

  expected.forEach((stepId, index) => {
    if (sequence[index] === stepId) {
      score += 8;
      return;
    }

    if (sequence.includes(stepId)) {
      score += 4;
    }
  });

  return clamp((score / (expected.length * 8)) * 100);
}

function scorePrevention(caseData: WoundCaseData, prevention: WoundPreventionState) {
  const selected = uniq(prevention.selectedMeasures);
  const overlap = scoreOverlap(caseData.expected.preventionIds, selected);
  const followUp = prevention.followUpPlan.trim().length >= 30 ? 10 : 0;
  return clamp(overlap * 0.9 + followUp);
}

function scoreDocumentation(caseData: WoundCaseData, documentation: WoundDocumentationState) {
  const checklistHits = caseData.expected.documentationChecklist.filter((field) => documentation[field].trim().length > 0).length;
  const completeness = (checklistHits / caseData.expected.documentationChecklist.length) * 70;
  let coherence = 0;

  if (documentation.location.trim().toLowerCase() === caseData.wound.location.toLowerCase()) coherence += 10;
  if (documentation.classification === caseData.wound.stage) coherence += 15;
  if (documentation.woundBed === normalizeChoiceId(caseData.wound.tissue)) coherence += 10;
  if (documentation.dressing.trim().length > 0) coherence += 5;

  return clamp(completeness + coherence);
}

function buildCriticalErrors(caseData: WoundCaseData, session: WoundSimulationSession) {
  const errors: string[] = [];
  const sequence = session.procedure.selectedSequence;
  const selectedMaterials = session.procedure.selectedMaterialIds;

  if (sequence[0] !== "hand-hygiene-start") errors.push("Omitió higiene de manos al inicio");
  if (session.classification.stage !== caseData.wound.stage) errors.push("Mala clasificación de la lesión");
  if (caseData.expected.inappropriateMaterialIds.some((id) => selectedMaterials.includes(id))) {
    errors.push("Seleccionó material claramente inadecuado");
  }
  if (caseData.expected.priorityAlerts.length && !caseData.expected.priorityAlerts.some((id) => session.assessment.selectedAlerts.includes(id))) {
    errors.push("No valoró signos de alarma relevantes");
  }
  if (!caseData.expected.preventionIds.some((id) => session.prevention.selectedMeasures.includes(id))) {
    errors.push("No incluyó medidas preventivas");
  }
  if (!session.documentation.intervention.trim() || !session.documentation.followUpPlan.trim()) {
    errors.push("No documentó la atención de forma suficiente");
  }

  return uniq(errors);
}

function competencyFeedback(score: number, success: string, warning: string) {
  return score >= 85 ? success : warning;
}

export function evaluateWoundSession(session: WoundSimulationSession): WoundEvaluationResult | null {
  const caseData = getWoundCaseById(session.caseId);
  if (!caseData) return null;

  const assessmentScores = scoreAssessment(caseData, session.assessment);
  const competencies: Record<WoundCompetencyKey, number> = {
    integralAssessment: assessmentScores.integralAssessment,
    woundAssessment: assessmentScores.woundAssessment,
    classification: scoreClassification(caseData, session.classification),
    materials: scoreMaterials(caseData, session.procedure),
    procedure: scoreProcedure(caseData, session.procedure),
    prevention: scorePrevention(caseData, session.prevention),
    documentation: scoreDocumentation(caseData, session.documentation),
  };

  const criticalErrors = buildCriticalErrors(caseData, session);
  const weightedAverage =
    Object.values(competencies).reduce((sum, value) => sum + value, 0) / Object.values(competencies).length;
  const penalty = criticalErrors.length * 7;
  const overallScore = clamp(weightedAverage - penalty);

  const competencyResults = (Object.entries(competencies) as Array<[WoundCompetencyKey, number]>).map(([key, score]) => ({
    key,
    label: WOUND_COMPETENCY_LABELS[key],
    score,
    feedback:
      key === "integralAssessment"
        ? competencyFeedback(score, "Valoraste los factores sistémicos clave antes de intervenir.", "La valoración global quedó corta; faltó integrar contexto, riesgo y señales de alerta.")
        : key === "woundAssessment"
        ? competencyFeedback(score, "Describiste la herida con datos útiles para seguimiento clínico.", "La descripción local fue incompleta o poco precisa para monitorear evolución.")
        : key === "classification"
        ? competencyFeedback(score, "La clasificación es consistente con los hallazgos observados.", "La clasificación no se sostiene del todo con los hallazgos aportados.")
        : key === "materials"
        ? competencyFeedback(score, "La bandeja clínica se alineó con las necesidades reales del caso.", "Los materiales elegidos no fueron del todo coherentes con el objetivo de la curación.")
        : key === "procedure"
        ? competencyFeedback(score, "La secuencia técnica mantuvo orden y seguridad.", "La secuencia del procedimiento necesita más consistencia y control de pasos críticos.")
        : key === "prevention"
        ? competencyFeedback(score, "Integraste medidas complementarias más allá de la cobertura local.", "La prevención quedó incompleta para el nivel de riesgo del paciente.")
        : competencyFeedback(score, "La nota clínica resume adecuadamente la atención brindada.", "La documentación no captura de forma suficiente la intervención y el plan."),
  }));

  const strengths = competencyResults.filter((item) => item.score >= 82).map((item) => item.label);
  const improvements = competencyResults.filter((item) => item.score < 82).map((item) => item.label);

  const evolution =
    overallScore >= 85 && criticalErrors.length === 0
      ? "mejora"
      : overallScore >= 65 && criticalErrors.length <= 2
      ? "sin cambios"
      : "empeora";
  const evolutionSummary =
    evolution === "mejora"
      ? caseData.outcome.improvement
      : evolution === "sin cambios"
      ? caseData.outcome.stable
      : caseData.outcome.worsening;

  return {
    overallScore,
    competencies: competencyResults,
    criticalErrors,
    strengths: strengths.length ? strengths : ["Base técnica aceptable"],
    improvements: improvements.length ? improvements : ["Mantener consistencia del desempeño"],
    evolution,
    evolutionSummary,
    frequentErrorLabels: criticalErrors,
  };
}

export function nextWoundStep(step: WoundFlowStep): WoundFlowStep {
  const index = WOUND_FLOW_STEPS.findIndex((item) => item.id === step);
  return WOUND_FLOW_STEPS[Math.min(WOUND_FLOW_STEPS.length - 1, index + 1)]?.id ?? "results";
}

export function previousWoundStep(step: WoundFlowStep): WoundFlowStep {
  const index = WOUND_FLOW_STEPS.findIndex((item) => item.id === step);
  return WOUND_FLOW_STEPS[Math.max(0, index - 1)]?.id ?? "summary";
}

export function woundStepRoute(caseId: string, step: WoundFlowStep) {
  const base = `/simulators/wound-care/lpp/cases/${caseId}`;
  if (step === "summary") return base;
  if (step === "results") return `${base}/results`;
  return `${base}/${step}`;
}

export function getTutorFeedback(step: Exclude<WoundFlowStep, "summary" | "results">, session: WoundSimulationSession, caseData: WoundCaseData) {
  if (step === "assessment") {
    const missingDomains = caseData.expected.reviewedDomains.filter((item) => !session.assessment.reviewedDomains.includes(item));
    if (!missingDomains.length) return "Valoración completa. Ya integraste contexto, riesgo y hallazgos locales relevantes.";
    return `Aún conviene revisar: ${missingDomains.slice(0, 3).map(friendlyToken).join(", ")}.`;
  }

  if (step === "classification") {
    if (!session.classification.stage) return "Selecciona un estadio o tipo de lesión antes de continuar.";
    if (session.classification.stage === caseData.wound.stage) return "Clasificación consistente con los hallazgos observados.";
    return `Revisa la profundidad visible, el tipo de tejido y si el lecho está realmente expuesto o cubierto.`;
  }

  if (step === "procedure") {
    const wrongItems = caseData.expected.inappropriateMaterialIds.filter((id) => session.procedure.selectedMaterialIds.includes(id));
    if (wrongItems.length) return "Hay materiales que no son buena elección para este lecho. Revisa la bandeja antes de cerrar.";
    if (session.procedure.selectedSequence[0] !== "hand-hygiene-start") return "La seguridad comienza con higiene de manos antes de tocar al paciente o la herida.";
    return "Mantén una secuencia limpia: retiro, valoración, limpieza, protección y cobertura.";
  }

  if (step === "prevention") {
    const missing = caseData.expected.preventionIds.filter((id) => !session.prevention.selectedMeasures.includes(id));
    return missing.length ? `Faltan medidas complementarias importantes: ${missing.slice(0, 3).map(friendlyToken).join(", ")}.` : "La prevención complementaria está bien cubierta.";
  }

  if (step === "documentation") {
    const missing = caseData.expected.documentationChecklist.filter((field) => !session.documentation[field].trim());
    return missing.length ? `Documenta todavía: ${missing.slice(0, 3).map(friendlyToken).join(", ")}.` : "La nota de enfermería ya reúne los mínimos del caso.";
  }

  return "";
}

function friendlyToken(value: string) {
  const labels: Record<string, string> = {
    mobility: "movilidad",
    nutrition: "nutrición",
    hydration: "hidratación",
    continence: "continencia",
    perfusion: "perfusión",
    timeInBed: "permanencia en cama",
    devices: "dispositivos",
    pain: "dolor",
    braden: "escala de riesgo",
    "turning-schedule": "cambios posturales",
    "moisture-management": "manejo de humedad",
    "nutrition-support": "soporte nutricional",
    "pressure-relief": "alivio de presión",
    "caregiver-education": "educación al cuidador",
    reassessment: "reevaluación",
    location: "localización",
    classification: "clasificación",
    woundBed: "lecho",
    exudate: "exudado",
    odor: "olor",
    intervention: "intervención",
    dressing: "tipo de apósito",
    followUpPlan: "plan de seguimiento",
  };

  return labels[value] ?? value;
}
