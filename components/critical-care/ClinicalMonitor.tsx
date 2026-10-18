"use client";
import { formatClinicalTime, type SimulationState, type MonitoringKey, type Vitals } from "@/src/lib/criticalCareSimulation";
import { observedVital, sensorConnected } from "@/src/lib/criticalCareObservation";

export type BedsideMonitorState = Pick<SimulationState, "status" | "elapsed" | "monitoring"> & { vitals: Pick<Vitals, "hr" | "sbp" | "dbp" | "spo2" | "rr" | "temperature"> & Partial<Vitals> };
export function ClinicalMonitor({ state, onConnect, channels }: { state: BedsideMonitorState; onConnect?: () => void; channels?: MonitoringKey[] }) {
  const running = state.status === "running";
  const v = state.vitals;
  const ecg = sensorConnected(state, "ecg");
  const metrics = [
    { label: "FC", unit: "lpm", key: "hr" as const, color: "#8de6ae", danger: v.hr > 120 || v.hr < 50 },
    { label: "SpO₂", unit: "%", key: "spo2" as const, color: "#79d8ef", danger: v.spo2 < 92 },
    { label: "PA", unit: "mmHg", key: "sbp" as const, color: "#efb1ce", danger: v.sbp < 90 || v.sbp > 180 },
    { label: "FR", unit: "rpm", key: "rr" as const, color: "#f2d484", danger: v.rr > 30 || v.rr < 8 },
    { label: "EtCO₂", unit: "mmHg", key: "etco2" as const, color: "#c7b3ed", danger: false },
    { label: "T°", unit: "°C", key: "temperature" as const, color: "#f2bc8a", danger: v.temperature > 38.5 },
  ];
  const abnormal = metrics.filter(m => observedVital(state, m.key) !== null && m.danger);
  const waves: { key: MonitoringKey; label: string; color: string; path: string; seconds: number }[] = [
    { key: "ecg", label: "ECG · DII", color: "#8de6ae", seconds: 60 / Math.max(20, v.hr) * 6, path: Array.from({length:12}, (_, i) => `M${i*50} 30 l8 0 3 -3 4 6 4 -3 3 0 2 -22 3 38 3 -16 5 0 4 -5 4 5 7 0`).join(" ") },
    { key: "spo2", label: "PLETISMOGRAFÍA", color: "#79d8ef", seconds: 60 / Math.max(20, v.hr) * 6, path: Array.from({length:12},(_,i)=>`M${i*50} 43 Q${i*50+9} 42 ${i*50+13} 15 Q${i*50+16} 3 ${i*50+21} 25 L${i*50+27} 30 L${i*50+30} 25 Q${i*50+40} 43 ${i*50+50} 43`).join(" ") },
    { key: "rr", label: "RESPIRACIÓN", color: "#f2d484", seconds: 60 / Math.max(6, v.rr) * 4, path: Array.from({length:6},(_,i)=>`M${i*100} 40 C${i*100+20} 40 ${i*100+20} 12 ${i*100+40} 12 S${i*100+70} 40 ${i*100+100} 40`).join(" ") },
  ];
  // One-shot equipment sound check; never presented as an active cardiac alarm.
  async function beep() {
    if (!running || !ecg) return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.frequency.value = 880; gain.gain.setValueAtTime(.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime+.08);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime+.09); oscillator.onended=()=>void context.close();
    } catch { /* Visual monitoring remains available if audio is unavailable. */ }
  }
  return <section className="bedside-device" aria-label="Monitor de signos vitales">
    <header><span><i className={running ? "device-led live" : "device-led"}/> PSYKE <small>MONITOR</small></span><time>{formatClinicalTime(state.elapsed)}</time></header>
    <div className="device-status">{running ? "MONITORIZACIÓN EN CURSO" : state.status === "finished" ? "SESIÓN FINALIZADA" : "SIMULACIÓN EN PAUSA"}</div>
    <div className="device-waves">{waves.map(w => <div key={w.key} className="device-wave" style={{color:w.color}}><span>{w.label}</span><div>{sensorConnected(state,w.key) ? <svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true" className="device-signal" style={{animationDuration:`${w.seconds}s`,animationPlayState:running?"running":"paused"}}><path d={w.path} fill="none" stroke="currentColor" strokeWidth="1.8"/></svg> : <p>Sin sensor conectado</p>}</div></div>)}</div>
    <div className="device-values">{metrics.filter(m=>!channels||channels.includes(m.key==="hr"?"ecg":m.key==="sbp"?"bp":m.key)).map(m => {const value=observedVital(state,m.key); return <div key={m.key} className={value!==null && m.danger ? "device-warning" : ""} style={{color:m.color}}><span>{m.label}<small>{m.unit}</small></span><strong data-vital={m.label} aria-label={`${m.label}: ${value===null?"sin medir":m.key==="sbp"?`${Math.round(v.sbp)}/${Math.round(v.dbp)}`:Math.round(value)}`}>{value===null?"—":m.key==="sbp"?`${Math.round(v.sbp)}/${Math.round(v.dbp)}`:m.key==="temperature"?value.toFixed(1):Math.round(value)}</strong></div>;})}</div>
    <div className="device-alarm" role="status">{abnormal.length ? `⚠ Revisar ${abnormal.map(m=>m.label).join(" · ")}` : !Object.keys(state.monitoring).length ? "Selecciona Monitorizar para conectar los sensores." : "Sensores conectados · mantén la reevaluación"}</div>
    <footer><button type="button" onClick={onConnect}>⌁ Conectar sensores</button><button type="button" onClick={()=>void beep()} disabled={!running || !ecg} title="Prueba de sonido del monitor">♫ Probar sonido</button></footer>
  </section>;
}
