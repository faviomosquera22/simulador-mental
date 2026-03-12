export type LabDifficulty = "basic" | "intermediate" | "advanced";

export type LabMode = "practice" | "evaluation";

export type LabStatus = "low" | "normal" | "high";

export type LabCategory =
  | "hemograma"
  | "quimica_basica"
  | "electrolitos"
  | "orina"
  | "inflamatorio"
  | "hepatico";

export type LabClinicalContext =
  | "infection"
  | "renal"
  | "anemia"
  | "metabolic"
  | "urinary"
  | "hepatobiliary"
  | "chest_pain"
  | "general";

export type LabParameter = {
  id: string;
  name: string;
  category: LabCategory;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: LabStatus;
  interpretationHint: string;
};

export type LabPanel = {
  id: string;
  name: string;
  parameters: LabParameter[];
};

export type LabPatientBrief = {
  name: string;
  age: number;
  sex: "female" | "male" | "unspecified";
  chiefComplaint: string;
};

export type LabCaseSet = {
  id: string;
  name: string;
  context: LabClinicalContext;
  difficulty: LabDifficulty;
  patient: LabPatientBrief;
  panels: LabPanel[];
  mainFinding: string;
  interpretationExpected: string;
  suggestedAction: string;
  educationalExplanation: string;
  expectedAlteredIds: string[];
  suspicionKeywords: string[];
  actionKeywords: string[];
};

export type LabInterpretationInput = {
  alteredParameterIds: string[];
  mainFinding: string;
  clinicalSuspicion: string;
  nextStep: string;
};

