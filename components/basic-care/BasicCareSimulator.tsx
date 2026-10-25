"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MaterialImage from "./MaterialImage";
import CareInteractionOverlay from "./CareInteractionOverlay";
import CatheterPicker from "./CatheterPicker";
import CareInventory, { equipmentName } from "./CareInventory";
import CarePhotoScene from "./CarePhotoScene";
import { heldEquipment, selectEquipment, releaseEquipment, discardEquipment, SINGLE_USE_TOOLS, type CatheterGauge } from "@/src/lib/careEquipment";
import { MATERIAL_GUIDE } from "./materialGuide";
import { CARE_PROCEDURES, CARE_CASES, CARE_SOURCES, careCase, careDefinition, careQuestion, explainCareError, type CareCorrection, applyCareAction, careScore, createCareState, currentCareStep, respondToCareComplication, type CareMode, type CareProcedure, type CareTarget, type CareTool } from "@/src/lib/basicCareSimulation";
import styles from "./basic-care.module.css";

const CareScene = dynamic(() => import("./CareScene"), { ssr: false, loading: () => <div className={styles.loading}>Preparando el maniquí 3D…</div> });
const targets: Record<CareTarget, { label: string; icon: string }> = { patient: { label: "Paciente", icon: "◎" }, hands: { label: "Manos / protección", icon: "✋" }, tray: { label: "Bandeja de preparación", icon: "▱" }, site: { label: "Acceso venoso", icon: "⊕" }, nose: { label: "Narina / sonda", icon: "⊕" }, wound: { label: "Herida / apósito", icon: "⊕" }, bin: { label: "Contenedor de punzantes", icon: "↗" } };
const procedureIds: CareProcedure[] = ["iv", "ng", "wound", "cvc"];

