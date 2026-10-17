"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Check, CheckCircle2, ClipboardList, HeartPulse, Pause, Play, RotateCcw, ShieldCheck, Stethoscope, Wind } from "./icons";
import { assessmentFinding, createSimulation, criticalCareCaseIds, formatClinicalTime, hasStudyResult, scenarios, simulationReducer, type ScenarioId, type SimulationEvent, type Ventilator } from "@/src/lib/criticalCareSimulation";
import { caseObjectives, decisionSnapshot, priorityComplete, sampleKey, type CarePanel, type CareTarget, type DecisionSnapshot } from "@/src/lib/criticalCareGuidance";
import { PatientView } from "./PatientView";
import { ComplicationPanel, MedicationPanel, StudiesPanel } from "./CarePanels";
import { DecisionResponse, NextStep } from "./GuidedCare";
import { ClinicalMonitor } from "./ClinicalMonitor";
import { medicationsFor } from "@/src/lib/criticalCareSimulation";
import "./clinical.css";

const panelLabels: Record<CarePanel, string> = {
  assessment: "Explorar paciente", interventions: "Cuidados y soporte", medications: "Medicación",
  tests: "Pruebas y resultados", ventilator: "Ventilador", record: "Registro",
};
const initialVentilator: Ventilator = { fio2: 30, peep: 3, rate: 10, volume: 350 };

