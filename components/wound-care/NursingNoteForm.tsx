"use client";

import type { WoundDocumentationState } from "@/src/lib/wound-care/types";

type NursingNoteFormProps = {
  value: WoundDocumentationState;
  onChange: (patch: Partial<WoundDocumentationState>) => void;
};

export default function NursingNoteForm({ value, onChange }: NursingNoteFormProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Registro clínico</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextField label="Localización" value={value.location} onChange={(next) => onChange({ location: next })} />
        <TextField label="Clasificación" value={value.classification} onChange={(next) => onChange({ classification: next })} />
        <TextField label="Lecho" value={value.woundBed} onChange={(next) => onChange({ woundBed: next })} />
        <TextField label="Exudado" value={value.exudate} onChange={(next) => onChange({ exudate: next })} />
        <TextField label="Olor" value={value.odor} onChange={(next) => onChange({ odor: next })} />
        <TextField label="Dolor" value={value.pain} onChange={(next) => onChange({ pain: next })} />
        <TextField label="Intervención" value={value.intervention} onChange={(next) => onChange({ intervention: next })} />
        <TextField label="Tipo de apósito" value={value.dressing} onChange={(next) => onChange({ dressing: next })} />
        <TextAreaField
          label="Respuesta del paciente"
          value={value.patientResponse}
          onChange={(next) => onChange({ patientResponse: next })}
        />
        <TextAreaField
          label="Plan de seguimiento"
          value={value.followUpPlan}
          onChange={(next) => onChange({ followUpPlan: next })}
        />
      </div>
    </section>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-slate-500">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-slate-500 md:col-span-2">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900"
      />
    </label>
  );
}
