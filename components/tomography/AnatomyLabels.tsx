'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Niivue } from '@niivue/niivue';
import { ANATOMY_GROUPS, anatomyLabelAt, anatomyPlane, anatomyWorldPoint, chooseAnatomyLabels, type AnatomyAtlas, type AnatomyGroup, type AnatomyObject, type AnatomyPoint } from '@/src/lib/tomographyAnatomy';
import type { TomographyView } from '@/src/lib/tomography';
import styles from './anatomy.module.css';
import { observeTomography } from './observeTomography';

type PointLabel = { object: AnatomyObject; point: AnatomyPoint; plane: number; x: number; y: number; textX: number; textY: number; boxWidth: number; text: string; color: string };
type Props = { viewer: Niivue | null; enabled: boolean; groups: AnatomyGroup[]; limit: number; view: TomographyView; studyId: string; isLocal: boolean; fraction: number[]; clip: number; clipAxis: 0 | 1 | 2; svgRef: RefObject<SVGSVGElement | null>; panelRef: RefObject<HTMLDivElement | null>; onFocus: (point: AnatomyPoint) => void };
let atlasPromise: Promise<{ atlas: AnatomyAtlas; labels: Uint8Array }> | null = null;
function fetchAtlas() {
  if (!atlasPromise) atlasPromise = (async () => {
    const [a, b] = await Promise.all([fetch('/tomography/anatomy.json'), fetch('/tomography/anatomy-labels.nii.gz')]);
    if (!a.ok || !b.ok) throw new Error('No se pudo cargar el atlas de nombres.');
    const atlas: AnatomyAtlas = await a.json();
    const bytes = await b.arrayBuffer();
    const { NVImage } = await import('@niivue/niivue');
    const image = await NVImage.loadFromFile({ file: new File([bytes], 'anatomy.nii.gz'), name: 'anatomy.nii.gz' });
    if (!(image.img instanceof Uint8Array) || image.img.length !== atlas.dimensions.reduce((a, b) => a * b)) throw new Error('El volumen de nombres no coincide con la rejilla del atlas.');
    return { atlas, labels: image.img };
  })().catch(error => { atlasPromise = null; throw error; });
  return atlasPromise;
}
const groupColor = (group: AnatomyGroup) => ANATOMY_GROUPS.find(g => g.id === group)?.color ?? '#a5b7c4';
const planeAxis = (plane: number): 0 | 1 | 2 => plane === 0 ? 2 : plane === 1 ? 1 : 0;
const planeName = (plane: number) => ['Axial', 'Coronal', 'Sagital', '', '3D'][plane];

