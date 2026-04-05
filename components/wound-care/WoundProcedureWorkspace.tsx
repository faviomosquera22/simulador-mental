"use client";

import { WOUND_PROCEDURE_STEPS } from "@/src/lib/wound-care/types";

type WoundProcedureWorkspaceProps = {
  selectedSequence: string[];
  tutorMessage: string;
  mode: "tutor" | "evaluation";
  onSelectStep: (stepId: string) => void;
  onReset: () => void;
};

export default function WoundProcedureWorkspace({
  selectedSequence,
  tutorMessage,
  mode,
  onSelectStep,
  onReset,
}: WoundProcedureWorkspaceProps) {
  const remaining = WOUND_PROCEDURE_STEPS.filter((step) => !selectedSequence.includes(step.id));

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Área de procedimiento</div>
          <div className="mt-2 text-base font-semibold text-slate-900">Secuencia de curación paso a paso</div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50"
        >
          Reiniciar secuencia
        </button>
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f7fbfa,#eef5f2)] p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Secuencia ejecutada</div>
            <div className="mt-3 space-y-2">
              {selectedSequence.length ? (
                selectedSequence.map((stepId, index) => {
                  const step = WOUND_PROCEDURE_STEPS.find((item) => item.id === stepId);
                  return (
                    <div key={`${stepId}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {index + 1}. {step?.label ?? stepId}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-6 text-sm text-slate-500">
                  Selecciona el primer paso desde el panel derecho.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Próximos pasos</div>
            <div className="mt-3 grid gap-2">
              {remaining.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-white"
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border p-4 text-sm ${
        mode === "tutor" ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-slate-50 text-slate-700"
      }`}>
        {mode === "tutor" ? tutorMessage : "Modo evaluación: sin ayudas automáticas durante la ejecución."}
      </div>
    </section>
  );
}
