'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BRAIN_CASES, BRAIN_PHASES, BRAIN_REGIONS, BRAIN_REGION_DETAILS, BRAIN_SOURCES, brainRegionExplanation, type BrainPhase, type RegionId } from '@/src/lib/brainExplorer';
import { useSoundscape } from './useSoundscape';
import styles from './brain.module.css';
const BrainScene = dynamic(() => import('./BrainScene'), { ssr: false, loading: () => <p>Cargando visor 3D…</p> });
export default function BrainExplorer() {
  const [caseId, setCaseId] = useState('depression');
  const [phase, setPhase] = useState<BrainPhase>('context');
  const [selected, setSelected] = useState<RegionId>('prefrontal');
  const [transparent, setTransparent] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [separated, setSeparated] = useState(false);
  const [labels, setLabels] = useState(true);
  const [guided, setGuided] = useState(false);
  const [view, setView] = useState('oblique');
  const [reset, setReset] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const current = BRAIN_CASES.find(c => c.id === caseId)!;
  const moment = current.phases[phase];
  const region = BRAIN_REGIONS.find(r => r.id === selected)!;
  const regionDetail = BRAIN_REGION_DETAILS[selected];
  const explanation = brainRegionExplanation(caseId, phase, selected);
  const tourIndex = moment.focus.indexOf(selected);
  const audio = useSoundscape(caseId, phase, paused);
  useEffect(() => { const query = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduced(query.matches); update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
  function changeCase(id: string) { audio.stop(); setCaseId(id); setPhase('context'); setAnswer(null); setSelected('prefrontal'); setGuided(false); setTransparent(false); setSeparated(false); }
  function selectRegion(id: RegionId) { setSelected(id); if (id !== 'prefrontal') setTransparent(true); if (id === 'cingulate') setSeparated(true); }
  function changePhase(value: BrainPhase) { setPhase(value); selectRegion(current.phases[value].focus[0]); }
  function startTour() { setGuided(true); selectRegion(moment.focus[0]); }
  function nextRegion() { selectRegion(moment.focus[(tourIndex + 1) % moment.focus.length]); }
  return <main className={styles.page}>
    <header className={styles.header}><div><Link href="/simulation-hub/psicologia" className={styles.back}>← Psicología / Laboratorio de neurociencia</Link><p className={styles.eyebrow}>EXPLORAR · CONECTAR · COMPRENDER</p><h1>Cerebro y experiencia humana<span>Explorador 3D de redes emocionales</span></h1></div><span className={styles.badge}>3 casos clínicos · Modelo educativo</span></header>
    <p className={styles.intro}>Explora un caso, escucha su experiencia y descubre cómo distintas regiones participan en redes. Gira el cerebro y selecciona una estructura para conectar anatomía y síntomas.</p>
    <div className={styles.casePicker} role="group" aria-label="Seleccionar caso clínico">{BRAIN_CASES.map((c, i) => <button key={c.id} aria-pressed={caseId === c.id} onClick={() => changeCase(c.id)}><span className={styles.number}>0{i + 1}</span><span><strong>{c.title}</strong><small>{c.tag}</small></span><span aria-hidden="true">↗</span></button>)}</div>
    <section className={styles.soundExperience} aria-label="Experiencia sonora del caso" data-testid="brain-audio-panel" data-playing={audio.playing}>
      <div className={styles.soundIntro}><span className={styles.soundIcon} aria-hidden="true">♪</span><div><p className={styles.eyebrow}>ESCUCHA LA ESCENA · {moment.label.toUpperCase()}</p><h2>La experiencia de {current.person.split(' · ')[0]}</h2><p>{caseId === 'depression' ? 'Lluvia amortiguada, notas espaciadas y un ambiente apagado acompañan el relato de Lucía.' : caseId === 'anxiety' ? 'Latidos, respiración y un reloj acompañan la preocupación de Andrés.' : 'Motor, ventilación y puerta de ascensor, con latidos y respiración, sitúan la experiencia de Mateo.'}</p></div></div>
      <div className={styles.soundControls}><div className={styles.soundButtons}><button className={styles.listenButton} aria-pressed={audio.enabled} onClick={audio.toggle}>{audio.enabled ? 'Desactivar sonido' : 'Activar sonido'}</button><button onClick={audio.repeatVoice} disabled={!audio.enabled || !audio.includeVoice || paused}>Repetir voz</button><span role="status">{paused && audio.enabled ? 'Audio en pausa' : audio.playing ? (audio.voicePlaying ? 'Reproduciendo ambiente y voz' : 'Reproduciendo ambiente') : audio.enabled ? 'Preparando audio…' : 'Sonido desactivado'}</span></div><div className={styles.soundSettings}><label>Volumen <input aria-label="Volumen del ambiente" type="range" min="0" max="1" step="0.01" value={audio.volume} onChange={e => audio.setVolume(Number(e.target.value))}/></label><label><input type="checkbox" checked={audio.includeVoice} onChange={e => audio.setIncludeVoice(e.target.checked)}/> Voz del personaje</label></div></div>
      <p className={styles.soundNote}>Ambientes y voz sintetizados como dramatización del caso. Cada persona vive una experiencia distinta. Puedes detenerlos con el botón o con Esc. {audio.includeVoice && <>Texto de la voz: “{moment.quote}”</>}</p>
      {paused && audio.enabled && <small>Audio suspendido durante la pausa.</small>}{audio.error && <p role="alert">{audio.error}</p>}
    </section>
    <div className={styles.workspace}>
      <section className={styles.viewer} aria-label="Exploración cerebral">
        <div className={styles.sceneHeader}><span><i /> {paused || reduced ? 'Pulsos detenidos' : 'Redes en exploración'}</span><span>Anterior = frente · Estructuras bilaterales</span></div>
        <div className={styles.scene}><BrainScene focus={moment.focus} selected={selected} onSelect={selectRegion} transparent={transparent} paused={paused} reduced={reduced} view={view} reset={reset} separated={separated} labels={labels} /><div className={styles.orientation}>SUPERFICIE HUMANA · ICBM152<br />Arrastra para girar · Selecciona las etiquetas</div><div className={styles.sceneCaption}>Áreas de color = regiones destacadas · Formas internas esquemáticas<br /><b>Pulsos ilustrativos; no indican intensidad ni actividad eléctrica medida</b></div></div>
        <div className={styles.toolbar}>
          <label>Vista <select aria-label="Vista del cerebro" value={view} onChange={e => setView(e.target.value)}><option value="oblique">Oblicua</option><option value="front">Anterior</option><option value="side">Lateral derecha</option><option value="top">Superior</option></select></label>
          <button aria-pressed={transparent} onClick={() => setTransparent(v => !v)}>{transparent ? '◉' : '○'} Ver interior</button>
          <button aria-pressed={paused} onClick={() => setPaused(v => !v)}>{paused ? 'Reanudar pulsos' : 'Pausar pulsos'}</button>
          <button aria-pressed={separated} onClick={() => setSeparated(v => !v)}>Separar hemisferios</button><button aria-pressed={labels} onClick={() => setLabels(v => !v)}>Etiquetas</button><button onClick={() => { setView("oblique"); setReset(n => n + 1); }}>Centrar</button>
        </div>
        <div className={styles.guided}><div><strong>{guided ? `Recorrido · ${Math.max(tourIndex + 1, 1)} de ${moment.focus.length}` : 'Sigue la red del caso'}</strong><span>{guided ? `${region.name} · ${regionDetail.short}` : 'Descubre qué aporta cada región a esta experiencia.'}</span></div><button onClick={guided ? nextRegion : startTour}>{guided ? 'Siguiente región →' : 'Iniciar recorrido →'}</button></div>
        <div className={styles.legend}><p>Selecciona una región <span>El color identifica la estructura; no expresa gravedad.</span></p><div>{BRAIN_REGIONS.map(r => <button key={r.id} aria-pressed={selected === r.id} onClick={() => selectRegion(r.id)} style={{ '--region-color': r.color } as React.CSSProperties}><i /><span>{r.name}</span><small>{moment.focus.includes(r.id) ? 'En esta escena' : 'Explorar'}</small></button>)}</div></div>
      </section>
      <aside className={styles.casePanel}>
        <p className={styles.eyebrow}>CASO CLÍNICO FICTICIO</p><h2>{current.person}</h2><details className={styles.history}><summary>Leer historia clínica</summary><p>{current.history}</p></details><div className={styles.chips}>{current.symptoms.map(s => <span key={s}>{s}</span>)}</div>
        <div className={styles.phases} role="group" aria-label="Momento del caso">{BRAIN_PHASES.map((p, i) => <button key={p} aria-pressed={phase === p} onClick={() => changePhase(p)}><small>0{i + 1}</small>{current.phases[p].label}</button>)}</div>
        <div aria-live="polite"><blockquote>“{moment.quote}”</blockquote><p>{moment.explanation}</p></div>
        <section className={styles.whyPanel} style={{ '--region-color': region.color } as React.CSSProperties} aria-live="polite" data-testid="brain-explanation"><p className={styles.eyebrow}>{explanation.active ? 'POR QUÉ SE DESTACA EN ESTE MOMENTO' : 'EXPLORACIÓN ANATÓMICA'}</p><h2><i />{region.name}</h2><p className={styles.location}>{regionDetail.location}</p><div className={styles.reasonStep}><span>01</span><div><strong>¿Qué está pasando?</strong><p>{explanation.trigger}</p></div></div><div className={styles.reasonStep}><span>02</span><div><strong>¿Qué aporta esta región?</strong><p>{explanation.why}</p></div></div><div className={styles.reasonStep}><span>03</span><div><strong>¿Cómo se relaciona con lo que siente?</strong><p>{explanation.experience}</p></div></div><p className={styles.interpretation}>Destacar una región indica que ayuda a explicar el caso; no afirma que esté más activa, dañada o que cause por sí sola el síntoma.</p></section>

      </aside>
    </div>
    <div className={styles.learning}>
      <section className={styles.region} style={{ '--region-color': region.color } as React.CSSProperties} aria-live="polite"><p className={styles.eyebrow}>COMPRENDE LA FUNCIÓN Y SUS LÍMITES</p><h2><i />{regionDetail.short}</h2><p>{regionDetail.function}</p><div><strong>¿Cómo funciona con el resto del cerebro?</strong><p>{regionDetail.mechanism}</p></div><p>{regionDetail.caution}</p><a className={styles.sourceLink} href={regionDetail.source} target="_blank" rel="noreferrer">Consultar fundamento · NIMH ↗</a><small>Las áreas de color son aproximaciones didácticas; las formas profundas no son segmentaciones del paciente. La separación de hemisferios facilita explorar el interior y no representa su distancia anatómica.</small></section>
      <section className={styles.quiz}><p className={styles.eyebrow}>COMPRUEBA TU INTERPRETACIÓN</p><h2>{current.question}</h2>{current.options.map((option, i) => <button key={option} aria-pressed={answer === i} onClick={() => setAnswer(i)}>{String.fromCharCode(65 + i)}. {option}</button>)}{answer !== null && <p role="status" className={styles.feedback}><strong>{answer === current.answer ? 'Correcto. ' : 'Revisa tu interpretación. '}</strong>{current.feedback}</p>}</section>
    </div>
    <details className={styles.method}><summary>Cómo interpretar el modelo y fuentes</summary><p>Las luces y los pulsos representan participación de redes de forma didáctica. No muestran actividad eléctrica real, frecuencias EEG, intensidad medida ni un patrón universal. Tampoco los cambios entre momentos predicen el efecto inmediato de una intervención. Los síntomas y la neurobiología varían entre personas.</p><p>Superficies corticales humanas ICBM152 izquierda y derecha distribuidas por Surf Ice / BrainNet. Esta plantilla es simétrica y no muestra asimetrías individuales; se omiten cerebelo y tronco. Se añade sombreado de los surcos calculado desde la geometría. Las áreas coloreadas, las formas internas y sus conexiones son aproximaciones didácticas, con posiciones orientativas en espacio MNI. El color identifica regiones, sin codificar mayor o menor actividad.</p><p>Material para aprendizaje y revisión docente. La evaluación clínica considera historia, funcionamiento, contexto y seguridad. Si una persona expresa ideas de autolesión o presenta síntomas físicos agudos, requiere valoración apropiada; el visor no realiza triaje.</p><ul>{BRAIN_SOURCES.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}<li><a href="/brain-explorer/ATTRIBUTION.md">Procedencia y licencia del modelo</a></li></ul></details>
  </main>;
}
