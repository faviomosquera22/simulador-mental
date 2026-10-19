"use client";
import { ClinicalDialog } from "@/components/education/ClinicalDialog";

import { answerQuestion, scoreWithQuestions, CLINICAL_SOURCES, finalQuestions, triggeredQuestion, type QuestionAnswer, type CaseQuestion } from "@/src/lib/clinicalEducation";
import { QuestionCard, DecisionReview, QuestionHistory, MandatoryQuestion, QuestionScore } from "@/components/education/CaseQuestions";
import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Check, ClipboardList, HeartPulse, Pause, Play, ShieldCheck, Stethoscope, Wind } from "./icons";
import { assessmentFinding, createSimulation, criticalCareCaseIds, formatClinicalTime, hasStudyResult, scenarios, simulationReducer, type ScenarioId, type SimulationEvent, type Ventilator } from "@/src/lib/criticalCareSimulation";
import { caseObjectives, nextGuidedTask, decisionSnapshot, priorityComplete, sampleKey, type CarePanel, type CareTarget, type DecisionSnapshot } from "@/src/lib/criticalCareGuidance";
import { PatientStage as PatientView } from "./PatientStage";
import { MONITORING_OPTIONS, patientProfiles, sensorConnected, observedVital } from "@/src/lib/criticalCareObservation";
import { ComplicationPanel, MedicationPanel, StudiesPanel } from "./CarePanels";
import { DecisionResponse, NextStep } from "./GuidedCare";
import { SessionResults } from "./SessionResults";
import { ClinicalMonitor } from "./ClinicalMonitor";
import { medicationsFor } from "@/src/lib/criticalCareSimulation";
import "./clinical.css";
import "./immersive.css";

const panelLabels: Record<CarePanel, string> = {
  assessment: "Examen físico", interventions: "Intervención", medications: "Medicación",
  tests: "Pruebas", ventilator: "Ventilador", record: "Registro", dialogue: "Diálogos", monitoring: "Monitorizar", calls: "Llamar", history: "Historia clínica", position: "Vista del paciente",
};
const initialVentilator: Ventilator = { fio2: 30, peep: 3, rate: 10, volume: 350 };

