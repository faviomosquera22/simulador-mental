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
  applyAdvancedVitals,
  evaluateStepwiseScenario,
  type AdvancedDifficulty,
  type AdvancedPatientProfile,
  type AdvancedVitals,
  type ModeCompatibility,
  type StepwiseAction,
  type StepwiseEvaluation,
  type StepwiseStage,
} from "./advancedModuleUtils";

export type ResuscitationCategory =
  | "bls"
  | "aed"
  | "vf"
  | "pulseless_vt"
  | "asystole"
  | "pea"
  | "abcde";

export type ResuscitationContext =
  | "prehospital"
  | "ward"
  | "icu"
  | "emergency"
  | "general";

export type ResuscitationScenario = {
  id: string;
  title: string;
  category: ResuscitationCategory;
  subcategory: string;
  difficulty: AdvancedDifficulty;
  context: ResuscitationContext;
  clinicalSummary: string;
  patientProfile: AdvancedPatientProfile;
  keyFindings: string[];
  expectedOutcome: string;
  correctAnswer: string;
  distractors: string[];
  feedback: {
    explanation: string;
    expectedConduct: string;
    algorithmPearl: string;
  };
  tags: string[];
  modeCompatibility: ModeCompatibility;
  initialRhythm: string;
  initialStatus: string;
  initialVitals: AdvancedVitals;
  timeLimitSec: number;
  stages: StepwiseStage[];
};

function action(
  id: string,
  label: string,
  score: number,
  feedback: string,
  extra?: Partial<StepwiseAction>
): StepwiseAction {
  return {
    id,
    label,
    score,
    feedback,
    ...extra,
  };
}

function createBlsStages() {
  return [
    {
      id: "stage1",
      title: "Valoración inicial",
      prompt: "Encuentras al paciente inconsciente. ¿Qué acción inicia la secuencia segura?",
      actions: [
        action("assess_call", "Valorar respuesta, activar ayuda y pedir DEA", 35, "La secuencia correcta inicia con valoración rápida y solicitud de ayuda."),
        action("check_bp_only", "Tomar presión arterial antes de pedir ayuda", 0, "Retrasa acciones críticas sin aportar prioridad inmediata."),
        action("wait_family", "Esperar a un familiar antes de actuar", 0, "En paro, la omisión inicial es insegura."),
      ],
    },
    {
      id: "stage2",
      title: "Compresiones",
      prompt: "El paciente no responde y no respira normalmente. ¿Qué sigue?",
      actions: [
        action("start_compressions", "Iniciar compresiones de alta calidad", 40, "La RCP temprana mejora perfusión y supervivencia.", {
          vitalDelta: { hr: 0, sbp: 0, spo2: -2 },
        }),
        action("position_then_wait", "Solo colocar en posición lateral y observar", 0, "No corresponde en ausencia de respiración normal."),
        action("search_history", "Revisar antecedentes antes de comprimir", 0, "No debe retrasar el inicio de RCP."),
      ],
    },
    {
      id: "stage3",
      title: "DEA",
      prompt: "Ya iniciaste compresiones y llega el DEA. ¿Qué acción es la más adecuada?",
      actions: [
        action("apply_aed", "Colocar DEA, analizar ritmo y seguir indicaciones", 25, "El DEA debe integrarse tan pronto esté disponible."),
        action("keep_compressing_forever", "Continuar compresiones sin usar el DEA", 5, "Compresiones son útiles, pero ignorar el DEA es un error."),
        action("move_patient", "Mover al paciente antes de cualquier análisis", 0, "No aporta valor frente a uso inmediato del DEA."),
      ],
    },
  ] satisfies StepwiseStage[];
}

