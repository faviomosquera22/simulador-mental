"use client";

import { useMemo } from "react";
import type { ClinicalImageCase } from "@/src/lib/clinicalImagesModule";

type ClinicalImageViewerProps = {
  caseSet: ClinicalImageCase;
  zoom: number;
  showHighlights: boolean;
};

type RenderPreset =
  | "cxr_normal"
  | "cxr_pneumonia"
  | "cxr_pulmonary_edema"
  | "cxr_pleural_effusion"
  | "cxr_pneumothorax"
  | "fracture_radius_normal"
  | "fracture_radius"
  | "fracture_clavicle_normal"
  | "fracture_clavicle"
  | "fracture_ankle_normal"
  | "fracture_ankle"
  | "skin_normal"
  | "skin_zoster"
  | "skin_cellulitis"
  | "pressure_ulcer_stage_2"
  | "pressure_ulcer_stage_4"
  | "wound_clean"
  | "wound_infected"
  | "burn_normal"
  | "burn_partial"
  | "burn_deep"
  | "dipstick_normal"
  | "dipstick_uti"
  | "dipstick_ketosis";

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

function ChestXray({ variant }: { variant: "normal" | "pneumonia" | "edema" | "effusion" | "pneumothorax" }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id={`lungGrad-${variant}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#EEF4F8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#D8E3EE" stopOpacity="0.78" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="#0A1018" />
      <rect x="28" y="8" width="44" height="84" rx="20" fill="#0F1824" stroke="#304053" strokeWidth="1.2" />
      <ellipse cx="40" cy="48" rx="13" ry="27" fill={`url(#lungGrad-${variant})`} />
      <ellipse cx="60" cy="48" rx="13" ry="27" fill={`url(#lungGrad-${variant})`} />
      <rect x="47.3" y="8" width="5.4" height="80" fill="#162230" />
      <rect x="45.7" y="12" width="8.6" height="8.5" rx="3" fill="#B9C7D3" opacity="0.88" />
      <line x1="50" y1="22" x2="50" y2="82" stroke="#233243" strokeWidth="0.7" strokeDasharray="2 2" />
      <text x="32" y="18" fontSize="4" fill="#8CA0B3">Pulmón</text>
      <text x="58" y="18" fontSize="4" fill="#8CA0B3">Pulmón</text>
      {variant === "pneumonia" && <ellipse cx="66" cy="68" rx="12" ry="10" fill="#F2F5F7" opacity="0.82" />}
      {variant === "edema" && (
        <>
          <ellipse cx="43" cy="48" rx="12" ry="14" fill="#F5F7F8" opacity="0.76" />
          <ellipse cx="57" cy="48" rx="12" ry="14" fill="#F5F7F8" opacity="0.76" />
          <ellipse cx="50" cy="43" rx="16" ry="10" fill="#EDF2F7" opacity="0.56" />
        </>
      )}
      {variant === "effusion" && <path d="M24 75 Q40 63 49 76 L49 90 L24 90 Z" fill="#F4F7F8" opacity="0.7" />}
      {variant === "pneumothorax" && (
        <>
          <path d="M71 18 L71 78" stroke="#E4EDF2" strokeWidth="1.2" opacity="0.9" />
          <rect x="72" y="18" width="16" height="60" fill="#121B26" />
        </>
      )}
      <rect x="10" y="12" width="10" height="6" rx="2" fill="#09131C" stroke="#203244" strokeWidth="0.7" />
      <text x="13" y="16.2" fontSize="3.6" fill="#B5C4D0">AP</text>
    </svg>
  );
}

function FractureView({ part, fractured }: { part: "radius" | "clavicle" | "ankle"; fractured: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0B1118" />
      <rect x="18" y="16" width="64" height="68" rx="8" fill="#101723" stroke="#2F4152" strokeWidth="1.1" />
      {part === "radius" && (
        <>
          <text x="25" y="24" fontSize="4" fill="#9CB0C0">Muñeca</text>
          <line x1="36" y1="22" x2="52" y2="80" stroke="#E6EBEF" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="58" y1="22" x2="68" y2="78" stroke="#E6EBEF" strokeWidth="4.5" strokeLinecap="round" opacity="0.92" />
          {fractured && <line x1="48" y1="64" x2="58" y2="58" stroke="#F87171" strokeWidth="2.2" />}
        </>
      )}
      {part === "clavicle" && (
        <>
          <text x="23" y="24" fontSize="4" fill="#9CB0C0">Clavícula</text>
          <path d="M22 36 Q38 30 46 34 T72 33" stroke="#E6EBEF" strokeWidth="5" fill="none" strokeLinecap="round" />
          {fractured && <line x1="48" y1="33" x2="53" y2="39" stroke="#F87171" strokeWidth="2.2" />}
        </>
      )}
      {part === "ankle" && (
        <>
          <text x="25" y="24" fontSize="4" fill="#9CB0C0">Tobillo</text>
          <line x1="40" y1="18" x2="40" y2="74" stroke="#E6EBEF" strokeWidth="6" strokeLinecap="round" />
          <line x1="55" y1="24" x2="55" y2="79" stroke="#E6EBEF" strokeWidth="4.8" strokeLinecap="round" />
          <path d="M40 75 Q47 84 56 79" stroke="#E6EBEF" strokeWidth="5" fill="none" strokeLinecap="round" />
          {fractured && <line x1="55" y1="63" x2="61" y2="67" stroke="#F87171" strokeWidth="2.2" />}
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
  lesion: "none" | "zoster" | "cellulitis" | "ulcer2" | "ulcer4" | "infected" | "burnPartial" | "burnDeep";
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0B1017" />
      <rect x="16" y="14" width="68" height="72" rx="12" fill={tone === "burn" ? "#D9A066" : "#DAB38C"} />
      <text x="22" y="24" fontSize="4" fill="#6A4A36">Superficie</text>
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

function Dipstick({ variant }: { variant: "normal" | "uti" | "ketosis" }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#0A1118" />
      <rect x="43" y="12" width="14" height="76" rx="6" fill="#E8DFD2" />
      {[
        variant === "normal" ? "#CFD8A5" : variant === "uti" ? "#BAE17F" : "#D6C96A",
        variant === "normal" ? "#BDC88B" : variant === "uti" ? "#3F7D3C" : "#7A5A1C",
        variant === "normal" ? "#C8D1A0" : variant === "uti" ? "#568A36" : "#8F4A32",
        variant === "normal" ? "#D9D2A6" : variant === "uti" ? "#E6D88C" : "#5B3EA8",
      ].map((color, index) => (
        <rect key={color + index} x="45" y={20 + index * 14} width="10" height="9" rx="2" fill={color} />
      ))}
      <text x="16" y="18" fontSize="4" fill="#91A4B2">Tira reactiva</text>
      {variant !== "normal" && <rect x="30" y="18" width="8" height="12" rx="2" fill={variant === "uti" ? "#1E5B2B" : "#8E6B1D"} opacity="0.9" />}
      {variant !== "normal" && <rect x="62" y="46" width="8" height="12" rx="2" fill={variant === "uti" ? "#286F36" : "#5B3EA8"} opacity="0.9" />}
    </svg>
  );
}

function resolveVisuals(caseSet: ClinicalImageCase) {
  switch (caseSet.imagePreset) {
    case "cxr_pneumonia":
      return {
        referencePreset: "cxr_normal" as RenderPreset,
        casePreset: "cxr_pneumonia" as RenderPreset,
        referenceTitle: "Patrón pulmonar sin opacidad focal",
        caseTitle: "Caso con consolidación focal",
      };
    case "cxr_pulmonary_edema":
      return {
        referencePreset: "cxr_normal" as RenderPreset,
        casePreset: "cxr_pulmonary_edema" as RenderPreset,
        referenceTitle: "Transparencia pulmonar de referencia",
        caseTitle: "Caso con infiltrado bilateral",
      };
    case "cxr_pleural_effusion":
      return {
        referencePreset: "cxr_normal" as RenderPreset,
        casePreset: "cxr_pleural_effusion" as RenderPreset,
        referenceTitle: "Ángulos costofrénicos libres",
        caseTitle: "Caso con menisco pleural",
      };
    case "cxr_pneumothorax":
      return {
        referencePreset: "cxr_normal" as RenderPreset,
        casePreset: "cxr_pneumothorax" as RenderPreset,
        referenceTitle: "Trama pulmonar visible hasta la periferia",
        caseTitle: "Caso con línea pleural y hiperclaridad",
      };
    case "fracture_radius":
      return {
        referencePreset: "fracture_radius_normal" as RenderPreset,
        casePreset: "fracture_radius" as RenderPreset,
        referenceTitle: "Cortical continua",
        caseTitle: "Caso con trazo de fractura",
      };
    case "fracture_clavicle":
      return {
        referencePreset: "fracture_clavicle_normal" as RenderPreset,
        casePreset: "fracture_clavicle" as RenderPreset,
        referenceTitle: "Clavícula íntegra",
        caseTitle: "Caso con discontinuidad ósea",
      };
    case "fracture_ankle":
      return {
        referencePreset: "fracture_ankle_normal" as RenderPreset,
        casePreset: "fracture_ankle" as RenderPreset,
        referenceTitle: "Alineación de tobillo conservada",
        caseTitle: "Caso con interrupción cortical",
      };
    case "skin_zoster":
      return {
        referencePreset: "skin_normal" as RenderPreset,
        casePreset: "skin_zoster" as RenderPreset,
        referenceTitle: "Piel sin lesión activa",
        caseTitle: "Caso con vesículas agrupadas",
      };
    case "skin_cellulitis":
      return {
        referencePreset: "skin_normal" as RenderPreset,
        casePreset: "skin_cellulitis" as RenderPreset,
        referenceTitle: "Piel sin eritema extenso",
        caseTitle: "Caso con eritema difuso",
      };
    case "pressure_ulcer_stage_2":
      return {
        referencePreset: "skin_normal" as RenderPreset,
        casePreset: "pressure_ulcer_stage_2" as RenderPreset,
        referenceTitle: "Superficie cutánea íntegra",
        caseTitle: "Caso con úlcera superficial",
      };
    case "pressure_ulcer_stage_4":
      return {
        referencePreset: "skin_normal" as RenderPreset,
        casePreset: "pressure_ulcer_stage_4" as RenderPreset,
        referenceTitle: "Superficie cutánea íntegra",
        caseTitle: "Caso con úlcera profunda",
      };
    case "wound_infected":
      return {
        referencePreset: "wound_clean" as RenderPreset,
        casePreset: "wound_infected" as RenderPreset,
        referenceTitle: "Herida sin signos de infección",
        caseTitle: "Caso con exudado y bordes inflamados",
      };
    case "burn_partial":
      return {
        referencePreset: "burn_normal" as RenderPreset,
        casePreset: "burn_partial" as RenderPreset,
        referenceTitle: "Piel sin quemadura",
        caseTitle: "Caso con quemadura parcial",
      };
    case "burn_deep":
      return {
        referencePreset: "burn_normal" as RenderPreset,
        casePreset: "burn_deep" as RenderPreset,
        referenceTitle: "Piel sin quemadura",
        caseTitle: "Caso con compromiso profundo",
      };
    case "dipstick_uti":
      return {
        referencePreset: "dipstick_normal" as RenderPreset,
        casePreset: "dipstick_uti" as RenderPreset,
        referenceTitle: "Tira reactiva de referencia",
        caseTitle: "Caso con patrón compatible con infección",
      };
    case "dipstick_ketosis":
      return {
        referencePreset: "dipstick_normal" as RenderPreset,
        casePreset: "dipstick_ketosis" as RenderPreset,
        referenceTitle: "Tira reactiva de referencia",
        caseTitle: "Caso con cetonas destacadas",
      };
  }
}

function renderPreset(preset: RenderPreset) {
  switch (preset) {
    case "cxr_normal":
      return <ChestXray variant="normal" />;
    case "cxr_pneumonia":
      return <ChestXray variant="pneumonia" />;
    case "cxr_pulmonary_edema":
      return <ChestXray variant="edema" />;
    case "cxr_pleural_effusion":
      return <ChestXray variant="effusion" />;
    case "cxr_pneumothorax":
      return <ChestXray variant="pneumothorax" />;
    case "fracture_radius_normal":
      return <FractureView part="radius" fractured={false} />;
    case "fracture_radius":
      return <FractureView part="radius" fractured={true} />;
    case "fracture_clavicle_normal":
      return <FractureView part="clavicle" fractured={false} />;
    case "fracture_clavicle":
      return <FractureView part="clavicle" fractured={true} />;
    case "fracture_ankle_normal":
      return <FractureView part="ankle" fractured={false} />;
    case "fracture_ankle":
      return <FractureView part="ankle" fractured={true} />;
    case "skin_normal":
      return <SkinOrWound tone="skin" lesion="none" />;
    case "skin_zoster":
      return <SkinOrWound tone="skin" lesion="zoster" />;
    case "skin_cellulitis":
      return <SkinOrWound tone="skin" lesion="cellulitis" />;
    case "pressure_ulcer_stage_2":
      return <SkinOrWound tone="ulcer" lesion="ulcer2" />;
    case "pressure_ulcer_stage_4":
      return <SkinOrWound tone="ulcer" lesion="ulcer4" />;
    case "wound_clean":
      return <SkinOrWound tone="wound" lesion="none" />;
    case "wound_infected":
      return <SkinOrWound tone="wound" lesion="infected" />;
    case "burn_normal":
      return <SkinOrWound tone="burn" lesion="none" />;
    case "burn_partial":
      return <SkinOrWound tone="burn" lesion="burnPartial" />;
    case "burn_deep":
      return <SkinOrWound tone="burn" lesion="burnDeep" />;
    case "dipstick_normal":
      return <Dipstick variant="normal" />;
    case "dipstick_uti":
      return <Dipstick variant="uti" />;
    case "dipstick_ketosis":
      return <Dipstick variant="ketosis" />;
  }
}

export default function ClinicalImageViewer(props: ClinicalImageViewerProps) {
  const { caseSet, zoom, showHighlights } = props;

  const visuals = useMemo(() => resolveVisuals(caseSet), [caseSet]);
  const comparisonHints = useMemo(() => caseSet.keyFindings.slice(0, 3), [caseSet.keyFindings]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050A11]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(248,113,113,0.10),transparent_34%)]" />
      <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] text-white/72">
        Zoom {Math.round(zoom * 100)}%
      </div>
      <div className="absolute left-4 top-4 z-10 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100">
        Esquema educativo
      </div>

      <div className="relative grid gap-4 p-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-black/25 p-3">
          <FrameLabel title="Referencia" subtitle={visuals.referenceTitle} />
          <div className="relative aspect-square overflow-hidden rounded-[20px] border border-white/10 bg-[#091019] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
              {renderPreset(visuals.referencePreset)}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-cyan-400/15 bg-black/25 p-3">
          <FrameLabel title="Caso actual" subtitle={visuals.caseTitle} />
          <div className="relative aspect-square overflow-hidden rounded-[20px] border border-cyan-400/15 bg-[#091019] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
              {renderPreset(visuals.casePreset)}
            </div>
            <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
              {caseSet.highlightRegions.map((region) => (
                <RectHighlight key={`${region.label}-${region.x}-${region.y}`} region={region} visible={showHighlights} />
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div className="relative grid gap-3 border-t border-white/10 bg-black/20 p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Qué debes comparar</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {comparisonHints.map((hint) => (
              <span key={hint} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/78">
                {hint}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/68">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Guía visual</div>
          <div className="mt-2">
            {showHighlights ? caseSet.feedback.highlightHint : "Compara la referencia con el caso y decide cuál es el hallazgo dominante."}
          </div>
        </div>
      </div>
    </div>
  );
}
