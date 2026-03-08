export type DxCategory =
  | "Ánimo"
  | "Ansiedad"
  | "Trauma"
  | "Psicóticos"
  | "Sustancias"
  | "Personalidad"
  | "Neurodesarrollo"
  | "Sueño";

export type DxAgeBand =
  | "niñez"
  | "adolescencia"
  | "adulto"
  | "adulto_mayor"
  | "transversal";

export type DxUrgency = "bajo" | "medio" | "alto";
export type DxDifficulty = "básico" | "intermedio" | "avanzado";

export type ClinicalDx = {
  id: string;
  name: string;
  category: DxCategory;
  keywords: string[];
  quick: {
    definition: string;
    typical: string;
  };
  dsm5: {
    core: string[];
    duration?: string;
    specifiers?: string[];
  };
  differentials: string[];
  redFlags: string[];
  questions: string[];
  initialCare: string[];
  meta: {
    ageBands: DxAgeBand[];
    urgency: DxUrgency;
    difficulty: DxDifficulty;
    severityHint: string;
    frequentEmergency: boolean;
    comorbidities: string[];
    recommendedScales: string[];
  };
  evaluation: {
    firstQuestions: string[];
    mustNotMiss: string[];
    ruleOut: string[];
    urgentReferral: string[];
  };
  plan: {
    goals24h72h: string[];
    nonPharmacological: string[];
    followupMarkers: string[];
  };
};

export const DX_CATEGORIES: DxCategory[] = [
  "Ánimo",
  "Ansiedad",
  "Trauma",
  "Psicóticos",
  "Sustancias",
  "Personalidad",
  "Neurodesarrollo",
  "Sueño",
];

export const DX_AGE_BANDS: DxAgeBand[] = [
  "niñez",
  "adolescencia",
  "adulto",
  "adulto_mayor",
  "transversal",
];

