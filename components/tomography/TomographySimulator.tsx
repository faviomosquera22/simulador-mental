'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Niivue } from '@niivue/niivue';
import Sidebar from '@/components/Sidebar';
import { CT_STUDIES, CT_WINDOWS, CT_RENDER_PRESETS, CT_SOURCE, TOMOGRAPHY_VIEWS, axisForView, fractionSlice, sliceFraction, windowBounds, type CTStudy, type TomographyView } from '@/src/lib/tomography';
import styles from './tomography.module.css';
import AnatomyLabels from './AnatomyLabels';
import { exportTomography } from './exportTomography';
import { ANATOMY_GROUPS, type AnatomyGroup, type AnatomyPoint } from '@/src/lib/tomographyAnatomy';

type VolumeInfo = { dimensions: number[]; spacing: number[] };
type Location = { frac?: number[]; mm?: number[]; values?: { value: number }[] };
const DEFAULT_FRACTION = [.5, .5, .63];
function readLocation(nv: Niivue): Location {
  const mm = nv.frac2mm(nv.scene.crosshairPos, 0, true);
  const volume = nv.volumes[0];
  const vox = volume.mm2vox([mm[0], mm[1], mm[2]]);
  return { frac: Array.from(nv.scene.crosshairPos), mm: Array.from(mm), values: [{ value: volume.getValue(vox[0], vox[1], vox[2], volume.frame4D) }] };
}

