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
      title="Biblioteca de casos LPP"
      description="Selecciona un caso clínico para practicar valoración, clasificación, curación, prevención y documentación con progresión visible por usuario."
      actions={
        <>
          <Link href="/simulators/wound-care/lpp" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
            Volver al submódulo
          </Link>
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm text-cyan-800">
            Modo actual: {mode === "tutor" ? "Tutor" : "Evaluación"}
          </div>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WOUND_LPP_CASES.map((caseData) => (
          <WoundCaseCard key={caseData.id} caseData={caseData} progress={analytics?.moduleProgress[caseData.id]} mode={mode} />
        ))}
      </div>
    </WoundPageShell>
  );
}
