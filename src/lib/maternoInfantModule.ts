import {
  boundedNumber,
  buildVariantId,
  buildVariantName,
  buildVariantSentence,
  expandCaseLibrary,
  pickDeterministic,
} from "./caseExpansion";
import {
  ADVANCED_MODULE_LIBRARY_SIZE,
  advancedDifficultyLabel,
  applyAdvancedVitals,
  evaluateStepwiseScenario,
  normalizeText,
  type AdvancedDifficulty,
  type AdvancedPatientProfile,
  type AdvancedVitals,
  type ModeCompatibility,
  type StepwiseAction,
  type StepwiseStage,
} from "./advancedModuleUtils";

export type MaternoInfantCategory =
  | "prenatal_alerts"
  | "labor_puerperium"
  | "neonatal_resuscitation"
  | "growth_development"
  | "pediatric_emergency";

export type MaternoInfantPopulation = "obstetric" | "neonatal" | "pediatric";

export type MaternoInfantContext =
  | "prenatal_clinic"
  | "delivery_room"
  | "puerperium_ward"
  | "neonatal_unit"
  | "pediatric_emergency"
  | "general";

export type MaternoInfantScenario = {
  id: string;
  title: string;
  category: MaternoInfantCategory;
  subcategory: string;
  population: MaternoInfantPopulation;
  difficulty: AdvancedDifficulty;
  context: MaternoInfantContext;
  clinicalSummary: string;
  patientProfile: AdvancedPatientProfile;
  keyFindings: string[];
  expectedOutcome: string;
  correctAnswer: string;
  distractors: string[];
  feedback: {
    explanation: string;
    expectedConduct: string;
    populationPearl: string;
  };
  tags: string[];
  modeCompatibility: ModeCompatibility;
  initialVitals: AdvancedVitals;
  initialStatus: string;
  alerts: string[];
  stages: StepwiseStage[];
  timeLimitSec: number;
};

const OBSTETRIC_NAMES = ["María", "Daniela", "Lucía", "Paola", "Natalia", "Carolina", "Valeria", "Elena"];
const PED_NAMES = ["Mateo", "Sofía", "Gael", "Ariana", "Noah", "Camila", "Lucas", "Emma"];
const LAST_NAMES = ["R.", "P.", "M.", "T.", "C.", "L.", "V.", "D."];
const NEONATAL_AGE_LABELS = ["20 min de vida", "45 min de vida", "1 h de vida", "2 h de vida", "6 h de vida"];
const PEDIATRIC_AGE_LABELS = ["8 meses", "14 meses", "2 años", "4 años", "7 años", "10 años"];
const SETTINGS = ["Turno de mañana", "Ingreso prioritario", "Reevaluación clínica", "Control inmediato", "Sala crítica"];

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

