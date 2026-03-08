type ExamApplyTo = "all" | "adult" | "pediatric" | "pregnancy" | "older_adult";
type ExamCategory = "fisico" | "signos" | "laboratorio" | "imagen" | "funcional";
type ExamStatus = "normal" | "altered" | "critical";

export type MedicalExamDefinition = {
  id: string;
  name: string;
  short_name: string;
  category: ExamCategory;
  applies_to: ExamApplyTo;
  description: string;
};

export type MedicalExamResult = {
  exam_id: string;
  exam_name: string;
  category: ExamCategory;
  status: ExamStatus;
  summary: string;
  findings: string[];
  interpretation: string;
  red_flags: string[];
  completed_at: string;
  educational_note: string;
  hidden_execution: true;
};

const EDUCATIONAL_NOTE =
  "Resultado simulado para entrenamiento. No sustituye examen clínico real ni protocolos institucionales.";

export const MEDICAL_EXAMS: MedicalExamDefinition[] = [
  {
    id: "physical_general",
    name: "Examen físico general",
    short_name: "EF General",
    category: "fisico",
    applies_to: "all",
    description: "Inspección clínica global, estado general y nivel de compromiso actual.",
  },
  {
    id: "vital_signs_targeted",
    name: "Signos vitales orientados",
    short_name: "SV",
    category: "signos",
    applies_to: "all",
    description: "PA, FC, FR, SatO2 y temperatura orientativa según severidad del caso.",
  },
  {
    id: "cardiorespiratory_exam",
    name: "Examen cardiopulmonar",
    short_name: "Cardio-Resp",
    category: "fisico",
    applies_to: "all",
    description: "Auscultación y hallazgos cardiacos/respiratorios relevantes.",
  },
  {
    id: "abdominal_exam",
    name: "Examen abdominal",
    short_name: "Abdomen",
    category: "fisico",
    applies_to: "all",
    description: "Evaluación abdominal básica, dolor, defensa y signos de irritación.",
  },
  {
    id: "neurological_brief",
    name: "Examen neurológico breve",
    short_name: "Neuro",
    category: "fisico",
    applies_to: "all",
    description: "Estado de conciencia, orientación y signos neurológicos focales.",
  },
  {
    id: "perfusion_hydration",
    name: "Perfusión e hidratación",
    short_name: "Perfusión",
    category: "fisico",
    applies_to: "all",
    description: "Valoración de perfusión periférica, hidratación y llenado capilar.",
  },
  {
    id: "ecg_12_lead",
    name: "Electrocardiograma orientativo",
    short_name: "ECG",
    category: "imagen",
    applies_to: "all",
    description: "Hallazgos orientativos de ritmo y cambios eléctricos relevantes.",
  },
  {
    id: "chest_xray",
    name: "Radiografía de tórax orientativa",
    short_name: "Rx Tórax",
    category: "imagen",
    applies_to: "all",
    description: "Hallazgos respiratorios/cardiacos iniciales en contexto clínico.",
  },
  {
    id: "initial_lab_panel",
    name: "Panel de laboratorio inicial",
    short_name: "Labs",
    category: "laboratorio",
    applies_to: "all",
    description: "Biometría, marcadores inflamatorios y química básica simulada.",
  },
  {
    id: "urinalysis",
    name: "Uroanálisis orientativo",
    short_name: "Uroanálisis",
    category: "laboratorio",
    applies_to: "all",
    description: "Tamizaje urinario orientativo según cuadro clínico.",
  },
  {
    id: "obstetric_assessment",
    name: "Evaluación obstétrica breve",
    short_name: "Obstétrica",
    category: "fisico",
    applies_to: "pregnancy",
    description: "Signos de alarma materna y evaluación orientativa del binomio materno-fetal.",
  },
  {
    id: "pediatric_general_assessment",
    name: "Evaluación pediátrica general",
    short_name: "Ped-General",
    category: "fisico",
    applies_to: "pediatric",
    description: "Estado general pediátrico, trabajo respiratorio e hidratación.",
  },
  {
    id: "functional_screen",
    name: "Tamizaje funcional breve",
    short_name: "Funcional",
    category: "funcional",
    applies_to: "older_adult",
    description: "Impacto funcional y dependencia orientativa en adulto mayor.",
  },
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function inferExamCohort(caseObject: any): ExamApplyTo {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.brief_context,
      caseObject?.chief_complaint,
    ].join(" ")
  );
  const age = Number(caseObject?.patient_profile?.age ?? 0);
  const ageGroup = normalizeText(caseObject?.meta?.age_group ?? caseObject?.age_group ?? "");

  if (hasAny(text, ["embarazo", "gestacion", "gestante", "preeclamps", "eclamps", "puerper"])) return "pregnancy";
  if (ageGroup === "child" || ageGroup === "adolescent" || age < 18) return "pediatric";
  if (age >= 65) return "older_adult";
  return "adult";
}

