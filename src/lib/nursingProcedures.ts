import {
  TARGET_CASE_LIBRARY_SIZE,
  buildVariantId,
  buildVariantName,
  buildVariantSentence,
  expandCaseLibrary,
} from "./caseExpansion";

export type ProcedureMode = "practice" | "evaluation";

export type ProcedureDifficulty = "basic" | "intermediate" | "advanced";

export type ProcedureCategory =
  | "medication"
  | "devices"
  | "respiratory"
  | "wound_care";

export type ProcedureMaterial = {
  id: string;
  label: string;
};

export type ProcedureDecisionPoint = {
  prompt: string;
  options: Array<{ id: string; label: string; isCorrect: boolean; explanation: string }>;
};

export type NursingProcedure = {
  id: string;
  name: string;
  category: ProcedureCategory;
  difficulty: ProcedureDifficulty;
  context: string;
  materials: ProcedureMaterial[];
  requiredMaterialIds: string[];
  steps: string[];
  criticalErrors: string[];
  decisionPoint: ProcedureDecisionPoint;
  rationale: string;
};

export type ProcedureEvaluation = {
  totalScore: number;
  rubric: {
    materials: number;
    order: number;
    decision: number;
  };
  feedback: {
    materials: string;
    order: string;
    decision: string;
    summary: string;
  };
};

export function procedureDifficultyLabel(value: ProcedureDifficulty) {
  if (value === "basic") return "Básico";
  if (value === "intermediate") return "Intermedio";
  return "Avanzado";
}

export function procedureCategoryLabel(value: ProcedureCategory) {
  if (value === "medication") return "Administración";
  if (value === "devices") return "Dispositivos";
  if (value === "respiratory") return "Respiratorio";
  return "Curaciones";
}

