"use client";
import { Activity } from "./icons";
import { clinicalAlerts, formatClinicalTime, type SimulationState } from "@/src/lib/criticalCareSimulation";

export function ClinicalMonitor({ state }: { state: SimulationState }) {
  const { vitals: v } = state;
  const running = state.status === "running";
  const alerts = clinicalAlerts(state);
  const metrics = [
    { label: "FC", unit: "lpm", value: Math.round(v.hr), color: "mint", danger: v.hr > 120 },
    { label: "SpO₂", unit: "%", value: Math.round(v.spo2), color: "cyan", danger: v.spo2 < 92 },
    { label: "PA", unit: "mmHg", value: `${Math.round(v.sbp)}/${Math.round(v.dbp)}`, color: "peach", danger: v.sbp < 90 },
    { label: "FR", unit: "rpm", value: Math.round(v.rr), color: "cream", danger: v.rr > 30 },
  ];
  const chart = (key: "hr" | "sbp" | "spo2") => state.history.map((p, i) => `${8 + i / Math.max(1, state.history.length - 1) * 324},${100 - (p[key] - 40) / 160 * 90}`).join(" ");
  return (
    <section className="clinical-monitor" aria-label="Monitor de signos vitales">
      <header><span><Activity size={16}/> FISIOLOGÍA EN VIVO</span><span className={running ? "live-status" : ""}>{running ? "EN CURSO" : state.status === "finished" ? "FINALIZADA" : "EN PAUSA"}</span></header>
      <div className="monitor-content">
        <div className="wave-label"><span>ECG · DII · TRAZADO ILUSTRATIVO</span><span>{formatClinicalTime(state.elapsed)}</span></div>
        <div className="ecg-window" aria-hidden="true"><svg viewBox="0 0 600 60" preserveAspectRatio="none" className={running ? "ecg-trace moving" : "ecg-trace"} style={{ animationDuration: `${60 / v.hr * 8}s` }}><path d={Array.from({ length: 12 }, (_, i) => { const x = i * 50; return `M${x} 35 l9 0 3 -3 4 6 4 -3 3 0 2 -23 3 38 3 -15 5 0 4 -4 4 4 6 0`; }).join(" ")} fill="none" stroke="currentColor" strokeWidth="1.6"/></svg></div>
        <div className="vital-grid">{metrics.map(m => <div key={m.label} className={`vital ${m.color} ${m.danger ? "vital-alert" : ""}`}><span>{m.label} <small>/ {m.unit}</small></span><strong data-vital={m.label}>{m.value}</strong></div>)}</div>
        <div className="monitor-secondary"><span>Temperatura <b>{v.temperature.toFixed(1)} °C</b></span><span>EtCO₂ <b>{Math.round(v.etco2)} mmHg</b></span></div>
        {state.scenario !== "obstetric" && <div className="monitor-extra"><span>Glucemia <b data-vital="glucose">{Math.round(v.glucose)} mg/dL</b></span><span>Glasgow <b>{Math.round(v.gcs)}/15</b></span><span>PAM <b>{Math.round((v.sbp + v.dbp * 2) / 3)} mmHg</b></span></div>}
        {state.scenario === "obstetric" && <div className="obstetric-metrics"><div><span>Índice de choque</span><strong>{(v.hr / v.sbp).toFixed(2)}</strong><small>FC / presión sistólica</small></div><div><span>Pérdida acumulada</span><strong>{Math.round(v.bloodLoss)} <small>mL</small></strong><small>Estimación del escenario</small></div></div>}
        <div className="monitor-alerts" aria-label="Alertas actuales">{alerts.length ? alerts.map(a => <p key={a}><span/> {a}</p>) : <p className="stable"><span/> Sin alertas de signos en este momento. Continúa la reevaluación.</p>}</div>
        <div className="trend-heading"><span>EVOLUCIÓN DEL ESCENARIO</span><span>{formatClinicalTime(state.elapsed)}</span></div>
        <svg viewBox="0 0 340 110" className="trend-chart" role="img" aria-label="Tendencia de frecuencia cardíaca, presión sistólica y saturación"><path d="M8 25H332M8 55H332M8 85H332" stroke="#385453" strokeDasharray="3 5"/>{(["hr", "sbp", "spo2"] as const).map((key, i) => <polyline key={key} points={chart(key)} fill="none" stroke={["#97d9bc", "#e9b68e", "#96d8e9"][i]} strokeWidth="2"/>)}</svg>
        <div className="trend-legend"><span>● FC</span><span>● Sistólica</span><span>● SpO₂</span><small>40–200 · últimos 6 min</small></div>
      </div>
    </section>
  );
}