function riskScore(caseObject: any) {
  const risk = normalizeText(caseObject?.meta?.risk_level ?? caseObject?.safety?.risk_level ?? "bajo");
  if (risk.includes("alto")) return 2;
  if (risk.includes("medio") || risk.includes("moderado")) return 1;
  return 0;
}

function toStatus(score: number): ExamStatus {
  if (score >= 3) return "critical";
  if (score >= 1) return "altered";
  return "normal";
}

function caseSignals(caseObject: any) {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.dsm_tag,
      caseObject?.meta?.category,
      caseObject?.brief_context,
      caseObject?.chief_complaint,
      caseObject?.patient_profile?.context,
    ].join(" ")
  );

  return {
    text,
    cardio: hasAny(text, ["cardio", "miocard", "coron", "palpit", "toracic", "arrit", "disnea"]),
    respiratory: hasAny(text, ["disnea", "respira", "neumon", "asma", "epoc", "satur", "tos"]),
    infectious: hasAny(text, ["sepsis", "infecc", "fiebre", "dengue", "shock", "celulit"]),
    neuro: hasAny(text, ["acv", "ictus", "neurol", "convuls", "cefalea", "confusion"]),
    abdominal: hasAny(text, ["abdomen", "apendic", "pancreat", "gastro", "vomit", "diarrea", "periton"]),
    renal: hasAny(text, ["renal", "urin", "pielonef", "diures", "retencion", "hematuria"]),
    obstetric: hasAny(text, ["embarazo", "gestante", "preecl", "eclamp", "pospart", "placenta", "parto"]),
    pediatric: hasAny(text, ["pediatr", "nino", "adolesc", "lactante", "neonat", "escolar"]),
  };
}

function buildVitalSigns(status: ExamStatus) {
  if (status === "critical") {
    return [
      "TA 88/56 mmHg",
      "FC 128 lpm",
      "FR 30 rpm",
      "SatO2 88%",
      "Temp 38.7°C",
    ];
  }
  if (status === "altered") {
    return [
      "TA 102/66 mmHg",
      "FC 106 lpm",
      "FR 23 rpm",
      "SatO2 93%",
      "Temp 37.9°C",
    ];
  }
  return [
    "TA 118/74 mmHg",
    "FC 84 lpm",
    "FR 18 rpm",
    "SatO2 97%",
    "Temp 36.8°C",
  ];
}

export function getMedicalExamById(id: string) {
  return MEDICAL_EXAMS.find((exam) => exam.id === id) ?? null;
}

export function getMedicalExamsForCase(caseObject: any): MedicalExamDefinition[] {
  const cohort = inferExamCohort(caseObject);
  return MEDICAL_EXAMS.filter((exam) => exam.applies_to === "all" || exam.applies_to === cohort);
}

