"use client";

import Link from "next/link";

import { woundDifficultyLabel } from "@/src/lib/wound-care/cases";
import type { WoundCaseAnalytics, WoundCaseData, WoundModuleMode } from "@/src/lib/wound-care/types";

type WoundCaseCardProps = {
  caseData: WoundCaseData;
  progress?: WoundCaseAnalytics;
  mode?: WoundModuleMode;
};

export default function WoundCaseCard({ caseData, progress, mode = "tutor" }: WoundCaseCardProps) {
  const progressValue = progress?.completed ? progress.bestScore : 0;
  const progressLabel = progress?.completed ? `${progress.bestScore}/100` : progress?.attempts ? "En progreso" : "Sin iniciar";

  return (
    <article className="flex h-full flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_42px_rgba(148,163,184,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {woundDifficultyLabel(caseData.difficulty)}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{caseData.name}</h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          {caseData.estimatedMinutes} min
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{caseData.summary}</p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Objetivo</div>
        <div className="mt-2 text-sm text-slate-700">{caseData.learningObjective}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          {mode === "tutor" ? "Tutor" : "Evaluación"}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{progressLabel}</span>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <div className="font-medium text-slate-900">Resumen rápido</div>
        <div className="mt-2 leading-6">{caseData.patient.context}</div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#7baaa1,#3e6771)]" style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <div className="mt-auto pt-5">
        <Link
          href={`/simulators/wound-care/lpp/cases/${caseData.id}?mode=${mode}`}
          className="inline-flex rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]"
        >
          Iniciar caso
        </Link>
      </div>
    </article>
  );
}