export default function TomographySimulator() {
  const [study, setStudy] = useState<CTStudy>(CT_STUDIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [view, setView] = useState<TomographyView>('render');
  const [windowId, setWindowId] = useState('wide');
  const [center, setCenter] = useState(400);
  const [width, setWidth] = useState(2800);
  const [renderPreset, setRenderPreset] = useState('ct_bones');
  const [opacity, setOpacity] = useState(1);
  const [clip, setClip] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [crosshair, setCrosshair] = useState(true);
  const [smooth, setSmooth] = useState(true);
  const [tool, setTool] = useState('crosshair');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [info, setInfo] = useState<VolumeInfo | null>(null);
  const [fraction, setFraction] = useState(DEFAULT_FRACTION);
  const [location, setLocation] = useState<Location>({});
  const [axis, setAxis] = useState<0 | 1 | 2>(2);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(6);
  const [notice, setNotice] = useState('');
  const [anatomyEnabled, setAnatomyEnabled] = useState(true);
  const [anatomyGroups, setAnatomyGroups] = useState<AnatomyGroup[]>(['bones', 'organs']);
  const [anatomyLimit, setAnatomyLimit] = useState(8);
  const activeAnatomyGroups = useMemo(() => anatomyGroups, [anatomyGroups]);
  const anatomySvg = useRef<SVGSVGElement>(null);
  const anatomyPanel = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<AnatomyPoint | null>(null);
  const viewer = useRef<Niivue | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fracRef = useRef(DEFAULT_FRACTION);
  const settings = useRef({ view, center, width, renderPreset, opacity, clip, zoom, crosshair, smooth, tool });
  settings.current = { view, center, width, renderPreset, opacity, clip, zoom, crosshair, smooth, tool };

  const applyDisplay = useCallback((nv: Niivue) => {
    if (!nv.volumes.length) return;
    const s = settings.current;
    const v = nv.volumes[0];
    const [min, max] = windowBounds(s.center, s.width);
    v.cal_min = min; v.cal_max = max;
    const preset = CT_RENDER_PRESETS.find(p => p.id === s.renderPreset)!;
    nv.setColormap(v.id, s.view === 'render' ? s.renderPreset : 'gray');
    v.cal_min = s.view === 'render' ? preset.min : min;
    v.cal_max = s.view === 'render' ? preset.max : max;
    nv.opts.isRadiologicalConvention = true;
    nv.opts.multiplanarShowRender = 1;
    nv.opts.multiplanarForceRender = true;
    nv.opts.multiplanarLayout = 2;
    nv.opts.isOrientCube = true;
    nv.opts.show3Dcrosshair = s.crosshair;
    nv.setCrosshairWidth(s.crosshair ? 1 : 0);
    nv.setInterpolation(!s.smooth);
    nv.setOpacity(0, s.opacity);
    const drag = s.tool === 'pan' ? 3 : s.tool === 'measurement' ? 2 : 8;
    nv.setDragMode(s.tool);
    nv.setMouseEventConfig({ leftButton: { primary: drag }, rightButton: 1, centerButton: 3 });
    nv.setTouchEventConfig({ singleTouch: drag, doubleTouch: 3 });
    nv.setSliceType(TOMOGRAPHY_VIEWS.find(item => item.id === s.view)!.type);

    nv.setPan2Dxyzmm([0, 0, 0, s.zoom]);
    nv.setScale(s.zoom * .8);
    nv.updateGLVolume();
    nv.drawScene();
  }, []);

  useEffect(() => {
    let disposed = false;
    let instance: Niivue | null = null;
    const controller = new AbortController();
    const container = host.current;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Visor interactivo de tomografía');
    canvas.tabIndex = 0;
    const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) { setReady(false); setPlaying(false); setError('Se perdió el contexto gráfico. Reintenta cargar el volumen o prueba un encuadre más pequeño.'); } };
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.display = 'block';
    container?.appendChild(canvas);
    setReady(false); setError(''); setInfo(null); setLocation({}); setPlaying(false);
    setFraction(DEFAULT_FRACTION); fracRef.current = DEFAULT_FRACTION;
    async function initialize() {
      try {
        if (!canvas.getContext('webgl2')) throw new Error('Este dispositivo no ofrece WebGL 2. Prueba un navegador actualizado con aceleración gráfica activada.');
        const { Niivue, NVImage } = await import('@niivue/niivue');
        if (disposed) return;
        const nv = new Niivue({ backColor: [.026, .043, .067, 1], crosshairColor: [.22, .86, .82, .7], fontColor: [.75, .83, .87, 1], isRadiologicalConvention: true, isOrientCube: true, multiplanarShowRender: 1, multiplanarForceRender: true, isColorbar: false, isRuler: true, textHeight: .025, loadingText: 'Cargando volumen anatómico…', dragAndDropEnabled: false, logLevel: 'error' });
        instance = nv;
        await nv.attachToCanvas(canvas);
        if (disposed) { nv.cleanup(); return; }
        nv.onLocationChange = (raw: unknown) => {
          if (disposed) return;
          const data = raw as Location;
          if (data.frac) { const pos = Array.from(data.frac).slice(0, 3); fracRef.current = pos; setFraction(pos); }
          setLocation(data);
        };
        let input = file;
        if (!input) {
          const response = await fetch(study.url, { signal: controller.signal });
          if (!response.ok) throw new Error(`No se pudo descargar el estudio (HTTP ${response.status}).`);
          const bytes = await response.arrayBuffer();
          if (disposed) return;
          input = new File([bytes], `${study.id}.nii.gz`);
        }
        const loaded = await NVImage.loadFromFile({ file: input, name: input.name });
        if (disposed) return;
        nv.addVolume(loaded);
        if (disposed) { nv.cleanup(); return; }
        if (!nv.volumes[0]?.dimsRAS) throw new Error('El archivo no contiene un volumen compatible.');
        viewer.current = nv;
        const volume = nv.volumes[0];
        setInfo({ dimensions: volume.dimsRAS!.slice(1, 4), spacing: Array.from(volume.hdr!.pixDims).slice(1, 4) });
        if (pendingFocus.current) {
          const point = nv.mm2frac(pendingFocus.current, 0, true);
          nv.scene.crosshairPos = point; fracRef.current = Array.from(point); setFraction(Array.from(point)); pendingFocus.current = null;
        } else nv.scene.crosshairPos = [...DEFAULT_FRACTION];
        nv.setRenderAzimuthElevation(170, 10);
        applyDisplay(nv);
        setLocation(readLocation(nv));
        setReady(true);
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el estudio.');
      }
    }
    void initialize();
    return () => {
      disposed = true; controller.abort(); viewer.current = null;
      canvas.removeEventListener('webglcontextlost', contextLost);
      if (instance) { instance.onLocationChange = () => {}; instance.cleanup(); instance.gl?.getExtension('WEBGL_lose_context')?.loseContext(); }
      canvas.remove();
    };
  }, [study.id, study.url, file, retry, applyDisplay]);

  useEffect(() => { if (viewer.current && ready) applyDisplay(viewer.current); }, [view, center, width, renderPreset, opacity, zoom, crosshair, smooth, tool, ready, applyDisplay]);
  useEffect(() => { const nv = viewer.current; if (!nv || !ready) return; nv.setClipPlane(clip <= -1 ? [2, 0, 90] : [clip, axis === 0 ? 90 : 0, axis === 2 ? 90 : 0]); nv.drawScene(); }, [clip, axis, ready]);
  const moveSlice = useCallback((index: number, selectedAxis: 0 | 1 | 2 = axis) => {
    const nv = viewer.current;
    if (!nv || !info) return;
    const pos = [...fracRef.current]; pos[selectedAxis] = sliceFraction(index, info.dimensions[selectedAxis]);
    nv.scene.crosshairPos = [pos[0], pos[1], pos[2]];
    fracRef.current = pos; setFraction(pos); if (view === 'render') setClip(pos[selectedAxis] * 2 - 1); nv.drawScene(); setLocation(readLocation(nv));
  }, [axis, info, view]);

  useEffect(() => {
    if (!playing || !ready || !info) return;
    const timer = window.setInterval(() => {
      const current = fractionSlice(fracRef.current[axis], info.dimensions[axis]);
      if (current >= info.dimensions[axis] - 1) { setPlaying(false); return; }
      moveSlice(current + 1);
    }, 1000 / speed);
    return () => window.clearInterval(timer);
  }, [playing, ready, info, axis, speed, moveSlice]);
  useEffect(() => { const pause = () => { if (document.hidden) setPlaying(false); }; document.addEventListener('visibilitychange', pause); return () => document.removeEventListener('visibilitychange', pause); }, []);

  function selectStudy(next: CTStudy) {
    setPlaying(false); setStudy(next); setFile(null); setZoom(1); setClip(-1); setOpacity(1); setNotice('');
    const w = CT_WINDOWS.find(item => item.id === next.window)!;
    setWindowId(w.id); setCenter(w.center); setWidth(w.width);
  }
  function changeView(next: TomographyView) { setView(next); setPlaying(false); setClip(-1); if (next !== 'multiplanar' && next !== 'render') setAxis(axisForView(next)); }
  function reset() {
    setPlaying(false); setZoom(1); setClip(-1); setOpacity(1); setCrosshair(true); setTool('crosshair');
    const w = CT_WINDOWS.find(item => item.id === study.window) ?? CT_WINDOWS[4];
    setWindowId(w.id); setCenter(w.center); setWidth(w.width); setRenderPreset('ct_bones');
    fracRef.current = DEFAULT_FRACTION; setFraction(DEFAULT_FRACTION);
    if (viewer.current) { viewer.current.scene.crosshairPos = [...DEFAULT_FRACTION]; viewer.current.setRenderAzimuthElevation(170, 10); viewer.current.drawScene(); setLocation(readLocation(viewer.current)); }
  }
  async function screenshot() {
    try { if (viewer.current) await exportTomography(viewer.current, anatomySvg.current); } catch { setNotice('No se pudo guardar la captura.'); }
  }
  function focusAnatomy(point: AnatomyPoint) {
    const nv = viewer.current; if (!nv || file) return;
    setPlaying(false); if (view === 'render') changeView('axial');
    const position = nv.mm2frac(point, 0, true);
    if (Array.from(position).some(f => f < 0 || f > 1)) { pendingFocus.current = point; selectStudy(CT_STUDIES[0]); return; }
    nv.scene.crosshairPos = position; fracRef.current = Array.from(position); setFraction(Array.from(position)); nv.drawScene(); setLocation(readLocation(nv));
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await stage.current?.requestFullscreen(); } catch { setNotice('La pantalla completa no está disponible en este navegador.'); }
  }
  function importFile(next: File | undefined) {
    if (!next) return;
    if (!/\.nii(\.gz)?$/i.test(next.name)) { setNotice('Selecciona un volumen NIfTI (.nii o .nii.gz).'); return; }
    if (next.size > 100 * 1024 * 1024) { setNotice('El límite de esta versión es de 100 MB por volumen.'); return; }
    setFile(next); setPlaying(false); setNotice('Volumen local: las regiones de Visible Human no corresponden a este archivo. Selecciona una región para volver al atlas.');
  }
  const count = info?.dimensions[axis] ?? 1;
  const index = fractionSlice(fraction[axis], count);
  const hu = location.values?.[0]?.value;
  const axisLabels = ['Sagital · izquierda → derecha', 'Coronal · posterior → anterior', 'Axial · pies → cabeza'];

  return <div className={`psyke-workspace ${styles.workspace}`}><Sidebar /><main className={styles.main}>
    <header className={styles.header}>
      <div><div className={styles.eyebrow}><span /> LABORATORIO DE IMAGEN · PSYKE</div><h1>Atlas de tomografía <em>3D</em></h1><p>Recorre el cuerpo. Cambia el plano. Descubre lo que hay debajo.</p></div>
      <Link href="/simulation-hub" className={styles.back}>← Simuladores</Link>
    </header>
    <section className={styles.atlas} aria-label="Atlas de tomografía">
      <aside className={styles.regions}>
        <div className={styles.sectionLabel}>01 / REGIÓN ANATÓMICA</div>
        <div className={styles.regionList}>{CT_STUDIES.map((item, i) => <button type="button" data-ct-region={item.id} key={item.id} aria-pressed={!file && study.id === item.id} className={!file && study.id === item.id ? styles.regionActive : ''} onClick={() => selectStudy(item)}><span className={styles.regionNumber}>{String(i + 1).padStart(2, '0')}</span><span><strong>{item.label}</strong><small>{item.subtitle}</small></span><span className={styles.regionArrow}>↗</span></button>)}</div>
        <div className={styles.sourceBadge}><span className={styles.statusDot} /> {file ? 'VOLUMEN LOCAL' : 'VOLUMEN REAL · POST MORTEM'}<strong>{file ? 'Archivo del usuario' : 'Visible Human · NLM'}</strong><span>{file ? 'La procedencia y modalidad dependen del archivo.' : 'Espécimen masculino congelado. Versión educativa remuestreada.'}</span></div>
        <button type="button" className={styles.importButton} onClick={() => fileInput.current?.click()}>＋ Abrir mi volumen NIfTI</button>
        <input ref={fileInput} type="file" accept=".nii,.gz" className={styles.fileInput} aria-label="Importar volumen NIfTI" onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }} />
        <small className={styles.localNote}>El archivo se procesa en tu navegador. No se envía a un servidor. Hasta 100 MB.</small>
      </aside>
      <div className={styles.viewerColumn}>
        <div className={styles.studyHeader}><div><span className={styles.sectionLabel}>02 / EXPLORACIÓN VOLUMÉTRICA</span><h2>{file ? file.name : study.label}</h2></div><span className={styles.studyChip}>{ready ? '● Volumen listo' : error ? 'Carga interrumpida' : 'Preparando estudio…'}</span></div>
        <div className={styles.viewTabs} aria-label="Plano de visualización">{TOMOGRAPHY_VIEWS.map(item => <button type="button" key={item.id} data-ct-view={item.id} aria-pressed={view === item.id} onClick={() => changeView(item.id)}>{item.label}</button>)}</div>
        <div className={styles.stage} ref={stage} data-testid="ct-stage" data-ready={ready} data-view={view}>
          <div className={styles.canvasHost} ref={host}>
            <AnatomyLabels key={`${study.id}:${file ? 'local' : 'atlas'}:${retry}`} viewer={ready ? viewer.current : null} enabled={anatomyEnabled} groups={activeAnatomyGroups} limit={anatomyLimit} view={view} studyId={study.id} isLocal={Boolean(file)} fraction={fraction} clip={clip} clipAxis={axis} svgRef={anatomySvg} panelRef={anatomyPanel} onFocus={focusAnatomy} />
          </div>
          {!ready && <div className={styles.loading} role={error ? 'alert' : 'status'}>{error ? <><strong>No se pudo abrir el volumen</strong><p>{error}</p><button type="button" onClick={() => setRetry(x => x + 1)}>Reintentar</button></> : <><span className={styles.spinner} /><strong>Reconstruyendo el atlas</strong><p>Cargando imágenes locales y preparando la vista 3D…</p></>}</div>}
          <div className={styles.stageBadge}>{view === 'render' ? 'VOLUMEN 3D' : view === 'multiplanar' ? 'AXIAL · CORONAL · SAGITAL · 3D' : view.toUpperCase()}<span>Convención radiológica · R = derecha / L = izquierda</span></div>
          <button type="button" className={styles.fullscreen} onClick={fullscreen} aria-label="Pantalla completa">⛶</button>
        </div>
        <div className={styles.tools} aria-label="Herramientas del visor">
          <div>{[['crosshair', '⌖ Localizar'], ['pan', '✥ Mover'], ['measurement', '↔ Medir 2D']].map(([id, label]) => <button type="button" key={id} disabled={!ready} aria-pressed={tool === id} onClick={() => { setTool(id); if (id === 'measurement' && view === 'render') changeView('axial'); }}>{label}</button>)}</div>
          <div><button type="button" disabled={!ready} aria-label="Reducir zoom" onClick={() => setZoom(x => Math.max(.5, x - .25))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" disabled={!ready} aria-label="Aumentar zoom" onClick={() => setZoom(x => Math.min(4, x + .25))}>＋</button><button type="button" disabled={!ready} onClick={reset}>Restablecer</button><button type="button" disabled={!ready} onClick={screenshot}>Captura ↓</button></div>
        </div>
        <section className={styles.timeline} aria-label="Recorrido por los cortes">
          <div className={styles.timelineTop}><label>RECORRIDO POR CORTES<select aria-label="Eje del recorrido" value={axis} disabled={view === 'axial' || view === 'coronal' || view === 'sagittal'} onChange={e => { setPlaying(false); setAxis(Number(e.target.value) as 0 | 1 | 2); }}>{axisLabels.map((label, i) => <option value={i} key={label}>{label}</option>)}</select></label><output data-testid="ct-slice">{ready ? `${index + 1} / ${count}` : '— / —'}</output></div>
          <div className={styles.scrubber}><button type="button" disabled={!ready} onClick={() => { setPlaying(false); moveSlice(Math.max(0, index - 1)); }} aria-label="Corte anterior">‹</button><input aria-label="Posición del corte" type="range" min="0" max={count - 1} value={index} disabled={!ready} onChange={e => { setPlaying(false); moveSlice(Number(e.target.value)); }} /><button type="button" disabled={!ready} onClick={() => { setPlaying(false); moveSlice(Math.min(count - 1, index + 1)); }} aria-label="Corte siguiente">›</button></div>
          <div className={styles.playRow}><button type="button" disabled={!ready} aria-pressed={playing} onClick={() => { if (index === count - 1) moveSlice(0); setPlaying(x => !x); }}>{playing ? 'Ⅱ Pausar' : '▶ Reproducir'}</button><label>Velocidad<select aria-label="Velocidad de reproducción" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="3">3 cortes/s</option><option value="6">6 cortes/s</option><option value="12">12 cortes/s</option></select></label><span>{view === 'render' ? 'En 3D, la barra recorta el cuerpo en el eje seleccionado.' : 'La barra representa posición, no tiempo.'}</span></div>
          <div className={styles.coordinates}><span>VOXEL SELECCIONADO <b data-testid="ct-hu">{Number.isFinite(hu) ? `${Math.round(hu!)} ${file ? 'unid.' : 'HU aprox.'}` : 'Toca un punto del corte'}</b></span><span>POSICIÓN RAS <b>{location.mm ? Array.from(location.mm).slice(0, 3).map(x => x.toFixed(1)).join(' / ') + ' mm' : '—'}</b></span><span>MATRIZ <b data-testid="ct-matrix">{info?.dimensions.join(' × ') ?? '—'}</b></span></div>
        </section>
      </div>
      <aside className={styles.settings}>
        <div className={styles.sectionLabel}>03 / AJUSTES Y ANATOMÍA</div>
        <fieldset className={styles.anatomyControls} disabled={Boolean(file)}><legend>Nombres anatómicos</legend>
          <label className={styles.annotationSwitch}><input type="checkbox" checked={anatomyEnabled} onChange={e => setAnatomyEnabled(e.target.checked)} /> Mostrar nombres</label>
          <div className={styles.annotationGroups}>{ANATOMY_GROUPS.map(group => <label key={group.id} style={{ color: group.color }}><input type="checkbox" checked={anatomyGroups.includes(group.id)} disabled={!anatomyEnabled || Boolean(file)} onChange={e => setAnatomyGroups(groups => e.target.checked ? [...groups, group.id] : groups.filter(id => id !== group.id))} /> {group.name}</label>)}</div>
          <label>Rótulos por vista<select aria-label="Cantidad de nombres por vista" value={anatomyLimit} disabled={!anatomyEnabled} onChange={e => setAnatomyLimit(Number(e.target.value))}><option value="4">4 · despejado</option><option value="8">8 · equilibrado</option><option value="12">12 · detallado</option></select></label>
          <small>Los nombres cambian al mover el corte. Pulsa una estructura de la lista para localizarla. En móvil se muestran menos rótulos; la lista conserva todas las estructuras.</small>
        </fieldset>
        <div ref={anatomyPanel} className={styles.anatomyPanelHost} />
        <fieldset disabled={!ready}><legend>Ventana del corte</legend>{view === 'render' && <small>Elige una ventana para abrir un corte 2D.</small>}<div className={styles.windowButtons}>{CT_WINDOWS.map(w => <button type="button" key={w.id} aria-pressed={windowId === w.id} onClick={() => { setWindowId(w.id); setCenter(w.center); setWidth(w.width); if (view === 'render') changeView('axial'); }}>{w.label}</button>)}</div>
          <label>Nivel <b>{center} HU</b><input type="range" aria-label="Nivel de ventana" disabled={view === 'render'} min="-1000" max="1500" step="10" value={center} onChange={e => { setWindowId('custom'); setCenter(Number(e.target.value)); }} /></label>
          <label>Ancho <b>{width} HU</b><input type="range" aria-label="Ancho de ventana" disabled={view === 'render'} min="40" max="4000" step="20" value={width} onChange={e => { setWindowId('custom'); setWidth(Number(e.target.value)); }} /></label>
        </fieldset>
        <fieldset disabled={!ready}><legend>Reconstrucción 3D</legend><label>Visualización<select aria-label="Aspecto del volumen 3D" value={renderPreset} onChange={e => { setRenderPreset(e.target.value); changeView('render'); }}>{CT_RENDER_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
          <label>Opacidad <b>{Math.round(opacity * 100)}%</b><input type="range" aria-label="Opacidad del volumen" min="0.1" max="1" step="0.05" value={opacity} onChange={e => setOpacity(Number(e.target.value))} /></label>
          <label>Corte del volumen <b>{clip <= -1 ? 'Completo' : `${Math.round((clip + 1) * 50)}%`}</b><input type="range" aria-label="Recorte del volumen 3D" disabled={view !== 'render' && view !== 'multiplanar'} min="-1" max="1" step="0.02" value={clip} onChange={e => setClip(Number(e.target.value))} /></label>
          <small>Los aspectos coloreados abren la vista 3D. En la vista combinada se conserva la escala de grises. Los colores son por densidad; los nombres utilizan un atlas anatómico registrado.</small>
        </fieldset>
        <div className={styles.switches}><label><input type="checkbox" checked={crosshair} onChange={e => setCrosshair(e.target.checked)} /> Líneas de referencia</label><label><input type="checkbox" checked={smooth} onChange={e => setSmooth(e.target.checked)} /> Interpolación suave</label></div>
        <div className={styles.guide}><h3>Guía de exploración</h3><p>{file ? 'Volumen local. La modalidad, la orientación y las unidades dependen del archivo importado.' : study.description}</p>{!file && <><div className={styles.sectionLabel}>ESTRUCTURAS A BUSCAR</div><ul>{study.structures.map(s => <li key={s}>{s}</li>)}</ul></>}<details><summary>Cómo explorar</summary><p>En los cortes, toca para localizar. Arrastra en la vista 3D para rotar y usa dos dedos o la rueda para acercar. «Mover» desplaza el plano; «Medir» permite trazar distancias aproximadas. La barra recorre el eje seleccionado: en los cortes cambia la capa y en 3D recorta el volumen. Restablecer recupera el cuerpo completo.</p><p>Axial y transversal son el mismo plano. Coronal separa anterior y posterior; sagital separa izquierda y derecha.</p></details></div>
      </aside>
    </section>
    {notice && <div className={styles.notice} role="status">{notice}<button type="button" aria-label="Cerrar aviso" onClick={() => setNotice('')}>×</button></div>}
    <footer className={styles.footer}>{file ? <p><strong>Archivo local · Uso educativo.</strong> La procedencia, modalidad, orientación, resolución y unidades dependen del archivo. No se ha validado para diagnóstico.</p> : <p><strong>Atlas educativo · No es un visor diagnóstico.</strong> Imágenes post mortem congeladas, remuestreadas a 2,5 × 2,5 × 3 mm. Las mediciones y densidades son aproximadas. No se simula una adquisición ni se evalúa la exactitud clínica. <span>Courtesy of the U.S. National Library of Medicine. Adaptación educativa que no refleja necesariamente la máxima exactitud ni la versión más actual de los datos de NLM. NLM no avala esta aplicación.</span></p>}<div><a href={CT_SOURCE.url} target="_blank" rel="noreferrer">Fuente: NLM Visible Human ↗</a><a href={CT_SOURCE.terms} target="_blank" rel="noreferrer">Condiciones de uso ↗</a><a href="https://doi.org/10.5281/zenodo.15882019" target="_blank" rel="noreferrer">Anatomía: VOXEL-MAN · CC BY 4.0 ↗</a><a href={CT_SOURCE.repository} target="_blank" rel="noreferrer">Motor: NiiVue · BSD-2 ↗</a></div></footer>
  </main></div>;
}