function createShockableStages(rhythmLabel: string) {
  return [
    {
      id: "stage1",
      title: "Reconocimiento",
      prompt: `El monitor muestra ${rhythmLabel}. ¿Qué prioridad sigue?`,
      actions: [
        action("defib_now", "Desfibrilar y reanudar RCP inmediatamente", 35, "FV/TV sin pulso requieren desfibrilación temprana.", {
          resultingRhythm: rhythmLabel,
          resultingStatus: "ciclo post-descarga",
        }),
        action("pulse_check_long", "Tomar pulso por tiempo prolongado y observar", 0, "Demora la descarga en un ritmo desfibrilable."),
        action("oxygen_only", "Administrar oxígeno sin desfibrilar", 5, "El soporte aislado no sustituye la descarga."),
      ],
    },
    {
      id: "stage2",
      title: "Ciclo de RCP",
      prompt: "Tras la descarga, ¿qué conducta mantiene el algoritmo correcto?",
      actions: [
        action("resume_cpr", "Reanudar compresiones y asegurar acceso/monitorización", 35, "La RCP debe reiniciarse de inmediato tras la descarga.", {
          vitalDelta: { spo2: -1, rr: 0 },
          resultingStatus: "RCP en curso",
        }),
        action("pause_for_rhythm", "Detenerse a mirar el monitor varios segundos", 0, "Las pausas prolongadas reducen calidad de RCP."),
        action("transfer_immediately", "Trasladar sin continuar algoritmo", 0, "No es seguro abandonar el ciclo."),
      ],
    },
    {
      id: "stage3",
      title: "Intervención avanzada",
      prompt: "En el siguiente análisis el ritmo persiste. ¿Qué decisión es correcta?",
      actions: [
        action("defib_meds", "Nueva descarga y continuar algoritmo con medicación/causas reversibles", 30, "El manejo avanzado exige ciclos, descargas y causas reversibles.", {
          resultingRhythm: "ritmo organizado o nueva reevaluación",
          resultingStatus: "algoritmo avanzado",
        }),
        action("stop_after_one", "Suspender el algoritmo tras una sola descarga", 0, "No corresponde si persiste el ritmo desfibrilable."),
        action("only_intubate", "Solo intubar y omitir la siguiente descarga", 5, "La vía aérea no reemplaza la secuencia principal."),
      ],
    },
  ] satisfies StepwiseStage[];
}

function createNonShockableStages(rhythmLabel: string) {
  return [
    {
      id: "stage1",
      title: "Ritmo inicial",
      prompt: `El ritmo es ${rhythmLabel}. ¿Qué acción es prioritaria?`,
      actions: [
        action("cpr_epi", "Iniciar/continuar RCP, adrenalina y buscar causas reversibles", 35, "Los ritmos no desfibrilables requieren RCP y corrección de causas.", {
          resultingRhythm: rhythmLabel,
          resultingStatus: "algoritmo no desfibrilable",
        }),
        action("defib_anyway", "Desfibrilar de inmediato", 0, "No está indicado en asistolia/AESP."),
        action("wait_monitor", "Esperar otro monitor antes de actuar", 0, "Retrasa maniobras críticas."),
      ],
    },
    {
      id: "stage2",
      title: "Reevaluación",
      prompt: "Durante el ciclo, ¿qué enfoque mantiene una conducta segura?",
      actions: [
        action("reversible_causes", "Buscar H y T, calidad de RCP y vía aérea", 35, "La búsqueda de causas reversibles es esencial.", {
          resultingStatus: "reevaluación dirigida",
        }),
        action("pause_frequently", "Pausar compresiones de forma repetida", 0, "Disminuye la calidad global de reanimación."),
        action("skip_access", "Omitir acceso y medicación por ahora", 5, "Puede retrasar manejo avanzado."),
      ],
    },
    {
      id: "stage3",
      title: "Siguiente ciclo",
      prompt: "¿Cómo debes continuar el algoritmo?",
      actions: [
        action("continue_cycles", "Continuar ciclos de RCP con reevaluación estructurada", 30, "La secuencia debe mantenerse de forma ordenada hasta ROSC o cierre clínico."),
        action("end_early", "Suspender precozmente sin reevaluación", 0, "No es una conducta segura."),
        action("focus_ecg_only", "Mirar el monitor sin seguir compresiones", 0, "El monitor no sustituye la RCP."),
      ],
    },
  ] satisfies StepwiseStage[];
}

