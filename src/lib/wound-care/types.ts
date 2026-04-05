export type WoundModuleMode = "tutor" | "evaluation";
export type WoundDifficulty = "basic" | "intermediate" | "advanced";
export type WoundStage =
  | "Estadio I"
  | "Estadio II"
  | "Estadio III"
  | "Estadio IV"
  | "No clasificable"
  | "Lesión tisular profunda";
export type WoundEvolution = "mejora" | "sin cambios" | "empeora";
export type WoundFlowStep =
  | "summary"
  | "assessment"
  | "classification"
  | "procedure"
  | "prevention"
  | "documentation"
  | "results";
export type WoundCompetencyKey =
  | "integralAssessment"
  | "woundAssessment"
  | "classification"
  | "materials"
  | "procedure"
  | "prevention"
  | "documentation";

export type SelectOption = {
  id: string;
  label: string;
  helper?: string;
};

export type WoundHotspot = {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
};

export type WoundVisualTone = "risk" | "stage-1" | "stage-2" | "stage-3" | "unstageable";

export type WoundVisualConfig = {
  imageSrc: string;
  imageAlt: string;
  imageSourceLabel: string;
  objectPosition: string;
  photoOpacity: number;
  overlayTone: WoundVisualTone;
  focus: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  notes: string[];
};

export type WoundCaseData = {
  id: string;
  name: string;
  difficulty: WoundDifficulty;
  summary: string;
  learningObjective: string;
  estimatedMinutes: number;
  patient: {
    age: number;
    sex: "Femenino" | "Masculino";
    context: string;
    relevantHistory: string[];
    mobility: string;
    nutrition: string;
    hydration: string;
    continence: string;
    perfusion: string;
    timeInBed: string;
    devices: string[];
    pain: string;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      respiratoryRate: string;
      temperature: string;
      oxygenSaturation: string;
    };
    braden?: {
      score: number;
      interpretation: string;
    };
    caseGoal: string;
  };
  wound: {
    location: string;
    bodySite: "sacrum" | "heel" | "trochanter" | "ischium";
    locationLabel: string;
    lengthCm: number;
    widthCm: number;
    depthCm: number;
    edges: string;
    tissue: string;
    exudate: string;
    odor: string;
    periwoundSkin: string;
    pain: string;
    infectionSigns: string[];
    hasSlough: boolean;
    hasNecrosis: boolean;
    stage: WoundStage;
    hotspots: WoundHotspot[];
    differentialNote: string;
    visual: WoundVisualConfig;
  };
  expected: {
    reviewedDomains: string[];
    riskFactors: string[];
    priorityAlerts: string[];
    materialIds: string[];
    inappropriateMaterialIds: string[];
    procedureSequence: string[];
    preventionIds: string[];
    documentationChecklist: Array<keyof WoundDocumentationState>;
    classificationKeywords: string[];
  };
  education: {
    fundamentals: string[];
    prevention: string[];
    differentiation: string;
  };
  outcome: {
    improvement: string;
    stable: string;
    worsening: string;
  };
};

export type WoundAssessmentState = {
  reviewedDomains: string[];
  selectedRiskFactors: string[];
  selectedAlerts: string[];
  hotspotFindings: string[];
  bradenInterpretation: string;
  riskSummary: string;
  location: string;
  lengthCm: string;
  widthCm: string;
  depthCm: string;
  edges: string;
  tissue: string;
  exudate: string;
  odor: string;
  periwoundSkin: string;
  pain: string;
  infectionSigns: string[];
  hasSlough: boolean;
  hasNecrosis: boolean;
};

export type WoundClassificationState = {
  stage: WoundStage | "";
  justification: string;
  differentialChecked: boolean;
};

export type WoundProcedureState = {
  selectedMaterialIds: string[];
  selectedSequence: string[];
  tutorMessages: string[];
};

export type WoundPreventionState = {
  selectedMeasures: string[];
  followUpPlan: string;
};

export type WoundDocumentationState = {
  location: string;
  classification: string;
  woundBed: string;
  exudate: string;
  odor: string;
  pain: string;
  intervention: string;
  dressing: string;
  patientResponse: string;
  followUpPlan: string;
};

export type WoundSimulationSession = {
  sessionId: string;
  caseId: string;
  mode: WoundModuleMode;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  currentStep: WoundFlowStep;
  assessment: WoundAssessmentState;
  classification: WoundClassificationState;
  procedure: WoundProcedureState;
  prevention: WoundPreventionState;
  documentation: WoundDocumentationState;
  finalResult?: WoundEvaluationResult;
};

export type WoundCompetencyScore = {
  key: WoundCompetencyKey;
  label: string;
  score: number;
  feedback: string;
};

