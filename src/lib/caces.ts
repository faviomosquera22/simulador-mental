import type {
  CacesCognitiveLevel,
  CacesComplexityLevel,
  CacesAttemptAnswer,
  CacesAttemptResult,
  CacesDifficulty,
  CacesOptionId,
  CacesPracticeMode,
  CacesQuestion,
  CacesQuestionOption,
  CacesQuestionType,
  QuizQuestion,
} from "./types";
import { CACES_EXPANDED_QUESTION_BANK } from "./cacesExpanded";
import { CACES_IMPORTED_PDF_BANK, CACES_SCORE_MAMA_GYNE_BANK } from "./cacesPdfImported";

type LegacyDifficultyFilter = "all" | "basic" | "intermediate" | "advanced";

type CacesFilter = {
  category?: string;
  categories?: string[];
  component?: string;
  subcomponent?: string;
  topic?: string;
  difficulty?: CacesDifficulty;
  type?: CacesQuestionType;
  tags?: string[];
  mix_categories?: boolean;
};

const MAX_QUESTION_KEY_CHARS = 460;

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
): [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption] {
  return [a, b, c, d];
}

const EHEP_BASE_REFERENCES = [
  "CACES (2024). Manual para el diseño, aplicación y determinación de resultados del EHEP.",
  "Bibliografía académica vigente y guías clínicas actualizadas del área temática.",
];

function inferCognitiveLevel(
  difficulty: CacesDifficulty,
  type: CacesQuestionType
): CacesCognitiveLevel {
  if (difficulty === "alta") return "analisis";
  if (difficulty === "intermedia") return type === "caso_clinico" ? "aplicacion" : "comprension";
  return "conocimiento";
}

function inferComplexityLevel(
  difficulty: CacesDifficulty
): CacesComplexityLevel {
  if (difficulty === "alta") return "alto";
  if (difficulty === "intermedia") return "medio";
  return "bajo";
}

function sanitizeManualOptionText(value: string) {
  let out = String(value ?? "").trim();

  out = out
    .replace(/\bninguna de las anteriores\b/gi, "Ninguna alternativa cumple completamente el criterio clínico planteado")
    .replace(/\btodas las anteriores\b/gi, "La alternativa que integra de mejor forma los criterios clínicos")
    .replace(/\bsiempre\b/gi, "de forma sistemática")
    .replace(/\bnunca\b/gi, "rara vez");

  return out;
}

function sanitizeManualRationale(value: string) {
  const text = String(value ?? "").trim();
  if (text.length > 0) return text;
  return "No cumple de forma óptima el criterio clínico y técnico planteado en el enunciado.";
}

function sanitizeManualStem(question: CacesQuestion) {
  const raw = String(question.question ?? "").trim();
  const withQuestionMark = raw.endsWith("?") ? raw : `${raw}?`;

  if (question.type === "caso_clinico") {
    const normalized = withQuestionMark.replace(/^mini caso:/i, "Caso clínico:");
    if (/^caso clínico:/i.test(normalized)) return normalized;
    return `Caso clínico: ${normalized}`;
  }

  return withQuestionMark
    .replace(/^en relacion con/i, "En relación con")
    .replace(/^en relación con/i, "En relación con");
}

export function alignQuestionToEhepManual(question: CacesQuestion): CacesQuestion {
  const optionsAligned = question.options.map((opt) => ({
    ...opt,
    text: sanitizeManualOptionText(opt.text),
    rationale: sanitizeManualRationale(opt.rationale),
  })) as CacesQuestion["options"];

  const manualProfile = {
    framework: "EHEP_2024" as const,
    cognitiveLevel: inferCognitiveLevel(question.difficulty, question.type),
    complexityLevel: inferComplexityLevel(question.difficulty),
    reviewed: true,
  };

  return {
    ...question,
    question: sanitizeManualStem(question),
    options: optionsAligned,
    references:
      Array.isArray(question.references) && question.references.length > 0
        ? question.references
        : EHEP_BASE_REFERENCES,
    manualProfile,
  };
}

export const CACES_CATEGORIES = [
  "Fundamentos del cuidado enfermero",
  "Mujer, recién nacido, niño y adolescente",
  "Adulto y adulto mayor",
  "Cuidado familiar, comunitario e intercultural",
  "Bases educativas, administrativas, investigativas y epidemiológicas",
  "Salud mental y entrevista clínica",
  "Geriatría y gerontología",
  "Pediatría y neonatología",
  "Psicología y psiquiatría",
  "Procesos y gestión del cuidado",
  "Farmacología clínica",
  "Morfofisiología aplicada",
  "Cuidados críticos y urgencias",
  "Ginecología y salud sexual",
] as const;