export function runMedicalExam(definition: MedicalExamDefinition, caseObject: any): MedicalExamResult {
  const signals = caseSignals(caseObject);
  const risk = riskScore(caseObject);
  const cohort = inferExamCohort(caseObject);

  const scoreByExam = (() => {
    switch (definition.id) {
      case "physical_general":
        return risk + (signals.respiratory || signals.cardio || signals.infectious ? 1 : 0);
      case "vital_signs_targeted":
        return risk + (signals.infectious || signals.respiratory ? 1 : 0);
      case "cardiorespiratory_exam":
        return risk + (signals.cardio || signals.respiratory ? 1 : 0);
      case "abdominal_exam":
        return risk + (signals.abdominal ? 1 : 0);
      case "neurological_brief":
        return risk + (signals.neuro ? 1 : 0);
      case "perfusion_hydration":
        return risk + (signals.infectious || signals.renal || signals.pediatric ? 1 : 0);
      case "ecg_12_lead":
        return risk + (signals.cardio ? 1 : 0);
      case "chest_xray":
        return risk + (signals.respiratory || signals.cardio ? 1 : 0);
      case "initial_lab_panel":
        return risk + (signals.infectious || signals.renal || signals.obstetric ? 1 : 0);
      case "urinalysis":
        return risk + (signals.renal || signals.obstetric ? 1 : 0);
      case "obstetric_assessment":
        return risk + (signals.obstetric ? 1 : 0);
      case "pediatric_general_assessment":
        return risk + (signals.pediatric ? 1 : 0);
      case "functional_screen":
        return risk + (cohort === "older_adult" ? 1 : 0);
      default:
        return risk;
    }
  })();

  const status = toStatus(scoreByExam);
  const redFlags: string[] = [];
  let summary = "Sin hallazgos relevantes en evaluación orientativa.";
  let findings: string[] = [];
  let interpretation = "Compatible con estabilidad clínica relativa en el contexto del caso simulado.";

  switch (definition.id) {
    case "physical_general":
      if (status === "critical") {
        summary = "Compromiso clínico evidente con deterioro del estado general.";
        findings = ["Paciente diaforético y con disnea en reposo.", "Lenguaje entrecortado, tolerancia limitada al esfuerzo.", "Impresión de inestabilidad clínica."];
        redFlags.push("Compromiso hemodinámico probable", "Dificultad respiratoria marcada");
        interpretation = "Priorizar estabilización y escalamiento inmediato.";
      } else if (status === "altered") {
        summary = "Estado general comprometido de forma moderada.";
        findings = ["Facies de dolor/fatiga.", "Leve taquipnea al hablar.", "Actividad limitada por síntomas."];
        redFlags.push("Deterioro progresivo de síntomas");
        interpretation = "Requiere reevaluación frecuente y seguimiento estrecho.";
      } else {
        findings = ["Paciente vigil y colaborador.", "Sin signos mayores de distrés en reposo.", "Perfusión periférica conservada."];
      }
      break;

    case "vital_signs_targeted":
      findings = buildVitalSigns(status);
      summary =
        status === "critical"
          ? "Signos vitales con alteración severa."
          : status === "altered"
          ? "Signos vitales con alteraciones moderadas."
          : "Signos vitales dentro de rangos esperados.";
      interpretation =
        status === "critical"
          ? "Patrón compatible con urgencia clínica alta."
          : status === "altered"
          ? "Alteración fisiológica que amerita vigilancia reforzada."
          : "Sin evidencia de descompensación fisiológica importante en este tamizaje.";
      if (status !== "normal") redFlags.push("Inestabilidad de signos vitales");
      break;

    case "cardiorespiratory_exam":
      if (status === "critical") {
        findings = ["Taquicardia sostenida.", "Crepitantes bibasales y uso de musculatura accesoria.", "Perfusión periférica disminuida."];
        summary = "Examen cardiopulmonar con hallazgos severos.";
        redFlags.push("Distrés respiratorio", "Compromiso cardiaco");
        interpretation = "Sugiere descompensación cardio-respiratoria de alta prioridad.";
      } else if (status === "altered") {
        findings = ["Taquicardia leve-moderada.", "Murmullo vesicular con leve disminución basal.", "Disnea de esfuerzo referida."];
        summary = "Examen cardiopulmonar con hallazgos moderados.";
        interpretation = "Hallazgos que requieren correlación con ECG/imágenes y evolución clínica.";
      } else {
        findings = ["Ruidos cardiacos rítmicos.", "Murmullo vesicular conservado bilateral.", "Sin signos de distrés respiratorio agudo."];
      }
      break;

    case "abdominal_exam":
      if (status === "critical" && signals.abdominal) {
        findings = ["Dolor abdominal intenso a la palpación.", "Defensa involuntaria en cuadrante comprometido.", "Rebote positivo orientativo."];
        summary = "Examen abdominal con signos de alarma.";
        redFlags.push("Irritación peritoneal");
        interpretation = "Sospecha de abdomen agudo; priorizar manejo urgente.";
      } else if (status === "altered" && signals.abdominal) {
        findings = ["Dolor localizado moderado.", "Sensibilidad aumentada sin defensa marcada.", "Ruidos hidroaéreos presentes."];
        summary = "Hallazgos abdominales compatibles con proceso inflamatorio moderado.";
        interpretation = "Requiere seguimiento clínico y correlación paraclínica.";
      } else {
        findings = ["Abdomen blando y depresible.", "Sin dolor significativo a la palpación.", "Sin signos de irritación peritoneal."];
      }
      break;

    case "neurological_brief":
      if (status === "critical") {
        findings = ["Compromiso del estado de conciencia.", "Orientación parcial/inconstante.", "Signos neurológicos focales orientativos."];
        summary = "Examen neurológico con alteración severa.";
        redFlags.push("Deterioro neurológico agudo");
        interpretation = "Prioridad alta para evaluación neurológica urgente.";
      } else if (status === "altered") {
        findings = ["Paciente vigil con lentitud de respuesta.", "Orientación conservada parcialmente.", "Sin déficit motor grosero evidente."];
        summary = "Examen neurológico con alteración moderada.";
        interpretation = "Monitoreo neurológico seriado recomendado.";
      } else {
        findings = ["Consciente y orientado.", "Lenguaje conservado.", "Sin focalidad neurológica aparente."];
      }
      break;

    case "perfusion_hydration":
      if (status === "critical") {
        findings = ["Llenado capilar prolongado.", "Mucosas secas marcadas.", "Diuresis referida disminuida."];
        summary = "Perfusión e hidratación comprometidas.";
        redFlags.push("Hipoperfusión", "Deshidratación severa");
        interpretation = "Sugiere compromiso circulatorio/hidratación de alta prioridad.";
      } else if (status === "altered") {
        findings = ["Llenado capilar límite.", "Hidratación oral insuficiente reciente.", "Signos de hipovolemia leve-moderada."];
        summary = "Perfusión/hidratación con alteraciones moderadas.";
        interpretation = "Requiere vigilancia y balance hídrico estrecho.";
      } else {
        findings = ["Perfusión periférica adecuada.", "Hidratación clínicamente conservada.", "Diuresis sin alteración relevante referida."];
      }
      break;

    case "ecg_12_lead":
      if (status === "critical") {
        findings = ["Ritmo taquicárdico con cambios ST-T sugestivos de alto riesgo.", "Alteraciones de conducción orientativas.", "Necesita correlación inmediata con clínica."];
        summary = "ECG orientativo con hallazgos críticos.";
        redFlags.push("Alteración electrocardiográfica de alto riesgo");
        interpretation = "Compatible con urgencia cardiovascular; priorizar manejo.";
      } else if (status === "altered") {
        findings = ["Taquicardia sinusal.", "Cambios inespecíficos de repolarización.", "Sin elevación franca del ST en este tamizaje."];
        summary = "ECG orientativo con alteraciones moderadas.";
        interpretation = "Correlacionar con enzimas y evolución clínica.";
      } else {
        findings = ["Ritmo sinusal.", "Sin alteraciones significativas del ST-T.", "Conducción global conservada."];
      }
      break;

    case "chest_xray":
      if (status === "critical") {
        findings = ["Patrón alveolo-intersticial difuso orientativo.", "Congestión pulmonar/ocupación importante.", "Sugerencia de compromiso respiratorio severo."];
        summary = "Rx de tórax orientativa con hallazgos críticos.";
        redFlags.push("Compromiso respiratorio severo en imagen");
        interpretation = "Sugiere descompensación torácica de alta prioridad.";
      } else if (status === "altered") {
        findings = ["Infiltrado basal leve-moderado.", "Cardiomediastino discretamente aumentado.", "Cambios compatibles con proceso activo moderado."];
        summary = "Rx de tórax orientativa con hallazgos moderados.";
        interpretation = "Correlacionar con clínica y laboratorio.";
      } else {
        findings = ["Sin infiltrados relevantes.", "Silueta cardiaca sin cambios significativos.", "Sin derrame pleural evidente."];
      }
      break;

    case "initial_lab_panel":
      if (status === "critical") {
        findings = ["Leucocitosis marcada.", "Lactato elevado.", "Alteración de función renal/hepática orientativa."];
        summary = "Laboratorio inicial con alteraciones severas.";
        redFlags.push("Marcadores de severidad elevados");
        interpretation = "Perfil compatible con respuesta inflamatoria sistémica y riesgo de deterioro.";
      } else if (status === "altered") {
        findings = ["Leucocitosis moderada.", "PCR elevada.", "Desbalance metabólico leve-moderado."];
        summary = "Laboratorio inicial con alteraciones moderadas.";
        interpretation = "Sugiere proceso activo que requiere control evolutivo.";
      } else {
        findings = ["Hemograma sin alteraciones mayores.", "Química básica en rango esperado.", "Sin marcadores de severidad significativos."];
      }
      break;

    case "urinalysis":
      if (status === "critical" && (signals.renal || signals.obstetric)) {
        findings = ["Piuria/hematuria significativa orientativa.", "Proteinuria relevante.", "Sedimento sugerente de compromiso urinario importante."];
        summary = "Uroanálisis con hallazgos de alto riesgo.";
        redFlags.push("Compromiso renal/urinario severo");
        interpretation = "Requiere correlación urgente con función renal y contexto clínico.";
      } else if (status === "altered" && (signals.renal || signals.obstetric)) {
        findings = ["Leucocituria moderada.", "Proteinuria leve.", "Hallazgos compatibles con proceso urinario activo."];
        summary = "Uroanálisis con alteraciones moderadas.";
        interpretation = "Sugiere foco urinario probable; correlacionar con clínica.";
      } else {
        findings = ["Sedimento urinario sin alteraciones relevantes.", "Sin proteinuria significativa.", "Sin datos orientativos de infección activa."];
      }
      break;

    case "obstetric_assessment":
      if (status === "critical") {
        findings = ["Signos de alarma obstétrica presentes.", "Compromiso materno orientativo con riesgo elevado.", "Se requiere evaluación obstétrica urgente."];
        summary = "Evaluación obstétrica con hallazgos críticos.";
        redFlags.push("Alarma obstétrica");
        interpretation = "Priorizar protocolo obstétrico y seguridad materno-fetal.";
      } else if (status === "altered") {
        findings = ["Síntomas obstétricos de alarma parcial.", "Estado materno con alteración moderada.", "Necesita reevaluación frecuente."];
        summary = "Evaluación obstétrica con alteraciones moderadas.";
        interpretation = "Requiere seguimiento estrecho y ampliación diagnóstica.";
      } else {
        findings = ["Sin signos obstétricos de alarma mayor en tamizaje.", "Estado general materno estable.", "Vigilancia clínica habitual."];
      }
      break;

    case "pediatric_general_assessment":
      if (status === "critical") {
        findings = ["Trabajo respiratorio aumentado.", "Signos de deshidratación significativa.", "Decaimiento marcado según cuidador."];
        summary = "Evaluación pediátrica con hallazgos críticos.";
        redFlags.push("Deterioro pediátrico agudo");
        interpretation = "Priorizar estabilización pediátrica y reevaluación inmediata.";
      } else if (status === "altered") {
        findings = ["Irritabilidad y disminución de actividad.", "Hidratación limítrofe.", "Síntomas respiratorios o infecciosos moderados."];
        summary = "Evaluación pediátrica con alteraciones moderadas.";
        interpretation = "Monitoreo pediátrico estrecho y educación al cuidador.";
      } else {
        findings = ["Paciente pediátrico activo y reactivo.", "Sin dificultad respiratoria en reposo.", "Hidratación conservada."];
      }
      break;

    case "functional_screen":
      if (status === "critical") {
        findings = ["Dependencia funcional marcada para ABVD.", "Riesgo de caídas y deterioro rápido.", "Necesidad de apoyo continuo."];
        summary = "Tamizaje funcional con compromiso severo.";
        redFlags.push("Dependencia funcional alta");
        interpretation = "Requiere plan integral de soporte y seguridad.";
      } else if (status === "altered") {
        findings = ["Dependencia parcial en actividades básicas.", "Fatiga y limitación de movilidad.", "Necesita apoyo familiar ocasional."];
        summary = "Tamizaje funcional con compromiso moderado.";
        interpretation = "Se recomienda plan de rehabilitación y seguimiento funcional.";
      } else {
        findings = ["Autonomía funcional global conservada.", "Sin dependencia relevante en ABVD.", "Movilidad sin limitación mayor reportada."];
      }
      break;

    default:
      findings = ["Sin hallazgos orientativos relevantes en esta simulación."];
      break;
  }

  return {
    exam_id: definition.id,
    exam_name: definition.name,
    category: definition.category,
    status,
    summary,
    findings,
    interpretation,
    red_flags: redFlags,
    completed_at: new Date().toISOString(),
    educational_note: EDUCATIONAL_NOTE,
    hidden_execution: true,
  };
}
