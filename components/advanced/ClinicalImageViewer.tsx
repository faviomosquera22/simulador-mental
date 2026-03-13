"use client";

import { useMemo } from "react";
import type { ClinicalImageCase } from "@/src/lib/clinicalImagesModule";

type ClinicalImageViewerProps = {
  caseSet: ClinicalImageCase;
  zoom: number;
  showHighlights: boolean;
};

function RectHighlight({
  region,
  visible,
}: {
  region: ClinicalImageCase["highlightRegions"][number];
  visible: boolean;
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
        fill="rgba(34,211,238,0.08)"
        stroke="rgba(125,211,252,0.95)"
        strokeWidth="1.4"
        strokeDasharray="4 3"
      />
      <text x={region.x} y={Math.max(8, region.y - 2)} fill="rgba(186,230,253,0.95)" fontSize="4.2">
        {region.label}
      </text>
    </>
  );
}

function ChestXray({ variant }: { variant: "pneumonia" | "edema" | "effusion" | "pneumothorax" }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0A1018" />
      <rect x="28" y="8" width="44" height="84" rx="20" fill="#0F1824" stroke="#304053" strokeWidth="1.2" />
      <ellipse cx="40" cy="48" rx="13" ry="27" fill="#D9E3EC" opacity="0.86" />
      <ellipse cx="60" cy="48" rx="13" ry="27" fill="#D9E3EC" opacity="0.86" />
      <rect x="47.3" y="8" width="5.4" height="80" fill="#162230" />
      <rect x="45.7" y="12" width="8.6" height="8.5" rx="3" fill="#B9C7D3" opacity="0.88" />
      {variant === "pneumonia" && <ellipse cx="66" cy="68" rx="12" ry="10" fill="#F2F5F7" opacity="0.78" />}
      {variant === "edema" && (
        <>
          <ellipse cx="43" cy="48" rx="12" ry="14" fill="#F5F7F8" opacity="0.7" />
          <ellipse cx="57" cy="48" rx="12" ry="14" fill="#F5F7F8" opacity="0.7" />
          <ellipse cx="50" cy="43" rx="16" ry="10" fill="#EDF2F7" opacity="0.5" />
        </>
      )}
      {variant === "effusion" && <path d="M24 75 Q40 63 49 76 L49 90 L24 90 Z" fill="#F4F7F8" opacity="0.65" />}
      {variant === "pneumothorax" && (
        <>
          <path d="M71 18 L71 78" stroke="#E4EDF2" strokeWidth="1.2" opacity="0.9" />
          <rect x="72" y="18" width="16" height="60" fill="#121B26" />
        </>
      )}
    </svg>
  );
}

function FractureView({ part }: { part: "radius" | "clavicle" | "ankle" }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0B1118" />
      <rect x="18" y="16" width="64" height="68" rx="8" fill="#101723" stroke="#2F4152" strokeWidth="1.1" />
      {part === "radius" && (
        <>
          <line x1="36" y1="22" x2="52" y2="80" stroke="#E6EBEF" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="58" y1="22" x2="68" y2="78" stroke="#E6EBEF" strokeWidth="4.5" strokeLinecap="round" opacity="0.92" />
          <line x1="48" y1="64" x2="58" y2="58" stroke="#F87171" strokeWidth="2.2" />
        </>
      )}
      {part === "clavicle" && (
        <>
          <path d="M22 36 Q38 30 46 34 T72 33" stroke="#E6EBEF" strokeWidth="5" fill="none" strokeLinecap="round" />
          <line x1="48" y1="33" x2="53" y2="39" stroke="#F87171" strokeWidth="2.2" />
        </>
      )}
      {part === "ankle" && (
        <>
          <line x1="40" y1="18" x2="40" y2="74" stroke="#E6EBEF" strokeWidth="6" strokeLinecap="round" />
          <line x1="55" y1="24" x2="55" y2="79" stroke="#E6EBEF" strokeWidth="4.8" strokeLinecap="round" />
          <path d="M40 75 Q47 84 56 79" stroke="#E6EBEF" strokeWidth="5" fill="none" strokeLinecap="round" />
          <line x1="55" y1="63" x2="61" y2="67" stroke="#F87171" strokeWidth="2.2" />
        </>
      )}
    </svg>
  );
}