const BASE_MATERNO_INFANT_SCENARIOS: MaternoInfantScenario[] = [
  {
    id: "mi-prenatal-htn",
    title: "Gestante con signos de alarma hipertensiva",
    category: "prenatal_alerts",
    subcategory: "trastorno_hipertensivo_gestacional",
    population: "obstetric",
    difficulty: "advanced",
    context: "prenatal_clinic",
    clinicalSummary:
      "Gestante de 34 semanas con cefalea intensa, fosfenos y dolor en epigastrio. El caso exige reconocer signos de alarma y escalar atención sin retrasos.",
    patientProfile: {
      name: "Daniela M.",
      age: 29,
      sex: "female",
      chiefComplaint: "Cefalea intensa y visión borrosa",
      setting: "Consulta obstétrica",
      gestationalAgeWeeks: 34,
      ageLabel: "34 semanas de gestación",
    },
    keyFindings: ["cefalea intensa", "fosfenos", "epigastralgia", "PA severa", "riesgo materno-fetal"],
    expectedOutcome: "Clasificar urgencia, monitorizar y derivar/ingresar por probable preeclampsia severa.",
    correctAnswer: "Reconocer signos de alarma obstétrica y escalar de inmediato.",
    distractors: ["Dar analgésico y citar luego", "Manejo ambulatorio sin control", "Esperar solo laboratorio externo"],
    feedback: {
      explanation: "En obstetricia, los signos neurológicos y la hipertensión cambian la prioridad clínica inmediatamente.",
      expectedConduct: "Confirmar gravedad, proteger a madre y feto, monitorizar y coordinar atención especializada urgente.",
      populationPearl: "El tiempo en obstetricia crítica protege a dos pacientes al mismo tiempo.",
    },
    tags: ["obstetricia", "prenatal", "preeclampsia", "alarma"],
    modeCompatibility: "both",
    initialVitals: { hr: 108, sbp: 172, dbp: 108, spo2: 98, rr: 22, temp: 36.8 },
    initialStatus: "Alta sospecha de trastorno hipertensivo severo",
    alerts: ["Urgencia obstétrica", "Riesgo materno-fetal", "Escalada inmediata"],
    stages: [
      {
        id: "stage1",
        title: "Recepción",
        prompt: "¿Qué acción es prioritaria al identificar estos síntomas?",
        actions: [
          action("classify_emergency", "Clasificar como urgencia obstétrica, controlar PA y activar derivación", 35, "La correcta clasificación cambia el flujo y la seguridad del binomio.", {
            resultingStatus: "Urgencia obstétrica activada",
          }),
          action("routine_followup", "Mantenerla como control rutinario y reevaluar otro día", 0, "Es una omisión grave frente a signos de alarma.", {
            vitalDelta: { sbp: 6, dbp: 4 },
          }),
        ],
      },
      {
        id: "stage2",
        title: "Valoración inicial",
        prompt: "¿Qué enfoque completa mejor la primera respuesta?",
        actions: [
          action("maternal_fetal_monitor", "Monitorización materna, evaluación fetal inicial y comunicación estructurada", 25, "Debes pensar en madre y feto de manera simultánea.", {
            resultingStatus: "Vigilancia materno-fetal en curso",
          }),
          action("maternal_only", "Enfocarte solo en la cefalea y omitir valoración fetal", 0, "Deja incompleto el abordaje del binomio.", {
            resultingStatus: "Abordaje parcial",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Conducta",
        prompt: "La presión persiste severa. ¿Qué conducta es la más coherente?",
        actions: [
          action("escalate_obstetric", "Escalar manejo obstétrico urgente y preparar continuidad asistencial", 20, "La evolución obliga a atención especializada sin demoras.", {
            resultingStatus: "Caso derivado con prioridad alta",
          }),
          action("home_rest", "Indicar reposo domiciliario y signos de alarma por escrito", 0, "No es seguro ante criterios severos.", {
            resultingStatus: "Alta insegura",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Cierre",
        prompt: "¿Qué elemento no debe faltar al finalizar esta fase?",
        actions: [
          action("document_obstetric", "Documentar signos de alarma, edad gestacional y plan de continuidad", 10, "La cronología y la edad gestacional son críticas en la continuidad.", {
            resultingStatus: "Continuidad obstétrica segura",
          }),
          action("omit_gestational_age", "Cerrar sin registrar edad gestacional ni signos críticos", 0, "Error de documentación relevante.", {
            resultingStatus: "Continuidad deficiente",
          }),
        ],
      },
    ],
    timeLimitSec: 230,
  },
  {
    id: "mi-reduced-fetal-movement",
    title: "Disminución de movimientos fetales en tercer trimestre",
    category: "prenatal_alerts",
    subcategory: "movimientos_fetales_disminuidos",
    population: "obstetric",
    difficulty: "intermediate",
    context: "prenatal_clinic",
    clinicalSummary:
      "Gestante de 36 semanas refiere disminución marcada de movimientos fetales desde la noche previa. El caso exige priorizar evaluación y orientación segura.",
    patientProfile: {
      name: "Lucía P.",
      age: 31,
      sex: "female",
      chiefComplaint: "Siente menos movimientos fetales",
      setting: "Control prenatal prioritario",
      gestationalAgeWeeks: 36,
      ageLabel: "36 semanas de gestación",
    },
    keyFindings: ["tercer trimestre", "disminución de movimientos", "ansiedad materna", "potencial compromiso fetal"],
    expectedOutcome: "Clasificar como motivo prioritario y asegurar evaluación obstétrica/fetal pronta.",
    correctAnswer: "No minimizar el síntoma y asegurar valoración oportuna.",
    distractors: ["Citar en una semana", "Decir que es normal sin evaluación", "Dar solo tranquilidad verbal"],
    feedback: {
      explanation: "La reducción de movimientos fetales siempre merece lectura clínica dirigida y no debe banalizarse.",
      expectedConduct: "Derivar para valoración fetal, documentar tiempo de inicio y vigilar signos asociados.",
      populationPearl: "Cuando cambia la actividad fetal, la rapidez de la valoración importa aunque la madre esté estable.",
    },
    tags: ["obstetricia", "movimientos fetales", "alarma prenatal"],
    modeCompatibility: "both",
    initialVitals: { hr: 96, sbp: 118, dbp: 74, spo2: 99, rr: 18, temp: 36.7 },
    initialStatus: "Gestante estable con síntoma fetal prioritario",
    alerts: ["Síntoma fetal", "No banalizar", "Valoración oportuna"],
    stages: [
      {
        id: "stage1",
        title: "Triage obstétrico",
        prompt: "¿Cómo clasificas esta consulta?",
        actions: [
          action("prioritize_fetal_eval", "Dar prioridad y coordinar valoración obstétrica/fetal", 30, "La conducta segura es acelerar la evaluación, no posponerla.", {
            resultingStatus: "Ruta obstétrica priorizada",
          }),
          action("routine_review", "Mantener control de rutina sin cambios", 0, "Ignora un síntoma fetal relevante.", {
            resultingStatus: "Riesgo de demora diagnóstica",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Historia dirigida",
        prompt: "¿Qué dato orienta mejor la gravedad inmediata?",
        actions: [
          action("timeline_associated", "Precisar tiempo de inicio y síntomas asociados maternos", 20, "La línea temporal ayuda a decidir urgencia y continuidad.", {
            resultingStatus: "Historia obstétrica bien enfocada",
          }),
          action("skip_history", "Omitir detalles porque la madre está ansiosa", 0, "Perder la cronología debilita la evaluación.", {
            resultingStatus: "Historia insuficiente",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Continuidad",
        prompt: "¿Qué acción es más segura al terminar la primera valoración?",
        actions: [
          action("safe_referral", "Derivación o control fetal inmediato con indicaciones claras", 20, "El cierre correcto asegura continuidad real.", {
            resultingStatus: "Evaluación fetal en curso",
          }),
          action("send_home_only", "Enviar a casa con indicaciones vagas", 0, "No es adecuado sin valoración fetal o plan claro.", {
            resultingStatus: "Seguimiento inseguro",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Documentación",
        prompt: "¿Qué debe registrarse?",
        actions: [
          action("document_fetal_alarm", "Registrar síntoma, edad gestacional y ruta acordada", 10, "Son los mínimos de continuidad en un caso fetal prioritario.", {
            resultingStatus: "Cierre obstétrico correcto",
          }),
          action("brief_note", "Escribir una nota mínima sin contexto obstétrico", 0, "Falta información crítica para seguimiento.", {
            resultingStatus: "Registro incompleto",
          }),
        ],
      },
    ],
    timeLimitSec: 210,
  },
  {
    id: "mi-postpartum-hemorrhage",
    title: "Hemorragia posparto inmediata",
    category: "labor_puerperium",
    subcategory: "hemorragia_posparto",
    population: "obstetric",
    difficulty: "advanced",
    context: "delivery_room",
    clinicalSummary:
      "Puérpera inmediata con sangrado abundante, útero atónico y signos de hipoperfusión. La secuencia correcta cambia rápido la evolución.",
    patientProfile: {
      name: "Paola V.",
      age: 26,
      sex: "female",
      chiefComplaint: "Sangrado abundante tras parto vaginal",
      setting: "Sala de partos",
      ageLabel: "Puérpera inmediata",
    },
    keyFindings: ["sangrado abundante", "útero atónico", "taquicardia", "hipotensión"],
    expectedOutcome: "Reconocer hemorragia posparto, activar ayuda y reanimar/contener sangrado.",
    correctAnswer: "Tratar como emergencia obstétrica hemorrágica.",
    distractors: ["Observar unos minutos", "Documentar antes de actuar", "Solo cambiar compresas"],
    feedback: {
      explanation: "En puerperio inmediato, el sangrado con inestabilidad no permite pausas diagnósticas largas.",
      expectedConduct: "Activar protocolo hemorrágico, masaje/medidas uterinas, soporte hemodinámico y continuidad obstétrica urgente.",
      populationPearl: "La respuesta temprana frente a atonía uterina salva vida materna en minutos.",
    },
    tags: ["puerperio", "hemorragia", "obstetricia", "shock"],
    modeCompatibility: "both",
    initialVitals: { hr: 134, sbp: 82, dbp: 46, spo2: 95, rr: 28, temp: 36.4 },
    initialStatus: "Emergencia hemorrágica obstétrica",
    alerts: ["Sangrado activo", "Hipoperfusión", "Ayuda inmediata"],
    stages: [
      {
        id: "stage1",
        title: "Detección",
        prompt: "¿Qué define la primera respuesta?",
        actions: [
          action("activate_hemorrhage", "Activar ayuda/protocolo y valorar tono uterino de inmediato", 35, "La identificación y activación precoz cambian el pronóstico.", {
            resultingStatus: "Protocolo hemorrágico activado",
          }),
          action("count_pads", "Esperar para cuantificar mejor el sangrado antes de actuar", 0, "Demora una emergencia evidente.", {
            vitalDelta: { sbp: -10, hr: 10 },
          }),
        ],
      },
      {
        id: "stage2",
        title: "Reanimación",
        prompt: "¿Qué conducta es coherente con la inestabilidad?",
        actions: [
          action("resuscitate_obstetric", "Sostén hemodinámico y medidas dirigidas a controlar la causa uterina", 25, "La emergencia se maneja en paralelo: contención del sangrado y perfusión.", {
            vitalDelta: { sbp: 10, dbp: 6, hr: -8 },
            resultingStatus: "Respuesta parcial a la intervención",
          }),
          action("observe_bleeding", "Solo vigilar la evolución del sangrado", 0, "No actúa sobre la causa ni la perfusión.", {
            vitalDelta: { sbp: -8, hr: 8 },
          }),
        ],
      },
      {
        id: "stage3",
        title: "Escalamiento",
        prompt: "La inestabilidad persiste. ¿Qué debe pasar?",
        actions: [
          action("escalate_ob_team", "Escalar equipo obstétrico y continuidad quirúrgica si hace falta", 20, "La persistencia obliga a escalar sin perder tiempo.", {
            resultingStatus: "Caso obstétrico escalado",
          }),
          action("delay_team", "Esperar respuesta completa antes de llamar más ayuda", 0, "Aumenta el riesgo de colapso.", {
            resultingStatus: "Escalamiento tardío",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Cierre",
        prompt: "¿Qué elemento final es obligatorio?",
        actions: [
          action("handoff_bloodloss", "Handoff con pérdidas, respuesta y medidas ya realizadas", 10, "En hemorragia, la continuidad precisa es crítica.", {
            resultingStatus: "Continuidad segura del caso hemorrágico",
          }),
          action("omit_losses", "Transferir sin detallar pérdidas ni respuesta", 0, "Deja ciego al equipo receptor.", {
            resultingStatus: "Transferencia insegura",
          }),
        ],
      },
    ],
    timeLimitSec: 220,
  },
  {
    id: "mi-puerperal-infection",
    title: "Puerperio con sospecha de infección",
    category: "labor_puerperium",
    subcategory: "infeccion_puerperal",
    population: "obstetric",
    difficulty: "intermediate",
    context: "puerperium_ward",
    clinicalSummary:
      "Puérpera con fiebre, dolor uterino y secreción maloliente. Se requiere reconocer infección puerperal y evitar demoras en escalamiento.",
    patientProfile: {
      name: "Valeria C.",
      age: 32,
      sex: "female",
      chiefComplaint: "Fiebre y dolor abdominal tras parto",
      setting: "Sala de puerperio",
      ageLabel: "Puerperio temprano",
    },
    keyFindings: ["fiebre", "dolor uterino", "loquios fétidos", "riesgo infeccioso"],
    expectedOutcome: "Sospechar infección puerperal y escalar evaluación/tratamiento oportunamente.",
    correctAnswer: "Priorizar valoración infecciosa y vigilancia materna.",
    distractors: ["Normalizar la fiebre", "Esperar 24 h", "Manejo solo analgésico"],
    feedback: {
      explanation: "La fiebre puerperal con dolor y mal olor no debe leerse como hallazgo menor.",
      expectedConduct: "Valoración obstétrica, control de signos, escalamiento y vigilancia de sepsis si se deteriora.",
      populationPearl: "El puerperio también es una etapa crítica: la vigilancia no termina con el parto.",
    },
    tags: ["puerperio", "infeccion", "obstetricia"],
    modeCompatibility: "both",
    initialVitals: { hr: 116, sbp: 104, dbp: 64, spo2: 98, rr: 22, temp: 38.7 },
    initialStatus: "Sospecha de infección puerperal",
    alerts: ["Fiebre puerperal", "Riesgo séptico", "Escalar temprano"],
    stages: [
      {
        id: "stage1",
        title: "Reconocimiento",
        prompt: "¿Qué interpretación inicial es más segura?",
        actions: [
          action("recognize_puerperal_infection", "Reconocer infección puerperal y priorizar valoración", 30, "La fiebre puerperal con hallazgos locales no debe banalizarse.", {
            resultingStatus: "Caso obstétrico-infeccioso priorizado",
          }),
          action("normal_postpartum", "Considerarlo normal del puerperio sin cambios", 0, "Es una interpretación riesgosa.", {
            resultingStatus: "Riesgo de demora terapéutica",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Vigilancia",
        prompt: "¿Qué hace más seguro el seguimiento inicial?",
        actions: [
          action("maternal_monitoring", "Monitorización de signos y reevaluación del foco clínico", 20, "La tendencia clínica orienta si progresa hacia sepsis.", {
            resultingStatus: "Seguimiento clínico estructurado",
          }),
          action("one_time_check", "Un solo control y nada más", 0, "No permite detectar deterioro.", {
            resultingStatus: "Vigilancia insuficiente",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Conducta",
        prompt: "¿Qué sigue después del reconocimiento?",
        actions: [
          action("escalate_management", "Escalar evaluación/tratamiento y comunicar criterios de alarma", 20, "El foco está en no perder progresión materna.", {
            resultingStatus: "Caso puerperal escalado adecuadamente",
          }),
          action("send_home_short", "Indicar solo reposo en casa", 0, "No es conducta segura.", {
            resultingStatus: "Alta insegura",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Registro",
        prompt: "¿Qué documentas para continuidad?",
        actions: [
          action("document_fever_focus", "Fiebre, foco sospechado, signos y plan de seguimiento", 10, "La documentación permite continuidad y trazabilidad clínica.", {
            resultingStatus: "Continuidad puerperal adecuada",
          }),
          action("minimal_note", "Nota breve sin signos ni plan", 0, "Documento insuficiente.", {
            resultingStatus: "Registro pobre",
          }),
        ],
      },
    ],
    timeLimitSec: 205,
  },
  {
    id: "mi-neonatal-resuscitation",
    title: "Reanimación neonatal inicial por apnea",
    category: "neonatal_resuscitation",
    subcategory: "adaptacion_neonatal_deficiente",
    population: "neonatal",
    difficulty: "advanced",
    context: "delivery_room",
    clinicalSummary:
      "Neonato con tono disminuido y apnea al nacer. El escenario exige seguir pasos de reanimación neonatal con decisiones por tiempo.",
    patientProfile: {
      name: "RN Sofía R.",
      age: 0,
      sex: "female",
      chiefComplaint: "Apnea al nacimiento",
      setting: "Sala de partos",
      weightKg: 3.1,
      ageLabel: "1 minuto de vida",
    },
    keyFindings: ["apnea", "tono bajo", "bradicardia neonatal", "tiempo por segundos"],
    expectedOutcome: "Secuencia de reanimación neonatal inicial y reevaluación tras cada paso.",
    correctAnswer: "Ventilar y reevaluar siguiendo pasos estructurados.",
    distractors: ["Esperar llanto espontáneo", "Masajear sin ventilación", "Retrasar reanimación por documentación"],
    feedback: {
      explanation: "El neonato exige una secuencia corta, ordenada y reevaluada por respuesta en segundos.",
      expectedConduct: "Calor, posición, ventilación efectiva y reevaluación de FC/respiración con escalamiento si persiste compromiso.",
      populationPearl: "En reanimación neonatal, la calidad de la ventilación define gran parte de la respuesta inicial.",
    },
    tags: ["neonatal", "reanimacion", "partos"],
    modeCompatibility: "both",
    initialVitals: { hr: 74, sbp: 58, dbp: 34, spo2: 68, rr: 0, temp: 36.0 },
    initialStatus: "Adaptación neonatal comprometida",
    alerts: ["Apnea", "Bradicardia neonatal", "Secuencia por tiempo"],
    stages: [
      {
        id: "stage1",
        title: "Primeros segundos",
        prompt: "¿Qué acción inicia la reanimación neonatal correctamente?",
        actions: [
          action("initial_steps", "Calor, posición, secado y valoración rápida", 30, "Los pasos iniciales preparan una ventilación efectiva.", {
            vitalDelta: { temp: 0.3 },
            resultingStatus: "Preparación neonatal inicial completa",
          }),
          action("wait_cry", "Esperar unos segundos a que llore solo", 0, "La apnea no debe observarse pasivamente.", {
            resultingStatus: "Retraso peligroso",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Ventilación",
        prompt: "El neonato sigue apneico y con FC baja. ¿Qué sigue?",
        actions: [
          action("ppv", "Iniciar ventilación a presión positiva y reevaluar FC", 35, "La ventilación eficaz es la maniobra con mayor impacto en esta fase.", {
            vitalDelta: { hr: 26, spo2: 8, rr: 16 },
            resultingStatus: "Respuesta neonatal inicial a ventilación",
          }),
          action("compressions_first", "Iniciar compresiones antes de ventilar", 0, "No es la secuencia correcta si la ventilación no se ha establecido.", {
            resultingStatus: "Secuencia incorrecta",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Reevaluación",
        prompt: "La FC mejora parcialmente. ¿Qué corresponde ahora?",
        actions: [
          action("reassess_continue", "Reevaluar FC/respiración y ajustar la ventilación", 20, "La lógica neonatal depende de reevaluar la respuesta a cada paso.", {
            vitalDelta: { hr: 18, spo2: 8, rr: 14 },
            resultingStatus: "Neonato con mejor adaptación",
          }),
          action("stop_too_early", "Suspender soporte apenas mejora un poco la FC", 0, "Interrumpir demasiado pronto empeora la transición.", {
            resultingStatus: "Mejoría inestable",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Continuidad",
        prompt: "¿Qué completa el manejo seguro?",
        actions: [
          action("document_handoff_newborn", "Documentar tiempos, respuesta y plan de observación neonatal", 10, "La cronología es esencial en reanimación neonatal.", {
            resultingStatus: "Continuidad neonatal adecuada",
          }),
          action("omit_timing", "No registrar tiempos ni respuesta", 0, "Pierde información crítica para seguimiento.", {
            resultingStatus: "Registro insuficiente",
          }),
        ],
      },
    ],
    timeLimitSec: 180,
  },
  {
    id: "mi-growth-delay",
    title: "Tamizaje con signos de alerta del desarrollo",
    category: "growth_development",
    subcategory: "retraso_del_lenguaje_y_social",
    population: "pediatric",
    difficulty: "basic",
    context: "general",
    clinicalSummary:
      "Niño pequeño con escaso lenguaje, pobre contacto visual y retraso en hitos comunicativos. El caso busca estructurar valoración y derivación.",
    patientProfile: {
      name: "Mateo L.",
      age: 2,
      sex: "male",
      chiefComplaint: "No habla como otros niños de su edad",
      setting: "Control infantil",
      weightKg: 12.4,
      ageLabel: "2 años",
    },
    keyFindings: ["pocas palabras", "contacto visual limitado", "retraso del lenguaje", "necesita derivación"],
    expectedOutcome: "Reconocer señales de alerta y derivar para evaluación más completa.",
    correctAnswer: "No normalizar el retraso cuando hay varios hitos comprometidos.",
    distractors: ["Esperar sin plan", "Asegurar que todo es normal", "Tratar como timidez"],
    feedback: {
      explanation: "El valor formativo está en detectar patrones de alerta, no en cerrar con observación pasiva.",
      expectedConduct: "Completar hitos, orientar a familia y derivar a evaluación del desarrollo cuando corresponde.",
      populationPearl: "En desarrollo infantil, la oportunidad de la derivación cambia pronóstico funcional.",
    },
    tags: ["pediatria", "desarrollo", "tamizaje"],
    modeCompatibility: "both",
    initialVitals: { hr: 108, sbp: 90, dbp: 54, spo2: 99, rr: 24, temp: 36.6 },
    initialStatus: "Tamizaje pediátrico con señales de alerta",
    alerts: ["Retraso del lenguaje", "Señales de alerta", "Derivación oportuna"],
    stages: [
      {
        id: "stage1",
        title: "Lectura inicial",
        prompt: "¿Qué haces frente a estos hitos?",
        actions: [
          action("recognize_delay", "Reconocer señales de alerta y ampliar la valoración", 25, "La suma de hitos alterados exige una lectura activa.", {
            resultingStatus: "Tamizaje ampliado",
          }),
          action("just_wait", "Decir que cada niño lleva su ritmo y no hacer nada", 0, "Minimiza señales acumuladas.", {
            resultingStatus: "Oportunidad perdida",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Historia dirigida",
        prompt: "¿Qué completa mejor la valoración?",
        actions: [
          action("complete_milestones", "Explorar otros hitos, interacción y antecedentes", 20, "El desarrollo se interpreta de forma global, no por un dato aislado.", {
            resultingStatus: "Perfil evolutivo mejor definido",
          }),
          action("single_issue", "Mirar solo si dice palabras o no", 0, "Reduce indebidamente el tamizaje.", {
            resultingStatus: "Valoración incompleta",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Conducta",
        prompt: "¿Qué decisión es la más útil?",
        actions: [
          action("refer_and_counsel", "Orientar a la familia y derivar para evaluación del desarrollo", 20, "La derivación oportuna es parte central del cuidado.", {
            resultingStatus: "Ruta de seguimiento activada",
          }),
          action("recheck_one_year", "Citar dentro de un año sin otra acción", 0, "Excesivamente tardío.", {
            resultingStatus: "Seguimiento tardío",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Registro",
        prompt: "¿Qué debe quedar consignado?",
        actions: [
          action("document_milestones", "Registrar hitos comprometidos, orientación y plan", 10, "La trazabilidad del tamizaje es clave.", {
            resultingStatus: "Seguimiento pediátrico organizado",
          }),
          action("generic_note", "Escribir solo control normal", 0, "Borra hallazgos importantes.", {
            resultingStatus: "Registro incorrecto",
          }),
        ],
      },
    ],
    timeLimitSec: 200,
  },
  {
    id: "mi-ped-dehydration",
    title: "Deshidratación pediátrica con compromiso circulatorio",
    category: "pediatric_emergency",
    subcategory: "gastroenteritis_deshidratacion",
    population: "pediatric",
    difficulty: "intermediate",
    context: "pediatric_emergency",
    clinicalSummary:
      "Niña con diarrea, vómitos, mucosas secas y perfusión enlentecida. El caso busca priorizar rehidratación y vigilancia de gravedad.",
    patientProfile: {
      name: "Emma T.",
      age: 3,
      sex: "female",
      chiefComplaint: "Vómitos, diarrea y decaimiento",
      setting: "Emergencia pediátrica",
      weightKg: 13.2,
      ageLabel: "3 años",
    },
    keyFindings: ["mucosas secas", "llenado capilar lento", "taquicardia", "riesgo de shock"],
    expectedOutcome: "Clasificar gravedad, iniciar rehidratación y reevaluar perfusión.",
    correctAnswer: "Reconocer deshidratación significativa y actuar de forma estructurada.",
    distractors: ["Esperar que tome líquidos sola", "Dar alta rápida", "Ignorar perfusión"],
    feedback: {
      explanation: "En pediatría, el estado de perfusión orienta el grado de urgencia tanto como el antecedente de pérdidas.",
      expectedConduct: "Clasificar deshidratación, iniciar rehidratación adecuada y reevaluar respuesta clínica.",
      populationPearl: "El llenado capilar y el estado general cambian antes que la presión arterial en muchos niños.",
    },
    tags: ["pediatria", "deshidratacion", "shock"],
    modeCompatibility: "both",
    initialVitals: { hr: 154, sbp: 82, dbp: 48, spo2: 98, rr: 30, temp: 37.6 },
    initialStatus: "Deshidratación moderada a severa",
    alerts: ["Perfusión comprometida", "Pérdidas gastrointestinales", "Reevaluación frecuente"],
    stages: [
      {
        id: "stage1",
        title: "Clasificación",
        prompt: "¿Cuál es la primera lectura correcta del caso?",
        actions: [
          action("classify_dehydration", "Clasificar deshidratación y prioridad de rehidratación", 30, "Leer bien la perfusión define la urgencia real.", {
            resultingStatus: "Deshidratación reconocida y priorizada",
          }),
          action("mild_only", "Catalogarla como leve sin más datos", 0, "Subestima signos de compromiso circulatorio.", {
            resultingStatus: "Gravedad subestimada",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Intervención",
        prompt: "¿Qué sigue después de la clasificación?",
        actions: [
          action("rehydrate_monitor", "Iniciar rehidratación adecuada y monitorizar respuesta", 25, "El niño necesita intervención y reevaluación por respuesta.", {
            vitalDelta: { hr: -16, sbp: 8, dbp: 4 },
            resultingStatus: "Respuesta inicial a rehidratación",
          }),
          action("watch_only_ped", "Observar sin iniciar rehidratación", 0, "Expone al niño a progresión del shock.", {
            vitalDelta: { sbp: -8, hr: 10 },
            resultingStatus: "Perfusión empeora",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Seguimiento",
        prompt: "¿Qué dato de seguimiento es indispensable?",
        actions: [
          action("reassess_perfusion", "Reevaluar perfusión, diuresis y tolerancia clínica", 15, "La respuesta clínica manda el siguiente paso.", {
            resultingStatus: "Niña en evolución favorable",
          }),
          action("no_reassessment_ped", "No reevaluar porque recibió líquidos", 0, "No sabes si la intervención fue suficiente.", {
            resultingStatus: "Seguimiento insuficiente",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Alta o continuidad",
        prompt: "¿Qué hace seguro el cierre?",
        actions: [
          action("safe_disposition_ped", "Definir observación/alta según respuesta y educar signos de alarma", 10, "El cierre pediátrico debe ligar respuesta y educación.", {
            resultingStatus: "Cierre pediátrico seguro",
          }),
          action("discharge_without_education", "Dar alta sin explicar signos de alarma", 0, "Disposición insegura.", {
            resultingStatus: "Alta insegura",
          }),
        ],
      },
    ],
    timeLimitSec: 210,
  },
  {
    id: "mi-ped-respiratory-distress",
    title: "Dificultad respiratoria pediátrica",
    category: "pediatric_emergency",
    subcategory: "broncoobstruccion",
    population: "pediatric",
    difficulty: "advanced",
    context: "pediatric_emergency",
    clinicalSummary:
      "Niño con tiraje, sibilancias y saturación en descenso. El caso obliga a estratificar gravedad y escalar apoyo respiratorio.",
    patientProfile: {
      name: "Lucas M.",
      age: 4,
      sex: "male",
      chiefComplaint: "Respira rápido y se hunden las costillas",
      setting: "Sala respiratoria pediátrica",
      weightKg: 16.8,
      ageLabel: "4 años",
    },
    keyFindings: ["tiraje", "sibilancias", "hipoxemia", "fatiga respiratoria"],
    expectedOutcome: "Soporte respiratorio, tratamiento broncoobstructivo y reevaluación estrecha.",
    correctAnswer: "No minimizar el trabajo respiratorio aunque el niño siga despierto.",
    distractors: ["Esperar en sala", "Tratar como resfrío simple", "Dar alta precoz"],
    feedback: {
      explanation: "El esfuerzo respiratorio visible y la tendencia de la saturación son claves en urgencias pediátricas.",
      expectedConduct: "Oxígeno, intervención dirigida, clasificación de gravedad y reevaluación de respuesta.",
      populationPearl: "En niños, el agotamiento puede llegar rápido tras una fase de gran esfuerzo respiratorio.",
    },
    tags: ["pediatria", "respiratorio", "urgencias"],
    modeCompatibility: "both",
    initialVitals: { hr: 148, sbp: 92, dbp: 56, spo2: 87, rr: 38, temp: 37.1 },
    initialStatus: "Distrés respiratorio pediátrico",
    alerts: ["Hipoxemia", "Trabajo respiratorio alto", "Riesgo de agotamiento"],
    stages: [
      {
        id: "stage1",
        title: "Lectura inicial",
        prompt: "¿Cómo priorizas este cuadro?",
        actions: [
          action("recognize_respiratory_gravity", "Clasificar como dificultad respiratoria significativa y actuar", 30, "La gravedad debe leerse por trabajo respiratorio y saturación.", {
            resultingStatus: "Caso respiratorio priorizado",
          }),
          action("mild_cold", "Considerarlo cuadro leve de vía aérea superior", 0, "Subestima hallazgos de esfuerzo e hipoxemia.", {
            resultingStatus: "Gravedad subestimada",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Apoyo inicial",
        prompt: "¿Qué haces ahora?",
        actions: [
          action("support_respiratory_ped", "Iniciar soporte respiratorio y tratamiento dirigido", 25, "La respuesta temprana evita progresión a agotamiento.", {
            vitalDelta: { spo2: 6, rr: -4, hr: -8 },
            resultingStatus: "Mejoría parcial tras intervención",
          }),
          action("delay_support_ped", "Esperar a que el niño se calme antes de intervenir", 0, "Puede deteriorarse mientras esperas.", {
            vitalDelta: { spo2: -5, rr: 4 },
            resultingStatus: "Deterioro respiratorio",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Reevaluación",
        prompt: "¿Qué define el siguiente paso?",
        actions: [
          action("trend_work_breathing", "Reevaluar saturación, tiraje y respuesta clínica", 15, "La tendencia del trabajo respiratorio guía el escalamiento.", {
            resultingStatus: "Respuesta respiratoria objetivada",
          }),
          action("single_spo2_only", "Mirar solo una saturación aislada", 0, "Reduce excesivamente la evaluación.", {
            resultingStatus: "Reevaluación incompleta",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Disposición",
        prompt: "¿Qué hace seguro el cierre?",
        actions: [
          action("safe_disposition_resp", "Definir observación/ingreso según respuesta y signos residuales", 10, "La disposición depende de la respuesta sostenida, no de una mejoría mínima.", {
            resultingStatus: "Disposición respiratoria segura",
          }),
          action("quick_discharge_resp", "Alta tras leve mejoría sin reevaluación final", 0, "Cierre inseguro.", {
            resultingStatus: "Alta precoz",
          }),
        ],
      },
    ],
    timeLimitSec: 210,
  },
  {
    id: "mi-febrile-seizure",
    title: "Convulsión febril pediátrica",
    category: "pediatric_emergency",
    subcategory: "convulsion_febril",
    population: "pediatric",
    difficulty: "intermediate",
    context: "pediatric_emergency",
    clinicalSummary:
      "Niño con episodio convulsivo asociado a fiebre. El caso exige prioridad ABC, seguridad y lectura del contexto neurológico.",
    patientProfile: {
      name: "Sofía N.",
      age: 2,
      sex: "female",
      chiefComplaint: "Convulsionó en casa con fiebre",
      setting: "Urgencias pediátricas",
      weightKg: 11.6,
      ageLabel: "2 años",
    },
    keyFindings: ["convulsión", "fiebre", "riesgo de vía aérea", "necesita observación"],
    expectedOutcome: "Priorizar seguridad, valorar evolución posictal y definir conducta según contexto.",
    correctAnswer: "ABC primero, luego análisis del episodio y vigilancia.",
    distractors: ["Forzar vía oral", "Ignorar el estado posictal", "Alta inmediata sin observación"],
    feedback: {
      explanation: "La seguridad y la observación clínica posterior son tan importantes como el manejo del episodio inicial.",
      expectedConduct: "Asegurar ABC, caracterizar el evento, controlar fiebre/contexto y decidir observación o escalamiento.",
      populationPearl: "Tras la convulsión, la reevaluación neurológica y el contexto del episodio cambian la conducta.",
    },
    tags: ["pediatria", "convulsion", "fiebre"],
    modeCompatibility: "both",
    initialVitals: { hr: 146, sbp: 88, dbp: 52, spo2: 93, rr: 28, temp: 39.1 },
    initialStatus: "Posictal pediátrico febril",
    alerts: ["ABC", "Posictal", "Observación neurológica"],
    stages: [
      {
        id: "stage1",
        title: "Inicio",
        prompt: "¿Qué priorizas al recibir al niño?",
        actions: [
          action("abc_safety", "Seguridad, vía aérea, posición y valoración primaria", 30, "La primera prioridad es proteger al niño y valorar compromiso vital.", {
            resultingStatus: "Seguridad inicial establecida",
          }),
          action("oral_meds", "Administrar cosas por boca mientras despierta", 0, "No es seguro en posictal inmediato.", {
            resultingStatus: "Riesgo de aspiración",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Historia breve",
        prompt: "¿Qué completa la primera evaluación?",
        actions: [
          action("characterize_event", "Precisar duración, contexto febril y recuperación", 20, "La caracterización define el siguiente nivel de alarma.", {
            resultingStatus: "Evento neurológico mejor definido",
          }),
          action("ignore_details", "No preguntar por el episodio y enfocarte solo en la fiebre", 0, "Perder detalles reduce la calidad de la decisión.", {
            resultingStatus: "Historia insuficiente",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Seguimiento",
        prompt: "¿Qué conducta es más segura después del evento inicial?",
        actions: [
          action("observe_reassess", "Observar, reevaluar neurológicamente y tratar contexto febril", 20, "La observación posictal es parte del cuidado correcto.", {
            resultingStatus: "Seguimiento pediátrico seguro",
          }),
          action("instant_discharge", "Dar alta inmediata porque ya terminó la convulsión", 0, "Conducta incompleta e insegura.", {
            resultingStatus: "Alta riesgosa",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Cierre",
        prompt: "¿Qué no debe faltar antes de finalizar?",
        actions: [
          action("educate_family", "Registrar episodio y educar claramente signos de nueva alarma", 10, "La educación a la familia es parte del cierre seguro.", {
            resultingStatus: "Cierre pediátrico completo",
          }),
          action("no_family_guidance", "No explicar nada a la familia", 0, "Pierde un componente crítico del alta segura.", {
            resultingStatus: "Alta incompleta",
          }),
        ],
      },
    ],
    timeLimitSec: 205,
  },
];

function buildMaternoInfantPatient(
  scenario: MaternoInfantScenario,
  variantIndex: number
): AdvancedPatientProfile {
  if (scenario.population === "obstetric") {
    return {
      ...scenario.patientProfile,
      name: `${pickDeterministic(OBSTETRIC_NAMES, variantIndex)} ${pickDeterministic(LAST_NAMES, variantIndex + 2)}`,
      age: boundedNumber(scenario.patientProfile.age, variantIndex, [-6, -4, -2, 0, 2, 4, 6], 18, 42),
      gestationalAgeWeeks: scenario.patientProfile.gestationalAgeWeeks
        ? boundedNumber(scenario.patientProfile.gestationalAgeWeeks, variantIndex + 1, [-2, -1, 0, 0, 1, 2], 24, 40)
        : undefined,
      ageLabel: scenario.patientProfile.gestationalAgeWeeks
        ? `${boundedNumber(scenario.patientProfile.gestationalAgeWeeks, variantIndex + 1, [-2, -1, 0, 0, 1, 2], 24, 40)} semanas de gestación`
        : scenario.patientProfile.ageLabel,
      setting: pickDeterministic([scenario.patientProfile.setting ?? "Área obstétrica", ...SETTINGS], variantIndex),
    };
  }

  if (scenario.population === "neonatal") {
    const weight = scenario.patientProfile.weightKg
      ? boundedNumber(scenario.patientProfile.weightKg, variantIndex, [-0.4, -0.2, -0.1, 0, 0.1, 0.2, 0.4], 1.9, 4.8, 1)
      : undefined;
    return {
      ...scenario.patientProfile,
      name: `RN ${pickDeterministic(PED_NAMES, variantIndex)} ${pickDeterministic(LAST_NAMES, variantIndex + 1)}`,
      age: 0,
      weightKg: weight,
      ageLabel: pickDeterministic(NEONATAL_AGE_LABELS, variantIndex),
      setting: pickDeterministic([scenario.patientProfile.setting ?? "Área neonatal", ...SETTINGS], variantIndex + 2),
    };
  }

  const pediatricAge = boundedNumber(scenario.patientProfile.age, variantIndex, [-1, 0, 0, 1, 2], 1, 12);
  const pediatricWeight = scenario.patientProfile.weightKg
    ? boundedNumber(scenario.patientProfile.weightKg, variantIndex + 1, [-2.2, -1.4, -0.8, 0, 0.8, 1.5, 2.2], 7, 42, 1)
    : undefined;

  return {
    ...scenario.patientProfile,
    name: `${pickDeterministic(PED_NAMES, variantIndex)} ${pickDeterministic(LAST_NAMES, variantIndex + 3)}`,
    age: pediatricAge,
    weightKg: pediatricWeight,
    ageLabel: pickDeterministic(PEDIATRIC_AGE_LABELS, variantIndex + pediatricAge),
    setting: pickDeterministic([scenario.patientProfile.setting ?? "Área pediátrica", ...SETTINGS], variantIndex + 4),
  };
}

function createMaternoInfantVariant(baseScenario: MaternoInfantScenario, variantIndex: number): MaternoInfantScenario {
  return {
    ...baseScenario,
    id: buildVariantId(baseScenario.id, variantIndex),
    title: buildVariantName(baseScenario.title, variantIndex),
    clinicalSummary: buildVariantSentence(baseScenario.clinicalSummary, variantIndex),
    patientProfile: buildMaternoInfantPatient(baseScenario, variantIndex),
    initialVitals: {
      hr: boundedNumber(baseScenario.initialVitals.hr, variantIndex, [-12, -8, -4, 0, 4, 8, 12], 50, 190),
      sbp: boundedNumber(baseScenario.initialVitals.sbp, variantIndex + 1, [-10, -6, -4, 0, 4, 8], 50, 180),
      dbp: boundedNumber(baseScenario.initialVitals.dbp, variantIndex + 2, [-8, -5, -3, 0, 3, 5], 30, 110),
      spo2: boundedNumber(baseScenario.initialVitals.spo2, variantIndex + 3, [-4, -2, -1, 0, 1, 2, 4], 65, 100),
      rr: boundedNumber(baseScenario.initialVitals.rr, variantIndex + 4, [-6, -4, -2, 0, 2, 4, 6], 0, 60),
      temp: boundedNumber(baseScenario.initialVitals.temp, variantIndex + 5, [-0.4, -0.2, 0, 0.1, 0.3, 0.4], 35, 40, 1),
    },
    feedback: {
      ...baseScenario.feedback,
      explanation: buildVariantSentence(baseScenario.feedback.explanation, variantIndex),
    },
    alerts: Array.from(new Set([...baseScenario.alerts, pickDeterministic(["Población específica", "Requiere continuidad", "Valoración por etapas"], variantIndex)])),
    tags: Array.from(new Set([...baseScenario.tags, `variant_${String((variantIndex % 12) + 1).padStart(2, "0")}`])),
  };
}

export const MATERNO_INFANT_LIBRARY: MaternoInfantScenario[] = expandCaseLibrary(
  BASE_MATERNO_INFANT_SCENARIOS,
  ADVANCED_MODULE_LIBRARY_SIZE,
  createMaternoInfantVariant
);

export function maternoInfantDifficultyLabel(value: AdvancedDifficulty) {
  return advancedDifficultyLabel(value);
}

export function maternoInfantCategoryLabel(value: MaternoInfantCategory) {
  if (value === "prenatal_alerts") return "Control prenatal y alarmas";
  if (value === "labor_puerperium") return "Parto y puerperio";
  if (value === "neonatal_resuscitation") return "Reanimación neonatal";
  if (value === "growth_development") return "Crecimiento y desarrollo";
  return "Urgencias pediátricas";
}

export function maternoInfantPopulationLabel(value: MaternoInfantPopulation) {
  if (value === "obstetric") return "Obstétrico";
  if (value === "neonatal") return "Neonatal";
  return "Pediátrico";
}

export function maternoInfantContextLabel(value: MaternoInfantContext) {
  if (value === "prenatal_clinic") return "Control prenatal";
  if (value === "delivery_room") return "Sala de partos";
  if (value === "puerperium_ward") return "Sala de puerperio";
  if (value === "neonatal_unit") return "Unidad neonatal";
  if (value === "pediatric_emergency") return "Urgencias pediátricas";
  return "General";
}

export function inferMaternoInfantPopulation(caseObject: any): MaternoInfantPopulation {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.brief_context,
      caseObject?.chief_complaint,
      caseObject?.patient_profile?.context,
    ].join(" ")
  );

  if (text.includes("gest") || text.includes("embar") || text.includes("parto") || text.includes("puerper")) return "obstetric";
  if (text.includes("neonato") || text.includes("recien nacido") || text.includes("rn ")) return "neonatal";
  return "pediatric";
}

export function inferMaternoInfantContext(population: MaternoInfantPopulation) {
  if (population === "obstetric") return "prenatal_clinic" satisfies MaternoInfantContext;
  if (population === "neonatal") return "delivery_room" satisfies MaternoInfantContext;
  return "pediatric_emergency" satisfies MaternoInfantContext;
}

export function applyMaternoInfantVitals(current: AdvancedVitals, delta?: Partial<AdvancedVitals>) {
  return applyAdvancedVitals(current, delta);
}

export function evaluateMaternoInfantScenario(args: {
  scenario: MaternoInfantScenario;
  selectedActionIds: string[];
  timedOut?: boolean;
}) {
  const { scenario, selectedActionIds, timedOut = false } = args;

  return evaluateStepwiseScenario({
    stages: scenario.stages,
    selectedActionIds,
    timedOut,
    timeoutPenalty: 10,
    excellentSummary: "Secuencia bien adaptada a la población materno-infantil, con continuidad y enfoque seguro.",
    goodSummary: "Buena lectura clínica general, aunque aún puedes depurar tiempos y cierres específicos de la población.",
    partialSummary: "Hubo aciertos parciales, pero faltó adaptar mejor la conducta a la etapa materna, neonatal o pediátrica.",
    unsafeSummary: "La secuencia dejó vacíos críticos para una población sensible y dependiente de contexto específico.",
  });
}
