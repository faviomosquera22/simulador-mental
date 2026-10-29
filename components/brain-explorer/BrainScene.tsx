'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BRAIN_REGIONS, BRAIN_REGION_DETAILS, type RegionId } from '@/src/lib/brainExplorer';
import styles from './brain.module.css';

type Props = { focus: RegionId[]; selected: RegionId; onSelect: (id: RegionId) => void; transparent: boolean; paused: boolean; view: string; reset: number; reduced: boolean; separated: boolean; labels: boolean };
const point = (p: number[], side = 1) => new THREE.Vector3(p[0] * side / 60, (p[2] - 12) / 60, -(p[1] + 18) / 60);
const cortical = new Set<RegionId>(['prefrontal', 'insula', 'cingulate']);
const radii: Partial<Record<RegionId, [number, number, number]>> = { prefrontal: [24, 25, 24], insula: [13, 20, 20], cingulate: [9, 22, 18] };
const EDGES: [RegionId, RegionId][] = [['amygdala', 'insula'], ['amygdala', 'hippocampus'], ['amygdala', 'prefrontal'], ['prefrontal', 'cingulate'], ['prefrontal', 'reward'], ['hippocampus', 'reward'], ['insula', 'cingulate'], ['hippocampus', 'prefrontal']];
export default function BrainScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const lines = useRef<SVGSVGElement>(null);
  const latest = useRef(props);
  const [status, setStatus] = useState('loading');
  useEffect(() => { latest.current = props; }, [props]);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { setStatus('error'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('aria-label', 'Cerebro humano 3D con superficies corticales ICBM152, regiones coloreadas y estructuras internas esquemáticas. Arrastra para girar o pellizca para acercar.'); renderer.domElement.setAttribute('role', 'img');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .05, 40);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = false; controls.minDistance = 4.2; controls.maxDistance = 10;
    scene.add(new THREE.HemisphereLight('#fff0e1', '#26334c', 1.8));
    const keyLight = new THREE.DirectionalLight('#fff3e6', 3.2); keyLight.position.set(-3, 5, -2); scene.add(keyLight);
    const fill = new THREE.DirectionalLight('#b2cbff', 1.5); fill.position.set(3, 1, 4); scene.add(fill);
    const rim = new THREE.DirectionalLight('#8eafff', 2); rim.position.set(-3, 2, 4); scene.add(rim);
    const hemispheres = [-1, 1].map(side => { const group = new THREE.Group(); group.userData.side = side; scene.add(group); return group; });
    type Surface = { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>; shade: Float32Array; mni: Float32Array; side: number };
    const shells: Surface[] = [];
    const regions: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
    const hitTargets: THREE.Object3D[] = [];
    const glows: THREE.Sprite[] = [];
    const anchor = BRAIN_REGIONS.map(r => point(r.position));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    let glowTexture: THREE.CanvasTexture | undefined;
    if (ctx) { const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.2, '#ffffff99'); gradient.addColorStop(1, '#ffffff00'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64); glowTexture = new THREE.CanvasTexture(canvas); }
    function material(id: RegionId) { const r = BRAIN_REGIONS.find(item => item.id === id)!; return new THREE.MeshStandardMaterial({ color: r.color, emissive: r.color, emissiveIntensity: .35, roughness: .38, metalness: .08, transparent: true, opacity: 1 }); }
    function addRegion(group: THREE.Group, id: RegionId, geometry: THREE.BufferGeometry) {
      const mesh = new THREE.Mesh(geometry, material(id)); mesh.userData.region = id; mesh.userData.side = group.userData.side; mesh.renderOrder = 1; group.add(mesh); regions.push(mesh); hitTargets.push(mesh); return mesh;
    }
    for (const group of hemispheres) {
      const side = group.userData.side;
      for (const id of ['amygdala', 'hippocampus', 'reward'] as RegionId[]) {
        const r = BRAIN_REGIONS.find(item => item.id === id)!;
        if (id === 'hippocampus') {
          const curve = new THREE.CatmullRomCurve3([[20, -7, -17], [26, -15, -19], [29, -25, -16], [28, -34, -10], [24, -40, -4]].map(p => point(p, side)));
          const geometry = new THREE.TubeGeometry(curve, 36, .073, 12, false);
          const pos = geometry.getAttribute('position');
          for (let i = 0; i < pos.count; i++) { const t = Math.floor(i / 13) / 36; const center = curve.getPointAt(t); const vertex = new THREE.Vector3().fromBufferAttribute(pos, i); vertex.sub(center).multiplyScalar(1.3 - .55 * t).add(center); pos.setXYZ(i, vertex.x, vertex.y, vertex.z); }
          geometry.computeVertexNormals(); addRegion(group, id, geometry);
        } else {
          const geometry = new THREE.SphereGeometry(1, 32, 22); const pos = geometry.getAttribute('position');
          for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); const ripple = 1 + .07 * Math.sin(v.y * 7) * Math.cos(v.z * 5); v.multiplyScalar(ripple); v.multiply(id === 'amygdala' ? new THREE.Vector3(.115, .15, .16) : new THREE.Vector3(.105, .13, .12)); v.add(point(r.position, side)); pos.setXYZ(i, v.x, v.y, v.z); }
          geometry.computeVertexNormals(); addRegion(group, id, geometry);
        }
      }
      for (const r of BRAIN_REGIONS) {
        if (!glowTexture) continue;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: r.color, transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending }));
        sprite.position.copy(point(r.position, side)); sprite.scale.setScalar(.65); sprite.userData.region = r.id; group.add(sprite); glows.push(sprite);
      }
    }
    const signals: { mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; curve: THREE.QuadraticBezierCurve3; a: RegionId; b: RegionId; offset: number }[] = [];
    const paths: { mesh: THREE.Mesh<THREE.TubeGeometry, THREE.MeshBasicMaterial>; a: RegionId; b: RegionId }[] = [];
    for (const group of hemispheres) for (const [i, [aId, bId]] of EDGES.entries()) {
      const a = point(BRAIN_REGIONS.find(r => r.id === aId)!.position, group.userData.side), b = point(BRAIN_REGIONS.find(r => r.id === bId)!.position, group.userData.side);
      const middle = a.clone().lerp(b, .5); middle.y += .15;
      const curve = new THREE.QuadraticBezierCurve3(a, middle, b);
      const color = BRAIN_REGIONS.find(r => r.id === bId)!.color;
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .009, 5, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .35, depthWrite: false })); group.add(mesh); paths.push({ mesh, a: aId, b: bId });
      const signal = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff7df' })); group.add(signal); signals.push({ mesh: signal, curve, a: aId, b: bId, offset: i * .13 });
    }
    let disposed = false;
    const abort = new AbortController();
    Promise.all(hemispheres.map(async group => {
      const side = group.userData.side;
      const response = await fetch(`/brain-explorer/cortex-${side < 0 ? 'left' : 'right'}.bin`, { signal: abort.signal }); if (!response.ok) throw Error('mesh');
      const buffer = await response.arrayBuffer(); if (disposed) return;
      const header = new DataView(buffer), nv = header.getUint32(0, true), nf = header.getUint32(4, true);
      const mni = new Float32Array(buffer, 8, nv * 3), indices = new Uint32Array(buffer, 8 + nv * 12, nf * 3), shade = new Float32Array(buffer, 8 + nv * 12 + nf * 12, nv);
      const positions = new Float32Array(nv * 3);
      for (let i = 0; i < nv; i++) { const p = point([mni[i * 3], mni[i * 3 + 1], mni[i * 3 + 2]]); positions.set(p.toArray(), i * 3); }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nv * 3), 3)); geometry.setIndex(new THREE.BufferAttribute(indices, 1)); geometry.computeVertexNormals();
      const mat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: .53, metalness: .02, clearcoat: .12, clearcoatRoughness: .7, transparent: true, side: THREE.FrontSide });
      const mesh = new THREE.Mesh(geometry, mat); mesh.renderOrder = 2; group.add(mesh); shells.push({ mesh, shade, mni, side });
      const normals = geometry.getAttribute('normal');
      for (const r of BRAIN_REGIONS.filter(r => cortical.has(r.id))) {
        const radius = radii[r.id]!;
        const mask = (index: number) => {
          const x = (Math.abs(mni[index * 3]) - r.position[0]) / radius[0], y = (mni[index * 3 + 1] - r.position[1]) / radius[1], z = (mni[index * 3 + 2] - r.position[2]) / radius[2]; return x * x + y * y + z * z < 1;
        };
        const patch: number[] = [], patchNormals: number[] = [];
        for (let i = 0; i < indices.length; i += 3) {
          if (![indices[i], indices[i + 1], indices[i + 2]].every(mask)) continue;
          for (let j = 0; j < 3; j++) { const index = indices[i + j]; patch.push(positions[index * 3] + normals.getX(index) * .008, positions[index * 3 + 1] + normals.getY(index) * .008, positions[index * 3 + 2] + normals.getZ(index) * .008); patchNormals.push(normals.getX(index), normals.getY(index), normals.getZ(index)); }
        }
        const patchGeometry = new THREE.BufferGeometry(); patchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(patch, 3)); patchGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(patchNormals, 3));
        const patchMesh = addRegion(group, r.id, patchGeometry); patchMesh.renderOrder = 3;
      }
    })).then(() => { if (!disposed) setStatus('ready'); }).catch(() => { if (!disposed) setStatus('error'); });
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down = [0, 0];
    const intersections = (event: PointerEvent) => {
      const box = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - box.left) / box.width * 2 - 1, -(event.clientY - box.top) / box.height * 2 + 1); ray.setFromCamera(pointer, camera);
      // Opaque cortex occludes deep structures; opening the interior makes them pickable.
      const hits = ray.intersectObjects([...hitTargets.filter(m => m.visible), ...(!latest.current.transparent ? shells.map(s => s.mesh) : [])]);
      return hits[0]?.object.userData.region as RegionId | undefined;
    };
    const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY]; };
    const onUp = (e: PointerEvent) => { if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const id = intersections(e); if (id) latest.current.onSelect(id); } };
    const onMove = (e: PointerEvent) => { renderer.domElement.style.cursor = intersections(e) ? 'pointer' : 'grab'; };
    renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp); renderer.domElement.addEventListener('pointermove', onMove);
    const resize = new ResizeObserver(() => { const w = container.clientWidth, h = container.clientHeight; if (w && h) { renderer.setSize(w, h); camera.aspect = w / h; camera.zoom = camera.aspect < 1 ? Math.max(.55, camera.aspect * .85) : 1; camera.updateProjectionMatrix(); renderer.render(scene, camera); } }); resize.observe(container);
    let frame = 0, last = 0, time = 0, previousKey = '', previousView = '', previousReset = -1;
    const baseColor = new THREE.Color('#c9b4ae');
    const world = new THREE.Vector3();
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (document.hidden || !container.clientWidth || now - last < 40) return;
      const dt = Math.min((now - last) / 1000, .08); last = now;
      const p = latest.current; if (!p.paused && !p.reduced) time += dt;
      if (p.view !== previousView || p.reset !== previousReset) {
        camera.position.copy(p.view === 'front' ? new THREE.Vector3(0, .55, -5.5) : p.view === 'side' ? new THREE.Vector3(5.8, .45, 0) : p.view === 'top' ? new THREE.Vector3(0, 6.2, .01) : new THREE.Vector3(4.4, 1.7, -4.4));
        controls.target.set(0, 0, 0); controls.update(); previousView = p.view; previousReset = p.reset;
      }
      hemispheres.forEach(group => { const target = p.separated ? group.userData.side * .55 : 0; group.position.x = p.reduced ? target : THREE.MathUtils.lerp(group.position.x, target, .12); });
      const stateKey = p.focus.join() + p.selected + p.transparent + shells.length;
      if (stateKey !== previousKey) {
        previousKey = stateKey;
        for (const { mesh, shade } of shells) {
          mesh.material.opacity = p.transparent ? .14 : 1; mesh.material.depthWrite = !p.transparent;
          const colors = mesh.geometry.getAttribute('color');
          for (let i = 0; i < colors.count; i++) { const color = baseColor.clone().multiplyScalar(shade[i]); colors.setXYZ(i, color.r, color.g, color.b); } colors.needsUpdate = true;
        }
        paths.forEach(({ mesh, a, b }) => { mesh.visible = p.transparent && p.focus.includes(a) && p.focus.includes(b); mesh.material.opacity = a === p.selected || b === p.selected ? .8 : .22; });
      }
      for (const mesh of regions) {
        const id: RegionId = mesh.userData.region; const active = p.focus.includes(id), selected = p.selected === id;
        mesh.visible = active || selected; mesh.material.opacity = cortical.has(id) ? (selected ? .88 : .46) : (selected ? 1 : .78);
        mesh.material.emissiveIntensity = selected ? .5 + Math.sin(time * 2) * .12 : .12;
      }
      glows.forEach(sprite => { sprite.visible = p.transparent && (p.focus.includes(sprite.userData.region) || p.selected === sprite.userData.region); (sprite.material as THREE.SpriteMaterial).opacity = p.selected === sprite.userData.region ? .28 + Math.sin(time * 2) * .06 : .10; });
      signals.forEach(({ mesh, curve, a, b, offset }) => { mesh.visible = p.transparent && p.focus.includes(a) && p.focus.includes(b); mesh.position.copy(curve.getPoint((time * .16 + offset) % 1)); });
      controls.update(); scene.updateMatrixWorld(); camera.updateMatrixWorld();
      if (lines.current) {
        const w = container.clientWidth, h = container.clientHeight;
        for (const [i, region] of BRAIN_REGIONS.entries()) {
          const labelLine = lines.current.querySelector(`[data-line="${region.id}"]`);
          if (!labelLine) continue;
          const side = camera.position.x < 0 ? -1 : 1; world.copy(anchor[i]); world.x *= side; world.x += p.separated ? side * .55 : 0; world.project(camera);
          const right = i >= 3; const row = i % 3; const x = (world.x + 1) / 2 * w, y = (-world.y + 1) / 2 * h;
          const labelY = h * (.24 + row * .23); const labelX = right ? w - Math.min(w * .26, 150) : Math.min(w * .26, 150);
          labelLine.setAttribute('x1', String(labelX)); labelLine.setAttribute('y1', String(labelY)); labelLine.setAttribute('x2', String(x)); labelLine.setAttribute('y2', String(y));
          const dot = lines.current.querySelector(`[data-dot="${region.id}"]`); if (dot) { dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y)); }
        }
      }
      renderer.render(scene, camera); container.dataset.renderedView = p.view; container.dataset.renderedWidth = String(container.clientWidth); container.dataset.renderedRegion = p.selected;
    }
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true; abort.abort(); cancelAnimationFrame(frame); resize.disconnect(); controls.dispose(); glowTexture?.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onUp); renderer.domElement.removeEventListener('pointermove', onMove);
      scene.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose(); } else if (o instanceof THREE.Sprite) o.material.dispose(); }); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  const visible = (id: RegionId) => props.labels && (props.focus.includes(id) || id === props.selected);
  return <>
    <div ref={host} data-testid="brain-scene" data-status={status} data-selected-region={props.selected} data-separated={props.separated} style={{ position: 'absolute', inset: 0 }} />
    {status === 'ready' && <div className={styles.sceneLabels}>
      <svg ref={lines} aria-hidden="true">{BRAIN_REGIONS.map(r => <g key={r.id} style={{ display: visible(r.id) ? undefined : 'none' }}><line data-line={r.id} stroke={r.color} opacity={props.selected === r.id ? .85 : .35} strokeWidth={props.selected === r.id ? 1.5 : 1} /><circle data-dot={r.id} r={props.selected === r.id ? 4 : 2.5} fill={r.color}/></g>)}</svg>
      {BRAIN_REGIONS.map((r, i) => visible(r.id) && <button key={r.id} data-brain-label={r.id} aria-label={`Localizar ${r.name}`} aria-pressed={props.selected === r.id} onClick={() => props.onSelect(r.id)} style={{ '--region-color': r.color, top: `${24 + i % 3 * 23}%`, [i >= 3 ? 'right' : 'left']: 12 } as React.CSSProperties}><span>{String(i + 1).padStart(2, '0')}</span><strong>{r.name}</strong><small>{BRAIN_REGION_DETAILS[r.id].short}</small></button>)}
    </div>}
    {status !== 'ready' && <div className={styles.sceneStatus} role="status">{status === 'loading' ? 'Preparando superficies anatómicas…' : 'El visor 3D no está disponible. Puedes explorar todas las regiones y explicaciones con los botones inferiores.'}</div>}
  </>;
}
