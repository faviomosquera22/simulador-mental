"use client";
import type { CareTarget, CareTool } from "@/src/lib/basicCareSimulation";
import { EQUIPMENT_STATUS, SINGLE_USE_TOOLS, type EquipmentSession, type EquipmentUnit } from "@/src/lib/careEquipment";
import { MATERIAL_GUIDE } from "./materialGuide";
import MaterialImage from "./MaterialImage";
import styles from "./basic-care.module.css";

export const equipmentName = (unit: EquipmentUnit) => unit.tool === "sharps" && unit.parentId ? "Mandril del catéter" : `${MATERIAL_GUIDE[unit.tool].name}${unit.gauge ? ` ${unit.gauge} G` : ""}`;
export default function CareInventory({ equipment, held, destination, targetLabel, paused, finished, stepId, onRelease, onDiscard, onChangeGauge }: {
  equipment: EquipmentSession; held?: EquipmentUnit; destination: string; targetLabel: (target: CareTarget) => string; paused: boolean; finished: boolean; stepId?: string; onRelease: () => void; onDiscard: (id: string) => void; onChangeGauge: () => void;
}) {
  const objects = equipment.units.filter(unit => SINGLE_USE_TOOLS.includes(unit.tool) || unit.parentId);
  const installed = objects.filter(unit => unit.status === "installed");
  const mandril = objects.find(unit => unit.parentId && unit.status === "used");
  const pending = objects.filter(unit => unit.status === "used");
  return <section className={styles.inventory} aria-label="Estado de tu equipo">
    <div className={styles.loadout} data-testid="held-equipment" data-held-tool={held?.tool ?? "none"} data-held-gauge={held?.gauge}>
      {held ? <><span className={styles.loadoutPhoto}><MaterialImage tool={held.tool} gauge={held.gauge}/></span><div><span className={styles.loadoutEyebrow}>✓ SELECCIONADO · EN TU MANO</span><h3>{equipmentName(held)}</h3><p>{MATERIAL_GUIDE[held.tool].kind === "action" ? "Acción preparada" : "Unidad nueva"} <b>→</b> {destination}</p><div className={styles.loadoutActions}>{held.tool === "catheter" && <button disabled={paused} onClick={onChangeGauge}>Cambiar calibre</button>}<button disabled={paused} onClick={onRelease}>Soltar sin usar</button></div></div></> : <><span className={styles.emptyHand} aria-hidden="true">✋</span><div><span className={styles.loadoutEyebrow}>MANOS LIBRES</span><h3>{installed.length ? "Tu dispositivo permanece instalado." : "Elige un material para equiparte."}</h3><p>{pending.some(unit => unit.tool === "sharps") ? "Mandril usado: deséchalo en el contenedor de punzantes." : "Cuando lo prepares, verás aquí el material, su estado y el destino."}</p></div></>}
    </div>
    {mandril && <div className={styles.sharpAlert} data-testid="mandril-pending"><div><strong>Mandril usado · punzante</strong><p>El catéter flexible permanece instalado. Desecha solo el mandril.</p></div><button data-discard-unit={mandril.id} disabled={paused || finished} onClick={() => onDiscard(mandril.id)}>Descartar mandril →</button></div>}
    {!!objects.length && <details className={styles.inventoryDetails} open={finished}><summary>Inventario de esta práctica <span>{installed.length} en uso · {pending.length} por desechar</span></summary><div className={styles.inventoryList}>{objects.map(unit => <div key={unit.id} className={styles.inventoryUnit} data-unit-id={unit.id} data-unit-status={unit.status}>
      <span className={styles.inventoryPhoto}><MaterialImage tool={unit.tool as CareTool} gauge={unit.gauge}/></span><div><strong>{equipmentName(unit)}</strong><span>{EQUIPMENT_STATUS[unit.status]}</span>{unit.target && unit.status === "installed" && <small>Ubicación: {targetLabel(unit.target)} · unidad no reutilizable</small>}</div>
      {unit.status === "used" && !unit.parentId && <button data-discard-unit={unit.id} disabled={paused || finished || unit.tool === "gloves" && !["clean-field", "record"].includes(stepId ?? "")} onClick={() => onDiscard(unit.id)}>{unit.parentId ? "Descartar mandril" : "Descartar"}</button>}
      {unit.status === "disposed" && <span className={styles.disposedSeal}>✓ Descartado</span>}
    </div>)}</div><p className={styles.inventoryNote}>El catéter flexible permanece en el paciente; su mandril se descarta. Un material usado o descartado no vuelve a la bandeja de material nuevo. La acción de cierre incluye retirar guantes y eliminar los residuos pendientes.</p></details>}
  </section>;
}