const CACES_CORE_QUESTION_BANK: CacesQuestion[] = [
  {
    id: "caces-001",
    component: "Fundamentos del cuidado enfermero",
    subcomponent: "Proceso de atención de enfermería",
    topic: "Secuencia del PAE",
    category: "Fundamentos del cuidado enfermero",
    type: "directa",
    question: "En el Proceso de Atención de Enfermería, ¿cuál secuencia refleja correctamente el razonamiento clínico?",
    options: options(
      option("A", "Intervención, diagnóstico, evaluación, valoración, planificación.", "Invierte el orden lógico de valoración inicial y planificación."),
      option("B", "Valoración, diagnóstico, planificación, intervención y evaluación.", "Mantiene el flujo clínico estándar y permite ajuste continuo."),
      option("C", "Diagnóstico médico, intervención, egreso, evaluación.", "Confunde proceso enfermero con decisiones médicas."),
      option("D", "Valoración, intervención inmediata, diagnóstico final.", "Omite planificación y evaluación estructurada.")
    ),
    correctAnswer: "B",
    explanation: "El PAE inicia con valoración de datos, formula diagnóstico enfermero, planifica resultados/intervenciones, ejecuta y evalúa resultados.",
    difficulty: "basica",
    tags: ["PAE", "valoracion", "planificacion"],
  },
  {
    id: "caces-002",
    component: "Fundamentos del cuidado enfermero",
    subcomponent: "Taxonomías enfermeras",
    topic: "NANDA, NOC y NIC",
    category: "Fundamentos del cuidado enfermero",
    type: "directa",
    question: "¿Qué relación es correcta entre NANDA, NOC y NIC en un plan de cuidados?",
    options: options(
      option("A", "NANDA define intervenciones, NIC define diagnósticos y NOC clasifica medicamentos.", "Asigna funciones incorrectas a cada taxonomía."),
      option("B", "NANDA formula diagnósticos, NOC define resultados y NIC organiza intervenciones.", "Corresponde a la integración esperada en planes de cuidado."),
      option("C", "NOC y NIC son equivalentes; NANDA es opcional.", "NANDA no es opcional si se estructura el razonamiento."),
      option("D", "NIC se usa solo en hospitalización y NOC solo en comunidad.", "No depende del nivel de atención sino del objetivo clínico.")
    ),
    correctAnswer: "B",
    explanation: "NANDA identifica el diagnóstico, NOC plantea resultados medibles y NIC orienta intervenciones para alcanzarlos.",
    difficulty: "intermedia",
    tags: ["NANDA", "NOC", "NIC"],
  },
  {
    id: "caces-003",
    component: "Fundamentos del cuidado enfermero",
    subcomponent: "Seguridad y bioseguridad",
    topic: "Higiene de manos en procedimiento invasivo",
    category: "Fundamentos del cuidado enfermero",
    type: "caso_clinico",
    question: "Antes de canalizar una vía periférica, la profesional ya organizó material estéril pero recibió una llamada y tocó el teléfono. ¿Cuál es la conducta más segura?",
    options: options(
      option("A", "Continuar sin cambios para no retrasar el procedimiento.", "Prioriza rapidez por sobre control de infección."),
      option("B", "Colocar doble guante y continuar.", "El doble guante no sustituye higiene de manos adecuada."),
      option("C", "Realizar nuevamente higiene de manos y retomar técnica aséptica.", "Restaura barrera de seguridad antes del procedimiento."),
      option("D", "Pedir a otro compañero que finalice con el mismo material.", "No corrige el quiebre de técnica en curso.")
    ),
    correctAnswer: "C",
    explanation: "Ante cualquier interrupción con contacto no limpio, se debe reiniciar higiene de manos y verificar asepsia para reducir infecciones asociadas a la atención.",
    difficulty: "basica",
    tags: ["bioseguridad", "higiene_manos", "seguridad_paciente"],
  },
  {
    id: "caces-004",
    component: "Fundamentos del cuidado enfermero",
    subcomponent: "Etica y seguridad del paciente",
    topic: "Notificación de incidente",
    category: "Fundamentos del cuidado enfermero",
    type: "caso_clinico",
    question: "Una dosis fue administrada 30 minutos tarde por confusión de turno, sin daño aparente. ¿Qué acción fortalece la cultura de seguridad?",
    options: options(
      option("A", "No registrar porque no hubo daño.", "Oculta eventos que deben analizarse para prevenir recurrencia."),
      option("B", "Documentar el incidente y reportarlo según protocolo institucional.", "Permite aprendizaje del sistema y mejora de procesos."),
      option("C", "Resolver verbalmente con el compañero y cerrar el caso.", "No deja trazabilidad ni aprendizaje organizacional."),
      option("D", "Modificar la hora en el registro para evitar sanciones.", "Constituye mala práctica y compromete seguridad." )
    ),
    correctAnswer: "B",
    explanation: "Los incidentes sin daño también se notifican: permiten analizar causas y diseñar barreras preventivas.",
    difficulty: "intermedia",
    tags: ["seguridad", "calidad", "notificacion"],
  },

  {
    id: "caces-005",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Salud sexual y reproductiva",
    topic: "Consejería anticonceptiva",
    category: "Mujer, recién nacido, niño y adolescente",
    type: "directa",
    question: "En consejería anticonceptiva, ¿qué enfoque respeta mejor la autonomía de la usuaria?",
    options: options(
      option("A", "Seleccionar el método según preferencia del profesional.", "Desplaza decisión informada de la usuaria."),
      option("B", "Brindar opciones, riesgos/beneficios y decidir junto con la usuaria.", "Promueve decisión informada y adherencia."),
      option("C", "Evitar hablar de efectos adversos para no generar temor.", "Oculta información clave para consentimiento."),
      option("D", "Indicar un solo método por protocolo local.", "Limita personalización clínica y autonomía.")
    ),
    correctAnswer: "B",
    explanation: "La consejería efectiva exige información clara, lenguaje no coercitivo y decisión compartida.",
    difficulty: "basica",
    tags: ["salud_sexual", "autonomia", "consentimiento"],
  },
  {
    id: "caces-006",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Niñez y adolescencia",
    topic: "Detección de violencia intrafamiliar",
    category: "Mujer, recién nacido, niño y adolescente",
    type: "caso_clinico",
    question: "Adolescente consulta por cefalea recurrente y evita responder cuando está con su cuidador. ¿Cuál es la mejor acción inicial?",
    options: options(
      option("A", "Interrogar en presencia del cuidador para ahorrar tiempo.", "Disminuye posibilidad de revelar riesgo o violencia."),
      option("B", "Garantizar entrevista privada, explorar seguridad y activar ruta institucional si corresponde.", "Protege confidencialidad y permite detección temprana."),
      option("C", "Descartar causas sociales y solicitar solo exámenes físicos.", "Puede omitir determinantes críticos del problema."),
      option("D", "Sugerir volver con toda la familia para evaluar dinámica.", "Demora evaluación de posible riesgo inmediato.")
    ),
    correctAnswer: "B",
    explanation: "La evaluación privada y segura es clave para detectar violencia y activar protocolos de protección.",
    difficulty: "alta",
    tags: ["adolescencia", "violencia", "ruta_proteccion"],
  },
  {
    id: "caces-007",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Recién nacido",
    topic: "Termorregulación neonatal",
    category: "Mujer, recién nacido, niño y adolescente",
    type: "caso_clinico",
    question: "Recién nacido a término, 20 minutos posparto, con temperatura axilar baja. ¿Intervención inicial más adecuada?",
    options: options(
      option("A", "Baño inmediato para estimular circulación.", "Incrementa pérdida de calor en etapa crítica."),
      option("B", "Contacto piel con piel y cubrir con paño seco y gorro.", "Medida eficaz de termorregulación temprana."),
      option("C", "Administrar fórmula para aumentar calorías.", "No corrige de forma inmediata la pérdida térmica."),
      option("D", "Trasladar sin abrigo al área de observación.", "Aumenta riesgo de hipotermia.")
    ),
    correctAnswer: "B",
    explanation: "El contacto piel a piel y secado/cobertura adecuada son estrategias iniciales de alto impacto en termorregulación neonatal.",
    difficulty: "intermedia",
    tags: ["recien_nacido", "termorregulacion", "cuidados_inmediatos"],
  },
  {
    id: "caces-008",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Educación para la salud",
    topic: "Adherencia en adolescente con ITS",
    category: "Mujer, recién nacido, niño y adolescente",
    type: "directa",
    question: "¿Qué estrategia educativa mejora adherencia en adolescente con tratamiento para ITS?",
    options: options(
      option("A", "Usar solo indicaciones escritas complejas.", "Puede dificultar comprensión y adherencia."),
      option("B", "Plan breve, lenguaje claro, verificación de comprensión y seguimiento.", "Integra comunicación efectiva y continuidad."),
      option("C", "Evitar hablar de pareja o red de apoyo.", "Ignora factores conductuales y contextuales."),
      option("D", "Suspender educación para evitar estigma.", "La educación clínica reduce riesgo y recaídas.")
    ),
    correctAnswer: "B",
    explanation: "La educación efectiva combina simplicidad, confirmación de comprensión y acompañamiento.",
    difficulty: "intermedia",
    tags: ["ITS", "adherencia", "educacion_salud"],
  },

  {
    id: "caces-009",
    component: "Adulto y adulto mayor",
    subcomponent: "Valoración clínica",
    topic: "Escala de Barthel",
    category: "Adulto y adulto mayor",
    type: "directa",
    question: "La escala de Barthel se usa principalmente para valorar:",
    options: options(
      option("A", "Riesgo suicida en urgencias.", "No corresponde a su objetivo funcional."),
      option("B", "Dependencia en actividades básicas de la vida diaria.", "Mide autonomía funcional en ABVD."),
      option("C", "Gravedad de dolor oncológico.", "Existen escalas específicas para dolor."),
      option("D", "Carga del cuidador familiar.", "No es instrumento de sobrecarga del cuidador.")
    ),
    correctAnswer: "B",
    explanation: "Barthel cuantifica nivel de dependencia para actividades básicas (alimentación, higiene, movilidad, etc.).",
    difficulty: "basica",
    tags: ["adulto_mayor", "escalas", "funcionalidad"],
  },
  {
    id: "caces-010",
    component: "Adulto y adulto mayor",
    subcomponent: "Dolor y confort",
    topic: "Revaloración del dolor postintervención",
    category: "Adulto y adulto mayor",
    type: "caso_clinico",
    question: "Paciente posoperatorio reporta dolor 8/10. Tras analgesia prescrita, ¿qué conducta evidencia buena práctica?",
    options: options(
      option("A", "Registrar intervención sin reevaluar respuesta.", "Impide valorar efectividad y ajustar plan."),
      option("B", "Reevaluar dolor en tiempo razonable y documentar cambio clínico.", "Cierra ciclo de valoración-intervención-evaluación."),
      option("C", "Esperar al siguiente turno para nueva valoración.", "Puede prolongar sufrimiento evitable."),
      option("D", "Suspender medidas no farmacológicas por irrelevantes.", "El manejo multimodal aporta beneficio adicional.")
    ),
    correctAnswer: "B",
    explanation: "El manejo del dolor requiere reevaluación sistemática para medir respuesta y ajustar intervenciones.",
    difficulty: "intermedia",
    tags: ["dolor", "reevaluacion", "registro"],
  },
  {
    id: "caces-011",
    component: "Adulto y adulto mayor",
    subcomponent: "Seguridad del paciente",
    topic: "Prevención de caídas en adulto mayor",
    category: "Adulto y adulto mayor",
    type: "caso_clinico",
    question: "Adulto mayor con marcha inestable y sedación nocturna. ¿Qué medida prioriza seguridad?",
    options: options(
      option("A", "Reducir hidratación para evitar idas al baño.", "Puede generar deshidratación y otros riesgos."),
      option("B", "Implementar plan de prevención de caídas y vigilancia focalizada.", "Aborda riesgo principal con intervención estructurada."),
      option("C", "Limitar completamente la movilización sin valoración.", "La inmovilidad también incrementa complicaciones."),
      option("D", "Esperar caída para documentar riesgo real.", "La prevención debe ser anticipatoria.")
    ),
    correctAnswer: "B",
    explanation: "La prevención de caídas requiere evaluación de riesgo, medidas ambientales y supervisión según perfil clínico.",
    difficulty: "intermedia",
    tags: ["caidas", "adulto_mayor", "seguridad"],
  },
  {
    id: "caces-012",
    component: "Adulto y adulto mayor",
    subcomponent: "Cuidados paliativos",
    topic: "Comunicación de objetivos de cuidado",
    category: "Adulto y adulto mayor",
    type: "directa",
    question: "En cuidados paliativos, una comunicación clínica de calidad debe priorizar:",
    options: options(
      option("A", "Información técnica extensa sin explorar valores del paciente.", "No asegura decisiones centradas en la persona."),
      option("B", "Objetivos terapéuticos alineados con valores, síntomas y preferencias.", "Promueve decisiones compartidas y humanizadas."),
      option("C", "Evitar hablar de pronóstico para reducir ansiedad.", "Oculta información clave para planificación."),
      option("D", "Delegar toda la conversación a familiares.", "Puede vulnerar autonomía del paciente.")
    ),
    correctAnswer: "B",
    explanation: "La planificación paliativa debe integrar control de síntomas y objetivos de cuidado acordes a valores del paciente.",
    difficulty: "alta",
    tags: ["paliativos", "comunicacion", "etica"],
  },

  {
    id: "caces-013",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "MAIS-FCI",
    topic: "Nivel de resolucion y referencia",
    category: "Cuidado familiar, comunitario e intercultural",
    type: "directa",
    question: "Dentro de un enfoque MAIS-FCI, ¿cuál acción corresponde al primer nivel de atención?",
    options: options(
      option("A", "Promoción, prevención y resolución de problemas frecuentes.", "Refleja el rol central del primer nivel."),
      option("B", "Manejo exclusivo de patologías de alta complejidad.", "Eso pertenece a niveles especializados."),
      option("C", "Evitar referencia a otros niveles por continuidad local.", "Contradice la red integrada de servicios."),
      option("D", "Priorizar procedimientos hospitalarios sobre intervención comunitaria.", "Desplaza enfoque territorial preventivo.")
    ),
    correctAnswer: "A",
    explanation: "El primer nivel prioriza promoción, prevención y resolución inicial, articulando referencia cuando se requiere.",
    difficulty: "intermedia",
    tags: ["MAIS_FCI", "primer_nivel", "referencia"],
  },
  {
    id: "caces-014",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Visita domiciliaria",
    topic: "Priorizacion en visita",
    category: "Cuidado familiar, comunitario e intercultural",
    type: "caso_clinico",
    question: "En visita domiciliaria, una familia reporta adulto mayor postrado, cuidadora agotada y medicamentos desordenados. ¿Qué prioridad inmediata corresponde?",
    options: options(
      option("A", "Postergar intervención hasta tener informe social completo.", "Demora acciones de riesgo inmediato."),
      option("B", "Evaluar seguridad del cuidado, adherencia terapéutica y sobrecarga del cuidador.", "Integra riesgos clínicos y familiares urgentes."),
      option("C", "Entregar folleto y programar control en 3 meses.", "Respuesta insuficiente ante situación compleja."),
      option("D", "Centrarse solo en limpieza del hogar.", "Reduce la valoración a un aspecto no prioritario.")
    ),
    correctAnswer: "B",
    explanation: "La visita debe priorizar seguridad clínica, manejo terapéutico y capacidad real del cuidador.",
    difficulty: "alta",
    tags: ["visita_domiciliaria", "cuidado_familiar", "priorizacion"],
  },
  {
    id: "caces-015",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Herramientas familiares",
    topic: "Uso de familiograma",
    category: "Cuidado familiar, comunitario e intercultural",
    type: "directa",
    question: "El familiograma aporta principalmente información sobre:",
    options: options(
      option("A", "Patrones de relacion y estructura familiar en el tiempo.", "Facilita análisis de vínculos y eventos familiares."),
      option("B", "Nivel exacto de glucosa de cada miembro.", "No es herramienta bioquímica."),
      option("C", "Lista de medicamentos institucionales.", "No corresponde a su objetivo."),
      option("D", "Diagnóstico médico definitivo de la familia.", "No reemplaza evaluación clínica integral.")
    ),
    correctAnswer: "A",
    explanation: "El familiograma organiza estructura y relaciones familiares relevantes para el cuidado.",
    difficulty: "basica",
    tags: ["familiograma", "ciclo_familiar", "intervencion_familiar"],
  },
  {
    id: "caces-016",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Promoción y prevención comunitaria",
    topic: "Plan comunitario ITS/VIH",
    category: "Cuidado familiar, comunitario e intercultural",
    type: "caso_clinico",
    question: "Una comunidad presenta aumento de ITS en jóvenes. ¿Qué intervención comunitaria es más sólida?",
    options: options(
      option("A", "Campaña única anual sin seguimiento.", "Impacto limitado por falta de continuidad."),
      option("B", "Educación periódica, acceso a pruebas y ruta clara de derivación.", "Integra prevención, detección y continuidad de cuidado."),
      option("C", "Solo mensajes por redes sin actores locales.", "Puede ser insuficiente sin articulación territorial."),
      option("D", "Enfocar solo en abstinencia sin enfoque de riesgo.", "No cubre diversidad de conductas y necesidades." )
    ),
    correctAnswer: "B",
    explanation: "Los programas efectivos combinan educación sostenida, acceso a tamizaje y continuidad asistencial.",
    difficulty: "intermedia",
    tags: ["comunitario", "ITS", "prevencion"],
  },

  {
    id: "caces-017",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Gestión y liderazgo",
    topic: "Delegación segura",
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    type: "directa",
    question: "En delegación clínica, ¿qué criterio es indispensable antes de asignar una tarea?",
    options: options(
      option("A", "Nivel de experiencia y competencia de quien recibe la tarea.", "La delegación segura exige adecuación entre tarea y competencias."),
      option("B", "Antigüedad laboral sin considerar habilidades actuales.", "La antigüedad por sí sola no garantiza competencia."),
      option("C", "Preferencia personal del líder por un colaborador.", "No es criterio técnico suficiente."),
      option("D", "Disponibilidad horaria únicamente.", "Debe incluir capacidad técnica y supervisión.")
    ),
    correctAnswer: "A",
    explanation: "Delegar de forma segura requiere verificar competencia, claridad de instrucciones y supervisión.",
    difficulty: "intermedia",
    tags: ["liderazgo", "delegacion", "seguridad"],
  },
  {
    id: "caces-018",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Proceso administrativo",
    topic: "Ciclo administrativo en enfermería",
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    type: "directa",
    question: "¿Cuál secuencia representa mejor el proceso administrativo aplicado al servicio de enfermería?",
    options: options(
      option("A", "Control, dirección, planeación y organización.", "El control no es el punto de partida."),
      option("B", "Planeación, organización, dirección y control.", "Secuencia clásica para gestionar recursos y resultados."),
      option("C", "Dirección, organización, control y planeación.", "Orden inadecuado para gestión eficiente."),
      option("D", "Planeación, control y fin del proceso.", "Omite etapas operativas esenciales.")
    ),
    correctAnswer: "B",
    explanation: "La gestión administrativa inicia con planeación, organiza recursos, dirige ejecución y cierra con control/evaluación.",
    difficulty: "basica",
    tags: ["administracion", "planificacion", "control"],
  },
  {
    id: "caces-019",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Investigación",
    topic: "Diseño cuasiexperimental en educación",
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    type: "caso_clinico",
    question: "Un equipo evalúa un programa educativo en dos centros, sin aleatorización, comparando antes y después. ¿Qué diseño describe mejor este estudio?",
    options: options(
      option("A", "Ensayo clínico aleatorizado.", "Falta asignación aleatoria."),
      option("B", "Cuasiexperimental con grupos no equivalentes.", "Corresponde a intervención sin randomización."),
      option("C", "Estudio de casos y controles.", "No compara exposición retrospectiva en casos/controles."),
      option("D", "Serie de casos descriptiva.", "Sí hay comparación temporal/intervención.")
    ),
    correctAnswer: "B",
    explanation: "Cuando hay intervención y comparación sin aleatorización, se clasifica como cuasiexperimental.",
    difficulty: "alta",
    tags: ["investigacion", "diseno", "validez"],
  },
  {
    id: "caces-020",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Epidemiología",
    topic: "Incidencia vs prevalencia",
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    type: "directa",
    question: "Si un reporte describe casos nuevos de depresión ocurridos en 2026, ¿qué indicador está midiendo?",
    options: options(
      option("A", "Prevalencia puntual.", "La prevalencia incluye casos existentes."),
      option("B", "Incidencia.", "Cuenta casos nuevos en un periodo."),
      option("C", "Letalidad.", "No evalúa mortalidad de casos."),
      option("D", "Razón de momios.", "No corresponde a este reporte poblacional.")
    ),
    correctAnswer: "B",
    explanation: "La incidencia cuantifica aparición de casos nuevos en un periodo definido.",
    difficulty: "basica",
    tags: ["epidemiologia", "incidencia", "indicadores"],
  },
  {
    id: "caces-021",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Vigilancia epidemiológica",
    topic: "Indicadores centinela",
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    type: "caso_clinico",
    question: "Una red de vigilancia reporta aumento semanal de intentos autolesivos en adolescentes. ¿Qué decisión inicial es más pertinente?",
    options: options(
      option("A", "Esperar un trimestre para confirmar tendencia.", "Puede retrasar respuesta ante riesgo creciente."),
      option("B", "Activar análisis rápido y medidas de respuesta temprana.", "La vigilancia debe traducirse en acción oportuna."),
      option("C", "Eliminar la notificación por variabilidad semanal.", "Pierde oportunidad de prevención."),
      option("D", "Usar el dato solo para informe anual.", "Subutiliza información de alerta temprana.")
    ),
    correctAnswer: "B",
    explanation: "Los indicadores centinela deben activar evaluación y acciones de control de forma temprana.",
    difficulty: "alta",
    tags: ["vigilancia", "salud_publica", "respuesta_temprana"],
  },
  {
    id: "caces-022",
    component: "Bases educativas, administrativas, investigativas y epidemiológicas",
    subcomponent: "Bioestadística básica",
    topic: "Interpretación de riesgo relativo",
    category: "Bases educativas, administrativas, investigativas y epidemiológicas",
    type: "directa",
    question: "En un estudio, el riesgo relativo de recaída fue 2.0 para pacientes sin apoyo familiar. ¿Cómo se interpreta?",
    options: options(
      option("A", "No existe asociación entre variables.", "RR=1 indica ausencia de asociación, no RR=2."),
      option("B", "El grupo sin apoyo presenta aproximadamente el doble de riesgo de recaída.", "Interpretación estándar de RR mayor que 1."),
      option("C", "El apoyo familiar duplica recaídas.", "Invierte dirección de la asociación reportada."),
      option("D", "El resultado demuestra causalidad definitiva.", "La asociación no implica causalidad automática.")
    ),
    correctAnswer: "B",
    explanation: "Un RR de 2.0 indica que la frecuencia del evento es aproximadamente el doble en el grupo expuesto.",
    difficulty: "intermedia",
    tags: ["bioestadistica", "riesgo_relativo", "interpretacion"],
  },

  {
    id: "caces-023",
    component: "Salud mental y entrevista clínica",
    subcomponent: "Entrevista clínica",
    topic: "Pregunta de apertura",
    category: "Salud mental y entrevista clínica",
    type: "directa",
    question: "¿Cuál apertura favorece mejor alianza terapéutica en primera entrevista de salud mental?",
    options: options(
      option("A", "Interrogatorio cerrado sobre síntomas en los primeros 30 segundos.", "Limita narrativa inicial del paciente."),
      option("B", "Validación breve del malestar y pregunta abierta de inicio.", "Facilita vínculo y obtención de información relevante."),
      option("C", "Explicar diagnóstico probable sin explorar motivo de consulta.", "Puede sesgar la entrevista tempranamente."),
      option("D", "Evitar emociones para mantener neutralidad técnica.", "Descuida componente relacional terapéutico.")
    ),
    correctAnswer: "B",
    explanation: "La apertura empática con pregunta abierta mejora alianza y precisión clínica de la entrevista.",
    difficulty: "basica",
    tags: ["entrevista", "alianza", "comunicacion"],
  },
  {
    id: "caces-024",
    component: "Salud mental y entrevista clínica",
    subcomponent: "Riesgo suicida",
    topic: "Priorización de seguridad",
    category: "Salud mental y entrevista clínica",
    type: "caso_clinico",
    question: "Paciente adolescente refiere ideación suicida actual, plan y acceso a medios. ¿Cuál acción es prioritaria?",
    options: options(
      option("A", "Posponer evaluación para no aumentar ansiedad.", "Demora manejo de riesgo alto."),
      option("B", "Evaluar seguridad estructurada y activar protocolo de contención inmediato.", "Prioriza riesgo vital y continuidad de cuidado."),
      option("C", "Entregar recomendaciones generales y alta domiciliaria.", "Insuficiente para nivel de riesgo descrito."),
      option("D", "Solicitar nueva cita en 15 días para seguimiento.", "No responde a urgencia actual.")
    ),
    correctAnswer: "B",
    explanation: "Con plan y acceso a medios, la seguridad es prioritaria y exige respuesta inmediata según protocolo local.",
    difficulty: "alta",
    tags: ["suicidio", "seguridad", "urgencia"],
  },
  {
    id: "caces-025",
    component: "Salud mental y entrevista clínica",
    subcomponent: "Examen mental",
    topic: "Insight y juicio",
    category: "Salud mental y entrevista clínica",
    type: "directa",
    question: "En el examen mental, el insight se refiere a:",
    options: options(
      option("A", "La velocidad del lenguaje espontáneo.", "Corresponde a dimensión de habla."),
      option("B", "La conciencia del paciente sobre su estado y necesidad de ayuda.", "Define reconocimiento de problema y autopercepción clínica."),
      option("C", "La orientación temporoespacial.", "Pertenece a cognición/orientación."),
      option("D", "El contenido delirante exclusivamente.", "No abarca el concepto completo de insight.")
    ),
    correctAnswer: "B",
    explanation: "Insight valora en qué medida la persona reconoce su condición y la necesidad de tratamiento o apoyo.",
    difficulty: "intermedia",
    tags: ["MSE", "insight", "juicio"],
  },
  {
    id: "caces-026",
    component: "Salud mental y entrevista clínica",
    subcomponent: "Etica en salud mental",
    topic: "Confidencialidad en adolescente",
    category: "Salud mental y entrevista clínica",
    type: "caso_clinico",
    question: "En atención a adolescente, ¿cómo se maneja la confidencialidad cuando surge riesgo grave e inminente?",
    options: options(
      option("A", "Se mantiene confidencialidad absoluta en todos los casos.", "Hay excepciones cuando existe riesgo vital o daño grave."),
      option("B", "Se protege confidencialidad, informando límites de seguridad y marco legal.", "Equilibra derechos, protección y deber de cuidado."),
      option("C", "Se informa todo al cuidador sin consentimiento ni explicación.", "Vulnera confianza y autonomía sin justificar proceso."),
      option("D", "Se evita registrar información sensible en historia clínica.", "La documentación clínica segura es obligatoria.")
    ),
    correctAnswer: "B",
    explanation: "La confidencialidad se protege, pero tiene límites ante riesgo grave; esos límites deben explicarse claramente.",
    difficulty: "alta",
    tags: ["etica", "confidencialidad", "adolescencia"],
  },
  {
    id: "caces-027",
    component: "Geriatría y gerontología",
    subcomponent: "Síndromes geriátricos",
    topic: "Delirium agudo en hospitalización",
    category: "Geriatría y gerontología",
    type: "caso_clinico",
    question: "Persona mayor hospitalizada presenta inicio súbito de desorientación, fluctuaciones de atención y alteración del ciclo sueño-vigilia. ¿Qué sospecha clínica es más probable?",
    options: options(
      option("A", "Demencia establecida de inicio gradual.", "La demencia no suele iniciar de manera súbita y fluctuante."),
      option("B", "Delirium, que requiere búsqueda de causa médica precipitando.", "El inicio agudo y fluctuante con inatención orienta a delirium."),
      option("C", "Trastorno de ansiedad generalizada.", "No explica el compromiso agudo de la atención y conciencia."),
      option("D", "Duelo normativo sin compromiso cognitivo.", "No corresponde al cuadro neurocognitivo descrito.")
    ),
    correctAnswer: "B",
    explanation: "El delirium es una urgencia geriátrica: inicio agudo, curso fluctuante e inatención, generalmente asociado a causa médica subyacente.",
    difficulty: "alta",
    tags: ["geriatria", "delirium", "hospitalizacion"],
  },
  {
    id: "caces-028",
    component: "Geriatría y gerontología",
    subcomponent: "Valoración funcional",
    topic: "Fragilidad en adulto mayor",
    category: "Geriatría y gerontología",
    type: "directa",
    question: "¿Cuál hallazgo clínico se asocia de forma más consistente con síndrome de fragilidad?",
    options: options(
      option("A", "Aumento sostenido de masa muscular.", "La fragilidad se asocia más con pérdida de reserva fisiológica."),
      option("B", "Pérdida de peso no intencional y disminución de fuerza.", "Son criterios clásicos de fragilidad."),
      option("C", "Mejora progresiva de velocidad de marcha.", "Es un hallazgo de mejoría funcional, no de fragilidad."),
      option("D", "Ausencia de comorbilidad y autonomía completa.", "No describe un estado de fragilidad.")
    ),
    correctAnswer: "B",
    explanation: "Fragilidad implica disminución de reserva biológica y vulnerabilidad; pérdida ponderal y debilidad son hallazgos clave.",
    difficulty: "intermedia",
    tags: ["geriatria", "fragilidad", "funcionalidad"],
  },
  {
    id: "caces-029",
    component: "Geriatría y gerontología",
    subcomponent: "Seguridad farmacológica",
    topic: "Polifarmacia y riesgo de caídas",
    category: "Geriatría y gerontología",
    type: "caso_clinico",
    question: "Adulta mayor con 9 fármacos diarios presenta dos caídas en un mes. ¿Qué acción inicial de enfermería aporta mayor seguridad?",
    options: options(
      option("A", "Suspender medicación sin coordinación del equipo.", "La suspensión unilateral puede generar eventos adversos."),
      option("B", "Conciliación farmacológica y revisión interdisciplinaria de fármacos de riesgo.", "Permite identificar interacciones y depresores del SNC asociados a caídas."),
      option("C", "Indicar reposo absoluto para prevenir nuevas caídas.", "La inmovilidad aumenta deterioro funcional."),
      option("D", "Reducir líquidos para evitar levantarse de noche.", "Incrementa riesgo de deshidratación y delirium.")
    ),
    correctAnswer: "B",
    explanation: "La polifarmacia debe abordarse con conciliación y revisión estructurada para reducir eventos adversos, incluyendo caídas.",
    difficulty: "alta",
    tags: ["geriatria", "polifarmacia", "caidas"],
  },
  {
    id: "caces-030",
    component: "Geriatría y gerontología",
    subcomponent: "Cuidados de la piel",
    topic: "Prevención de lesiones por presión",
    category: "Geriatría y gerontología",
    type: "directa",
    question: "En una persona mayor con movilidad reducida, ¿qué intervención previene mejor lesiones por presión?",
    options: options(
      option("A", "Cambios posturales programados y cuidado de la humedad cutánea.", "Reduce presión sostenida y maceración."),
      option("B", "Masaje vigoroso sobre prominencias óseas enrojecidas.", "Puede agravar daño tisular en zonas de riesgo."),
      option("C", "Uso de talcos secantes sin valorar piel.", "No reemplaza estrategia integral de prevención."),
      option("D", "Restringir ingesta hídrica para evitar incontinencia.", "Compromete hidratación y perfusión tisular.")
    ),
    correctAnswer: "A",
    explanation: "La prevención combina redistribución de presión, manejo de humedad, nutrición y vigilancia periódica de la piel.",
    difficulty: "basica",
    tags: ["geriatria", "lesiones_por_presion", "prevencion"],
  },
  {
    id: "caces-031",
    component: "Pediatría y neonatología",
    subcomponent: "Valoración inicial",
    topic: "Triángulo de evaluación pediátrica",
    category: "Pediatría y neonatología",
    type: "directa",
    question: "El triángulo de evaluación pediátrica permite valorar de forma rápida:",
    options: options(
      option("A", "Apariencia, respiración y circulación cutánea.", "Es la estructura usada para priorizar gravedad pediátrica."),
      option("B", "Solo peso, talla y perímetro cefálico.", "Son medidas importantes pero no de triage inmediato."),
      option("C", "Únicamente la saturación de oxígeno.", "La valoración inicial pediátrica es más amplia."),
      option("D", "Estado vacunal y antecedentes familiares.", "No corresponde a evaluación de urgencia inmediata.")
    ),
    correctAnswer: "A",
    explanation: "El triángulo pediátrico integra apariencia, trabajo respiratorio y circulación para detectar compromiso clínico temprano.",
    difficulty: "basica",
    tags: ["pediatria", "triaje", "urgencias"],
  },
  {
    id: "caces-032",
    component: "Pediatría y neonatología",
    subcomponent: "Urgencias respiratorias",
    topic: "Bronquiolitis y signos de alarma",
    category: "Pediatría y neonatología",
    type: "caso_clinico",
    question: "Lactante con bronquiolitis presenta tiraje subcostal, aleteo nasal y rechazo marcado de la alimentación. ¿Cuál es la conducta más adecuada?",
    options: options(
      option("A", "Manejo domiciliario sin reevaluación.", "Los signos de dificultad respiratoria requieren valoración prioritaria."),
      option("B", "Derivación urgente para manejo y monitorización respiratoria.", "Los signos descritos indican riesgo de deterioro."),
      option("C", "Indicar antibiótico de rutina.", "La bronquiolitis suele ser viral y no requiere antibiótico sistemático."),
      option("D", "Recomendar solo vaporizaciones caseras.", "No responde al nivel de compromiso clínico actual.")
    ),
    correctAnswer: "B",
    explanation: "La presencia de dificultad respiratoria y mala ingesta en lactante obliga evaluación urgente y soporte oportuno.",
    difficulty: "alta",
    tags: ["pediatria", "bronquiolitis", "alarma"],
  },
  {
    id: "caces-033",
    component: "Pediatría y neonatología",
    subcomponent: "Crecimiento y desarrollo",
    topic: "Hitos del desarrollo del lenguaje",
    category: "Pediatría y neonatología",
    type: "directa",
    question: "En seguimiento del desarrollo, ¿qué acción fortalece una detección oportuna de retraso del lenguaje?",
    options: options(
      option("A", "Evaluar hitos esperados por edad y evolución longitudinal.", "Permite identificar desviaciones respecto al desarrollo esperado."),
      option("B", "Esperar hasta edad escolar para valorar lenguaje.", "Retrasa intervenciones tempranas de alto impacto."),
      option("C", "Comparar únicamente con hermanos mayores.", "No sustituye curvas y hitos de referencia clínica."),
      option("D", "Enfocarse solo en peso y talla.", "El neurodesarrollo también requiere seguimiento sistemático.")
    ),
    correctAnswer: "A",
    explanation: "La vigilancia del desarrollo por hitos y seguimiento temporal permite derivar oportunamente a intervención temprana.",
    difficulty: "intermedia",
    tags: ["pediatria", "desarrollo", "lenguaje"],
  },
  {
    id: "caces-034",
    component: "Pediatría y neonatología",
    subcomponent: "Hidratación y equilibrio",
    topic: "Deshidratación en pediatría",
    category: "Pediatría y neonatología",
    type: "caso_clinico",
    question: "Niño con vómito y diarrea presenta mucosas secas, llanto sin lágrimas y letargia leve. ¿Qué prioridad de cuidado corresponde?",
    options: options(
      option("A", "Iniciar evaluación de hidratación y plan de reposición según severidad.", "Aborda la causa probable y previene progresión del compromiso hemodinámico."),
      option("B", "Restringir líquidos por 24 horas.", "Puede empeorar la deshidratación."),
      option("C", "Esperar evolución espontánea sin intervención.", "Riesgo de deterioro en población pediátrica."),
      option("D", "Indicar antidiarreicos sin valoración integral.", "No es medida prioritaria inicial de seguridad.")
    ),
    correctAnswer: "A",
    explanation: "En pediatría, la valoración clínica de hidratación y rehidratación temprana son prioritarias para evitar complicaciones.",
    difficulty: "intermedia",
    tags: ["pediatria", "deshidratacion", "rehidratacion"],
  },
  {
    id: "caces-035",
    component: "Psicología y psiquiatría",
    subcomponent: "Psicopatología básica",
    topic: "Distinción entre alucinación e ilusión",
    category: "Psicología y psiquiatría",
    type: "directa",
    question: "¿Qué enunciado diferencia correctamente una alucinación de una ilusión?",
    options: options(
      option("A", "La alucinación es percepción sin estímulo externo; la ilusión distorsiona un estímulo real.", "Define adecuadamente ambos fenómenos perceptivos."),
      option("B", "Ambas son producto de simulación consciente de forma sistemática.", "No corresponde a la clínica psicopatológica."),
      option("C", "La ilusión se presenta rara vez en cuadros orgánicos.", "Puede presentarse en múltiples condiciones clínicas."),
      option("D", "La alucinación implica de forma sistemática orientación conservada.", "No es criterio definitorio.")
    ),
    correctAnswer: "A",
    explanation: "Alucinación: percepción sin objeto real. Ilusión: interpretación errónea de un estímulo existente.",
    difficulty: "intermedia",
    tags: ["psiquiatria", "psicopatologia", "percepcion"],
  },
  {
    id: "caces-036",
    component: "Psicología y psiquiatría",
    subcomponent: "Trastornos del estado de ánimo",
    topic: "Síntomas nucleares de episodio maníaco",
    category: "Psicología y psiquiatría",
    type: "caso_clinico",
    question: "Paciente refiere 6 días con euforia persistente, disminución de necesidad de sueño, verborrea e incremento de conductas de riesgo. ¿Qué hallazgo apoya episodio maníaco/hipomaníaco?",
    options: options(
      option("A", "Enlentecimiento psicomotor marcado.", "Se asocia más a depresión severa."),
      option("B", "Aumento patológico de energía y disminución de sueño con impacto funcional.", "Es un núcleo clínico del espectro maníaco."),
      option("C", "Aislamiento social progresivo por meses sin cambios de ánimo.", "No describe la polaridad expansiva típica."),
      option("D", "Desorientación fluctuante aguda.", "Orienta más a delirium u otra causa orgánica aguda.")
    ),
    correctAnswer: "B",
    explanation: "La elevación/expansión del ánimo con aumento de energía y menor sueño, más deterioro funcional, orienta a episodio maniforme.",
    difficulty: "alta",
    tags: ["psiquiatria", "mania", "diagnostico_orientativo"],
  },
  {
    id: "caces-037",
    component: "Psicología y psiquiatría",
    subcomponent: "Urgencias psiquiátricas",
    topic: "Manejo inicial de agitación",
    category: "Psicología y psiquiatría",
    type: "caso_clinico",
    question: "En urgencias, un paciente con agitación severa grita y amenaza al personal. ¿Cuál es la secuencia inicial más segura?",
    options: options(
      option("A", "Confrontar verbalmente para imponer autoridad.", "Escala el conflicto y aumenta riesgo."),
      option("B", "Desescalada verbal, evaluación de riesgo y activación de protocolo de seguridad.", "Prioriza contención terapéutica y protección del equipo."),
      option("C", "Ignorar al paciente hasta que se calme.", "Omite intervención ante riesgo inmediato."),
      option("D", "Aplicar sujeción física sin valoración previa.", "Debe reservarse y protocolizarse según indicación clínica.")
    ),
    correctAnswer: "B",
    explanation: "La desescalada y evaluación estructurada de riesgo son la primera línea para reducir daño en crisis psiquiátrica.",
    difficulty: "alta",
    tags: ["psiquiatria", "agitación", "seguridad"],
  },
  {
    id: "caces-038",
    component: "Psicología y psiquiatría",
    subcomponent: "Relación terapéutica",
    topic: "Límites profesionales",
    category: "Psicología y psiquiatría",
    type: "directa",
    question: "¿Qué conducta protege mejor los límites terapéuticos en salud mental?",
    options: options(
      option("A", "Mantener comunicación clínica en canales institucionales y objetivos terapéuticos claros.", "Disminuye riesgos de confusión de roles."),
      option("B", "Aceptar favores personales para fortalecer vínculo.", "Puede comprometer neutralidad y ética profesional."),
      option("C", "Compartir problemas personales para generar cercanía.", "Desplaza foco terapéutico del paciente."),
      option("D", "Evitar documentar interacciones relevantes.", "Vulnera trazabilidad clínica.")
    ),
    correctAnswer: "A",
    explanation: "La claridad de roles y registro clínico en canales formales protege la alianza terapéutica y la ética asistencial.",
    difficulty: "basica",
    tags: ["etica", "salud_mental", "relacion_terapeutica"],
  },
  {
    id: "caces-039",
    component: "Procesos y gestión del cuidado",
    subcomponent: "Priorización clínica",
    topic: "Enfoque ABC en enfermería",
    category: "Procesos y gestión del cuidado",
    type: "directa",
    question: "En un escenario con múltiples pacientes, el enfoque ABC orienta priorización porque primero atiende:",
    options: options(
      option("A", "Compromiso de vía aérea y respiración.", "A y B amenazan la vida de forma inmediata."),
      option("B", "Solicitudes administrativas pendientes.", "No son prioridad frente a riesgo vital."),
      option("C", "Necesidades de confort no urgentes.", "Son importantes, pero posteriores a estabilización."),
      option("D", "Orden de llegada al servicio únicamente.", "La prioridad clínica no depende solo del orden de ingreso.")
    ),
    correctAnswer: "A",
    explanation: "La priorización ABC permite identificar y tratar primero amenazas vitales inmediatas.",
    difficulty: "basica",
    tags: ["priorizacion", "ABC", "seguridad"],
  },
  {
    id: "caces-040",
    component: "Procesos y gestión del cuidado",
    subcomponent: "Comunicación clínica",
    topic: "Entrega de turno con SBAR",
    category: "Procesos y gestión del cuidado",
    type: "caso_clinico",
    question: "Durante el pase de guardia se omite información sobre alergia medicamentosa y ocurre casi-evento. ¿Qué herramienta reduce este riesgo?",
    options: options(
      option("A", "Reporte libre sin estructura.", "Aumenta omisiones de datos críticos."),
      option("B", "Comunicación estructurada tipo SBAR.", "Estandariza información esencial en transición asistencial."),
      option("C", "Mensajes informales por chat personal.", "No garantiza trazabilidad ni completitud."),
      option("D", "Memoria del personal de turno.", "No es barrera de seguridad suficiente.")
    ),
    correctAnswer: "B",
    explanation: "SBAR mejora continuidad del cuidado al ordenar situación, antecedentes, evaluación y recomendación.",
    difficulty: "intermedia",
    tags: ["SBAR", "pase_de_guardia", "seguridad"],
  },
  {
    id: "caces-041",
    component: "Procesos y gestión del cuidado",
    subcomponent: "Registros clínicos",
    topic: "Calidad del registro enfermero",
    category: "Procesos y gestión del cuidado",
    type: "directa",
    question: "Un registro de enfermería de alta calidad debe ser:",
    options: options(
      option("A", "Objetivo, cronológico, legible y verificable.", "Cumple criterios técnicos y legales del registro clínico."),
      option("B", "Basado en suposiciones para ahorrar tiempo.", "Las suposiciones comprometen seguridad y validez legal."),
      option("C", "Redactado solo al final del turno.", "Aumenta omisiones y sesgos de memoria."),
      option("D", "Exclusivamente verbal entre turnos.", "No sustituye documentación formal.")
    ),
    correctAnswer: "A",
    explanation: "El registro clínico debe reflejar hechos, tiempos e intervenciones con precisión para continuidad y seguridad del paciente.",
    difficulty: "basica",
    tags: ["registro", "calidad", "legal"],
  },
  {
    id: "caces-042",
    component: "Procesos y gestión del cuidado",
    subcomponent: "Mejora continua",
    topic: "Uso de indicadores de calidad",
    category: "Procesos y gestión del cuidado",
    type: "caso_clinico",
    question: "Un servicio detecta aumento de infecciones asociadas a catéter. ¿Qué enfoque de mejora es más apropiado?",
    options: options(
      option("A", "Culpar individualmente al último profesional del turno.", "No aborda causas sistémicas del problema."),
      option("B", "Analizar indicador, causas raíz e implementar plan con auditoría de cumplimiento.", "Integra medición, intervención y seguimiento."),
      option("C", "Suspender el indicador para evitar reportes negativos.", "Oculta riesgo y dificulta mejora."),
      option("D", "Cambiar solo el formato de registro.", "Medida aislada sin abordar procesos críticos.")
    ),
    correctAnswer: "B",
    explanation: "La mejora de calidad exige análisis de procesos, implementación de barreras y reevaluación del indicador.",
    difficulty: "alta",
    tags: ["calidad", "indicadores", "mejora_continua"],
  },
  {
    id: "caces-043",
    component: "Farmacología clínica",
    subcomponent: "Seguridad en medicación",
    topic: "Principios de administración segura",
    category: "Farmacología clínica",
    type: "directa",
    question: "¿Cuál conjunto describe mejor una administración segura de medicamentos?",
    options: options(
      option("A", "Paciente correcto, medicamento correcto, dosis correcta, vía correcta y hora correcta.", "Resume verificaciones esenciales para seguridad farmacológica."),
      option("B", "Administrar rápido cuando hay alta demanda asistencial.", "La velocidad no sustituye verificación de seguridad."),
      option("C", "Confiar solo en memoria de la prescripción.", "Aumenta riesgo de error."),
      option("D", "Omitir doble chequeo en fármacos de alto riesgo.", "Incrementa probabilidad de daño prevenible.")
    ),
    correctAnswer: "A",
    explanation: "La verificación sistemática de elementos críticos reduce errores de medicación y eventos adversos.",
    difficulty: "basica",
    tags: ["farmacologia", "seguridad", "medicacion"],
  },
  {
    id: "caces-044",
    component: "Farmacología clínica",
    subcomponent: "Medicamentos de alto riesgo",
    topic: "Insulina y doble verificación",
    category: "Farmacología clínica",
    type: "caso_clinico",
    question: "En una sala con alta carga laboral, se prescribe insulina rápida en dosis variable. ¿Qué medida previene errores graves?",
    options: options(
      option("A", "Administrar según cálculo mental del profesional de turno.", "La improvisación aumenta riesgo de dosificación errónea."),
      option("B", "Aplicar doble verificación independiente antes de administrar.", "Es una barrera crítica en medicamentos de alto riesgo."),
      option("C", "Posponer dosis hasta el siguiente turno.", "Puede provocar descompensación glucémica."),
      option("D", "Unificar todas las dosis para simplificar tiempos.", "Ignora individualización terapéutica.")
    ),
    correctAnswer: "B",
    explanation: "La insulina es de alto riesgo; la doble verificación independiente disminuye errores de dosis y de paciente.",
    difficulty: "intermedia",
    tags: ["farmacologia", "insulina", "alto_riesgo"],
  },
  {
    id: "caces-045",
    component: "Farmacología clínica",
    subcomponent: "Educación terapéutica",
    topic: "Anticoagulantes y seguridad",
    category: "Farmacología clínica",
    type: "directa",
    question: "En educación a paciente con anticoagulante oral, ¿qué contenido es prioritario?",
    options: options(
      option("A", "Reconocer signos de sangrado y cuándo consultar de inmediato.", "La detección temprana de alarma reduce complicaciones graves."),
      option("B", "Suspender medicamento ante cualquier moretón sin consulta.", "La suspensión no supervisada puede aumentar riesgo trombótico."),
      option("C", "Duplicar dosis si olvida una toma.", "Puede provocar sobreanticoagulación."),
      option("D", "Evitar todo control clínico para no generar ansiedad.", "El seguimiento es parte esencial de seguridad.")
    ),
    correctAnswer: "A",
    explanation: "La adherencia segura incluye reconocer señales de sangrado, interacciones y rutas de consulta oportuna.",
    difficulty: "intermedia",
    tags: ["farmacologia", "anticoagulantes", "educacion"],
  },
  {
    id: "caces-046",
    component: "Farmacología clínica",
    subcomponent: "Farmacovigilancia",
    topic: "Evento adverso medicamentoso",
    category: "Farmacología clínica",
    type: "caso_clinico",
    question: "Paciente desarrolla rash y disnea minutos después de iniciar antibiótico IV. ¿Qué acción inicial corresponde?",
    options: options(
      option("A", "Continuar infusión y observar evolución.", "Puede agravar reacción de hipersensibilidad."),
      option("B", "Suspender administración, activar respuesta de emergencia y notificar evento.", "Prioriza seguridad inmediata y trazabilidad del evento."),
      option("C", "Esperar a que termine la dosis para reportar.", "Demora la intervención ante potencial anafilaxia."),
      option("D", "Registrar solo al alta para evitar alarmar al paciente.", "No cumple criterios de seguridad clínica.")
    ),
    correctAnswer: "B",
    explanation: "Ante sospecha de reacción grave se interrumpe el fármaco, se maneja la emergencia y se notifica farmacovigilancia.",
    difficulty: "alta",
    tags: ["farmacologia", "evento_adverso", "farmacovigilancia"],
  },
  {
    id: "caces-047",
    component: "Morfofisiología aplicada",
    subcomponent: "Sistema respiratorio",
    topic: "Intercambio gaseoso",
    category: "Morfofisiología aplicada",
    type: "directa",
    question: "El intercambio gaseoso ocurre principalmente en:",
    options: options(
      option("A", "Bronquios segmentarios.", "Su función principal es conducción de aire."),
      option("B", "Alvéolos y membrana alveolocapilar.", "Es el sitio donde difunden oxígeno y dióxido de carbono."),
      option("C", "Pleura visceral.", "No es la estructura principal de hematosis."),
      option("D", "Tráquea cervical.", "Cumple función de paso de aire, no de intercambio.")
    ),
    correctAnswer: "B",
    explanation: "La hematosis se realiza en la unidad alveolocapilar por gradiente de presión parcial de gases.",
    difficulty: "basica",
    tags: ["morfofisiologia", "respiratorio", "alvéolos"],
  },
  {
    id: "caces-048",
    component: "Morfofisiología aplicada",
    subcomponent: "Sistema cardiovascular",
    topic: "Respuesta fisiológica al shock hipovolémico",
    category: "Morfofisiología aplicada",
    type: "caso_clinico",
    question: "Paciente con hemorragia aguda presenta taquicardia, piel fría y llenado capilar lento. ¿Qué mecanismo fisiológico explica estos hallazgos?",
    options: options(
      option("A", "Vasodilatación periférica sostenida con gasto cardiaco estable.", "No concuerda con compensación simpática inicial."),
      option("B", "Activación simpática con vasoconstricción periférica compensatoria.", "Explica taquicardia y signos de perfusión periférica disminuida."),
      option("C", "Disminución del tono adrenérgico por homeostasis completa.", "Incompatible con estado de shock."),
      option("D", "Aumento súbito de volumen intravascular efectivo.", "No corresponde a pérdida aguda de volumen.")
    ),
    correctAnswer: "B",
    explanation: "En shock hipovolémico temprano predomina respuesta simpática para preservar perfusión de órganos vitales.",
    difficulty: "intermedia",
    tags: ["morfofisiologia", "shock", "hemodinamia"],
  },
  {
    id: "caces-049",
    component: "Morfofisiología aplicada",
    subcomponent: "Sistema renal",
    topic: "Marcadores de función renal",
    category: "Morfofisiología aplicada",
    type: "directa",
    question: "¿Cuál parámetro orienta de manera útil al seguimiento de función renal en contexto clínico?",
    options: options(
      option("A", "Creatinina sérica junto con diuresis y contexto clínico.", "Aporta aproximación funcional cuando se interpreta de forma integral."),
      option("B", "Frecuencia respiratoria aislada.", "No es marcador directo de función renal."),
      option("C", "Color de piel sin otros datos.", "Insuficiente para estimar función renal."),
      option("D", "Nivel de ansiedad autorreportada.", "No es marcador fisiológico renal.")
    ),
    correctAnswer: "A",
    explanation: "La función renal se evalúa combinando marcadores bioquímicos y datos clínicos como diuresis y perfusión.",
    difficulty: "basica",
    tags: ["morfofisiologia", "renal", "valoracion_clinica"],
  },
  {
    id: "caces-050",
    component: "Morfofisiología aplicada",
    subcomponent: "Equilibrio ácido-base",
    topic: "Compensación respiratoria",
    category: "Morfofisiología aplicada",
    type: "caso_clinico",
    question: "Paciente con acidosis metabólica presenta respiración profunda y rápida. ¿Cómo se interpreta este patrón?",
    options: options(
      option("A", "Compensación respiratoria para reducir CO2.", "La hiperventilación ayuda a amortiguar descenso del pH."),
      option("B", "Signo exclusivo de ansiedad sin relación metabólica.", "Puede ser ansioso, pero aquí encaja compensación fisiológica."),
      option("C", "Evidencia de alcalosis metabólica primaria.", "No corresponde al cuadro descrito."),
      option("D", "Respuesta normal sin relevancia clínica.", "Tiene valor clínico para interpretación ácido-base.")
    ),
    correctAnswer: "A",
    explanation: "La hiperventilación compensatoria disminuye CO2 y atenúa la acidosis metabólica.",
    difficulty: "intermedia",
    tags: ["morfofisiologia", "acido_base", "compensacion"],
  },
  {
    id: "caces-051",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Sepsis",
    topic: "Paquete inicial de sepsis",
    category: "Cuidados críticos y urgencias",
    type: "caso_clinico",
    question: "Paciente con sospecha de sepsis presenta hipotensión y lactato elevado. ¿Qué acción temprana mejora pronóstico?",
    options: options(
      option("A", "Demorar antibiótico hasta confirmar cultivo final.", "La demora terapéutica aumenta riesgo de mortalidad."),
      option("B", "Activar protocolo de sepsis con medidas iniciales dentro de la primera hora.", "La respuesta temprana es crítica para resultados clínicos."),
      option("C", "Esperar observación de 12 horas sin intervenciones.", "No corresponde al riesgo vital presente."),
      option("D", "Administrar sedación como medida principal.", "No trata la causa ni estabiliza hemodinámica.")
    ),
    correctAnswer: "B",
    explanation: "La implementación temprana del paquete de sepsis (evaluación, antibiótico, fluidos según criterio) se asocia a menor mortalidad.",
    difficulty: "alta",
    tags: ["urgencias", "sepsis", "protocolo"],
  },
  {
    id: "caces-052",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Neuroemergencias",
    topic: "Código ictus",
    category: "Cuidados críticos y urgencias",
    type: "caso_clinico",
    question: "Paciente inicia súbitamente desviación facial y hemiparesia hace 40 minutos. ¿Cuál prioridad asistencial corresponde?",
    options: options(
      option("A", "Programar consulta ambulatoria en 48 horas.", "Pierde ventana terapéutica de alta relevancia."),
      option("B", "Activar código ictus y evaluación inmediata por tiempo-dependencia.", "El manejo del ACV isquémico es crítico en minutos."),
      option("C", "Administrar analgésico y observar en sala general.", "No aborda urgencia neurológica."),
      option("D", "Solicitar solo rehabilitación física inicial.", "La fase aguda requiere diagnóstico y estabilización urgente.")
    ),
    correctAnswer: "B",
    explanation: "El ACV agudo es tiempo-dependiente; la activación temprana de ruta mejora elegibilidad terapéutica.",
    difficulty: "alta",
    tags: ["urgencias", "ictus", "codigo"],
  },
  {
    id: "caces-053",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Trauma",
    topic: "Evaluación primaria",
    category: "Cuidados críticos y urgencias",
    type: "directa",
    question: "En trauma, la evaluación primaria sistemática prioriza:",
    options: options(
      option("A", "ABCDE para identificar y tratar amenazas vitales inmediatas.", "Es el enfoque recomendado en fase inicial del trauma."),
      option("B", "Historia clínica extensa antes de estabilizar.", "La información detallada puede esperar tras estabilización."),
      option("C", "Pruebas de laboratorio completas como primer paso.", "No deben retrasar medidas de soporte vital."),
      option("D", "Alta precoz si el dolor cede transitoriamente.", "Puede ocultar lesiones de riesgo.")
    ),
    correctAnswer: "A",
    explanation: "El esquema ABCDE permite ordenar decisiones y tratar de inmediato condiciones potencialmente letales.",
    difficulty: "intermedia",
    tags: ["urgencias", "trauma", "ABCDE"],
  },
  {
    id: "caces-054",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Triage",
    topic: "Dolor torácico de alto riesgo",
    category: "Cuidados críticos y urgencias",
    type: "caso_clinico",
    question: "Paciente con dolor torácico opresivo, diaforesis y náusea activa ingresa al triaje. ¿Cuál es la prioridad?",
    options: options(
      option("A", "Clasificar como no urgente y esperar turno general.", "Puede retrasar manejo de síndrome coronario."),
      option("B", "Priorizar atención inmediata y monitorización protocolizada.", "El cuadro sugiere riesgo cardiovascular agudo."),
      option("C", "Indicar reposo domiciliario con control diferido.", "No es seguro frente a signos de alarma."),
      option("D", "Administrar ansiolítico y reevaluar al final.", "No sustituye evaluación cardiovascular urgente.")
    ),
    correctAnswer: "B",
    explanation: "Los síntomas de alarma en dolor torácico requieren prioridad alta para descartar y tratar eventos coronarios agudos.",
    difficulty: "alta",
    tags: ["urgencias", "dolor_toracico", "triaje"],
  },
  {
    id: "caces-055",
    component: "Ginecología y salud sexual",
    subcomponent: "Emergencias obstétricas",
    topic: "Signos de preeclampsia grave",
    category: "Ginecología y salud sexual",
    type: "caso_clinico",
    question: "Gestante de 32 semanas consulta por cefalea intensa, fosfenos y dolor en epigastrio. ¿Cuál acción inicial es prioritaria?",
    options: options(
      option("A", "Derivar a control prenatal rutinario en próxima semana.", "Demora manejo de potencial emergencia hipertensiva."),
      option("B", "Activar evaluación obstétrica urgente por sospecha de preeclampsia grave.", "Los síntomas son signos de alarma materno-fetal."),
      option("C", "Recomendar hidratación oral y reposo domiciliario.", "Insuficiente ante riesgo clínico alto."),
      option("D", "Indicar analgésico y alta sin monitorización.", "Puede omitir complicación grave.")
    ),
    correctAnswer: "B",
    explanation: "Cefalea intensa, fosfenos y epigastralgia en gestación son signos de alarma que requieren atención obstétrica urgente.",
    difficulty: "alta",
    tags: ["ginecologia", "obstetricia", "preeclampsia"],
  },
  {
    id: "caces-056",
    component: "Ginecología y salud sexual",
    subcomponent: "Puerperio",
    topic: "Hemorragia posparto",
    category: "Ginecología y salud sexual",
    type: "caso_clinico",
    question: "En puerperio inmediato se evidencia sangrado abundante y útero atónico. ¿Qué intervención inicial es clave junto al aviso del equipo?",
    options: options(
      option("A", "Masaje uterino y control hemodinámico inmediato.", "Ayuda a mejorar tono uterino y ganar tiempo terapéutico."),
      option("B", "Esperar 30 minutos para confirmar volumen exacto.", "Retrasa respuesta ante una emergencia obstétrica."),
      option("C", "Retirar monitorización para confort de la paciente.", "Reduce vigilancia en escenario crítico."),
      option("D", "Indicar deambulación para estimular contracción.", "No es una medida segura en esta situación.")
    ),
    correctAnswer: "A",
    explanation: "Ante atonía uterina y sangrado activo se requiere respuesta inmediata, masaje uterino y estabilización hemodinámica con protocolo.",
    difficulty: "alta",
    tags: ["ginecologia", "puerperio", "hemorragia"],
  },
  {
    id: "caces-057",
    component: "Ginecología y salud sexual",
    subcomponent: "Prevención y tamizaje",
    topic: "Tamizaje de cáncer cervicouterino",
    category: "Ginecología y salud sexual",
    type: "directa",
    question: "El objetivo central del tamizaje de cáncer cervicouterino es:",
    options: options(
      option("A", "Detectar lesiones precursoras de forma temprana para tratamiento oportuno.", "La detección temprana reduce progresión y mortalidad."),
      option("B", "Confirmar infertilidad en mujeres jóvenes.", "No corresponde a finalidad del tamizaje cervicouterino."),
      option("C", "Reemplazar completamente la consulta ginecológica.", "Es parte del control integral, no su sustituto."),
      option("D", "Indicar antibióticos preventivos de rutina.", "No guarda relación con el objetivo de tamizaje.")
    ),
    correctAnswer: "A",
    explanation: "El tamizaje busca detectar alteraciones precancerosas para intervención temprana y reducción del riesgo oncológico.",
    difficulty: "basica",
    tags: ["ginecologia", "tamizaje", "prevencion"],
  },
  {
    id: "caces-058",
    component: "Ginecología y salud sexual",
    subcomponent: "Atención a violencia sexual",
    topic: "Primer contacto clínico con enfoque de derechos",
    category: "Ginecología y salud sexual",
    type: "caso_clinico",
    question: "Una paciente refiere agresión sexual reciente. ¿Qué enfoque inicial es clínicamente y éticamente adecuado?",
    options: options(
      option("A", "Interrogar con preguntas culpabilizantes para validar relato.", "Revictimiza y rompe enfoque de derechos."),
      option("B", "Atención confidencial, contención emocional, valoración médica y activación de ruta institucional.", "Integra seguridad, dignidad y continuidad del cuidado."),
      option("C", "Posponer la atención hasta contar con denuncia formal.", "La atención clínica no debe condicionarse a trámite legal previo."),
      option("D", "Limitarse a registrar datos mínimos sin orientar apoyos.", "No cubre necesidades integrales de la persona.")
    ),
    correctAnswer: "B",
    explanation: "La atención debe ser inmediata, confidencial y centrada en derechos, articulando soporte clínico, psicológico y legal según protocolo.",
    difficulty: "alta",
    tags: ["ginecologia", "violencia_sexual", "enfoque_derechos"],
  },
  {
    id: "caces-vac-001",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Inmunizaciones",
    topic: "Inicio de esquema en lactante",
    category: "Cuidado familiar, comunitario e intercultural",
    type: "caso_clinico",
    question: "Lactante de 2 meses acude a control y solo recibió vacunas del nacimiento. Está afebril y sin contraindicaciones reales. ¿Cuál es la conducta correcta en esta visita?",
    options: options(
      option("A", "Iniciar esquema correspondiente a su edad en la misma consulta, registrar dosis y agendar próximas aplicaciones.", "Evita oportunidades perdidas y asegura continuidad del esquema."),
      option("B", "Esperar al siguiente mes para aplicar varias vacunas juntas.", "Retrasa la protección sin justificación clínica."),
      option("C", "Repetir únicamente vacunas del nacimiento para reiniciar el calendario.", "No corresponde repetir de forma indiscriminada las dosis neonatales."),
      option("D", "Posponer inmunización hasta que inicie alimentación complementaria.", "La alimentación complementaria no es requisito para vacunar a los 2 meses.")
    ),
    correctAnswer: "A",
    explanation: "En ausencia de contraindicaciones reales, se debe aplicar en la misma visita las vacunas indicadas para la edad y dejar plan de seguimiento.",
    difficulty: "basica",
    tags: ["vacunacion", "esquema_vacunal", "lactante", "caso_clinico"],
  },
  {
    id: "caces-vac-002",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Inmunizaciones",
    topic: "Esquema atrasado en niño",
    category: "Cuidado familiar, comunitario e intercultural",
    type: "caso_clinico",
    question: "Niño de 3 años llega con carné incompleto y atraso de varias dosis. ¿Qué principio guía la recuperación del esquema?",
    options: options(
      option("A", "Reiniciar todas las series desde cero para evitar errores.", "No se reinician series completas por atraso; se completan dosis faltantes."),
      option("B", "Aplicar solo una vacuna por visita para disminuir molestias.", "Puede prolongar retrasos y mantener riesgo prevenible."),
      option("C", "Completar dosis faltantes según esquema de rescate e intervalos mínimos, sin reiniciar series válidas.", "Es el enfoque técnico correcto para recuperar cobertura."),
      option("D", "Esperar a que cumpla 5 años para unificar refuerzos.", "Demora innecesariamente la protección del niño.")
    ),
    correctAnswer: "C",
    explanation: "Ante esquemas atrasados, se realiza recuperación con intervalos mínimos y se completan dosis pendientes, respetando las ya válidas.",
    difficulty: "intermedia",
    tags: ["vacunacion", "esquema_atrasado", "pediatria", "caso_clinico"],
  },
  {
    id: "caces-vac-003",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Control prenatal",
    topic: "Vacunación durante el embarazo",
    category: "Mujer, recién nacido, niño y adolescente",
    type: "caso_clinico",
    question: "Gestante de 28 semanas, sin registro de vacunas en el embarazo actual, consulta en control prenatal. ¿Qué acción de enfermería es más adecuada?",
    options: options(
      option("A", "Verificar antecedentes, aplicar vacunas recomendadas en gestación según normativa vigente y educar sobre su beneficio materno-neonatal.", "Integra seguridad, prevención y educación basada en riesgo-beneficio."),
      option("B", "Diferir toda vacunación al posparto para evitar eventos adversos.", "Posponer sin criterio reduce protección en etapa de riesgo."),
      option("C", "Aplicar solo vitaminas y dejar vacunas para consulta médica posterior.", "No aprovecha la oportunidad preventiva durante control prenatal."),
      option("D", "Vacunar únicamente si la paciente presenta fiebre o infección activa.", "La fiebre no es indicación para vacunar; incluso puede ser motivo de diferimiento temporal.")
    ),
    correctAnswer: "A",
    explanation: "La gestación requiere revisión activa del estado vacunal y aplicación oportuna de vacunas recomendadas por normativa para proteger madre y recién nacido.",
    difficulty: "intermedia",
    tags: ["vacunacion", "gestacion", "prenatal", "caso_clinico"],
  },
  {
    id: "caces-vac-004",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Salud del adolescente",
    topic: "Refuerzos en adolescencia",
    category: "Mujer, recién nacido, niño y adolescente",
    type: "caso_clinico",
    question: "Adolescente de 11 años acude para certificación escolar y su carné no registra refuerzos recientes. ¿Cuál es la intervención correcta?",
    options: options(
      option("A", "Emitir certificado temporal y citar en seis meses para revisar vacunas.", "Mantiene susceptibilidad y retrasa acciones preventivas."),
      option("B", "Aplicar dosis de refuerzo y vacunas indicadas para su edad según esquema nacional, con registro y cita de seguimiento.", "Alinea prevención escolar con recuperación oportuna del esquema."),
      option("C", "Indicar que ya no requiere vacunas por haber completado infancia temprana.", "En adolescencia existen refuerzos y vacunas específicas por edad."),
      option("D", "Vacunar solo si presenta comorbilidad documentada.", "La vacunación del adolescente no depende solo de comorbilidades.")
    ),
    correctAnswer: "B",
    explanation: "En adolescencia se deben verificar y actualizar refuerzos o vacunas indicadas por edad, asegurando registro y continuidad.",
    difficulty: "intermedia",
    tags: ["vacunacion", "adolescente", "refuerzos", "caso_clinico"],
  },
  {
    id: "caces-vac-005",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Profilaxis postexposición",
    topic: "Profilaxis antitetánica",
    category: "Cuidados críticos y urgencias",
    type: "caso_clinico",
    question: "Paciente con herida contaminada por metal y antecedente vacunal antitetánico incierto. ¿Qué decisión es clínicamente correcta?",
    options: options(
      option("A", "Indicar solo curación local porque la herida fue reciente.", "La limpieza local no sustituye la profilaxis específica."),
      option("B", "Administrar antibiótico profiláctico y omitir valoración vacunal.", "No reemplaza la prevención específica de tétanos."),
      option("C", "Valorar tipo de herida y antecedente para indicar vacuna antitetánica y, si corresponde, inmunoglobulina según protocolo.", "Es la conducta basada en riesgo y estado de inmunización."),
      option("D", "Esperar signos de infección antes de decidir inmunización.", "La profilaxis es preventiva y no debe diferirse hasta aparición de síntomas.")
    ),
    correctAnswer: "C",
    explanation: "La profilaxis antitetánica se define por riesgo de la herida y estado vacunal: puede requerir vacuna y/o inmunoglobulina de forma oportuna.",
    difficulty: "alta",
    tags: ["vacunacion", "tetanos", "urgencias", "caso_clinico"],
  },
];

