"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CLINICAL_SOURCES, type CaseQuestion, type QuestionAnswer, type LearningDecision, type scoreWithQuestions } from "@/src/lib/clinicalEducation";
import "./education.css";
export function QuestionCard({ question, answer, onAnswer, onDismiss, mandatory = false }: { question: CaseQuestion; answer?: QuestionAnswer; onAnswer: (option: string)=>void; onDismiss?:()=>void; mandatory?: boolean }) {
 const [selected,setSelected]=useState("");
 const source=CLINICAL_SOURCES[question.source];
 return <section className="case-question" aria-label={question.stage==="final"?"Pregunta final del caso":"Pregunta de razonamiento clínico"}>
  <div className="question-kicker">{question.stage==="final"?"AL FINALIZAR":"RAZONAMIENTO EN CURSO"}<span>Opción múltiple · una respuesta</span></div>
  <h3>{question.prompt}</h3>{mandatory&&<p className="question-rule">{question.stage==="during"?"El caso está en pausa. Responde para continuar la atención.":"Responde para completar la evaluación del caso."} Cada acierto suma 5 puntos y cada error resta 5.</p>}
  <fieldset disabled={!!answer}><legend className="sr-only">Elige una respuesta</legend>{question.options.map((option,i)=><label key={option.id} className={answer ? option.id===question.correct?"answer-correct":option.id===answer.optionId?"answer-incorrect":"" : selected===option.id?"answer-selected":""}><input type="radio" name={question.id} value={option.id} checked={(answer?.optionId??selected)===option.id} onChange={()=>setSelected(option.id)}/><span>{String.fromCharCode(65+i)}</span>{option.label}</label>)}</fieldset>
  {answer?<div className="question-explanation" role="status"><strong>{answer.correct?"Respuesta correcta":"Revisa tu razonamiento"}</strong><p>{!answer.correct&&`Respuesta esperada: ${question.options.find(o=>o.id===question.correct)?.label}. `}{question.explanation}</p><a href={source.url} target="_blank" rel="noreferrer">{source.title} · {source.year} ↗</a><small>{source.section}</small></div>:<button className="question-confirm" disabled={!selected} onClick={()=>onAnswer(selected)}>Confirmar respuesta</button>}
  {onDismiss&&<button className="question-dismiss" onClick={onDismiss}>{answer?"Volver a la atención":"Responder después"}</button>}
 </section>;
}
export function DecisionReview({ decisions }: { decisions: LearningDecision[] }) {
 const wrong=decisions.filter(d=>d.judgment==="harmful"||d.judgment==="unnecessary");
 return <section className="decision-review"><h3>Decisiones para revisar</h3><p>{decisions.length} decisiones · {decisions.filter(d=>d.judgment==="alternative").length} alternativas · {wrong.length} decisiones que requieren revisión.</p>{wrong.map((d,i)=><article key={`${d.id}:${d.at}:${i}`}><strong>{d.judgment==="harmful"?"Riesgo añadido":"Pertinencia por revisar"} · {d.id.replaceAll("-"," ")}</strong>{d.presentation&&<small>{d.presentation}</small>}<p>{d.rationale}</p><a href={CLINICAL_SOURCES[d.source].url} target="_blank" rel="noreferrer">Referencia: MSP · {CLINICAL_SOURCES[d.source].year} ↗</a></article>)}</section>;
}

export function QuestionHistory({questions,answers,onAnswer}:{questions:CaseQuestion[];answers:QuestionAnswer[];onAnswer:(questionId:string,option:string)=>void}) {
 if(!questions.length)return null;
 return <details className="question-history"><summary>{questions.some(q=>q.stage==="final")?"Preguntas y respuestas del caso":"Preguntas durante la atención"} · {answers.filter(a=>questions.some(q=>q.id===a.questionId)).length}/{questions.length} respondidas</summary>{questions.map(q=><QuestionCard key={q.id} question={q} answer={answers.find(a=>a.questionId===q.id)} onAnswer={option=>onAnswer(q.id,option)}/>)}</details>;
}

export function MandatoryQuestion({question,answer,onAnswer,onContinue,progress}:{question:CaseQuestion;answer?:QuestionAnswer;onAnswer:(option:string)=>void;onContinue:()=>void;progress?:string}) {
 const dialogRef=useRef<HTMLDialogElement>(null);
 const titleId=useId();
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(dialog&&!dialog.open)dialog.showModal();
  return ()=>dialog?.close();
 },[]);
 return <dialog ref={dialogRef} className="mandatory-question-modal" aria-labelledby={titleId} onCancel={event=>event.preventDefault()}>
  <header><span>{question.stage==="final"?"CIERRE DE LA SIMULACIÓN":"SIMULACIÓN EN PAUSA"}</span><h2 id={titleId}>{question.stage==="final"?"Pregunta de cierre":"Decisión clínica obligatoria"}</h2>{progress&&<p>{progress}</p>}</header>
  <QuestionCard key={question.id} question={question} answer={answer} onAnswer={onAnswer} mandatory/>
  {answer&&<><p className="question-points" role="status">{answer.correct?"+5 puntos por esta respuesta":"−5 puntos por esta respuesta"} · Se aplican los límites de la nota final.</p><button type="button" className="question-confirm" onClick={onContinue}>{question.stage==="during"?"Continuar el caso":"Continuar evaluación"}</button></>}
 </dialog>;
}
export function QuestionScore({score,complete}:{score:ReturnType<typeof scoreWithQuestions>;complete:boolean}) {
 return <section className="question-score" aria-label="Desglose de puntuación"><h3>{complete?"Resultado final":"Puntuación provisional"}</h3><strong data-final-score={score.total}>{score.total}<small>/100</small></strong><p>Decisiones clínicas: {score.clinical}/100 · Preguntas: {score.correct} aciertos, {score.incorrect} errores · Ajuste: {score.adjustment>=0?"+":""}{score.adjustment} puntos.</p><p>Cada acierto suma 5 y cada error resta 5. La nota se limita entre 0 y {score.ceiling}.{score.ceiling<100&&" Las preguntas no compensan una omisión clínica crítica."}</p>{!complete&&<p>Completa las preguntas obligatorias de cierre para obtener tu resultado final.</p>}</section>;
}