const CURATED_DX_LIBRARY: ClinicalDx[] = [
  {
    id: "mdd",
    name: "Trastorno depresivo mayor (TDM)",
    category: "Ánimo",
    keywords: ["depresión", "anhedonia", "tristeza", "mdd", "tdm"],
    quick: {
      definition:
        "Episodio de ánimo deprimido o anhedonia con impacto funcional y síntomas asociados.",
      typical:
        "Baja energía, alteraciones de sueño/apetito, culpa, enlentecimiento o agitación; puede haber ideación suicida.",
    },
    dsm5: {
      core: [
        ">=5 síntomas casi todos los días",
        "Incluye ánimo deprimido y/o anhedonia",
        "Deterioro funcional clínicamente significativo",
        "No atribuible a sustancias o condición médica",
      ],
      duration: ">=2 semanas",
      specifiers: ["con ansiedad", "melancólico", "atípico", "con síntomas psicóticos"],
    },
    differentials: [
      "Duelo vs TDM",
      "Trastorno bipolar",
      "Trastorno depresivo persistente",
      "Hipotiroidismo/anemia/causa médica",
    ],
    redFlags: [
      "Ideación o plan suicida",
      "Síntomas psicóticos",
      "Inhibición psicomotora grave o rechazo de ingesta",
    ],
    questions: [
      "¿Qué tanto disfrutas lo que antes te gustaba?",
      "¿Cómo están tu sueño y apetito?",
      "¿Te cuesta concentrarte o decidir?",
      "¿Has pensado en hacerte daño o en no querer vivir?",
    ],
    initialCare: [
      "Evaluar riesgo suicida estructurado",
      "Asegurar red de apoyo y plan de seguridad",
      "Psicoeducación + activación conductual inicial",
      "Derivar a evaluación especializada si gravedad moderada-alta",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto", "adulto_mayor"],
      urgency: "alto",
      difficulty: "intermedio",
      severityHint: "Leve a severo según deterioro funcional y riesgo.",
      frequentEmergency: true,
      comorbidities: ["ansiedad", "consumo de sustancias", "insomnio", "dolor crónico"],
      recommendedScales: ["PHQ-9", "BDI", "Hamilton Depresión", "Riesgo suicida estructurado"],
    },
    evaluation: {
      firstQuestions: [
        "Inicio y evolución temporal de síntomas",
        "Impacto funcional en estudio, trabajo y autocuidado",
        "Anhedonia, energía, culpa y cognición",
      ],
      mustNotMiss: [
        "Riesgo suicida actual y antecedentes de intento",
        "Síntomas psicóticos o catatónicos",
        "Historia de hipomanía/manía (descartar bipolaridad)",
      ],
      ruleOut: ["Trastorno bipolar", "hipotiroidismo", "consumo de sustancias", "medicación iatrogénica"],
      urgentReferral: [
        "Plan suicida activo",
        "psicosis",
        "incapacidad de autocuidado",
        "deterioro grave progresivo",
      ],
    },
    plan: {
      goals24h72h: [
        "Contener riesgo y estabilizar seguridad",
        "Definir red de apoyo y contacto de emergencia",
        "Iniciar plan terapéutico estructurado",
      ],
      nonPharmacological: [
        "Activación conductual básica",
        "Rutina de sueño",
        "estructura diaria mínima",
        "psicoeducación familiar",
      ],
      followupMarkers: [
        "Disminución de ideación suicida",
        "Mejora de sueño y energía",
        "retorno progresivo a actividades",
      ],
    },
  },
  {
    id: "gad",
    name: "Trastorno de ansiedad generalizada (TAG)",
    category: "Ansiedad",
    keywords: ["ansiedad", "preocupación", "nervios", "gad", "tag"],
    quick: {
      definition:
        "Preocupación excesiva y difícil de controlar sobre múltiples áreas, con síntomas somáticos/cognitivos.",
      typical:
        "Inquietud, fatigabilidad, tensión muscular, irritabilidad y alteración de sueño/concentración.",
    },
    dsm5: {
      core: [
        "Preocupación excesiva y persistente",
        "Difícil de controlar",
        "Asociado a síntomas físicos/cognitivos",
        "Deterioro funcional",
      ],
      duration: ">=6 meses",
    },
    differentials: [
      "Trastorno de pánico",
      "ansiedad social",
      "hipertiroidismo",
      "consumo de estimulantes",
    ],
    redFlags: ["Dolor torácico/síncope (descartar orgánico)", "uso intenso de sustancias", "desesperanza con riesgo"],
    questions: [
      "¿Cuánto tiempo ocupan tus preocupaciones al día?",
      "¿Qué tan difícil es parar esos pensamientos?",
      "¿Cómo afecta tu sueño y rendimiento diario?",
      "¿Qué síntomas corporales aparecen con más frecuencia?",
    ],
    initialCare: [
      "Psicoeducación sobre ciclo de ansiedad",
      "Respiración diafragmática y grounding",
      "Higiene de sueño y reducción de cafeína",
      "Derivar si comorbilidad o riesgo alto",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto", "adulto_mayor"],
      urgency: "medio",
      difficulty: "básico",
      severityHint: "Variable; aumenta con insomnio, evitación y deterioro ocupacional.",
      frequentEmergency: false,
      comorbidities: ["depresión", "insomnio", "somatización", "uso de benzodiacepinas"],
      recommendedScales: ["GAD-7", "Hamilton Ansiedad", "PHQ-9"],
    },
    evaluation: {
      firstQuestions: [
        "Disparadores y contenido dominante de preocupación",
        "Síntomas físicos y patrón de activación",
        "Impacto funcional y conductas de evitación",
      ],
      mustNotMiss: [
        "Insomnio severo",
        "uso de sustancias",
        "síntomas depresivos asociados",
      ],
      ruleOut: ["Hipertiroidismo", "consumo de estimulantes", "trastorno de pánico", "apnea del sueño"],
      urgentReferral: ["Crisis de ansiedad con riesgo médico", "ideación suicida", "deterioro funcional severo"],
    },
    plan: {
      goals24h72h: [
        "Disminuir activación fisiológica",
        "Establecer pautas de sueño y autocuidado",
        "Definir plan de seguimiento clínico",
      ],
      nonPharmacological: [
        "Respiración 4-6",
        "registro de preocupaciones",
        "exposición gradual a evitaciones leves",
      ],
      followupMarkers: ["Menor frecuencia de crisis", "mejor sueño", "reducción de evitación"],
    },
  },
  {
    id: "panic",
    name: "Trastorno de pánico",
    category: "Ansiedad",
    keywords: ["pánico", "ataque", "crisis", "panic"],
    quick: {
      definition:
        "Ataques de pánico recurrentes e inesperados con preocupación persistente por nuevos episodios.",
      typical:
        "Palpitaciones, disnea, temor intenso, sensación de muerte inminente y evitación secundaria.",
    },
    dsm5: {
      core: [
        "Ataques de pánico inesperados recurrentes",
        ">=1 mes de preocupación o cambio conductual",
        "No explicable por sustancias o condición médica",
      ],
    },
    differentials: ["Arritmias", "asma", "hipoglucemia", "TEPT", "ansiedad social"],
    redFlags: ["Primer episodio atípico con dolor torácico", "síncope", "uso de cocaína/anfetaminas"],
    questions: [
      "¿Qué síntomas aparecen primero y cuánto duran?",
      "¿Temes un nuevo ataque incluso cuando estás bien?",
      "¿Qué lugares empezaste a evitar por miedo?",
      "¿Hubo uso de sustancias antes de los episodios?",
    ],
    initialCare: [
      "Descartar causa médica en primer episodio atípico",
      "Psicoeducación sobre curva del pánico",
      "Entrenamiento breve de respiración y grounding",
      "Derivación para exposición interoceptiva/psicoterapia",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto"],
      urgency: "medio",
      difficulty: "intermedio",
      severityHint: "Aumenta con agorafobia, uso de urgencias repetido y evitación intensa.",
      frequentEmergency: true,
      comorbidities: ["agorafobia", "depresión", "consumo de ansiolíticos"],
      recommendedScales: ["Panic Disorder Severity Scale (educativa)", "GAD-7", "PHQ-9"],
    },
    evaluation: {
      firstQuestions: [
        "Fenomenología completa del ataque",
        "Contexto de aparición y patrón temporal",
        "Evitación/agorafobia secundaria",
      ],
      mustNotMiss: ["Causas cardiopulmonares", "uso de estimulantes", "riesgo suicida por desesperanza"],
      ruleOut: ["Arritmia", "hipertiroidismo", "consumo de sustancias", "TEPT"],
      urgentReferral: ["Compromiso respiratorio/cardiaco probable", "riesgo suicida alto"],
    },
    plan: {
      goals24h72h: ["Reducir miedo anticipatorio", "evitar sobreuso de urgencias", "iniciar psicoeducación estructurada"],
      nonPharmacological: ["Respiración lenta", "grounding", "exposición gradual supervisada"],
      followupMarkers: ["Menor frecuencia de ataques", "menor evitación", "mayor sensación de control"],
    },
  },
  {
    id: "ptsd",
    name: "Trastorno de estrés postraumático (TEPT)",
    category: "Trauma",
    keywords: ["tept", "trauma", "flashbacks", "pesadillas", "ptsd"],
    quick: {
      definition:
        "Síntomas intrusivos, evitación, cambios cognitivo-afectivos e hiperactivación tras evento traumático.",
      typical:
        "Pesadillas, recuerdos intrusivos, hipervigilancia, irritabilidad y evitación de estímulos asociados.",
    },
    dsm5: {
      core: [
        "Exposición a evento traumático",
        "Intrusiones",
        "Evitación",
        "Alteraciones de cognición/afecto",
        "Hiperactivación",
      ],
      duration: ">1 mes",
    },
    differentials: ["Trastorno de adaptación", "depresión mayor", "trastorno de pánico", "consumo de sustancias"],
    redFlags: ["Riesgo suicida", "disociación severa", "violencia en curso"],
    questions: [
      "¿Aparecen recuerdos intrusivos o pesadillas?",
      "¿Qué situaciones estás evitando desde el evento?",
      "¿Te sientes en alerta permanente?",
      "¿Actualmente sigues expuesto/a a peligro?",
    ],
    initialCare: [
      "Priorizar seguridad y estabilidad",
      "Evitar exposición narrativa intensa en fase aguda",
      "Grounding y regulación emocional inicial",
      "Derivación a abordaje focalizado en trauma",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto", "adulto_mayor"],
      urgency: "alto",
      difficulty: "intermedio",
      severityHint: "Mayor gravedad con disociación, riesgo autolesivo y trauma continuo.",
      frequentEmergency: true,
      comorbidities: ["depresión", "consumo", "insomnio", "dolor crónico"],
      recommendedScales: ["PCL-5 (educativa)", "PHQ-9", "GAD-7", "Riesgo suicida"],
    },
    evaluation: {
      firstQuestions: ["Tipo de trauma y temporalidad", "intrusiones/evitación", "impacto funcional y seguridad actual"],
      mustNotMiss: ["Riesgo suicida", "disociación", "violencia activa", "consumo descompensado"],
      ruleOut: ["Trastorno de adaptación", "TDM", "consumo de sustancias", "lesión neurológica"],
      urgentReferral: ["Peligro actual", "riesgo suicida", "desorganización severa", "violencia en curso"],
    },
    plan: {
      goals24h72h: ["Restituir seguridad", "reducir hiperactivación", "establecer soporte"],
      nonPharmacological: ["Grounding sensorial", "rutina de sueño", "plan de seguridad", "psicoeducación en trauma"],
      followupMarkers: ["Menos reactividad", "mejor sueño", "disminución de evitación extrema"],
    },
  },
  {
    id: "bipolar1",
    name: "Trastorno bipolar I (episodio maníaco)",
    category: "Ánimo",
    keywords: ["bipolar", "manía", "euforia", "bipolar1"],
    quick: {
      definition:
        "Episodio maníaco con ánimo elevado/irritable y aumento de energía, con deterioro marcado o psicosis.",
      typical:
        "Disminución de sueño, verborrea, grandiosidad, impulsividad y conductas de alto riesgo.",
    },
    dsm5: {
      core: [
        "Ánimo elevado/irritable + energía aumentada",
        "Síntomas de manía: grandiosidad, verborrea, distractibilidad, etc.",
        "Deterioro marcado, hospitalización o psicosis",
      ],
      duration: ">=1 semana (o cualquier duración si hospitalización)",
    },
    differentials: ["Consumo de estimulantes", "hipertiroidismo", "TDAH", "trastorno límite"],
    redFlags: ["Psicosis", "agitación severa", "falta total de sueño", "conductas de alto riesgo"],
    questions: [
      "¿Cuántas horas duermes y cómo te sientes al despertar?",
      "¿Hubo gastos impulsivos, conductas riesgosas o desinhibición marcada?",
      "¿Hablas más rápido o te sientes acelerado/a?",
      "¿Hay consumo de sustancias reciente?",
    ],
    initialCare: [
      "Evaluación urgente por psiquiatría",
      "Contención ambiental y reducción de estímulos",
      "Priorizar seguridad de paciente y terceros",
      "Coordinar red familiar si es seguro",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto"],
      urgency: "alto",
      difficulty: "avanzado",
      severityHint: "Riesgo elevado en presencia de psicosis, desorganización o impulsividad extrema.",
      frequentEmergency: true,
      comorbidities: ["consumo de sustancias", "ansiedad", "TDAH", "riesgo suicida"],
      recommendedScales: ["Young Mania Rating Scale (educativa)", "PHQ-9", "Riesgo suicida"],
    },
    evaluation: {
      firstQuestions: ["Patrón de sueño/energía", "conducta de riesgo", "funcionamiento reciente", "historia de episodios previos"],
      mustNotMiss: ["Psicosis", "agitación", "riesgo hetero/autoagresivo"],
      ruleOut: ["Estimulantes", "hipertiroidismo", "delirium", "trastorno por personalidad"],
      urgentReferral: ["Manía con psicosis", "riesgo para terceros", "incapacidad severa de autocuidado"],
    },
    plan: {
      goals24h72h: ["Contener riesgo", "restablecer sueño", "estabilizar conducta"],
      nonPharmacological: ["Ambiente de baja estimulación", "rutina estructurada", "soporte familiar"],
      followupMarkers: ["Reducción de impulsividad", "mejoría de sueño", "menor aceleración psicomotora"],
    },
  },
  {
    id: "psychosis",
    name: "Psicosis / espectro esquizofrenia (orientativo)",
    category: "Psicóticos",
    keywords: ["psicosis", "alucinaciones", "delirios", "esquizofrenia"],
    quick: {
      definition:
        "Síntomas psicóticos (delirios, alucinaciones o desorganización) con impacto funcional.",
      typical:
        "Voces, ideas delirantes, conducta extraña, retraimiento social y deterioro progresivo.",
    },
    dsm5: {
      core: [
        "Delirios y/o alucinaciones y/o lenguaje desorganizado",
        "Deterioro social/ocupacional",
        "Descartar sustancias/causa médica",
      ],
    },
    differentials: ["Bipolar con psicosis", "depresión psicótica", "delirium", "intoxicación/abstinencia"],
    redFlags: ["Alucinaciones de comando", "ideas de daño a terceros", "desorganización extrema"],
    questions: [
      "¿Escuchas voces o ves cosas que otros no perciben?",
      "¿Sientes que te vigilan o persiguen?",
      "¿Hay mensajes o señales dirigidas a ti?",
      "¿Consumo reciente de sustancias?",
    ],
    initialCare: [
      "Priorizar seguridad y contención",
      "Evaluación médica para descartar delirium/causa orgánica",
      "Derivación urgente a salud mental",
      "Involucrar cuidador/red si está disponible",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto"],
      urgency: "alto",
      difficulty: "avanzado",
      severityHint: "Alto riesgo cuando hay comandos imperativos, desorganización o amenaza de daño.",
      frequentEmergency: true,
      comorbidities: ["consumo de sustancias", "depresión", "ansiedad", "riesgo suicida"],
      recommendedScales: ["BPRS/PANSS abreviado (educativo)", "Riesgo suicida", "AUDIT/ASSIST"],
    },
    evaluation: {
      firstQuestions: ["Tipo de fenómeno psicótico", "inicio y curso", "impacto funcional y riesgo", "consumo asociado"],
      mustNotMiss: ["Comando alucinatorio", "riesgo de daño", "delirium", "catatonía"],
      ruleOut: ["Intoxicación", "abstinencia", "delirium", "bipolaridad", "neurológico"],
      urgentReferral: ["Riesgo heteroagresivo", "riesgo suicida alto", "desorganización grave"],
    },
    plan: {
      goals24h72h: ["Asegurar seguridad", "descartar orgánico", "iniciar ruta de manejo especializado"],
      nonPharmacological: ["Ambiente protegido", "comunicación simple", "psicoeducación familiar breve"],
      followupMarkers: ["Menor agitación", "mejor adherencia", "reducción de ideación delirante activa"],
    },
  },
  {
    id: "aud",
    name: "Trastorno por consumo de alcohol (AUD)",
    category: "Sustancias",
    keywords: ["alcohol", "consumo", "dependencia", "aud"],
    quick: {
      definition:
        "Patrón problemático de consumo con pérdida de control, deterioro funcional o síndrome de abstinencia/tolerancia.",
      typical:
        "Consumo creciente, craving, consecuencias sociales y laborales, abstinencia al reducir.",
    },
    dsm5: {
      core: [
        "Pérdida de control sobre consumo",
        "Deterioro social/ocupacional",
        "Uso riesgoso persistente",
        "Tolerancia y/o abstinencia",
      ],
    },
    differentials: ["Consumo de riesgo sin dependencia", "depresión con automedicación", "consumo de otras sustancias"],
    redFlags: ["Abstinencia severa", "riesgo suicida", "violencia asociada", "hepatopatía avanzada"],
    questions: [
      "¿Con qué frecuencia y cantidad consumes?",
      "¿Has intentado reducir y no has podido?",
      "¿Presentas temblor o ansiedad cuando no bebes?",
      "¿Qué consecuencias has tenido por el consumo?",
    ],
    initialCare: [
      "Tamizaje AUDIT-C/AUDIT",
      "Entrevista motivacional breve",
      "Plan de reducción o abstinencia con seguimiento",
      "Derivar si abstinencia complicada o comorbilidad severa",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto", "adulto_mayor"],
      urgency: "medio",
      difficulty: "intermedio",
      severityHint: "Escala según dependencia, abstinencia y daño biopsicosocial.",
      frequentEmergency: true,
      comorbidities: ["depresión", "ansiedad", "insomnio", "policonsumo"],
      recommendedScales: ["AUDIT", "ASSIST (simplificado)", "PHQ-9", "GAD-7"],
    },
    evaluation: {
      firstQuestions: ["Patrón de consumo", "craving", "síntomas de abstinencia", "consecuencias funcionales"],
      mustNotMiss: ["Abstinencia grave", "riesgo suicida", "violencia", "comorbilidad médica"],
      ruleOut: ["Trastorno del estado de ánimo primario", "uso de otras sustancias", "causa médica de síntomas"],
      urgentReferral: ["Delirium tremens", "convulsiones por abstinencia", "riesgo suicida alto"],
    },
    plan: {
      goals24h72h: ["Reducir riesgo inmediato", "definir meta de consumo", "activar soporte familiar/comunitario"],
      nonPharmacological: ["Entrevista motivacional", "plan de prevención de recaídas", "rutina de sueño"],
      followupMarkers: ["Días sin consumo", "disminución de craving", "mejora funcional"],
    },
  },
  {
    id: "insomnia",
    name: "Trastorno de insomnio",
    category: "Sueño",
    keywords: ["insomnio", "sueño", "despertar precoz", "no duermo"],
    quick: {
      definition:
        "Dificultad para iniciar o mantener el sueño con deterioro diurno significativo.",
      typical:
        "Fatiga, irritabilidad, bajo rendimiento y somnolencia diurna; frecuente comorbilidad ansioso-depresiva.",
    },
    dsm5: {
      core: [
        "Dificultad de inicio/mantenimiento o despertar precoz",
        "Malestar clínico o deterioro diurno",
        "Ocurre pese a oportunidad adecuada para dormir",
      ],
      duration: "Crónico: >=3 meses y >=3 noches/semana",
    },
    differentials: ["Apnea del sueño", "uso de cafeína/estimulantes", "depresión", "ansiedad", "síndrome de piernas inquietas"],
    redFlags: ["Somnolencia extrema", "pausas respiratorias nocturnas", "uso inadecuado de sedantes"],
    questions: [
      "¿Qué tipo de insomnio predomina: inicio, mantenimiento o despertar precoz?",
      "¿Qué hábitos tienes en las 2 horas previas al sueño?",
      "¿Consumo de cafeína/energizantes/alcohol por la tarde-noche?",
      "¿Ronquidos o pausas respiratorias observadas?",
    ],
    initialCare: [
      "Higiene del sueño estructurada",
      "Control de estímulos y horarios regulares",
      "Identificar comorbilidad psiquiátrica o médica",
      "Derivar a estudio de sueño si sospecha apnea",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto", "adulto_mayor"],
      urgency: "bajo",
      difficulty: "básico",
      severityHint: "Escala por duración, deterioro diurno y comorbilidad asociada.",
      frequentEmergency: false,
      comorbidities: ["ansiedad", "depresión", "consumo de alcohol", "dolor crónico"],
      recommendedScales: ["ISI (educativa)", "PHQ-9", "GAD-7"],
    },
    evaluation: {
      firstQuestions: ["Patrón de sueño semanal", "factores precipitantes", "impacto diurno"],
      mustNotMiss: ["Apnea probable", "uso problemático de hipnóticos", "síntomas afectivos relevantes"],
      ruleOut: ["Apnea", "hipertiroidismo", "consumo de sustancias", "depresión mayor"],
      urgentReferral: ["Riesgo de accidentes por somnolencia extrema", "síntomas neurológicos graves"],
    },
    plan: {
      goals24h72h: ["Regular ventana de sueño", "reducir factores perpetuadores", "mejorar funcionamiento diurno"],
      nonPharmacological: ["Higiene del sueño", "control de estímulos", "relajación progresiva"],
      followupMarkers: ["Menor latencia de sueño", "menos despertares", "mejor energía diurna"],
    },
  },
  {
    id: "bpd",
    name: "Trastorno límite de la personalidad (orientativo)",
    category: "Personalidad",
    keywords: ["tlp", "límite", "inestabilidad", "impulsividad", "bpd"],
    quick: {
      definition:
        "Patrón persistente de inestabilidad emocional, relacional e impulsividad con riesgo de autolesión.",
      typical:
        "Cambios afectivos intensos, miedo al abandono, conductas impulsivas y crisis interpersonales frecuentes.",
    },
    dsm5: {
      core: [
        "Inestabilidad interpersonal y afectiva",
        "Impulsividad en áreas de riesgo",
        "Alteración de identidad",
        "Conducta o amenazas autolesivas recurrentes",
      ],
    },
    differentials: ["Bipolaridad", "TEPT complejo", "consumo de sustancias", "trastorno histriónico"],
    redFlags: ["Autolesión reciente", "impulsividad grave", "crisis suicida interpersonal"],
    questions: [
      "¿Cómo cambian tus emociones en situaciones de conflicto?",
      "¿Qué ocurre cuando temes que alguien te abandone?",
      "¿Has tenido conductas impulsivas que luego lamentas?",
      "¿Ha habido autolesión o ideación suicida reciente?",
    ],
    initialCare: [
      "Evaluar seguridad y riesgo autolesivo",
      "Validación emocional y límites terapéuticos claros",
      "Plan de crisis y red de apoyo",
      "Derivación a psicoterapia estructurada",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto"],
      urgency: "alto",
      difficulty: "avanzado",
      severityHint: "Aumenta con autolesión, impulsividad severa y relaciones altamente desorganizadas.",
      frequentEmergency: true,
      comorbidities: ["depresión", "consumo", "TEPT", "trastornos alimentarios"],
      recommendedScales: ["MSI-BPD (educativa)", "Riesgo suicida", "PHQ-9"],
    },
    evaluation: {
      firstQuestions: ["Patrón relacional", "regulación emocional", "impulsividad", "riesgo autolesivo"],
      mustNotMiss: ["Autolesión", "riesgo suicida agudo", "consumo comórbido"],
      ruleOut: ["Bipolaridad", "psicosis primaria", "intoxicación aguda"],
      urgentReferral: ["Riesgo suicida alto", "autolesión activa", "desorganización conductual grave"],
    },
    plan: {
      goals24h72h: ["Reducir riesgo", "estabilizar crisis", "definir plan de seguimiento"],
      nonPharmacological: ["Técnicas de regulación emocional", "plan de crisis escrito", "psicoeducación a red"],
      followupMarkers: ["Menor impulsividad", "menos crisis interpersonales", "adherencia al plan"],
    },
  },
  {
    id: "adhd-child",
    name: "TDAH en niñez/adolescencia (tamizaje clínico)",
    category: "Neurodesarrollo",
    keywords: ["tdah", "inatención", "hiperactividad", "impulsividad", "niñez"],
    quick: {
      definition:
        "Patrón persistente de inatención y/o hiperactividad-impulsividad con impacto académico y social.",
      typical:
        "Distracción frecuente, dificultad para sostener tareas, inquietud motora e impulsividad contextual.",
    },
    dsm5: {
      core: [
        "Síntomas en >=2 contextos",
        "Inicio en etapa de desarrollo",
        "Deterioro funcional significativo",
      ],
      duration: "Persistente, no episódico",
    },
    differentials: ["Trastorno de ansiedad", "depresión", "trastorno del sueño", "dificultad de aprendizaje"],
    redFlags: ["Fracaso escolar marcado", "conducta de riesgo", "autolesión en adolescencia", "violencia intrafamiliar"],
    questions: [
      "¿Cómo es el rendimiento en casa y escuela?",
      "¿Los síntomas son constantes o situacionales?",
      "¿Hay problemas de sueño o aprendizaje asociados?",
      "¿Qué reportan docentes y cuidadores?",
    ],
    initialCare: [
      "Recolectar información multimodal (niño + cuidador + escuela)",
      "Psicoeducación familiar inicial",
      "Intervenciones conductuales y organizacionales",
      "Derivar para evaluación neuropsicológica si es necesario",
    ],
    meta: {
      ageBands: ["niñez", "adolescencia"],
      urgency: "medio",
      difficulty: "intermedio",
      severityHint: "Mayor severidad con impacto académico, conducta disruptiva y comorbilidad emocional.",
      frequentEmergency: false,
      comorbidities: ["trastorno oposicionista", "ansiedad", "trastornos del aprendizaje", "trastorno del sueño"],
      recommendedScales: ["Conners (educativa)", "SNAP-IV (educativa)", "PHQ-A si adolescencia"],
    },
    evaluation: {
      firstQuestions: ["Síntomas nucleares por contexto", "inicio y persistencia", "impacto funcional"],
      mustNotMiss: ["Dificultad de aprendizaje", "ansiedad/depresión comórbida", "dinámica familiar"],
      ruleOut: ["Privación de sueño", "ansiedad primaria", "trastorno del ánimo", "problemas sensoriales"],
      urgentReferral: ["Riesgo autolesivo", "conducta violenta grave", "abandono escolar inminente"],
    },
    plan: {
      goals24h72h: ["Alinear objetivos con cuidadores", "reducir interferencia académica inicial", "organizar seguimiento escolar"],
      nonPharmacological: ["Rutinas y refuerzo positivo", "higiene de sueño", "psicoeducación familiar"],
      followupMarkers: ["Mejoría en tareas", "menor impulsividad", "mejor comunicación familia-escuela"],
    },
  },
  {
    id: "asd-level1",
    name: "TEA nivel 1 (orientativo en entrevista)",
    category: "Neurodesarrollo",
    keywords: ["tea", "autismo", "socialización", "rigidez", "neurodesarrollo"],
    quick: {
      definition:
        "Dificultades persistentes en comunicación social y patrones restrictivos/repetitivos de conducta.",
      typical:
        "Interacción social atípica, intereses restringidos, rigidez conductual y sensibilidad sensorial.",
    },
    dsm5: {
      core: [
        "Déficits en comunicación e interacción social",
        "Patrones restrictivos/repetitivos",
        "Inicio en periodo del desarrollo",
      ],
    },
    differentials: ["Trastorno de comunicación social", "ansiedad social", "TDAH", "discapacidad intelectual"],
    redFlags: ["Regresión del desarrollo", "aislamiento extremo", "autoagresión"],
    questions: [
      "¿Cómo es la interacción con pares y adultos?",
      "¿Hay intereses muy restringidos o rutinas rígidas?",
      "¿Qué dificultades sensoriales se observan?",
      "¿Hubo regresión o cambios bruscos del desarrollo?",
    ],
    initialCare: [
      "Recoger historia evolutiva detallada",
      "Entrevista con cuidadores y contexto escolar",
      "Orientar a evaluación interdisciplinaria",
      "Plan de apoyos en comunicación y adaptación sensorial",
    ],
    meta: {
      ageBands: ["niñez", "adolescencia"],
      urgency: "medio",
      difficulty: "avanzado",
      severityHint: "Escala con deterioro adaptativo, comorbilidad conductual y recursos de apoyo disponibles.",
      frequentEmergency: false,
      comorbidities: ["TDAH", "ansiedad", "trastornos del sueño", "dificultades sensoriales"],
      recommendedScales: ["M-CHAT (tamizaje inicial)", "SRS (educativa)", "evaluación del desarrollo"],
    },
    evaluation: {
      firstQuestions: ["Historia del desarrollo", "comunicación social", "patrones repetitivos", "funcionamiento adaptativo"],
      mustNotMiss: ["Regresión", "autoagresión", "sobrecarga sensorial severa"],
      ruleOut: ["Hipoacusia", "trastorno de lenguaje primario", "ansiedad social aislada"],
      urgentReferral: ["Riesgo de daño", "desregulación grave", "pérdida funcional acelerada"],
    },
    plan: {
      goals24h72h: ["Organizar ruta diagnóstica", "reducir estrés familiar", "definir apoyos iniciales"],
      nonPharmacological: ["Ajustes ambientales", "estructura visual", "psicoeducación a cuidadores"],
      followupMarkers: ["Mejor regulación conductual", "mayor adaptación escolar", "mejor comunicación funcional"],
    },
  },
  {
    id: "ocd",
    name: "Trastorno obsesivo-compulsivo (TOC)",
    category: "Ansiedad",
    keywords: ["toc", "obsesiones", "compulsiones", "rituales"],
    quick: {
      definition:
        "Presencia de obsesiones y/o compulsiones que consumen tiempo y generan deterioro clínico.",
      typical:
        "Pensamientos intrusivos no deseados y rituales repetitivos para reducir ansiedad.",
    },
    dsm5: {
      core: [
        "Obsesiones y/o compulsiones",
        "Consumen tiempo significativo o deterioran función",
        "No atribuible a sustancias/otra condición",
      ],
    },
    differentials: ["Trastorno de ansiedad generalizada", "trastorno de personalidad obsesivo-compulsiva", "psicosis"],
    redFlags: ["Rituales extremos con deterioro severo", "riesgo suicida por desesperanza", "compulsiones peligrosas"],
    questions: [
      "¿Qué pensamientos intrusivos aparecen y con qué frecuencia?",
      "¿Qué rituales realizas para aliviar ansiedad?",
      "¿Cuánto tiempo al día ocupan estas conductas?",
      "¿Qué áreas de tu vida se han afectado más?",
    ],
    initialCare: [
      "Psicoeducación sobre ciclo obsesión-compulsión",
      "Evaluar deterioro funcional y riesgo",
      "Derivación para terapia de exposición con prevención de respuesta",
      "Plan de apoyo familiar",
    ],
    meta: {
      ageBands: ["adolescencia", "adulto"],
      urgency: "medio",
      difficulty: "intermedio",
      severityHint: "Más severo cuando consume gran parte del día y compromete autocuidado/función.",
      frequentEmergency: false,
      comorbidities: ["depresión", "ansiedad social", "tics", "insomnio"],
      recommendedScales: ["Y-BOCS (educativa)", "PHQ-9", "GAD-7"],
    },
    evaluation: {
      firstQuestions: ["Tipo de obsesiones", "tipo de compulsiones", "tiempo invertido", "evitación asociada"],
      mustNotMiss: ["Riesgo suicida", "compulsiones de riesgo físico", "síntomas psicóticos"],
      ruleOut: ["Psicosis", "trastorno de personalidad obsesiva", "ansiedad generalizada"],
      urgentReferral: ["Deterioro extremo", "riesgo suicida alto", "compulsiones peligrosas"],
    },
    plan: {
      goals24h72h: ["Reducir ansiedad aguda", "iniciar comprensión del ciclo TOC", "establecer plan terapéutico"],
      nonPharmacological: ["Psicoeducación", "microexposición gradual supervisada", "rutina de regulación"],
      followupMarkers: ["Menor tiempo en rituales", "mejor funcionamiento diario", "menor evitación"],
    },
  },
];

