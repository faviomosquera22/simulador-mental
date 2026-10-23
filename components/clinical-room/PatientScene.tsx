"use client";

import { BleedingOverlay } from "@/components/patient/BleedingOverlay";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { PatientMotionLayers } from "@/components/patient/PatientMotionLayers";
import { TannOverlay } from "@/components/patient/TannOverlay";
import styles from "./room.module.css";

type Zone = "head" | "chest" | "abdomen" | "pelvis";
const zones: { id: Zone; label: string; left: string; top: string }[] = [
  { id: "head", label: "Estado general", left: "65%", top: "11%" },
  { id: "chest", label: "Respiración y perfusión", left: "62%", top: "31%" },
  { id: "abdomen", label: "Explorar abdomen", left: "46%", top: "44%" },
  { id: "pelvis", label: "Exploración pélvica", left: "55%", top: "57%" },
];
export default function PatientScene({ bleeding, bleedingRate, oxygen, iv, fluids, tann, active, breathingRate, examined, onExplore }: { bleeding: number; bleedingRate: number; oxygen: boolean; iv: boolean; fluids: boolean; tann: {count:number;verified:boolean;removed:boolean}; active: boolean; breathingRate: number; examined: string[]; onExplore: (zone: Zone) => void }) {
  const [showZones, setShowZones] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  return <div className={styles.scene} data-breathing={active} style={{"--patient-breath-duration":`${60/Math.max(6,breathingRate)}s`} as CSSProperties}>
    <div className={styles.sceneTop}><span><i /> VISTA DE LA PACIENTE</span><div className={styles.cameraControls}><button onClick={() => setZoomed(value => !value)} aria-pressed={zoomed}>{zoomed ? "Restablecer vista" : "Acercar paciente"} ⌕</button><button onClick={() => setShowZones(value => !value)} aria-pressed={showZones}>{showZones ? "Ocultar puntos" : "Mostrar puntos"} ◎</button></div></div>
    <div className={styles.photoStage}>
      <div className={styles.sceneLabel}><span>PSYKE</span><strong>01</strong><small>ATENCIÓN<br/>GINECOLÓGICA</small></div>
      <div className={`${styles.portraitFrame} ${zoomed ? styles.portraitZoomed : ""}`}>
      <Image src="/clinical-room/patient-realistic-v2.jpg" alt="Paciente ficticia de aspecto fotorrealista recostada en una camilla de urgencias" fill priority sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 40vw" className={styles.patientPhoto}/>
      <PatientMotionLayers source="/clinical-room/patient-realistic-v2.jpg" expression="/clinical-room/patient-expression-v3.jpg" active={active} breathingRate={breathingRate} filter="saturate(.85)"/>

      {oxygen && <svg className={styles.ivOverlay} viewBox="0 0 1024 1536" aria-label="Oxígeno simulado mediante cánula nasal"><path d="M466 204Q512 220 555 204M499 213V201M524 213V201M467 205Q440 275 390 340L80 440" fill="none" stroke="#c2edf0" strokeWidth="5"/></svg>}
      <div className={styles.sceneVignette}/>
      {iv && <svg className={styles.ivOverlay} viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid slice" aria-label="Acceso venoso simulado conectado"><defs><linearGradient id="iv-bag-fill" x2="0" y2="1"><stop stopColor="#eff9fb" stopOpacity=".85"/><stop offset="1" stopColor="#cae6ec" stopOpacity=".9"/></linearGradient></defs>{fluids && <g><path d="M925 75V680M886 683H967" stroke="#c5d7db" strokeWidth="7"/><path d="M925 79Q927 50 900 58" stroke="#d5e2e4" strokeWidth="5" fill="none"/><rect x="856" y="80" width="82" height="148" rx="14" fill="url(#iv-bag-fill)" stroke="#e1edf0" strokeWidth="3"/><rect x="873" y="111" width="48" height="58" rx="4" fill="#f8fcfa"/><path d="M897 130V150M887 140H907" stroke="#78a6a1" strokeWidth="5"/><path d="M898 228V385Q969 562 892 777" stroke="#d5f7f3" strokeWidth="5" fill="none"/></g>}<rect x="866" y="754" width="47" height="38" rx="5" fill="#f1f6f0" fillOpacity=".75" transform="rotate(20 890 772)"/><path d="M891 757V779" stroke="#9dc6c2" strokeWidth="6"/></svg>}
      {!tann.removed&&<TannOverlay count={tann.count} verified={tann.verified} active={active}/>}

      <BleedingOverlay loss={bleeding} rate={bleedingRate} active={active}/>
      {showZones && zones.map((zone, i) => <button key={zone.id} className={`${styles.hotspot} ${examined.includes(zone.id) ? styles.hotspotExamined : ""}`} style={{ left: zone.left, top: zone.top }} onClick={() => onExplore(zone.id)} disabled={!active} aria-label={zone.label} title={zone.label}><span>{examined.includes(zone.id) ? "✓" : `0${i + 1}`}</span><b>{zone.label}</b></button>)}
      </div>
      <div className={styles.patientEquipment}><span aria-live="polite">{bleedingRate > 0 ? "Sangrado activo" : "Sin sangrado activo"} · {bleeding} mL acumulados</span><span className={oxygen ? styles.equipmentActive : ""}><i/>O₂ {oxygen ? "Conectado" : "No conectado"}</span><span className={iv ? styles.equipmentActive : ""}><i/>Vía IV {iv ? "Disponible" : "Sin acceso"}</span>{tann.count>0&&!tann.removed&&<span className={styles.equipmentActive}><i/>TANN {tann.count}/6 {tann.verified?"· verificado":"· en colocación"}</span>}{fluids && <span className={styles.equipmentActive}><i/>Soporte con cristaloides</span>}</div>
      <div className={styles.explorationStatus}><span>EXPLORACIÓN</span><strong>{examined.length}<small> / 4 zonas</small></strong></div>
    </div>
    <div className={styles.sceneBottom}><span>Imagen sintética · paciente ficticia</span><span>{active ? "Selecciona una zona para explorar" : "Inicia o reanuda la atención"}</span></div>
  </div>;
}