export function ClinicalSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, "ventilation", createSimulation);
  const [tab, setTab] = useState<CarePanel>("assessment");
  const [zone, setZone] = useState<number | null>(null);
  const [draft, setDraft] = useState<Ventilator>(initialVentilator);
  const [confirmReset, setConfirmReset] = useState<ScenarioId | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [guided, setGuided] = useState(true);
  const [readSamples, setReadSamples] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<string>();
  const [snapshot, setSnapshot] = useState<DecisionSnapshot | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scenario = scenarios[state.scenario];
  const running = state.status === "running";
  const finished = state.status === "finished";
  const panels: CarePanel[] = ["assessment", "interventions", "medications", "tests", ...(state.scenario === "ventilation" ? ["ventilator" as const] : []), "record"];
  const completed = scenario.priorities.filter(id => priorityComplete(state, id));
  const pending = scenario.priorities.filter(id => !priorityComplete(state, id));
  const readyResults = state.studies.filter(s => s.readyAt <= state.elapsed);
  const unread = readyResults.filter(s => !readSamples.includes(sampleKey(s.id, s.requestedAt)));
  const activeComplications = state.complications.filter(c => c.resolvedAt === undefined);
  const actionLabel = (id: string) => id.startsWith("med:") ? medicationsFor(state.scenario).find(m => m.id === id.slice(4))?.name : id === "ventilator" ? "Ajustar soporte y reevaluar respuesta" : id.startsWith("study:") ? scenario.studies.find(a => a.id === id.slice(6))?.label : scenario.actions.find(a => a.id === id)?.label;

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  function reveal(id: string) {
    requestAnimationFrame(() => {
      const element = document.getElementById(id) ?? panelRef.current;
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
  }
  function readResult(id: string, at: number) {
    setReadSamples(previous => [...new Set([...previous, sampleKey(id, at)])]);
  }
  function go(target: CareTarget) {
    if (target.id?.startsWith("alert:")) { reveal(`care-alert-${target.id.slice(6)}`); return; }
    if (target.id === "response") { if (!snapshot) setTab("record"); reveal("care-response"); return; }
    setTab(target.panel);
    setHighlighted(target.id);
    if (target.read && target.id) {
      const samples = readyResults.filter(s => s.id === target.id);
      const latest = samples[samples.length - 1];
      if (latest) readResult(latest.id, latest.requestedAt);
    }
    if (target.zone !== undefined && running) {
      setZone(target.zone);
      dispatch({ type: "assess", zone: target.zone });
      reveal("care-current-finding");
    } else reveal(target.id ? `care-${target.panel}-${target.id}` : "care-work-panel");
  }
  function perform(event: SimulationEvent) {
    const next = simulationReducer(state, event);
    const tookAction = event.type === "action" && next.actions.length > state.actions.length;
    const gaveMedication = event.type === "medication" && next.medications.length > state.medications.length;
    const changedSupport = (event.type === "ventilator" || event.type === "stop-medication") && next !== state;
    if (tookAction || gaveMedication || changedSupport) {
      if (event.type === "action" || event.type === "medication" || event.type === "stop-medication" || event.type === "ventilator") {
        setSnapshot(decisionSnapshot(state, event.type, "id" in event ? event.id : undefined));
        reveal("care-response");
      }
    }
    dispatch(event);
  }
  function startOrPause() {
    dispatch({ type: running ? "pause" : "start" });
    if (!running) reveal(window.matchMedia("(max-width: 760px)").matches ? "care-tools" : "care-workspace");
  }
  function reset(id: ScenarioId) {
    dispatch({ type: "reset", scenario: id });
    setTab("assessment"); setZone(null); setDraft(initialVentilator); setConfirmReset(null);
    setReadSamples([]); setSnapshot(null); setHighlighted(undefined); setLibraryOpen(false);
  }
  function requestReset(id: ScenarioId) {
    if (state.status === "ready" || finished) reset(id);
    else { dispatch({ type: "pause" }); setConfirmReset(id); }
  }
  function exportRecord() {
    const content = [
      `PRÁCTICA EDUCATIVA PSYKE — ${scenario.title}`, `Duración: ${formatClinicalTime(state.elapsed)}`,
      ...state.log.map(e => `${formatClinicalTime(e.at)} ${e.text}`), "",
      `Signos finales: FC ${Math.round(state.vitals.hr)} · PA ${Math.round(state.vitals.sbp)}/${Math.round(state.vitals.dbp)} · SpO₂ ${Math.round(state.vitals.spo2)}%`,
      `Reevaluaciones: ${state.reassessments.length}`, `Pendientes: ${pending.map(actionLabel).join(", ") || "Ninguna prioridad del ejercicio"}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `practica-${state.scenario}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="clinical-app guided-clinical-app">
    <div className="clinical-breadcrumb"><Link href="/dashboard">Mi aprendizaje</Link><span>/</span><span>Cuidados críticos</span></div>
    <header className="clinical-heading"><div><p className="clinical-eyebrow">PSYKE · PRÁCTICA CON PACIENTE SIMULADO</p><h1>Cuidados críticos</h1><p>Observa al paciente, elige un cuidado y comprueba su respuesta.</p></div><Link className="clinical-module-link" href="/clinical-room"><HeartPulse size={18}/> Sala obstétrica <ArrowRight size={16}/></Link></header>

    <section className="care-case-header" aria-label="Caso seleccionado">
      <div><span className="clinical-case-tag">CASO {String(criticalCareCaseIds.indexOf(state.scenario) + 1).padStart(2, "0")} · FICTICIO</span><h2>{scenario.title}</h2><p>{caseObjectives[state.scenario]}</p></div>
      <button type="button" className="care-secondary" aria-expanded={libraryOpen} aria-controls="care-case-library" onClick={() => setLibraryOpen(value => !value)}>{libraryOpen ? "Ocultar casos" : "Cambiar caso"}</button>
    </section>
    {libraryOpen && <section className="case-library" id="care-case-library" aria-label="Biblioteca de cuidados críticos"><h3>Elige qué quieres practicar</h3><div className="clinical-case-picker">{criticalCareCaseIds.map((id, index) => <button type="button" key={id} aria-pressed={state.scenario === id} onClick={() => state.scenario === id ? setLibraryOpen(false) : requestReset(id)}>{id === "ventilation" || id === "asthma" ? <Wind size={18}/> : <Activity size={18}/>}<span className="case-button-label">{scenarios[id].title}</span><span>{String(index + 1).padStart(2, "0")}</span></button>)}</div></section>}
    {confirmReset && <section className="clinical-confirm" role="alert"><h3>Tu práctica quedó en pausa</h3><p>Cambiar o reiniciar el caso borra esta sesión. Puedes conservarla y descargar el registro antes de salir.</p><div><button type="button" onClick={() => reset(confirmReset)}>Confirmar y comenzar de nuevo</button><button type="button" onClick={() => setConfirmReset(null)}>Conservar práctica en pausa</button></div></section>}

    {state.status === "ready" && <section className="care-onboarding" aria-label="Cómo usar el simulador"><div><p className="clinical-eyebrow">ANTES DE EMPEZAR</p><h2>Tu primera atención, en cuatro movimientos</h2><p>El reloj está detenido. Lee el caso y pulsa «Iniciar práctica» cuando estés listo.</p></div><ol><li><b>1. Explora</b><span>Toca un punto del paciente o un botón con nombre para leer el hallazgo.</span></li><li><b>2. Decide</b><span>Abre Cuidados, Medicación o Pruebas. Cada botón indica lo que hará.</span></li><li><b>3. Observa</b><span>Compara los signos antes y después. Los tratamientos tardan en actuar.</span></li><li><b>4. Reevalúa</b><span>Registra la respuesta, revisa las alertas y pide otra muestra si hace falta.</span></li></ol></section>}

    <section className="care-session-bar" aria-label="Controles de la práctica"><label className="care-guide-toggle"><input type="checkbox" checked={guided} onChange={e => setGuided(e.target.checked)}/><span>Mostrar guía de siguiente paso</span></label><div className="clinical-controls"><time className="clinical-clock">{formatClinicalTime(state.elapsed)}</time>{!finished && <button type="button" className="clinical-start" disabled={Boolean(confirmReset)} onClick={startOrPause}>{running ? <Pause size={16}/> : <Play size={16}/>} {running ? "Pausar" : state.status === "ready" ? "Iniciar práctica" : "Continuar práctica"}</button>}<button type="button" className="clinical-reset" onClick={() => requestReset(state.scenario)}><RotateCcw size={15}/> Reiniciar</button></div></section>
    {state.status === "paused" && <div className="care-pause-notice" role="status">Estás en pausa: el paciente, los fármacos y las pruebas no avanzan. Puedes leer resultados; pulsa «Continuar práctica» para intervenir.</div>}

    <div className="clinical-live-strip" aria-label="Signos vitales continuos"><span className="strip-label"><span className={running ? "status-dot active" : "status-dot"}/>{running ? "EN VIVO" : finished ? "FINALIZADA" : "EN PAUSA"}</span><span>FC <b>{Math.round(state.vitals.hr)}</b><small>lpm</small></span><span>SpO₂ <b>{Math.round(state.vitals.spo2)}</b><small>%</small></span><span>PA <b>{Math.round(state.vitals.sbp)}/{Math.round(state.vitals.dbp)}</b></span><span>FR <b>{Math.round(state.vitals.rr)}</b><small>rpm</small></span><button type="button" className="care-jump-patient" onClick={() => reveal("care-patient")}>Ver paciente</button><button type="button" className="care-jump-tools" onClick={() => reveal("care-work-panel")}>Atender →</button><button type="button" className="care-jump-monitor" onClick={() => { document.getElementById("care-monitor-details")?.setAttribute("open", ""); reveal("care-monitor-details"); }}>Ampliar monitor</button></div>
    <div className="clinical-workspace care-workspace" id="care-workspace" tabIndex={-1}>
      <div className="care-patient-column" id="care-patient" tabIndex={-1}>
        <section className="clinical-patient-card"><header><div><p className="clinical-eyebrow">TU PACIENTE</p><h2>{scenario.patient}</h2><p>{scenario.subtitle}</p></div><span className="clinical-case-tag">{running ? "En atención" : finished ? "Finalizada" : "En pausa"}</span></header><p className="care-presentation">{scenario.presentation}</p><div className="patient-caption"><span>EXPLORA UNA ZONA PARA CONOCER EL HALLAZGO</span></div>
          <PatientView scenario={state.scenario} garment={0} selectedZone={zone} assessed={state.assessed} running={running} oxygen={state.actions.includes("oxygen")} onAssess={i => go({ panel: "assessment", zone: i })} breathingRate={state.vitals.rr} vitals={state.vitals} iv={state.actions.includes("iv")} fluids={state.actions.includes("fluids")}/>
          <div className="patient-zone-buttons">{scenario.zones.map((z, i) => <button type="button" key={z.label} disabled={!running} onClick={() => go({ panel: "assessment", zone: i })} aria-pressed={zone === i}><span>{state.assessed.includes(i) ? <CheckCircle2 size={17}/> : `0${i + 1}`}</span>{z.label}</button>)}</div><div className="patient-status"><span><ShieldCheck size={14}/> Tocar una zona solo explora</span><span>{state.assessed.length}/4 revisadas</span></div>
        </section>
        <details id="care-monitor-details" className="care-monitor-details"><summary>Monitor completo y tendencias <span>FC: pulso · SpO₂: saturación · PA: presión · FR: respiración</span></summary><ClinicalMonitor state={state}/></details>
      </div>
      <div className="care-decision-column" id="care-tools" tabIndex={-1}>
        {guided && running && <NextStep state={state} readSamples={readSamples} onGo={go}/>}
        <ComplicationPanel state={state} dispatch={perform} onGo={go}/>
        {(snapshot || tab === "record") && <DecisionResponse state={state} snapshot={snapshot} onReassess={() => { perform({ type: "reassess" }); reveal("care-response"); }}/> }
        <section className="clinical-decision-card"><nav className="clinical-tabs" role="tablist" aria-label="Herramientas para atender al paciente">{panels.map((panel, index) => <button type="button" role="tab" key={panel} id={`tab-${panel}`} aria-selected={tab === panel} tabIndex={tab === panel ? 0 : -1} aria-controls="care-work-panel" onClick={() => { setTab(panel); setHighlighted(undefined); }} onKeyDown={e => {
          let next: CarePanel | undefined;
          if (e.key === "ArrowRight") next = panels[(index + 1) % panels.length];
          if (e.key === "ArrowLeft") next = panels[(index - 1 + panels.length) % panels.length];
          if (e.key === "Home") next = panels[0]; if (e.key === "End") next = panels[panels.length - 1];
          if (next) { e.preventDefault(); setTab(next); document.getElementById(`tab-${next}`)?.focus(); }
        }}>{panelLabels[panel]}{panel === "tests" && unread.length > 0 && <small aria-label={`${unread.length} resultados sin leer`}>{unread.length}</small>}</button>)}</nav>
          <div role="tabpanel" id="care-work-panel" ref={panelRef} tabIndex={-1} aria-labelledby={`tab-${tab}`} className="clinical-panel">
            {unread.length > 0 && tab !== "tests" && <button type="button" className="care-results-notice" onClick={() => go({ panel: "tests", id: unread[0].id, read: true })}>{unread.length} resultado{unread.length > 1 ? "s" : ""} disponible{unread.length > 1 ? "s" : ""} sin leer · Abrir →</button>}
            {!running && !finished && <div className="clinical-hint"><p>{state.status === "ready" ? "Primero pulsa «Iniciar práctica». Después podrás explorar e intervenir; preparar una medicación no la administra todavía." : "La atención está en pausa. Puedes consultar los resultados y el registro. Continúa para realizar un cuidado o administrar."}</p></div>}
            {tab === "assessment" && <><PanelTitle icon={<Stethoscope size={20}/>} title="Explorar no es tratar" subtitle="Toca una zona de la imagen o uno de estos botones. Lee el hallazgo y decide qué cuidado necesitas."/>
              <div className="assessment-list">{scenario.zones.map((z, i) => <button type="button" key={z.label} disabled={!running} className={zone === i ? "selected" : ""} onClick={() => go({ panel: "assessment", zone: i })}><span className="assessment-number">{state.assessed.includes(i) ? <Check size={16}/> : `0${i + 1}`}</span><div><b>Explorar {z.label}</b><small>{state.assessed.includes(i) ? "Hallazgo revisado · puedes volver a explorar" : "Abre el hallazgo de esta zona"}</small></div><ArrowRight size={16}/></button>)}</div>
              {zone !== null && state.assessed.includes(zone) && <div className="patient-finding" id="care-current-finding" tabIndex={-1} role="status"><b>Hallazgo de zona {zone + 1} · {scenario.zones[zone].label}</b><p>{assessmentFinding(state, zone)}</p><button type="button" className="clinical-next" onClick={() => go({ panel: "interventions" })}>Elegir un cuidado para este paciente <ArrowRight size={16}/></button></div>}
            </>}
            {tab === "interventions" && <><PanelTitle icon={<HeartPulse size={20}/>} title="Realizar cuidados y soporte" subtitle="Lee el propósito y pulsa el nombre del cuidado para realizarlo una vez. Si falta un requisito, usa su enlace."/><div className="care-actions">{scenario.actions.map(action => {
              const done = state.actions.includes(action.id);
              const missing = action.requires?.filter(id => !state.actions.includes(id)) ?? [];
              const missingStudy = action.requiresStudy && !hasStudyResult(state, action.requiresStudy) ? action.requiresStudy : undefined;
              return <article key={action.id} id={`care-interventions-${action.id}`} tabIndex={-1} className={`${done ? "care-action-done" : ""} ${highlighted === action.id ? "care-highlight" : ""}`}><h4>{action.label}</h4><p>{action.description}</p>{missing.length > 0 && <div className="care-blocker"><p>Para habilitar este cuidado:</p>{missing.map(id => <button type="button" key={id} onClick={() => go({ panel: "interventions", id })}>Completar {actionLabel(id)} →</button>)}</div>}{missingStudy && <div className="care-blocker"><button type="button" onClick={() => go({ panel: "tests", id: missingStudy })}>Obtener resultado de {scenario.studies.find(s => s.id === missingStudy)?.label} →</button></div>}<button type="button" className="care-action-button" disabled={!running || done || missing.length > 0 || Boolean(missingStudy)} onClick={() => perform({ type: "action", id: action.id })}>{done ? "✓ Cuidado registrado" : action.label}</button></article>;
            })}</div><button type="button" className="clinical-next" onClick={() => go({ panel: "medications" })}>Revisar opciones de medicación <ArrowRight size={16}/></button></>}
            {tab === "medications" && <MedicationPanel key={state.scenario} state={state} dispatch={perform} onGo={go} highlightedId={highlighted}/>}
            {tab === "tests" && <StudiesPanel state={state} dispatch={perform} highlightedId={highlighted} readSamples={readSamples} onRead={readResult}/>}
            {tab === "ventilator" && <><PanelTitle icon={<Wind size={20}/>} title="Preparar ajustes del ventilador" subtitle="Mover un control solo propone un ajuste. Pulsa «Aplicar ajustes» para que cambie el soporte del paciente."/>
              {!state.actions.includes("circuit") && <div className="care-blocker"><p>Antes de aplicar cambios, comprueba el tubo y el circuito.</p><button type="button" onClick={() => go({ panel: "interventions", id: "circuit" })}>Ir a comprobar tubo y circuito →</button></div>}
              <form onSubmit={e => { e.preventDefault(); perform({ type: "ventilator", settings: draft }); }}><div className="ventilator-controls">{([
                { key: "fio2", label: "FiO₂ · oxígeno inspirado", unit: "%", min: 21, max: 100, step: 1 },
                { key: "peep", label: "PEEP · presión al final de espiración", unit: "cmH₂O", min: 0, max: 18, step: 1 },
                { key: "rate", label: "Frecuencia del ventilador", unit: "rpm", min: 6, max: 30, step: 1 },
                { key: "volume", label: "Volumen corriente · aire por respiración", unit: "mL", min: 250, max: 650, step: 10 },
              ] as const).map(control => <label key={control.key} htmlFor={`vent-${control.key}`}><span>{control.label}<small>{control.unit} · actual: {state.ventilator[control.key]}</small></span><input id={`vent-${control.key}`} type="range" min={control.min} max={control.max} step={control.step} value={draft[control.key]} disabled={!running} onChange={e => setDraft({ ...draft, [control.key]: Number(e.target.value) })}/><output htmlFor={`vent-${control.key}`}>{draft[control.key]}</output></label>)}</div><div className="ventilator-summary"><span>Propuesta de VT / peso <b>{(draft.volume / 65).toFixed(1)} mL/kg</b></span><span>Ventilación minuto propuesta <b>{(draft.rate * draft.volume / 1000).toFixed(1)} L/min</b></span></div><p className="clinical-footnote">Paciente ya intubado · peso predicho del caso: 65 kg. Tras aplicar, compara SpO₂, EtCO₂ y presión arterial.</p><button type="submit" className="clinical-next" disabled={!running || !state.actions.includes("circuit")}>Aplicar ajustes <ArrowRight size={16}/></button></form>
            </>}
            {tab === "record" && <><PanelTitle icon={<ClipboardList size={20}/>} title="Qué hiciste y qué ocurrió" subtitle="Revisa los hallazgos, los tratamientos y las reevaluaciones en orden de tiempo."/>{state.log.length ? <ol className="clinical-log">{state.log.map((entry, i) => <li key={i}><time>{formatClinicalTime(entry.at)}</time><p>{entry.text}</p></li>)}</ol> : <p>Aún no hay actividad. Inicia la práctica para comenzar.</p>}<button type="button" className="clinical-next" disabled={!state.log.length} onClick={exportRecord}>Descargar registro <ArrowRight size={16}/></button></>}
          </div>
        </section>
      </div>
    </div>
    {finished ? <section className="clinical-debrief"><PanelTitle icon={<CheckCircle2 size={22}/>} title="Resumen de tu práctica" subtitle={`${formatClinicalTime(state.elapsed)} · ${completed.length}/${scenario.priorities.length} prioridades registradas · ${state.reassessments.length} reevaluaciones`}/><div><article><h3>Lo que registraste</h3>{completed.length ? <ul>{completed.map(id => <li key={id}><Check size={15}/>{actionLabel(id)}</li>)}</ul> : <p>No registraste prioridades de atención.</p>}</article><article><h3>Lo que debes revisar</h3>{pending.length ? <ul>{pending.map(id => <li key={id}>{actionLabel(id)}</li>)}</ul> : <p>Revisa la tendencia, los resultados y tu razonamiento con tu docente.</p>}{unread.length > 0 && <button type="button" className="clinical-next" onClick={() => go({ panel: "tests", id: unread[0].id, read: true })}>Leer {unread.length} resultado{unread.length > 1 ? "s" : ""} pendiente{unread.length > 1 ? "s" : ""} →</button>}<p>{activeComplications.length} complicaciones siguen activas al cierre.</p></article></div><p className="clinical-footnote">Registrar todas las acciones no garantiza recuperación ni acredita competencia. La sesión se conserva mientras esta página esté abierta.</p><button type="button" className="clinical-next" onClick={exportRecord}>Descargar registro de esta práctica <ArrowRight size={16}/></button></section> : <div className="clinical-session-footer"><p>Al finalizar verás qué registraste, qué omitiste y si reevaluaste al paciente.</p><button type="button" disabled={state.status === "ready"} onClick={() => { dispatch({ type: "finish" }); setTab("record"); reveal("care-work-panel"); }}>Finalizar y revisar práctica <ArrowRight size={16}/></button></div>}
    <details className="care-help"><summary>Volver a leer cómo funciona y consultar referencias</summary><p><b>Explorar:</b> abre un hallazgo. <b>Cuidar o administrar:</b> puede cambiar la evolución. <b>Solicitar una prueba:</b> toma una muestra y necesita tiempo. <b>Reevaluar:</b> registra lo que observas; no administra tratamiento. Puedes pausar en cualquier momento.</p><p>Simulación educativa con respuestas aproximadas y tiempos acelerados. Imagen sintética compartida entre casos ficticios. No es una herramienta asistencial.</p><p>Referencias: <a href="https://ginasthma.org/reports/" target="_blank" rel="noreferrer">GINA</a> · <a href="https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines" target="_blank" rel="noreferrer">SCCM</a> · <a href="https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment-anaphylactic-reactions" target="_blank" rel="noreferrer">RCUK</a> · <a href="https://diabetes.org/living-with-diabetes/hypoglycemia-low-blood-glucose" target="_blank" rel="noreferrer">ADA</a> · <a href="https://www.stroke.org/en/about-stroke/stroke-symptoms" target="_blank" rel="noreferrer">American Stroke Association</a></p></details>
  </div>;
}

function PanelTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <div className="clinical-panel-title">{icon}<div><h3>{title}</h3><p>{subtitle}</p></div></div>;
}
