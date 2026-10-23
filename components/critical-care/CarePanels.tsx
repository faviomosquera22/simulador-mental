"use client";

import { doseUnits, prepareDose } from "@/src/lib/medicationPreparation";
import { useState } from "react";
import { sampleKey, type CareTarget } from "@/src/lib/criticalCareGuidance";
import { formatClinicalTime, hasStudyResult, medicationBlock, medicationExposure, medicationsFor, scenarios, type SimulationState, type SimulationEvent } from "@/src/lib/criticalCareSimulation";

type Props = { state: SimulationState; dispatch: React.Dispatch<SimulationEvent>; onGo: (target: CareTarget) => void; highlightedId?: string; query?: string };
export function MedicationPanel({ state, dispatch, onGo, highlightedId, query = "" }: Props) {
  const [category, setCategory] = useState("Todas");
  const [presentations, setPresentations] = useState<Record<string,string>>({});
  const [amounts, setAmounts] = useState<Record<string,string>>({});
  const [units, setUnits] = useState<Record<string,string>>({});
  const catalog = medicationsFor(state.scenario);
  const categories = ["Todas", ...new Set(catalog.map(m=>m.category ?? "Otros"))];
  const [prepared, setPrepared] = useState<string | null>(null);
  return <><div className="clinical-panel-title"><div><h3>Preparar y administrar medicación</h3><p>1. Lee para qué sirve. 2. Prepara la pauta. 3. Confirma y compara la respuesta del paciente.</p></div></div><div className="drug-categories" aria-label="Familias de medicamentos">{categories.map(item=><button key={item} type="button" aria-pressed={category===item} onClick={()=>{setCategory(item);setPrepared(null);}}>{item}</button>)}</div><p className="clinical-footnote">Elige fármaco y presentación. El catálogo incluye alternativas y opciones no pertinentes: la disponibilidad no equivale a indicación. Selecciona presentación y cantidad; revisa la vía antes de confirmar.</p><div className="medication-list">{catalog.filter(m=>category==="Todas"||m.category===category).filter(m => `${m.name} ${m.purpose} ${m.route}`.toLowerCase().includes(query.toLowerCase())).map(m => {
    const presentation = m.presentations?.find(p=>p.id===(presentations[m.id]??m.presentations?.[0]?.id));
    const availableUnits = doseUnits(m, presentation);
    const unit = availableUnits.includes(units[m.id]) ? units[m.id] : availableUnits[0];
    const amount = Number(amounts[m.id] ?? "");
    const dose = prepareDose(m, presentation, amount, unit);
    const doses = state.medications.filter(d => d.id === m.id);
    const latest = doses[doses.length - 1];
    const exposure = medicationExposure(state, m.id);
    const blocked = medicationBlock(state, m, presentation?.id);
    const missingAction = presentation?.route === "IV" && !state.actions.includes("iv") ? "iv" : m.requires?.find(id => !state.actions.includes(id));
    const missingStudy = m.requiresStudy && !hasStudyResult(state, m.requiresStudy) ? m.requiresStudy : undefined;
    const infusing = m.continuous && doses.some(d => d.stoppedAt === undefined && state.elapsed < d.at + m.onset + m.duration);
    return <article id={`care-medications-${m.id}`} tabIndex={-1} className={`medication-card ${exposure > 0 ? "active" : ""} ${highlightedId === m.id ? "care-highlight" : ""}`} key={m.id}>
      <div className="drug-category-label">{m.category}</div><div className="medication-title"><h4>{m.name}</h4><span>{doses.length ? `${doses.length} pauta${doses.length > 1 ? "s" : ""} registrada${doses.length > 1 ? "s" : ""}` : "Sin administrar"}</span></div>
      <p className="medication-route">Vía: {presentation?.route ?? m.route}</p>{m.presentations && <label className="drug-presentation">Presentación<select aria-label={`Presentación de ${m.name}`} disabled={prepared===m.id} value={presentation?.id??""} onChange={e=>{setPresentations(previous=>({...previous,[m.id]:e.target.value}));setAmounts(previous=>({...previous,[m.id]:""}));}}>{m.presentations.map(p=><option key={p.id} value={p.id}>{p.label} · {p.route}</option>)}</select></label>}<div className="dose-fields"><label>Cantidad a administrar<input type="number" aria-label={`Cantidad de ${m.name}`} min="0" step="any" value={amounts[m.id] ?? ""} disabled={prepared===m.id} onChange={e=>setAmounts(previous=>({...previous,[m.id]:e.target.value}))} placeholder="Escribe la cantidad"/></label><label>Unidad<select aria-label={`Unidad de ${m.name}`} value={unit} disabled={prepared===m.id} onChange={e=>setUnits(previous=>({...previous,[m.id]:e.target.value}))}>{availableUnits.map(u=><option key={u}>{u}</option>)}</select></label></div>{dose && <p className="dose-calculation">Cantidad preparada: <strong>{dose.label}</strong></p>}<p>{m.purpose}</p>
      <div className="medication-timing"><span>Comienza tras {m.onset} s simulados</span><span>Efecto aproximado: {m.duration} s</span></div>
      {latest && <div className="medication-effect"><span>{state.elapsed < latest.at + m.onset ? exposure > 0 ? "Nueva pauta en espera; sigue el efecto de la anterior" : `Esperando inicio: ${latest.at + m.onset - state.elapsed} s` : exposure > 0 ? "Efecto presente: observa los signos antes de repetir" : "El efecto de esta pauta ya terminó"}</span><progress aria-label={`Efecto simulado de ${m.name}`} value={Math.min(1, exposure)} max={1}/><small>Última administración: {formatClinicalTime(latest.at)} · {latest.dose?.label} · {latest.route}</small></div>}
      {m.adverse && <p className="medication-caution">Qué vigilar: {m.adverse.title.toLowerCase()}.</p>}
      {blocked && <div className="care-blocker"><p>{blocked}</p>{state.status === "running" && missingAction && <button type="button" onClick={() => onGo({ panel: "interventions", id: missingAction })}>Completar: {scenarios[state.scenario].actions.find(a => a.id === missingAction)?.label} →</button>}{state.status === "running" && !missingAction && missingStudy && <button type="button" onClick={() => onGo({ panel: "tests", id: missingStudy })}>Ir a la prueba requerida →</button>}</div>}
      {prepared === m.id ? <div className="medication-confirm" role="region" aria-label={`Preparación de ${m.name}`}><b>{doses.length ? "Comprueba antes de repetir" : "Confirma lo que vas a hacer"}</b><p>Vas a administrar <strong>{dose?.label}</strong> de <strong>{m.name}</strong> con {presentation?.label ?? m.route} por {presentation?.route.toLowerCase() ?? m.route.toLowerCase()}. {doses.length ? "Ya hay administraciones previas: repetir puede acumular efectos y provocar complicaciones." : "La preparación todavía no modifica los signos."}</p><p>Después de confirmar, observa el panel «Respuesta del paciente». No esperes un cambio instantáneo.</p><div className="medication-buttons"><button type="button" disabled={Boolean(blocked) || !dose} onClick={() => { dispatch({ type: "medication", id: m.id, presentationId: presentation?.id, amount, unit }); setPrepared(null); }}>Confirmar administración de {m.name}</button><button type="button" className="care-secondary" onClick={() => setPrepared(null)}>Cancelar preparación</button></div></div> : <div className="medication-buttons"><button type="button" disabled={Boolean(blocked) || !dose} onClick={() => setPrepared(m.id)}>{doses.length ? `Preparar otra pauta de ${m.name}` : `Preparar ${m.name}`}</button></div>}
      {infusing && <button type="button" className="stop-infusion care-stop" disabled={state.status !== "running"} onClick={() => dispatch({ type: "stop-medication", id: m.id })}>Detener aporte de {m.name}</button>}
    </article>;
  })}</div><p className="clinical-footnote">La cantidad y la vía se conservan en el registro. La respuesta fisiológica es cualitativa: no valida que la dosis elegida sea correcta. Los tiempos están acelerados.</p></>;
}

