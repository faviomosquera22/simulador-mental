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

export type ClinicalImageCategory =
  | "radiologia_torax"
  | "fracturas"
  | "dermatologia"
  | "ulceras"
  | "heridas"
  | "quemaduras"
  | "tiras_visuales";

export type ClinicalImageContext =
  | "respiratory"
  | "trauma"
  | "skin"
  | "wound"
  | "burn"
  | "screening"
  | "general";

export type ClinicalImagePreset =
  | "cxr_pneumonia"
  | "cxr_pulmonary_edema"
  | "cxr_pleural_effusion"
  | "cxr_pneumothorax"
  | "fracture_radius"
  | "fracture_clavicle"
  | "fracture_ankle"
  | "skin_zoster"
  | "skin_cellulitis"
  | "pressure_ulcer_stage_2"
  | "pressure_ulcer_stage_4"
  | "wound_infected"
  | "burn_partial"
  | "burn_deep"
  | "dipstick_uti"
  | "dipstick_ketosis";

export type ClinicalImageCase = {
  id: string;
  title: string;
  category: ClinicalImageCategory;
  subcategory: string;
  difficulty: AdvancedDifficulty;
  context: ClinicalImageContext;
  clinicalSummary: string;
  patientProfile: AdvancedPatientProfile;
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
  imagePreset: ClinicalImagePreset;
  questionStem: string;
  optionPool: string[];
  highlightRegions: Array<{ x: number; y: number; width: number; height: number; label: string }>;
};

