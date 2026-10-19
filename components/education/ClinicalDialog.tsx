"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

/** A dismissible information dialog; mandatory case questions use their own locked dialog. */
export function ClinicalDialog({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null);const titleId=useId();
 useEffect(()=>{const dialog=ref.current;if(dialog&&!dialog.open)dialog.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} className={`session-results-modal ${wide?"":"clinical-interaction-dialog"}`} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose();}}><header><h2 id={titleId}>{title}</h2><button onClick={onClose} aria-label={`Cerrar ${title}`}>×</button></header>{children}</dialog>;
}
