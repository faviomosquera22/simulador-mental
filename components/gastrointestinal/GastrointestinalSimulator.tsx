"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import Sidebar from "@/components/Sidebar";
import GiEquipmentImage from "./GiEquipmentImage";
import { GI_HISTORY, GI_PATIENT, GI_SOURCES, GI_TARGETS, GI_TOOLS, applyGiAction, createGiState, giBalance, giCorrection, giNextTask, giScore, giToolAction, giToolTarget, giVitals, type GiAction, type GiActionId, type GiCorrection, type GiMode, type GiTarget, type GiTool, type GiVariant } from "@/src/lib/gastrointestinalSimulation";
import styles from "./gastrointestinal.module.css";

type Decision = { title: string; question: string; choices: { value: string | number; label: string }[]; confirm: string };
const DECISIONS: Partial<Record<GiActionId, Decision>> = {
  identify: { title: "Verifica antes de atender", question: "¿Cómo confirmas a quién vas a atender?", choices: [{ value: "name", label: "Preguntar solamente su nombre" }, { value: "two-identifiers", label: "Nombre e identificador de pulsera, explicación, aceptación y alergias" }], confirm: "Confirmar identificación" },
  classify: { title: "Elige la prioridad", question: "Integra conciencia, capacidad de beber, perfusión y pérdidas.", choices: [{ value: "home", label: "Alta inmediata porque no hay sangre" }, { value: "oral-observation", label: "Rehidratación oral fraccionada con observación y reevaluación" }, { value: "antibiotic", label: "Antibiótico como primera medida para cualquier diarrea" }], confirm: "Aplicar decisión de cuidados" },
  diagnostics: { title: "¿Necesita una muestra ahora?", question: "Revisa las indicaciones antes de usar el recipiente.", choices: [{ value: "routine-sample", label: "Pedir coprocultivo y antiparasitarios a todos antes de hidratar" }, { value: "clinical-review", label: "Valorar estudios según sangre, fiebre importante, dolor intenso, sepsis, persistencia o brote" }], confirm: "Registrar decisión sobre estudios" },
  prepare: { title: "Prepara la SRO", question: "El envase de ESTE sobre indica: disolver el contenido completo en 1 litro de agua segura. ¿Cuánta agua vas a usar?", choices: [{ value: 250, label: "250 mL de agua" }, { value: 500, label: "500 mL de agua" }, { value: 1000, label: "1000 mL de agua, sin añadir azúcar ni sal" }], confirm: "Preparar esta unidad" },
  drink: { title: "Ofrece la porción indicada", question: "Plan supervisado del caso: 1000 mL en 2 horas si tolera, en cuatro porciones ofrecidas en sorbos durante intervalos de 30 minutos. Ajustar según respuesta y pérdidas.", choices: [{ value: 1000, label: "Ofrecer un litro de una sola vez" }, { value: 250, label: "Ofrecer 250 mL en sorbos durante el siguiente intervalo" }], confirm: "Iniciar esta porción" },
  teach: { title: "Comprueba qué aprendió Andrés", question: "¿Qué explicación debe poder repetir con sus palabras?", choices: [{ value: "fasting", label: "Dejar de comer y tomar antibióticos que tenga en casa" }, { value: "complete", label: "SRO según envase, alimentación tolerada, higiene, evitar automedicación y reconocer señales de alarma" }], confirm: "Explicar y comprobar comprensión" },
  handoff: { title: "Entrega y continuidad de cuidados", question: "Comunica situación, antecedentes, valoración, ingesta y pérdidas, actuaciones y plan. Confirma que el equipo receptor recibe el informe.", choices: [{ value: "home", label: "Dar de alta sin valoración del equipo porque ya tomó líquidos" }, { value: "observation", label: "Confirmar recepción del informe y continuar observación con el plan del equipo" }, { value: "urgent", label: "Confirmar entrega urgente por hipoperfusión / intolerancia oral, con vigilancia y acceso preparado" }], confirm: "Confirmar entrega al equipo receptor" },
  antibiotic: { title: "Revisa la indicación", question: "No hay un agente confirmado ni una prescripción de antibiótico en este caso.", choices: [{ value: "give", label: "Administrar un antibiótico de forma empírica a toda persona con diarrea" }, { value: "not-indicated", label: "No administrar sin indicación; priorizar hidratación y valoración clínica" }], confirm: "Registrar decisión de medicación" },
  sample: { title: "Antes de recoger una muestra", question: "El recipiente está disponible, pero no hay una solicitud de estudio en este recorrido.", choices: [{ value: "collect", label: "Recolectar una muestra de rutina antes de hidratar" }, { value: "not-indicated", label: "Conservar el recipiente sin usar y valorar con el equipo si aparecen indicaciones" }], confirm: "Registrar decisión sobre la muestra" },
};
type Modal = { kind: "decision"; action: GiActionId; target?: GiTarget } | { kind: "history" } | { kind: "patient" } | { kind: "correction"; correction: GiCorrection } | { kind: "finding"; title: string; detail: string } | { kind: "restart"; leave?: boolean };
type ToolTab = "assessment" | "treatment" | "continuity";
const TRAYS: Record<ToolTab, { label: string; tools: GiTool[] }> = {
  assessment: { label: "Valoración", tools: ["identity", "soap", "gloves", "thermometer", "cuff", "stethoscope", "hydration", "jug"] },
  treatment: { label: "Hidratación", tools: ["soap", "gloves", "ors", "medication", "sample"] },
  continuity: { label: "Continuidad", tools: ["jug", "education", "call", "iv", "gloves", "soap"] },
};
const ACTION_LABELS: Partial<Record<GiActionId, string>> = { triage: "Evaluación rápida", classify: "Prioridad de cuidados", diagnostics: "Revisar estudios", wait: "Observar 30 min", reassess: "Reevaluar al paciente", position: "Proteger al paciente durante el vómito", handoff: "Entregar el caso" };

