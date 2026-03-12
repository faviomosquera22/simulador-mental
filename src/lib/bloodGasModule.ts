export type BloodGasMode = "practice" | "evaluation";

export type BloodGasDifficulty = "basic" | "intermediate" | "advanced";

export type BloodGasContext =
  | "respiratory"
  | "metabolic"
  | "shock"
  | "renal"
  | "general";

export type BloodGasAcidBase = "acidosis" | "alcalosis" | "normal";

export type BloodGasPrimaryDisorder = "respiratory" | "metabolic";

export type BloodGasCompensation = "none" | "partial" | "full";

export type BloodGasPatient = {
  name: string;
  age: number;
  sex: "female" | "male" | "unspecified";
  chiefComplaint: string;
};

export type BloodGasValues = {
  ph: number;
  paCO2: number;
  hco3: number;
  paO2: number;
  saturation: number;
  lactate: number;
};

export type BloodGasCase = {
  id: string;
  name: string;
  context: BloodGasContext;
  difficulty: BloodGasDifficulty;
  patient: BloodGasPatient;
  values: BloodGasValues;
  acidBase: BloodGasAcidBase;
  primaryDisorder: BloodGasPrimaryDisorder;
  compensation: BloodGasCompensation;
  clinicalInterpretation: string;
  mainFinding: string;
  expectedConduct: string;
  explanationSteps: string[];
  interpretationKeywords: string[];
  conductKeywords: string[];
};

export type BloodGasInput = {
  acidBase: BloodGasAcidBase | "";
  primaryDisorder: BloodGasPrimaryDisorder | "";
  compensation: BloodGasCompensation | "";
  interpretationText: string;
  conductText: string;
};

export type BloodGasEvaluation = {
  totalScore: number;
  rubric: {
    acidBase: number;
    primaryDisorder: number;
    compensation: number;
    interpretation: number;
    conduct: number;
  };
  outcome: "excellent" | "good" | "partial" | "needs_review";
  feedback: {
    acidBase: string;
    primaryDisorder: string;
    compensation: string;
    interpretation: string;
    conduct: string;
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

function overlapScore(answer: string, keywords: string[], maxScore: number) {
  const normalized = normalizeText(answer);
  const hits = keywords.filter((keyword) => normalized.includes(normalizeText(keyword))).length;
  if (hits >= 3) return maxScore;
  if (hits >= 2) return Math.round(maxScore * 0.72);
  if (hits >= 1) return Math.round(maxScore * 0.44);
  return 0;
}

export function bloodGasDifficultyLabel(value: BloodGasDifficulty) {
  if (value === "basic") return "Básico";
  if (value === "intermediate") return "Intermedio";
  return "Avanzado";
}

export function bloodGasContextLabel(value: BloodGasContext) {
  if (value === "respiratory") return "Respiratorio";
  if (value === "metabolic") return "Metabólico";
  if (value === "shock") return "Shock / hipoperfusión";
  if (value === "renal") return "Renal";
  return "General";
}

export function bloodGasAcidBaseLabel(value: BloodGasAcidBase) {
  if (value === "acidosis") return "Acidosis";
  if (value === "alcalosis") return "Alcalosis";
  return "Normal / casi normal";
}

export function bloodGasPrimaryDisorderLabel(value: BloodGasPrimaryDisorder) {
  return value === "respiratory" ? "Respiratoria" : "Metabólica";
}

export function bloodGasCompensationLabel(value: BloodGasCompensation) {
  if (value === "none") return "Sin compensación";
  if (value === "partial") return "Compensación parcial";
  return "Compensación completa";
}

export function bloodGasParameterState(
  parameter: keyof BloodGasValues,
  value: number
): "low" | "normal" | "high" {
  if (parameter === "ph") {
    if (value < 7.35) return "low";
    if (value > 7.45) return "high";
    return "normal";
  }
  if (parameter === "paCO2") {
    if (value < 35) return "low";
    if (value > 45) return "high";
    return "normal";
  }
  if (parameter === "hco3") {
    if (value < 22) return "low";
    if (value > 26) return "high";
    return "normal";
  }
  if (parameter === "paO2") {
    if (value < 80) return "low";
    if (value > 100) return "high";
    return "normal";
  }
  if (parameter === "saturation") {
    if (value < 95) return "low";
    return "normal";
  }
  if (value < 2) return "normal";
  if (value < 4) return "high";
  return "high";
}

export function inferBloodGasContextFromCase(caseObject: any): BloodGasContext {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.chief_complaint,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
    ].join(" ")
  );

  if (text.includes("disnea") || text.includes("copd") || text.includes("asma") || text.includes("respira")) {
    return "respiratory";
  }
  if (text.includes("sepsis") || text.includes("shock") || text.includes("hipoperfusion")) {
    return "shock";
  }
  if (text.includes("renal") || text.includes("uremia") || text.includes("potasio")) {
    return "renal";
  }
  if (text.includes("cetoacidosis") || text.includes("diabetes") || text.includes("vomito")) {
    return "metabolic";
  }
  return "general";
}

