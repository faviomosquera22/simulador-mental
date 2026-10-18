"use client";

import { answerQuestion, scoreWithQuestions, finalQuestions, triggeredQuestion, CLINICAL_SOURCES, type QuestionAnswer, type CaseQuestion, type LearningDecision } from "@/src/lib/clinicalEducation";
import { QuestionCard, DecisionReview, QuestionHistory, MandatoryQuestion, QuestionScore } from "@/components/education/CaseQuestions";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ClinicalMonitor } from "@/components/critical-care/ClinicalMonitor";
import { MONITORING_OPTIONS } from "@/src/lib/criticalCareObservation";
import "@/components/critical-care/immersive.css";
import { GYNECOLOGY_CASES, GYNECOLOGY_MONITOR_CHANNELS, setGynecologyMonitoring, hasDecision, OBSTETRIC_KEYS, OBSTETRIC_SOURCE, RUN_LIMIT, actionAvailable, createRun, evaluateRun, getPhysiology, performAction, resultReady, type ActionGroup, type SimulationRun, type GynecologyMonitoringKey } from "@/src/lib/gynecologySimulation";
import { tannPlacement } from "@/src/lib/tannPlacement";
import { TannPlacementPanel } from "./TannPlacementPanel";
import PatientScene from "./PatientScene";
import VitalsTrend from "./VitalsTrend";
import styles from "./room.module.css";