function createAbcdeStages() {
  return [
    {
      id: "stage1",
      title: "A y B",
      prompt: "Paciente peri-paro con respiración agónica. ¿Qué priorizas?",
      actions: [
        action("airway_breathing", "Asegurar vía aérea, ventilación y oxígeno", 35, "ABCDE empieza por vía aérea y respiración."),
        action("labs_first", "Pedir laboratorio antes de intervenir", 0, "No corresponde como primera acción."),
        action("family_history", "Pedir más antecedentes antes de actuar", 0, "Retrasa soporte vital inicial."),
      ],
    },
    {
      id: "stage2",
      title: "C",
      prompt: "Persisten signos de perfusión precaria. ¿Qué sigue?",
      actions: [
        action("circulation_support", "Valorar circulación, monitorizar y escalar intervención", 35, "La C de ABCDE exige tratar compromiso hemodinámico."),
        action("observe_without_monitor", "Observar sin monitorización", 0, "No es seguro."),
        action("defer_actions", "Dejar decisiones para el siguiente turno", 0, "Inaceptable en un paciente crítico."),
      ],
    },
    {
      id: "stage3",
      title: "D y E",
      prompt: "Tras estabilizar lo vital inmediato, ¿qué enfoque completa ABCDE?",
      actions: [
        action("complete_abcde", "Completar valoración neurológica y exposición controlada", 30, "ABCDE debe completarse de forma secuencial."),
        action("stop_after_ab", "Suspender valoración tras la primera mejoría", 0, "Deja vacíos clínicos críticos."),
        action("remove_monitor", "Quitar monitorización para facilitar traslado", 0, "No es seguro."),
      ],
    },
  ] satisfies StepwiseStage[];
}

