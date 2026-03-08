import type {
  AssessmentOption,
  ScaleAnswer,
  ScaleDefinition,
  ScaleResult,
  TestAnswer,
  TestDefinition,
  TestResult,
} from "./types";

const LIKERT_0_3: AssessmentOption[] = [
  { id: "none", label: "0 · Nunca / Ausente", value: 0 },
  { id: "mild", label: "1 · Leve / Ocasional", value: 1 },
  { id: "moderate", label: "2 · Moderado / Frecuente", value: 2 },
  { id: "severe", label: "3 · Severo / Casi siempre", value: 3 },
];

const LIKERT_0_4: AssessmentOption[] = [
  { id: "0", label: "0 · Nunca", value: 0 },
  { id: "1", label: "1 · Varios días", value: 1 },
  { id: "2", label: "2 · Más de la mitad de días", value: 2 },
  { id: "3", label: "3 · Casi todos los días", value: 3 },
];

const YES_NO: AssessmentOption[] = [
  { id: "no", label: "No", value: 0 },
  { id: "yes", label: "Sí", value: 1 },
];

const YES_NO_WEIGHTED: AssessmentOption[] = [
  { id: "no", label: "No", value: 0 },
  { id: "yes", label: "Sí", value: 2 },
];

export const CLINICAL_SCALES: ScaleDefinition[] = [
  {
    id: "bdi_simplified",
    name: "Inventario de Depresión de Beck (versión educativa simplificada)",
    short_name: "BDI-S",
    description:
      "Tamizaje orientativo de síntomas depresivos. Formato educativo, no equivalente a la versión oficial completa.",
    population: "Adultos y adolescentes mayores",
    suggested_age_range: "15+",
    response_type: "likert_0_3",
    educational_only: true,
    items: [
      { id: "bdi_1", prompt: "Tristeza o sensación de vacío en la última semana.", options: LIKERT_0_3 },
      { id: "bdi_2", prompt: "Pérdida de interés por actividades habituales.", options: LIKERT_0_3 },
      { id: "bdi_3", prompt: "Sentimientos de culpa o inutilidad.", options: LIKERT_0_3 },
      { id: "bdi_4", prompt: "Baja energía o fatiga sostenida.", options: LIKERT_0_3 },
      { id: "bdi_5", prompt: "Dificultad de concentración.", options: LIKERT_0_3 },
      { id: "bdi_6", prompt: "Cambios de sueño (insomnio o hipersomnia).", options: LIKERT_0_3 },
      { id: "bdi_7", prompt: "Cambios de apetito o peso.", options: LIKERT_0_3 },
      { id: "bdi_8", prompt: "Desesperanza sobre el futuro.", options: LIKERT_0_3 },
      { id: "bdi_9", prompt: "Ideas de daño a sí mismo o de no querer vivir.", options: LIKERT_0_3 },
    ],
    interpretation: [
      { min: 0, max: 8, label: "Mínimo", meaning: "Síntomas depresivos leves o ausentes." },
      { min: 9, max: 17, label: "Leve", meaning: "Sintomatología depresiva leve; vigilar evolución." },
      { min: 18, max: 24, label: "Moderado", meaning: "Síntomas clínicamente relevantes; ampliar evaluación." },
      { min: 25, max: 27, label: "Severo", meaning: "Alta carga de síntomas; priorizar evaluación integral y seguridad." },
    ],
  },
  {
    id: "ham_a_simplified",
    name: "Escala de Ansiedad de Hamilton (versión educativa simplificada)",
    short_name: "HAM-A-S",
    description: "Mide intensidad de ansiedad psíquica y somática en formato de entrenamiento.",
    population: "Adultos",
    suggested_age_range: "18+",
    response_type: "likert_0_3",
    educational_only: true,
    items: [
      { id: "hama_1", prompt: "Preocupación excesiva difícil de controlar.", options: LIKERT_0_3 },
      { id: "hama_2", prompt: "Tensión muscular o inquietud.", options: LIKERT_0_3 },
      { id: "hama_3", prompt: "Miedo intenso o sensación de peligro inminente.", options: LIKERT_0_3 },
      { id: "hama_4", prompt: "Dificultades para conciliar o mantener el sueño.", options: LIKERT_0_3 },
      { id: "hama_5", prompt: "Dificultad de concentración por ansiedad.", options: LIKERT_0_3 },
      { id: "hama_6", prompt: "Síntomas autonómicos (palpitaciones, sudoración, temblor).", options: LIKERT_0_3 },
      { id: "hama_7", prompt: "Síntomas gastrointestinales asociados a ansiedad.", options: LIKERT_0_3 },
      { id: "hama_8", prompt: "Evitación de situaciones por ansiedad.", options: LIKERT_0_3 },
    ],
    interpretation: [
      { min: 0, max: 7, label: "Mínima", meaning: "Ansiedad poco significativa." },
      { min: 8, max: 15, label: "Leve", meaning: "Ansiedad leve con impacto parcial." },
      { min: 16, max: 20, label: "Moderada", meaning: "Ansiedad moderada con deterioro funcional." },
      { min: 21, max: 24, label: "Severa", meaning: "Ansiedad severa; priorizar intervención clínica." },
    ],
  },
  {
    id: "ham_d_simplified",
    name: "Escala de Depresión de Hamilton (versión educativa simplificada)",
    short_name: "HAM-D-S",
    description: "Cuantifica intensidad depresiva con foco clínico educativo.",
    population: "Adultos",
    suggested_age_range: "18+",
    response_type: "likert_0_3",
    educational_only: true,
    items: [
      { id: "hamd_1", prompt: "Ánimo deprimido observado o referido.", options: LIKERT_0_3 },
      { id: "hamd_2", prompt: "Sentimientos de culpa.", options: LIKERT_0_3 },
      { id: "hamd_3", prompt: "Insomnio inicial/intermedio/tardío.", options: LIKERT_0_3 },
      { id: "hamd_4", prompt: "Disminución de actividad e interés.", options: LIKERT_0_3 },
      { id: "hamd_5", prompt: "Ansiedad psíquica acompañante.", options: LIKERT_0_3 },
      { id: "hamd_6", prompt: "Retardo psicomotor o agitación.", options: LIKERT_0_3 },
      { id: "hamd_7", prompt: "Síntomas somáticos generales.", options: LIKERT_0_3 },
      { id: "hamd_8", prompt: "Ideación de muerte/autolesión.", options: LIKERT_0_3 },
    ],
    interpretation: [
      { min: 0, max: 7, label: "Mínima", meaning: "Depresión clínica no evidente." },
      { min: 8, max: 13, label: "Leve", meaning: "Depresión leve probable." },
      { min: 14, max: 18, label: "Moderada", meaning: "Depresión moderada con impacto funcional." },
      { min: 19, max: 24, label: "Severa", meaning: "Depresión severa; ampliar plan de seguridad." },
    ],
  },
  {
    id: "suicide_risk_structured",
    name: "Riesgo suicida estructurado (educativo, inspirado en tamizajes clínicos)",
    short_name: "Riesgo-S",
    description:
      "Tamizaje estructurado de riesgo suicida para entrenamiento. No reemplaza evaluación clínica presencial.",
    population: "Adolescentes y adultos",
    suggested_age_range: "12+",
    response_type: "yes_no",
    educational_only: true,
    items: [
      { id: "risk_1", prompt: "¿Ha deseado no despertar o no seguir viviendo en las últimas 2 semanas?", options: YES_NO },
      { id: "risk_2", prompt: "¿Ha tenido pensamientos de hacerse daño?", options: YES_NO },
      { id: "risk_3", prompt: "¿Ha pensado en un método específico para suicidarse?", options: YES_NO_WEIGHTED },
      { id: "risk_4", prompt: "¿Tiene acceso actual a medios letales o planificó cuándo hacerlo?", options: YES_NO_WEIGHTED },
      { id: "risk_5", prompt: "¿Ha realizado intento previo de suicidio o autolesión grave?", options: YES_NO_WEIGHTED },
      { id: "risk_6", prompt: "¿Carece de red de apoyo o se siente completamente solo/a?", options: YES_NO },
      { id: "risk_7", prompt: "¿Existen razones claras para vivir que percibe como protectoras hoy?", options: [{ id: "yes", label: "Sí (protector)", value: 0 }, { id: "no", label: "No (riesgo)", value: 1 }] },
    ],
    interpretation: [
      { min: 0, max: 2, label: "Bajo", meaning: "Mantener monitoreo y fortalecer factores protectores." },
      { min: 3, max: 5, label: "Moderado", meaning: "Ampliar evaluación de riesgo y plan de seguridad." },
      { min: 6, max: 8, label: "Alto", meaning: "Riesgo elevado; priorizar medidas de seguridad y supervisión clínica." },
      { min: 9, max: 10, label: "Crítico", meaning: "Riesgo crítico; activar respuesta de urgencia según protocolo local." },
    ],
  },
  {
    id: "pending_validate",
    name: "Escala pendiente de validar",
    short_name: "Pendiente",
    description:
      "Placeholder para instrumento solicitado con nombre ambiguo (ej. “Sabash”). Reemplazar por escala validada antes de uso formal.",
    population: "Por definir",
    suggested_age_range: "Por definir",
    response_type: "multiple_choice",
    educational_only: true,
    placeholder: true,
    items: [
      {
        id: "pending_1",
        prompt: "Placeholder técnico: este ítem existe para validar estructura, no contenido clínico.",
        options: [
          { id: "opt_0", label: "0 · Sin puntaje clínico", value: 0 },
          { id: "opt_1", label: "1 · Sin puntaje clínico", value: 1 },
        ],
      },
    ],
    interpretation: [{ min: 0, max: 1, label: "Pendiente", meaning: "Escala no validada todavía." }],
  },
];

