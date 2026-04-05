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

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span>Contexto</span>
          <span className="max-w-[220px] text-right text-slate-900">{caseData.patient.context}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Progreso</span>
          <span className="text-slate-900">
            {progress?.completed ? `${progress.bestScore}/100` : progress?.attempts ? "En progreso" : "Sin iniciar"}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#7baaa1,#3e6771)]" style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <div className="mt-auto pt-5">
        <Link
          href={`/simulators/wound-care/lpp/cases/${caseData.id}?mode=${mode}`}
          className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Ver caso
        </Link>
      </div>
    </article>
  );
}
