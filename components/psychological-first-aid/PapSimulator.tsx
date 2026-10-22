"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { PAP_ACTIONS, PAP_PHASES, PAP_SOURCES, contextualPapAction, createPapRun, endPapPractice, finishPap, hasPap, papBlock, papFinishBlock, papHint, papMotion, papObservation, papRubric, performPap, tickPap, type PapMode, type PapRun } from "@/src/lib/psychologicalFirstAid";
import { performPapText, type PapInputKind } from "@/src/lib/papConversation";
import { getAuthFetchHeaders } from "@/src/lib/clientAuth";
import { applyPapAiTurn, papAiSnapshot, parsePapAiTurn, type PapAiTurn } from "@/src/lib/papAi";
import FreeConversation from "./FreeConversation";
import ConversationThread from "./ConversationThread";
import { papSpokenReply } from "@/src/lib/papPresentation";
import styles from "./pap.module.css";

const PatientWorld = dynamic(() => import("./PatientWorld"), { ssr: false, loading: () => <div className={styles.worldMessage}>Preparando escena 3D…</div> });
const time = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
const GUIDANCE = [
  ["Prepararte y observar", "Conoce qué ocurrió, qué recursos existen y si es seguro acercarte. Identifica necesidades básicas y señales que requieren atención urgente. Cuida tu propia seguridad y reconoce los límites de tu rol."],
  ["Escuchar sin presionar", "Preséntate, pide permiso y pregunta qué necesita ahora. Escucha si desea hablar, acepta los silencios y respeta que rechace ayuda. No exijas detalles del evento ni interpretes una reacción aislada como un diagnóstico."],
  ["Apoyar con respeto", "Usa lenguaje sencillo y honesto. No minimices, juzgues ni prometas un resultado. Evita tocar sin permiso, imponer ejercicios o hacer por la persona lo que puede decidir y realizar por sí misma. Adapta la ayuda a su cultura, edad y preferencias."],
  ["Conectar y dar continuidad", "Acuerda ayuda práctica, información verificada, apoyos elegidos y acceso a servicios. Protege la privacidad y explica sus límites. Confirma la recepción si derivas y reevalúa antes de cerrar; la persona no tiene que dejar de llorar para haber recibido un buen apoyo."],
  ["Reconocer cuándo necesitas ayuda", "Una amenaza inmediata, riesgo de hacerse daño o dañar a otros, una alteración importante de la conciencia o un síntoma físico nuevo requieren activar el equipo correspondiente según el protocolo local. PAP acompaña y facilita acceso: no sustituye valoración médica o especializada."],
  ["Después de acompañar", "Registra solo lo pertinente, entrega información al equipo que corresponda y busca supervisión. Revisa cómo te afectó la intervención, descansa y utiliza tus propios apoyos sin divulgar datos privados."],
];