export const BLOOD_GAS_LIBRARY: BloodGasCase[] = [
  {
    id: "copd_resp_acidosis",
    name: "EPOC reagudizado con acidosis respiratoria",
    context: "respiratory",
    difficulty: "basic",
    patient: {
      name: "Rogelio C.",
      age: 69,
      sex: "male",
      chiefComplaint: "Disnea progresiva y somnolencia",
    },
    values: { ph: 7.28, paCO2: 62, hco3: 28, paO2: 58, saturation: 86, lactate: 1.8 },
    acidBase: "acidosis",
    primaryDisorder: "respiratory",
    compensation: "partial",
    clinicalInterpretation: "Acidosis respiratoria parcialmente compensada con hipoxemia.",
    mainFinding: "Retención de CO2 en contexto respiratorio con compensación metabólica limitada.",
    expectedConduct: "Optimizar oxigenación, valorar ventilación y escalar manejo respiratorio.",
    explanationSteps: [
      "El pH está por debajo de 7.35: hay acidemia.",
      "La PaCO2 está elevada: el trastorno primario es respiratorio.",
      "El HCO3 está algo alto: existe compensación parcial.",
      "La PaO2 y la saturación muestran hipoxemia relevante.",
    ],
    interpretationKeywords: ["acidosis respiratoria", "hipoxemia", "co2 retenido", "compensada parcialmente"],
    conductKeywords: ["oxigeno", "ventilacion", "ventilación", "monitorizar", "soporte respiratorio"],
  },
  {
    id: "panic_resp_alkalosis",
    name: "Hiperventilación con alcalosis respiratoria",
    context: "respiratory",
    difficulty: "basic",
    patient: {
      name: "Lucía M.",
      age: 24,
      sex: "female",
      chiefComplaint: "Ansiedad intensa, parestesias y respiración rápida",
    },
    values: { ph: 7.51, paCO2: 28, hco3: 23, paO2: 97, saturation: 99, lactate: 1.1 },
    acidBase: "alcalosis",
    primaryDisorder: "respiratory",
    compensation: "none",
    clinicalInterpretation: "Alcalosis respiratoria aguda sin compensación metabólica significativa.",
    mainFinding: "Hiperventilación aguda con caída de PaCO2.",
    expectedConduct: "Controlar causa desencadenante, reevaluar clínica y evitar intervenciones innecesarias.",
    explanationSteps: [
      "El pH está elevado: hay alcalemia.",
      "La PaCO2 está baja: el origen es respiratorio.",
      "El HCO3 es casi normal: no hay compensación significativa.",
      "La oxigenación está conservada.",
    ],
    interpretationKeywords: ["alcalosis respiratoria", "hiperventilacion", "aguda", "sin compensacion"],
    conductKeywords: ["reevaluar", "ansiedad", "control", "monitorizar", "causa desencadenante"],
  },
  {
    id: "dka_metabolic_acidosis",
    name: "Cetoacidosis diabética",
    context: "metabolic",
    difficulty: "intermediate",
    patient: {
      name: "Paola R.",
      age: 31,
      sex: "female",
      chiefComplaint: "Poliuria, vómitos y respiración de Kussmaul",
    },
    values: { ph: 7.18, paCO2: 24, hco3: 10, paO2: 92, saturation: 96, lactate: 2.3 },
    acidBase: "acidosis",
    primaryDisorder: "metabolic",
    compensation: "partial",
    clinicalInterpretation: "Acidosis metabólica con compensación respiratoria en contexto de cetoacidosis.",
    mainFinding: "HCO3 muy bajo con hiperventilación compensadora.",
    expectedConduct: "Iniciar fluidos, insulinoterapia y corrección guiada de electrolitos.",
    explanationSteps: [
      "El pH muestra acidemia significativa.",
      "El HCO3 está muy bajo: el origen principal es metabólico.",
      "La PaCO2 está disminuida por hiperventilación compensadora.",
      "Debe correlacionarse con glicemia, cetonas y potasio.",
    ],
    interpretationKeywords: ["acidosis metabolica", "compensacion respiratoria", "cetoacidosis", "hco3 bajo"],
    conductKeywords: ["fluidos", "insulina", "electrolitos", "potasio", "monitorizacion"],
  },
  {
    id: "sepsis_lactic_acidosis",
    name: "Sepsis con acidosis láctica",
    context: "shock",
    difficulty: "advanced",
    patient: {
      name: "Mario T.",
      age: 63,
      sex: "male",
      chiefComplaint: "Hipotensión, fiebre y confusión",
    },
    values: { ph: 7.22, paCO2: 30, hco3: 14, paO2: 76, saturation: 92, lactate: 5.6 },
    acidBase: "acidosis",
    primaryDisorder: "metabolic",
    compensation: "partial",
    clinicalInterpretation: "Acidosis metabólica con lactato elevado y compensación respiratoria por sepsis.",
    mainFinding: "Lactato alto con acidemia metabólica en contexto de hipoperfusión.",
    expectedConduct: "Activar manejo de sepsis, reanimación con fluidos y antibiótico temprano.",
    explanationSteps: [
      "El pH está bajo: existe acidemia.",
      "El HCO3 disminuido apunta a acidosis metabólica.",
      "La PaCO2 baja sugiere compensación respiratoria.",
      "El lactato elevado orienta a hipoperfusión/sepsis.",
    ],
    interpretationKeywords: ["acidosis metabolica", "lactato alto", "sepsis", "hipoperfusion"],
    conductKeywords: ["sepsis", "fluidos", "antibiotico", "antibiótico", "reanimacion", "monitorizar"],
  },
  {
    id: "vomiting_metabolic_alkalosis",
    name: "Vómitos persistentes con alcalosis metabólica",
    context: "metabolic",
    difficulty: "basic",
    patient: {
      name: "Elena P.",
      age: 42,
      sex: "female",
      chiefComplaint: "Vómitos y debilidad",
    },
    values: { ph: 7.49, paCO2: 48, hco3: 34, paO2: 88, saturation: 95, lactate: 1.4 },
    acidBase: "alcalosis",
    primaryDisorder: "metabolic",
    compensation: "partial",
    clinicalInterpretation: "Alcalosis metabólica con retención respiratoria compensadora.",
    mainFinding: "HCO3 elevado en contexto de pérdida gastrointestinal de ácido.",
    expectedConduct: "Corregir causa, reponer volumen y vigilar electrolitos.",
    explanationSteps: [
      "El pH está alto: hay alcalemia.",
      "El HCO3 está elevado: el trastorno primario es metabólico.",
      "La PaCO2 está algo alta por compensación respiratoria.",
      "Debe pensarse en pérdidas digestivas y alteración de cloro/potasio.",
    ],
    interpretationKeywords: ["alcalosis metabolica", "vomitos", "hco3 alto", "compensacion respiratoria"],
    conductKeywords: ["hidratacion", "volumen", "electrolitos", "causa", "reponer"],
  },
  {
    id: "renal_metabolic_acidosis",
    name: "Insuficiencia renal con acidosis metabólica",
    context: "renal",
    difficulty: "advanced",
    patient: {
      name: "Javier S.",
      age: 58,
      sex: "male",
      chiefComplaint: "Malestar general y respiración profunda",
    },
    values: { ph: 7.26, paCO2: 31, hco3: 15, paO2: 83, saturation: 94, lactate: 2.0 },
    acidBase: "acidosis",
    primaryDisorder: "metabolic",
    compensation: "partial",
    clinicalInterpretation: "Acidosis metabólica de probable origen renal con compensación respiratoria.",
    mainFinding: "HCO3 bajo en paciente con contexto urémico.",
    expectedConduct: "Correlacionar con función renal, potasio y necesidad de manejo urgente.",
    explanationSteps: [
      "El pH está bajo y confirma acidemia.",
      "El HCO3 disminuido define componente metabólico.",
      "La PaCO2 baja es compensación ventilatoria.",
      "Debe buscarse causa renal y riesgo de hiperpotasemia.",
    ],
    interpretationKeywords: ["acidosis metabolica", "renal", "uremia", "compensacion respiratoria"],
    conductKeywords: ["funcion renal", "potasio", "monitorizar", "urgente", "dialisis", "diálisis"],
  },
  {
    id: "postop_near_normal",
    name: "Control posoperatorio estable",
    context: "general",
    difficulty: "basic",
    patient: {
      name: "Andrea N.",
      age: 36,
      sex: "female",
      chiefComplaint: "Control posquirúrgico sin signos de deterioro",
    },
    values: { ph: 7.40, paCO2: 39, hco3: 24, paO2: 91, saturation: 97, lactate: 1.2 },
    acidBase: "normal",
    primaryDisorder: "metabolic",
    compensation: "none",
    clinicalInterpretation: "Gasometría sin trastorno ácido-base significativo.",
    mainFinding: "Valores globalmente conservados.",
    expectedConduct: "Mantener vigilancia clínica y continuar cuidados habituales.",
    explanationSteps: [
      "El pH está en rango normal.",
      "PaCO2 y HCO3 se mantienen dentro de referencia.",
      "No hay evidencia de acidosis ni alcalosis dominante.",
      "La oxigenación y el lactato no sugieren hipoperfusión.",
    ],
    interpretationKeywords: ["normal", "sin trastorno", "gasometria estable", "sin alteracion acido base"],
    conductKeywords: ["vigilar", "monitorizar", "continuar", "cuidados habituales"],
  },
];