export const MENTAL_TESTS: TestDefinition[] = [
  {
    id: "mmse_edu",
    name: "Mini Mental State Examination (educativo)",
    short_name: "MMSE-Edu",
    description: "Tamizaje cognitivo breve orientativo para práctica clínica.",
    kind: "screening",
    applies_to: "adult",
    response_type: "multiple_choice",
    educational_only: true,
    items: [
      { id: "mmse_1", prompt: "Orientación temporal global.", options: LIKERT_0_3, domain: "orientación" },
      { id: "mmse_2", prompt: "Orientación espacial global.", options: LIKERT_0_3, domain: "orientación" },
      { id: "mmse_3", prompt: "Registro inmediato de 3 palabras.", options: LIKERT_0_3, domain: "memoria" },
      { id: "mmse_4", prompt: "Atención/cálculo serial simple.", options: LIKERT_0_3, domain: "atención" },
      { id: "mmse_5", prompt: "Recuerdo diferido de palabras.", options: LIKERT_0_3, domain: "memoria" },
      { id: "mmse_6", prompt: "Lenguaje (nombrar/repetir).", options: LIKERT_0_3, domain: "lenguaje" },
      { id: "mmse_7", prompt: "Comprensión de orden simple.", options: LIKERT_0_3, domain: "lenguaje" },
      { id: "mmse_8", prompt: "Praxis visuoconstructiva básica.", options: LIKERT_0_3, domain: "praxis" },
    ],
    interpretation: [
      { min: 0, max: 8, label: "Alteración marcada", meaning: "Compromiso cognitivo importante probable." },
      { min: 9, max: 16, label: "Alteración moderada", meaning: "Déficit cognitivo probable; ampliar evaluación." },
      { min: 17, max: 21, label: "Leve", meaning: "Hallazgos leves; correlacionar con contexto clínico." },
      { min: 22, max: 24, label: "Sin hallazgos relevantes", meaning: "Tamizaje sin alteración mayor evidente." },
    ],
    limitations: [
      "Depende de escolaridad/cultura y cooperación.",
      "No sustituye evaluación neuropsicológica formal.",
    ],
  },
  {
    id: "moca_simplified",
    name: "MoCA simplificado (educativo)",
    short_name: "MoCA-S",
    description: "Explora funciones ejecutivas, atención y memoria de forma orientativa.",
    kind: "screening",
    applies_to: "adult",
    response_type: "likert_0_3",
    educational_only: true,
    items: [
      { id: "moca_1", prompt: "Visuoespacial/ejecutivo.", options: LIKERT_0_3, domain: "ejecutivo" },
      { id: "moca_2", prompt: "Denominación.", options: LIKERT_0_3, domain: "lenguaje" },
      { id: "moca_3", prompt: "Atención sostenida.", options: LIKERT_0_3, domain: "atención" },
      { id: "moca_4", prompt: "Fluencia verbal.", options: LIKERT_0_3, domain: "lenguaje" },
      { id: "moca_5", prompt: "Abstracción.", options: LIKERT_0_3, domain: "ejecutivo" },
      { id: "moca_6", prompt: "Memoria diferida.", options: LIKERT_0_3, domain: "memoria" },
      { id: "moca_7", prompt: "Orientación global.", options: LIKERT_0_3, domain: "orientación" },
    ],
    interpretation: [
      { min: 0, max: 7, label: "Compromiso alto", meaning: "Compromiso cognitivo considerable probable." },
      { min: 8, max: 14, label: "Compromiso moderado", meaning: "Posible deterioro cognitivo; ampliar estudio." },
      { min: 15, max: 18, label: "Leve", meaning: "Alteraciones leves orientativas." },
      { min: 19, max: 21, label: "Rango esperado", meaning: "Sin alteración cognitiva significativa en tamizaje." },
    ],
    limitations: ["Versión simplificada no equivalente al MoCA oficial.", "Resultado orientativo."],
  },
  {
    id: "phq9",
    name: "Patient Health Questionnaire-9 (educativo)",
    short_name: "PHQ-9",
    description: "Tamizaje de sintomatología depresiva en dos semanas.",
    kind: "screening",
    applies_to: "both",
    response_type: "likert_0_4",
    educational_only: true,
    items: [
      { id: "phq_1", prompt: "Poco interés o placer en hacer cosas.", options: LIKERT_0_4 },
      { id: "phq_2", prompt: "Sentirse decaído/a o sin esperanza.", options: LIKERT_0_4 },
      { id: "phq_3", prompt: "Problemas para dormir o dormir demasiado.", options: LIKERT_0_4 },
      { id: "phq_4", prompt: "Cansancio o poca energía.", options: LIKERT_0_4 },
      { id: "phq_5", prompt: "Cambios de apetito.", options: LIKERT_0_4 },
      { id: "phq_6", prompt: "Sentirse mal consigo mismo/a.", options: LIKERT_0_4 },
      { id: "phq_7", prompt: "Dificultad para concentrarse.", options: LIKERT_0_4 },
      { id: "phq_8", prompt: "Lentitud o inquietud psicomotora.", options: LIKERT_0_4 },
      { id: "phq_9", prompt: "Pensamientos de muerte/autolesión.", options: LIKERT_0_4 },
    ],
    interpretation: [
      { min: 0, max: 4, label: "Mínimo", meaning: "Síntomas depresivos bajos." },
      { min: 5, max: 9, label: "Leve", meaning: "Depresión leve probable." },
      { min: 10, max: 14, label: "Moderado", meaning: "Depresión moderada probable." },
      { min: 15, max: 27, label: "Moderado-severo/severo", meaning: "Carga alta de síntomas; ampliar evaluación y seguridad." },
    ],
    limitations: ["Es tamizaje, no diagnóstico.", "Interpretar con entrevista clínica."],
  },
  {
    id: "gad7",
    name: "Generalized Anxiety Disorder-7 (educativo)",
    short_name: "GAD-7",
    description: "Tamizaje de ansiedad generalizada.",
    kind: "screening",
    applies_to: "both",
    response_type: "likert_0_4",
    educational_only: true,
    items: [
      { id: "gad_1", prompt: "Nerviosismo, ansiedad o tensión.", options: LIKERT_0_4 },
      { id: "gad_2", prompt: "Incapacidad para controlar preocupaciones.", options: LIKERT_0_4 },
      { id: "gad_3", prompt: "Preocupación excesiva por distintos temas.", options: LIKERT_0_4 },
      { id: "gad_4", prompt: "Dificultad para relajarse.", options: LIKERT_0_4 },
      { id: "gad_5", prompt: "Inquietud o incapacidad para quedarse quieto/a.", options: LIKERT_0_4 },
      { id: "gad_6", prompt: "Irritabilidad.", options: LIKERT_0_4 },
      { id: "gad_7", prompt: "Miedo a que ocurra algo terrible.", options: LIKERT_0_4 },
    ],
    interpretation: [
      { min: 0, max: 4, label: "Mínima", meaning: "Ansiedad baja." },
      { min: 5, max: 9, label: "Leve", meaning: "Ansiedad leve probable." },
      { min: 10, max: 14, label: "Moderada", meaning: "Ansiedad clínicamente relevante probable." },
      { min: 15, max: 21, label: "Severa", meaning: "Ansiedad alta con posible deterioro significativo." },
    ],
    limitations: ["Tamizaje orientativo.", "No reemplaza evaluación clínica."],
  },
  {
    id: "audit_simplified",
    name: "AUDIT simplificado (educativo)",
    short_name: "AUDIT-S",
    description: "Screening de consumo problemático de alcohol.",
    kind: "screening",
    applies_to: "adult",
    response_type: "multiple_choice",
    educational_only: true,
    items: [
      {
        id: "audit_1",
        prompt: "Frecuencia de consumo de alcohol.",
        options: [
          { id: "a0", label: "Nunca", value: 0 },
          { id: "a1", label: "Mensual o menos", value: 1 },
          { id: "a2", label: "2-4 veces/mes", value: 2 },
          { id: "a3", label: "2-3 veces/semana o más", value: 3 },
        ],
      },
      {
        id: "audit_2",
        prompt: "Cantidad típica por ocasión.",
        options: [
          { id: "b0", label: "1-2 tragos", value: 0 },
          { id: "b1", label: "3-4 tragos", value: 1 },
          { id: "b2", label: "5-6 tragos", value: 2 },
          { id: "b3", label: "7 o más tragos", value: 3 },
        ],
      },
      { id: "audit_3", prompt: "Episodios de consumo excesivo.", options: LIKERT_0_3 },
      { id: "audit_4", prompt: "Dificultad para detenerse una vez inicia.", options: LIKERT_0_3 },
      { id: "audit_5", prompt: "Problemas en obligaciones por beber.", options: LIKERT_0_3 },
      { id: "audit_6", prompt: "Preocupación de familiares por su consumo.", options: LIKERT_0_3 },
    ],
    interpretation: [
      { min: 0, max: 4, label: "Bajo", meaning: "Sin indicios relevantes de uso problemático." },
      { min: 5, max: 9, label: "Riesgo", meaning: "Consumo de riesgo; ampliar entrevista motivacional." },
      { min: 10, max: 14, label: "Alto riesgo", meaning: "Probable consumo problemático." },
      { min: 15, max: 18, label: "Muy alto", meaning: "Alta probabilidad de trastorno por uso de alcohol." },
    ],
    limitations: ["Puede subestimar consumo por deseabilidad social.", "Requiere corroboración clínica."],
  },
  {
    id: "family_support_brief",
    name: "Funcionamiento familiar y apoyo social (breve)",
    short_name: "FFAS-B",
    description: "Explora soporte y conflicto familiar de forma orientativa.",
    kind: "orientative_assessment",
    applies_to: "both",
    response_type: "likert_0_3",
    educational_only: true,
    items: [
      { id: "fam_1", prompt: "Percibe apoyo emocional en su núcleo familiar.", options: LIKERT_0_3.map((o) => ({ ...o, value: 3 - o.value })) },
      { id: "fam_2", prompt: "Existe comunicación efectiva en casa.", options: LIKERT_0_3.map((o) => ({ ...o, value: 3 - o.value })) },
      { id: "fam_3", prompt: "Siente conflicto o tensión persistente en casa.", options: LIKERT_0_3 },
      { id: "fam_4", prompt: "Cuenta con una red de apoyo fuera del hogar.", options: LIKERT_0_3.map((o) => ({ ...o, value: 3 - o.value })) },
      { id: "fam_5", prompt: "Se siente solo/a frente a sus problemas.", options: LIKERT_0_3 },
    ],
    interpretation: [
      { min: 0, max: 4, label: "Soporte adecuado", meaning: "Red de apoyo funcional en general." },
      { min: 5, max: 9, label: "Vulnerabilidad moderada", meaning: "Necesita fortalecimiento de soporte y comunicación." },
      { min: 10, max: 15, label: "Vulnerabilidad alta", meaning: "Conflicto/aislamiento importante; priorizar intervención psicosocial." },
    ],
    limitations: ["No reemplaza instrumentos familiares validados.", "Útil como guía de entrevista."],
  },
];