type DxSeed = {
  id: string;
  name: string;
  category: DxCategory;
  urgency: DxUrgency;
  difficulty: DxDifficulty;
  duration?: string;
  keywords?: string[];
  focus?: string;
  ageBands?: DxAgeBand[];
  frequentEmergency?: boolean;
  severityHint?: string;
  scales?: string[];
  comorbidities?: string[];
  differentials?: string[];
  redFlags?: string[];
};

const DEFAULT_AGE_BANDS_BY_CATEGORY: Record<DxCategory, DxAgeBand[]> = {
  Ánimo: ["adolescencia", "adulto", "adulto_mayor"],
  Ansiedad: ["adolescencia", "adulto", "adulto_mayor"],
  Trauma: ["adolescencia", "adulto", "adulto_mayor"],
  Psicóticos: ["adolescencia", "adulto"],
  Sustancias: ["adolescencia", "adulto", "adulto_mayor"],
  Personalidad: ["adolescencia", "adulto"],
  Neurodesarrollo: ["niñez", "adolescencia", "adulto"],
  Sueño: ["niñez", "adolescencia", "adulto", "adulto_mayor"],
};

const DEFAULT_DIFFERENTIALS_BY_CATEGORY: Record<DxCategory, string[]> = {
  Ánimo: ["Trastorno bipolar", "causa médica", "uso de sustancias", "trastorno de adaptación"],
  Ansiedad: ["Causa médica", "uso de sustancias", "trastorno del ánimo", "estrés agudo"],
  Trauma: ["TEPT", "trastorno de adaptación", "depresión", "consumo de sustancias"],
  Psicóticos: ["Bipolaridad con psicosis", "depresión psicótica", "delirium", "intoxicación"],
  Sustancias: ["Uso no problemático", "trastorno primario del ánimo", "psicosis primaria", "abstinencia"],
  Personalidad: ["Trastorno del ánimo", "TEPT complejo", "consumo de sustancias", "trastorno psicótico"],
  Neurodesarrollo: ["Ansiedad", "trastorno del ánimo", "dificultades de aprendizaje", "problemas del sueño"],
  Sueño: ["Ansiedad", "depresión", "apnea del sueño", "uso de sustancias"],
};

