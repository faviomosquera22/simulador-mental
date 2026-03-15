"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { UltrasoundCase } from "@/src/lib/ultrasoundModule";

type UltrasoundViewerProps = {
  caseSet: UltrasoundCase;
  zoom: number;
  showHighlights: boolean;
};

type RenderPreset =
  | "ob_reference"
  | "ob_singleton"
  | "ob_cephalic"
  | "ob_breech"
  | "cardiac_normal"
  | "cardiac_effusion"
  | "cardiac_low_ef"
  | "renal_normal"
  | "renal_hydronephrosis"
  | "biliary_normal"
  | "biliary_stones";

const ULTRASOUND_SPECKLES = [
  { cx: 18, cy: 20, rx: 1.3, ry: 0.8, opacity: 0.18 },
  { cx: 24, cy: 28, rx: 1.5, ry: 0.9, opacity: 0.14 },
  { cx: 30, cy: 18, rx: 1.2, ry: 0.7, opacity: 0.1 },
  { cx: 36, cy: 26, rx: 1.8, ry: 1, opacity: 0.16 },
  { cx: 42, cy: 34, rx: 1.1, ry: 0.8, opacity: 0.12 },
  { cx: 52, cy: 24, rx: 1.8, ry: 0.9, opacity: 0.18 },
  { cx: 58, cy: 32, rx: 1.4, ry: 0.9, opacity: 0.16 },
  { cx: 64, cy: 22, rx: 1.6, ry: 0.8, opacity: 0.1 },
  { cx: 71, cy: 30, rx: 1.8, ry: 1.1, opacity: 0.15 },
  { cx: 78, cy: 40, rx: 1.2, ry: 0.7, opacity: 0.12 },
  { cx: 20, cy: 48, rx: 1.8, ry: 1.1, opacity: 0.1 },
  { cx: 28, cy: 56, rx: 1.4, ry: 0.8, opacity: 0.16 },
  { cx: 36, cy: 64, rx: 1.8, ry: 1.2, opacity: 0.18 },
  { cx: 46, cy: 52, rx: 1.1, ry: 0.8, opacity: 0.14 },
  { cx: 54, cy: 62, rx: 1.7, ry: 1.1, opacity: 0.17 },
  { cx: 63, cy: 54, rx: 1.2, ry: 0.7, opacity: 0.12 },
  { cx: 72, cy: 64, rx: 1.8, ry: 1.1, opacity: 0.16 },
  { cx: 80, cy: 56, rx: 1.4, ry: 0.9, opacity: 0.14 },
  { cx: 26, cy: 76, rx: 1.8, ry: 1.1, opacity: 0.1 },
  { cx: 42, cy: 78, rx: 1.3, ry: 0.8, opacity: 0.16 },
  { cx: 58, cy: 74, rx: 1.7, ry: 1.1, opacity: 0.12 },
  { cx: 74, cy: 80, rx: 1.9, ry: 1.2, opacity: 0.14 },
];

function RectHighlight({
  region,
  visible,
  active,
}: {
  region: UltrasoundCase["highlightRegions"][number];
  visible: boolean;
  active: boolean;
}) {
  if (!visible) return null;
  return (
    <>
      <rect
        x={region.x}
        y={region.y}
        width={region.width}
        height={region.height}
        rx="3"
        fill={active ? "rgba(34,211,238,0.14)" : "rgba(34,211,238,0.08)"}
        stroke={active ? "rgba(165,243,252,0.98)" : "rgba(125,211,252,0.95)"}
        strokeWidth={active ? "1.8" : "1.4"}
        strokeDasharray={active ? "6 3" : "4 3"}
      />
      {active ? (
        <circle
          cx={region.x + region.width / 2}
          cy={region.y + region.height / 2}
          r={Math.min(region.width, region.height) * 0.22}
          fill="rgba(34,211,238,0.12)"
          stroke="rgba(165,243,252,0.85)"
          strokeWidth="1.2"
        />
      ) : null}
      <text x={region.x} y={Math.max(8, region.y - 2)} fill="rgba(186,230,253,0.95)" fontSize="4.2">
        {region.label}
      </text>
    </>
  );
}

