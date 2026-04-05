"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import WoundCaseSummary from "@/components/wound-care/WoundCaseSummary";
import WoundPageShell from "@/components/wound-care/WoundPageShell";
import { createWoundSession, woundStepRoute } from "@/src/lib/wound-care/engine";
import { getWoundCaseById } from "@/src/lib/wound-care/cases";
import { saveWoundSession } from "@/src/lib/wound-care/storage";
import type { WoundModuleMode } from "@/src/lib/wound-care/types";

export default function WoundCaseSummaryPage() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "evaluation" ? "evaluation" : "tutor";
  const caseData = getWoundCaseById(params.caseId);

  if (!caseData) {
    return (
      <WoundPageShell title="Caso no encontrado" description="El identificador solicitado no corresponde a un caso disponible.">
        <Link href="/simulators/wound-care/lpp/cases" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
          Volver a biblioteca
        </Link>
      </WoundPageShell>
    );
  }

  const activeCase = caseData;

  function handleStart(nextMode: WoundModuleMode) {
    const session = createWoundSession(activeCase.id, nextMode);
    if (!session) return;
    saveWoundSession(session);
    router.push(`${woundStepRoute(activeCase.id, "assessment")}?mode=${nextMode}`);
  }

  return (
    <WoundPageShell
      title={activeCase.name}
      description="Antes de intervenir, revisa el contexto general, el riesgo basal y el objetivo pedagógico del caso."
      actions={
        <Link href="/simulators/wound-care/lpp/cases" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
          Volver a casos
        </Link>
      }
    >
      <WoundCaseSummary caseData={activeCase} mode={mode} onStart={handleStart} />
    </WoundPageShell>
  );
}
