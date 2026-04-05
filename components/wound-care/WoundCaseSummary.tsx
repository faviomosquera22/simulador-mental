"use client";

import type { WoundCaseData, WoundModuleMode } from "@/src/lib/wound-care/types";

type WoundCaseSummaryProps = {
  caseData: WoundCaseData;
  mode: WoundModuleMode;
  onStart: (mode: WoundModuleMode) => void;
};

export default function WoundCaseSummary({ caseData, mode, onStart }: WoundCaseSummaryProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resumen clínico</div>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{caseData.name}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{caseData.patient.context}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <InfoCard label="Edad" value={`${caseData.patient.age} años`} />
          <InfoCard label="Sexo" value={caseData.patient.sex} />
          <InfoCard label="Movilidad" value={caseData.patient.mobility} />
          <InfoCard label="Nutrición" value={caseData.patient.nutrition} />
          <InfoCard label="Continencia" value={caseData.patient.continence} />
          <InfoCard label="Dolor" value={caseData.patient.pain} />
          <InfoCard label="Signos vitales" value={`${caseData.patient.vitals.bloodPressure} · ${caseData.patient.vitals.heartRate} · ${caseData.patient.vitals.temperature}`} />
          <InfoCard
            label="Braden"
            value={caseData.patient.braden ? `${caseData.patient.braden.score} · ${caseData.patient.braden.interpretation}` : "No aplica"}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Objetivo del caso</div>
          <div className="mt-2 text-sm text-slate-700">{caseData.patient.caseGoal}</div>
        </div>
      </div>

      <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Antecedentes relevantes</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {caseData.patient.relevantHistory.map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {item}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <InfoLine label="Perfusión" value={caseData.patient.perfusion} />
          <InfoLine label="Hidratación" value={caseData.patient.hydration} />
          <InfoLine label="Dispositivos" value={caseData.patient.devices.join(" · ")} />
          <InfoLine label="Tiempo en cama" value={caseData.patient.timeInBed} />
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          Modo actual: <span className="font-semibold">{mode === "tutor" ? "Tutor" : "Evaluación"}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onStart("tutor")}
            className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]"
          >
            Iniciar valoración
          </button>
          <button
            type="button"
            onClick={() => onStart("evaluation")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Modo evaluación
          </button>
        </div>
      </aside>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[220px] text-right text-slate-800">{value}</span>
    </div>
  );
}
