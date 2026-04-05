"use client";

import { WOUND_PREVENTION_OPTIONS } from "@/src/lib/wound-care/types";

type PreventionMeasuresPanelProps = {
  selectedMeasures: string[];
  followUpPlan: string;
  onToggle: (measureId: string) => void;
  onPlanChange: (value: string) => void;
};

export default function PreventionMeasuresPanel({
  selectedMeasures,
  followUpPlan,
  onToggle,
  onPlanChange,
}: PreventionMeasuresPanelProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Medidas complementarias</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {WOUND_PREVENTION_OPTIONS.map((item) => {
            const selected = selectedMeasures.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selected ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <label className="block text-xs uppercase tracking-[0.16em] text-slate-400">
          Plan de seguimiento
          <textarea
            rows={4}
            value={followUpPlan}
            onChange={(event) => onPlanChange(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm normal-case tracking-normal text-slate-900"
            placeholder="Incluye frecuencia de reevaluación, educación y medidas de alivio de presión."
          />
        </label>
      </div>
    </section>
  );
}