const BASE_RCP_SCENARIOS: ResuscitationScenario[] = [
  {
    id: "rcp-basic-public",
    title: "Colapso súbito en área pública",
    category: "bls",
    subcategory: "rcp_basica_adulto",
    difficulty: "basic",
    context: "prehospital",
    clinicalSummary: "Adulto encontrado inconsciente con respiración agónica en sala de espera.",
    patientProfile: {
      name: "Luis M.",
      age: 54,
      sex: "male",
      chiefComplaint: "Colapso súbito",
      setting: "Área pública",
    },
    keyFindings: ["inconsciente", "no respira normalmente", "no hay respuesta al llamado"],
    expectedOutcome: "Activar ayuda, iniciar compresiones y usar DEA tan pronto esté disponible.",
    correctAnswer: "Iniciar RCP básica con ayuda y DEA",
    distractors: ["Esperar evaluación médica completa", "Trasladar antes de comprimir", "Tomar signos vitales prolongadamente"],
    feedback: {
      explanation: "La cadena de supervivencia comienza con reconocimiento precoz y compresiones tempranas.",
      expectedConduct: "Valorar respuesta, pedir ayuda, comprimir y usar DEA.",
      algorithmPearl: "No retrases compresiones por tareas secundarias.",
    },
    tags: ["rcp", "bls", "dea", "prehospital"],
    modeCompatibility: "both",
    initialRhythm: "Ritmo no analizado aún",
    initialStatus: "colapso súbito",
    initialVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.4 },
    timeLimitSec: 180,
    stages: createBlsStages(),
  },
  {
    id: "rcp-aed-gym",
    title: "DEA en escenario deportivo",
    category: "aed",
    subcategory: "uso_dea",
    difficulty: "basic",
    context: "prehospital",
    clinicalSummary: "Paciente colapsa en gimnasio con DEA disponible en menos de 2 minutos.",
    patientProfile: {
      name: "Mario S.",
      age: 47,
      sex: "male",
      chiefComplaint: "Colapso durante ejercicio",
      setting: "Gimnasio",
    },
    keyFindings: ["colapso presenciado", "DEA accesible", "sin respuesta"],
    expectedOutcome: "Integrar DEA precozmente dentro de una RCP básica de alta calidad.",
    correctAnswer: "Aplicar DEA tan pronto llegue sin interrumpir secuencia segura",
    distractors: ["Retrasar DEA hasta ambulancia", "Buscar antecedentes antes de actuar", "Ventilar sin compresiones"],
    feedback: {
      explanation: "La disponibilidad temprana del DEA mejora mucho el pronóstico si el ritmo es desfibrilable.",
      expectedConduct: "Compresiones tempranas y DEA tan pronto esté disponible.",
      algorithmPearl: "Minimiza pausas al aplicar y seguir el DEA.",
    },
    tags: ["dea", "bls", "deportivo", "publico"],
    modeCompatibility: "both",
    initialRhythm: "Pendiente de DEA",
    initialStatus: "paro presenciado",
    initialVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.7 },
    timeLimitSec: 170,
    stages: createBlsStages(),
  },
  {
    id: "rcp-vf-als",
    title: "Fibrilación ventricular en sala de emergencias",
    category: "vf",
    subcategory: "fv_algoritmo_avanzado",
    difficulty: "intermediate",
    context: "emergency",
    clinicalSummary: "Paciente monitorizado entra en FV durante atención en shock room.",
    patientProfile: {
      name: "Daniel C.",
      age: 63,
      sex: "male",
      chiefComplaint: "Dolor torácico previo al paro",
      setting: "Shock room",
    },
    keyFindings: ["FV en monitor", "sin pulso", "colapso intrahospitalario"],
    expectedOutcome: "Descarga inmediata, RCP y continuidad del algoritmo de ritmos desfibrilables.",
    correctAnswer: "Desfibrilar y seguir algoritmo de FV",
    distractors: ["Adrenalina antes de descargar", "Observar si revierte sola", "Tratar como asistolia"],
    feedback: {
      explanation: "La FV es un ritmo desfibrilable que exige descarga precoz y ciclos estructurados.",
      expectedConduct: "Descarga, RCP, reevaluación, medicación y causas reversibles.",
      algorithmPearl: "No prolongues la lectura del monitor antes de descargar.",
    },
    tags: ["fv", "shockable", "als", "ecg"],
    modeCompatibility: "both",
    initialRhythm: "FV",
    initialStatus: "sin pulso",
    initialVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.5 },
    timeLimitSec: 210,
    stages: createShockableStages("FV"),
  },
  {
    id: "rcp-pvt-als",
    title: "TV sin pulso en UCI",
    category: "pulseless_vt",
    subcategory: "tv_sin_pulso",
    difficulty: "intermediate",
    context: "icu",
    clinicalSummary: "Paciente crítico hace TV sin pulso durante monitorización continua.",
    patientProfile: {
      name: "Camila R.",
      age: 58,
      sex: "female",
      chiefComplaint: "Deterioro súbito monitorizado",
      setting: "UCI",
    },
    keyFindings: ["TV sin pulso", "colapso súbito", "ritmo desfibrilable"],
    expectedOutcome: "Seguir algoritmo de TV sin pulso con descargas y ciclos de RCP.",
    correctAnswer: "Desfibrilar y continuar algoritmo de TV sin pulso",
    distractors: ["Sincronizar cardioversión", "Esperar gasometría", "Tratar como bradicardia"],
    feedback: {
      explanation: "La TV sin pulso se maneja como ritmo desfibrilable en paro.",
      expectedConduct: "Descargas, RCP, medicación y búsqueda de causas.",
      algorithmPearl: "La ausencia de pulso cambia la conducta respecto a una TV con pulso.",
    },
    tags: ["tv", "sin_pulso", "icu", "als"],
    modeCompatibility: "both",
    initialRhythm: "TV sin pulso",
    initialStatus: "sin pulso",
    initialVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.2 },
    timeLimitSec: 210,
    stages: createShockableStages("TV sin pulso"),
  },
  {
    id: "rcp-asystole-ward",
    title: "Asistolia en hospitalización",
    category: "asystole",
    subcategory: "asistolia",
    difficulty: "intermediate",
    context: "ward",
    clinicalSummary: "Paciente se encuentra sin respuesta y el monitor muestra asistolia.",
    patientProfile: {
      name: "Elena V.",
      age: 72,
      sex: "female",
      chiefComplaint: "Deterioro súbito en sala",
      setting: "Hospitalización",
    },
    keyFindings: ["asistolia", "sin pulso", "ritmo no desfibrilable"],
    expectedOutcome: "RCP de alta calidad, adrenalina y búsqueda de causas reversibles.",
    correctAnswer: "Seguir algoritmo no desfibrilable de asistolia",
    distractors: ["Desfibrilar de inmediato", "Trasladar sin comprimir", "Esperar nuevo monitor"],
    feedback: {
      explanation: "La asistolia no se desfibrila; el enfoque es RCP y causas reversibles.",
      expectedConduct: "RCP, adrenalina y reevaluación estructurada.",
      algorithmPearl: "Confirma conexiones, pero no retrases la secuencia principal.",
    },
    tags: ["asistolia", "ward", "nonshockable", "paro"],
    modeCompatibility: "both",
    initialRhythm: "Asistolia",
    initialStatus: "sin pulso",
    initialVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.8 },
    timeLimitSec: 220,
    stages: createNonShockableStages("asistolia"),
  },
  {
    id: "rcp-pea-renal",
    title: "AESP por causa reversible probable",
    category: "pea",
    subcategory: "actividad_electrica_sin_pulso",
    difficulty: "advanced",
    context: "emergency",
    clinicalSummary: "Paciente con actividad eléctrica organizada, sin pulso y antecedente renal/metabólico.",
    patientProfile: {
      name: "Mauricio P.",
      age: 66,
      sex: "male",
      chiefComplaint: "Colapso en emergencia",
      setting: "Emergencia crítica",
    },
    keyFindings: ["actividad organizada", "sin pulso", "posible causa reversible metabólica"],
    expectedOutcome: "RCP, adrenalina y búsqueda intensiva de causas reversibles.",
    correctAnswer: "Tratar como AESP y buscar H/T",
    distractors: ["Desfibrilar", "Esperar solo respuesta espontánea", "Dar alta del algoritmo"],
    feedback: {
      explanation: "La AESP obliga a pensar activamente en hipoxia, hipovolemia, potasio, trombosis y otras causas reversibles.",
      expectedConduct: "RCP, medicación y corrección dirigida de causas.",
      algorithmPearl: "El monitor con complejos no implica perfusión efectiva.",
    },
    tags: ["aesp", "causas_reversibles", "paro", "metabolico"],
    modeCompatibility: "both",
    initialRhythm: "AESP",
    initialStatus: "sin pulso",
    initialVitals: { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, temp: 36.1 },
    timeLimitSec: 230,
    stages: createNonShockableStages("AESP"),
  },
  {
    id: "rcp-abcde-periarrest",
    title: "Paciente peri-paro para valoración ABCDE",
    category: "abcde",
    subcategory: "valoracion_primaria",
    difficulty: "basic",
    context: "emergency",
    clinicalSummary: "Paciente muy inestable con respiración agónica, hipoxemia y perfusión deficiente.",
    patientProfile: {
      name: "Nadia T.",
      age: 35,
      sex: "female",
      chiefComplaint: "Disnea extrema y deterioro rápido",
      setting: "Sala crítica",
    },
    keyFindings: ["respiración agónica", "perfusión deficiente", "conciencia alterada"],
    expectedOutcome: "Aplicar ABCDE para priorizar medidas vitales antes del deterioro a paro.",
    correctAnswer: "Completar valoración ABCDE con acciones inmediatas",
    distractors: ["Pedir tomografía primero", "Esperar laboratorio completo", "Centrarse solo en antecedentes"],
    feedback: {
      explanation: "ABCDE ordena la atención inicial del paciente crítico y evita omisiones.",
      expectedConduct: "Asegurar vía aérea/respiración, tratar circulación y completar valoración.",
      algorithmPearl: "En peri-paro, la secuencia importa tanto como la intervención.",
    },
    tags: ["abcde", "critico", "priorizacion", "emergency"],
    modeCompatibility: "both",
    initialRhythm: "Taquicardia organizada",
    initialStatus: "peri-paro",
    initialVitals: { hr: 142, sbp: 78, dbp: 42, spo2: 84, rr: 34, temp: 37.1 },
    timeLimitSec: 180,
    stages: createAbcdeStages(),
  },
];

