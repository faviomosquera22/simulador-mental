import { actionAvailable, hasDecision, OBSTETRIC_SOURCE, type GynecologyCase, type SimulationRun } from "@/src/lib/gynecologySimulation";
import { tannPlacement, TANN_SEGMENTS } from "@/src/lib/tannPlacement";
import styles from "./room.module.css";
export function TannPlacementPanel({scenario,run,onAction}:{scenario:GynecologyCase;run:SimulationRun;onAction:(id:string)=>void}){
 const placement=tannPlacement(run.decisions);
 const renderAction=(id:string)=>{
  const action=scenario.actions.find(a=>a.id===id);if(!action)return null;
  const done=hasDecision(scenario,run,id),available=actionAvailable(action,run,scenario);
  return <button key={id} type="button" disabled={run.status!=="running"||done||!available} onClick={()=>onAction(id)} data-tann-action={id} aria-pressed={done}><strong>{done?"✓ ":""}{action.label}</strong>{!available&&<small>Antes: {action.requires?.filter(required=>!hasDecision(scenario,run,required)).map(required=>scenario.actions.find(a=>a.id===required)?.label).join(" · ")}</small>}</button>;
 };
 return <section className={styles.tannProcedure} aria-label="Colocación del traje antichoque por segmentos">
 <h2>TANN · colocación por partes</h2><p>Desde abajo hacia arriba. Cada componente cerrado aparece sobre la paciente. Se representan los componentes de ambas piernas en el mismo paso.</p>
 <div className={styles.tannProgress} role="status">{placement.removed?"Traje retirado durante el choque: revisar la decisión":placement.verified?"6/6 · colocación verificada":`${placement.count}/6 componentes cerrados${placement.count===6?" · falta verificación final":""}`}</div>
 <progress value={placement.count} max={6} aria-label="Avance de colocación del TANN"/>
 {renderAction("tann-assess")}{renderAction("tann-prepare")}
 <ol>{TANN_SEGMENTS.map(segment=><li key={segment.id} data-complete={hasDecision(scenario,run,segment.id)}><span>{segment.number}</span><div>{renderAction(segment.id)}<p>{segment.instruction}</p></div></li>)}</ol>
 {renderAction("tann")}
 <p>Después de verificar: reevaluar perfusión, respiración y sangrado. Mantener la reanimación y el control de la causa.</p>
 <details><summary>Decisión de retiro</summary>{renderAction("tann-remove")}<p>El retiro requiere estabilidad sostenida y supervisión según protocolo. No se practica un retiro seguro con esta paciente aún en choque.</p></details>
 <a href={OBSTETRIC_SOURCE.url} target="_blank" rel="noreferrer">MSP 2025 · anexo 8: TANN ↗</a>
 </section>;
}
