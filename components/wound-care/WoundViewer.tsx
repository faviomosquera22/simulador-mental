"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import type { WoundCaseData, WoundVisualTone } from "@/src/lib/wound-care/types";

type WoundViewerProps = {
  caseData: WoundCaseData;
  zoom: number;
  measurementMode: boolean;
  selectedHotspotId?: string;
  onSelectHotspot: (hotspotId: string) => void;
  onZoomChange: (value: number) => void;
  onToggleMeasurementMode: () => void;
};

const TONE_ACCENTS: Record<WoundVisualTone, { border: string; chip: string; glow: string }> = {
  risk: { border: "#d9777d", chip: "#fff1f2", glow: "rgba(217,119,125,0.18)" },
  "stage-1": { border: "#d66b73", chip: "#fff1f2", glow: "rgba(214,107,115,0.18)" },
  "stage-2": { border: "#de8c87", chip: "#fff7ed", glow: "rgba(222,140,135,0.2)" },
  "stage-3": { border: "#a45548", chip: "#fff7ed", glow: "rgba(164,85,72,0.24)" },
  unstageable: { border: "#7b5b43", chip: "#f8f5ef", glow: "rgba(123,91,67,0.24)" },
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
  const visual = caseData.wound.visual;
  const accent = TONE_ACCENTS[visual.overlayTone];
  const focusStyle = focusBoxStyle(visual.focus);
  const scaledStyle = { transform: `scale(${1 + zoom / 160})`, transformOrigin: "center center" } as CSSProperties;

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(148,163,184,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Observación de la herida</div>
          <div className="mt-2 text-base font-semibold text-slate-900">{caseData.wound.locationLabel}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <InfoChip label={caseData.wound.stage} />
            <InfoChip label={`Exudado ${caseData.wound.exudate.toLowerCase()}`} />
            <InfoChip label={caseData.wound.tissue} />
          </div>
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
        <div className="relative mx-auto aspect-[4/3] max-w-[620px] overflow-hidden rounded-[26px] border border-slate-200 bg-[#dfe8e4]">
          <div className="absolute inset-0" style={scaledStyle}>
            <Image
              src={visual.imageSrc}
              alt={visual.imageAlt}
              fill
              sizes="(max-width: 1280px) 90vw, 620px"
              className="object-cover saturate-[0.72] contrast-[0.92] brightness-[1.03]"
              style={{ objectPosition: visual.objectPosition, opacity: visual.photoOpacity }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_38%),linear-gradient(180deg,rgba(244,250,248,0.18),rgba(229,239,235,0.4))]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),transparent_22%,transparent_72%,rgba(15,23,42,0.08))]" />

            <div
              className="absolute rounded-[32px] border bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_22px_44px_rgba(15,23,42,0.14)] backdrop-blur-[1px]"
              style={{ ...focusStyle, borderColor: accent.border, boxShadow: `0 0 0 10px ${accent.glow}` }}
            >
              <WoundOverlayArt caseData={caseData} />
            </div>

            {measurementMode ? <MeasurementOverlay caseData={caseData} /> : null}

            {caseData.wound.hotspots.map((hotspot) => {
              const selected = selectedHotspot?.id === hotspot.id;

              return (
                <button
                  key={hotspot.id}
                  type="button"
                  onClick={() => onSelectHotspot(hotspot.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                >
                  <span
                    className={`absolute inset-0 rounded-full ${selected ? "animate-ping" : ""}`}
                    style={{ backgroundColor: accent.glow, transform: "scale(2.2)" }}
                  />
                  <span
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition ${
                      selected ? "text-white" : "bg-white/92 text-slate-700"
                    }`}
                    style={{
                      borderColor: selected ? accent.border : "rgba(255,255,255,0.9)",
                      backgroundColor: selected ? accent.border : "rgba(255,255,255,0.92)",
                      boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
                    }}
                  >
                    {hotspot.label.slice(0, 1)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <LegendPill label="Foto clínica educativa" tone={accent.chip} />
            <LegendPill label="Overlay clínico" tone="rgba(24,54,64,0.92)" dark />
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-md rounded-2xl bg-[rgba(15,23,42,0.68)] px-4 py-3 text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] backdrop-blur-md">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{visual.imageSourceLabel}</div>
              <p className="mt-2 text-sm leading-6 text-white/90">{visual.notes[0]}</p>
            </div>
            <div className="rounded-2xl bg-white/88 px-3 py-2 text-xs text-slate-700 shadow-[0_14px_32px_rgba(15,23,42,0.12)] backdrop-blur-md">
              Zoom {zoom}% · {measurementMode ? "Medición visible" : "Medición oculta"}
            </div>
          </div>
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
              className="mt-2 w-full accent-[#3e6771]"
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">{zoom}%</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[0.75fr_1.05fr_0.9fr]">
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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Lectura guiada</div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {visual.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#3e6771]" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function WoundOverlayArt({ caseData }: { caseData: WoundCaseData }) {
  const overlayId = caseData.id.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const tone = caseData.wound.visual.overlayTone;

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <radialGradient id={`${overlayId}-erythema`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#efb0ae" stopOpacity="0.9" />
          <stop offset="62%" stopColor="#d76870" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c4555a" stopOpacity="0.12" />
        </radialGradient>
        <linearGradient id={`${overlayId}-bed`} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#f7b7af" />
          <stop offset="100%" stopColor="#c95f54" />
        </linearGradient>
        <linearGradient id={`${overlayId}-granulation`} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#b54335" />
          <stop offset="55%" stopColor="#892f22" />
          <stop offset="100%" stopColor="#631f17" />
        </linearGradient>
        <linearGradient id={`${overlayId}-slough`} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#ead8a3" />
          <stop offset="100%" stopColor="#b99b60" />
        </linearGradient>
      </defs>

      {tone === "risk" ? (
        <>
          <ellipse cx="50" cy="50" rx="38" ry="30" fill="#dbb1a5" fillOpacity="0.96" />
          <ellipse cx="50" cy="50" rx="35" ry="27" fill={`url(#${overlayId}-erythema)`} />
          <ellipse cx="50" cy="50" rx="22" ry="16" fill="#dcb6ab" fillOpacity="0.98" />
          <ellipse cx="50" cy="50" rx="24" ry="18" fill="none" stroke="#d66b73" strokeOpacity="0.42" strokeWidth="2.2" />
        </>
      ) : null}

      {tone === "stage-1" ? (
        <>
          <ellipse cx="50" cy="50" rx="37" ry="27" fill="#ddb3a7" fillOpacity="0.95" />
          <ellipse cx="50" cy="50" rx="34" ry="24" fill={`url(#${overlayId}-erythema)`} />
          <ellipse cx="50" cy="50" rx="18" ry="12" fill="#d6a8a0" fillOpacity="0.98" />
          <ellipse cx="50" cy="50" rx="18" ry="12" fill="none" stroke="#cf636d" strokeOpacity="0.52" strokeWidth="1.8" />
        </>
      ) : null}

      {tone === "stage-2" ? (
        <>
          <ellipse cx="50" cy="50" rx="38" ry="29" fill="#deb3a8" fillOpacity="0.85" />
          <ellipse cx="50" cy="50" rx="36" ry="27" fill="rgba(219,110,110,0.18)" />
          <ellipse cx="50" cy="50" rx="24" ry="18" fill={`url(#${overlayId}-bed)`} fillOpacity="0.88" />
          <ellipse cx="50" cy="50" rx="18" ry="12" fill="#f6d0cb" fillOpacity="0.78" />
          <ellipse cx="50" cy="50" rx="24" ry="18" fill="none" stroke="#cd7067" strokeOpacity="0.58" strokeWidth="2.2" />
        </>
      ) : null}

      {tone === "stage-3" ? (
        <>
          <path d="M10,52 C12,22 38,10 70,14 C88,18 92,42 88,58 C84,78 64,90 36,86 C16,82 8,68 10,52 Z" fill="rgba(167,87,72,0.22)" />
          <path d="M18,52 C22,28 42,20 67,22 C79,23 84,42 80,55 C76,72 59,80 36,77 C24,74 16,64 18,52 Z" fill={`url(#${overlayId}-granulation)`} fillOpacity="0.74" />
          <path d="M28,50 C34,38 58,36 66,45 C69,53 62,63 50,64 C36,65 27,59 28,50 Z" fill="#562219" fillOpacity="0.74" />
          <path d="M32,48 C38,42 54,38 61,44 C62,49 59,55 49,58 C40,58 33,55 32,48 Z" fill={`url(#${overlayId}-slough)`} fillOpacity="0.84" />
        </>
      ) : null}

      {tone === "unstageable" ? (
        <>
          <path d="M12,54 C15,30 39,18 69,22 C84,25 88,44 84,60 C80,76 60,84 34,80 C18,76 10,66 12,54 Z" fill="rgba(125,83,59,0.2)" />
          <path d="M20,54 C24,36 42,28 63,30 C75,31 80,44 77,57 C73,69 57,76 38,73 C26,71 18,63 20,54 Z" fill="#4e3526" fillOpacity="0.86" />
          <path d="M26,50 C30,42 52,39 63,46 C62,56 54,62 42,62 C32,61 26,57 26,50 Z" fill={`url(#${overlayId}-slough)`} fillOpacity="0.78" />
          <ellipse cx="54" cy="49" rx="15" ry="10" fill="#261911" fillOpacity="0.55" />
        </>
      ) : null}
    </svg>
  );
}

function MeasurementOverlay({ caseData }: { caseData: WoundCaseData }) {
  const focus = caseData.wound.visual.focus;
  const horizontalStyle = {
    left: `${focus.x - focus.width / 2}%`,
    top: `${Math.max(8, focus.y - focus.height / 2 - 8)}%`,
    width: `${focus.width}%`,
  } as CSSProperties;
  const verticalStyle = {
    left: `${Math.min(92, focus.x + focus.width / 2 + 4)}%`,
    top: `${focus.y - focus.height / 2}%`,
    height: `${focus.height}%`,
  } as CSSProperties;

  return (
    <>
      <div className="absolute border-t-2 border-dashed border-[#355b63]" style={horizontalStyle}>
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-[#355b63]">
          Largo {caseData.wound.lengthCm} cm
        </span>
      </div>
      <div className="absolute border-l-2 border-dashed border-[#355b63]" style={verticalStyle}>
        <span className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-[#355b63]">
          Ancho {caseData.wound.widthCm} cm
        </span>
      </div>
      <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#355b63]">
        Prof. {caseData.wound.depthCm} cm
      </div>
    </>
  );
}

function focusBoxStyle(focus: WoundCaseData["wound"]["visual"]["focus"]): CSSProperties {
  return {
    left: `${focus.x - focus.width / 2}%`,
    top: `${focus.y - focus.height / 2}%`,
    width: `${focus.width}%`,
    height: `${focus.height}%`,
    transform: `rotate(${focus.rotation ?? 0}deg)`,
  };
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
      {label}
    </span>
  );
}

function LegendPill({ label, tone, dark = false }: { label: string; tone: string; dark?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-[0_10px_24px_rgba(15,23,42,0.12)] ${
        dark ? "border-white/10 text-white" : "border-slate-200 text-slate-700"
      }`}
      style={{ backgroundColor: tone }}
    >
      {label}
    </span>
  );
}
