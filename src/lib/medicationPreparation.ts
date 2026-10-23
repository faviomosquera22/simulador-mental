import type { Medication } from "./criticalCareSimulation";
export type MedicationPresentation = { id: string; label: string; route: string; strength?: number; quantityUnit?: string; doseUnit?: string };
export function withDosePresentations(m: Medication): Medication {
  if (m.id === "paracetamol") return { ...m, requires: [], presentations: [
    { id: "oral500", label: "Comprimido de 500 mg", route: "Oral", strength: 500, quantityUnit: "comprimidos", doseUnit: "mg" },
    { id: "oral1000", label: "Comprimido de 1.000 mg", route: "Oral", strength: 1000, quantityUnit: "comprimidos", doseUnit: "mg" },
    { id: "iv", label: "Solución para perfusión 10 mg/mL", route: "IV", strength: 10, quantityUnit: "mL", doseUnit: "mg" },
  ] };
  if (m.id === "amoxicillin") return { ...m, presentations: [
    { id: "capsule250", label: "Cápsula de 250 mg", route: "Oral", strength: 250, quantityUnit: "cápsulas", doseUnit: "mg" },
    { id: "capsule500", label: "Cápsula de 500 mg", route: "Oral", strength: 500, quantityUnit: "cápsulas", doseUnit: "mg" },
    { id: "suspension125", label: "Suspensión de 125 mg/5 mL", route: "Oral", strength: 25, quantityUnit: "mL", doseUnit: "mg" },
    { id: "suspension250", label: "Suspensión de 250 mg/5 mL", route: "Oral", strength: 50, quantityUnit: "mL", doseUnit: "mg" },
  ] };
  return m;
}
export function doseUnits(m: Medication, presentation?: MedicationPresentation) {
  if (presentation?.quantityUnit) return [presentation.quantityUnit];
  if (m.continuous || ["dexmedetomidine"].includes(m.id)) return ["mL/h", "µg/kg/min", "µg/kg/h", "mg/h"];
  if (m.id === "insulin") return ["UI"];
  if (["saline", "ringer"].includes(m.id)) return ["mL"];
  if (["salbutamol", "ipratropium"].includes(m.id)) return presentation?.id === "inhaler" ? ["inhalaciones"] : ["mg", "µg"];
  if (["dextrose", "oral-glucose"].includes(m.id)) return ["g", "mL"];
  return ["mg", "µg", "mL"];
}
export function prepareDose(m: Medication, p: MedicationPresentation | undefined, amount: number, unit: string) {
  if (!Number.isFinite(amount) || amount <= 0 || !doseUnits(m,p).includes(unit)) return null;
  if ((unit === "cápsulas" || unit === "inhalaciones" || unit === "UI") && !Number.isInteger(amount)) return null;
  if (unit === "comprimidos" && !Number.isInteger(amount * 2)) return null;
  const total = p?.strength ? Math.round(amount * p.strength * 1000) / 1000 : amount;
  if (!Number.isFinite(total)) return null;
  return { amount, unit, total, totalUnit: p?.doseUnit ?? unit, label: `${amount} ${unit}${p?.strength ? ` = ${total} ${p.doseUnit}` : ""}` };
}
