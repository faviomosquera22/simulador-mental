import { getPhysiology, type GynecologyCase, type SimulationRun } from "@/src/lib/gynecologySimulation";
import styles from "./room.module.css";

export default function VitalsTrend({ scenario, run }: { scenario: GynecologyCase; run: SimulationRun }) {
  const samples = Array.from({ length: 7 }, (_, index) => {
    const at = Math.round(run.elapsed * index / 6);
    return { at, ...getPhysiology(scenario, { ...run, elapsed: at, decisions: run.decisions.filter(decision => decision.at <= at) }).vitals };
  });
  const y = (value: number) => 64 - (Math.max(50, Math.min(170, value)) - 50) / 120 * 52;
  const pathFor = (key: "hr" | "sbp") => samples.map((sample, index) => `${index ? "L" : "M"}${12 + index * 44},${y(sample[key])}`).join(" ");
  return <div className={styles.vitalTrend}>
    <div className={styles.trendHeader}><span>EVOLUCIÓN DEL ESCENARIO</span><span>{Math.floor(run.elapsed / 60)} min {String(run.elapsed % 60).padStart(2, "0")} s</span></div>
    <svg viewBox="0 0 288 80" role="img" aria-label={`Evolución simulada desde el inicio: frecuencia cardíaca de ${samples[0].hr} a ${samples[6].hr} latidos por minuto; presión sistólica de ${samples[0].sbp} a ${samples[6].sbp} milímetros de mercurio.`}>
      {[16, 40, 64].map(line => <path key={line} d={`M8 ${line}H280`} stroke="currentColor" opacity=".13" strokeDasharray="2 5"/>)}
      <path d={pathFor("hr")} fill="none" stroke="#89d5bd" strokeWidth="2" strokeLinejoin="round"/>
      <path d={pathFor("sbp")} fill="none" stroke="#e6b68a" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="276" cy={y(samples[6].hr)} r="3" fill="#89d5bd"/>
      <circle cx="276" cy={y(samples[6].sbp)} r="3" fill="#e6b68a"/>
    </svg>
    <div className={styles.trendLegend}><span><i/>FC <b>{samples[0].hr} → {samples[6].hr}</b></span><span><i/>Sistólica <b>{samples[0].sbp} → {samples[6].sbp}</b></span></div>
  </div>;
}
