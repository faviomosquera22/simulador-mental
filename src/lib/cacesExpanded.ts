import type {
  CacesDifficulty,
  CacesOptionId,
  CacesQuestion,
  CacesQuestionOption,
} from "./types";

type ExpansionUnit = {
  category: string;
  component: string;
  subcomponent: string;
  topic: string;
  scenario: string;
  correct: string;
  wrongs: [string, string, string];
  rationale: string;
  tags: string[];
  difficulties: [CacesDifficulty, CacesDifficulty, CacesDifficulty, CacesDifficulty];
};

function option(
  id: CacesOptionId,
  text: string,
  rationale: string
): CacesQuestionOption {
  return { id, text, rationale };
}

function options(
  a: CacesQuestionOption,
  b: CacesQuestionOption,
  c: CacesQuestionOption,
  d: CacesQuestionOption
): [
  CacesQuestionOption,
  CacesQuestionOption,
  CacesQuestionOption,
  CacesQuestionOption,
] {
  return [a, b, c, d];
}

function buildId(index: number) {
  return `caces-${String(59 + index).padStart(3, "0")}`;
}

function buildChoiceSet(
  correctText: string,
  wrongs: [string, string, string],
  correctLetter: CacesOptionId,
  rationale: string
) {
  const letters: CacesOptionId[] = ["A", "B", "C", "D"];
  const wrongQueue = [...wrongs];
  const mapped = letters.map((letter) => {
    if (letter === correctLetter) {
      return option(
        letter,
        correctText,
        rationale
      );
    }
    const txt = String(wrongQueue.shift() ?? "Alternativa incompleta.");
    return option(
      letter,
      txt,
      "No prioriza seguridad clínica, continuidad del cuidado y toma de decisiones basada en valoración."
    );
  }) as [
    CacesQuestionOption,
    CacesQuestionOption,
    CacesQuestionOption,
    CacesQuestionOption,
  ];

  return {
    options: options(mapped[0], mapped[1], mapped[2], mapped[3]),
    correctAnswer: correctLetter,
  };
}

