"use client";
import { useState } from "react";
import type { CareTarget, CareTool } from "@/src/lib/basicCareSimulation";
import MaterialImage from "./MaterialImage";
import styles from "./basic-care.module.css";

export default function CareInteractionOverlay({ anchor, target, selected, guided, disabled, siteLabel, physicalTarget, completed, onApply }: {
  anchor: { x: number; y: number }; target?: CareTarget; selected: CareTool | null; guided: boolean; disabled: boolean; siteLabel: string; physicalTarget: CareTarget; completed: CareTarget[]; onApply: (target: CareTarget, tool?: CareTool) => void;
}) {
  const [over, setOver] = useState<CareTarget | null>(null);
  const zones: { id: CareTarget; label: string; className: string; image?: CareTool }[] = [
    { id: "patient", label: "Paciente / valoración", className: styles.scenePatient, image: "identity" },
    { id: "hands", label: "Tus manos / protección", className: styles.sceneHands, image: "gloves" },
    { id: "tray", label: "Preparar en la bandeja", className: styles.sceneTray, image: "kit" },
    { id: "bin", label: "Desechar punzantes", className: styles.sceneBin, image: "sharps" },
    { id: physicalTarget, label: siteLabel, className: styles.sceneSite },
  ];
  return <div className={styles.sceneTargets} aria-label="Zonas sobre la imagen">{zones.map(zone => <button key={zone.id} type="button" className={`${styles.sceneTarget} ${zone.className}`} data-scene-target={zone.id} data-done={completed.includes(zone.id)} data-active={guided && !!selected && target === zone.id || over === zone.id} style={zone.id === physicalTarget ? { left: `${anchor.x}%`, top: `${anchor.y}%` } : undefined} disabled={disabled}
    onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDragEnter={event => { event.preventDefault(); setOver(zone.id); }} onDragLeave={() => setOver(null)} onDrop={event => { event.preventDefault(); setOver(null); const tool = event.dataTransfer.getData("application/x-care-tool") as CareTool; onApply(zone.id, tool || undefined); }} onClick={() => onApply(zone.id)}>
    {zone.image ? <MaterialImage tool={zone.image}/> : <span className={styles.siteCross} aria-hidden="true">+</span>}<span>{zone.label}</span>{completed.includes(zone.id) && <span className={styles.zoneCheck} aria-hidden="true">✓</span>}{selected && guided && target === zone.id && <small>Suelta o toca aquí</small>}
  </button>)}</div>;
}
