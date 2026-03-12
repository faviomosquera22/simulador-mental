export type ClinicalNoteMode = "practice" | "evaluation";

export type ClinicalNoteDifficulty = "basic" | "intermediate" | "advanced";

export type ClinicalNoteType =
  | "nursing_note"
  | "soapie"
  | "shift_report"
  | "kardex"
  | "incident_report";

export type ClinicalNoteSection = {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
};

export type ClinicalNoteCase = {
  id: string;
  name: string;
  type: ClinicalNoteType;
  difficulty: ClinicalNoteDifficulty;
  context: string;
  patient: {
    name: string;
    age: number;
    sex: "female" | "male" | "unspecified";
    diagnosis: string;
  };
  expectedElements: string[];
  expectedKeywords: string[];
  qualityChecklist: string[];
  educationalHint: string;
};

export type ClinicalNoteEvaluation = {
  totalScore: number;
  rubric: {
    completeness: number;
    content: number;
    coherence: number;
  };
  missingRequiredSections: string[];
  feedback: {
    completeness: string;
    content: string;
    coherence: string;
    summary: string;
  };
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function clinicalNoteDifficultyLabel(value: ClinicalNoteDifficulty) {
  if (value === "basic") return "Básico";
  if (value === "intermediate") return "Intermedio";
  return "Avanzado";
}

export function clinicalNoteTypeLabel(value: ClinicalNoteType) {
  if (value === "nursing_note") return "Nota de enfermería";
  if (value === "soapie") return "SOAPIE";
  if (value === "shift_report") return "Reporte de turno";
  if (value === "kardex") return "Kardex";
  return "Incidente de seguridad";
}

export function getClinicalNoteSections(type: ClinicalNoteType): ClinicalNoteSection[] {
  if (type === "nursing_note") {
    return [
      { id: "observations", label: "Observaciones", placeholder: "Estado actual del paciente y hallazgos relevantes.", required: true },
      { id: "interventions", label: "Intervenciones", placeholder: "Qué cuidados o acciones realizaste.", required: true },
      { id: "response", label: "Respuesta del paciente", placeholder: "Cómo respondió el paciente al cuidado.", required: true },
    ];
  }
  if (type === "soapie") {
    return [
      { id: "subjective", label: "S - Subjetivo", placeholder: "Lo que refiere el paciente.", required: true },
      { id: "objective", label: "O - Objetivo", placeholder: "Hallazgos medibles y observables.", required: true },
      { id: "analysis", label: "A - Análisis", placeholder: "Interpretación clínica de enfermería.", required: true },
      { id: "plan", label: "P - Plan", placeholder: "Qué plan inmediato planteas.", required: true },
      { id: "intervention", label: "I - Intervención", placeholder: "Acciones realizadas.", required: true },
      { id: "evaluation", label: "E - Evaluación", placeholder: "Resultado o respuesta posterior.", required: true },
    ];
  }
  if (type === "shift_report") {
    return [
      { id: "current_state", label: "Estado actual", placeholder: "Situación clínica al cierre del turno.", required: true },
      { id: "done", label: "Intervenciones realizadas", placeholder: "Qué quedó hecho en el turno.", required: true },
      { id: "pending", label: "Pendientes", placeholder: "Qué queda por hacer o reevaluar.", required: true },
      { id: "alerts", label: "Alertas", placeholder: "Riesgos, cambios o datos críticos.", required: true },
    ];
  }
  if (type === "kardex") {
    return [
      { id: "care_focus", label: "Prioridades de cuidado", placeholder: "Problemas/prioridades activas del paciente.", required: true },
      { id: "medications", label: "Medicamentos / horarios", placeholder: "Medicaciones relevantes o pendientes.", required: true },
      { id: "safety", label: "Seguridad", placeholder: "Riesgos y precauciones especiales.", required: true },
      { id: "mobility", label: "Movilidad / apoyo", placeholder: "Dependencia, deambulación, ayudas.", required: false },
    ];
  }
  return [
    { id: "event", label: "Evento", placeholder: "Describe qué ocurrió.", required: true },
    { id: "immediate_actions", label: "Acciones inmediatas", placeholder: "Qué hiciste de forma inicial.", required: true },
    { id: "patient_response", label: "Respuesta del paciente", placeholder: "Cómo evolucionó el paciente.", required: true },
    { id: "communication", label: "Comunicación / notificación", placeholder: "A quién notificaste y qué seguimiento queda.", required: true },
  ];
}

export const CLINICAL_NOTES_LIBRARY: ClinicalNoteCase[] = [
  {
    id: "note_postop_pain",
    name: "Dolor posoperatorio controlado parcialmente",
    type: "nursing_note",
    difficulty: "basic",
    context: "Paciente en posoperatorio inmediato con dolor moderado.",
    patient: { name: "Claudia M.", age: 47, sex: "female", diagnosis: "Posoperatorio de colecistectomía" },
    expectedElements: ["dolor", "signos vitales", "analgesia", "respuesta"],
    expectedKeywords: ["dolor", "analgesia", "reevaluacion", "signos vitales", "respuesta"],
    qualityChecklist: ["Incluye hallazgo actual", "Describe intervención", "Registra respuesta del paciente"],
    educationalHint: "La nota debe enlazar estado actual, intervención y respuesta sin ambigüedad.",
  },
  {
    id: "soapie_hyperglycemia",
    name: "Hiperglucemia con reposición y control",
    type: "soapie",
    difficulty: "intermediate",
    context: "Paciente con glucosa elevada y deshidratación leve.",
    patient: { name: "Daniel C.", age: 61, sex: "male", diagnosis: "Descompensación hiperglucémica" },
    expectedElements: ["glucosa", "signos", "analisis", "plan", "insulina", "evaluacion"],
    expectedKeywords: ["glucosa", "deshidratacion", "insulina", "control", "respuesta"],
    qualityChecklist: ["Completa las 6 secciones SOAPIE", "No mezclar subjetivo con objetivo", "Plan e intervención deben ser coherentes"],
    educationalHint: "SOAPIE exige separar datos, análisis y acción clínica.",
  },
  {
    id: "shift_report_sepsis",
    name: "Reporte de turno en paciente con sepsis",
    type: "shift_report",
    difficulty: "advanced",
    context: "Paciente crítico con antibióticos y vigilancia hemodinámica.",
    patient: { name: "Rosa V.", age: 72, sex: "female", diagnosis: "Sepsis de foco urinario" },
    expectedElements: ["estado hemodinamico", "antibioticos", "lactato", "pendientes", "alertas"],
    expectedKeywords: ["sepsis", "antibiotico", "lactato", "monitorizacion", "pendiente"],
    qualityChecklist: ["Resume estado actual", "Incluye pendientes claros", "Marca alertas críticas"],
    educationalHint: "El reporte de turno debe facilitar continuidad asistencial sin vacíos críticos.",
  },
  {
    id: "kardex_fall_risk",
    name: "Kardex con riesgo de caída",
    type: "kardex",
    difficulty: "basic",
    context: "Paciente adulto mayor con marcha inestable.",
    patient: { name: "Benjamín P.", age: 79, sex: "male", diagnosis: "Síndrome confusional + riesgo de caída" },
    expectedElements: ["riesgo de caida", "seguridad", "movilidad", "medicamentos"],
    expectedKeywords: ["caida", "seguridad", "acompanamiento", "movilidad", "alarma"],
    qualityChecklist: ["Resume prioridades de cuidado", "Incluye medidas de seguridad", "Registra apoyos para movilización"],
    educationalHint: "El Kardex debe ser breve, operativo y orientado al cuidado continuo.",
  },
  {
    id: "incident_med_error",
    name: "Incidente por error de medicación interceptado",
    type: "incident_report",
    difficulty: "advanced",
    context: "Se detectó un error antes de que el medicamento llegara al paciente.",
    patient: { name: "Nadia S.", age: 55, sex: "female", diagnosis: "Evento de seguridad sin daño" },
    expectedElements: ["evento", "accion inmediata", "sin daño", "notificacion"],
    expectedKeywords: ["incidente", "seguridad", "notificacion", "accion inmediata", "sin dano"],
    qualityChecklist: ["Describe el evento objetivamente", "Documenta acciones inmediatas", "Registra comunicación y seguimiento"],
    educationalHint: "En incidentes, evita juicios de valor y prioriza hechos, acciones y comunicación.",
  },
];

export function evaluateClinicalNote(args: {
  caseSet: ClinicalNoteCase;
  content: Record<string, string>;
}): ClinicalNoteEvaluation {
  const { caseSet, content } = args;
  const sections = getClinicalNoteSections(caseSet.type);
  const missingRequiredSections = sections
    .filter((section) => section.required && !String(content[section.id] ?? "").trim())
    .map((section) => section.label);

  const requiredCompleted = sections.filter((section) => !section.required || String(content[section.id] ?? "").trim()).length;
  const completenessScore = Math.round((requiredCompleted / sections.length) * 40);

  const fullText = sections.map((section) => String(content[section.id] ?? "")).join(" ");
  const normalized = normalizeText(fullText);
  const contentHits = caseSet.expectedKeywords.filter((keyword) => normalized.includes(normalizeText(keyword))).length;
  const contentScore = Math.round((contentHits / caseSet.expectedKeywords.length) * 40);

  const coherentSections = sections.filter((section) => String(content[section.id] ?? "").trim().length >= 18).length;
  const coherenceScore = Math.round((coherentSections / sections.length) * 20);
  const totalScore = completenessScore + contentScore + coherenceScore;

  return {
    totalScore,
    rubric: {
      completeness: completenessScore,
      content: contentScore,
      coherence: coherenceScore,
    },
    missingRequiredSections,
    feedback: {
      completeness:
        missingRequiredSections.length === 0
          ? "La estructura requerida está completa."
          : `Faltan secciones obligatorias: ${missingRequiredSections.join(", ")}.`,
      content:
        contentScore >= 28
          ? "La nota recoge los elementos clínicos esperados."
          : `Incluye mejor elementos clave como: ${caseSet.expectedElements.join(", ")}.`,
      coherence:
        coherenceScore >= 14
          ? "La redacción tiene continuidad clínica suficiente."
          : "Algunas secciones son muy breves o no conectan datos, intervención y evolución.",
      summary:
        totalScore >= 85
          ? "Documento clínico claro, estructurado y útil para continuidad del cuidado."
          : totalScore >= 65
          ? "La estructura es funcional, pero aún puede ganar precisión clínica."
          : "La nota todavía no cumple una calidad documental suficiente para práctica segura.",
    },
  };
}
