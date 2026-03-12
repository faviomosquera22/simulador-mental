export type ECGViewMode = "rhythm_monitor" | "standard_12_lead" | "expanded";

export type ECGSelectionMode = "manual" | "random" | "contextual_random";

export type ECGDifficulty = "basic" | "intermediate" | "advanced" | "expert";

export type ECGClinicalContext =
  | "palpitations"
  | "chest_pain"
  | "cardiac_arrest"
  | "syncope_collapse"
  | "electrolyte_disorder"
  | "general_critical";

export type ECGStability = "stable" | "potentially_unstable" | "unstable" | "critical";

export type ECGDecisionStability = "stable" | "unstable" | "critical";

export type ECGAdditionalLeadRequest = "none" | "right" | "posterior" | "both";

export type ECGLead =
  | "I"
  | "II"
  | "III"
  | "aVR"
  | "aVL"
  | "aVF"
  | "V1"
  | "V2"
  | "V3"
  | "V4"
  | "V5"
  | "V6"
  | "V3R"
  | "V4R"
  | "V5R"
  | "V6R"
  | "V7"
  | "V8"
  | "V9";

export type ECGConductId =
  | "monitor_reassess"
  | "vagal_adenosine"
  | "rate_control"
  | "synchronized_cardioversion"
  | "defibrillation_cpr"
  | "acs_protocol"
  | "request_additional_leads"
  | "atropine_pacing"
  | "correct_electrolytes"
  | "advanced_life_support";

export type ECGPattern =
  | "sinus_regular"
  | "af_irregular"
  | "flutter_saw"
  | "svt_regular"
  | "vt_wide"
  | "vf_chaotic"
  | "asystole_flat"
  | "pea_low_amp"
  | "stemi"
  | "st_depression"
  | "bundle_branch"
  | "hyperk";

export type ECGWaveformProfile = {
  pattern: ECGPattern;
  bpm: number;
  qrs: "narrow" | "wide";
  irregularity: number;
  amplitude: number;
  stShift: "normal" | "elevated" | "depressed";
};

export type ECGVitals = {
  hr: number;
  sbp: number;
  dbp: number;
  spo2: number;
  rr: number;
  temp: number;
};

export type ECGCase = {
  id: string;
  name: string;
  category: "rhythm" | "ischemia" | "conduction" | "electrolyte" | "arrest";
  difficulty: ECGDifficulty;
  viewModes: ECGViewMode[];
  contexts: ECGClinicalContext[];
  probableStability: ECGStability;
  acceptedStabilityDecisions: ECGDecisionStability[];
  availableLeads: ECGLead[];
  keyFindings: string[];
  expectedConductIds: ECGConductId[];
  partialConductIds?: ECGConductId[];
  interpretationKeywords: string[];
  expectedAdditionalLeads: ECGAdditionalLeadRequest;
  feedbackHints: {
    interpretation: string;
    stability: string;
    conduct: string;
    additionalLeads: string;
  };
  supportsDynamicEvolution: boolean;
  dynamicTransitions?: {
    ifCorrect?: string;
    ifIncorrect?: string;
    ifDelayed?: string;
  };
  waveform: ECGWaveformProfile;
  symptomHints: string[];
  baselineVitals: ECGVitals;
};

export type ECGModuleConfig = {
  enabled: boolean;
  viewMode: ECGViewMode;
  selectionMode: ECGSelectionMode;
  manualEcgId: string | null;
  difficulty: ECGDifficulty;
  dynamicEnabled: boolean;
  showHints: boolean;
  showRhythmName: boolean;
  allowAdditionalLeads: boolean;
  immediateFeedback: boolean;
};

export type ECGDecisionInput = {
  interpretation: string;
  stabilityDecision: ECGDecisionStability | "";
  conductId: ECGConductId | "";
  requestedAdditionalLeads: ECGAdditionalLeadRequest;
  justification: string;
  responseSeconds: number;
};

export type ECGDecisionEvaluation = {
  totalScore: number;
  rubric: {
    interpretation: number;
    severity: number;
    conduct: number;
    speed: number;
    coherence: number;
    justification: number;
    additionalLeads: number;
  };
  outcome: "excellent" | "good" | "partial" | "unsafe";
  interpretationCorrect: boolean;
  stabilityCorrect: boolean;
  conductCorrect: boolean;
  trend: "improves" | "stable" | "deteriorates";
  feedback: {
    interpretation: string;
    stability: string;
    conduct: string;
    speed: string;
    coherence: string;
    justification: string;
    additionalLeads: string;
    summary: string;
  };
};

export const STANDARD_12_LEADS: ECGLead[] = [
  "I",
  "II",
  "III",
  "aVR",
  "aVL",
  "aVF",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
];

export const RIGHT_LEADS: ECGLead[] = ["V3R", "V4R", "V5R", "V6R"];

export const POSTERIOR_LEADS: ECGLead[] = ["V7", "V8", "V9"];

export const ECG_CONDUCT_OPTIONS: Array<{ id: ECGConductId; label: string; description: string }> = [
  {
    id: "monitor_reassess",
    label: "Monitorizar y reevaluar",
    description: "Observación activa con reevaluación hemodinámica seriada.",
  },
  {
    id: "vagal_adenosine",
    label: "Maniobras vagales / adenosina",
    description: "En taquicardia regular de QRS estrecho si el paciente está estable.",
  },
  {
    id: "rate_control",
    label: "Control de frecuencia",
    description: "Control de frecuencia y estrategia antitrombótica cuando corresponda.",
  },
  {
    id: "synchronized_cardioversion",
    label: "Cardioversión sincronizada",
    description: "Indicar en taquiarritmias con inestabilidad hemodinámica.",
  },
  {
    id: "defibrillation_cpr",
    label: "Desfibrilar + RCP",
    description: "FV/TV sin pulso: iniciar algoritmo de paro de inmediato.",
  },
  {
    id: "acs_protocol",
    label: "Protocolo de SCA",
    description: "Activar manejo de síndrome coronario agudo y reperfusión temprana.",
  },
  {
    id: "request_additional_leads",
    label: "Solicitar derivaciones adicionales",
    description: "Pedir V4R y/o V7-V9 cuando la sospecha lo requiera.",
  },
  {
    id: "atropine_pacing",
    label: "Atropina / marcapasos transcutáneo",
    description: "Bradicardia inestable o bloqueo AV de alto grado.",
  },
  {
    id: "correct_electrolytes",
    label: "Corregir alteración electrolítica",
    description: "Tratamiento de hiperpotasemia y monitorización estrecha.",
  },
  {
    id: "advanced_life_support",
    label: "Soporte vital avanzado",
    description: "Escalar rápidamente en situaciones críticas o ambiguas.",
  },
];