export type LabInterpretationResult = {
  totalScore: number;
  rubric: {
    alteredValues: number;
    mainFinding: number;
    clinicalCorrelation: number;
    nextStep: number;
  };
  outcome: "excellent" | "good" | "partial" | "needs_improvement";
  feedback: {
    alteredValues: string;
    mainFinding: string;
    clinicalCorrelation: string;
    nextStep: string;
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

function overlapScore(answer: string, keywords: string[]) {
  const norm = normalizeText(answer);
  const hits = keywords.filter((keyword) => norm.includes(normalizeText(keyword))).length;
  if (hits >= 3) return 25;
  if (hits >= 2) return 18;
  if (hits >= 1) return 10;
  return 0;
}

export const LAB_CASE_LIBRARY: LabCaseSet[] = [
  {
    id: "sepsis_bacterial",
    name: "Perfil inflamatorio compatible con sepsis",
    context: "infection",
    difficulty: "basic",
    patient: {
      name: "Carlos V.",
      age: 67,
      sex: "male",
      chiefComplaint: "Fiebre, taquicardia y deterioro del estado general",
    },
    panels: [
      {
        id: "cbc",
        name: "Hemograma",
        parameters: [
          {
            id: "hb",
            name: "Hemoglobina",
            category: "hemograma",
            value: 12.5,
            unit: "g/dL",
            referenceRange: "13.0 - 17.0",
            status: "low",
            interpretationHint: "Descenso leve que puede acompañar proceso inflamatorio.",
          },
          {
            id: "ht",
            name: "Hematocrito",
            category: "hemograma",
            value: 37,
            unit: "%",
            referenceRange: "40 - 52",
            status: "low",
            interpretationHint: "Hemoconcentración ausente; vigilar estado de volumen.",
          },
          {
            id: "wbc",
            name: "Leucocitos",
            category: "hemograma",
            value: 18800,
            unit: "/mm³",
            referenceRange: "4,000 - 11,000",
            status: "high",
            interpretationHint: "Leucocitosis marcada compatible con infección aguda.",
          },
          {
            id: "neut",
            name: "Neutrófilos",
            category: "hemograma",
            value: 88,
            unit: "%",
            referenceRange: "40 - 70",
            status: "high",
            interpretationHint: "Neutrofilia sugerente de etiología bacteriana.",
          },
          {
            id: "lym",
            name: "Linfocitos",
            category: "hemograma",
            value: 8,
            unit: "%",
            referenceRange: "20 - 45",
            status: "low",
            interpretationHint: "Linfopenia frecuente en respuesta inflamatoria severa.",
          },
          {
            id: "plt",
            name: "Plaquetas",
            category: "hemograma",
            value: 132000,
            unit: "/mm³",
            referenceRange: "150,000 - 450,000",
            status: "low",
            interpretationHint: "Plaquetas bajas pueden asociarse a sepsis avanzada.",
          },
        ],
      },
      {
        id: "chem",
        name: "Química básica",
        parameters: [
          {
            id: "glucose",
            name: "Glucosa",
            category: "quimica_basica",
            value: 146,
            unit: "mg/dL",
            referenceRange: "70 - 110",
            status: "high",
            interpretationHint: "Hiperglucemia de estrés.",
          },
          {
            id: "urea",
            name: "Urea",
            category: "quimica_basica",
            value: 52,
            unit: "mg/dL",
            referenceRange: "15 - 45",
            status: "high",
            interpretationHint: "Sugerente de catabolismo/hipoperfusión.",
          },
          {
            id: "creat",
            name: "Creatinina",
            category: "quimica_basica",
            value: 1.8,
            unit: "mg/dL",
            referenceRange: "0.6 - 1.2",
            status: "high",
            interpretationHint: "Posible compromiso renal agudo.",
          },
        ],
      },
      {
        id: "inflam",
        name: "Perfil inflamatorio",
        parameters: [
          {
            id: "crp",
            name: "PCR",
            category: "inflamatorio",
            value: 19,
            unit: "mg/dL",
            referenceRange: "< 0.5",
            status: "high",
            interpretationHint: "Marcador inflamatorio severamente elevado.",
          },
        ],
      },
    ],
    mainFinding: "Leucocitosis con neutrofilia y PCR elevada en contexto de posible sepsis.",
    interpretationExpected: "Perfil compatible con infección sistémica y posible sepsis con compromiso orgánico inicial.",
    suggestedAction: "Escalar protocolo de sepsis, vigilancia hemodinámica y reevaluación estrecha.",
    educationalExplanation:
      "La combinación de leucocitosis, neutrofilia y PCR alta con alteración renal sugiere respuesta inflamatoria sistémica. Debe correlacionarse con clínica y signos de perfusión.",
    expectedAlteredIds: ["hb", "ht", "wbc", "neut", "lym", "plt", "glucose", "urea", "creat", "crp"],
    suspicionKeywords: ["sepsis", "infeccion", "infección", "inflamatoria", "bacteriana"],
    actionKeywords: ["protocolo", "sepsis", "monitorizacion", "monitorización", "hemodinamica", "cultivos"],
  },
  {
    id: "hyperkalemia_renal",
    name: "Alteración electrolítica con hiperpotasemia",
    context: "renal",
    difficulty: "intermediate",
    patient: {
      name: "Marta L.",
      age: 58,
      sex: "female",
      chiefComplaint: "Debilidad, bradicardia y antecedente de enfermedad renal",
    },
    panels: [
      {
        id: "chem2",
        name: "Química básica",
        parameters: [
          {
            id: "glucose2",
            name: "Glucosa",
            category: "quimica_basica",
            value: 98,
            unit: "mg/dL",
            referenceRange: "70 - 110",
            status: "normal",
            interpretationHint: "Dentro del rango de referencia.",
          },
          {
            id: "urea2",
            name: "Urea",
            category: "quimica_basica",
            value: 86,
            unit: "mg/dL",
            referenceRange: "15 - 45",
            status: "high",
            interpretationHint: "Retención nitrogenada significativa.",
          },
          {
            id: "creat2",
            name: "Creatinina",
            category: "quimica_basica",
            value: 3.2,
            unit: "mg/dL",
            referenceRange: "0.6 - 1.2",
            status: "high",
            interpretationHint: "Compromiso renal moderado-severo.",
          },
        ],
      },
      {
        id: "electro",
        name: "Electrolitos",
        parameters: [
          {
            id: "na",
            name: "Sodio",
            category: "electrolitos",
            value: 132,
            unit: "mEq/L",
            referenceRange: "135 - 145",
            status: "low",
            interpretationHint: "Hiponatremia leve.",
          },
          {
            id: "k",
            name: "Potasio",
            category: "electrolitos",
            value: 6.7,
            unit: "mEq/L",
            referenceRange: "3.5 - 5.1",
            status: "high",
            interpretationHint: "Hiperpotasemia de alto riesgo arrítmico.",
          },
          {
            id: "cl",
            name: "Cloro",
            category: "electrolitos",
            value: 99,
            unit: "mEq/L",
            referenceRange: "98 - 107",
            status: "normal",
            interpretationHint: "Rango normal.",
          },
        ],
      },
    ],
    mainFinding: "Hiperpotasemia severa en paciente con compromiso renal.",
    interpretationExpected:
      "Prioridad clínica alta por riesgo de arritmias; requiere correlación inmediata con ECG y tratamiento corrector.",
    suggestedAction: "Solicitar ECG y manejo urgente de hiperpotasemia según protocolo institucional.",
    educationalExplanation:
      "Un potasio >6 mEq/L con insuficiencia renal obliga a monitorizar ritmo cardíaco de forma continua e iniciar medidas de estabilización.",
    expectedAlteredIds: ["urea2", "creat2", "na", "k"],
    suspicionKeywords: ["hiperpotasemia", "renal", "arritmia", "electrolitica", "electrolítica"],
    actionKeywords: ["ecg", "monitor", "hiperpotasemia", "calcio", "insulina", "urgente"],
  },
  {
    id: "anemia_microcytic",
    name: "Anemia con perfil compatible ferropénico",
    context: "anemia",
    difficulty: "basic",
    patient: {
      name: "Daniela P.",
      age: 24,
      sex: "female",
      chiefComplaint: "Fatiga, mareo y palidez",
    },
    panels: [
      {
        id: "cbc3",
        name: "Hemograma",
        parameters: [
          { id: "hb3", name: "Hemoglobina", category: "hemograma", value: 8.2, unit: "g/dL", referenceRange: "12 - 16", status: "low", interpretationHint: "Anemia moderada-severa." },
          { id: "ht3", name: "Hematocrito", category: "hemograma", value: 27, unit: "%", referenceRange: "36 - 46", status: "low", interpretationHint: "Disminuido en relación con Hb baja." },
          { id: "wbc3", name: "Leucocitos", category: "hemograma", value: 6800, unit: "/mm³", referenceRange: "4,000 - 11,000", status: "normal", interpretationHint: "Sin leucocitosis." },
          { id: "neut3", name: "Neutrófilos", category: "hemograma", value: 58, unit: "%", referenceRange: "40 - 70", status: "normal", interpretationHint: "Dentro de rango." },
          { id: "lym3", name: "Linfocitos", category: "hemograma", value: 32, unit: "%", referenceRange: "20 - 45", status: "normal", interpretationHint: "Dentro de rango." },
          { id: "plt3", name: "Plaquetas", category: "hemograma", value: 420000, unit: "/mm³", referenceRange: "150,000 - 450,000", status: "normal", interpretationHint: "Dentro de rango alto-normal." },
        ],
      },
    ],
    mainFinding: "Anemia significativa con resto del hemograma sin patrón infeccioso.",
    interpretationExpected: "Perfil sugerente de anemia probable ferropénica; correlacionar con causa de pérdida o aporte insuficiente.",
    suggestedAction: "Evaluar etiología de anemia, severidad clínica y plan de corrección.",
    educationalExplanation:
      "Hb y Hto muy bajos con leucocitos normales orientan más a anemia que a proceso infeccioso agudo.",
    expectedAlteredIds: ["hb3", "ht3"],
    suspicionKeywords: ["anemia", "ferropenica", "ferropénica", "hipocromica", "microcitica"],
    actionKeywords: ["etiologia", "hierro", "transfusion", "transfusión", "seguimiento"],
  },
  {
    id: "urinary_infection",
    name: "Examen de orina sugerente de infección urinaria",
    context: "urinary",
    difficulty: "basic",
    patient: {
      name: "Luis A.",
      age: 46,
      sex: "male",
      chiefComplaint: "Disuria, fiebre y dolor lumbar",
    },
    panels: [
      {
        id: "urinalysis",
        name: "Orina",
        parameters: [
          { id: "den", name: "Densidad", category: "orina", value: 1.03, unit: "", referenceRange: "1.005 - 1.025", status: "high", interpretationHint: "Concentración urinaria aumentada." },
          { id: "ph", name: "pH", category: "orina", value: 8.0, unit: "", referenceRange: "5.0 - 7.0", status: "high", interpretationHint: "pH alcalino puede asociarse a bacterias ureasa positivas." },
          { id: "leu", name: "Leucocitos", category: "orina", value: "+++", unit: "", referenceRange: "Negativo", status: "high", interpretationHint: "Piuria significativa." },
          { id: "nit", name: "Nitritos", category: "orina", value: "Positivo", unit: "", referenceRange: "Negativo", status: "high", interpretationHint: "Sugerente de bacteriuria gram negativa." },
          { id: "prot", name: "Proteínas", category: "orina", value: "+", unit: "", referenceRange: "Negativo", status: "high", interpretationHint: "Proteinuria leve asociada a inflamación urinaria." },
          { id: "glur", name: "Glucosa", category: "orina", value: "Negativo", unit: "", referenceRange: "Negativo", status: "normal", interpretationHint: "Sin glucosuria." },
          { id: "ket", name: "Cetonas", category: "orina", value: "Negativo", unit: "", referenceRange: "Negativo", status: "normal", interpretationHint: "Sin cetonuria." },
        ],
      },
    ],
    mainFinding: "Orina compatible con infección urinaria activa.",
    interpretationExpected: "Piuria y nitritos positivos orientan a infección urinaria bacteriana.",
    suggestedAction: "Solicitar urocultivo y ajustar manejo antibiótico según protocolo.",
    educationalExplanation:
      "Leucocitos + nitritos positivos tienen alto valor orientador para infección urinaria, especialmente con clínica compatible.",
    expectedAlteredIds: ["den", "ph", "leu", "nit", "prot"],
    suspicionKeywords: ["infeccion urinaria", "pielonefritis", "bacteriuria", "urologica", "urinaria"],
    actionKeywords: ["urocultivo", "antibiotico", "antibiótico", "hidratacion", "hidratación"],
  },
  {
    id: "hepatocellular_injury",
    name: "Perfil hepático alterado",
    context: "hepatobiliary",
    difficulty: "intermediate",
    patient: {
      name: "Nancy R.",
      age: 39,
      sex: "female",
      chiefComplaint: "Dolor en hipocondrio derecho y coluria",
    },
    panels: [
      {
        id: "hepatic",
        name: "Perfil hepático básico",
        parameters: [
          { id: "ast", name: "AST / TGO", category: "hepatico", value: 245, unit: "U/L", referenceRange: "< 40", status: "high", interpretationHint: "Lesión hepatocelular marcada." },
          { id: "alt", name: "ALT / TGP", category: "hepatico", value: 312, unit: "U/L", referenceRange: "< 41", status: "high", interpretationHint: "Elevación compatible con daño hepático activo." },
          { id: "bil", name: "Bilirrubina total", category: "hepatico", value: 2.4, unit: "mg/dL", referenceRange: "0.2 - 1.2", status: "high", interpretationHint: "Hiperbilirrubinemia asociada." },
        ],
      },
      {
        id: "inflam2",
        name: "Perfil inflamatorio",
        parameters: [
          { id: "crp2", name: "PCR", category: "inflamatorio", value: 2.1, unit: "mg/dL", referenceRange: "< 0.5", status: "high", interpretationHint: "Inflamación sistémica leve-moderada." },
        ],
      },
    ],
    mainFinding: "Elevación de transaminasas con hiperbilirrubinemia.",
    interpretationExpected: "Patrón hepatocelular que requiere correlación etiológica y vigilancia clínica.",
    suggestedAction: "Ampliar estudio hepático y monitorizar función hepática/evolución clínica.",
    educationalExplanation:
      "AST/ALT elevadas con bilirrubina alta orientan a injuria hepática. La interpretación final depende del contexto clínico y evolución.",
    expectedAlteredIds: ["ast", "alt", "bil", "crp2"],
    suspicionKeywords: ["hepatico", "hepático", "hepatocelular", "colestasis", "hepatitis"],
    actionKeywords: ["perfil hepatico", "ecografia", "ecografía", "control", "vigilancia"],
  },
  {
    id: "metabolic_hyperglycemia",
    name: "Descompensación metabólica hiperglucémica",
    context: "metabolic",
    difficulty: "advanced",
    patient: {
      name: "Gerson M.",
      age: 62,
      sex: "male",
      chiefComplaint: "Poliuria, deshidratación y alteración del sensorio",
    },
    panels: [
      {
        id: "chem3",
        name: "Química básica",
        parameters: [
          { id: "glucose3", name: "Glucosa", category: "quimica_basica", value: 468, unit: "mg/dL", referenceRange: "70 - 110", status: "high", interpretationHint: "Hiperglucemia severa." },
          { id: "urea3", name: "Urea", category: "quimica_basica", value: 62, unit: "mg/dL", referenceRange: "15 - 45", status: "high", interpretationHint: "Azotemia por deshidratación." },
          { id: "creat3", name: "Creatinina", category: "quimica_basica", value: 2.1, unit: "mg/dL", referenceRange: "0.6 - 1.2", status: "high", interpretationHint: "Compromiso renal funcional asociado." },
        ],
      },
      {
        id: "electro2",
        name: "Electrolitos",
        parameters: [
          { id: "na2", name: "Sodio", category: "electrolitos", value: 128, unit: "mEq/L", referenceRange: "135 - 145", status: "low", interpretationHint: "Hiponatremia en descompensación hiperosmolar." },
          { id: "k2", name: "Potasio", category: "electrolitos", value: 5.5, unit: "mEq/L", referenceRange: "3.5 - 5.1", status: "high", interpretationHint: "Potasio limítrofe alto; vigilar ECG." },
          { id: "cl2", name: "Cloro", category: "electrolitos", value: 96, unit: "mEq/L", referenceRange: "98 - 107", status: "low", interpretationHint: "Hipocloremia leve." },
        ],
      },
      {
        id: "urinalysis2",
        name: "Orina",
        parameters: [
          { id: "glu_or", name: "Glucosa en orina", category: "orina", value: "+++", unit: "", referenceRange: "Negativo", status: "high", interpretationHint: "Glucosuria marcada." },
          { id: "ket_or", name: "Cetonas", category: "orina", value: "+", unit: "", referenceRange: "Negativo", status: "high", interpretationHint: "Cetonuria leve-moderada." },
          { id: "nit_or", name: "Nitritos", category: "orina", value: "Negativo", unit: "", referenceRange: "Negativo", status: "normal", interpretationHint: "No sugiere foco urinario bacteriano primario." },
        ],
      },
    ],
    mainFinding: "Hiperglucemia severa con alteraciones electrolíticas y deshidratación metabólica.",
    interpretationExpected: "Perfil compatible con descompensación metabólica aguda; alta prioridad de estabilización.",
    suggestedAction: "Iniciar protocolo de descompensación hiperglucémica y monitorización estrecha.",
    educationalExplanation:
      "La combinación de glucosa muy elevada, azotemia y alteraciones electrolíticas debe interpretarse de forma integral con el estado hemodinámico.",
    expectedAlteredIds: ["glucose3", "urea3", "creat3", "na2", "k2", "cl2", "glu_or", "ket_or"],
    suspicionKeywords: ["hiperglucemia", "cetoacidosis", "hiperosmolar", "metabolica", "metabólica"],
    actionKeywords: ["protocolo", "insulina", "hidratacion", "hidratación", "monitorizacion", "electrolitos"],
  },
];

export function getLabCaseById(id: string) {
  return LAB_CASE_LIBRARY.find((item) => item.id === id) ?? null;
}

export function flattenLabParameters(labCase: LabCaseSet) {
  return labCase.panels.flatMap((panel) => panel.parameters);
}

export function inferLabContextFromCase(caseObject: any): LabClinicalContext {
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

  if (/(sepsis|infecc|fiebre|neumon|choque|shock)/.test(text)) return "infection";
  if (/(renal|creatin|potasio|urea|diures|nefro)/.test(text)) return "renal";
  if (/(anemi|palidez|fatiga|sangrado)/.test(text)) return "anemia";
  if (/(glucosa|diabet|ceto|hiperosmolar|metabol)/.test(text)) return "metabolic";
  if (/(disuria|urin|pielonef|cistitis|lumbar)/.test(text)) return "urinary";
  if (/(hepati|transamin|bilirr|coluria|ictericia)/.test(text)) return "hepatobiliary";
  if (/(torac|angina|isquem|coron)/.test(text)) return "chest_pain";
  return "general";
}

export function pickContextualLabCase(caseObject: any, excludeId?: string) {
  const context = inferLabContextFromCase(caseObject);
  const contextual = LAB_CASE_LIBRARY.filter((item) => item.context === context && item.id !== excludeId);
  if (contextual.length > 0) {
    return contextual[Math.floor(Math.random() * contextual.length)];
  }

  const pool = LAB_CASE_LIBRARY.filter((item) => item.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)] ?? LAB_CASE_LIBRARY[0];
}

export function pickRandomLabCase(excludeId?: string) {
  const pool = LAB_CASE_LIBRARY.filter((item) => item.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)] ?? LAB_CASE_LIBRARY[0];
}