export function StudiesPanel({ state, dispatch, highlightedId, readSamples, onRead, query = "" }: Omit<Props, "onGo"> & { readSamples: string[]; onRead: (id: string, at: number) => void }) {
  const definitions = scenarios[state.scenario].studies.filter(study => study.label.toLowerCase().includes(query.toLowerCase()));
  const groups = [{ kind: "bedside", title: "Pruebas rápidas junto al paciente", detail: "Por ejemplo, glucemia, ECG o valoración de perfusión." }, { kind: "other", title: "Laboratorio e imagen", detail: "Toman más tiempo. Solicita y continúa la atención mientras esperas." }];
  return <><div className="clinical-panel-title"><div><h3>Solicitar, esperar y leer el resultado</h3><p>La solicitud no entrega el resultado al instante. Cada muestra conserva los signos del momento en que la pediste.</p></div></div>{groups.map(group => {
    const studies = definitions.filter(study => group.kind === "bedside" ? study.kind === "bedside" : study.kind !== "bedside");
    if (!studies.length) return null;
    return <section className="care-study-group" key={group.kind}><h4>{group.title}</h4><p>{group.detail}</p><div className="clinical-studies">{studies.map(study => {
      const requests = state.studies.filter(s => s.id === study.id);
      const latest = requests[requests.length - 1];
      const pending = latest && latest.readyAt > state.elapsed;
      const available = requests.filter(s => s.readyAt <= state.elapsed).slice().reverse();
      return <article id={`care-tests-${study.id}`} tabIndex={-1} className={highlightedId === study.id ? "care-highlight" : ""} key={study.id}><div><b>{study.label}</b><span className="care-study-status">{pending ? "En proceso" : available.length ? "Resultado disponible" : "Sin solicitar"}</span></div>
        {pending && <div className="study-wait"><progress aria-label={`Espera de ${study.label}`} value={state.elapsed - latest.requestedAt} max={study.delay}/><p>Faltan {latest.readyAt - state.elapsed} s simulados. Puedes seguir con otros cuidados. En pausa, la espera también se detiene.</p></div>}
        <button type="button" className="care-study-request" disabled={state.status !== "running" || Boolean(pending)} onClick={() => dispatch({ type: "study", id: study.id })}>{pending ? `Esperando ${study.label}` : requests.length ? `Tomar nueva muestra de ${study.label}` : `Solicitar ${study.label}`} {!pending && <small>· {study.delay} s simulados</small>}</button>
        {available.map((r, i) => <div className="study-sample" key={r.requestedAt}><small>Muestra tomada {formatClinicalTime(r.requestedAt)} · disponible {formatClinicalTime(r.readyAt)}{i === 0 ? " · más reciente" : " · muestra anterior"}</small>{readSamples.includes(sampleKey(study.id, r.requestedAt)) ? <div className="care-study-result"><b>Resultado de esta muestra</b><p>{r.result}</p><small>Para comprobar la respuesta a un tratamiento, toma una nueva muestra; este resultado no se actualiza solo.</small></div> : <button type="button" className="care-read-result" onClick={() => onRead(study.id, r.requestedAt)}>Leer resultado de {study.label}</button>}</div>)}
      </article>;
    })}</div></section>;
  })}</>;
}