export type ClinicalImageInterpretationResult = {
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

const BASE_CLINICAL_IMAGE_CASES: ClinicalImageCase[] = [
  {
    id: "img-cxr-pneumonia",
    title: "Radiografía de tórax con consolidación basal",
    category: "radiologia_torax",
    subcategory: "neumonia_lobar",
    difficulty: "basic",
    context: "respiratory",
    clinicalSummary: "Paciente con fiebre, tos productiva y crépitos en base derecha.",
    patientProfile: {
      name: "Carlos V.",
      age: 62,
      sex: "male",
      chiefComplaint: "Fiebre, tos y disnea leve",
      setting: "Urgencias respiratorias",
    },
    keyFindings: ["opacidad alveolar basal derecha", "broncofonía aumentada", "sin neumotórax"],
    correctAnswer: "Consolidación compatible con neumonía basal derecha",
    expectedOutcome: "Correlacionar con clínica infecciosa e iniciar conducta para neumonía.",
    distractors: ["Derrame pleural masivo", "Edema agudo pulmonar", "Radiografía sin hallazgos agudos"],
    feedback: {
      explanation: "La consolidación focal con clínica infecciosa orienta a neumonía adquirida en la comunidad.",
      expectedConduct: "Relacionar con signos infecciosos, priorizar antibiótico y seguimiento respiratorio.",
      highlightHint: "Busca una opacidad densa focal en base pulmonar derecha.",
    },
    tags: ["torax", "respiratorio", "infeccion", "rayos x"],
    modeCompatibility: "both",
    imagePreset: "cxr_pneumonia",
    questionStem: "¿Cuál es el hallazgo principal de la imagen?",
    optionPool: [
      "Consolidación compatible con neumonía basal derecha",
      "Derrame pleural masivo",
      "Edema agudo pulmonar",
      "Radiografía sin hallazgos agudos",
    ],
    highlightRegions: [{ x: 58, y: 58, width: 18, height: 18, label: "Consolidación focal" }],
  },
  {
    id: "img-cxr-edema",
    title: "Radiografía con patrón de edema pulmonar",
    category: "radiologia_torax",
    subcategory: "edema_agudo_pulmonar",
    difficulty: "intermediate",
    context: "respiratory",
    clinicalSummary: "Disnea súbita, ortopnea y crépitos bilaterales en contexto cardiovascular.",
    patientProfile: {
      name: "Rosa T.",
      age: 71,
      sex: "female",
      chiefComplaint: "Disnea progresiva y ortopnea",
      setting: "Sala de shock",
    },
    keyFindings: ["opacidades perihiliares bilaterales", "redistribución vascular", "patrón en alas de mariposa"],
    correctAnswer: "Patrón compatible con edema agudo pulmonar",
    expectedOutcome: "Relacionar con insuficiencia cardiaca aguda y priorizar soporte respiratorio.",
    distractors: ["Neumotórax izquierdo", "Consolidación lobar derecha", "Tórax sin alteraciones relevantes"],
    feedback: {
      explanation: "Las opacidades bilaterales centrales con clínica cardiovascular son típicas de edema pulmonar.",
      expectedConduct: "Correlacionar con hemodinamia y escalar manejo de insuficiencia cardiaca aguda.",
      highlightHint: "Observa infiltrados centrales simétricos y congestión vascular.",
    },
    tags: ["torax", "insuficiencia_cardiaca", "edema", "urgencias"],
    modeCompatibility: "both",
    imagePreset: "cxr_pulmonary_edema",
    questionStem: "¿Qué interpretación radiológica es la más probable?",
    optionPool: [
      "Patrón compatible con edema agudo pulmonar",
      "Neumotórax izquierdo",
      "Consolidación lobar derecha",
      "Tórax sin alteraciones relevantes",
    ],
    highlightRegions: [{ x: 33, y: 42, width: 34, height: 24, label: "Infiltrado alveolar bilateral" }],
  },
  {
    id: "img-cxr-effusion",
    title: "Radiografía con derrame pleural",
    category: "radiologia_torax",
    subcategory: "derrame_pleural",
    difficulty: "intermediate",
    context: "respiratory",
    clinicalSummary: "Dolor pleurítico y disminución del murmullo vesicular en base izquierda.",
    patientProfile: {
      name: "Elena M.",
      age: 55,
      sex: "female",
      chiefComplaint: "Disnea y dolor pleurítico",
      setting: "Hospitalización",
    },
    keyFindings: ["borramiento del seno costofrénico izquierdo", "menisco pleural", "atelectasia basal adyacente"],
    correctAnswer: "Derrame pleural izquierdo",
    expectedOutcome: "Correlacionar con etiología del derrame y definir conducta diagnóstica/terapéutica.",
    distractors: ["Neumonía bilateral", "Neumotórax a tensión", "Tórax normal"],
    feedback: {
      explanation: "El menisco y el borramiento del seno costofrénico son característicos de derrame pleural.",
      expectedConduct: "Definir causa probable, cuantía y necesidad de drenaje o estudio adicional.",
      highlightHint: "Fíjate en el seno costofrénico y el nivel ascendente del líquido.",
    },
    tags: ["torax", "pleura", "derrame", "disnea"],
    modeCompatibility: "both",
    imagePreset: "cxr_pleural_effusion",
    questionStem: "¿Qué hallazgo describe mejor la imagen?",
    optionPool: ["Derrame pleural izquierdo", "Neumonía bilateral", "Neumotórax a tensión", "Tórax normal"],
    highlightRegions: [{ x: 17, y: 67, width: 26, height: 16, label: "Líquido pleural" }],
  },
  {
    id: "img-cxr-pneumothorax",
    title: "Radiografía con neumotórax",
    category: "radiologia_torax",
    subcategory: "neumotorax",
    difficulty: "advanced",
    context: "respiratory",
    clinicalSummary: "Dolor torácico súbito y disminución marcada del murmullo en hemitórax derecho.",
    patientProfile: {
      name: "Javier S.",
      age: 29,
      sex: "male",
      chiefComplaint: "Dolor torácico y disnea súbita",
      setting: "Emergencia",
    },
    keyFindings: ["línea pleural visible", "ausencia de trama vascular periférica", "colapso pulmonar parcial"],
    correctAnswer: "Neumotórax derecho",
    expectedOutcome: "Valorar gravedad, correlacionar con clínica y definir descompresión si se deteriora.",
    distractors: ["Edema pulmonar", "Derrame pleural derecho", "Consolidación basal"],
    feedback: {
      explanation: "La ausencia de marcas vasculares periféricas con línea pleural define neumotórax.",
      expectedConduct: "Correlacionar con estabilidad hemodinámica y necesidad de drenaje urgente.",
      highlightHint: "Busca una línea pleural con hiperclaridad periférica sin trama vascular.",
    },
    tags: ["torax", "neumotorax", "trauma", "critico"],
    modeCompatibility: "both",
    imagePreset: "cxr_pneumothorax",
    questionStem: "¿Cuál es el hallazgo radiológico dominante?",
    optionPool: ["Neumotórax derecho", "Edema pulmonar", "Derrame pleural derecho", "Consolidación basal"],
    highlightRegions: [{ x: 67, y: 20, width: 18, height: 52, label: "Línea pleural" }],
  },
  {
    id: "img-fracture-radius",
    title: "Radiografía con fractura distal de radio",
    category: "fracturas",
    subcategory: "fractura_radio_distal",
    difficulty: "basic",
    context: "trauma",
    clinicalSummary: "Trauma por caída con dolor y deformidad en muñeca.",
    patientProfile: {
      name: "María P.",
      age: 41,
      sex: "female",
      chiefComplaint: "Dolor y limitación funcional en muñeca",
      setting: "Trauma menor",
    },
    keyFindings: ["trazo de fractura distal", "disrupción cortical", "edema local"],
    correctAnswer: "Fractura distal de radio",
    expectedOutcome: "Inmovilizar, controlar dolor y coordinar valoración traumatológica.",
    distractors: ["Luxación glenohumeral", "Fractura de clavícula", "Imagen ósea sin fractura"],
    feedback: {
      explanation: "La discontinuidad cortical en radio distal corresponde a fractura postraumática.",
      expectedConduct: "Inmovilización y derivación traumatológica según desplazamiento.",
      highlightHint: "Revisa la cortical del radio distal y la alineación del carpo.",
    },
    tags: ["trauma", "fractura", "miembro_superior", "radiografia"],
    modeCompatibility: "both",
    imagePreset: "fracture_radius",
    questionStem: "¿Cuál es la lesión más probable?",
    optionPool: ["Fractura distal de radio", "Luxación glenohumeral", "Fractura de clavícula", "Imagen ósea sin fractura"],
    highlightRegions: [{ x: 55, y: 63, width: 12, height: 12, label: "Trazo de fractura" }],
  },
  {
    id: "img-fracture-clavicle",
    title: "Radiografía con fractura de clavícula",
    category: "fracturas",
    subcategory: "fractura_clavicula",
    difficulty: "basic",
    context: "trauma",
    clinicalSummary: "Trauma sobre hombro con dolor localizado y limitación al mover el brazo.",
    patientProfile: {
      name: "Andrés C.",
      age: 23,
      sex: "male",
      chiefComplaint: "Dolor intenso en hombro tras caída",
      setting: "Consulta de trauma",
    },
    keyFindings: ["discontinuidad en clavícula media", "escalón óseo", "sin luxación evidente"],
    correctAnswer: "Fractura de clavícula media",
    expectedOutcome: "Analgesia, inmovilización y valoración de desplazamiento.",
    distractors: ["Luxación acromioclavicular aislada", "Fractura de escápula", "Hombro sin lesión ósea"],
    feedback: {
      explanation: "El trazo medio clavicular es típico tras caída sobre hombro o brazo extendido.",
      expectedConduct: "Valorar neurovascular, inmovilizar y revisar desplazamiento.",
      highlightHint: "Localiza el escalón en la porción media de la clavícula.",
    },
    tags: ["trauma", "clavicula", "fractura", "radiografia"],
    modeCompatibility: "both",
    imagePreset: "fracture_clavicle",
    questionStem: "¿Qué hallazgo traumático explica la imagen?",
    optionPool: ["Fractura de clavícula media", "Luxación acromioclavicular aislada", "Fractura de escápula", "Hombro sin lesión ósea"],
    highlightRegions: [{ x: 43, y: 20, width: 16, height: 10, label: "Fractura clavicular" }],
  },
  {
    id: "img-fracture-ankle",
    title: "Radiografía de tobillo con trazo maleolar",
    category: "fracturas",
    subcategory: "fractura_tobillo",
    difficulty: "intermediate",
    context: "trauma",
    clinicalSummary: "Esguince grave con incapacidad para apoyar tras mecanismo torsional.",
    patientProfile: {
      name: "Lucía D.",
      age: 36,
      sex: "female",
      chiefComplaint: "Dolor e impotencia funcional en tobillo",
      setting: "Sala de yesos",
    },
    keyFindings: ["trazo maleolar lateral", "edema perimaleolar", "alineación articular conservada"],
    correctAnswer: "Fractura maleolar lateral",
    expectedOutcome: "Inmovilizar y definir estabilidad del tobillo para conducta definitiva.",
    distractors: ["Solo esguince sin lesión ósea", "Luxación tibiotalar", "Fractura de calcáneo"],
    feedback: {
      explanation: "El trazo en maléolo lateral descarta un esguince simple.",
      expectedConduct: "Inmovilizar y valorar estabilidad ligamentaria/articular.",
      highlightHint: "Revisa el peroné distal y la cortical maleolar.",
    },
    tags: ["trauma", "tobillo", "fractura", "urgencias"],
    modeCompatibility: "both",
    imagePreset: "fracture_ankle",
    questionStem: "¿Cuál es la interpretación más precisa?",
    optionPool: ["Fractura maleolar lateral", "Solo esguince sin lesión ósea", "Luxación tibiotalar", "Fractura de calcáneo"],
    highlightRegions: [{ x: 56, y: 62, width: 10, height: 14, label: "Maleolo lateral" }],
  },
  {
    id: "img-skin-zoster",
    title: "Lesión vesicular en distribución dermatomal",
    category: "dermatologia",
    subcategory: "herpes_zoster",
    difficulty: "basic",
    context: "skin",
    clinicalSummary: "Dolor urente y rash vesicular unilateral.",
    patientProfile: {
      name: "Patricia Q.",
      age: 60,
      sex: "female",
      chiefComplaint: "Erupción dolorosa en hemitórax",
      setting: "Consulta externa",
    },
    keyFindings: ["vesículas agrupadas", "trayecto unilateral", "base eritematosa"],
    correctAnswer: "Lesión compatible con herpes zóster",
    expectedOutcome: "Correlacionar con tiempo de evolución y considerar antiviral/analgesia.",
    distractors: ["Celulitis extensa", "Quemadura química", "Dermatitis de contacto inespecífica"],
    feedback: {
      explanation: "La distribución dermatomal vesicular es muy sugerente de herpes zóster.",
      expectedConduct: "Valorar inicio temprano de antiviral y control del dolor.",
      highlightHint: "Busca agrupación de vesículas en un trayecto unilateral.",
    },
    tags: ["dermatologia", "vesiculas", "zoster", "piel"],
    modeCompatibility: "both",
    imagePreset: "skin_zoster",
    questionStem: "¿Qué diagnóstico visual es el más probable?",
    optionPool: ["Lesión compatible con herpes zóster", "Celulitis extensa", "Quemadura química", "Dermatitis de contacto inespecífica"],
    highlightRegions: [{ x: 38, y: 34, width: 24, height: 18, label: "Vesículas agrupadas" }],
  },
  {
    id: "img-skin-cellulitis",
    title: "Placa eritematosa con edema local",
    category: "dermatologia",
    subcategory: "celulitis",
    difficulty: "intermediate",
    context: "skin",
    clinicalSummary: "Dolor, calor local y aumento de volumen en pierna.",
    patientProfile: {
      name: "Sergio N.",
      age: 49,
      sex: "male",
      chiefComplaint: "Dolor y enrojecimiento progresivo en pierna",
      setting: "Urgencias ambulatorias",
    },
    keyFindings: ["placa eritematosa difusa", "bordes no netos", "edema y calor local"],
    correctAnswer: "Hallazgo compatible con celulitis",
    expectedOutcome: "Relacionar con signos infecciosos locales y conducta antibiótica según severidad.",
    distractors: ["Urticaria aislada", "Herpes zóster", "Quemadura de espesor parcial"],
    feedback: {
      explanation: "El eritema difuso doloroso con edema es compatible con celulitis bacteriana.",
      expectedConduct: "Valorar extensión, fiebre, comorbilidades y manejo antibiótico.",
      highlightHint: "Observa la placa eritematosa difusa con edema subyacente.",
    },
    tags: ["piel", "celulitis", "infeccion", "miembro_inferior"],
    modeCompatibility: "both",
    imagePreset: "skin_cellulitis",
    questionStem: "¿Qué interpretación clínica es la más probable?",
    optionPool: ["Hallazgo compatible con celulitis", "Urticaria aislada", "Herpes zóster", "Quemadura de espesor parcial"],
    highlightRegions: [{ x: 26, y: 36, width: 38, height: 34, label: "Eritema y edema" }],
  },
  {
    id: "img-ulcer-stage-2",
    title: "Úlcera por presión superficial",
    category: "ulceras",
    subcategory: "ulcera_presion_estadio_2",
    difficulty: "basic",
    context: "wound",
    clinicalSummary: "Paciente inmovilizado con pérdida parcial del grosor cutáneo.",
    patientProfile: {
      name: "Benjamín L.",
      age: 78,
      sex: "male",
      chiefComplaint: "Lesión sacra dolorosa",
      setting: "Hospitalización prolongada",
    },
    keyFindings: ["lecho rosado superficial", "pérdida parcial de piel", "sin exposición profunda"],
    correctAnswer: "Úlcera por presión estadio II",
    expectedOutcome: "Reforzar medidas preventivas, alivio de presión y cuidado local.",
    distractors: ["Úlcera por presión estadio IV", "Quemadura profunda", "Celulitis extensa"],
    feedback: {
      explanation: "La pérdida parcial de piel sin exposición profunda corresponde a estadio II.",
      expectedConduct: "Alivio de presión, cuidado local y reevaluación periódica.",
      highlightHint: "Identifica una pérdida superficial del espesor cutáneo.",
    },
    tags: ["ulcera", "presion", "sacra", "enfermeria"],
    modeCompatibility: "both",
    imagePreset: "pressure_ulcer_stage_2",
    questionStem: "¿Cómo clasificarías esta lesión?",
    optionPool: ["Úlcera por presión estadio II", "Úlcera por presión estadio IV", "Quemadura profunda", "Celulitis extensa"],
    highlightRegions: [{ x: 34, y: 42, width: 28, height: 20, label: "Lesión superficial" }],
  },
  {
    id: "img-ulcer-stage-4",
    title: "Úlcera por presión profunda con tejido desvitalizado",
    category: "ulceras",
    subcategory: "ulcera_presion_estadio_4",
    difficulty: "advanced",
    context: "wound",
    clinicalSummary: "Lesión profunda con exposición tisular y mal olor.",
    patientProfile: {
      name: "Nadia R.",
      age: 83,
      sex: "female",
      chiefComplaint: "Lesión profunda en región sacra",
      setting: "Cuidados crónicos",
    },
    keyFindings: ["profundidad marcada", "tejido necrótico", "compromiso de planos profundos"],
    correctAnswer: "Úlcera por presión estadio IV",
    expectedOutcome: "Escalar manejo avanzado de heridas y valorar infección/tejidos profundos.",
    distractors: ["Úlcera estadio II", "Quemadura superficial", "Maceración simple"],
    feedback: {
      explanation: "La profundidad con tejidos desvitalizados y exposición avanzada corresponde a estadio IV.",
      expectedConduct: "Manejo avanzado, control infeccioso y enfoque multidisciplinario.",
      highlightHint: "Busca profundidad, cavidad y tejido desvitalizado oscuro.",
    },
    tags: ["ulcera", "profunda", "tejido_desvitalizado", "heridas"],
    modeCompatibility: "both",
    imagePreset: "pressure_ulcer_stage_4",
    questionStem: "¿Qué estadio describe mejor la lesión?",
    optionPool: ["Úlcera por presión estadio IV", "Úlcera estadio II", "Quemadura superficial", "Maceración simple"],
    highlightRegions: [{ x: 31, y: 38, width: 34, height: 28, label: "Tejido profundo expuesto" }],
  },
  {
    id: "img-wound-infected",
    title: "Herida con signos de infección local",
    category: "heridas",
    subcategory: "herida_infectada",
    difficulty: "intermediate",
    context: "wound",
    clinicalSummary: "Herida con eritema perilesional, exudado y aumento de dolor.",
    patientProfile: {
      name: "Daniela H.",
      age: 44,
      sex: "female",
      chiefComplaint: "Dolor y exudado en herida postoperatoria",
      setting: "Control posquirúrgico",
    },
    keyFindings: ["eritema perilesional", "exudado purulento", "bordes inflamados"],
    correctAnswer: "Herida con infección local",
    expectedOutcome: "Notificar signos infecciosos, tomar conducta y reevaluar cuidados de la herida.",
    distractors: ["Cicatrización limpia normal", "Úlcera por presión estadio II", "Lesión por presión no infectada"],
    feedback: {
      explanation: "El exudado purulento y el eritema activo sugieren infección local de la herida.",
      expectedConduct: "Escalar valoración, registrar hallazgos y ajustar cuidados locales/sistémicos.",
      highlightHint: "Observa exudado, eritema y bordes inflamados.",
    },
    tags: ["herida", "infeccion", "postoperatorio", "enfermeria"],
    modeCompatibility: "both",
    imagePreset: "wound_infected",
    questionStem: "¿Qué hallazgo principal destacarías?",
    optionPool: ["Herida con infección local", "Cicatrización limpia normal", "Úlcera por presión estadio II", "Lesión por presión no infectada"],
    highlightRegions: [{ x: 32, y: 44, width: 32, height: 18, label: "Exudado e inflamación" }],
  },
  {
    id: "img-burn-partial",
    title: "Quemadura de espesor parcial superficial",
    category: "quemaduras",
    subcategory: "quemadura_parcial_superficial",
    difficulty: "basic",
    context: "burn",
    clinicalSummary: "Lesión dolorosa con flictenas y eritema tras contacto térmico.",
    patientProfile: {
      name: "Camila F.",
      age: 27,
      sex: "female",
      chiefComplaint: "Quemadura dolorosa en antebrazo",
      setting: "Consulta inmediata",
    },
    keyFindings: ["flictenas", "eritema brillante", "dolor conservado"],
    correctAnswer: "Quemadura de espesor parcial superficial",
    expectedOutcome: "Valorar superficie quemada, analgesia y cuidados locales.",
    distractors: ["Quemadura de espesor total", "Celulitis extensa", "Dermatitis de contacto"],
    feedback: {
      explanation: "La presencia de ampollas y dolor intenso corresponde a quemadura parcial superficial.",
      expectedConduct: "Manejo local, analgesia y cálculo de superficie si es necesario.",
      highlightHint: "Identifica ampollas y eritema en una lesión húmeda y dolorosa.",
    },
    tags: ["quemadura", "flictenas", "dolor", "piel"],
    modeCompatibility: "both",
    imagePreset: "burn_partial",
    questionStem: "¿Cómo clasificarías la quemadura?",
    optionPool: ["Quemadura de espesor parcial superficial", "Quemadura de espesor total", "Celulitis extensa", "Dermatitis de contacto"],
    highlightRegions: [{ x: 28, y: 34, width: 38, height: 26, label: "Ampollas y eritema" }],
  },
  {
    id: "img-burn-deep",
    title: "Quemadura profunda con palidez y áreas necróticas",
    category: "quemaduras",
    subcategory: "quemadura_profunda",
    difficulty: "advanced",
    context: "burn",
    clinicalSummary: "Quemadura extensa con menor dolor y zonas blanquecinas/escara.",
    patientProfile: {
      name: "Miguel G.",
      age: 38,
      sex: "male",
      chiefComplaint: "Quemadura extensa por llama",
      setting: "Emergencia de trauma",
    },
    keyFindings: ["zonas pálidas", "escara", "profundidad mayor", "dolor disminuido en áreas profundas"],
    correctAnswer: "Quemadura profunda de espesor parcial/total",
    expectedOutcome: "Reconocer gravedad, priorizar valoración de extensión y derivación especializada.",
    distractors: ["Quemadura solar leve", "Úlcera por presión", "Celulitis complicada"],
    feedback: {
      explanation: "La palidez y la escara orientan a una quemadura profunda con mayor riesgo funcional.",
      expectedConduct: "Evaluar extensión, reanimación si corresponde y derivación a unidad especializada.",
      highlightHint: "Busca áreas blanquecinas, secas y profundas.",
    },
    tags: ["quemadura", "profunda", "trauma", "critico"],
    modeCompatibility: "both",
    imagePreset: "burn_deep",
    questionStem: "¿Qué nivel de gravedad describe mejor la imagen?",
    optionPool: ["Quemadura profunda de espesor parcial/total", "Quemadura solar leve", "Úlcera por presión", "Celulitis complicada"],
    highlightRegions: [{ x: 22, y: 28, width: 46, height: 32, label: "Escara y palidez" }],
  },
  {
    id: "img-dipstick-uti",
    title: "Tira reactiva compatible con infección urinaria",
    category: "tiras_visuales",
    subcategory: "orina_infeccion",
    difficulty: "basic",
    context: "screening",
    clinicalSummary: "Disuria y polaquiuria con tirilla positiva.",
    patientProfile: {
      name: "Natalia B.",
      age: 32,
      sex: "female",
      chiefComplaint: "Disuria y urgencia urinaria",
      setting: "Consulta rápida",
    },
    keyFindings: ["leucocitos positivos", "nitritos positivos", "aspecto compatible con bacteriuria"],
    correctAnswer: "Tira reactiva sugestiva de infección urinaria",
    expectedOutcome: "Relacionar con síntomas urinarios y definir estudio/tratamiento según contexto.",
    distractors: ["Cetoacidosis diabética", "Deshidratación aislada", "Tira sin alteraciones"],
    feedback: {
      explanation: "La positividad de nitritos y leucocitos apoya infección urinaria baja.",
      expectedConduct: "Correlacionar con clínica y decidir si requiere tratamiento o estudio adicional.",
      highlightHint: "Observa los reactivos de nitritos y leucocitos con cambio de color.",
    },
    tags: ["tira_reactiva", "orina", "uti", "tamizaje"],
    modeCompatibility: "both",
    imagePreset: "dipstick_uti",
    questionStem: "¿Qué interpretación es la más coherente con la tira visual?",
    optionPool: ["Tira reactiva sugestiva de infección urinaria", "Cetoacidosis diabética", "Deshidratación aislada", "Tira sin alteraciones"],
    highlightRegions: [{ x: 32, y: 18, width: 18, height: 54, label: "Leucocitos y nitritos" }],
  },
  {
    id: "img-dipstick-ketosis",
    title: "Tira reactiva con glucosa y cetonas positivas",
    category: "tiras_visuales",
    subcategory: "cetonuria_glucosuria",
    difficulty: "intermediate",
    context: "screening",
    clinicalSummary: "Poliuria, polidipsia y malestar general con alteración metabólica probable.",
    patientProfile: {
      name: "Mauricio X.",
      age: 19,
      sex: "male",
      chiefComplaint: "Malestar, náusea y respiración profunda",
      setting: "Emergencia metabólica",
    },
    keyFindings: ["glucosuria", "cetonuria", "patrón compatible con descompensación diabética"],
    correctAnswer: "Hallazgo compatible con cetoacidosis o descompensación hiperglucémica",
    expectedOutcome: "Correlacionar con clínica y solicitar evaluación metabólica urgente.",
    distractors: ["Infección urinaria aislada", "Proteinuria leve", "Tira normal"],
    feedback: {
      explanation: "La combinación de glucosa y cetonas positivas obliga a pensar en descompensación diabética.",
      expectedConduct: "Escalar con glucemia, gasometría y valoración urgente.",
      highlightHint: "Identifica los reactivos de glucosa y cetonas fuertemente positivos.",
    },
    tags: ["tira_reactiva", "glucosa", "cetonas", "metabolico"],
    modeCompatibility: "both",
    imagePreset: "dipstick_ketosis",
    questionStem: "¿Qué conclusión clínica es la más probable?",
    optionPool: [
      "Hallazgo compatible con cetoacidosis o descompensación hiperglucémica",
      "Infección urinaria aislada",
      "Proteinuria leve",
      "Tira normal",
    ],
    highlightRegions: [{ x: 48, y: 18, width: 18, height: 54, label: "Glucosa y cetonas" }],
  },
];

const IMAGE_CONTEXT_SUFFIXES = [
  "con reevaluación clínica inmediata",
  "en valoración por médico y enfermería",
  "durante control evolutivo del turno",
  "con necesidad de correlación con signos y síntomas",
];

function buildImageVariant(baseCase: ClinicalImageCase, variantIndex: number) {
  const patientProfile = {
    ...buildVariantPatient(baseCase.patientProfile, variantIndex),
    chiefComplaint: buildVariantSentence(baseCase.patientProfile.chiefComplaint, variantIndex),
    setting: `${baseCase.patientProfile.setting} · ${pickDeterministic(IMAGE_CONTEXT_SUFFIXES, variantIndex)}`,
  };

  return {
    ...baseCase,
    id: buildVariantId(baseCase.id, variantIndex),
    title: buildVariantName(baseCase.title, variantIndex),
    clinicalSummary: buildVariantSentence(baseCase.clinicalSummary, variantIndex),
    patientProfile,
    highlightRegions: baseCase.highlightRegions.map((region, index) => ({
      ...region,
      x: boundedNumber(region.x, variantIndex + index, [-3, -2, -1, 0, 1, 2, 3], 6, 78, 0),
      y: boundedNumber(region.y, variantIndex + index + 1, [-3, -2, -1, 0, 1, 2, 3], 6, 78, 0),
    })),
    tags: Array.from(new Set([...baseCase.tags, pickDeterministic(["evaluacion", "practica", "interpretacion_visual"], variantIndex)])),
  };
}

export const CLINICAL_IMAGES_LIBRARY: ClinicalImageCase[] = expandCaseLibrary(
  BASE_CLINICAL_IMAGE_CASES,
  ADVANCED_MODULE_LIBRARY_SIZE,
  (baseCase, variantIndex) => buildImageVariant(baseCase, variantIndex)
);

export function clinicalImageCategoryLabel(category: ClinicalImageCategory) {
  if (category === "radiologia_torax") return "Radiología de tórax";
  if (category === "fracturas") return "Fracturas simples";
  if (category === "dermatologia") return "Dermatología";
  if (category === "ulceras") return "Úlceras por presión";
  if (category === "heridas") return "Heridas";
  if (category === "quemaduras") return "Quemaduras";
  return "Tiras visuales";
}

export function clinicalImageContextLabel(context: ClinicalImageContext) {
  if (context === "respiratory") return "Respiratorio";
  if (context === "trauma") return "Trauma";
  if (context === "skin") return "Piel";
  if (context === "wound") return "Heridas";
  if (context === "burn") return "Quemaduras";
  if (context === "screening") return "Tamizaje visual";
  return "General";
}

export function inferClinicalImageContext(caseObject: any): ClinicalImageContext {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.chief_complaint,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
    ].join(" ")
  );

  if (text.includes("tos") || text.includes("disnea") || text.includes("torac") || text.includes("respira")) return "respiratory";
  if (text.includes("caida") || text.includes("fractura") || text.includes("trauma")) return "trauma";
  if (text.includes("herida") || text.includes("ulcera") || text.includes("curacion")) return "wound";
  if (text.includes("quemadura") || text.includes("llama") || text.includes("calor")) return "burn";
  if (text.includes("rash") || text.includes("piel") || text.includes("vesicula")) return "skin";
  if (text.includes("orina") || text.includes("tamiz") || text.includes("ceton")) return "screening";
  return "general";
}

export function evaluateClinicalImageCase(args: {
  caseSet: ClinicalImageCase;
  selectedAnswer: string;
  justification: string;
}): ClinicalImageInterpretationResult {
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
          ? "Interpretación principal correcta."
          : `La respuesta correcta era: ${caseSet.correctAnswer}.`,
      justification:
        justificationScore >= 20
          ? "La justificación integra hallazgos visuales relevantes."
          : `Menciona mejor hallazgos como: ${caseSet.keyFindings.join(", ")}.`,
      summary:
        outcome === "excellent"
          ? "Lectura visual sólida y bien correlacionada con el contexto clínico."
          : outcome === "good"
          ? "Buena interpretación general; aún puedes hacer la justificación más precisa."
          : outcome === "partial"
          ? "Reconoces parte del hallazgo, pero todavía falta precisión diagnóstica."
          : "Necesitas reforzar identificación visual y correlación clínica básica.",
    },
  };
}

export function clinicalImageDifficultyLabel(value: AdvancedDifficulty) {
  return advancedDifficultyLabel(value);
}
