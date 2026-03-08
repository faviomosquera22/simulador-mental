import type { QuizQuestion } from "./types";

type DifficultyFilter = "all" | "basic" | "intermediate" | "advanced";

export const CACES_CATEGORIES = [
  "Salud mental y entrevista clínica",
  "Cuidado enfermero y PAE",
  "Salud sexual y reproductiva",
  "Comunitaria, epidemiología e investigación",
  "Ética, seguridad y gestión",
] as const;

export const CACES_QUESTION_BANK: QuizQuestion[] = [
  {
    id: "caces_sm_001",
    category: "Salud mental y entrevista clínica",
    subcategory: "Apertura terapéutica",
    prompt: "Al iniciar entrevista con paciente ansioso, ¿cuál apertura favorece mayor alianza terapéutica?",
    options: [
      { id: "A", text: "Interrogar síntomas sin validar emoción." },
      { id: "B", text: "Validar malestar y usar pregunta abierta inicial." },
      { id: "C", text: "Explicar diagnóstico probable al inicio." },
      { id: "D", text: "Pedir pruebas médicas antes de escuchar relato." },
    ],
    correct_option: "B",
    rationale: "Validar y abrir con pregunta amplia facilita confianza y precisión narrativa.",
    difficulty: "basic",
  },
  {
    id: "caces_sm_002",
    category: "Salud mental y entrevista clínica",
    subcategory: "Riesgo suicida",
    prompt: "Ante ideación suicida activa, ¿qué secuencia es más segura?",
    options: [
      { id: "A", text: "Explorar plan, intención, medios y factores protectores." },
      { id: "B", text: "Cambiar de tema para no reforzar ideas." },
      { id: "C", text: "Indicar meditación y cerrar entrevista." },
      { id: "D", text: "Solicitar firma de compromiso sin evaluación." },
    ],
    correct_option: "A",
    rationale: "La evaluación estructurada de riesgo prioriza seguridad y decisiones clínicas prudentes.",
    difficulty: "intermediate",
  },
  {
    id: "caces_sm_003",
    category: "Salud mental y entrevista clínica",
    subcategory: "Pediatría",
    prompt: "En caso pediátrico con sospecha de TDAH, ¿qué dato es más útil para criterio clínico?",
    options: [
      { id: "A", text: "Síntomas solo en casa en últimas 2 semanas." },
      { id: "B", text: "Síntomas en al menos dos contextos con inicio temprano." },
      { id: "C", text: "Un examen cognitivo normal." },
      { id: "D", text: "Opinión aislada del docente sin entrevista familiar." },
    ],
    correct_option: "B",
    rationale: "La presencia en múltiples contextos y curso temporal sostenido es clave en TDAH.",
    difficulty: "intermediate",
  },
  {
    id: "caces_sm_004",
    category: "Salud mental y entrevista clínica",
    subcategory: "Estado mental",
    prompt: "¿Qué componente pertenece al examen mental y no a antecedentes?",
    options: [
      { id: "A", text: "Historia familiar de trastorno bipolar." },
      { id: "B", text: "Juicio e insight durante la entrevista." },
      { id: "C", text: "Antecedentes perinatales." },
      { id: "D", text: "Consumo de sustancias hace 10 años." },
    ],
    correct_option: "B",
    rationale: "Insight y juicio se valoran en tiempo real como parte del estado mental actual.",
    difficulty: "basic",
  },
  {
    id: "caces_sm_005",
    category: "Salud mental y entrevista clínica",
    subcategory: "Diferenciales",
    prompt: "Paciente con insomnio, ánimo elevado y verborrea por 6 días. ¿diferencial prioritario?",
    options: [
      { id: "A", text: "Trastorno bipolar con episodio hipomaníaco/maníaco." },
      { id: "B", text: "Fobia específica." },
      { id: "C", text: "Duelo normal." },
      { id: "D", text: "Trastorno disociativo puro." },
    ],
    correct_option: "A",
    rationale: "La tríada de activación sostenida con disminución de sueño orienta a espectro bipolar.",
    difficulty: "intermediate",
  },
  {
    id: "caces_sm_006",
    category: "Salud mental y entrevista clínica",
    subcategory: "Comunicación clínica",
    prompt: "¿Qué respuesta refleja técnica de entrevista motivacional?",
    options: [
      { id: "A", text: "“Debe dejarlo hoy o empeorará.”" },
      { id: "B", text: "“Entiendo la ambivalencia, ¿qué ventajas ve en cambiar?”" },
      { id: "C", text: "“No hay nada que hablar hasta que cambie.”" },
      { id: "D", text: "“Solo su familia puede decidir por usted.”" },
    ],
    correct_option: "B",
    rationale: "Reconoce ambivalencia y evoca cambio desde el paciente.",
    difficulty: "basic",
  },

  {
    id: "caces_pae_001",
    category: "Cuidado enfermero y PAE",
    subcategory: "Valoración",
    prompt: "En PAE, la fase de valoración requiere principalmente:",
    options: [
      { id: "A", text: "Definir resultados esperados antes de recolectar datos." },
      { id: "B", text: "Recolectar datos objetivos y subjetivos organizados." },
      { id: "C", text: "Aplicar intervenciones sin diagnóstico enfermero." },
      { id: "D", text: "Cerrar caso con nota narrativa breve." },
    ],
    correct_option: "B",
    rationale: "La valoración sustenta diagnóstico y planificación posterior.",
    difficulty: "basic",
  },
  {
    id: "caces_pae_002",
    category: "Cuidado enfermero y PAE",
    subcategory: "NANDA-NIC-NOC",
    prompt: "La secuencia correcta de razonamiento NANDA-NIC-NOC es:",
    options: [
      { id: "A", text: "Intervención → Diagnóstico → Resultado." },
      { id: "B", text: "Diagnóstico → Resultado esperado → Intervención." },
      { id: "C", text: "Resultado → Intervención → Diagnóstico." },
      { id: "D", text: "Diagnóstico médico → Alta hospitalaria → NOC." },
    ],
    correct_option: "B",
    rationale: "Primero se formula diagnóstico, luego metas y finalmente acciones.",
    difficulty: "basic",
  },
  {
    id: "caces_pae_003",
    category: "Cuidado enfermero y PAE",
    subcategory: "Seguridad",
    prompt: "Paciente con agitación psicomotora y riesgo de caída. Prioridad de cuidado:",
    options: [
      { id: "A", text: "Postergar vigilancia hasta completar historia clínica." },
      { id: "B", text: "Asegurar entorno seguro y monitorización inmediata." },
      { id: "C", text: "Restringir líquidos para evitar deambulación." },
      { id: "D", text: "Suspender acompañamiento familiar." },
    ],
    correct_option: "B",
    rationale: "La seguridad inmediata es prioritaria ante riesgo de daño.",
    difficulty: "intermediate",
  },
  {
    id: "caces_pae_004",
    category: "Cuidado enfermero y PAE",
    subcategory: "Evaluación",
    prompt: "La fase de evaluación del PAE implica:",
    options: [
      { id: "A", text: "Verificar cumplimiento de metas y reajustar plan." },
      { id: "B", text: "Eliminar diagnóstico sin revisar resultados." },
      { id: "C", text: "Registrar solo percepción del profesional." },
      { id: "D", text: "Mantener intervenciones sin medir efecto." },
    ],
    correct_option: "A",
    rationale: "Evaluar resultados permite continuidad y mejora del cuidado.",
    difficulty: "basic",
  },
  {
    id: "caces_pae_005",
    category: "Cuidado enfermero y PAE",
    subcategory: "Documentación",
    prompt: "Una nota de enfermería clínicamente útil debe ser:",
    options: [
      { id: "A", text: "General y sin hora para ganar tiempo." },
      { id: "B", text: "Objetiva, cronológica y vinculada a intervenciones." },
      { id: "C", text: "Solo verbal sin registro escrito." },
      { id: "D", text: "Centrada en opiniones personales." },
    ],
    correct_option: "B",
    rationale: "La trazabilidad clínica exige registro objetivo y temporal.",
    difficulty: "basic",
  },

  {
    id: "caces_ssr_001",
    category: "Salud sexual y reproductiva",
    subcategory: "Consejería",
    prompt: "En consejería sexual clínica, la primera estrategia recomendada es:",
    options: [
      { id: "A", text: "Usar lenguaje no estigmatizante y consentimiento informado." },
      { id: "B", text: "Evitar preguntas sexuales por incomodidad." },
      { id: "C", text: "Centrarse solo en conducta de riesgo sin contexto." },
      { id: "D", text: "Asumir identidad/orientación por apariencia." },
    ],
    correct_option: "A",
    rationale: "El encuadre respetuoso mejora adherencia y precisión de datos.",
    difficulty: "basic",
  },
  {
    id: "caces_ssr_002",
    category: "Salud sexual y reproductiva",
    subcategory: "ITS",
    prompt: "Paciente con ITS reciente y ansiedad intensa. Intervención inicial más adecuada:",
    options: [
      { id: "A", text: "Psychoeducación, manejo del estigma y plan de notificación segura." },
      { id: "B", text: "Minimizar impacto emocional para evitar dependencia." },
      { id: "C", text: "Sugerir abstinencia perpetua sin evaluación." },
      { id: "D", text: "Suspender seguimiento psicológico." },
    ],
    correct_option: "A",
    rationale: "Combina salud física, mental y prevención en abordaje integral.",
    difficulty: "intermediate",
  },
  {
    id: "caces_ssr_003",
    category: "Salud sexual y reproductiva",
    subcategory: "Violencia sexual",
    prompt: "Ante antecedente de violencia sexual en entrevista, conducta ética inicial:",
    options: [
      { id: "A", text: "Validar, evaluar seguridad actual y evitar revictimización." },
      { id: "B", text: "Solicitar detalles explícitos desde el inicio." },
      { id: "C", text: "Dudar del relato hasta tener pruebas judiciales." },
      { id: "D", text: "Excluir a paciente de decisiones sobre su cuidado." },
    ],
    correct_option: "A",
    rationale: "La atención informada en trauma protege dignidad y seguridad.",
    difficulty: "intermediate",
  },
  {
    id: "caces_ssr_004",
    category: "Salud sexual y reproductiva",
    subcategory: "Adolescencia",
    prompt: "En adolescente con conducta sexual de riesgo y consumo, el enfoque más útil es:",
    options: [
      { id: "A", text: "Reducción de riesgo + entrevista motivacional + red de apoyo." },
      { id: "B", text: "Sanción moral para evitar recaídas." },
      { id: "C", text: "Ignorar consumo porque consulta es sexual." },
      { id: "D", text: "Excluir al adolescente de la conversación." },
    ],
    correct_option: "A",
    rationale: "El abordaje multimodal aumenta adherencia y prevención.",
    difficulty: "intermediate",
  },

  {
    id: "caces_epi_001",
    category: "Comunitaria, epidemiología e investigación",
    subcategory: "Epidemiología",
    prompt: "Para estimar frecuencia de depresión en una comunidad hoy, el diseño más adecuado es:",
    options: [
      { id: "A", text: "Estudio transversal." },
      { id: "B", text: "Ensayo clínico aleatorizado." },
      { id: "C", text: "Serie de casos hospitalaria." },
      { id: "D", text: "Estudio ecológico sin denominador poblacional." },
    ],
    correct_option: "A",
    rationale: "El corte transversal permite estimar prevalencia en un momento específico.",
    difficulty: "basic",
  },
  {
    id: "caces_epi_002",
    category: "Comunitaria, epidemiología e investigación",
    subcategory: "Investigación",
    prompt: "¿Qué mejora la validez interna de un estudio comparativo de intervención?",
    options: [
      { id: "A", text: "Aleatorización y control de confusores." },
      { id: "B", text: "Muestra por conveniencia sin seguimiento." },
      { id: "C", text: "Ausencia de criterios de inclusión." },
      { id: "D", text: "Cambiar desenlace durante análisis." },
    ],
    correct_option: "A",
    rationale: "Reduce sesgos de selección y variables de confusión.",
    difficulty: "intermediate",
  },
  {
    id: "caces_epi_003",
    category: "Comunitaria, epidemiología e investigación",
    subcategory: "Promoción de salud",
    prompt: "Una intervención comunitaria de prevención del suicidio debe incluir prioritariamente:",
    options: [
      { id: "A", text: "Detección temprana, rutas de derivación y educación de red de apoyo." },
      { id: "B", text: "Solo carteles informativos sin seguimiento." },
      { id: "C", text: "Intervención exclusiva en hospitales." },
      { id: "D", text: "Excluir escuelas y familia del programa." },
    ],
    correct_option: "A",
    rationale: "La prevención efectiva requiere abordaje multinivel y continuidad.",
    difficulty: "intermediate",
  },
  {
    id: "caces_epi_004",
    category: "Comunitaria, epidemiología e investigación",
    subcategory: "Indicadores",
    prompt: "Si aumentan casos nuevos de ansiedad en 2026 respecto a 2025, el indicador descrito es:",
    options: [
      { id: "A", text: "Incidencia." },
      { id: "B", text: "Prevalencia puntual." },
      { id: "C", text: "Razón de letalidad." },
      { id: "D", text: "Sensibilidad diagnóstica." },
    ],
    correct_option: "A",
    rationale: "La incidencia mide casos nuevos en un periodo.",
    difficulty: "basic",
  },

  {
    id: "caces_eth_001",
    category: "Ética, seguridad y gestión",
    subcategory: "Confidencialidad",
    prompt: "En adolescente en psicoterapia, la confidencialidad se maneja como:",
    options: [
      { id: "A", text: "Absoluta incluso si hay riesgo vital inminente." },
      { id: "B", text: "Protegida, salvo excepciones de seguridad y marco legal." },
      { id: "C", text: "Inexistente porque decide solo el cuidador." },
      { id: "D", text: "Opcional según preferencia del profesional." },
    ],
    correct_option: "B",
    rationale: "La confidencialidad tiene límites cuando existe riesgo grave.",
    difficulty: "intermediate",
  },
  {
    id: "caces_eth_002",
    category: "Ética, seguridad y gestión",
    subcategory: "Seguridad del paciente",
    prompt: "Medida prioritaria para reducir eventos adversos en unidad de salud mental:",
    options: [
      { id: "A", text: "Comunicación estandarizada en cambios de turno." },
      { id: "B", text: "Eliminar doble verificación de medicamentos." },
      { id: "C", text: "Reducir registro de incidentes." },
      { id: "D", text: "Evitar reporte de casi fallas." },
    ],
    correct_option: "A",
    rationale: "La comunicación estructurada reduce errores por omisión.",
    difficulty: "basic",
  },
  {
    id: "caces_eth_003",
    category: "Ética, seguridad y gestión",
    subcategory: "Gestión clínica",
    prompt: "Indicador útil para monitorear calidad de entrevista clínica en servicio ambulatorio:",
    options: [
      { id: "A", text: "Porcentaje de historias con evaluación de riesgo documentada." },
      { id: "B", text: "Cantidad de decoraciones de sala de espera." },
      { id: "C", text: "Tiempo total de coffee break del personal." },
      { id: "D", text: "Número de pacientes sin registro de seguimiento." },
    ],
    correct_option: "A",
    rationale: "Evalúa adherencia a estándar crítico de seguridad.",
    difficulty: "intermediate",
  },
  {
    id: "caces_eth_004",
    category: "Ética, seguridad y gestión",
    subcategory: "Priorización",
    prompt: "En triaje de salud mental, ¿qué caso priorizas primero?",
    options: [
      { id: "A", text: "Insomnio leve sin riesgo ni deterioro funcional." },
      { id: "B", text: "Ideación suicida con plan y acceso a medios." },
      { id: "C", text: "Consulta administrativa de certificados." },
      { id: "D", text: "Seguimiento estable de ansiedad controlada." },
    ],
    correct_option: "B",
    rationale: "Riesgo suicida con plan y medios requiere atención inmediata.",
    difficulty: "basic",
  },
];

export function getCacesQuestions(opts?: {
  category?: string;
  difficulty?: DifficultyFilter;
}) {
  const category = String(opts?.category ?? "all");
  const difficulty = (opts?.difficulty ?? "all") as DifficultyFilter;

  return CACES_QUESTION_BANK.filter((q) => {
    const matchCategory = category === "all" ? true : q.category === category;
    const matchDifficulty = difficulty === "all" ? true : q.difficulty === difficulty;
    return matchCategory && matchDifficulty;
  });
}

export function sampleQuestions(input: QuizQuestion[], size: number) {
  const pool = [...input];
  const out: QuizQuestion[] = [];
  while (pool.length > 0 && out.length < size) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

