import type { CareTarget, CareTool } from "./basicCareSimulation";

export const CATHETER_GAUGES = [
  { gauge: 14, color: "#e88632", name: "Naranja", context: "Gran calibre; requiere una indicación y una vena adecuadas." },
  { gauge: 16, color: "#8a929e", name: "Gris", context: "Gran calibre; no es la elección automática para una vena pequeña." },
  { gauge: 18, color: "#329a69", name: "Verde", context: "Valorar necesidades de flujo, terapia y diámetro de la vena." },
  { gauge: 20, color: "#e59aab", name: "Rosa", context: "Opción del escenario de hidratación en antebrazo, si la vena lo permite." },
  { gauge: 22, color: "#4b9bd9", name: "Azul", context: "Opción del escenario con vena superficial de menor diámetro." },
  { gauge: 24, color: "#e4c547", name: "Amarillo", context: "Opción del escenario con vena dorsal pequeña y terapia compatible." },
] as const;
export type CatheterGauge = typeof CATHETER_GAUGES[number]["gauge"];
export type EquipmentStatus = "ready" | "selected" | "used" | "installed" | "disposed";
export type EquipmentUnit = { id: string; tool: CareTool; status: EquipmentStatus; gauge?: CatheterGauge; target?: CareTarget; parentId?: string; usedAt?: string };
export type EquipmentSession = { units: EquipmentUnit[]; selectedId?: string; serial: number };
export const EQUIPMENT_STATUS: Record<EquipmentStatus, string> = { ready: "Nuevo · disponible", selected: "Seleccionado · en tu mano", used: "Usado · pendiente de descarte", installed: "Instalado en el paciente", disposed: "Descartado · no reutilizable" };
export const SINGLE_USE_TOOLS: CareTool[] = ["catheter", "gloves", "antiseptic", "saline", "dressing", "lubricant", "tube", "gauze", "cvc", "connector"];
export function createEquipmentSession(): EquipmentSession { return { units: [], serial: 0 }; }
export function seedEquipmentSession(caseId: string): EquipmentSession {
  const units: EquipmentUnit[] = [];
  if (["iv-leg", "iv-phlebitis"].includes(caseId)) units.push({ id: "existing-catheter", tool: "catheter", gauge: 20, target: "site", status: "installed", usedAt: "existing" });
  if (caseId.startsWith("cvc-") && caseId !== "cvc-assisted") units.push({ id: "existing-cvc", tool: "cvc", target: "site", status: "installed", usedAt: "existing" });
  if (caseId.startsWith("wound-") || caseId.startsWith("cvc-") && caseId !== "cvc-assisted") units.push({ id: "existing-dressing", tool: "dressing", target: caseId.startsWith("wound-") ? "wound" : "site", status: "installed", usedAt: "existing" });
  return { units, serial: 0 };
}
export function heldEquipment(session: EquipmentSession): EquipmentUnit | undefined { return session.units.find(unit => unit.id === session.selectedId && unit.status === "selected"); }
export function selectEquipment(session: EquipmentSession, tool: CareTool, gauge?: CatheterGauge, unitId?: string): { session: EquipmentSession; error?: string } {
  if (tool === "catheter" && !CATHETER_GAUGES.some(item => item.gauge === gauge)) return { session, error: "Elige un calibre entre las opciones 14, 16, 18, 20, 22 y 24 G antes de preparar el catéter." };
  const explicit = unitId ? session.units.find(unit => unit.id === unitId) : undefined;
  if (unitId && (!explicit || explicit.tool !== tool || !["ready", "selected"].includes(explicit.status))) return { session, error: "Esta unidad ya está usada, instalada o descartada. No puede volver a prepararse; toma un material nuevo." };
  const existing = explicit ?? session.units.find(unit => unit.tool === tool && unit.gauge === gauge && ["ready", "selected"].includes(unit.status));
  const serial = existing ? session.serial : session.serial + 1;
  const unit: EquipmentUnit = existing ?? { id: `${tool}-${serial}`, tool, gauge, status: "ready" };
  const units = session.units.filter(item => item.id !== unit.id).map(item => item.status === "selected" ? { ...item, status: "ready" as const } : item);
  return { session: { units: [...units, { ...unit, status: "selected" }], selectedId: unit.id, serial } };
}
export function releaseEquipment(session: EquipmentSession): EquipmentSession { return { ...session, selectedId: undefined, units: session.units.map(unit => unit.status === "selected" ? { ...unit, status: "ready" } : unit) }; }
export function equipmentError(session: EquipmentSession, action: { tool: CareTool; itemId?: string; gauge?: number }): string | undefined {
  if (action.itemId) {
    const unit = session.units.find(item => item.id === action.itemId);
    if (!unit || unit.tool !== action.tool || !["ready", "selected"].includes(unit.status)) return "La unidad elegida no está disponible: un material usado, instalado o descartado no se reutiliza.";
    if (action.tool === "catheter" && unit.gauge !== action.gauge) return "El calibre no coincide con el catéter preparado. Vuelve a elegir la unidad correcta.";
  }
  if (action.tool === "catheter" && !CATHETER_GAUGES.some(item => item.gauge === action.gauge)) return "Todavía no has elegido el calibre del catéter. Selecciona una unidad de 14, 16, 18, 20, 22 o 24 G.";
  return undefined;
}
export function consumeEquipment(session: EquipmentSession, action: { tool: CareTool; target: CareTarget; itemId?: string; gauge?: number }, stepId: string, attempted = false): EquipmentSession {
  if (action.tool === "remove") return removeInstalledEquipment(releaseEquipment(session), "dressing");
  if (action.tool === "sharps") return { ...releaseEquipment(session), units: session.units.map(unit => unit.tool === "sharps" && unit.status === "used" ? { ...unit, status: "disposed", usedAt: stepId } : unit.status === "selected" ? { ...unit, status: "ready" } : unit) };
  if (action.tool === "record") return { ...releaseEquipment(session), units: session.units.map(unit => ({ ...unit, status: unit.status === "used" ? "disposed" : unit.status === "selected" ? "ready" : unit.status })) };
  if (!SINGLE_USE_TOOLS.includes(action.tool)) return releaseEquipment(session);
  const unit = session.units.find(item => item.id === action.itemId) ?? heldEquipment(session);
  const existing = unit?.tool === action.tool && ["ready", "selected"].includes(unit.status) ? unit : undefined;
  const serial = existing ? session.serial : session.serial + 1;
  const item: EquipmentUnit = { ...(existing ?? { id: `${action.tool}-${serial}`, tool: action.tool, gauge: action.gauge as CatheterGauge | undefined }), status: !attempted && ["catheter", "tube", "cvc", "dressing"].includes(action.tool) ? "installed" : "used", target: action.target, usedAt: stepId };
  const units = releaseEquipment(session).units.filter(value => value.id !== item.id);
  units.push(item);
  if (action.tool === "catheter" && !attempted) units.push({ id: `mandril-${serial}`, tool: "sharps", status: "used", parentId: item.id, target: "bin", usedAt: stepId });
  return { units, serial, selectedId: undefined };
}
export function discardEquipment(session: EquipmentSession, id: string): { session: EquipmentSession; error?: string } {
  const unit = session.units.find(item => item.id === id);
  if (!unit) return { session, error: "La unidad no existe en la bandeja." };
  if (unit.status === "installed") return { session, error: "El catéter flexible permanece en el paciente. El mandril se desecha en punzantes; retirar un acceso instalado necesita indicación y valoración." };
  if (unit.status === "disposed") return { session, error: "Esta unidad ya fue descartada y no puede reutilizarse." };
  return { session: { ...session, selectedId: session.selectedId === id ? undefined : session.selectedId, units: session.units.map(item => item.id === id ? { ...item, status: "disposed" } : item) } };
}
export function removeInstalledEquipment(session: EquipmentSession, tool: CareTool): EquipmentSession { return { ...session, selectedId: undefined, units: session.units.map(unit => unit.tool === tool && ["installed", "selected"].includes(unit.status) ? { ...unit, status: "used" } : unit) }; }
export function catheterPlan(caseId: string): { accepted: CatheterGauge[]; explanation: string } {
  if (caseId === "iv-hand") return { accepted: [22, 24], explanation: "Este caso ficticio define una vena dorsal pequeña y una terapia breve compatible con 22 o 24 G. Un número G mayor indica menor diámetro." };
  if (caseId === "iv-upper-arm") return { accepted: [18, 20, 22], explanation: "La vena superficial previamente valorada de este caso admite 18, 20 o 22 G para la terapia planteada; no autoriza una punción profunda ni un PICC." };
  return { accepted: [20, 22], explanation: "Para la vena superficial y la hidratación rutinaria de este maniquí, el plan del caso propone 20 o 22 G. La elección real depende de vena, terapia, duración y protocolo; no existe un calibre universal por edad o zona." };
}
