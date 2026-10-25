"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { careCase, careDefinition, type CareState, type CareTool } from "@/src/lib/basicCareSimulation";
import { CATHETER_GAUGES } from "@/src/lib/careEquipment";
import MaterialImage from "./MaterialImage";
import styles from "./basic-care.module.css";

export default function CarePhotoScene({ state, quiet, zoom, turn, selected, onAnchor }: { state: CareState; quiet: boolean; zoom: number; turn: number; selected: CareTool | null; onAnchor: (x: number, y: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 430 });
  const removedDressing = state.events.some(event => event.step === "remove" && event.kind === "success");
  const securedDressing = state.events.some(event => event.step === "secure" && event.kind === "success");
  const source = useMemo(() => {
    const scenario = careCase(state.caseId, state.procedure);
    if (scenario.anatomy === "forearm") return { url: "forearm-v1.webp", width: 1672, height: 941, x: 47, y: 51, tile: -1 };
    if (scenario.anatomy === "hand") return { url: "hand-v1.webp", width: 1536, height: 1024, x: 47, y: 51, tile: -1 };
    if (scenario.anatomy === "chest") return { url: ["cvc-jugular", "cvc-infection"].includes(scenario.id) && (!removedDressing || securedDressing) ? "chest-v1.webp" : "chest-before-v1.webp", width: 1536, height: 1024, x: scenario.id === "cvc-subclavian" ? 65 : 38, y: scenario.id === "cvc-subclavian" ? 43 : 27, tile: -1 };
    const tile = scenario.anatomy === "upper-arm" ? 0 : scenario.anatomy === "leg" ? 1 : scenario.anatomy === "face" ? 2 : 3;
    return { url: "patient-scenes-v1.webp", width: 768, height: 512, x: tile === 2 ? 43 : 50, y: tile === 2 ? 38 : tile === 1 ? 45 : 50, tile };
  }, [state.caseId, state.procedure, removedDressing, securedDressing]);
  useEffect(() => {
    const container = host.current; if (!container) return;
    const resize = () => { if (container.clientWidth && container.clientHeight) setSize({ width: container.clientWidth, height: container.clientHeight }); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize(); return () => observer.disconnect();
  }, []);
  const scale = Math.max(size.width / source.width, size.height / source.height);
  const width = source.width * scale, height = source.height * scale;
  const angle = turn * 3;
  useEffect(() => {
    const radians = angle * Math.PI / 180;
    const x = (source.x / 100 - .5) * width * zoom;
    const y = (source.y / 100 - .5) * height * zoom;
    onAnchor(50 + (x * Math.cos(radians) - y * Math.sin(radians)) / size.width * 100, 50 + (x * Math.sin(radians) + y * Math.cos(radians)) / size.height * 100);
  }, [angle, height, onAnchor, size.height, size.width, source.x, source.y, width, zoom]);
  const done = (id: string) => state.events.some(event => event.step === id && event.kind === "success");
  const catheter = state.equipment.units.find(unit => unit.tool === "catheter" && unit.status === "installed");
  const preexisting = ["iv-leg", "iv-phlebitis"].includes(state.caseId) && !state.stopped;
  const gauge = catheter?.gauge ?? 20;
  const gaugeInfo = CATHETER_GAUGES.find(item => item.gauge === gauge)!;
  const tone: Record<number, string> = { 14: "hue-rotate(30deg) saturate(2.7)", 16: "saturate(0)", 18: "hue-rotate(135deg) saturate(2)", 20: "none", 22: "hue-rotate(225deg) saturate(2)", 24: "hue-rotate(70deg) saturate(3)" };
  const last = state.events.at(-1);
  const appliedStep = last?.kind === "success" ? careDefinition(state).steps.find(step => step.id === last.step) : undefined;
  const planeStyle: CSSProperties = {
    width, height, left: (size.width - width) / 2, top: (size.height - height) / 2,
    backgroundImage: `url('/basic-care/realistic/${source.url}')`, backgroundSize: source.tile >= 0 ? "200% 200%" : "100% 100%",
    backgroundPosition: source.tile >= 0 ? `${source.tile % 2 * 100}% ${Math.floor(source.tile / 2) * 100}%` : "center",
    transform: `scale(${zoom}) rotate(${angle}deg)`, "--site-x": `${source.x}%`, "--site-y": `${source.y}%`, "--gauge-color": gaugeInfo.color,
  } as CSSProperties;
  const insertedNg = state.equipment.units.some(unit => unit.tool === "tube" && unit.status === "installed") && !state.complication;
  const cvc = state.procedure === "cvc" && (state.caseId !== "cvc-assisted" || done("central-placement"));
  return <div className={styles.photoScene} ref={host} data-testid="care-photo-scene" data-quiet={quiet || state.paused} role="img" aria-label={`Paciente simulado con imagen de apariencia real. ${catheter ? `Catéter ${gauge} G instalado en ${careCase(state.caseId, state.procedure).siteLabel}.` : ""}`}>
    <div className={styles.photoPlane} style={planeStyle}>
      {done("site") && !done("sharps") && state.procedure === "iv" && <div className={styles.photoTourniquet}/>}
      {done("antisepsis") && !done("secure") && <div className={styles.photoAntisepsis}/>}
      {(catheter || preexisting) && <div className={styles.photoCannula} data-testid="installed-catheter" data-gauge={gauge}>
        {/* The retained flexible hub has no metal introducer. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Transparent clinical sprite, no remote image dependency. */}
        <img src="/basic-care/realistic/installed-catheter-v1.webp" alt="" style={{ filter: tone[gauge] }}/>
        <svg className={styles.extensionLine} viewBox="0 0 160 90" aria-hidden="true"><path d="M22 35C60 30 35 85 95 65S135 22 153 24" fill="none" stroke="#d5e4e9" strokeWidth="4"/><path d="M22 35C60 30 35 85 95 65S135 22 153 24" fill="none" stroke="#f7fcff" strokeWidth="1.2"/></svg>
        <span className={styles.cannulaTag}>{gauge} G · instalado</span>
      </div>}
      {state.procedure === "iv" && (state.complication || state.caseId === "iv-phlebitis") && <div className={styles.photoInflammation}/>}
      {insertedNg && <svg className={styles.ngPhotoLine} viewBox="0 0 300 400" aria-hidden="true"><path d="M126 138C134 159 176 173 182 200S179 282 195 330" fill="none" stroke="#b8a66f" strokeWidth="5"/><path d="M126 138C134 159 176 173 182 200S179 282 195 330" fill="none" stroke="#e8d8a8" strokeWidth="3"/></svg>}
      {cvc && source.url !== "chest-v1.webp" && <div className={styles.photoCvcLines}><i/><i/><i/><span>CVC · {done("central-verify") || state.caseId !== "cvc-assisted" ? "verificado" : "verificar antes de usar"}</span></div>}
      {source.url !== "chest-v1.webp" && (done("secure") || state.procedure === "wound" && !done("remove") || state.procedure === "cvc" && state.caseId !== "cvc-assisted" && !done("remove")) && <div className={styles.photoDressing}/>}
      {state.procedure === "wound" && state.challenge && done("remove") && <div className={styles.photoInflammation}/>}
      {state.caseId === "cvc-infection" && <div className={styles.photoInflammation}/>}
      {appliedStep && !state.finished && !state.paused && <div key={state.events.length} className={styles.appliedSprite}><MaterialImage tool={appliedStep.tool} gauge={catheter?.gauge}/></div>}
    </div>
    <span className={styles.syntheticLabel}>IMAGEN SINTÉTICA · ESCENARIO EDUCATIVO</span>
    {selected && <span className={styles.cursorPrompt}>Material preparado · selecciona un destino</span>}
  </div>;
}
