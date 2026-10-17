"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MultiparameterMonitor from "@/components/advanced/MultiparameterMonitor";
import { GYNECOLOGY_CASES, OBSTETRIC_KEYS, OBSTETRIC_SOURCE, RUN_LIMIT, actionAvailable, createRun, evaluateRun, getPhysiology, performAction, resultReady, type ActionGroup, type SimulationRun } from "@/src/lib/gynecologySimulation";
import PatientScene from "./PatientScene";
import VitalsTrend from "./VitalsTrend";
import styles from "./room.module.css";

const groups: { id: ActionGroup; label: string; icon: string }[] = [
  { id: "valoracion", label: "Valoración", icon: "◎" },
  { id: "estudios", label: "Estudios", icon: "⌕" },
  { id: "intervencion", label: "Intervenciones", icon: "✚" },
  { id: "obstetricia", label: "Claves y TANN", icon: "✥" },
  { id: "equipo", label: "Equipo y destino", icon: "↗" },
];
const time = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
type Finding = { title: string; body: string; needsConsent?: boolean };
export default function ClinicalRoom() {
  const [run, setRun] = useState<SimulationRun>(() => createRun(GYNECOLOGY_CASES[0].id));
  const [mode, setMode] = useState<"practice" | "evaluation">("practice");
  const [group, setGroup] = useState<ActionGroup>("valoracion");
  const [panel, setPanel] = useState<"actions" | "results" | "log">("actions");
  const [examinedZones, setExaminedZones] = useState<string[]>([]);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [notice, setNotice] = useState("");
  const [lastDecision, setLastDecision] = useState<{ at: number; label: string; vitals: ReturnType<typeof getPhysiology>["vitals"] } | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [sound, setSound] = useState(false);
  const [switchCase, setSwitchCase] = useState(false);
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
  const selected = (id: string) => run.decisions.some(d => d.id === id);
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
    setGroup(next); setPanel("actions");
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
    if (!sound || !running) return;
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
  }, [sound, running, physiology.critical, physiology.vitals.hr]);
  useEffect(() => () => { void audioRef.current?.close(); }, []);

  function closeDialog() { setFinding(null); setSwitchCase(false); setConfirmEnd(false); }
  function reset(caseId: string) {
    wasRunning.current = false;
    setLastDecision(null);
    setRun(createRun(caseId)); setExaminedZones([]); setPendingCase(caseId); setGroup("valoracion"); setPanel("actions"); setNotice(""); closeDialog();
  }
  function act(id: string) {
    const action = c.actions.find(a => a.id === id)!;
    const next = performAction(c, run, id);
    if (next === run) return;
    setLastDecision({ at: run.elapsed, label: action.label, vitals: { ...physiology.vitals } });
    setRun(next);
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
  function exportReport() {
    const data = { simulator: "Psyke · Sala clínica", version: 1, date: new Date().toISOString(), case: c.title, mode, elapsed: run.elapsed, diagnosis: run.diagnosis, score: report.score, criticalOmissions: report.omitted.map(a => a.label), lateActions: report.late.map(a => a.label), decisions: run.decisions.map(d => ({ at: time(d.at), action: c.actions.find(a => a.id === d.id)?.label })), source: c.source };
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

  return <div className={`${styles.shell} ${focusMode ? styles.focusShell : ""}`}><div className={`${styles.navigationPane} ${focusMode ? styles.navigationHidden : ""}`}><Sidebar /></div><main ref={roomRef} className={`${styles.room} ${!running ? styles.paused : ""}`}>
    <header className={styles.header}>
      <div><div className={styles.eyebrow}><span className={styles.liveDot} /> PSYKE / EXPERIENCIAS CLÍNICAS <span className={styles.newBadge}>SALA 01</span></div><h1>Sala clínica<span>Tu guardia, tus decisiones.</span></h1><p>Ginecología y obstetricia · Un entorno para practicar el razonamiento clínico.</p></div>
      <div className={styles.headerActions}><button className={styles.focusToggle} onClick={() => setFocusMode(value => !value)} aria-pressed={focusMode}>{focusMode ? "Mostrar navegación" : "Expandir sala"} ↗</button><Link href="/simulation-hub" className={styles.link}>Todos los escenarios ↗</Link><button onClick={fullscreen} className={styles.iconButton} aria-label="Alternar pantalla completa" title="Pantalla completa">⛶</button><button onClick={toggleSound} className={styles.iconButton} aria-pressed={sound}>{sound ? "Sonido activo" : "Sin sonido"}</button></div>
    </header>
    <section className={styles.toolbar} aria-label="Controles de sesión">
      <div className={styles.caseControl}><span className={styles.caseNumber}>{String(GYNECOLOGY_CASES.findIndex(item => item.id === c.id) + 1).padStart(2, "0")}</span><div><small>{c.specialty.toUpperCase()} · {c.difficulty}</small><strong>{c.title}</strong></div><button onClick={() => { setPendingCase(c.id); setSwitchCase(true); }} className={styles.subtleButton}>Cambiar caso ↗</button></div>
      <div className={styles.sessionControls}><span className={styles.clock} aria-label="Tiempo simulado">T+ {time(run.elapsed)}</span><button className={styles.subtleButton} onClick={advance} disabled={!running}>+30 s</button><button className={styles.startButton} disabled={finished} onClick={() => setRun(previous => ({ ...previous, status: previous.status === "running" ? "paused" : "running" }))}>{run.status === "ready" ? "Iniciar simulación ▷" : running ? "Pausar Ⅱ" : finished ? "Finalizada" : "Continuar ▷"}</button>{run.status !== "ready" && !finished && <button className={styles.subtleButton} onClick={() => setConfirmEnd(true)}>Finalizar</button>}</div>
    </section>
    {run.status === "ready" && <div className={styles.intro}><div><strong>Tu guardia comienza aquí.</strong><p>Recibe a la paciente, explora los puntos de la camilla y decide qué hacer. Los estudios tardan en llegar y el estado cambia con el tiempo.</p></div><label>Modalidad<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="practice">Práctica con orientación</option><option value="evaluation">Evaluación sin pistas</option></select></label></div>}
    {run.status === "paused" && <div className={styles.pauseBanner}>Simulación en pausa · el tiempo y la evolución están detenidos.{!modalOpen && <button onClick={() => setRun(previous => ({ ...previous, status: "running" }))}>Continuar →</button>}</div>}
    <div className={styles.carePath} aria-label="Actividad de la sesión">
      <div className={styles.pathHeading}><span>RECORRIDO CLÍNICO</span><small>Tu actividad, sin una secuencia obligatoria</small></div>
      <ol>{careSteps.map((step, index) => <li key={step.label} className={step.done ? styles.pathRecorded : ""}><span>{step.done ? "✓" : `0${index + 1}`}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div></li>)}</ol>
    </div>
    <div className={styles.workspace}>
      <div className={styles.bedsideRibbon}><MultiparameterMonitor layout="ribbon" vitals={physiology.vitals} paused={!running} timeLabel={time(run.elapsed)} statusLabel={physiology.critical ? "Alerta clínica" : "Vigilancia"}/></div>
      <section className={styles.monitorColumn} aria-label="Monitor y estado de la paciente">
        <div className={styles.sectionLabel}><span>FISIOLOGÍA EN VIVO</span><span className={styles.liveDot} /></div>
        <MultiparameterMonitor vitals={physiology.vitals} baselineVitals={c.initial} title="Monitor de cabecera" subtitle="Señales educativas simuladas" accent="cyan" layout="station" paused={!running} statusLabel={physiology.critical ? "Requiere atención inmediata" : "Vigilancia clínica"} rhythmLabel={physiology.vitals.hr > 100 ? "Taquicardia sinusal" : "Ritmo sinusal"} timeLabel={time(run.elapsed)} />
        <div className={styles.metricGrid}><div><small>Índice de choque</small><strong className={physiology.shockIndex >= 1 ? styles.danger : ""}>{physiology.shockIndex.toFixed(2)}</strong><span>FC / presión sistólica</span></div><div><small>Sangrado visible</small><strong>{physiology.bleeding}<em> mL</em></strong><span>Estimación del escenario</span></div></div>
        <div className={styles.stateCard}><span className={physiology.critical ? styles.alertDot : styles.liveDot} /><div><strong>{physiology.escalated ? "Atención especializada coordinada" : physiology.critical ? "Compromiso fisiológico" : "Necesita reevaluación"}</strong><p>{physiology.escalated ? "Mantén el soporte. Coordinar atención no equivale a resolver la causa." : "La evolución depende del tiempo y de tus decisiones."}</p></div></div>
        <VitalsTrend scenario={c} run={run}/>
      </section>
      <section id="room-patient" className={styles.patientColumn} aria-label="Paciente y exploración">
        <div className={styles.patientHeader}><div><strong>{c.name}</strong><span>{c.age} años · {c.background}</span></div><span className={styles.syntheticBadge}>Caso ficticio</span></div>
        <PatientScene key={c.id} oxygen={selected("oxygen")} iv={selected("iv")} fluids={selected("fluids")} tann={selected("tann") && !selected("tann-remove")} active={running} examined={examinedZones} onExplore={explore}/>
        <div className={styles.quote}><span>“</span><p>{selected("fluids") && physiology.escalated ? "¿Van a quedarse conmigo? Díganme qué está pasando, por favor." : c.complaint}</p></div>
        <div className={styles.actionDock} aria-label="Barra de atención"><div className={styles.dockHeading}><span>¿QUÉ QUIERES HACER?</span><span>{run.decisions.length} acciones registradas</span></div><div className={styles.actionGroups}>{visibleGroups.map(item => <button key={item.id} onClick={() => openActionGroup(item.id)} aria-label={`${item.icon} ${item.label}`} aria-pressed={group === item.id && panel === "actions"}><span>{item.icon}</span><strong>{item.label}</strong><small>{c.actions.filter(action => action.group === item.id && selected(action.id)).length} registradas</small></button>)}</div></div>
        <details className={styles.caseDetails}><summary>Entrega de turno y objetivos <span>↗</span></summary><div className={styles.handover}><span className={styles.sectionLabel}>ENTREGA DE TURNO</span><p>{c.handover}</p></div><div className={styles.objectives}><span className={styles.sectionLabel}>OBJETIVOS DE LA GUARDIA</span>{(mode === "practice" || finished) ? c.objectives.map((objective, index) => <p key={objective}><span>0{index + 1}</span>{objective}</p>) : <p>Los objetivos se revisarán al finalizar.</p>}</div></details>
      </section>
      <section ref={decisionRef} className={styles.decisionColumn} aria-label="Decisiones y resultados">
        <div className={styles.tabs} role="tablist" aria-label="Área de trabajo">{([{ id: "actions", label: "Decisiones" }, { id: "results", label: `Estudios (${readyStudies.length})` }, { id: "log", label: "Registro" }] as const).map(tab => <button key={tab.id} id={`tab-${tab.id}`} aria-controls="workspace-panel" role="tab" aria-selected={panel === tab.id} onClick={() => setPanel(tab.id)}>{tab.label}</button>)}</div>
        {mode === "practice" && !finished && <details className={styles.guideCard} aria-label="Guía de la sala clínica"><summary>¿Qué hago ahora?</summary><h2>{run.status === "ready" ? "Lee la entrega y comienza la atención" : nextCritical ? nextCritical.label : "Compara la respuesta y registra tu hipótesis"}</h2><p>{run.status === "ready" ? "Pulsa Iniciar simulación. Los puntos de la imagen abren hallazgos; los cuidados se realizan desde el panel de decisiones. El punto 04 requiere consentimiento previo." : nextCritical ? nextCritical.rationale : "Revisa las tendencias, lee los resultados disponibles y comprueba qué cuidados faltan antes de finalizar."}</p><button className={styles.startButton} disabled={!running} onClick={() => openActionGroup(nextCritical?.group ?? "valoracion")}>{nextCritical ? `Ir a ${groups.find(item => item.id === nextCritical.group)?.label.toLowerCase()} →` : "Volver a decisiones →"}</button><small>Orientación de práctica; puedes atender varias necesidades sin seguir una secuencia rígida.</small></details>}
        <div role="tabpanel" id="workspace-panel" aria-labelledby={`tab-${panel}`}>
          {panel === "actions" && <><nav className={styles.decisionGroups} aria-label="Categorías de acciones">{visibleGroups.map(item => <button key={item.id} aria-pressed={group === item.id} onClick={() => openActionGroup(item.id)}>{item.label}</button>)}</nav>{group === "obstetricia" && <div className={styles.obstetricGuide}>{mode === "practice" && OBSTETRIC_KEYS.map(item => <p key={item.id}><strong>{item.label}</strong> · {item.indication}</p>)}<a href={OBSTETRIC_SOURCE.url} target="_blank" rel="noreferrer">Protocolo MSP 2025 ↗</a></div>}<div className={styles.actionHeading}><span>{groups.find(item => item.id === group)?.icon}</span><div><h2>{groups.find(item => item.id === group)?.label}</h2><p>Selecciona una acción para registrarla.</p></div></div><div className={styles.actionList}>{c.actions.filter(a => a.group === group).map(action => {
            const done = selected(action.id); const available = actionAvailable(action, run);
            return <button key={action.id} className={`${styles.action} ${done ? styles.actionDone : ""}`} onClick={() => act(action.id)} disabled={!running || done || !available}><span className={styles.actionCheck}>{done ? "✓" : "+"}</span><span><strong>{action.label}</strong><small>{done ? action.group === "estudios" && !resultReady(action, run) ? "En proceso · revisa Estudios" : "Registrado" : !available ? `Antes: ${(action.requires ?? []).filter(id => !selected(id)).map(id => c.actions.find(a => a.id === id)?.label).join(" · ")}` : action.minutes ? `Resultado en ${action.minutes * 60} s simulados` : "Pulsa para realizar este cuidado"}</small>{mode === "practice" && !done && <small className={styles.actionPurpose}>{action.rationale}</small>}</span></button>;
          })}</div></>}
          {panel === "results" && <div className={styles.resultList}>{!studies.length && <div className={styles.empty}><span>⌕</span><h3>Aún no hay estudios</h3><p>Solicita las pruebas que consideres necesarias. Los resultados aparecerán aquí cuando estén disponibles.</p></div>}{studies.map(action => <article key={action.id} className={styles.study}><small>{resultReady(action, run) ? "RESULTADO DISPONIBLE" : "EN PROCESO"}</small><h3>{action.label}</h3>{!resultReady(action, run) && <progress aria-label={`Progreso de ${action.label}`} max={(action.minutes ?? 0) * 60} value={Math.max(0, run.elapsed - (run.decisions.find(decision => decision.id === action.id)?.at ?? run.elapsed))}/>}<p>{resultReady(action, run) ? action.result : `Disponible en ${Math.max(0, Math.ceil((run.decisions.find(d => d.id === action.id)?.at ?? 0) + (action.minutes ?? 0) * 60 - run.elapsed))} s simulados.`}</p></article>)}</div>}
          {panel === "log" && <ol className={styles.timeline}>{!run.decisions.length && <li>El registro comienza con tu primera decisión.</li>}{[...run.decisions].reverse().map(decision => <li key={decision.id}><time>{time(decision.at)}</time><div><strong>{c.actions.find(a => a.id === decision.id)?.label}</strong>{(mode === "practice" || finished) && <p>{c.actions.find(a => a.id === decision.id)?.rationale}</p>}</div></li>)}</ol>}
        </div>
        {finding && <div className={styles.feedback} role="status"><strong>{finding.title}</strong><p>{finding.body}</p>{finding.needsConsent && <button onClick={() => { setFinding(null); openActionGroup("valoracion"); }}>Ir a explicar y solicitar consentimiento →</button>}<button onClick={() => setFinding(null)}>Cerrar hallazgo ×</button></div>}
        {notice && <div className={styles.feedback} role="status"><span>{mode === "practice" ? "ORIENTACIÓN CLÍNICA" : "REGISTRO"}</span><p>{notice}</p></div>}
        {lastDecision && mode === "practice" && <section className={styles.responseCard} aria-label="Respuesta observada en la sala"><strong>Después de: {lastDecision.label}</strong><p>Signos al decidir ({time(lastDecision.at)}) → signos actuales. También influyen el tiempo y los demás cuidados.</p><div><span>FC <b>{lastDecision.vitals.hr} → {physiology.vitals.hr}</b></span><span>SpO₂ <b>{lastDecision.vitals.spo2} → {physiology.vitals.spo2}%</b></span><span>Sistólica <b>{lastDecision.vitals.sbp} → {physiology.vitals.sbp}</b></span></div></section>}
        <label className={styles.diagnosis}>Hipótesis diagnóstica<select disabled={!running} value={run.diagnosis} onChange={e => setRun(previous => ({ ...previous, diagnosis: e.target.value }))}><option value="">Selecciona tu hipótesis…</option>{[...new Set(GYNECOLOGY_CASES.flatMap(item => [item.diagnosis, ...item.differentials]))].sort().map(d => <option key={d}>{d}</option>)}</select></label>
        <div className={styles.decisionFooter}><span>{run.decisions.length} acciones registradas</span><span>{mode === "practice" ? "Práctica guiada" : "Evaluación"}</span></div>
      </section>
    </div>
    {finished && <section className={styles.report} aria-label="Evaluación de la sesión"><div className={styles.reportHeading}><div><span className={styles.eyebrow}>DEBRIEFING / TU SESIÓN</span><h2>{report.safe ? "Prioridades críticas completadas" : "Revisemos tus decisiones"}</h2><p>{run.elapsed >= RUN_LIMIT ? "Terminó el tiempo del escenario. " : "Sesión finalizada. "}Esta puntuación es educativa y no acredita competencia profesional.</p></div><div className={styles.score}>{report.score}<small>/100</small></div></div><div className={styles.reportGrid}><article><h3>Razonamiento clínico</h3><p>Hipótesis esperada: <strong>{c.diagnosis}</strong>.</p><p>{report.correctDiagnosis ? "Tu hipótesis coincide con el escenario." : `Tu hipótesis: ${run.diagnosis || "Sin registrar"}. Revisa los hallazgos y diagnósticos alternativos.`}</p><p>75% prioridades críticas · 25% hipótesis · penalizaciones por acciones inseguras y tardías. Una omisión crítica limita la nota a 69.</p></article><article><h3>Prioridades por revisar</h3>{report.omitted.length ? report.omitted.map(a => <p key={a.id}><strong>Omitida: {a.label}.</strong> {a.rationale}</p>) : <p>Registraste todas las acciones críticas del caso.</p>}{report.late.map(a => <p key={a.id}><strong>Tardía: {a.label}.</strong> Se esperaba antes de {time(a.deadline!)} del escenario.</p>)}{report.harmful.map(a => <p key={a.id}><strong>Revisar: {a.label}.</strong> {a.rationale}</p>)}</article></div><div className={styles.reportButtons}><button className={styles.startButton} onClick={() => reset(c.id)}>Repetir caso ↻</button><button className={styles.subtleButton} onClick={exportReport}>Descargar evaluación</button><Link className={styles.subtleButton} href={`/pae-assistant?scenario=${c.id}`}>Preparar PAE del caso ↗</Link><button className={styles.subtleButton} onClick={() => { setPendingCase(c.id); setSwitchCase(true); }}>Elegir otro caso →</button></div></section>}
    <footer className={styles.footer}><p>Simulación educativa · evolución simplificada · {time(RUN_LIMIT)} por sesión · las decisiones deben adaptarse al rol y protocolo institucional.</p><a href={c.source.url} target="_blank" rel="noreferrer">Referencia: {c.source.label} ↗</a></footer>
    <dialog ref={dialogRef} className={styles.dialog} onCancel={event => { event.preventDefault(); closeDialog(); }} aria-labelledby="room-dialog-title">
      <button className={styles.close} onClick={closeDialog} aria-label="Cerrar diálogo">×</button>

      {switchCase && <><span className={styles.eyebrow}>TU PRÓXIMA GUARDIA</span><h2 id="room-dialog-title">Elige un escenario</h2><p>Cada caso tiene hallazgos y prioridades diferentes. Cambiar de caso reinicia la sesión actual.</p><div className={styles.caseOptions}>{GYNECOLOGY_CASES.map(item => <button key={item.id} aria-pressed={pendingCase === item.id} onClick={() => setPendingCase(item.id)}><small>{item.specialty} · {item.difficulty}</small><strong>{item.title}</strong><span>{item.age} años · {item.name}</span></button>)}</div><button className={styles.startButton} onClick={() => reset(pendingCase)}>Preparar escenario →</button></>}
      {confirmEnd && <><span className={styles.eyebrow}>CIERRE DE SESIÓN</span><h2 id="room-dialog-title">¿Finalizar y revisar?</h2><p>Se evaluarán las decisiones tomadas, la hipótesis diagnóstica y las prioridades que quedaron pendientes.</p><button className={styles.startButton} onClick={() => { wasRunning.current = false; setRun(previous => ({ ...previous, status: "finished" })); closeDialog(); }}>Finalizar y ver evaluación →</button><button className={styles.subtleButton} onClick={closeDialog}>Seguir atendiendo</button></>}
    </dialog>
  </main></div>;
}
