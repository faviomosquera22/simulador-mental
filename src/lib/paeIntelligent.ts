import nandaCatalogData from "./data/nandaCatalog.json";
import nocCatalogData from "./data/nocCatalog.json";
import nicCatalogData from "./data/nicCatalog.json";

export type PaeMode = "practice" | "evaluation";

export type PaeClinicalContext =
  | "respiratory"
  | "infection"
  | "metabolic"
  | "renal"
  | "postoperative"
  | "general";

export type PaeTemplateContextFilter = PaeClinicalContext | "all";

export type PaeCueType = "subjective" | "objective" | "history" | "vital";

export type PaeAssessmentCue = {
  id: string;
  label: string;
  type: PaeCueType;
};

export type PaeDiagnosis = {
  id: string;
  domain: string;
  classLabel: string;
  diagnosticLabel: string;
  priority: "high" | "medium" | "low";
  relatedCueIds: string[];
  rationaleKeys: string[];
};

export type PaeOutcome = {
  id: string;
  diagnosisId: string;
  label: string;
  indicators: string[];
  target: string;
};

export type PaeIntervention = {
  id: string;
  diagnosisId: string;
  label: string;
  activities: string[];
  rationale: string;
};

export type PaePatientBrief = {
  name: string;
  age: number;
  sex: "female" | "male" | "unspecified";
  chiefComplaint: string;
  medicalDiagnosis: string;
  pharmacologicGroup: string;
  dietType: string;
};

export type PaeTemplate = {
  id: string;
  name: string;
  context: PaeClinicalContext;
  patient: PaePatientBrief;
  assessmentCues: PaeAssessmentCue[];
  diagnoses: PaeDiagnosis[];
  outcomes: PaeOutcome[];
  interventions: PaeIntervention[];
  evaluationCriteria: string[];
  automaticFeedback: string[];
};

export type PaeDiagnosisSuggestion = {
  diagnosis: PaeDiagnosis;
  score: number;
  matchedCueCount: number;
  rationalePreview: string[];
};

export type PaeDraftInput = {
  selectedCueIds: string[];
  selectedDiagnosisIds: string[];
  selectedOutcomeIds: string[];
  selectedInterventionIds: string[];
  rationaleText: string;
  evaluationText: string;
};

export type PaeValidationResult = {
  totalScore: number;
  outcome: "excellent" | "good" | "partial" | "needs_improvement";
  rubric: {
    assessment: number;
    diagnosis: number;
    outcomes: number;
    interventions: number;
    rationale: number;
    evaluation: number;
  };
  criticalGaps: string[];
  notices: string[];
  summary: string;
};

export type NandaDiagnosis = {
  id: string;
  code: string;
  label: string;
  domain: string;
  classLabel: string;
  contexts: PaeClinicalContext[];
  definingCharacteristics: string[];
  relatedFactors: string[];
};

export type NocOutcome = {
  id: string;
  code: string;
  label: string;
  domain: string;
  linkedNandaIds: string[];
  indicators: string[];
};

export type NicIntervention = {
  id: string;
  code: string;
  label: string;
  classLabel: string;
  linkedNandaIds: string[];
  activities: string[];
};

export type PaeTaxonomySuggestion = {
  nanda: NandaDiagnosis;
  score: number;
  matchedTerms: string[];
  supportingSigns: string[];
  nocOptions: NocOutcome[];
  nicOptions: NicIntervention[];
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

function compactText(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "");
}

const SPANISH_STOPWORDS = new Set([
  "a",
  "al",
  "ante",
  "bajo",
  "con",
  "contra",
  "de",
  "del",
  "desde",
  "durante",
  "el",
  "ella",
  "en",
  "entre",
  "es",
  "esta",
  "este",
  "ha",
  "hacia",
  "hasta",
  "la",
  "las",
  "lo",
  "los",
  "más",
  "mas",
  "no",
  "o",
  "para",
  "pero",
  "por",
  "que",
  "se",
  "segun",
  "sin",
  "sobre",
  "su",
  "sus",
  "tras",
  "un",
  "una",
  "uno",
  "y",
]);

function includesLooseText(haystack: unknown, needle: unknown) {
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);
  if (!normalizedHaystack || !normalizedNeedle) return false;
  if (normalizedHaystack.includes(normalizedNeedle)) return true;
  return compactText(normalizedHaystack).includes(compactText(normalizedNeedle));
}

function extractMeaningfulTerms(value: unknown) {
  return Array.from(
    new Set(
      normalizeText(value)
        .split(" ")
        .filter((term) => term.length >= 3 && !SPANISH_STOPWORDS.has(term))
    )
  );
}

