"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import WoundCareModuleCard from "@/components/wound-care/WoundCareModuleCard";
import WoundPageShell from "@/components/wound-care/WoundPageShell";
import { readWoundAnalytics } from "@/src/lib/wound-care/storage";
import type { WoundAnalytics } from "@/src/lib/wound-care/types";
import { WOUND_QUICK_ACCESS } from "@/src/lib/wound-care/types";

export default function WoundModuleLandingPage() {
  const [analytics, setAnalytics] = useState<WoundAnalytics | null>(null);

  useEffect(() => {
    setAnalytics(readWoundAnalytics());
  }, []);

  return (
    <WoundPageShell
      title="Curación de heridas"
      description="Entrenamiento interactivo en valoración, clasificación y manejo de lesiones por presión dentro del ecosistema clínico actual."
      badge="Nuevo"
      actions={
        <>
          <Link href="/simulators/wound-care/lpp/cases" className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]">
            Iniciar práctica
          </Link>
          <Link href="/simulators/wound-care/lpp" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
            Ver casos
          </Link>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <WoundCareModuleCard
          title="Lesiones por presión (LPP)"
          description="Cinco casos progresivos para valorar riesgo, clasificar estadios, seleccionar materiales, ejecutar curación y documentar la atención."
          badge="Nuevo"
          href="/simulators/wound-care/lpp"
          ctaLabel="Ingresar"
          metrics={[
            "5 casos interactivos",
            "Modo tutor",
            "Modo evaluación",
            `${analytics?.completedCases.length ?? 0} completados`,
          ]}
        />

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Acceso rápido</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {WOUND_QUICK_ACCESS.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WoundPageShell>
  );
}
