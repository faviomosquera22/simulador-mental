export type CalculationMode = "practice" | "evaluation";

export type CalculationCategory =
  | "dose_medication"
  | "infusion_drip"
  | "fluid_balance"
  | "anthropometry";

export type CalculationDifficulty = "basic" | "intermediate" | "advanced";

export type CalculationExerciseType = "single" | "mini_case" | "quick_test";

export type CalculationTolerance =
  | {
      kind: "absolute";
      value: number;
    }
  | {
      kind: "percent";
      value: number;
    };

export type ClinicalCalculationExercise = {
  id: string;
  title: string;
  category: CalculationCategory;
  difficulty: CalculationDifficulty;
  type: CalculationExerciseType;
  statement: string;
  patientData: Array<{ label: string; value: string }>;
  answerUnit: string;
  formula: string;
  correctAnswer: number;
  tolerance: CalculationTolerance;
  hints: string[];
  stepByStep: string[];
  commonErrors: string[];
};

export type CalculationEvaluation = {
  isValidNumber: boolean;
  isCorrect: boolean;
  parsedAnswer: number | null;
  expectedAnswer: number;
  acceptedMin: number;
  acceptedMax: number;
  absoluteDelta: number;
  feedback: string;
  commonErrorHint?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeNumericInput(value: string): number | null {
  const cleaned = String(value ?? "")
    .trim()
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function roundValue(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function concentrationPercentToMgPerMl(percent: number) {
  return percent * 10;
}

function difficultyByIndex(index: number): CalculationDifficulty {
  return index % 3 === 0 ? "basic" : index % 3 === 1 ? "intermediate" : "advanced";
}

function typeByIndex(index: number): CalculationExerciseType {
  return index % 3 === 0 ? "single" : index % 3 === 1 ? "mini_case" : "quick_test";
}

function toleranceBounds(expected: number, tolerance: CalculationTolerance) {
  if (tolerance.kind === "absolute") {
    return {
      min: expected - tolerance.value,
      max: expected + tolerance.value,
    };
  }

  const range = Math.abs(expected) * (tolerance.value / 100);
  return {
    min: expected - range,
    max: expected + range,
  };
}

const BASE_CLINICAL_CALCULATION_EXERCISES: ClinicalCalculationExercise[] = [
  {
    id: "dose_mgkg_pediatric",
    title: "Dosis por peso (mg/kg/dosis)",
    category: "dose_medication",
    difficulty: "basic",
    type: "single",
    statement:
      "Se prescribe ceftriaxona 50 mg/kg/dosis para un paciente pediátrico de 18 kg. Calcula la dosis total en mg por dosis.",
    patientData: [
      { label: "Peso", value: "18 kg" },
      { label: "Prescripción", value: "50 mg/kg/dosis" },
    ],
    answerUnit: "mg por dosis",
    formula: "Dosis total (mg) = mg/kg/dosis x peso (kg)",
    correctAnswer: 900,
    tolerance: { kind: "absolute", value: 1 },
    hints: ["Multiplica la dosis por kilogramo por el peso del paciente."],
    stepByStep: ["50 x 18 = 900", "Respuesta final: 900 mg por dosis."],
    commonErrors: ["Confundir mg/kg/día con mg/kg/dosis."],
  },
  {
    id: "dose_mg_to_ml",
    title: "Conversión mg a mL",
    category: "dose_medication",
    difficulty: "basic",
    type: "single",
    statement:
      "Se requiere administrar 250 mg de amikacina. Dispones de amikacina 500 mg en 2 mL. ¿Cuántos mL debes administrar?",
    patientData: [
      { label: "Dosis requerida", value: "250 mg" },
      { label: "Presentación", value: "500 mg / 2 mL" },
    ],
    answerUnit: "mL",
    formula: "Volumen (mL) = (Dosis requerida / Dosis disponible) x Volumen disponible",
    correctAnswer: 1,
    tolerance: { kind: "absolute", value: 0.05 },
    hints: ["Usa regla de tres directa."],
    stepByStep: ["(250 / 500) x 2 = 1", "Respuesta final: 1 mL."],
    commonErrors: ["Invertir dosis disponible con dosis requerida."],
  },
  {
    id: "dose_loading_weight_based",
    title: "Dosis de carga según peso",
    category: "dose_medication",
    difficulty: "intermediate",
    type: "mini_case",
    statement:
      "Paciente de 72 kg requiere dosis de carga de fármaco X a 12 mg/kg. Calcula la dosis total en mg.",
    patientData: [
      { label: "Peso", value: "72 kg" },
      { label: "Dosis de carga", value: "12 mg/kg" },
    ],
    answerUnit: "mg",
    formula: "Dosis total (mg) = mg/kg x peso",
    correctAnswer: 864,
    tolerance: { kind: "absolute", value: 1 },
    hints: ["No conviertas unidades si todo está en mg y kg."],
    stepByStep: ["12 x 72 = 864", "Respuesta final: 864 mg."],
    commonErrors: ["Redondear de forma excesiva en dosis de carga."],
  },
  {
    id: "infusion_macrodrip",
    title: "Macrogoteo (gtt/min)",
    category: "infusion_drip",
    difficulty: "basic",
    type: "single",
    statement:
      "Administrar 1000 mL de solución en 8 horas con equipo macrogotero de 20 gtt/mL. Calcula gotas por minuto.",
    patientData: [
      { label: "Volumen", value: "1000 mL" },
      { label: "Tiempo", value: "8 horas" },
      { label: "Factor de goteo", value: "20 gtt/mL" },
    ],
    answerUnit: "gtt/min",
    formula: "gtt/min = (Volumen (mL) x factor goteo) / tiempo (min)",
    correctAnswer: 41.67,
    tolerance: { kind: "absolute", value: 1.5 },
    hints: ["Convierte primero horas a minutos."],
    stepByStep: ["8 h = 480 min", "(1000 x 20) / 480 = 41.67", "Aproximado: 42 gtt/min."],
    commonErrors: ["Olvidar convertir horas a minutos."],
  },
  {
    id: "infusion_microdrip",
    title: "Microgoteo (gtt/min)",
    category: "infusion_drip",
    difficulty: "basic",
    type: "single",
    statement:
      "Indicar 120 mL en 2 horas con microgotero (60 gtt/mL). Calcula la velocidad en gotas por minuto.",
    patientData: [
      { label: "Volumen", value: "120 mL" },
      { label: "Tiempo", value: "2 horas" },
      { label: "Factor de goteo", value: "60 gtt/mL" },
    ],
    answerUnit: "gtt/min",
    formula: "gtt/min = (Volumen x factor) / tiempo (min)",
    correctAnswer: 60,
    tolerance: { kind: "absolute", value: 1 },
    hints: ["Con microgotero, 60 gtt/mL suele simplificar cálculos."],
    stepByStep: ["2 h = 120 min", "(120 x 60) / 120 = 60", "Respuesta final: 60 gtt/min."],
    commonErrors: ["Usar factor de 20 en lugar de 60."],
  },
  {
    id: "infusion_time",
    title: "Tiempo total de infusión",
    category: "infusion_drip",
    difficulty: "intermediate",
    type: "single",
    statement:
      "Se pasan 500 mL a 125 mL/h. ¿Cuánto tiempo tardará la infusión completa?",
    patientData: [
      { label: "Volumen", value: "500 mL" },
      { label: "Velocidad", value: "125 mL/h" },
    ],
    answerUnit: "horas",
    formula: "Tiempo (h) = Volumen (mL) / Velocidad (mL/h)",
    correctAnswer: 4,
    tolerance: { kind: "absolute", value: 0.1 },
    hints: ["Divide volumen total para velocidad."],
    stepByStep: ["500 / 125 = 4", "Respuesta final: 4 horas."],
    commonErrors: ["Multiplicar en lugar de dividir."],
  },
  {
    id: "infusion_rate_mlhr",
    title: "Velocidad de infusión (mL/h)",
    category: "infusion_drip",
    difficulty: "intermediate",
    type: "quick_test",
    statement:
      "Debes administrar 1500 mL en 12 horas. Calcula la velocidad en mL/h.",
    patientData: [
      { label: "Volumen", value: "1500 mL" },
      { label: "Tiempo", value: "12 horas" },
    ],
    answerUnit: "mL/h",
    formula: "Velocidad (mL/h) = Volumen / Tiempo",
    correctAnswer: 125,
    tolerance: { kind: "absolute", value: 1 },
    hints: ["Usa una división simple."],
    stepByStep: ["1500 / 12 = 125", "Respuesta final: 125 mL/h."],
    commonErrors: ["Interpretar 12 h como 120 min y cambiar unidad final."],
  },
  {
    id: "fluid_balance_daily",
    title: "Balance hídrico de 24h",
    category: "fluid_balance",
    difficulty: "basic",
    type: "mini_case",
    statement:
      "Ingresos: 2200 mL (VO + IV). Egresos: diuresis 1600 mL, vómito 200 mL, drenaje 150 mL. Calcula el balance hídrico total.",
    patientData: [
      { label: "Ingresos", value: "2200 mL" },
      { label: "Egresos", value: "1950 mL" },
    ],
    answerUnit: "mL",
    formula: "Balance = Ingresos - Egresos",
    correctAnswer: 250,
    tolerance: { kind: "absolute", value: 1 },
    hints: ["Suma egresos y luego resta a ingresos."],
    stepByStep: ["Egresos = 1600 + 200 + 150 = 1950", "2200 - 1950 = 250", "Balance positivo de +250 mL."],
    commonErrors: ["No sumar todos los egresos."],
  },
  {
    id: "fluid_balance_negative",
    title: "Balance hídrico negativo",
    category: "fluid_balance",
    difficulty: "intermediate",
    type: "quick_test",
    statement:
      "Ingresos en turno: 900 mL. Egresos: 1200 mL. Determina el balance hídrico del turno.",
    patientData: [
      { label: "Ingresos", value: "900 mL" },
      { label: "Egresos", value: "1200 mL" },
    ],
    answerUnit: "mL",
    formula: "Balance = Ingresos - Egresos",
    correctAnswer: -300,
    tolerance: { kind: "absolute", value: 1 },
    hints: ["El signo importa: puede ser negativo."],
    stepByStep: ["900 - 1200 = -300", "Balance negativo de -300 mL."],
    commonErrors: ["Reportar 300 sin signo negativo."],
  },
  {
    id: "maintenance_fluids_holliday",
    title: "Líquidos de mantenimiento (Holliday-Segar)",
    category: "fluid_balance",
    difficulty: "advanced",
    type: "mini_case",
    statement:
      "Paciente pediátrico de 26 kg. Calcula requerimiento de mantenimiento en 24 horas con regla de Holliday-Segar.",
    patientData: [
      { label: "Peso", value: "26 kg" },
      { label: "Regla", value: "100/50/20 mL/kg/día" },
    ],
    answerUnit: "mL/día",
    formula: "100 mL/kg para 10 kg + 50 mL/kg para siguientes 10 kg + 20 mL/kg por kg restante",
    correctAnswer: 1620,
    tolerance: { kind: "absolute", value: 3 },
    hints: ["Divide por segmentos de peso: 10 kg, 10 kg, restante."],
    stepByStep: [
      "Primeros 10 kg: 10 x 100 = 1000",
      "Siguientes 10 kg: 10 x 50 = 500",
      "Restantes 6 kg: 6 x 20 = 120",
      "Total = 1620 mL/día.",
    ],
    commonErrors: ["Aplicar 100 mL/kg a todo el peso."],
  },
  {
    id: "bmi_basic",
    title: "Índice de masa corporal (IMC)",
    category: "anthropometry",
    difficulty: "basic",
    type: "single",
    statement:
      "Paciente adulto con peso 78 kg y talla 1.68 m. Calcula el IMC.",
    patientData: [
      { label: "Peso", value: "78 kg" },
      { label: "Talla", value: "1.68 m" },
    ],
    answerUnit: "kg/m²",
    formula: "IMC = peso (kg) / talla² (m²)",
    correctAnswer: 27.64,
    tolerance: { kind: "absolute", value: 0.2 },
    hints: ["Eleva la talla al cuadrado antes de dividir."],
    stepByStep: ["1.68² = 2.8224", "78 / 2.8224 = 27.64", "IMC aproximado: 27.6 kg/m²."],
    commonErrors: ["Usar talla en cm sin convertir a metros."],
  },
  {
    id: "bmi_interpretation_threshold",
    title: "IMC y clasificación",
    category: "anthropometry",
    difficulty: "intermediate",
    type: "quick_test",
    statement:
      "Paciente con peso 92 kg y talla 1.70 m. Calcula IMC (solo valor numérico).",
    patientData: [
      { label: "Peso", value: "92 kg" },
      { label: "Talla", value: "1.70 m" },
    ],
    answerUnit: "kg/m²",
    formula: "IMC = peso / talla²",
    correctAnswer: 31.83,
    tolerance: { kind: "absolute", value: 0.2 },
    hints: ["1.70² = 2.89."],
    stepByStep: ["92 / 2.89 = 31.83", "IMC aproximado: 31.8 kg/m²."],
    commonErrors: ["Redondear en exceso y perder precisión."],
  },
];

function buildPercentMedicationExercises(): ClinicalCalculationExercise[] {
  const exercises: ClinicalCalculationExercise[] = [];

  const directConfigs = [
    { medication: "Lidocaína", concentration: 1, context: "infiltración local" },
    { medication: "Lidocaína", concentration: 2, context: "procedimiento menor" },
    { medication: "Gluconato de calcio", concentration: 10, context: "administración titulada" },
    { medication: "Sulfato de magnesio", concentration: 20, context: "preparación de impregnación" },
    { medication: "Dextrosa", concentration: 10, context: "corrección glucémica" },
    { medication: "Dextrosa", concentration: 50, context: "bolo concentrado" },
  ] as const;

  const weightConfigs = [
    { medication: "Lidocaína", concentration: 1, dosePerKgBase: 2.5, context: "preparación anestésica" },
    { medication: "Lidocaína", concentration: 2, dosePerKgBase: 3, context: "bloqueo local" },
    { medication: "Gluconato de calcio", concentration: 10, dosePerKgBase: 12, context: "infusión educativa" },
    { medication: "Sulfato de magnesio", concentration: 20, dosePerKgBase: 18, context: "cálculo guiado" },
    { medication: "Dextrosa", concentration: 10, dosePerKgBase: 20, context: "aporte glucosado" },
  ] as const;

  const dilutionConfigs = [
    { medication: "Lidocaína", stockPercent: 2, targetPercent: 1 },
    { medication: "Lidocaína", stockPercent: 2, targetPercent: 0.5 },
    { medication: "Dextrosa", stockPercent: 50, targetPercent: 10 },
    { medication: "Dextrosa", stockPercent: 50, targetPercent: 12.5 },
    { medication: "Sulfato de magnesio", stockPercent: 20, targetPercent: 4 },
    { medication: "Sulfato de magnesio", stockPercent: 20, targetPercent: 10 },
  ] as const;

  const mixtureConfigs = [
    { medication: "Dextrosa", lowPercent: 5, highPercent: 50, targetPercent: 10 },
    { medication: "Dextrosa", lowPercent: 10, highPercent: 50, targetPercent: 12.5 },
    { medication: "Dextrosa", lowPercent: 10, highPercent: 50, targetPercent: 15 },
    { medication: "Sulfato de magnesio", lowPercent: 10, highPercent: 20, targetPercent: 15 },
    { medication: "Bicarbonato de sodio", lowPercent: 4.2, highPercent: 8.4, targetPercent: 6.3 },
  ] as const;

  const activeDoseConfigs = [
    { medication: "Lidocaína", concentration: 1 },
    { medication: "Lidocaína", concentration: 2 },
    { medication: "Gluconato de calcio", concentration: 10 },
    { medication: "Sulfato de magnesio", concentration: 20 },
    { medication: "Dextrosa", concentration: 10 },
    { medication: "Dextrosa", concentration: 50 },
  ] as const;

  for (let index = 0; index < 30; index += 1) {
    const direct = directConfigs[index % directConfigs.length];
    const directVolumeMl = roundValue(1 + (index % 6) * 0.5 + Math.floor(index / 6) * 0.25, 2);
    const directRequiredMg = roundValue(concentrationPercentToMgPerMl(direct.concentration) * directVolumeMl, 1);
    exercises.push({
      id: `dose_percent_direct_${String(index + 1).padStart(3, "0")}`,
      title: `${direct.medication} al ${direct.concentration}%: calcular volumen`,
      category: "dose_medication",
      difficulty: difficultyByIndex(index),
      type: typeByIndex(index),
      statement: `Durante una ${direct.context}, se requieren ${directRequiredMg} mg de ${direct.medication}. Dispones de una solución al ${direct.concentration}%. ¿Cuántos mL debes cargar?`,
      patientData: [
        { label: "Medicamento", value: `${direct.medication} al ${direct.concentration}%` },
        { label: "Dosis requerida", value: `${directRequiredMg} mg` },
      ],
      answerUnit: "mL",
      formula: "Volumen (mL) = mg requeridos / (concentración % x 10 mg/mL)",
      correctAnswer: directVolumeMl,
      tolerance: { kind: "absolute", value: 0.05 },
      hints: [
        "Convierte primero la concentración porcentual a mg/mL.",
        "Recuerda: 1% equivale a 10 mg/mL.",
      ],
      stepByStep: [
        `${direct.concentration}% = ${concentrationPercentToMgPerMl(direct.concentration)} mg/mL`,
        `${directRequiredMg} / ${concentrationPercentToMgPerMl(direct.concentration)} = ${directVolumeMl}`,
        `Respuesta final: ${directVolumeMl} mL.`,
      ],
      commonErrors: [
        "Olvidar que 1% equivale a 10 mg/mL.",
        "Multiplicar por la concentración en vez de dividir.",
      ],
    });

    const weightBased = weightConfigs[index % weightConfigs.length];
    const weightKg = 8 + (index % 10) * 4 + Math.floor(index / 10) * 2;
    const dosePerKg = roundValue(weightBased.dosePerKgBase + (index % 3) * 0.5, 1);
    const totalMg = roundValue(weightKg * dosePerKg, 1);
    const weightBasedVolumeMl = roundValue(totalMg / concentrationPercentToMgPerMl(weightBased.concentration), 2);
    exercises.push({
      id: `dose_percent_weight_${String(index + 1).padStart(3, "0")}`,
      title: `${weightBased.medication} al ${weightBased.concentration}% por peso`,
      category: "dose_medication",
      difficulty: difficultyByIndex(index + 1),
      type: typeByIndex(index + 1),
      statement: `Paciente de ${weightKg} kg. En ${weightBased.context} se prescribe ${weightBased.medication} a ${dosePerKg} mg/kg. La presentación disponible es ${weightBased.concentration}%. ¿Cuántos mL corresponden a la dosis total?`,
      patientData: [
        { label: "Peso", value: `${weightKg} kg` },
        { label: "Prescripción", value: `${dosePerKg} mg/kg` },
        { label: "Presentación", value: `${weightBased.concentration}%` },
      ],
      answerUnit: "mL",
      formula: "Volumen (mL) = (mg/kg x peso) / (concentración % x 10 mg/mL)",
      correctAnswer: weightBasedVolumeMl,
      tolerance: { kind: "absolute", value: 0.08 },
      hints: [
        "Primero obtén la dosis total en mg.",
        "Luego divide entre la concentración expresada en mg/mL.",
      ],
      stepByStep: [
        `Dosis total = ${weightKg} x ${dosePerKg} = ${totalMg} mg`,
        `${weightBased.concentration}% = ${concentrationPercentToMgPerMl(weightBased.concentration)} mg/mL`,
        `${totalMg} / ${concentrationPercentToMgPerMl(weightBased.concentration)} = ${weightBasedVolumeMl} mL`,
      ],
      commonErrors: [
        "Responder en mg cuando el ejercicio pide mL.",
        "No convertir la solución porcentual a mg/mL.",
      ],
    });

    const dilution = dilutionConfigs[index % dilutionConfigs.length];
    const finalVolumeMl = 20 + (index % 6) * 10 + Math.floor(index / 6) * 5;
    const stockVolumeMl = roundValue((finalVolumeMl * dilution.targetPercent) / dilution.stockPercent, 2);
    const diluentVolumeMl = roundValue(finalVolumeMl - stockVolumeMl, 2);
    exercises.push({
      id: `dose_percent_dilution_${String(index + 1).padStart(3, "0")}`,
      title: `${dilution.medication}: dilución desde ${dilution.stockPercent}%`,
      category: "dose_medication",
      difficulty: difficultyByIndex(index + 2),
      type: typeByIndex(index + 2),
      statement: `Debes preparar ${finalVolumeMl} mL de ${dilution.medication} al ${dilution.targetPercent}% a partir de una solución stock al ${dilution.stockPercent}%. ¿Cuántos mL de la solución concentrada necesitas antes de completar con diluyente?`,
      patientData: [
        { label: "Concentración final", value: `${dilution.targetPercent}%` },
        { label: "Stock disponible", value: `${dilution.stockPercent}%` },
        { label: "Volumen final", value: `${finalVolumeMl} mL` },
      ],
      answerUnit: "mL de stock",
      formula: "Stock (mL) = (concentración final x volumen final) / concentración stock",
      correctAnswer: stockVolumeMl,
      tolerance: { kind: "absolute", value: 0.08 },
      hints: [
        "Usa la ecuación C1 x V1 = C2 x V2.",
        "El diluyente completa el volumen final restante.",
      ],
      stepByStep: [
        `V1 = (${dilution.targetPercent} x ${finalVolumeMl}) / ${dilution.stockPercent} = ${stockVolumeMl} mL`,
        `Diluyente = ${finalVolumeMl} - ${stockVolumeMl} = ${diluentVolumeMl} mL`,
        `Respuesta final: ${stockVolumeMl} mL de solución stock.`,
      ],
      commonErrors: [
        "Invertir concentración final con concentración stock.",
        "Responder el volumen de diluyente en vez del stock.",
      ],
    });

    const mixture = mixtureConfigs[index % mixtureConfigs.length];
    const mixtureVolumeMl = 60 + (index % 5) * 30 + Math.floor(index / 5) * 5;
    const highVolumeMl = roundValue(
      (mixtureVolumeMl * (mixture.targetPercent - mixture.lowPercent)) / (mixture.highPercent - mixture.lowPercent),
      2
    );
    const lowVolumeMl = roundValue(mixtureVolumeMl - highVolumeMl, 2);
    exercises.push({
      id: `dose_percent_mix_${String(index + 1).padStart(3, "0")}`,
      title: `${mixture.medication}: mezcla de concentraciones`,
      category: "dose_medication",
      difficulty: difficultyByIndex(index + 3),
      type: typeByIndex(index + 3),
      statement: `Necesitas preparar ${mixtureVolumeMl} mL de ${mixture.medication} al ${mixture.targetPercent}% mezclando ${mixture.lowPercent}% y ${mixture.highPercent}%. ¿Cuántos mL de la presentación al ${mixture.highPercent}% debes usar?`,
      patientData: [
        { label: "Concentración baja", value: `${mixture.lowPercent}%` },
        { label: "Concentración alta", value: `${mixture.highPercent}%` },
        { label: "Objetivo", value: `${mixture.targetPercent}% en ${mixtureVolumeMl} mL` },
      ],
      answerUnit: `mL al ${mixture.highPercent}%`,
      formula: "Volumen alta concentración = V final x (C objetivo - C baja) / (C alta - C baja)",
      correctAnswer: highVolumeMl,
      tolerance: { kind: "absolute", value: 0.1 },
      hints: [
        "La concentración objetivo debe quedar entre la baja y la alta.",
        "Aplica una regla de mezcla o aligación.",
      ],
      stepByStep: [
        `Volumen alta = ${mixtureVolumeMl} x (${mixture.targetPercent} - ${mixture.lowPercent}) / (${mixture.highPercent} - ${mixture.lowPercent}) = ${highVolumeMl} mL`,
        `Volumen baja = ${mixtureVolumeMl} - ${highVolumeMl} = ${lowVolumeMl} mL`,
        `Respuesta final: ${highVolumeMl} mL de la solución más concentrada.`,
      ],
      commonErrors: [
        "Usar la diferencia al revés y obtener un volumen negativo.",
        "Responder el volumen de la solución menos concentrada.",
      ],
    });

    const activeDose = activeDoseConfigs[index % activeDoseConfigs.length];
    const administeredMl = roundValue(0.8 + (index % 6) * 0.6 + Math.floor(index / 6) * 0.15, 2);
    const activeMg = roundValue(administeredMl * concentrationPercentToMgPerMl(activeDose.concentration), 1);
    exercises.push({
      id: `dose_percent_active_${String(index + 1).padStart(3, "0")}`,
      title: `${activeDose.medication} al ${activeDose.concentration}%: mg administrados`,
      category: "dose_medication",
      difficulty: difficultyByIndex(index + 4),
      type: typeByIndex(index + 4),
      statement: `Se administran ${administeredMl} mL de ${activeDose.medication} al ${activeDose.concentration}%. ¿Cuántos mg de principio activo recibió el paciente?`,
      patientData: [
        { label: "Volumen administrado", value: `${administeredMl} mL` },
        { label: "Concentración", value: `${activeDose.concentration}%` },
      ],
      answerUnit: "mg",
      formula: "mg administrados = mL x (concentración % x 10 mg/mL)",
      correctAnswer: activeMg,
      tolerance: { kind: "absolute", value: 0.1 },
      hints: [
        "Convierte el porcentaje a mg/mL antes de multiplicar.",
        "1% equivale a 10 mg por mL.",
      ],
      stepByStep: [
        `${activeDose.concentration}% = ${concentrationPercentToMgPerMl(activeDose.concentration)} mg/mL`,
        `${administeredMl} x ${concentrationPercentToMgPerMl(activeDose.concentration)} = ${activeMg} mg`,
        `Respuesta final: ${activeMg} mg.`,
      ],
      commonErrors: [
        "Responder en mL cuando el ejercicio pide mg.",
        "Tratar el porcentaje como si fuera mg/mL directo.",
      ],
    });
  }

  return exercises;
}

const PERCENT_MEDICATION_EXERCISES = buildPercentMedicationExercises();

export const CLINICAL_CALCULATION_EXERCISES: ClinicalCalculationExercise[] = [
  ...BASE_CLINICAL_CALCULATION_EXERCISES,
  ...PERCENT_MEDICATION_EXERCISES,
];

export function getCalculationExerciseById(id: string) {
  return CLINICAL_CALCULATION_EXERCISES.find((exercise) => exercise.id === id) ?? null;
}

export function getCalculationExercisesByCategory(category: CalculationCategory) {
  return CLINICAL_CALCULATION_EXERCISES.filter((exercise) => exercise.category === category);
}

export function filterCalculationExercises(filters?: {
  category?: CalculationCategory | "all";
  difficulty?: CalculationDifficulty | "all";
}) {
  const category = filters?.category ?? "all";
  const difficulty = filters?.difficulty ?? "all";
  return CLINICAL_CALCULATION_EXERCISES.filter((exercise) => {
    const matchesCategory = category === "all" || exercise.category === category;
    const matchesDifficulty = difficulty === "all" || exercise.difficulty === difficulty;
    return matchesCategory && matchesDifficulty;
  });
}

export function pickRandomCalculationExercise(args?: {
  category?: CalculationCategory | "all";
  difficulty?: CalculationDifficulty | "all";
  excludeId?: string;
}) {
  const pool = filterCalculationExercises({
    category: args?.category ?? "all",
    difficulty: args?.difficulty ?? "all",
  }).filter((exercise) => exercise.id !== args?.excludeId);

  if (!pool.length) return CLINICAL_CALCULATION_EXERCISES[0] ?? null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function evaluateCalculationAnswer(args: {
  exercise: ClinicalCalculationExercise;
  rawAnswer: string;
  mode: CalculationMode;
}): CalculationEvaluation {
  const parsed = normalizeNumericInput(args.rawAnswer);
  const expected = args.exercise.correctAnswer;
  const bounds = toleranceBounds(expected, args.exercise.tolerance);
  const min = Math.min(bounds.min, bounds.max);
  const max = Math.max(bounds.min, bounds.max);

  if (parsed == null) {
    return {
      isValidNumber: false,
      isCorrect: false,
      parsedAnswer: null,
      expectedAnswer: expected,
      acceptedMin: min,
      acceptedMax: max,
      absoluteDelta: Number.POSITIVE_INFINITY,
      feedback: "Ingresa un valor numérico válido para evaluar tu respuesta.",
    };
  }

  const roundedParsed = Number(parsed.toFixed(4));
  const isCorrect = roundedParsed >= min && roundedParsed <= max;
  const absoluteDelta = Math.abs(roundedParsed - expected);

  let feedback = "";
  if (isCorrect) {
    feedback =
      args.mode === "practice"
        ? "Respuesta correcta. Buen cálculo clínico."
        : "Respuesta correcta.";
  } else if (absoluteDelta <= Math.abs(expected) * 0.05 + 0.1) {
    feedback = "Casi correcto. Revisa redondeo y unidades de la fórmula.";
  } else {
    feedback = "Resultado incorrecto. Revisa la operación principal y unidades.";
  }

  let commonErrorHint: string | undefined;
  if (!isCorrect && args.exercise.commonErrors.length) {
    const index = clamp(Math.floor(Math.random() * args.exercise.commonErrors.length), 0, args.exercise.commonErrors.length - 1);
    commonErrorHint = args.exercise.commonErrors[index];
  }

  return {
    isValidNumber: true,
    isCorrect,
    parsedAnswer: roundedParsed,
    expectedAnswer: expected,
    acceptedMin: min,
    acceptedMax: max,
    absoluteDelta,
    feedback,
    commonErrorHint,
  };
}

export function getCalculationCategoryLabel(category: CalculationCategory) {
  if (category === "dose_medication") return "Dosis y medicación";
  if (category === "infusion_drip") return "Infusión y goteo";
  if (category === "fluid_balance") return "Balance hídrico";
  return "Antropometría básica";
}

export function getCalculationDifficultyLabel(level: CalculationDifficulty) {
  if (level === "basic") return "Básico";
  if (level === "intermediate") return "Intermedio";
  return "Avanzado";
}

export function getExerciseTypeLabel(value: CalculationExerciseType) {
  if (value === "single") return "Ejercicio suelto";
  if (value === "mini_case") return "Mini caso";
  return "Evaluación rápida";
}

export function classifyBmi(value: number) {
  if (!Number.isFinite(value)) return "No evaluable";
  if (value < 18.5) return "Bajo peso";
  if (value < 25) return "Normopeso";
  if (value < 30) return "Sobrepeso";
  if (value < 35) return "Obesidad grado I";
  if (value < 40) return "Obesidad grado II";
  return "Obesidad grado III";
}