const DEFAULT_SCALES_BY_CATEGORY: Record<DxCategory, string[]> = {
  Ánimo: ["PHQ-9", "BDI", "Escala de riesgo suicida"],
  Ansiedad: ["GAD-7", "Hamilton Ansiedad", "PHQ-9"],
  Trauma: ["PCL-5 (educativa)", "PHQ-9", "Escala de riesgo suicida"],
  Psicóticos: ["BPRS/PANSS abreviado (educativo)", "Escala de riesgo suicida", "ASSIST"],
  Sustancias: ["AUDIT", "ASSIST", "PHQ-9"],
  Personalidad: ["Tamizaje de rasgos de personalidad (educativo)", "PHQ-9", "Escala de riesgo suicida"],
  Neurodesarrollo: ["Escalas de desarrollo (educativas)", "Conners/SNAP-IV", "tamizaje emocional"],
  Sueño: ["ISI (educativa)", "PSQI (educativa)", "PHQ-9"],
};

const DEFAULT_COMORBIDITIES_BY_CATEGORY: Record<DxCategory, string[]> = {
  Ánimo: ["ansiedad", "insomnio", "consumo de sustancias"],
  Ansiedad: ["depresión", "insomnio", "somatización"],
  Trauma: ["ansiedad", "depresión", "consumo de sustancias"],
  Psicóticos: ["consumo de sustancias", "depresión", "riesgo suicida"],
  Sustancias: ["depresión", "ansiedad", "insomnio"],
  Personalidad: ["depresión", "ansiedad", "consumo de sustancias"],
  Neurodesarrollo: ["ansiedad", "dificultades académicas", "problemas de sueño"],
  Sueño: ["ansiedad", "depresión", "fatiga diurna"],
};

