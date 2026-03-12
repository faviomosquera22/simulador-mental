export type EmergencyMode = "practice" | "evaluation";

export type EmergencyDifficulty = "basic" | "intermediate" | "advanced";

export type EmergencyScenarioType =
  | "chest_pain"
  | "dyspnea"
  | "sepsis"
  | "hypoglycemia"
  | "anaphylaxis";

export type EmergencyVitals = {
  hr: number;
  sbp: number;
  dbp: number;
  spo2: number;
  rr: number;
  temp: number;
};

export type EmergencyStudyCard = {
  id: string;
  module: "ecg" | "laboratory" | "gasometry";
  title: string;
  summary: string;
  rows: Array<{ label: string; value: string }>;
};

export type EmergencyAction = {
  id: string;
  label: string;
  type: "assessment" | "study" | "medication" | "procedure" | "escalation";
  score: number;
  explanation: string;
  revealsStudyIds?: string[];
  vitalDelta?: Partial<EmergencyVitals>;
};

export type EmergencyStage = {
  id: string;
  title: string;
  prompt: string;
  actions: EmergencyAction[];
};

export type EmergencyScenario = {
  id: string;
  name: string;
  type: EmergencyScenarioType;
  difficulty: EmergencyDifficulty;
  patient: {
    age: number;
    sex: "female" | "male" | "unspecified";
    chiefComplaint: string;
  };
  initialVitals: EmergencyVitals;
  priorityLabel: string;
  context: string;
  timeLimitSec: number;
  studies: EmergencyStudyCard[];
  stages: EmergencyStage[];
  finalTeaching: string;
};