const RCP_CONTEXT_SUFFIXES = [
  "con equipo de respuesta en activación",
  "durante turno nocturno",
  "con recursos disponibles de forma inmediata",
  "en entorno de alta presión asistencial",
];

function buildResuscitationVariant(baseCase: ResuscitationScenario, variantIndex: number) {
  return {
    ...baseCase,
    id: buildVariantId(baseCase.id, variantIndex),
    title: buildVariantName(baseCase.title, variantIndex),
    clinicalSummary: buildVariantSentence(baseCase.clinicalSummary, variantIndex),
    patientProfile: {
      ...buildVariantPatient(baseCase.patientProfile, variantIndex),
      chiefComplaint: buildVariantSentence(baseCase.patientProfile.chiefComplaint, variantIndex),
      setting: `${baseCase.patientProfile.setting} · ${pickDeterministic(RCP_CONTEXT_SUFFIXES, variantIndex)}`,
    },
    initialVitals: {
      hr: boundedNumber(baseCase.initialVitals.hr, variantIndex, [0], 0, 220, 0),
      sbp: boundedNumber(baseCase.initialVitals.sbp, variantIndex + 1, [0], 0, 220, 0),
      dbp: boundedNumber(baseCase.initialVitals.dbp, variantIndex + 2, [0], 0, 160, 0),
      spo2: boundedNumber(baseCase.initialVitals.spo2, variantIndex + 3, [0], 0, 100, 0),
      rr: boundedNumber(baseCase.initialVitals.rr, variantIndex + 4, [0], 0, 80, 0),
      temp: boundedNumber(baseCase.initialVitals.temp, variantIndex + 5, [-0.4, -0.2, 0, 0.2, 0.4], 35.5, 38.5, 1),
    },
    timeLimitSec: boundedNumber(baseCase.timeLimitSec, variantIndex, [-20, -10, 0, 10, 20], 150, 260, 0),
    tags: Array.from(new Set([...baseCase.tags, pickDeterministic(["ciclo", "algoritmo", "paro"], variantIndex)])),
  };
}

