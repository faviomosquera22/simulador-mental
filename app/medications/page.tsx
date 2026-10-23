"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import OrderPractice from "@/components/medications/OrderPractice";
import { MEDICATION_CHALLENGES, PRACTICE_DRUGS, drawMedicationChallenge, evaluateMedicationChallenge, searchPracticeDrugs, type ChallengeDifficulty, type ChallengeInput, type ChallengeResult, type MedicationChallenge } from "@/src/lib/medicationChallenges";
import styles from "./practice.module.css";

const levels: { id: ChallengeDifficulty; label: string; description: string }[] = [
  { id: "easy", label: "Fácil", description: "Una necesidad clínica clara" },
  { id: "medium", label: "Medio", description: "Relaciona presentación y vía" },
  { id: "hard", label: "Difícil", description: "Prioridades y riesgos del caso" },
];
function Pill({ small = false }: { small?: boolean }) {
  return <svg width={small?22:64} height={small?22:64} viewBox="0 0 64 64" fill="none" aria-hidden="true"><g transform="rotate(-40 32 32)"><rect x="8" y="20" width="48" height="24" rx="12" stroke="currentColor" strokeWidth="2.5"/><path d="M32 21V43H20a11 11 0 010-22Z" fill="currentColor" opacity=".2"/><path d="M32 21V43" stroke="currentColor" strokeWidth="2"/></g></svg>;
}
export default function MedicationsPage() {
  const [orders, setOrders] = useState(false);
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>("easy");
  const [challenge, setChallenge] = useState<MedicationChallenge|null>(null);
  const [seen, setSeen] = useState<Record<ChallengeDifficulty,string[]>>({easy:[],medium:[],hard:[]});
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [formId, setFormId] = useState("");
  const [pending, setPending] = useState<ChallengeInput|null>(null);
  const [result, setResult] = useState<ChallengeResult|null>(null);
  const [stats, setStats] = useState({completed:0,correct:0,streak:0});
  const dialog = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLSelectElement>(null);
  const trayRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const selected = PRACTICE_DRUGS.find(d=>d.id===selectedId);
  const form = selected?.forms.find(f=>f.id===formId);
  const matches = searchPracticeDrugs(query);
  const level = levels.find(l=>l.id===difficulty)!;
  useEffect(()=>{
    const element=dialog.current;if(!element)return;
    if(pending&&!element.open)element.showModal();else if(!pending&&element.open)element.close();
  },[pending]);
  function start(nextLevel=difficulty) {
    const next=drawMedicationChallenge(nextLevel,seen[nextLevel]);
    setDifficulty(nextLevel);setChallenge(next);setSeen(previous=>({...previous,[nextLevel]:[...previous[nextLevel],next.id]}));
    setQuery("");setSelectedId("");setFormId("");setPending(null);setResult(null);
  }
  function chooseLevel(next:ChallengeDifficulty) {
    if(next===difficulty)return;
    if(challenge)start(next);else setDifficulty(next);
  }
  function confirm() {
    if(!challenge||!pending||result)return;
    const evaluated=evaluateMedicationChallenge(challenge.id,pending);if(!evaluated)return;
    setResult(evaluated);setPending(null);
    setStats(previous=>({completed:previous.completed+1,correct:previous.correct+Number(evaluated.appropriate),streak:evaluated.appropriate?previous.streak+1:0}));
    requestAnimationFrame(()=>{resultRef.current?.focus({preventScroll:true});resultRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"});});
  }
  if(orders)return <OrderPractice onBack={()=>setOrders(false)}/>;
  return <div className={styles.page}><div className="psyke-workspace"><Sidebar/><main className={styles.main}>
    <header className={styles.header}><div><Link href="/simulation-hub" className={styles.back}>← Escenarios</Link><div className={styles.eyebrow}>PSYKE / MEDICAMENTOS</div><h1>Tu próxima decisión.</h1><p>Un caso breve. Un botiquín. Tú eliges cómo actuar.</p></div><button className={styles.legacy} onClick={()=>setOrders(true)}>Órdenes y cálculo ↗</button></header>
    <section className={styles.setup} aria-label="Configurar la práctica"><div><span className={styles.eyebrow}>ELIGE TU NIVEL</span><div className={styles.levels}>{levels.map(l=><button key={l.id} aria-pressed={difficulty===l.id} onClick={()=>chooseLevel(l.id)}><strong>{l.label}</strong><small>{l.description}</small></button>)}</div></div><button className={styles.primary} onClick={()=>start()}>{challenge?"Otro caso aleatorio":"Generar caso aleatorio"}<span aria-hidden="true">↗</span></button></section>
    <div className={styles.session} aria-label="Tu sesión"><span><b>{stats.completed}</b> casos completados</span><span><b>{stats.correct}</b> decisiones adecuadas</span><span><b>{stats.streak}</b> de racha</span><small>{MEDICATION_CHALLENGES.filter(c=>c.difficulty===difficulty).length} casos en nivel {level.label.toLowerCase()}</small></div>
    {!challenge ? <section className={styles.welcome}><div className={styles.welcomeArt}><Pill/><span>UNA DECISIÓN A LA VEZ</span></div><h2>Entra al turno.</h2><p>Lee lo necesario, busca un medicamento por su nombre y elige su presentación. Antes de usarlo, confirma tu selección. Después conocerás el razonamiento.</p><ol><li><b>01</b><strong>Conoce el caso</strong><span>Paciente, antecedentes y datos clave.</span></li><li><b>02</b><strong>Explora el botiquín</strong><span>Busca y selecciona sin pistas de respuesta.</span></li><li><b>03</b><strong>Toma la decisión</strong><span>Administrar, o retener y consultar.</span></li></ol><button className={styles.primary} onClick={()=>start()}>Empezar mi primer caso →</button></section> : <div className={styles.workspace}>
      <div className={styles.caseColumn}><article className={styles.caseCard} aria-label="Caso clínico"><div className={styles.cardTop}><span className={styles.eyebrow}>ENTREGA DE TURNO</span><span className={styles.badge}>{level.label}</span></div><div className={styles.patient}><div className={styles.avatar}>{challenge.patient.split(" ").slice(0,2).map(n=>n[0]).join("")}</div><div><h2>{challenge.patient}</h2><p>{challenge.age} años · {challenge.title}</p></div></div><p className={styles.context}>{challenge.context}</p><div className={styles.facts}>{challenge.facts.map(f=><div key={f.label}><small>{f.label}</small><strong>{f.value}</strong></div>)}</div><div className={styles.allergy}><small>ALERGIAS REGISTRADAS</small><p>{challenge.allergies}</p></div><div className={styles.goal}><span>Tu objetivo</span><p>{challenge.goal}</p></div></article>
        <section ref={trayRef} className={`${styles.tray} ${selected?styles.trayReady:""}`} aria-label="Preparación del medicamento"><span className={styles.eyebrow}>BANDEJA DE PREPARACIÓN</span>{selected?<><div className={styles.selectedTitle}><Pill small/><h3>{selected.name}</h3>{!result&&<button onClick={()=>{setSelectedId("");setFormId("");}} aria-label="Quitar medicamento seleccionado">×</button>}</div><label className={styles.field}>Presentación y vía<select ref={formRef} aria-label="Presentación y vía del medicamento" value={formId} onChange={e=>setFormId(e.target.value)} disabled={!!result}><option value="">Elige una presentación</option>{selected.forms.map(f=><option key={f.id} value={f.id}>{f.label} · {f.route}</option>)}</select></label>{form&&<p className={styles.route}>Vía elegida: <strong>{form.route}</strong></p>}<button className={styles.primary} disabled={!form||!!result} onClick={()=>setPending({decision:"administer",drugId:selected.id,formId})}>Preparar administración →</button></>:<div className={styles.emptyTray}><Pill small/><p>Selecciona un medicamento del botiquín para traerlo a tu bandeja.</p></div>}<p className={styles.scope}>Este reto evalúa selección y vía. La dosis, dilución y velocidad requieren la orden individual; puedes practicarlas en «Órdenes y cálculo».</p></section>
        {!result&&<button className={styles.hold} onClick={()=>setPending({decision:"hold"})}>Retener el tratamiento y consultar</button>}
        {result&&<section ref={resultRef} tabIndex={-1} className={`${styles.result} ${result.appropriate?styles.good:styles.review}`} aria-label="Resultado del caso"><span className={styles.eyebrow}>DECISIÓN REGISTRADA</span><div className={styles.resultHeading}><h2>{result.heading}</h2><strong>{result.score}<small>/100</small></strong></div><p className={styles.chosen}>{result.chosen}</p><h3>El razonamiento</h3><p>{result.detail}</p>{!result.appropriate&&<p className={styles.expected}><b>Respuesta compatible:</b> {result.expected}</p>}<h3>Qué sigue en la atención</h3><p>{result.followUp}</p><a href={challenge.source.url} target="_blank" rel="noreferrer">{challenge.source.title} ↗</a><button className={styles.primary} onClick={()=>start()}>Siguiente caso aleatorio →</button></section>}
      </div>
      <section className={styles.cabinet} aria-label="Botiquín de medicamentos"><div className={styles.cardTop}><div><span className={styles.eyebrow}>BUSCA Y SELECCIONA</span><h2>El botiquín</h2></div><span className={styles.cabinetIcon}><Pill small/></span></div><label className={styles.search}><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar medicamento" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre, sinónimo o familia…" autoComplete="off"/>{query&&<button aria-label="Limpiar búsqueda de medicamentos" onClick={()=>setQuery("")}>×</button>}</label><div className={styles.searchCount} role="status">{matches.length} medicamento{matches.length===1?"":"s"}{query?` para «${query}»`:" disponibles"}</div>{!matches.length?<div className={styles.noResults}><h3>No encontramos ese medicamento.</h3><p>Prueba con el nombre genérico, un sinónimo o una familia.</p><button className={styles.legacy} onClick={()=>setQuery("")}>Ver todo el botiquín</button></div>:<div className={styles.drugList}>{matches.map(d=><button key={d.id} disabled={!!result} aria-pressed={selectedId===d.id} onClick={()=>{setSelectedId(d.id);setFormId("");requestAnimationFrame(()=>{formRef.current?.focus({preventScroll:true});trayRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"});});}}><span className={styles.drugMark}>{d.name.slice(0,2).toUpperCase()}</span><span><strong>{d.name}</strong><small>{d.family} · {[...new Set(d.forms.map(f=>f.route))].join(" / ")}</small></span><span aria-hidden="true">{selectedId===d.id?"✓":"+"}</span></button>)}</div>}<p className={styles.cabinetNote}>El botiquín incluye alternativas y opciones no indicadas para este caso. La disponibilidad no equivale a indicación.</p></section>
    </div>}
    <footer className={styles.footer}>Casos ficticios · selección farmacológica educativa · la respuesta se explica después de confirmar.</footer>
    <dialog ref={dialog} className={styles.dialog} onCancel={e=>{e.preventDefault();setPending(null);}} aria-labelledby="medication-confirm-title"><span className={styles.eyebrow}>CONFIRMA TU DECISIÓN</span><h2 id="medication-confirm-title">{pending?.decision==="hold"?"¿Retener y consultar?":"¿Administrar en este caso?"}</h2><p>Paciente: <strong>{challenge?.patient}</strong></p>{pending?.decision==="administer"?<div className={styles.confirmDrug}><Pill small/><div><strong>{selected?.name}</strong><p>{form?.label} · vía {form?.route}</p></div></div>:<p>No se administrará ningún medicamento. Se registrará tu decisión de retener el tratamiento y pedir revisión.</p>}<p className={styles.scope}>Al confirmar se evalúa tu elección y se muestra el razonamiento. Preparar o cancelar no registra una administración.</p><div className={styles.dialogActions}><button className={styles.legacy} onClick={()=>setPending(null)}>Volver a revisar</button><button className={styles.primary} onClick={confirm}>{pending?.decision==="hold"?"Confirmar retención y consulta":"Administrar en la simulación"}</button></div></dialog>
  </main></div></div>;
}
