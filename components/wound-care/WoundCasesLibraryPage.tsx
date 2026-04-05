"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import WoundCaseCard from "@/components/wound-care/WoundCaseCard";
import WoundPageShell from "@/components/wound-care/WoundPageShell";
import { WOUND_LPP_CASES } from "@/src/lib/wound-care/cases";
import { readWoundAnalytics } from "@/src/lib/wound-care/storage";
import type { WoundAnalytics } from "@/src/lib/wound-care/types";

export default function WoundCasesLibraryPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "evaluation" ? "evaluation" : "tutor";
  const [analytics, setAnalytics] = useState<WoundAnalytics | null>(null);

  useEffect(() => {
    setAnalytics(readWoundAnalytics());
  }, []);

  return (
    <WoundPageShell
      title="Casos de LPP"
      description="Biblioteca directa de casos. Elige modo, abre el escenario y empieza la valoración."
      actions={
        <>
          <Link href="/simulators/wound-care" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
            Volver al módulo
          </Link>
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
            <Link
              href="/simulators/wound-care/lpp/cases?mode=tutor"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === "tutor" ? "bg-[#183640] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Tutor
            </Link>
            <Link
              href="/simulators/wound-care/lpp/cases?mode=evaluation"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${mode === "evaluation" ? "bg-[#183640] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Evaluación
            </Link>
          </div>
        </>
      }
    >
      <section className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Cómo iniciar</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Un flujo más simple</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <InfoStep label="1" title="Elige modo" text={mode === "tutor" ? "Tendrás retroalimentación paso a paso." : "Resolverás el caso sin ayudas."} />
              <InfoStep label="2" title="Abre un caso" text="Cada tarjeta ya te lleva al resumen clínico del escenario." />
              <InfoStep label="3" title="Comienza" text="Dentro del caso verás un único botón principal para iniciar." />
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
            <div className="font-semibold">Modo actual: {mode === "tutor" ? "Tutor" : "Evaluación"}</div>
            <div className="mt-2 leading-6">
              {mode === "tutor"
                ? "Ideal para practicar con explicaciones inmediatas y corrección guiada."
                : "Ideal para medir desempeño final y revisar competencias al cierre."}
            </div>
            <div className="mt-3 text-cyan-800">
              Casos completados: <span className="font-semibold">{analytics?.completedCases.length ?? 0}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WOUND_LPP_CASES.map((caseData) => (
          <WoundCaseCard key={caseData.id} caseData={caseData} progress={analytics?.moduleProgress[caseData.id]} mode={mode} />
        ))}
      </div>
    </WoundPageShell>
  );
}

function InfoStep({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Paso {label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}