function collectMatchedTerms(terms: string[], texts: Array<unknown>) {
  if (!terms.length || !texts.length) return [];
  const haystack = texts.map((item) => normalizeText(item)).filter(Boolean).join(" ");
  return terms.filter((term) => includesLooseText(haystack, term));
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function overlapByWords(text: string, keys: string[]) {
  const base = normalizeText(text);
  if (!base) return 0;
  return keys.filter((key) => base.includes(normalizeText(key))).length;
}

function inferPaeContextFromNormalizedText(text: string): PaeClinicalContext {
  if (/(neumon|disnea|respir|hipox|oxigen|asma|bronco|epoc|ventil)/.test(text)) return "respiratory";
  if (/(infecc|fiebre|sepsis|pielonef|cistitis|urin|herida|celulitis)/.test(text)) return "infection";
  if (/(glucosa|diabet|ceto|hiperosmolar|metabol|insulin|hipogluc)/.test(text)) return "metabolic";
  if (/(renal|creatin|oliguria|potasio|nefro|diali|diuresis)/.test(text)) return "renal";
  if (/(postoperator|postquir|cirugia|quirurg|incision|recuperacion)/.test(text)) return "postoperative";
  return "general";
}

function getContextHintTerms(context: PaeClinicalContext) {
  if (context === "respiratory") return ["respir", "ventil", "gase", "oxigen", "pulmon"];
  if (context === "infection") return ["infecc", "fiebre", "sepsis", "herida", "aislamiento"];
  if (context === "metabolic") return ["gluc", "insulin", "metabol", "cet", "nutric"];
  if (context === "renal") return ["renal", "diures", "potasio", "creatin", "liquido"];
  if (context === "postoperative") return ["postoperator", "quirurg", "incision", "dolor", "recuper"];
  return ["seguridad", "confort", "movilidad", "dolor"];
}

function rankNocOptions(args: {
  nanda: NandaDiagnosis;
  diagnosisText?: string;
  limit: number;
}) {
  const { nanda, diagnosisText, limit } = args;
  const terms = Array.from(
    new Set([
      ...extractMeaningfulTerms(diagnosisText),
      ...extractMeaningfulTerms(nanda.label),
      ...extractMeaningfulTerms(nanda.domain),
      ...extractMeaningfulTerms(nanda.classLabel),
      ...extractMeaningfulTerms(nanda.definingCharacteristics.join(" ")),
      ...extractMeaningfulTerms(nanda.relatedFactors.join(" ")),
      ...getContextHintTerms(nanda.contexts[0] ?? "general"),
    ])
  );

  const ranked = NOC_LIBRARY.map((item) => {
    const labelMatches = collectMatchedTerms(terms, [item.label, item.domain]);
    const indicatorMatches = collectMatchedTerms(terms, item.indicators);
    const score =
      labelMatches.length * 7 +
      indicatorMatches.length * 5 +
      (includesLooseText(item.label, nanda.label) ? 12 : 0) +
      (item.indicators.length ? 4 : 0);

    return { item, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.code.localeCompare(b.item.code));

  if (ranked.length) return ranked.slice(0, limit).map(({ item }) => item);

  return NOC_LIBRARY.slice(0, limit);
}

function rankNicOptions(args: {
  nanda: NandaDiagnosis;
  diagnosisText?: string;
  limit: number;
}) {
  const { nanda, diagnosisText, limit } = args;
  const terms = Array.from(
    new Set([
      ...extractMeaningfulTerms(diagnosisText),
      ...extractMeaningfulTerms(nanda.label),
      ...extractMeaningfulTerms(nanda.domain),
      ...extractMeaningfulTerms(nanda.classLabel),
      ...extractMeaningfulTerms(nanda.definingCharacteristics.join(" ")),
      ...extractMeaningfulTerms(nanda.relatedFactors.join(" ")),
      ...getContextHintTerms(nanda.contexts[0] ?? "general"),
    ])
  );

  const ranked = NIC_LIBRARY.map((item) => {
    const labelMatches = collectMatchedTerms(terms, [item.label, item.classLabel]);
    const activityMatches = collectMatchedTerms(terms, item.activities);
    const score =
      labelMatches.length * 7 +
      activityMatches.length * 5 +
      (includesLooseText(item.label, nanda.label) ? 10 : 0) +
      (item.activities.length ? 4 : 0);

    return { item, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.code.localeCompare(b.item.code));

  if (ranked.length) return ranked.slice(0, limit).map(({ item }) => item);

  return NIC_LIBRARY.slice(0, limit);
}

export const PAE_TEMPLATE_LIBRARY: PaeTemplate[] = [
  {
    id: "resp_pneumonia_hypoxemia",
    name: "Deterioro respiratorio infeccioso",
    context: "respiratory",
    patient: {
      name: "María G.",
      age: 68,
      sex: "female",
      chiefComplaint: "Disnea, fiebre y tos productiva",
      medicalDiagnosis: "Neumonía adquirida en la comunidad",
      pharmacologicGroup: "Antibiótico + broncodilatador + antipirético",
      dietType: "Blanda hipercalórica fraccionada",
    },
    assessmentCues: [
      { id: "resp_dyspnea", label: "Disnea progresiva", type: "subjective" },
      { id: "resp_cough", label: "Tos productiva con esputo", type: "subjective" },
      { id: "resp_fever", label: "Fiebre > 38°C", type: "objective" },
      { id: "resp_low_spo2", label: "SpO2 88% al aire ambiente", type: "vital" },
      { id: "resp_tachypnea", label: "FR 30 rpm", type: "vital" },
      { id: "resp_crackles", label: "Crepitantes bibasales", type: "objective" },
      { id: "resp_fatigue", label: "Fatiga intensa", type: "subjective" },
    ],
    diagnoses: [
      {
        id: "dx_gas_exchange",
        domain: "Dominio 3: Eliminación e intercambio",
        classLabel: "Clase 4: Función respiratoria",
        diagnosticLabel: "Intercambio gaseoso deteriorado",
        priority: "high",
        relatedCueIds: ["resp_dyspnea", "resp_low_spo2", "resp_tachypnea", "resp_crackles"],
        rationaleKeys: ["hipoxemia", "disnea", "saturacion", "intercambio gaseoso"],
      },
      {
        id: "dx_airway_clearance",
        domain: "Dominio 11: Seguridad/protección",
        classLabel: "Clase 2: Lesión física",
        diagnosticLabel: "Limpieza ineficaz de vías aéreas",
        priority: "high",
        relatedCueIds: ["resp_cough", "resp_crackles", "resp_tachypnea"],
        rationaleKeys: ["secreciones", "tos", "vias aereas"],
      },
      {
        id: "dx_activity_intolerance",
        domain: "Dominio 4: Actividad/reposo",
        classLabel: "Clase 2: Actividad/ejercicio",
        diagnosticLabel: "Intolerancia a la actividad",
        priority: "medium",
        relatedCueIds: ["resp_fatigue", "resp_dyspnea", "resp_tachypnea"],
        rationaleKeys: ["fatiga", "disnea al esfuerzo", "baja tolerancia"],
      },
    ],
    outcomes: [
      {
        id: "out_gas_exchange_1",
        diagnosisId: "dx_gas_exchange",
        label: "Estado respiratorio: intercambio gaseoso",
        indicators: ["SpO2 >= 92%", "FR 12-22 rpm", "disminución de disnea"],
        target: "Mejoría en las próximas 6 horas",
      },
      {
        id: "out_airway_1",
        diagnosisId: "dx_airway_clearance",
        label: "Permeabilidad de vías aéreas",
        indicators: ["Disminución de secreciones", "auscultación con menor ruido agregado"],
        target: "Evolución favorable en 12 horas",
      },
      {
        id: "out_activity_1",
        diagnosisId: "dx_activity_intolerance",
        label: "Tolerancia a la actividad",
        indicators: ["Realiza autocuidado básico sin disnea severa"],
        target: "Progresión durante hospitalización",
      },
    ],
    interventions: [
      {
        id: "int_gas_exchange_1",
        diagnosisId: "dx_gas_exchange",
        label: "Monitorización respiratoria continua",
        activities: ["Control de FR y SpO2 cada 1-2 horas", "vigilar signos de fatiga respiratoria"],
        rationale: "Permite detectar deterioro precoz y ajustar soporte respiratorio.",
      },
      {
        id: "int_airway_1",
        diagnosisId: "dx_airway_clearance",
        label: "Manejo de secreciones",
        activities: ["Favorecer hidratación", "enseñar técnica de tos efectiva", "fisioterapia respiratoria si aplica"],
        rationale: "Facilita el aclaramiento bronquial y mejora la ventilación.",
      },
      {
        id: "int_activity_1",
        diagnosisId: "dx_activity_intolerance",
        label: "Conservación de energía",
        activities: ["Planificar descansos", "fraccionar actividades de autocuidado"],
        rationale: "Reduce demanda metabólica y sensación de disnea.",
      },
    ],
    evaluationCriteria: [
      "Saturación en meta terapéutica",
      "Disnea disminuida respecto al ingreso",
      "Secreciones manejables",
      "Paciente coopera con tratamiento",
    ],
    automaticFeedback: [
      "Prioriza diagnósticos respiratorios de alto riesgo antes de diagnósticos de confort.",
      "Si persiste hipoxemia, revalora necesidad de escalar soporte.",
    ],
  },
  {
    id: "infection_urinary",
    name: "Infección urinaria febril",
    context: "infection",
    patient: {
      name: "Luis M.",
      age: 52,
      sex: "male",
      chiefComplaint: "Fiebre, disuria y dolor lumbar",
      medicalDiagnosis: "Pielonefritis aguda",
      pharmacologicGroup: "Antibiótico + analgésico + hidratación IV",
      dietType: "Dieta general con hidratación reforzada",
    },
    assessmentCues: [
      { id: "uti_fever", label: "Fiebre de 39°C", type: "vital" },
      { id: "uti_dysuria", label: "Disuria y polaquiuria", type: "subjective" },
      { id: "uti_lumbar", label: "Dolor lumbar derecho", type: "subjective" },
      { id: "uti_leukocytosis", label: "Leucocitosis y neutrofilia", type: "objective" },
      { id: "uti_urinalysis", label: "Nitritos y leucocitos positivos en orina", type: "objective" },
      { id: "uti_tachy", label: "FC 112 lpm", type: "vital" },
    ],
    diagnoses: [
      {
        id: "dx_hyperthermia",
        domain: "Dominio 11: Seguridad/protección",
        classLabel: "Clase 6: Termorregulación",
        diagnosticLabel: "Hipertermia",
        priority: "high",
        relatedCueIds: ["uti_fever", "uti_tachy", "uti_leukocytosis"],
        rationaleKeys: ["fiebre", "infeccion", "hipertermia"],
      },
      {
        id: "dx_acute_pain",
        domain: "Dominio 12: Confort",
        classLabel: "Clase 1: Confort físico",
        diagnosticLabel: "Dolor agudo",
        priority: "medium",
        relatedCueIds: ["uti_lumbar", "uti_dysuria"],
        rationaleKeys: ["dolor", "disuria", "lumbar"],
      },
      {
        id: "dx_infection_risk_spread",
        domain: "Dominio 11: Seguridad/protección",
        classLabel: "Clase 1: Infección",
        diagnosticLabel: "Riesgo de progresión de infección",
        priority: "high",
        relatedCueIds: ["uti_fever", "uti_urinalysis", "uti_leukocytosis"],
        rationaleKeys: ["foco urinario", "infeccion", "bacteriana"],
      },
    ],
    outcomes: [
      {
        id: "out_hyperthermia_1",
        diagnosisId: "dx_hyperthermia",
        label: "Termorregulación estable",
        indicators: ["Temperatura <= 37.5°C", "disminución de taquicardia"],
        target: "Control en 24 horas",
      },
      {
        id: "out_pain_1",
        diagnosisId: "dx_acute_pain",
        label: "Control del dolor",
        indicators: ["EVA <= 3/10", "mayor confort al miccionar"],
        target: "Mejoría en 8-12 horas",
      },
      {
        id: "out_infection_1",
        diagnosisId: "dx_infection_risk_spread",
        label: "Control de la infección",
        indicators: ["Estabilidad hemodinámica", "respuesta a antibiótico inicial"],
        target: "Seguimiento diario",
      },
    ],
    interventions: [
      {
        id: "int_temp_1",
        diagnosisId: "dx_hyperthermia",
        label: "Control térmico",
        activities: ["Monitorizar temperatura cada 4 h", "medidas físicas y farmacológicas prescritas"],
        rationale: "Reduce carga metabólica asociada a fiebre.",
      },
      {
        id: "int_pain_1",
        diagnosisId: "dx_acute_pain",
        label: "Manejo del dolor",
        activities: ["Valorar EVA", "administrar analgesia prescrita", "reevaluar respuesta"],
        rationale: "Mejora confort y adherencia al plan terapéutico.",
      },
      {
        id: "int_infection_1",
        diagnosisId: "dx_infection_risk_spread",
        label: "Vigilancia de sepsis y respuesta clínica",
        activities: ["Control de signos vitales", "balance hídrico", "seguimiento de laboratorio"],
        rationale: "Detecta deterioro temprano y guía escalamiento oportuno.",
      },
    ],
    evaluationCriteria: [
      "Temperatura en descenso",
      "Dolor controlado",
      "No hay datos de deterioro hemodinámico",
      "Diuresis y balance dentro de meta",
    ],
    automaticFeedback: [
      "Integra laboratorio y signos vitales para priorizar la vigilancia.",
      "Si no hay respuesta, replantea diagnóstico y escalamiento.",
    ],
  },
  {
    id: "metabolic_hyperglycemia",
    name: "Descompensación metabólica hiperglucémica",
    context: "metabolic",
    patient: {
      name: "Daniel C.",
      age: 61,
      sex: "male",
      chiefComplaint: "Poliuria, polidipsia y debilidad",
      medicalDiagnosis: "Descompensación hiperglucémica",
      pharmacologicGroup: "Insulina + cristaloides + corrección electrolítica",
      dietType: "Dieta diabética controlada posterior a estabilización",
    },
    assessmentCues: [
      { id: "met_hypergly", label: "Glucosa capilar 420 mg/dL", type: "objective" },
      { id: "met_polyuria", label: "Poliuria de 24 h", type: "subjective" },
      { id: "met_polydipsia", label: "Polidipsia", type: "subjective" },
      { id: "met_dehydration", label: "Mucosas secas y turgor disminuido", type: "objective" },
      { id: "met_tachy", label: "FC 118 lpm", type: "vital" },
      { id: "met_k_alter", label: "Potasio fuera de rango", type: "objective" },
    ],
    diagnoses: [
      {
        id: "dx_fluid_deficit",
        domain: "Dominio 2: Nutrición",
        classLabel: "Clase 5: Hidratación",
        diagnosticLabel: "Déficit de volumen de líquidos",
        priority: "high",
        relatedCueIds: ["met_polyuria", "met_dehydration", "met_tachy"],
        rationaleKeys: ["deshidratacion", "poliuria", "hipovolemia"],
      },
      {
        id: "dx_unstable_glucose",
        domain: "Dominio 2: Nutrición",
        classLabel: "Clase 4: Metabolismo",
        diagnosticLabel: "Riesgo de glucemia inestable",
        priority: "high",
        relatedCueIds: ["met_hypergly", "met_polyuria", "met_polydipsia"],
        rationaleKeys: ["glucosa", "hiperglucemia", "metabolica"],
      },
      {
        id: "dx_electrolyte_risk",
        domain: "Dominio 11: Seguridad/protección",
        classLabel: "Clase 5: Procesos defensivos",
        diagnosticLabel: "Riesgo de desequilibrio electrolítico",
        priority: "high",
        relatedCueIds: ["met_k_alter", "met_hypergly"],
        rationaleKeys: ["potasio", "electrolitos", "arritmia"],
      },
    ],
    outcomes: [
      {
        id: "out_fluid_1",
        diagnosisId: "dx_fluid_deficit",
        label: "Hidratación adecuada",
        indicators: ["Mucosas húmedas", "FC en descenso", "diuresis adecuada"],
        target: "Corrección progresiva en 24 h",
      },
      {
        id: "out_glucose_1",
        diagnosisId: "dx_unstable_glucose",
        label: "Control glucémico",
        indicators: ["Glucosa en meta institucional", "ausencia de síntomas neuroglucopénicos"],
        target: "Control inicial en primeras 6-12 h",
      },
      {
        id: "out_elect_1",
        diagnosisId: "dx_electrolyte_risk",
        label: "Equilibrio electrolítico",
        indicators: ["Potasio dentro de rango seguro", "sin eventos arrítmicos"],
        target: "Normalización gradual en 24 h",
      },
    ],
    interventions: [
      {
        id: "int_fluid_1",
        diagnosisId: "dx_fluid_deficit",
        label: "Reposición hídrica y monitorización",
        activities: ["Control estricto de ingresos/egresos", "vigilar perfusión periférica"],
        rationale: "Restituye volumen efectivo y mejora perfusión tisular.",
      },
      {
        id: "int_glucose_1",
        diagnosisId: "dx_unstable_glucose",
        label: "Manejo de glucemia",
        activities: ["Controles glucémicos seriados", "administrar insulina según protocolo"],
        rationale: "Evita complicaciones metabólicas agudas.",
      },
      {
        id: "int_elect_1",
        diagnosisId: "dx_electrolyte_risk",
        label: "Vigilancia de electrolitos y ECG",
        activities: ["Monitorizar potasio sérico", "correlacionar con monitor cardíaco"],
        rationale: "Previene complicaciones arrítmicas potencialmente letales.",
      },
    ],
    evaluationCriteria: [
      "Balance hídrico y hemodinamia en mejoría",
      "Glucosa en tendencia descendente segura",
      "Electrolitos revaluados según protocolo",
      "Paciente con menor sintomatología",
    ],
    automaticFeedback: [
      "Relaciona siempre hiperglucemia con estado de volumen y potasio.",
      "Si hay alteración de potasio, integra conducta con ECG.",
    ],
  },
  {
    id: "renal_hyperkalemia",
    name: "Compromiso renal con hiperpotasemia",
    context: "renal",
    patient: {
      name: "Rosa P.",
      age: 70,
      sex: "female",
      chiefComplaint: "Debilidad, oliguria y malestar general",
      medicalDiagnosis: "Insuficiencia renal aguda con hiperpotasemia",
      pharmacologicGroup: "Estabilización cardíaca + manejo de potasio + soporte renal",
      dietType: "Dieta hipopotasémica / control hídrico",
    },
    assessmentCues: [
      { id: "ren_oliguria", label: "Diuresis < 0.5 mL/kg/h", type: "objective" },
      { id: "ren_high_k", label: "Potasio 6.5 mEq/L", type: "objective" },
      { id: "ren_creat", label: "Creatinina elevada", type: "objective" },
      { id: "ren_weakness", label: "Debilidad muscular", type: "subjective" },
      { id: "ren_ecg_changes", label: "Cambios compatibles en ECG", type: "objective" },
      { id: "ren_brady", label: "Bradicardia", type: "vital" },
    ],
    diagnoses: [
      {
        id: "dx_renal_perf",
        domain: "Dominio 4: Actividad/reposo",
        classLabel: "Clase 4: Respuestas cardiovasculares/pulmonares",
        diagnosticLabel: "Perfusión tisular ineficaz (renal) riesgo",
        priority: "high",
        relatedCueIds: ["ren_oliguria", "ren_creat"],
        rationaleKeys: ["oliguria", "renal", "creatinina"],
      },
      {
        id: "dx_electrolyte_acute",
        domain: "Dominio 11: Seguridad/protección",
        classLabel: "Clase 5: Procesos defensivos",
        diagnosticLabel: "Riesgo alto de desequilibrio electrolítico",
        priority: "high",
        relatedCueIds: ["ren_high_k", "ren_ecg_changes", "ren_brady"],
        rationaleKeys: ["hiperpotasemia", "ecg", "arritmia"],
      },
      {
        id: "dx_activity_weakness",
        domain: "Dominio 4: Actividad/reposo",
        classLabel: "Clase 2: Actividad/ejercicio",
        diagnosticLabel: "Fatiga / debilidad relacionada con alteración metabólica",
        priority: "medium",
        relatedCueIds: ["ren_weakness", "ren_high_k"],
        rationaleKeys: ["debilidad", "fatiga", "metabolico"],
      },
    ],
    outcomes: [
      {
        id: "out_renal_1",
        diagnosisId: "dx_renal_perf",
        label: "Función renal estabilizada",
        indicators: ["Diuresis en mejoría", "laboratorio renal sin deterioro progresivo"],
        target: "Seguimiento cada 24 h",
      },
      {
        id: "out_elect_acute_1",
        diagnosisId: "dx_electrolyte_acute",
        label: "Seguridad electrolítica y eléctrica",
        indicators: ["Potasio en rango seguro", "sin progresión de alteraciones en ECG"],
        target: "Prioridad inmediata",
      },
      {
        id: "out_fatigue_1",
        diagnosisId: "dx_activity_weakness",
        label: "Disminución de fatiga",
        indicators: ["Mejor tolerancia a actividad mínima", "menor debilidad"],
        target: "Mejoría progresiva",
      },
    ],
    interventions: [
      {
        id: "int_renal_1",
        diagnosisId: "dx_renal_perf",
        label: "Control de función renal y balance",
        activities: ["Registro de diuresis horaria", "control de balance acumulado"],
        rationale: "Permite valorar respuesta al tratamiento y perfusión renal.",
      },
      {
        id: "int_elect_acute_1",
        diagnosisId: "dx_electrolyte_acute",
        label: "Manejo urgente de hiperpotasemia",
        activities: ["Aplicar protocolo institucional", "monitorización cardíaca continua"],
        rationale: "Disminuye riesgo de arritmias graves.",
      },
      {
        id: "int_fatigue_1",
        diagnosisId: "dx_activity_weakness",
        label: "Plan de actividad tolerada",
        activities: ["Asistencia en movilización", "pausas de descanso"],
        rationale: "Favorece seguridad y conservación de energía.",
      },
    ],
    evaluationCriteria: [
      "No hay deterioro hemodinámico",
      "Potasio en descenso controlado",
      "Ritmo cardíaco estable",
      "Balance hídrico y diuresis monitorizados",
    ],
    automaticFeedback: [
      "En hiperpotasemia, prioriza seguridad cardiovascular antes de objetivos de confort.",
      "Incluye siempre la correlación laboratorio-ECG en la fundamentación.",
    ],
  },
];

export function getPaeTemplateById(id: string) {
  return PAE_TEMPLATE_LIBRARY.find((item) => item.id === id) ?? null;
}

export function inferPaeContextFromText(text: string): PaeClinicalContext {
  return inferPaeContextFromNormalizedText(normalizeText(text));
}

export function inferPaeContextFromCase(caseObject: any): PaeClinicalContext {
  return inferPaeContextFromNormalizedText(
    normalizeText(
      [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.chief_complaint,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
      caseObject?.meta?.dx_id,
      caseObject?.meta?.dsm_tag,
      ].join(" ")
    )
  );
}

export function pickContextualPaeTemplate(caseObject: any, excludeId?: string) {
  const context = inferPaeContextFromCase(caseObject);
  const contextual = PAE_TEMPLATE_LIBRARY.filter((item) => item.context === context && item.id !== excludeId);
  if (contextual.length) return contextual[Math.floor(Math.random() * contextual.length)];

  const fallback = PAE_TEMPLATE_LIBRARY.filter((item) => item.id !== excludeId);
  return fallback[Math.floor(Math.random() * fallback.length)] ?? PAE_TEMPLATE_LIBRARY[0];
}

export function pickRandomPaeTemplate(excludeId?: string) {
  const pool = PAE_TEMPLATE_LIBRARY.filter((item) => item.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)] ?? PAE_TEMPLATE_LIBRARY[0];
}

export function getPaeTemplatesByContext(context: PaeTemplateContextFilter) {
  if (context === "all") return [...PAE_TEMPLATE_LIBRARY];
  return PAE_TEMPLATE_LIBRARY.filter((item) => item.context === context);
}

export function pickRandomPaeTemplateByContext(args: {
  context: PaeTemplateContextFilter;
  excludeId?: string;
}) {
  const base = getPaeTemplatesByContext(args.context).filter((item) => item.id !== args.excludeId);
  if (base.length) return base[Math.floor(Math.random() * base.length)];
  return pickRandomPaeTemplate(args.excludeId);
}

export function getPaeContextLabel(context: PaeTemplateContextFilter) {
  if (context === "all") return "Todas las categorías";
  if (context === "respiratory") return "Respiratorio";
  if (context === "infection") return "Infeccioso";
  if (context === "metabolic") return "Metabólico";
  if (context === "renal") return "Renal";
  if (context === "postoperative") return "Postoperatorio";
  return "General";
}

const ALL_PAE_CONTEXTS: PaeClinicalContext[] = [
  "respiratory",
  "infection",
  "metabolic",
  "renal",
  "postoperative",
  "general",
];

function sanitizeNandaRow(row: Partial<NandaDiagnosis>): NandaDiagnosis | null {
  const code = String(row.code ?? "").trim();
  const label = String(row.label ?? "").trim();
  const id = String(row.id ?? `nanda_${code}`).trim();
  if (!code || !label || !id) return null;

  const contexts = Array.isArray(row.contexts)
    ? row.contexts.filter((item): item is PaeClinicalContext =>
        ALL_PAE_CONTEXTS.includes(item as PaeClinicalContext)
      )
    : [];

  return {
    id,
    code,
    label,
    domain: String(row.domain ?? "Dominio no especificado").trim(),
    classLabel: String(row.classLabel ?? "Clase no especificada").trim(),
    contexts: contexts.length ? contexts : ["general"],
    definingCharacteristics: Array.isArray(row.definingCharacteristics)
      ? row.definingCharacteristics.filter(Boolean)
      : [],
    relatedFactors: Array.isArray(row.relatedFactors) ? row.relatedFactors.filter(Boolean) : [],
  };
}

function sanitizeNocRow(row: Partial<NocOutcome>): NocOutcome | null {
  const code = String(row.code ?? "").trim();
  const label = String(row.label ?? "").trim();
  const id = String(row.id ?? `noc_${code}`).trim();
  if (!code || !label || !id) return null;

  return {
    id,
    code,
    label,
    domain: String(row.domain ?? "Taxonomia NOC").trim(),
    linkedNandaIds: Array.isArray(row.linkedNandaIds) ? row.linkedNandaIds.filter(Boolean) : [],
    indicators: Array.isArray(row.indicators) ? row.indicators.filter(Boolean) : [],
  };
}

function sanitizeNicRow(row: Partial<NicIntervention>): NicIntervention | null {
  const code = String(row.code ?? "").trim();
  const label = String(row.label ?? "").trim();
  const id = String(row.id ?? `nic_${code}`).trim();
  if (!code || !label || !id) return null;

  return {
    id,
    code,
    label,
    classLabel: String(row.classLabel ?? "Taxonomia NIC").trim(),
    linkedNandaIds: Array.isArray(row.linkedNandaIds) ? row.linkedNandaIds.filter(Boolean) : [],
    activities: Array.isArray(row.activities) ? row.activities.filter(Boolean) : [],
  };
}

export const NANDA_LIBRARY: NandaDiagnosis[] = (nandaCatalogData as Array<Partial<NandaDiagnosis>>)
  .map(sanitizeNandaRow)
  .filter((row): row is NandaDiagnosis => Boolean(row));

export const NOC_LIBRARY: NocOutcome[] = (nocCatalogData as Array<Partial<NocOutcome>>)
  .map(sanitizeNocRow)
  .filter((row): row is NocOutcome => Boolean(row));

export const NIC_LIBRARY: NicIntervention[] = (nicCatalogData as Array<Partial<NicIntervention>>)
  .map(sanitizeNicRow)
  .filter((row): row is NicIntervention => Boolean(row));

export function getNandaByContext(context: PaeTemplateContextFilter) {
  if (context === "all") return [...NANDA_LIBRARY];
  return NANDA_LIBRARY.filter((item) => item.contexts.includes(context));
}

export function getNocByNandaIds(selectedNandaIds: string[]) {
  if (!selectedNandaIds.length) return [...NOC_LIBRARY];
  const set = new Set(selectedNandaIds);
  return NOC_LIBRARY.filter(
    (item) => !item.linkedNandaIds.length || item.linkedNandaIds.some((id) => set.has(id))
  );
}

export function getNicByNandaIds(selectedNandaIds: string[]) {
  if (!selectedNandaIds.length) return [...NIC_LIBRARY];
  const set = new Set(selectedNandaIds);
  return NIC_LIBRARY.filter(
    (item) => !item.linkedNandaIds.length || item.linkedNandaIds.some((id) => set.has(id))
  );
}

export function getSuggestedNocOptions(args: {
  nanda: NandaDiagnosis;
  diagnosisText?: string;
  limit?: number;
}) {
  return rankNocOptions({
    nanda: args.nanda,
    diagnosisText: args.diagnosisText,
    limit: Math.max(1, args.limit ?? 6),
  });
}

export function getSuggestedNicOptions(args: {
  nanda: NandaDiagnosis;
  diagnosisText?: string;
  limit?: number;
}) {
  return rankNicOptions({
    nanda: args.nanda,
    diagnosisText: args.diagnosisText,
    limit: Math.max(1, args.limit ?? 6),
  });
}

export function suggestPaeTaxonomyBundles(args: {
  diagnosisText: string;
  context?: PaeTemplateContextFilter;
  limit?: number;
}): PaeTaxonomySuggestion[] {
  const diagnosisText = String(args.diagnosisText ?? "");
  const limit = Math.max(1, args.limit ?? 6);
  const detectedContext =
    args.context && args.context !== "all" ? args.context : inferPaeContextFromText(diagnosisText);
  const queryTerms = extractMeaningfulTerms(diagnosisText);
  const templateHints = PAE_TEMPLATE_LIBRARY.filter((template) => {
    if (detectedContext !== "general" && template.context !== detectedContext) return false;
    return collectMatchedTerms(queryTerms, [
      template.name,
      template.patient.chiefComplaint,
      template.patient.medicalDiagnosis,
      ...template.diagnoses.map((diagnosis) => diagnosis.diagnosticLabel),
    ]).length > 0;
  });

  const pool = args.context && args.context !== "all" ? getNandaByContext(args.context) : getNandaByContext(detectedContext);

  const ranked = pool
    .map((item) => {
      const labelMatches = collectMatchedTerms(queryTerms, [item.label, item.domain, item.classLabel]);
      const characteristicMatches = collectMatchedTerms(queryTerms, item.definingCharacteristics);
      const factorMatches = collectMatchedTerms(queryTerms, item.relatedFactors);
      const templateBonus = templateHints.some((template) =>
        template.diagnoses.some(
          (diagnosis) =>
            includesLooseText(diagnosis.diagnosticLabel, item.label) ||
            includesLooseText(item.label, diagnosis.diagnosticLabel)
        )
      )
        ? 12
        : 0;
      const contextBonus = item.contexts.includes(detectedContext) ? 18 : 0;
      const score =
        contextBonus +
        templateBonus +
        labelMatches.length * 10 +
        characteristicMatches.length * 7 +
        factorMatches.length * 5;

      return {
        nanda: item,
        score,
        matchedTerms: Array.from(new Set([...labelMatches, ...characteristicMatches, ...factorMatches])).slice(0, 6),
        supportingSigns: uniqueById(
          [...item.definingCharacteristics, ...item.relatedFactors]
            .filter((entry) => collectMatchedTerms(queryTerms, [entry]).length > 0)
            .map((entry, index) => ({ id: `${item.id}_${index}_${entry}`, label: entry }))
        )
          .map((entry) => entry.label)
          .slice(0, 4),
      };
    })
    .sort((a, b) => b.score - a.score || a.nanda.code.localeCompare(b.nanda.code));

  const filteredRanked = ranked.filter((item, index) => item.score > 0 || index < limit);

  return filteredRanked.slice(0, limit).map((item) => ({
    nanda: item.nanda,
    score: item.score,
    matchedTerms: item.matchedTerms,
    supportingSigns: item.supportingSigns.length
      ? item.supportingSigns
      : item.nanda.definingCharacteristics.slice(0, 3),
    nocOptions: getSuggestedNocOptions({
      nanda: item.nanda,
      diagnosisText,
      limit: 4,
    }),
    nicOptions: getSuggestedNicOptions({
      nanda: item.nanda,
      diagnosisText,
      limit: 4,
    }),
  }));
}

export function validateTaxonomySelection(args: {
  selectedCueIds: string[];
  selectedNandaIds: string[];
  selectedNocIds: string[];
  selectedNicIds: string[];
  rationaleText: string;
  evaluationText: string;
}): PaeValidationResult {
  const selectedNandaSet = new Set(args.selectedNandaIds);
  const selectedNocSet = new Set(args.selectedNocIds);
  const selectedNicSet = new Set(args.selectedNicIds);

  const criticalGaps: string[] = [];
  const notices: string[] = [];

  const assessmentScore = Math.min(20, args.selectedCueIds.length >= 3 ? 20 : args.selectedCueIds.length * 6);
  if (args.selectedCueIds.length < 3) {
    criticalGaps.push("La valoración es escasa para sustentar el PAE.");
  }

  const diagnosisScore = Math.min(25, args.selectedNandaIds.length * 8);
  if (!args.selectedNandaIds.length) {
    criticalGaps.push("No seleccionaste diagnósticos NANDA.");
  }

  let outcomesScore = 0;
  if (!args.selectedNocIds.length) {
    criticalGaps.push("No seleccionaste resultados NOC.");
  } else {
    const validCount = NOC_LIBRARY.filter(
      (item) =>
        selectedNocSet.has(item.id) &&
        (!item.linkedNandaIds.length || item.linkedNandaIds.some((id) => selectedNandaSet.has(id)))
    ).length;
    outcomesScore = Math.round((validCount / args.selectedNocIds.length) * 20);
    if (validCount < args.selectedNocIds.length) {
      notices.push("Hay resultados NOC sin relación directa con los diagnósticos NANDA elegidos.");
    }
  }

  let interventionsScore = 0;
  if (!args.selectedNicIds.length) {
    criticalGaps.push("No seleccionaste intervenciones NIC.");
  } else {
    const validCount = NIC_LIBRARY.filter(
      (item) =>
        selectedNicSet.has(item.id) &&
        (!item.linkedNandaIds.length || item.linkedNandaIds.some((id) => selectedNandaSet.has(id)))
    ).length;
    interventionsScore = Math.round((validCount / args.selectedNicIds.length) * 20);
    if (validCount < args.selectedNicIds.length) {
      notices.push("Hay intervenciones NIC sin relación directa con los diagnósticos NANDA elegidos.");
    }
  }

  const rationaleWords = normalizeText(args.rationaleText).split(" ").filter(Boolean).length;
  const rationaleScore = Math.min(10, rationaleWords >= 18 ? 10 : Math.round(rationaleWords * 0.5));
  if (rationaleWords < 10) {
    notices.push("La fundamentación es breve; amplía razonamiento clínico.");
  }

  const evaluationWords = normalizeText(args.evaluationText).split(" ").filter(Boolean).length;
  const evaluationScore = Math.min(5, evaluationWords >= 10 ? 5 : Math.round(evaluationWords * 0.5));
  if (evaluationWords < 6) {
    notices.push("La evaluación final requiere mayor detalle.");
  }

  const total = Math.max(
    0,
    Math.min(
      100,
      assessmentScore +
        diagnosisScore +
        outcomesScore +
        interventionsScore +
        rationaleScore +
        evaluationScore
    )
  );

  const outcome: PaeValidationResult["outcome"] =
    total >= 85 ? "excellent" : total >= 70 ? "good" : total >= 45 ? "partial" : "needs_improvement";

  const summary =
    outcome === "excellent"
      ? "PAE autónomo sólido con taxonomías NANDA/NOC/NIC coherentes."
      : outcome === "good"
      ? "Buen trabajo en modo autónomo; ajusta algunas relaciones NANDA-NOC-NIC."
      : outcome === "partial"
      ? "PAE autónomo parcial; revisa coherencia entre taxonomías."
      : "PAE autónomo insuficiente; requiere reforzar selección y coherencia taxonómica.";

  return {
    totalScore: total,
    outcome,
    rubric: {
      assessment: assessmentScore,
      diagnosis: diagnosisScore,
      outcomes: outcomesScore,
      interventions: interventionsScore,
      rationale: rationaleScore,
      evaluation: evaluationScore,
    },
    criticalGaps,
    notices,
    summary,
  };
}

export function suggestDiagnoses(args: {
  template: PaeTemplate;
  selectedCueIds: string[];
  valuationText?: string;
}) {
  const selectedSet = new Set(args.selectedCueIds);
  const text = normalizeText(args.valuationText ?? "");

  const suggestions: PaeDiagnosisSuggestion[] = args.template.diagnoses
    .map((diagnosis) => {
      const matchedCueCount = diagnosis.relatedCueIds.filter((cueId) => selectedSet.has(cueId)).length;
      const matchedRatio = diagnosis.relatedCueIds.length
        ? matchedCueCount / diagnosis.relatedCueIds.length
        : 0;
      const textOverlap = overlapByWords(text, diagnosis.rationaleKeys);
      const priorityBonus = diagnosis.priority === "high" ? 12 : diagnosis.priority === "medium" ? 7 : 4;
      const score = Math.round(matchedRatio * 70 + Math.min(18, textOverlap * 6) + priorityBonus);

      const rationalePreview = diagnosis.relatedCueIds
        .filter((cueId) => selectedSet.has(cueId))
        .slice(0, 3);

      return {
        diagnosis,
        score,
        matchedCueCount,
        rationalePreview,
      };
    })
    .sort((a, b) => b.score - a.score);

  return suggestions;
}

export function suggestOutcomes(template: PaeTemplate, selectedDiagnosisIds: string[]) {
  const selected = new Set(selectedDiagnosisIds);
  return uniqueById(template.outcomes.filter((item) => selected.has(item.diagnosisId)));
}

export function suggestInterventions(template: PaeTemplate, selectedDiagnosisIds: string[]) {
  const selected = new Set(selectedDiagnosisIds);
  return uniqueById(template.interventions.filter((item) => selected.has(item.diagnosisId)));
}

export function validatePaeDraft(args: {
  template: PaeTemplate;
  draft: PaeDraftInput;
}): PaeValidationResult {
  const { template, draft } = args;
  const selectedCueSet = new Set(draft.selectedCueIds);
  const selectedOutcomeSet = new Set(draft.selectedOutcomeIds);
  const selectedInterventionSet = new Set(draft.selectedInterventionIds);

  const criticalGaps: string[] = [];
  const notices: string[] = [];

  const assessmentScore = Math.min(20, draft.selectedCueIds.length >= 3 ? 20 : draft.selectedCueIds.length * 6);
  if (draft.selectedCueIds.length < 3) {
    criticalGaps.push("La valoración tiene pocos hallazgos seleccionados.");
  }

  let diagnosisScore = 0;
  if (!draft.selectedDiagnosisIds.length) {
    criticalGaps.push("No seleccionaste diagnóstico(s) de enfermería.");
  } else {
    let matched = 0;
    for (const diagnosisId of draft.selectedDiagnosisIds) {
      const diagnosis = template.diagnoses.find((item) => item.id === diagnosisId);
      if (!diagnosis) continue;
      const overlap = diagnosis.relatedCueIds.filter((cueId) => selectedCueSet.has(cueId)).length;
      if (overlap > 0) matched += 1;
      else notices.push(`El diagnóstico "${diagnosis.diagnosticLabel}" no tiene sustento claro en la valoración elegida.`);
    }

    const ratio = matched / draft.selectedDiagnosisIds.length;
    diagnosisScore = Math.round(ratio * 25);
    if (matched === 0) {
      criticalGaps.push("Los diagnósticos seleccionados no se relacionan con los hallazgos de valoración.");
    }
  }

  let outcomesScore = 0;
  if (!draft.selectedOutcomeIds.length) {
    criticalGaps.push("Falta definir resultados esperados.");
  } else {
    const coveredDiagnoses = new Set(
      template.outcomes
        .filter((item) => selectedOutcomeSet.has(item.id))
        .map((item) => item.diagnosisId)
    );
    const expected = draft.selectedDiagnosisIds.length || 1;
    outcomesScore = Math.round((coveredDiagnoses.size / expected) * 20);
    if (coveredDiagnoses.size < draft.selectedDiagnosisIds.length) {
      notices.push("Algunos diagnósticos no tienen resultado esperado asociado.");
    }
  }

  let interventionsScore = 0;
  if (!draft.selectedInterventionIds.length) {
    criticalGaps.push("Falta seleccionar intervenciones de enfermería.");
  } else {
    const coveredDiagnoses = new Set(
      template.interventions
        .filter((item) => selectedInterventionSet.has(item.id))
        .map((item) => item.diagnosisId)
    );
    const expected = draft.selectedDiagnosisIds.length || 1;
    interventionsScore = Math.round((coveredDiagnoses.size / expected) * 20);
    if (coveredDiagnoses.size < draft.selectedDiagnosisIds.length) {
      notices.push("Algunos diagnósticos no tienen intervención directa seleccionada.");
    }
  }

  const rationaleWords = normalizeText(draft.rationaleText).split(" ").filter(Boolean).length;
  const rationaleScore = Math.min(10, rationaleWords >= 18 ? 10 : Math.round(rationaleWords * 0.5));
  if (rationaleWords < 10) {
    notices.push("La fundamentación es breve; añade base clínica de la elección.");
  }

  const evaluationWords = normalizeText(draft.evaluationText).split(" ").filter(Boolean).length;
  const evaluationScore = Math.min(5, evaluationWords >= 10 ? 5 : Math.round(evaluationWords * 0.5));
  if (evaluationWords < 6) {
    notices.push("La evaluación final necesita más detalle sobre evolución/cumplimiento.");
  }

  const total = Math.max(
    0,
    Math.min(
      100,
      assessmentScore +
        diagnosisScore +
        outcomesScore +
        interventionsScore +
        rationaleScore +
        evaluationScore
    )
  );

  const outcome: PaeValidationResult["outcome"] =
    total >= 85 ? "excellent" : total >= 70 ? "good" : total >= 45 ? "partial" : "needs_improvement";

  const summary =
    outcome === "excellent"
      ? "PAE coherente y bien estructurado; integra valoración, diagnóstico, resultados e intervenciones."
      : outcome === "good"
      ? "Buen PAE, con ajustes menores en coherencia o profundidad de fundamentación."
      : outcome === "partial"
      ? "PAE parcialmente consistente; revisa vínculos entre diagnóstico, resultados e intervenciones."
      : "PAE incompleto o con baja coherencia clínica; requiere reestructuración por etapas.";

  return {
    totalScore: total,
    outcome,
    rubric: {
      assessment: assessmentScore,
      diagnosis: diagnosisScore,
      outcomes: outcomesScore,
      interventions: interventionsScore,
      rationale: rationaleScore,
      evaluation: evaluationScore,
    },
    criticalGaps,
    notices,
    summary,
  };
}

export function getPaeModeLabel(mode: PaeMode) {
  return mode === "practice" ? "Práctica guiada" : "Evaluación";
}

export function getCueTypeLabel(type: PaeCueType) {
  if (type === "subjective") return "Subjetivo";
  if (type === "objective") return "Objetivo";
  if (type === "history") return "Antecedente";
  return "Signo vital";
}

export function getPriorityTone(priority: PaeDiagnosis["priority"]) {
  if (priority === "high") return "border-red-400/30 bg-red-400/10 text-red-100";
  if (priority === "medium") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}
