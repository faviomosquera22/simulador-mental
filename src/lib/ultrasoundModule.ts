import {
  boundedNumber,
  buildVariantId,
  buildVariantName,
  buildVariantPatient,
  buildVariantSentence,
  expandCaseLibrary,
  pickDeterministic,
} from "./caseExpansion";
import {
  ADVANCED_MODULE_LIBRARY_SIZE,
  advancedDifficultyLabel,
  keywordScore,
  normalizeText,
  type AdvancedDifficulty,
  type AdvancedPatientProfile,
  type ModeCompatibility,
} from "./advancedModuleUtils";

export type UltrasoundCategory = "obstetricia" | "cardiaca" | "renal" | "abdomen" | "trauma";

export type UltrasoundContext = "maternal" | "cardiac" | "renal" | "abdominal" | "trauma" | "general";

export type UltrasoundProbe = "convex" | "sectorial" | "lineal";

export type UltrasoundPreset =
  | "ob_singleton_viable"
  | "ob_breech"
  | "cardiac_pericardial_effusion"
  | "cardiac_low_ejection_fraction"
  | "renal_hydronephrosis"
  | "biliary_cholelithiasis"
  | "fast_ruq_free_fluid"
  | "fast_luq_free_fluid"
  | "fast_pelvis_free_fluid"
  | "fast_pericardial_effusion"
  | "efast_pneumothorax"
  | "efast_hemothorax";

export type UltrasoundCase = {
  id: string;
  title: string;
  category: UltrasoundCategory;
  subcategory: string;
  difficulty: AdvancedDifficulty;
  context: UltrasoundContext;
  clinicalSummary: string;
  patientProfile: AdvancedPatientProfile;
  probe: UltrasoundProbe;
  scanPlane: string;
  keyFindings: string[];
  correctAnswer: string;
  expectedOutcome: string;
  distractors: string[];
  feedback: {
    explanation: string;
    expectedConduct: string;
    highlightHint: string;
  };
  tags: string[];
  modeCompatibility: ModeCompatibility;
  imagePreset: UltrasoundPreset;
  questionStem: string;
  optionPool: string[];
  highlightRegions: Array<{ x: number; y: number; width: number; height: number; label: string }>;
};

export type UltrasoundInterpretationResult = {
  totalScore: number;
  rubric: {
    answer: number;
    justification: number;
  };
  outcome: "excellent" | "good" | "partial" | "needs_review";
  feedback: {
    answer: string;
    justification: string;
    summary: string;
  };
};

type UltrasoundPresetTemplate = {
  category: UltrasoundCategory;
  context: UltrasoundContext;
  probe: UltrasoundProbe;
  scanPlane: string;
  keyFindings: string[];
  correctAnswer: string;
  expectedOutcome: string;
  distractors: string[];
  feedback: UltrasoundCase["feedback"];
  questionStem: string;
  tags: string[];
  highlightRegions: UltrasoundCase["highlightRegions"];
};

type UltrasoundSeed = {
  id: string;
  title: string;
  imagePreset: UltrasoundPreset;
  subcategory: string;
  difficulty: AdvancedDifficulty;
  clinicalSummary: string;
  patientProfile: AdvancedPatientProfile;
  expectedOutcome?: string;
  distractors?: string[];
  questionStem?: string;
  tags?: string[];
  keyFindings?: string[];
  correctAnswer?: string;
  feedback?: Partial<UltrasoundCase["feedback"]>;
  probe?: UltrasoundProbe;
  scanPlane?: string;
  highlightRegions?: UltrasoundCase["highlightRegions"];
};

