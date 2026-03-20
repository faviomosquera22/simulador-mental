"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ultrasoundCategoryLabel, ultrasoundDifficultyLabel, ultrasoundProbeLabel, type UltrasoundCase } from "@/src/lib/ultrasoundModule";

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
  | "biliary_stones"
  | "fast_ruq_normal"
  | "fast_ruq_fluid"
  | "fast_luq_normal"
  | "fast_luq_fluid"
  | "fast_pelvis_normal"
  | "fast_pelvis_fluid"
  | "lung_normal"
  | "lung_pneumothorax"
  | "lung_hemothorax";

type ScanSignal = {
  label: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  tone?: "neutral" | "focus";
};

type ViewerVisuals = {
  referencePreset: RenderPreset;
  casePreset: RenderPreset;
  referenceTitle: string;
  caseTitle: string;
  orientationChip: string;
  depthLabels: string[];
  referenceSignals: ScanSignal[];
  caseSignals: ScanSignal[];
  microLegend: string[];
};

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

function MetaChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "cyan" | "amber";
}) {
  const tones =
    tone === "cyan"
      ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-50"
      : tone === "amber"
      ? "border-amber-300/20 bg-amber-400/10 text-amber-50"
      : "border-white/10 bg-white/5 text-white/72";

  return <span className={`rounded-full border px-3 py-1 text-[11px] ${tones}`}>{label}</span>;
}

function approxTextWidth(label: string) {
  return Math.max(10, Math.min(24, label.length * 2.25 + 5));
}

