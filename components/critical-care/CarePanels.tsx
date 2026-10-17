"use client";
import { formatClinicalTime, medicationBlock, medicationExposure, medicationsFor, scenarios, type SimulationState, type SimulationEvent } from "@/src/lib/criticalCareSimulation";

type Props = { state: SimulationState; dispatch: React.Dispatch<SimulationEvent> };
export function MedicationPanel({ state, dispatch }: Props) {
  const medications = medicationsFor(state.scenario);
  return <><div className="clinical-panel-title"><div><h3>Medicación y respuesta</h3><p>Selecciona la pauta indicada del escenario y reevalúa el monitor antes de repetir.</p></div></div><div className="clinical-hint"><p>Exposiciones educativas, sin cálculo de dosis real. Los tiempos están acelerados. Una administración puede mejorar un parámetro y empeorar otro; las infusiones se pueden detener y su efecto cede gradualmente.</p></div><div className="medication-list">{medications.map(m => {
    const doses = state.medications.filter(d => d.id === m.id);
    const latest = doses[doses.length - 1];
    const exposure = medicationExposure(state, m.id);
    const blocked = medicationBlock(state, m);
    const infusing = m.continuous && doses.some(d => d.stoppedAt === undefined && state.elapsed < d.at + m.onset + m.duration);
    return <article className={exposure > 0 ? "medication-card active" : "medication-card"} key={m.id}>
      <div className="medication-title"><h4>{m.name}</h4><span>{doses.length}/{m.maxDoses} exposiciones</span></div><p className="medication-route">{m.route}</p><p>{m.purpose}</p><div className="medication-timing"><span>Inicio: {m.onset} s</span><span>Duración: {m.duration} s</span></div>
      {latest && <div className="medication-effect"><span>{state.elapsed < latest.at + m.onset ? "Esperando inicio de efecto" : exposure > 0 ? "Efecto activo · observar tendencia" : "Exposición finalizada"}</span><progress value={Math.min(1, exposure)} max={1}/><small>Última administración: {formatClinicalTime(latest.at)}</small></div>}
      {m.adverse && <p className="medication-caution">Vigilar: {m.adverse.title.toLowerCase()}.</p>}
      {blocked && <p className="medication-block">{blocked}</p>}
      <div className="medication-buttons"><button type="button" disabled={Boolean(blocked)} onClick={() => dispatch({ type: "medication", id: m.id })}>{doses.length ? "Repetir pauta simulada" : "Administrar pauta simulada"}</button>{infusing && <button type="button" className="stop-infusion" disabled={state.status !== "running"} onClick={() => dispatch({ type: "stop-medication", id: m.id })}>Detener infusión</button>}</div>
    </article>;
  })}</div></>;
}
export function StudiesPanel({ state, dispatch, bedside = false }: Props & { bedside?: boolean }) {
  const studies = scenarios[state.scenario].studies.filter(s => bedside ? s.kind === "bedside" : s.kind !== "bedside");
  return <><div className="clinical-panel-title"><div><h3>{bedside ? "Pruebas a pie de cama" : "Exámenes y resultados"}</h3><p>Los resultados corresponden al momento de tomar la muestra. Puedes repetir la prueba y comparar.</p></div></div><div className="clinical-studies">{studies.map(study => {
    const requests = state.studies.filter(s => s.id === study.id);
    const latest = requests[requests.length - 1];
    const pending = latest && latest.readyAt > state.elapsed;
    const available = requests.filter(s => s.readyAt <= state.elapsed).slice().reverse();
    return <article key={study.id}><div><b>{study.label}</b><button type="button" disabled={state.status !== "running" || Boolean(pending)} onClick={() => dispatch({ type: "study", id: study.id })}>{pending ? `En proceso · ${latest.readyAt - state.elapsed} s` : requests.length ? `Repetir · ${study.delay} s` : `Solicitar · ${study.delay} s`}</button></div>{available.map((r, i) => <div className="study-sample" key={r.requestedAt}><small>Muestra {formatClinicalTime(r.requestedAt)} · disponible {formatClinicalTime(r.readyAt)}{i === 0 ? " · más reciente" : ""}</small><p>{r.result}</p></div>)}</article>;
  })}</div>{studies.length === 0 && <p className="clinical-footnote">Este caso no incluye pruebas en esta categoría.</p>}</>;
}
export function ComplicationPanel({ state, dispatch }: Props) {
  const active = state.complications.filter(c => c.resolvedAt === undefined);
  if (active.length === 0) return null;
  return <section className="complication-panel" aria-label="Complicaciones del caso"><h3>Complicaciones activas</h3>{active.map(c => <article key={c.id} role={c.acknowledged ? undefined : "alert"}><div><strong>{c.title}</strong><time>{formatClinicalTime(c.at)}</time></div><p>{c.message}</p><button type="button" disabled={c.acknowledged || state.status !== "running"} onClick={() => dispatch({ type: "acknowledge", id: c.id })}>{c.acknowledged ? "Revisada · continúa activa" : "Registrar revisión de alerta"}</button></article>)}<p className="complication-note">Revisar la alerta no corrige su causa. La evolución determina cuándo deja de estar activa.</p></section>;
}