export const DEFAULT_ECG_MODULE_CONFIG: ECGModuleConfig = {
  enabled: true,
  viewMode: "rhythm_monitor",
  selectionMode: "contextual_random",
  manualEcgId: null,
  difficulty: "basic",
  dynamicEnabled: false,
  showHints: true,
  showRhythmName: false,
  allowAdditionalLeads: true,
  immediateFeedback: true,
};

const difficultyRank: Record<ECGDifficulty, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const BASE_FINDINGS = {
  regularQrs: "QRS regular de morfología uniforme",
  irregularQrs: "intervalos RR irregulares",
  absentP: "ondas P no visibles o disociadas",
  wideQrs: "QRS ancho",
  stElevation: "elevación del ST en derivaciones contiguas",
  stDepression: "depresión del ST",
};

export const ECG_LIBRARY: ECGCase[] = [
  {
    id: "sinus_rhythm_normal",
    name: "Ritmo sinusal normal",
    category: "rhythm",
    difficulty: "basic",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["palpitations", "chest_pain", "general_critical"],
    probableStability: "stable",
    acceptedStabilityDecisions: ["stable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["onda P antes de cada QRS", "ritmo regular", "frecuencia 60-100 lpm"],
    expectedConductIds: ["monitor_reassess"],
    partialConductIds: ["request_additional_leads"],
    interpretationKeywords: ["ritmo sinusal", "sinusal normal", "sinus rhythm"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Patrón sinusal regular con conducción conservada.",
      stability: "Sin signos eléctricos de inestabilidad inmediata.",
      conduct: "La mejor conducta inicial es monitorizar y correlacionar con clínica.",
      additionalLeads: "No requiere derivaciones complementarias de rutina.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifIncorrect: "sinus_tachycardia",
    },
    waveform: {
      pattern: "sinus_regular",
      bpm: 76,
      qrs: "narrow",
      irregularity: 0.03,
      amplitude: 1,
      stShift: "normal",
    },
    symptomHints: ["palpitaciones leves", "sin dolor torácico", "sin disnea"],
    baselineVitals: { hr: 76, sbp: 122, dbp: 78, spo2: 98, rr: 16, temp: 36.8 },
  },
  {
    id: "sinus_bradycardia",
    name: "Bradicardia sinusal",
    category: "rhythm",
    difficulty: "basic",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["syncope_collapse", "electrolyte_disorder", "general_critical"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["frecuencia < 60 lpm", "onda P sinusal", "ritmo regular"],
    expectedConductIds: ["monitor_reassess", "atropine_pacing"],
    partialConductIds: ["advanced_life_support"],
    interpretationKeywords: ["bradicardia sinusal", "sinus bradycardia"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Ritmo sinusal con frecuencia baja.",
      stability: "La estabilidad depende de síntomas y perfusión.",
      conduct: "Si hay hipotensión/síncope, escalar con atropina o marcapasos.",
      additionalLeads: "No son obligatorias salvo sospecha adicional.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "av_block_basic",
    },
    waveform: {
      pattern: "sinus_regular",
      bpm: 44,
      qrs: "narrow",
      irregularity: 0.04,
      amplitude: 0.95,
      stShift: "normal",
    },
    symptomHints: ["mareo", "presíncope", "fatiga"],
    baselineVitals: { hr: 44, sbp: 96, dbp: 60, spo2: 96, rr: 18, temp: 36.4 },
  },
  {
    id: "sinus_tachycardia",
    name: "Taquicardia sinusal",
    category: "rhythm",
    difficulty: "basic",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["palpitations", "general_critical", "chest_pain"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["frecuencia > 100 lpm", "onda P sinusal", "QRS estrecho"],
    expectedConductIds: ["monitor_reassess"],
    partialConductIds: ["rate_control"],
    interpretationKeywords: ["taquicardia sinusal", "sinus tachycardia"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Ritmo sinusal rápido; usualmente secundario a causa subyacente.",
      stability: "Evaluar perfusión y causa desencadenante.",
      conduct: "Priorizar tratar la causa y monitorizar evolución.",
      additionalLeads: "No son prioritarias de rutina.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "supraventricular_tachycardia",
    },
    waveform: {
      pattern: "sinus_regular",
      bpm: 126,
      qrs: "narrow",
      irregularity: 0.05,
      amplitude: 1,
      stShift: "normal",
    },
    symptomHints: ["palpitaciones", "ansiedad", "disnea leve"],
    baselineVitals: { hr: 126, sbp: 108, dbp: 66, spo2: 95, rr: 24, temp: 37.7 },
  },
  {
    id: "atrial_fibrillation",
    name: "Fibrilación auricular",
    category: "rhythm",
    difficulty: "basic",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["palpitations", "syncope_collapse", "chest_pain"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: [BASE_FINDINGS.irregularQrs, "ausencia de onda P organizada", "respuesta ventricular variable"],
    expectedConductIds: ["rate_control", "synchronized_cardioversion"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["fibrilacion auricular", "fibrilación auricular", "atrial fibrillation", "fa"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Ritmo irregularmente irregular sin ondas P definidas.",
      stability: "Si hay inestabilidad hemodinámica, cardioversión sincronizada.",
      conduct: "Si está estable, control de frecuencia y estrategia tromboembólica.",
      additionalLeads: "No suelen ser obligatorias salvo sospecha isquémica asociada.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "ventricular_tachycardia",
    },
    waveform: {
      pattern: "af_irregular",
      bpm: 136,
      qrs: "narrow",
      irregularity: 0.42,
      amplitude: 0.95,
      stShift: "normal",
    },
    symptomHints: ["palpitaciones irregulares", "fatiga", "disnea"],
    baselineVitals: { hr: 136, sbp: 98, dbp: 62, spo2: 94, rr: 24, temp: 36.9 },
  },
  {
    id: "atrial_flutter",
    name: "Flutter auricular",
    category: "rhythm",
    difficulty: "intermediate",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["palpitations", "syncope_collapse"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["ondas en diente de sierra", "conducción AV variable", BASE_FINDINGS.regularQrs],
    expectedConductIds: ["rate_control", "synchronized_cardioversion"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["flutter auricular", "atrial flutter"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Actividad auricular en diente de sierra compatible con flutter.",
      stability: "Inestable: cardioversión; estable: control de frecuencia.",
      conduct: "La conducta depende del estado hemodinámico.",
      additionalLeads: "No son mandatorias de rutina.",
    },
    supportsDynamicEvolution: true,
    waveform: {
      pattern: "flutter_saw",
      bpm: 148,
      qrs: "narrow",
      irregularity: 0.18,
      amplitude: 0.9,
      stShift: "normal",
    },
    symptomHints: ["palpitaciones rápidas", "disnea de esfuerzo"],
    baselineVitals: { hr: 148, sbp: 102, dbp: 64, spo2: 95, rr: 22, temp: 36.8 },
  },
  {
    id: "supraventricular_tachycardia",
    name: "Taquicardia supraventricular (TSV)",
    category: "rhythm",
    difficulty: "intermediate",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["palpitations", "syncope_collapse"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["taquicardia regular", "QRS estrecho", BASE_FINDINGS.absentP],
    expectedConductIds: ["vagal_adenosine", "synchronized_cardioversion"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["tsv", "taquicardia supraventricular", "supraventricular tachycardia"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Taquicardia regular de QRS estrecho sugiere TSV.",
      stability: "Inestable: cardioversión. Estable: maniobras vagales/adenosina.",
      conduct: "La decisión inicial depende de estabilidad.",
      additionalLeads: "No son el paso inicial.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "ventricular_tachycardia",
    },
    waveform: {
      pattern: "svt_regular",
      bpm: 182,
      qrs: "narrow",
      irregularity: 0.05,
      amplitude: 1,
      stShift: "normal",
    },
    symptomHints: ["palpitaciones súbitas", "opresión torácica", "diaforesis"],
    baselineVitals: { hr: 182, sbp: 90, dbp: 56, spo2: 93, rr: 28, temp: 36.8 },
  },
  {
    id: "av_block_basic",
    name: "Bloqueo AV de alto grado",
    category: "conduction",
    difficulty: "intermediate",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["syncope_collapse", "electrolyte_disorder"],
    probableStability: "unstable",
    acceptedStabilityDecisions: ["unstable", "critical"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["bradicardia marcada", "disociación AV", BASE_FINDINGS.wideQrs],
    expectedConductIds: ["atropine_pacing", "advanced_life_support"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["bloqueo av", "bloqueo auriculoventricular", "av block"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Bloqueo AV avanzado con riesgo de compromiso hemodinámico.",
      stability: "Debe asumirse inestabilidad si hay síncope/hipotensión.",
      conduct: "Atropina inicial y preparación de marcapasos transcutáneo.",
      additionalLeads: "No son prioritarias frente al deterioro hemodinámico.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "asystole",
    },
    waveform: {
      pattern: "bundle_branch",
      bpm: 32,
      qrs: "wide",
      irregularity: 0.26,
      amplitude: 0.9,
      stShift: "normal",
    },
    symptomHints: ["síncope", "mareo intenso", "hipoperfusión"],
    baselineVitals: { hr: 32, sbp: 78, dbp: 44, spo2: 90, rr: 22, temp: 36.1 },
  },
  {
    id: "ventricular_tachycardia",
    name: "Taquicardia ventricular",
    category: "rhythm",
    difficulty: "basic",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["cardiac_arrest", "syncope_collapse", "chest_pain"],
    probableStability: "critical",
    acceptedStabilityDecisions: ["unstable", "critical"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: [BASE_FINDINGS.wideQrs, "taquicardia regular", BASE_FINDINGS.absentP],
    expectedConductIds: ["synchronized_cardioversion", "defibrillation_cpr", "advanced_life_support"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["taquicardia ventricular", "tv", "ventricular tachycardia"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Taquicardia de QRS ancho de probable origen ventricular.",
      stability: "Debe tratarse como inestable hasta demostrar lo contrario.",
      conduct: "Con pulso inestable: cardioversión. Sin pulso: desfibrilación + RCP.",
      additionalLeads: "No retrasar tratamiento por pedir derivaciones.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifCorrect: "sinus_rhythm_normal",
      ifIncorrect: "ventricular_fibrillation",
      ifDelayed: "ventricular_fibrillation",
    },
    waveform: {
      pattern: "vt_wide",
      bpm: 196,
      qrs: "wide",
      irregularity: 0.08,
      amplitude: 1.15,
      stShift: "normal",
    },
    symptomHints: ["palidez", "hipotensión", "alteración del estado mental"],
    baselineVitals: { hr: 196, sbp: 72, dbp: 40, spo2: 84, rr: 30, temp: 36.7 },
  },
  {
    id: "ventricular_fibrillation",
    name: "Fibrilación ventricular",
    category: "arrest",
    difficulty: "basic",
    viewModes: ["rhythm_monitor"],
    contexts: ["cardiac_arrest"],
    probableStability: "critical",
    acceptedStabilityDecisions: ["critical"],
    availableLeads: ["II"],
    keyFindings: ["actividad eléctrica caótica", "sin complejos QRS organizados", "paro cardiorrespiratorio"],
    expectedConductIds: ["defibrillation_cpr", "advanced_life_support"],
    partialConductIds: [],
    interpretationKeywords: ["fibrilacion ventricular", "fibrilación ventricular", "fv", "ventricular fibrillation"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Trazado caótico sin pulso efectivo.",
      stability: "Paciente críticamente inestable (paro).",
      conduct: "Desfibrilar y RCP de inmediato, sin demoras.",
      additionalLeads: "No aplican en fase de reanimación inicial.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifCorrect: "sinus_rhythm_normal",
      ifIncorrect: "asystole",
      ifDelayed: "asystole",
    },
    waveform: {
      pattern: "vf_chaotic",
      bpm: 240,
      qrs: "wide",
      irregularity: 0.95,
      amplitude: 1.1,
      stShift: "normal",
    },
    symptomHints: ["inconsciente", "sin pulso", "apnea"],
    baselineVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.2 },
  },
  {
    id: "asystole",
    name: "Asistolia",
    category: "arrest",
    difficulty: "basic",
    viewModes: ["rhythm_monitor"],
    contexts: ["cardiac_arrest"],
    probableStability: "critical",
    acceptedStabilityDecisions: ["critical"],
    availableLeads: ["II"],
    keyFindings: ["línea casi plana", "ausencia de actividad ventricular organizada", "paro"],
    expectedConductIds: ["advanced_life_support"],
    partialConductIds: ["defibrillation_cpr"],
    interpretationKeywords: ["asistolia", "asystole"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Ausencia de actividad eléctrica ventricular efectiva.",
      stability: "Escenario de paro cardiorrespiratorio.",
      conduct: "RCP de alta calidad y causas reversibles, no desfibrilar de rutina.",
      additionalLeads: "No aportan en la decisión inicial.",
    },
    supportsDynamicEvolution: true,
    waveform: {
      pattern: "asystole_flat",
      bpm: 0,
      qrs: "wide",
      irregularity: 0,
      amplitude: 0.05,
      stShift: "normal",
    },
    symptomHints: ["inconsciente", "sin respiración", "sin pulso"],
    baselineVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 35.9 },
  },
  {
    id: "pulseless_electrical_activity",
    name: "AESP (actividad eléctrica sin pulso)",
    category: "arrest",
    difficulty: "expert",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["cardiac_arrest", "electrolyte_disorder", "general_critical"],
    probableStability: "critical",
    acceptedStabilityDecisions: ["critical"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["actividad eléctrica organizada sin pulso", "colapso hemodinámico", "buscar H y T"],
    expectedConductIds: ["advanced_life_support", "correct_electrolytes"],
    partialConductIds: ["defibrillation_cpr"],
    interpretationKeywords: ["aesp", "actividad electrica sin pulso", "pulseless electrical activity", "pea"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Ritmo organizado pero sin gasto efectivo.",
      stability: "Corresponde a paro: estado crítico.",
      conduct: "RCP + búsqueda/tratamiento de causas reversibles.",
      additionalLeads: "No retrasar acciones de paro para ampliar derivaciones.",
    },
    supportsDynamicEvolution: true,
    waveform: {
      pattern: "pea_low_amp",
      bpm: 64,
      qrs: "narrow",
      irregularity: 0.1,
      amplitude: 0.35,
      stShift: "normal",
    },
    symptomHints: ["sin pulso palpable", "colapso"],
    baselineVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.0 },
  },
  {
    id: "right_bundle_branch_block",
    name: "Bloqueo de rama derecha",
    category: "conduction",
    difficulty: "advanced",
    viewModes: ["standard_12_lead"],
    contexts: ["chest_pain", "syncope_collapse"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["QRS ancho", "patrón rSR' en V1", "S amplia en I y V6"],
    expectedConductIds: ["monitor_reassess", "acs_protocol"],
    partialConductIds: ["request_additional_leads"],
    interpretationKeywords: ["bloqueo de rama derecha", "brd", "rbbb"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Conducción intraventricular compatible con BRD.",
      stability: "Correlacionar con clínica para definir urgencia.",
      conduct: "Buscar causa de base y descartar isquemia aguda asociada.",
      additionalLeads: "No son obligatorias salvo sospecha específica.",
    },
    supportsDynamicEvolution: false,
    waveform: {
      pattern: "bundle_branch",
      bpm: 88,
      qrs: "wide",
      irregularity: 0.05,
      amplitude: 0.92,
      stShift: "normal",
    },
    symptomHints: ["dolor torácico inespecífico", "palpitaciones"],
    baselineVitals: { hr: 88, sbp: 124, dbp: 78, spo2: 97, rr: 18, temp: 36.7 },
  },
  {
    id: "left_bundle_branch_block",
    name: "Bloqueo de rama izquierda",
    category: "conduction",
    difficulty: "advanced",
    viewModes: ["standard_12_lead"],
    contexts: ["chest_pain", "syncope_collapse"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["QRS ancho", "morfología QS en V1", "onda R ancha en I/V6"],
    expectedConductIds: ["acs_protocol", "monitor_reassess"],
    partialConductIds: ["request_additional_leads"],
    interpretationKeywords: ["bloqueo de rama izquierda", "bri", "lbbb"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Conducción compatible con BRI, potencialmente de alto riesgo en dolor torácico.",
      stability: "La estabilidad la define la clínica y perfusión.",
      conduct: "Si sospecha SCA, activar protocolo sin demoras.",
      additionalLeads: "Pueden ser útiles, pero no reemplazan decisiones de urgencia.",
    },
    supportsDynamicEvolution: false,
    waveform: {
      pattern: "bundle_branch",
      bpm: 84,
      qrs: "wide",
      irregularity: 0.05,
      amplitude: 1,
      stShift: "depressed",
    },
    symptomHints: ["dolor torácico", "disnea"],
    baselineVitals: { hr: 84, sbp: 118, dbp: 74, spo2: 95, rr: 20, temp: 36.8 },
  },
  {
    id: "stemi_anterior",
    name: "IAM con elevación del ST (anterior)",
    category: "ischemia",
    difficulty: "advanced",
    viewModes: ["standard_12_lead"],
    contexts: ["chest_pain", "general_critical"],
    probableStability: "unstable",
    acceptedStabilityDecisions: ["unstable", "critical"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: [BASE_FINDINGS.stElevation, "cambios en V1-V4", "reciprocidad inferior"],
    expectedConductIds: ["acs_protocol", "advanced_life_support"],
    partialConductIds: ["request_additional_leads"],
    interpretationKeywords: ["stemi", "iam con elevacion", "elevacion del st", "infarto anterior"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Elevación del ST compatible con SCA con elevación.",
      stability: "Riesgo alto de deterioro; tratar como urgencia tiempo-dependiente.",
      conduct: "Activar protocolo de reperfusión temprana.",
      additionalLeads: "Podrían complementar, pero no deben retrasar reperfusión.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "ventricular_tachycardia",
    },
    waveform: {
      pattern: "stemi",
      bpm: 104,
      qrs: "narrow",
      irregularity: 0.09,
      amplitude: 1,
      stShift: "elevated",
    },
    symptomHints: ["dolor torácico opresivo", "diaforesis", "náusea"],
    baselineVitals: { hr: 104, sbp: 92, dbp: 58, spo2: 92, rr: 24, temp: 36.6 },
  },
  {
    id: "st_depression_ischemia",
    name: "Isquemia subendocárdica (depresión del ST)",
    category: "ischemia",
    difficulty: "advanced",
    viewModes: ["standard_12_lead"],
    contexts: ["chest_pain", "general_critical"],
    probableStability: "potentially_unstable",
    acceptedStabilityDecisions: ["stable", "unstable"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: [BASE_FINDINGS.stDepression, "cambios difusos de repolarización", "dolor torácico activo"],
    expectedConductIds: ["acs_protocol", "monitor_reassess"],
    partialConductIds: ["request_additional_leads"],
    interpretationKeywords: ["depresion del st", "isquemia", "nstemi", "subendocardica"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Patrón de isquemia sin elevación franca.",
      stability: "Puede deteriorar, requiere reevaluación seriada.",
      conduct: "Iniciar protocolo de SCA sin elevación y monitorizar.",
      additionalLeads: "Puede apoyar si la clínica orienta a posterior/derecho.",
    },
    supportsDynamicEvolution: true,
    waveform: {
      pattern: "st_depression",
      bpm: 96,
      qrs: "narrow",
      irregularity: 0.08,
      amplitude: 1,
      stShift: "depressed",
    },
    symptomHints: ["dolor torácico", "disnea"],
    baselineVitals: { hr: 96, sbp: 106, dbp: 66, spo2: 94, rr: 22, temp: 36.7 },
  },
  {
    id: "hyperkalemia_tall_t",
    name: "Hiperpotasemia (ondas T picudas)",
    category: "electrolyte",
    difficulty: "advanced",
    viewModes: ["rhythm_monitor", "standard_12_lead"],
    contexts: ["electrolyte_disorder", "syncope_collapse"],
    probableStability: "unstable",
    acceptedStabilityDecisions: ["unstable", "critical"],
    availableLeads: [...STANDARD_12_LEADS],
    keyFindings: ["ondas T picudas", "QRS que puede ensancharse", "bradiarritmia progresiva"],
    expectedConductIds: ["correct_electrolytes", "advanced_life_support"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["hiperpotasemia", "ondas t picudas", "hiperkalemia"],
    expectedAdditionalLeads: "none",
    feedbackHints: {
      interpretation: "Cambios ECG compatibles con hiperpotasemia.",
      stability: "Riesgo de arritmia maligna si progresa.",
      conduct: "Corregir potasio de forma urgente y monitorizar continuo.",
      additionalLeads: "No son prioritarias sobre corrección metabólica.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "asystole",
    },
    waveform: {
      pattern: "hyperk",
      bpm: 52,
      qrs: "wide",
      irregularity: 0.15,
      amplitude: 1.25,
      stShift: "normal",
    },
    symptomHints: ["debilidad", "parestesias", "bradicardia"],
    baselineVitals: { hr: 52, sbp: 86, dbp: 52, spo2: 93, rr: 20, temp: 36.5 },
  },
  {
    id: "posterior_mi",
    name: "Infarto posterior",
    category: "ischemia",
    difficulty: "expert",
    viewModes: ["standard_12_lead", "expanded"],
    contexts: ["chest_pain", "general_critical"],
    probableStability: "unstable",
    acceptedStabilityDecisions: ["unstable", "critical"],
    availableLeads: [...STANDARD_12_LEADS, ...POSTERIOR_LEADS],
    keyFindings: ["depresión del ST en V1-V3", "onda R alta en precordiales derechas", "confirmación en V7-V9"],
    expectedConductIds: ["request_additional_leads", "acs_protocol"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["infarto posterior", "posterior mi", "st posterior"],
    expectedAdditionalLeads: "posterior",
    feedbackHints: {
      interpretation: "Sospecha de IAM posterior en ECG basal.",
      stability: "Riesgo alto, requiere actuar temprano.",
      conduct: "Solicitar V7-V9 y activar manejo de SCA.",
      additionalLeads: "V7-V9 son clave para confirmar localización posterior.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "ventricular_tachycardia",
    },
    waveform: {
      pattern: "st_depression",
      bpm: 112,
      qrs: "narrow",
      irregularity: 0.1,
      amplitude: 1,
      stShift: "depressed",
    },
    symptomHints: ["dolor dorsal", "diaforesis", "náusea"],
    baselineVitals: { hr: 112, sbp: 88, dbp: 54, spo2: 91, rr: 26, temp: 36.6 },
  },
  {
    id: "right_ventricular_mi",
    name: "Infarto de ventrículo derecho",
    category: "ischemia",
    difficulty: "expert",
    viewModes: ["standard_12_lead", "expanded"],
    contexts: ["chest_pain", "general_critical"],
    probableStability: "unstable",
    acceptedStabilityDecisions: ["unstable", "critical"],
    availableLeads: [...STANDARD_12_LEADS, ...RIGHT_LEADS],
    keyFindings: ["elevación del ST inferior", "hipotensión con ingurgitación yugular", "confirmación en V4R"],
    expectedConductIds: ["request_additional_leads", "acs_protocol"],
    partialConductIds: ["monitor_reassess"],
    interpretationKeywords: ["infarto de ventriculo derecho", "ventriculo derecho", "v4r positiva", "right ventricular mi"],
    expectedAdditionalLeads: "right",
    feedbackHints: {
      interpretation: "Sospecha de compromiso del ventrículo derecho.",
      stability: "Puede generar hipotensión marcada.",
      conduct: "Solicitar derivaciones derechas (V4R) y activar protocolo SCA.",
      additionalLeads: "V3R-V6R, especialmente V4R, son fundamentales.",
    },
    supportsDynamicEvolution: true,
    dynamicTransitions: {
      ifDelayed: "pulseless_electrical_activity",
    },
    waveform: {
      pattern: "stemi",
      bpm: 108,
      qrs: "narrow",
      irregularity: 0.08,
      amplitude: 1,
      stShift: "elevated",
    },
    symptomHints: ["dolor torácico inferior", "hipotensión", "náusea"],
    baselineVitals: { hr: 108, sbp: 82, dbp: 50, spo2: 92, rr: 24, temp: 36.7 },
  },
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

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function toBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "true" || normalized === "si" || normalized === "sí" || normalized === "1") return true;
    if (normalized === "false" || normalized === "no" || normalized === "0") return false;
  }
  return fallback;
}

function mapDifficulty(value: unknown, fallback: ECGDifficulty): ECGDifficulty {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (normalized === "basic" || normalized === "basico" || normalized === "básico") return "basic";
  if (normalized === "intermediate" || normalized === "intermedio") return "intermediate";
  if (normalized === "advanced" || normalized === "avanzado") return "advanced";
  if (normalized === "expert" || normalized === "experto") return "expert";
  if (normalized === "beginner") return "basic";
  return fallback;
}

function mapViewMode(value: unknown, fallback: ECGViewMode): ECGViewMode {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (normalized === "rhythm_monitor" || normalized === "monitor" || normalized === "monitor_de_ritmo") {
    return "rhythm_monitor";
  }
  if (normalized === "standard_12_lead" || normalized === "ecg_12" || normalized === "12_derivaciones") {
    return "standard_12_lead";
  }
  if (normalized === "expanded" || normalized === "ecg_ampliado") return "expanded";
  return fallback;
}

function mapSelectionMode(value: unknown, fallback: ECGSelectionMode): ECGSelectionMode {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (normalized === "manual") return "manual";
  if (normalized === "random" || normalized === "aleatorio") return "random";
  if (
    normalized === "contextual_random" ||
    normalized === "aleatorio_contextual" ||
    normalized === "aleatorio_segun_contexto"
  ) {
    return "contextual_random";
  }
  return fallback;
}

export function inferEcgClinicalContext(caseObject: any): ECGClinicalContext {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.chief_complaint,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
      caseObject?.meta?.dx_id,
      caseObject?.meta?.dsm_tag,
    ].join(" ")
  );

  if (includesAny(text, ["paro", "rcp", "cardiorrespiratorio", "sin pulso", "inconsciente"])) {
    return "cardiac_arrest";
  }
  if (includesAny(text, ["torac", "angina", "isqu", "coron", "infarto", "stemi"])) {
    return "chest_pain";
  }
  if (includesAny(text, ["palpit", "arrit", "taquic", "latidos"])) {
    return "palpitations";
  }
  if (includesAny(text, ["sincope", "colapso", "desmayo", "presincope", "bradicardia"])) {
    return "syncope_collapse";
  }
  if (includesAny(text, ["potasio", "electrol", "renal", "hiperk", "hiperpot"])) {
    return "electrolyte_disorder";
  }
  return "general_critical";
}

export function deriveDefaultEcgModuleConfig(caseObject?: any): ECGModuleConfig {
  const caseDifficulty = String(caseObject?.meta?.difficulty ?? "").toLowerCase().trim();
  const mappedDifficulty =
    caseDifficulty === "beginner" || caseDifficulty === "1"
      ? "basic"
      : caseDifficulty === "intermediate" || caseDifficulty === "2"
      ? "intermediate"
      : caseDifficulty === "advanced" || caseDifficulty === "3"
      ? "advanced"
      : "basic";

  return {
    ...DEFAULT_ECG_MODULE_CONFIG,
    difficulty: mappedDifficulty,
    viewMode: mappedDifficulty === "basic" ? "rhythm_monitor" : "standard_12_lead",
  };
}

export function normalizeEcgModuleConfig(rawConfig: any, caseObject?: any): ECGModuleConfig {
  const base = deriveDefaultEcgModuleConfig(caseObject);
  const raw = rawConfig && typeof rawConfig === "object" ? rawConfig : {};

  const manualEcgId =
    typeof raw.manualEcgId === "string" && raw.manualEcgId.trim().length > 0
      ? raw.manualEcgId
      : typeof raw.manual_ecg_id === "string" && raw.manual_ecg_id.trim().length > 0
      ? raw.manual_ecg_id
      : null;

  return {
    enabled: toBoolean(raw.enabled, base.enabled),
    viewMode: mapViewMode(raw.viewMode ?? raw.visualizationType ?? raw.visualization_mode, base.viewMode),
    selectionMode: mapSelectionMode(raw.selectionMode ?? raw.selection_mode, base.selectionMode),
    manualEcgId,
    difficulty: mapDifficulty(raw.difficulty, base.difficulty),
    dynamicEnabled: toBoolean(raw.dynamicEnabled ?? raw.ecgDynamic ?? raw.dynamic, base.dynamicEnabled),
    showHints: toBoolean(raw.showHints ?? raw.show_hints, base.showHints),
    showRhythmName: toBoolean(raw.showRhythmName ?? raw.show_rhythm_name, base.showRhythmName),
    allowAdditionalLeads: toBoolean(raw.allowAdditionalLeads ?? raw.allow_additional_leads, base.allowAdditionalLeads),
    immediateFeedback: toBoolean(raw.immediateFeedback ?? raw.feedbackImmediate ?? raw.feedback_immediate, base.immediateFeedback),
  };
}

export function getEcgCaseById(id: string | null | undefined) {
  if (!id) return null;
  return ECG_LIBRARY.find((item) => item.id === id) ?? null;
}

export function listEcgCasesByDifficulty(maxDifficulty: ECGDifficulty) {
  return ECG_LIBRARY.filter((item) => difficultyRank[item.difficulty] <= difficultyRank[maxDifficulty]);
}

export function getEcgPoolForContext(
  config: ECGModuleConfig,
  context?: ECGClinicalContext | null
) {
  let pool = listEcgCasesByDifficulty(config.difficulty);

  if (config.viewMode === "rhythm_monitor") {
    pool = pool.filter((item) => item.viewModes.includes("rhythm_monitor"));
  }

  if (config.viewMode === "expanded") {
    pool = pool.filter((item) => item.viewModes.includes("expanded"));
  }

  if (context) {
    const contextual = pool.filter((item) => item.contexts.includes(context));
    if (contextual.length > 0) pool = contextual;
  }

  return pool;
}

export function getEcgPoolForCase(config: ECGModuleConfig, caseObject: any) {
  const context = config.selectionMode === "contextual_random" ? inferEcgClinicalContext(caseObject) : null;
  return getEcgPoolForContext(config, context);
}

export function pickEcgStudyByConfig(args: {
  config: ECGModuleConfig;
  caseObject: any;
  excludeId?: string | null;
}): ECGCase {
  const { config, caseObject, excludeId } = args;

  if (config.selectionMode === "manual") {
    const manual = getEcgCaseById(config.manualEcgId);
    if (manual) return manual;
  }

  const pool = getEcgPoolForCase(config, caseObject).filter((item) => item.id !== excludeId);
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const fallback =
    (config.selectionMode === "manual" ? getEcgCaseById(config.manualEcgId) : null) ??
    ECG_LIBRARY[0];

  return fallback;
}

export function getEcgViewModeLabel(mode: ECGViewMode) {
  if (mode === "rhythm_monitor") return "Monitor de ritmo";
  if (mode === "standard_12_lead") return "ECG estándar de 12 derivaciones";
  return "ECG ampliado / derivaciones adicionales";
}

export function getEcgSelectionModeLabel(mode: ECGSelectionMode) {
  if (mode === "manual") return "Manual";
  if (mode === "random") return "Aleatorio";
  return "Aleatorio contextual";
}

export function getEcgDifficultyLabel(difficulty: ECGDifficulty) {
  if (difficulty === "basic") return "Básico";
  if (difficulty === "intermediate") return "Intermedio";
  if (difficulty === "advanced") return "Avanzado";
  return "Experto";
}

export function getClinicalContextLabel(context: ECGClinicalContext) {
  if (context === "palpitations") return "Palpitaciones";
  if (context === "chest_pain") return "Dolor torácico";
  if (context === "cardiac_arrest") return "Paro cardiorrespiratorio";
  if (context === "syncope_collapse") return "Síncope/colapso";
  if (context === "electrolyte_disorder") return "Alteración electrolítica";
  return "Contexto crítico general";
}

export function getDecisionStabilityLabel(stability: ECGDecisionStability) {
  if (stability === "stable") return "Estable";
  if (stability === "unstable") return "Inestable";
  return "Crítico";
}

export function getAdditionalLeadRequestLabel(value: ECGAdditionalLeadRequest) {
  if (value === "none") return "No";
  if (value === "right") return "Sí: derivaciones derechas";
  if (value === "posterior") return "Sí: derivaciones posteriores";
  return "Sí: derechas y posteriores";
}

export function getVisibleLeads(args: {
  ecgCase: ECGCase;
  mode: ECGViewMode;
  allowAdditionalLeads: boolean;
  requestedAdditionalLeads: ECGAdditionalLeadRequest;
}) {
  const { ecgCase, mode, allowAdditionalLeads, requestedAdditionalLeads } = args;
  if (mode === "rhythm_monitor") return ["II"] as ECGLead[];

  const base = [...STANDARD_12_LEADS.filter((lead) => ecgCase.availableLeads.includes(lead))];
  if (mode === "standard_12_lead" || !allowAdditionalLeads) return base;

  const includeRight = requestedAdditionalLeads === "right" || requestedAdditionalLeads === "both";
  const includePosterior = requestedAdditionalLeads === "posterior" || requestedAdditionalLeads === "both";
  const right = includeRight ? RIGHT_LEADS.filter((lead) => ecgCase.availableLeads.includes(lead)) : [];
  const posterior = includePosterior ? POSTERIOR_LEADS.filter((lead) => ecgCase.availableLeads.includes(lead)) : [];

  return [...base, ...right, ...posterior];
}

function speedScore(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  if (seconds <= 45) return 10;
  if (seconds <= 90) return 7;
  if (seconds <= 180) return 4;
  return 1;
}

function normalizedWords(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);
}

function containsAnyKeyword(answer: string, keywords: string[]) {
  const normalized = normalizeText(answer);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

function closestStabilityMatch(
  expected: ECGDecisionStability[],
  decided: ECGDecisionStability | ""
): { score: number; correct: boolean } {
  if (!decided) return { score: 0, correct: false };
  if (expected.includes(decided)) return { score: 20, correct: true };

  const unstableLike = expected.includes("unstable") || expected.includes("critical");
  if (unstableLike && (decided === "unstable" || decided === "critical")) {
    return { score: 12, correct: false };
  }
  if (expected.includes("stable") && decided === "unstable") {
    return { score: 8, correct: false };
  }
  return { score: 3, correct: false };
}

function additionalLeadsScore(expected: ECGAdditionalLeadRequest, requested: ECGAdditionalLeadRequest) {
  if (expected === "none") {
    if (requested === "none") return 5;
    return 2;
  }

  if (expected === requested) return 5;
  if (expected === "right" && requested === "both") return 4;
  if (expected === "posterior" && requested === "both") return 4;
  if (requested === "none") return 0;
  return 2;
}

function justificationScore(ecgCase: ECGCase, justification: string) {
  const words = normalizedWords(justification);
  if (words.length < 4) return 0;

  const findingWords = normalizedWords(ecgCase.keyFindings.join(" "));
  const matched = words.filter((word) => findingWords.includes(word));

  if (matched.length >= 3) return 10;
  if (matched.length >= 1) return 6;
  if (justification.trim().length >= 60) return 4;
  return 2;
}

function coherenceScore(args: {
  stabilityDecision: ECGDecisionStability | "";
  conductId: ECGConductId | "";
}) {
  const { stabilityDecision, conductId } = args;
  if (!stabilityDecision || !conductId) return 0;

  const unstableConducts: ECGConductId[] = [
    "synchronized_cardioversion",
    "defibrillation_cpr",
    "advanced_life_support",
    "atropine_pacing",
  ];
  const stableConducts: ECGConductId[] = [
    "monitor_reassess",
    "rate_control",
    "vagal_adenosine",
    "acs_protocol",
    "request_additional_leads",
    "correct_electrolytes",
  ];

  if (stabilityDecision === "critical") {
    return unstableConducts.includes(conductId) ? 10 : 2;
  }
  if (stabilityDecision === "unstable") {
    return unstableConducts.includes(conductId) ? 9 : stableConducts.includes(conductId) ? 4 : 0;
  }
  return stableConducts.includes(conductId) ? 10 : 2;
}

function conductScore(ecgCase: ECGCase, conductId: ECGConductId | "") {
  if (!conductId) return { score: 0, correct: false };
  if (ecgCase.expectedConductIds.includes(conductId)) return { score: 25, correct: true };
  if (Array.isArray(ecgCase.partialConductIds) && ecgCase.partialConductIds.includes(conductId)) {
    return { score: 12, correct: false };
  }
  return { score: 2, correct: false };
}

function interpretationScore(ecgCase: ECGCase, interpretation: string) {
  const correct = containsAnyKeyword(interpretation, ecgCase.interpretationKeywords);
  if (correct) return { score: 20, correct: true };

  const labelWords = normalizedWords(ecgCase.name);
  const answerWords = normalizedWords(interpretation);
  const overlaps = answerWords.filter((word) => labelWords.includes(word));
  if (overlaps.length >= 1) return { score: 10, correct: false };

  if (interpretation.trim().length > 3) return { score: 4, correct: false };
  return { score: 0, correct: false };
}

export function evaluateEcgDecision(args: {
  ecgCase: ECGCase;
  input: ECGDecisionInput;
}): ECGDecisionEvaluation {
  const { ecgCase, input } = args;

  const interpretationResult = interpretationScore(ecgCase, input.interpretation);
  const stabilityResult = closestStabilityMatch(ecgCase.acceptedStabilityDecisions, input.stabilityDecision);
  const conductResult = conductScore(ecgCase, input.conductId);
  const speed = speedScore(input.responseSeconds);
  const coherence = coherenceScore({
    stabilityDecision: input.stabilityDecision,
    conductId: input.conductId,
  });
  const justification = justificationScore(ecgCase, input.justification);
  const additionalLeads = additionalLeadsScore(ecgCase.expectedAdditionalLeads, input.requestedAdditionalLeads);

  const total =
    interpretationResult.score +
    stabilityResult.score +
    conductResult.score +
    speed +
    coherence +
    justification +
    additionalLeads;

  const roundedTotal = Math.max(0, Math.min(100, Math.round(total)));

  const outcome: ECGDecisionEvaluation["outcome"] =
    roundedTotal >= 85 ? "excellent" : roundedTotal >= 70 ? "good" : roundedTotal >= 45 ? "partial" : "unsafe";

  const trend: ECGDecisionEvaluation["trend"] =
    roundedTotal >= 80 && conductResult.correct
      ? "improves"
      : roundedTotal >= 55
      ? "stable"
      : "deteriorates";

  const interpretationFeedback = interpretationResult.correct
    ? `Interpretación del ritmo: correcta. ${ecgCase.feedbackHints.interpretation}`
    : `Interpretación del ritmo: incompleta o incorrecta. ${ecgCase.feedbackHints.interpretation}`;

  const stabilityFeedback = stabilityResult.correct
    ? `Evaluación de estabilidad: adecuada para este escenario.`
    : `Evaluación de estabilidad: requiere ajuste. ${ecgCase.feedbackHints.stability}`;

  const conductFeedback = conductResult.correct
    ? `Conducta inicial: adecuada para la situación clínica.`
    : `Conducta inicial: parcial o no óptima. ${ecgCase.feedbackHints.conduct}`;

  const speedFeedback =
    speed >= 7
      ? "Velocidad de respuesta: buena para un escenario de urgencia."
      : speed >= 4
      ? "Velocidad de respuesta: aceptable, pero puede ser más rápida."
      : "Velocidad de respuesta: lenta para este nivel de riesgo.";

  const coherenceFeedback =
    coherence >= 8
      ? "Coherencia clínica: tu decisión está alineada con la estabilidad hemodinámica."
      : coherence >= 4
      ? "Coherencia clínica: parcialmente alineada; revisa prioridad hemodinámica."
      : "Coherencia clínica: existe discordancia entre gravedad y conducta seleccionada.";

  const justificationFeedback =
    justification >= 8
      ? "Justificación: sólida y basada en hallazgos ECG relevantes."
      : justification >= 4
      ? "Justificación: aceptable, pero faltó integrar más hallazgos clave."
      : "Justificación: insuficiente; usa hallazgos concretos del ECG y estado clínico.";

  const additionalFeedback =
    additionalLeads >= 4
      ? `Derivaciones adicionales: decisión adecuada. ${ecgCase.feedbackHints.additionalLeads}`
      : `Derivaciones adicionales: decisión mejorable. ${ecgCase.feedbackHints.additionalLeads}`;

  const summary =
    outcome === "excellent"
      ? "Razonamiento clínico muy sólido. Mantén esta secuencia: interpretar, estratificar estabilidad y actuar rápido."
      : outcome === "good"
      ? "Buen desempeño global con áreas puntuales para afinar en velocidad o priorización."
      : outcome === "partial"
      ? "Identificaste parte del problema, pero faltó una conducta inicial más alineada al estado hemodinámico."
      : "La decisión actual compromete seguridad clínica. Repite el análisis desde estabilidad y prioridades ABC/algoritmo de arritmias.";

  return {
    totalScore: roundedTotal,
    rubric: {
      interpretation: interpretationResult.score,
      severity: stabilityResult.score,
      conduct: conductResult.score,
      speed,
      coherence,
      justification,
      additionalLeads,
    },
    outcome,
    interpretationCorrect: interpretationResult.correct,
    stabilityCorrect: stabilityResult.correct,
    conductCorrect: conductResult.correct,
    trend,
    feedback: {
      interpretation: interpretationFeedback,
      stability: stabilityFeedback,
      conduct: conductFeedback,
      speed: speedFeedback,
      coherence: coherenceFeedback,
      justification: justificationFeedback,
      additionalLeads: additionalFeedback,
      summary,
    },
  };
}

export function getDynamicNextEcg(args: {
  currentEcg: ECGCase;
  trend: "improves" | "stable" | "deteriorates";
}): ECGCase | null {
  const { currentEcg, trend } = args;
  if (!currentEcg.supportsDynamicEvolution || !currentEcg.dynamicTransitions) return null;

  const nextId =
    trend === "improves"
      ? currentEcg.dynamicTransitions.ifCorrect
      : trend === "deteriorates"
      ? currentEcg.dynamicTransitions.ifIncorrect ?? currentEcg.dynamicTransitions.ifDelayed
      : currentEcg.dynamicTransitions.ifDelayed;

  if (!nextId) return null;
  return getEcgCaseById(nextId);
}

export function deriveVitalsForTrend(args: {
  ecgCase: ECGCase;
  trend: "improves" | "stable" | "deteriorates";
}): ECGVitals {
  const { ecgCase, trend } = args;
  const base = ecgCase.baselineVitals;

  if (trend === "stable") return { ...base };

  if (trend === "improves") {
    return {
      hr: Math.max(0, Math.round(base.hr * 0.88)),
      sbp: Math.min(160, Math.round(base.sbp + 12)),
      dbp: Math.min(100, Math.round(base.dbp + 8)),
      spo2: Math.min(100, Math.round(base.spo2 + 3)),
      rr: Math.max(10, Math.round(base.rr - 3)),
      temp: Math.max(35.5, Number((base.temp - 0.1).toFixed(1))),
    };
  }

  return {
    hr: base.hr === 0 ? 0 : Math.min(230, Math.round(base.hr * 1.12 + 8)),
    sbp: base.sbp === 0 ? 0 : Math.max(50, Math.round(base.sbp - 14)),
    dbp: base.dbp === 0 ? 0 : Math.max(30, Math.round(base.dbp - 10)),
    spo2: base.spo2 === 0 ? 0 : Math.max(70, Math.round(base.spo2 - 4)),
    rr: base.rr === 0 ? 0 : Math.min(38, Math.round(base.rr + 5)),
    temp: Number((base.temp + 0.2).toFixed(1)),
  };
}

export function leadSetSummary(request: ECGAdditionalLeadRequest) {
  if (request === "none") return "Sin derivaciones adicionales";
  if (request === "right") return "Derivaciones derechas (V3R-V6R)";
  if (request === "posterior") return "Derivaciones posteriores (V7-V9)";
  return "Derivaciones derechas y posteriores";
}

export function outcomeTone(outcome: ECGDecisionEvaluation["outcome"]) {
  if (outcome === "excellent") return "emerald";
  if (outcome === "good") return "cyan";
  if (outcome === "partial") return "amber";
  return "red";
}