function SignalOverlay({
  signals,
  visible,
}: {
  signals: ScanSignal[];
  visible: boolean;
}) {
  if (!visible || !signals.length) return null;

  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
      {signals.map((signal, index) => {
        const width = approxTextWidth(signal.label);
        const isFocus = signal.tone === "focus";
        const boxX = Math.max(4, Math.min(96 - width, signal.x));
        const boxY = Math.max(6, Math.min(94, signal.y));

        return (
          <g key={`${signal.label}-${index}`}>
            <line
              x1={signal.targetX}
              y1={signal.targetY}
              x2={boxX + 2}
              y2={boxY - 1.2}
              stroke={isFocus ? "rgba(165,243,252,0.72)" : "rgba(226,232,240,0.42)"}
              strokeWidth={isFocus ? "0.9" : "0.7"}
              strokeDasharray={isFocus ? "2 1.5" : "1.5 1.5"}
            />
            <circle
              cx={signal.targetX}
              cy={signal.targetY}
              r={isFocus ? "1.3" : "1"}
              fill={isFocus ? "rgba(165,243,252,0.82)" : "rgba(226,232,240,0.55)"}
            />
            <rect
              x={boxX}
              y={boxY - 5}
              width={width}
              height="6.8"
              rx="2.6"
              fill={isFocus ? "rgba(3,18,25,0.82)" : "rgba(2,6,10,0.72)"}
              stroke={isFocus ? "rgba(165,243,252,0.34)" : "rgba(226,232,240,0.16)"}
              strokeWidth="0.45"
            />
            <text
              x={boxX + 2.2}
              y={boxY - 0.3}
              fill={isFocus ? "rgba(207,250,254,0.98)" : "rgba(226,232,240,0.82)"}
              fontSize="3"
              letterSpacing="0.15"
            >
              {signal.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function UltrasoundCanvas({
  scanId,
  badge,
  orientationChip,
  depthLabels,
  beamShape = "sector",
  children,
}: {
  scanId: string;
  badge: string;
  orientationChip: string;
  depthLabels: string[];
  beamShape?: "sector" | "linear";
  children: ReactNode;
}) {
  const isLinear = beamShape === "linear";
  const scanWindowPath = "M18 10 Q50 5 82 10 L90 86 Q50 96 10 86 Z";
  const clipId = `clip-${scanId}`;

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
        <clipPath id={clipId}>
          {isLinear ? <rect x="14" y="12" width="72" height="74" rx="6" /> : <path d={scanWindowPath} />}
        </clipPath>
      </defs>

      <rect width="100" height="100" fill={`url(#screen-${scanId})`} />
      <rect x="6" y="5" width="88" height="90" rx="8" fill="#04070B" stroke="#2B3946" strokeWidth="1.1" />
      {isLinear ? (
        <rect x="14" y="12" width="72" height="74" rx="6" fill={`url(#beam-${scanId})`} stroke="#31404D" strokeWidth="1" />
      ) : (
        <path d={scanWindowPath} fill={`url(#beam-${scanId})`} stroke="#31404D" strokeWidth="1" />
      )}

      <g clipPath={`url(#${clipId})`}>
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
        {isLinear
          ? [24, 36, 48, 60, 72].map((y, index) => (
              <line
                key={`${scanId}-depth-${index}`}
                x1="16"
                y1={y}
                x2="84"
                y2={y}
                stroke="#CBD5E1"
                strokeWidth="0.5"
                opacity="0.07"
              />
            ))
          : [24, 38, 52, 66, 80].map((y, index) => (
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
        <path
          d={isLinear ? "M14 16 H86" : "M20 18 Q50 13 80 18"}
          stroke="#E2E8F0"
          strokeWidth="0.8"
          opacity="0.12"
        />
      </g>

      {isLinear ? (
        <>
          <path d="M24 8 H76" stroke="#7DD3FC" strokeWidth="1" opacity="0.55" />
          <path d="M27 10 H73" stroke="#7DD3FC" strokeWidth="0.7" opacity="0.3" />
        </>
      ) : (
        <path d="M40 7 Q50 3 60 7" stroke="#7DD3FC" strokeWidth="1" opacity="0.45" />
      )}
      <text x="12" y="14" fill="#A5F3FC" fontSize="4" letterSpacing="0.7">
        {badge}
      </text>
      <rect x="65.5" y="8" width="20" height="6.8" rx="3.2" fill="rgba(3,10,16,0.7)" stroke="rgba(125,211,252,0.22)" strokeWidth="0.5" />
      <path d="M68.5 11.4 H73" stroke="#A5F3FC" strokeWidth="0.9" strokeLinecap="round" opacity="0.82" />
      <circle cx="68.5" cy="11.4" r="1" fill="#A5F3FC" opacity="0.9" />
      <text x="74.8" y="12.7" fill="#CFFAFE" fontSize="3.1" letterSpacing="0.18">
        {orientationChip}
      </text>
      <text x="11" y="90.5" fill="#64748B" fontSize="2.8" letterSpacing="0.24">
        near
      </text>
      <text x="74.8" y="90.5" fill="#64748B" fontSize="2.8" letterSpacing="0.24">
        deep
      </text>
      {[22, 38, 54, 70, 86].map((y, index) => (
        <g key={`${scanId}-mark-${index}`}>
          <line x1="86" y1={y} x2="90" y2={y} stroke="#94A3B8" strokeWidth="0.7" opacity="0.6" />
          <text x="76.5" y={y + 1.4} fill="#64748B" fontSize="2.8">
            {depthLabels[index] ?? index + 1}
          </text>
        </g>
      ))}
      <rect x="12" y="78.5" width="18" height="6" rx="2.5" fill="rgba(2,6,10,0.72)" stroke="rgba(148,163,184,0.14)" strokeWidth="0.45" />
      <text x="15" y="82.6" fill="#CBD5E1" fontSize="2.7" letterSpacing="0.16">
        gain mid
      </text>
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
    <UltrasoundCanvas scanId={`ob-${variant}`} badge="OB" orientationChip="LONG" depthLabels={["3", "6", "9", "12", "15"]}>
      <ellipse cx="50" cy="58" rx="27" ry="20" fill="#434C54" opacity="0.34" />
      <ellipse cx="50" cy="58" rx="22.5" ry="16.5" fill="#111820" opacity="0.92" stroke="#9CA3AF" strokeWidth="0.7" strokeOpacity="0.55" />
      <ellipse cx="50" cy="58" rx="16" ry="11" fill="#070B10" opacity="0.95" />
      <ellipse cx="50" cy="58" rx="23.8" ry="17.6" fill="none" stroke="#E2E8F0" strokeWidth="0.5" strokeOpacity="0.16" strokeDasharray="2 2" />
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
    <UltrasoundCanvas scanId={`cardiac-${variant}`} badge="ECHO" orientationChip="S4C" depthLabels={["4", "8", "12", "16", "20"]}>
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
      <path d={outerPath} fill="none" stroke="#E2E8F0" strokeWidth="0.5" strokeOpacity="0.12" strokeDasharray="2 2" />
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
    <UltrasoundCanvas scanId={`renal-${variant}`} badge="RENAL" orientationChip="LONG" depthLabels={["2", "4", "6", "8", "10"]}>
      <path d="M33 28 Q20 46 29 66 Q38 82 57 78 Q77 73 79 52 Q81 35 65 25 Q49 18 33 28Z" fill="#7C8792" opacity="0.5" />
      <path d="M38 32 Q28 46 35 62 Q42 74 56 70 Q70 66 71 52 Q72 39 61 31 Q50 24 38 32Z" fill="#404A54" opacity="0.68" />
      <path d="M38 32 Q28 46 35 62 Q42 74 56 70 Q70 66 71 52 Q72 39 61 31 Q50 24 38 32Z" fill="none" stroke="#E2E8F0" strokeWidth="0.5" strokeOpacity="0.16" strokeDasharray="2 2" />
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
    <UltrasoundCanvas scanId={`biliary-${variant}`} badge="RUQ" orientationChip="OBL" depthLabels={["2", "4", "6", "8", "10"]}>
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

function FastQuadrantScan({ side, fluid }: { side: "ruq" | "luq"; fluid: boolean }) {
  const mirrored = side === "luq";

  return (
    <UltrasoundCanvas
      scanId={`fast-${side}-${fluid ? "fluid" : "normal"}`}
      badge={side === "ruq" ? "RUQ" : "LUQ"}
      orientationChip={side === "ruq" ? "RUQ" : "LUQ"}
      depthLabels={["4", "8", "12", "16", "20"]}
    >
      <g transform={mirrored ? "translate(100 0) scale(-1 1)" : undefined}>
        <path d="M16 24 Q36 18 58 24 Q67 34 66 58 Q62 73 46 81 Q24 78 16 60 Q12 41 16 24Z" fill="#65707A" opacity="0.46" />
        <path
          d="M16 24 Q36 18 58 24 Q67 34 66 58"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="0.55"
          strokeOpacity="0.16"
          strokeDasharray="2 2"
        />
        <path d="M58 38 Q68 31 77 34 Q84 42 82 56 Q79 68 69 71 Q57 71 52 60 Q49 49 58 38Z" fill="#59636C" opacity="0.62" />
        <path d="M61 41 Q69 36 76 39 Q80 45 79 55 Q76 64 68 66 Q58 65 56 57 Q54 49 61 41Z" fill="#121A22" opacity="0.9" />
        <ellipse cx="68" cy="52" rx="7.2" ry="11" fill="#E2E8F0" opacity="0.14" />
        <path d="M18 24 Q49 14 83 22" stroke="#E2E8F0" strokeWidth="0.82" opacity="0.62" fill="none" />
        <path d="M25 46 Q49 41 73 48" stroke="#CBD5E1" strokeWidth="0.65" opacity="0.22" fill="none" />
        {fluid ? (
          <>
            <path
              d="M46 43 Q56 39 60 45 Q59 54 49 58 Q43 53 46 43Z"
              fill="#02060B"
              opacity="0.96"
              stroke="#A5F3FC"
              strokeWidth="0.45"
              strokeOpacity="0.28"
            />
            <path d="M46 42 Q55 38 61 45" stroke="#CFFAFE" strokeWidth="0.55" opacity="0.34" fill="none" />
          </>
        ) : null}
      </g>
    </UltrasoundCanvas>
  );
}

function PelvicFastScan({ fluid }: { fluid: boolean }) {
  return (
    <UltrasoundCanvas scanId={`pelvis-${fluid ? "fluid" : "normal"}`} badge="PELV" orientationChip="PELV" depthLabels={["4", "8", "12", "16", "20"]}>
      <ellipse cx="50" cy="44" rx="28" ry="16" fill="#57616A" opacity="0.24" />
      <path d="M31 35 Q50 27 69 35 Q74 48 66 68 Q52 78 36 69 Q27 52 31 35Z" fill="#48515A" opacity="0.46" />
      <path
        d="M38 44 Q50 40 62 44 Q65 58 57 68 Q50 72 43 68 Q35 58 38 44Z"
        fill="#060A10"
        opacity="0.96"
        stroke="#CBD5E1"
        strokeWidth="0.8"
        strokeOpacity="0.56"
      />
      <ellipse cx="50" cy="56" rx="8" ry="11.8" fill="#081019" opacity="0.54" />
      <path d="M34 42 Q50 35 66 42" stroke="#E2E8F0" strokeWidth="0.55" opacity="0.18" fill="none" />
      {fluid ? (
        <>
          <path
            d="M29 31 Q50 24 71 31 Q69 39 61 44 Q50 47 39 44 Q31 39 29 31Z"
            fill="#02060A"
            opacity="0.95"
            stroke="#A5F3FC"
            strokeWidth="0.45"
            strokeOpacity="0.3"
          />
          <path d="M33 33 Q50 28 67 33" stroke="#CFFAFE" strokeWidth="0.55" opacity="0.28" fill="none" />
        </>
      ) : null}
    </UltrasoundCanvas>
  );
}

function LungScan({ variant }: { variant: "normal" | "pneumothorax" | "hemothorax" }) {
  const pleuralLineOpacity = variant === "pneumothorax" ? 0.92 : 0.82;
  const aLineOpacity = variant === "pneumothorax" ? 0.28 : 0.16;

  return (
    <UltrasoundCanvas
      scanId={`lung-${variant}`}
      badge="EFAST"
      orientationChip={variant === "hemothorax" ? "BASE" : "ANT"}
      depthLabels={["2", "4", "6", "8", "10"]}
      beamShape="linear"
    >
      <path d="M22 14 Q27 23 24 38" stroke="#010408" strokeWidth="8" opacity="0.95" strokeLinecap="round" />
      <path d="M48 14 Q53 23 50 38" stroke="#010408" strokeWidth="8" opacity="0.95" strokeLinecap="round" />
      <path d="M74 14 Q79 23 76 38" stroke="#010408" strokeWidth="8" opacity="0.95" strokeLinecap="round" />
      <path d="M18 28 H82" stroke="#E2E8F0" strokeWidth="1.1" opacity={pleuralLineOpacity} />
      {[42, 54, 66].map((y, index) => (
        <path key={`aline-${variant}-${index}`} d={`M16 ${y} H84`} stroke="#CBD5E1" strokeWidth="0.7" opacity={aLineOpacity} />
      ))}

      {variant === "normal" ? (
        <>
          <path d="M30 28 L27 80" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.26" />
          <path d="M56 28 L59 80" stroke="#E2E8F0" strokeWidth="1.1" opacity="0.22" />
          <path d="M18 30 H82" stroke="#A5F3FC" strokeWidth="0.6" opacity="0.24" strokeDasharray="2 2" />
        </>
      ) : null}

      {variant === "pneumothorax" ? (
        <>
          <path d="M18 28 H82" stroke="#CFFAFE" strokeWidth="0.5" opacity="0.16" strokeDasharray="1.4 1.4" />
          <path d="M22 34 H78" stroke="#02060A" strokeWidth="1.5" opacity="0.24" />
        </>
      ) : null}

      {variant === "hemothorax" ? (
        <>
          <path d="M18 66 Q50 58 82 66" stroke="#E2E8F0" strokeWidth="0.9" opacity="0.66" fill="none" />
          <path
            d="M20 48 Q50 42 80 48 L80 66 Q50 58 20 66 Z"
            fill="#03080C"
            opacity="0.96"
            stroke="#A5F3FC"
            strokeWidth="0.45"
            strokeOpacity="0.26"
          />
          <path d="M29 39 Q44 32 58 40 Q54 48 43 50 Q33 48 29 39Z" fill="#72808A" opacity="0.46" />
        </>
      ) : null}
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
        orientationChip: "LONG",
        depthLabels: ["3", "6", "9", "12", "15"],
        referenceSignals: [
          { label: "miometrio", x: 18, y: 44, targetX: 26, targetY: 59 },
          { label: "saco", x: 69, y: 42, targetX: 58, targetY: 57 },
        ],
        caseSignals: [
          { label: "saco", x: 68, y: 40, targetX: 58, targetY: 57 },
          { label: "polo", x: 62, y: 28, targetX: 56, targetY: 48, tone: "focus" },
        ],
        microLegend: ["Anecoico", "Miometrio", "Polo fetal", "Borde regular"],
      } satisfies ViewerVisuals;
    case "ob_breech":
      return {
        referencePreset: "ob_cephalic" as RenderPreset,
        casePreset: "ob_breech" as RenderPreset,
        referenceTitle: "Referencia con presentacion cefalica",
        caseTitle: "Caso con eje fetal invertido",
        orientationChip: "LONG",
        depthLabels: ["4", "8", "12", "16", "20"],
        referenceSignals: [
          { label: "cabeza", x: 62, y: 76, targetX: 52, targetY: 68 },
          { label: "tronco", x: 22, y: 47, targetX: 44, targetY: 52 },
        ],
        caseSignals: [
          { label: "cabeza", x: 64, y: 20, targetX: 56, targetY: 32, tone: "focus" },
          { label: "pelvis", x: 21, y: 72, targetX: 51, targetY: 72 },
        ],
        microLegend: ["Orientacion fetal", "Cabeza", "Pelvis", "Eje longitudinal"],
      } satisfies ViewerVisuals;
    case "cardiac_pericardial_effusion":
      return {
        referencePreset: "cardiac_normal" as RenderPreset,
        casePreset: "cardiac_effusion" as RenderPreset,
        referenceTitle: "Ventana cardiaca sin liquido libre",
        caseTitle: "Caso con halo anecoico pericardico",
        orientationChip: "S4C",
        depthLabels: ["4", "8", "12", "16", "20"],
        referenceSignals: [
          { label: "VI", x: 26, y: 67, targetX: 47, targetY: 53 },
          { label: "VD", x: 14, y: 38, targetX: 37, targetY: 45 },
          { label: "pericardio", x: 62, y: 26, targetX: 64, targetY: 34 },
        ],
        caseSignals: [
          { label: "VI", x: 24, y: 67, targetX: 47, targetY: 53 },
          { label: "borde", x: 62, y: 21, targetX: 67, targetY: 37 },
          { label: "espacio libre", x: 18, y: 28, targetX: 28, targetY: 47, tone: "focus" },
        ],
        microLegend: ["Cavidad", "Pericardio", "Espacio anecoico", "Contorno cardiaco"],
      } satisfies ViewerVisuals;
    case "cardiac_low_ejection_fraction":
      return {
        referencePreset: "cardiac_normal" as RenderPreset,
        casePreset: "cardiac_low_ef" as RenderPreset,
        referenceTitle: "Contractilidad de referencia",
        caseTitle: "Caso con cavidad amplia y baja contraccion",
        orientationChip: "PLAX",
        depthLabels: ["4", "8", "12", "16", "20"],
        referenceSignals: [
          { label: "VI", x: 27, y: 68, targetX: 47, targetY: 53 },
          { label: "contractilidad", x: 60, y: 20, targetX: 50, targetY: 45 },
        ],
        caseSignals: [
          { label: "VI amplio", x: 62, y: 27, targetX: 47, targetY: 52, tone: "focus" },
          { label: "poco cambio", x: 20, y: 72, targetX: 52, targetY: 58 },
        ],
        microLegend: ["Cavidad", "Contraccion", "Diametro", "Hipocinesia"],
      } satisfies ViewerVisuals;
    case "renal_hydronephrosis":
      return {
        referencePreset: "renal_normal" as RenderPreset,
        casePreset: "renal_hydronephrosis" as RenderPreset,
        referenceTitle: "Seno renal sin dilatacion",
        caseTitle: "Caso con pelvis y calices dilatados",
        orientationChip: "LONG",
        depthLabels: ["2", "4", "6", "8", "10"],
        referenceSignals: [
          { label: "corteza", x: 16, y: 34, targetX: 38, targetY: 42 },
          { label: "seno", x: 64, y: 42, targetX: 52, targetY: 49 },
        ],
        caseSignals: [
          { label: "pelvis", x: 62, y: 34, targetX: 52, targetY: 48, tone: "focus" },
          { label: "calices", x: 22, y: 64, targetX: 48, targetY: 56 },
        ],
        microLegend: ["Corteza", "Seno renal", "Zona anecoica", "Dilatacion"],
      } satisfies ViewerVisuals;
    case "biliary_cholelithiasis":
      return {
        referencePreset: "biliary_normal" as RenderPreset,
        casePreset: "biliary_stones" as RenderPreset,
        referenceTitle: "Vesicula sin ecos dependientes",
        caseTitle: "Caso con calculos y sombra posterior",
        orientationChip: "OBL",
        depthLabels: ["2", "4", "6", "8", "10"],
        referenceSignals: [
          { label: "vesicula", x: 19, y: 33, targetX: 54, targetY: 46 },
          { label: "higado", x: 18, y: 56, targetX: 32, targetY: 39 },
        ],
        caseSignals: [
          { label: "eco brillante", x: 62, y: 36, targetX: 54, targetY: 50, tone: "focus" },
          { label: "sombra", x: 66, y: 72, targetX: 49, targetY: 66 },
        ],
        microLegend: ["Luz vesicular", "Eco brillante", "Sombra", "Parenquima"],
      } satisfies ViewerVisuals;
    case "fast_ruq_free_fluid":
      return {
        referencePreset: "fast_ruq_normal" as RenderPreset,
        casePreset: "fast_ruq_fluid" as RenderPreset,
        referenceTitle: "Ventana hepatorrenal sin liquido libre",
        caseTitle: "Caso con coleccion anecoica en Morrison",
        orientationChip: "RUQ",
        depthLabels: ["4", "8", "12", "16", "20"],
        referenceSignals: [
          { label: "higado", x: 18, y: 28, targetX: 32, targetY: 36 },
          { label: "rinon", x: 62, y: 46, targetX: 68, targetY: 52 },
          { label: "morrison", x: 60, y: 26, targetX: 53, targetY: 44 },
        ],
        caseSignals: [
          { label: "higado", x: 18, y: 28, targetX: 32, targetY: 36 },
          { label: "liquido", x: 60, y: 25, targetX: 52, targetY: 47, tone: "focus" },
          { label: "rinon", x: 63, y: 48, targetX: 68, targetY: 52 },
        ],
        microLegend: ["Higado", "Rinon", "Morrison", "Liquido libre"],
      } satisfies ViewerVisuals;
    case "fast_luq_free_fluid":
      return {
        referencePreset: "fast_luq_normal" as RenderPreset,
        casePreset: "fast_luq_fluid" as RenderPreset,
        referenceTitle: "Ventana esplenorrenal sin separacion",
        caseTitle: "Caso con liquido en cuadrante superior izquierdo",
        orientationChip: "LUQ",
        depthLabels: ["4", "8", "12", "16", "20"],
        referenceSignals: [
          { label: "bazo", x: 20, y: 27, targetX: 34, targetY: 36 },
          { label: "rinon", x: 60, y: 46, targetX: 68, targetY: 52 },
          { label: "receso", x: 61, y: 26, targetX: 53, targetY: 44 },
        ],
        caseSignals: [
          { label: "bazo", x: 20, y: 27, targetX: 34, targetY: 36 },
          { label: "liquido", x: 60, y: 26, targetX: 52, targetY: 47, tone: "focus" },
          { label: "rinon", x: 62, y: 48, targetX: 68, targetY: 52 },
        ],
        microLegend: ["Bazo", "Rinon", "Espacio esplenorrenal", "Liquido libre"],
      } satisfies ViewerVisuals;
    case "fast_pelvis_free_fluid":
      return {
        referencePreset: "fast_pelvis_normal" as RenderPreset,
        casePreset: "fast_pelvis_fluid" as RenderPreset,
        referenceTitle: "Pelvis con vejiga sin liquido perivesical",
        caseTitle: "Caso con coleccion dependiente en fondo de saco",
        orientationChip: "PELV",
        depthLabels: ["4", "8", "12", "16", "20"],
        referenceSignals: [
          { label: "vejiga", x: 60, y: 45, targetX: 50, targetY: 52 },
          { label: "pelvis", x: 16, y: 34, targetX: 39, targetY: 42 },
        ],
        caseSignals: [
          { label: "vejiga", x: 60, y: 48, targetX: 50, targetY: 52 },
          { label: "liquido", x: 46, y: 18, targetX: 50, targetY: 33, tone: "focus" },
          { label: "fondo", x: 18, y: 28, targetX: 39, targetY: 39 },
        ],
        microLegend: ["Vejiga", "Fondo de saco", "Coleccion", "Dependiente"],
      } satisfies ViewerVisuals;
    case "fast_pericardial_effusion":
      return {
        referencePreset: "cardiac_normal" as RenderPreset,
        casePreset: "cardiac_effusion" as RenderPreset,
        referenceTitle: "Subxifoidea sin liquido pericardico",
        caseTitle: "Caso con hemopericardio probable",
        orientationChip: "SUBX",
        depthLabels: ["4", "8", "12", "16", "20"],
        referenceSignals: [
          { label: "corazon", x: 22, y: 68, targetX: 47, targetY: 53 },
          { label: "pericardio", x: 61, y: 25, targetX: 64, targetY: 34 },
        ],
        caseSignals: [
          { label: "corazon", x: 22, y: 68, targetX: 47, targetY: 53 },
          { label: "halo", x: 61, y: 23, targetX: 67, targetY: 37, tone: "focus" },
          { label: "subxifoidea", x: 14, y: 31, targetX: 31, targetY: 45 },
        ],
        microLegend: ["Subxifoidea", "Pericardio", "Halo anecoico", "Trauma"],
      } satisfies ViewerVisuals;
    case "efast_pneumothorax":
      return {
        referencePreset: "lung_normal" as RenderPreset,
        casePreset: "lung_pneumothorax" as RenderPreset,
        referenceTitle: "Pleura anterior con sliding conservado",
        caseTitle: "Caso con linea pleural fija",
        orientationChip: "ANT",
        depthLabels: ["2", "4", "6", "8", "10"],
        referenceSignals: [
          { label: "pleura", x: 56, y: 18, targetX: 50, targetY: 28 },
          { label: "b-lines", x: 16, y: 56, targetX: 30, targetY: 55 },
        ],
        caseSignals: [
          { label: "pleura fija", x: 54, y: 17, targetX: 50, targetY: 28, tone: "focus" },
          { label: "a-lines", x: 60, y: 48, targetX: 58, targetY: 54 },
          { label: "sin sliding", x: 18, y: 34, targetX: 36, targetY: 28 },
        ],
        microLegend: ["Pleura", "Sliding", "Lineas A", "Neumotorax"],
      } satisfies ViewerVisuals;
    case "efast_hemothorax":
      return {
        referencePreset: "lung_normal" as RenderPreset,
        casePreset: "lung_hemothorax" as RenderPreset,
        referenceTitle: "Pleura basal sin coleccion dependiente",
        caseTitle: "Caso con liquido pleural traumatico",
        orientationChip: "BASE",
        depthLabels: ["2", "4", "6", "8", "10"],
        referenceSignals: [
          { label: "pleura", x: 56, y: 18, targetX: 50, targetY: 28 },
          { label: "diafragma", x: 17, y: 65, targetX: 34, targetY: 66 },
        ],
        caseSignals: [
          { label: "diafragma", x: 18, y: 72, targetX: 34, targetY: 66 },
          { label: "coleccion", x: 58, y: 52, targetX: 52, targetY: 56, tone: "focus" },
          { label: "pulmon", x: 23, y: 34, targetX: 42, targetY: 40 },
        ],
        microLegend: ["Pleura", "Diafragma", "Coleccion", "Hemotorax"],
      } satisfies ViewerVisuals;
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
    case "fast_ruq_normal":
      return <FastQuadrantScan side="ruq" fluid={false} />;
    case "fast_ruq_fluid":
      return <FastQuadrantScan side="ruq" fluid />;
    case "fast_luq_normal":
      return <FastQuadrantScan side="luq" fluid={false} />;
    case "fast_luq_fluid":
      return <FastQuadrantScan side="luq" fluid />;
    case "fast_pelvis_normal":
      return <PelvicFastScan fluid={false} />;
    case "fast_pelvis_fluid":
      return <PelvicFastScan fluid />;
    case "lung_normal":
      return <LungScan variant="normal" />;
    case "lung_pneumothorax":
      return <LungScan variant="pneumothorax" />;
    case "lung_hemothorax":
      return <LungScan variant="hemothorax" />;
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
      <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:14px_14px]" />

      <div className="relative flex flex-col gap-3 border-b border-white/10 bg-black/20 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Visor clínico</div>
            <div className="mt-1 text-lg font-semibold text-white">{caseSet.title}</div>
          </div>
          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/72">
            Zoom {Math.round(zoom * 100)}%
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetaChip label="Esquema ecografico educativo" tone="cyan" />
          <MetaChip label={ultrasoundCategoryLabel(caseSet.category)} />
          <MetaChip label={ultrasoundProbeLabel(caseSet.probe)} />
          <MetaChip label={ultrasoundDifficultyLabel(caseSet.difficulty)} tone="amber" />
          <MetaChip label={caseSet.scanPlane} />
          {showHighlights ? <MetaChip label="Revisión interactiva activa" tone="cyan" /> : null}
        </div>
      </div>

      <div className="relative grid gap-4 p-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-black/25 p-3">
            <FrameLabel title="Referencia" subtitle={visuals.referenceTitle} />
            <div className="relative aspect-[0.96] overflow-hidden rounded-[20px] border border-white/10 bg-[#091019] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(148,163,184,0.08),transparent_35%)]" />
              <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/68">
                referencia limpia
              </div>
              <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
                {renderPreset(visuals.referencePreset)}
              </div>
              <SignalOverlay signals={visuals.referenceSignals} visible={showHighlights} />
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/68">
              Compara anatomia, ecos, zonas anecoicas y continuidad de bordes.
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Microlectura</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {visuals.microLegend.map((item) => (
                <span key={item} className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-50/90">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 text-sm leading-6 text-white/68">
              Usa la referencia como control visual y describe que cambia en ecogenicidad, contorno y profundidad.
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-cyan-400/15 bg-black/25 p-3">
          <FrameLabel title="Caso actual" subtitle={visuals.caseTitle} />
          <div className="relative aspect-[1.04] overflow-hidden rounded-[20px] border border-cyan-400/15 bg-[#091019] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_70%_75%,rgba(248,113,113,0.10),transparent_34%)]" />
            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/15 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100">
                caso activo
              </span>
              <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/65">
                {caseSet.patientProfile.chiefComplaint}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
              {renderPreset(visuals.casePreset)}
            </div>
            <SignalOverlay signals={visuals.caseSignals} visible={showHighlights} />
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

      <div className="relative grid gap-4 border-t border-white/10 bg-black/20 p-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Señales que debes comparar</div>
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
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/68">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Guia visual</div>
          <div className="mt-2 leading-6">
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

          <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs leading-5 text-white/60">
            Preparado para evolucionar a assets reales: el layout ya prioriza la imagen principal y deja la referencia como apoyo visual.
          </div>
        </div>
      </div>
    </div>
  );
}