export function ComplicationPanel({ state, dispatch, onGo }: Props) {
  const active = state.complications.filter(c => c.resolvedAt === undefined);
  if (active.length === 0) return null;
  return <section className="complication-panel" aria-label="Complicaciones del caso"><h3>Atención: hay una complicación activa</h3>{active.map(c => <article id={`care-alert-${c.id}`} key={c.id} role={c.acknowledged ? undefined : "alert"}><div><strong>{c.title}</strong><time>{formatClinicalTime(c.at)}</time></div><p>{c.message}</p><div className="care-alert-buttons"><button type="button" onClick={() => onGo({ panel: c.id === "neuroglycopenia" ? "tests" : "medications", id: c.id === "neuroglycopenia" ? "glucose" : undefined })}>{c.id === "neuroglycopenia" ? "Revisar glucemia" : "Revisar medicación y respuesta"}</button><button type="button" disabled={c.acknowledged || state.status !== "running"} onClick={() => dispatch({ type: "acknowledge", id: c.id })}>{c.acknowledged ? "Leída · la complicación sigue activa" : "He leído esta alerta"}</button></div></article>)}<p className="complication-note">Marcar «He leído» solo registra tu revisión. La alerta permanece hasta que cambie la evolución; leerla no trata al paciente.</p></section>;
}