const BASE_NURSING_PROCEDURE_LIBRARY: NursingProcedure[] = [
  {
    id: "im_injection",
    name: "Administración intramuscular",
    category: "medication",
    difficulty: "basic",
    context: "Paciente adulto con indicación de analgésico IM.",
    materials: [
      { id: "gloves", label: "Guantes limpios" },
      { id: "syringe", label: "Jeringa adecuada" },
      { id: "needle_im", label: "Aguja IM" },
      { id: "medication", label: "Medicamento prescrito" },
      { id: "gauze", label: "Gasa" },
      { id: "alcohol", label: "Antiséptico" },
      { id: "iv_set", label: "Equipo de venoclisis" },
    ],
    requiredMaterialIds: ["gloves", "syringe", "needle_im", "medication", "gauze", "alcohol"],
    steps: [
      "Verificar la prescripción, paciente y alergias.",
      "Preparar el medicamento con técnica segura.",
      "Identificar y exponer el sitio anatómico correcto.",
      "Realizar antisepsia del sitio.",
      "Administrar el medicamento por vía intramuscular según técnica.",
      "Desechar material punzocortante y registrar el procedimiento.",
    ],
    criticalErrors: ["No verificar identidad/alergias", "Omitir antisepsia", "Desecho inseguro de punzocortantes"],
    decisionPoint: {
      prompt: "Si el paciente refiere dolor intenso y el sitio está eritematoso, ¿qué haces?",
      options: [
        {
          id: "reassess_site",
          label: "Revalorar el sitio y considerar otro punto o posponer hasta aclarar.",
          isCorrect: true,
          explanation: "Un sitio inflamado o doloroso requiere reevaluación antes de inyectar.",
        },
        {
          id: "inject_anyway",
          label: "Administrar igual para no retrasar el tratamiento.",
          isCorrect: false,
          explanation: "No es seguro inyectar en un sitio con signos locales de problema.",
        },
      ],
    },
    rationale: "La seguridad depende de preparación correcta, selección anatómica, asepsia y registro final.",
  },
  {
    id: "iv_medication",
    name: "Administración intravenosa",
    category: "medication",
    difficulty: "intermediate",
    context: "Paciente con acceso periférico para medicación IV programada.",
    materials: [
      { id: "gloves", label: "Guantes limpios" },
      { id: "medication", label: "Medicamento prescrito" },
      { id: "saline", label: "Solución salina para lavado" },
      { id: "syringe", label: "Jeringa" },
      { id: "alcohol", label: "Antiséptico" },
      { id: "iv_set", label: "Línea o puerto venoso permeable" },
      { id: "stethoscope", label: "Estetoscopio" },
    ],
    requiredMaterialIds: ["gloves", "medication", "saline", "syringe", "alcohol", "iv_set"],
    steps: [
      "Confirmar orden, compatibilidad, identidad y permeabilidad del acceso.",
      "Preparar el medicamento y revisar dilución/velocidad.",
      "Realizar antisepsia del puerto de acceso.",
      "Administrar según la técnica y velocidad indicadas.",
      "Lavar la línea si corresponde y vigilar respuesta inmediata.",
      "Registrar administración y cualquier evento adverso.",
    ],
    criticalErrors: ["No comprobar permeabilidad", "Ignorar compatibilidad", "Administrar a velocidad incorrecta"],
    decisionPoint: {
      prompt: "Durante la administración el paciente refiere ardor local y el sitio se edematiza. ¿Qué acción es correcta?",
      options: [
        {
          id: "stop_iv",
          label: "Suspender de inmediato y valorar infiltración/extravasación.",
          isCorrect: true,
          explanation: "El dolor y edema obligan a detener y reevaluar el acceso.",
        },
        {
          id: "flush_faster",
          label: "Aumentar el lavado para que pase más rápido.",
          isCorrect: false,
          explanation: "Eso puede empeorar infiltración o extravasación.",
        },
      ],
    },
    rationale: "La administración IV segura exige vigilancia del acceso, compatibilidad y respuesta del paciente.",
  },
  {
    id: "foley_catheter",
    name: "Colocación de sonda vesical",
    category: "devices",
    difficulty: "advanced",
    context: "Paciente con retención urinaria y orden de cateterismo vesical.",
    materials: [
      { id: "sterile_gloves", label: "Guantes estériles" },
      { id: "foley", label: "Sonda Foley" },
      { id: "drainage", label: "Bolsa colectora" },
      { id: "lubricant", label: "Lubricante estéril" },
      { id: "antiseptic", label: "Solución antiséptica" },
      { id: "sterile_field", label: "Campo estéril" },
      { id: "oxygen", label: "Mascarilla de oxígeno" },
    ],
    requiredMaterialIds: ["sterile_gloves", "foley", "drainage", "lubricant", "antiseptic", "sterile_field"],
    steps: [
      "Verificar indicación, consentimiento y reunir material estéril.",
      "Realizar higiene, posición adecuada y técnica aséptica.",
      "Preparar el campo estéril y lubricar la sonda.",
      "Introducir la sonda con técnica correcta hasta obtener orina.",
      "Inflar balón según indicación y conectar bolsa colectora.",
      "Fijar el sistema, dejar drenaje por gravedad y registrar.",
    ],
    criticalErrors: ["Romper técnica estéril", "Insuflar balón antes de confirmar posición", "Elevar bolsa sobre vejiga"],
    decisionPoint: {
      prompt: "No se observa salida de orina tras introducir la sonda. ¿Qué conducta es más segura?",
      options: [
        {
          id: "reassess_position",
          label: "Revalorar la posición antes de inflar balón o forzar maniobras.",
          isCorrect: true,
          explanation: "No debe inflarse el balón sin confirmar posición correcta.",
        },
        {
          id: "inflate_anyway",
          label: "Inflar el balón para fijarla y esperar.",
          isCorrect: false,
          explanation: "Podría producir lesión uretral.",
        },
      ],
    },
    rationale: "La prioridad es técnica estéril, confirmación de posición y prevención de lesión uretral.",
  },
  {
    id: "basic_wound_care",
    name: "Curación básica",
    category: "wound_care",
    difficulty: "basic",
    context: "Herida superficial con indicación de curación limpia.",
    materials: [
      { id: "gloves", label: "Guantes" },
      { id: "sterile_gauze", label: "Gasas" },
      { id: "saline", label: "Solución salina" },
      { id: "trash", label: "Bolsa para desechos" },
      { id: "dressing", label: "Apósito limpio" },
      { id: "antibiotic", label: "Antibiótico IV" },
    ],
    requiredMaterialIds: ["gloves", "sterile_gauze", "saline", "trash", "dressing"],
    steps: [
      "Revisar orden, valorar herida y preparar el material.",
      "Retirar apósito previo con técnica segura.",
      "Valorar exudado, bordes y signos de infección.",
      "Limpiar la herida según técnica indicada.",
      "Colocar apósito limpio y fijarlo.",
      "Desechar material y registrar hallazgos.",
    ],
    criticalErrors: ["No valorar la herida antes de cubrir", "Contaminar apósito limpio"],
    decisionPoint: {
      prompt: "Si observas exudado purulento y mal olor, ¿qué debes hacer?",
      options: [
        {
          id: "report_infection",
          label: "Registrar hallazgos y escalar por probable infección.",
          isCorrect: true,
          explanation: "Los signos sugieren infección y requieren notificación o nueva indicación.",
        },
        {
          id: "cover_and_ignore",
          label: "Cubrir la herida y continuar sin reportar.",
          isCorrect: false,
          explanation: "Omitir el reporte retrasa la intervención clínica.",
        },
      ],
    },
    rationale: "La curación no solo limpia; también valora, documenta y detecta signos de complicación.",
  },
  {
    id: "oxygen_therapy",
    name: "Oxigenoterapia básica",
    category: "respiratory",
    difficulty: "basic",
    context: "Paciente con disnea y saturación baja que requiere oxígeno suplementario.",
    materials: [
      { id: "oxygen_source", label: "Fuente de oxígeno" },
      { id: "cannula", label: "Cánula nasal o dispositivo indicado" },
      { id: "pulseox", label: "Pulsioxímetro" },
      { id: "gloves", label: "Guantes" },
      { id: "suction", label: "Equipo de aspiración" },
    ],
    requiredMaterialIds: ["oxygen_source", "cannula", "pulseox"],
    steps: [
      "Valorar necesidad clínica y verificar indicación de oxígeno.",
      "Seleccionar el dispositivo apropiado y preparar la fuente.",
      "Colocar el dispositivo de forma cómoda y segura.",
      "Ajustar flujo según indicación o protocolo.",
      "Monitorizar saturación y respuesta clínica.",
      "Registrar dispositivo, flujo y evolución.",
    ],
    criticalErrors: ["No monitorizar respuesta", "Usar flujo erróneo para el dispositivo"],
    decisionPoint: {
      prompt: "La saturación no mejora y el paciente aumenta trabajo respiratorio. ¿Qué sigue?",
      options: [
        {
          id: "escalate_support",
          label: "Reevaluar, escalar soporte y avisar por deterioro respiratorio.",
          isCorrect: true,
          explanation: "La falta de respuesta exige reevaluación y escalamiento.",
        },
        {
          id: "keep_same",
          label: "Mantener igual y esperar más tiempo sin reevaluar.",
          isCorrect: false,
          explanation: "No es seguro ante deterioro respiratorio progresivo.",
        },
      ],
    },
    rationale: "El oxígeno es una intervención terapéutica que requiere dispositivo correcto, flujo y reevaluación.",
  },
];

