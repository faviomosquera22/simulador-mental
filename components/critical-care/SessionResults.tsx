"use client";
import { useEffect, useId, useRef } from "react";
import { DecisionReview, QuestionHistory, QuestionScore } from "@/components/education/CaseQuestions";
import { formatClinicalTime, type SimulationState } from "@/src/lib/criticalCareSimulation";
import type { CaseQuestion, QuestionAnswer, scoreWithQuestions } from "@/src/lib/clinicalEducation";

type Props={state:SimulationState;title:string;score:ReturnType<typeof scoreWithQuestions>;pending:string[];questions:CaseQuestion[];answers:QuestionAnswer[];onClose:()=>void;onRepeat:()=>void;onChoose:()=>void;onExport:()=>void};
export function SessionResults({state,title,score,pending,questions,answers,onClose,onRepeat,onChoose,onExport}:Props){
 const ref=useRef<HTMLDialogElement>(null);const titleId=useId();
 useEffect(()=>{const dialog=ref.current;if(dialog&&!dialog.open)dialog.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} className="session-results-modal" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose();}}>
  <header><div><span>PRÁCTICA FINALIZADA · {formatClinicalTime(state.elapsed)}</span><h2 id={titleId}>Resultado y registro del caso</h2><p>{title}</p></div><button onClick={onClose} aria-label="Cerrar resultado y volver a la sala">×</button></header>
  <nav className="session-result-actions" aria-label="Continuar después del caso"><button onClick={onRepeat}>Repetir este caso</button><button onClick={onChoose}>Elegir otro caso</button><button onClick={onClose}>Volver a la sala</button><button onClick={onExport}>Descargar resultado y registro</button></nav>
  <QuestionScore score={score} complete/>
  <section><h3>Prioridades y reevaluación</h3><p>{state.reassessments.length} reevaluaciones registradas. Base clínica: proporción de prioridades completadas, menos 5 puntos por decisión perjudicial; las prioridades pendientes limitan la nota a 69.</p>{pending.length?<><h4>Prioridades pendientes</h4><ul>{pending.map(item=><li key={item}>{item}</li>)}</ul></>:<p>Completaste las prioridades del ejercicio.</p>}</section>
  <DecisionReview decisions={state.decisions}/>
  <QuestionHistory questions={questions} answers={answers} onAnswer={()=>{}}/>
  <section><h3>Registro de la atención</h3><ol className="session-result-log">{state.log.map((entry,index)=><li key={index}><time>{formatClinicalTime(entry.at)}</time><p>{entry.text}</p></li>)}</ol></section>
  <p className="session-result-note">La sesión permanece finalizada al volver a la sala. Puedes revisar el registro, repetir la práctica o escoger otro caso.</p>
 </dialog>;
}
