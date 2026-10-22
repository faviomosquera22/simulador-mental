"use client";

import { useEffect, useRef } from "react";
import { PAP_FREE_LIMIT, type PapInputKind } from "@/src/lib/papConversation";
import styles from "./pap.module.css";

const examples = [
  { label: "Presentarme", text: "Hola, soy estudiante de psicología. ¿Puedo acompañarte a esta distancia?" },
  { label: "Explorar necesidades", text: "¿Qué es lo que más te preocupa en este momento?" },
  { label: "Ofrecer un asiento", text: "¿Te gustaría sentarte un momento?" },
  { label: "Respetar su espacio", text: "No te voy a presionar. Respeto tu espacio y me aparto." },
];
type Props = { text: string; kind: PapInputKind; active: boolean; uncertain: boolean; pending?: boolean; ai?: boolean; suggestions?: boolean; onText: (value: string) => void; onKind: (value: PapInputKind) => void; onSend: () => void };

export default function FreeConversation({ text, kind, active, uncertain, pending = false, ai = false, suggestions = true, onText, onKind, onSend }: Props) {
  const input = useRef<HTMLTextAreaElement>(null);
  const wasPending = useRef(false);
  useEffect(() => { if (wasPending.current && !pending && active) input.current?.focus({ preventScroll: true }); wasPending.current = pending; }, [pending, active]);
  return <section className={styles.composer} aria-label="Intervención libre">
    <div className={styles.inputKinds} role="group" aria-label="Tipo de intervención"><button aria-pressed={kind === "speech"} disabled={pending} onClick={() => onKind("speech")}>Mensaje a Valeria</button><button aria-pressed={kind === "action"} disabled={pending} onClick={() => onKind("action")}>Acción en la sala</button></div>
    <label htmlFor="pap-free-input">{kind === "speech" ? "Tu pregunta o respuesta a Valeria" : "Describe la acción que decides realizar"}</label>
    <textarea ref={input} id="pap-free-input" value={text} onChange={e => onText(e.target.value)} maxLength={PAP_FREE_LIMIT} rows={2} disabled={!active || pending} placeholder={kind === "speech" ? "Escribe tu pregunta o respuesta…" : "Describe lo que decides hacer…"} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && text.trim() && active && !pending) { event.preventDefault(); onSend(); } }}/>
    {suggestions && <div className={styles.suggestions} aria-label="Sugerencias editables">{examples.map(example => <button key={example.label} disabled={!active || pending} onClick={() => { onKind("speech"); onText(example.text); document.getElementById("pap-free-input")?.focus(); }}>{example.label} <span>+</span></button>)}</div>}
    <div className={styles.composerActions}><span className={styles.keyboardHint}>Enter para enviar · Mayús + Enter para salto</span><small>{text.length}/{PAP_FREE_LIMIT}</small><button className={styles.primary} aria-label={kind === "speech" ? "Decir a Valeria" : "Realizar acción"} disabled={!active || pending || !text.trim()} onClick={onSend}>{pending ? "Respondiendo…" : kind === "speech" ? "Enviar mensaje" : "Realizar acción"} <span>↑</span></button></div>
    {uncertain && <p className={styles.uncertain} role="status">Esta frase no se interpretó con suficiente certeza. Puedes reformularla; no se ha calificado como un error.</p>}
    <details className={styles.conversationScope}><summary>Acerca de esta conversación</summary><p>{ai ? "Gemini recibe tu intervención y un resumen de la conversación ficticia para generar respuestas. Usa únicamente datos del ejercicio. Las acciones y su valoración siguen reglas del caso; si el servicio falla se identifica una respuesta del guion local." : "Este modo interpreta frases mediante reglas locales del caso, sin conexión a IA generativa."} Si no comprende una pregunta, pide aclaración. Las sugerencias se cargan para que puedas editarlas; no se envían automáticamente.</p></details>
  </section>;
}