export type WoundEvaluationResult = {
  overallScore: number;
  competencies: WoundCompetencyScore[];
  criticalErrors: string[];
  strengths: string[];
  improvements: string[];
  evolution: WoundEvolution;
  evolutionSummary: string;
  frequentErrorLabels: string[];
};

export type WoundCaseAnalytics = {
  attempts: number;
  completed: boolean;
  bestScore: number;
  lastScore: number;
  lastMode?: WoundModuleMode;
  lastEvolution?: WoundEvolution;
  lastPlayedAt?: string;
};

export type WoundAnalytics = {
  userKey: string;
  totalAttempts: number;
  completedCases: string[];
  averageScore: number;
  competencyAverages: Record<WoundCompetencyKey, number>;
  frequentErrors: Record<string, number>;
  moduleProgress: Record<string, WoundCaseAnalytics>;
};

export const WOUND_COMPETENCY_LABELS: Record<WoundCompetencyKey, string> = {
  integralAssessment: "Valoración integral",
  woundAssessment: "Valoración de la herida",
  classification: "Clasificación de LPP",
  materials: "Selección de materiales",
  procedure: "Técnica de curación",
  prevention: "Prevención complementaria",
  documentation: "Documentación",
};

export const WOUND_STAGE_OPTIONS: WoundStage[] = [
  "Estadio I",
  "Estadio II",
  "Estadio III",
  "Estadio IV",
  "No clasificable",
  "Lesión tisular profunda",
];

export const WOUND_ASSESSMENT_DOMAIN_OPTIONS: SelectOption[] = [
  { id: "mobility", label: "Movilidad", helper: "Capacidad para reposicionarse y tolerar carga." },
  { id: "nutrition", label: "Nutrición", helper: "Aporte proteico-calórico reciente y riesgo catabólico." },
  { id: "hydration", label: "Hidratación", helper: "Balance hídrico, mucosas y soporte intravenoso." },
  { id: "continence", label: "Continencia", helper: "Exposición a humedad por orina o heces." },
  { id: "perfusion", label: "Perfusión", helper: "Oxigenación, perfusión tisular y comorbilidades vasculares." },
  { id: "timeInBed", label: "Permanencia en cama", helper: "Horas continuas en la misma posición." },
  { id: "devices", label: "Dispositivos", helper: "Sondas, mascarillas, yesos o elementos que concentran presión." },
  { id: "pain", label: "Dolor", helper: "Dolor basal y durante la manipulación." },
  { id: "braden", label: "Escala de riesgo", helper: "Integra percepción sensorial, humedad, movilidad y fricción." },
];

export const WOUND_RISK_FACTOR_OPTIONS: SelectOption[] = [
  { id: "immobility", label: "Inmovilidad o movilidad muy reducida" },
  { id: "malnutrition", label: "Malnutrición o ingesta insuficiente" },
  { id: "moisture", label: "Humedad persistente / incontinencia" },
  { id: "poor-perfusion", label: "Perfusión comprometida" },
  { id: "device-pressure", label: "Presión asociada a dispositivos" },
  { id: "pain-limited", label: "Dolor que limita reposicionamiento" },
  { id: "diabetes", label: "Diabetes o microangiopatía" },
  { id: "low-braden", label: "Braden en rango de alto riesgo" },
];

export const WOUND_ALERT_OPTIONS: SelectOption[] = [
  { id: "infection", label: "Signos locales de infección" },
  { id: "deep-loss", label: "Pérdida tisular profunda / tejido oculto" },
  { id: "moisture-damage", label: "Lesión por humedad a diferenciar" },
  { id: "pain-rise", label: "Dolor desproporcionado o en aumento" },
];

export const WOUND_MEASUREMENT_FIELD_OPTIONS: Record<
  "edges" | "tissue" | "exudate" | "odor" | "periwoundSkin" | "pain",
  SelectOption[]
> = {
  edges: [
    { id: "intact", label: "Íntegros y definidos" },
    { id: "macerated", label: "Macerados" },
    { id: "rolled", label: "Enrollados / epíbole" },
    { id: "irregular", label: "Irregulares" },
  ],
  tissue: [
    { id: "intact-erythema", label: "Piel intacta con eritema no blanqueable" },
    { id: "pink-red", label: "Lecho rosado o rojo" },
    { id: "granulation-slough", label: "Granulación con esfacelos" },
    { id: "slough-necrosis", label: "Esfacelos o necrosis que ocultan el lecho" },
  ],
  exudate: [
    { id: "none", label: "Nulo" },
    { id: "scant", label: "Escaso" },
    { id: "moderate", label: "Moderado" },
    { id: "high", label: "Abundante" },
  ],
  odor: [
    { id: "none", label: "Sin olor" },
    { id: "mild", label: "Leve" },
    { id: "foul", label: "Fétido" },
  ],
  periwoundSkin: [
    { id: "intact", label: "Íntegra" },
    { id: "erythematous", label: "Eritematosa" },
    { id: "macerated", label: "Macerada" },
    { id: "fragile", label: "Frágil" },
  ],
  pain: [
    { id: "none", label: "Sin dolor" },
    { id: "mild", label: "Dolor leve" },
    { id: "moderate", label: "Dolor moderado" },
    { id: "severe", label: "Dolor intenso" },
  ],
};