export default function AnatomyLabels(props: Props) {
  const { viewer, enabled, groups, limit, view, studyId, isLocal, fraction, clip, clipAxis, svgRef, panelRef, onFocus } = props;
  const [resource, setResource] = useState<{ atlas: AnatomyAtlas; labels: Uint8Array } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<{ width: number; height: number; labels: PointLabel[]; visible: { object: AnatomyObject; planes: number[]; point: AnatomyPoint }[]; cursor: number }>({ width: 1, height: 1, labels: [], visible: [], cursor: 0 });
  const live = useRef({ groups, limit, view, selected, clip, clipAxis, onFocus });
  useEffect(() => { live.current = { groups, limit, view, selected, clip, clipAxis, onFocus }; }, [groups, limit, view, selected, clip, clipAxis, onFocus]);
  const lastState = useRef('');
  useEffect(() => {
    if (!enabled || isLocal || resource) return;
    let disposed = false; setError('');
    fetchAtlas().then(result => { if (!disposed) setResource(result); }).catch(error => { if (!disposed) setError(error instanceof Error ? error.message : 'No se pudo cargar el atlas de nombres.'); });
    return () => { disposed = true; };
  }, [enabled, isLocal, attempt, resource]);

  useEffect(() => {
    if (!viewer || !resource || !enabled || isLocal) return;
    const nv = viewer; const data = resource.atlas;
    const byId = new Map(data.catalog.map(object => [object.id, object]));
    let disposed = false;
    lastState.current = '';
    const isInVolume = (point: AnatomyPoint) => Array.from(nv.mm2frac(point, 0, true)).every(f => f >= 0 && f <= 1);
    function refresh() {
      if (disposed || !nv.volumes.length || !nv.canvas) return;
      const config = live.current;
      const canvas = nv.canvas;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scaleX = rect.width / canvas.width, scaleY = rect.height / canvas.height;
      const mm = Array.from(nv.frac2mm(nv.scene.crosshairPos, 0, true)).slice(0, 3);
      const visible = new Map<number, { object: AnatomyObject; planes: number[]; point: AnatomyPoint }>();
      const points: PointLabel[] = [];
      const maxPerPlane = Math.min(config.limit, rect.width < 500 ? config.view === 'multiplanar' ? 3 : 5 : config.limit);
      for (const plane of config.view === 'multiplanar' ? [0, 1, 2] : config.view === 'render' ? [] : [config.view === 'axial' ? 0 : config.view === 'coronal' ? 1 : 2]) {
        const axis = planeAxis(plane);
        const anchors = anatomyPlane(data, axis, mm[axis]);
        const candidates: { object: AnatomyObject; point: AnatomyPoint; x: number; y: number; tile: number }[] = [];
        for (const anchor of anchors) {
          const object = byId.get(anchor[0]); if (!object || !config.groups.includes(object.group)) continue;
          const point = anatomyWorldPoint(data, anchor.slice(1, 4)); point[axis] = mm[axis];
          if (!isInVolume(point)) continue;
          const projected = nv.frac2canvasPosWithTile(nv.mm2frac(point, 0, true), plane);
          if (!projected) continue;
          const x = projected.pos[0] * scaleX, y = projected.pos[1] * scaleY;
          if (x < 0 || x > rect.width || y < 0 || y > rect.height) continue;
          candidates.push({ object, point, x, y, tile: projected.tileIndex });
          const previous = visible.get(object.id);
          if (previous) previous.planes.push(plane); else visible.set(object.id, { object, planes: [plane], point });
        }
        const chosen = chooseAnatomyLabels(candidates.map(c => c.object), maxPerPlane, config.groups, config.selected);
        const projected = candidates.filter(c => chosen.some(o => o.id === c.object.id));
        if (!projected.length) continue;
        const tile = nv.screenSlices[projected[0].tile].leftTopWidthHeight;
        const left = Math.max(0, Math.min(tile[0], tile[0] + tile[2]) * scaleX), top = Math.max(0, tile[1] * scaleY);
        const tileWidth = Math.min(rect.width - left, Math.abs(tile[2]) * scaleX), tileHeight = Math.min(rect.height - top, tile[3] * scaleY);
        for (const side of [0, 1]) {
          const column = projected.filter(p => Number(p.x > left + tileWidth / 2) === side).sort((a, b) => a.y - b.y);
          const gap = Math.min(23, Math.max(15, (tileHeight - 24) / Math.max(1, column.length)));
          let lastY = top + 8;
          column.forEach((p, i) => {
            const textY = Math.max(lastY + gap, Math.min(top + tileHeight - 9 - (column.length - 1 - i) * gap, p.y));
            lastY = textY;
            const boxWidth = Math.min(Math.max(50, p.object.name.length * 5.5 + 16), Math.min(170, tileWidth * .47));
            const maxChars = Math.max(7, Math.floor((boxWidth - 12) / 5.5));
            const text = p.object.name.length > maxChars ? p.object.name.slice(0, maxChars - 1) + '…' : p.object.name;
            points.push({ object: p.object, point: p.point, plane, x: p.x, y: p.y, textX: side ? left + tileWidth - boxWidth - 4 : left + 4, textY, boxWidth, text, color: groupColor(p.object.group) });
          });
        }
      }
      const nativeObjects: { object: AnatomyObject; point: AnatomyPoint }[] = [];
      if (config.view === 'render' || config.view === 'multiplanar') {
        if (config.clip > -1) {
          const clippingFrac = [...nv.scene.crosshairPos]; clippingFrac[config.clipAxis] = (config.clip + 1) / 2;
          const cutMM = nv.frac2mm([clippingFrac[0], clippingFrac[1], clippingFrac[2]], 0, true);
          for (const anchor of anatomyPlane(data, config.clipAxis, cutMM[config.clipAxis])) {
            const object = byId.get(anchor[0]); if (!object || !config.groups.includes(object.group)) continue;
            const point = anatomyWorldPoint(data, anchor.slice(1, 4)); if (isInVolume(point)) nativeObjects.push({ object, point });
          }
        } else {
          for (const object of data.catalog) { const point = anatomyWorldPoint(data, object.point); if (config.groups.includes(object.group) && isInVolume(point)) nativeObjects.push({ object, point }); }
        }
        if (config.view === 'render') for (const { object, point } of nativeObjects) visible.set(object.id, { object, point, planes: [4] });
      }
      const nativeChosen = chooseAnatomyLabels(nativeObjects.map(p => p.object), Math.min(config.limit, rect.width < 500 ? 4 : config.view === 'multiplanar' ? 4 : 9), config.groups, config.selected);
      const selectedNative = nativeObjects.filter(p => nativeChosen.some(o => o.id === p.object.id));
      const renderTile = nv.screenSlices.find(tile => tile.axCorSag === 4);
      if (renderTile && selectedNative.length) {
        const tile = renderTile.leftTopWidthHeight;
        const mvp = nv.calculateMvpMatrix(null, tile, nv.scene.renderAzimuth, nv.scene.renderElevation)[0];
        const left = tile[0] * scaleX, top = tile[1] * scaleY, tileWidth = tile[2] * scaleX, tileHeight = tile[3] * scaleY;
        const projected = selectedNative.map(p => { const screen = nv.calculateScreenPoint(p.point, mvp, tile); return { ...p, x: screen[0] * scaleX, y: screen[1] * scaleY }; }).filter(p => p.x >= left && p.x <= left + tileWidth && p.y >= top && p.y <= top + tileHeight);
        for (const side of [0, 1]) {
          const column = projected.filter(p => Number(p.x > left + tileWidth / 2) === side).sort((a, b) => a.y - b.y);
          const gap = Math.min(25, Math.max(18, (tileHeight - 24) / Math.max(1, column.length)));
          let lastY = top + 8;
          column.forEach((p, i) => {
            const textY = Math.max(lastY + gap, Math.min(top + tileHeight - 9 - (column.length - 1 - i) * gap, p.y)); lastY = textY;
            const boxWidth = Math.min(Math.max(50, p.object.name.length * 5.5 + 16), Math.min(175, tileWidth * .46));
            const maxChars = Math.max(7, Math.floor((boxWidth - 12) / 5.5));
            const text = p.object.name.length > maxChars ? p.object.name.slice(0, maxChars - 1) + '…' : p.object.name;
            points.push({ object: p.object, point: p.point, plane: 4, x: p.x, y: p.y, textX: side ? left + tileWidth - boxWidth - 6 : left + 6, textY, boxWidth, text, color: groupColor(p.object.group) });
          });
        }
      }
      const next = { width: rect.width, height: rect.height, labels: points, visible: [...visible.values()].sort((a, b) => a.object.priority - b.object.priority || a.object.name.localeCompare(b.object.name, 'es')), cursor: anatomyLabelAt(data, resource!.labels, mm) };
      const stateKey = JSON.stringify(next);
      if (lastState.current !== stateKey) { lastState.current = stateKey; setLayout(next); }
    }
    const observation = observeTomography(nv, refresh);
    return () => { disposed = true; observation.dispose();  };
  }, [viewer, resource, enabled, isLocal, studyId]);
  useEffect(() => { if (viewer && enabled) viewer.drawScene(); }, [viewer, enabled, groups, limit, view, selected, fraction, clip, clipAxis]);

  const cursorObject = resource?.atlas.catalog.find(o => o.id === layout.cursor && groups.includes(o.group));
  const current = layout.visible.filter(({ object }) => !search || object.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')));
  // The panel is rendered into the existing sidebar via a native HTML portal below.
  const panel = <div className={styles.panel} data-testid="ct-anatomy-panel">
    {isLocal ? <p>Los nombres de este atlas no se aplican a archivos propios.</p> : !enabled ? <p>Activa los nombres para identificar estructuras durante el recorrido.</p> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Reintentar nombres</button></div> : !resource ? <p role="status">Cargando anatomía registrada…</p> : <>
      {view === 'render' && clip <= -1 && <p className={styles.internalNote}>Las líneas pueden señalar estructuras internas ocultas. Usa el recorte o pulsa un nombre para ver su corte.</p>}
      <div className={styles.cursor}><span>BAJO EL CURSOR</span><strong data-testid="ct-anatomy-cursor">{cursorObject?.name ?? 'Sin etiqueta activa en este punto'}</strong>{cursorObject && <small>{cursorObject.source === 'sio' ? 'VOXEL-MAN · registro educativo' : 'Referencia ósea por morfología'}</small>}</div>
      <label className={styles.search}>Buscar en esta vista<input type="search" aria-label="Buscar estructura anatómica" value={search} onChange={e => setSearch(e.target.value)} placeholder="Hígado, fémur, costilla…" /></label>
      <div className={styles.count}>ESTRUCTURAS EN {view === 'render' ? clip > -1 ? 'EL RECORTE 3D' : 'ESTE VOLUMEN' : view === 'multiplanar' ? 'LOS TRES CORTES' : 'ESTE CORTE'} <b data-testid="ct-anatomy-count">{layout.visible.length}</b></div>
      <div className={styles.list} data-testid="ct-anatomy-list">{current.map(({ object, planes, point }) => <button type="button" key={object.id} data-anatomy-id={object.id} data-anatomy-group={object.group} aria-pressed={selected === object.id} onClick={() => { setSelected(object.id); onFocus(point); }} title={`Localizar ${object.name}`}><i style={{ background: groupColor(object.group) }} /><span>{object.name}<small>{[...new Set(planes)].map(planeName).join(' · ')}{object.source === 'morphology' ? ' · referencia ósea' : ''}</small></span><b>⌖</b></button>)}{!current.length && <p>{search ? 'No hay coincidencias en esta vista.' : groups.length ? 'No hay estructuras etiquetadas en este corte. Mueve la barra o explora tórax, abdomen o pelvis.' : 'Selecciona Huesos u Órganos.'}</p>}</div>
      <details className={styles.provenance}><summary>Origen y alcance de los nombres</summary><p>Órganos y huesos del tronco, pelvis y parte de los brazos: segmentaciones de <a href={resource.atlas.source.url} target="_blank" rel="noreferrer">VOXEL-MAN SIO</a>, registradas sobre este volumen. Cráneo y piernas: referencias óseas orientativas calculadas por morfología. Algunas estructuras aún no están etiquetadas.</p><p>Adaptación educativa; no se ha validado para uso diagnóstico. Las etiquetas se ocultan fuera de los cortes y regiones que les corresponden.</p><p>{resource.atlas.source.authors}. Segmented Internal Organs of the Visible Human Male. Licencia CC BY 4.0. Se adaptó la resolución y el registro de las máscaras.</p></details>
    </>}
  </div>;
  return <>
    <svg ref={svgRef} className={styles.overlay} viewBox={`0 0 ${layout.width} ${layout.height}`} width="100%" height="100%" aria-label="Nombres anatómicos sobre los cortes" data-testid="ct-anatomy-overlay" style={{ display: enabled && viewer && !isLocal ? 'block' : 'none' }}>
      {enabled && !isLocal && layout.labels.map(p => <g key={`${p.plane}-${p.object.id}`} data-ct-label={p.object.id} data-label-group={p.object.group} data-label-plane={p.plane} data-label-point={p.point.join(',')} role="button" tabIndex={0} aria-label={p.object.name} onClick={() => { setSelected(p.object.id); onFocus(p.point); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(p.object.id); onFocus(p.point); } }} style={{ pointerEvents: 'auto', cursor: 'pointer' }}><title>{p.object.name}</title><line x1={p.x} y1={p.y} x2={p.x > p.textX + p.boxWidth ? p.textX + p.boxWidth : p.textX} y2={p.textY} stroke={p.color} strokeWidth={selected === p.object.id ? 2 : 1} opacity=".85" /><circle cx={p.x} cy={p.y} r={selected === p.object.id ? 4 : 2.5} fill="#0b1822" stroke={p.color} strokeWidth="1.5" /><rect x={p.textX} y={p.textY - 8} width={p.boxWidth} height="17" rx="4" fill="#0a1725" fillOpacity=".88" stroke={p.color} strokeOpacity={selected === p.object.id ? 1 : .3} /><text x={p.textX + 6} y={p.textY + 3} fill={p.color} fontFamily="Arial, sans-serif" fontSize="10" fontWeight="600">{p.text}</text></g>)}
    </svg>
    <AnatomyPanelPortal target={panelRef}>{panel}</AnatomyPanelPortal>
  </>;
}
function AnatomyPanelPortal({ target, children }: { target: RefObject<HTMLDivElement | null>; children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => { setContainer(target.current); }, [target]);
  return container ? createPortal(children, container) : null;
}
