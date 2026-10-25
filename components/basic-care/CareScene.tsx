"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { careCase, currentCareStep, type CareState, type CareTool } from "@/src/lib/basicCareSimulation";
import styles from "./basic-care.module.css";

export default function CareScene({ state, quiet, zoom, turn, selected, value, onAnchor }: { state: CareState; quiet: boolean; zoom: number; turn: number; selected: CareTool | null; value: number; onAnchor: (x: number, y: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ state, quiet, zoom, turn, selected, value, onAnchor });
  const [failed, setFailed] = useState(false);
  useEffect(() => { latest.current = { state, quiet, zoom, turn, selected, value, onAnchor }; }, [state, quiet, zoom, turn, selected, value, onAnchor]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "Modelo anatómico ilustrativo 3D del procedimiento; controles de aplicación debajo de la escena");
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 30);
    scene.add(new THREE.HemisphereLight("#e3f5ff", "#354558", 2.5));
    const light = new THREE.DirectionalLight("#fff2df", 4); light.position.set(-2, 4, 5); scene.add(light);
    const rim = new THREE.DirectionalLight("#6fced9", 2); rim.position.set(3, 0, -2); scene.add(rim);
    const body = new THREE.Group(); scene.add(body);
    const material = (color: string, opacity = 1) => new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: .02, transparent: opacity < 1, opacity });
    function ellipsoid(parent: THREE.Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, opacity = 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), material(color, opacity)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); return mesh;
    }
    function box(parent: THREE.Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, opacity = 1) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material(color, opacity)); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    }
    function curve(parent: THREE.Group, points: number[][], radius: number, color: string, opacity = 1) {
      const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])));
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 64, radius, 10, false), material(color, opacity)); parent.add(mesh); return mesh;
    }
    const drape = box(body, 0, -.25, -.28, 4.5, 2.6, .12, "#2f686c"); drape.rotation.x = -.08;
    let catheter: THREE.Mesh | undefined, dressing: THREE.Mesh, edema: THREE.Mesh | undefined;
    const tube = new THREE.Group(); body.add(tube);
    const dirt = new THREE.Group(); body.add(dirt);
    const clean = new THREE.Group(); body.add(clean);
    const needle = new THREE.Group(); body.add(needle);
    const { procedure } = latest.current.state;
    const scenario = careCase(latest.current.state.caseId, procedure);
    const site = new THREE.Vector3(0, 0, .84);
    if (procedure === "iv") {
      if (scenario.anatomy === "hand") {
        ellipsoid(body, -.95, -.02, .04, .9, .32, .22, "#c88e72");
        ellipsoid(body, .05, -.02, .15, .85, .55, .3, "#d29a7a");
        for (let i = 0; i < 4; i++) ellipsoid(body, .91, .38 - i * .24, .12, .55 - Math.abs(i - 1) * .06, .105, .12, "#d29a7a");
        const thumb = ellipsoid(body, .1, -.67, .12, .4, .13, .13, "#d29a7a"); thumb.rotation.z = -.6;
        for (let i = 0; i < 3; i++) curve(body, [[-.6, -.05, .39], [0, .05 + (i - 1) * .17, .46], [.65, .1 + (i - 1) * .27, .35]], .018, "#739eac");
      } else if (scenario.anatomy === "leg") {
        ellipsoid(body, -.05, .1, .08, .62, 1.55, .4, "#c88e72");
        ellipsoid(body, .25, -1.27, .25, .7, .35, .3, "#d29a7a");
        curve(body, [[-.25, 1.2, .4], [-.12, .45, .51], [0, 0, .5], [.16, -.8, .43]], .025, "#739eac");
      } else {
        ellipsoid(body, -.2, -.08, .15, 1.85, scenario.anatomy === "upper-arm" ? .72 : .57, .4, "#c88e72");
        ellipsoid(body, 1.58, -.03, .2, .6, .5, .23, "#d29a7a");
        for (let i = 0; i < 4; i++) ellipsoid(body, 2.02 + (i % 2) * .05, .25 - i * .16, .2, .35, .095, .1, "#d29a7a");
        curve(body, [[-1.55, -.1, .42], [-.9, .1, .51], [-.2, .05, .55], [.6, -.04, .54], [1.3, .1, .4]], .026, "#638c9b");
        curve(body, [[-.9, .1, .51], [-.7, .35, .47], [-.3, .43, .44]], .018, "#7598a0");
      }
      if (scenario.id === "iv-phlebitis") ellipsoid(body, 0, .05, .56, .5, .3, .035, "#cf766c", .8);
      const strap = box(tube, -1.25, 0, .56, .18, .93, .05, "#6d9ccc"); strap.rotation.z = -.1;
      if (scenario.anatomy === "leg") { strap.position.set(0, .8, .56); strap.rotation.z = Math.PI / 2; }
      catheter = box(clean, .12, .05, .64, .36, .13, .12, "#61bfdd");
      curve(clean, [[.3, .05, .65], [.7, .1, .7], [.9, .65, .6], [1.8, 1.1, .45]], .026, "#d8edf2");
      ellipsoid(clean, -.12, .05, .59, .12, .035, .03, "#bc3a44");
      const shaft = box(needle, 0, 0, 0, .65, .025, .025, "#c8d9e2"); shaft.rotation.z = .2;
      box(needle, .4, .08, 0, .22, .12, .1, "#8fcee5");
      dressing = box(body, .12, .05, .73, .78, .6, .02, "#d7edf0", .45);
      edema = ellipsoid(body, -.08, -.02, .66, .55, .33, .13, "#e8b49b", .9);
    } else if (procedure === "cvc") {
      ellipsoid(body, 0, -.45, 0, 1.35, 1.15, .4, "#c99276");
      ellipsoid(body, 0, .83, .05, .35, .6, .3, "#d29a7a");
      ellipsoid(body, 0, 1.48, 0, .48, .48, .36, "#d29a7a");
      curve(body, [[-1, .3, .33], [-.5, .48, .37], [0, .4, .45], [.5, .48, .37], [1, .3, .33]], .025, "#f0d2bb", .8);
      site.set(scenario.id === "cvc-subclavian" ? .63 : .28, scenario.id === "cvc-subclavian" ? .4 : .91, .61);
      if (scenario.id === "cvc-infection") ellipsoid(body, site.x, site.y, .49, .32, .25, .04, "#c86b65");
      curve(tube, [[site.x, site.y, .54], [site.x + .1, site.y - .4, .61], [.45, -.2, .62]], .035, "#e7ddae");
      for (let i = 0; i < 3; i++) {
        curve(tube, [[.45, -.2, .62], [.35 + i * .18, -.48, .61], [.15 + i * .3, -.8, .57]], .026, ["#87c6d8", "#b7c896", "#d9b88b"][i]);
        box(tube, .15 + i * .3, -.83, .59, .11, .17, .09, ["#4987a5", "#73a276", "#bb8d50"][i]);
      }
      dressing = box(body, site.x, site.y, .66, .63, .51, .022, "#d4e8ec", .6);
      if (scenario.id === "cvc-subclavian") { dressing.rotation.z = .25; dressing.material = material("#abbcba", .7); }
      box(needle, 0, 0, 0, .35, .25, .04, "#e4eee8");
    } else if (procedure === "ng") {
      drape.scale.set(.78, 1.1, 1);
      ellipsoid(body, 0, -.85, -.1, 1.03, 1, .36, "#83aaa9");
      ellipsoid(body, 0, .05, .06, .26, .45, .25, "#c88e72");
      ellipsoid(body, 0, .82, .12, .58, .78, .47, "#d29a7a");
      ellipsoid(body, -.55, .8, .1, .1, .2, .1, "#bd8268"); ellipsoid(body, .55, .8, .1, .1, .2, .1, "#bd8268");
      ellipsoid(body, 0, 1.39, .02, .49, .23, .4, "#403a37");
      for (const x of [-.23, .23]) { ellipsoid(body, x, 1.02, .54, .12, .04, .025, "#3d3e40"); ellipsoid(body, x, 1.13, .53, .14, .015, .025, "#6b4c3f"); }
      ellipsoid(body, 0, .83, .6, .1, .16, .14, "#c18a6f");
      ellipsoid(body, 0, .57, .54, .14, .025, .025, "#945c56");
      curve(body, [[.04, .78, .75], [.14, .4, .48], [.1, -.2, .34], [.18, -.7, .33], [.4, -1.02, .36]], .06, "#d7b7a3", .6);
      ellipsoid(body, .4, -1.02, .31, .3, .29, .12, "#bd8f8e", .7);
      curve(tube, [[-.05, .78, .77], [.11, .53, .59], [.12, .06, .45], [.12, -.45, .43], [.2, -.83, .44], [.43, -1.08, .45]], .028, "#f4d898");
      curve(tube, [[-.05, .78, .77], [-.5, .65, .8], [-1, .15, .7], [-1.2, -.7, .6]], .028, "#f4d898");
      dressing = box(body, -.12, .79, .8, .3, .16, .015, "#f3e3bd"); dressing.rotation.z = -.4;
      box(needle, 0, 0, 0, .22, .38, .04, "#f3e3bd");
    } else {
      ellipsoid(body, 0, -.05, .1, 1.85, 1.02, .3, "#ce9678");
      ellipsoid(body, 0, 0, .4, 1.12, .28, .04, "#c5766a");
      ellipsoid(body, 0, 0, .44, .98, .095, .03, "#8c3c43");
      for (let i = 0; i < 7; i++) {
        const x = -.8 + i * .26;
        curve(body, [[x - .04, -.13, .44], [x, 0, .49], [x + .04, .13, .44]], .012, "#4f535c");
      }
      for (let i = 0; i < 8; i++) ellipsoid(dirt, -.85 + i * .23, Math.sin(i * 2) * .1, .48, .08, .06, .014, latest.current.state.challenge ? "#d2ba60" : "#c08c64");
      dressing = box(body, 0, 0, .53, 2.6, 1.1, .08, "#eee9dc");
      box(clean, -1.25, 0, .53, .17, 1.13, .02, "#d0bea1"); box(clean, 1.25, 0, .53, .17, 1.13, .02, "#d0bea1");
      box(needle, 0, 0, 0, .42, .32, .06, "#f4f6f0");
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.34, .012, 12, 60), new THREE.MeshBasicMaterial({ color: "#82e9d3", transparent: true, opacity: .8 }));
    if (procedure === "ng") site.set(0, .8, .86);
    ring.position.copy(site); body.add(ring);
    const preparedSkin = ellipsoid(body, site.x, site.y, site.z - .15, .53, .32, .015, "#e4bd64", .3);
    let renderDirty = true;
    let lastRendered: typeof latest.current | undefined;
    const resize = () => { const w = container.clientWidth; const h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); renderDirty = true; };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    let frame = 0; let previous = -1; let start = performance.now(); let lastPaint = 0;
    function render(now: number) {
      frame = requestAnimationFrame(render);
      // The mobile task tab hides the scene. Keep it idle until the student opens it.
      if (!container || document.hidden || !container.clientWidth || !container.clientHeight || now - lastPaint < 33) return;
      lastPaint = now;
      const current = latest.current; const s = current.state;
      if ((current.quiet || s.paused) && current === lastRendered && !renderDirty) return;
      lastRendered = current; renderDirty = false;
      const count = s.events.length;
      if (count !== previous) { previous = count; start = now; }
      const moving = !current.quiet && !s.paused;
      const t = moving ? (now - start) / 1000 : 3;
      const done = (id: string) => s.events.some(e => e.step === id && e.kind === "success");
      camera.position.set(Math.sin(current.turn) * 2.4, .5, 6.8); camera.lookAt(0, .05, 0); camera.zoom = current.zoom; camera.updateProjectionMatrix();
      body.rotation.z = moving && procedure === "ng" ? Math.sin(now / 1400) * .007 : 0;
      preparedSkin.visible = done("antisepsis") && !done("secure");
      ring.visible = !s.finished; ring.scale.setScalar(moving ? 1 + Math.sin(now / 450) * .12 : 1); ring.material.color.set(s.complication ? "#ff8c79" : "#82e9d3");
      const last = s.events[count - 1];
      const instrumentAction = procedure === "iv" ? last?.step === "insert" : procedure === "wound" ? last?.step === "clean" : last?.step === "secure";
      const anglePreview = procedure === "iv" && current.selected === "catheter" && currentCareStep(s)?.id === "insert" && !s.finished;
      needle.visible = anglePreview || (instrumentAction && t < 1.3 && count > 0 && !s.finished && last?.kind === "success");
      needle.rotation.z = anglePreview ? current.value * Math.PI / 180 : 0;
      needle.position.set(site.x + Math.sin(t * 3) * .25, site.y + .12, site.z + .18 + Math.max(0, 1 - t) * .5);
      if (procedure === "iv") {
        tube.visible = done("site") && !done("sharps");
        clean.visible = (done("insert") || ["iv-leg", "iv-phlebitis"].includes(scenario.id)) && !s.stopped;
        dressing.visible = done("secure");
        if (catheter) catheter.position.z = .64 + (moving && t < 1 ? (1 - t) * .15 : 0);
        if (edema) edema.visible = s.complication || s.stopped;
      } else if (procedure === "cvc") {
        tube.visible = scenario.id !== "cvc-assisted" || done("central-placement");
        dressing.visible = scenario.id !== "cvc-assisted" && !done("remove") || done("secure");
        clean.visible = false;
      } else if (procedure === "ng") {
        tube.visible = done("insert") && !s.complication;
        const lastInsert = s.events.findLastIndex(e => e.step === "insert" && e.kind === "success");
        const lastRecovery = s.events.findLastIndex(e => e.kind === "success" && e.text.startsWith("Sonda retirada"));
        tube.visible = tube.visible && lastInsert > lastRecovery;
        tube.scale.y = t < 1.4 && lastInsert === count - 1 ? Math.min(1, .1 + t / 1.4) : 1;
        dressing.visible = done("secure"); clean.visible = false;
      } else {
        dressing.visible = !done("remove") || done("secure");
        clean.visible = done("secure");
        const passes = s.passes || (done("clean") && s.index > 8 ? 3 : 0);
        dirt.children.forEach((child, i) => { child.visible = i >= passes * 3; });
      }
      const projected = site.clone(); body.localToWorld(projected); projected.project(camera);
      current.onAnchor((projected.x + 1) * 50, (-projected.y + 1) * 50);
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(m => m.dispose()); } }); renderer.dispose(); renderer.domElement.remove(); };
  }, [state.procedure, state.challenge, state.caseId]);
  return <div className={styles.canvas} ref={host} data-testid="care-scene">{failed && <div className={styles.fallback}><span aria-hidden="true">{state.procedure === "iv" ? "💪" : state.procedure === "ng" ? "👤" : "🩹"}</span><p>Vista 3D no disponible en este dispositivo. Puedes completar todas las acciones con los controles de zona y consultar su resultado en la bitácora.</p></div>}</div>;
}