export const RCP_ALGORITHM_LIBRARY: ResuscitationScenario[] = expandCaseLibrary(
  BASE_RCP_SCENARIOS,
  ADVANCED_MODULE_LIBRARY_SIZE,
  (baseCase, variantIndex) => buildResuscitationVariant(baseCase, variantIndex)
);

export function resuscitationCategoryLabel(category: ResuscitationCategory) {
  if (category === "bls") return "RCP básica";
  if (category === "aed") return "Uso de DEA";
  if (category === "vf") return "Fibrilación ventricular";
  if (category === "pulseless_vt") return "TV sin pulso";
  if (category === "asystole") return "Asistolia";
  if (category === "pea") return "AESP";
  return "ABCDE";
}

export function resuscitationContextLabel(context: ResuscitationContext) {
  if (context === "prehospital") return "Prehospitalario";
  if (context === "ward") return "Hospitalización";
  if (context === "icu") return "UCI";
  if (context === "emergency") return "Emergencia";
  return "General";
}

export function inferResuscitationContext(caseObject: any): ResuscitationContext {
  const text = String(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.chief_complaint,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
    ].join(" ")
  ).toLowerCase();

  if (text.includes("uci") || text.includes("intensivo")) return "icu";
  if (text.includes("hospital") || text.includes("sala")) return "ward";
  if (text.includes("prehospital") || text.includes("ambulancia") || text.includes("publico")) return "prehospital";
  if (text.includes("shock") || text.includes("emerg")) return "emergency";
  return "general";
}

export function evaluateResuscitationScenario(args: {
  scenario: ResuscitationScenario;
  selectedActionIds: string[];
  timedOut: boolean;
}): StepwiseEvaluation {
  return evaluateStepwiseScenario({
    stages: args.scenario.stages,
    selectedActionIds: args.selectedActionIds,
    timedOut: args.timedOut,
    timeoutPenalty: 10,
    excellentSummary: "Secuencia de reanimación sólida, priorizada y consistente con el algoritmo.",
    goodSummary: "La secuencia global es adecuada, aunque aún puedes reducir demoras o vacíos del algoritmo.",
    partialSummary: "Hay decisiones útiles, pero la secuencia todavía no es suficientemente robusta para un paro real.",
    unsafeSummary: "La conducción del algoritmo no fue segura para una situación de reanimación.",
  });
}

export function resuscitationDifficultyLabel(value: AdvancedDifficulty) {
  return advancedDifficultyLabel(value);
}

export function applyResuscitationVitals(
  current: AdvancedVitals,
  actionState?: Partial<AdvancedVitals>
) {
  return applyAdvancedVitals(current, actionState);
}