export default function BasicCareSimulator() {
  const [procedure, setProcedure] = useState<CareProcedure>("iv");
  const [caseId, setCaseId] = useState("iv-forearm");
  const [mode, setMode] = useState<CareMode>("practice");
  const [challenge, setChallenge] = useState(false);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState(() => createCareState("iv"));
  const [selected, setSelected] = useState<CareTool | null>(null);
  const [choice, setChoice] = useState<number | undefined>();
  const [value, setValue] = useState(0);
  const [quiet, setQuiet] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [turn, setTurn] = useState(0);
  const [sceneView, setSceneView] = useState<"realistic" | "anatomy">("realistic");
  const [gaugePicker, setGaugePicker] = useState(false);
  const [preferredGauge, setPreferredGauge] = useState<CatheterGauge>(20);
  const [showExit, setShowExit] = useState(false);
  const [message, setMessage] = useState("");
  const [correction, setCorrection] = useState<CareCorrection | null>(null);
  const errorDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (correction && errorDialog.current && !errorDialog.current.open) errorDialog.current.showModal(); }, [correction]);
  const [anchor, setAnchor] = useState({ x: 50, y: 50 });
  const projectAnchor = useCallback((x: number, y: number) => setAnchor(current => Math.abs(current.x - x) + Math.abs(current.y - y) > .5 ? { x, y } : current), []);
  const [touchDrag, setTouchDrag] = useState<{ tool: CareTool; x: number; y: number; startX: number; startY: number; active: boolean } | null>(null);
  const touchRef = useRef(touchDrag);
  const suppressTouchClick = useRef(false);
  function updateTouchDrag(next: typeof touchDrag) { touchRef.current = next; setTouchDrag(next); }
  const [showAllMaterials, setShowAllMaterials] = useState(false);
  const [previewTool, setPreviewTool] = useState<CareTool | null>(null);
  const materialDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (previewTool && materialDialog.current && !materialDialog.current.open) materialDialog.current.showModal(); }, [previewTool]);
  const [showHelp, setShowHelp] = useState(false);
  const [mobileView, setMobileView] = useState<"task" | "patient">("task");
  useEffect(() => { const preference = window.matchMedia("(prefers-reduced-motion: reduce)"); setQuiet(preference.matches); const change = () => setQuiet(preference.matches); preference.addEventListener("change", change); return () => preference.removeEventListener("change", change); }, []);
  const scenario = careCase(started ? state.caseId : caseId, started ? state.procedure : procedure);
  const activeProcedure = careDefinition(started ? state : { procedure, caseId: scenario.id });
  const step = currentCareStep(state);
  const held = heldEquipment(state.equipment);
  const selectedName = held ? equipmentName(held) : selected ? MATERIAL_GUIDE[selected].name : "";
  const targetLabel = (target: CareTarget) => target === activeProcedure.target ? scenario.siteLabel : targets[target].label;
  function begin() {
    setState(createCareState(procedure, mode, challenge, scenario.id)); setSelected(null); setChoice(undefined); setValue(0); setMessage(""); setStarted(true); setZoom(1); setTurn(0); setShowExit(false); setShowAllMaterials(false); setMobileView("task"); setCorrection(null); setGaugePicker(false); setSceneView("realistic");
  }
  function chooseTool(tool: CareTool) {
    if (state.paused || state.finished || correction) return;
    if (held?.tool === tool) { setSelected(tool); return; }
    if (tool === "catheter") { setGaugePicker(true); return; }
    const result = selectEquipment(state.equipment, tool);
    if (result.error) { setCorrection({ title: "Toma una unidad nueva", reason: result.error, recommendation: "El material usado o descartado no vuelve a utilizarse." }); return; }
    setState(current => ({ ...current, equipment: result.session })); setSelected(tool); setMessage("");
  }
  function equipCatheter(gauge: CatheterGauge) {
    const result = selectEquipment(state.equipment, "catheter", gauge);
    setState(current => ({ ...current, equipment: result.session })); setPreferredGauge(gauge); setSelected("catheter"); setGaugePicker(false); setMessage(`Catéter ${gauge} G seleccionado. Unidad nueva en tu mano; aún no se ha aplicado al paciente.`);
  }
  function releaseHeld() { setState(current => ({ ...current, equipment: releaseEquipment(current.equipment) })); setSelected(null); setMessage("Material devuelto sin usar. Selecciona otra unidad cuando la necesites."); }
  function discardUnit(id: string) {
    if (state.paused || state.finished) return;
    const unit = state.equipment.units.find(item => item.id === id);
    if (unit?.tool === "sharps" && unit.parentId && step?.id === "sharps") { apply("bin", "sharps"); return; }
    const result = discardEquipment(state.equipment, id);
    if (result.error) { setCorrection({ title: "Este material no se descarta así", reason: result.error, recommendation: "Desecha el mandril en punzantes. El catéter flexible solo se retira con la valoración e indicación correspondientes." }); return; }
    setState(current => ({ ...current, equipment: result.session, events: [...current.events, { step: "equipment-disposal", kind: "success", text: `${unit ? equipmentName(unit) : "Material"} descartado. No puede reutilizarse.` }] }));
    if (held?.id === id) setSelected(null); setMessage("Material descartado. Esa unidad ya no está disponible para usar.");
  }
  function apply(target: CareTarget, tool = selected) {
    if (state.paused || state.finished || !step || correction || errorDialog.current?.open) return;
    if (!tool) { setCorrection({ title: "Primero elige qué vas a usar", reason: "Tocar una zona sin seleccionar una acción no realiza ningún cuidado.", recommendation: "Selecciona una imagen de material o acción; después arrástrala a una zona marcada de la imagen o toca su destino." }); return; }
    if (tool === step.tool && step.choices && choice === undefined) {
      setCorrection({ title: careQuestion(step), reason: "Este paso necesita una respuesta antes de aplicar el material. No se ha realizado la intervención ni se ha añadido un error por este aviso.", recommendation: "Selecciona una respuesta en el panel y después arrastra o aplica el material. La pregunta se refiere solo al paso actual." });
      return;
    }
    if (tool === "catheter" && held?.tool !== "catheter") { setGaugePicker(true); return; }
    const action = { tool, target, choice, value, gauge: tool === "catheter" ? held?.gauge : undefined, itemId: held?.tool === tool ? held.id : undefined };
    const next = applyCareAction(state, action);
    setState(next); setMessage("");
    if (next.errors > state.errors) setCorrection(explainCareError(state, action));
    if (next.index !== state.index || next.passes !== state.passes || next.complication || next.finished) { setSelected(null); setChoice(undefined); setValue(currentCareStep(next)?.precision?.initial ?? 0); setShowAllMaterials(false); }
  }
  function finishTouch(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = touchRef.current;
    if (!drag) return;
    updateTouchDrag(null);
    if (!drag.active) return;
    event.preventDefault(); suppressTouchClick.current = true; setTimeout(() => { suppressTouchClick.current = false; }, 0);
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-scene-target], [data-target]");
    const target = element?.dataset.sceneTarget ?? element?.dataset.target;
    if (target && target in targets) apply(target as CareTarget, drag.tool);
    else if (document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-scene-canvas]")) apply("patient", drag.tool);
    else setMessage("Suelta el material sobre una zona marcada de la imagen. No se ha realizado ninguna intervención.");
  }
  function download() {
    const body = [`PSYKE · Cuidados básicos`, activeProcedure.title, `Caso: ${scenario.title}`, `Paciente ficticio: ${activeProcedure.patient}`, `Modalidad: ${state.mode === "practice" ? "Práctica" : "Evaluación"} · Variante: ${state.challenge ? "Con incidente" : "Estándar"}`, `Resultado: ${state.stopped ? "Procedimiento detenido y derivado por seguridad" : "Secuencia completada"}`, `Puntaje educativo: ${careScore(state)}/100 · Errores: ${state.errors} · Decisiones inseguras: ${state.criticalErrors}`, "Este resultado no acredita destreza técnica ni competencia clínica.", "", ...state.events.map((e, i) => `${i + 1}. [${e.kind}] ${e.text}`), "", "Inventario:", ...state.equipment.units.filter(unit => SINGLE_USE_TOOLS.includes(unit.tool) || unit.parentId).map(unit => `${unit.id}: ${equipmentName(unit)} · ${unit.status}${unit.target ? ` · ${targetLabel(unit.target)}` : ""}`), "", "Fuentes:", ...CARE_SOURCES.map(s => `${s.title}: ${s.href}`)].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `practica-cuidados-${state.procedure}.txt`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const lastEvent = state.events[state.events.length - 1];
  const guided = state.mode === "practice";
  const materialIndex = step ? activeProcedure.tools.indexOf(step.tool) : 0;
  const visibleTools = !guided || showAllMaterials ? activeProcedure.tools : activeProcedure.tools.filter((_, index) => Math.abs(index - materialIndex) <= 1);
  const needsDecision = !!step?.choices && choice === undefined;
  const readyToApply = !!selected && !needsDecision && !state.paused && !state.complication && !state.finished;
  const phase = state.index < 4 ? 0 : state.index < activeProcedure.steps.length - 2 ? 1 : 2;
  const materialTray = <section className={styles.tray} aria-label="Bandeja de materiales">
    <div className={styles.trayHeading}><h3>{step && MATERIAL_GUIDE[step.tool].kind === "action" ? "Selecciona la acción" : "Elige el material"}</h3>{guided && <button onClick={() => setShowAllMaterials(!showAllMaterials)} aria-expanded={showAllMaterials}>{showAllMaterials ? "Ver solo este paso" : "Ver bandeja completa"}</button>}</div>
    <div className={styles.toolGrid}>{visibleTools.map(tool => <button key={tool} data-tool={tool} aria-label={MATERIAL_GUIDE[tool].name} title={MATERIAL_GUIDE[tool].purpose} draggable={!state.paused && !state.complication} onDragStart={e => { if (tool === "catheter" && held?.tool !== "catheter") { e.preventDefault(); setGaugePicker(true); return; } e.dataTransfer.setData("application/x-care-tool", tool); chooseTool(tool); }} disabled={state.paused || state.complication} aria-pressed={selected === tool} className={guided && step?.tool === tool ? styles.recommended : ""}
      onPointerDown={event => { if (event.pointerType === "touch" && !state.paused) { if (tool === "catheter" && held?.tool !== "catheter") { event.preventDefault(); setGaugePicker(true); return; } updateTouchDrag({ tool, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, active: false }); event.currentTarget.setPointerCapture(event.pointerId); } }}
      onPointerMove={event => { const drag = touchRef.current; if (drag && event.pointerType === "touch") { const active = drag.active || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8; if (active) { chooseTool(drag.tool); event.preventDefault(); } updateTouchDrag({ ...drag, x: event.clientX, y: event.clientY, active }); } }} onPointerUp={finishTouch} onPointerCancel={() => updateTouchDrag(null)} onClick={() => { if (suppressTouchClick.current) return; chooseTool(tool); }}>
      <span className={styles.materialPicture}><MaterialImage tool={tool} gauge={tool === "catheter" ? held?.gauge ?? preferredGauge : undefined}/></span><strong>{MATERIAL_GUIDE[tool].name}</strong><span className={styles.materialTag}>{selected === tool && held?.tool === tool ? `✓ Seleccionado${held.gauge ? ` · ${held.gauge} G` : ""}` : state.equipment.units.some(unit => unit.tool === tool && ["used", "installed", "disposed"].includes(unit.status)) ? "Tomar otra unidad nueva" : tool === "catheter" ? "Elegir calibre y preparar" : guided && step?.tool === tool ? "Para este paso · tomar" : "Seleccionar"}</span>
    </button>)}</div>
    <CareInventory equipment={state.equipment} held={held} destination={step ? targetLabel(step.target) : scenario.siteLabel} targetLabel={targetLabel} paused={state.paused} finished={state.finished} stepId={step?.id} onRelease={releaseHeld} onDiscard={discardUnit} onChangeGauge={() => setGaugePicker(true)}/>
    {selected && <button className={styles.enlargeLink} onClick={() => setPreviewTool(selected)}>Ampliar imagen del material ⌕</button>}
  </section>;
  return <div className="psyke-workspace"><Sidebar/><main className={`${styles.main} ${started ? styles.inSession : ""}`} style={{ "--care-accent": activeProcedure.color } as React.CSSProperties}>
    <header className={styles.header}><div><p className={styles.eyebrow}>PSYKE / LABORATORIO DE HABILIDADES</p><h1>Cuidados básicos<span className={styles.liveTag}>INTERACTIVO</span></h1><p>Un laboratorio virtual para aprender haciendo.</p></div><Link href="/simulation-hub/enfermeria">← Simuladores de Enfermería</Link></header>
    {!started ? <>
      <section className={styles.welcome}><div><p className={styles.eyebrow}>APRENDER HACIENDO</p><h2>Tu laboratorio.<br/>Tus decisiones.</h2><p>Un paciente, tu bandeja y cada paso en tus manos. Equípate, elige el calibre y practica sobre un paciente de apariencia real. Usa cada unidad, observa su estado y gestiona su descarte. Te acompañamos paso a paso.</p><div className={styles.featureRow}><span>◎ Paciente de apariencia real</span><span>↗ Materiales con inventario</span><span>✓ Devolución al finalizar</span></div></div><div className={styles.welcomeVisual}><span className={styles.orbitOne}/><span className={styles.orbitTwo}/><div className={styles.heroPhoto}><span>ESTACIÓN 01</span><strong>Acceso venoso periférico</strong></div><span className={styles.visualLabel}>TU PRÓXIMA HABILIDAD<br/><strong>empieza aquí.</strong></span></div></section>
      <section aria-label="Selecciona un procedimiento"><div className={styles.sectionTitle}><h2>01 <span>Elige tu estación</span></h2><p>{CARE_CASES.length} casos · 4 estaciones</p></div><div className={styles.cards}>{procedureIds.map((id, i) => <button key={id} className={`${styles.procedureCard} ${procedure === id ? styles.cardSelected : ""}`} onClick={() => { setProcedure(id); setCaseId(CARE_CASES.find(item => item.procedure === id)!.id); setChallenge(false); }} aria-pressed={procedure === id} style={{ "--card-accent": CARE_PROCEDURES[id].color } as React.CSSProperties}><span className={styles.cardNumber}>0{i + 1}<span>{procedure === id ? "SELECCIONADA ✓" : "EXPLORAR ↗"}</span></span><div className={`${styles.cardIcon} ${styles.stationPhoto}`} data-station-photo={id}/><h3>{CARE_PROCEDURES[id].title}</h3><p>{CARE_PROCEDURES[id].subtitle}</p><span className={styles.cardFoot}>{CARE_CASES.filter(item => item.procedure === id).length} casos · escena interactiva <span>→</span></span></button>)}</div></section>
      <section className={styles.caseLibrary} aria-label="Casos de la estación"><h2>Elige el caso y la zona anatómica</h2><div>{CARE_CASES.filter(item => item.procedure === procedure).map(item => <button key={item.id} data-case={item.id} aria-pressed={scenario.id === item.id} onClick={() => { setCaseId(item.id); setChallenge(false); }}><strong>{item.title}</strong><span>{item.siteLabel}{item.challenge ? " · Con incidente" : ""}</span></button>)}</div></section>
      <section className={styles.setup}><div><div className={styles.sectionTitle}><h2>02 <span>Configura tu práctica</span></h2></div><div className={styles.modeSwitch} aria-label="Modalidad"><button aria-pressed={mode === "practice"} onClick={() => setMode("practice")}>Práctica guiada<span>Indicaciones y explicación por paso</span></button><button aria-pressed={mode === "assessment"} onClick={() => setMode("assessment")}>Evaluación<span>Sin material destacado · recomendaciones al equivocarte</span></button></div><label className={styles.check}><input type="checkbox" checked={challenge || !!scenario.challenge} disabled={!!scenario.steps || !!scenario.challenge || procedure === "cvc"} onChange={e => setChallenge(e.target.checked)}/><span>Incluir un incidente clínico<small>{procedure === "iv" ? "Dolor y edema durante la comprobación del acceso." : procedure === "ng" ? "Tos durante el avance y aspirado con pH no concluyente." : "Signos locales de posible infección: decide cuándo detenerte."}</small></span></label></div><div className={styles.brief}><span className={styles.eyebrow}>TU PACIENTE</span><h3>{activeProcedure.patient}</h3><p>{activeProcedure.context}</p><button className={styles.primary} onClick={begin}>Entrar al laboratorio <span>→</span></button></div></section>
    </> : <>
      <div className={styles.sessionBar}><div><span className={styles.statusDot}/><strong>{scenario.title}</strong><span>{state.mode === "practice" ? "Práctica guiada" : "Evaluación"} · {state.challenge ? "Con incidente" : "Estándar"}</span></div><div><button onClick={() => setShowHelp(!showHelp)} aria-expanded={showHelp}>Cómo practicar</button><button onClick={() => setQuiet(!quiet)} aria-pressed={quiet}>{quiet ? "Activar animación" : "Reducir movimiento"}</button>{!state.finished && <button onClick={() => setState(s => ({ ...s, paused: !s.paused }))}>{state.paused ? "Reanudar" : "Pausar"}</button>}<button onClick={() => setShowExit(true)}>Cambiar estación</button></div></div>
      {showExit && <section className={styles.exit} aria-label="Confirmar cambio de estación"><p>La práctica actual se reiniciará al entrar en otra estación.</p><button onClick={() => { setStarted(false); setShowExit(false); }}>Volver a las estaciones</button><button onClick={() => setShowExit(false)}>Seguir practicando</button></section>}
      {showHelp && <section className={styles.quickHelp} aria-label="Cómo practicar"><strong>Tu primera práctica, en tres movimientos</strong><ol><li><b>Elige.</b> Toca la imagen del material o la acción que necesitas.</li><li><b>Responde.</b> Si aparece una pregunta, elige la conducta que corresponde al paso actual.</li><li><b>Aplica.</b> Pulsa el botón de aplicación o arrastra el material hasta una zona del paciente.</li></ol><p>Seleccionar o leer una instrucción no realiza el procedimiento. Puedes pausar cuando lo necesites.</p><button onClick={() => setShowHelp(false)}>Entendido</button></section>}
      <nav className={styles.phaseTrack} aria-label="Etapas del procedimiento">{["Preparación", "Procedimiento", "Verificación y cierre"].map((label, index) => <span key={label} aria-current={!state.finished && phase === index ? "step" : undefined} data-complete={index < phase || state.finished && !state.stopped}><b>{index < phase || state.finished && !state.stopped ? "✓" : index + 1}</b>{label}</span>)}</nav>
      <div className={styles.gameHud}><span><b>LAB</b> SIMULACIÓN VIRTUAL</span><div><strong>{state.index * 10} XP</strong><small>por tareas completadas</small></div><div><strong>{state.equipment.units.filter(unit => unit.status === "installed").length} en uso</strong><small>dispositivos colocados</small></div><div><strong>{state.equipment.units.filter(unit => unit.status === "disposed").length} descartados</strong><small>unidades no reutilizables</small></div></div>
      <div className={styles.progressRow}><span>{state.finished ? state.stopped ? "Cierre por seguridad" : "Secuencia completada" : `Tarea ${state.index + 1} de ${activeProcedure.steps.length}`}</span><progress aria-label="Progreso del procedimiento" max={activeProcedure.steps.length} value={state.index}/><span>{state.errors} {state.errors === 1 ? "error" : "errores"}</span></div>
      <nav className={styles.mobileTabs} aria-label="Vista del laboratorio"><button aria-pressed={mobileView === "task"} onClick={() => setMobileView("task")}>Paso y materiales</button><button aria-pressed={mobileView === "patient"} onClick={() => setMobileView("patient")}>Ver paciente</button></nav>
      <div className={styles.labGrid} data-mobile-view={state.finished ? "task" : mobileView}>
        <section className={styles.stage} aria-label="Estación del paciente"><div className={styles.stageHeader}><div><span className={styles.eyebrow}>PACIENTE SIMULADO / ZONA DE PRÁCTICA</span><h2>{activeProcedure.patient}</h2></div><span className={styles.stateLabel}>{state.complication ? "Requiere intervención" : state.stopped ? "Procedimiento detenido" : state.finished ? "Cuidados registrados" : "En práctica"}</span></div>
          <div className={styles.sceneWrap} data-scene-canvas="true" onDragOver={event => event.preventDefault()} onDrop={event => { if ((event.target as HTMLElement).closest("[data-scene-target]")) return; event.preventDefault(); const tool = event.dataTransfer.getData("application/x-care-tool") as CareTool; if (tool && tool in MATERIAL_GUIDE) apply("patient", tool); }}>{sceneView === "realistic" ? <CarePhotoScene state={state} quiet={quiet} zoom={zoom} turn={turn} selected={selected} onAnchor={projectAnchor}/> : <CareScene state={state} quiet={quiet} zoom={zoom} turn={turn} selected={selected} value={value} onAnchor={projectAnchor}/>}<CareInteractionOverlay anchor={anchor} target={step?.target} selected={selected} guided={guided} disabled={state.paused || state.finished || !!correction} siteLabel={scenario.siteLabel} physicalTarget={activeProcedure.target} completed={activeProcedure.steps.slice(0, state.index).map(item => item.target)} onApply={apply}/><div className={styles.sceneBadge}><span className={styles.statusDot}/>{state.procedure === "iv" ? state.complication ? "Edema visible · ardor referido" : scenario.siteLabel : state.procedure === "ng" ? state.complication ? "Tos intensa · detener avance" : "Trayecto digestivo ilustrativo" : state.procedure === "cvc" ? scenario.siteLabel : state.challenge && state.index >= 5 ? "Exudado purulento · valorar" : "Incisión quirúrgica · 24 horas"}</div><div className={styles.viewControls}><button aria-pressed={sceneView === "realistic"} onClick={() => setSceneView("realistic")}>Paciente</button><button aria-pressed={sceneView === "anatomy"} onClick={() => setSceneView("anatomy")}>Anatomía 3D</button><button aria-label="Girar vista a la izquierda" onClick={() => setTurn(Math.max(-.6, turn - .2))}>↶</button><button aria-label="Restablecer vista" onClick={() => { setTurn(0); setZoom(1); }}>Centrar</button><button aria-label="Acercar vista" onClick={() => setZoom(zoom === 1.3 ? 1 : 1.3)}>⌕</button><button aria-label="Girar vista a la derecha" onClick={() => setTurn(Math.min(.6, turn + .2))}>↷</button></div>{state.paused && <div className={styles.pauseOverlay}><strong>Práctica en pausa</strong><button className={styles.primary} onClick={() => setState(s => ({ ...s, paused: false }))}>Reanudar práctica</button></div>}</div>
          <div className={styles.visualSequence} aria-label="Secuencia visible del procedimiento">{activeProcedure.steps.map((item, index) => <span key={item.id} data-done={index < state.index} aria-current={index === state.index && !state.finished ? "step" : undefined}><b>{index < state.index ? "✓" : index + 1}</b>{item.title}</span>)}</div>
          <div className={styles.zones}><p>¿Dónde lo vas a aplicar?<small>{selected ? `${selectedName} en tu mano. Toca una zona o usa el botón del panel.` : "Primero elige una imagen en el panel del paso actual."}</small></p><div>{(["patient", "hands", "tray", activeProcedure.target, ...(state.procedure === "iv" ? ["bin" as const] : [])] as CareTarget[]).map(target => <button key={target} data-target={target} disabled={state.paused || state.finished} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const tool = e.dataTransfer.getData("application/x-care-tool") as CareTool; if (activeProcedure.tools.includes(tool)) apply(target, tool); }} onClick={() => apply(target)} className={guided && selected && target === step?.target ? styles.targetHint : ""}><span aria-hidden="true">{target === "site" ? scenario.siteLabel : target === "nose" ? "Nariz" : target === "wound" ? "Piel" : targets[target].icon}</span>{targetLabel(target)}</button>)}</div></div>
        </section>
        <aside className={styles.taskPanel} aria-label="Tarea actual">
          {state.finished ? <section className={styles.result} data-testid="care-result"><span className={styles.eyebrow}>DEVOLUCIÓN DE LA PRÁCTICA</span><div className={styles.score}>{careScore(state)}<small>/100</small></div><h2>{state.stopped ? "Detenerse también es cuidar." : "Secuencia completada."}</h2><p>{state.stopped ? "Identificaste una situación que impide continuar la técnica rutinaria y realizaste el cierre de seguridad. El procedimiento no se registra como instalado o curado." : "Terminaste la secuencia del escenario. Revisa tus decisiones y los puntos que necesitas practicar con supervisión."}</p><dl><div><dt>Errores de secuencia / técnica</dt><dd>{state.errors}</dd></div><div><dt>Decisiones inseguras</dt><dd>{state.criticalErrors}</dd></div><div><dt>Tareas finalizadas</dt><dd>{state.index}/{activeProcedure.steps.length}</dd></div></dl><p className={styles.note}>Puntaje = 100 − 5 por error − 10 adicionales por decisión insegura. Solo se muestra al cerrar el caso y no acredita competencia clínica.</p><button className={styles.primary} onClick={download}>Descargar bitácora ↓</button><button onClick={begin}>Repetir esta práctica ↻</button><button onClick={() => setStarted(false)}>Elegir otro procedimiento →</button></section> : <>
            <span className={styles.eyebrow}>{state.complication ? "PRIORIDAD / SEGURIDAD" : `TU TAREA / ${String(state.index + 1).padStart(2, "0")}`}</span><h2>{state.complication ? "Detén el procedimiento." : step?.title}</h2><p>{state.complication ? "Leer este aviso no resuelve el incidente. Realiza la respuesta de seguridad para continuar o cerrar el caso." : step?.instruction}</p>
            {!state.complication && step?.choices && <fieldset className={styles.choices} disabled={state.paused}><legend>{step && careQuestion(step)}</legend><p className={styles.questionHelp}>Selecciona una respuesta sobre este paso. Después arrastra el material hasta la imagen o pulsa Aplicar.</p>{step.choices.map((text, index) => <label key={text}><input type="radio" name={`decision-${step.id}`} checked={choice === index} onChange={() => setChoice(index)}/><span>{text}</span></label>)}</fieldset>}
            {!state.complication && materialTray}
            {state.complication ? <button className={styles.danger} disabled={state.paused} onClick={() => { const next = respondToCareComplication(state); setState(next); setSelected(null); setChoice(undefined); setValue(currentCareStep(next)?.precision?.initial ?? 0); }}>{state.procedure === "iv" ? "Detener uso, retirar y valorar el acceso" : "Detener, retirar sonda y reevaluar"}</button> : <>
              {step?.precision && <label className={styles.slider}>{step.precision.label}<strong>{value}{step.precision.unit}</strong><input type="range" min={step.precision.min} max={step.precision.max} value={value} onChange={e => setValue(Number(e.target.value))} disabled={state.paused}/><small>Modelo educativo: ajustar este control no realiza el procedimiento. Aplica después el material en la zona.</small></label>}

              {step?.repeats && <p className={styles.hint}>Pasadas: {state.passes} / {step.repeats}. Cada aplicación consume una gasa; toma una nueva de la bandeja.</p>}
              <div className={styles.applyBlock}>
                <h3>Aplica sobre la imagen</h3>
                {guided ? <><p>{!selected ? "Elige primero una imagen de la bandeja." : needsDecision ? "Responde la pregunta de este paso antes de aplicar." : <>Destino: <strong>{step && targetLabel(step.target)}</strong>. Listo para aplicar.</>}</p><button className={styles.primary} data-testid="apply-material" disabled={!readyToApply} onClick={() => step && apply(step.target)}>{!selected ? "Selecciona un material" : needsDecision ? "Primero responde la pregunta" : `Aplicar en ${step ? targetLabel(step.target).toLowerCase() : "la zona"}`}<span aria-hidden="true">→</span></button></> : <p>{selected ? "Material seleccionado. Decide dónde aplicarlo usando las zonas del paciente." : "Elige un material y después una zona del paciente."}</p>}
              </div>
            </>}
          </>}
          <div aria-live="polite" aria-atomic="true" className={`${styles.feedback} ${!message && (lastEvent?.kind === "error" || lastEvent?.kind === "alert") ? styles.feedbackAlert : ""}`}>{message || (state.mode === "assessment" && lastEvent?.kind === "success" && !state.finished ? "Acción registrada. Continúa con la siguiente tarea." : lastEvent?.kind === "success" && !state.finished ? <><strong>✓ Acción realizada</strong><span>Continúa con: {step?.title.toLowerCase()}.</span><button className={styles.seePatient} onClick={() => setMobileView("patient")}>Ver al paciente →</button><details><summary>¿Qué ocurrió y por qué?</summary><p>{lastEvent.text}</p></details></> : lastEvent?.text) || (!selected ? "Empieza por seleccionar una de las imágenes de este paso." : needsDecision ? "Material seleccionado. Responde la pregunta antes de aplicarlo." : "Material listo. Pulsa Aplicar para realizar la intervención.")}</div>
        </aside>
      </div>
      {state.finished && <CareInventory equipment={state.equipment} destination={scenario.siteLabel} targetLabel={targetLabel} paused={state.paused} finished={state.finished} onRelease={releaseHeld} onDiscard={discardUnit} onChangeGauge={() => setGaugePicker(true)}/>}
      <section className={styles.review}><details open={state.finished}><summary>Bitácora y revisión de decisiones <span>{state.events.length} registros</span></summary>{!state.events.length ? <p>Aquí aparecerán las intervenciones que realices.</p> : <ol>{state.events.map((entry, i) => <li key={i} className={entry.kind === "error" || entry.kind === "alert" ? styles.logError : ""}><span>{String(i + 1).padStart(2, "0")} · {entry.kind === "success" ? "REALIZADO" : entry.kind === "error" ? "REVISAR" : "INCIDENTE"}</span><p>{state.mode === "assessment" && !state.finished && entry.kind === "success" ? "Acción registrada. La explicación estará disponible al cerrar el caso." : entry.text}</p></li>)}</ol>}</details><details><summary>Contexto del caso y secuencia completa</summary><p>{activeProcedure.context}</p><ol>{activeProcedure.steps.map((s, i) => <li key={s.id}>{s.title}{i < state.index ? " ✓" : ""}</li>)}</ol></details></section>
    </>}
    <footer className={styles.footer}><p>Simulación educativa para adultos. Las escenas y respuestas son ilustrativas; no evalúan destreza manual ni sustituyen el entrenamiento supervisado y los protocolos de tu institución.</p><details><summary>Fuentes clínicas y tecnología</summary><p>Escenarios basados en principios de seguridad de CDC, NHS England y NICE. Cada caso tiene límites específicos descritos en su contexto.</p>{CARE_SOURCES.map(s => <a key={s.href} href={s.href} target="_blank" rel="noreferrer">{s.title} ↗</a>)}<a href="https://github.com/mrdoob/three.js" target="_blank" rel="noreferrer">Escenas 3D con Three.js · licencia MIT ↗</a><p>Vista realista con imágenes sintéticas generadas para este proyecto y capas interactivas. Vista anatómica alternativa con Three.js. El calibre se elige según vena, terapia y protocolo; el material usado no se reutiliza.</p></details></footer>
    {touchDrag?.active && <div className={styles.dragGhost} style={{ left: touchDrag.x, top: touchDrag.y }}><MaterialImage tool={touchDrag.tool} gauge={touchDrag.tool === "catheter" ? held?.gauge : undefined}/></div>}
    <CatheterPicker open={gaugePicker} caseId={state.caseId} guided={guided} initial={preferredGauge} onClose={() => setGaugePicker(false)} onConfirm={equipCatheter}/>
    <dialog ref={errorDialog} className={`${styles.materialDialog} ${styles.correctionDialog}`} aria-label="Recomendación para este paso" onClose={() => setCorrection(null)}>
      {correction && <><p className={styles.eyebrow}>PAUSA PARA APRENDER · ACCIÓN NO REALIZADA</p><h2>{correction.title}</h2><h3>¿Por qué no se hace ahora?</h3><p>{correction.reason}</p><div className={styles.recommendation}><h3>Qué hacer en su lugar</h3><p>{correction.recommendation}</p></div><button className={styles.primary} onClick={() => errorDialog.current?.close()}>Entendido, volver al paso</button></>}
    </dialog>
    <dialog ref={materialDialog} className={styles.materialDialog} aria-label="Conoce el material" onClose={() => setPreviewTool(null)} onClick={event => { if (event.target === event.currentTarget) materialDialog.current?.close(); }}>
      {previewTool && <><form method="dialog"><button aria-label="Cerrar imagen ampliada">×</button></form><p className={styles.eyebrow}>CONOCE TU MATERIAL</p><div className={styles.largeMaterial}><MaterialImage tool={previewTool} gauge={previewTool === "catheter" ? held?.gauge ?? preferredGauge : undefined}/></div><h2>{MATERIAL_GUIDE[previewTool].name}</h2><p>{MATERIAL_GUIDE[previewTool].purpose}</p><small>Imagen sintética orientativa. El aspecto del producto puede cambiar según el fabricante.</small><button className={styles.primary} onClick={() => materialDialog.current?.close()}>Volver a la práctica</button></>}
    </dialog>
  </main></div>;
}
