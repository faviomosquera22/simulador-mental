"use client";

import type { WoundCaseData } from "@/src/lib/wound-care/types";

type WoundViewerProps = {
  caseData: WoundCaseData;
  zoom: number;
  measurementMode: boolean;
  selectedHotspotId?: string;
  onSelectHotspot: (hotspotId: string) => void;
  onZoomChange: (value: number) => void;
  onToggleMeasurementMode: () => void;
};

export default function WoundViewer({
  caseData,
  zoom,
  measurementMode,
  selectedHotspotId,
  onSelectHotspot,
  onZoomChange,
  onToggleMeasurementMode,
}: WoundViewerProps) {
  const selectedHotspot = caseData.wound.hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? caseData.wound.hotspots[0];

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Observación de la herida</div>
          <div className="mt-2 text-base font-semibold text-slate-900">{caseData.wound.locationLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMeasurementMode}
            className={`rounded-xl border px-3 py-2 text-xs transition ${
              measurementMode ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {measurementMode ? "Regla activa" : "Usar regla"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#eff5f2,#f8fbfa)] p-4">
        <div className="mx-auto aspect-[4/3] max-w-[520px] overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          <svg viewBox="0 0 320 240" className="h-full w-full">
            <rect x="0" y="0" width="320" height="240" fill="#f7faf9" />
            <g transform={`translate(160 120) scale(${1 + zoom / 100}) translate(-160 -120)`}>
              <ellipse cx="160" cy="120" rx="82" ry="98" fill="#e3d3c8" />
              <ellipse cx="160" cy="120" rx="64" ry="82" fill="#eaded4" />
              {caseData.wound.bodySite === "sacrum" ? <ellipse cx="160" cy="140" rx="52" ry="62" fill="#e1d0c5" /> : null}
              {caseData.wound.bodySite === "heel" ? <ellipse cx="210" cy="160" rx="50" ry="38" fill="#e1d0c5" /> : null}
              {caseData.wound.bodySite === "trochanter" ? <ellipse cx="205" cy="118" rx="44" ry="60" fill="#e1d0c5" /> : null}
              {caseData.wound.bodySite === "ischium" ? <ellipse cx="150" cy="164" rx="56" ry="42" fill="#e1d0c5" /> : null}

              <ellipse
                cx={caseData.wound.bodySite === "heel" ? 208 : caseData.wound.bodySite === "trochanter" ? 208 : caseData.wound.bodySite === "ischium" ? 154 : 160}
                cy={caseData.wound.bodySite === "heel" ? 160 : caseData.wound.bodySite === "trochanter" ? 118 : caseData.wound.bodySite === "ischium" ? 160 : 140}
                rx={caseData.wound.widthCm * 8}
                ry={Math.max(14, caseData.wound.lengthCm * 6)}
                fill={caseData.wound.stage === "Estadio I" ? "#d97b7b" : caseData.wound.stage === "Estadio II" ? "#f1a7a2" : "#b96a5d"}
                opacity="0.9"
              />
              {caseData.wound.hasSlough ? (
                <ellipse cx="160" cy={caseData.wound.bodySite === "heel" ? 160 : 140} rx="18" ry="12" fill="#d6c188" opacity="0.92" />
              ) : null}
              {caseData.wound.hasNecrosis ? (
                <ellipse cx="170" cy={caseData.wound.bodySite === "heel" ? 160 : 138} rx="13" ry="9" fill="#5a4136" opacity="0.78" />
              ) : null}

              {measurementMode ? (
                <>
                  <line x1="108" y1="86" x2="212" y2="86" stroke="#355b63" strokeDasharray="6 4" strokeWidth="1.8" />
                  <line x1="108" y1="86" x2="108" y2="92" stroke="#355b63" strokeWidth="1.8" />
                  <line x1="212" y1="86" x2="212" y2="92" stroke="#355b63" strokeWidth="1.8" />
                  <text x="160" y="78" textAnchor="middle" fontSize="12" fill="#355b63">
                    {caseData.wound.lengthCm} cm
                  </text>
                </>
              ) : null}

              {caseData.wound.hotspots.map((hotspot) => (
                <g key={hotspot.id} onClick={() => onSelectHotspot(hotspot.id)} className="cursor-pointer">
                  <circle
                    cx={hotspot.x * 3.2}
                    cy={hotspot.y * 2.4}
                    r={selectedHotspotId === hotspot.id ? 8 : 6}
                    fill={selectedHotspotId === hotspot.id ? "#183640" : "#3e6771"}
                    opacity="0.92"
                  />
                  <circle cx={hotspot.x * 3.2} cy={hotspot.y * 2.4} r="14" fill="transparent" stroke="#3e6771" strokeOpacity="0.25" />
                </g>
              ))}
            </g>
          </svg>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="flex-1 text-xs text-slate-500">
            Zoom
            <input
              type="range"
              min={0}
              max={40}
              value={zoom}
              onChange={(event) => onZoomChange(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">{zoom}%</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-wrap gap-2">
          {caseData.wound.hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => onSelectHotspot(hotspot.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                selectedHotspot?.id === hotspot.id
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {hotspot.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">{selectedHotspot?.label}</div>
          <p className="mt-2 leading-6">{selectedHotspot?.description}</p>
        </div>
      </div>
    </section>
  );
}
