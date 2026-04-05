"use client";

import { WOUND_RISK_FACTOR_OPTIONS, type WoundCaseData } from "@/src/lib/wound-care/types";

type PatientRiskPanelProps = {
  caseData: WoundCaseData;
};

export default function PatientRiskPanel({ caseData }: PatientRiskPanelProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Paciente</div>
        <div className="mt-3 space-y-3 text-sm">
          <RiskLine label="Contexto" value={caseData.patient.context} />
          <RiskLine label="Movilidad" value={caseData.patient.mobility} />
          <RiskLine label="Nutrición" value={caseData.patient.nutrition} />
          <RiskLine label="Continencia" value={caseData.patient.continence} />
          <RiskLine label="Perfusión" value={caseData.patient.perfusion} />
          <RiskLine label="Dispositivos" value={caseData.patient.devices.join(" · ")} />
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Riesgo esperado</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {caseData.expected.riskFactors.map((factor) => (
            <span key={factor} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
              {WOUND_RISK_FACTOR_OPTIONS.find((item) => item.id === factor)?.label ?? factor.replaceAll("-", " ")}
            </span>
          ))}
        </div>
        {caseData.patient.braden ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Braden: <span className="font-semibold">{caseData.patient.braden.score}</span> · {caseData.patient.braden.interpretation}
          </div>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Objetivo docente</div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{caseData.learningObjective}</p>
      </div>
    </section>
  );
}

function RiskLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[220px] text-right text-slate-800">{value}</span>
    </div>
  );
}