export function getScaleById(id: string) {
  return CLINICAL_SCALES.find((s) => s.id === id) ?? null;
}

export function getTestById(id: string) {
  return MENTAL_TESTS.find((t) => t.id === id) ?? null;
}

export function resolveInterpretation(
  interpretation: Array<{ min: number; max: number; label: string; meaning: string }>,
  score: number
) {
  return (
    interpretation.find((r) => score >= r.min && score <= r.max) ??
    interpretation[interpretation.length - 1] ?? {
      min: 0,
      max: 0,
      label: "Sin rango",
      meaning: "Sin interpretación configurada.",
    }
  );
}

function computeMaxScore(items: Array<{ options: AssessmentOption[] }>) {
  return items.reduce((acc, item) => {
    const max = item.options.reduce((m, o) => Math.max(m, Number(o.value) || 0), 0);
    return acc + max;
  }, 0);
}

export function scoreScale(definition: ScaleDefinition, answers: ScaleAnswer[]): ScaleResult {
  const total = answers.reduce((acc, a) => acc + (Number.isFinite(a.value) ? a.value : 0), 0);
  const maxScore = computeMaxScore(definition.items);
  const band = resolveInterpretation(definition.interpretation, total);
  const riskAlert = definition.id.includes("risk") && total >= 6;
  return {
    scale_id: definition.id,
    total_score: total,
    max_score: maxScore,
    severity_label: band.label,
    interpretation: band.meaning,
    completed_items: answers.length,
    completed_at: new Date().toISOString(),
    risk_alert: riskAlert,
    educational_note: "Resultado orientativo de uso educativo. No sustituye valoración clínica real.",
  };
}

export function scoreTest(definition: TestDefinition, answers: TestAnswer[]): TestResult {
  const total = answers.reduce((acc, a) => acc + (Number.isFinite(a.value) ? a.value : 0), 0);
  const maxScore = computeMaxScore(definition.items);
  const band = resolveInterpretation(definition.interpretation, total);

  const observations: string[] = [];
  if (definition.id.includes("mmse") || definition.id.includes("moca")) {
    observations.push("Interpretar según escolaridad y contexto sociocultural.");
  }
  if (definition.id.includes("phq") || definition.id.includes("gad")) {
    observations.push("Correlacionar con entrevista clínica y funcionalidad.");
  }
  if (definition.id.includes("audit")) {
    observations.push("Explorar patrón de consumo, consecuencias y motivación al cambio.");
  }

  return {
    test_id: definition.id,
    total_score: total,
    max_score: maxScore,
    classification: band.label,
    interpretation: band.meaning,
    observations,
    limitations: definition.limitations,
    completed_items: answers.length,
    completed_at: new Date().toISOString(),
    educational_note: "Resultado orientativo para entrenamiento. No reemplaza diagnóstico ni juicio clínico.",
  };
}

