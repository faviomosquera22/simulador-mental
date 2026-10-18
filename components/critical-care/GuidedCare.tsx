"use client";

import { nextGuidedTask, type CareTarget, type DecisionSnapshot } from "@/src/lib/criticalCareGuidance";
import { formatClinicalTime, type SimulationState, type Vitals } from "@/src/lib/criticalCareSimulation";
import { observedVital, vitalSensor } from "@/src/lib/criticalCareObservation";
import { ArrowRight, CheckCircle2 } from "./icons";

type Props = { state: SimulationState; onGo: (target: CareTarget) => void };
export function NextStep({ state, onGo, readSamples }: Props & { readSamples: string[] }) {
  const task = nextGuidedTask(state, readSamples);
  return <section className="care-next-step" aria-label="Orientación para el siguiente paso">
    <div className="care-step-label">{task.waiting ? "MIENTRAS ESPERAS EL RESULTADO" : "SIGUIENTE PASO SUGERIDO"}</div>
    <h3>{task.title}</h3><p>{task.why}</p>
    <button type="button" onClick={() => onGo(task.target)}>{task.cta}<ArrowRight size={16}/></button>
    <small>Esta guía orienta la práctica. Puedes realizar otros cuidados sin seguir una secuencia obligatoria.</small>
  </section>;
}

export function DecisionResponse({ state, snapshot, onReassess }: { state: SimulationState; snapshot: DecisionSnapshot | null; onReassess: () => void }) {
  const elapsed = snapshot ? state.elapsed - snapshot.at : 0;
  const remaining = snapshot ? Math.max(0, snapshot.observeAfter - elapsed) : 0;
  const metrics: { key: keyof Vitals; label: string; unit: string }[] = [
    { key: "hr", label: "Frecuencia cardíaca", unit: "lpm" },
    { key: "spo2", label: "Saturación", unit: "%" },
    { key: "sbp", label: "Presión sistólica", unit: "mmHg" },
    { key: "rr", label: "Respiración", unit: "rpm" },
  ];
  return <section className="decision-response" id="care-response" aria-label="Respuesta del paciente" tabIndex={-1}>
    <div className="care-step-label">OBSERVAR Y REEVALUAR</div>
    <h3>{snapshot ? "Esto ocurrió después de tu decisión" : "¿Cómo sé si mi decisión ayudó?"}</h3>
    {snapshot ? <><p className="decision-response-action"><b>{snapshot.title}</b><span>Registrada a {formatClinicalTime(snapshot.at)}</span></p><p>{snapshot.explanation}</p><div className="response-status" role="status">{state.status === "paused" ? "En pausa: los cambios y esta espera están detenidos." : remaining ? `Respuesta en evolución. Observa durante ${remaining} s más antes de valorar la tendencia.` : "Ya puedes comparar la tendencia y registrar tu reevaluación."}</div>
      <dl className="response-comparison">{metrics.map(metric => {
        const sensor = vitalSensor[metric.key];
        const before = sensor && snapshot.monitoring?.[sensor] !== undefined ? Math.round(snapshot.before[metric.key]) : null;
        const reading = observedVital(state, metric.key);
        const current = reading === null ? null : Math.round(reading);
        const difference = before !== null && current !== null ? current - before : null;
        return <div key={metric.key}><dt>{metric.label}</dt><dd><span>{before ?? "—"}</span><span aria-hidden="true">→</span><strong>{current ?? "—"}</strong><small>{metric.unit}</small></dd><p>{difference === null ? "Conecta el sensor para comparar lecturas medidas" : difference === 0 ? "Sin cambio visible todavía" : `${difference > 0 ? "+" : ""}${difference} desde tu decisión`}</p></div>;
      })}</dl><p className="response-note">Son cambios observados, no un efecto aislado del fármaco. También influyen el tiempo y los otros cuidados. Para confirmar glucemia, solicita una nueva muestra.</p></> : <p>Después de un cuidado, una medicación o un ajuste, aquí verás los signos <b>antes y ahora</b>. Explorar y pedir una prueba te dan información; el tratamiento puede cambiar la evolución.</p>}
    <button type="button" className="clinical-next" disabled={state.status !== "running"} onClick={onReassess}><CheckCircle2 size={16}/> Registrar reevaluación de signos</button>
    {state.reassessments.length > 0 && <p className="response-review-note">Última reevaluación registrada: {formatClinicalTime(state.reassessments[state.reassessments.length - 1].at)}. Revisar los signos no los mejora por sí solo.</p>}
  </section>;
}