export const NURSING_PROCEDURE_LIBRARY: NursingProcedure[] = expandCaseLibrary(
  BASE_NURSING_PROCEDURE_LIBRARY,
  TARGET_CASE_LIBRARY_SIZE,
  (baseProcedure, variantIndex) => ({
    ...baseProcedure,
    id: buildVariantId(baseProcedure.id, variantIndex),
    name: buildVariantName(baseProcedure.name, variantIndex),
    context: buildVariantSentence(baseProcedure.context, variantIndex),
  })
);

export function evaluateProcedure(args: {
  procedure: NursingProcedure;
  selectedMaterialIds: string[];
  orderedStepIds: string[];
  decisionId: string;
}): ProcedureEvaluation {
  const { procedure, selectedMaterialIds, orderedStepIds, decisionId } = args;

  const materialHits = procedure.requiredMaterialIds.filter((id) => selectedMaterialIds.includes(id)).length;
  const materialsScore = Math.round((materialHits / procedure.requiredMaterialIds.length) * 30);

  const correctPositions = procedure.steps.reduce((acc, step, index) => {
    return acc + (orderedStepIds[index] === step ? 1 : 0);
  }, 0);
  const orderScore = Math.round((correctPositions / procedure.steps.length) * 50);

  const selectedDecision = procedure.decisionPoint.options.find((item) => item.id === decisionId) ?? null;
  const decisionScore = selectedDecision?.isCorrect ? 20 : 0;
  const totalScore = materialsScore + orderScore + decisionScore;

  return {
    totalScore,
    rubric: {
      materials: materialsScore,
      order: orderScore,
      decision: decisionScore,
    },
    feedback: {
      materials:
        materialsScore >= 24
          ? "Seleccionaste la mayoría del material clave."
          : `Material imprescindible: ${procedure.requiredMaterialIds.join(", ")}.`,
      order:
        orderScore >= 40
          ? "La secuencia del procedimiento es consistente."
          : "Necesitas ordenar mejor la secuencia crítica del procedimiento.",
      decision:
        decisionScore > 0
          ? selectedDecision?.explanation ?? "Tomaste la decisión adecuada."
          : selectedDecision?.explanation ?? "La decisión durante el procedimiento no fue la más segura.",
      summary:
        totalScore >= 80
          ? "Buen desempeño procedimental con enfoque seguro."
          : totalScore >= 55
          ? "La base es útil, pero hay fallos de secuencia o preparación."
          : "El procedimiento requiere repaso estructurado antes de considerarse seguro.",
    },
  };
}