type ExtraClinicalCaseTheme = {
  category: string;
  component: string;
  subcomponent: string;
  topic: string;
  scenario: string;
  primaryAction: string;
  primaryWrongs: [string, string, string];
  followupAction: string;
  explanation: string;
  difficulty: CacesDifficulty;
  tags: string[];
};

function buildExtraClinicalCaseOptions(args: {
  correctLetter: CacesOptionId;
  correctText: string;
  wrongs: [string, string, string];
  correctRationale: string;
}) {
  const letters: CacesOptionId[] = ["A", "B", "C", "D"];
  const wrongQueue = [...args.wrongs];
  const mapped = letters.map((letter) => {
    if (letter === args.correctLetter) {
      return option(letter, args.correctText, args.correctRationale);
    }
    const wrongText = String(wrongQueue.shift() ?? "Alternativa incompleta.");
    return option(
      letter,
      wrongText,
      "No prioriza seguridad clínica, continuidad del cuidado y toma de decisiones basada en valoración."
    );
  }) as [
    CacesQuestionOption,
    CacesQuestionOption,
    CacesQuestionOption,
    CacesQuestionOption,
  ];

  return options(mapped[0], mapped[1], mapped[2], mapped[3]);
}

function followupDifficulty(level: CacesDifficulty): CacesDifficulty {
  if (level === "basica") return "intermedia";
  return level;
}