function SkinOrWound({
  tone,
  lesion,
}: {
  tone: "skin" | "ulcer" | "wound" | "burn";
  lesion: "zoster" | "cellulitis" | "ulcer2" | "ulcer4" | "infected" | "burnPartial" | "burnDeep";
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0B1017" />
      <rect x="16" y="14" width="68" height="72" rx="12" fill={tone === "burn" ? "#D9A066" : "#DAB38C"} />
      {lesion === "zoster" && (
        <>
          <circle cx="42" cy="42" r="5" fill="#BF1E2D" />
          <circle cx="49" cy="46" r="4" fill="#C52F3C" />
          <circle cx="56" cy="49" r="5" fill="#B81C2A" />
          <circle cx="62" cy="52" r="4" fill="#D64554" />
        </>
      )}
      {lesion === "cellulitis" && <ellipse cx="46" cy="52" rx="24" ry="18" fill="#C84B4B" opacity="0.9" />}
      {lesion === "ulcer2" && <ellipse cx="48" cy="48" rx="18" ry="12" fill="#F08E8E" />}
      {lesion === "ulcer4" && (
        <>
          <ellipse cx="48" cy="50" rx="20" ry="16" fill="#5A1B16" />
          <ellipse cx="48" cy="50" rx="10" ry="7" fill="#18110F" />
        </>
      )}
      {lesion === "infected" && (
        <>
          <ellipse cx="48" cy="50" rx="18" ry="10" fill="#A13C2D" />
          <ellipse cx="48" cy="50" rx="9" ry="4.8" fill="#F3D7A8" />
          <circle cx="58" cy="45" r="3" fill="#E6E2B7" />
        </>
      )}
      {lesion === "burnPartial" && (
        <>
          <ellipse cx="48" cy="46" rx="23" ry="15" fill="#D8573C" opacity="0.88" />
          <ellipse cx="54" cy="48" rx="10" ry="7" fill="#F0C7A5" opacity="0.84" />
        </>
      )}
      {lesion === "burnDeep" && (
        <>
          <ellipse cx="48" cy="46" rx="25" ry="17" fill="#7A2B1C" opacity="0.92" />
          <ellipse cx="45" cy="44" rx="11" ry="7" fill="#E2C39D" opacity="0.78" />
          <ellipse cx="58" cy="50" rx="7" ry="5" fill="#3B170F" opacity="0.88" />
        </>
      )}
    </svg>
  );
}

function Dipstick({ variant }: { variant: "uti" | "ketosis" }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0A1118" />
      <rect x="43" y="12" width="14" height="76" rx="6" fill="#E8DFD2" />
      {[
        variant === "uti" ? "#BAE17F" : "#D6C96A",
        variant === "uti" ? "#3F7D3C" : "#7A5A1C",
        variant === "uti" ? "#568A36" : "#8F4A32",
        variant === "uti" ? "#E6D88C" : "#5B3EA8",
      ].map((color, index) => (
        <rect key={color + index} x="45" y={20 + index * 14} width="10" height="9" rx="2" fill={color} />
      ))}
      <rect x="30" y="18" width="8" height="12" rx="2" fill={variant === "uti" ? "#1E5B2B" : "#8E6B1D"} opacity="0.9" />
      <rect x="62" y="46" width="8" height="12" rx="2" fill={variant === "uti" ? "#286F36" : "#5B3EA8"} opacity="0.9" />
    </svg>
  );
}

export default function ClinicalImageViewer(props: ClinicalImageViewerProps) {
  const { caseSet, zoom, showHighlights } = props;

  const imageNode = useMemo(() => {
    switch (caseSet.imagePreset) {
      case "cxr_pneumonia":
        return <ChestXray variant="pneumonia" />;
      case "cxr_pulmonary_edema":
        return <ChestXray variant="edema" />;
      case "cxr_pleural_effusion":
        return <ChestXray variant="effusion" />;
      case "cxr_pneumothorax":
        return <ChestXray variant="pneumothorax" />;
      case "fracture_radius":
        return <FractureView part="radius" />;
      case "fracture_clavicle":
        return <FractureView part="clavicle" />;
      case "fracture_ankle":
        return <FractureView part="ankle" />;
      case "skin_zoster":
        return <SkinOrWound tone="skin" lesion="zoster" />;
      case "skin_cellulitis":
        return <SkinOrWound tone="skin" lesion="cellulitis" />;
      case "pressure_ulcer_stage_2":
        return <SkinOrWound tone="ulcer" lesion="ulcer2" />;
      case "pressure_ulcer_stage_4":
        return <SkinOrWound tone="ulcer" lesion="ulcer4" />;
      case "wound_infected":
        return <SkinOrWound tone="wound" lesion="infected" />;
      case "burn_partial":
        return <SkinOrWound tone="burn" lesion="burnPartial" />;
      case "burn_deep":
        return <SkinOrWound tone="burn" lesion="burnDeep" />;
      case "dipstick_uti":
        return <Dipstick variant="uti" />;
      case "dipstick_ketosis":
        return <Dipstick variant="ketosis" />;
      default:
        return <div className="h-full w-full bg-[#0A1018]" />;
    }
  }, [caseSet.imagePreset]);

  return (
    <div className="relative h-full min-h-[380px] overflow-hidden rounded-[28px] border border-white/10 bg-[#050A11]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(248,113,113,0.10),transparent_34%)]" />
      <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/72">
        Zoom {Math.round(zoom * 100)}%
      </div>

      <div className="absolute inset-0 flex items-center justify-center overflow-auto p-6">
        <div
          className="relative aspect-square w-full max-w-[620px] rounded-[24px] border border-white/8 bg-black/25 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {imageNode}
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
            {caseSet.highlightRegions.map((region) => (
              <RectHighlight key={`${region.label}-${region.x}-${region.y}`} region={region} visible={showHighlights} />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
