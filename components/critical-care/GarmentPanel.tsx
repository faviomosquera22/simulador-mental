"use client";

import { garmentSteps, type SimulationEvent, type SimulationState } from "@/src/lib/criticalCareSimulation";

type Props = {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationEvent>;
  onResume: () => void;
};

export function GarmentPanel({ state, dispatch, onResume }: Props) {
  const running = state.status === "running";
  const teamReady = state.actions.includes("help");
  return <section id="care-interventions-tann" tabIndex={-1} className="care-actions" aria-label="Colocación del traje antichoque">
    <h3>Traje antichoque · cierre ascendente</h3>
    <p>Activa al equipo de hemorragia y realiza cada paso en orden. Los segmentos aparecerán sobre la paciente al colocarlos.</p>
    <p role="status">{state.garment === garmentSteps.length ? "Traje completo y reevaluación registrada" : `${Math.min(6, Math.max(0, state.garment - 1))}/6 segmentos colocados · siguiente: ${garmentSteps[state.garment].title}`}</p>
    {!running && state.status !== "finished" && <div className="care-blocker"><p>La simulación está en pausa. Continúa la atención para colocar el traje.</p><button type="button" onClick={onResume}>Continuar atención para colocar el traje</button></div>}
    {!teamReady && <div className="care-blocker"><p>Antes de colocar el traje, activa al equipo de hemorragia. Puedes hacerlo aquí mismo.</p><button type="button" disabled={!running} onClick={() => dispatch({ type: "action", id: "help" })}>Activar equipo de hemorragia</button></div>}
    {garmentSteps.map((step, index) => <article key={step.title}>
      <h4>{step.title}</h4><p>{step.detail}</p>
      <button type="button" className="care-action-button" data-garment-step={index} disabled={!running || index !== state.garment || !teamReady} onClick={() => dispatch({ type: "garment", step: index })}>
        {state.garment > index ? "✓ Completado" : index !== state.garment ? "Completa primero el paso anterior" : !teamReady ? "Activa primero al equipo de hemorragia" : !running ? "Continúa la atención para realizar este paso" : "Realizar este paso"}
      </button>
    </article>)}
  </section>;
}