export type EmergencyScenarioEvaluation = {
  totalScore: number;
  maxScore: number;
  outcome: "excellent" | "good" | "partial" | "unsafe";
  summary: string;
  stageFeedback: Array<{ stageTitle: string; actionLabel: string; explanation: string; score: number }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function emergencyDifficultyLabel(value: EmergencyDifficulty) {
  if (value === "basic") return "Básico";
  if (value === "intermediate") return "Intermedio";
  return "Avanzado";
}

export function emergencyTypeLabel(value: EmergencyScenarioType) {
  if (value === "chest_pain") return "Dolor torácico";
  if (value === "dyspnea") return "Disnea aguda";
  if (value === "sepsis") return "Sepsis";
  if (value === "hypoglycemia") return "Hipoglucemia";
  return "Anafilaxia";
}

export function applyEmergencyVitals(
  current: EmergencyVitals,
  delta?: Partial<EmergencyVitals>
): EmergencyVitals {
  if (!delta) return current;
  return {
    hr: clamp(current.hr + (delta.hr ?? 0), 0, 250),
    sbp: clamp(current.sbp + (delta.sbp ?? 0), 0, 240),
    dbp: clamp(current.dbp + (delta.dbp ?? 0), 0, 160),
    spo2: clamp(current.spo2 + (delta.spo2 ?? 0), 0, 100),
    rr: clamp(current.rr + (delta.rr ?? 0), 0, 80),
    temp: Number((current.temp + (delta.temp ?? 0)).toFixed(1)),
  };
}

export const EMERGENCY_SCENARIOS: EmergencyScenario[] = [
  {
    id: "stemi_chest_pain",
    name: "Dolor torácico con sospecha de IAM",
    type: "chest_pain",
    difficulty: "intermediate",
    patient: { age: 58, sex: "male", chiefComplaint: "Dolor torácico opresivo y diaforesis" },
    initialVitals: { hr: 108, sbp: 94, dbp: 60, spo2: 92, rr: 24, temp: 36.7 },
    priorityLabel: "Tiempo dependiente",
    context: "Paciente con dolor retroesternal de 40 minutos de evolución.",
    timeLimitSec: 180,
    studies: [
      {
        id: "ecg_stemi",
        module: "ecg",
        title: "ECG solicitado",
        summary: "Elevación del ST en derivaciones anteriores.",
        rows: [
          { label: "Hallazgo", value: "ST elevado en V1-V4" },
          { label: "Interpretación", value: "IAM con elevación del ST anterior" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Paso 1",
        prompt: "¿Qué acción inicial tiene mayor valor diagnóstico inmediato?",
        actions: [
          {
            id: "order_ecg",
            label: "Solicitar ECG inmediato",
            type: "study",
            score: 35,
            explanation: "En dolor torácico de alto riesgo, el ECG temprano cambia la conducta.",
            revealsStudyIds: ["ecg_stemi"],
          },
          {
            id: "wait_analgesia",
            label: "Esperar respuesta a analgésico y reevaluar después",
            type: "assessment",
            score: 5,
            explanation: "Demora una evaluación clave en un síndrome tiempo dependiente.",
            vitalDelta: { sbp: -6, spo2: -2 },
          },
        ],
      },
      {
        id: "stage2",
        title: "Paso 2",
        prompt: "Con el ECG disponible, ¿cuál es la prioridad?",
        actions: [
          {
            id: "activate_acs",
            label: "Activar protocolo de SCA y reperfusión",
            type: "escalation",
            score: 40,
            explanation: "La elevación del ST exige manejo urgente orientado a reperfusión.",
            vitalDelta: { hr: -4 },
          },
          {
            id: "observe_only",
            label: "Observar y repetir signos vitales sin activar protocolo",
            type: "assessment",
            score: 0,
            explanation: "Es una conducta insegura frente a un probable IAMCEST.",
            vitalDelta: { sbp: -10, spo2: -3, hr: 8 },
          },
        ],
      },
      {
        id: "stage3",
        title: "Paso 3",
        prompt: "¿Qué soporte complementario es coherente mientras se transfiere?",
        actions: [
          {
            id: "monitor_access",
            label: "Monitorización continua, acceso venoso y preparación de traslado",
            type: "procedure",
            score: 25,
            explanation: "Asegura continuidad y respuesta rápida ante deterioro.",
            vitalDelta: { spo2: 2 },
          },
          {
            id: "send_alone",
            label: "Enviar al paciente sin monitorización para no demorar",
            type: "procedure",
            score: 0,
            explanation: "No es seguro trasladar sin vigilancia a un paciente inestable.",
            vitalDelta: { sbp: -8, spo2: -2 },
          },
        ],
      },
    ],
    finalTeaching: "En dolor torácico de alto riesgo, el ECG precoz y la activación rápida del protocolo cambian pronóstico.",
  },
  {
    id: "sepsis_bundle",
    name: "Sepsis con hipoperfusión",
    type: "sepsis",
    difficulty: "advanced",
    patient: { age: 71, sex: "female", chiefComplaint: "Fiebre, hipotensión y confusión" },
    initialVitals: { hr: 124, sbp: 82, dbp: 48, spo2: 91, rr: 30, temp: 38.9 },
    priorityLabel: "Alto riesgo",
    context: "Paciente con sospecha infecciosa y datos de hipoperfusión.",
    timeLimitSec: 210,
    studies: [
      {
        id: "lab_sepsis",
        module: "laboratory",
        title: "Laboratorio solicitado",
        summary: "Leucocitosis y lactato elevado.",
        rows: [
          { label: "Leucocitos", value: "18,800 /mm3" },
          { label: "Creatinina", value: "1.8 mg/dL" },
          { label: "Lactato", value: "5.6 mmol/L" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Paso 1",
        prompt: "¿Qué estudio inicial te ayuda a objetivar la gravedad y perfusión?",
        actions: [
          {
            id: "order_labs",
            label: "Solicitar laboratorio y lactato",
            type: "study",
            score: 30,
            explanation: "El lactato y el laboratorio orientan gravedad y daño orgánico.",
            revealsStudyIds: ["lab_sepsis"],
          },
          {
            id: "delay_tests",
            label: "Esperar varias horas para repetir signos antes de pedir estudios",
            type: "assessment",
            score: 0,
            explanation: "Retrasa la identificación de sepsis y su bundle inicial.",
            vitalDelta: { sbp: -8, hr: 6 },
          },
        ],
      },
      {
        id: "stage2",
        title: "Paso 2",
        prompt: "Con hipotensión y lactato alto, ¿qué acción es prioritaria?",
        actions: [
          {
            id: "start_fluids",
            label: "Iniciar reanimación con fluidos y monitorización estrecha",
            type: "procedure",
            score: 40,
            explanation: "La hipoperfusión requiere fluidoterapia temprana y vigilancia hemodinámica.",
            vitalDelta: { sbp: 10, dbp: 6, hr: -6 },
          },
          {
            id: "observe_only",
            label: "Solo observar respuesta espontánea",
            type: "assessment",
            score: 0,
            explanation: "No es aceptable ante datos de sepsis con hipoperfusión.",
            vitalDelta: { sbp: -10, spo2: -2 },
          },
        ],
      },
      {
        id: "stage3",
        title: "Paso 3",
        prompt: "¿Qué intervención complementaria no debe retrasarse?",
        actions: [
          {
            id: "start_antibiotics",
            label: "Escalar antibiótico temprano según protocolo",
            type: "medication",
            score: 30,
            explanation: "El antibiótico temprano es un componente central del manejo de sepsis.",
          },
          {
            id: "postpone_antibiotics",
            label: "Dejar antibiótico para el siguiente turno",
            type: "medication",
            score: 0,
            explanation: "Retrasar antibiótico empeora pronóstico en sepsis.",
            vitalDelta: { sbp: -8, hr: 5 },
          },
        ],
      },
    ],
    finalTeaching: "Sepsis exige reconocer hipoperfusión, iniciar bundle temprano y no diferir antibióticos.",
  },
  {
    id: "hypoglycemia_fast",
    name: "Hipoglucemia sintomática",
    type: "hypoglycemia",
    difficulty: "basic",
    patient: { age: 39, sex: "female", chiefComplaint: "Diaforesis, temblor y desorientación" },
    initialVitals: { hr: 112, sbp: 110, dbp: 68, spo2: 97, rr: 20, temp: 36.4 },
    priorityLabel: "Reversible inmediata",
    context: "Paciente diabética con alteración del sensorio y sospecha de hipoglucemia.",
    timeLimitSec: 150,
    studies: [
      {
        id: "lab_glucose",
        module: "laboratory",
        title: "Control capilar",
        summary: "Glucosa capilar críticamente baja.",
        rows: [{ label: "Glucosa", value: "42 mg/dL" }],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Paso 1",
        prompt: "¿Qué verificación rápida cambia la conducta de inmediato?",
        actions: [
          {
            id: "check_glucose",
            label: "Verificar glucosa capilar",
            type: "study",
            score: 35,
            explanation: "Confirma una causa reversible y tratable de inmediato.",
            revealsStudyIds: ["lab_glucose"],
          },
          {
            id: "observe",
            label: "Solo observar y pedir que descanse",
            type: "assessment",
            score: 0,
            explanation: "No es seguro ante alteración neurológica potencialmente reversible.",
          },
        ],
      },
      {
        id: "stage2",
        title: "Paso 2",
        prompt: "Confirmada la hipoglucemia, ¿qué harías?",
        actions: [
          {
            id: "correct_glucose",
            label: "Administrar corrección de glucosa según vía disponible",
            type: "medication",
            score: 40,
            explanation: "La corrección inmediata es la prioridad terapéutica.",
            vitalDelta: { hr: -8 },
          },
          {
            id: "delay_correction",
            label: "Esperar laboratorio venoso antes de tratar",
            type: "study",
            score: 0,
            explanation: "No debe retrasarse el tratamiento ante hipoglucemia confirmada.",
            vitalDelta: { hr: 8, sbp: -6 },
          },
        ],
      },
      {
        id: "stage3",
        title: "Paso 3",
        prompt: "Tras la corrección inicial, ¿qué sigue?",
        actions: [
          {
            id: "recheck_monitor",
            label: "Revalorar estado neurológico y repetir glucosa",
            type: "assessment",
            score: 25,
            explanation: "La reevaluación confirma respuesta y previene recurrencia.",
          },
          {
            id: "finish_without_recheck",
            label: "Dar el caso por resuelto sin reevaluar",
            type: "assessment",
            score: 0,
            explanation: "La hipoglucemia requiere confirmación de respuesta.",
          },
        ],
      },
    ],
    finalTeaching: "Las causas reversibles tiempo dependientes se tratan y luego se reevaluan; no al revés.",
  },
  {
    id: "anaphylaxis_im_epinephrine",
    name: "Anafilaxia en evolución",
    type: "anaphylaxis",
    difficulty: "intermediate",
    patient: { age: 26, sex: "male", chiefComplaint: "Urticaria, disnea y edema labial" },
    initialVitals: { hr: 132, sbp: 78, dbp: 44, spo2: 88, rr: 34, temp: 36.5 },
    priorityLabel: "Crítico",
    context: "Paciente tras exposición alimentaria con compromiso respiratorio y hemodinámico.",
    timeLimitSec: 150,
    studies: [],
    stages: [
      {
        id: "stage1",
        title: "Paso 1",
        prompt: "¿Qué intervención tiene prioridad absoluta?",
        actions: [
          {
            id: "epinephrine_im",
            label: "Administrar adrenalina IM de inmediato",
            type: "medication",
            score: 45,
            explanation: "Es la intervención de primera línea en anafilaxia.",
            vitalDelta: { sbp: 12, spo2: 4, rr: -4 },
          },
          {
            id: "antihistamine_only",
            label: "Dar solo antihistamínico y observar",
            type: "medication",
            score: 5,
            explanation: "No reemplaza la adrenalina en anafilaxia.",
            vitalDelta: { sbp: -8, spo2: -4 },
          },
        ],
      },
      {
        id: "stage2",
        title: "Paso 2",
        prompt: "Además de la medicación inicial, ¿qué soporte es prioritario?",
        actions: [
          {
            id: "airway_oxygen",
            label: "Asegurar vía aérea, oxígeno y monitorización",
            type: "procedure",
            score: 30,
            explanation: "La anafilaxia requiere soporte respiratorio y vigilancia continua.",
            vitalDelta: { spo2: 4, rr: -3 },
          },
          {
            id: "leave_waiting",
            label: "Dejar al paciente en observación sin monitorización",
            type: "assessment",
            score: 0,
            explanation: "Es inseguro por riesgo de deterioro súbito.",
          },
        ],
      },
      {
        id: "stage3",
        title: "Paso 3",
        prompt: "¿Qué seguimiento inmediato es correcto?",
        actions: [
          {
            id: "reassess_repeat",
            label: "Reevaluar y preparar dosis repetida si no revierte",
            type: "assessment",
            score: 25,
            explanation: "La reevaluación permite detectar respuesta insuficiente y repetir adrenalina si aplica.",
          },
          {
            id: "discharge_fast",
            label: "Dar alta apenas mejora mínimamente",
            type: "assessment",
            score: 0,
            explanation: "No es seguro sin observación y reevaluación apropiada.",
          },
        ],
      },
    ],
    finalTeaching: "En anafilaxia, la adrenalina IM no se reemplaza por antihistamínicos ni se demora por estudios.",
  },
  {
    id: "dyspnea_abg",
    name: "Disnea aguda con necesidad de gasometría",
    type: "dyspnea",
    difficulty: "advanced",
    patient: { age: 67, sex: "male", chiefComplaint: "Disnea, somnolencia y uso de músculos accesorios" },
    initialVitals: { hr: 118, sbp: 102, dbp: 64, spo2: 85, rr: 32, temp: 37.0 },
    priorityLabel: "Respiratorio crítico",
    context: "Paciente con antecedentes respiratorios y deterioro ventilatorio progresivo.",
    timeLimitSec: 180,
    studies: [
      {
        id: "abg_resp_failure",
        module: "gasometry",
        title: "Gasometría solicitada",
        summary: "Acidosis respiratoria con hipoxemia.",
        rows: [
          { label: "pH", value: "7.28" },
          { label: "PaCO2", value: "62 mmHg" },
          { label: "HCO3", value: "28 mEq/L" },
          { label: "PaO2", value: "58 mmHg" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Paso 1",
        prompt: "¿Qué dato complementario te ayuda a definir el tipo de insuficiencia respiratoria?",
        actions: [
          {
            id: "order_abg",
            label: "Solicitar gasometría arterial",
            type: "study",
            score: 35,
            explanation: "La gasometría aporta pH, CO2 y oxigenación para definir gravedad y mecanismo.",
            revealsStudyIds: ["abg_resp_failure"],
          },
          {
            id: "skip_abg",
            label: "No pedirla y basarse solo en la oximetría",
            type: "study",
            score: 5,
            explanation: "La oximetría sola no caracteriza ventilación ni trastorno ácido-base.",
          },
        ],
      },
      {
        id: "stage2",
        title: "Paso 2",
        prompt: "Con el estudio disponible, ¿qué priorizas?",
        actions: [
          {
            id: "resp_support",
            label: "Escalar soporte respiratorio y vigilancia estrecha",
            type: "procedure",
            score: 40,
            explanation: "La acidosis respiratoria con hipoxemia obliga a soporte y reevaluación inmediata.",
            vitalDelta: { spo2: 5, rr: -4 },
          },
          {
            id: "observe_on_room_air",
            label: "Dejarlo en aire ambiente para reevaluar luego",
            type: "assessment",
            score: 0,
            explanation: "Es inseguro mantener sin soporte a un paciente con insuficiencia respiratoria.",
            vitalDelta: { spo2: -4, sbp: -6 },
          },
        ],
      },
      {
        id: "stage3",
        title: "Paso 3",
        prompt: "¿Cuál es el siguiente foco clínico?",
        actions: [
          {
            id: "monitor_reassess",
            label: "Reevaluar respuesta, fatiga respiratoria y necesidad de escalamiento",
            type: "assessment",
            score: 25,
            explanation: "La monitorización dinámica define si el soporte actual es suficiente.",
          },
          {
            id: "no_followup",
            label: "Mantener el mismo plan sin nueva reevaluación",
            type: "assessment",
            score: 0,
            explanation: "En insuficiencia respiratoria, la evolución debe vigilarse muy de cerca.",
          },
        ],
      },
    ],
    finalTeaching: "La gasometría cambia decisiones en disnea compleja porque integra oxigenación, ventilación y estado ácido-base.",
  },
];

export function evaluateEmergencyScenario(args: {
  scenario: EmergencyScenario;
  selectedActionIds: string[];
  timedOut: boolean;
}): EmergencyScenarioEvaluation {
  const { scenario, selectedActionIds, timedOut } = args;
  const stageFeedback = scenario.stages.map((stage, index) => {
    const selectedId = selectedActionIds[index];
    const action = stage.actions.find((item) => item.id === selectedId) ?? stage.actions[0];
    return {
      stageTitle: stage.title,
      actionLabel: action.label,
      explanation: action.explanation,
      score: selectedId ? action.score : 0,
    };
  });

  const totalScore = stageFeedback.reduce((acc, item) => acc + item.score, 0) - (timedOut ? 10 : 0);
  const maxScore = scenario.stages.reduce((acc, stage) => {
    const best = Math.max(...stage.actions.map((action) => action.score));
    return acc + best;
  }, 0);
  const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const outcome =
    pct >= 85
      ? "excellent"
      : pct >= 70
      ? "good"
      : pct >= 45
      ? "partial"
      : "unsafe";

  return {
    totalScore,
    maxScore,
    outcome,
    summary:
      outcome === "excellent"
        ? "Resolviste la urgencia con buena priorización y secuencia."
        : outcome === "good"
        ? "La resolución es razonable, aunque algunas prioridades pudieron ser más rápidas."
        : outcome === "partial"
        ? "Hubo decisiones útiles, pero la secuencia aún no es robusta para un entorno de urgencias."
        : "La priorización fue insuficiente para una urgencia segura.",
    stageFeedback,
  };
}
