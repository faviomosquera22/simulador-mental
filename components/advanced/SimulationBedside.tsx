"use client";

import MultiparameterMonitor, { type MonitorVitals } from "./MultiparameterMonitor";

type Props = {
  patient: string;
  complaint: string;
  vitals: MonitorVitals;
  rhythm?: string;
  finished: boolean;
  prompt?: string;
  actions: { id: string; label: string }[];
  onAction: (id: string) => void;
};

export default function SimulationBedside({ patient, complaint, vitals, rhythm, finished, prompt, actions, onAction }: Props) {
  return <section aria-label="Paciente, monitor y acciones permanentes" className="sticky top-14 z-20 my-4 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-lg md:top-2">
    <div className="grid grid-cols-1 gap-2 p-2 lg:grid-cols-[.75fr_1fr_1.25fr]">
      <div className="min-w-0 rounded-xl bg-slate-100 p-2">
        <strong className="block text-xs text-slate-900">{patient}</strong>
        <p className="mt-1 line-clamp-1 text-xs text-slate-600">{complaint}</p>
      </div>
      <MultiparameterMonitor layout="ribbon" vitals={vitals} rhythmLabel={rhythm} paused={finished} statusLabel={finished ? "Caso finalizado" : "Evolución por decisiones"}/>
      <div className="min-w-0 p-1">
        <p className="mb-1 line-clamp-2 text-xs font-semibold text-slate-800">{finished ? "Atención finalizada" : prompt ?? "Acciones disponibles"}</p>
        <div className="grid max-h-[14dvh] gap-1 overflow-y-auto overscroll-contain sm:grid-cols-2 lg:grid-cols-1">
          {!finished && actions.map(action => <button key={action.id} onClick={() => onAction(action.id)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-left text-xs text-slate-800 hover:border-cyan-500 hover:bg-cyan-50">{action.label}</button>)}
        </div>
      </div>
    </div>
  </section>;
}