const EXTRA_CLINICAL_FOLLOWUP_WRONGS: [string, string, string] = [
  "Cerrar la atención sin documentar la intervención en carné o registro clínico.",
  "Diferir la reevaluación para la próxima consulta sin fecha definida.",
  "Limitarse a una recomendación general sin verificar comprensión del paciente o cuidador.",
];

const EXTRA_CLINICAL_CASE_THEMES: ExtraClinicalCaseTheme[] = [
  {
    category: "Cuidado familiar, comunitario e intercultural",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Inmunizaciones",
    topic: "Inicio oportuno del esquema infantil",
    scenario:
      "Lactante de 2 meses llega con carné incompleto y se encuentra clínicamente estable, sin contraindicaciones reales",
    primaryAction:
      "Aplicar vacunas indicadas para su edad en la misma visita, registrar dosis y agendar control.",
    primaryWrongs: [
      "Diferir inmunización por ansiedad de los cuidadores sin brindar consejería.",
      "Reiniciar todo el esquema desde cero ignorando dosis válidas.",
      "Esperar nueva cita sin intervención para reducir número de inyecciones.",
    ],
    followupAction:
      "Educar a cuidadores sobre eventos esperables, signos de alarma y fecha exacta de próxima dosis.",
    explanation:
      "Aprovechar cada contacto reduce oportunidades perdidas y mejora cobertura efectiva en lactantes.",
    difficulty: "basica",
    tags: ["vacunacion", "lactante", "esquema_vacunal"],
  },
  {
    category: "Cuidado familiar, comunitario e intercultural",
    component: "Cuidado familiar, comunitario e intercultural",
    subcomponent: "Inmunizaciones",
    topic: "Recuperación de esquema atrasado en preescolar",
    scenario:
      "Niño de 4 años acude con varias dosis pendientes y carné parcialmente actualizado",
    primaryAction:
      "Planificar recuperación con intervalos mínimos según normativa vigente, completando dosis faltantes sin reiniciar series válidas.",
    primaryWrongs: [
      "Iniciar nuevamente todas las series para simplificar el control.",
      "Aplicar una sola dosis y suspender el resto hasta el siguiente año lectivo.",
      "Posponer vacunación hasta disponer de un nuevo carné impreso.",
    ],
    followupAction:
      "Entregar plan escrito de recuperación con fechas concretas y verificar comprensión del cuidador.",
    explanation:
      "El esquema atrasado se recupera completando dosis pendientes con intervalos mínimos y seguimiento activo.",
    difficulty: "intermedia",
    tags: ["vacunacion", "esquema_atrasado", "preescolar"],
  },
  {
    category: "Mujer, recién nacido, niño y adolescente",
    component: "Mujer, recién nacido, niño y adolescente",
    subcomponent: "Control prenatal",
    topic: "Vacunación recomendada en gestación",
    scenario:
      "Gestante de 29 semanas acude a control prenatal sin registro vacunal del embarazo actual",
    primaryAction:
      "Verificar antecedentes, aplicar vacunas recomendadas en gestación según normativa vigente y registrar en control prenatal.",
    primaryWrongs: [
      "Posponer toda vacuna hasta el puerperio por precaución general.",
      "Esperar únicamente indicación en hospital para cualquier inmunización.",
      "Aplicar solo suplementación y omitir consejería preventiva.",
    ],
    followupAction:
      "Reforzar educación sobre beneficio materno-neonatal y coordinar siguiente control con revisión del estado vacunal.",
    explanation:
      "La vacunación oportuna durante gestación reduce riesgo de enfermedad prevenible en madre y recién nacido.",
    difficulty: "intermedia",
    tags: ["vacunacion", "gestacion", "prenatal"],
  },
  {
    category: "Procesos y gestión del cuidado",
    component: "Procesos y gestión del cuidado",
    subcomponent: "Salud ocupacional",
    topic: "Vacunación del personal sanitario",
    scenario:
      "Profesional de nuevo ingreso en hospital no presenta evidencia documental de esquema ocupacional completo",
    primaryAction:
      "Evaluar riesgo laboral, iniciar o completar vacunas ocupacionales según protocolo y registrar en salud ocupacional.",
    primaryWrongs: [
      "Permitir atención directa sin revisar estado vacunal por falta de tiempo.",
      "Asumir inmunidad previa por antecedente verbal del profesional.",
      "Posponer la evaluación vacunal hasta la primera exposición biológica.",
    ],
    followupAction:
      "Programar controles para completar dosis pendientes y verificar seroconversión cuando esté indicada.",
    explanation:
      "En personal sanitario, el control vacunal temprano protege al equipo y disminuye riesgo de transmisión nosocomial.",
    difficulty: "intermedia",
    tags: ["vacunacion", "salud_ocupacional", "bioseguridad"],
  },
  {
    category: "Pediatría y neonatología",
    component: "Pediatría y neonatología",
    subcomponent: "Urgencias respiratorias",
    topic: "Crisis asmática pediátrica",
    scenario:
      "Niño de 7 años con sibilancias, uso de músculos accesorios y saturación de 91% en urgencias",
    primaryAction:
      "Iniciar manejo respiratorio inmediato con oxigenoterapia según necesidad, broncodilatador de rescate y monitorización continua.",
    primaryWrongs: [
      "Mantener al paciente en sala de espera hasta nueva ronda médica.",
      "Administrar antitusivo y diferir tratamiento broncodilatador.",
      "Suspender monitorización para disminuir ansiedad del niño.",
    ],
    followupAction:
      "Reevaluar respuesta clínica tras cada intervención, documentar saturación y ajustar plan terapéutico.",
    explanation:
      "La crisis asmática requiere intervención rápida y reevaluación seriada para prevenir deterioro respiratorio.",
    difficulty: "alta",
    tags: ["patologia", "asma", "pediatria", "urgencias"],
  },
  {
    category: "Adulto y adulto mayor",
    component: "Adulto y adulto mayor",
    subcomponent: "Emergencias metabólicas",
    topic: "Hipoglucemia severa en adulto",
    scenario:
      "Paciente diabético en tratamiento con insulina llega confuso, diaforético y con glucosa capilar críticamente baja",
    primaryAction:
      "Corregir hipoglucemia de forma inmediata según protocolo, monitorizar respuesta y buscar causa desencadenante.",
    primaryWrongs: [
      "Esperar resultados de laboratorio confirmatorios antes de intervenir.",
      "Ofrecer solo hidratación oral aunque exista alteración del estado mental.",
      "Suspender vigilancia al mejorar parcialmente los síntomas.",
    ],
    followupAction:
      "Coordinar ajuste terapéutico, educación sobre prevención de recurrencias y control cercano posterior al evento.",
    explanation:
      "La hipoglucemia severa es una urgencia tiempo-dependiente; el manejo oportuno reduce daño neurológico.",
    difficulty: "intermedia",
    tags: ["patologia", "diabetes", "hipoglucemia", "adulto"],
  },
  {
    category: "Adulto y adulto mayor",
    component: "Adulto y adulto mayor",
    subcomponent: "Emergencias metabólicas",
    topic: "Cetoacidosis diabética",
    scenario:
      "Adulto con diabetes consulta por poliuria, vómito, dolor abdominal y respiración profunda",
    primaryAction:
      "Activar manejo de emergencia metabólica con hidratación, monitorización estrecha y coordinación médica inmediata.",
    primaryWrongs: [
      "Indicar control ambulatorio con rehidratación oral exclusiva.",
      "Administrar antiemético y diferir valoración metabólica integral.",
      "Suspender monitorización por aparente estabilidad hemodinámica inicial.",
    ],
    followupAction:
      "Controlar parámetros clínicos y metabólicos de forma seriada para ajustar tratamiento y prevenir complicaciones.",
    explanation:
      "La cetoacidosis diabética requiere abordaje protocolizado y seguimiento estrecho por riesgo de descompensación rápida.",
    difficulty: "alta",
    tags: ["patologia", "diabetes", "cetoacidosis", "urgencias"],
  },
  {
    category: "Adulto y adulto mayor",
    component: "Adulto y adulto mayor",
    subcomponent: "Cardiología clínica",
    topic: "Insuficiencia cardiaca aguda",
    scenario:
      "Paciente mayor presenta disnea progresiva, ortopnea y edema con signos de congestión",
    primaryAction:
      "Priorizar valoración cardiorrespiratoria, monitorizar estado hemodinámico y activar manejo protocolizado de descompensación.",
    primaryWrongs: [
      "Atribuir disnea a ansiedad sin evaluación objetiva inicial.",
      "Indicar deambulación inmediata sin estabilización clínica.",
      "Posponer intervención hasta completar todos los exámenes diferidos.",
    ],
    followupAction:
      "Registrar balance hídrico, reevaluar respuesta al tratamiento y reforzar educación para autocuidado al alta.",
    explanation:
      "La insuficiencia cardiaca descompensada requiere intervención temprana y seguimiento para reducir recaídas.",
    difficulty: "alta",
    tags: ["patologia", "insuficiencia_cardiaca", "adulto_mayor"],
  },
  {
    category: "Cuidados críticos y urgencias",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Dolor torácico agudo",
    topic: "Síndrome coronario agudo",
    scenario:
      "Adulto con dolor torácico opresivo irradiado, diaforesis y náuseas de inicio súbito",
    primaryAction:
      "Activar ruta de dolor torácico, monitorizar continuamente y priorizar atención de urgencia tiempo-dependiente.",
    primaryWrongs: [
      "Posponer valoración hasta que el dolor disminuya espontáneamente.",
      "Administrar analgésico aislado y otorgar alta precoz.",
      "Esperar resultados tardíos sin mantener monitorización activa.",
    ],
    followupAction:
      "Mantener vigilancia de signos de alarma, documentar cronología clínica y coordinar continuidad del manejo.",
    explanation:
      "En síndrome coronario, la rapidez diagnóstica y terapéutica impacta en pronóstico y supervivencia.",
    difficulty: "alta",
    tags: ["patologia", "sindrome_coronario", "urgencias"],
  },
  {
    category: "Cuidados críticos y urgencias",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Neurología de urgencia",
    topic: "Sospecha de evento cerebrovascular",
    scenario:
      "Paciente con inicio brusco de hemiparesia, desviación de comisura y dificultad para hablar",
    primaryAction:
      "Activar código neurológico, registrar hora de inicio y priorizar evaluación urgente para terapia tiempo-dependiente.",
    primaryWrongs: [
      "Esperar evolución clínica por varias horas antes de derivar.",
      "Iniciar alimentación oral pese a déficit neurológico agudo.",
      "Limitar intervención a control de signos vitales sin ruta específica.",
    ],
    followupAction:
      "Monitorear estado neurológico seriado, prevenir aspiración y asegurar trazabilidad del proceso asistencial.",
    explanation:
      "En evento cerebrovascular, la identificación y activación precoz de ruta mejora posibilidades terapéuticas.",
    difficulty: "alta",
    tags: ["patologia", "acv", "neurologia", "urgencias"],
  },
  {
    category: "Pediatría y neonatología",
    component: "Pediatría y neonatología",
    subcomponent: "Infecciones respiratorias",
    topic: "Neumonía con hipoxemia",
    scenario:
      "Lactante con fiebre, taquipnea, tirajes y saturación disminuida en sala de emergencia",
    primaryAction:
      "Priorizar soporte respiratorio, valoración de gravedad y coordinación inmediata para manejo intrahospitalario.",
    primaryWrongs: [
      "Indicar manejo domiciliario sin reevaluación de oxigenación.",
      "Retrasar intervención hasta confirmar etiología microbiológica definitiva.",
      "Suspender vigilancia al mejorar temporalmente la fiebre.",
    ],
    followupAction:
      "Reevaluar signos respiratorios, tolerancia al tratamiento y respuesta clínica en intervalos cortos.",
    explanation:
      "La neumonía con compromiso respiratorio en pediatría requiere manejo oportuno y vigilancia continua.",
    difficulty: "intermedia",
    tags: ["patologia", "neumonia", "pediatria", "hipoxemia"],
  },
  {
    category: "Cuidados críticos y urgencias",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Sepsis y choque",
    topic: "Sepsis de origen urinario",
    scenario:
      "Adulto mayor con fiebre, hipotensión, taquicardia y foco urinario probable",
    primaryAction:
      "Iniciar protocolo de sepsis con valoración hemodinámica, obtención de estudios iniciales y tratamiento oportuno.",
    primaryWrongs: [
      "Esperar estabilidad espontánea antes de activar protocolo.",
      "Tratar solo la fiebre sin evaluar perfusión sistémica.",
      "Diferir la intervención hasta completar exámenes de control tardíos.",
    ],
    followupAction:
      "Monitorizar respuesta hemodinámica y perfusión, documentando cambios para ajuste terapéutico continuo.",
    explanation:
      "La sepsis requiere respuesta temprana estructurada para reducir progresión a choque y falla orgánica.",
    difficulty: "alta",
    tags: ["patologia", "sepsis", "adulto_mayor", "urgencias"],
  },
  {
    category: "Pediatría y neonatología",
    component: "Pediatría y neonatología",
    subcomponent: "Emergencias gastrointestinales",
    topic: "Deshidratación por diarrea aguda",
    scenario:
      "Niño de 2 años con diarrea, vómito, mucosas secas y llenado capilar enlentecido",
    primaryAction:
      "Clasificar gravedad de deshidratación e iniciar reposición hídrica según protocolo con vigilancia clínica estrecha.",
    primaryWrongs: [
      "Indicar ayuno prolongado y observación domiciliaria sin seguimiento.",
      "Usar solo medicación sintomática sin plan de hidratación estructurado.",
      "Suspender reevaluación después de la primera intervención.",
    ],
    followupAction:
      "Controlar signos de hidratación periódicamente y educar al cuidador en señales de alarma.",
    explanation:
      "La deshidratación pediátrica exige clasificación temprana, reposición adecuada y reevaluación frecuente.",
    difficulty: "intermedia",
    tags: ["patologia", "deshidratacion", "pediatria", "gastrointestinal"],
  },
  {
    category: "Cuidados críticos y urgencias",
    component: "Cuidados críticos y urgencias",
    subcomponent: "Enfermedades infecciosas",
    topic: "Dengue con signos de alarma",
    scenario:
      "Paciente con fiebre, dolor abdominal persistente, vómitos y tendencia al sangrado mucoso",
    primaryAction:
      "Clasificar riesgo clínico, iniciar vigilancia estrecha y activar manejo protocolizado para signos de alarma.",
    primaryWrongs: [
      "Otorgar alta con recomendaciones generales sin reevaluación temprana.",
      "Priorizar solo control del dolor sin valoración hemodinámica.",
      "Esperar confirmación tardía para definir conducta inicial.",
    ],
    followupAction:
      "Monitorear signos vitales, diuresis y evolución clínica para detectar deterioro oportunamente.",
    explanation:
      "Los signos de alarma en dengue obligan a vigilancia activa para prevenir complicaciones graves.",
    difficulty: "alta",
    tags: ["patologia", "dengue", "infecciosas", "urgencias"],
  },
  {
    category: "Salud mental y entrevista clínica",
    component: "Salud mental y entrevista clínica",
    subcomponent: "Evaluación de riesgo",
    topic: "Depresión con riesgo suicida",
    scenario:
      "Paciente con ánimo deprimido refiere desesperanza, aislamiento y pensamientos de muerte",
    primaryAction:
      "Realizar evaluación estructurada de riesgo suicida, asegurar contención y activar ruta institucional de seguridad.",
    primaryWrongs: [
      "Posponer la valoración específica para próxima consulta programada.",
      "Minimizar verbalizaciones por ausencia de intento previo conocido.",
      "Mantener entrevista sin explorar red de apoyo ni plan de seguridad.",
    ],
    followupAction:
      "Documentar hallazgos de riesgo, coordinar seguimiento estrecho y reforzar acceso a apoyo inmediato.",
    explanation:
      "En riesgo suicida, la priorización de seguridad y el seguimiento cercano son fundamentales.",
    difficulty: "alta",
    tags: ["patologia", "depresion", "riesgo_suicida", "salud_mental"],
  },
];