const ULTRASOUND_PRESET_TEMPLATES: Record<UltrasoundPreset, UltrasoundPresetTemplate> = {
  ob_singleton_viable: {
    category: "obstetricia",
    context: "maternal",
    probe: "convex",
    scanPlane: "Suprapubico longitudinal",
    keyFindings: ["saco gestacional intrauterino", "polo fetal visible", "actividad cardiaca presente"],
    correctAnswer: "Gestacion intrauterina viable",
    expectedOutcome: "Correlacionar con edad gestacional, signos maternos y continuar control prenatal.",
    distractors: ["Embarazo ectopico", "Gestacion anembrionada", "Aborto retenido"],
    feedback: {
      explanation: "La presencia de saco intrauterino con polo fetal y actividad cardiaca corresponde a una gestacion viable.",
      expectedConduct: "Registrar hallazgos, orientar control prenatal y vigilar signos de alarma obstetrica.",
      highlightHint: "Busca el polo fetal dentro del saco y diferencia sus bordes del miometrio.",
    },
    questionStem: "¿Cual es la interpretacion ecografica principal?",
    tags: ["ecografia", "obstetricia", "embarazo", "viabilidad_fetal"],
    highlightRegions: [{ x: 42, y: 36, width: 24, height: 28, label: "Polo fetal" }],
  },
  ob_breech: {
    category: "obstetricia",
    context: "maternal",
    probe: "convex",
    scanPlane: "Longitudinal obstetrico",
    keyFindings: ["cabeza fetal en fondo uterino", "pelvis orientada hacia el cervix", "eje fetal invertido"],
    correctAnswer: "Presentacion podalica",
    expectedOutcome: "Registrar la presentacion, correlacionar con edad gestacional y discutir conducta obstetrica.",
    distractors: ["Presentacion cefalica", "Gestacion gemelar", "Placenta previa"],
    feedback: {
      explanation: "Cuando la cabeza fetal se ubica en el fondo uterino y las nalgas se orientan al cervix, la presentacion es podalica.",
      expectedConduct: "Documentar la posicion fetal y coordinar reevaluacion obstetrica segun protocolo.",
      highlightHint: "Ubica la cabeza en el polo superior y compara la orientacion del tronco con la referencia.",
    },
    questionStem: "¿Que posicion fetal describe mejor la imagen?",
    tags: ["ecografia", "obstetricia", "presentacion_fetal", "podalica"],
    highlightRegions: [{ x: 44, y: 21, width: 24, height: 18, label: "Cabeza fetal superior" }],
  },
  cardiac_pericardial_effusion: {
    category: "cardiaca",
    context: "cardiac",
    probe: "sectorial",
    scanPlane: "Subxifoideo de cuatro camaras",
    keyFindings: ["halo anecoico pericardico", "liquido rodeando el corazon", "colapso parcial de cavidades derechas"],
    correctAnswer: "Derrame pericardico",
    expectedOutcome: "Correlacionar con estabilidad hemodinamica y valorar tamponamiento/pericardiocentesis.",
    distractors: ["Derrame pleural izquierdo", "Funcion sistolica normal", "Trombo ventricular"],
    feedback: {
      explanation: "El halo anecoico que rodea el corazon corresponde a liquido en el espacio pericardico.",
      expectedConduct: "Relacionar con el estado de perfusion y escalar conducta urgente si hay signos de compromiso hemodinamico.",
      highlightHint: "Sigue la banda negra que circunda el contorno cardiaco y no la confundas con cavidades intracardiacas.",
    },
    questionStem: "¿Que hallazgo cardiaco domina esta ventana?",
    tags: ["ecografia", "cardiaca", "pericardio", "shock"],
    highlightRegions: [{ x: 28, y: 24, width: 44, height: 44, label: "Liquido pericardico" }],
  },
  cardiac_low_ejection_fraction: {
    category: "cardiaca",
    context: "cardiac",
    probe: "sectorial",
    scanPlane: "Parasternal largo eje",
    keyFindings: [
      "ventriculo izquierdo dilatado",
      "cambio minimo de cavidad entre sistole y diastole",
      "contractilidad global disminuida",
    ],
    correctAnswer: "Hipocinesia global con fraccion de eyeccion reducida",
    expectedOutcome: "Relacionar la contractilidad deprimida con el cuadro clinico y ajustar soporte hemodinamico/diuretico.",
    distractors: ["Funcion sistolica conservada", "Derrame pericardico", "Vegetacion valvular movil"],
    feedback: {
      explanation: "La cavidad amplia con poco acortamiento sistolico es compatible con fraccion de eyeccion reducida.",
      expectedConduct: "Integrar hallazgo con signos de congestion y perfusion para definir conducta inicial.",
      highlightHint: "Compara el tamano de la cavidad ventricular con una referencia de contraccion conservada.",
    },
    questionStem: "¿Como interpretas la funcion sistolica del ventriculo izquierdo?",
    tags: ["ecografia", "cardiaca", "fraccion_eyeccion", "insuficiencia_cardiaca"],
    highlightRegions: [{ x: 36, y: 40, width: 24, height: 24, label: "Ventriculo izquierdo dilatado" }],
  },
  renal_hydronephrosis: {
    category: "renal",
    context: "renal",
    probe: "convex",
    scanPlane: "Renal longitudinal",
    keyFindings: ["dilatacion pielocalicial anecoica", "separacion del seno renal", "compresion relativa del parenquima"],
    correctAnswer: "Hidronefrosis renal",
    expectedOutcome: "Correlacionar con cuadro obstructivo, dolor y funcion renal para definir manejo.",
    distractors: ["Rinon sin alteraciones", "Quiste cortical simple", "Coleccion perirrenal"],
    feedback: {
      explanation: "La pelvis renal y los calices dilatados forman imagenes anecoicas ramificadas compatibles con hidronefrosis.",
      expectedConduct: "Relacionar con litiasis u obstruccion y priorizar analgesia, laboratorios y derivacion segun gravedad.",
      highlightHint: "Busca espacios anecoicos en el seno renal que deforman la arquitectura central.",
    },
    questionStem: "¿Que alteracion renal muestra la imagen?",
    tags: ["ecografia", "renal", "hidronefrosis", "obstruccion"],
    highlightRegions: [{ x: 44, y: 38, width: 22, height: 26, label: "Pelvis renal dilatada" }],
  },
  biliary_cholelithiasis: {
    category: "abdomen",
    context: "abdominal",
    probe: "convex",
    scanPlane: "Hipocondrio derecho oblicuo",
    keyFindings: ["focos hiperecogenicos intravesiculares", "sombra acustica posterior", "luz vesicular anecoica"],
    correctAnswer: "Colelitiasis con sombra acustica posterior",
    expectedOutcome: "Correlacionar con dolor biliar y completar evaluacion clinica/hepatobiliar.",
    distractors: ["Colecistitis enfisematosa", "Barro biliar sin litiasis", "Vesicula normal"],
    feedback: {
      explanation: "Los calculos son focos hiperecogenicos con sombra posterior oscura dentro de la vesicula.",
      expectedConduct: "Relacionar con Murphy clinico, laboratorio hepatobiliar y signos inflamatorios antes de decidir conducta.",
      highlightHint: "Identifica ecos brillantes dependientes con una sombra negra lineal por detras.",
    },
    questionStem: "¿Cual es el hallazgo hepatobiliar mas probable?",
    tags: ["ecografia", "abdomen", "vesicula", "colelitiasis"],
    highlightRegions: [{ x: 50, y: 48, width: 16, height: 24, label: "Calculos y sombra posterior" }],
  },
  fast_ruq_free_fluid: {
    category: "trauma",
    context: "trauma",
    probe: "convex",
    scanPlane: "FAST hepatorrenal (Morrison)",
    keyFindings: [
      "lamina anecoica en espacio hepatorrenal",
      "liquido libre dependiente entre higado y rinon",
      "fast positivo en morrison",
    ],
    correctAnswer: "FAST positivo en espacio hepatorrenal",
    expectedOutcome: "Tratar como liquido libre intrabdominal en trauma y correlacionar con estabilidad hemodinamica.",
    distractors: ["FAST negativo", "Colecistitis aguda", "Quiste hepatico aislado"],
    feedback: {
      explanation: "La coleccion anecoica entre higado y rinon corresponde a liquido libre en la bolsa de Morrison.",
      expectedConduct: "Integrar con trauma abdominal, perfusion y necesidad de escalamiento quirurgico o tomografico segun estabilidad.",
      highlightHint: "Sigue el receso hepatorrenal y busca una banda negra dependiente donde normalmente no debe haber separacion.",
    },
    questionStem: "¿Cual es la interpretacion FAST principal en esta ventana hepatorrenal?",
    tags: ["ecografia", "trauma", "fast", "morrison", "liquido_libre"],
    highlightRegions: [{ x: 45, y: 39, width: 20, height: 18, label: "Liquido en Morrison" }],
  },
  fast_luq_free_fluid: {
    category: "trauma",
    context: "trauma",
    probe: "convex",
    scanPlane: "FAST esplenorrenal",
    keyFindings: [
      "lamina anecoica periesplenica",
      "separacion del espacio esplenorrenal",
      "fast positivo en cuadrante superior izquierdo",
    ],
    correctAnswer: "FAST positivo en espacio esplenorrenal",
    expectedOutcome: "Asumir liquido libre abdominal izquierdo y correlacionar con trauma esplenico o hemoperitoneo.",
    distractors: ["FAST negativo", "Infarto esplenico", "Rinon izquierdo sin alteraciones"],
    feedback: {
      explanation: "La coleccion anecoica adyacente a bazo y rinon izquierdo sugiere liquido libre en la ventana esplenorrenal.",
      expectedConduct: "Relacionar con mecanismo traumatico, signos de shock y necesidad de imagen o cirugia urgente.",
      highlightHint: "Compara la interfaz entre bazo y rinon: el liquido libre crea una banda negra dependiente.",
    },
    questionStem: "¿Cual es la interpretacion FAST principal en esta ventana esplenorrenal?",
    tags: ["ecografia", "trauma", "fast", "esplenorrenal", "hemoperitoneo"],
    highlightRegions: [{ x: 34, y: 41, width: 22, height: 18, label: "Liquido esplenorrenal" }],
  },
  fast_pelvis_free_fluid: {
    category: "trauma",
    context: "trauma",
    probe: "convex",
    scanPlane: "FAST pelvis suprapubica",
    keyFindings: [
      "coleccion anecoica en fondo de saco",
      "liquido libre pelvico dependiente",
      "vejiga utilizada como ventana sonografica",
    ],
    correctAnswer: "FAST positivo en fondo de saco pelvico",
    expectedOutcome: "Interpretar como liquido libre pelvico en trauma y correlacionar con compromiso intraabdominal.",
    distractors: ["Pelvis sin liquido libre", "Globo vesical simple", "Quiste pelvico aislado"],
    feedback: {
      explanation: "El liquido libre pelvico aparece como coleccion anecoica dependiente alrededor o detras de la vejiga.",
      expectedConduct: "Relacionar con mecanismo traumatico y decidir conducta de trauma segun estabilidad y hallazgos asociados.",
      highlightHint: "Ubica primero la vejiga y busca una banda negra dependiente fuera de su luz.",
    },
    questionStem: "¿Que hallazgo FAST domina la ventana pelvica?",
    tags: ["ecografia", "trauma", "fast", "pelvis", "fondo_de_saco"],
    highlightRegions: [{ x: 33, y: 28, width: 34, height: 20, label: "Liquido libre pelvico" }],
  },
  fast_pericardial_effusion: {
    category: "trauma",
    context: "trauma",
    probe: "sectorial",
    scanPlane: "FAST subxifoideo pericardico",
    keyFindings: [
      "halo anecoico pericardico traumatico",
      "liquido rodeando el corazon",
      "sospecha de hemopericardio",
    ],
    correctAnswer: "Hemopericardio probable en FAST subxifoideo",
    expectedOutcome: "Correlacionar con inestabilidad y actuar como tamponamiento traumatico hasta demostrar lo contrario.",
    distractors: ["FAST pericardico negativo", "Funcion sistolica normal", "Derrame pleural aislado"],
    feedback: {
      explanation: "La banda anecoica alrededor del corazon en trauma sugiere hemopericardio o derrame pericardico traumatico.",
      expectedConduct: "Integrar con hipotension y trauma toracico para priorizar cirugia o drenaje emergente segun protocolo.",
      highlightHint: "Sigue el contorno cardiaco y busca un halo negro por fuera del miocardio en la ventana subxifoidea.",
    },
    questionStem: "¿Que hallazgo FAST subxifoideo sugiere compromiso pericardico traumatico?",
    tags: ["ecografia", "trauma", "fast", "subxifoideo", "hemopericardio"],
    highlightRegions: [{ x: 28, y: 24, width: 44, height: 44, label: "Liquido pericardico traumatico" }],
  },
  efast_pneumothorax: {
    category: "trauma",
    context: "trauma",
    probe: "lineal",
    scanPlane: "E-FAST toracico anterior",
    keyFindings: [
      "linea pleural fija sin deslizamiento",
      "ausencia de lung sliding",
      "predominio de lineas a sin artefactos verticales",
    ],
    correctAnswer: "Neumotorax con ausencia de lung sliding",
    expectedOutcome: "Correlacionar con compromiso ventilatorio y tratar como neumotorax traumatico segun el estado clinico.",
    distractors: ["Lung sliding conservado", "Hemotorax dependiente", "Edema intersticial difuso"],
    feedback: {
      explanation: "La ausencia de deslizamiento pleural con lineas A predominantes sugiere neumotorax en la ventana anterior.",
      expectedConduct: "Integrar con saturacion, mecanica ventilatoria y necesidad de descompresion o drenaje pleural.",
      highlightHint: "Fijate en la linea pleural: si permanece rigida y no ves artefactos verticales, piensa en neumotorax.",
    },
    questionStem: "¿Que hallazgo E-FAST toracico explica mejor esta ventana pleural?",
    tags: ["ecografia", "trauma", "efast", "neumotorax", "pleura"],
    highlightRegions: [{ x: 24, y: 24, width: 50, height: 18, label: "Pleura sin sliding" }],
  },
  efast_hemothorax: {
    category: "trauma",
    context: "trauma",
    probe: "convex",
    scanPlane: "E-FAST toracico basal",
    keyFindings: [
      "coleccion anecoica supradiafragmatica",
      "liquido pleural dependiente",
      "ocupacion compatible con hemotorax",
    ],
    correctAnswer: "Hemotorax con coleccion pleural dependiente",
    expectedOutcome: "Correlacionar con trauma toracico y considerar drenaje pleural segun estabilidad y mecanica respiratoria.",
    distractors: ["Neumotorax anterior", "Ventana toracica normal", "Consolidacion basal aislada"],
    feedback: {
      explanation: "La coleccion anecoica sobre el diafragma y fuera del parenquima pulmonar es compatible con hemotorax.",
      expectedConduct: "Integrar con trauma, expansion toracica y necesidad de tubo de torax o escalamiento inmediato.",
      highlightHint: "Ubica el diafragma y busca una banda anecoica dependiente por encima de el, no dentro del abdomen.",
    },
    questionStem: "¿Que hallazgo E-FAST toracico domina esta ventana basal?",
    tags: ["ecografia", "trauma", "efast", "hemotorax", "pleura"],
    highlightRegions: [{ x: 32, y: 52, width: 34, height: 22, label: "Coleccion pleural" }],
  },
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function createBaseUltrasoundCase(seed: UltrasoundSeed): UltrasoundCase {
  const template = ULTRASOUND_PRESET_TEMPLATES[seed.imagePreset];
  const correctAnswer = seed.correctAnswer ?? template.correctAnswer;
  const distractors = seed.distractors ?? template.distractors;

  return {
    id: seed.id,
    title: seed.title,
    category: template.category,
    subcategory: seed.subcategory,
    difficulty: seed.difficulty,
    context: template.context,
    clinicalSummary: seed.clinicalSummary,
    patientProfile: seed.patientProfile,
    probe: seed.probe ?? template.probe,
    scanPlane: seed.scanPlane ?? template.scanPlane,
    keyFindings: seed.keyFindings ?? template.keyFindings,
    correctAnswer,
    expectedOutcome: seed.expectedOutcome ?? template.expectedOutcome,
    distractors,
    feedback: {
      explanation: seed.feedback?.explanation ?? template.feedback.explanation,
      expectedConduct: seed.feedback?.expectedConduct ?? template.feedback.expectedConduct,
      highlightHint: seed.feedback?.highlightHint ?? template.feedback.highlightHint,
    },
    tags: uniqueStrings([...template.tags, ...(seed.tags ?? [])]),
    modeCompatibility: "both",
    imagePreset: seed.imagePreset,
    questionStem: seed.questionStem ?? template.questionStem,
    optionPool: [correctAnswer, ...distractors],
    highlightRegions: seed.highlightRegions ?? template.highlightRegions,
  };
}

type TraumaScenarioSeed = {
  idSuffix: string;
  titleSuffix: string;
  clinicalContext: string;
  patientProfile: AdvancedPatientProfile;
  difficulty: AdvancedDifficulty;
  tags?: string[];
};

type TraumaPresetBuilder = {
  imagePreset: Extract<
    UltrasoundPreset,
    | "fast_ruq_free_fluid"
    | "fast_luq_free_fluid"
    | "fast_pelvis_free_fluid"
    | "fast_pericardial_effusion"
    | "efast_pneumothorax"
    | "efast_hemothorax"
  >;
  titlePrefix: string;
  subcategory: string;
  summaryFocus: string;
  tags: string[];
};

const TRAUMA_ABDOMINAL_SCENARIOS: TraumaScenarioSeed[] = [
  {
    idSuffix: "moto",
    titleSuffix: "tras colision en motocicleta",
    clinicalContext: "Trauma cerrado de abdomen con dolor en flanco derecho y taquicardia en la sala de trauma",
    patientProfile: {
      name: "Diego R.",
      age: 27,
      sex: "male",
      chiefComplaint: "Dolor abdominal tras colision en motocicleta",
      setting: "Sala de trauma",
    },
    difficulty: "intermediate",
    tags: ["mecanismo_alta_energia", "trauma_cerrado"],
  },
  {
    idSuffix: "choque-frontal",
    titleSuffix: "tras choque frontal de automovil",
    clinicalContext: "Politrauma con dolor abdominal difuso y sensibilidad en cuadrantes superiores durante valoracion primaria",
    patientProfile: {
      name: "Marina C.",
      age: 34,
      sex: "female",
      chiefComplaint: "Dolor abdominal difuso despues de choque vehicular",
      setting: "Shock room",
    },
    difficulty: "intermediate",
    tags: ["choque_vehicular", "valoracion_primaria"],
  },
  {
    idSuffix: "atropellamiento",
    titleSuffix: "tras atropellamiento",
    clinicalContext: "Paciente politraumatizado con dolor abdominal bajo e hipotension limtrofe en reevaluacion FAST",
    patientProfile: {
      name: "Ruben M.",
      age: 48,
      sex: "male",
      chiefComplaint: "Dolor abdominal y mareo luego de atropellamiento",
      setting: "Area critica",
    },
    difficulty: "advanced",
    tags: ["politrauma", "hipotension"],
  },
  {
    idSuffix: "caida-altura",
    titleSuffix: "tras caida de altura moderada",
    clinicalContext: "Trauma toracoabdominal con dolor en costado izquierdo y vigilancia seriada por mecanismo contuso",
    patientProfile: {
      name: "Lucia P.",
      age: 29,
      sex: "female",
      chiefComplaint: "Dolor en costado tras caida de altura",
      setting: "Observacion de urgencias",
    },
    difficulty: "intermediate",
    tags: ["caida", "trauma_contuso"],
  },
  {
    idSuffix: "golpe-hcd",
    titleSuffix: "tras golpe directo en hipocondrio derecho",
    clinicalContext: "Contusion abdominal focal con defensa localizada y necesidad de descartar liquido libre",
    patientProfile: {
      name: "Victor H.",
      age: 22,
      sex: "male",
      chiefComplaint: "Golpe en abdomen derecho durante actividad fisica",
      setting: "Urgencias generales",
    },
    difficulty: "basic",
    tags: ["golpe_directo", "hipocondrio_derecho"],
  },
  {
    idSuffix: "golpe-hci",
    titleSuffix: "tras golpe directo en hipocondrio izquierdo",
    clinicalContext: "Trauma focal en cuadrante superior izquierdo con dolor progresivo y taquicardia compensadora",
    patientProfile: {
      name: "Natalia G.",
      age: 31,
      sex: "female",
      chiefComplaint: "Dolor en costado izquierdo tras golpe directo",
      setting: "Emergencia quirurgica",
    },
    difficulty: "intermediate",
    tags: ["hipocondrio_izquierdo", "dolor_progresivo"],
  },
  {
    idSuffix: "deportivo",
    titleSuffix: "tras trauma deportivo de alta energia",
    clinicalContext: "Trauma abdominal durante actividad deportiva con dolor persistente, nauseas y necesidad de descarte rapido",
    patientProfile: {
      name: "Kevin S.",
      age: 19,
      sex: "male",
      chiefComplaint: "Dolor abdominal posterior a choque deportivo",
      setting: "Unidad de urgencias",
    },
    difficulty: "basic",
    tags: ["deporte", "impacto"],
  },
  {
    idSuffix: "laboral",
    titleSuffix: "tras aplastamiento abdominal laboral",
    clinicalContext: "Aplastamiento de tronco con dolor abdominal severo y reevaluacion seriada por riesgo de hemoperitoneo",
    patientProfile: {
      name: "Cesar L.",
      age: 44,
      sex: "male",
      chiefComplaint: "Dolor abdominal intenso luego de accidente laboral",
      setting: "Trauma laboral",
    },
    difficulty: "advanced",
    tags: ["aplastamiento", "accidente_laboral"],
  },
  {
    idSuffix: "arma-blanca",
    titleSuffix: "tras herida cortopunzante abdominal",
    clinicalContext: "Trauma penetrante de abdomen con estabilidad relativa y necesidad de valorar liquido libre de forma inmediata",
    patientProfile: {
      name: "Paola N.",
      age: 26,
      sex: "female",
      chiefComplaint: "Herida cortopunzante en abdomen",
      setting: "Sala de trauma",
    },
    difficulty: "advanced",
    tags: ["trauma_penetrante", "arma_blanca"],
  },
  {
    idSuffix: "sin-cinturon",
    titleSuffix: "en pasajero sin cinturon",
    clinicalContext: "Trauma abdominal por desaceleracion con dolor suprapubico y sensibilidad difusa en contexto vehicular",
    patientProfile: {
      name: "Javier T.",
      age: 37,
      sex: "male",
      chiefComplaint: "Dolor abdominal despues de accidente vehicular",
      setting: "Shock room",
    },
    difficulty: "intermediate",
    tags: ["desaceleracion", "vehicular"],
  },
  {
    idSuffix: "bicicleta",
    titleSuffix: "tras impacto de manubrio de bicicleta",
    clinicalContext: "Trauma focal infraumbilical con nausea y dolor en aumento durante la observacion inicial",
    patientProfile: {
      name: "Marta V.",
      age: 24,
      sex: "female",
      chiefComplaint: "Dolor bajo abdominal tras accidente en bicicleta",
      setting: "Observacion traumatologica",
    },
    difficulty: "basic",
    tags: ["bicicleta", "dolor_suprapubico"],
  },
  {
    idSuffix: "reevaluacion",
    titleSuffix: "durante reevaluacion seriada de politrauma",
    clinicalContext: "Paciente con traumatismo multiple y descenso de la presion arterial durante el control FAST repetido",
    patientProfile: {
      name: "Oscar D.",
      age: 56,
      sex: "male",
      chiefComplaint: "Reevaluacion por trauma multiple con hipotension",
      setting: "Area critica de trauma",
    },
    difficulty: "advanced",
    tags: ["reevaluacion", "inestabilidad"],
  },
];

const TRAUMA_THORACIC_SCENARIOS: TraumaScenarioSeed[] = [
  {
    idSuffix: "precordial",
    titleSuffix: "tras herida penetrante precordial",
    clinicalContext: "Trauma toracico penetrante con hipotension y disnea en valoracion E-FAST inmediata",
    patientProfile: {
      name: "Sergio B.",
      age: 29,
      sex: "male",
      chiefComplaint: "Dolor toracico y disnea tras herida precordial",
      setting: "Sala de trauma",
    },
    difficulty: "advanced",
    tags: ["precordial", "inestabilidad_hemodinamica"],
  },
  {
    idSuffix: "vehicular",
    titleSuffix: "tras trauma toracico cerrado vehicular",
    clinicalContext: "Colision de alta energia con dolor toracico, taquipnea y necesidad de descartar lesion pleural o pericardica",
    patientProfile: {
      name: "Andrea F.",
      age: 33,
      sex: "female",
      chiefComplaint: "Disnea y dolor toracico luego de choque vehicular",
      setting: "Shock room",
    },
    difficulty: "intermediate",
    tags: ["torax_cerrado", "vehicular"],
  },
  {
    idSuffix: "caida",
    titleSuffix: "tras caida con impacto toracico",
    clinicalContext: "Trauma toracico por caida con saturacion en descenso y reevaluacion ecografica al ingreso",
    patientProfile: {
      name: "Rafael Q.",
      age: 61,
      sex: "male",
      chiefComplaint: "Dolor costal y dificultad respiratoria",
      setting: "Emergencia medica",
    },
    difficulty: "intermediate",
    tags: ["caida", "hipoxemia"],
  },
  {
    idSuffix: "deportivo",
    titleSuffix: "tras contusion toracica deportiva",
    clinicalContext: "Impacto toracico durante actividad deportiva con dolor pleuritico y disnea leve progresiva",
    patientProfile: {
      name: "Elena A.",
      age: 21,
      sex: "female",
      chiefComplaint: "Dolor pleuritico despues de impacto deportivo",
      setting: "Urgencias generales",
    },
    difficulty: "basic",
    tags: ["deporte", "pleuritico"],
  },
  {
    idSuffix: "hemitx-izq",
    titleSuffix: "tras herida por arma blanca en hemitorax izquierdo",
    clinicalContext: "Trauma penetrante con taquicardia y asimetria ventilatoria en evaluacion ecografica toracica",
    patientProfile: {
      name: "Mario U.",
      age: 38,
      sex: "male",
      chiefComplaint: "Herida toracica izquierda con disnea",
      setting: "Trauma mayor",
    },
    difficulty: "advanced",
    tags: ["hemitorax_izquierdo", "arma_blanca"],
  },
  {
    idSuffix: "explosion",
    titleSuffix: "tras explosion con dolor pleuritico",
    clinicalContext: "Lesion toracica por onda expansiva con dolor respiratorio y sospecha de lesion pleural aguda",
    patientProfile: {
      name: "Noemi J.",
      age: 42,
      sex: "female",
      chiefComplaint: "Disnea y dolor toracico tras explosion",
      setting: "Sala de observacion critica",
    },
    difficulty: "advanced",
    tags: ["explosion", "onda_expansiva"],
  },
  {
    idSuffix: "fracturas-costales",
    titleSuffix: "con fracturas costales multiples",
    clinicalContext: "Trauma costal con dolor severo, respiracion superficial y necesidad de descartar neumotorax o hemotorax",
    patientProfile: {
      name: "Hector P.",
      age: 57,
      sex: "male",
      chiefComplaint: "Dolor costal intenso y dificultad para respirar",
      setting: "Unidad de trauma",
    },
    difficulty: "intermediate",
    tags: ["fracturas_costales", "respiracion_superficial"],
  },
  {
    idSuffix: "compresion",
    titleSuffix: "tras compresion toracica laboral",
    clinicalContext: "Compresion de torax en accidente laboral con desaturacion leve y reevaluacion pleural bedside",
    patientProfile: {
      name: "Camila E.",
      age: 36,
      sex: "female",
      chiefComplaint: "Compresion toracica con dolor y falta de aire",
      setting: "Trauma laboral",
    },
    difficulty: "intermediate",
    tags: ["compresion_toracica", "bedside"],
  },
  {
    idSuffix: "toracoabdominal",
    titleSuffix: "tras trauma toracoabdominal con hipotension",
    clinicalContext: "Compromiso respiratorio y hemodinamico luego de trauma mixto con necesidad de E-FAST extendido completo",
    patientProfile: {
      name: "Gabriel I.",
      age: 46,
      sex: "male",
      chiefComplaint: "Trauma toracoabdominal con hipotension",
      setting: "Shock room",
    },
    difficulty: "advanced",
    tags: ["toracoabdominal", "shock"],
  },
  {
    idSuffix: "politrauma",
    titleSuffix: "durante reanimacion de politrauma",
    clinicalContext: "Paciente politraumatizado intubado con empeoramiento ventilatorio durante reevaluacion ecografica",
    patientProfile: {
      name: "Valeria Z.",
      age: 31,
      sex: "female",
      chiefComplaint: "Empeoramiento ventilatorio en politrauma",
      setting: "Area critica de trauma",
    },
    difficulty: "advanced",
    tags: ["politrauma", "ventilacion"],
  },
  {
    idSuffix: "manubrio",
    titleSuffix: "tras impacto de manubrio en torax",
    clinicalContext: "Trauma toracico focal con dolor anterior y necesidad de buscar signos pleurales de forma rapida",
    patientProfile: {
      name: "Bruno K.",
      age: 24,
      sex: "male",
      chiefComplaint: "Golpe en torax y disnea leve",
      setting: "Urgencias traumatologicas",
    },
    difficulty: "basic",
    tags: ["torax_anterior", "bicicleta"],
  },
  {
    idSuffix: "rural",
    titleSuffix: "tras accidente rural con disnea progresiva",
    clinicalContext: "Trauma toracico demorado con aumento de disnea y reevaluacion por posible lesion pleuropulmonar",
    patientProfile: {
      name: "Teresa W.",
      age: 63,
      sex: "female",
      chiefComplaint: "Disnea progresiva despues de accidente rural",
      setting: "Sala de emergencia rural",
    },
    difficulty: "intermediate",
    tags: ["disnea_progresiva", "traslado"],
  },
];

const TRAUMA_ABDOMINAL_BUILDERS: TraumaPresetBuilder[] = [
  {
    imagePreset: "fast_ruq_free_fluid",
    titlePrefix: "FAST con Morrison positivo",
    subcategory: "fast_morrison_positivo",
    summaryFocus: "La ventana hepatorrenal sugiere liquido libre dependiente entre higado y rinon.",
    tags: ["fast", "morrison", "trauma_abdominal"],
  },
  {
    imagePreset: "fast_luq_free_fluid",
    titlePrefix: "FAST con liquido esplenorrenal",
    subcategory: "fast_esplenorrenal_positivo",
    summaryFocus: "La ventana esplenorrenal muestra una coleccion anecoica compatible con hemoperitoneo.",
    tags: ["fast", "esplenorrenal", "trauma_abdominal"],
  },
  {
    imagePreset: "fast_pelvis_free_fluid",
    titlePrefix: "FAST pelvico positivo",
    subcategory: "fast_pelvico_positivo",
    summaryFocus: "La ventana suprapubica muestra liquido libre dependiente alrededor del fondo de saco.",
    tags: ["fast", "pelvis", "trauma_abdominal"],
  },
];

const TRAUMA_THORACIC_BUILDERS: TraumaPresetBuilder[] = [
  {
    imagePreset: "fast_pericardial_effusion",
    titlePrefix: "FAST subxifoideo con hemopericardio probable",
    subcategory: "fast_hemopericardio_probable",
    summaryFocus: "La ventana pericardica muestra liquido anecoico rodeando el corazon en contexto traumatico.",
    tags: ["fast", "pericardio", "trauma_toracico"],
  },
  {
    imagePreset: "efast_pneumothorax",
    titlePrefix: "E-FAST con neumotorax traumatico",
    subcategory: "efast_neumotorax",
    summaryFocus: "La ventana pleural anterior muestra ausencia de lung sliding con patron compatible con neumotorax.",
    tags: ["efast", "neumotorax", "pleura"],
  },
  {
    imagePreset: "efast_hemothorax",
    titlePrefix: "E-FAST con hemotorax",
    subcategory: "efast_hemotorax",
    summaryFocus: "La ventana toracica basal muestra coleccion pleural dependiente compatible con hemotorax.",
    tags: ["efast", "hemotorax", "pleura"],
  },
];

function buildGeneratedTraumaSeeds(
  builders: TraumaPresetBuilder[],
  scenarios: TraumaScenarioSeed[]
): UltrasoundSeed[] {
  return builders.flatMap((builder) =>
    scenarios.map((scenario) => ({
      id: `us-${builder.subcategory}-${scenario.idSuffix}`,
      title: `${builder.titlePrefix} ${scenario.titleSuffix}`,
      imagePreset: builder.imagePreset,
      subcategory: builder.subcategory,
      difficulty: scenario.difficulty,
      clinicalSummary: `${scenario.clinicalContext}. ${builder.summaryFocus}`,
      patientProfile: scenario.patientProfile,
      tags: [...builder.tags, ...(scenario.tags ?? [])],
    }))
  );
}

const ULTRASOUND_TRAUMA_CASE_SEEDS: UltrasoundSeed[] = [
  ...buildGeneratedTraumaSeeds(TRAUMA_ABDOMINAL_BUILDERS, TRAUMA_ABDOMINAL_SCENARIOS),
  ...buildGeneratedTraumaSeeds(TRAUMA_THORACIC_BUILDERS, TRAUMA_THORACIC_SCENARIOS),
];

const ULTRASOUND_CASE_SEEDS: UltrasoundSeed[] = [
  {
    id: "us-ob-singleton-confirmacion",
    title: "Ecografia obstetrica con confirmacion de embarazo unico viable",
    imagePreset: "ob_singleton_viable",
    subcategory: "gestacion_intrauterina_viable",
    difficulty: "basic",
    clinicalSummary: "Control prenatal inicial con duda sobre localizacion y viabilidad del embarazo.",
    patientProfile: {
      name: "Ana M.",
      age: 26,
      sex: "female",
      chiefComplaint: "Confirmacion ecografica de embarazo",
      gestationalAgeWeeks: 11,
      setting: "Consulta obstetrica",
    },
  },
  {
    id: "us-ob-singleton-sangrado",
    title: "Ecografia obstetrica con viabilidad conservada ante sangrado leve",
    imagePreset: "ob_singleton_viable",
    subcategory: "amenaza_aborto_viable",
    difficulty: "basic",
    clinicalSummary: "Gestante del primer trimestre con manchado escaso y dolor hipogastrico leve.",
    patientProfile: {
      name: "Elena P.",
      age: 28,
      sex: "female",
      chiefComplaint: "Sangrado vaginal leve en embarazo temprano",
      gestationalAgeWeeks: 9,
      setting: "Emergencia obstetrica",
    },
    tags: ["sangrado_primer_trimestre", "amenaza_aborto"],
  },
  {
    id: "us-ob-singleton-dolor-pelvico",
    title: "Ecografia obstetrica con saco viable en contexto de dolor pelvico",
    imagePreset: "ob_singleton_viable",
    subcategory: "dolor_pelvico_gestacional",
    difficulty: "basic",
    clinicalSummary: "Dolor pelvico intermitente en gestacion temprana con estabilidad hemodinamica.",
    patientProfile: {
      name: "Mariela R.",
      age: 24,
      sex: "female",
      chiefComplaint: "Dolor pelvico en primer trimestre",
      gestationalAgeWeeks: 8,
      setting: "Consulta de ginecoobstetricia",
    },
    tags: ["dolor_pelvico", "primer_trimestre"],
  },
  {
    id: "us-ob-singleton-control-12s",
    title: "Ecografia obstetrica de control a las 12 semanas",
    imagePreset: "ob_singleton_viable",
    subcategory: "control_prenatal_primer_trimestre",
    difficulty: "basic",
    clinicalSummary: "Control prenatal programado para corroborar evolucion y vitalidad embriofetal.",
    patientProfile: {
      name: "Silvia T.",
      age: 32,
      sex: "female",
      chiefComplaint: "Control ecografico del primer trimestre",
      gestationalAgeWeeks: 12,
      setting: "Consulta prenatal",
    },
    tags: ["control_prenatal", "seguimiento"],
  },
  {
    id: "us-ob-singleton-fcf",
    title: "Ecografia obstetrica con actividad cardiaca embrionaria presente",
    imagePreset: "ob_singleton_viable",
    subcategory: "latido_fetal_presente",
    difficulty: "basic",
    clinicalSummary: "Paciente con antecedente de perdida previa que solicita confirmar vitalidad del embarazo actual.",
    patientProfile: {
      name: "Rocio V.",
      age: 30,
      sex: "female",
      chiefComplaint: "Confirmacion de latido fetal",
      gestationalAgeWeeks: 10,
      setting: "Unidad de alto riesgo obstetrico",
    },
    tags: ["actividad_cardiaca", "antecedente_obstetrico"],
  },
  {
    id: "us-ob-singleton-hiperemesis",
    title: "Ecografia obstetrica viable en contexto de hiperemesis",
    imagePreset: "ob_singleton_viable",
    subcategory: "hiperemesis_con_gestacion_viable",
    difficulty: "intermediate",
    clinicalSummary: "Gestante con vomitos persistentes y deshidratacion leve en reevaluacion de urgencias.",
    patientProfile: {
      name: "Diana C.",
      age: 22,
      sex: "female",
      chiefComplaint: "Nauseas y vomitos intensos durante el embarazo",
      gestationalAgeWeeks: 10,
      setting: "Observacion obstetrica",
    },
    tags: ["hiperemesis", "urgencias_obstetricas"],
  },
  {
    id: "us-ob-singleton-antecedente-ectopico",
    title: "Ecografia obstetrica con localizacion intrauterina tras antecedente de ectopico",
    imagePreset: "ob_singleton_viable",
    subcategory: "localizacion_intrauterina",
    difficulty: "intermediate",
    clinicalSummary: "Gestante con antecedente de embarazo ectopico en control precoz de localizacion.",
    patientProfile: {
      name: "Paola G.",
      age: 34,
      sex: "female",
      chiefComplaint: "Control temprano por antecedente de ectopico",
      gestationalAgeWeeks: 7,
      setting: "Consulta de fertilidad",
    },
    tags: ["antecedente_ectopico", "localizacion_gestacional"],
  },
  {
    id: "us-ob-singleton-amenaza",
    title: "Ecografia obstetrica con amenaza de aborto y viabilidad mantenida",
    imagePreset: "ob_singleton_viable",
    subcategory: "amenaza_aborto_con_viabilidad",
    difficulty: "intermediate",
    clinicalSummary: "Sangrado moderado sin inestabilidad ni expulsion de tejidos en el primer trimestre.",
    patientProfile: {
      name: "Carmen L.",
      age: 29,
      sex: "female",
      chiefComplaint: "Amenaza de aborto",
      gestationalAgeWeeks: 9,
      setting: "Area de observacion obstetrica",
    },
    tags: ["amenaza_aborto", "viabilidad_conservada"],
  },
  {
    id: "us-ob-breech-control",
    title: "Ecografia obstetrica con presentacion podalica en control del tercer trimestre",
    imagePreset: "ob_breech",
    subcategory: "presentacion_podalica",
    difficulty: "intermediate",
    clinicalSummary: "Gestante del tercer trimestre en control de posicion fetal para plan de parto.",
    patientProfile: {
      name: "Carla R.",
      age: 31,
      sex: "female",
      chiefComplaint: "Control prenatal del tercer trimestre",
      gestationalAgeWeeks: 34,
      setting: "Sala de obstetricia",
    },
  },
  {
    id: "us-ob-breech-persistente",
    title: "Ecografia obstetrica con podalica persistente al final de la gestacion",
    imagePreset: "ob_breech",
    subcategory: "podalica_persistente",
    difficulty: "intermediate",
    clinicalSummary: "Gestante de 36 semanas con reevaluacion de posicion fetal tras medidas posturales.",
    patientProfile: {
      name: "Lorena S.",
      age: 27,
      sex: "female",
      chiefComplaint: "Reevaluacion de posicion fetal",
      gestationalAgeWeeks: 36,
      setting: "Control prenatal avanzado",
    },
    tags: ["presentacion_fetal", "reevaluacion"],
  },
  {
    id: "us-ob-breech-cesarea-previa",
    title: "Ecografia obstetrica con podalica en gestante con cesarea previa",
    imagePreset: "ob_breech",
    subcategory: "podalica_con_cesarea_previa",
    difficulty: "advanced",
    clinicalSummary: "Gestante con antecedente de cesarea previa en valoracion de via de finalizacion.",
    patientProfile: {
      name: "Nadia F.",
      age: 35,
      sex: "female",
      chiefComplaint: "Definicion de conducta obstetrica",
      gestationalAgeWeeks: 37,
      setting: "Consulta de alto riesgo",
    },
    tags: ["cesarea_previa", "conducta_obstetrica"],
  },
  {
    id: "us-ob-breech-movimientos",
    title: "Ecografia obstetrica con presentacion podalica ante disminucion de movimientos",
    imagePreset: "ob_breech",
    subcategory: "podalica_con_disminucion_movimientos",
    difficulty: "advanced",
    clinicalSummary: "Gestante acude por disminucion subjetiva de movimientos fetales y requiere reevaluacion global.",
    patientProfile: {
      name: "Valeria N.",
      age: 29,
      sex: "female",
      chiefComplaint: "Disminucion de movimientos fetales",
      gestationalAgeWeeks: 35,
      setting: "Emergencia obstetrica",
    },
    tags: ["movimientos_fetales", "reevaluacion_fetal"],
  },
  {
    id: "us-ob-breech-hipertension",
    title: "Ecografia obstetrica con podalica en gestante hipertensa",
    imagePreset: "ob_breech",
    subcategory: "podalica_en_trastorno_hipertensivo",
    difficulty: "advanced",
    clinicalSummary: "Gestante hipertensa en control ecografico para definir conducta y vigilancia materno-fetal.",
    patientProfile: {
      name: "Martha Q.",
      age: 33,
      sex: "female",
      chiefComplaint: "Control por hipertension gestacional",
      gestationalAgeWeeks: 34,
      setting: "Hospital del dia obstetrico",
    },
    tags: ["hipertension_gestacional", "alto_riesgo"],
  },
  {
    id: "us-ob-breech-preparto",
    title: "Ecografia obstetrica con podalica en valoracion preparto",
    imagePreset: "ob_breech",
    subcategory: "podalica_preparto",
    difficulty: "intermediate",
    clinicalSummary: "Evaluacion ecografica preparto para confirmar orientacion fetal antes de la decision final.",
    patientProfile: {
      name: "Julia D.",
      age: 25,
      sex: "female",
      chiefComplaint: "Valoracion preparto",
      gestationalAgeWeeks: 38,
      setting: "Centro obstetrico",
    },
    tags: ["preparto", "planificacion_parto"],
  },
  {
    id: "us-ob-breech-trabajo-parto",
    title: "Ecografia obstetrica con podalica al ingreso en trabajo de parto",
    imagePreset: "ob_breech",
    subcategory: "podalica_en_trabajo_de_parto",
    difficulty: "advanced",
    clinicalSummary: "Gestante con dinamica uterina regular ingresa para confirmar posicion fetal al inicio del trabajo de parto.",
    patientProfile: {
      name: "Gabriela H.",
      age: 30,
      sex: "female",
      chiefComplaint: "Contracciones uterinas regulares",
      gestationalAgeWeeks: 37,
      setting: "Ingreso a centro obstetrico",
    },
    tags: ["trabajo_de_parto", "ingreso_obstetrico"],
  },
  {
    id: "us-card-effusion-shock",
    title: "Ecocardiografia focal con derrame pericardico en paciente inestable",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "derrame_pericardico",
    difficulty: "advanced",
    clinicalSummary: "Paciente con hipotension, disnea y distension yugular en valoracion hemodinamica.",
    patientProfile: {
      name: "Luis P.",
      age: 58,
      sex: "male",
      chiefComplaint: "Disnea e hipotension",
      setting: "Shock room",
    },
  },
  {
    id: "us-card-effusion-trauma",
    title: "Ecocardiografia focal con derrame pericardico tras trauma toracico",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "hemopericardio_probable",
    difficulty: "advanced",
    clinicalSummary: "Trauma toracico contuso con deterioro hemodinamico y necesidad de ecografia focal urgente.",
    patientProfile: {
      name: "Daniel M.",
      age: 41,
      sex: "male",
      chiefComplaint: "Dolor toracico y mareo tras trauma",
      setting: "Sala de trauma",
    },
    tags: ["trauma_toracico", "eco_focal"],
  },
  {
    id: "us-card-effusion-uremia",
    title: "Ecocardiografia focal con derrame pericardico en paciente uremico",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "pericarditis_uremica",
    difficulty: "advanced",
    clinicalSummary: "Paciente en insuficiencia renal avanzada con disnea progresiva y dolor toracico atipico.",
    patientProfile: {
      name: "Cesar B.",
      age: 63,
      sex: "male",
      chiefComplaint: "Disnea y dolor toracico en contexto uremico",
      setting: "Urgencias de medicina interna",
    },
    tags: ["uremia", "pericarditis"],
  },
  {
    id: "us-card-effusion-oncologia",
    title: "Ecocardiografia focal con derrame pericardico en contexto oncologico",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "derrame_pericardico_neoplasico",
    difficulty: "advanced",
    clinicalSummary: "Paciente con antecedente de neoplasia y disnea progresiva en reevaluacion hemodinamica.",
    patientProfile: {
      name: "Ramon F.",
      age: 67,
      sex: "male",
      chiefComplaint: "Disnea progresiva en contexto oncologico",
      setting: "Hospitalizacion clinica",
    },
    tags: ["oncologia", "derrame_pericardico"],
  },
  {
    id: "us-card-effusion-postcirugia",
    title: "Ecocardiografia focal con derrame pericardico posquirurgico",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "derrame_pericardico_postoperatorio",
    difficulty: "advanced",
    clinicalSummary: "Paciente postquirurgico cardiovascular con hipotension y bajo gasto en control de urgencia.",
    patientProfile: {
      name: "Enrique T.",
      age: 60,
      sex: "male",
      chiefComplaint: "Hipotension en posoperatorio cardiaco",
      setting: "Unidad coronaria",
    },
    tags: ["postoperatorio", "cirugia_cardiaca"],
  },
  {
    id: "us-card-effusion-tuberculosis",
    title: "Ecocardiografia focal con derrame pericardico de probable origen inflamatorio",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "pericarditis_inflamatoria",
    difficulty: "advanced",
    clinicalSummary: "Paciente con cuadro subagudo, fiebre y disnea en estudio por serositis.",
    patientProfile: {
      name: "Mario C.",
      age: 45,
      sex: "male",
      chiefComplaint: "Disnea y fiebre de varios dias",
      setting: "Sala de observacion",
    },
    tags: ["inflamacion", "serositis"],
  },
  {
    id: "us-card-effusion-lupus",
    title: "Ecocardiografia focal con derrame pericardico en enfermedad autoinmune",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "pericarditis_autoinmune",
    difficulty: "advanced",
    clinicalSummary: "Paciente con enfermedad autoinmune, dolor toracico y taquicardia en reevaluacion.",
    patientProfile: {
      name: "Paula S.",
      age: 38,
      sex: "female",
      chiefComplaint: "Dolor toracico y disnea",
      setting: "Urgencias reumatologicas",
    },
    tags: ["autoinmune", "pericardio"],
  },
  {
    id: "us-card-effusion-sepsis",
    title: "Ecocardiografia focal con derrame pericardico en paciente septicemico",
    imagePreset: "cardiac_pericardial_effusion",
    subcategory: "derrame_pericardico_en_sepsis",
    difficulty: "advanced",
    clinicalSummary: "Paciente con sepsis y lactato elevado en evaluacion ecografica por deterioro circulatorio.",
    patientProfile: {
      name: "Jose L.",
      age: 54,
      sex: "male",
      chiefComplaint: "Hipotension refractaria en sepsis",
      setting: "Area critica",
    },
    tags: ["sepsis", "inestabilidad_hemodinamica"],
  },
  {
    id: "us-card-lowef-insuficiencia",
    title: "Ecocardiografia con fraccion de eyeccion reducida en insuficiencia cardiaca",
    imagePreset: "cardiac_low_ejection_fraction",
    subcategory: "fraccion_eyeccion_reducida",
    difficulty: "advanced",
    clinicalSummary: "Disnea, ortopnea y edema periferico en contexto de insuficiencia cardiaca descompensada.",
    patientProfile: {
      name: "Rosa T.",
      age: 69,
      sex: "female",
      chiefComplaint: "Disnea progresiva y ortopnea",
      setting: "Urgencias cardiovasculares",
    },
  },
  {
    id: "us-card-lowef-postiam",
    title: "Ecocardiografia con hipocinesia global tras infarto extenso",
    imagePreset: "cardiac_low_ejection_fraction",
    subcategory: "disfuncion_sistolica_post_infarto",
    difficulty: "advanced",
    clinicalSummary: "Paciente posinfarto con congestion pulmonar y bajo rendimiento al minimo esfuerzo.",
    patientProfile: {
      name: "Teresa N.",
      age: 72,
      sex: "female",
      chiefComplaint: "Disnea luego de infarto reciente",
      setting: "Unidad de cardiologia",
    },
    tags: ["post_infarto", "baja_eyeccion"],
  },
  {
    id: "us-card-lowef-dilatada",
    title: "Ecocardiografia con cavidad dilatada y contractilidad global disminuida",
    imagePreset: "cardiac_low_ejection_fraction",
    subcategory: "miocardiopatia_dilatada",
    difficulty: "advanced",
    clinicalSummary: "Fatiga de esfuerzo y edema en paciente con antecedente de miocardiopatia dilatada.",
    patientProfile: {
      name: "Sandra V.",
      age: 57,
      sex: "female",
      chiefComplaint: "Fatiga y edema progresivo",
      setting: "Consulta de falla cardiaca",
    },
    tags: ["miocardiopatia_dilatada", "falla_cardiaca"],
  },
  {
    id: "us-card-lowef-toxicidad",
    title: "Ecocardiografia con fraccion de eyeccion reducida en paciente con toxicidad miocardica",
    imagePreset: "cardiac_low_ejection_fraction",
    subcategory: "toxicidad_miocardica",
    difficulty: "advanced",
    clinicalSummary: "Paciente oncohematologico con disnea y sospecha de deterioro sistolico secundario a tratamiento.",
    patientProfile: {
      name: "Lucia H.",
      age: 49,
      sex: "female",
      chiefComplaint: "Disnea y cansancio tras quimioterapia",
      setting: "Hospital de dia",
    },
    tags: ["cardiotoxicidad", "quimioterapia"],
  },
  {
    id: "us-card-lowef-miocarditis",
    title: "Ecocardiografia con contractilidad deprimida en probable miocarditis",
    imagePreset: "cardiac_low_ejection_fraction",
    subcategory: "miocarditis_con_disfuncion",
    difficulty: "advanced",
    clinicalSummary: "Paciente joven con dolor toracico reciente y deterioro de la tolerancia al esfuerzo.",
    patientProfile: {
      name: "Kevin A.",
      age: 28,
      sex: "male",
      chiefComplaint: "Disnea y palpitaciones",
      setting: "Emergencia cardiologica",
    },
    tags: ["miocarditis", "joven"],
  },
  {
    id: "us-card-lowef-hipoperfusion",
    title: "Ecocardiografia con baja contractilidad en paciente hipoperfundido",
    imagePreset: "cardiac_low_ejection_fraction",
    subcategory: "disfuncion_sistolica_con_bajo_gasto",
    difficulty: "advanced",
    clinicalSummary: "Paciente con hipotension, piel fria y signos de bajo gasto en reevaluacion clinica.",
    patientProfile: {
      name: "Alberto G.",
      age: 64,
      sex: "male",
      chiefComplaint: "Mareo y frialdad distal",
      setting: "Area de monitorizacion",
    },
    tags: ["bajo_gasto", "hipoperfusion"],
  },
  {
    id: "us-card-lowef-valvular",
    title: "Ecocardiografia con baja fraccion de eyeccion en valvulopatia cronica",
    imagePreset: "cardiac_low_ejection_fraction",
    subcategory: "valvulopatia_con_disfuncion",
    difficulty: "advanced",
    clinicalSummary: "Paciente con soplo cronico y empeoramiento progresivo de disnea y edema.",
    patientProfile: {
      name: "Raquel M.",
      age: 66,
      sex: "female",
      chiefComplaint: "Disnea y edemas de progresion lenta",
      setting: "Consulta de cardiologia",
    },
    tags: ["valvulopatia", "disfuncion_sistolica"],
  },
  {
    id: "us-renal-hidronefrosis-colico",
    title: "Ecografia renal con hidronefrosis en colico nefritico",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis",
    difficulty: "intermediate",
    clinicalSummary: "Dolor en flanco y nauseas con sospecha de obstruccion urinaria.",
    patientProfile: {
      name: "Miguel D.",
      age: 47,
      sex: "male",
      chiefComplaint: "Dolor en flanco derecho",
      setting: "Urgencias generales",
    },
  },
  {
    id: "us-renal-hidronefrosis-litiasis",
    title: "Ecografia renal con hidronefrosis por probable litiasis ureteral",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_por_litiasis",
    difficulty: "intermediate",
    clinicalSummary: "Paciente con dolor colico, inquietud motora y hematuria microscopica.",
    patientProfile: {
      name: "Rene P.",
      age: 39,
      sex: "male",
      chiefComplaint: "Dolor colico irradiado a ingle",
      setting: "Area de observacion",
    },
    tags: ["litiasis", "colico_ureteral"],
  },
  {
    id: "us-renal-hidronefrosis-fiebre",
    title: "Ecografia renal con hidronefrosis en paciente febril",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_con_sospecha_infecciosa",
    difficulty: "advanced",
    clinicalSummary: "Paciente febril con dolor en flanco y escalofrios en estudio por obstruccion infectada.",
    patientProfile: {
      name: "Marcos Q.",
      age: 52,
      sex: "male",
      chiefComplaint: "Fiebre y dolor en flanco",
      setting: "Emergencia medica",
    },
    tags: ["obstruccion_infectada", "fiebre"],
  },
  {
    id: "us-renal-hidronefrosis-anuria",
    title: "Ecografia renal con dilatacion pielocalicial en anuria aguda",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_con_anuria",
    difficulty: "advanced",
    clinicalSummary: "Disminucion marcada del volumen urinario con dolor lumbar y deterioro de funcion renal.",
    patientProfile: {
      name: "Fabio L.",
      age: 61,
      sex: "male",
      chiefComplaint: "Anuria y dolor lumbar",
      setting: "Hospitalizacion clinica",
    },
    tags: ["anuria", "lesion_renal_aguda"],
  },
  {
    id: "us-renal-hidronefrosis-prostata",
    title: "Ecografia renal con hidronefrosis en obstruccion infravesical",
    imagePreset: "renal_hydronephrosis",
    subcategory: "uropatia_obstructiva_baja",
    difficulty: "advanced",
    clinicalSummary: "Paciente con sintomas urinarios bajos y empeoramiento progresivo de la creatinina.",
    patientProfile: {
      name: "Hector V.",
      age: 73,
      sex: "male",
      chiefComplaint: "Dificultad para orinar y dolor lumbar",
      setting: "Consulta urologica",
    },
    tags: ["obstruccion_infravesical", "urologia"],
  },
  {
    id: "us-renal-hidronefrosis-gestante",
    title: "Ecografia renal con hidronefrosis en gestante con dolor en flanco",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_gestacional_sintomatica",
    difficulty: "advanced",
    clinicalSummary: "Gestante del segundo trimestre con dolor en flanco y nauseas en estudio de uropatia obstructiva.",
    patientProfile: {
      name: "Andrea N.",
      age: 29,
      sex: "female",
      chiefComplaint: "Dolor en flanco durante el embarazo",
      gestationalAgeWeeks: 23,
      setting: "Urgencias obstetricas",
    },
    tags: ["embarazo", "uropatia_obstructiva"],
  },
  {
    id: "us-renal-hidronefrosis-hematuria",
    title: "Ecografia renal con hidronefrosis en paciente con hematuria",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_con_hematuria",
    difficulty: "intermediate",
    clinicalSummary: "Paciente con hematuria macroscopica y dolor lumbar en evaluacion inicial.",
    patientProfile: {
      name: "Guillermo T.",
      age: 46,
      sex: "male",
      chiefComplaint: "Hematuria y dolor lumbar",
      setting: "Consulta de urgencia",
    },
    tags: ["hematuria", "renal"],
  },
  {
    id: "us-renal-hidronefrosis-rinon-unico",
    title: "Ecografia renal con hidronefrosis en rinon unico funcional",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_en_rinon_unico",
    difficulty: "advanced",
    clinicalSummary: "Paciente con antecedente de nefrectomia y dolor lumbar en contexto de oliguria reciente.",
    patientProfile: {
      name: "Nestor G.",
      age: 58,
      sex: "male",
      chiefComplaint: "Oliguria y dolor lumbar en rinon unico",
      setting: "Observacion nefrologica",
    },
    tags: ["rinon_unico", "alto_riesgo_renal"],
  },
  {
    id: "us-renal-hidronefrosis-uti-recurrente",
    title: "Ecografia renal con hidronefrosis en infecciones urinarias recurrentes",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_y_uti_recurrente",
    difficulty: "intermediate",
    clinicalSummary: "Paciente con infecciones urinarias recurrentes y dolor en flanco de varias semanas.",
    patientProfile: {
      name: "Mireya S.",
      age: 43,
      sex: "female",
      chiefComplaint: "Dolor en flanco e infecciones recurrentes",
      setting: "Consulta externa",
    },
    tags: ["uti_recurrente", "obstruccion"],
  },
  {
    id: "us-renal-hidronefrosis-postrenal",
    title: "Ecografia renal con hidronefrosis en lesion renal postrenal",
    imagePreset: "renal_hydronephrosis",
    subcategory: "lesion_renal_aguda_postrenal",
    difficulty: "advanced",
    clinicalSummary: "Elevacion aguda de creatinina con dolor lumbar y disminucion del gasto urinario.",
    patientProfile: {
      name: "Victor C.",
      age: 65,
      sex: "male",
      chiefComplaint: "Oliguria y deterioro renal",
      setting: "Sala de medicina interna",
    },
    tags: ["postrenal", "creatinina_alta"],
  },
  {
    id: "us-renal-hidronefrosis-neoplasia",
    title: "Ecografia renal con hidronefrosis por compresion extrinseca",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_por_compresion",
    difficulty: "advanced",
    clinicalSummary: "Paciente con neoplasia pelvica y dolor lumbar en estudio de obstruccion urinaria.",
    patientProfile: {
      name: "Patricia H.",
      age: 59,
      sex: "female",
      chiefComplaint: "Dolor lumbar y disminucion del volumen urinario",
      setting: "Hospitalizacion oncologica",
    },
    tags: ["compresion_extrinseca", "oncologia"],
  },
  {
    id: "us-renal-hidronefrosis-doble-j",
    title: "Ecografia renal con persistencia de hidronefrosis a pesar de drenaje previo",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_persistente",
    difficulty: "advanced",
    clinicalSummary: "Paciente con antecedente de instrumentacion urologica y dolor persistente en flanco.",
    patientProfile: {
      name: "Oscar B.",
      age: 50,
      sex: "male",
      chiefComplaint: "Persistencia de dolor tras drenaje urinario",
      setting: "Reevaluacion urologica",
    },
    tags: ["drenaje_previo", "reevaluacion_urologica"],
  },
  {
    id: "us-renal-hidronefrosis-severa",
    title: "Ecografia renal con hidronefrosis marcada y dolor intenso",
    imagePreset: "renal_hydronephrosis",
    subcategory: "hidronefrosis_marcada",
    difficulty: "advanced",
    clinicalSummary: "Dolor severo y vomitos con necesidad de definir grado de compromiso obstructivo.",
    patientProfile: {
      name: "Leonardo J.",
      age: 37,
      sex: "male",
      chiefComplaint: "Dolor lumbar muy intenso",
      setting: "Urgencias",
    },
    tags: ["dolor_intenso", "compromiso_obstructivo"],
  },
  {
    id: "us-renal-hidronefrosis-seguimiento",
    title: "Ecografia renal de seguimiento con persistencia de dilatacion pielocalicial",
    imagePreset: "renal_hydronephrosis",
    subcategory: "seguimiento_hidronefrosis",
    difficulty: "intermediate",
    clinicalSummary: "Control ecografico luego de manejo inicial de una uropatia obstructiva dolorosa.",
    patientProfile: {
      name: "Julio A.",
      age: 44,
      sex: "male",
      chiefComplaint: "Control posterior a episodio obstructivo",
      setting: "Consulta de seguimiento",
    },
    tags: ["seguimiento", "evolucion"],
  },
  {
    id: "us-renal-hidronefrosis-recurrencia",
    title: "Ecografia renal con hidronefrosis en recurrencia obstructiva",
    imagePreset: "renal_hydronephrosis",
    subcategory: "recurrencia_uropatia_obstructiva",
    difficulty: "intermediate",
    clinicalSummary: "Paciente con antecedente de obstruccion urinaria previa que presenta nuevo dolor en flanco y nauseas.",
    patientProfile: {
      name: "Esteban M.",
      age: 42,
      sex: "male",
      chiefComplaint: "Nuevo episodio de dolor en flanco",
      setting: "Consulta de reingreso",
    },
    tags: ["recurrencia", "uropatia_obstructiva"],
  },
  {
    id: "us-abd-colico-biliar",
    title: "Ecografia vesicular con colelitiasis en colico biliar tipico",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis",
    difficulty: "basic",
    clinicalSummary: "Dolor en hipocondrio derecho tras comidas grasas con nauseas intermitentes.",
    patientProfile: {
      name: "Paola S.",
      age: 42,
      sex: "female",
      chiefComplaint: "Dolor postprandial en hipocondrio derecho",
      setting: "Consulta de abdomen agudo",
    },
  },
  {
    id: "us-abd-colico-recurrente",
    title: "Ecografia vesicular con colelitiasis en dolor biliar recurrente",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colico_biliar_recurrente",
    difficulty: "basic",
    clinicalSummary: "Episodios repetidos de dolor en hipocondrio derecho luego de comidas copiosas.",
    patientProfile: {
      name: "Miriam L.",
      age: 36,
      sex: "female",
      chiefComplaint: "Colicos biliares recurrentes",
      setting: "Consulta externa",
    },
    tags: ["colico_biliar", "recurrente"],
  },
  {
    id: "us-abd-colelitiasis-obesidad",
    title: "Ecografia vesicular con litiasis en paciente con factores metabolicos",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_con_factores_riesgo",
    difficulty: "basic",
    clinicalSummary: "Dolor biliar en paciente con obesidad y dislipidemia en evaluacion inicial.",
    patientProfile: {
      name: "Natalia C.",
      age: 45,
      sex: "female",
      chiefComplaint: "Dolor biliar y nauseas",
      setting: "Consulta de medicina general",
    },
    tags: ["factores_de_riesgo", "metabolico"],
  },
  {
    id: "us-abd-colelitiasis-postparto",
    title: "Ecografia vesicular con colelitiasis en puerpera reciente",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_postparto",
    difficulty: "intermediate",
    clinicalSummary: "Dolor en hipocondrio derecho durante el puerperio con intolerancia a comidas grasas.",
    patientProfile: {
      name: "Karen V.",
      age: 27,
      sex: "female",
      chiefComplaint: "Dolor biliar en puerperio",
      setting: "Consulta postparto",
    },
    tags: ["postparto", "dolor_biliar"],
  },
  {
    id: "us-abd-colelitiasis-jaundice",
    title: "Ecografia vesicular con litiasis en paciente con ictericia leve",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_con_ictericia",
    difficulty: "intermediate",
    clinicalSummary: "Dolor biliar con coluria e ictericia leve en evaluacion hepatobiliar inicial.",
    patientProfile: {
      name: "Ruben F.",
      age: 53,
      sex: "male",
      chiefComplaint: "Ictericia leve y dolor en hipocondrio derecho",
      setting: "Emergencia digestiva",
    },
    tags: ["ictericia", "hepatobiliar"],
  },
  {
    id: "us-abd-colelitiasis-diabetes",
    title: "Ecografia vesicular con colelitiasis en paciente diabetica",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_en_diabetes",
    difficulty: "intermediate",
    clinicalSummary: "Dolor biliar atipico con nausea en paciente diabetica de larga data.",
    patientProfile: {
      name: "Claudia T.",
      age: 58,
      sex: "female",
      chiefComplaint: "Molestia biliar y nauseas",
      setting: "Consulta de urgencia",
    },
    tags: ["diabetes", "riesgo_metabolico"],
  },
  {
    id: "us-abd-colelitiasis-pancreatitis",
    title: "Ecografia vesicular con litiasis en contexto compatible con origen biliar",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "litiasis_biliar_relacionada",
    difficulty: "intermediate",
    clinicalSummary: "Dolor epigastrico irradiado a dorso con antecedente reciente de colico biliar.",
    patientProfile: {
      name: "Samuel D.",
      age: 40,
      sex: "male",
      chiefComplaint: "Dolor epigastrico y vomitos",
      setting: "Observacion de abdomen agudo",
    },
    tags: ["origen_biliar", "pancreatobiliar"],
  },
  {
    id: "us-abd-colelitiasis-murphy",
    title: "Ecografia vesicular con litiasis y dolor localizado en punto cistico",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_sintomatica",
    difficulty: "basic",
    clinicalSummary: "Dolor focal en hipocondrio derecho y sensibilidad al examen fisico tras ingesta copiosa.",
    patientProfile: {
      name: "Belen M.",
      age: 33,
      sex: "female",
      chiefComplaint: "Dolor focal en hipocondrio derecho",
      setting: "Consulta quirurgica",
    },
    tags: ["murphy_clinico", "colelitiasis_sintomatica"],
  },
  {
    id: "us-abd-colelitiasis-adulto-mayor",
    title: "Ecografia vesicular con colelitiasis en adulto mayor",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_en_adulto_mayor",
    difficulty: "intermediate",
    clinicalSummary: "Paciente mayor con nauseas y dolor abdominal alto de instalacion progresiva.",
    patientProfile: {
      name: "Josefina Q.",
      age: 74,
      sex: "female",
      chiefComplaint: "Dolor abdominal alto y nauseas",
      setting: "Hospital del dia",
    },
    tags: ["adulto_mayor", "abdomen_alto"],
  },
  {
    id: "us-abd-colelitiasis-nocturna",
    title: "Ecografia vesicular con litiasis en dolor nocturno recurrente",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colico_biliar_nocturno",
    difficulty: "basic",
    clinicalSummary: "Episodios nocturnos de dolor biliar que despiertan al paciente varias veces por semana.",
    patientProfile: {
      name: "Ignacio H.",
      age: 38,
      sex: "male",
      chiefComplaint: "Dolor biliar nocturno",
      setting: "Consulta programada",
    },
    tags: ["dolor_nocturno", "repeticion"],
  },
  {
    id: "us-abd-colelitiasis-cirugia",
    title: "Ecografia vesicular con litiasis en valoracion prequirurgica",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_prequirurgica",
    difficulty: "intermediate",
    clinicalSummary: "Paciente remitido para planificacion quirurgica luego de multiples episodios de dolor biliar.",
    patientProfile: {
      name: "Patricia A.",
      age: 48,
      sex: "female",
      chiefComplaint: "Evaluacion prequirurgica por litiasis biliar",
      setting: "Consulta de cirugia",
    },
    tags: ["prequirurgico", "cirugia_general"],
  },
  {
    id: "us-abd-colelitiasis-embarazo",
    title: "Ecografia vesicular con litiasis en gestante con dolor biliar",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_en_gestacion",
    difficulty: "advanced",
    clinicalSummary: "Gestante del segundo trimestre con dolor en hipocondrio derecho y vomitos postprandiales.",
    patientProfile: {
      name: "Andrea P.",
      age: 30,
      sex: "female",
      chiefComplaint: "Dolor biliar durante el embarazo",
      gestationalAgeWeeks: 24,
      setting: "Emergencia obstetrica",
    },
    tags: ["embarazo", "vesicula"],
  },
  {
    id: "us-abd-colelitiasis-coluria",
    title: "Ecografia vesicular con litiasis en paciente con coluria",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_con_coluria",
    difficulty: "intermediate",
    clinicalSummary: "Dolor biliar con coluria y malestar general en estudio hepatobiliar.",
    patientProfile: {
      name: "Luisana G.",
      age: 44,
      sex: "female",
      chiefComplaint: "Coluria y dolor en hipocondrio derecho",
      setting: "Consulta de medicina interna",
    },
    tags: ["coluria", "hepatobiliar"],
  },
  {
    id: "us-abd-colelitiasis-ayuno",
    title: "Ecografia vesicular con litiasis en paciente tras ayuno prolongado",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "colelitiasis_en_ayuno_prolongado",
    difficulty: "intermediate",
    clinicalSummary: "Paciente con perdida de peso reciente y episodios de dolor biliar luego de reinicio alimentario.",
    patientProfile: {
      name: "Fernando R.",
      age: 41,
      sex: "male",
      chiefComplaint: "Dolor biliar tras cambios dieteticos",
      setting: "Consulta nutricional compartida",
    },
    tags: ["ayuno_prolongado", "perdida_peso"],
  },
  {
    id: "us-abd-colelitiasis-seguimiento",
    title: "Ecografia vesicular de seguimiento con persistencia de calculos",
    imagePreset: "biliary_cholelithiasis",
    subcategory: "seguimiento_colelitiasis",
    difficulty: "basic",
    clinicalSummary: "Control ecografico posterior a manejo inicial de dolor biliar ya conocido.",
    patientProfile: {
      name: "Veronica B.",
      age: 46,
      sex: "female",
      chiefComplaint: "Seguimiento de litiasis biliar",
      setting: "Consulta de seguimiento",
    },
    tags: ["seguimiento", "colelitiasis_conocida"],
  },
];

const BASE_ULTRASOUND_CASES: UltrasoundCase[] = [...ULTRASOUND_CASE_SEEDS, ...ULTRASOUND_TRAUMA_CASE_SEEDS].map(
  createBaseUltrasoundCase
);
const ULTRASOUND_LIBRARY_SIZE = Math.max(320, ADVANCED_MODULE_LIBRARY_SIZE);

const ULTRASOUND_CONTEXT_SUFFIXES = [
  "Control durante turno matutino",
  "Reevaluacion posterior a analgesia inicial",
  "Valoracion comparativa antes de la conducta definitiva",
  "Seguimiento durante observacion clinica",
  "Revaloracion focal con correlacion al examen fisico",
  "Revision breve antes de interconsulta especializada",
];

function buildUltrasoundVariant(baseCase: UltrasoundCase, variantIndex: number): UltrasoundCase {
  const patientProfile = {
    ...buildVariantPatient(baseCase.patientProfile, variantIndex),
    setting: `${baseCase.patientProfile.setting} · ${pickDeterministic(ULTRASOUND_CONTEXT_SUFFIXES, variantIndex)}`,
  };

  return {
    ...baseCase,
    id: buildVariantId(baseCase.id, variantIndex),
    title: buildVariantName(baseCase.title, variantIndex),
    clinicalSummary: buildVariantSentence(baseCase.clinicalSummary, variantIndex),
    patientProfile,
    highlightRegions: baseCase.highlightRegions.map((region, index) => ({
      ...region,
      x: boundedNumber(region.x, variantIndex + index, [-3, -2, -1, 0, 1, 2, 3], 8, 78, 0),
      y: boundedNumber(region.y, variantIndex + index + 1, [-3, -2, -1, 0, 1, 2, 3], 8, 78, 0),
    })),
    tags: Array.from(new Set([...baseCase.tags, pickDeterministic(["focal", "interpretacion", "ventana_ecografica"], variantIndex)])),
  };
}

export const ULTRASOUND_LIBRARY: UltrasoundCase[] = expandCaseLibrary(
  BASE_ULTRASOUND_CASES,
  ULTRASOUND_LIBRARY_SIZE,
  (baseCase, variantIndex) => buildUltrasoundVariant(baseCase, variantIndex)
);

export function ultrasoundCategoryLabel(category: UltrasoundCategory) {
  if (category === "obstetricia") return "Obstetrica";
  if (category === "cardiaca") return "Ecocardiografia";
  if (category === "renal") return "Renal";
  if (category === "trauma") return "FAST / E-FAST";
  return "Abdomen hepatobiliar";
}

export function ultrasoundContextLabel(context: UltrasoundContext) {
  if (context === "maternal") return "Materno-fetal";
  if (context === "cardiac") return "Cardiaco";
  if (context === "renal") return "Renal";
  if (context === "abdominal") return "Abdominal";
  if (context === "trauma") return "Trauma";
  return "General";
}

export function ultrasoundProbeLabel(probe: UltrasoundProbe) {
  if (probe === "lineal") return "Lineal";
  if (probe === "convex") return "Convexo";
  return "Sectorial";
}

export function inferUltrasoundContext(caseObject: any): UltrasoundContext {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.chief_complaint,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
    ].join(" ")
  );

  if (
    text.includes("trauma") ||
    text.includes("accidente") ||
    text.includes("colision") ||
    text.includes("politrauma") ||
    text.includes("atropell") ||
    text.includes("arma blanca") ||
    text.includes("herida") ||
    text.includes("caida")
  ) {
    return "trauma";
  }
  if (text.includes("embaraz") || text.includes("gesta") || text.includes("fetal") || text.includes("obstet")) return "maternal";
  if (text.includes("cardi") || text.includes("choque") || text.includes("shock") || text.includes("hipotens") || text.includes("ortopnea")) return "cardiac";
  if (text.includes("renal") || text.includes("flanco") || text.includes("hematur") || text.includes("colico")) return "renal";
  if (text.includes("abdomen") || text.includes("vesicula") || text.includes("biliar") || text.includes("hipocondrio")) return "abdominal";
  return "general";
}

