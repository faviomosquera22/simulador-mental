export type TriageCareerId = "medicina" | "enfermeria" | "obstetricia" | "fisioterapia" | "psicologia";

export type TriageMetricKey =
  | "patientSafety"
  | "responseTime"
  | "resourceUse"
  | "teamCommunication"
  | "protocolCompliance";

export type TriageMetricScores = Record<TriageMetricKey, number>;

export type TriageOptionTag =
  | "safe_choice"
  | "undertriage"
  | "delay"
  | "overuse"
  | "premature_closure"
  | "weak_handoff";

export type TriageStepOption = {
  id: string;
  label: string;
  summary: string;
  impact: Partial<TriageMetricScores>;
  tags: TriageOptionTag[];
  npcReply: string;
};

export type TriageStep = {
  id: string;
  title: string;
  prompt: string;
  hint: string;
  options: TriageStepOption[];
};

export type TriageScenario = {
  id: string;
  title: string;
  setting: string;
  patientSummary: string;
  chiefComplaint: string;
  learningGoal: string;
  roleObjectiveByCareer: Partial<Record<TriageCareerId, string>>;
  steps: TriageStep[];
};

export type TriageCareer = {
  id: TriageCareerId;
  name: string;
  description: string;
  weights: Record<TriageMetricKey, number>;
  focus: string[];
};

export type TriageDecisionRecord = {
  stepId: string;
  optionId: string;
  impact: Partial<TriageMetricScores>;
  tags: TriageOptionTag[];
};

export type TriageStepReview = {
  stepId: string;
  title: string;
  selectedLabel: string;
  selectedSummary: string;
  bestLabel: string;
  bestSummary: string;
  isBestChoice: boolean;
};

export type TriageDebrief = {
  weightedScore: number;
  level: "Excelente" | "Competente" | "En desarrollo" | "Critico";
  metricScores: TriageMetricScores;
  flags: string[];
  strengths: string[];
  improvementAreas: string[];
  stepReviews: TriageStepReview[];
};

const DEFAULT_BASELINE = 50;

export const TRIAGE_METRIC_KEYS: TriageMetricKey[] = [
  "patientSafety",
  "responseTime",
  "resourceUse",
  "teamCommunication",
  "protocolCompliance",
];

export const TRIAGE_METRIC_LABELS: Record<TriageMetricKey, string> = {
  patientSafety: "Seguridad del paciente",
  responseTime: "Tiempo de respuesta",
  resourceUse: "Uso de recursos",
  teamCommunication: "Comunicacion interprofesional",
  protocolCompliance: "Cumplimiento de protocolo",
};

export const TRIAGE_CAREERS: readonly TriageCareer[] = [
  {
    id: "medicina",
    name: "Medicina",
    description: "Priorizacion clinica, diferenciales y decisiones de manejo inicial.",
    weights: {
      patientSafety: 0.34,
      responseTime: 0.22,
      resourceUse: 0.14,
      teamCommunication: 0.08,
      protocolCompliance: 0.22,
    },
    focus: [
      "Reconocer sindromes tiempo-dependientes.",
      "Integrar pruebas iniciales con criterio.",
      "Escalar rapido cuando hay riesgo vital.",
    ],
  },
  {
    id: "enfermeria",
    name: "Enfermeria",
    description: "Valoracion ABCDE, monitorizacion, seguridad y continuidad del cuidado.",
    weights: {
      patientSafety: 0.3,
      responseTime: 0.2,
      resourceUse: 0.1,
      teamCommunication: 0.22,
      protocolCompliance: 0.18,
    },
    focus: [
      "Detectar deterioro clinico de forma temprana.",
      "Coordinar handoff y escalamiento seguro.",
      "Mantener trazabilidad de signos y acciones.",
    ],
  },
  {
    id: "obstetricia",
    name: "Obstetricia",
    description: "Triage materno-fetal, seguridad obstetrica y activacion oportuna.",
    weights: {
      patientSafety: 0.32,
      responseTime: 0.2,
      resourceUse: 0.12,
      teamCommunication: 0.14,
      protocolCompliance: 0.22,
    },
    focus: [
      "Priorizar signos de alarma obstetrica.",
      "Integrar evaluacion materna y fetal.",
      "Coordinar referencia con equipo de alto riesgo.",
    ],
  },
  {
    id: "fisioterapia",
    name: "Fisioterapia",
    description: "Deteccion de banderas rojas, decision de derivacion y trabajo en equipo.",
    weights: {
      patientSafety: 0.24,
      responseTime: 0.16,
      resourceUse: 0.2,
      teamCommunication: 0.24,
      protocolCompliance: 0.16,
    },
    focus: [
      "Identificar cuando no es seguro continuar evaluacion funcional.",
      "Derivar con datos claros y completos.",
      "Evitar intervenciones no prioritarias en urgencia.",
    ],
  },
  {
    id: "psicologia",
    name: "Psicologia",
    description: "Contencion, comunicacion de riesgo y derivacion oportuna en emergencia.",
    weights: {
      patientSafety: 0.25,
      responseTime: 0.12,
      resourceUse: 0.12,
      teamCommunication: 0.33,
      protocolCompliance: 0.18,
    },
    focus: [
      "Comunicar riesgos clinicos sin retrasar la atencion medica.",
      "Asegurar handoff estructurado al equipo tratante.",
      "Acompanar al paciente sin perder foco de seguridad.",
    ],
  },
];