const CACES_EXTRA_CLINICAL_CASE_BANK: CacesQuestion[] = (() => {
  const out: CacesQuestion[] = [];
  const answerPattern: CacesOptionId[] = ["A", "B", "C", "D"];
  let sequence = 6;

  for (let i = 0; i < EXTRA_CLINICAL_CASE_THEMES.length; i++) {
    const theme = EXTRA_CLINICAL_CASE_THEMES[i];
    const firstCorrect = answerPattern[(i * 3) % answerPattern.length];
    const secondCorrect = answerPattern[(i * 3 + 1) % answerPattern.length];
    const thirdCorrect = answerPattern[(i * 3 + 2) % answerPattern.length];
    const tags = [...new Set([...theme.tags, "caso_clinico", "banco_extra"])];

    const q1Options = buildExtraClinicalCaseOptions({
      correctLetter: firstCorrect,
      correctText: theme.primaryAction,
      wrongs: theme.primaryWrongs,
      correctRationale: theme.explanation,
    });
    out.push({
      id: `caces-case-${String(sequence).padStart(3, "0")}`,
      component: theme.component,
      subcomponent: theme.subcomponent,
      topic: theme.topic,
      category: theme.category,
      type: "caso_clinico",
      question: `${theme.scenario}. ¿Cuál es la conducta prioritaria de enfermería?`,
      options: q1Options,
      correctAnswer: firstCorrect,
      explanation: theme.explanation,
      difficulty: theme.difficulty,
      tags,
    });
    sequence += 1;

    const q2Options = buildExtraClinicalCaseOptions({
      correctLetter: secondCorrect,
      correctText: theme.primaryAction,
      wrongs: theme.primaryWrongs,
      correctRationale: theme.explanation,
    });
    out.push({
      id: `caces-case-${String(sequence).padStart(3, "0")}`,
      component: theme.component,
      subcomponent: theme.subcomponent,
      topic: `${theme.topic} - decisión inicial`,
      category: theme.category,
      type: "caso_clinico",
      question: `${theme.scenario}. Con base en la valoración inicial, ¿qué decisión clínica es la más adecuada?`,
      options: q2Options,
      correctAnswer: secondCorrect,
      explanation: theme.explanation,
      difficulty: followupDifficulty(theme.difficulty),
      tags: [...tags, "decision_clinica"],
    });
    sequence += 1;

    const q3Options = buildExtraClinicalCaseOptions({
      correctLetter: thirdCorrect,
      correctText: theme.followupAction,
      wrongs: EXTRA_CLINICAL_FOLLOWUP_WRONGS,
      correctRationale:
        "La continuidad segura del cuidado requiere registro, reevaluación y educación del paciente o cuidador.",
    });
    out.push({
      id: `caces-case-${String(sequence).padStart(3, "0")}`,
      component: theme.component,
      subcomponent: theme.subcomponent,
      topic: `${theme.topic} - seguimiento`,
      category: theme.category,
      type: "caso_clinico",
      question: `${theme.scenario}. Después de estabilizar al paciente, ¿qué acción fortalece la seguridad del seguimiento?`,
      options: q3Options,
      correctAnswer: thirdCorrect,
      explanation:
        "El seguimiento documentado y la educación clara reducen eventos adversos y mejoran adherencia al plan terapéutico.",
      difficulty: followupDifficulty(theme.difficulty),
      tags: [...tags, "seguimiento"],
    });
    sequence += 1;
  }

  return out;
})();