export default function PapSimulator() {
  const [run, setRun] = useState<PapRun>(() => createPapRun());
  const [panel, setPanel] = useState<"actions" | "notes">("actions");
  const [guide, setGuide] = useState(false);
  const [close, setClose] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState("");
  const [reflection, setReflection] = useState("");
  const [draft, setDraft] = useState("");
  const [inputKind, setInputKind] = useState<PapInputKind>("speech");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [engine, setEngine] = useState<"gemini" | "local">("gemini");
  const [chatStatus, setChatStatus] = useState("");
  const request = useRef<AbortController | null>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedByVisibility = useRef(false);
  const latest = run.history.at(-1);
  const running = run.status === "running";
  const started = run.status !== "ready";
  const finished = run.status === "finished";
  const rubric = papRubric(run);
  const finishReason = papFinishBlock(run);
  const motion = papMotion(run);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(media.matches); change(); media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!running || pending) return;
    const timer = window.setInterval(() => setRun(value => tickPap(value)), 1000);
    return () => window.clearInterval(timer);
  }, [running, pending]);
  useEffect(() => {
    const visibility = () => { if (document.hidden) { pausedByVisibility.current = true; setRun(value => value.status === "running" ? { ...value, status: "paused" } : value); } };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    if (!running) {
      if (replyTimer.current) clearTimeout(replyTimer.current);
      replyTimer.current = null; request.current?.abort(); request.current = null; setPending(false);
    }
  }, [running]);
  useEffect(() => () => { if (replyTimer.current) clearTimeout(replyTimer.current); request.current?.abort(); }, []);
  useEffect(() => {
    if (!guide && !resetting) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setGuide(false); setResetting(false); }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector('[role="dialog"]');
      const focusable = dialog?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input, select, textarea, [tabindex="0"]');
      if (!focusable?.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [guide, resetting]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  function act(id: string) {
    const action = PAP_ACTIONS.find(a => a.id === id)!;
    const blocked = papBlock(run, action);
    if (blocked) { setNotice(blocked); return; }
    setNotice(""); setRun(value => performPap(value, id));
  }
  function send() {
    if (!running || !draft.trim() || pending) return;
    const message = draft; const kind = inputKind; const snapshot = papAiSnapshot(run);
    const controller = new AbortController(); request.current = controller;
    setPending(true); setNotice(""); setChatStatus("");
    replyTimer.current = setTimeout(async () => {
      replyTimer.current = null;
      let turn: PapAiTurn | null = null;
      if (engine === "gemini") {
        try {
          const headers = await getAuthFetchHeaders({ "Content-Type": "application/json" });
          if (controller.signal.aborted) return;
          const response = await fetch("/api/ai/pap-turn", { method: "POST", headers, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(28000)]), body: JSON.stringify({ run: snapshot, message, kind }) });
          if (!response.ok) throw new Error(response.status === 401 ? "login" : response.status === 429 ? "limit" : "unavailable");
          const data = await response.json(); turn = parsePapAiTurn(data.turn);
          if (!controller.signal.aborted) setChatStatus("Turno procesado con Gemini · acciones verificadas por el motor del caso.");
        } catch (error) {
          if (controller.signal.aborted) return;
          setChatStatus(error instanceof Error && error.message === "login" ? "Respuesta del guion local. Inicia sesión para conversar con Gemini." : error instanceof Error && error.message === "limit" ? "Respuesta del guion local. Se alcanzó el límite temporal de Gemini." : "Gemini no está disponible. Esta respuesta procede del guion local del caso.");
        }
      } else setChatStatus("Respuesta del guion local del caso.");
      if (controller.signal.aborted) return;
      setRun(v => v.status !== "running" ? v : turn ? applyPapAiTurn(v, message, kind, turn) : performPapText(v, message, kind));
      setDraft(""); setPending(false); request.current = null;
    }, 550);
  }
  function reset() { request.current?.abort(); request.current = null; setChatStatus(""); if (replyTimer.current) clearTimeout(replyTimer.current); replyTimer.current = null; setPending(false); setRun(createPapRun(run.mode, run.variant)); setPanel("actions"); setNotice(""); setReflection(""); setDraft(""); setToolsOpen(false); setInputKind("speech"); setResetting(false); }
  function download() {
    const payload = { simulator: "Psyke · Primeros auxilios psicológicos", case: "Valeria, 28 años · Tras un accidente", variant: run.variant, mode: run.mode, duration: time(run.elapsed), closure: run.closure, finalObservation: papObservation(run), reflection, educationalRubric: rubric, findings: run.findings, timeline: run.history, sources: PAP_SOURCES, note: "Caso ficticio. Rúbrica educativa orientativa, no acreditación de competencia clínica." };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "psyke-pap-devolucion.json"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function speak(message?: string) {
    if (!("speechSynthesis" in window)) { setNotice("Este navegador no dispone de lectura de voz. La respuesta está disponible en texto."); return; }
    window.speechSynthesis.cancel(); const spoken = message ?? papSpokenReply(latest); if (!spoken) return; const text = new SpeechSynthesisUtterance(spoken); text.lang = "es-EC"; text.rate = .92; window.speechSynthesis.speak(text);
  }
  return <main className={styles.app}>
    <header className={styles.header}>
      <Link href="/simulation-hub" className={styles.brand} aria-label="Psyke, volver a escenarios"><span className={styles.brandIcon}>ψ</span><strong>psyke<span> / laboratorio de simulación</span></strong></Link>
      <div className={styles.headerActions}><span className={styles.prototype}>PROTOTIPO 05</span><button onClick={() => { if (running) setRun(v => ({ ...v, status: "paused" })); setGuide(true); }}>Guía de PAP <span>↗</span></button></div>
    </header>
    <section className={styles.heading}>
      <div><p className={styles.eyebrow}>PSICOLOGÍA · INTERVENCIÓN INICIAL</p><h1>Estar presente también se aprende.</h1><p>Primeros auxilios psicológicos <span>·</span> observa, escucha y conecta.</p></div>
      <Link href="/simulation-hub" className={styles.back}>← Volver a escenarios</Link>
    </section>
    <div className={styles.casebar}>
      <div className={styles.avatar}>V</div><div><strong>Valeria <span>28 años</span></strong><p>Tras un accidente de tránsito · Sala de apoyo</p></div>
      <div className={styles.session}><span className={running ? styles.liveDot : styles.idleDot}/>{finished ? "Sesión finalizada" : running ? "Atención en curso" : run.status === "paused" ? "Sesión en pausa" : "Lista para comenzar"}<time>{time(run.elapsed)}</time></div>
      {started && !finished && <button className={styles.outline} onClick={() => setRun(v => ({ ...v, status: v.status === "running" ? "paused" : "running" }))}>{running ? "Pausar" : "Reanudar"}</button>}
      {started && <button className={styles.reset} onClick={() => { if (running) setRun(v => ({ ...v, status: "paused" })); setResetting(true); }}>Reiniciar</button>}
    </div>
    {!started ? <section className={styles.briefing}>
      <div className={styles.intro}><span className={styles.eyebrow}>TU PRIMER ENCUENTRO</span><h2>No sabes qué pasó.<br/>Puedes empezar por acompañar.</h2><p>Valeria llegó tras un accidente. Camina por la sala, aprieta las manos y busca noticias de su hermana. Tu tarea es ofrecer apoyo inmediato, identificar necesidades y acordar un siguiente paso seguro.</p>
        <div className={styles.facts}><span>01 caso interactivo</span><span>Sin límite de tiempo</span><span>Personaje ficticio</span></div>
        <fieldset className={styles.modeChoice}><legend>Cómo quieres practicar</legend>{(["practice", "assessment"] as PapMode[]).map(mode => <label key={mode} data-selected={run.mode === mode}><input type="radio" name="mode" checked={run.mode === mode} onChange={() => setRun(createPapRun(mode, run.variant))}/><strong>{mode === "practice" ? "Práctica guiada" : "Evaluación"}</strong><small>{mode === "practice" ? "Orientación y devolución tras intervenir" : "Devolución al finalizar, sin pistas"}</small></label>)}</fieldset>
        <label className={styles.variant}>Variación del caso<select aria-label="Variación del caso" value={run.variant} onChange={e => setRun(createPapRun(run.mode, e.target.value as PapRun["variant"]))}><option value="standard">Primer encuentro · incertidumbre y apoyo</option><option value="medical">Mayor complejidad · señal médica nueva</option></select></label>
        <button className={styles.primary} onClick={() => { setNotice(""); setRun(v => ({ ...v, status: "running" })); }}>Entrar a la sala <span>→</span></button>
        <p className={styles.small}>Escribe tus propias preguntas, describe acciones y observa las reacciones. Puedes conversar con Gemini o practicar con el guion local del caso; puedes pausar cuando lo necesites.</p>
      </div><div className={styles.preview}><PatientWorld motion="pacing" active reduced={reduced || systemReduced} quiet={false} medical={false} close={false}/><div className={styles.previewCaption}><span>LA PERSONA ANTES QUE EL PROCEDIMIENTO</span><p>Acércate con respeto.<br/>Deja que te cuente qué necesita.</p></div></div>
    </section> : <>
      <div className={styles.workspace}>
        <section id="pap-patient" className={styles.scenePanel} aria-label="Escena y respuesta de Valeria">
          <div className={styles.sceneTop}><span><i/> SALA DE APOYO · 01</span><button onClick={() => setClose(v => !v)} aria-pressed={close}>{close ? "Ver sala" : "Acercar vista"} ⌕</button></div>
          <div className={styles.scene}>
            <PatientWorld motion={motion} active={running} reduced={reduced || systemReduced} quiet={hasPap(run, "quiet")} medical={run.variant === "medical" && run.event && !hasPap(run, "handoff")} close={close} posture={run.posture} engaged={pending || draft.trim().length > 0} turn={run.history.length}/>
            <div className={styles.roomTag}>ESPACIO DE ESCUCHA<br/><strong>Una cosa a la vez.</strong></div>
            {run.event && !run.eventHandled && <div className={styles.eventTag} role="alert">{run.variant === "medical" ? "Señal nueva · refiere dolor en el pecho" : "Cambio de situación · se sobresalta al oír una sirena"}</div>}
            {run.status === "paused" && <div className={styles.pauseOverlay}><span>II</span><h2>Un momento de pausa</h2><p>El caso y sus movimientos están detenidos.</p><button className={styles.primary} onClick={() => { pausedByVisibility.current = false; setRun(v => ({ ...v, status: "running" })); }}>Continuar atención →</button></div>}
          </div>
          <div className={styles.observation}><span className={styles.eyebrow}>LO QUE PUEDES OBSERVAR</span><p aria-live="polite">{papObservation(run)}</p></div>
          <div className={styles.patientPresence}><span><i/>{run.posture === "seated" ? "Sentada por elección" : motion === "agitated" ? "Expresa rechazo" : motion === "withdrawing" ? "Pide distancia" : pending ? "Atiende la conversación" : "Observa sus señales"}</span><a href="#pap-conversation" className={styles.mobileJump}>Ir a la conversación ↓</a><button disabled={!papSpokenReply(latest)} onClick={() => speak()} aria-label="Leer la última respuesta en voz">Escuchar última respuesta ♪</button></div>
          <label className={styles.motionControl}><input type="checkbox" checked={reduced || systemReduced} disabled={systemReduced} onChange={e => setReduced(e.target.checked)}/> Reducir movimientos {systemReduced && "· según tu sistema"}<span>Personaje 3D · conducta ilustrativa</span></label>
        </section>
        <section className={styles.interaction} aria-label="Herramientas de intervención">
          <nav className={styles.panelTabs} aria-label="Herramientas">{(["actions", "notes"] as const).map(id => <button key={id} aria-pressed={panel === id} onClick={() => setPanel(id)}>{id === "actions" ? "Intervenir" : `Libreta · ${run.findings.length}`}</button>)}</nav>
          {panel === "actions" ? <>
            <div className={styles.engineBar}><label>Conversación<select aria-label="Motor de conversación" value={engine} disabled={pending} onChange={e => { setEngine(e.target.value as "gemini" | "local"); setChatStatus(""); }}><option value="gemini">Gemini · respuestas con IA</option><option value="local">Guion local · sin conexión a IA</option></select></label><span>{engine === "gemini" ? "Requiere sesión y servicio disponible" : "Respuestas predefinidas del caso"}</span></div>
            <ConversationThread entries={run.history} pending={pending} pendingText={draft} pendingAction={inputKind === "action"} onSpeak={speak}/>
            <FreeConversation ai={engine === "gemini"} pending={pending} suggestions={run.mode === "practice"} text={draft} kind={inputKind} active={running} uncertain={latest?.understood === false} onText={setDraft} onKind={setInputKind} onSend={send}/>
            {chatStatus && <p className={styles.chatStatus} role="status">{chatStatus}</p>}
            <button className={styles.toolsToggle} aria-expanded={toolsOpen} onClick={() => setToolsOpen(v => !v)}>{toolsOpen ? "Ocultar herramientas y ejemplos" : "Mostrar herramientas y ejemplos"}<span>{toolsOpen ? "−" : "+"}</span></button>
            {toolsOpen && <div className={styles.actions}>{PAP_PHASES.map(group => <section key={group.id} className={styles.toolGroup}><h3>{group.label}</h3><p>{group.description}</p>{PAP_ACTIONS.filter(a => a.phase === group.id).map(original => {
              const action = contextualPapAction(run, original);
              const blocked = papBlock(run, action); const done = hasPap(run, action.id) && !["reassess", "plan", "repair"].includes(action.id);
              return <button key={action.id} className={`${styles.action} ${done ? styles.actionDone : ""}`} disabled={!!blocked || finished || pending} title={blocked ?? action.words ?? action.label} onClick={() => act(action.id)} data-action={action.id}><span className={styles.actionIcon}>{done ? "✓" : action.words ? "↗" : "◎"}</span><span><strong>{action.label}</strong><small>{done ? "Intervención realizada" : blocked ? blocked : action.words ?? "Revisa el entorno y registra lo que observas."}</small></span><span className={styles.actionArrow}>{done ? "" : blocked ? "·" : "↗"}</span></button>;
            })}</section>)}</div>}
            {run.mode === "practice" && !finished && <details className={styles.hint}><summary>ORIENTACIÓN DEL TUTOR</summary><p>{papHint(run)}</p>{latest && <p>{latest.feedback}</p>}</details>}
          </> : <div className={styles.notebook}><p className={styles.eyebrow}>REGISTRO DE LA ATENCIÓN</p><h2>Lo que has averiguado</h2><p>Solo aparecen los datos que recogiste durante la atención.</p>{run.findings.length ? <ol>{run.findings.map((finding, i) => <li key={i}>{finding}</li>)}</ol> : <div className={styles.empty}>Tu libreta está vacía. Observa el entorno e inicia el contacto.</div>}<label>Tu reflexión personal<textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="¿Qué necesita Valeria y qué podrías explorar a continuación?" rows={4}/></label><small>La reflexión permanece en esta pantalla durante la sesión; no se envía a un servidor.</small></div>}
          <div className={styles.finish}><p>{finished ? "Revisa tu devolución debajo de la escena." : finishReason ?? "Apoyos y continuidad comprobados. Puedes cerrar la atención."}</p><div className={styles.finishButtons}><button className={styles.primary} disabled={!!finishReason || finished} onClick={() => setRun(v => finishPap(v))}>Cerrar y revisar <span>→</span></button><button className={styles.endPractice} disabled={!running} onClick={() => setRun(v => endPapPractice(v))}>Terminar práctica y ver pendientes</button></div></div>
        </section>
      </div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {finished && <section className={styles.debrief} aria-label="Devolución educativa"><div><p className={styles.eyebrow}>DEVOLUCIÓN DE LA SESIÓN</p><h2>{run.closure === "incomplete" ? "Práctica finalizada con elementos pendientes." : "Acompañar no exige borrar el malestar."}</h2><p>La práctica ha terminado. Revisa tus decisiones y lo que quedó pendiente; finalizar el ejercicio no significa que las necesidades de Valeria estén resueltas.</p></div><div className={styles.score}><strong>{rubric.score}<small>/100</small></strong><span>Rúbrica educativa orientativa</span></div><div className={styles.rubric}>{rubric.rows.map(row => <div key={row.label}><span>{row.label}</span><strong>{row.earned}/{row.total}</strong><progress value={row.earned} max={row.total}/></div>)}</div><p>{rubric.penalties ? `Se descontaron ${rubric.penalties} puntos por intervenciones que presionaron o minimizaron. Una reparación ayuda al vínculo, pero no borra lo sucedido.` : "Cuidaste el vínculo sin presionar ni ofrecer falsas garantías."}</p><p>{rubric.omissions.length ? `Para ampliar tu práctica: ${rubric.omissions.join("; ")}.` : "Recogiste todos los elementos previstos en esta rúbrica."}</p><details><summary>Revisar decisiones y explicación</summary>{run.history.map((entry, i) => <article key={i}><strong>{time(entry.at)} · {entry.label}</strong><p>{entry.feedback}</p></article>)}</details><div className={styles.debriefActions}><button className={styles.primary} onClick={download}>Descargar devolución ↓</button><button className={styles.outline} onClick={reset}>Volver a practicar</button><Link href="/simulation-hub">Volver a escenarios ↗</Link></div><small>Esta puntuación no acredita competencia clínica. El prototipo requiere revisión docente antes de su uso en evaluación formal.</small></section>}
    </>}
    <footer className={styles.footer}><span>PSYKE · APRENDER A ACOMPAÑAR</span><p>Simulación educativa de un caso ficticio. Primera ayuda psicológica basada en el enfoque de la OMS.</p><button onClick={() => { if (running) setRun(v => ({ ...v, status: "paused" })); setGuide(true); }}>Bases y fuentes ↗</button></footer>
    {guide && <div className={styles.modalBackdrop}><section className={styles.guide} role="dialog" aria-modal="true" aria-labelledby="pap-guide-title"><button className={styles.modalClose} autoFocus onClick={() => setGuide(false)}>Cerrar ×</button><p className={styles.eyebrow}>CONSULTA DE APRENDIZAJE</p><h2 id="pap-guide-title">Primeros auxilios psicológicos</h2><p>Ayuda humana, respetuosa y práctica ante un evento muy angustiante. La intervención se adapta a las necesidades y decisiones de cada persona.</p>{GUIDANCE.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}<h3>Fuentes y alcance</h3>{PAP_SOURCES.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}<p>La escena y las consecuencias son una representación didáctica diseñada para este caso, no una predicción del comportamiento de personas reales. Los mensajes de Valeria aparecen separados de las observaciones de la sala. Puedes escribir libremente. Gemini propone respuestas e intenciones; el motor del caso conserva los límites y verifica las acciones. Si Gemini no está disponible se identifica el uso del guion local. Las reacciones corporales dependen de la interacción y la reparación es gradual. El personaje no dispone de captura facial ni interpretación de voz.</p><a href="https://www.innerscene.com/tools/library/3d-parts/idle-standing-maya-3d-person-animated-22b686d6" target="_blank" rel="noreferrer">Personaje: Innerscene / MakeHuman · CC0 ↗</a><button className={styles.primary} onClick={() => setGuide(false)}>Volver al prototipo →</button></section></div>}
    {resetting && <div className={styles.modalBackdrop}><section className={styles.confirm} role="dialog" aria-modal="true" aria-labelledby="pap-reset-title"><h2 id="pap-reset-title">¿Empezar de nuevo?</h2><p>Se borrarán las decisiones de esta sesión. Puedes cancelar y reanudar la atención.</p><button className={styles.primary} autoFocus onClick={() => setResetting(false)}>Conservar sesión</button><button className={styles.outline} onClick={reset}>Reiniciar el caso</button></section></div>}
  </main>;
}
