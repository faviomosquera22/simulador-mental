"use client";

import { useEffect, useRef, useState } from "react";
import { papReplyParts } from "@/src/lib/papPresentation";
import type { PapEntry } from "@/src/lib/psychologicalFirstAid";
import styles from "./conversation.module.css";

const clock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
export default function ConversationThread({ entries, pending = false, pendingText = "", pendingAction = false, review = false, onSpeak }: { entries: PapEntry[]; pending?: boolean; pendingText?: string; pendingAction?: boolean; review?: boolean; onSpeak?: (text: string) => void }) {
  const scroll = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);
  useEffect(() => { if (follow && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [entries.length, pending, follow]);
  return <section id="pap-conversation" className={styles.thread} aria-label="Conversación con Valeria">
    <div className={styles.threadHeader}><div className={styles.portrait}>V</div><div><strong>Valeria</strong><span>Espacio de conversación</span></div><span className={styles.channel}>Paciente virtual</span></div>
    <div className={`${styles.messages} ${review ? styles.review : ""}`} ref={scroll} role="log" aria-label="Mensajes de la conversación" aria-live="polite" aria-relevant="additions" onScroll={() => { const node = scroll.current; if (node) setFollow(node.scrollHeight - node.scrollTop - node.clientHeight < 65); }}>
      <div className={styles.day}>Inicio del encuentro</div>
      <div className={styles.patient}><div className={styles.messageMeta}>Valeria <time>00:00</time></div><p>No sé dónde está mi hermana… necesito saber de ella.</p></div>
      {entries.map((entry, index) => <div className={styles.turn} key={index}>
        {entry.words && <div className={entry.kind === "action" ? styles.studentAction : styles.student}><div className={styles.messageMeta}>{entry.kind === "action" ? "Tu acción" : "Tú"}<time>{clock(entry.at)}</time></div><p>{entry.words}</p></div>}
        {!entry.words && entry.id !== "event" && <div className={styles.studentAction}><div className={styles.messageMeta}>Tu acción <time>{clock(entry.at)}</time></div><p>{entry.label}</p></div>}
        {papReplyParts(entry).map((part, i) => part.kind === "scene" ? <div className={styles.sceneEvent} key={i} data-testid="scene-event"><span>EN LA SALA</span><p>{part.text}</p></div> : <div className={styles.patient} key={i} data-testid="patient-message"><div className={styles.messageMeta}>Valeria<small className={styles.source}>{entry.provider === "gemini" ? "Gemini" : "Guion del caso"}</small>{onSpeak && <button aria-label="Escuchar este mensaje de Valeria" onClick={() => onSpeak(part.text)}>Escuchar <span aria-hidden="true">♪</span></button>}</div><p>{part.text}</p></div>)}
        {review && <div className={styles.reviewNote}><strong>Devolución</strong><p>{entry.feedback}</p></div>}
      </div>)}
      {pending && <><div className={pendingAction ? styles.studentAction : styles.student}><div className={styles.messageMeta}>{pendingAction ? "Acción propuesta" : "Tú"}</div><p>{pendingText}</p></div><div className={styles.typing} role="status"><span/><span/><span/><small>Valeria está respondiendo</small></div></>}
    </div>
    {!follow && <button className={styles.latest} onClick={() => setFollow(true)}>Ver mensajes recientes ↓</button>}
  </section>;
}