const SUPPLEMENT_CASE_TARGET = 50;
const SUPPLEMENT_DIRECT_PER_CASE = 4;

const SUPPLEMENT_DIRECT_STEM_BUILDERS: Array<(seed: CacesQuestion) => string> = [
  (seed) =>
    `En ${String(seed.topic).toLowerCase()}, ¿cuál alternativa refleja mejor una decisión segura de enfermería?`,
  (seed) =>
    `Respecto a ${String(seed.topic).toLowerCase()}, identifica la intervención más coherente con la valoración clínica integral.`,
  (seed) =>
    `¿Qué conducta prioriza seguridad y continuidad del cuidado al abordar ${String(seed.topic).toLowerCase()}?`,
  (seed) =>
    `En protocolos de ${String(seed.subcomponent).toLowerCase()}, ¿qué opción es técnicamente más adecuada para ${String(seed.topic).toLowerCase()}?`,
];

const SUPPLEMENT_DIFFICULTY_ORDER: CacesDifficulty[] = ["basica", "intermedia", "alta"];

function cloneQuestionOptions(optionsInput: CacesQuestion["options"]): CacesQuestion["options"] {
  return optionsInput.map((opt) => ({ ...opt })) as CacesQuestion["options"];
}

function rotateSupplementDifficulty(base: CacesDifficulty, step: number): CacesDifficulty {
  const idx = SUPPLEMENT_DIFFICULTY_ORDER.indexOf(base);
  const safeIdx = idx >= 0 ? idx : 1;
  const next = Math.max(0, Math.min(2, safeIdx + step));
  return SUPPLEMENT_DIFFICULTY_ORDER[next];
}

