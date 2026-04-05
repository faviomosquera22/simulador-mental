"use client";

import type { ReactNode } from "react";

import {
  type WoundAssessmentState,
  WOUND_ALERT_OPTIONS,
  WOUND_ASSESSMENT_DOMAIN_OPTIONS,
  WOUND_INFECTION_SIGN_OPTIONS,
  WOUND_MEASUREMENT_FIELD_OPTIONS,
  WOUND_RISK_FACTOR_OPTIONS,
} from "@/src/lib/wound-care/types";

type WoundAssessmentFormProps = {
  state: WoundAssessmentState;
  onChange: (patch: Partial<WoundAssessmentState>) => void;
};

export default function WoundAssessmentForm({ state, onChange }: WoundAssessmentFormProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ficha de valoración</div>

      <div className="mt-4 space-y-4">
        <CheckboxGroup
          title="Dominios revisados"
          options={WOUND_ASSESSMENT_DOMAIN_OPTIONS}
          values={state.reviewedDomains}
          onToggle={(id) =>
            onChange({
              reviewedDomains: state.reviewedDomains.includes(id)
                ? state.reviewedDomains.filter((item) => item !== id)
                : [...state.reviewedDomains, id],
            })
          }
        />

        <CheckboxGroup
          title="Factores de riesgo"
          options={WOUND_RISK_FACTOR_OPTIONS}
          values={state.selectedRiskFactors}
          onToggle={(id) =>
            onChange({
              selectedRiskFactors: state.selectedRiskFactors.includes(id)
                ? state.selectedRiskFactors.filter((item) => item !== id)
                : [...state.selectedRiskFactors, id],
            })
          }
        />

        <CheckboxGroup
          title="Signos de alarma"
          options={WOUND_ALERT_OPTIONS}
          values={state.selectedAlerts}
          onToggle={(id) =>
            onChange({
              selectedAlerts: state.selectedAlerts.includes(id)
                ? state.selectedAlerts.filter((item) => item !== id)
                : [...state.selectedAlerts, id],
            })
          }
        />

        <label className="block text-xs text-slate-500">
          Interpretación del riesgo
          <textarea
            value={state.riskSummary}
            onChange={(event) => onChange({ riskSummary: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            placeholder="Resume por qué este paciente tiene riesgo de LPP y qué priorizas."
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Localización">
            <input
              value={state.location}
              onChange={(event) => onChange({ location: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </Field>
          <Field label="Largo (cm)">
            <input
              value={state.lengthCm}
              onChange={(event) => onChange({ lengthCm: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </Field>
          <Field label="Ancho (cm)">
            <input
              value={state.widthCm}
              onChange={(event) => onChange({ widthCm: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </Field>
          <Field label="Profundidad (cm)">
            <input
              value={state.depthCm}
              onChange={(event) => onChange({ depthCm: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SelectField label="Bordes" value={state.edges} options={WOUND_MEASUREMENT_FIELD_OPTIONS.edges} onChange={(value) => onChange({ edges: value })} />
          <SelectField label="Tejido del lecho" value={state.tissue} options={WOUND_MEASUREMENT_FIELD_OPTIONS.tissue} onChange={(value) => onChange({ tissue: value })} />
          <SelectField label="Exudado" value={state.exudate} options={WOUND_MEASUREMENT_FIELD_OPTIONS.exudate} onChange={(value) => onChange({ exudate: value })} />
          <SelectField label="Olor" value={state.odor} options={WOUND_MEASUREMENT_FIELD_OPTIONS.odor} onChange={(value) => onChange({ odor: value })} />
          <SelectField
            label="Piel perilesional"
            value={state.periwoundSkin}
            options={WOUND_MEASUREMENT_FIELD_OPTIONS.periwoundSkin}
            onChange={(value) => onChange({ periwoundSkin: value })}
          />
          <SelectField label="Dolor" value={state.pain} options={WOUND_MEASUREMENT_FIELD_OPTIONS.pain} onChange={(value) => onChange({ pain: value })} />
        </div>

        <CheckboxGroup
          title="Signos de infección"
          options={WOUND_INFECTION_SIGN_OPTIONS}
          values={state.infectionSigns}
          onToggle={(id) =>
            onChange({
              infectionSigns: state.infectionSigns.includes(id)
                ? state.infectionSigns.filter((item) => item !== id)
                : [...state.infectionSigns, id],
            })
          }
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Toggle label="Presencia de esfacelos" checked={state.hasSlough} onChange={(checked) => onChange({ hasSlough: checked })} />
          <Toggle label="Presencia de necrosis" checked={state.hasNecrosis} onChange={(checked) => onChange({ hasNecrosis: checked })} />
        </div>
      </div>
    </section>
  );
}

function CheckboxGroup({
  title,
  options,
  values,
  onToggle,
}: {
  title: string;
  options: Array<{ id: string; label: string; helper?: string }>;
  values: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${
              values.includes(option.id)
                ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <div className="font-medium">{option.label}</div>
            {option.helper ? <div className="mt-1 max-w-[220px] leading-5">{option.helper}</div> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-slate-500">
      {label}
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
      >
        <option value="">Selecciona</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
        checked ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
