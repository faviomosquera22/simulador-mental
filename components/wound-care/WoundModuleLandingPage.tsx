"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import WoundCaseCard from "@/components/wound-care/WoundCaseCard";
import WoundPageShell from "@/components/wound-care/WoundPageShell";
import { WOUND_LPP_CASES } from "@/src/lib/wound-care/cases";
import { readWoundAnalytics } from "@/src/lib/wound-care/storage";
import type { WoundAnalytics } from "@/src/lib/wound-care/types";
import { WOUND_QUICK_ACCESS } from "@/src/lib/wound-care/types";

export default function WoundModuleLandingPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "evaluation" ? "evaluation" : "tutor";
  const [analytics, setAnalytics] = useState<WoundAnalytics | null>(null);

  useEffect(() => {
    setAnalytics(readWoundAnalytics());
  }, []);

  const completedCases = analytics?.completedCases.length ?? 0;
  const averageScore = analytics?.totalAttempts ? `${analytics.averageScore}/100` : "Sin intentos";
  const recommendedCase = WOUND_LPP_CASES.find((caseData) => !analytics?.moduleProgress[caseData.id]?.completed) ?? WOUND_LPP_CASES[0];

  return (
    <WoundPageShell
      title="Curación de heridas"
      description="Entrenamiento clínico en LPP con un inicio más directo: elige modo, abre un caso y empieza la valoración sin pantallas intermedias innecesarias."
      badge="Nuevo"
      actions={
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
          <Link
            href="/simulators/wound-care?mode=tutor"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === "tutor" ? "bg-[#183640] text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Modo tutor
          </Link>
          <Link
            href="/simulators/wound-care?mode=evaluation"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === "evaluation" ? "bg-[#183640] text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Modo evaluación
          </Link>
        </div>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
          <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Lesiones por presión
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Empieza desde aquí</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            El módulo inicial de LPP quedó concentrado en un solo punto de entrada. Primero eliges el modo y luego pasas directo al caso que quieres resolver.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StepCard number="1" title="Elige modo" text={mode === "tutor" ? "Con feedback inmediato y pistas." : "Sin ayudas, con puntaje final."} />
            <StepCard number="2" title="Abre un caso" text="Cinco escenarios progresivos, desde riesgo alto hasta lesión no clasificable." />
            <StepCard number="3" title="Inicia valoración" text="El resumen clínico se mantiene, pero con un arranque más claro y directo." />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/simulators/wound-care/lpp/cases?mode=${mode}`}
              className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]"
            >
              Ver casos LPP
            </Link>
            <Link
              href={`/simulators/wound-care/lpp/cases/${recommendedCase.id}?mode=${mode}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              {completedCases ? "Continuar caso recomendado" : "Empezar primer caso"}
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <StatCard label="Casos activos" value={String(WOUND_LPP_CASES.length)} helper="Secuencia LPP inicial" />
          <StatCard label="Completados" value={String(completedCases)} helper="Casos cerrados por usuario" />
          <StatCard label="Promedio" value={averageScore} helper="Resultado consolidado del módulo" />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Casos disponibles</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Selecciona y entra directo al caso</h2>
          </div>
          <Link href={`/simulators/wound-care/lpp/cases?mode=${mode}`} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Ver biblioteca completa
          </Link>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WOUND_LPP_CASES.map((caseData) => (
            <WoundCaseCard key={caseData.id} caseData={caseData} progress={analytics?.moduleProgress[caseData.id]} mode={mode} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Acceso rápido</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Apoyos breves antes de entrar</h2>
          </div>
          <p className="max-w-2xl text-sm text-slate-500">Se mantuvieron, pero con menos protagonismo que los casos para no distraer el inicio.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WOUND_QUICK_ACCESS.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</div>
            </div>
          ))}
        </div>
      </section>
    </WoundPageShell>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Paso {number}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{helper}</div>
    </div>
  );
}