export function getMainFindingOptions(caseSet: LabCaseSet) {
  const distractors = LAB_CASE_LIBRARY.filter((item) => item.id !== caseSet.id)
    .slice(0, 4)
    .map((item) => item.mainFinding);

  const options = [caseSet.mainFinding, ...distractors];
  return Array.from(new Set(options)).slice(0, 5);
}

export function evaluateLabInterpretation(args: {
  caseSet: LabCaseSet;
  input: LabInterpretationInput;
  mode: LabMode;
}): LabInterpretationResult {
  const { caseSet, input } = args;

  const expected = new Set(caseSet.expectedAlteredIds);
  const selected = new Set(input.alteredParameterIds);

  let truePositive = 0;
  let falsePositive = 0;
  for (const id of selected) {
    if (expected.has(id)) truePositive += 1;
    else falsePositive += 1;
  }

  const recall = expected.size > 0 ? truePositive / expected.size : 0;
  const precision = selected.size > 0 ? truePositive / selected.size : 0;
  const alteredValuesScore = Math.max(0, Math.round((0.65 * recall + 0.35 * precision) * 35 - falsePositive * 1.5));

  const findingMatch = normalizeText(input.mainFinding) === normalizeText(caseSet.mainFinding);
  const mainFindingScore = findingMatch
    ? 25
    : normalizeText(caseSet.mainFinding).includes(normalizeText(input.mainFinding)) ||
      normalizeText(input.mainFinding).includes(normalizeText(caseSet.mainFinding))
    ? 15
    : 0;

  const clinicalCorrelationScore = overlapScore(input.clinicalSuspicion, caseSet.suspicionKeywords);
  const nextStepScore = overlapScore(input.nextStep, caseSet.actionKeywords);

  const total = Math.max(0, Math.min(100, alteredValuesScore + mainFindingScore + clinicalCorrelationScore + nextStepScore));

  const outcome: LabInterpretationResult["outcome"] =
    total >= 85 ? "excellent" : total >= 70 ? "good" : total >= 45 ? "partial" : "needs_improvement";

  const alteredFeedback =
    alteredValuesScore >= 28
      ? "Identificaste adecuadamente la mayoría de parámetros alterados."
      : alteredValuesScore >= 18
      ? "Identificaste parte de las alteraciones, pero faltó precisión en algunos parámetros."
      : "La selección de valores alterados es insuficiente o poco precisa.";

  const findingFeedback =
    mainFindingScore >= 20
      ? "Hallazgo principal correctamente identificado."
      : "El hallazgo principal requiere mayor síntesis clínica.";

  const correlationFeedback =
    clinicalCorrelationScore >= 18
      ? "Buena correlación clínico-laboratorial."
      : clinicalCorrelationScore >= 10
      ? "Correlación parcial; faltó integrar más datos clínicos."
      : "La sospecha clínica no se alinea bien con el patrón de laboratorio.";

  const nextStepFeedback =
    nextStepScore >= 18
      ? "La conducta inicial propuesta es coherente con los hallazgos."
      : nextStepScore >= 10
      ? "Conducta parcialmente adecuada; refuerza priorización inicial."
      : "La conducta sugerida no refleja prioridad clínica del perfil lab.";

  const summary =
    outcome === "excellent"
      ? "Interpretación sólida: integraste alteraciones, contexto y decisión inicial de forma correcta."
      : outcome === "good"
      ? "Buen desempeño global con ajustes finos pendientes en correlación o conducta."
      : outcome === "partial"
      ? "Interpretación parcial: revisa cómo jerarquizar el hallazgo principal y la siguiente acción."
      : "Necesitas reforzar lectura de alteraciones y su traducción a decisiones clínicas.";

  return {
    totalScore: total,
    rubric: {
      alteredValues: alteredValuesScore,
      mainFinding: mainFindingScore,
      clinicalCorrelation: clinicalCorrelationScore,
      nextStep: nextStepScore,
    },
    outcome,
    feedback: {
      alteredValues: alteredFeedback,
      mainFinding: findingFeedback,
      clinicalCorrelation: correlationFeedback,
      nextStep: nextStepFeedback,
      summary,
    },
  };
}

export function statusBadge(status: LabStatus) {
  if (status === "high") return "border-red-400/30 bg-red-400/10 text-red-100";
  if (status === "low") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}

export function statusLabel(status: LabStatus) {
  if (status === "high") return "Alto";
  if (status === "low") return "Bajo";
  return "Normal";
}

export function difficultyLabel(value: LabDifficulty) {
  if (value === "basic") return "Básico";
  if (value === "intermediate") return "Intermedio";
  return "Avanzado";
}