const UNITS: ExpansionUnit[] = [
  {
    category: "Fundamentos del cuidado enfermero",
    component: "Fundamentos del cuidado enfermero",
    subcomponent: "Proceso de atención de enfermería",
    topic: "Priorización en PAE",
    scenario: "Paciente con múltiples problemas reporta dolor, ansiedad y dudas del plan terapéutico",
    correct: "Realizar valoración enfocada, priorizar diagnósticos enfermeros y planificar intervenciones medibles.",
    wrongs: [
      "Aplicar intervenciones aisladas sin diagnóstico enfermero.",
      "Esperar la ronda médica para iniciar el plan de cuidados.",
      "Registrar solo signos vitales y cerrar el turno.",
    ],
    rationale:
      "El PAE requiere secuencia clínica y priorización para asegurar cuidados seguros, individualizados y evaluables.",
    tags: ["PAE", "priorizacion", "fundamentos"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Fundamentos del cuidado enfermero",
    component: "Fundamentos del cuidado enfermero",
    subcomponent: "Bioseguridad",
    topic: "Aislamiento y control de infecciones",
    scenario: "Paciente en aislamiento por contacto requiere procedimiento de rutina",
    correct: "Aplicar medidas de barrera y técnica limpia/estéril según protocolo institucional vigente.",
    wrongs: [
      "Usar barreras solo si el paciente presenta fiebre activa.",
      "Compartir insumos entre pacientes para agilizar tiempos.",
      "Omitir higiene de manos si se usan guantes.",
    ],
    rationale:
      "El cumplimiento estricto de bioseguridad reduce infecciones asociadas a la atención y protege a pacientes y equipo.",
    tags: ["bioseguridad", "aislamiento", "seguridad"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Mujer, recién nacido, niño y adolescente",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Promoción en salud materno infantil",
    topic: "Lactancia materna y consejería",
    scenario: "Puérpera primeriza expresa dolor al amamantar y dudas sobre técnica",
    correct: "Brindar consejería práctica, evaluar agarre y reforzar señales de alimentación eficaz.",
    wrongs: [
      "Indicar suspensión temporal sin evaluación de técnica.",
      "Reemplazar de forma inmediata por fórmula como primera medida.",
      "Posponer educación hasta el control del mes.",
    ],
    rationale:
      "La consejería temprana basada en técnica y acompañamiento mejora adherencia y resultados materno infantiles.",
    tags: ["lactancia", "consejeria", "maternidad"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Mujer, recién nacido, niño y adolescente",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Protección de derechos",
    topic: "Detección de violencia en adolescencia",
    scenario: "Adolescente evita contacto visual y responde con monosílabos cuando está con su acompañante",
    correct: "Garantizar espacio privado, explorar riesgo de forma sensible y activar ruta institucional cuando corresponda.",
    wrongs: [
      "Mantener entrevista únicamente con el acompañante presente.",
      "No indagar factores psicosociales para evitar conflicto familiar.",
      "Derivar sin valoración inicial de seguridad.",
    ],
    rationale:
      "El tamizaje confidencial y la activación oportuna de rutas de protección son claves en población adolescente.",
    tags: ["adolescencia", "violencia", "proteccion"],
    difficulties: ["intermedia", "alta", "alta", "alta"],
  },
  {
    category: "Adulto y adulto mayor",
    component: "Adulto y adulto mayor",
    subcomponent: "Manejo del dolor",
    topic: "Revaloración analgésica",
    scenario: "Paciente adulto con dolor persistente tras medicación prescrita",
    correct: "Revalorar intensidad, funcionalidad e impacto, y ajustar plan en coordinación con el equipo.",
    wrongs: [
      "Asumir respuesta adecuada sin reevaluación clínica.",
      "Registrar el dolor solo al alta.",
      "Suspender medidas no farmacológicas por falta de tiempo.",
    ],
    rationale:
      "El dolor requiere evaluación continua para prevenir cronificación y optimizar confort y seguridad del paciente.",
    tags: ["dolor", "adulto", "reevaluacion"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Adulto y adulto mayor",
    component: "Adulto y adulto mayor",
    subcomponent: "Seguridad del paciente",
    topic: "Prevención de caídas intrahospitalarias",
    scenario: "Paciente con sedación nocturna y marcha inestable solicita deambular al baño",
    correct: "Implementar medidas personalizadas de prevención de caídas y supervisión segura.",
    wrongs: [
      "Limitar hidratación para reducir traslados nocturnos.",
      "Restringir completamente movilidad sin valoración funcional.",
      "Esperar un evento adverso para ajustar cuidados.",
    ],
    rationale:
      "La prevención de caídas es anticipatoria y requiere valoración de riesgo, entorno seguro y acompañamiento.",
    tags: ["caidas", "seguridad", "adulto_mayor"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
  {
    category: "Cuidado familiar, comunitario e intercultural",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Promoción y prevención",
    topic: "Estrategia comunitaria de vacunación",
    scenario: "Barrio con disminución de cobertura vacunal infantil en el último trimestre",
    correct: "Diseñar intervención territorial con educación, captación activa y seguimiento de rezagados.",
    wrongs: [
      "Esperar demanda espontánea sin acciones de campo.",
      "Aplicar campaña única sin monitoreo posterior.",
      "Enfocar acciones solo en difusión digital.",
    ],
    rationale:
      "La cobertura mejora con estrategias continuas, enfoque territorial y monitoreo de cumplimiento.",
    tags: ["comunitario", "vacunacion", "promocion"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Cuidado familiar, comunitario e intercultural",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Visita domiciliaria",
    topic: "Adherencia terapéutica familiar",
    scenario: "En visita domiciliaria se identifican errores de administración de fármacos por cuidador principal",
    correct: "Evaluar barreras, reeducar de forma práctica y acordar plan de seguimiento familiar.",
    wrongs: [
      "Corregir verbalmente sin verificar comprensión.",
      "Cambiar esquema terapéutico sin coordinación clínica.",
      "Cerrar visita sin plan de continuidad.",
    ],
    rationale:
      "La adherencia requiere educación personalizada, verificación de comprensión y continuidad del cuidado.",
    tags: ["visita_domiciliaria", "familia", "adherencia"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
  {
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Gestión de calidad",
    topic: "Indicadores asistenciales",
    scenario: "Servicio observa aumento sostenido de eventos adversos en 3 meses",
    correct: "Analizar indicadores, identificar causas y ejecutar plan de mejora con reevaluación periódica.",
    wrongs: [
      "Suspender la medición para evitar sesgos.",
      "Atribuir problema a desempeño individual sin análisis de proceso.",
      "Aplicar cambios aislados sin indicadores de resultado.",
    ],
    rationale:
      "La mejora continua necesita medición, análisis causal e intervenciones trazables con seguimiento.",
    tags: ["calidad", "indicadores", "gestion"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
  {
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Investigación aplicada",
    topic: "Validez y sesgo en estudios",
    scenario: "Equipo evalúa intervención educativa sin grupo comparador en dos periodos",
    correct: "Reconocer limitaciones de validez interna y fortalecer diseño/metodología para futuras mediciones.",
    wrongs: [
      "Asumir causalidad definitiva sin control de sesgos.",
      "Excluir discusión metodológica del informe.",
      "Interpretar resultados sin considerar contexto de implementación.",
    ],
    rationale:
      "Interpretar evidencia exige reconocer sesgos y límites metodológicos para tomar decisiones más robustas.",
    tags: ["investigacion", "validez", "metodologia"],
    difficulties: ["intermedia", "alta", "alta", "alta"],
  },
  {
    category: "Salud mental y entrevista clínica",
    component: "Salud mental y entrevista clínica",
    subcomponent: "Entrevista inicial",
    topic: "Alianza terapéutica",
    scenario: "Paciente expresa desconfianza y temor a ser juzgado durante primera entrevista",
    correct: "Validar experiencia, usar preguntas abiertas y construir una alianza terapéutica colaborativa.",
    wrongs: [
      "Iniciar con interrogatorio cerrado centrado solo en síntomas.",
      "Confrontar de forma directa para acelerar diagnóstico.",
      "Evitar explorar emociones para mantener neutralidad técnica.",
    ],
    rationale:
      "La alianza terapéutica mejora la calidad de información y la adherencia al proceso clínico.",
    tags: ["salud_mental", "entrevista", "alianza"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Salud mental y entrevista clínica",
    component: "Salud mental y entrevista clínica",
    subcomponent: "Evaluación de riesgo",
    topic: "Riesgo suicida y seguridad",
    scenario: "Paciente menciona ideación suicida con desesperanza y escaso apoyo social",
    correct: "Realizar evaluación estructurada de riesgo y activar medidas de seguridad institucionales.",
    wrongs: [
      "Posponer valoración específica para próxima consulta.",
      "Reducir intervención a recomendaciones generales.",
      "Omitir documentación por sensibilidad del tema.",
    ],
    rationale:
      "Ante señales de riesgo, la seguridad es prioritaria con protocolo estructurado y coordinación clínica.",
    tags: ["suicidio", "seguridad", "salud_mental"],
    difficulties: ["intermedia", "alta", "alta", "alta"],
  },
  {
    category: "Geriatría y gerontología",
    component: "Geriatría y gerontología",
    subcomponent: "Síndromes geriátricos",
    topic: "Fragilidad clínica",
    scenario: "Persona mayor con pérdida de peso, debilidad y menor velocidad de marcha",
    correct: "Aplicar valoración geriátrica integral y plan de intervención multidimensional.",
    wrongs: [
      "Normalizar hallazgos por edad sin evaluación adicional.",
      "Centrar cuidado solo en una comorbilidad.",
      "Posponer intervención hasta deterioro funcional severo.",
    ],
    rationale:
      "La fragilidad debe detectarse temprano para prevenir dependencia, hospitalización y eventos adversos.",
    tags: ["geriatria", "fragilidad", "valoracion_integral"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
  {
    category: "Pediatría y neonatología",
    component: "Pediatría y neonatología",
    subcomponent: "Urgencias respiratorias",
    topic: "Bronquiolitis y signos de alarma",
    scenario: "Lactante presenta dificultad respiratoria progresiva y rechazo de alimentación",
    correct: "Priorizar valoración respiratoria y derivación oportuna según gravedad clínica.",
    wrongs: [
      "Mantener manejo domiciliario sin reevaluación.",
      "Indicar antibiótico de rutina sin criterios clínicos.",
      "Esperar evolución espontánea por 24 horas.",
    ],
    rationale:
      "En lactantes con compromiso respiratorio, la evaluación temprana evita deterioro y complicaciones.",
    tags: ["pediatria", "respiratorio", "urgencias"],
    difficulties: ["intermedia", "alta", "alta", "alta"],
  },
  {
    category: "Psicología y psiquiatría",
    component: "Psicología y psiquiatría",
    subcomponent: "Urgencias psiquiátricas",
    topic: "Manejo de agitación",
    scenario: "Paciente con agitación psicomotora eleva tono de voz y amenaza abandonar el servicio",
    correct: "Aplicar desescalada verbal, evaluar riesgo y mantener entorno seguro para todos.",
    wrongs: [
      "Confrontar para imponer control inmediato.",
      "Ignorar conducta esperando resolución espontánea.",
      "Iniciar restricción física sin evaluación previa.",
    ],
    rationale:
      "La desescalada y el enfoque estructurado reducen daño y mejoran la contención terapéutica.",
    tags: ["psiquiatria", "agitacion", "seguridad"],
    difficulties: ["intermedia", "alta", "alta", "alta"],
  },
  {
    category: "Procesos y gestión del cuidado",
    component: "Procesos y gestión del cuidado",
    subcomponent: "Comunicación clínica",
    topic: "Pase de turno con SBAR",
    scenario: "Tras un cambio de turno se omite información crítica sobre alergias",
    correct: "Estandarizar entrega con formato SBAR y verificación de datos críticos.",
    wrongs: [
      "Mantener pase narrativo libre sin estructura.",
      "Priorizar rapidez sobre completitud de información.",
      "Delegar entrega a mensajes informales no trazables.",
    ],
    rationale:
      "La comunicación estructurada reduce errores por omisión y mejora continuidad del cuidado.",
    tags: ["SBAR", "comunicacion", "seguridad"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Farmacología clínica",
    component: "Farmacología clínica",
    subcomponent: "Seguridad farmacológica",
    topic: "Anticoagulación segura",
    scenario: "Paciente anticoagulado presenta signos de posible sangrado y duda sobre dosis",
    correct: "Valorar signos de alarma, verificar prescripción y activar ruta segura de manejo.",
    wrongs: [
      "Duplicar dosis para compensar toma olvidada.",
      "Suspender sin criterio clínico y sin notificar.",
      "Minimizar síntomas por ausencia de dolor intenso.",
    ],
    rationale:
      "Los anticoagulantes requieren vigilancia clínica estrecha y educación para prevenir eventos graves.",
    tags: ["farmacologia", "anticoagulantes", "seguridad"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
  {
    category: "Morfofisiología aplicada",
    component: "Morfofisiología aplicada",
    subcomponent: "Equilibrio ácido-base",
    topic: "Compensación fisiológica",
    scenario: "Paciente con alteración metabólica presenta cambios respiratorios compensatorios",
    correct: "Interpretar respuesta compensatoria junto a datos clínicos y laboratorio.",
    wrongs: [
      "Analizar gasometría sin correlación clínica.",
      "Atribuir patrón respiratorio solo a ansiedad.",
      "Descartar compensación por ausencia de dolor.",
    ],
    rationale:
      "La lectura ácido-base exige integración fisiológica y correlación clínica para decisiones seguras.",
    tags: ["morfofisiologia", "acido_base", "fisiologia"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
  {
    category: "Cuidados críticos y urgencias",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Respuesta temprana",
    topic: "Sepsis y deterioro hemodinámico",
    scenario: "Paciente con hipotensión, taquicardia y sospecha de infección sistémica",
    correct: "Activar protocolo de sepsis y medidas iniciales tiempo-dependientes.",
    wrongs: [
      "Esperar confirmación completa antes de actuar.",
      "Tratar solo fiebre sin evaluar perfusión.",
      "Diferir intervención para próxima valoración médica.",
    ],
    rationale:
      "La respuesta temprana en sepsis mejora desenlaces y reduce riesgo de falla orgánica.",
    tags: ["sepsis", "urgencias", "criticos"],
    difficulties: ["intermedia", "alta", "alta", "alta"],
  },
  {
    category: "Ginecología y salud sexual",
    component: "Ginecología y salud sexual",
    subcomponent: "Emergencias obstétricas",
    topic: "Preeclampsia y signos de alarma",
    scenario: "Gestante presenta cefalea intensa, fosfenos y dolor epigástrico",
    correct: "Priorizar evaluación obstétrica urgente y monitorización materno-fetal.",
    wrongs: [
      "Indicar reposo domiciliario sin valoración integral.",
      "Programar control diferido en consulta externa.",
      "Reducir manejo a analgesia sintomática aislada.",
    ],
    rationale:
      "Los signos de alarma hipertensiva en embarazo requieren respuesta inmediata para proteger binomio madre-hijo.",
    tags: ["ginecologia", "obstetricia", "preeclampsia"],
    difficulties: ["intermedia", "alta", "alta", "alta"],
  },
  {
    category: "Farmacología clínica",
    component: "Farmacología clínica",
    subcomponent: "Uso racional de antimicrobianos",
    topic: "Seguridad en antibioticoterapia",
    scenario: "Paciente con sospecha infecciosa recibe indicación de antibiótico de amplio espectro",
    correct: "Verificar indicación, alergias y administración segura según protocolo institucional.",
    wrongs: [
      "Administrar sin confirmar antecedentes de alergia.",
      "Suspender toma de cultivos por priorizar rapidez.",
      "Prolongar esquema empírico sin reevaluación.",
    ],
    rationale:
      "El uso seguro de antimicrobianos requiere verificación clínica y vigilancia de respuesta terapéutica.",
    tags: ["farmacologia", "antibioticos", "seguridad"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
  {
    category: "Psicología y psiquiatría",
    component: "Psicología y psiquiatría",
    subcomponent: "Intervenciones psicoeducativas",
    topic: "Psicoeducación en ansiedad",
    scenario: "Paciente con ansiedad recurrente desconoce estrategias básicas de autorregulación",
    correct: "Entregar psicoeducación breve, estructurada y adaptada al nivel de comprensión del paciente.",
    wrongs: [
      "Utilizar lenguaje técnico sin verificar comprensión.",
      "Evitar educación para no incrementar preocupación.",
      "Limitar intervención a consejos generales no personalizados.",
    ],
    rationale:
      "La psicoeducación clara y contextualizada mejora adherencia y capacidad de afrontamiento.",
    tags: ["psicologia", "ansiedad", "psicoeducacion"],
    difficulties: ["basica", "intermedia", "intermedia", "alta"],
  },
  {
    category: "Procesos y gestión del cuidado",
    component: "Procesos y gestión del cuidado",
    subcomponent: "Mejora continua",
    topic: "Auditoría clínica y calidad",
    scenario: "El servicio detecta variabilidad en registros y cumplimiento de protocolos",
    correct: "Implementar auditoría formativa con retroalimentación y seguimiento de acciones correctivas.",
    wrongs: [
      "Aplicar sanción individual sin análisis del proceso.",
      "Cerrar hallazgos sin plan de mejora documentado.",
      "Mantener protocolo sin verificar adherencia real.",
    ],
    rationale:
      "La auditoría efectiva combina análisis de proceso, mejora colaborativa y monitoreo de resultados.",
    tags: ["gestion", "auditoria", "calidad"],
    difficulties: ["intermedia", "intermedia", "alta", "alta"],
  },
];

export const CACES_EXPANDED_QUESTION_BANK: CacesQuestion[] = (() => {
  const out: CacesQuestion[] = [];
  const correctPattern: CacesOptionId[] = ["B", "C", "A", "D"];

  const followupOptions = (
    correctLetter: CacesOptionId
  ) =>
    buildChoiceSet(
      "Reevaluar respuesta clínica, documentar hallazgos y ajustar el plan de cuidado con el equipo.",
      [
        "Mantener el mismo plan sin reevaluación sistemática.",
        "Postergar documentación hasta el final del turno.",
        "Esperar nueva complicación para reconsiderar la conducta.",
      ],
      correctLetter,
      "El seguimiento estructurado permite detectar cambios tempranos y sostener decisiones seguras."
    );

  for (let i = 0; i < UNITS.length; i++) {
    const unit = UNITS[i];
    const baseIndex = i * 4;

    const v1 = buildChoiceSet(
      unit.correct,
      unit.wrongs,
      correctPattern[0],
      unit.rationale
    );
    out.push({
      id: buildId(baseIndex),
      component: unit.component,
      subcomponent: unit.subcomponent,
      topic: unit.topic,
      category: unit.category,
      type: "directa",
      question: `En relación con ${unit.topic.toLowerCase()}, ¿cuál intervención de enfermería es más adecuada como primera línea?`,
      options: v1.options,
      correctAnswer: v1.correctAnswer,
      explanation: unit.rationale,
      difficulty: unit.difficulties[0],
      tags: [...unit.tags, "seed_ampliado", "directa"],
    });

    const v2 = buildChoiceSet(
      unit.correct,
      unit.wrongs,
      correctPattern[1],
      unit.rationale
    );
    out.push({
      id: buildId(baseIndex + 1),
      component: unit.component,
      subcomponent: unit.subcomponent,
      topic: unit.topic,
      category: unit.category,
      type: "caso_clinico",
      question: `Caso clínico: ${unit.scenario}. ¿Cuál es la conducta prioritaria de enfermería?`,
      options: v2.options,
      correctAnswer: v2.correctAnswer,
      explanation: unit.rationale,
      difficulty: unit.difficulties[1],
      tags: [...unit.tags, "seed_ampliado", "caso_clinico"],
    });

    const v3 = followupOptions(correctPattern[2]);
    out.push({
      id: buildId(baseIndex + 2),
      component: unit.component,
      subcomponent: unit.subcomponent,
      topic: `${unit.topic} - evaluación`,
      category: unit.category,
      type: "directa",
      question: `¿Qué criterio demuestra calidad del cuidado al abordar ${unit.topic.toLowerCase()}?`,
      options: v3.options,
      correctAnswer: v3.correctAnswer,
      explanation:
        "La calidad asistencial se sostiene con reevaluación, documentación y ajuste dinámico del plan de cuidados.",
      difficulty: unit.difficulties[2],
      tags: [...unit.tags, "seed_ampliado", "evaluacion"],
    });

    const v4 = followupOptions(correctPattern[3]);
    out.push({
      id: buildId(baseIndex + 3),
      component: unit.component,
      subcomponent: unit.subcomponent,
      topic: `${unit.topic} - seguimiento`,
      category: unit.category,
      type: "caso_clinico",
      question: `Mini caso: ${unit.scenario}. Tras la intervención inicial, ¿qué acción fortalece la seguridad clínica del seguimiento?`,
      options: v4.options,
      correctAnswer: v4.correctAnswer,
      explanation:
        "El seguimiento clínico oportuno y documentado reduce eventos adversos y mejora continuidad asistencial.",
      difficulty: unit.difficulties[3],
      tags: [...unit.tags, "seed_ampliado", "seguimiento"],
    });
  }

  return out;
})();