export default function GastrointestinalSimulator() {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<GiMode>("practice");
  const [variant, setVariant] = useState<GiVariant>("standard");
  const [state, setState] = useState(() => createGiState());
  const [selected, setSelected] = useState<GiTool | null>(null);
  const [tray, setTray] = useState<ToolTab>("assessment");
  const [modal, setModal] = useState<Modal | null>(null);
  const [answer, setAnswer] = useState<string | number | undefined>();
  const [quiet, setQuiet] = useState(false);
  const [toast, setToast] = useState("");
  const [over, setOver] = useState<GiTarget | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ tool: GiTool; x: number; y: number; active: boolean } | null>(null);
  const lastDrop = useRef(-1000);
  const [floating, setFloating] = useState<{ tool: GiTool; x: number; y: number } | null>(null);
  useEffect(() => { if (modal && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [modal]);
  useEffect(() => { const preference = matchMedia("(prefers-reduced-motion: reduce)"); setQuiet(preference.matches); }, []);
  const next = giNextTask(state);
  const vitals = giVitals(state);
  const disabled = state.paused || !!state.outcome || !!modal;
  const danger = state.alertAt !== null;
  const improved = !danger && state.oralMl >= 750;
  const observations = state.events.filter(event => event.kind !== "error");
  const xp = Object.values(state.flags).filter(Boolean).length * 10 + Math.min(4, Math.floor(state.oralMl / 250)) * 15;
  const progress = state.outcome ? 100 : danger ? state.urgentAt >= state.alertAt! ? 75 : 50 : Math.min(95, Object.values(state.flags).filter(Boolean).length * 3 + state.oralMl / 25);
  function open(value: Modal) { setAnswer(undefined); setModal(value); }
  function close() { dialog.current?.close(); setModal(null); setAnswer(undefined); }
  function begin() { close(); setState(createGiState(mode, variant)); setSelected(null); setStarted(true); setTray("assessment"); setToast(""); }
  function choose(tool: GiTool) {
    if (disabled) return;
    if (tool === "gloves" && state.gloves === "disposed") { setToast("Esta unidad fue descartada y no se reutiliza."); return; }
    setSelected(tool); setToast(`${GI_TOOLS[tool].name} seleccionado. Destino: ${GI_TARGETS[giToolTarget(tool, state)]}.`);
  }
  function run(action: GiAction) {
    if (state.paused || state.outcome) return;
    const correction = giCorrection(state, action);
    const result = applyGiAction(state, action);
    setState(result);
    if (correction) { open({ kind: "correction", correction }); return; }
    const event = result.events.at(-1);
    setSelected(null);
    setToast(event?.detail ?? "");
    if (result.alertAt !== null || action.id === "teach") setTray("continuity");
    else if (["classify", "diagnostics", "discard"].includes(action.id)) setTray("treatment");
    if (["temperature", "vitals", "abdomen", "hydration", "balance", "reassess", "triage", "urgent"].includes(action.id) && event) open({ kind: "finding", title: event.title, detail: event.detail });
    else if (result.alertAt !== null && state.alertAt === null && event) open({ kind: "finding", title: "El paciente necesita atención urgente", detail: event.detail });
    else close();
  }
  function activate(action: GiActionId, target?: GiTarget) {
    if (disabled) return;
    if (action === "history") { open({ kind: "history" }); return; }
    if (DECISIONS[action]) { open({ kind: "decision", action, target }); return; }
    run({ id: action, target });
  }
  function apply(target: GiTarget, incoming?: GiTool) {
    if (disabled) return;
    const tool = incoming ?? selected;
    if (!tool) { setToast("Selecciona un material de la bandeja y después elige dónde utilizarlo."); return; }
    const action = giToolAction(tool, state);
    if (target !== giToolTarget(tool, state)) { run({ id: action, target }); return; }
    activate(action, target);
  }
  function prepareNext() {
    if (next.tool) {
      const tab = (Object.keys(TRAYS) as ToolTab[]).find(key => TRAYS[key].tools.includes(next.tool!))!;
      setTray(tab); choose(next.tool);
    } else if (next.action) activate(next.action);
  }
  function touchStart(event: PointerEvent<HTMLButtonElement>, tool: GiTool) {
    if (event.pointerType !== "touch" || disabled || tool === "gloves" && state.gloves === "disposed") return;
    choose(tool); drag.current = { tool, x: event.clientX, y: event.clientY, active: false }; event.currentTarget.setPointerCapture(event.pointerId);
  }
  function touchMove(event: PointerEvent<HTMLButtonElement>) {
    const item = drag.current; if (!item) return;
    if (Math.hypot(event.clientX - item.x, event.clientY - item.y) > 12) item.active = true;
    if (!item.active) return;
    event.preventDefault(); setFloating({ tool: item.tool, x: event.clientX, y: event.clientY });
    const zone = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-gi-target]");
    setOver(zone?.dataset.giTarget as GiTarget ?? null);
  }
  function touchEnd(event: PointerEvent<HTMLButtonElement>) {
    const item = drag.current; drag.current = null; setFloating(null); setOver(null);
    if (!item?.active) return;
    event.preventDefault(); lastDrop.current = event.timeStamp;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-gi-target]")?.dataset.giTarget as GiTarget | undefined;
    if (target) apply(target, item.tool);
    else setToast("Material sin aplicar. Suéltalo sobre un destino o usa el botón «Utilizar».");
  }
  function download() {
    const text = [`PRÁCTICA: INFECCIONES GASTROINTESTINALES`, `${GI_PATIENT.name} · paciente ficticio · ${GI_PATIENT.id}`, `Modalidad: ${state.mode}; recorrido: ${state.variant}`, `Puntuación: ${giScore(state)} / 100; errores: ${state.mistakes}; críticos: ${state.critical}`, `Cierre: ${state.outcome ?? "pendiente"}`, "", ...state.events.map(event => `${event.minute} min · ${event.kind.toUpperCase()} · ${event.title}\n${event.detail}`)].join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "practica-gastrointestinal.txt"; link.click(); URL.revokeObjectURL(url);
  }
  function zone(target: GiTarget, className: string, label: string) {
    const done = target === "head" ? state.flags.hydration : target === "arm" ? state.flags.vitals : target === "abdomen" ? state.flags.abdomen : target === "patient" ? state.flags.identified : false;
    return <button type="button" className={`${styles.zone} ${className}`} data-gi-target={target} data-done={!!done} data-highlight={over === target || mode === "practice" && !!selected && giToolTarget(selected, state) === target} disabled={disabled} aria-label={GI_TARGETS[target]} onClick={() => apply(target)} onDragOver={event => { event.preventDefault(); setOver(target); }} onDragLeave={() => setOver(null)} onDrop={event => { event.preventDefault(); setOver(null); const tool = event.dataTransfer.getData("application/x-gi-tool") as GiTool; if (tool in GI_TOOLS) apply(target, tool); }}><span aria-hidden="true">{done ? "✓" : "+"}</span><small>{label}</small></button>;
  }

  return <div className="psyke-workspace"><Sidebar/><main className={styles.main} data-quiet={quiet}>
    <header className={styles.header}><div><p className={styles.eyebrow}>PSYKE / GUARDIA CLÍNICA</p><h1>Infecciones gastrointestinales<span>SIMULACIÓN</span></h1></div><Link href="/simulation-hub/enfermeria">← Enfermería</Link></header>
    {!started ? <>
      <section className={styles.welcome}>
        <div><p className={styles.eyebrow}>CASO 01 · ADULTO CON DESHIDRATACIÓN</p><h2>Una decisión.<br/>Una respuesta<br/><em>del paciente.</em></h2><p>Escucha a Andrés, reconoce sus necesidades y acompaña su evolución. Cada cuidado requiere una acción y una reevaluación.</p><div className={styles.welcomeTags}><span>Materiales interactivos</span><span>Balance de líquidos</span><span>Decisiones con consecuencias</span></div></div>
        <div className={styles.welcomePatient}><div/><span>PACIENTE FICTICIO · IMAGEN SINTÉTICA</span><p>«Desde ayer tengo diarrea.<br/>Me siento débil y tengo mucha sed».</p></div>
      </section>
      <section className={styles.setup} aria-label="Configura tu práctica"><div><p className={styles.eyebrow}>01 / ELIGE CÓMO PRACTICAR</p><h3>Una guardia, dos recorridos</h3><div className={styles.choiceCards}>{(["standard", "intolerance"] as GiVariant[]).map(value => <button key={value} data-gi-variant={value} aria-pressed={variant === value} onClick={() => setVariant(value)}><b>{value === "standard" ? "01" : "02"}</b><strong>{value === "standard" ? "Respuesta al cuidado" : "Vómitos y deterioro"}</strong><span>{value === "standard" ? "Valora, rehidrata, reevalúa y entrega un plan de continuidad." : "Reconoce la intolerancia y cambia la prioridad a atención urgente."}</span><small>{variant === value ? "✓ Seleccionado" : "Seleccionar recorrido"}</small></button>)}</div></div><div className={styles.modeBox}><p className={styles.eyebrow}>02 / MODALIDAD</p><div className={styles.modeSwitch}>{(["practice", "assessment"] as GiMode[]).map(value => <button key={value} onClick={() => setMode(value)} aria-pressed={mode === value}>{value === "practice" ? "Práctica guiada" : "Evaluación"}</button>)}</div><p>{mode === "practice" ? "Un objetivo sugerido te orienta. Tú eliges y aplicas cada material." : "Decide el recorrido sin resaltar materiales ni destinos recomendados."}</p><button className={styles.primary} onClick={begin} data-testid="gi-start">Comenzar la guardia <span>→</span></button><small>Tiempo clínico por intervalos. Puedes pausar para leer y pensar.</small></div></section>
      <section className={styles.objectives}><div><b>VALORA</b><p>Entrevista, signos vitales, abdomen e hidratación.</p></div><div><b>ACTÚA</b><p>Prepara el material y aplica cuidados con seguridad.</p></div><div><b>REEVALÚA</b><p>Comprueba respuesta, pérdidas y necesidad de ayuda.</p></div></section>
    </> : <>
      <div className={styles.sessionBar}><span><i/>{variant === "standard" ? "Respuesta al cuidado" : "Vómitos y deterioro"} <small>{mode === "practice" ? "Práctica guiada" : "Evaluación"}</small></span><div><button onClick={() => setQuiet(!quiet)} aria-pressed={quiet}>{quiet ? "Activar movimiento" : "Reducir movimiento"}</button><button onClick={() => setState({ ...state, paused: !state.paused })} disabled={!!state.outcome}>{state.paused ? "Reanudar" : "Pausar"}</button><button onClick={() => open({ kind: "restart", leave: true })}>Cambiar recorrido</button></div></div>
      <section className={styles.hud} aria-label="Estado de la guardia"><div><span>TIEMPO CLÍNICO</span><strong>{state.minute}<small> min</small></strong></div><div><span>PROGRESO</span><strong>{xp}<small> XP</small></strong></div><div><span>SRO REGISTRADA</span><strong>{state.oralMl}<small> mL</small></strong>{state.pendingMl > 0 && <small className={styles.pendingPortion}>{state.pendingMl} mL en observación</small>}</div><div><span>DECISIONES A REVISAR</span><strong>{state.mistakes}</strong></div><div className={styles.hudStatus} data-danger={danger}><i/>{state.outcome ? "Informe entregado" : state.paused ? "Guardia en pausa" : danger ? "Deterioro · actuar" : improved ? "Mejoría inicial · vigilar" : "En observación"}</div></section>
      <div className={styles.progress} role="progressbar" aria-label="Progreso de cuidados" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress}%` }}/></div>
      {state.paused && <p className={styles.pauseNotice} role="status">Guardia en pausa. El tiempo y las intervenciones están detenidos.</p>}
      {state.outcome && <section className={styles.result} data-testid="gi-result"><p className={styles.eyebrow}>GUARDIA COMPLETADA</p><h2>{state.outcome === "escalated" ? "La prioridad fue pedir ayuda." : "Cuidar también es reevaluar."}</h2><p>{state.outcome === "escalated" ? "El equipo recibió el caso para continuar atención urgente. La hipoperfusión no se declara resuelta." : "Andrés mostró mejoría inicial. Continúa en observación y con reposición de pérdidas según el plan del equipo; la infección no se declara curada."}</p><div><strong>{giScore(state)}<small>/100 · devolución educativa</small></strong><span>{state.mistakes} errores conservados · {state.critical} críticos</span></div><button className={styles.primary} onClick={download}>Descargar bitácora</button><button className={styles.secondary} onClick={() => open({ kind: "restart" })}>Repetir el recorrido</button></section>}
      <div className={styles.lab}>
        <section className={styles.patientPanel} aria-label="Paciente y evolución">
          <div className={styles.patientHeading}><div><p className={styles.eyebrow}>PACIENTE SIMULADO</p><h2>{GI_PATIENT.name} <span>· {GI_PATIENT.age} años</span></h2><p>{GI_PATIENT.id} · {GI_PATIENT.weight} kg · {state.flags.identified ? "alergias revisadas" : "verifica identidad y alergias"}</p></div><span className={styles.patientBadge} data-danger={danger}>{danger ? "Atención urgente" : "Consciente"}</span><button className={styles.enlargePatient} onClick={() => open({ kind: "patient" })} aria-label="Ver paciente ampliado">Ampliar ↗</button><button className={styles.mobileHistory} onClick={() => open({ kind: "finding", title: "Historia y balance registrado", detail: `${observations.map(event => `${event.minute} min · ${event.title}: ${event.detail}`).join("\n\n") || "Aún no se han registrado hallazgos."}\n\nBalance parcial: ${giBalance(state)} mL. No representa el déficit inicial.` })}>Historia</button></div>
          <div className={styles.scene} data-testid="gi-scene" data-danger={danger} data-improved={improved}>
            <div className={styles.patientPhoto} role="img" aria-label={`Andrés en la cama de observación. ${danger ? "Refiere mareo y vómitos persistentes; necesita ayuda urgente." : improved ? "Se encuentra más cómodo tras el periodo observado de cuidados." : "Se encuentra consciente, cansado y con sed."}`} style={{ backgroundPosition: improved ? "100% center" : "0% center" }}/>
            <span className={styles.breath}/><span className={styles.synthetic}>IMAGEN SINTÉTICA · ESCENARIO EDUCATIVO</span>
            {zone("patient", styles.conversationZone, "Conversar")}{zone("head", styles.headZone, "Cara")}{zone("arm", styles.armZone, "Brazo")}{zone("abdomen", styles.abdomenZone, "Abdomen")}{zone("hands", styles.handsZone, "Manos")}{zone("bedside", styles.tableZone, "Mesa")}{zone("bin", styles.binZone, "Residuos")}
            {selected && <div className={styles.heldOnScene}><span><GiEquipmentImage tool={selected}/></span><p>EN TU MANO<strong>{GI_TOOLS[selected].name}</strong></p></div>}
            {floating && <span className={styles.dragHint}>Lleva el material hasta un marcador</span>}
          </div>
          <div className={styles.patientQuote} aria-live="polite"><span>ANDRÉS</span><p>“{danger ? "Me mareo. Estoy vomitando y no consigo mantener lo que bebo." : improved ? "Me siento algo mejor. Quiero saber qué debo seguir haciendo." : state.pendingMl ? "Voy tomando los sorbos. Avísame si debo parar." : "Estoy despierto, pero tengo mucha sed y me siento débil."}”</p></div>
          <div className={styles.monitor} aria-label="Monitor simulado" data-danger={danger}><div><span>FC / MIN</span><strong data-testid="gi-heart-rate">{state.flags.vitals ? vitals.hr : "—"}</strong></div><div><span>PA / MMHG</span><strong>{state.flags.vitals ? `${vitals.systolic}/${vitals.diastolic}` : "—"}</strong></div><div><span>TEMPERATURA</span><strong>{state.flags.temperature ? `${vitals.temperature.toFixed(1)}°` : "—"}</strong></div><div><span>RELLENO CAPILAR</span><strong>{state.flags.hydration ? `${vitals.capillary} s` : "—"}</strong></div></div>
          <div className={styles.balance}><div><p className={styles.eyebrow}>BALANCE PARCIAL / DESDE EL INICIO</p><strong>{state.flags.balance ? `${giBalance(state)} mL` : "Por registrar"}</strong><small>Solo ingesta observada; la porción en curso aún no cuenta.</small></div><dl><div><dt>SRO registrada</dt><dd>{state.oralMl} mL</dd></div><div><dt>Heces</dt><dd>{state.stoolMl} mL</dd></div><div><dt>Vómitos</dt><dd>{state.vomitMl} mL</dd></div><div><dt>Orina</dt><dd>{state.urineMl} mL</dd></div></dl><p>Las pérdidas previas fueron referidas, sin volumen medido. Este balance no representa el déficit total.</p></div>
          <details className={styles.notes}><summary>Historia y hallazgos registrados <span>{observations.length}</span></summary>{observations.length ? observations.map(event => <article key={event.id}><small>{event.minute} min · {event.title}</small><p>{event.detail}</p></article>) : <p>Explora al paciente para registrar datos. Los hallazgos no se completan al abrir este panel.</p>}</details>
        </section>
        <section className={styles.workspace} aria-label="Acciones y materiales">
          <div className={styles.task} data-testid="gi-task"><p className={styles.eyebrow}>{danger ? "PRIORIDAD / SEGURIDAD" : "TU SIGUIENTE DECISIÓN"}</p><h2>{mode === "practice" || danger ? next.title : "Tu turno de decidir"}</h2><p>{mode === "practice" || danger ? next.detail : "Integra los hallazgos, elige cuidados y comprueba la respuesta. Puedes consultar la historia registrada."}</p>{mode === "practice" && !state.outcome && <button className={styles.taskButton} disabled={disabled} onClick={prepareNext}>{next.tool ? `Seleccionar: ${GI_TOOLS[next.tool].name}` : ACTION_LABELS[next.action!] ?? "Continuar"}<span>↗</span></button>}</div>
          {danger && !state.outcome && <div className={styles.danger} role="alert"><strong>El deterioro sigue activo</strong><p>Suspende el plan oral. La llamada o la lectura de este aviso no administran tratamiento ni resuelven la hipoperfusión.</p><button disabled={disabled} onClick={() => run({ id: "urgent" })}>Solicitar ayuda urgente</button>{state.urgentAt >= state.alertAt! && <button disabled={disabled} onClick={() => run({ id: "position" })}>Proteger al paciente durante el vómito</button>}</div>}
          <div className={styles.decisions} aria-label="Decisiones clínicas">{(["triage", "classify", "diagnostics"] as GiActionId[]).map(action => <button key={action} data-gi-action={action} disabled={disabled} onClick={() => activate(action)}>{ACTION_LABELS[action]}<span>↗</span></button>)}</div>
          <div className={styles.trayHeading}><h3>Tu bandeja</h3><span>Selecciona → utiliza → comprueba</span></div>
          <div className={styles.trayTabs} role="group" aria-label="Grupo de materiales">{(Object.keys(TRAYS) as ToolTab[]).map(key => <button key={key} aria-pressed={tray === key} onClick={() => setTray(key)} disabled={disabled}>{TRAYS[key].label}</button>)}</div>
          <div className={styles.toolGrid}>{TRAYS[tray].tools.map(tool => {
            const used = tool === "gloves" && state.gloves === "disposed";
            const status = used ? "Descartado · no reutilizable" : selected === tool ? "✓ Seleccionado" : tool === "gloves" && state.gloves === "worn" ? "En uso · retirar en residuos" : tool === "ors" && state.solution !== "unprepared" ? `${state.remainingMl} mL disponibles` : "Seleccionar";
            return <button key={tool} type="button" data-gi-tool={tool} data-recommended={mode === "practice" && next.tool === tool} aria-pressed={selected === tool} disabled={disabled || used} draggable={!disabled && !used} onClick={event => { if (event.timeStamp - lastDrop.current > 400) choose(tool); }} onDragStart={event => { choose(tool); event.dataTransfer.setData("application/x-gi-tool", tool); event.dataTransfer.effectAllowed = "copy"; }} onPointerDown={event => touchStart(event, tool)} onPointerMove={touchMove} onPointerUp={touchEnd} onPointerCancel={() => { drag.current = null; setFloating(null); setOver(null); }}><span className={styles.toolPicture}><GiEquipmentImage tool={tool}/></span><strong>{GI_TOOLS[tool].name}</strong><small>{status}</small>{mode === "practice" && next.tool === tool && <span className={styles.recommended}>DEL PASO ACTUAL</span>}</button>;
          })}</div>
          <div className={styles.loadout} data-testid="gi-selected" data-selected-tool={selected ?? ""}>{selected ? <><span className={styles.loadoutPhoto}><GiEquipmentImage tool={selected}/></span><div><small>✓ SELECCIONADO · AÚN SIN APLICAR</small><h3>{GI_TOOLS[selected].name}</h3><p>{GI_TOOLS[selected].purpose}</p><p className={styles.destination}>Destino: {GI_TARGETS[giToolTarget(selected, state)]}</p><button onClick={() => setSelected(null)} disabled={disabled}>Dejar sin utilizar</button></div></> : <><span className={styles.emptyHand}>↖</span><p><strong>Tu mano está libre</strong>Selecciona una imagen. Luego arrástrala a la escena o utiliza el botón de abajo.</p></>}</div>
          {selected && <button className={styles.primary} data-testid="gi-apply" disabled={disabled} onClick={() => apply(giToolTarget(selected, state))}>Utilizar: {GI_TARGETS[giToolTarget(selected, state)]}<span>→</span></button>}
          <div className={styles.inventory} aria-label="Inventario de materiales"><span data-testid="gi-gloves-status">Guantes: <b>{state.gloves === "available" ? "nuevos" : state.gloves === "worn" ? "en uso" : "descartados"}</b></span><span>SRO: <b>{state.solution === "unprepared" ? "sobre sin preparar" : `${state.remainingMl} mL restantes`}</b></span><span>Manos: <b>{state.cleanHands ? "higiene realizada" : "revisar higiene"}</b></span></div>
          <div className={styles.followup}><button disabled={disabled} data-gi-action="wait" onClick={() => activate("wait")}><span>◷</span><strong>Observar 30 min</strong><small>Avanza el tiempo clínico</small></button><button disabled={disabled} data-gi-action="reassess" onClick={() => activate("reassess")}><span>↻</span><strong>Reevaluar al paciente</strong><small>No reemplaza la intervención</small></button></div>
          <button className={styles.handoff} data-gi-action="handoff" disabled={disabled} onClick={() => activate("handoff")}>Entregar el caso y plan de continuidad <span>→</span></button>
          {toast && <p className={styles.toast} role="status">{toast}</p>}
        </section>
      </div>
      <details className={styles.log}><summary>Bitácora de decisiones <span>{state.events.length} registros · los errores se conservan</span></summary><ol>{state.events.map(event => <li key={event.id} data-kind={event.kind}><span>{event.minute} min</span><div><strong>{event.title}</strong><p>{event.detail}</p></div></li>)}</ol></details>
    </>}
    <footer className={styles.footer}><p>Escenario educativo de un adulto ficticio. La respuesta es ilustrativa; no sustituye entrenamiento supervisado ni el protocolo institucional.</p><details><summary>Fuentes y alcance del caso</summary><p>Una gastroenteritis de etiología no confirmada, con dos recorridos. El plan de 1000 mL en 2 horas es propio de este maniquí y requiere ajuste clínico. No se administran antibióticos ni líquidos IV en este módulo.</p><ul>{GI_SOURCES.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></details></footer>
    {floating && <div className={styles.floating} aria-hidden="true" style={{ left: floating.x - 34, top: floating.y - 42 } as CSSProperties}><GiEquipmentImage tool={floating.tool}/></div>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="gi-dialog-title" onCancel={() => { setModal(null); setAnswer(undefined); }} onClose={() => { setModal(null); setAnswer(undefined); }}>
      {modal?.kind === "correction" && <><p className={styles.eyebrow}>PAUSA PARA APRENDER · ACCIÓN NO REALIZADA</p><h2 id="gi-dialog-title">{modal.correction.title}</h2><h3>¿Por qué no corresponde?</h3><p>{modal.correction.reason}</p><div className={styles.recommendation}><h3>Qué hacer en su lugar</h3><p>{modal.correction.recommendation}</p></div><button className={styles.primary} onClick={close}>Entendido, volver al paciente</button></>}
      {modal?.kind === "finding" && <><p className={styles.eyebrow}>HALLAZGO REGISTRADO</p><h2 id="gi-dialog-title">{modal.title}</h2><p>{modal.detail}</p><button className={styles.primary} onClick={close}>Continuar la valoración</button></>}
      {modal?.kind === "patient" && <><p className={styles.eyebrow}>PACIENTE SIMULADO · IMAGEN SINTÉTICA</p><h2 id="gi-dialog-title">Andrés Molina</h2><div className={styles.enlargedPhoto} role="img" aria-label="Andrés, adulto ficticio en observación" style={{ backgroundPosition: improved ? "100% center" : "0% center" }}/><p>La imagen acompaña el caso. La gravedad se determina con la valoración y los signos registrados.</p><button className={styles.primary} onClick={close}>Volver a la guardia</button></>}
      {modal?.kind === "history" && <><p className={styles.eyebrow}>ESCUCHA A TU PACIENTE</p><h2 id="gi-dialog-title">Conversar con Andrés</h2><p>Elige una pregunta. La respuesta se incorpora a la historia registrada.</p><div className={styles.historyQuestions}>{GI_HISTORY.map(topic => <button key={topic.id} onClick={() => { setState(current => applyGiAction(current, { id: "history", value: topic.id, target: "patient" })); }} data-gi-history={topic.id}><strong>{state.flags[topic.id] ? "✓ " : ""}{topic.question}</strong>{state.flags[topic.id] && <span>“{topic.response}”</span>}</button>)}</div><button className={styles.primary} onClick={close}>Volver al paciente</button></>}
      {modal?.kind === "decision" && DECISIONS[modal.action] && <><p className={styles.eyebrow}>DECISIÓN CLÍNICA</p><h2 id="gi-dialog-title">{DECISIONS[modal.action]!.title}</h2><p>{DECISIONS[modal.action]!.question}</p><fieldset className={styles.options}><legend>Selecciona una conducta</legend>{DECISIONS[modal.action]!.choices.map(option => <label key={option.value}><input type="radio" name="gi-decision" value={option.value} checked={answer === option.value} onChange={() => setAnswer(option.value)}/><span>{option.label}</span></label>)}</fieldset><button className={styles.primary} disabled={answer === undefined} data-testid="gi-confirm" onClick={() => run({ id: modal.action, value: answer, target: modal.target })}>{DECISIONS[modal.action]!.confirm}</button><button className={styles.dialogCancel} onClick={close}>Cancelar sin realizar la acción</button></>}
      {modal?.kind === "restart" && <><p className={styles.eyebrow}>NUEVA GUARDIA</p><h2 id="gi-dialog-title">¿Iniciar otra práctica?</h2><p>El recorrido actual se reiniciará. Puedes descargar la bitácora antes de empezar de nuevo.</p><button className={styles.primary} onClick={() => { if (modal.leave) { close(); setStarted(false); } else begin(); }}>Iniciar de nuevo</button><button className={styles.dialogCancel} onClick={close}>Conservar esta práctica</button></>}
    </dialog>
  </main></div>;
}