const DEFAULT_QUESTIONS_BY_CATEGORY: Record<DxCategory, string[]> = {
  Ánimo: [
    "¿Desde cuándo notas cambios emocionales persistentes?",
    "¿Qué impacto tiene en motivación, energía y funcionamiento diario?",
    "¿Cómo están sueño, apetito y concentración?",
    "¿Existe ideación de muerte o autolesión?",
  ],
  Ansiedad: [
    "¿Qué situaciones activan la ansiedad y con qué intensidad?",
    "¿Qué síntomas físicos aparecen durante la activación?",
    "¿Qué conductas de evitación se han instaurado?",
    "¿Cómo afecta el problema a tu estudio, trabajo y relaciones?",
  ],
  Trauma: [
    "¿Qué evento o contexto precipitó el cuadro actual?",
    "¿Hay recuerdos intrusivos, evitación o hipervigilancia?",
    "¿Existe exposición a peligro actual?",
    "¿Cómo impacta en sueño, seguridad y funcionalidad?",
  ],
  Psicóticos: [
    "¿Has percibido voces, ideas extrañas o señales dirigidas a ti?",
    "¿Cuándo inició la desorganización y cómo evolucionó?",
    "¿Hubo consumo de sustancias o condición médica reciente?",
    "¿Existe riesgo de daño a sí mismo/a o a terceros?",
  ],
  Sustancias: [
    "¿Cuál es el patrón de consumo y la sustancia principal?",
    "¿Qué consecuencias ha tenido en tu vida diaria?",
    "¿Presentas craving, tolerancia o abstinencia?",
    "¿Qué motivación tienes para reducir o suspender el consumo?",
  ],
  Personalidad: [
    "¿Qué patrones relacionales se repiten en diferentes contextos?",
    "¿Cómo regulas emociones intensas y conflictos interpersonales?",
    "¿Qué conductas impulsivas o de riesgo han ocurrido?",
    "¿Qué deterioro funcional observas en trabajo, estudio o familia?",
  ],
  Neurodesarrollo: [
    "¿Cómo fue el desarrollo temprano y el rendimiento académico/social?",
    "¿Los síntomas aparecen en más de un contexto?",
    "¿Qué reportan cuidadores, docentes u observadores cercanos?",
    "¿Qué fortalezas y apoyos están disponibles actualmente?",
  ],
  Sueño: [
    "¿Qué patrón de sueño presenta entre semana y fines de semana?",
    "¿Cómo afecta el problema al rendimiento diurno?",
    "¿Qué hábitos de sueño y consumo nocturno están presentes?",
    "¿Hay signos de apnea, parasomnia o riesgo de accidentes?",
  ],
};

