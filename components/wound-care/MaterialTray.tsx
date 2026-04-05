"use client";

import { WOUND_MATERIAL_OPTIONS } from "@/src/lib/wound-care/types";

type MaterialTrayProps = {
  selectedIds: string[];
  onToggle: (materialId: string) => void;
};

export default function MaterialTray({ selectedIds, onToggle }: MaterialTrayProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Bandeja clínica</div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {WOUND_MATERIAL_OPTIONS.map((material) => {
          const selected = selectedIds.includes(material.id);
          return (
            <button
              key={material.id}
              type="button"
              onClick={() => onToggle(material.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selected ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <div className="text-sm font-semibold">{material.label}</div>
              {material.helper ? <div className="mt-2 text-xs leading-5">{material.helper}</div> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
