"use client";
import { useEffect, useRef, useState } from "react";
import { CATHETER_GAUGES, catheterPlan, type CatheterGauge } from "@/src/lib/careEquipment";
import MaterialImage from "./MaterialImage";
import styles from "./basic-care.module.css";

export default function CatheterPicker({ open, caseId, guided, initial = 20, onClose, onConfirm }: { open: boolean; caseId: string; guided: boolean; initial?: CatheterGauge; onClose: () => void; onConfirm: (gauge: CatheterGauge) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [gauge, setGauge] = useState<CatheterGauge>(initial);
  useEffect(() => { if (open && dialog.current && !dialog.current.open) { setGauge(initial); dialog.current.showModal(); } else if (!open && dialog.current?.open) dialog.current.close(); }, [open, initial]);
  const selected = CATHETER_GAUGES.find(item => item.gauge === gauge)!;
  return <dialog ref={dialog} className={`${styles.materialDialog} ${styles.gaugeDialog}`} aria-label="Preparar catéter periférico" onClose={onClose}>
    <div className={styles.pickerHeading}><div><p className={styles.eyebrow}>PREPARACIÓN DEL EQUIPO</p><h2>Elige el calibre de tu catéter.</h2></div><button aria-label="Cancelar preparación del catéter" onClick={() => dialog.current?.close()}>×</button></div>
    <p>No hay un catéter seleccionado hasta que confirmes. G significa gauge: cuanto mayor es el número, menor es el diámetro.</p>
    <div className={styles.gaugeGrid} role="group" aria-label="Calibres disponibles">{CATHETER_GAUGES.map(item => <button key={item.gauge} data-gauge-option={item.gauge} aria-pressed={gauge === item.gauge} onClick={() => setGauge(item.gauge)} style={{ "--gauge-color": item.color } as React.CSSProperties}>
      <span className={styles.gaugePhoto}><MaterialImage tool="catheter" gauge={item.gauge}/></span><strong>{item.gauge}<small>G</small></strong><span className={styles.gaugeColor}><i/>{item.name}</span>{guided && catheterPlan(caseId).accepted.includes(item.gauge) && <small className={styles.gaugeRecommended}>Previsto en este caso</small>}
    </button>)}</div>
    <div className={styles.pickerSelection}><span style={{ background: selected.color }}/><div><strong>Catéter {gauge} G · {selected.name}</strong><p>Unidad nueva, de un solo uso. Se verá en tu mano al confirmar.</p></div></div>
    {guided && <p className={styles.gaugeExplanation}>{catheterPlan(caseId).explanation}</p>}
    <button className={styles.primary} data-testid="confirm-catheter" onClick={() => { onConfirm(gauge); dialog.current?.close(); }}>Preparar catéter {gauge} G <span>Tomar unidad nueva →</span></button>
  </dialog>;
}