export function evaluateUltrasoundCase(args: {
  caseSet: UltrasoundCase;
  selectedAnswer: string;
  justification: string;
}): UltrasoundInterpretationResult {
  const { caseSet, selectedAnswer, justification } = args;
  const answerScore = normalizeText(selectedAnswer) === normalizeText(caseSet.correctAnswer) ? 70 : 0;
  const justificationScore = keywordScore(justification, caseSet.keyFindings.concat(caseSet.tags), 30);
  const totalScore = answerScore + justificationScore;

  const outcome =
    totalScore >= 90
      ? "excellent"
      : totalScore >= 75
      ? "good"
      : totalScore >= 45
      ? "partial"
      : "needs_review";

  return {
    totalScore,
    rubric: {
      answer: answerScore,
      justification: justificationScore,
    },
    outcome,
    feedback: {
      answer:
        answerScore > 0
          ? "Interpretacion sonografica correcta."
          : `La respuesta correcta era: ${caseSet.correctAnswer}.`,
      justification:
        justificationScore >= 20
          ? "La justificacion integra hallazgos ecograficos relevantes."
          : `Menciona mejor hallazgos como: ${caseSet.keyFindings.join(", ")}.`,
      summary:
        outcome === "excellent"
          ? "Lectura ecografica precisa y bien conectada con el contexto clinico."
          : outcome === "good"
          ? "Buena interpretacion general; aun puedes refinar la descripcion de hallazgos."
          : outcome === "partial"
          ? "Reconoces parte del patron, pero necesitas mayor precision ecografica."
          : "Conviene reforzar anatomia basica, ventanas y correlacion clinica.",
    },
  };
}

export function ultrasoundDifficultyLabel(value: AdvancedDifficulty) {
  return advancedDifficultyLabel(value);
}
