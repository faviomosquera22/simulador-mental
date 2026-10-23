import type { OxygenTherapy } from "@/src/lib/oxygenTherapy";

export function OxygenOverlay({ therapy, animated = false }: { therapy: OxygenTherapy; animated?: boolean }) {
  // Photographs: nares y=200, eyes y=166. Illustration: nares y=232/900.
  return <svg className="patient-equipment-overlay" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:3}} viewBox={animated ? "0 0 600 900" : "0 0 1024 1536"} role="img" aria-label={`${therapy.device === "cannula" ? "Cánula nasal" : therapy.device === "mask" ? "Mascarilla simple" : "Mascarilla con reservorio"} · ${therapy.flow} L/min`}>
    <g transform={animated ? "translate(-6 110) scale(.6)" : undefined}>
      {therapy.device === "cannula" ? <g fill="none" stroke="#c7f2f4" strokeWidth="5"><path d="M464 201Q509 218 555 201M499 207v-8m22 8v-8M466 203Q437 260 414 356L173 521"/></g> : <g stroke="#a2d6dd" strokeWidth="4"><path d="M507 179Q484 184 479 213L478 239Q510 263 543 239L542 214Q537 186 517 179Z" fill="#d0eef0" fillOpacity=".63"/><path d="M479 215L440 199M543 215L579 199" fill="none"/><circle cx="510" cy="237" r="9" fill="#90c8d0"/><path d="M510 245Q471 330 174 520" fill="none"/>{therapy.device === "reservoir" && <path d="M496 252Q475 288 485 330Q512 351 536 329Q547 289 526 252Z" fill="#e1f0ed" fillOpacity=".85"/>}</g>}
    </g>
  </svg>;
}