const BASE_RED_FLAGS_BY_URGENCY: Record<DxUrgency, string[]> = {
  alto: [
    "Riesgo suicida o de auto/heteroagresión",
    "Desorganización severa o pérdida de juicio de realidad",
    "Deterioro funcional grave con incapacidad de autocuidado",
  ],
  medio: [
    "Deterioro funcional sostenido",
    "Escalada de consumo, impulsividad o aislamiento",
    "Comorbilidad médica o psiquiátrica no controlada",
  ],
  bajo: [
    "Persistencia de síntomas sin mejoría",
    "Interferencia progresiva en estudio/trabajo",
    "Falta de adherencia a recomendaciones básicas",
  ],
};

const EXTRA_DX_SEEDS: DxSeed[] = [
  {
    id: "dysthymia",
    name: "Trastorno depresivo persistente (distimia)",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "intermedio",
    duration: ">=2 años (>=1 en adolescencia)",
  },
  {
    id: "bipolar2",
    name: "Trastorno bipolar II",
    category: "Ánimo",
    urgency: "alto",
    difficulty: "avanzado",
  },
  {
    id: "cyclothymia",
    name: "Trastorno ciclotímico",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "intermedio",
    duration: ">=2 años",
  },
  {
    id: "dmdd",
    name: "Trastorno disruptivo de desregulación del estado de ánimo",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "pmdd",
    name: "Trastorno disfórico premenstrual",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "seasonal-depression",
    name: "Trastorno depresivo con patrón estacional",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "postpartum-depression",
    name: "Depresión posparto",
    category: "Ánimo",
    urgency: "alto",
    difficulty: "intermedio",
    frequentEmergency: true,
  },
  {
    id: "substance-induced-depression",
    name: "Trastorno depresivo inducido por sustancias",
    category: "Ánimo",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "depression-medical-condition",
    name: "Trastorno depresivo debido a condición médica",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "unspecified-depression",
    name: "Trastorno depresivo no especificado",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "básico",
  },
  {
    id: "recurrent-brief-depression",
    name: "Trastorno depresivo breve recurrente (orientativo)",
    category: "Ánimo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "mixed-features-depression",
    name: "Episodio depresivo con características mixtas",
    category: "Ánimo",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "social-anxiety",
    name: "Trastorno de ansiedad social",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "specific-phobia",
    name: "Fobia específica",
    category: "Ansiedad",
    urgency: "bajo",
    difficulty: "básico",
  },
  {
    id: "agoraphobia",
    name: "Agorafobia",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "separation-anxiety",
    name: "Trastorno de ansiedad por separación",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "selective-mutism",
    name: "Mutismo selectivo",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "illness-anxiety",
    name: "Trastorno de ansiedad por enfermedad",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "somatic-symptom-disorder",
    name: "Trastorno de síntomas somáticos",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "body-dysmorphic",
    name: "Trastorno dismórfico corporal",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "hoarding-disorder",
    name: "Trastorno de acumulación",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "trichotillomania",
    name: "Tricotilomanía",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "excoriation-disorder",
    name: "Trastorno de excoriación",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "acute-stress-disorder",
    name: "Trastorno de estrés agudo",
    category: "Ansiedad",
    urgency: "alto",
    difficulty: "intermedio",
    frequentEmergency: true,
  },
  {
    id: "emetophobia",
    name: "Fobia específica: miedo a vomitar (emetofobia)",
    category: "Ansiedad",
    urgency: "bajo",
    difficulty: "básico",
  },
  {
    id: "unspecified-anxiety",
    name: "Trastorno de ansiedad no especificado",
    category: "Ansiedad",
    urgency: "medio",
    difficulty: "básico",
  },
  {
    id: "adjustment-disorder",
    name: "Trastorno de adaptación (general)",
    category: "Trauma",
    urgency: "medio",
    difficulty: "básico",
  },
  {
    id: "adjustment-anxious",
    name: "Trastorno de adaptación con ansiedad",
    category: "Trauma",
    urgency: "medio",
    difficulty: "básico",
  },
  {
    id: "adjustment-depressed",
    name: "Trastorno de adaptación con estado de ánimo depresivo",
    category: "Trauma",
    urgency: "medio",
    difficulty: "básico",
  },
  {
    id: "adjustment-mixed",
    name: "Trastorno de adaptación mixto ansioso-depresivo",
    category: "Trauma",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "complex-trauma",
    name: "Trauma complejo (orientativo)",
    category: "Trauma",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "reactive-attachment",
    name: "Trastorno reactivo del apego",
    category: "Trauma",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "disinhibited-social-engagement",
    name: "Trastorno de relación social desinhibida",
    category: "Trauma",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "trauma-related-grief",
    name: "Duelo traumático persistente (orientativo)",
    category: "Trauma",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "schizophrenia",
    name: "Esquizofrenia",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "schizophreniform",
    name: "Trastorno esquizofreniforme",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "brief-psychotic",
    name: "Trastorno psicótico breve",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "schizoaffective",
    name: "Trastorno esquizoafectivo",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "delusional-disorder",
    name: "Trastorno delirante",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "substance-induced-psychosis",
    name: "Trastorno psicótico inducido por sustancias",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "medical-condition-psychosis",
    name: "Trastorno psicótico debido a condición médica",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "attenuated-psychosis",
    name: "Síndrome de psicosis atenuada (orientativo)",
    category: "Psicóticos",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "catatonia-mental",
    name: "Catatonía asociada a trastorno mental",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "catatonia-medical",
    name: "Catatonía por condición médica",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "postpartum-psychosis",
    name: "Psicosis posparto",
    category: "Psicóticos",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "shared-delusional",
    name: "Trastorno delirante compartido (orientativo)",
    category: "Psicóticos",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "cannabis-use",
    name: "Trastorno por consumo de cannabis",
    category: "Sustancias",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "stimulant-use",
    name: "Trastorno por consumo de estimulantes",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "opioid-use",
    name: "Trastorno por consumo de opioides",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "sedative-use",
    name: "Trastorno por consumo de sedantes/hipnóticos",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "tobacco-use",
    name: "Trastorno por consumo de tabaco",
    category: "Sustancias",
    urgency: "medio",
    difficulty: "básico",
  },
  {
    id: "hallucinogen-use",
    name: "Trastorno por consumo de alucinógenos",
    category: "Sustancias",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "inhalant-use",
    name: "Trastorno por consumo de inhalantes",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "intermedio",
    frequentEmergency: true,
  },
  {
    id: "polysubstance-use",
    name: "Trastorno por consumo de múltiples sustancias",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "alcohol-withdrawal",
    name: "Síndrome de abstinencia alcohólica",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "opioid-withdrawal",
    name: "Síndrome de abstinencia a opioides",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "intermedio",
    frequentEmergency: true,
  },
  {
    id: "sedative-withdrawal",
    name: "Síndrome de abstinencia a sedantes",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "stimulant-intoxication",
    name: "Intoxicación por estimulantes",
    category: "Sustancias",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "gambling-disorder",
    name: "Trastorno por juego patológico",
    category: "Sustancias",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "gaming-disorder",
    name: "Trastorno por uso problemático de videojuegos",
    category: "Sustancias",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "antisocial-personality",
    name: "Trastorno de personalidad antisocial",
    category: "Personalidad",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "narcissistic-personality",
    name: "Trastorno de personalidad narcisista",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "avoidant-personality",
    name: "Trastorno de personalidad evitativa",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "dependent-personality",
    name: "Trastorno de personalidad dependiente",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "obsessive-compulsive-personality",
    name: "Trastorno de personalidad obsesivo-compulsiva",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "paranoid-personality",
    name: "Trastorno de personalidad paranoide",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "schizoid-personality",
    name: "Trastorno de personalidad esquizoide",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "schizotypal-personality",
    name: "Trastorno de personalidad esquizotípica",
    category: "Personalidad",
    urgency: "alto",
    difficulty: "avanzado",
    frequentEmergency: true,
  },
  {
    id: "histrionic-personality",
    name: "Trastorno de personalidad histriónica",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "unspecified-personality",
    name: "Trastorno de personalidad no especificado",
    category: "Personalidad",
    urgency: "medio",
    difficulty: "básico",
  },
  {
    id: "adhd-adult",
    name: "TDAH en adultez",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "intellectual-disability-mild",
    name: "Discapacidad intelectual leve",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "global-developmental-delay",
    name: "Retraso global del desarrollo",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "developmental-language-disorder",
    name: "Trastorno del desarrollo del lenguaje",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "social-communication-disorder",
    name: "Trastorno de la comunicación social (pragmática)",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "developmental-coordination-disorder",
    name: "Trastorno del desarrollo de la coordinación",
    category: "Neurodesarrollo",
    urgency: "bajo",
    difficulty: "intermedio",
  },
  {
    id: "specific-learning-reading",
    name: "Trastorno específico del aprendizaje con dificultad en lectura",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "specific-learning-writing",
    name: "Trastorno específico del aprendizaje con dificultad en expresión escrita",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "specific-learning-math",
    name: "Trastorno específico del aprendizaje con dificultad matemática",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "tourette-syndrome",
    name: "Síndrome de Tourette",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "persistent-motor-tic",
    name: "Trastorno de tics motores persistentes",
    category: "Neurodesarrollo",
    urgency: "bajo",
    difficulty: "básico",
  },
  {
    id: "stereotypic-movement-disorder",
    name: "Trastorno de movimientos estereotipados",
    category: "Neurodesarrollo",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "hypersomnolence-disorder",
    name: "Trastorno de hipersomnolencia",
    category: "Sueño",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "narcolepsy",
    name: "Narcolepsia",
    category: "Sueño",
    urgency: "medio",
    difficulty: "avanzado",
  },
  {
    id: "circadian-delayed-phase",
    name: "Trastorno del ritmo circadiano: fase de sueño retrasada",
    category: "Sueño",
    urgency: "bajo",
    difficulty: "intermedio",
  },
  {
    id: "shift-work-sleep-disorder",
    name: "Trastorno del sueño por trabajo en turnos",
    category: "Sueño",
    urgency: "medio",
    difficulty: "intermedio",
  },
  {
    id: "nightmare-disorder",
    name: "Trastorno de pesadillas",
    category: "Sueño",
    urgency: "bajo",
    difficulty: "básico",
  },
  {
    id: "sleep-terror-disorder",
    name: "Trastorno de terrores nocturnos",
    category: "Sueño",
    urgency: "medio",
    difficulty: "intermedio",
  },
];