export function ClinicalSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, "ventilation", createSimulation);
  const [answers,setAnswers]=useState<QuestionAnswer[]>([]);
  const [caseQuestion,setCaseQuestion]=useState<CaseQuestion|null>(null);
  const [closingIndex,setClosingIndex]=useState(0);
  const [resultOpen,setResultOpen]=useState(false);
  const [askedQuestions,setAskedQuestions]=useState<CaseQuestion[]>([]);
  const [screen, setScreen] = useState<"library" | "briefing" | "room">("library");
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState<"animated" | "photo">("photo");
  const [showPoints, setShowPoints] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogue, setDialogue] = useState<string | null>(null);
  const [duration, setDuration] = useState(20);
  const [finishConfirm, setFinishConfirm] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const [examFinding,setExamFinding]=useState<{title:string;body:string}|null>(null);
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
  const profile = patientProfiles[state.scenario];
  const running = state.status === "running";
  const finished = state.status === "finished";
  const panels: CarePanel[] = ["dialogue", "assessment", "monitoring", "tests", "calls", "interventions", "medications", ...(state.scenario === "ventilation" ? ["ventilator" as const] : []), "history", "record"];
  const completed = scenario.priorities.filter(id => priorityComplete(state, id));
  const pending = scenario.priorities.filter(id => !priorityComplete(state, id));
  const closingQuestions = finalQuestions(state.scenario);
  const activeQuestion = caseQuestion ?? (finished ? closingQuestions[closingIndex] ?? null : null);
  const questionsComplete = finished && closingIndex >= closingQuestions.length;
  const clinicalScore = Math.max(0, Math.round(100 * completed.length / scenario.priorities.length) - state.decisions.filter(d=>d.judgment==="harmful").length * 5);
  const score = scoreWithQuestions(state.scenario, clinicalScore, answers, pending.length ? 69 : 100);
  const helpTask = guided && running ? nextGuidedTask(state, readSamples) : null;
  const difficulty = guided ? (showPoints ? "guided" : "custom") : showPoints ? "independent" : "challenge";
  const readyResults = state.studies.filter(s => s.readyAt <= state.elapsed);
  const unread = readyResults.filter(s => !readSamples.includes(sampleKey(s.id, s.requestedAt)));
  const activeComplications = state.complications.filter(c => c.resolvedAt === undefined);
  const matchingOptions = tab === "medications" ? medicationsFor(state.scenario).filter(m => `${m.name} ${m.purpose} ${m.route}`.toLowerCase().includes(search.toLowerCase())).length : tab === "tests" ? scenario.studies.filter(a => a.label.toLowerCase().includes(search.toLowerCase())).length : scenario.actions.filter(a => a.id !== "help" && `${a.label} ${a.description}`.toLowerCase().includes(search.toLowerCase())).length;
  const actionLabel = (id: string) => id.startsWith("med:") ? medicationsFor(state.scenario).find(m => m.id === id.slice(4))?.name : id === "ventilator" ? "Ajustar soporte y reevaluar respuesta" : id.startsWith("study:") ? scenario.studies.find(a => a.id === id.slice(6))?.label : scenario.actions.find(a => a.id === id)?.label;

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => dispatch(state.elapsed >= duration * 60 ? { type: "finish" } : { type: "tick" }), 1000);
    return () => window.clearInterval(interval);
  }, [running, state.elapsed, duration]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if ((libraryOpen || confirmReset || finishConfirm) && !modal.open) modal.showModal();
    else if (!libraryOpen && !confirmReset && !finishConfirm && modal.open) modal.close();
  }, [libraryOpen, confirmReset, finishConfirm]);
  function reveal(id: string) {
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (!element || !panelRef.current?.contains(element)) return;
      element.focus({ preventScroll: true });
      const container = panelRef.current;
      container.scrollTo({ top: Math.max(0, element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 12), behavior: "instant" });
    });
  }
  function readResult(id: string, at: number) {
    setReadSamples(previous => [...new Set([...previous, sampleKey(id, at)])]);
  }
  function go(target: CareTarget) {
    setPanelOpen(true); setSearch("");
    if (target.id?.startsWith("alert:")) { setTab("record"); reveal(`care-alert-${target.id.slice(6)}`); return; }
    if (target.id === "response") { setTab("record"); reveal("care-response"); return; }
    const destination = target.panel === "interventions" && target.id === "help" ? "calls" : target.panel;
    setTab(destination);
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
    } else reveal(target.id ? `care-${destination}-${target.id}` : "care-work-panel");
  }
  function perform(event: SimulationEvent) {
    if(activeQuestion)return;
    const next = simulationReducer(state, event);
    const tookAction = event.type === "action" && next.actions.length > state.actions.length;
    const gaveMedication = event.type === "medication" && next.medications.length > state.medications.length;
    const changedSupport = (event.type === "ventilator" || event.type === "stop-medication") && next !== state;
    if (tookAction || gaveMedication || changedSupport) {
      if (event.type === "action" || event.type === "medication" || event.type === "stop-medication" || event.type === "ventilator") {
        setSnapshot(decisionSnapshot(state, event.type, "id" in event ? event.id : undefined));

      }
    }
    let requiredQuestion: CaseQuestion | null = null;
    if ((next.decisions.length > state.decisions.length || (event.type==="ventilator" && next!==state)) && ["medication","action","study","ventilator"].includes(event.type)) {
      const trigger=event.type==="ventilator"?"ventilator:settings":`${event.type}:${"id" in event?event.id:""}`;
      const question=triggeredQuestion(state.scenario,trigger,answers);
      requiredQuestion=question;
      if(question){setAskedQuestions(previous=>previous.some(q=>q.id===question.id)?previous:[...previous,question]);setCaseQuestion(question);setPanelOpen(true);panelRef.current?.scrollTo({top:0});}
    }
    dispatch(event);
    if(requiredQuestion)dispatch({type:"pause"});
  }
  function setDifficulty(value:string){
    setGuided(value==="guided");setShowPoints(value!=="challenge");
  }
  function startOrPause() { dispatch({ type: running ? "pause" : "start" }); }
  function enterRoom() { setScreen("room"); setTab("monitoring"); setPanelOpen(true); dispatch({ type: "start" }); }
  function openPanel(panel: CarePanel) { setTab(panel); setPanelOpen(true); setSearch(""); setHighlighted(undefined); panelRef.current?.scrollTo({top:0}); }
  function reset(id: ScenarioId) {
    dispatch({ type: "reset", scenario: id });
    setAnswers([]);setCaseQuestion(null);setAskedQuestions([]);setClosingIndex(0);setResultOpen(false);
    setScreen("briefing"); setPanelOpen(false); setDialogue(null); setSearch(""); setFinishConfirm(false);
    setExamFinding(null);setTab("assessment"); setZone(null); setDraft(initialVentilator); setConfirmReset(null);
    setReadSamples([]); setSnapshot(null); setHighlighted(undefined); setLibraryOpen(false);
  }
  function requestReset(id: ScenarioId) {
    if (state.status === "ready" || finished) reset(id);
    else { dispatch({ type: "pause" }); setConfirmReset(id); }
  }
  function continueQuestion() {
    if(!activeQuestion || !answers.some(a=>a.questionId===activeQuestion.id))return;
    if(caseQuestion){setCaseQuestion(null);if(!document.hidden)dispatch({type:"start"});}
    else {setClosingIndex(index=>index+1);if(closingIndex===closingQuestions.length-1){openPanel("record");setResultOpen(true);}}
  }
  function exportRecord() {
    if(finished && !questionsComplete)return;
    const content = [
      `PRÁCTICA EDUCATIVA PSYKE — ${scenario.title}`, `Duración: ${formatClinicalTime(state.elapsed)}`,
      `Nivel: ${difficulty} · orientación: ${guided} · puntos: ${showPoints}`, `Puntuación: ${JSON.stringify(score)}`, `Decisiones: ${JSON.stringify(state.decisions)}`, `Preguntas: ${JSON.stringify(answers)}`,
      ...state.log.map(e => `${formatClinicalTime(e.at)} ${e.text}`), "",
      `Mediciones al exportar: FC ${observedVital(state,"hr") === null ? "sin medir" : Math.round(state.vitals.hr)} · PA ${observedVital(state,"sbp") === null ? "sin medir" : `${Math.round(state.vitals.sbp)}/${Math.round(state.vitals.dbp)}`} · SpO₂ ${observedVital(state,"spo2") === null ? "sin medir" : `${Math.round(state.vitals.spo2)}%`}`,
      `Reevaluaciones: ${state.reassessments.length}`, `Pendientes: ${pending.map(actionLabel).join(", ") || "Ninguna prioridad del ejercicio"}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `practica-${state.scenario}.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const gallery = <div className="immersive-case-grid">{criticalCareCaseIds.map((id, index) => <button key={id} className="immersive-case-tile" onClick={() => requestReset(id)}><span className={`case-portrait case-${id}`}>{scenarios[id].patient.split(" ").map(p=>p[0]).slice(0,2).join("")}</span><span className="case-tile-content"><small>{patientProfiles[id].difficulty} · CASO {String(index+1).padStart(2,"0")}</small><strong>{scenarios[id].title}</strong><b>{scenarios[id].patient} · {patientProfiles[id].age} años</b><span>{scenarios[id].presentation}</span></span><ArrowRight size={20}/></button>)}</div>;
  const closeModal = () => { setLibraryOpen(false); setConfirmReset(null); setFinishConfirm(false); };
  const modal = <dialog ref={modalRef} className="immersive-modal" onCancel={e=>{e.preventDefault();closeModal();}} aria-labelledby="immersive-modal-title"><button className="immersive-modal-close" onClick={closeModal} aria-label="Cerrar diálogo">×</button><h2 id="immersive-modal-title">{confirmReset ? "¿Preparar una nueva sesión?" : finishConfirm ? "¿Finalizar la atención?" : "Seleccionar caso"}</h2>{confirmReset ? <><p>La práctica está en pausa. Preparar este caso reinicia el tiempo, las mediciones y los tratamientos.</p><button className="clinical-next" onClick={()=>reset(confirmReset)}>Confirmar y preparar caso</button><button className="clinical-next" onClick={closeModal}>Conservar la sesión en pausa</button></> : finishConfirm ? <><p>Se conservará el registro y podrás revisar las decisiones y los resultados.</p><button className="clinical-next" onClick={()=>{dispatch({type:"finish"});closeModal();openPanel("record");}}>Finalizar y revisar</button><button className="clinical-next" onClick={closeModal}>Volver a la atención en pausa</button></> : gallery}</dialog>;

  if (screen === "library") return <div className="clinical-app immersive-library"><div className="clinical-breadcrumb"><Link href="/simulation-hub">Escenarios y urgencias</Link><span>/</span>Cuidados críticos</div><header className="immersive-library-heading"><span className="clinical-eyebrow">PSYKE / SIMULACIÓN CLÍNICA</span><h1>Tu próxima guardia.</h1><p>Elige un caso. Conoce al paciente, conecta los sensores y decide cómo atenderlo.</p></header>{gallery}<p className="immersive-library-note">6 casos ficticios · evolución continua · decisiones libres · registro de la práctica</p>{modal}</div>;
  if (screen === "briefing") return <div className="clinical-app immersive-briefing"><button className="briefing-back" onClick={()=>setScreen("library")}>← Todos los casos</button><div className="briefing-layout"><div className="briefing-art"><PatientView scenario={state.scenario} garment={0} selectedZone={null} assessed={[]} running={false} oxygen={false} onAssess={()=>{}} breathingRate={state.vitals.rr} view="photo" showPoints={false}/><span>Paciente ficticio · ilustración</span></div><section className="briefing-details"><span className="clinical-eyebrow">{profile.difficulty.toUpperCase()} · {profile.setting}</span><h1>{scenario.patient}</h1><h2>{scenario.title}</h2><div className="briefing-parameters">{[{value:profile.age,unit:"años"},{value:profile.weight,unit:"kg"},{value:profile.height,unit:"cm"},{value:(profile.weight/((profile.height/100)**2)).toFixed(1),unit:"IMC"}].map(item=><div key={item.unit}><strong>{item.value}</strong><small>{item.unit}</small></div>)}</div><p className="briefing-story">{scenario.presentation}</p><div className="briefing-objective"><strong>Tu misión</strong><p>{caseObjectives[state.scenario]}</p></div><label className="briefing-duration">Duración de la práctica<select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={10}>10 minutos</option><option value={20}>20 minutos</option><option value={30}>30 minutos</option></select></label><label className="briefing-difficulty">Nivel de ayuda<select aria-label="Nivel de ayuda" value={difficulty} onChange={event=>setDifficulty(event.target.value)}><option value="guided">Guiada · mensajes y puntos visibles</option><option value="independent">Autónoma · sin mensajes, con puntos</option><option value="challenge">Desafío · sin ayuda ni puntos</option>{difficulty==="custom"&&<option value="custom">Personalizada</option>}</select></label><label className="care-guide-toggle"><input type="checkbox" checked={showPoints} onChange={e=>setShowPoints(e.target.checked)}/>Mostrar puntos de exploración 01–04</label><label className="care-guide-toggle"><input type="checkbox" checked={guided} onChange={e=>setGuided(e.target.checked)}/>Mostrar orientación durante la práctica</label><button className="briefing-start" onClick={enterRoom}><Play size={18}/> Iniciar simulación <ArrowRight size={18}/></button><small className="briefing-note">Puedes explorar desde Examen físico aunque ocultes los puntos. El reloj comienza al entrar. Las lecturas aparecen al conectar cada sensor desde Monitorizar. Parámetros ficticios del caso.</small></section></div>{modal}</div>;

  return <div className={`clinical-app guided-clinical-app immersive-critical ${panelOpen ? "drawer-open" : ""}`}>
    <header className="immersive-room-header"><Link href="/simulation-hub" className="room-brand">P<span>PSYKE <small>SALA DE SIMULACIÓN</small></span></Link><div className="room-patient-identity"><strong>{scenario.patient}</strong><span>{profile.age} años · {scenario.title}</span></div><div className="room-session-controls"><time>{formatClinicalTime(state.elapsed)}<small> / {duration}:00</small></time>{!finished && <button onClick={startOrPause} aria-label={running?"Pausar simulación":"Continuar simulación"}>{running?<Pause size={16}/>:<Play size={16}/>}<span>{running?"Pausar":"Continuar"}</span></button>}{finished&&questionsComplete&&<button onClick={()=>setResultOpen(true)}>Ver resultado</button>}<button onClick={()=>{if(running)dispatch({type:"pause"});setLibraryOpen(true);}}>Casos</button><button onClick={()=>{dispatch({type:"pause"});setFinishConfirm(true);}} disabled={finished}>Finalizar</button></div></header>
    <div className="immersive-room-body">
      <aside className="room-monitor-column"><ClinicalMonitor state={state} onConnect={()=>openPanel("monitoring")}/><div className="room-monitor-note"><span>INFORMACIÓN DEL PACIENTE</span><p>{scenario.subtitle}</p><small>Las señales y la respiración responden al mismo estado de simulación.</small></div></aside>
      <section className="room-patient-stage" aria-label="Paciente en atención"><div className="stage-topline"><span><i className={running?"device-led live":"device-led"}/>{running?"EN ATENCIÓN":finished?"PRÁCTICA FINALIZADA":"ATENCIÓN EN PAUSA"}</span><button onClick={()=>openPanel("position")}>◉ Vista</button></div><PatientView scenario={state.scenario} garment={0} selectedZone={zone} assessed={state.assessed} running={running} oxygen={state.actions.includes("oxygen")} onAssess={i=>go({panel:"assessment",zone:i})} breathingRate={state.vitals.rr} vitals={state.vitals} iv={state.actions.includes("iv")} fluids={state.actions.includes("fluids")} monitoring={sensorConnected(state,"ecg")} view={view} showPoints={showPoints} zoom={zoom}/><div className="stage-bottomline"><span>{state.scenario==="ventilation"?"Ventilación invasiva":state.actions.includes("oxygen")?"Oxígeno conectado":"Respiración espontánea"}</span>{state.actions.includes("iv")&&<span>Vía IV</span>}{state.actions.includes("fluids")&&<span>Cristaloides</span>}<small>Paciente ficticio · {view==="animated"?"ilustración animada":"imagen sintética"}</small></div></section>
      {panelOpen && <aside className="room-action-drawer" aria-label={panelLabels[tab]}><header><div><small>ATENCIÓN DEL PACIENTE</small><h2>{panelLabels[tab]}</h2></div><button onClick={()=>setPanelOpen(false)} aria-label="Cerrar panel de acciones">×</button></header>{["interventions","tests","medications"].includes(tab)&&<label className="drawer-search"><span>⌕</span><input aria-label={`Buscar en ${panelLabels[tab]}`} placeholder="Buscar una opción…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch("")} aria-label="Limpiar búsqueda">×</button>}</label>}
        <div className="room-drawer-content" id="care-work-panel" ref={panelRef} tabIndex={-1}>
            {search && !matchingOptions && <div className="clinical-hint" role="status"><p>No hay opciones que coincidan con «{search}».</p><button onClick={()=>setSearch("")}>Mostrar todas</button></div>}
            {unread.length > 0 && tab !== "tests" && <button type="button" className="care-results-notice" onClick={() => go({ panel: "tests", id: unread[0].id, read: true })}>{unread.length} resultado{unread.length > 1 ? "s" : ""} disponible{unread.length > 1 ? "s" : ""} sin leer · Abrir →</button>}
            {!running && !finished && <div className="clinical-hint"><p>{state.status === "ready" ? "Primero pulsa «Iniciar práctica». Después podrás explorar e intervenir; preparar una medicación no la administra todavía." : "La atención está en pausa. Puedes consultar los resultados y el registro. Continúa para realizar un cuidado o administrar."}</p></div>}
            {tab === "assessment" && <><PanelTitle icon={<Stethoscope size={20}/>} title="Explorar no es tratar" subtitle="Toca una zona de la imagen o uno de estos botones. Lee el hallazgo y decide qué cuidado necesitas."/>
              <div className="assessment-list">{scenario.zones.map((z, i) => <button type="button" key={z.label} disabled={!running} className={zone === i ? "selected" : ""} onClick={() => go({ panel: "assessment", zone: i })}><span className="assessment-number">{state.assessed.includes(i) ? <Check size={16}/> : `0${i + 1}`}</span><div><b>Explorar {z.label}</b><small>{state.assessed.includes(i) ? "Hallazgo revisado · puedes volver a explorar" : "Abre el hallazgo de esta zona"}</small></div><ArrowRight size={16}/></button>)}</div>
              <h3>Exploración dirigida</h3><div className="directed-examinations">{[
                {title:"Inspeccionar vía aérea y permeabilidad",zone:0},
                {title:"Inspeccionar expansión y esfuerzo respiratorio",zone:1},
                {title:"Auscultar campos pulmonares",zone:1},
                {title:"Palpar pulsos y valorar perfusión",zone:2},
                {title:"Valorar conciencia, lenguaje y respuesta motora",zone:3},
                {title:"Inspeccionar piel y puntos de presión",zone:3},
              ].filter(method=>method.title.toLowerCase().includes(search.toLowerCase())).map(method=><button key={method.title} disabled={!running} onClick={()=>{setZone(method.zone);dispatch({type:"assess",zone:method.zone});dispatch({type:"pause"});setExamFinding({title:method.title,body:assessmentFinding(state,method.zone)});}}>{method.title} →</button>)}</div>
              {zone !== null && state.assessed.includes(zone) && <div className="patient-finding" id="care-current-finding" tabIndex={-1} role="status"><b>Hallazgo de zona {zone + 1} · {scenario.zones[zone].label}</b><p>{assessmentFinding(state, zone)}</p><button type="button" className="clinical-next" onClick={() => go({ panel: "interventions" })}>Elegir un cuidado para este paciente <ArrowRight size={16}/></button></div>}
            </>}
            {tab === "interventions" && <><PanelTitle icon={<HeartPulse size={20}/>} title="Realizar cuidados y soporte" subtitle="Lee el propósito y pulsa el nombre del cuidado para realizarlo una vez. Si falta un requisito, usa su enlace."/><div className="care-actions">{scenario.actions.filter(action => action.id !== "help" && `${action.label} ${action.description}`.toLowerCase().includes(search.toLowerCase())).map(action => {
              const done = state.actions.includes(action.id);
              const missing = action.requires?.filter(id => !state.actions.includes(id)) ?? [];
              const missingStudy = action.requiresStudy && !hasStudyResult(state, action.requiresStudy) ? action.requiresStudy : undefined;
              return <article key={action.id} id={`care-interventions-${action.id}`} tabIndex={-1} className={`${done ? "care-action-done" : ""} ${highlighted === action.id ? "care-highlight" : ""}`}><h4>{action.label}</h4><p>{action.description}</p>{missing.length > 0 && <div className="care-blocker"><p>Para habilitar este cuidado:</p>{missing.map(id => <button type="button" key={id} onClick={() => go({ panel: "interventions", id })}>Completar {actionLabel(id)} →</button>)}</div>}{missingStudy && <div className="care-blocker"><button type="button" onClick={() => go({ panel: "tests", id: missingStudy })}>Obtener resultado de {scenario.studies.find(s => s.id === missingStudy)?.label} →</button></div>}<button type="button" className="care-action-button" disabled={!running || done || missing.length > 0 || Boolean(missingStudy)} onClick={() => perform({ type: "action", id: action.id })}>{done ? "✓ Cuidado registrado" : action.label}</button></article>;
            })}</div><button type="button" className="clinical-next" onClick={() => go({ panel: "medications" })}>Revisar opciones de medicación <ArrowRight size={16}/></button></>}
            {tab === "medications" && <MedicationPanel key={state.scenario} state={state} dispatch={perform} onGo={go} highlightedId={highlighted} query={search}/>}
            {tab === "tests" && <StudiesPanel state={state} dispatch={perform} highlightedId={highlighted} readSamples={readSamples} onRead={readResult} query={search}/>}
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
            {tab === "monitoring" && <><PanelTitle icon={<Activity size={20}/>} title="Conectar y medir" subtitle="Activa cada sensor para ver su lectura. La fisiología sigue evolucionando aunque el sensor esté desconectado."/><div className="monitoring-switches">{MONITORING_OPTIONS.map(option=><label key={option.key}><span><strong>{option.label}</strong><small>{option.detail}</small></span><input type="checkbox" role="switch" aria-label={option.label} checked={sensorConnected(state,option.key)} disabled={!running} onChange={e=>perform({type:"monitor",key:option.key,enabled:e.target.checked})}/><b>{sensorConnected(state,option.key)?"ON":"OFF"}</b></label>)}</div><button className="clinical-next" onClick={()=>go({panel:"tests",id:"glucose"})}>Glucemia y otras pruebas de cabecera →</button></>}
            {tab === "dialogue" && <><PanelTitle icon={<Stethoscope size={20}/>} title="Escuchar al paciente" subtitle="Revisa la información disponible del caso y explica la atención."/>{[{title:"Saludo e introducción",body:"Te presentas, explicas tu función y comunicas al paciente qué vas a valorar."},{title:"Motivo de consulta e historia",body:scenario.presentation},{title:"Antecedentes disponibles",body:scenario.subtitle+". Los antecedentes no descritos, alergias y tratamientos habituales deben verificarse; no se asumen ausentes."}].map(item=><button className="dialogue-choice" key={item.title} onClick={()=>setDialogue(item.body)}>{item.title}<ArrowRight size={15}/></button>)}{dialogue&&<div className="patient-finding" role="status"><p>{dialogue}</p></div>}</>}
            {tab === "calls" && <><PanelTitle icon={<HeartPulse size={20}/>} title="Solicitar ayuda" subtitle="Comunica situación, antecedentes, valoración y recomendación al equipo del caso."/>{scenario.actions.filter(a=>a.id==="help"||a.id==="blood"||a.id==="definitive").map(a=><article className="call-choice" id={`care-calls-${a.id}`} tabIndex={-1} key={a.id}><h3>{a.label}</h3><p>{a.description}</p><button className="clinical-next" disabled={!running || state.actions.includes(a.id) || (a.requires??[]).some(id=>!state.actions.includes(id)) || Boolean(a.requiresStudy && !hasStudyResult(state,a.requiresStudy))} onClick={()=>perform({type:"action",id:a.id})}>{state.actions.includes(a.id)?"✓ Equipo avisado":a.label}</button></article>)}</>}
            {tab === "history" && <><PanelTitle icon={<ClipboardList size={20}/>} title="Ficha clínica" subtitle="Datos ficticios disponibles al ingreso."/><div className="room-history"><h3>{scenario.patient}</h3><p>{scenario.subtitle}</p><p>{scenario.presentation}</p><dl><dt>Edad</dt><dd>{profile.age} años</dd><dt>Peso del caso</dt><dd>{profile.weight} kg</dd><dt>Talla</dt><dd>{profile.height} cm</dd><dt>Entorno</dt><dd>{profile.setting}</dd></dl><p>Consulta Pruebas para revisar resultados de cada muestra.</p><details><summary>Referencias MSP y alcance</summary>{Object.values(CLINICAL_SOURCES).filter(source=>state.scenario==="anaphylaxis"?source.id==="msp-allergy":state.scenario==="hypoglycemia"?source.id==="msp-diabetes":state.scenario==="ventilation"?source.id==="msp-ventilation":source.id==="msp-emergency").map(source=><article key={source.id}><p><a href={source.url} target="_blank" rel="noreferrer">{source.title} · {source.year} ↗</a></p><p>{source.section}. {source.scope}</p></article>)}{(state.scenario==="sepsis"||state.scenario==="stroke")&&<p>Se mantiene la necesidad de protocolo institucional y valoración especializada. No se atribuye a estas fuentes un esquema antimicrobiano adulto ni una pauta de reperfusión no verificados.</p>}</details></div></>}
            {tab === "position" && <><PanelTitle icon={<Activity size={20}/>} title="Vista y nivel de ayuda" subtitle="Configura los puntos y la orientación. Los cuidados se realizan desde Intervención."/><div className="stage-view-options"><button aria-pressed={guided} onClick={()=>setGuided(value=>!value)}>{guided?"Desactivar ayuda interactiva":"Activar ayuda interactiva"}</button><button aria-pressed={view==="animated"} onClick={()=>setView("animated")}>Paciente ilustrado animado</button><button aria-pressed={view==="photo"} onClick={()=>setView("photo")}>Paciente fotográfico</button><button aria-pressed={showPoints} onClick={()=>setShowPoints(!showPoints)}>{showPoints?"Ocultar":"Mostrar"} puntos de exploración</button><button aria-pressed={zoom} onClick={()=>setZoom(!zoom)}>{zoom?"Vista general":"Acercar paciente"}</button></div>{scenario.actions.some(a=>a.id==="head")&&<button className="clinical-next" onClick={()=>go({panel:"interventions",id:"head"})}>Revisar cabecera y fijación →</button>}</>}

            {tab === "record" && <><QuestionHistory questions={askedQuestions} answers={answers} onAnswer={(id,option)=>setAnswers(previous=>answerQuestion(previous,id,option,state.elapsed))}/><ComplicationPanel state={state} dispatch={perform} onGo={go}/><DecisionResponse state={state} snapshot={snapshot} onReassess={()=>perform({type:"reassess"})}/>{finished&&<><QuestionScore score={score} complete={questionsComplete}/><p>Base clínica: proporción de prioridades registradas, menos 5 puntos por decisión perjudicial. Las prioridades pendientes limitan la nota a 69.</p><DecisionReview decisions={state.decisions}/><div className="final-case-questions"><h3>Dos preguntas de cierre</h3><p>Respuestas confirmadas durante el cierre obligatorio.</p>{finalQuestions(state.scenario).map(q=><QuestionCard key={q.id} question={q} answer={answers.find(a=>a.questionId===q.id)} onAnswer={option=>setAnswers(previous=>answerQuestion(previous,q.id,option,state.elapsed))}/>)}</div><div className="room-summary"><h3>Resumen de tu práctica</h3><p>{completed.length}/{scenario.priorities.length} prioridades registradas · {state.reassessments.length} reevaluaciones.</p><h4>Pendientes</h4>{pending.length?pending.map(id=><p key={id}>• {actionLabel(id)}</p>):<p>Revisa tu razonamiento y la evolución con tu docente.</p>}</div></>}</>}
            {guided && running && tab === "record" && <NextStep state={state} readSamples={readSamples} onGo={go}/>}
        </div>
      </aside>}
    </div>
    {helpTask&&<details className="room-help-message" aria-label="Ayuda interactiva"><summary>Guía · {helpTask.title}</summary><p>{helpTask.why}</p><button onClick={()=>go(helpTask.target)}>{helpTask.cta}</button></details>}
    <div className="room-feedback" role="status"><span>{state.feedback}</span>{guided&&<button onClick={()=>openPanel("record")}>Guía</button>}{activeComplications.length>0&&<button onClick={()=>openPanel("record")}>⚠ {activeComplications.length} alerta{activeComplications.length>1?"s":""}</button>}{unread.length>0&&<button onClick={()=>openPanel("tests")}>● {unread.length} resultado{unread.length>1?"s":""}</button>}</div>
    <nav className="room-action-bar" aria-label="Herramientas para atender al paciente">{panels.map(panel=><button key={panel} onClick={()=>openPanel(panel)} aria-pressed={panelOpen&&tab===panel}><span aria-hidden="true">{panel==="assessment"?<Stethoscope size={21}/>:panel==="monitoring"?<Activity size={21}/>:panel==="interventions"?<HeartPulse size={21}/>:panel==="ventilator"?<Wind size={21}/>:panel==="record"||panel==="history"?<ClipboardList size={21}/>:panel==="tests"?<ShieldCheck size={21}/>:panel==="calls"?"☎":panel==="dialogue"?"☏":"✚"}</span><strong>{panelLabels[panel]}</strong>{panel==="tests"&&unread.length>0&&<small>{unread.length}</small>}</button>)}</nav>
    {modal}
    {examFinding&&!activeQuestion&&<ClinicalDialog title={examFinding.title} onClose={()=>{setExamFinding(null);if(!document.hidden)dispatch({type:"start"});}}><p>{examFinding.body}</p><p>Hallazgos disponibles de la región explorada. Los detalles no descritos no se asumen normales. El caso está en pausa durante la revisión.</p><button className="clinical-next" onClick={()=>{setExamFinding(null);if(!document.hidden)dispatch({type:"start"});}}>Volver a la atención</button></ClinicalDialog>}
    {resultOpen&&questionsComplete&&<SessionResults state={state} title={scenario.title} score={score} pending={pending.map(id=>actionLabel(id)??id)} questions={[...askedQuestions,...closingQuestions]} answers={answers} onClose={()=>setResultOpen(false)} onRepeat={()=>reset(state.scenario)} onChoose={()=>{setResultOpen(false);setScreen("library");setLibraryOpen(false);}} onExport={exportRecord}/>}
    {activeQuestion&&<MandatoryQuestion key={activeQuestion.id} question={activeQuestion} answer={answers.find(a=>a.questionId===activeQuestion.id)} onAnswer={option=>setAnswers(previous=>answerQuestion(previous,activeQuestion.id,option,state.elapsed))} onContinue={continueQuestion} progress={activeQuestion.stage==="final"?`Pregunta ${closingIndex+1} de ${closingQuestions.length}`:undefined}/>}
  </div>;
}

function PanelTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <div className="clinical-panel-title">{icon}<div><h3>{title}</h3><p>{subtitle}</p></div></div>;
}