function FrameLabel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{title}</div>
        <div className="mt-1 text-sm font-semibold text-white">{subtitle}</div>
      </div>
    </div>
  );
}

function UltrasoundCanvas({
  scanId,
  badge,
  children,
}: {
  scanId: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id={`screen-${scanId}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#05070B" />
          <stop offset="100%" stopColor="#0B1118" />
        </linearGradient>
        <radialGradient id={`beam-${scanId}`} cx="50%" cy="6%" r="86%">
          <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.13" />
          <stop offset="55%" stopColor="#CBD5E1" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.02" />
        </radialGradient>
        <clipPath id={`sector-${scanId}`}>
          <path d="M18 10 Q50 5 82 10 L90 86 Q50 96 10 86 Z" />
        </clipPath>
      </defs>

      <rect width="100" height="100" fill={`url(#screen-${scanId})`} />
      <rect x="6" y="5" width="88" height="90" rx="8" fill="#04070B" stroke="#2B3946" strokeWidth="1.1" />
      <path d="M18 10 Q50 5 82 10 L90 86 Q50 96 10 86 Z" fill={`url(#beam-${scanId})`} stroke="#31404D" strokeWidth="1" />

      <g clipPath={`url(#sector-${scanId})`}>
        <rect x="10" y="8" width="80" height="82" fill="#050A11" opacity="0.9" />
        {ULTRASOUND_SPECKLES.map((speckle, index) => (
          <ellipse
            key={`${scanId}-speckle-${index}`}
            cx={speckle.cx}
            cy={speckle.cy}
            rx={speckle.rx}
            ry={speckle.ry}
            fill="#E2E8F0"
            opacity={speckle.opacity}
          />
        ))}
        {[24, 38, 52, 66, 80].map((y, index) => (
          <path
            key={`${scanId}-depth-${index}`}
            d={`M18 ${y} Q50 ${y + 5} 82 ${y}`}
            stroke="#CBD5E1"
            strokeWidth="0.5"
            opacity="0.07"
            fill="none"
          />
        ))}
        <g opacity="0.95">{children}</g>
      </g>

      <path d="M40 7 Q50 3 60 7" stroke="#7DD3FC" strokeWidth="1" opacity="0.45" />
      <text x="12" y="14" fill="#A5F3FC" fontSize="4" letterSpacing="0.7">
        {badge}
      </text>
      {[22, 38, 54, 70, 86].map((y, index) => (
        <g key={`${scanId}-mark-${index}`}>
          <line x1="86" y1={y} x2="90" y2={y} stroke="#94A3B8" strokeWidth="0.7" opacity="0.6" />
          <text x="80" y={y + 1.4} fill="#64748B" fontSize="2.8">
            {index + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function FetusFigure({ orientation }: { orientation: "diagonal" | "cephalic" | "breech" }) {
  if (orientation === "diagonal") {
    return (
      <g>
        <circle cx="56" cy="48" r="6.2" fill="#DCE3E8" opacity="0.82" />
        <path d="M52 54 Q46 60 44 68" stroke="#DCE3E8" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.76" />
        <path d="M44 68 Q47 73 51 76" stroke="#DCE3E8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.72" />
        <path d="M48 60 Q40 58 35 52" stroke="#DCE3E8" strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.68" />
      </g>
    );
  }

  if (orientation === "cephalic") {
    return (
      <g>
        <circle cx="52" cy="68" r="6.6" fill="#DCE3E8" opacity="0.82" />
        <path d="M48 61 Q42 52 43 43" stroke="#DCE3E8" strokeWidth="3.3" fill="none" strokeLinecap="round" opacity="0.76" />
        <path d="M43 43 Q47 36 54 34" stroke="#DCE3E8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M45 54 Q39 56 35 61" stroke="#DCE3E8" strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.68" />
      </g>
    );
  }

  return (
    <g>
      <circle cx="56" cy="32" r="6.6" fill="#DCE3E8" opacity="0.82" />
      <path d="M52 39 Q46 48 45 58" stroke="#DCE3E8" strokeWidth="3.3" fill="none" strokeLinecap="round" opacity="0.76" />
      <path d="M45 58 Q47 66 52 72" stroke="#DCE3E8" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M48 48 Q41 47 36 42" stroke="#DCE3E8" strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.68" />
    </g>
  );
}

function ObstetricScan({ variant }: { variant: "reference" | "singleton" | "cephalic" | "breech" }) {
  return (
    <UltrasoundCanvas scanId={`ob-${variant}`} badge="OB">
      <ellipse cx="50" cy="58" rx="27" ry="20" fill="#434C54" opacity="0.34" />
      <ellipse cx="50" cy="58" rx="22.5" ry="16.5" fill="#111820" opacity="0.92" stroke="#9CA3AF" strokeWidth="0.7" strokeOpacity="0.55" />
      <ellipse cx="50" cy="58" rx="16" ry="11" fill="#070B10" opacity="0.95" />
      {variant === "reference" ? (
        <>
          <ellipse cx="50" cy="58" rx="8.5" ry="6.4" fill="#1F2933" opacity="0.86" />
          <ellipse cx="44" cy="52" rx="2" ry="1.2" fill="#E2E8F0" opacity="0.18" />
          <ellipse cx="58" cy="63" rx="2.2" ry="1.4" fill="#E2E8F0" opacity="0.14" />
        </>
      ) : null}
      {variant === "singleton" ? <FetusFigure orientation="diagonal" /> : null}
      {variant === "cephalic" ? <FetusFigure orientation="cephalic" /> : null}
      {variant === "breech" ? <FetusFigure orientation="breech" /> : null}
      {variant === "singleton" ? <circle cx="62" cy="47" r="1.5" fill="#F8FAFC" opacity="0.9" /> : null}
      <path d="M24 52 Q50 28 76 52" stroke="#CBD5E1" strokeWidth="0.7" opacity="0.16" fill="none" />
    </UltrasoundCanvas>
  );
}

function CardiacScan({ variant }: { variant: "normal" | "effusion" | "lowEf" }) {
  const outerPath = "M28 34 Q40 20 61 25 Q75 32 73 53 Q70 74 49 76 Q28 73 24 52 Q22 42 28 34Z";
  const myocardiumPath = "M32 38 Q42 26 58 30 Q68 36 66 52 Q63 68 48 70 Q33 67 30 54 Q28 45 32 38Z";

  return (
    <UltrasoundCanvas scanId={`cardiac-${variant}`} badge="ECHO">
      {variant === "effusion" ? <path d={outerPath} fill="#02060A" opacity="0.94" /> : null}
      <path
        d={myocardiumPath}
        fill="#78828C"
        opacity={variant === "lowEf" ? 0.42 : 0.56}
        stroke="#D5DCE2"
        strokeWidth="0.45"
        strokeOpacity="0.35"
      />
      <ellipse
        cx="47"
        cy="52"
        rx={variant === "lowEf" ? 16.5 : 12.5}
        ry={variant === "lowEf" ? 13 : 10}
        fill="#05080C"
        opacity="0.96"
      />
      <ellipse cx="59" cy="42" rx="8.5" ry="6.3" fill="#06090E" opacity="0.9" />
      <ellipse cx="37" cy="45" rx="6.8" ry="5.4" fill="#070A10" opacity="0.82" />
      <path d="M46 40 L51 60" stroke="#DCE3E8" strokeWidth="0.95" opacity="0.42" />
      <path d="M42 50 Q49 46 57 48" stroke="#DCE3E8" strokeWidth="0.9" opacity="0.32" fill="none" />
      {variant === "effusion" ? (
        <>
          <path d={outerPath} fill="none" stroke="#CBD5E1" strokeWidth="1" strokeOpacity="0.46" />
          <path d="M26 56 Q46 84 69 70" stroke="#E2E8F0" strokeWidth="0.7" opacity="0.1" fill="none" />
        </>
      ) : null}
      {variant === "lowEf" ? (
        <>
          <ellipse cx="47" cy="52" rx="18.2" ry="14.2" fill="none" stroke="#E2E8F0" strokeWidth="0.7" strokeOpacity="0.18" />
          <path d="M34 58 Q47 59 60 57" stroke="#94A3B8" strokeWidth="0.7" opacity="0.18" fill="none" />
        </>
      ) : null}
    </UltrasoundCanvas>
  );
}

function RenalScan({ variant }: { variant: "normal" | "hydronephrosis" }) {
  return (
    <UltrasoundCanvas scanId={`renal-${variant}`} badge="RENAL">
      <path d="M33 28 Q20 46 29 66 Q38 82 57 78 Q77 73 79 52 Q81 35 65 25 Q49 18 33 28Z" fill="#7C8792" opacity="0.5" />
      <path d="M38 32 Q28 46 35 62 Q42 74 56 70 Q70 66 71 52 Q72 39 61 31 Q50 24 38 32Z" fill="#404A54" opacity="0.68" />
      <ellipse cx="52" cy="50" rx="9" ry="14" fill="#D5DCE2" opacity="0.38" />
      {variant === "hydronephrosis" ? (
        <>
          <ellipse cx="52" cy="48" rx="6.8" ry="11.2" fill="#070B10" opacity="0.94" />
          <ellipse cx="48" cy="42" rx="3.4" ry="5.2" fill="#070B10" opacity="0.92" />
          <ellipse cx="56" cy="42" rx="3.4" ry="5.2" fill="#070B10" opacity="0.92" />
          <ellipse cx="46" cy="56" rx="3.1" ry="5" fill="#070B10" opacity="0.9" />
          <ellipse cx="58" cy="56" rx="3.1" ry="5" fill="#070B10" opacity="0.9" />
        </>
      ) : (
        <>
          <ellipse cx="52" cy="50" rx="4.1" ry="9.4" fill="#F1F5F9" opacity="0.22" />
          <ellipse cx="48" cy="46" rx="2.2" ry="4.4" fill="#E2E8F0" opacity="0.2" />
          <ellipse cx="56" cy="54" rx="2.3" ry="4.6" fill="#E2E8F0" opacity="0.18" />
        </>
      )}
    </UltrasoundCanvas>
  );
}

function BiliaryScan({ variant }: { variant: "normal" | "stones" }) {
  return (
    <UltrasoundCanvas scanId={`biliary-${variant}`} badge="RUQ">
      <path d="M18 30 Q42 18 78 30 L76 70 Q48 82 20 68 Z" fill="#5F6870" opacity="0.26" />
      <path
        d="M56 32 Q68 41 66 57 Q65 72 54 73 Q43 74 40 61 Q38 46 47 36 Q52 31 56 32Z"
        fill="#060A10"
        stroke="#CBD5E1"
        strokeWidth="0.8"
        strokeOpacity="0.55"
      />
      {variant === "stones" ? (
        <>
          <circle cx="53" cy="50" r="2.4" fill="#F8FAFC" opacity="0.92" />
          <circle cx="58" cy="54" r="2" fill="#F8FAFC" opacity="0.9" />
          <path d="M53 52 L49 74" stroke="#030507" strokeWidth="3.8" opacity="0.95" />
          <path d="M58 56 L61 78" stroke="#030507" strokeWidth="3.1" opacity="0.92" />
        </>
      ) : (
        <ellipse cx="55" cy="53" rx="9" ry="16" fill="#05090E" opacity="0.65" />
      )}
    </UltrasoundCanvas>
  );
}

function resolveVisuals(caseSet: UltrasoundCase) {
  switch (caseSet.imagePreset) {
    case "ob_singleton_viable":
      return {
        referencePreset: "ob_reference" as RenderPreset,
        casePreset: "ob_singleton" as RenderPreset,
        referenceTitle: "Saco gestacional de referencia",
        caseTitle: "Caso con polo fetal y viabilidad",
      };
    case "ob_breech":
      return {
        referencePreset: "ob_cephalic" as RenderPreset,
        casePreset: "ob_breech" as RenderPreset,
        referenceTitle: "Referencia con presentacion cefalica",
        caseTitle: "Caso con eje fetal invertido",
      };
    case "cardiac_pericardial_effusion":
      return {
        referencePreset: "cardiac_normal" as RenderPreset,
        casePreset: "cardiac_effusion" as RenderPreset,
        referenceTitle: "Ventana cardiaca sin liquido libre",
        caseTitle: "Caso con halo anecoico pericardico",
      };
    case "cardiac_low_ejection_fraction":
      return {
        referencePreset: "cardiac_normal" as RenderPreset,
        casePreset: "cardiac_low_ef" as RenderPreset,
        referenceTitle: "Contractilidad de referencia",
        caseTitle: "Caso con cavidad amplia y baja contraccion",
      };
    case "renal_hydronephrosis":
      return {
        referencePreset: "renal_normal" as RenderPreset,
        casePreset: "renal_hydronephrosis" as RenderPreset,
        referenceTitle: "Seno renal sin dilatacion",
        caseTitle: "Caso con pelvis y calices dilatados",
      };
    case "biliary_cholelithiasis":
      return {
        referencePreset: "biliary_normal" as RenderPreset,
        casePreset: "biliary_stones" as RenderPreset,
        referenceTitle: "Vesicula sin ecos dependientes",
        caseTitle: "Caso con calculos y sombra posterior",
      };
  }
}

function renderPreset(preset: RenderPreset) {
  switch (preset) {
    case "ob_reference":
      return <ObstetricScan variant="reference" />;
    case "ob_singleton":
      return <ObstetricScan variant="singleton" />;
    case "ob_cephalic":
      return <ObstetricScan variant="cephalic" />;
    case "ob_breech":
      return <ObstetricScan variant="breech" />;
    case "cardiac_normal":
      return <CardiacScan variant="normal" />;
    case "cardiac_effusion":
      return <CardiacScan variant="effusion" />;
    case "cardiac_low_ef":
      return <CardiacScan variant="lowEf" />;
    case "renal_normal":
      return <RenalScan variant="normal" />;
    case "renal_hydronephrosis":
      return <RenalScan variant="hydronephrosis" />;
    case "biliary_normal":
      return <BiliaryScan variant="normal" />;
    case "biliary_stones":
      return <BiliaryScan variant="stones" />;
  }
}

export default function UltrasoundViewer(props: UltrasoundViewerProps) {
  const { caseSet, zoom, showHighlights } = props;
  const [selectedHighlightIndex, setSelectedHighlightIndex] = useState(0);

  const visuals = useMemo(() => resolveVisuals(caseSet), [caseSet]);
  const comparisonHints = useMemo(() => caseSet.keyFindings.slice(0, 3), [caseSet.keyFindings]);
  const activeHighlight = caseSet.highlightRegions[selectedHighlightIndex] ?? caseSet.highlightRegions[0] ?? null;

  useEffect(() => {
    setSelectedHighlightIndex(0);
  }, [caseSet.id]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050A11]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(248,113,113,0.10),transparent_34%)]" />
      <div className="absolute inset-0 opacity-20 mix-blend-screen [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/72">
        Zoom {Math.round(zoom * 100)}%
      </div>
      <div className="absolute left-4 top-4 z-10 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100">
        Esquema ecografico educativo
      </div>
      {showHighlights ? (
        <div className="absolute bottom-4 left-4 z-10 rounded-full border border-cyan-300/20 bg-black/35 px-3 py-1 text-[11px] text-cyan-100">
          Interactivo: enfoca una zona sonografica
        </div>
      ) : null}

      <div className="relative grid gap-4 p-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-black/25 p-3">
          <FrameLabel title="Referencia" subtitle={visuals.referenceTitle} />
          <div className="relative aspect-square overflow-hidden rounded-[20px] border border-white/10 bg-[#091019] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(148,163,184,0.08),transparent_35%)]" />
            <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
              {renderPreset(visuals.referencePreset)}
            </div>
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-[11px] text-white/68 backdrop-blur">
              Compara anatomia, ecos brillantes, zonas anecoicas y continuidad de bordes.
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-cyan-400/15 bg-black/25 p-3">
          <FrameLabel title="Caso actual" subtitle={visuals.caseTitle} />
          <div className="relative aspect-square overflow-hidden rounded-[20px] border border-cyan-400/15 bg-[#091019] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_70%_75%,rgba(248,113,113,0.10),transparent_34%)]" />
            <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
              {renderPreset(visuals.casePreset)}
            </div>
            <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
              {caseSet.highlightRegions.map((region, index) => (
                <RectHighlight
                  key={`${region.label}-${region.x}-${region.y}`}
                  region={region}
                  visible={showHighlights}
                  active={selectedHighlightIndex === index}
                />
              ))}
            </svg>
            {showHighlights ? (
              <div className="absolute inset-0">
                {caseSet.highlightRegions.map((region, index) => (
                  <button
                    key={`region-${region.label}-${index}`}
                    type="button"
                    onClick={() => setSelectedHighlightIndex(index)}
                    className={`absolute rounded-[14px] transition ${
                      selectedHighlightIndex === index
                        ? "bg-cyan-300/10 ring-2 ring-cyan-200/85 ring-offset-2 ring-offset-transparent"
                        : "bg-transparent hover:bg-cyan-300/6"
                    }`}
                    style={{
                      left: `${region.x}%`,
                      top: `${region.y}%`,
                      width: `${region.width}%`,
                      height: `${region.height}%`,
                    }}
                    aria-label={`Enfocar ${region.label}`}
                  >
                    <span
                      className={`absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        selectedHighlightIndex === index
                          ? "border-cyan-200/80 bg-cyan-200 text-[#041018]"
                          : "border-cyan-300/30 bg-[#04111A] text-cyan-100"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-cyan-400/15 bg-black/55 px-3 py-2 text-[11px] text-white/70 backdrop-blur">
              {showHighlights && activeHighlight
                ? `Zona enfocada: ${activeHighlight.label}`
                : "Valida primero o activa la revision para comparar la ventana ecografica."}
            </div>
          </div>
        </div>
      </div>

      <div className="relative grid gap-3 border-t border-white/10 bg-black/20 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Que debes comparar</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {comparisonHints.map((hint) => (
              <span key={hint} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/78">
                {hint}
              </span>
            ))}
          </div>
          {showHighlights && caseSet.highlightRegions.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {caseSet.highlightRegions.map((region, index) => (
                <button
                  key={`chip-${region.label}-${index}`}
                  type="button"
                  onClick={() => setSelectedHighlightIndex(index)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    selectedHighlightIndex === index
                      ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-50"
                      : "border-white/10 bg-white/5 text-white/72 hover:bg-white/10"
                  }`}
                >
                  Zona {index + 1}: {region.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/68">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Guia visual</div>
          <div className="mt-2">
            {showHighlights ? caseSet.feedback.highlightHint : "Compara la referencia con el caso y define el hallazgo dominante."}
          </div>
          {showHighlights && activeHighlight ? (
            <div className="mt-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-xs text-cyan-50">
              <div className="uppercase tracking-[0.18em] text-cyan-100/70">Hallazgo enfocado</div>
              <div className="mt-1 text-sm font-semibold text-white">{activeHighlight.label}</div>
              <div className="mt-1 text-cyan-50/85">
                Contrasta esa zona con la referencia y describe si es anecoica, hiperecogenica o de contorno alterado.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