function toSupplementScenario(rawStem: string, topic: string) {
  let out = String(rawStem ?? "").trim();
  out = out
    .replace(/^caso clínico:\s*/i, "")
    .replace(/^mini caso:\s*/i, "")
    .replace(/^en relación con\s*/i, "");
  out = out.replace(/¿[^?]*\?\s*$/u, "").replace(/\?\s*$/u, "").trim();
  out = out.replace(/[.]+$/u, "").trim();
  if (out.length < 24) {
    out = `Paciente en contexto de ${String(topic).toLowerCase()}`;
  }
  return out;
}

function pickSupplementCaseSeeds(source: CacesQuestion[], target: number) {
  const caseCandidates = source.filter((q) => q.type === "caso_clinico");
  const grouped = new Map<string, CacesQuestion[]>();

  for (const question of caseCandidates) {
    const current = grouped.get(question.category) ?? [];
    current.push(question);
    grouped.set(question.category, current);
  }

  for (const [category, rows] of grouped) {
    grouped.set(
      category,
      [...rows].sort((a, b) => a.id.localeCompare(b.id, "es", { sensitivity: "base" }))
    );
  }

  const categories = [...grouped.keys()].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
  const picked: CacesQuestion[] = [];
  const pickedIds = new Set<string>();
  let keepPicking = true;

  while (picked.length < target && keepPicking) {
    keepPicking = false;
    for (const category of categories) {
      const bucket = grouped.get(category);
      if (!bucket || bucket.length === 0) continue;
      const next = bucket.shift();
      if (!next || pickedIds.has(next.id)) continue;
      picked.push(next);
      pickedIds.add(next.id);
      keepPicking = true;
      if (picked.length >= target) break;
    }
  }

  if (picked.length < target) {
    const fallback = source.filter((q) => !pickedIds.has(q.id));
    for (const question of fallback) {
      picked.push(question);
      pickedIds.add(question.id);
      if (picked.length >= target) break;
    }
  }

  return picked.slice(0, target);
}

const CACES_SUPPLEMENTAL_BANK: CacesQuestion[] = (() => {
  const source = dedupeCacesQuestions([
    ...CACES_CORE_QUESTION_BANK,
    ...CACES_EXTRA_CLINICAL_CASE_BANK,
    ...CACES_EXPANDED_QUESTION_BANK,
  ]);
  const seeds = pickSupplementCaseSeeds(source, SUPPLEMENT_CASE_TARGET);
  const out: CacesQuestion[] = [];

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const serial = i + 1;
    const scenario = toSupplementScenario(seed.question, seed.topic);
    const baseTags = [...new Set([...(seed.tags ?? []), "suplemento_2026"])];
    const caseOptions = cloneQuestionOptions(seed.options);

    out.push({
      id: `caces-sup-case-${String(serial).padStart(3, "0")}`,
      component: seed.component,
      subcomponent: seed.subcomponent,
      topic: `${seed.topic} - caso complementario`,
      category: seed.category,
      type: "caso_clinico",
      question: `Caso clínico complementario ${serial}: ${scenario}. ¿Cuál es la conducta inicial más adecuada de enfermería?`,
      options: caseOptions,
      correctAnswer: seed.correctAnswer,
      explanation: seed.explanation,
      difficulty: seed.difficulty,
      tags: [...baseTags, "caso_clinico", "suplemento_case"],
    });

    for (let templateIdx = 0; templateIdx < SUPPLEMENT_DIRECT_PER_CASE; templateIdx++) {
      const stemBuilder =
        SUPPLEMENT_DIRECT_STEM_BUILDERS[templateIdx % SUPPLEMENT_DIRECT_STEM_BUILDERS.length];
      const directOptions = cloneQuestionOptions(seed.options);
      const step = templateIdx === 2 ? 1 : 0;
      out.push({
        id: `caces-sup-dir-${String(i * SUPPLEMENT_DIRECT_PER_CASE + templateIdx + 1).padStart(3, "0")}`,
        component: seed.component,
        subcomponent: seed.subcomponent,
        topic: `${seed.topic} - práctica adicional ${templateIdx + 1}`,
        category: seed.category,
        type: "directa",
        question: stemBuilder(seed),
        options: directOptions,
        correctAnswer: seed.correctAnswer,
        explanation: `${seed.explanation} La opción correcta se mantiene por coherencia con seguridad del paciente y razonamiento clínico.`,
        difficulty: rotateSupplementDifficulty(seed.difficulty, step),
        tags: [...baseTags, "directa", "suplemento_directa"],
      });
    }
  }

  return out;
})();

export const CACES_QUESTION_BANK: CacesQuestion[] = dedupeCacesQuestions(
  dedupeCacesQuestionsByStem(
    [
      ...CACES_CORE_QUESTION_BANK,
      ...CACES_EXTRA_CLINICAL_CASE_BANK,
      ...CACES_EXPANDED_QUESTION_BANK,
      ...CACES_SUPPLEMENTAL_BANK,
      ...CACES_SCORE_MAMA_GYNE_BANK,
      ...CACES_IMPORTED_PDF_BANK,
    ].map(alignQuestionToEhepManual)
  )
);

