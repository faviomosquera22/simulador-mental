"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import WoundPageShell from "@/components/wound-care/WoundPageShell";
import { WOUND_LPP_CASES } from "@/src/lib/wound-care/cases";
import { readWoundAnalytics } from "@/src/lib/wound-care/storage";
import { type WoundAnalytics, WOUND_QUICK_ACCESS } from "@/src/lib/wound-care/types";

export default function WoundLppLandingPage() {
  const [analytics, setAnalytics] = useState<WoundAnalytics | null>(null);

  useEffect(() => {
    setAnalytics(readWoundAnalytics());
  }, []);

  const totalAttempts = analytics?.totalAttempts ?? 0;
  const averageScore = analytics?.averageScore ?? 0;

  return (
    <WoundPageShell
      title="Lesiones por presión (LPP)"
      description="Línea inicial del módulo de curación de heridas orientada a valoración, clasificación, intervención, prevención, documentación y evolución básica."
      actions={
        <>
          <Link href="/simulators/wound-care/lpp/cases?mode=tutor" className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]">
            Modo tutor
          </Link>
          <Link href="/simulators/wound-care/lpp/cases?mode=evaluation" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
            Modo evaluación
          </Link>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ruta pedagógica</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {["Valorar", "Clasificar", "Intervenir", "Prevenir", "Documentar", "Evaluar evolución"].map((step) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                {step}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatCard label="Casos" value={String(WOUND_LPP_CASES.length)} helper="MVP funcional" />
            <StatCard label="Intentos" value={String(totalAttempts)} helper="Acumulados en el módulo" />
            <StatCard label="Promedio" value={totalAttempts ? `${averageScore}/100` : "—"} helper="Último rendimiento consolidado" />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Acceso rápido</div>
          <div className="mt-4 space-y-3">
            {WOUND_QUICK_ACCESS.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WoundPageShell>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{helper}</div>
    </div>
  );
}
