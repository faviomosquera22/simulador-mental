"use client";
import { BleedingOverlay } from "@/components/patient/BleedingOverlay";
import { OxygenOverlay } from "@/components/patient/OxygenOverlay";
import { OXYGEN_DEVICES, type OxygenTherapy } from "@/src/lib/oxygenTherapy";
import { TannOverlay } from "@/components/patient/TannOverlay";
import Image from "next/image";
import { PatientMotionLayers } from "@/components/patient/PatientMotionLayers";
import { scenarios, type ScenarioId, type Vitals } from "@/src/lib/criticalCareSimulation";

type Props = { scenario: ScenarioId; garment: number; selectedZone: number | null; assessed: number[]; running: boolean; oxygen: boolean; onAssess: (zone: number) => void; breathingRate: number; vitals?: Vitals; iv?: boolean; fluids?: boolean; showPoints?: boolean; zoom?: boolean; oxygenTherapy?: OxygenTherapy | null; bleedingRate?: number };
const points = [{ x: 65, y: 10.5 }, { x: 50, y: 31 }, { x: 42, y: 45 }, { x: 60, y: 74 }];
export function PatientView({ scenario, selectedZone, assessed, running, oxygen, onAssess, breathingRate, vitals, iv, fluids, showPoints=true, zoom=false, oxygenTherapy, bleedingRate=0, garment }: Props) {
  const source = scenario === "obstetric" ? "/clinical-room" : "/critical-care";
  const filter = vitals && vitals.spo2 < 88 ? "saturate(.76)" : vitals && vitals.sbp < 85 ? "saturate(.84) brightness(1.02)" : "none";
  return <div className={`patient-scene critical-patient-photo ${zoom?"patient-closeup":""}`} style={{ "--breath-duration": `${60 / Math.max(6, breathingRate)}s` } as React.CSSProperties}>
    <Image src={`${source}/patient-realistic-v2.jpg`} alt="Paciente adulto ficticio de apariencia fotográfica acostado en camilla. Representación educativa compartida entre los casos." width={1024} height={1536} sizes="(max-width: 760px) 100vw, 560px" loading="eager" className="patient-photo" style={{ filter }}/>
    <PatientMotionLayers source={`${source}/patient-realistic-v2.jpg`} expression={`${source}/patient-expression-v3.jpg`} active={running} breathingRate={breathingRate} filter={filter} expressive={!vitals||vitals.gcs>=10}/>

    <svg className="patient-equipment-overlay" viewBox="0 0 1024 1536" aria-hidden="true">

      {scenario === "ventilation" && <g><path d="M511 235L463 245L424 336L155 347" fill="none" stroke="#99cbd4" strokeWidth="17"/><path d="M511 235L463 245L424 336L155 347" fill="none" stroke="#d7e9e8" strokeWidth="7" strokeDasharray="4 5"/><rect x="488" y="229" width="42" height="11" rx="3" fill="#e4e7d7"/></g>}
      {iv && <g><rect x="258" y="686" width="49" height="32" rx="6" fill="#f3f5ec" fillOpacity=".8" transform="rotate(14 280 700)"/><path d="M282 690v24" stroke="#8db6b9" strokeWidth="8"/>{fluids && <><path d="M910 120v630" stroke="#b7c5c9" strokeWidth="6"/><rect x="860" y="153" width="82" height="142" rx="13" fill="#e0f1f0" fillOpacity=".88" stroke="#e6f6f7" strokeWidth="3"/><path d="M900 295V580Q945 850 298 710" stroke="#c4e3e0" strokeWidth="4" fill="none"/><rect x="874" y="178" width="52" height="64" rx="5" fill="#f7faf5"/><path d="M900 193v32m-13-16h26" stroke="#78a89e" strokeWidth="4"/></>}</g>}
    </svg>
    {oxygen && oxygenTherapy && <OxygenOverlay therapy={oxygenTherapy}/>}
    {scenario === "obstetric" && <TannOverlay count={Math.min(6, Math.max(0, garment-1))} verified={garment >= 8} active={running}/>}
    <BleedingOverlay loss={vitals?.bloodLoss ?? 0} rate={bleedingRate} active={running}/>
    {showPoints && points.map((point, i) => <button type="button" key={i} aria-label={`Explorar zona ${i + 1}`} aria-pressed={selectedZone === i} disabled={!running} title={scenarios[scenario].zones[i].label} onClick={() => onAssess(i)} className={`patient-hotspot ${selectedZone === i ? "selected" : ""} ${assessed.includes(i) ? "assessed" : ""}`} style={{ left: `${point.x}%`, top: `${point.y}%` }}>{String(i + 1).padStart(2, "0")}</button>)}
    <div className="patient-equipment-status"><span>{scenario === "ventilation" ? "Ventilación invasiva" : oxygen && oxygenTherapy ? `${OXYGEN_DEVICES[oxygenTherapy.device].label} · ${oxygenTherapy.flow} L/min` : "Respiración espontánea"}</span>{(vitals?.bloodLoss ?? 0) > 0 && <span>{bleedingRate > 0 ? "Sangrado activo" : "Sin sangrado activo"} · {Math.round(vitals?.bloodLoss ?? 0)} mL acumulados</span>}{iv && <span>Acceso IV</span>}{fluids && <span>Cristaloides</span>}</div>
    <span className="patient-photo-caption">Paciente ficticio · imagen generada · respuesta visual ilustrativa</span>
  </div>;
}
