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

const STROKE_SCENARIO: TriageScenario = {
  id: "stroke-emergency-v1",
  title: "Sospecha de ACV en emergencia",
  setting: "Emergencia general",
  patientSummary: "Paciente de 67 anos con disartria, desviacion de comisura y debilidad en hemicuerpo derecho.",
  chiefComplaint: "Inicio brusco de deficit neurologico hace 45 minutos.",
  learningGoal: "Reconocer ACV tiempo-dependiente y activar codigo neurologico sin retrasos.",
  roleObjectiveByCareer: {
    medicina: "Define ventana terapeutica y coordina manejo inicial urgente.",
    enfermeria: "Ejecuta monitorizacion neurologica y handoff seguro al equipo.",
    fisioterapia: "Reconoce banderas rojas neurologicas y deriva de forma inmediata.",
    psicologia: "Apoya comunicacion y contencion familiar sin retrasar ruta critica.",
  },
  steps: [
    {
      id: "stroke-priority",
      title: "Paso 1: prioridad de triage",
      prompt: "Llega paciente con deficit focal neurologico de inicio reciente.",
      hint: "En ACV, cada minuto impacta en pronostico funcional.",
      options: [
        {
          id: "stroke-priority-high",
          label: "Prioridad alta y activacion inmediata de codigo ACV.",
          summary: "Decision segura para un evento tiempo-dependiente.",
          impact: { patientSafety: 18, responseTime: 16, resourceUse: 7, teamCommunication: 10, protocolCompliance: 17 },
          tags: ["safe_choice"],
          npcReply: "Neurologia es notificada de inmediato y el circuito se acelera.",
        },
        {
          id: "stroke-priority-mid",
          label: "Prioridad intermedia y observacion breve antes de escalar.",
          summary: "Reconoce riesgo, pero retrasa ventana terapeutica.",
          impact: { patientSafety: 2, responseTime: -8, resourceUse: 3, teamCommunication: -2, protocolCompliance: -7 },
          tags: ["delay"],
          npcReply: "Se pierden minutos criticos mientras persiste el deficit neurologico.",
        },
        {
          id: "stroke-priority-low",
          label: "Triage no urgente porque el paciente aun esta consciente.",
          summary: "Infratriaje con alto riesgo de secuela permanente.",
          impact: { patientSafety: -22, responseTime: -20, resourceUse: -5, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "delay"],
          npcReply: "El paciente empeora y se activa codigo de forma tardia.",
        },
      ],
    },
    {
      id: "stroke-questions",
      title: "Paso 2: preguntas clave",
      prompt: "Debes orientar la historia en menos de 90 segundos.",
      hint: "Prioriza inicio de sintomas, ultima vez visto bien y antecedentes criticos.",
      options: [
        {
          id: "stroke-questions-focused",
          label: "Preguntar hora exacta de inicio, anticoagulantes, comorbilidades y progresion del deficit.",
          summary: "Aporta datos clave para decision terapeutica urgente.",
          impact: { patientSafety: 12, responseTime: 9, resourceUse: 6, teamCommunication: 4, protocolCompliance: 10 },
          tags: ["safe_choice"],
          npcReply: "Con esos datos, el equipo confirma ventana de intervencion.",
        },
        {
          id: "stroke-questions-basic",
          label: "Preguntar solo edad y sintoma principal.",
          summary: "Insuficiente para definir ruta de manejo oportuna.",
          impact: { patientSafety: 1, responseTime: 1, resourceUse: 1, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "La informacion sigue incompleta para tomar decisiones urgentes.",
        },
        {
          id: "stroke-questions-closure",
          label: "Asumir vertigo benigno sin explorar inicio ni lateralizacion.",
          summary: "Cierre prematuro con riesgo de error grave.",
          impact: { patientSafety: -14, responseTime: -10, resourceUse: 2, teamCommunication: -5, protocolCompliance: -11 },
          tags: ["premature_closure", "delay"],
          npcReply: "Se mantiene la debilidad focal y el equipo cuestiona el enfoque inicial.",
        },
      ],
    },
    {
      id: "stroke-monitoring",
      title: "Paso 3: monitorizacion inicial",
      prompt: "Selecciona el monitoreo prioritario mientras se activa el codigo.",
      hint: "Combina estado neurologico y estabilidad hemodinamica.",
      options: [
        {
          id: "stroke-monitor-complete",
          label: "Monitoreo neurologico serial, signos vitales, glucosa capilar y oximetria continua.",
          summary: "Establece vigilancia segura y accionable.",
          impact: { patientSafety: 15, responseTime: 12, resourceUse: 6, teamCommunication: 8, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "Se detectan cambios neurologicos tempranos y se ajusta el manejo rapidamente.",
        },
        {
          id: "stroke-monitor-partial",
          label: "Tomar solo presion arterial y reevaluar despues.",
          summary: "Cobertura parcial en un cuadro de alto riesgo.",
          impact: { patientSafety: 3, responseTime: 1, resourceUse: 3, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "Faltan datos para seguimiento neurologico seguro.",
        },
        {
          id: "stroke-monitor-delay",
          label: "Esperar orden formal antes de iniciar monitorizacion.",
          summary: "Demora evitable con impacto clinico negativo.",
          impact: { patientSafety: -16, responseTime: -14, resourceUse: -4, teamCommunication: -6, protocolCompliance: -12 },
          tags: ["delay", "weak_handoff"],
          npcReply: "El paciente presenta empeoramiento sin vigilancia continua.",
        },
      ],
    },
    {
      id: "stroke-tests",
      title: "Paso 4: pruebas iniciales",
      prompt: "Debes priorizar estudios para diferenciar rapidamente el tipo de ACV.",
      hint: "No retrases imagen urgente con paneles extensos.",
      options: [
        {
          id: "stroke-tests-targeted",
          label: "Priorizar neuroimagen urgente y analitica basica segun protocolo de ACV.",
          summary: "Secuencia adecuada para decisiones tiempo-dependientes.",
          impact: { patientSafety: 14, responseTime: 10, resourceUse: 4, teamCommunication: 6, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "La neuroimagen se obtiene a tiempo y permite definir ruta terapeutica.",
        },
        {
          id: "stroke-tests-overuse",
          label: "Solicitar baterias amplias no urgentes antes de neuroimagen.",
          summary: "Sobrecarga recursos y retrasa manejo critico.",
          impact: { patientSafety: 4, responseTime: -3, resourceUse: -10, teamCommunication: 1, protocolCompliance: -3 },
          tags: ["overuse", "delay"],
          npcReply: "Se agregan estudios, pero el tratamiento se retrasa.",
        },
        {
          id: "stroke-tests-none",
          label: "No solicitar estudios porque hay leve mejoria espontanea.",
          summary: "Puede perderse oportunidad terapeutica clave.",
          impact: { patientSafety: -15, responseTime: -12, resourceUse: 2, teamCommunication: -4, protocolCompliance: -10 },
          tags: ["undertriage", "premature_closure"],
          npcReply: "La mejoria es transitoria y reaparece el deficit neurologico.",
        },
      ],
    },
    {
      id: "stroke-action",
      title: "Paso 5: primera accion",
      prompt: "Define la accion inicial mientras llega el equipo de neurologia.",
      hint: "Priorizacion, seguridad y handoff estructurado.",
      options: [
        {
          id: "stroke-action-safe",
          label: "Mantener ruta ACV activa, soporte inicial y handoff claro al equipo especializado.",
          summary: "Conducta alineada con seguridad y protocolo.",
          impact: { patientSafety: 18, responseTime: 14, resourceUse: 4, teamCommunication: 10, protocolCompliance: 16 },
          tags: ["safe_choice"],
          npcReply: "La transicion al equipo neurologico es fluida y sin perdida de tiempo.",
        },
        {
          id: "stroke-action-watch",
          label: "Observar evolucion clinica antes de escalar.",
          summary: "Demora con riesgo de perder ventana terapeutica.",
          impact: { patientSafety: -3, responseTime: -7, resourceUse: 1, teamCommunication: -2, protocolCompliance: -5 },
          tags: ["delay"],
          npcReply: "El cuadro progresa y obliga a escalar de forma tardia.",
        },
        {
          id: "stroke-action-discharge",
          label: "Alta con control ambulatorio porque el deficit parece leve.",
          summary: "Decision insegura para sospecha de ACV.",
          impact: { patientSafety: -24, responseTime: -20, resourceUse: 4, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "premature_closure", "weak_handoff"],
          npcReply: "Se pierde una oportunidad critica de tratamiento oportuno.",
        },
      ],
    },
  ],
};

const SEPSIS_SCENARIO: TriageScenario = {
  id: "sepsis-emergency-v1",
  title: "Sospecha de sepsis en emergencia",
  setting: "Area de triaje y observacion de emergencia",
  patientSummary: "Paciente de 72 anos con fiebre, hipotension relativa, taquicardia y confusion progresiva.",
  chiefComplaint: "Fiebre de 2 dias, debilidad intensa y estado mental alterado.",
  learningGoal: "Reconocer sepsis temprana, iniciar bundle inicial y escalar a tiempo.",
  roleObjectiveByCareer: {
    medicina: "Integra criterios de sepsis y define manejo inicial con enfoque de tiempo.",
    enfermeria: "Detecta deterioro, monitoriza perfusion y comunica cambios de forma efectiva.",
    fisioterapia: "Identifica signos de inestabilidad que contraindican intervencion funcional.",
    psicologia: "Aporta contencion familiar y handoff de riesgo sin interferir en manejo urgente.",
  },
  steps: [
    {
      id: "sepsis-priority",
      title: "Paso 1: prioridad de triage",
      prompt: "Paciente mayor con sospecha infecciosa y alteracion del estado mental.",
      hint: "Prioriza riesgo de hipoperfusion y falla organica.",
      options: [
        {
          id: "sepsis-priority-high",
          label: "Asignar prioridad alta y activar ruta de sepsis inmediatamente.",
          summary: "Decision segura para evitar progresion a choque septico.",
          impact: { patientSafety: 18, responseTime: 16, resourceUse: 8, teamCommunication: 10, protocolCompliance: 17 },
          tags: ["safe_choice"],
          npcReply: "El equipo activa protocolo y acelera la valoracion integral.",
        },
        {
          id: "sepsis-priority-mid",
          label: "Prioridad intermedia con reevaluacion en 30 minutos.",
          summary: "Riesgo de demora en un cuadro potencialmente inestable.",
          impact: { patientSafety: 2, responseTime: -8, resourceUse: 3, teamCommunication: -2, protocolCompliance: -7 },
          tags: ["delay"],
          npcReply: "Durante la espera, la perfusion periferica empeora.",
        },
        {
          id: "sepsis-priority-low",
          label: "Triage bajo por ausencia de dolor intenso.",
          summary: "Infratriaje en contexto de riesgo sistemico.",
          impact: { patientSafety: -22, responseTime: -20, resourceUse: -5, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "delay"],
          npcReply: "El paciente presenta mayor confusion y signos de inestabilidad.",
        },
      ],
    },
    {
      id: "sepsis-questions",
      title: "Paso 2: preguntas clave",
      prompt: "Debes orientar la entrevista breve para identificar foco y gravedad.",
      hint: "Busca foco infeccioso, disfuncion organica y tiempo de evolucion.",
      options: [
        {
          id: "sepsis-questions-focused",
          label: "Preguntar foco probable, diuresis, estado basal y tiempo de deterioro.",
          summary: "Permite estratificar riesgo y orientar bundle inicial.",
          impact: { patientSafety: 12, responseTime: 9, resourceUse: 6, teamCommunication: 4, protocolCompliance: 10 },
          tags: ["safe_choice"],
          npcReply: "Se identifica posible foco urinario y disminucion marcada de diuresis.",
        },
        {
          id: "sepsis-questions-basic",
          label: "Preguntar solo fiebre y uso previo de analgesicos.",
          summary: "Insuficiente para definir severidad del cuadro.",
          impact: { patientSafety: 1, responseTime: 1, resourceUse: 1, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "Aun no se define foco ni compromiso organico con claridad.",
        },
        {
          id: "sepsis-questions-closure",
          label: "Asumir deshidratacion simple sin explorar disfuncion organica.",
          summary: "Cierre prematuro con alto riesgo clinico.",
          impact: { patientSafety: -14, responseTime: -10, resourceUse: 2, teamCommunication: -5, protocolCompliance: -11 },
          tags: ["premature_closure", "delay"],
          npcReply: "La confusion aumenta y el equipo exige reevaluacion inmediata.",
        },
      ],
    },
    {
      id: "sepsis-monitoring",
      title: "Paso 3: monitorizacion inicial",
      prompt: "Selecciona el monitoreo prioritario para paciente con sepsis probable.",
      hint: "Evalua perfusion, hemodinamia y estado neurologico.",
      options: [
        {
          id: "sepsis-monitor-complete",
          label: "Monitorizar signos completos, perfusion, diuresis y estado mental en serie.",
          summary: "Vigilancia adecuada para detectar deterioro temprano.",
          impact: { patientSafety: 15, responseTime: 12, resourceUse: 6, teamCommunication: 8, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "Se evidencia hipotension sostenida y se acelera respuesta del equipo.",
        },
        {
          id: "sepsis-monitor-partial",
          label: "Registrar temperatura y frecuencia cardiaca unicamente.",
          summary: "Cobertura parcial para un cuadro sistemico.",
          impact: { patientSafety: 3, responseTime: 1, resourceUse: 3, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "La informacion parcial dificulta ajuste rapido de decisiones.",
        },
        {
          id: "sepsis-monitor-delay",
          label: "Esperar evolucion antes de monitorizar de forma continua.",
          summary: "Demora evitable con riesgo de falla organica no detectada.",
          impact: { patientSafety: -16, responseTime: -14, resourceUse: -4, teamCommunication: -6, protocolCompliance: -12 },
          tags: ["delay", "weak_handoff"],
          npcReply: "El paciente se torna mas hipotenso sin vigilancia adecuada.",
        },
      ],
    },
    {
      id: "sepsis-tests",
      title: "Paso 4: pruebas iniciales",
      prompt: "Debes elegir estudios iniciales de mayor valor clinico.",
      hint: "Prioriza lactato, cultivos y analitica basal segun protocolo local.",
      options: [
        {
          id: "sepsis-tests-targeted",
          label: "Solicitar lactato, hemocultivos y analitica dirigida antes de retrasar tratamiento.",
          summary: "Uso eficiente de pruebas clave para sepsis.",
          impact: { patientSafety: 14, responseTime: 10, resourceUse: 4, teamCommunication: 6, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "El lactato elevado confirma mayor riesgo y orienta el manejo inicial.",
        },
        {
          id: "sepsis-tests-overuse",
          label: "Pedir panel extenso no prioritario antes de iniciar medidas urgentes.",
          summary: "Sobrecarga recursos y retrasa el bundle inicial.",
          impact: { patientSafety: 4, responseTime: -3, resourceUse: -10, teamCommunication: 1, protocolCompliance: -3 },
          tags: ["overuse", "delay"],
          npcReply: "Se consumen recursos mientras persiste inestabilidad hemodinamica.",
        },
        {
          id: "sepsis-tests-none",
          label: "No solicitar estudios porque la fiebre puede ceder sola.",
          summary: "Riesgo de perder confirmacion y severidad del proceso.",
          impact: { patientSafety: -15, responseTime: -12, resourceUse: 2, teamCommunication: -4, protocolCompliance: -10 },
          tags: ["undertriage", "premature_closure"],
          npcReply: "El estado general empeora y obliga a intervencion tardia.",
        },
      ],
    },
    {
      id: "sepsis-action",
      title: "Paso 5: primera accion",
      prompt: "Define la accion inicial mientras se completa evaluacion del equipo.",
      hint: "Prioriza bundle temprano y comunicacion cerrada del riesgo.",
      options: [
        {
          id: "sepsis-action-safe",
          label: "Iniciar medidas tempranas de sepsis y escalar con handoff estructurado.",
          summary: "Alinea seguridad, tiempo y protocolo.",
          impact: { patientSafety: 18, responseTime: 14, resourceUse: 4, teamCommunication: 10, protocolCompliance: 16 },
          tags: ["safe_choice"],
          npcReply: "Se coordina manejo inicial oportuno y mejora la estabilidad del paciente.",
        },
        {
          id: "sepsis-action-watch",
          label: "Observar respuesta clinica antes de activar bundle de sepsis.",
          summary: "Demora que puede aumentar riesgo de choque.",
          impact: { patientSafety: -3, responseTime: -7, resourceUse: 1, teamCommunication: -2, protocolCompliance: -5 },
          tags: ["delay"],
          npcReply: "El paciente cae en mayor inestabilidad y se activa protocolo tarde.",
        },
        {
          id: "sepsis-action-discharge",
          label: "Alta con hidratacion oral y control ambulatorio.",
          summary: "Conducta insegura en paciente con compromiso sistemico.",
          impact: { patientSafety: -24, responseTime: -20, resourceUse: 4, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "premature_closure", "weak_handoff"],
          npcReply: "Se pierde oportunidad de manejo temprano de sepsis severa.",
        },
      ],
    },
  ],
};

const OB_POSTPARTUM_SCENARIO: TriageScenario = {
  id: "postpartum-hemorrhage-v1",
  title: "Hemorragia posparto en emergencia obstetrica",
  setting: "Area de emergencia obstetrica",
  patientSummary: "Puerpera de 2 horas postparto con sangrado activo, palidez y mareo.",
  chiefComplaint: "Sangrado vaginal abundante con debilidad y lipotimia.",
  learningGoal: "Reconocer hemorragia posparto y activar manejo obstetrico inmediato.",
  roleObjectiveByCareer: {
    obstetricia: "Prioriza estabilizacion materna y control temprano de hemorragia.",
    enfermeria: "Monitoriza perdida hemorragica y comunica deterioro en tiempo real.",
    medicina: "Apoya estabilizacion hemodinamica y coordinacion interdisciplinaria.",
  },
  steps: [
    {
      id: "pph-priority",
      title: "Paso 1: prioridad de triage",
      prompt: "Puerpera con sangrado activo abundante y signos de hipoperfusion.",
      hint: "La hemorragia posparto es una emergencia obstetrica.",
      options: [
        {
          id: "pph-priority-high",
          label: "Prioridad alta y activacion inmediata de codigo obstetrico hemorrhagico.",
          summary: "Conducta correcta para reducir riesgo materno inmediato.",
          impact: { patientSafety: 18, responseTime: 16, resourceUse: 8, teamCommunication: 10, protocolCompliance: 17 },
          tags: ["safe_choice"],
          npcReply: "El equipo obstetrico responde rapido y se inicia manejo protocolizado.",
        },
        {
          id: "pph-priority-mid",
          label: "Prioridad intermedia con observacion inicial.",
          summary: "Demora peligrosa en escenario de sangrado activo.",
          impact: { patientSafety: 2, responseTime: -8, resourceUse: 3, teamCommunication: -2, protocolCompliance: -7 },
          tags: ["delay"],
          npcReply: "El sangrado continua y la paciente presenta mayor inestabilidad.",
        },
        {
          id: "pph-priority-low",
          label: "Triage bajo porque el sangrado puede ser fisiologico.",
          summary: "Infratriaje de alto riesgo obstetrico.",
          impact: { patientSafety: -22, responseTime: -20, resourceUse: -5, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "delay"],
          npcReply: "Se retrasa atencion critica y aumenta riesgo de choque hemorragico.",
        },
      ],
    },
    {
      id: "pph-questions",
      title: "Paso 2: preguntas clave",
      prompt: "Necesitas datos dirigidos en menos de 1 minuto.",
      hint: "Cuantifica sangrado, factores de riesgo y sintomas de hipoperfusion.",
      options: [
        {
          id: "pph-questions-focused",
          label: "Indagar cantidad de sangrado, tono uterino, tiempo postparto y sintomas asociados.",
          summary: "Aporta datos clave para intervencion inmediata.",
          impact: { patientSafety: 12, responseTime: 9, resourceUse: 6, teamCommunication: 4, protocolCompliance: 10 },
          tags: ["safe_choice"],
          npcReply: "Se confirma sangrado mayor al esperado y signos de hipoperfusion.",
        },
        {
          id: "pph-questions-basic",
          label: "Preguntar solo dolor y antecedente obstetrico general.",
          summary: "Insuficiente para cuantificar gravedad actual.",
          impact: { patientSafety: 1, responseTime: 1, resourceUse: 1, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "Aun no hay datos claros del volumen de perdida sanguinea.",
        },
        {
          id: "pph-questions-closure",
          label: "Asumir sangrado normal postparto sin evaluar alarma.",
          summary: "Cierre prematuro con riesgo materno elevado.",
          impact: { patientSafety: -14, responseTime: -10, resourceUse: 2, teamCommunication: -5, protocolCompliance: -11 },
          tags: ["premature_closure", "delay"],
          npcReply: "La paciente presenta mareo intenso y taquicardia progresiva.",
        },
      ],
    },
    {
      id: "pph-monitoring",
      title: "Paso 3: monitorizacion inicial",
      prompt: "Selecciona el monitoreo prioritario en hemorragia posparto.",
      hint: "Combina signos vitales, perdida sanguinea y estado mental.",
      options: [
        {
          id: "pph-monitor-complete",
          label: "Monitoreo hemodinamico continuo, cuantificacion de sangrado y acceso venoso inmediato.",
          summary: "Vigilancia segura para detectar deterioro temprano.",
          impact: { patientSafety: 15, responseTime: 12, resourceUse: 6, teamCommunication: 8, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "Se identifica persistencia de sangrado y se ajusta manejo sin demora.",
        },
        {
          id: "pph-monitor-partial",
          label: "Tomar solo presion arterial y reevaluar mas tarde.",
          summary: "Cobertura parcial en una urgencia obstetrica.",
          impact: { patientSafety: 3, responseTime: 1, resourceUse: 3, teamCommunication: -1, protocolCompliance: -2 },
          tags: [],
          npcReply: "Falta informacion continua para valorar respuesta al tratamiento.",
        },
        {
          id: "pph-monitor-delay",
          label: "Esperar orden medica para iniciar monitorizacion completa.",
          summary: "Demora evitable con riesgo de choque hemorragico.",
          impact: { patientSafety: -16, responseTime: -14, resourceUse: -4, teamCommunication: -6, protocolCompliance: -12 },
          tags: ["delay", "weak_handoff"],
          npcReply: "La paciente se inestabiliza antes de completar vigilancia adecuada.",
        },
      ],
    },
    {
      id: "pph-tests",
      title: "Paso 4: pruebas iniciales",
      prompt: "Debes priorizar estudios urgentes para soporte transfusional y causa.",
      hint: "Elige estudios de alto impacto sin retrasar manejo.",
      options: [
        {
          id: "pph-tests-targeted",
          label: "Solicitar hemograma, pruebas de coagulacion y tipificacion segun protocolo.",
          summary: "Pruebas clave para manejo hemostatico oportuno.",
          impact: { patientSafety: 14, responseTime: 10, resourceUse: 4, teamCommunication: 6, protocolCompliance: 12 },
          tags: ["safe_choice"],
          npcReply: "Los resultados permiten ajustar manejo y preparar soporte avanzado.",
        },
        {
          id: "pph-tests-overuse",
          label: "Pedir panel extenso no prioritario antes de intervenir.",
          summary: "Aumenta consumo y retrasa acciones urgentes.",
          impact: { patientSafety: 4, responseTime: -3, resourceUse: -10, teamCommunication: 1, protocolCompliance: -3 },
          tags: ["overuse", "delay"],
          npcReply: "Se ocupan recursos mientras el sangrado continua activo.",
        },
        {
          id: "pph-tests-none",
          label: "No pedir estudios mientras se observe evolucion.",
          summary: "Riesgo de manejo ciego en cuadro severo.",
          impact: { patientSafety: -15, responseTime: -12, resourceUse: 2, teamCommunication: -4, protocolCompliance: -10 },
          tags: ["undertriage", "premature_closure"],
          npcReply: "La paciente no mejora y falta informacion para decisiones seguras.",
        },
      ],
    },
    {
      id: "pph-action",
      title: "Paso 5: primera accion",
      prompt: "Define la accion inicial mientras llega el equipo completo.",
      hint: "Prioriza estabilizacion y control temprano de hemorragia.",
      options: [
        {
          id: "pph-action-safe",
          label: "Iniciar protocolo de hemorragia posparto y escalar en forma inmediata.",
          summary: "Respuesta alineada con seguridad materna y protocolo.",
          impact: { patientSafety: 18, responseTime: 14, resourceUse: 4, teamCommunication: 10, protocolCompliance: 16 },
          tags: ["safe_choice"],
          npcReply: "La coordinacion mejora y se reduce el riesgo de complicaciones graves.",
        },
        {
          id: "pph-action-watch",
          label: "Observar 20 minutos antes de activar ruta de emergencia.",
          summary: "Demora que incrementa riesgo hemodinamico.",
          impact: { patientSafety: -3, responseTime: -7, resourceUse: 1, teamCommunication: -2, protocolCompliance: -5 },
          tags: ["delay"],
          npcReply: "El sangrado persiste y obliga a intervencion tardia.",
        },
        {
          id: "pph-action-discharge",
          label: "Dar alta con recomendaciones generales.",
          summary: "Conducta insegura en hemorragia posparto.",
          impact: { patientSafety: -24, responseTime: -20, resourceUse: 4, teamCommunication: -8, protocolCompliance: -20 },
          tags: ["undertriage", "premature_closure", "weak_handoff"],
          npcReply: "Se pierde oportunidad de estabilizacion materna urgente.",
        },
      ],
    },
  ],
};

type ScenarioSeedKind = "clinical" | "obstetric";

type ScenarioSeed = {
  id: string;
  kind: ScenarioSeedKind;
  title: string;
  setting: string;
  patientSummary: string;
  chiefComplaint: string;
  learningGoal: string;
  triagePrompt: string;
  questionFocus: string;
  monitoringFocus: string;
  testsFocus: string;
  initialActionFocus: string;
  roleObjectiveByCareer?: Partial<Record<TriageCareerId, string>>;
};

const DEFAULT_CLINICAL_OBJECTIVES: Partial<Record<TriageCareerId, string>> = {
  medicina: "Prioriza riesgo vital, define diferenciales y activa manejo inicial seguro.",
  enfermeria: "Detecta deterioro temprano y ejecuta escalamiento con comunicacion cerrada.",
  fisioterapia: "Reconoce banderas rojas y deriva sin retrasar la ruta critica.",
  psicologia: "Aporta contencion breve y handoff estructurado al equipo clinico.",
};

const DEFAULT_OBSTETRIC_OBJECTIVES: Partial<Record<TriageCareerId, string>> = {
  obstetricia: "Integra evaluacion materna y fetal en decisiones de triage inmediatas.",
  enfermeria: "Monitorea binomio materno-fetal y comunica deterioro sin demora.",
  medicina: "Apoya estabilizacion hemodinamica y referencia obstetrica urgente.",
};

function buildSeedScenario(seed: ScenarioSeed): TriageScenario {
  const isObstetric = seed.kind === "obstetric";
  const objectivesBase = isObstetric ? DEFAULT_OBSTETRIC_OBJECTIVES : DEFAULT_CLINICAL_OBJECTIVES;

  return {
    id: seed.id,
    title: seed.title,
    setting: seed.setting,
    patientSummary: seed.patientSummary,
    chiefComplaint: seed.chiefComplaint,
    learningGoal: seed.learningGoal,
    roleObjectiveByCareer: {
      ...objectivesBase,
      ...(seed.roleObjectiveByCareer ?? {}),
    },
    steps: [
      {
        id: `${seed.id}-priority`,
        title: "Paso 1: prioridad de triage",
        prompt: seed.triagePrompt,
        hint: isObstetric
          ? "Prioriza seguridad materna y fetal desde el primer minuto."
          : "Prioriza riesgo vital y tiempo de respuesta.",
        options: [
          {
            id: `${seed.id}-priority-high`,
            label: isObstetric
              ? "Prioridad alta y activacion inmediata de ruta obstetrica."
              : "Prioridad alta y activacion inmediata de ruta de emergencia.",
            summary: "Conducta segura en un cuadro potencialmente inestable.",
            impact: { patientSafety: 18, responseTime: 16, resourceUse: 8, teamCommunication: 10, protocolCompliance: 17 },
            tags: ["safe_choice"],
            npcReply: "El equipo responde rapido y el flujo clinico se acelera sin demoras.",
          },
          {
            id: `${seed.id}-priority-mid`,
            label: "Prioridad intermedia con reevaluacion diferida.",
            summary: "Reconoce riesgo, pero agrega demora en un escenario tiempo-dependiente.",
            impact: { patientSafety: 2, responseTime: -8, resourceUse: 3, teamCommunication: -2, protocolCompliance: -7 },
            tags: ["delay"],
            npcReply: "Durante la espera, los signos de gravedad se vuelven mas evidentes.",
          },
          {
            id: `${seed.id}-priority-low`,
            label: "Clasificar baja prioridad por estabilidad aparente.",
            summary: "Infratriaje con riesgo de evento adverso.",
            impact: { patientSafety: -22, responseTime: -20, resourceUse: -5, teamCommunication: -8, protocolCompliance: -20 },
            tags: ["undertriage", "delay"],
            npcReply: "La condicion empeora y obliga a activar la ruta de forma tardia.",
          },
        ],
      },
      {
        id: `${seed.id}-questions`,
        title: "Paso 2: preguntas clave",
        prompt: "Debes orientar la entrevista breve para estratificar riesgo clinico.",
        hint: "Enfoca la anamnesis en datos que cambian la decision inmediata.",
        options: [
          {
            id: `${seed.id}-questions-focused`,
            label: `Explorar datos clave: ${seed.questionFocus}.`,
            summary: "Buena orientacion para decisiones iniciales de alto impacto.",
            impact: { patientSafety: 12, responseTime: 9, resourceUse: 6, teamCommunication: 4, protocolCompliance: 10 },
            tags: ["safe_choice"],
            npcReply: "La informacion permite priorizar mejor y reducir incertidumbre del equipo.",
          },
          {
            id: `${seed.id}-questions-basic`,
            label: "Hacer preguntas generales sin foco en gravedad.",
            summary: "Aporta datos limitados para un triage seguro.",
            impact: { patientSafety: 1, responseTime: 1, resourceUse: 1, teamCommunication: -1, protocolCompliance: -2 },
            tags: [],
            npcReply: "La evaluacion sigue incompleta para decidir con confianza.",
          },
          {
            id: `${seed.id}-questions-closure`,
            label: "Asumir cuadro no grave sin explorar banderas rojas.",
            summary: "Cierre prematuro con alto riesgo de error.",
            impact: { patientSafety: -14, responseTime: -10, resourceUse: 2, teamCommunication: -5, protocolCompliance: -11 },
            tags: ["premature_closure", "delay"],
            npcReply: "El equipo detecta inconsistencias y solicita reevaluacion urgente.",
          },
        ],
      },
      {
        id: `${seed.id}-monitoring`,
        title: "Paso 3: monitorizacion inicial",
        prompt: "Selecciona la monitorizacion prioritaria para este caso.",
        hint: "Combina vigilancia hemodinamica, clinica y de deterioro.",
        options: [
          {
            id: `${seed.id}-monitoring-complete`,
            label: `Monitoreo completo: ${seed.monitoringFocus}.`,
            summary: "Vigilancia adecuada para detectar deterioro temprano.",
            impact: { patientSafety: 15, responseTime: 12, resourceUse: 6, teamCommunication: 8, protocolCompliance: 12 },
            tags: ["safe_choice"],
            npcReply: "La monitorizacion continua permite ajustar decisiones en tiempo real.",
          },
          {
            id: `${seed.id}-monitoring-partial`,
            label: "Monitorizacion parcial y reevaluacion posterior.",
            summary: "Cobertura incompleta para un cuadro de riesgo.",
            impact: { patientSafety: 3, responseTime: 1, resourceUse: 3, teamCommunication: -1, protocolCompliance: -2 },
            tags: [],
            npcReply: "Faltan parametros para anticipar deterioro de forma segura.",
          },
          {
            id: `${seed.id}-monitoring-delay`,
            label: "Esperar indicacion diferida antes de monitorizar.",
            summary: "Demora evitable que compromete seguridad.",
            impact: { patientSafety: -16, responseTime: -14, resourceUse: -4, teamCommunication: -6, protocolCompliance: -12 },
            tags: ["delay", "weak_handoff"],
            npcReply: "El paciente cambia de estado antes de completar la vigilancia necesaria.",
          },
        ],
      },
      {
        id: `${seed.id}-tests`,
        title: "Paso 4: pruebas iniciales",
        prompt: "Debes priorizar pruebas con alto valor para la primera decision clinica.",
        hint: "Solicita estudios orientados, no paneles indiscriminados.",
        options: [
          {
            id: `${seed.id}-tests-targeted`,
            label: `Pruebas prioritarias: ${seed.testsFocus}.`,
            summary: "Uso eficiente de recursos con impacto clinico temprano.",
            impact: { patientSafety: 14, responseTime: 10, resourceUse: 4, teamCommunication: 6, protocolCompliance: 12 },
            tags: ["safe_choice"],
            npcReply: "Los hallazgos iniciales orientan una conducta mas segura y oportuna.",
          },
          {
            id: `${seed.id}-tests-overuse`,
            label: "Solicitar panel extenso no prioritario antes de actuar.",
            summary: "Sobreutiliza recursos y puede retrasar decisiones utiles.",
            impact: { patientSafety: 4, responseTime: -3, resourceUse: -10, teamCommunication: 1, protocolCompliance: -3 },
            tags: ["overuse", "delay"],
            npcReply: "Se consumen recursos sin resolver primero la prioridad critica.",
          },
          {
            id: `${seed.id}-tests-none`,
            label: "No solicitar pruebas iniciales y esperar evolucion espontanea.",
            summary: "Riesgo de perder diagnosticos graves en fase temprana.",
            impact: { patientSafety: -15, responseTime: -12, resourceUse: 2, teamCommunication: -4, protocolCompliance: -10 },
            tags: ["undertriage", "premature_closure"],
            npcReply: "La evolucion no es favorable y se pierde tiempo de intervencion.",
          },
        ],
      },
      {
        id: `${seed.id}-action`,
        title: "Paso 5: primera accion",
        prompt: "Define la accion inicial mientras llega el equipo completo.",
        hint: "Prioriza seguridad, escalamiento y coordinacion interprofesional.",
        options: [
          {
            id: `${seed.id}-action-safe`,
            label: `Iniciar manejo inicial seguro y escalar: ${seed.initialActionFocus}.`,
            summary: "Respuesta alineada con seguridad del paciente y protocolo.",
            impact: { patientSafety: 18, responseTime: 14, resourceUse: 4, teamCommunication: 10, protocolCompliance: 16 },
            tags: ["safe_choice"],
            npcReply: "La coordinacion mejora y se reduce el riesgo de complicaciones inmediatas.",
          },
          {
            id: `${seed.id}-action-watch`,
            label: "Observar evolucion antes de activar la ruta critica.",
            summary: "Demora potencialmente peligrosa en cuadros inestables.",
            impact: { patientSafety: -3, responseTime: -7, resourceUse: 1, teamCommunication: -2, protocolCompliance: -5 },
            tags: ["delay"],
            npcReply: "La condicion progresa y obliga a escalar de manera tardia.",
          },
          {
            id: `${seed.id}-action-discharge`,
            label: "Dar alta o manejo ambulatorio precoz.",
            summary: "Conducta insegura para un contexto de emergencia.",
            impact: { patientSafety: -24, responseTime: -20, resourceUse: 4, teamCommunication: -8, protocolCompliance: -20 },
            tags: ["undertriage", "premature_closure", "weak_handoff"],
            npcReply: "Se pierde oportunidad de intervencion temprana y segura.",
          },
        ],
      },
    ],
  };
}

const GENERAL_SCENARIO_SEEDS: readonly ScenarioSeed[] = [
  {
    id: "asthma-severe-v1",
    kind: "clinical",
    title: "Crisis asmatica severa en emergencia",
    setting: "Sala de emergencia respiratoria",
    patientSummary: "Paciente de 24 anos con disnea intensa, uso de musculos accesorios y saturacion limitrofe.",
    chiefComplaint: "Falta de aire progresiva y dificultad para hablar frases completas.",
    learningGoal: "Reconocer compromiso ventilatorio temprano y activar manejo urgente.",
    triagePrompt: "Paciente con broncoespasmo severo y fatiga respiratoria inminente.",
    questionFocus: "desencadenantes recientes, uso de inhaladores, hospitalizaciones previas y respuesta a rescate",
    monitoringFocus: "oximetria continua, frecuencia respiratoria, tiraje y estado de conciencia",
    testsFocus: "gasometria, radiografia segun criterio y medicion seriada de saturacion",
    initialActionFocus: "oxigenoterapia escalonada y aviso inmediato al equipo de via aerea",
  },
  {
    id: "anaphylaxis-v1",
    kind: "clinical",
    title: "Anafilaxia tras exposicion a alergeno",
    setting: "Triage de emergencia",
    patientSummary: "Paciente de 32 anos con urticaria generalizada, disnea y edema facial rapido.",
    chiefComplaint: "Dificultad para respirar con sensacion de cierre de garganta.",
    learningGoal: "Identificar anafilaxia y priorizar intervencion inmediata.",
    triagePrompt: "Reaccion alergica sistemica con compromiso respiratorio potencial.",
    questionFocus: "alergeno probable, tiempo de exposicion, progresion de sintomas y antecedentes alergicos",
    monitoringFocus: "via aerea, saturacion, presion arterial y signos de choque",
    testsFocus: "evaluacion clinica prioritaria y laboratorios dirigidos sin retrasar manejo",
    initialActionFocus: "activar protocolo de anafilaxia y escalar al equipo critico",
  },
  {
    id: "dka-v1",
    kind: "clinical",
    title: "Cetoacidosis diabetica en paciente joven",
    setting: "Emergencia metabolica",
    patientSummary: "Paciente de 19 anos con polidipsia, vomitos, taquipnea y aliento cetonico.",
    chiefComplaint: "Debilidad intensa, nauseas y respiracion profunda.",
    learningGoal: "Reconocer descompensacion metabolica y activar manejo inicial estructurado.",
    triagePrompt: "Paciente con probable cetoacidosis y signos de deshidratacion.",
    questionFocus: "adherencia insulinica, sintomas de infeccion, diuresis y tiempo de evolucion",
    monitoringFocus: "estado neurologico, perfusion, glucosa capilar seriada y balance hidrico",
    testsFocus: "gases venosos, cetonas, electrolitos y glucosa seriada",
    initialActionFocus: "iniciar reposicion y coordinacion temprana con equipo de emergencia",
  },
  {
    id: "hypoglycemia-severe-v1",
    kind: "clinical",
    title: "Hipoglucemia severa con alteracion de conciencia",
    setting: "Area de choque de emergencia",
    patientSummary: "Paciente de 70 anos encontrado confuso, diaforetico y con glucometria critica.",
    chiefComplaint: "Compromiso del estado mental de inicio subagudo.",
    learningGoal: "Corregir rapidamente hipoglucemia y prevenir recurrencia inmediata.",
    triagePrompt: "Paciente con compromiso neurologico y sospecha metabolica urgente.",
    questionFocus: "medicacion hipoglucemiante, ingesta reciente, comorbilidades y episodios previos",
    monitoringFocus: "estado neurologico seriado, glucosa capilar y estabilidad hemodinamica",
    testsFocus: "glucosa seriada y analitica basica para descartar precipitantes",
    initialActionFocus: "correccion inmediata y comunicacion de riesgo de recaida al equipo",
  },
  {
    id: "upper-gi-bleed-v1",
    kind: "clinical",
    title: "Hemorragia digestiva alta",
    setting: "Emergencia de medicina interna",
    patientSummary: "Paciente de 61 anos con hematemesis, melena y mareo ortostatico.",
    chiefComplaint: "Vomito con sangre y debilidad progresiva.",
    learningGoal: "Priorizar estabilidad hemodinamica y ruta diagnostico-terapeutica temprana.",
    triagePrompt: "Sangrado digestivo activo con riesgo de choque hipovolemico.",
    questionFocus: "cantidad de sangrado, uso de AINE/anticoagulantes y antecedentes hepaticos",
    monitoringFocus: "signos vitales, perfusion periferica, diuresis y nivel de conciencia",
    testsFocus: "hemograma, coagulacion y pruebas cruzadas de manera prioritaria",
    initialActionFocus: "estabilizacion hemodinamica y escalamiento inmediato al equipo tratante",
  },
  {
    id: "acute-abdomen-v1",
    kind: "clinical",
    title: "Abdomen agudo con sospecha quirurgica",
    setting: "Emergencia general",
    patientSummary: "Paciente de 38 anos con dolor abdominal intenso, defensa involuntaria y vomitos.",
    chiefComplaint: "Dolor abdominal 9/10 de inicio progresivo con fiebre.",
    learningGoal: "Identificar criterios de abdomen agudo y priorizar derivacion oportuna.",
    triagePrompt: "Dolor abdominal severo con signos de irritacion peritoneal.",
    questionFocus: "inicio del dolor, migracion, fiebre, vomitos y antecedentes quirurgicos",
    monitoringFocus: "dolor, signos vitales, perfusion y estado general",
    testsFocus: "analitica basica e imagen urgente segun sospecha quirurgica",
    initialActionFocus: "analgesia segura y aviso temprano a cirugia/urgencias",
  },
  {
    id: "polytrauma-v1",
    kind: "clinical",
    title: "Politrauma por accidente de transito",
    setting: "Area de trauma",
    patientSummary: "Paciente de 29 anos politraumatizado con dolor toracico, herida sangrante y confusion.",
    chiefComplaint: "Dolor generalizado e inestabilidad posterior a trauma de alta energia.",
    learningGoal: "Aplicar enfoque de trauma primario y escalamiento interdisciplinario.",
    triagePrompt: "Mecanismo de alta energia con riesgo de lesiones ocultas graves.",
    questionFocus: "mecanismo del trauma, perdida de conciencia, anticoagulantes y sintomas respiratorios",
    monitoringFocus: "ABCDE continuo, control de sangrado y estado neurologico",
    testsFocus: "imagen y analitica de trauma segun prioridad clinica",
    initialActionFocus: "activar protocolo de trauma y asegurar handoff estructurado",
  },
  {
    id: "status-epilepticus-v1",
    kind: "clinical",
    title: "Estatus epileptico",
    setting: "Emergencia neurologica",
    patientSummary: "Paciente de 42 anos con convulsiones recurrentes y recuperacion incompleta entre episodios.",
    chiefComplaint: "Actividad convulsiva persistente con compromiso progresivo.",
    learningGoal: "Reconocer estatus convulsivo y acelerar intervencion inicial.",
    triagePrompt: "Crisis convulsiva prolongada con riesgo de dano neurologico.",
    questionFocus: "duracion de crisis, adherencia antiepileptica, precipitantes y trauma asociado",
    monitoringFocus: "via aerea, estado neurologico, oximetria y hemodinamia",
    testsFocus: "glucosa, electrolitos y estudios urgentes segun protocolo neurologico",
    initialActionFocus: "proteger via aerea y escalar ruta de estatus epileptico",
  },
  {
    id: "hypertensive-emergency-v1",
    kind: "clinical",
    title: "Emergencia hipertensiva con dano de organo blanco",
    setting: "Emergencia cardiovascular",
    patientSummary: "Paciente de 56 anos con TA severamente elevada, cefalea intensa y alteracion visual.",
    chiefComplaint: "Cefalea explosiva, vision borrosa y dolor toracico leve.",
    learningGoal: "Diferenciar urgencia vs emergencia hipertensiva y priorizar seguridad.",
    triagePrompt: "TA critica con sintomas compatibles con dano agudo de organo blanco.",
    questionFocus: "adherencia antihipertensiva, sintomas neurologicos y dolor toracico",
    monitoringFocus: "presion arterial seriada, estado neurologico y sintomas cardiovasculares",
    testsFocus: "ECG, funcion renal, marcadores y estudios dirigidos segun sintomas",
    initialActionFocus: "activar ruta de emergencia hipertensiva y coordinar manejo monitorizado",
  },
  {
    id: "aki-hyperkalemia-v1",
    kind: "clinical",
    title: "Lesion renal aguda con hiperpotasemia probable",
    setting: "Emergencia nefrologica",
    patientSummary: "Paciente de 65 anos con oliguria, debilidad muscular y antecedente renal cronico.",
    chiefComplaint: "Debilidad progresiva con disminucion marcada de diuresis.",
    learningGoal: "Reconocer riesgo de arritmia por hiperpotasemia y escalar rapido.",
    triagePrompt: "Compromiso renal agudo con sospecha de alteracion electrolitica severa.",
    questionFocus: "diuresis reciente, medicamentos nefrotoxicos y antecedentes renales",
    monitoringFocus: "ritmo cardiaco, diuresis, estado hemodinamico y neuromuscular",
    testsFocus: "electrolitos, funcion renal y ECG urgente",
    initialActionFocus: "priorizar seguridad cardiaca y activar manejo nefrologico urgente",
  },
  {
    id: "opioid-intox-v1",
    kind: "clinical",
    title: "Intoxicacion por opioides",
    setting: "Area de observacion critica",
    patientSummary: "Paciente de 31 anos con miosis, bradipnea y disminucion del nivel de conciencia.",
    chiefComplaint: "Somnolencia profunda y respiracion lenta tras consumo no precisado.",
    learningGoal: "Reconocer intoxicacion depresora y actuar sobre via aerea/ventilacion.",
    triagePrompt: "Compromiso respiratorio con sospecha de toxico opioide.",
    questionFocus: "sustancia probable, tiempo de ingesta y coingestas asociadas",
    monitoringFocus: "frecuencia respiratoria, saturacion, nivel de conciencia y via aerea",
    testsFocus: "glucosa, gasometria y estudios dirigidos segun toxidrome",
    initialActionFocus: "estabilizacion ventilatoria y escalamiento toxico-clinico inmediato",
  },
  {
    id: "respiratory-failure-v1",
    kind: "clinical",
    title: "Insuficiencia respiratoria aguda",
    setting: "Emergencia respiratoria",
    patientSummary: "Paciente de 74 anos con disnea severa, cianosis periferica y fatiga respiratoria.",
    chiefComplaint: "Dificultad respiratoria progresiva con incapacidad para hablar.",
    learningGoal: "Detectar fallo respiratorio y activar soporte escalonado oportuno.",
    triagePrompt: "Compromiso ventilatorio con riesgo de paro respiratorio.",
    questionFocus: "tiempo de evolucion, comorbilidad pulmonar y respuesta a tratamientos previos",
    monitoringFocus: "saturacion continua, trabajo respiratorio y estado mental",
    testsFocus: "gasometria, radiografia de torax y analitica dirigida",
    initialActionFocus: "soporte respiratorio temprano y activacion del equipo de via aerea",
  },
];

const OBSTETRIC_SCENARIO_SEEDS: readonly ScenarioSeed[] = [
  {
    id: "severe-preeclampsia-v1",
    kind: "obstetric",
    title: "Preeclampsia severa",
    setting: "Emergencia obstetrica",
    patientSummary: "Gestante de 34 semanas con TA severa, cefalea intensa y fosfenos.",
    chiefComplaint: "Dolor de cabeza intenso con vision borrosa y edema progresivo.",
    learningGoal: "Reconocer preeclampsia severa y activar protocolo materno-fetal.",
    triagePrompt: "Gestante con hipertension severa y sintomas neurologicos de alarma.",
    questionFocus: "cefalea persistente, dolor epigastrico, movimientos fetales y antecedentes hipertensivos",
    monitoringFocus: "presion arterial seriada, estado neurologico y bienestar fetal",
    testsFocus: "laboratorios de severidad y evaluacion fetal segun protocolo",
    initialActionFocus: "activar ruta de preeclampsia severa y escalar al equipo obstetrico",
  },
  {
    id: "eclampsia-v1",
    kind: "obstetric",
    title: "Eclampsia con convulsion en urgencias",
    setting: "Area critica obstetrica",
    patientSummary: "Gestante de 30 semanas con convulsion tonico-clonica y TA elevada.",
    chiefComplaint: "Convulsion reciente con confusion postictal.",
    learningGoal: "Priorizar estabilizacion materna y proteccion fetal inmediata.",
    triagePrompt: "Gestante convulsiva con riesgo vital materno-fetal.",
    questionFocus: "duracion de crisis, sintomas previos, antecedentes hipertensivos y control prenatal",
    monitoringFocus: "via aerea, estado neurologico, TA y frecuencia fetal",
    testsFocus: "evaluacion urgente materna y fetal con estudios de severidad",
    initialActionFocus: "estabilizacion inmediata y codigo obstetrico-neurologico",
  },
  {
    id: "ectopic-pregnancy-v1",
    kind: "obstetric",
    title: "Sospecha de embarazo ectopico complicado",
    setting: "Emergencia gineco-obstetrica",
    patientSummary: "Paciente de 27 anos con dolor pelvico intenso, sangrado y lipotimia.",
    chiefComplaint: "Dolor abdominal bajo con sangrado vaginal escaso.",
    learningGoal: "Reconocer embarazo ectopico de riesgo y evitar retrasos en derivacion.",
    triagePrompt: "Dolor pelvico agudo con datos de posible inestabilidad hemodinamica.",
    questionFocus: "amenorrea, cuantia de sangrado, dolor referido y antecedentes ectopicos",
    monitoringFocus: "signos vitales, perfusion, dolor y estado general",
    testsFocus: "beta-hCG e imagen urgente segun protocolo institucional",
    initialActionFocus: "estabilizacion y aviso urgente a gineco-obstetricia",
  },
  {
    id: "placenta-previa-v1",
    kind: "obstetric",
    title: "Sangrado del tercer trimestre por placenta previa",
    setting: "Triage obstetrico",
    patientSummary: "Gestante de 33 semanas con sangrado rojo rutilante sin dolor intenso.",
    chiefComplaint: "Sangrado vaginal en tercer trimestre.",
    learningGoal: "Priorizar seguridad materno-fetal y ruta obstetrica de hemorragia.",
    triagePrompt: "Sangrado activo en gestante de tercer trimestre.",
    questionFocus: "cantidad de sangrado, semanas de gestacion y antecedentes obstetricos",
    monitoringFocus: "perdida hemorragica, estado hemodinamico y frecuencia fetal",
    testsFocus: "analitica inicial y evaluacion ecografica urgente",
    initialActionFocus: "activar protocolo de sangrado obstetrico y coordinacion con quirofano",
  },
  {
    id: "placental-abruption-v1",
    kind: "obstetric",
    title: "Desprendimiento prematuro de placenta sospechado",
    setting: "Emergencia obstetrica",
    patientSummary: "Gestante con dolor abdominal intenso, hipertonia uterina y sangrado oscuro.",
    chiefComplaint: "Dolor abdominal continuo con disminucion de movimientos fetales.",
    learningGoal: "Identificar abruptio placentario y acelerar respuesta obstetrica.",
    triagePrompt: "Gestante con dolor intenso y signos de compromiso fetal agudo.",
    questionFocus: "inicio del dolor, trauma reciente, sangrado y movimiento fetal",
    monitoringFocus: "estado hemodinamico materno y monitorizacion fetal continua",
    testsFocus: "analitica urgente y estudios obstetricos dirigidos",
    initialActionFocus: "estabilizacion y activacion inmediata de equipo obstetrico",
  },
  {
    id: "preterm-labor-v1",
    kind: "obstetric",
    title: "Trabajo de parto pretermino",
    setting: "Unidad de emergencia obstetrica",
    patientSummary: "Gestante de 31 semanas con contracciones regulares y dolor lumbar.",
    chiefComplaint: "Contracciones frecuentes antes de termino.",
    learningGoal: "Detectar trabajo de parto pretermino y priorizar evaluacion materno-fetal.",
    triagePrompt: "Gestante pretermino con dinamica uterina activa.",
    questionFocus: "frecuencia de contracciones, perdida de liquido y antecedentes obstetricos",
    monitoringFocus: "dinamica uterina, signos maternos y bienestar fetal",
    testsFocus: "evaluacion cervical y estudios obstetricos iniciales",
    initialActionFocus: "activar ruta de parto pretermino y coordinacion neonatal",
  },
  {
    id: "prom-fever-v1",
    kind: "obstetric",
    title: "Ruptura prematura de membranas con fiebre",
    setting: "Triage obstetrico",
    patientSummary: "Gestante de 35 semanas con salida de liquido y fiebre de 38.5 C.",
    chiefComplaint: "Perdida de liquido vaginal y malestar general.",
    learningGoal: "Identificar riesgo infeccioso en RPM y escalar evaluacion urgente.",
    triagePrompt: "Gestante con sospecha de ruptura de membranas e infeccion asociada.",
    questionFocus: "tiempo de ruptura, color/olor del liquido y sintomas de infeccion",
    monitoringFocus: "temperatura, taquicardia materna/fetal y estado general",
    testsFocus: "estudios infecciosos y obstetricos de prioridad",
    initialActionFocus: "activar manejo obstetrico-infeccioso temprano",
  },
  {
    id: "puerperal-sepsis-v1",
    kind: "obstetric",
    title: "Sepsis puerperal",
    setting: "Emergencia postparto",
    patientSummary: "Puerpera de 5 dias con fiebre, dolor abdominal y taquicardia persistente.",
    chiefComplaint: "Fiebre alta y deterioro general tras parto reciente.",
    learningGoal: "Reconocer sepsis puerperal y acelerar bundle inicial.",
    triagePrompt: "Paciente en puerperio con sospecha de infeccion sistemica.",
    questionFocus: "inicio de fiebre, loquios, dolor uterino y antecedentes del parto",
    monitoringFocus: "hemodinamia, estado mental, perfusion y diuresis",
    testsFocus: "cultivos y analitica de sepsis segun protocolo",
    initialActionFocus: "activar ruta de sepsis obstetrica con comunicacion cerrada",
  },
  {
    id: "fetal-distress-v1",
    kind: "obstetric",
    title: "Sufrimiento fetal agudo intraparto",
    setting: "Sala de partos",
    patientSummary: "Gestante intraparto con desaceleraciones fetales repetidas y taquisistolia.",
    chiefComplaint: "Disminucion de bienestar fetal durante trabajo de parto.",
    learningGoal: "Priorizar evaluacion y respuesta inmediata ante compromiso fetal.",
    triagePrompt: "Deterioro de patron fetal con riesgo de hipoxia aguda.",
    questionFocus: "duracion del trabajo de parto, intervenciones previas y eventos desencadenantes",
    monitoringFocus: "registro fetal continuo, dinamica uterina y estado materno",
    testsFocus: "evaluaciones obstetricas urgentes de soporte a decision",
    initialActionFocus: "activar respuesta obstetrica inmediata y preparar resolucion segura",
  },
  {
    id: "uterine-rupture-v1",
    kind: "obstetric",
    title: "Sospecha de ruptura uterina",
    setting: "Emergencia obstetrica critica",
    patientSummary: "Gestante con dolor abdominal brusco, sangrado y alteracion de dinamica uterina.",
    chiefComplaint: "Dolor intenso durante trabajo de parto con deterioro fetal.",
    learningGoal: "Reconocer signos de ruptura uterina y escalar sin demora.",
    triagePrompt: "Gestante con signos de catastrofe obstetrica durante labor.",
    questionFocus: "antecedente de cesarea, inicio del dolor y cambios en actividad uterina",
    monitoringFocus: "estado hemodinamico materno y monitorizacion fetal continua",
    testsFocus: "valoracion urgente orientada a resolucion quirurgica",
    initialActionFocus: "activar codigo obstetrico quirurgico de inmediato",
  },
  {
    id: "uterine-inversion-v1",
    kind: "obstetric",
    title: "Inversion uterina postparto",
    setting: "Area de recuperacion obstetrica",
    patientSummary: "Puerpera inmediata con dolor intenso, sangrado y colapso hemodinamico.",
    chiefComplaint: "Malestar brusco tras alumbramiento con sangrado profuso.",
    learningGoal: "Detectar inversion uterina y activar manejo urgente coordinado.",
    triagePrompt: "Compromiso hemodinamico agudo en puerpera inmediata.",
    questionFocus: "momento de inicio, volumen de sangrado y procedimientos recientes",
    monitoringFocus: "TA, frecuencia cardiaca, perfusion y respuesta a intervenciones",
    testsFocus: "pruebas basales para soporte hemorragico segun protocolo",
    initialActionFocus: "estabilizacion urgente y escalamiento obstetrico-quirurgico",
  },
  {
    id: "amniotic-embolism-v1",
    kind: "obstetric",
    title: "Sospecha de embolia de liquido amniotico",
    setting: "Area critica obstetrica",
    patientSummary: "Gestante intraparto con colapso respiratorio/hemodinamico de inicio brusco.",
    chiefComplaint: "Disnea severa y alteracion de conciencia durante el parto.",
    learningGoal: "Reconocer evento obstetrico catastrofico y coordinar respuesta inmediata.",
    triagePrompt: "Colapso materno abrupto con compromiso multiorganico posible.",
    questionFocus: "momento exacto del colapso, sintomas asociados y contexto del parto",
    monitoringFocus: "via aerea, ventilacion, hemodinamia y perfusion continua",
    testsFocus: "estudios urgentes de soporte sin retrasar estabilizacion",
    initialActionFocus: "activar equipo de respuesta critica obstetrica de alto nivel",
  },
  {
    id: "postpartum-endometritis-v1",
    kind: "obstetric",
    title: "Endometritis postparto con deterioro sistemico",
    setting: "Emergencia puerperal",
    patientSummary: "Puerpera de 7 dias con fiebre, dolor uterino y loquios fetidos.",
    chiefComplaint: "Fiebre persistente con dolor abdominal bajo posparto.",
    learningGoal: "Detectar infeccion puerperal complicada y escalar a tiempo.",
    triagePrompt: "Puerpera con sospecha de foco uterino e inestabilidad progresiva.",
    questionFocus: "inicio de fiebre, caracter de loquios y sintomas de compromiso sistemico",
    monitoringFocus: "temperatura, hemodinamia, dolor y estado general",
    testsFocus: "analitica y cultivos dirigidos para sepsis obstetrica",
    initialActionFocus: "activar protocolo infeccioso obstetrico y vigilancia estrecha",
  },
];

type StepFlavor = "priority" | "questions" | "monitoring" | "tests" | "action";

function detectStepFlavor(step: TriageStep): StepFlavor {
  const key = `${step.id} ${step.title}`.toLowerCase();
  if (key.includes("priority") || key.includes("triage")) return "priority";
  if (key.includes("question")) return "questions";
  if (key.includes("monitor")) return "monitoring";
  if (key.includes("test")) return "tests";
  return "action";
}

function subtleHintByFlavor(flavor: StepFlavor) {
  if (flavor === "priority") return "Hay datos mixtos: prioriza los que cambian desenlace en minutos.";
  if (flavor === "questions") return "No todo dato pesa igual; busca el minimo set que cambia conducta.";
  if (flavor === "monitoring") return "El reto es balancear vigilancia clinica y tiempo operativo.";
  if (flavor === "tests") return "Selecciona pruebas por valor de decision temprana, no por volumen.";
  return "Combina seguridad inmediata, comunicacion clara y escalamiento oportuno.";
}

function subtlePromptTail(flavor: StepFlavor) {
  if (flavor === "priority") return "Dato adicional: hay mejoria parcial subjetiva, pero persisten signos de riesgo.";
  if (flavor === "questions") return "Dato adicional: el acompanante aporta informacion parcial y a veces contradictoria.";
  if (flavor === "monitoring") return "Dato adicional: los signos iniciales son borderline y pueden fluctuar rapido.";
  if (flavor === "tests") return "Dato adicional: hay recursos disponibles, pero no todos de forma inmediata.";
  return "Dato adicional: el paciente/familia solicita soluciones rapidas aunque el riesgo siga presente.";
}

function optionNuanceClause(tags: TriageOptionTag[], flavor: StepFlavor) {
  if (tags.includes("undertriage")) return "si la estabilidad aparente inicial se mantiene";
  if (tags.includes("premature_closure")) return "partiendo de la hipotesis inicial mas probable";
  if (tags.includes("overuse")) return "para cubrir un espectro amplio de causas desde el inicio";
  if (tags.includes("weak_handoff")) return "sin activar handoff formal hasta confirmar el siguiente paso";
  if (tags.includes("delay")) return "mientras esperas confirmacion adicional antes de escalar";

  if (flavor === "priority") return "coordinando escalamiento y reevaluacion en paralelo";
  if (flavor === "questions") return "enfocando preguntas que realmente cambian la decision";
  if (flavor === "monitoring") return "con vigilancia continua orientada a deterioro";
  if (flavor === "tests") return "usando pruebas de alto rendimiento clinico temprano";
  return "alineando seguridad, tiempo y coordinacion interprofesional";
}

function nuancedSummary(tags: TriageOptionTag[]) {
  if (tags.includes("undertriage")) return "Puede parecer razonable al inicio, pero eleva riesgo de omision critica.";
  if (tags.includes("premature_closure")) return "Reduce complejidad rapida, pero aumenta probabilidad de sesgo diagnostico.";
  if (tags.includes("overuse")) return "Amplia cobertura diagnostica con costo de tiempo y recursos.";
  if (tags.includes("weak_handoff")) return "Depende de terceros y puede dejar vacios de responsabilidad clinica.";
  if (tags.includes("delay")) return "Aporta control parcial, con riesgo de perder ventana terapeutica.";
  return "Mantiene buen balance entre seguridad, oportunidad y protocolo.";
}

function rewriteOptionLabel(base: string, tags: TriageOptionTag[], flavor: StepFlavor) {
  const cleaned = String(base || "").replace(/\s+/g, " ").trim().replace(/[.;,:]+$/, "");
  const clause = optionNuanceClause(tags, flavor);
  if (!cleaned) return clause ? `${clause}.` : "";
  if (!clause) return `${cleaned}.`;
  return `${cleaned}; ${clause}.`;
}

function buildAmbiguousDistractor(step: TriageStep, flavor: StepFlavor): TriageStepOption {
  if (flavor === "priority") {
    return {
      id: `${step.id}-ambiguous`,
      label: "Prioridad alta diferida con observacion monitorizada breve antes de activar ruta completa.",
      summary: "Estrategia intermedia: parece prudente, pero suele consumir minutos criticos.",
      impact: { patientSafety: 6, responseTime: -5, resourceUse: 2, teamCommunication: 2, protocolCompliance: 1 },
      tags: ["delay"],
      npcReply: "La observacion aporta datos, aunque el equipo percibe retraso para la ruta critica.",
    };
  }

  if (flavor === "questions") {
    return {
      id: `${step.id}-ambiguous`,
      label: "Aplicar checklist amplio de anamnesis antes de priorizar el nucleo de riesgo.",
      summary: "Recolecta informacion extensa, con riesgo de perder foco temporal.",
      impact: { patientSafety: 4, responseTime: -4, resourceUse: 1, teamCommunication: 2, protocolCompliance: 1 },
      tags: ["delay"],
      npcReply: "Se obtiene informacion adicional, pero no toda impacta en la decision inmediata.",
    };
  }

  if (flavor === "monitoring") {
    return {
      id: `${step.id}-ambiguous`,
      label: "Monitorizacion escalonada: intermitente al inicio y continua solo ante empeoramiento.",
      summary: "Puede parecer eficiente, pero puede subestimar cambios tempranos.",
      impact: { patientSafety: 3, responseTime: -4, resourceUse: 2, teamCommunication: 1, protocolCompliance: -1 },
      tags: ["delay"],
      npcReply: "El control intermitente deja intervalos sin vigilancia de deterioro temprano.",
    };
  }

  if (flavor === "tests") {
    return {
      id: `${step.id}-ambiguous`,
      label: "Solicitar set intermedio de pruebas y esperar primer resultado antes de escalar.",
      summary: "Mezcla pertinencia con espera que puede retrasar acciones clave.",
      impact: { patientSafety: 3, responseTime: -4, resourceUse: -3, teamCommunication: 1, protocolCompliance: -2 },
      tags: ["delay", "overuse"],
      npcReply: "Hay datos iniciales utiles, aunque la decision critica se posterga.",
    };
  }

  return {
    id: `${step.id}-ambiguous`,
    label: "Iniciar control sintomatico + consulta con senior, y activar ruta completa si persiste riesgo.",
    summary: "Escalamiento condicionado: util en algunos casos, riesgoso en cuadros inestables.",
    impact: { patientSafety: 2, responseTime: -5, resourceUse: 2, teamCommunication: 1, protocolCompliance: -2 },
    tags: ["delay", "weak_handoff"],
    npcReply: "El control inicial ayuda parcialmente, pero el equipo requiere decision de escalamiento mas rapida.",
  };
}

function enhanceScenarioComplexity(scenario: TriageScenario): TriageScenario {
  return {
    ...scenario,
    steps: scenario.steps.map((step) => {
      const flavor = detectStepFlavor(step);
      const mappedOptions = step.options.map((option) => ({
        ...option,
        label: rewriteOptionLabel(option.label, option.tags, flavor),
        summary: nuancedSummary(option.tags),
      }));

      const options =
        mappedOptions.length >= 4
          ? mappedOptions
          : [...mappedOptions, buildAmbiguousDistractor(step, flavor)];

      return {
        ...step,
        prompt: `${step.prompt} ${subtlePromptTail(flavor)}`.trim(),
        hint: subtleHintByFlavor(flavor),
        options,
      };
    }),
  };
}

const CLINICAL_TRIAGE_SCENARIOS_BASE: readonly TriageScenario[] = [
  CHEST_PAIN_SCENARIO,
  STROKE_SCENARIO,
  SEPSIS_SCENARIO,
  ...GENERAL_SCENARIO_SEEDS.map(buildSeedScenario),
];

const OBSTETRIC_TRIAGE_SCENARIOS_BASE: readonly TriageScenario[] = [
  OBSTETRIC_SCENARIO,
  OB_POSTPARTUM_SCENARIO,
  ...OBSTETRIC_SCENARIO_SEEDS.map(buildSeedScenario),
];

const CLINICAL_TRIAGE_SCENARIOS: readonly TriageScenario[] =
  CLINICAL_TRIAGE_SCENARIOS_BASE.map(enhanceScenarioComplexity).slice(0, 15);

const OBSTETRIC_TRIAGE_SCENARIOS: readonly TriageScenario[] =
  OBSTETRIC_TRIAGE_SCENARIOS_BASE.map(enhanceScenarioComplexity).slice(0, 15);

const TRIAGE_SCENARIOS_BY_CAREER: Record<TriageCareerId, readonly TriageScenario[]> = {
  medicina: CLINICAL_TRIAGE_SCENARIOS,
  enfermeria: CLINICAL_TRIAGE_SCENARIOS,
  obstetricia: OBSTETRIC_TRIAGE_SCENARIOS,
  fisioterapia: CLINICAL_TRIAGE_SCENARIOS,
  psicologia: CLINICAL_TRIAGE_SCENARIOS,
};

const ALL_TRIAGE_SCENARIOS: readonly TriageScenario[] = [
  ...CLINICAL_TRIAGE_SCENARIOS,
  ...OBSTETRIC_TRIAGE_SCENARIOS,
];

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

export function getScenariosForCareer(careerId: TriageCareerId): readonly TriageScenario[] {
  const scenarios = TRIAGE_SCENARIOS_BY_CAREER[careerId];
  if (Array.isArray(scenarios) && scenarios.length) return scenarios;
  return CLINICAL_TRIAGE_SCENARIOS;
}

export function getScenarioById(scenarioId: string): TriageScenario | null {
  const id = String(scenarioId || "").trim();
  if (!id) return null;
  return ALL_TRIAGE_SCENARIOS.find((scenario) => scenario.id === id) ?? null;
}

export function getScenarioForCareer(careerId: TriageCareerId): TriageScenario {
  return getScenariosForCareer(careerId)[0] ?? CHEST_PAIN_SCENARIO;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function prepareScenarioForRun(scenario: TriageScenario): TriageScenario {
  return {
    ...scenario,
    steps: scenario.steps.map((step) => ({
      ...step,
      options: shuffleArray(step.options),
    })),
  };
}

export function pickRandomScenarioForCareer(
  careerId: TriageCareerId,
  excludeScenarioId?: string
): TriageScenario {
  const basePool = [...getScenariosForCareer(careerId)];
  if (!basePool.length) return CHEST_PAIN_SCENARIO;

  const filteredPool =
    excludeScenarioId && basePool.length > 1
      ? basePool.filter((scenario) => scenario.id !== excludeScenarioId)
      : basePool;

  const pool = filteredPool.length ? filteredPool : basePool;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? pool[0];
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
