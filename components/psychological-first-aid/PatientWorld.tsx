"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { PapMotion } from "@/src/lib/psychologicalFirstAid";
import { papBehavior, papBodyPose, papGesture } from "./bodyLanguage";
import { aimPapArm } from "./armIk";
import styles from "./pap.module.css";

type Props = { motion: PapMotion; active: boolean; quiet: boolean; medical: boolean; reduced: boolean; close: boolean; posture?: "standing" | "seated"; engaged?: boolean; turn?: number };

export default function PatientWorld(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { current.current = props; }, [props]);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" }); }
    catch { setState("error"); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute("aria-label", "Sala de apoyo con Valeria, personaje humano 3D animado");
    renderer.domElement.setAttribute("role", "img");
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#d2d8ce");
    scene.fog = new THREE.Fog("#d2d8ce", 10, 20);
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 30);
    const target = new THREE.Vector3(0, 1, 0);
    camera.position.set(0, 1.7, 5.8);
    camera.lookAt(target);
    scene.add(new THREE.HemisphereLight("#f2f5ee", "#8d887d", 2.3));
    const sun = new THREE.DirectionalLight("#fff1d9", 3.6);
    sun.position.set(-3, 6, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 15 });
    sun.shadow.bias = -.0005; scene.add(sun);
    const fill = new THREE.DirectionalLight("#d4e8f1", 1.1); fill.position.set(3, 3, -1); scene.add(fill);
    function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, roughness = .8) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness }));
      mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
    }
    box(12, .12, 10, "#b7ad99", 0, -.08, 0);
    box(12, 3.6, .12, "#deded1", 0, 1.8, -2.1);
    box(.12, 3.6, 10, "#d0d7cb", -4, 1.8, 0);
    box(12, .08, .05, "#b1b8a9", 0, .04, -2.01);
    for (let i = -9; i < 10; i++) box(.012, .002, 8, "#a69b89", i * .48, -.015, 0);
    // Window: built geometry, so the scene does not depend on third-party image services.
    box(1.65, 1.6, .1, "#f5f6e9", -2.5, 2.04, -1.99);
    box(1.48, 1.42, .04, "#b6cfd1", -2.5, 2.04, -1.91);
    box(.04, 1.5, .04, "#e5e7da", -2.5, 2.04, -1.86);
    box(1.5, .04, .04, "#e5e7da", -2.5, 2.1, -1.86);
    const curtain = box(.36, 1.8, .16, "#889e91", -3.29, 2.08, -1.82);
    box(.36, 1.8, .16, "#889e91", -1.71, 2.08, -1.82);
    box(.92, 2.28, .06, "#b0a591", 2.8, 1.14, -1.99);
    box(.68, .34, .025, "#d6e0d4", 2.8, 1.7, -1.94);
    box(.12, .025, .06, "#5c6d65", 2.48, 1, -1.91);
    // Two upholstered seats against the wall, outside the patient's walking path.
    for (const x of [-1.15, .12]) {
      box(.82, .16, .72, "#748c7c", x, .46, -1.18);
      box(.82, .75, .12, "#748c7c", x, .83, -1.5);
      for (const dx of [-.32, .32]) for (const dz of [-.25, .25]) box(.045, .42, .045, "#716553", x + dx, .21, -1.18 + dz);
      for (const dx of [-.44, .44]) box(.07, .28, .62, "#657e70", x + dx, .62, -1.18);
    }
    box(.62, .08, .55, "#d7c1a0", 1.35, .61, -1.3);
    box(.08, .59, .08, "#92836d", 1.35, .29, -1.3);
    box(.21, .07, .16, "#f3efe3", 1.29, .69, -1.3);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.22, .16, .35, 24), new THREE.MeshStandardMaterial({ color: "#b78266", roughness: .9 }));
    pot.position.set(-2.8, .18, -.92); pot.castShadow = true; scene.add(pot);
    for (let i = 0; i < 8; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 10), new THREE.MeshStandardMaterial({ color: i % 2 ? "#4f7151" : "#69865d" }));
      leaf.scale.set(.52, 2.5, .5); leaf.position.set(-2.8 + Math.sin(i * 2) * .15, .6 + i % 3 * .14, -.92 + Math.cos(i * 2) * .15); leaf.rotation.z = Math.sin(i) * .7; scene.add(leaf);
    }
    const actor = new THREE.Group(); scene.add(actor);
    let model: THREE.Group | undefined;
    let mixer: THREE.AnimationMixer | undefined;
    let idle: THREE.AnimationAction | undefined;
    let walk: THREE.AnimationAction | undefined;
    let head: THREE.Object3D | undefined;
    let armL: THREE.Object3D | undefined; let armR: THREE.Object3D | undefined;
    let elbowL: THREE.Object3D | undefined; let elbowR: THREE.Object3D | undefined;
    let spine: THREE.Object3D | undefined;
    let handL: THREE.Object3D | undefined; let handR: THREE.Object3D | undefined;
    let leftSide = -1; let rightSide = 1;
    let thighL: THREE.Object3D | undefined; let thighR: THREE.Object3D | undefined;
    let calfL: THREE.Object3D | undefined; let calfR: THREE.Object3D | undefined;
    let footL: THREE.Object3D | undefined; let footR: THREE.Object3D | undefined;
    let previousTurn: number | undefined;
    let turnAge = 0; let seatBlend = 0;
    let lastReducedPosture: boolean | undefined;
    let previousMotion: PapMotion | undefined;
    let motionAge = 0;
    const baseRotations = new Map<THREE.Object3D, THREE.Quaternion>();
    const smoothedPose = papBodyPose("listening", 0, 0);
    const leftHandTarget = new THREE.Vector3(-.3, 1.1, .2);
    const rightHandTarget = new THREE.Vector3(.3, 1.1, .2);
    let lastWalking = false;
    let lastReduced = false;
    function disposeObject(object: THREE.Object3D) {
      const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>(); const textures = new Set<THREE.Texture>();
      object.traverse(node => { if (node instanceof THREE.Mesh) { geometries.add(node.geometry); for (const mat of Array.isArray(node.material) ? node.material : [node.material]) { materials.add(mat); for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value); } } });
      textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
    }
    new GLTFLoader().load("/psychological-first-aid/valeria.glb", gltf => {
      if (disposed) { disposeObject(gltf.scene); return; }
      model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      model.scale.multiplyScalar(1.7 / size.y);
      bounds.setFromObject(model); model.position.y -= bounds.min.y;
      model.traverse(node => { if (node instanceof THREE.Mesh) { node.castShadow = true; node.receiveShadow = true; } });
      head = model.getObjectByName("head");
      armL = model.getObjectByName("upperarm_l"); armR = model.getObjectByName("upperarm_r");
      elbowL = model.getObjectByName("lowerarm_l"); elbowR = model.getObjectByName("lowerarm_r");
      spine = model.getObjectByName("spine_03");
      handL = model.getObjectByName("hand_l"); handR = model.getObjectByName("hand_r");
      thighL = model.getObjectByName("thigh_l"); thighR = model.getObjectByName("thigh_r");
      calfL = model.getObjectByName("calf_l"); calfR = model.getObjectByName("calf_r");
      footL = model.getObjectByName("foot_l"); footR = model.getObjectByName("foot_r");
      // Constant channels may be omitted from the imported animation. Restore
      // those joints before each mixer evaluation so IK never becomes the next
      // frame's baseline, and hands return to rest after an emotional gesture.
      for (const bone of [head, spine, armL, armR, elbowL, elbowR, thighL, thighR, calfL, calfR]) if (bone) baseRotations.set(bone, bone.quaternion.clone());
      actor.add(model);
      actor.updateWorldMatrix(true, true);
      if (armL) leftSide = Math.sign(actor.worldToLocal(armL.getWorldPosition(new THREE.Vector3())).x) || -1;
      if (armR) rightSide = Math.sign(actor.worldToLocal(armR.getWorldPosition(new THREE.Vector3())).x) || 1;
      leftHandTarget.x = leftSide * .3; rightHandTarget.x = rightSide * .3;
      mixer = new THREE.AnimationMixer(model);
      idle = mixer.clipAction(gltf.animations.find(a => a.name === "Idle_Standing")!);
      walk = mixer.clipAction(gltf.animations.find(a => a.name === "Walk_Relaxed")!);
      idle.play(); walk.play(); walk.setEffectiveWeight(0); idle.setEffectiveWeight(1);
      setState("ready");
      container.dataset.loaded = "true";
    }, undefined, () => { if (!disposed) setState("error"); });
    function resize() { if (!container) return; const { width, height } = container.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); }
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    let last = performance.now(); let time = 0;
    function frame(now: number) {
      const delta = Math.min(.05, (now - last) / 1000); last = now;
      const p = current.current;
      const active = p.active && !p.reduced && !document.hidden;
      if (active) time += delta;
      if (p.turn !== previousTurn) { previousTurn = p.turn; turnAge = 0; }
      if (active) turnAge += delta;
      const seated = p.posture === "seated";
      const reducedPostureChanged = p.reduced && lastReducedPosture !== seated;
      lastReducedPosture = p.reduced ? seated : undefined;
      const behavior = papBehavior(p.motion, time, turnAge, !!p.engaged, seated);
      const seatDistance = Math.hypot(actor.position.x - .12, actor.position.z + 1.12);
      const approachingSeat = seated && seatDistance > .09 && seatBlend < .1;
      const walkDestination = new THREE.Vector3(time % 24 < 12 ? .72 : -.72, 0, .15);
      const routeHeading = Math.atan2(walkDestination.x - actor.position.x, walkDestination.z - actor.position.z);
      const routeRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), routeHeading);
      const readyToWalk = actor.quaternion.angleTo(routeRotation) < .4 && actor.position.distanceTo(walkDestination) > .05;
      const walking = ((behavior.walking && readyToWalk) || approachingSeat) && !p.medical && !p.reduced && seatBlend < .1;
      if (p.motion !== previousMotion) { motionAge = 0; previousMotion = p.motion; }
      if (active) motionAge += delta;
      const targetPose = papBodyPose(p.motion, time, motionAge);
      if (active) for (const key of Object.keys(smoothedPose) as (keyof typeof smoothedPose)[]) smoothedPose[key] += (targetPose[key] - smoothedPose[key]) * (1 - Math.exp(-delta * 5));
      const pose = smoothedPose;
      if (active || reducedPostureChanged || (p.reduced && !lastReduced)) for (const [bone, rotation] of baseRotations) bone.quaternion.copy(rotation);
      if (walk && idle && walking !== lastWalking) {
        walk.enabled = true; idle.enabled = true;
        (walking ? walk : idle).reset().setEffectiveWeight(1).fadeIn(.6);
        (walking ? idle : walk).fadeOut(.6); lastWalking = walking;
      }
      if (p.reduced && !lastReduced && mixer && walk && idle) {
        // Use a stable resting pose, rather than freezing halfway through a stride.
        walk.stopFading().setEffectiveWeight(0);
        idle.stopFading().reset().setEffectiveWeight(1).play();
        mixer.setTime(.6); lastWalking = false;
      }
      lastReduced = p.reduced && !!mixer;
      if (reducedPostureChanged) { seatBlend = seated ? 1 : 0; actor.position.set(seated ? .12 : 0, seated ? -.43 : 0, seated ? -1.12 : .15); actor.rotation.y = 0; mixer?.setTime(.6); }
      if (mixer && active) { mixer.timeScale = walking ? pose.walkSpeed * 1.07 : 1; mixer.update(delta); }
      if (active && seated) {
        if (!p.medical) {
        const destination = new THREE.Vector3(.12, actor.position.y, -1.12);
        actor.position.lerp(destination, Math.min(1, delta * 1.1));
        const direction = Math.atan2(destination.x - actor.position.x, destination.z - actor.position.z);
        actor.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), seatDistance > .25 ? direction : 0), delta * 4);
        if (seatDistance < .15) seatBlend += (1 - seatBlend) * (1 - Math.exp(-delta * 2.5));
        actor.position.y = -.43 * seatBlend;
        }
      } else if (active && seatBlend > .01) {
        seatBlend *= Math.exp(-delta * 3.5); actor.position.y = -.43 * seatBlend;
        actor.position.z += (-.28 - actor.position.z) * (1 - Math.exp(-delta * 2.7));
      } else if (behavior.walking && active && !p.medical) {
        // Turn on the spot first, then take a short straight walk. Never orbit.
        actor.quaternion.slerp(routeRotation, 1 - Math.exp(-delta * 4));
        if (walking) actor.position.add(walkDestination.clone().sub(actor.position).clampLength(0, delta * .32));
      } else if (active) {
        const withdrawing = p.motion === "withdrawing";
        if (withdrawing) actor.position.lerp(new THREE.Vector3(.8, 0, -.25), delta * .7);
        actor.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), withdrawing ? -1.35 : p.motion === "guarded" ? -.85 : -.12), delta * 2);
      }
      if (active || reducedPostureChanged) {
        if (head) { head.rotation.x += pose.headDown + (!walking && !p.engaged ? Math.sin(time * .7) * .015 : 0); head.rotation.z += pose.headTurn + behavior.glance; }
        if (spine) { spine.rotation.x += pose.spine; spine.rotation.z += pose.sway; }
        const gesture = papGesture(p.motion, Math.min(motionAge, turnAge), time, !!p.engaged, seated);
        const handRate = p.reduced ? 1 : 1 - Math.exp(-delta * 3);
        leftHandTarget.lerp(new THREE.Vector3(leftSide * gesture.left[0], gesture.left[1], gesture.left[2]), handRate);
        rightHandTarget.lerp(new THREE.Vector3(rightSide * gesture.right[0], gesture.right[1], gesture.right[2]), handRate);
        actor.updateWorldMatrix(true, true);
        const handWeight = walking ? .05 : gesture.weight;
        if (armL && elbowL && handL) aimPapArm(armL, elbowL, handL, actor.localToWorld(leftHandTarget.clone()), new THREE.Vector3(leftSide * .25, -1, .15).transformDirection(actor.matrixWorld), handWeight);
        if (armR && elbowR && handR) aimPapArm(armR, elbowR, handR, actor.localToWorld(rightHandTarget.clone()), new THREE.Vector3(rightSide * .25, -1, .15).transformDirection(actor.matrixWorld), handWeight);
        if (seatBlend > .01) {
          const pole = new THREE.Vector3(0, .15, 1).transformDirection(actor.matrixWorld);
          if (thighL && calfL && footL) aimPapArm(thighL, calfL, footL, actor.localToWorld(new THREE.Vector3(leftSide * .13, .08 + seatBlend * .43, .38)), pole, seatBlend);
          if (thighR && calfR && footR) aimPapArm(thighR, calfR, footR, actor.localToWorld(new THREE.Vector3(rightSide * .13, .08 + seatBlend * .43, .38)), pole, seatBlend);
        }
      }
      curtain.visible = !p.quiet;
      const seatedCamera = seated || seatBlend > .25;
      const focusZ = seatedCamera ? actor.position.z * .7 : 0;
      camera.position.lerp(new THREE.Vector3(p.close || seatedCamera ? actor.position.x * .6 : .1, seatedCamera ? 1.18 : p.close ? 1.55 : 1.7, focusZ + (p.close ? 2.9 : seatedCamera ? 3.8 : 4.9)), 1 - Math.exp(-delta * 3));
      target.set(p.close || seatedCamera ? actor.position.x * .6 : 0, seatedCamera ? .76 : p.close ? 1.22 : 1, focusZ); camera.lookAt(target);
      container.dataset.motion = p.motion;
      container.dataset.gesture = papGesture(p.motion, Math.min(motionAge, turnAge), time, !!p.engaged, seated).name;
      container.dataset.actorX = actor.position.x.toFixed(3);
      container.dataset.active = String(active);
      container.dataset.locomotion = walking ? "walking" : "standing";
      container.dataset.posture = seatBlend > .85 ? "seated" : seated ? "approaching-seat" : "standing";
      renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(frame);
    function lost(event: Event) { event.preventDefault(); setState("error"); renderer.setAnimationLoop(null); }
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true; observer.disconnect(); renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      mixer?.stopAllAction(); if (model) mixer?.uncacheRoot(model);
      disposeObject(scene); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [attempt]);
  return <div className={styles.world}>
    <div ref={host} className={styles.canvas} data-testid="patient-world" />
    {state === "loading" && <div className={styles.worldMessage}><span className={styles.loader}/><strong>Preparando la sala</strong><span>Cargando el personaje y sus movimientos…</span></div>}
    {state === "error" && <div className={styles.worldMessage} role="status"><strong>La vista 3D no está disponible</strong><span>Puedes continuar con la entrevista y las observaciones escritas.</span><button onClick={() => { setState("loading"); setAttempt(a => a + 1); }}>Reintentar vista 3D</button></div>}
  </div>;
}
