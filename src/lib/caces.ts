import type {
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

type LegacyDifficultyFilter = "all" | "basic" | "intermediate" | "advanced";

type CacesFilter = {
  category?: string;
  component?: string;
  subcomponent?: string;
  topic?: string;
  difficulty?: CacesDifficulty;
  type?: CacesQuestionType;
  tags?: string[];
  mix_categories?: boolean;
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
): [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption] {
  return [a, b, c, d];
}

export const CACES_CATEGORIES = [
  "Fundamentos del cuidado enfermero",
  "Mujer, recién nacido, niño y adolescente",
  "Adulto y adulto mayor",
  "Cuidado familiar, comunitario e intercultural",
  "Bases educativas, administrativas, investigativas y epidemiológicas",
  "Salud mental y entrevista clínica",
] as const;

export const CACES_QUESTION_BANK: CacesQuestion[] = [
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
];

function normalize(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

export function deriveQuestionCountByMode(mode: CacesPracticeMode) {
  if (mode === "practica_individual") return 1;
  if (mode === "quiz_5") return 5;
  if (mode === "simulacro_10") return 10;
  return 20;
}

export function listCacesComponents(category?: string) {
  const pool = !category ? CACES_QUESTION_BANK : CACES_QUESTION_BANK.filter((q) => q.category === category);
  return uniqueSorted(pool.map((q) => q.component));
}

export function listCacesSubcomponents(component?: string, category?: string) {
  const pool = CACES_QUESTION_BANK.filter((q) => {
    if (category && q.category !== category) return false;
    if (component && q.component !== component) return false;
    return true;
  });
  return uniqueSorted(pool.map((q) => q.subcomponent));
}

export function listCacesTopics(component?: string, subcomponent?: string, category?: string) {
  const pool = CACES_QUESTION_BANK.filter((q) => {
    if (category && q.category !== category) return false;
    if (component && q.component !== component) return false;
    if (subcomponent && q.subcomponent !== subcomponent) return false;
    return true;
  });
  return uniqueSorted(pool.map((q) => q.topic));
}

export function filterCacesQuestionBank(filters?: CacesFilter) {
  const f = filters ?? {};
  const tagSet = Array.isArray(f.tags)
    ? new Set(f.tags.map((t) => normalize(t)).filter(Boolean))
    : null;

  return CACES_QUESTION_BANK.filter((q) => {
    if (!f.mix_categories && f.category && q.category !== f.category) return false;
    if (f.component && q.component !== f.component) return false;
    if (f.subcomponent && q.subcomponent !== f.subcomponent) return false;
    if (f.topic && q.topic !== f.topic) return false;
    if (f.difficulty && q.difficulty !== f.difficulty) return false;
    if (f.type && q.type !== f.type) return false;

    if (tagSet && tagSet.size > 0) {
      const qTags = new Set(q.tags.map((t) => normalize(t)));
      for (const tag of tagSet) {
        if (!qTags.has(tag)) return false;
      }
    }

    return true;
  });
}

export function sampleCacesQuestions(input: CacesQuestion[], size: number) {
  const pool = [...input];
  const out: CacesQuestion[] = [];
  const target = Math.max(0, Math.min(pool.length, Math.trunc(size)));

  while (pool.length > 0 && out.length < target) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return out;
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