const CHEST_PAIN_SCENARIO: TriageScenario = {
  id: "chest-pain-emergency-v1",
  title: "Dolor toracico en emergencia",
  setting: "Servicio de emergencia general",
  patientSummary: "Paciente de 58 anos, diaforesis, palidez y dolor toracico opresivo de 35 minutos.",
  chiefComplaint: "Dolor toracico 8/10 con disnea y nausea.",
  learningGoal: "Detectar riesgo, priorizar triage y definir manejo inicial seguro.",
  roleObjectiveByCareer: {
    medicina: "Identifica sindrome coronario probable y activa manejo inicial con criterio.",
    enfermeria: "Ejecuta valoracion inmediata, monitoriza y escala con comunicacion clara.",
    fisioterapia: "Reconoce banderas rojas y realiza derivacion urgente efectiva.",
    psicologia: "Aporta contencion breve sin retrasar el flujo clinico critico.",
  },
  steps: [
    {
      id: "triage-priority",
      title: "Paso 1: prioridad de triage",
      prompt: "Llega el paciente con dolor toracico activo, sudoracion fria y dificultad respiratoria.",
      hint: "Define prioridad antes de cualquier entrevista extensa.",
      options: [
        {
          id: "priority-high",
          label: "Clasificar prioridad alta y activar ruta de dolor toracico de inmediato.",
          summary: "Buena decision: reduce demora en eventos tiempo-dependientes.",
          impact: { patientSafety: 18, responseTime: 15, resourceUse: 8, teamCommunication: 10, protocolCompliance: 16 },
          tags: ["safe_choice"],
          npcReply: "Equipo de triaje responde rapido. El paciente es llevado a monitorizacion continua.",
        },
        {
          id: "priority-medium",
          label: "Clasificar prioridad intermedia y esperar laboratorio antes de escalar.",
          summary: "Parcial: reconoce riesgo, pero puede retrasar intervenciones clave.",
          impact: { patientSafety: 2, responseTime: -6, resourceUse: 4, teamCommunication: -2, protocolCompliance: -5 },
          tags: ["delay"],
          npcReply: "El paciente espera varios minutos. El dolor persiste y aumenta la inquietud del equipo.",
        },
        {
          id: "priority-low",
          label: "Enviar a sala de espera porque el paciente esta consciente y orientado.",
          summary: "Riesgo alto de infratriaje y evento adverso.",
          impact: { patientSafety: -20, responseTime: -18, resourceUse: -5, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "delay"],
          npcReply: "El cuadro se deteriora en sala de espera. Se requiere reingreso urgente.",
        },
      ],
    },
    {
      id: "focused-questions",
      title: "Paso 2: preguntas clave",
      prompt: "Tienes 90 segundos para orientar la evaluacion inicial.",
      hint: "Prioriza caracteristicas del dolor y sintomas asociados de alto riesgo.",
      options: [
        {
          id: "questions-focused",
          label: "Aplicar esquema breve: inicio, irradiacion, factores de riesgo y sintomas asociados.",
          summary: "Buena orientacion diagnostica sin perder tiempo.",
          impact: { patientSafety: 12, responseTime: 8, resourceUse: 6, teamCommunication: 4, protocolCompliance: 10 },
          tags: ["safe_choice"],
          npcReply: "Con esa informacion, el equipo reconoce alta probabilidad de sindrome coronario.",
        },
        {
          id: "questions-basic",
          label: "Preguntar solo intensidad del dolor y antecedentes generales.",
          summary: "Insuficiente para estratificar riesgo completo.",
          impact: { patientSafety: 1, responseTime: 2, resourceUse: 1, teamCommunication: -2, protocolCompliance: -1 },
          tags: [],
          npcReply: "La informacion ayuda poco. Aun faltan datos criticos para decidir rapido.",
        },
        {
          id: "questions-bias",
          label: "Asumir ansiedad y enfocar la entrevista en estres sin descartar causas organicas.",
          summary: "Cierre prematuro con riesgo de error clinico.",
          impact: { patientSafety: -12, responseTime: -8, resourceUse: 2, teamCommunication: -6, protocolCompliance: -10 },
          tags: ["premature_closure", "delay"],
          npcReply: "El paciente refiere mas dolor y mareo. El equipo cuestiona el enfoque inicial.",
        },
      ],
    },
    {
      id: "monitoring",
      title: "Paso 3: monitorizacion inicial",
      prompt: "Debes indicar que acciones de monitorizacion realizar primero.",
      hint: "Piensa en seguridad inmediata y parametros criticos.",
      options: [
        {
          id: "monitor-complete",
          label: "Tomar signos completos, ECG en <10 min, via venosa y oximetria continua.",
          summary: "Establece base segura para decisiones tempranas.",
          impact: { patientSafety: 15, responseTime: 12, resourceUse: 6, teamCommunication: 8, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "Se detectan cambios electrocardiograficos tempranos y se acelera el manejo.",
        },
        {
          id: "monitor-partial",
          label: "Registrar solo frecuencia cardiaca y temperatura, luego reevaluar.",
          summary: "Cobertura parcial con riesgo de omitir deterioro.",
          impact: { patientSafety: 3, responseTime: 1, resourceUse: 4, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "El equipo pide completar datos porque no alcanza para estratificar riesgo.",
        },
        {
          id: "monitor-delay",
          label: "Esperar indicacion medica formal antes de monitorizar.",
          summary: "Demora evitable en un cuadro potencialmente inestable.",
          impact: { patientSafety: -16, responseTime: -14, resourceUse: -4, teamCommunication: -6, protocolCompliance: -12 },
          tags: ["delay", "weak_handoff"],
          npcReply: "El dolor aumenta y la saturacion cae antes de completar el monitoreo.",
        },
      ],
    },
    {
      id: "initial-tests",
      title: "Paso 4: pruebas iniciales",
      prompt: "Debes priorizar estudios iniciales para orientar manejo inmediato.",
      hint: "No pidas todo: elige pruebas de alto rendimiento al inicio.",
      options: [
        {
          id: "tests-targeted",
          label: "Priorizar ECG, troponina seriada y analitica basica segun protocolo local.",
          summary: "Uso eficiente de recursos con alto valor clinico.",
          impact: { patientSafety: 14, responseTime: 10, resourceUse: 4, teamCommunication: 6, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "Los hallazgos apoyan alta sospecha coronaria y se activa ruta de manejo.",
        },
        {
          id: "tests-overuse",
          label: "Solicitar panel amplio de estudios no prioritarios antes de actuar.",
          summary: "Aumenta consumo de recursos y puede retrasar decisiones utiles.",
          impact: { patientSafety: 4, responseTime: -2, resourceUse: -10, teamCommunication: 1, protocolCompliance: -2 },
          tags: ["overuse", "delay"],
          npcReply: "Se generan ordenes extensas pero sin acelerar la decision critica.",
        },
        {
          id: "tests-none",
          label: "No solicitar estudios mientras baje el dolor espontaneamente.",
          summary: "Riesgo alto de omitir diagnosticos graves.",
          impact: { patientSafety: -15, responseTime: -12, resourceUse: 2, teamCommunication: -4, protocolCompliance: -10 },
          tags: ["undertriage", "premature_closure"],
          npcReply: "El dolor disminuye unos minutos, luego reaparece con mayor intensidad.",
        },
      ],
    },
    {
      id: "initial-action",
      title: "Paso 5: primera accion terapeutica",
      prompt: "Define la accion inicial mientras llega el equipo completo.",
      hint: "Combina estabilizacion, seguridad y comunicacion efectiva.",
      options: [
        {
          id: "action-safe",
          label: "Iniciar estabilizacion ABC, medidas iniciales seguras y escalar de inmediato al equipo.",
          summary: "Decision segura: protege al paciente y alinea al equipo.",
          impact: { patientSafety: 18, responseTime: 14, resourceUse: 4, teamCommunication: 10, protocolCompliance: 16 },
          tags: ["safe_choice"],
          npcReply: "El equipo responde coordinado. Se reduce riesgo de complicaciones tempranas.",
        },
        {
          id: "action-watch",
          label: "Control sintomatico basico y observacion prolongada antes de escalar.",
          summary: "Puede parecer estable, pero retrasa decisiones de alto impacto.",
          impact: { patientSafety: -2, responseTime: -6, resourceUse: 1, teamCommunication: -2, protocolCompliance: -4 },
          tags: ["delay"],
          npcReply: "El paciente mantiene dolor y el equipo solicita reevaluacion urgente.",
        },
        {
          id: "action-discharge",
          label: "Dar alta con analgesico si hay alivio parcial del dolor.",
          summary: "Conducta insegura en contexto de riesgo coronario.",
          impact: { patientSafety: -25, responseTime: -20, resourceUse: 4, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "premature_closure", "weak_handoff"],
          npcReply: "Decision de alto riesgo: se pierde oportunidad de manejo temprano.",
        },
      ],
    },
  ],
};

const OBSTETRIC_SCENARIO: TriageScenario = {
  id: "obstetric-emergency-v1",
  title: "Gestante con dolor toracico e hipertension",
  setting: "Emergencia obstetrica",
  patientSummary: "Gestante de 32 semanas con dolor toracico, disnea, cefalea intensa y TA 168/110.",
  chiefComplaint: "Dolor toracico, vision borrosa y disminucion de movimientos fetales.",
  learningGoal: "Priorizar riesgo materno-fetal y activar ruta de emergencia obstetrica.",
  roleObjectiveByCareer: {
    obstetricia: "Integra evaluacion materna y fetal desde el primer contacto.",
    enfermeria: "Monitoriza signos criticos y activa escalamiento obstetrico oportuno.",
    medicina: "Define diferenciales obstetricos graves y coordina manejo inicial.",
  },
  steps: [
    {
      id: "ob-priority",
      title: "Paso 1: prioridad de triage",
      prompt: "Llega gestante con hipertension severa y disnea. Debes asignar prioridad.",
      hint: "El binomio materno-fetal requiere activacion temprana.",
      options: [
        {
          id: "ob-priority-high",
          label: "Prioridad alta y activacion inmediata de codigo obstetrico.",
          summary: "Conducta correcta para reducir riesgo materno y fetal.",
          impact: { patientSafety: 18, responseTime: 16, resourceUse: 8, teamCommunication: 10, protocolCompliance: 17 },
          tags: ["safe_choice"],
          npcReply: "Se moviliza equipo obstetrico y se acelera valoracion integral.",
        },
        {
          id: "ob-priority-mid",
          label: "Prioridad intermedia y observacion breve antes de activar codigo.",
          summary: "Reconoce riesgo, pero la demora puede ser peligrosa.",
          impact: { patientSafety: 1, responseTime: -7, resourceUse: 3, teamCommunication: -2, protocolCompliance: -6 },
          tags: ["delay"],
          npcReply: "La paciente mantiene TA critica y aumenta la cefalea.",
        },
        {
          id: "ob-priority-low",
          label: "Manejo ambulatorio inicial porque esta consciente.",
          summary: "Infratriaje de alto riesgo obstetrico.",
          impact: { patientSafety: -22, responseTime: -20, resourceUse: -4, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "delay"],
          npcReply: "Se posterga atencion critica y aumenta riesgo materno-fetal.",
        },
      ],
    },
    {
      id: "ob-focused-questions",
      title: "Paso 2: preguntas clave",
      prompt: "Necesitas preguntas dirigidas para orientar riesgo obstetrico inmediato.",
      hint: "Prioriza signos de alarma materna y estado fetal.",
      options: [
        {
          id: "ob-questions-focused",
          label: "Preguntar por cefalea, dolor epigastrico, vision borrosa y movimientos fetales.",
          summary: "Buena identificacion de signos de alarma obstetrica.",
          impact: { patientSafety: 12, responseTime: 9, resourceUse: 5, teamCommunication: 4, protocolCompliance: 11 },
          tags: ["safe_choice"],
          npcReply: "Se confirma disminucion de movimientos fetales y empeoramiento de sintomas.",
        },
        {
          id: "ob-questions-basic",
          label: "Preguntar solo semanas de gestacion y dolor actual.",
          summary: "Insuficiente para estratificar riesgo completo.",
          impact: { patientSafety: 1, responseTime: 1, resourceUse: 1, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "Aun faltan datos para tomar decisiones urgentes.",
        },
        {
          id: "ob-questions-closure",
          label: "Atribuir sintomas a ansiedad del embarazo sin explorar alarma.",
          summary: "Cierre prematuro con alto riesgo de error.",
          impact: { patientSafety: -14, responseTime: -10, resourceUse: 2, teamCommunication: -5, protocolCompliance: -11 },
          tags: ["premature_closure", "delay"],
          npcReply: "La paciente reporta vision borrosa progresiva y malestar intenso.",
        },
      ],
    },
    {
      id: "ob-monitoring",
      title: "Paso 3: monitorizacion inicial",
      prompt: "Selecciona el monitoreo mas seguro en este contexto.",
      hint: "Integra control materno y bienestar fetal.",
      options: [
        {
          id: "ob-monitor-complete",
          label: "Control materno completo, monitor fetal y acceso venoso inmediato.",
          summary: "Conducta integral para vigilancia temprana.",
          impact: { patientSafety: 16, responseTime: 12, resourceUse: 6, teamCommunication: 8, protocolCompliance: 13 },
          tags: ["safe_choice"],
          npcReply: "Se identifican signos persistentes de gravedad y se coordina manejo avanzado.",
        },
        {
          id: "ob-monitor-partial",
          label: "Tomar solo presion arterial y reevaluar mas tarde.",
          summary: "Insuficiente para escenario materno-fetal de riesgo.",
          impact: { patientSafety: 2, responseTime: -1, resourceUse: 3, teamCommunication: -2, protocolCompliance: -3 },
          tags: ["delay"],
          npcReply: "Se pierde visibilidad de evolucion fetal y materna durante minutos criticos.",
        },
        {
          id: "ob-monitor-delay",
          label: "Esperar indicacion diferida para iniciar vigilancia obstetrica.",
          summary: "Demora evitable en evento potencialmente grave.",
          impact: { patientSafety: -17, responseTime: -15, resourceUse: -4, teamCommunication: -7, protocolCompliance: -13 },
          tags: ["delay", "weak_handoff"],
          npcReply: "La condicion se vuelve inestable antes de completar la monitorizacion.",
        },
      ],
    },
    {
      id: "ob-tests",
      title: "Paso 4: pruebas iniciales",
      prompt: "Debes priorizar pruebas de mayor valor inicial.",
      hint: "Busca equilibrio entre urgencia y pertinencia clinica.",
      options: [
        {
          id: "ob-tests-targeted",
          label: "Solicitar estudios dirigidos maternos y fetales segun protocolo de emergencia.",
          summary: "Buen equilibrio entre seguridad, tiempo y recursos.",
          impact: { patientSafety: 14, responseTime: 10, resourceUse: 4, teamCommunication: 6, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "Los resultados orientan conducta inmediata y mejor coordinacion del equipo.",
        },
        {
          id: "ob-tests-overuse",
          label: "Pedir panel extenso no prioritario antes de cualquier decision.",
          summary: "Incrementa consumo y puede retrasar acciones criticas.",
          impact: { patientSafety: 3, responseTime: -3, resourceUse: -10, teamCommunication: 1, protocolCompliance: -3 },
          tags: ["overuse", "delay"],
          npcReply: "Se ocupan recursos sin resolver primero la urgencia principal.",
        },
        {
          id: "ob-tests-none",
          label: "No pedir estudios mientras se normaliza espontaneamente la presion.",
          summary: "Riesgo de perder diagnostico severo.",
          impact: { patientSafety: -15, responseTime: -12, resourceUse: 2, teamCommunication: -4, protocolCompliance: -10 },
          tags: ["undertriage", "premature_closure"],
          npcReply: "Persisten signos de alarma y se pierde tiempo de intervencion.",
        },
      ],
    },
    {
      id: "ob-action",
      title: "Paso 5: primera accion",
      prompt: "Define la accion inicial mientras llega el equipo completo.",
      hint: "Prioriza estabilizacion y escalamiento protocolizado.",
      options: [
        {
          id: "ob-action-safe",
          label: "Iniciar estabilizacion y ruta obstetrica urgente segun protocolo institucional.",
          summary: "Buena respuesta para reducir riesgo inmediato.",
          impact: { patientSafety: 18, responseTime: 14, resourceUse: 4, teamCommunication: 10, protocolCompliance: 16 },
          tags: ["safe_choice"],
          npcReply: "La coordinacion interprofesional mejora y se protege el binomio materno-fetal.",
        },
        {
          id: "ob-action-watch",
          label: "Observar evolucion antes de activar manejo de emergencia.",
          summary: "Demora que puede comprometer seguridad.",
          impact: { patientSafety: -3, responseTime: -7, resourceUse: 1, teamCommunication: -2, protocolCompliance: -5 },
          tags: ["delay"],
          npcReply: "Los sintomas se intensifican y obliga a reactivar el proceso de forma tardia.",
        },
        {
          id: "ob-action-discharge",
          label: "Dar egreso con control ambulatorio en 24 horas.",
          summary: "Conducta insegura en cuadro obstetrico severo.",
          impact: { patientSafety: -24, responseTime: -20, resourceUse: 4, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "premature_closure", "weak_handoff"],
          npcReply: "Decision de muy alto riesgo: aumenta probabilidad de evento adverso.",
        },
      ],
    },
  ],
};

function clampMetric(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_BASELINE;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createInitialTriageScores(): TriageMetricScores {
  return {
    patientSafety: DEFAULT_BASELINE,
    responseTime: DEFAULT_BASELINE,
    resourceUse: DEFAULT_BASELINE,
    teamCommunication: DEFAULT_BASELINE,
    protocolCompliance: DEFAULT_BASELINE,
  };
}

export function getCareerById(careerId: TriageCareerId): TriageCareer {
  return TRIAGE_CAREERS.find((career) => career.id === careerId) ?? TRIAGE_CAREERS[0];
}

export function getScenarioForCareer(careerId: TriageCareerId): TriageScenario {
  return careerId === "obstetricia" ? OBSTETRIC_SCENARIO : CHEST_PAIN_SCENARIO;
}

export function applyOptionImpact(current: TriageMetricScores, impact: Partial<TriageMetricScores>): TriageMetricScores {
  return {
    patientSafety: clampMetric(current.patientSafety + (impact.patientSafety ?? 0)),
    responseTime: clampMetric(current.responseTime + (impact.responseTime ?? 0)),
    resourceUse: clampMetric(current.resourceUse + (impact.resourceUse ?? 0)),
    teamCommunication: clampMetric(current.teamCommunication + (impact.teamCommunication ?? 0)),
    protocolCompliance: clampMetric(current.protocolCompliance + (impact.protocolCompliance ?? 0)),
  };
}

function optionWeightedDelta(option: TriageStepOption, career: TriageCareer) {
  return TRIAGE_METRIC_KEYS.reduce((acc, key) => {
    const delta = option.impact[key] ?? 0;
    return acc + delta * career.weights[key];
  }, 0);
}

export function getBestOptionForCareer(step: TriageStep, career: TriageCareer): TriageStepOption {
  return [...step.options].sort((a, b) => optionWeightedDelta(b, career) - optionWeightedDelta(a, career))[0];
}

function weightedScore(scores: TriageMetricScores, career: TriageCareer) {
  const score = TRIAGE_METRIC_KEYS.reduce((acc, key) => acc + scores[key] * career.weights[key], 0);
  return clampMetric(score);
}

function levelFromScore(score: number): TriageDebrief["level"] {
  if (score >= 85) return "Excelente";
  if (score >= 70) return "Competente";
  if (score >= 55) return "En desarrollo";
  return "Critico";
}

function detectFlags(decisions: TriageDecisionRecord[], scores: TriageMetricScores): string[] {
  const countByTag = decisions.reduce<Record<TriageOptionTag, number>>(
    (acc, decision) => {
      for (const tag of decision.tags) acc[tag] += 1;
      return acc;
    },
    {
      safe_choice: 0,
      undertriage: 0,
      delay: 0,
      overuse: 0,
      premature_closure: 0,
      weak_handoff: 0,
    }
  );

  const flags: string[] = [];

  if (countByTag.undertriage >= 2) {
    flags.push("Patron de infratriaje: revisar criterios de prioridad y riesgo vital.");
  }
  if (countByTag.delay >= 2) {
    flags.push("Demora operativa repetida: ajusta decisiones para escenarios tiempo-dependientes.");
  }
  if (countByTag.premature_closure >= 1) {
    flags.push("Cierre diagnostico prematuro: confirma hipotesis antes de descartar emergencias.");
  }
  if (countByTag.overuse >= 1) {
    flags.push("Uso ineficiente de recursos: prioriza pruebas con alto rendimiento inicial.");
  }
  if (countByTag.weak_handoff >= 1) {
    flags.push("Comunicacion de escalamiento debil: usa handoff estructurado y accionable.");
  }
  if (!flags.length && scores.patientSafety >= 70 && scores.protocolCompliance >= 70) {
    flags.push("Buen control de seguridad: mantuviste decisiones consistentes con protocolo.");
  }

  return flags;
}

function summarizeStrengths(scores: TriageMetricScores): string[] {
  return TRIAGE_METRIC_KEYS.filter((key) => scores[key] >= 75).map((key) => TRIAGE_METRIC_LABELS[key]);
}

function summarizeImprovements(scores: TriageMetricScores): string[] {
  return TRIAGE_METRIC_KEYS.filter((key) => scores[key] < 60).map((key) => TRIAGE_METRIC_LABELS[key]);
}

export function evaluateTriageSession(args: {
  career: TriageCareer;
  scenario: TriageScenario;
  scores: TriageMetricScores;
  decisions: TriageDecisionRecord[];
}): TriageDebrief {
  const { career, scenario, scores, decisions } = args;

  const stepReviews: TriageStepReview[] = scenario.steps.map((step) => {
    const selectedDecision = decisions.find((decision) => decision.stepId === step.id);
    const selectedOption =
      step.options.find((option) => option.id === selectedDecision?.optionId) ??
      step.options[0];

    const bestOption = getBestOptionForCareer(step, career);

    return {
      stepId: step.id,
      title: step.title,
      selectedLabel: selectedOption.label,
      selectedSummary: selectedOption.summary,
      bestLabel: bestOption.label,
      bestSummary: bestOption.summary,
      isBestChoice: selectedOption.id === bestOption.id,
    };
  });

  const score = weightedScore(scores, career);
  const strengths = summarizeStrengths(scores);
  const improvementAreas = summarizeImprovements(scores);

  return {
    weightedScore: score,
    level: levelFromScore(score),
    metricScores: scores,
    flags: detectFlags(decisions, scores),
    strengths,
    improvementAreas,
    stepReviews,
  };
}
