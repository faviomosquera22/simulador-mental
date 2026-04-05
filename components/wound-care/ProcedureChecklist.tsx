"use client";

import { WOUND_PROCEDURE_STEPS } from "@/src/lib/wound-care/types";

type ProcedureChecklistProps = {
  selectedSequence: string[];
};

export default function ProcedureChecklist({ selectedSequence }: ProcedureChecklistProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Checklist</div>
        <div className="text-xs text-slate-500">
          {selectedSequence.length}/{WOUND_PROCEDURE_STEPS.length}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {WOUND_PROCEDURE_STEPS.map((step, index) => {
          const currentIndex = selectedSequence.indexOf(step.id);
          const done = currentIndex !== -1;
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm ${
                done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <span>{step.label}</span>
              <span className="text-xs">{done ? `#${currentIndex + 1}` : `Paso ${index + 1}`}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
