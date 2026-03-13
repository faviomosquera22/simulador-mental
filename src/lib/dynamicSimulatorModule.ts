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
  normalizeText,
  type AdvancedDifficulty,
  type AdvancedPatientProfile,
  type AdvancedVitals,
  type ModeCompatibility,
  type StepwiseAction,
  type StepwiseStage,
} from "./advancedModuleUtils";

export type DynamicSimulationCategory =
  | "cardiovascular"
  | "respiratory"
  | "infectious"
  | "metabolic"
  | "neurologic"
  | "trauma"
  | "toxicologic";

export type DynamicSimulationContext =
  | "emergency"
  | "icu"
  | "ward"
  | "prehospital"
  | "general";

export type DynamicStudyModule = "ecg" | "laboratory" | "gasometry";

export type DynamicStudyCard = {
  id: string;
  module: DynamicStudyModule;
  relatedCaseId?: string;
  title: string;
  summary: string;
  rows: Array<{ label: string; value: string }>;
};

export type DynamicSimulationScenario = {
  id: string;
  title: string;
  category: DynamicSimulationCategory;
  subcategory: string;
  difficulty: AdvancedDifficulty;
  context: DynamicSimulationContext;
  clinicalSummary: string;
  patientProfile: AdvancedPatientProfile;
  keyFindings: string[];
  expectedOutcome: string;
  correctAnswer: string;
  distractors: string[];
  feedback: {
    explanation: string;
    expectedConduct: string;
    dynamicPearl: string;
  };
  tags: string[];
  modeCompatibility: ModeCompatibility;
  initialVitals: AdvancedVitals;
  initialStatus: string;
  initialRhythm?: string;
  alerts: string[];
  availableStudies: DynamicStudyCard[];
  stages: StepwiseStage[];
  successCriteria: string[];
  failureCriteria: string[];
  timeLimitSec: number;
  progressionLabel: string;
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

const BASE_DYNAMIC_SCENARIOS: DynamicSimulationScenario[] = [
  {
    id: "dynamic-stemi-shock",
    title: "Síndrome coronario agudo con perfusión limítrofe",
    category: "cardiovascular",
    subcategory: "iamcest_con_inestabilidad",
    difficulty: "advanced",
    context: "emergency",
    clinicalSummary:
      "Paciente con dolor torácico opresivo, diaforesis y presión arterial descendente. El cuadro evoluciona si no se activa reperfusión y soporte hemodinámico.",
    patientProfile: {
      name: "Héctor M.",
      age: 63,
      sex: "male",
      chiefComplaint: "Dolor torácico opresivo y sudoración fría",
      setting: "Sala de shock",
    },
    keyFindings: ["dolor torácico de 45 minutos", "diaforesis", "hipotensión relativa", "alto riesgo isquémico"],
    expectedOutcome: "Solicitar ECG precoz, activar reperfusión y sostener monitorización/hemodinamia.",
    correctAnswer: "Reconocer IAMCEST tiempo dependiente e intervenir sin demoras.",
    distractors: ["Tratar como dolor inespecífico", "Esperar marcadores antes de actuar", "Trasladar sin monitorización"],
    feedback: {
      explanation:
        "El valor del simulador dinámico está en no retrasar estudios y soporte cuando la evolución es tiempo dependiente.",
      expectedConduct:
        "Monitorizar, obtener ECG inmediato, activar red de reperfusión y sostener al paciente durante el traslado.",
      dynamicPearl:
        "Un caso dinámico premia la secuencia: estudio crítico, decisión crítica, soporte continuo.",
    },
    tags: ["cardiovascular", "stemi", "ecg", "shock"],
    modeCompatibility: "both",
    initialVitals: { hr: 114, sbp: 92, dbp: 58, spo2: 93, rr: 24, temp: 36.7 },
    initialStatus: "Dolor torácico de alto riesgo con perfusión inestable",
    initialRhythm: "Taquicardia sinusal con probable lesión isquémica",
    alerts: ["Tiempo dependiente", "Perfusión limítrofe", "Monitorización continua"],
    availableStudies: [
      {
        id: "study-ecg-stemi",
        module: "ecg",
        relatedCaseId: "stemi_anterior",
        title: "ECG 12 derivaciones",
        summary: "Elevación del ST en cara anterior con compromiso extenso.",
        rows: [
          { label: "Hallazgo", value: "ST elevado en V1-V4" },
          { label: "Interpretación", value: "IAM con elevación del ST anterior" },
          { label: "Derivaciones extra", value: "No prioritarias de entrada" },
        ],
      },
      {
        id: "study-gas-acs",
        module: "gasometry",
        relatedCaseId: "sepsis_lactic_acidosis",
        title: "Gasometría de perfusión",
        summary: "Lactato discretamente elevado por hipoperfusión.",
        rows: [
          { label: "pH", value: "7.34" },
          { label: "PaCO2", value: "33 mmHg" },
          { label: "HCO3", value: "18 mEq/L" },
          { label: "Lactato", value: "3.2 mmol/L" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Minuto 0-2",
        prompt: "¿Qué estudio y medida inicial cambian primero la trayectoria del caso?",
        actions: [
          action("monitor_ecg", "Monitorizar al paciente y solicitar ECG 12 derivaciones inmediato", 35, "La monitorización más ECG temprano define el escenario y evita retrasos críticos.", {
            revealsStudyIds: ["study-ecg-stemi"],
            resultingStatus: "ECG en curso, caso estratificado como tiempo dependiente",
          }),
          action("analgesia_wait", "Tratar solo el dolor y reevaluar en 20 minutos", 0, "Retrasa una decisión que depende del tiempo.", {
            vitalDelta: { sbp: -10, spo2: -2, hr: 8 },
            resultingStatus: "Persistencia del dolor y peor perfusión",
          }),
          action("labs_only", "Pedir laboratorio antes del ECG", 5, "Los análisis ayudan, pero no reemplazan el ECG inmediato.", {
            vitalDelta: { sbp: -6, hr: 4 },
          }),
        ],
      },
      {
        id: "stage2",
        title: "Minuto 3-5",
        prompt: "El ECG confirma IAMCEST anterior. ¿Qué haces ahora?",
        actions: [
          action("activate_reperfusion", "Activar reperfusión, acceso venoso y protocolo de SCA", 35, "La conducta correcta integra decisión definitiva y soporte para traslado.", {
            vitalDelta: { hr: -6 },
            resultingStatus: "Ruta de reperfusión activada",
          }),
          action("observe_serial", "Mantener observación y repetir ECG luego", 0, "Conducta insegura frente a una lesión coronaria aguda.", {
            vitalDelta: { sbp: -12, spo2: -2, hr: 10 },
            resultingStatus: "Se agrava la inestabilidad hemodinámica",
          }),
          action("gas_only", "Solicitar gasometría y esperar antes de escalar", 8, "La gasometría ayuda, pero no debe retrasar el manejo definitivo.", {
            revealsStudyIds: ["study-gas-acs"],
          }),
        ],
      },
      {
        id: "stage3",
        title: "Minuto 6-10",
        prompt: "La PA sigue baja. ¿Cómo sostienes al paciente mientras se coordina transferencia?",
        actions: [
          action("hemodynamic_support", "Mantener monitorización continua, oxígeno titulado y soporte hemodinámico", 20, "En un caso dinámico, el soporte continuo evita deterioro mientras llega la resolución definitiva.", {
            vitalDelta: { sbp: 6, spo2: 2, rr: -2 },
            resultingStatus: "Perfusión parcialmente sostenida",
          }),
          action("remove_monitor", "Suspender monitorización para agilizar el traslado", 0, "Perder vigilancia en un paciente inestable empeora la seguridad.", {
            vitalDelta: { sbp: -8, spo2: -3 },
            resultingStatus: "Traslado inseguro",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Reevaluación",
        prompt: "¿Qué criterio marca un cierre adecuado del caso?",
        actions: [
          action("close_safe_transfer", "Confirmar traslado monitorizado, comunicación y reevaluación documentada", 10, "Un cierre correcto incluye continuidad segura del paciente.", {
            resultingStatus: "Caso encaminado con continuidad segura",
          }),
          action("close_without_handOff", "Cerrar el caso sin handoff clínico estructurado", 0, "El cierre sin continuidad deja al paciente expuesto.", {
            resultingStatus: "Cierre incompleto",
          }),
        ],
      },
    ],
    successCriteria: ["ECG precoz", "reperfusión activada", "soporte hemodinámico", "traslado seguro"],
    failureCriteria: ["demora diagnóstica", "sin monitorización", "retraso de reperfusión"],
    timeLimitSec: 240,
    progressionLabel: "Tiempo real crítico",
  },
  {
    id: "dynamic-asthma-fatigue",
    title: "Crisis asmática con fatiga respiratoria progresiva",
    category: "respiratory",
    subcategory: "asma_grave",
    difficulty: "advanced",
    context: "emergency",
    clinicalSummary:
      "Paciente con sibilancias difusas, uso de músculos accesorios y trabajo respiratorio creciente. La gasometría y la respuesta broncodilatadora modifican el curso.",
    patientProfile: {
      name: "Natalia R.",
      age: 27,
      sex: "female",
      chiefComplaint: "Disnea intensa y opresión torácica",
      setting: "Área respiratoria",
    },
    keyFindings: ["habla entrecortada", "sibilancias", "fatiga respiratoria", "SpO₂ en descenso"],
    expectedOutcome: "Iniciar soporte respiratorio, broncodilatación agresiva, pedir gasometría y escalar si hay fatiga.",
    correctAnswer: "Reconocer crisis grave y tratar antes de que se agote el paciente.",
    distractors: ["Esperar respuesta espontánea", "Pedir solo radiografía", "Dar alta tras una nebulización"],
    feedback: {
      explanation:
        "La evolución dinámica depende de detectar la fatiga respiratoria y no confundir silencio auscultatorio con mejoría.",
      expectedConduct:
        "Oxígeno, broncodilatadores repetidos, corticoide, gasometría y escalamiento ventilatorio si se deteriora.",
      dynamicPearl:
        "En respiratorio, la tendencia de la FR, el esfuerzo y la gasometría valen más que una sola medición aislada.",
    },
    tags: ["respiratorio", "asma", "gasometria", "urgencias"],
    modeCompatibility: "both",
    initialVitals: { hr: 128, sbp: 132, dbp: 78, spo2: 88, rr: 34, temp: 36.8 },
    initialStatus: "Distrés respiratorio con agotamiento inminente",
    initialRhythm: "Taquicardia sinusal",
    alerts: ["Hipoxemia", "Trabajo respiratorio alto", "Riesgo de agotamiento"],
    availableStudies: [
      {
        id: "study-gas-asthma",
        module: "gasometry",
        relatedCaseId: "copd_resp_acidosis",
        title: "Gasometría arterial",
        summary: "Acidemia con retención de CO2 incipiente y oxigenación comprometida.",
        rows: [
          { label: "pH", value: "7.29" },
          { label: "PaCO2", value: "55 mmHg" },
          { label: "HCO3", value: "26 mEq/L" },
          { label: "PaO2", value: "59 mmHg" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Ingreso",
        prompt: "¿Cuál es la primera conducta útil frente a esta disnea grave?",
        actions: [
          action("oxygen_bronchodilator", "Oxígeno, broncodilatadores repetidos y monitorización estrecha", 35, "La intervención temprana cambia la curva de deterioro.", {
            vitalDelta: { spo2: 4, rr: -3 },
            resultingStatus: "Respuesta inicial parcial",
          }),
          action("cxr_only", "Solicitar radiografía antes de iniciar tratamiento", 0, "La imagen puede ser útil, pero no desplaza el soporte inicial.", {
            vitalDelta: { spo2: -3, rr: 2, hr: 6 },
            resultingStatus: "Más trabajo respiratorio",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Seguimiento temprano",
        prompt: "Persiste dificultad respiratoria y voz entrecortada. ¿Qué estudio aporta más ahora?",
        actions: [
          action("order_abg", "Solicitar gasometría para valorar intercambio y agotamiento", 25, "La gasometría ayuda a decidir escalamiento ventilatorio.", {
            revealsStudyIds: ["study-gas-asthma"],
            resultingStatus: "Se objetiva fallo ventilatorio incipiente",
          }),
          action("wait_without_abg", "Observar sin estudios mientras termina la nebulización", 0, "La demora puede ocultar un agotamiento progresivo.", {
            vitalDelta: { spo2: -2, rr: 3 },
          }),
        ],
      },
      {
        id: "stage3",
        title: "Escalamiento",
        prompt: "La gasometría muestra retención de CO2 y el esfuerzo no cede. ¿Qué corresponde?",
        actions: [
          action("escalate_support", "Escalar soporte respiratorio y avisar equipo de vía aérea/UC", 20, "La intervención correcta evita un colapso respiratorio tardío.", {
            vitalDelta: { spo2: 3, rr: -4, hr: -8 },
            resultingStatus: "Paciente aún grave, pero contenido",
          }),
          action("discharge_after_one_round", "Dar alta tras una ronda de broncodilatador", 0, "Es una decisión claramente insegura.", {
            vitalDelta: { spo2: -6, rr: 6 },
            resultingStatus: "Fallo respiratorio inminente",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Cierre operativo",
        prompt: "¿Qué completa mejor el manejo dinámico?",
        actions: [
          action("reassess_document", "Reevaluar tendencia clínica y documentar respuesta por tiempos", 10, "El simulador dinámico exige seguimiento de respuesta, no una sola intervención.", {
            resultingStatus: "Caso respiratorio estabilizado para observación estrecha",
          }),
          action("no_reassessment", "Cerrar sin reevaluación objetiva", 0, "Sin reevaluación, no puedes afirmar mejoría real.", {
            resultingStatus: "Seguimiento insuficiente",
          }),
        ],
      },
    ],
    successCriteria: ["soporte respiratorio", "gasometría oportuna", "escalamiento temprano"],
    failureCriteria: ["demora terapéutica", "subestimar fatiga", "sin reevaluación"],
    timeLimitSec: 220,
    progressionLabel: "Evolución respiratoria acelerada",
  },
  {
    id: "dynamic-septic-shock",
    title: "Shock séptico con hipoperfusión progresiva",
    category: "infectious",
    subcategory: "shock_septico",
    difficulty: "advanced",
    context: "icu",
    clinicalSummary:
      "Paciente con fiebre, hipotensión, taquicardia y alteración del estado mental. El caso integra laboratorio, gasometría y respuesta a fluidos/vasoactivos.",
    patientProfile: {
      name: "Marta C.",
      age: 71,
      sex: "female",
      chiefComplaint: "Fiebre, hipotensión y confusión",
      setting: "Unidad de críticos",
    },
    keyFindings: ["hipotensión", "confusión", "fiebre", "signos de hipoperfusión"],
    expectedOutcome: "Solicitar lactato/laboratorio, iniciar bundle, reanimar y escalar soporte.",
    correctAnswer: "Reconocer sepsis con disfunción orgánica y tratar de forma protocolizada.",
    distractors: ["Esperar cultivos antes de todo", "Observar sin bundle", "Tratar solo la fiebre"],
    feedback: {
      explanation:
        "En el simulador dinámico, la demora en bundle y reevaluación empeora rápido la presión y la perfusión.",
      expectedConduct:
        "Obtener datos de gravedad, iniciar fluidos/antibiótico temprano y escalar soporte vasoactivo según respuesta.",
      dynamicPearl:
        "La sepsis no se resuelve con un solo paso: requiere medir respuesta tras cada intervención.",
    },
    tags: ["sepsis", "laboratorio", "gasometria", "shock"],
    modeCompatibility: "both",
    initialVitals: { hr: 126, sbp: 84, dbp: 46, spo2: 91, rr: 30, temp: 39.0 },
    initialStatus: "Shock distributivo probable con daño orgánico inicial",
    alerts: ["Hipoperfusión", "Lactato esperado alto", "Reanimación por objetivos"],
    availableStudies: [
      {
        id: "study-lab-sepsis",
        module: "laboratory",
        relatedCaseId: "sepsis_bacterial",
        title: "Laboratorio inicial",
        summary: "Perfil inflamatorio compatible con sepsis y compromiso renal.",
        rows: [
          { label: "Leucocitos", value: "18 800 /mm³" },
          { label: "PCR", value: "19 mg/dL" },
          { label: "Creatinina", value: "1.8 mg/dL" },
        ],
      },
      {
        id: "study-gas-sepsis",
        module: "gasometry",
        relatedCaseId: "sepsis_lactic_acidosis",
        title: "Gasometría y lactato",
        summary: "Acidosis metabólica con lactato alto por hipoperfusión.",
        rows: [
          { label: "pH", value: "7.22" },
          { label: "HCO3", value: "16 mEq/L" },
          { label: "Lactato", value: "5.6 mmol/L" },
          { label: "PaCO2", value: "30 mmHg" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Valoración inicial",
        prompt: "¿Qué haces primero para objetivar gravedad y no perder tiempo?",
        actions: [
          action("labs_lactate_bundle", "Solicitar laboratorio/lactato e iniciar bundle de sepsis", 35, "El estudio y la intervención deben arrancar en paralelo.", {
            revealsStudyIds: ["study-lab-sepsis", "study-gas-sepsis"],
            resultingStatus: "Sepsis identificada con daño orgánico",
          }),
          action("antipyretic_only", "Indicar antipirético y reevaluar luego", 0, "No aborda la hipoperfusión ni la infección sistémica.", {
            vitalDelta: { sbp: -10, hr: 6 },
            resultingStatus: "Deterioro hemodinámico progresivo",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Reanimación",
        prompt: "Con lactato elevado e hipotensión, ¿qué conducta mueve el caso a favor del paciente?",
        actions: [
          action("fluids_antibiotics", "Fluidoterapia inicial, antibiótico precoz y monitorización estrecha", 30, "El bundle temprano es la intervención con mayor impacto.", {
            vitalDelta: { sbp: 10, dbp: 5, hr: -6 },
            resultingStatus: "Respuesta parcial a fluidos",
          }),
          action("delay_antibiotics", "Esperar localización definitiva antes de antibiótico", 0, "Aumenta el riesgo de progresión del shock.", {
            vitalDelta: { sbp: -12, spo2: -2, hr: 8 },
            resultingStatus: "Shock séptico más profundo",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Persistencia de hipotensión",
        prompt: "La presión sigue baja tras la primera reanimación. ¿Qué sigue?",
        actions: [
          action("vasopressor_escalation", "Escalar soporte hemodinámico y reevaluar perfusión por objetivos", 20, "En un caso dinámico, el siguiente paso depende de la respuesta real a fluidos.", {
            vitalDelta: { sbp: 8, dbp: 4, hr: -4, spo2: 2 },
            resultingStatus: "Perfusión más estable, vigilancia intensiva",
          }),
          action("stop_after_fluids", "No hacer más porque ya recibió fluidos", 0, "La ausencia de respuesta obliga a escalar.", {
            vitalDelta: { sbp: -8, hr: 6 },
          }),
        ],
      },
      {
        id: "stage4",
        title: "Seguimiento",
        prompt: "¿Qué cierra correctamente la evolución inicial?",
        actions: [
          action("document_trends", "Documentar tendencia de lactato, diuresis y respuesta clínica", 10, "La evolución debe medirse para saber si el caso realmente mejora.", {
            resultingStatus: "Shock controlado en vigilancia intensiva",
          }),
          action("close_without_trends", "Cerrar el caso sin seguimiento de respuesta", 0, "Sin tendencias, el manejo queda incompleto.", {
            resultingStatus: "Seguimiento insuficiente",
          }),
        ],
      },
    ],
    successCriteria: ["bundle temprano", "lactato medido", "respuesta reevaluada", "soporte escalado"],
    failureCriteria: ["demora antibiótica", "no medir gravedad", "no reevaluar respuesta"],
    timeLimitSec: 250,
    progressionLabel: "Deterioro hemodinámico continuo",
  },
  {
    id: "dynamic-dka-hyperkalemia",
    title: "Cetoacidosis diabética con riesgo arrítmico",
    category: "metabolic",
    subcategory: "cetoacidosis_hiperpotasemia",
    difficulty: "advanced",
    context: "emergency",
    clinicalSummary:
      "Paciente joven con poliuria, vómitos, dolor abdominal y respiración profunda. La combinación de laboratorio, gasometría y ECG redefine prioridades.",
    patientProfile: {
      name: "Daniela P.",
      age: 24,
      sex: "female",
      chiefComplaint: "Vómitos, deshidratación y respiración agitada",
      setting: "Emergencia metabólica",
    },
    keyFindings: ["deshidratación", "taquipnea profunda", "hiperglucemia", "potasio elevado"],
    expectedOutcome: "Reconocer DKA, solicitar estudios, reanimar con fluidos y corregir metabolismo de forma monitorizada.",
    correctAnswer: "Priorizar fluidos, insulina y vigilancia de potasio/ECG.",
    distractors: ["Tratar solo la glucosa", "Ignorar el ECG", "Retrasar fluidos"],
    feedback: {
      explanation:
        "La integración real ocurre cuando cruzas gasometría, laboratorio y monitorización eléctrica para decidir el orden terapéutico.",
      expectedConduct:
        "Hidratación, estudio completo, insulina con vigilancia estrecha de potasio y cambios eléctricos.",
      dynamicPearl:
        "En DKA, la mejoría aparente de glucosa no equivale a resolución metabólica completa.",
    },
    tags: ["dka", "gasometria", "laboratorio", "ecg", "potasio"],
    modeCompatibility: "both",
    initialVitals: { hr: 122, sbp: 98, dbp: 62, spo2: 97, rr: 32, temp: 37.1 },
    initialStatus: "Metabólico grave con deshidratación y riesgo arrítmico",
    initialRhythm: "Taquicardia sinusal con cambios por hiperpotasemia",
    alerts: ["Deshidratación", "Acidosis metabólica", "Riesgo eléctrico"],
    availableStudies: [
      {
        id: "study-lab-dka",
        module: "laboratory",
        relatedCaseId: "hyperkalemia_renal",
        title: "Laboratorio metabólico",
        summary: "Hiperglucemia marcada con potasio elevado y deterioro renal funcional.",
        rows: [
          { label: "Glucosa", value: "428 mg/dL" },
          { label: "Potasio", value: "6.3 mEq/L" },
          { label: "Creatinina", value: "1.6 mg/dL" },
        ],
      },
      {
        id: "study-gas-dka",
        module: "gasometry",
        relatedCaseId: "dka_metabolic_acidosis",
        title: "Gasometría arterial",
        summary: "Acidosis metabólica con hiperventilación compensadora.",
        rows: [
          { label: "pH", value: "7.16" },
          { label: "HCO3", value: "10 mEq/L" },
          { label: "PaCO2", value: "23 mmHg" },
          { label: "Lactato", value: "2.4 mmol/L" },
        ],
      },
      {
        id: "study-ecg-k",
        module: "ecg",
        relatedCaseId: "hyperkalemia_tall_t",
        title: "Monitor/ECG",
        summary: "Ondas T picudas con conducción aún conservada.",
        rows: [
          { label: "Ritmo", value: "Sinusal taquicárdico" },
          { label: "Hallazgo", value: "Ondas T picudas difusas" },
          { label: "Riesgo", value: "Progresión a trastorno de conducción" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Ingreso metabólico",
        prompt: "¿Qué paquete de acciones aclara la gravedad desde el inicio?",
        actions: [
          action("labs_gas_ecg", "Solicitar laboratorio, gasometría y ECG mientras se inicia hidratación", 35, "Aquí el valor está en integrar estudios y tratamiento inicial al mismo tiempo.", {
            revealsStudyIds: ["study-lab-dka", "study-gas-dka", "study-ecg-k"],
            vitalDelta: { sbp: 4, hr: -4 },
            resultingStatus: "DKA confirmada con riesgo eléctrico",
          }),
          action("glucose_only", "Corregir solo la glucosa capilar antes de pedir otros estudios", 0, "Reduce el problema a un solo dato e ignora la gravedad real.", {
            vitalDelta: { sbp: -8, hr: 5 },
          }),
        ],
      },
      {
        id: "stage2",
        title: "Orden terapéutico",
        prompt: "Con acidosis, deshidratación y potasio alto, ¿qué secuencia es más segura?",
        actions: [
          action("fluids_then_insulin", "Mantener fluidos, vigilar potasio/ECG e iniciar corrección metabólica de forma segura", 30, "La secuencia correcta evita empeorar la perfusión o descompensar el potasio.", {
            vitalDelta: { sbp: 8, dbp: 4, hr: -6 },
            resultingStatus: "Corrección metabólica en curso",
          }),
          action("insulin_without_monitor", "Administrar insulina sin monitorizar ni pensar en el potasio", 0, "Puede precipitar complicaciones eléctricas y no reconoce prioridades.", {
            vitalDelta: { sbp: -6, hr: 8 },
            resultingStatus: "Evolución inestable",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Seguimiento temprano",
        prompt: "¿Qué cambio de la evolución obliga a continuar el caso y no cerrarlo antes de tiempo?",
        actions: [
          action("trend_monitoring", "Reevaluar anión gap, gasometría, potasio y trazado antes de cerrar", 15, "La resolución de DKA es clínica y bioquímica, no solo glucémica.", {
            vitalDelta: { rr: -3, hr: -4 },
            resultingStatus: "Mejoría parcial con necesidad de vigilancia",
          }),
          action("close_after_glucose", "Cerrar cuando baja la glucosa sin revisar acidosis", 0, "Es un error clásico en el entrenamiento de alto nivel.", {
            resultingStatus: "Cierre prematuro",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Transferencia",
        prompt: "¿Qué garantiza continuidad segura del caso?",
        actions: [
          action("handoff_metabolic", "Transferencia estructurada con metas metabólicas y eléctricas pendientes", 10, "El handoff debe incluir lo que falta por corregir y vigilar.", {
            resultingStatus: "Caso estable para seguimiento intensivo",
          }),
          action("handoff_brief", "Traslado sin detallar potasio ni evolución acidobásica", 0, "Genera continuidad insegura.", {
            resultingStatus: "Información crítica omitida",
          }),
        ],
      },
    ],
    successCriteria: ["estudios integrados", "secuencia terapéutica segura", "seguimiento bioquímico"],
    failureCriteria: ["cerrar por glucosa", "ignorar potasio", "sin ECG"],
    timeLimitSec: 260,
    progressionLabel: "Corrección metabólica por fases",
  },
  {
    id: "dynamic-stroke-af",
    title: "Déficit neurológico focal con deterioro progresivo",
    category: "neurologic",
    subcategory: "stroke_alert",
    difficulty: "intermediate",
    context: "emergency",
    clinicalSummary:
      "Paciente con disartria, desviación facial y debilidad de hemicuerpo. El estado cambia si no se activa valoración prioritaria y se controlan tiempos críticos.",
    patientProfile: {
      name: "Rogelio T.",
      age: 68,
      sex: "male",
      chiefComplaint: "Debilidad súbita de un lado y dificultad para hablar",
      setting: "Área neurológica",
    },
    keyFindings: ["inicio súbito", "déficit focal", "alto valor del tiempo", "posible FA de base"],
    expectedOutcome: "Activar código ictus, descartar hipoglucemia y sostener ABC mientras se transfiere.",
    correctAnswer: "Reconocer déficit focal tiempo dependiente y evitar demoras diagnósticas.",
    distractors: ["Esperar varias horas", "Dar sedación y observar", "Tratar solo la PA"],
    feedback: {
      explanation:
        "La inmersión clínica aquí está en el tiempo neurológico y en no perder causas reversibles inmediatas.",
      expectedConduct:
        "Valoración neurológica rápida, glucosa capilar/laboratorio, monitorización y activación de ruta crítica.",
      dynamicPearl:
        "En neurología crítica, cada minuto perdido afecta elegibilidad y pronóstico.",
    },
    tags: ["neurologia", "stroke", "af", "tiempo_dependiente"],
    modeCompatibility: "both",
    initialVitals: { hr: 118, sbp: 176, dbp: 98, spo2: 95, rr: 20, temp: 36.6 },
    initialStatus: "Déficit neurológico agudo en ventana clínica",
    initialRhythm: "Fibrilación auricular rápida",
    alerts: ["Tiempo neurológico", "Déficit focal", "Riesgo embólico"],
    availableStudies: [
      {
        id: "study-ecg-af",
        module: "ecg",
        relatedCaseId: "atrial_fibrillation",
        title: "Monitor cardíaco",
        summary: "Fibrilación auricular con respuesta ventricular rápida.",
        rows: [
          { label: "Ritmo", value: "Fibrilación auricular" },
          { label: "FC", value: "118 lpm" },
          { label: "Relevancia", value: "Sospecha cardioembólica" },
        ],
      },
      {
        id: "study-lab-glucose",
        module: "laboratory",
        title: "Control metabólico urgente",
        summary: "Glucosa sin hipoglucemia grave, resto inicial no limitante.",
        rows: [
          { label: "Glucosa", value: "112 mg/dL" },
          { label: "Sodio", value: "138 mEq/L" },
          { label: "Potasio", value: "4.1 mEq/L" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Detección",
        prompt: "¿Qué acción cambia más el pronóstico al inicio?",
        actions: [
          action("stroke_alert", "Activar ruta neurológica, ABC y hora de inicio", 35, "El tiempo de inicio y la activación temprana son críticos.", {
            resultingStatus: "Código ictus activado",
          }),
          action("observe_speech", "Observar si mejora el habla sin activar ruta", 0, "La demora inutiliza una ventana que puede cerrarse.", {
            vitalDelta: { sbp: 4, hr: 4 },
          }),
        ],
      },
      {
        id: "stage2",
        title: "Descartar reversibles",
        prompt: "¿Qué estudio inicial no debes omitir mientras sostienes monitorización?",
        actions: [
          action("glucose_ecg", "Glucosa urgente y monitor/ECG para orientar etiología y seguridad", 20, "Descartar hipoglucemia y detectar FA tiene impacto inmediato.", {
            revealsStudyIds: ["study-lab-glucose", "study-ecg-af"],
            resultingStatus: "Reversibles inmediatos descartados",
          }),
          action("no_studies", "No pedir estudios hasta tener valoración completa", 0, "Pierde información crítica en la ventana temprana.", {
            vitalDelta: { hr: 5 },
          }),
        ],
      },
      {
        id: "stage3",
        title: "Sostén clínico",
        prompt: "El paciente continúa con déficit focal. ¿Qué enfoque es correcto?",
        actions: [
          action("maintain_transfer", "Mantener monitorización, cabecera y traslado coordinado", 15, "El sostén clínico mientras se completa la ruta es parte del manejo correcto.", {
            resultingStatus: "Paciente trasladado con seguridad",
          }),
          action("sedate_without_reason", "Sedarlo para disminuir ansiedad antes de decidir", 0, "Añade riesgo y nubla la reevaluación neurológica.", {
            resultingStatus: "Evaluación neurológica interferida",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Cierre",
        prompt: "¿Qué debe quedar claro al finalizar esta fase del caso?",
        actions: [
          action("document_timeline", "Documentar tiempo de inicio, déficit y medidas ya realizadas", 10, "Sin línea temporal precisa, la continuidad del caso pierde valor.", {
            resultingStatus: "Caso neurológico bien transferido",
          }),
          action("omit_timeline", "No documentar la cronología porque ya se habló verbalmente", 0, "Error de continuidad frecuente.", {
            resultingStatus: "Información crítica incompleta",
          }),
        ],
      },
    ],
    successCriteria: ["código ictus", "glucosa y ECG", "línea temporal"],
    failureCriteria: ["demora", "sin reversibles", "sin documentación"],
    timeLimitSec: 230,
    progressionLabel: "Ventana neurológica dependiente del tiempo",
  },
  {
    id: "dynamic-trauma-pneumothorax",
    title: "Trauma torácico con compromiso ventilatorio",
    category: "trauma",
    subcategory: "neumotorax_a_tension_probable",
    difficulty: "advanced",
    context: "prehospital",
    clinicalSummary:
      "Paciente politraumatizado con disnea intensa, hipoxemia y deterioro de perfusión. La evolución mejora solo si la secuencia primaria se ejecuta a tiempo.",
    patientProfile: {
      name: "Carlos S.",
      age: 33,
      sex: "male",
      chiefComplaint: "Disnea intensa tras trauma torácico",
      setting: "Atención prehospitalaria",
    },
    keyFindings: ["trauma torácico", "hipoxemia", "deterioro rápido", "compromiso ventilatorio"],
    expectedOutcome: "Priorizar ABC, sospechar neumotórax a tensión y resolver antes del traslado.",
    correctAnswer: "Tratar un problema vital reversible en el examen primario.",
    distractors: ["Esperar radiografía", "Trasladar sin intervenir", "Tratar solo el dolor"],
    feedback: {
      explanation:
        "El realismo aquí está en tratar primero la amenaza letal antes de perseguir estudios demorados.",
      expectedConduct:
        "ABCDE, oxígeno, descompresión si se confirma sospecha clínica y traslado monitorizado.",
      dynamicPearl:
        "En trauma, la imagen puede esperar si la amenaza vital ya está frente a ti.",
    },
    tags: ["trauma", "respiratorio", "abcde", "prehospital"],
    modeCompatibility: "both",
    initialVitals: { hr: 138, sbp: 86, dbp: 48, spo2: 82, rr: 36, temp: 36.2 },
    initialStatus: "Compromiso ventilatorio traumático",
    alerts: ["Hipoxemia severa", "Trauma mayor", "Prioridad ABCDE"],
    availableStudies: [
      {
        id: "study-gas-trauma",
        module: "gasometry",
        title: "Gasometría de control",
        summary: "Hipoxemia con ventilación comprometida.",
        rows: [
          { label: "pH", value: "7.31" },
          { label: "PaO2", value: "48 mmHg" },
          { label: "PaCO2", value: "51 mmHg" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Examen primario",
        prompt: "¿Qué prioridad es correcta ante esta combinación de trauma e hipoxemia?",
        actions: [
          action("abcde_oxygen", "Iniciar ABCDE, oxígeno y reevaluación respiratoria inmediata", 30, "El examen primario ordena y evita perder la amenaza vital.", {
            vitalDelta: { spo2: 4 },
            resultingStatus: "Amenaza ventilatoria confirmada",
          }),
          action("await_imaging", "Esperar imagen antes de intervenir el tórax", 0, "La demora puede llevar al colapso hemodinámico.", {
            vitalDelta: { spo2: -6, sbp: -8, hr: 8 },
          }),
        ],
      },
      {
        id: "stage2",
        title: "Hallazgo crítico",
        prompt: "La sospecha clínica de neumotórax a tensión es alta. ¿Qué haces?",
        actions: [
          action("decompress", "Realizar descompresión y continuar monitorización", 35, "Resolver la causa reversible cambia de inmediato el curso del caso.", {
            vitalDelta: { spo2: 8, sbp: 10, rr: -6, hr: -10 },
            resultingStatus: "Mejoría tras intervención torácica",
          }),
          action("transfer_without_fix", "Trasladar sin intervenir para ahorrar tiempo", 0, "Traslado sin resolver la amenaza vital es inseguro.", {
            vitalDelta: { spo2: -8, sbp: -10, hr: 10 },
            resultingStatus: "Colapso en traslado",
          }),
        ],
      },
      {
        id: "stage3",
        title: "Seguimiento",
        prompt: "Después de intervenir, ¿qué apoyo adicional tiene más sentido?",
        actions: [
          action("monitor_reassess", "Reevaluar ventilación, perfusión y documentar respuesta", 15, "En trauma dinámico, cada intervención requiere nueva lectura ABCDE.", {
            revealsStudyIds: ["study-gas-trauma"],
            resultingStatus: "Estabilización parcial para traslado",
          }),
          action("stop_reassessment", "No reevaluar porque ya mejoró la saturación", 0, "La mejoría aislada no basta en trauma mayor.", {
            vitalDelta: { spo2: -3 },
          }),
        ],
      },
      {
        id: "stage4",
        title: "Traslado",
        prompt: "¿Qué completa el manejo inicial?",
        actions: [
          action("safe_handoff", "Traslado con handoff traumático estructurado y monitorización continua", 10, "El cierre operativo asegura continuidad del caso.", {
            resultingStatus: "Traslado seguro a centro definitivo",
          }),
          action("minimal_handoff", "Entregar solo una frase breve al recibir", 0, "En trauma complejo, omitir detalles es un error mayor.", {
            resultingStatus: "Continuidad deficiente",
          }),
        ],
      },
    ],
    successCriteria: ["ABCDE", "descompresión", "reevaluación", "traslado seguro"],
    failureCriteria: ["esperar imagen", "sin intervención", "sin reevaluación"],
    timeLimitSec: 210,
    progressionLabel: "Deterioro ventilatorio y hemodinámico rápido",
  },
  {
    id: "dynamic-pulmonary-edema-af",
    title: "Edema agudo pulmonar con sobrecarga hemodinámica",
    category: "cardiovascular",
    subcategory: "edema_pulmonar_agudo",
    difficulty: "intermediate",
    context: "ward",
    clinicalSummary:
      "Paciente con ortopnea, crepitantes difusos y trabajo respiratorio. El escenario obliga a coordinar monitorización, ECG y soporte respiratorio.",
    patientProfile: {
      name: "Elena V.",
      age: 74,
      sex: "female",
      chiefComplaint: "Disnea intensa y ortopnea",
      setting: "Hospitalización monitorizada",
    },
    keyFindings: ["crepitantes bilaterales", "hipoxemia", "sobrecarga hídrica", "posible FA"],
    expectedOutcome: "Reconocer edema pulmonar, apoyar ventilación y escalar manejo hemodinámico.",
    correctAnswer: "Actuar sobre la congestión y el intercambio gaseoso mientras monitorizas el ritmo.",
    distractors: ["Hidratación libre", "Reposo sin soporte", "Esperar solo laboratorio"],
    feedback: {
      explanation:
        "Este caso combina fisiología respiratoria y cardiovascular; si tratas solo un eje, el paciente sigue empeorando.",
      expectedConduct:
        "Oxígeno o VNI según tolerancia, monitorización, ECG y tratamiento orientado a congestión.",
      dynamicPearl:
        "La tendencia de la saturación y el esfuerzo respiratorio te dice si el soporte elegido es suficiente.",
    },
    tags: ["edema pulmonar", "ecg", "cardiovascular", "gasometria"],
    modeCompatibility: "both",
    initialVitals: { hr: 132, sbp: 168, dbp: 94, spo2: 84, rr: 32, temp: 36.5 },
    initialStatus: "Insuficiencia cardiopulmonar aguda",
    initialRhythm: "Fibrilación auricular rápida",
    alerts: ["Hipoxemia", "Sobrecarga", "Monitorización continua"],
    availableStudies: [
      {
        id: "study-ecg-edema",
        module: "ecg",
        relatedCaseId: "atrial_fibrillation",
        title: "ECG / monitor",
        summary: "Fibrilación auricular con respuesta ventricular rápida y signos inespecíficos de sobrecarga.",
        rows: [
          { label: "Ritmo", value: "FA" },
          { label: "FC", value: "132 lpm" },
          { label: "Comentario", value: "Puede agravar la congestión" },
        ],
      },
      {
        id: "study-gas-edema",
        module: "gasometry",
        title: "Gasometría de soporte respiratorio",
        summary: "Hipoxemia significativa con alcalosis respiratoria inicial.",
        rows: [
          { label: "pH", value: "7.47" },
          { label: "PaCO2", value: "31 mmHg" },
          { label: "PaO2", value: "54 mmHg" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Inicio",
        prompt: "¿Qué intervención tiene más impacto inmediato?",
        actions: [
          action("resp_support_monitor", "Iniciar soporte respiratorio y monitorización hemodinámica", 30, "La oxigenación y la vigilancia cambian primero la trayectoria.", {
            vitalDelta: { spo2: 8, rr: -4 },
            resultingStatus: "Se gana margen respiratorio",
          }),
          action("free_fluids", "Pasar fluidos rápidos por la disnea", 0, "Empeora la congestión y la hipoxemia.", {
            vitalDelta: { spo2: -5, rr: 4, hr: 8 },
            resultingStatus: "Congestión agravada",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Monitorización",
        prompt: "¿Qué estudio te ayuda a entender mejor el componente arrítmico y respiratorio?",
        actions: [
          action("ecg_gas", "Solicitar ECG y gasometría para ajustar tratamiento", 20, "Integra ritmo y ventilación para orientar la siguiente decisión.", {
            revealsStudyIds: ["study-ecg-edema", "study-gas-edema"],
            resultingStatus: "Se confirma carga cardiopulmonar mixta",
          }),
          action("no_studies_edema", "Continuar sin monitorizar ni pedir estudios", 0, "Hace ciego el manejo de un caso inestable.", {
            vitalDelta: { spo2: -3 },
          }),
        ],
      },
      {
        id: "stage3",
        title: "Tratamiento dirigido",
        prompt: "Con datos de congestión franca, ¿qué enfoque es más coherente?",
        actions: [
          action("target_congestion", "Mantener soporte y tratar la congestión con vigilancia estrecha", 20, "La conducta correcta descarga al paciente sin perder control hemodinámico.", {
            vitalDelta: { spo2: 4, rr: -3, hr: -8 },
            resultingStatus: "Paciente menos congestionado",
          }),
          action("ignore_hemodynamics", "Tratar sin mirar respuesta hemodinámica", 0, "En este tipo de caso la respuesta manda el siguiente paso.", {
            vitalDelta: { sbp: -12, spo2: -4 },
          }),
        ],
      },
      {
        id: "stage4",
        title: "Reevaluación",
        prompt: "¿Qué te permite cerrar con seguridad esta fase?",
        actions: [
          action("trend_reassessment", "Registrar tendencia de SpO₂, FR y tolerancia al soporte", 10, "El cierre debe mostrar que el paciente realmente mejoró.", {
            resultingStatus: "Caso estabilizado para manejo continuo",
          }),
          action("close_without_trend", "Cerrar solo porque el paciente luce menos ansioso", 0, "La percepción subjetiva no sustituye la reevaluación objetiva.", {
            resultingStatus: "Cierre no sustentado",
          }),
        ],
      },
    ],
    successCriteria: ["soporte respiratorio", "ECG/gas", "tratamiento dirigido", "tendencia documentada"],
    failureCriteria: ["fluidos innecesarios", "sin monitorización", "sin tendencias"],
    timeLimitSec: 220,
    progressionLabel: "Respuesta dependiente del soporte y la descarga",
  },
  {
    id: "dynamic-opioid-overdose",
    title: "Depresión respiratoria por tóxico con respuesta reversible",
    category: "toxicologic",
    subcategory: "sobredosis_opioide",
    difficulty: "intermediate",
    context: "emergency",
    clinicalSummary:
      "Paciente somnoliento, pupilas puntiformes y ventilación deprimida. El estado mejora solo si se prioriza vía aérea, ventilación y antagonismo oportuno.",
    patientProfile: {
      name: "Alex D.",
      age: 29,
      sex: "unspecified",
      chiefComplaint: "Somnolencia y respiración lenta",
      setting: "Box de emergencias",
    },
    keyFindings: ["bradipnea", "miosis", "hipoxemia", "toxicología probable"],
    expectedOutcome: "Asegurar ventilación, monitorizar y revertir la causa si corresponde.",
    correctAnswer: "Tratar primero la ventilación y luego titular el antagonismo.",
    distractors: ["Esperar que despierte", "Pedir laboratorio antes de ventilar", "Dar alta tras breve mejoría"],
    feedback: {
      explanation:
        "Un simulador dinámico exige distinguir la causa reversible sin olvidar que la amenaza inmediata es ventilatoria.",
      expectedConduct:
        "Soporte de vía aérea/ventilación, monitorización, tratamiento causal y observación posterior.",
      dynamicPearl:
        "En tóxicos, la mejoría inicial puede revertirse; por eso la observación importa.",
    },
    tags: ["toxico", "opioides", "gasometria", "via aerea"],
    modeCompatibility: "both",
    initialVitals: { hr: 58, sbp: 102, dbp: 64, spo2: 78, rr: 8, temp: 36.1 },
    initialStatus: "Depresión respiratoria grave",
    alerts: ["Hipoventilación", "Riesgo de apnea", "Vía aérea prioritaria"],
    availableStudies: [
      {
        id: "study-gas-opioid",
        module: "gasometry",
        title: "Gasometría de depresión respiratoria",
        summary: "Acidosis respiratoria aguda por hipoventilación.",
        rows: [
          { label: "pH", value: "7.24" },
          { label: "PaCO2", value: "64 mmHg" },
          { label: "PaO2", value: "52 mmHg" },
        ],
      },
    ],
    stages: [
      {
        id: "stage1",
        title: "Ingreso",
        prompt: "¿Cuál es la prioridad clínica inmediata?",
        actions: [
          action("airway_support", "Abrir vía aérea, ventilar y monitorizar", 35, "La amenaza inmediata no es diagnóstica sino ventilatoria.", {
            vitalDelta: { spo2: 10, rr: 3 },
            resultingStatus: "Ventilación parcialmente corregida",
          }),
          action("history_first", "Tomar historia completa antes de actuar", 0, "Demora una intervención vital.", {
            vitalDelta: { spo2: -6, rr: -2 },
            resultingStatus: "Apnea inminente",
          }),
        ],
      },
      {
        id: "stage2",
        title: "Confirmación funcional",
        prompt: "¿Qué estudio complementa mejor tu sospecha sin retrasar manejo?",
        actions: [
          action("gas_support", "Solicitar gasometría mientras mantienes soporte", 15, "Confirma la magnitud de la hipoventilación y ayuda a vigilar respuesta.", {
            revealsStudyIds: ["study-gas-opioid"],
          }),
          action("no_monitor_toxic", "No pedir nada ni monitorizar porque ya ventila mejor", 0, "La mejoría parcial no elimina el riesgo.", {
            vitalDelta: { spo2: -2 },
          }),
        ],
      },
      {
        id: "stage3",
        title: "Tratamiento causal",
        prompt: "Si la sospecha de opioide es alta, ¿qué conducta es más segura?",
        actions: [
          action("titrate_antagonist", "Administrar antagonismo titulado y observar respuesta", 20, "Corregir la causa sin perder soporte ventilatorio mejora seguridad.", {
            vitalDelta: { rr: 4, spo2: 4, hr: 8 },
            resultingStatus: "Paciente despierta progresivamente",
          }),
          action("send_home_quick", "Dar alta cuando abre los ojos", 0, "Ignora rebote y necesidad de observación.", {
            resultingStatus: "Alta insegura",
          }),
        ],
      },
      {
        id: "stage4",
        title: "Observación",
        prompt: "¿Qué completa el cierre correcto?",
        actions: [
          action("observe_document", "Observar, reevaluar ventilación y documentar riesgo de recurrencia", 10, "El caso no termina con la primera respuesta clínica.", {
            resultingStatus: "Caso tóxico resuelto con vigilancia adecuada",
          }),
          action("skip_observation", "Cerrar sin periodo de observación", 0, "Riesgo frecuente en escenarios tóxicos.", {
            resultingStatus: "Seguimiento inseguro",
          }),
        ],
      },
    ],
    successCriteria: ["ventilación primero", "tratamiento causal", "observación"],
    failureCriteria: ["demora ventilatoria", "sin observación", "alta precoz"],
    timeLimitSec: 200,
    progressionLabel: "Respuesta rápida pero reversible",
  },
];

function createDynamicVariant(baseScenario: DynamicSimulationScenario, variantIndex: number, baseIndex: number): DynamicSimulationScenario {
  const pulseOffsets = [-12, -8, -4, 0, 5, 9, 12];
  const pressureOffsets = [-10, -6, -4, 0, 5, 8, 10];
  const spo2Offsets = [-4, -2, -1, 0, 1, 2, 3];
  const rrOffsets = [-4, -2, -1, 0, 2, 3, 5];
  const tempOffsets = [-0.4, -0.2, 0, 0.2, 0.3, 0.5];

  return {
    ...baseScenario,
    id: buildVariantId(baseScenario.id, variantIndex),
    title: buildVariantName(baseScenario.title, variantIndex),
    clinicalSummary: buildVariantSentence(baseScenario.clinicalSummary, variantIndex),
    patientProfile: {
      ...buildVariantPatient(baseScenario.patientProfile, variantIndex),
      chiefComplaint: baseScenario.patientProfile.chiefComplaint,
      setting: pickDeterministic(
        [baseScenario.patientProfile.setting ?? "Entorno clínico", "Reevaluación avanzada", "Sala crítica", "Turno nocturno", "Ingreso prioritario"],
        variantIndex + baseIndex
      ),
    },
    initialVitals: {
      hr: boundedNumber(baseScenario.initialVitals.hr, variantIndex, pulseOffsets, 35, 180),
      sbp: boundedNumber(baseScenario.initialVitals.sbp, variantIndex + 1, pressureOffsets, 60, 220),
      dbp: boundedNumber(baseScenario.initialVitals.dbp, variantIndex + 2, pressureOffsets, 35, 120),
      spo2: boundedNumber(baseScenario.initialVitals.spo2, variantIndex + 3, spo2Offsets, 68, 100),
      rr: boundedNumber(baseScenario.initialVitals.rr, variantIndex + 4, rrOffsets, 6, 45),
      temp: boundedNumber(baseScenario.initialVitals.temp, variantIndex + 5, tempOffsets, 35, 40, 1),
    },
    alerts: Array.from(new Set([...baseScenario.alerts, pickDeterministic(["Caso dinámico", "Requiere reevaluación", "Usa módulos integrados"], variantIndex)])),
    feedback: {
      ...baseScenario.feedback,
      explanation: buildVariantSentence(baseScenario.feedback.explanation, variantIndex),
    },
    tags: Array.from(new Set([...baseScenario.tags, `variant_${String((variantIndex % 12) + 1).padStart(2, "0")}`])),
  };
}

export const DYNAMIC_SIMULATION_LIBRARY: DynamicSimulationScenario[] = expandCaseLibrary(
  BASE_DYNAMIC_SCENARIOS,
  ADVANCED_MODULE_LIBRARY_SIZE,
  createDynamicVariant
);

export function dynamicSimulationDifficultyLabel(value: AdvancedDifficulty) {
  return advancedDifficultyLabel(value);
}

export function dynamicSimulationCategoryLabel(value: DynamicSimulationCategory) {
  if (value === "cardiovascular") return "Cardiovascular";
  if (value === "respiratory") return "Respiratorio";
  if (value === "infectious") return "Infeccioso";
  if (value === "metabolic") return "Metabólico";
  if (value === "neurologic") return "Neurológico";
  if (value === "trauma") return "Trauma";
  return "Toxicológico";
}

export function dynamicSimulationContextLabel(value: DynamicSimulationContext) {
  if (value === "emergency") return "Emergencia";
  if (value === "icu") return "UCI";
  if (value === "ward") return "Hospitalización";
  if (value === "prehospital") return "Prehospitalario";
  return "General";
}

export function dynamicStudyModuleLabel(value: DynamicStudyModule) {
  if (value === "ecg") return "ECG";
  if (value === "laboratory") return "Laboratorio";
  return "Gasometría";
}

export function inferDynamicSimulationContext(caseObject: any): DynamicSimulationContext {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
      caseObject?.chief_complaint,
    ].join(" ")
  );

  if (text.includes("uci") || text.includes("critico") || text.includes("shock")) return "icu";
  if (text.includes("trauma") || text.includes("accidente") || text.includes("ambulancia")) return "prehospital";
  if (text.includes("emerg") || text.includes("dolor torac") || text.includes("disnea") || text.includes("convulsion")) return "emergency";
  if (text.includes("hospitaliz") || text.includes("sala") || text.includes("ingreso")) return "ward";
  return "general";
}

export function inferDynamicSimulationCategory(caseObject: any): DynamicSimulationCategory {
  const text = normalizeText(
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
      caseObject?.chief_complaint,
    ].join(" ")
  );

  if (text.includes("torac") || text.includes("infarto") || text.includes("palpit") || text.includes("ecg")) return "cardiovascular";
  if (text.includes("asma") || text.includes("disnea") || text.includes("hipox") || text.includes("respira")) return "respiratory";
  if (text.includes("sepsis") || text.includes("fiebre") || text.includes("shock")) return "infectious";
  if (text.includes("diab") || text.includes("ceto") || text.includes("potasio") || text.includes("metabol")) return "metabolic";
  if (text.includes("stroke") || text.includes("neuro") || text.includes("convulsion") || text.includes("hemip")) return "neurologic";
  if (text.includes("trauma") || text.includes("accidente") || text.includes("fractura")) return "trauma";
  return "toxicologic";
}

export function applyDynamicSimulationVitals(current: AdvancedVitals, delta?: Partial<AdvancedVitals>) {
  return applyAdvancedVitals(current, delta);
}

export function evaluateDynamicSimulationScenario(args: {
  scenario: DynamicSimulationScenario;
  selectedActionIds: string[];
  timedOut?: boolean;
}) {
  const { scenario, selectedActionIds, timedOut = false } = args;

  return evaluateStepwiseScenario({
    stages: scenario.stages,
    selectedActionIds,
    timedOut,
    timeoutPenalty: 12,
    excellentSummary: "Secuencia sólida: integraste estudios, soporte y reevaluación sin perder continuidad clínica.",
    goodSummary: "La trayectoria fue segura en lo esencial, aunque aún puedes depurar tiempos y cierres operativos.",
    partialSummary: "Identificaste parte del problema, pero hubo retrasos o decisiones que redujeron la estabilidad del paciente.",
    unsafeSummary: "La secuencia dejó vacíos críticos en estudio, intervención o seguimiento dinámico del paciente.",
  });
}