function buildDxFromSeed(seed: DxSeed): ClinicalDx {
  const normalizedName = seed.name.toLowerCase();
  const focus = seed.focus ?? normalizedName;
  const generatedKeywords = seed.id
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  const keywords = Array.from(
    new Set([...(seed.keywords ?? []), ...generatedKeywords, seed.category.toLowerCase()])
  );

  const differentials = seed.differentials ?? DEFAULT_DIFFERENTIALS_BY_CATEGORY[seed.category];
  const redFlags = seed.redFlags ?? BASE_RED_FLAGS_BY_URGENCY[seed.urgency];
  const comorbidities = seed.comorbidities ?? DEFAULT_COMORBIDITIES_BY_CATEGORY[seed.category];
  const scales = seed.scales ?? DEFAULT_SCALES_BY_CATEGORY[seed.category];
  const questions = DEFAULT_QUESTIONS_BY_CATEGORY[seed.category];

  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    keywords,
    quick: {
      definition: `${seed.name} con impacto clínico en funcionamiento y bienestar psicosocial.`,
      typical: `Presentación orientativa centrada en ${focus}, con variación según contexto y comorbilidad.`,
    },
    dsm5: {
      core: [
        `Criterios clínicos orientativos compatibles con ${seed.name}`,
        "Deterioro funcional clínicamente significativo",
        "Valorar curso temporal, severidad y contexto",
        "Descartar causas médicas y/o sustancias cuando corresponda",
      ],
      duration: seed.duration,
    },
    differentials,
    redFlags,
    questions,
    initialCare: [
      "Evaluar seguridad y nivel de riesgo al inicio",
      "Priorizar estabilización, psicoeducación y objetivos inmediatos",
      "Explorar comorbilidades psiquiátricas/médicas relevantes",
      "Definir plan de seguimiento o derivación según severidad",
    ],
    meta: {
      ageBands: seed.ageBands ?? DEFAULT_AGE_BANDS_BY_CATEGORY[seed.category],
      urgency: seed.urgency,
      difficulty: seed.difficulty,
      severityHint:
        seed.severityHint ??
        `Resultado orientativo: la severidad de ${seed.name} depende del riesgo, deterioro funcional y comorbilidad.`,
      frequentEmergency: seed.frequentEmergency ?? seed.urgency === "alto",
      comorbidities,
      recommendedScales: scales,
    },
    evaluation: {
      firstQuestions: [
        `¿Cuándo iniciaron los síntomas compatibles con ${seed.name}?`,
        "¿Qué impacto tienen en autocuidado, trabajo/estudio y relaciones?",
        "¿Qué factores disparan, mantienen o alivian el cuadro?",
        "¿Qué cambios recientes hubo en sueño, consumo o salud médica?",
      ],
      mustNotMiss: [
        "Riesgo suicida y autolesivo",
        "Riesgo heteroagresivo o de negligencia grave",
        "Psicosis, confusión o desorganización conductual marcada",
      ],
      ruleOut: [
        ...differentials.slice(0, 3),
        "Causa médica o farmacológica no identificada",
      ],
      urgentReferral: [
        "Riesgo suicida alto o plan activo",
        "Riesgo para terceros o deterioro funcional severo",
        "Descompensación aguda sin soporte seguro",
      ],
    },
    plan: {
      goals24h72h: [
        "Reducir riesgo clínico inmediato",
        "Definir objetivos concretos de estabilización",
        "Asegurar continuidad terapéutica y red de apoyo",
      ],
      nonPharmacological: [
        "Psicoeducación breve centrada en el problema",
        "Rutinas de regulación (sueño, estructura diaria, autocuidado)",
        "Intervenciones de apoyo familiar/social según contexto",
      ],
      followupMarkers: [
        "Disminución de síntomas nucleares",
        "Mejoría funcional en actividades diarias",
        "Mayor adherencia y compromiso con el plan",
      ],
    },
  };
}

export const DX_LIBRARY: ClinicalDx[] = [
  ...CURATED_DX_LIBRARY,
  ...EXTRA_DX_SEEDS.map(buildDxFromSeed),
];