export function normalizeCacesText(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildCacesQuestionKey(
  question: Pick<CacesQuestion, "question" | "options">
) {
  const stem = normalizeCacesText(question.question);
  const optionStem = (Array.isArray(question.options) ? question.options : [])
    .map((opt) => normalizeCacesText(String(opt?.text ?? "")))
    .join("|");
  return `${stem}::${optionStem}`.slice(0, MAX_QUESTION_KEY_CHARS);
}

export function dedupeCacesQuestions(input: CacesQuestion[]) {
  const out: CacesQuestion[] = [];
  const seen = new Set<string>();

  for (const question of input) {
    const key = buildCacesQuestionKey(question);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(question);
  }

  return out;
}

export function dedupeCacesQuestionsByStem(input: CacesQuestion[]) {
  const out: CacesQuestion[] = [];
  const seen = new Set<string>();

  for (const question of input) {
    const stem = normalizeCacesText(question.question);
    if (!stem || seen.has(stem)) continue;
    seen.add(stem);
    out.push(question);
  }

  return out;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

function buildCategoryFilterSet(category?: string, categories?: string[]) {
  const values = [
    category,
    ...(Array.isArray(categories) ? categories : []),
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
  if (values.length === 0) return null;
  return new Set(values);
}

function takeRandomFromPool<T>(pool: T[], size: number) {
  const out: T[] = [];
  const target = Math.max(0, Math.min(pool.length, Math.trunc(size)));
  while (pool.length > 0 && out.length < target) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

export function deriveQuestionCountByMode(mode: CacesPracticeMode) {
  if (mode === "quiz_5") return 5;
  if (mode === "simulacro_10") return 10;
  if (mode === "simulacro_20") return 20;
  if (mode === "simulacro_40") return 40;
  if (mode === "simulacro_60") return 60;
  if (mode === "simulacro_80") return 80;
  if (mode === "simulacro_100") return 100;
  if (mode === "simulacro_120") return 120;
  return 20;
}

export function listCacesComponents(
  category?: string,
  bank: CacesQuestion[] = CACES_QUESTION_BANK,
  categories?: string[]
) {
  const categorySet = buildCategoryFilterSet(category, categories);
  const pool = !categorySet ? bank : bank.filter((q) => categorySet.has(q.category));
  return uniqueSorted(pool.map((q) => q.component));
}

export function listCacesSubcomponents(
  component?: string,
  category?: string,
  bank: CacesQuestion[] = CACES_QUESTION_BANK,
  categories?: string[]
) {
  const categorySet = buildCategoryFilterSet(category, categories);
  const pool = bank.filter((q) => {
    if (categorySet && !categorySet.has(q.category)) return false;
    if (component && q.component !== component) return false;
    return true;
  });
  return uniqueSorted(pool.map((q) => q.subcomponent));
}

export function listCacesTopics(
  component?: string,
  subcomponent?: string,
  category?: string,
  bank: CacesQuestion[] = CACES_QUESTION_BANK,
  categories?: string[]
) {
  const categorySet = buildCategoryFilterSet(category, categories);
  const pool = bank.filter((q) => {
    if (categorySet && !categorySet.has(q.category)) return false;
    if (component && q.component !== component) return false;
    if (subcomponent && q.subcomponent !== subcomponent) return false;
    return true;
  });
  return uniqueSorted(pool.map((q) => q.topic));
}

export function filterCacesQuestionBank(filters?: CacesFilter, bank: CacesQuestion[] = CACES_QUESTION_BANK) {
  const f = filters ?? {};
  const categorySet = buildCategoryFilterSet(f.category, f.categories);
  const tagSet = Array.isArray(f.tags)
    ? new Set(f.tags.map((t) => normalizeCacesText(t)).filter(Boolean))
    : null;

  return bank.filter((q) => {
    if (categorySet && !categorySet.has(q.category)) return false;
    if (f.component && q.component !== f.component) return false;
    if (f.subcomponent && q.subcomponent !== f.subcomponent) return false;
    if (f.topic && q.topic !== f.topic) return false;
    if (f.difficulty && q.difficulty !== f.difficulty) return false;
    if (f.type && q.type !== f.type) return false;

    if (tagSet && tagSet.size > 0) {
      const qTags = new Set(q.tags.map((t) => normalizeCacesText(t)));
      for (const tag of tagSet) {
        if (!qTags.has(tag)) return false;
      }
    }

    return true;
  });
}

export function sampleCacesQuestions(input: CacesQuestion[], size: number) {
  const pool = dedupeCacesQuestions(input);
  const out: CacesQuestion[] = [];
  const target = Math.max(0, Math.min(pool.length, Math.trunc(size)));

  out.push(...takeRandomFromPool(pool, target));

  return out;
}

export function sampleCacesQuestionsPrioritizingUnseen(args: {
  input: CacesQuestion[];
  size: number;
  seenQuestionKeys?: Set<string>;
}) {
  const { input, size, seenQuestionKeys = new Set<string>() } = args;
  const pool = dedupeCacesQuestions(input);
  const unseen = pool.filter((q) => !seenQuestionKeys.has(buildCacesQuestionKey(q)));
  const seen = pool.filter((q) => seenQuestionKeys.has(buildCacesQuestionKey(q)));

  const target = Math.max(0, Math.min(pool.length, Math.trunc(size)));
  const pickUnseen = sampleCacesQuestions(unseen, target);
  const remaining = target - pickUnseen.length;
  const pickSeen = remaining > 0 ? sampleCacesQuestions(seen, remaining) : [];

  return {
    selected: [...pickUnseen, ...pickSeen],
    unseen_available: unseen.length,
    seen_reused: pickSeen.length,
  };
}

export function sampleCacesQuestionsBalancedByCategory(args: {
  input: CacesQuestion[];
  size: number;
  seenQuestionKeys?: Set<string>;
  categoryOrder?: string[];
}) {
  const {
    input,
    size,
    seenQuestionKeys = new Set<string>(),
    categoryOrder = [],
  } = args;

  const pool = dedupeCacesQuestions(input);
  const target = Math.max(0, Math.min(pool.length, Math.trunc(size)));
  if (target <= 0) {
    return {
      selected: [] as CacesQuestion[],
      unseen_available: 0,
      seen_reused: 0,
      by_category: [] as Array<{ category: string; selected: number }>,
    };
  }

  const grouped = new Map<
    string,
    { unseen: CacesQuestion[]; seen: CacesQuestion[]; selected: number }
  >();

  for (const question of pool) {
    const existing =
      grouped.get(question.category) ??
      { unseen: [] as CacesQuestion[], seen: [] as CacesQuestion[], selected: 0 };
    const key = buildCacesQuestionKey(question);
    if (seenQuestionKeys.has(key)) existing.seen.push(question);
    else existing.unseen.push(question);
    grouped.set(question.category, existing);
  }

  if (grouped.size <= 1) {
    const picked = sampleCacesQuestionsPrioritizingUnseen({
      input: pool,
      size: target,
      seenQuestionKeys,
    });
    const singleCategory = grouped.size === 1 ? [...grouped.keys()][0] : "General";
    return {
      ...picked,
      by_category: [{ category: singleCategory, selected: picked.selected.length }],
    };
  }

  const prioritizedOrder = categoryOrder
    .map((v) => String(v ?? "").trim())
    .filter((v) => grouped.has(v));
  const remainingCategories = [...grouped.keys()].filter((cat) => !prioritizedOrder.includes(cat));
  const categories = [...prioritizedOrder, ...remainingCategories];
  const baseQuota = Math.floor(target / categories.length);
  const remainder = target % categories.length;
  const remainderOrder = takeRandomFromPool([...categories], remainder);
  const desiredByCategory = new Map<string, number>();

  for (const cat of categories) {
    desiredByCategory.set(cat, baseQuota + (remainderOrder.includes(cat) ? 1 : 0));
  }

  const unseenAvailable = [...grouped.values()].reduce((acc, bucket) => acc + bucket.unseen.length, 0);
  const selected: CacesQuestion[] = [];
  let seenReused = 0;

  for (const cat of categories) {
    const bucket = grouped.get(cat);
    if (!bucket) continue;
    const desired = desiredByCategory.get(cat) ?? 0;
    if (desired <= 0) continue;

    const pickedUnseen = takeRandomFromPool(bucket.unseen, desired);
    selected.push(...pickedUnseen);
    bucket.selected += pickedUnseen.length;

    const stillMissing = desired - pickedUnseen.length;
    if (stillMissing > 0) {
      const pickedSeen = takeRandomFromPool(bucket.seen, stillMissing);
      selected.push(...pickedSeen);
      bucket.selected += pickedSeen.length;
      seenReused += pickedSeen.length;
    }
  }

  while (selected.length < target) {
    const candidates = categories
      .map((cat) => {
        const bucket = grouped.get(cat);
        if (!bucket) return null;
        const available = bucket.unseen.length + bucket.seen.length;
        if (available <= 0) return null;
        const desired = desiredByCategory.get(cat) ?? 0;
        const deficit = desired - bucket.selected;
        return { cat, bucket, deficit, available };
      })
      .filter(Boolean) as Array<{
      cat: string;
      bucket: { unseen: CacesQuestion[]; seen: CacesQuestion[]; selected: number };
      deficit: number;
      available: number;
    }>;

    if (candidates.length === 0) break;

    candidates.sort((a, b) => {
      if (b.deficit !== a.deficit) return b.deficit - a.deficit;
      if (a.bucket.selected !== b.bucket.selected) return a.bucket.selected - b.bucket.selected;
      return b.available - a.available;
    });

    const chosen = candidates[0];
    const fromUnseen = takeRandomFromPool(chosen.bucket.unseen, 1);
    if (fromUnseen.length > 0) {
      selected.push(fromUnseen[0]);
      chosen.bucket.selected += 1;
      continue;
    }

    const fromSeen = takeRandomFromPool(chosen.bucket.seen, 1);
    if (fromSeen.length > 0) {
      selected.push(fromSeen[0]);
      chosen.bucket.selected += 1;
      seenReused += 1;
      continue;
    }
  }

  return {
    selected,
    unseen_available: unseenAvailable,
    seen_reused: seenReused,
    by_category: categories.map((cat) => ({
      category: cat,
      selected: grouped.get(cat)?.selected ?? 0,
    })),
  };
}

export function evaluateCacesAttempt(args: {
  attempt_id: string;
  questions: CacesQuestion[];
  answers: Record<string, CacesAttemptAnswer>;
  started_at: number;
  finished_at: number;
}): CacesAttemptResult {
  const { attempt_id, questions, answers, started_at, finished_at } = args;

  let correct = 0;
  let incorrect = 0;
  let skipped = 0;

  const byCategoryMap = new Map<string, { total: number; correct: number; incorrect: number }>();
  const byTopicMap = new Map<string, { topic: string; incorrect: number }>();

  const review = questions.map((q) => {
    const answer = answers[q.id];
    const selected = answer?.selected ?? null;
    const isSkipped = Boolean(answer?.skipped) || selected == null;
    const isCorrect = !isSkipped && selected === q.correctAnswer;

    if (isSkipped) skipped += 1;
    else if (isCorrect) correct += 1;
    else incorrect += 1;

    const currentCat = byCategoryMap.get(q.category) ?? { total: 0, correct: 0, incorrect: 0 };
    currentCat.total += 1;
    if (isCorrect) currentCat.correct += 1;
    if (!isCorrect) currentCat.incorrect += 1;
    byCategoryMap.set(q.category, currentCat);

    if (!isCorrect) {
      const topicStats = byTopicMap.get(q.topic) ?? { topic: q.topic, incorrect: 0 };
      topicStats.incorrect += 1;
      byTopicMap.set(q.topic, topicStats);
    }

    return {
      question_id: q.id,
      category: q.category,
      topic: q.topic,
      selected,
      correct: q.correctAnswer,
      is_correct: isCorrect,
      skipped: isSkipped,
    };
  });

  const total = questions.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const by_category = [...byCategoryMap.entries()].map(([category, stats]) => ({
    category,
    total: stats.total,
    correct: stats.correct,
    incorrect: stats.incorrect,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  by_category.sort((a, b) => a.category.localeCompare(b.category, "es", { sensitivity: "base" }));

  const weak_topics = [...byTopicMap.values()]
    .sort((a, b) => b.incorrect - a.incorrect)
    .slice(0, 6)
    .map((x) => x.topic);

  return {
    attempt_id,
    total_questions: total,
    correct_answers: correct,
    incorrect_answers: incorrect,
    skipped_answers: skipped,
    accuracy,
    total_score: correct,
    elapsed_seconds: Math.max(0, Math.round((finished_at - started_at) / 1000)),
    finished_at: new Date(finished_at).toISOString(),
    by_category,
    weak_topics,
    review,
  };
}

function toLegacyDifficulty(difficulty: CacesDifficulty): "basic" | "intermediate" | "advanced" {
  if (difficulty === "basica") return "basic";
  if (difficulty === "intermedia") return "intermediate";
  return "advanced";
}

function fromLegacyDifficulty(
  difficulty: LegacyDifficultyFilter
): CacesDifficulty | undefined {
  if (difficulty === "basic") return "basica";
  if (difficulty === "intermediate") return "intermedia";
  if (difficulty === "advanced") return "alta";
  return undefined;
}

function toLegacyQuizQuestion(question: CacesQuestion): QuizQuestion {
  return {
    id: question.id,
    category: question.category,
    subcategory: question.topic,
    prompt: question.question,
    options: question.options.map((o) => ({ id: o.id, text: o.text })) as Array<{
      id: "A" | "B" | "C" | "D";
      text: string;
    }>,
    correct_option: question.correctAnswer,
    rationale: question.explanation,
    difficulty: toLegacyDifficulty(question.difficulty),
  };
}

export function getCacesQuestions(opts?: {
  category?: string;
  difficulty?: LegacyDifficultyFilter;
}) {
  const category = String(opts?.category ?? "all");
  const difficulty = (opts?.difficulty ?? "all") as LegacyDifficultyFilter;

  const filtered = filterCacesQuestionBank({
    category: category === "all" ? undefined : category,
    difficulty: fromLegacyDifficulty(difficulty),
  });

  return filtered.map(toLegacyQuizQuestion);
}

export function sampleQuestions(input: QuizQuestion[], size: number) {
  const pool = [...input];
  const out: QuizQuestion[] = [];
  const target = Math.max(0, Math.min(pool.length, Math.trunc(size)));

  while (pool.length > 0 && out.length < target) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return out;
}
