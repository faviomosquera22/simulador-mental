"use client";

import CompetencyScoreCard from "@/components/wound-care/CompetencyScoreCard";
import type { WoundEvaluationResult } from "@/src/lib/wound-care/types";

type WoundResultsDashboardProps = {
  result: WoundEvaluationResult;
};

export default function WoundResultsDashboard({ result }: WoundResultsDashboardProps) {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Puntaje global</div>
          <div className="mt-3 text-5xl font-semibold text-slate-900">{result.overallScore}</div>
          <div className="mt-3 text-sm text-slate-600">{result.evolutionSummary}</div>
          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            Evolución simulada: <span className="ml-2 font-semibold capitalize">{result.evolution}</span>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hallazgos clave</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ListCard title="Fortalezas" items={result.strengths} tone="emerald" />
            <ListCard title="Áreas de mejora" items={result.improvements} tone="amber" />
            <ListCard title="Errores críticos" items={result.criticalErrors.length ? result.criticalErrors : ["Ninguno"]} tone="rose" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.competencies.map((competency) => (
          <CompetencyScoreCard
            key={competency.key}
            title={competency.label}
            score={competency.score}
            feedback={competency.feedback}
          />
        ))}
      </div>
    </section>
  );
}

function ListCard({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "amber" | "rose" }) {
  const className =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </div>
  );
}