export const WOUND_INFECTION_SIGN_OPTIONS: SelectOption[] = [
  { id: "none", label: "Sin signos francos" },
  { id: "erythema", label: "Eritema progresivo" },
  { id: "heat", label: "Aumento de temperatura local" },
  { id: "purulence", label: "Exudado purulento" },
  { id: "odor", label: "Olor persistente" },
];

export const WOUND_MATERIAL_OPTIONS: SelectOption[] = [
  { id: "hand-hygiene", label: "Higiene de manos", helper: "Preparación segura antes y después." },
  { id: "clean-gloves", label: "Guantes limpios", helper: "Barreras de protección durante la curación." },
  { id: "gauze", label: "Gasas estériles", helper: "Limpieza, secado y protección." },
  { id: "saline", label: "Solución salina", helper: "Limpieza suave del lecho." },
  { id: "skin-barrier", label: "Barrera protectora", helper: "Protección de la piel perilesional." },
  { id: "foam-dressing", label: "Apósito de espuma", helper: "Control de exudado moderado y protección." },
  { id: "hydrocolloid", label: "Hidrocoloide", helper: "Cobertura para lesiones superficiales con exudado bajo." },
  { id: "alginate", label: "Alginato", helper: "Útil si el exudado es abundante." },
  { id: "waste", label: "Material de desecho", helper: "Eliminación segura de residuos." },
  { id: "positioning-aid", label: "Elementos de posicionamiento", helper: "Descarga de presión durante y después." },
  { id: "adhesive-mesh", label: "Fijación atraumática", helper: "Mantiene la cobertura sin dañar piel frágil." },
  { id: "alcohol", label: "Alcohol / antiséptico irritante", helper: "No es elección rutinaria para el lecho." },
  { id: "dry-cotton", label: "Algodón seco", helper: "Puede adherirse y traumatizar el tejido." },
];

export const WOUND_PROCEDURE_STEPS: SelectOption[] = [
  { id: "hand-hygiene-start", label: "1. Higiene de manos" },
  { id: "explain-patient", label: "2. Explicación al paciente" },
  { id: "prepare-position", label: "3. Preparación y posición" },
  { id: "remove-old-dressing", label: "4. Retiro de apósito anterior" },
  { id: "reassess-on-removal", label: "5. Valoración al retiro" },
  { id: "cleanse", label: "6. Limpieza" },
  { id: "protect-periwound", label: "7. Protección de piel perilesional" },
  { id: "apply-cover", label: "8. Aplicación de cobertura" },
  { id: "secure-dressing", label: "9. Fijación segura" },
  { id: "dispose-waste", label: "10. Eliminación de residuos" },
  { id: "hand-hygiene-end", label: "11. Higiene final" },
  { id: "document-care", label: "12. Registro" },
];

export const WOUND_PREVENTION_OPTIONS: SelectOption[] = [
  { id: "turning-schedule", label: "Cambios posturales programados" },
  { id: "moisture-management", label: "Manejo de humedad" },
  { id: "nutrition-support", label: "Soporte nutricional" },
  { id: "pressure-relief", label: "Superficie o alivio de presión" },
  { id: "pain-control", label: "Control del dolor" },
  { id: "caregiver-education", label: "Educación al cuidador" },
  { id: "infection-watch", label: "Vigilancia de signos de infección" },
  { id: "reassessment", label: "Reevaluación programada" },
];

export const WOUND_QUICK_ACCESS: Array<{ id: string; title: string; summary: string }> = [
  {
    id: "fundamentals",
    title: "Fundamentos de LPP",
    summary: "Presión, cizalla, humedad y perfusión se integran en la valoración inicial.",
  },
  {
    id: "classification",
    title: "Clasificación rápida",
    summary: "Repasa estadios, lesión tisular profunda y lesión no clasificable con lenguaje NPIAP.",
  },
  {
    id: "materials",
    title: "Materiales y apósitos",
    summary: "Relaciona nivel de exudado, objetivo de la cobertura y protección perilesional.",
  },
  {
    id: "prevention",
    title: "Prevención",
    summary: "Riesgo, reposicionamiento, descarga de presión y soporte nutricional como paquete mínimo.",
  },
];
