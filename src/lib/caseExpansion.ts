export const TARGET_CASE_LIBRARY_SIZE = 120;

const FEMALE_NAMES = [
  "Valeria",
  "Camila",
  "Daniela",
  "Sofía",
  "María",
  "Elena",
  "Carolina",
  "Lucía",
  "Paola",
  "Marta",
  "Rosa",
  "Natalia",
];

const MALE_NAMES = [
  "Daniel",
  "Mateo",
  "Luis",
  "Javier",
  "Rogelio",
  "Mauricio",
  "Sergio",
  "Mario",
  "Andrés",
  "Benjamín",
  "Carlos",
  "Miguel",
];

const UNSPECIFIED_NAMES = ["Alex", "Sam", "Noel", "Ariel", "Gael", "Cris"];

const LAST_NAMES = [
  "P.",
  "R.",
  "C.",
  "V.",
  "S.",
  "M.",
  "T.",
  "L.",
  "N.",
  "G.",
  "D.",
  "Q.",
];

const CONTEXT_SUFFIXES = [
  "Ingreso por guardia nocturna",
  "Caso en observación clínica",
  "Reevaluación durante turno matutino",
  "Ingreso reciente desde consulta externa",
  "Seguimiento en sala de hospitalización",
  "Valoración posterior a cambio de turno",
  "Paciente derivado desde triage prioritario",
  "Revaloración tras intervención inicial",
];

export function expandCaseLibrary<T>(
  baseItems: T[],
  targetCount: number,
  createVariant: (baseItem: T, variantIndex: number, baseIndex: number) => T
): T[] {
  if (baseItems.length >= targetCount) return [...baseItems];

  const result = [...baseItems];
  let variantIndex = 0;

  while (result.length < targetCount) {
    const baseIndex = variantIndex % baseItems.length;
    result.push(createVariant(baseItems[baseIndex], variantIndex, baseIndex));
    variantIndex += 1;
  }

  return result;
}

export function pickDeterministic<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

export function buildVariantId(baseId: string, variantIndex: number) {
  return `${baseId}_v${String(variantIndex + 1).padStart(3, "0")}`;
}

export function buildVariantName(baseName: string, variantIndex: number) {
  return `${baseName} · Escenario ${String(variantIndex + 1).padStart(3, "0")}`;
}

export function buildVariantSentence(baseSentence: string, variantIndex: number) {
  const suffix = pickDeterministic(CONTEXT_SUFFIXES, variantIndex);
  const trimmed = baseSentence.trim().replace(/\.+$/, "");
  return `${trimmed}. ${suffix}.`;
}

export function buildVariantPatient<
  T extends { name: string; age: number; sex: "female" | "male" | "unspecified" }
>(patient: T, variantIndex: number): T {
  const pool =
    patient.sex === "female"
      ? FEMALE_NAMES
      : patient.sex === "male"
      ? MALE_NAMES
      : UNSPECIFIED_NAMES;
  const name = `${pickDeterministic(pool, variantIndex)} ${pickDeterministic(LAST_NAMES, variantIndex * 3 + 1)}`;
  const ageOffset = pickDeterministic([-8, -6, -4, -2, 0, 2, 4, 6, 8], variantIndex);
  const age = Math.max(18, Math.min(92, patient.age + ageOffset));

  return {
    ...patient,
    name,
    age,
  };
}

export function boundedNumber(
  baseValue: number,
  variantIndex: number,
  offsets: number[],
  min: number,
  max: number,
  decimals = 0
) {
  const offset = pickDeterministic(offsets, variantIndex);
  const nextValue = Math.max(min, Math.min(max, baseValue + offset));
  return Number(nextValue.toFixed(decimals));
}