export function evaluateBloodGasInterpretation(args: {
  caseSet: BloodGasCase;
  input: BloodGasInput;
}): BloodGasEvaluation {
  const { caseSet, input } = args;

  const acidBaseScore = input.acidBase === caseSet.acidBase ? 25 : 0;
  const primaryDisorderScore = input.primaryDisorder === caseSet.primaryDisorder ? 25 : 0;
  const compensationScore = input.compensation === caseSet.compensation ? 20 : 0;
  const interpretationScore = overlapScore(input.interpretationText, caseSet.interpretationKeywords, 15);
  const conductScore = overlapScore(input.conductText, caseSet.conductKeywords, 15);

  const totalScore =
    acidBaseScore + primaryDisorderScore + compensationScore + interpretationScore + conductScore;

  const outcome =
    totalScore >= 85
      ? "excellent"
      : totalScore >= 70
      ? "good"
      : totalScore >= 45
      ? "partial"
      : "needs_review";

  return {
    totalScore,
    rubric: {
      acidBase: acidBaseScore,
      primaryDisorder: primaryDisorderScore,
      compensation: compensationScore,
      interpretation: interpretationScore,
      conduct: conductScore,
    },
    outcome,
    feedback: {
      acidBase:
        acidBaseScore > 0
          ? "Identificaste correctamente si predomina acidosis, alcalosis o normalidad."
          : `Revisa primero el pH para clasificar: ${bloodGasAcidBaseLabel(caseSet.acidBase)}.`,
      primaryDisorder:
        primaryDisorderScore > 0
          ? "Reconociste el origen principal del trastorno."
          : `Correlaciona PaCO2 y HCO3: el trastorno primario esperado es ${bloodGasPrimaryDisorderLabel(caseSet.primaryDisorder)}.`,
      compensation:
        compensationScore > 0
          ? "La lectura de compensación es adecuada para este nivel."
          : `La compensación esperada es ${bloodGasCompensationLabel(caseSet.compensation)}.`,
      interpretation:
        interpretationScore >= 10
          ? "La interpretación clínica integra bien el patrón gasométrico."
          : `Integra hallazgos clave como: ${caseSet.mainFinding}`,
      conduct:
        conductScore >= 10
          ? "La conducta inicial propuesta es coherente."
          : `La conducta esperada se orienta a: ${caseSet.expectedConduct}`,
      summary:
        outcome === "excellent"
          ? "Interpretación gasométrica sólida y bien correlacionada con la clínica."
          : outcome === "good"
          ? "Buena lectura global; afina compensación y conducta para ganar precisión."
          : outcome === "partial"
          ? "Reconoces parte del trastorno, pero aún falta estructurar la lectura ácido-base."
          : "Necesitas seguir una secuencia fija: pH, origen primario, compensación y correlación clínica.",
    },
  };
}