const groups: { id: ActionGroup; label: string; icon: string }[] = [
  { id: "valoracion", label: "Valoración", icon: "◎" },
  { id: "estudios", label: "Estudios", icon: "⌕" },
  { id: "intervencion", label: "Intervenciones", icon: "✚" },
  { id: "medicacion", label: "Medicación", icon: "✚" },
  { id: "obstetricia", label: "Claves y TANN", icon: "✥" },
  { id: "equipo", label: "Equipo y destino", icon: "↗" },
];
const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
type Finding = { title: string; body: string; needsConsent?: boolean };
export default function ClinicalRoom() {
  const [answers,setAnswers]=useState<QuestionAnswer[]>([]);
  const [caseQuestion,setCaseQuestion]=useState<CaseQuestion|null>(null);
  const [closingIndex,setClosingIndex]=useState(0);
  const [askedQuestions,setAskedQuestions]=useState<CaseQuestion[]>([]);
  const [drugCategory,setDrugCategory]=useState("Todas");
  const [drugPresentations,setDrugPresentations]=useState<Record<string,string>>({});
  const [catalogSearch,setCatalogSearch]=useState("");
  const [run, setRun] = useState<SimulationRun>(() => createRun(GYNECOLOGY_CASES[0].id));
  const [mode, setMode] = useState<"practice" | "evaluation">("practice");
  const [group, setGroup] = useState<ActionGroup>("valoracion");
  const [panel, setPanel] = useState<"actions" | "results" | "log" | "monitoring" | "history">("history");
  const [examinedZones, setExaminedZones] = useState<string[]>([]);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [notice, setNotice] = useState("");
  const [lastDecision, setLastDecision] = useState<{ at: number; label: string; vitals: ReturnType<typeof getPhysiology>["vitals"]; monitoring: SimulationRun["monitoring"] } | null>(null);
  const [focusMode, setFocusMode] = useState(true);
  const [drawerOpen,setDrawerOpen]=useState(true);
  const [sound, setSound] = useState(false);
  const [switchCase, setSwitchCase] = useState(false);
  const [caseFilter,setCaseFilter]=useState("all");
  const [pendingCase, setPendingCase] = useState(run.caseId);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);
  const decisionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const c = GYNECOLOGY_CASES.find(item => item.id === run.caseId)!;
  const physiology = getPhysiology(c, run);
  const report = evaluateRun(c, run);
  const running = run.status === "running";
  const finished = run.status === "finished";
  const closingQuestions = finalQuestions(c.id);
  const activeQuestion = caseQuestion ?? (finished ? closingQuestions[closingIndex] ?? null : null);
  const questionsComplete = finished && closingIndex >= closingQuestions.length;
  const score = scoreWithQuestions(c.id, report.score, answers, report.omitted.length ? 69 : 100);
  const monitorState = {status:run.status,elapsed:run.elapsed,monitoring:run.monitoring,vitals:{...physiology.vitals,temperature:physiology.vitals.temp}};
  const measured = (key:GynecologyMonitoringKey)=>run.monitoring[key]!==undefined;
  const selected = (id: string) => hasDecision(c,run,id);
  const drugCategories=["Todas",...new Set(c.actions.filter(a=>a.group===group).map(a=>a.category??"Otros"))];
  const learningDecisions: LearningDecision[]=run.decisions.map(d=>{const a=c.actions.find(a=>a.id===d.id)!;return{kind:a.group==="medicacion"?"medication":a.group==="estudios"?"study":"action",id:a.id,at:d.at,presentation:d.presentation,judgment:a.harmful?"harmful":a.judgment??"appropriate",rationale:a.rationale,source:a.source??"msp-maternal"};});
  const visibleGroups = groups.filter(item => item.id !== "obstetricia" || !!c.obstetricKey);
  const studies = c.actions.filter(a => a.group === "estudios" && selected(a.id));
  const readyStudies = studies.filter(a => resultReady(a, run));
  const wasRunning = useRef(false);
  const modalOpen = switchCase || confirmEnd;
  const careSteps = [
    { label: "Valoración", detail: selected("abcde") ? "Evaluación registrada" : "Recibe a la paciente", done: selected("abcde") },
    { label: "Exploración", detail: `${examinedZones.length} de 4 zonas`, done: examinedZones.length > 0 },
    { label: "Estudios", detail: studies.length ? `${readyStudies.length} de ${studies.length} disponibles` : "Sin solicitudes", done: studies.length > 0 },
    { label: "Coordinación", detail: selected("call") ? "Equipo avisado" : "Sin activación", done: selected("call") },
  ];
  const nextCritical = (() => {
    const needed = c.actions.filter(action => action.critical && !selected(action.id));
    for (const action of needed) {
      const required = (action.requires ?? []).find(id => !selected(id));
      if (required) return c.actions.find(a => a.id === required) ?? action;
      return action;
    }
    return null;
  })();
  function openActionGroup(next: ActionGroup) {
    setDrawerOpen(true);setGroup(next); setPanel("actions");setDrugCategory("Todas");setCatalogSearch("");
    decisionRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  useEffect(() => {
    if (run.status !== "running") return;
    const interval = window.setInterval(() => setRun(previous => {
      if (previous.status !== "running") return previous;
      const elapsed = Math.min(RUN_LIMIT, previous.elapsed + 1);
      return { ...previous, elapsed, status: elapsed === RUN_LIMIT ? "finished" : "running" };
    }), 1000);
    return () => window.clearInterval(interval);
  }, [run.status]);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setRun(previous => previous.status === "running" ? { ...previous, status: "paused" } : previous); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (modalOpen && dialog && !dialog.open) {
      wasRunning.current = run.status === "running";
      if (wasRunning.current) setRun(previous => ({ ...previous, status: "paused" }));
      dialog.showModal();
    } else if (!modalOpen && dialog?.open) {
      dialog.close();
      if (wasRunning.current) setRun(previous => previous.status === "paused" ? { ...previous, status: "running" } : previous);
    }
  }, [modalOpen, run.status]);
  useEffect(() => {
    if (!sound || !running || run.monitoring.ecg===undefined) return;
    const interval = window.setInterval(() => {
      const context = audioRef.current;
      if (!context || context.state !== "running") return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = physiology.critical ? 660 : 880;
      gain.gain.setValueAtTime(0.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.1);
    }, Math.round(60000 / physiology.vitals.hr));
    return () => window.clearInterval(interval);
  }, [sound, running, physiology.critical, physiology.vitals.hr, run.monitoring.ecg]);
  useEffect(() => () => { void audioRef.current?.close(); }, []);

  function closeDialog() { setFinding(null); setSwitchCase(false); setConfirmEnd(false); }
  function reset(caseId: string) {
    wasRunning.current = false;setAnswers([]);setCaseQuestion(null);setAskedQuestions([]);setClosingIndex(0);setDrugCategory("Todas");setCatalogSearch("");setDrugPresentations({});
    setLastDecision(null);
    setRun(createRun(caseId)); setExaminedZones([]); setPendingCase(caseId); setGroup("valoracion"); setPanel("history"); setNotice(""); closeDialog();
  }
  function act(id: string) {
    if(activeQuestion)return;
    const action = c.actions.find(a => a.id === id)!;
    const next = performAction(c, run, id, drugPresentations[id]);
    if (next === run) return;
    setLastDecision({ at: run.elapsed, label: action.label, vitals: { ...physiology.vitals }, monitoring: {...run.monitoring} });
    setRun(next);
    const question=triggeredQuestion(c.id,`action:${id}`,answers);if(question){setAskedQuestions(previous=>previous.some(q=>q.id===question.id)?previous:[...previous,question]);setCaseQuestion(question);setRun({...next,status:"paused"});decisionRef.current?.scrollTo({top:0});}
    setNotice(mode === "practice" ? action.group === "estudios" ? `Solicitud registrada. El resultado estará disponible en Estudios después de ${(action.minutes ?? 0) * 60} segundos simulados. ${action.rationale}` : `${action.result} ${action.rationale}` : `Acción registrada: ${action.label}. La retroalimentación se mostrará al finalizar.`);
    if (id === "history") setFinding({ title: "Entrevista con la paciente", body: c.history });
  }
  function explore(zone: keyof typeof c.findings) {
    if (zone === "pelvis" && !selected("consent")) { setFinding({ title: "El punto 04 necesita consentimiento", body: "Este punto sí funciona: antes de una exploración íntima necesitas explicar el procedimiento, solicitar consentimiento y ofrecer acompañante clínico. Pulsa el botón inferior para ir a esa acción; después vuelve al punto 04.", needsConsent: true }); return; }
    setExaminedZones(previous => previous.includes(zone) ? previous : [...previous, zone]);
    const labels = { head: "Estado general", chest: "Respiración y perfusión", abdomen: "Exploración abdominal", pelvis: "Exploración pélvica" };
    setFinding({ title: labels[zone], body: c.findings[zone] });
  }
  function advance() {
    setRun(previous => {
      if (previous.status !== "running") return previous;
      const elapsed = Math.min(RUN_LIMIT, previous.elapsed + 30);
      return { ...previous, elapsed, status: elapsed === RUN_LIMIT ? "finished" : "running" };
    });
  }
  function continueQuestion() {
    if(!activeQuestion || !answers.some(a=>a.questionId===activeQuestion.id))return;
    if(caseQuestion){setCaseQuestion(null);if(!document.hidden)setRun(previous=>({...previous,status:"running"}));}
    else {setClosingIndex(index=>index+1);if(closingIndex===closingQuestions.length-1)setPanel("log");}
  }
  function exportReport() {
    if(!questionsComplete)return;
    const data = { simulator: "Psyke · Sala interactiva ginecológica", version: 2, date: new Date().toISOString(), case: c.title, mode, elapsed: run.elapsed, diagnosis: run.diagnosis, score: score.total, scoreBreakdown: score, tann:tannPlacement(run.decisions), monitoring:run.monitoring, questions: answers, clinicalDecisions: learningDecisions, criticalOmissions: report.omitted.map(a => a.label), lateActions: report.late.map(a => a.label), decisions: run.decisions.map(d => ({ at: time(d.at), action: c.actions.find(a => a.id === d.id)?.label })), source: c.source };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `psyke-${c.id}-evaluacion.json`; link.click(); URL.revokeObjectURL(url);
  }
  async function toggleSound() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      await audioRef.current.resume(); setSound(value => !value);
    } catch { setNotice("El navegador no pudo activar el audio. Puedes continuar con las alertas visuales."); }
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await roomRef.current?.requestFullscreen(); }
    catch { setNotice("La pantalla completa no está disponible en este navegador."); }
  }

  return <div className={`${styles.shell} ${focusMode ? styles.focusShell : ""}`}><div className={`${styles.navigationPane} ${focusMode ? styles.navigationHidden : ""}`}><Sidebar /></div><main ref={roomRef} data-tools={drawerOpen||finished} className={`${styles.room} ${!running ? styles.paused : ""}`}>
    <header className={styles.header}>
      <div><div className={styles.eyebrow}><span className={styles.liveDot} /> PSYKE / EXPERIENCIAS CLÍNICAS <span className={styles.newBadge}>SALA 01</span></div><h1>Sala interactiva ginecológica</h1><p>Ginecología y obstetricia · Tu guardia, tus decisiones.</p></div>
      <div className={styles.headerActions}><button className={styles.iconButton} onClick={()=>setDrawerOpen(value=>!value)}>{drawerOpen?"Ampliar paciente":"Ver herramientas"}</button><button className={styles.focusToggle} onClick={() => setFocusMode(value => !value)} aria-pressed={focusMode}>{focusMode ? "Mostrar navegación" : "Expandir sala"} ↗</button><Link href="/simulation-hub" className={styles.link}>Todos los escenarios ↗</Link><button onClick={fullscreen} className={styles.iconButton} aria-label="Alternar pantalla completa" title="Pantalla completa">⛶</button><button onClick={toggleSound} className={styles.iconButton} aria-pressed={sound}>{sound ? "Sonido activo" : "Sin sonido"}</button></div>
    </header>
    <section className={styles.toolbar} aria-label="Controles de sesión">
      <div className={styles.caseControl}><span className={styles.caseNumber}>{String(GYNECOLOGY_CASES.findIndex(item => item.id === c.id) + 1).padStart(2, "0")}</span><div><small>{c.specialty.toUpperCase()} · {c.difficulty}</small><strong>{c.title}</strong></div><button onClick={() => { setPendingCase(c.id); setSwitchCase(true); }} className={styles.subtleButton}>Cambiar caso ↗</button></div>
      <div className={styles.sessionControls}><span className={styles.clock} aria-label="Tiempo simulado">T+ {time(run.elapsed)}</span><button className={styles.subtleButton} onClick={advance} disabled={!running}>+30 s</button><button className={styles.startButton} disabled={finished} onClick={() => setRun(previous => ({ ...previous, status: previous.status === "running" ? "paused" : "running" }))}>{run.status === "ready" ? "Iniciar simulación ▷" : running ? "Pausar Ⅱ" : finished ? "Finalizada" : "Continuar ▷"}</button>{run.status !== "ready" && !finished && <button className={styles.subtleButton} onClick={() => setConfirmEnd(true)}>Finalizar</button>}</div>
    </section>
    <div className={styles.workspace}>
      <section className={styles.monitorColumn} aria-label="Monitor y estado de la paciente">
        <div className={styles.sectionLabel}><span>FISIOLOGÍA EN VIVO</span><span className={styles.liveDot} /></div>
        <ClinicalMonitor state={monitorState} channels={GYNECOLOGY_MONITOR_CHANNELS} onConnect={()=>{setDrawerOpen(true);setPanel("monitoring");}}/>
        <div className={styles.metricGrid}><div><small>Índice de choque</small><strong className={measured("ecg")&&measured("bp")&&physiology.shockIndex >= 1 ? styles.danger : ""}>{measured("ecg")&&measured("bp")?physiology.shockIndex.toFixed(2):"—"}</strong><span>FC / presión sistólica</span></div><div><small>Sangrado visible</small><strong>{physiology.bleeding}<em> mL</em></strong><span>Estimación del escenario</span></div></div>
        <div className={styles.stateCard}><span className={physiology.critical ? styles.alertDot : styles.liveDot} /><div><strong>{physiology.escalated ? "Atención especializada coordinada" : physiology.critical ? "Compromiso fisiológico" : "Necesita reevaluación"}</strong><p>{physiology.escalated ? "Mantén el soporte. Coordinar atención no equivale a resolver la causa." : "La evolución depende del tiempo y de tus decisiones."}</p></div></div>
        {measured("ecg")&&measured("bp")&&<VitalsTrend scenario={c} run={run} since={Math.max(run.monitoring.ecg!,run.monitoring.bp!)}/>}
      </section>
      <section id="room-patient" className={styles.patientColumn} aria-label="Paciente y exploración">
        <div className={styles.patientHeader}><div><strong>{c.name}</strong><span>{c.age} años · {c.background}</span></div><span className={styles.syntheticBadge}>Caso ficticio</span></div>
        <PatientScene key={c.id} oxygen={selected("oxygen")} iv={selected("iv")} fluids={selected("fluids")} tann={tannPlacement(run.decisions)} active={running} breathingRate={physiology.vitals.rr} examined={examinedZones} onExplore={explore}/>
        <div className={styles.quote}><span>“</span><p>{selected("fluids") && physiology.escalated ? "¿Van a quedarse conmigo? Díganme qué está pasando, por favor." : c.complaint}</p></div>


      </section>
      <section ref={decisionRef} className={styles.decisionColumn} aria-label="Decisiones y resultados">
        <div className={styles.tabs} role="tablist" aria-label="Área de trabajo">{([{ id: "actions", label: "Decisiones" }, { id: "results", label: `Estudios (${readyStudies.length})` }, { id: "log", label: "Registro" }, { id: "monitoring", label: "Monitorizar" }, { id: "history", label: "Caso" }] as const).map(tab => <button key={tab.id} id={`tab-${tab.id}`} aria-controls="workspace-panel" role="tab" aria-selected={panel === tab.id} onClick={() => setPanel(tab.id)}>{tab.label}</button>)}</div>
    {finished && <section className={styles.report} aria-label="Evaluación de la sesión"><div className={styles.reportHeading}><div><span className={styles.eyebrow}>DEBRIEFING / TU SESIÓN</span><h2>{report.safe ? "Prioridades críticas completadas" : "Revisemos tus decisiones"}</h2><p>{run.elapsed >= RUN_LIMIT ? "Terminó el tiempo del escenario. " : "Sesión finalizada. "}Esta puntuación es educativa y no acredita competencia profesional.</p></div><div className={styles.score}>{score.total}<small>/100</small></div></div><div className={styles.reportGrid}><article><h3>Razonamiento clínico</h3><p>Hipótesis esperada: <strong>{c.diagnosis}</strong>.</p><p>{report.correctDiagnosis ? "Tu hipótesis coincide con el escenario." : `Tu hipótesis: ${run.diagnosis || "Sin registrar"}. Revisa los hallazgos y diagnósticos alternativos.`}</p><p>75% prioridades críticas · 25% hipótesis · penalizaciones por acciones inseguras y tardías. Una omisión crítica limita la nota a 69.</p></article><article><h3>Prioridades por revisar</h3>{report.omitted.length ? report.omitted.map(a => <p key={a.id}><strong>Omitida: {a.label}.</strong> {a.rationale}</p>) : <p>Registraste todas las acciones críticas del caso.</p>}{report.late.map(a => <p key={a.id}><strong>Tardía: {a.label}.</strong> Se esperaba antes de {time(a.deadline!)} del escenario.</p>)}{report.harmful.map(a => <p key={a.id}><strong>Revisar: {a.label}.</strong> {a.rationale}</p>)}</article></div><QuestionScore score={score} complete={questionsComplete}/><DecisionReview decisions={learningDecisions}/><QuestionHistory questions={askedQuestions} answers={answers} onAnswer={(id,option)=>setAnswers(previous=>answerQuestion(previous,id,option,run.elapsed))}/><section className="final-case-questions"><h3>Dos preguntas de cierre</h3><p>Respuestas confirmadas durante el cierre obligatorio.</p>{finalQuestions(c.id).map(q=><QuestionCard key={q.id} question={q} answer={answers.find(a=>a.questionId===q.id)} onAnswer={option=>setAnswers(previous=>answerQuestion(previous,q.id,option,run.elapsed))}/>)}</section><div className={styles.reportButtons}><button className={styles.startButton} onClick={() => reset(c.id)}>Repetir caso ↻</button><button className={styles.subtleButton} disabled={!questionsComplete} onClick={exportReport}>Descargar evaluación</button><Link className={styles.subtleButton} href={`/pae-assistant?scenario=${c.id}`}>Preparar PAE del caso ↗</Link><button className={styles.subtleButton} onClick={() => { setPendingCase(c.id); setSwitchCase(true); }}>Elegir otro caso →</button></div></section>}
        {mode === "practice" && !finished && <details className={styles.guideCard} aria-label="Guía de la sala clínica"><summary>¿Qué hago ahora?</summary><h2>{run.status === "ready" ? "Lee la entrega y comienza la atención" : nextCritical ? nextCritical.label : "Compara la respuesta y registra tu hipótesis"}</h2><p>{run.status === "ready" ? "Pulsa Iniciar simulación. Los puntos de la imagen abren hallazgos; los cuidados se realizan desde el panel de decisiones. El punto 04 requiere consentimiento previo." : nextCritical ? nextCritical.rationale : "Revisa las tendencias, lee los resultados disponibles y comprueba qué cuidados faltan antes de finalizar."}</p><button className={styles.startButton} disabled={!running} onClick={() => openActionGroup(nextCritical?.group ?? "valoracion")}>{nextCritical ? `Ir a ${groups.find(item => item.id === nextCritical.group)?.label.toLowerCase()} →` : "Volver a decisiones →"}</button><small>Orientación de práctica; puedes atender varias necesidades sin seguir una secuencia rígida.</small></details>}

        <div role="tabpanel" id="workspace-panel" aria-labelledby={`tab-${panel}`}>

          {panel==="monitoring"&&<section className={styles.monitoringControls}><h2>Conectar y medir</h2><p>El monitor está siempre visible. Conecta cada sensor para ver su lectura; la paciente evoluciona aunque esté desconectado.</p>{MONITORING_OPTIONS.filter(option=>GYNECOLOGY_MONITOR_CHANNELS.includes(option.key as GynecologyMonitoringKey)).map(option=><label key={option.key}><span><strong>{option.label}</strong><small>{option.detail}</small></span><input type="checkbox" role="switch" aria-label={option.label} disabled={!running} checked={measured(option.key as GynecologyMonitoringKey)} onChange={event=>setRun(previous=>setGynecologyMonitoring(previous,option.key as GynecologyMonitoringKey,event.target.checked))}/></label>)}<small>La capnografía no está modelada en estos casos.</small></section>}
          {panel==="history"&&<section className={styles.caseInformation}><h2>{c.name} · {c.age} años</h2><p>{c.background}</p><p>{c.handover}</p><label>Modalidad<select disabled={run.status!=="ready"} value={mode} onChange={event=>setMode(event.target.value as typeof mode)}><option value="practice">Práctica con orientación</option><option value="evaluation">Evaluación sin pistas</option></select></label><p>Explora a la paciente, conecta los sensores y selecciona cuidados. Las preguntas detienen el caso hasta responder. Cada acierto suma 5 puntos y cada error resta 5.</p><ol>{careSteps.map(step=><li key={step.label}>{step.done?"✓":"○"} {step.label} · {step.detail}</li>)}</ol>        <details className={styles.caseDetails}><summary>Entrega de turno y objetivos <span>↗</span></summary><div className={styles.handover}><span className={styles.sectionLabel}>ENTREGA DE TURNO</span><p>{c.handover}</p><p>{CLINICAL_SOURCES[c.obstetricKey?"msp-obstetric":"msp-maternal"].scope}</p>{c.supplementalSource&&<a href={c.supplementalSource.url} target="_blank" rel="noreferrer">Referencia complementaria: {c.supplementalSource.label} ↗</a>}</div><div className={styles.objectives}><span className={styles.sectionLabel}>OBJETIVOS DE LA GUARDIA</span>{(mode === "practice" || finished) ? c.objectives.map((objective, index) => <p key={objective}><span>0{index + 1}</span>{objective}</p>) : <p>Los objetivos se revisarán al finalizar.</p>}</div></details></section>}
          {panel === "actions" && <><nav className={styles.decisionGroups} aria-label="Categorías de acciones">{visibleGroups.map(item => <button key={item.id} aria-pressed={group === item.id} onClick={() => openActionGroup(item.id)}>{item.label}</button>)}</nav>{group === "obstetricia" && <div className={styles.obstetricGuide}>{mode === "practice" && OBSTETRIC_KEYS.map(item => <p key={item.id}><strong>{item.label}</strong> · {item.indication}</p>)}<a href={OBSTETRIC_SOURCE.url} target="_blank" rel="noreferrer">Protocolo MSP 2025 ↗</a></div>}<div className={styles.actionHeading}><span>{groups.find(item => item.id === group)?.icon}</span><div><h2>{groups.find(item => item.id === group)?.label}</h2><p>Selecciona una acción para registrarla.</p></div></div><label className={styles.catalogSearch}>Buscar opción<input value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)} placeholder="Fármaco, prueba o cuidado"/></label>{drugCategories.length>2&&<div className="drug-categories">{drugCategories.map(category=><button key={category} aria-pressed={drugCategory===category} onClick={()=>setDrugCategory(category)}>{category}</button>)}</div>}<div className={styles.actionList}>{c.actions.filter(a => !(group==="obstetricia"&&(a.id==="tann"||a.id.startsWith("tann-"))) && a.group === group && (drugCategory==="Todas"||(a.category??"Otros")===drugCategory) && `${a.label} ${a.category??""}`.toLowerCase().includes(catalogSearch.toLowerCase())).map(action => {
            const done = selected(action.id) || !!(action.fulfills && selected(action.fulfills)); const available = actionAvailable(action, run, c);
            return <article key={action.id}>{action.presentations&&<label className="drug-presentation">Presentación de {action.label}<select disabled={!running||done} aria-label={`Presentación de ${action.label}`} value={drugPresentations[action.id]??action.presentations[0]} onChange={e=>setDrugPresentations(previous=>({...previous,[action.id]:e.target.value}))}>{action.presentations.map(p=><option key={p}>{p}</option>)}</select></label>}<button className={`${styles.action} ${done ? styles.actionDone : ""}`} onClick={() => act(action.id)} disabled={!running || done || !available}><span className={styles.actionCheck}>{done ? "✓" : "+"}</span><span><strong>{action.label}</strong><small>{done ? action.group === "estudios" && !resultReady(action, run) ? "En proceso · revisa Estudios" : "Registrado" : !available ? `Antes: ${(action.requires ?? []).filter(id => !selected(id)).map(id => c.actions.find(a => a.id === id)?.label).join(" · ")}` : action.minutes ? `Resultado en ${action.minutes * 60} s simulados` : "Pulsa para realizar este cuidado"}</small>{mode === "practice" && !done && <small className={styles.actionPurpose}>{action.rationale}</small>}</span></button></article>;
          })}</div>{group==="obstetricia"&&c.actions.some(a=>a.id==="tann")&&<TannPlacementPanel scenario={c} run={run} onAction={act}/>}</>}
          {panel === "results" && <div className={styles.resultList}>{!studies.length && <div className={styles.empty}><span>⌕</span><h3>Aún no hay estudios</h3><p>Solicita las pruebas que consideres necesarias. Los resultados aparecerán aquí cuando estén disponibles.</p></div>}{studies.map(action => <article key={action.id} className={styles.study}><small>{resultReady(action, run) ? "RESULTADO DISPONIBLE" : "EN PROCESO"}</small><h3>{action.label}</h3>{!resultReady(action, run) && <progress aria-label={`Progreso de ${action.label}`} max={(action.minutes ?? 0) * 60} value={Math.max(0, run.elapsed - (run.decisions.find(decision => decision.id === action.id)?.at ?? run.elapsed))}/>}<p>{resultReady(action, run) ? action.result : `Disponible en ${Math.max(0, Math.ceil((run.decisions.find(d => d.id === action.id)?.at ?? 0) + (action.minutes ?? 0) * 60 - run.elapsed))} s simulados.`}</p></article>)}</div>}
          {panel === "log" && <QuestionHistory questions={askedQuestions} answers={answers} onAnswer={(id,option)=>setAnswers(previous=>answerQuestion(previous,id,option,run.elapsed))}/>}{panel === "log" && <ol className={styles.timeline}>{!run.decisions.length && <li>El registro comienza con tu primera decisión.</li>}{[...run.decisions].reverse().map(decision => <li key={decision.id}><time>{time(decision.at)}</time><div><strong>{c.actions.find(a => a.id === decision.id)?.label}</strong>{(mode === "practice" || finished) && <p>{c.actions.find(a => a.id === decision.id)?.rationale}</p>}</div></li>)}</ol>}
        </div>
        {finding && <div className={styles.feedback} role="status"><strong>{finding.title}</strong><p>{finding.body}</p>{finding.needsConsent && <button onClick={() => { setFinding(null); openActionGroup("valoracion"); }}>Ir a explicar y solicitar consentimiento →</button>}<button onClick={() => setFinding(null)}>Cerrar hallazgo ×</button></div>}
        {notice && <div className={styles.feedback} role="status"><span>{mode === "practice" ? "ORIENTACIÓN CLÍNICA" : "REGISTRO"}</span><p>{notice}</p></div>}
        {lastDecision && mode === "practice" && <section className={styles.responseCard} aria-label="Respuesta observada en la sala"><strong>Después de: {lastDecision.label}</strong><p>Signos al decidir ({time(lastDecision.at)}) → signos actuales. También influyen el tiempo y los demás cuidados.</p><div><span>FC <b>{lastDecision.monitoring.ecg!==undefined?lastDecision.vitals.hr:"—"} → {measured("ecg")?physiology.vitals.hr:"—"}</b></span><span>SpO₂ <b>{lastDecision.monitoring.spo2!==undefined?lastDecision.vitals.spo2:"—"} → {measured("spo2")?physiology.vitals.spo2:"—"}%</b></span><span>Sistólica <b>{lastDecision.monitoring.bp!==undefined?lastDecision.vitals.sbp:"—"} → {measured("bp")?physiology.vitals.sbp:"—"}</b></span></div></section>}
        <label className={styles.diagnosis}>Hipótesis diagnóstica<select disabled={!running} value={run.diagnosis} onChange={e => setRun(previous => ({ ...previous, diagnosis: e.target.value }))}><option value="">Selecciona tu hipótesis…</option>{[...new Set(GYNECOLOGY_CASES.flatMap(item => [item.diagnosis, ...item.differentials]))].sort().map(d => <option key={d}>{d}</option>)}</select></label>
        <div className={styles.decisionFooter}><span>{run.decisions.length} acciones registradas</span><span>{mode === "practice" ? "Práctica guiada" : "Evaluación"}</span></div>
      </section>
    </div>

        <div className={styles.actionDock} aria-label="Barra de atención"><div className={styles.dockHeading}><span>¿QUÉ QUIERES HACER?</span><span>{run.decisions.length} acciones registradas</span></div><div className={styles.actionGroups}><Link href="/simulation-hub" className={styles.exitLink} aria-label="Volver a escenarios">← Escenarios</Link><button aria-label="Monitorizar" onClick={()=>{setDrawerOpen(true);setPanel("monitoring");}} aria-pressed={panel==="monitoring"}><span>⌁</span><strong>Monitorizar</strong></button>{visibleGroups.map(item => <button key={item.id} onClick={() => openActionGroup(item.id)} aria-label={`${item.icon} ${item.label}`} aria-pressed={group === item.id && panel === "actions"}><span>{item.icon}</span><strong>{item.label}</strong><small>{c.actions.filter(action => action.group === item.id && selected(action.id)).length} registradas</small></button>)}</div></div>
    <footer className={styles.footer}><p>Simulación educativa · evolución simplificada · {time(RUN_LIMIT)} por sesión · las decisiones deben adaptarse al rol y protocolo institucional.</p><a href={c.source.url} target="_blank" rel="noreferrer">Referencia: {c.source.label} ↗</a></footer>
    {activeQuestion&&<MandatoryQuestion key={activeQuestion.id} question={activeQuestion} answer={answers.find(a=>a.questionId===activeQuestion.id)} onAnswer={option=>setAnswers(previous=>answerQuestion(previous,activeQuestion.id,option,run.elapsed))} onContinue={continueQuestion} progress={activeQuestion.stage==="final"?`Pregunta ${closingIndex+1} de ${closingQuestions.length}`:undefined}/>}
    <dialog ref={dialogRef} className={styles.dialog} onCancel={event => { event.preventDefault(); closeDialog(); }} aria-labelledby="room-dialog-title">
      <button className={styles.close} onClick={closeDialog} aria-label="Cerrar diálogo">×</button>

      {switchCase && <><span className={styles.eyebrow}>TU PRÓXIMA GUARDIA</span><h2 id="room-dialog-title">Elige un escenario</h2><p>Cada caso tiene hallazgos y prioridades diferentes. Cambiar de caso reinicia la sesión actual.</p><div className={styles.caseFilters} aria-label="Filtrar casos por clave">{[{id:"all",label:"Todos"},{id:"roja",label:"Clave roja"},{id:"azul",label:"Clave azul"},{id:"amarilla",label:"Clave amarilla"},{id:"gyn",label:"Ginecología"}].map(filter=><button key={filter.id} aria-pressed={caseFilter===filter.id} onClick={()=>{setCaseFilter(filter.id);const first=GYNECOLOGY_CASES.find(item=>filter.id==="all"||filter.id==="gyn"&&!item.obstetricKey||item.obstetricKey===filter.id);if(first)setPendingCase(first.id);}}>{filter.label} ({GYNECOLOGY_CASES.filter(item=>filter.id==="all"||filter.id==="gyn"&&!item.obstetricKey||item.obstetricKey===filter.id).length})</button>)}</div><div className={styles.caseOptions}>{GYNECOLOGY_CASES.filter(item=>caseFilter==="all"||caseFilter==="gyn"&&!item.obstetricKey||item.obstetricKey===caseFilter).map(item => <button key={item.id} aria-pressed={pendingCase === item.id} onClick={() => setPendingCase(item.id)}><small data-key={item.obstetricKey}>{item.obstetricKey?`Clave ${item.obstetricKey}`:item.specialty} · {item.difficulty}</small><strong>{item.title}</strong><span>{item.age} años · {item.name} · {item.background}</span><p>{item.handover}</p>{item.actions.some(a=>a.id==="tann-6")&&<small>Práctica de TANN por segmentos disponible</small>}</button>)}</div><button className={styles.startButton} onClick={() => reset(pendingCase)}>Preparar escenario →</button></>}
      {confirmEnd && <><span className={styles.eyebrow}>CIERRE DE SESIÓN</span><h2 id="room-dialog-title">¿Finalizar y revisar?</h2><p>Se evaluarán las decisiones tomadas, la hipótesis diagnóstica y las prioridades que quedaron pendientes.</p><button className={styles.startButton} onClick={() => { wasRunning.current = false; setRun(previous => ({ ...previous, status: "finished" })); closeDialog(); }}>Finalizar y ver evaluación →</button><button className={styles.subtleButton} onClick={closeDialog}>Seguir atendiendo</button></>}
    </dialog>
  </main></div>;
}
