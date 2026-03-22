"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ECG_CONDUCT_OPTIONS,
  ECG_LIBRARY,
  type ECGAdditionalLeadRequest,
  type ECGCase,
  type ECGClinicalContext,
  type ECGConductId,
  type ECGDecisionInput,
  type ECGDecisionStability,
  type ECGLead,
  type ECGModuleConfig,
  type ECGPattern,
  type ECGSelectionMode,
  type ECGViewMode,
  deriveVitalsForTrend,
  evaluateEcgDecision,
  getAdditionalLeadRequestLabel,
  getClinicalContextLabel,
  getDefaultAdditionalLeadRequestForCase,
  getDecisionStabilityLabel,
  getDynamicNextEcg,
  getEcgCaseById,
  getEcgDifficultyLabel,
  getEcgPoolForContext,
  pickEcgStudyByConfig,
  getEcgSelectionModeLabel,
  getEcgViewModeLabel,
  getVisibleLeads,
  inferEcgClinicalContext,
  leadSetSummary,
  normalizeEcgModuleConfig,
  outcomeTone,
  POSTERIOR_LEADS,
  RIGHT_LEADS,
  resolveEcgViewModeForCase,
  STANDARD_12_LEADS,
  supportsEcgViewMode,
} from "@/src/lib/ecgLibrary";

type EcgWorkspaceProps = {
  open: boolean;
  caseObject: any;
  timeLabel: string;
  currentRiskLabel: string;
  standalone?: boolean;
  embedded?: boolean;
  autoRequestToken?: number;
  onClose: () => void;
  onAddNote?: (text: string) => void;
  onCaseObjectChange?: (nextCaseObject: any) => void;
};

type DecisionState = {
  interpretation: string;
  stabilityDecision: ECGDecisionStability | "";
  conductId: ECGConductId | "";
  requestedAdditionalLeads: ECGAdditionalLeadRequest;
  justification: string;
};

type AttemptEntry = {
  id: string;
  ecgId: string;
  ecgName: string;
  score: number;
  trend: "improves" | "stable" | "deteriorates";
  at: string;
};

type ECGTrainingMode = "interpretation" | "practice";

const EMPTY_DECISION: DecisionState = {
  interpretation: "",
  stabilityDecision: "",
  conductId: "",
  requestedAdditionalLeads: "none",
  justification: "",
};

const CONTEXT_SELECTOR_OPTIONS: Array<{ value: "auto" | ECGClinicalContext; label: string }> = [
  { value: "auto", label: "Automático (según caso actual)" },
  { value: "palpitations", label: "Palpitaciones" },
  { value: "chest_pain", label: "Dolor torácico" },
  { value: "cardiac_arrest", label: "Paro cardiorrespiratorio" },
  { value: "syncope_collapse", label: "Síncope/colapso" },
  { value: "electrolyte_disorder", label: "Alteración electrolítica" },
  { value: "general_critical", label: "Contexto crítico general" },
];

const TRACE_SWEEP_SECONDS = 8.6;
const TRACE_SCROLL_SPEED = 0.52;

type BrowserAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function gauss(x: number, center: number, width: number) {
  const d = (x - center) / Math.max(width, 0.0001);
  return Math.exp(-0.5 * d * d);
}

function saw(x: number) {
  return 2 * (x - Math.floor(x + 0.5));
}

function leadGain(lead: string) {
  if (lead === "aVR") return -0.75;
  if (lead === "V1") return 0.8;
  if (lead === "V2") return 0.95;
  if (lead === "V3") return 1.05;
  if (lead === "V4") return 1.15;
  if (lead === "V5") return 1.05;
  if (lead === "V6") return 0.95;
  if (lead === "V3R" || lead === "V4R" || lead === "V5R" || lead === "V6R") return 0.9;
  if (lead === "V7" || lead === "V8" || lead === "V9") return 1;
  return 1;
}

function qrsWidth(profileQrs: "narrow" | "wide") {
  return profileQrs === "wide" ? 0.024 : 0.011;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getVentricularTachycardiaLeadProfile(lead: string) {
  const profiles: Record<string, { shoulder: number; main: number; notch: number; terminal: number; phase: number; tWave: number }> =
    {
      I: { shoulder: 0.48, main: 0.95, notch: -0.18, terminal: 0.42, phase: -0.006, tWave: 0.18 },
      II: { shoulder: 0.56, main: 1.12, notch: -0.16, terminal: 0.5, phase: 0, tWave: 0.2 },
      III: { shoulder: 0.44, main: 0.88, notch: -0.12, terminal: 0.38, phase: 0.004, tWave: 0.16 },
      aVR: { shoulder: -0.4, main: -0.82, notch: 0.18, terminal: -0.36, phase: -0.01, tWave: 0.18 },
      aVL: { shoulder: 0.3, main: 0.62, notch: -0.12, terminal: 0.28, phase: -0.008, tWave: 0.14 },
      aVF: { shoulder: 0.48, main: 0.96, notch: -0.14, terminal: 0.42, phase: 0.002, tWave: 0.18 },
      V1: { shoulder: -0.3, main: -1.2, notch: 0.3, terminal: -0.72, phase: -0.014, tWave: 0.24 },
      V2: { shoulder: -0.22, main: -1.05, notch: 0.28, terminal: -0.62, phase: -0.01, tWave: 0.22 },
      V3: { shoulder: -0.08, main: -0.35, notch: 0.24, terminal: 0.78, phase: -0.004, tWave: 0.18 },
      V4: { shoulder: 0.22, main: 0.92, notch: -0.22, terminal: 0.68, phase: 0.004, tWave: 0.2 },
      V5: { shoulder: 0.26, main: 1.02, notch: -0.18, terminal: 0.54, phase: 0.008, tWave: 0.22 },
      V6: { shoulder: 0.2, main: 0.82, notch: -0.14, terminal: 0.42, phase: 0.012, tWave: 0.18 },
      V3R: { shoulder: -0.24, main: -0.96, notch: 0.24, terminal: -0.58, phase: -0.012, tWave: 0.2 },
      V4R: { shoulder: -0.12, main: -0.72, notch: 0.18, terminal: -0.44, phase: -0.008, tWave: 0.18 },
      V5R: { shoulder: 0.14, main: 0.58, notch: -0.12, terminal: 0.3, phase: 0.004, tWave: 0.14 },
      V6R: { shoulder: 0.12, main: 0.46, notch: -0.1, terminal: 0.26, phase: 0.008, tWave: 0.12 },
      V7: { shoulder: 0.18, main: 0.78, notch: -0.12, terminal: 0.48, phase: 0.008, tWave: 0.16 },
      V8: { shoulder: 0.14, main: 0.68, notch: -0.1, terminal: 0.42, phase: 0.01, tWave: 0.14 },
      V9: { shoulder: 0.1, main: 0.58, notch: -0.08, terminal: 0.34, phase: 0.012, tWave: 0.12 },
    };

  return profiles[lead] ?? profiles.II;
}

function ecgSignal(args: {
  pattern: ECGPattern;
  xNorm: number;
  bpm: number;
  qrs: "narrow" | "wide";
  irregularity: number;
  stShift: "normal" | "elevated" | "depressed";
  lead: string;
  phaseSeconds: number;
}) {
  const { pattern, xNorm, bpm, qrs, irregularity, stShift, lead, phaseSeconds } = args;
  const beatSeconds = 60 / Math.max(20, bpm);
  const t = phaseSeconds * TRACE_SCROLL_SPEED + xNorm * TRACE_SWEEP_SECONDS;
  const wobble = irregularity * 0.2 * Math.sin(t * 2.1);
  const localRaw = ((t / beatSeconds) % 1 + 1) % 1;
  const local = Math.min(0.999, Math.max(0.001, localRaw + wobble));
  const qrsW = qrsWidth(qrs);

  const baselineWander = 0.03 * Math.sin(t * 0.7) + 0.018 * Math.sin(t * 1.6);

  if (pattern === "asystole_flat") {
    return baselineWander * 0.22 + 0.008 * Math.sin(t * 19);
  }

  if (pattern === "vf_chaotic") {
    return (
      0.55 * Math.sin(t * 16) +
      0.35 * Math.sin(t * 11.3 + 1.2) +
      0.24 * Math.sin(t * 23.6 + 0.2)
    );
  }

  if (pattern === "flutter_saw") {
    const flutter = 0.22 * saw(local * 4.2);
    const qrsComplex = 1.03 * gauss(local, 0.3, qrsW) - 0.2 * gauss(local, 0.275, 0.01);
    return flutter + qrsComplex + baselineWander * 0.35;
  }

  if (pattern === "svt_regular") {
    return (
      -0.08 * gauss(local, 0.27, 0.009) +
      1.05 * gauss(local, 0.3, qrsW) -
      0.16 * gauss(local, 0.325, 0.011) +
      0.16 * gauss(local, 0.58, 0.045) +
      baselineWander * 0.4
    );
  }

  if (pattern === "vt_wide") {
    const vt = getVentricularTachycardiaLeadProfile(lead);
    const dominant = Math.sign(vt.main || vt.terminal || 1);
    const wideComplex =
      vt.shoulder * gauss(local, 0.22 + vt.phase, 0.026) +
      vt.main * gauss(local, 0.31 + vt.phase, 0.055) +
      vt.notch * gauss(local, 0.37 + vt.phase, 0.014) +
      vt.terminal * gauss(local, 0.45 + vt.phase, 0.048);
    const discordantSt = local > 0.47 + vt.phase && local < 0.6 + vt.phase ? -dominant * 0.07 : 0;
    const discordantT = -dominant * vt.tWave * gauss(local, 0.67 + vt.phase * 0.3, 0.09);

    return wideComplex + discordantSt + discordantT + baselineWander * 0.12;
  }

  if (pattern === "pea_low_amp") {
    return (
      0.06 * gauss(local, 0.18, 0.02) +
      0.38 * gauss(local, 0.3, 0.018) -
      0.07 * gauss(local, 0.33, 0.015) +
      0.12 * gauss(local, 0.55, 0.05) +
      baselineWander * 0.2
    );
  }

  if (pattern === "af_irregular") {
    const fibrillation = 0.08 * Math.sin(t * 33) + 0.06 * Math.sin(t * 24 + 0.6);
    return (
      -0.07 * gauss(local, 0.27, 0.01) +
      0.95 * gauss(local, 0.3, qrsW) -
      0.14 * gauss(local, 0.33, 0.012) +
      0.25 * gauss(local, 0.57, 0.05) +
      fibrillation +
      baselineWander * 0.3
    );
  }

  if (pattern === "bundle_branch") {
    return (
      0.08 * gauss(local, 0.18, 0.025) -
      0.12 * gauss(local, 0.27, 0.016) +
      1.08 * gauss(local, 0.3, 0.026) -
      0.18 * gauss(local, 0.355, 0.02) +
      0.24 * gauss(local, 0.57, 0.055) +
      baselineWander * 0.3
    );
  }

  if (pattern === "hyperk") {
    return (
      0.03 * gauss(local, 0.18, 0.02) -
      0.09 * gauss(local, 0.27, 0.014) +
      0.88 * gauss(local, 0.3, 0.022) -
      0.09 * gauss(local, 0.34, 0.014) +
      0.52 * gauss(local, 0.56, 0.04) +
      baselineWander * 0.25
    );
  }

  const stLevel = stShift === "elevated" ? 0.2 : stShift === "depressed" ? -0.12 : 0;
  const stPlateau = local > 0.34 && local < 0.48 ? stLevel : 0;

  const sinusCore =
    0.1 * gauss(local, 0.18, 0.022) -
    0.1 * gauss(local, 0.27, 0.011) +
    1.02 * gauss(local, 0.3, qrsW) -
    0.17 * gauss(local, 0.33, 0.011) +
    0.31 * gauss(local, 0.58, 0.055) +
    stPlateau;

  if (pattern === "st_depression") {
    return sinusCore - 0.1 + baselineWander * 0.3;
  }

  if (pattern === "stemi") {
    return sinusCore + 0.08 + baselineWander * 0.3;
  }

  const leadScale = leadGain(lead);
  return sinusCore * leadScale + baselineWander;
}

function buildWavePath(args: {
  width: number;
  height: number;
  lead: string;
  profile: ECGCase["waveform"];
  phaseSeconds: number;
}) {
  const { width, height, lead, profile, phaseSeconds } = args;
  const points: string[] = [];
  const yMid = height * 0.52;
  const scale = (height * 0.28) * profile.amplitude;

  for (let x = 0; x <= width; x += 3) {
    const xNorm = x / width;
    const value = ecgSignal({
      pattern: profile.pattern,
      xNorm,
      bpm: profile.bpm,
      qrs: profile.qrs,
      irregularity: profile.irregularity,
      stShift: profile.stShift,
      lead,
      phaseSeconds,
    });
    const y = yMid - value * scale;
    points.push(`${x},${y.toFixed(2)}`);
  }

  return `M${points.join(" L")}`;
}

function trendLabel(trend: "improves" | "stable" | "deteriorates") {
  if (trend === "improves") return "Mejora";
  if (trend === "deteriorates") return "Deteriora";
  return "Estable";
}

function toneByTrend(trend: "improves" | "stable" | "deteriorates") {
  if (trend === "improves") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (trend === "deteriorates") return "border-red-400/30 bg-red-400/10 text-red-100";
  return "border-white/15 bg-black/20 text-white/80";
}

function riskProgression(currentRisk: string, trend: "improves" | "stable" | "deteriorates") {
  const normalized = normalizeText(currentRisk);
  const rank = normalized.includes("alto") ? 2 : normalized.includes("moder") ? 1 : 0;

  const nextRank = trend === "improves" ? Math.max(0, rank - 1) : trend === "deteriorates" ? Math.min(2, rank + 1) : rank;
  if (nextRank === 2) return "alto";
  if (nextRank === 1) return "moderado";
  return "bajo";
}

function getAnimatedMonitorVitals(args: {
  vitals: ECGCase["baselineVitals"] | ReturnType<typeof deriveVitalsForTrend> | null;
  ecgCase: ECGCase | null;
  phaseSeconds: number;
  trend: "improves" | "stable" | "deteriorates";
  requested: boolean;
}) {
  const { vitals, ecgCase, phaseSeconds, trend, requested } = args;
  if (!vitals || !ecgCase || !requested) return vitals;

  const pattern = ecgCase.waveform.pattern;
  if (pattern === "vf_chaotic" || pattern === "asystole_flat") {
    return {
      ...vitals,
      hr: 0,
      sbp: 0,
      dbp: 0,
      spo2: 0,
      rr: 0,
      temp: vitals.temp,
    };
  }

  const severityFactor =
    trend === "deteriorates"
      ? 1.25
      : trend === "improves"
      ? 0.7
      : ecgCase.probableStability === "critical"
      ? 1.15
      : ecgCase.probableStability === "unstable"
      ? 0.95
      : 0.65;

  const rhythmFactor = clamp(ecgCase.waveform.irregularity * 2.2 + (pattern === "af_irregular" ? 0.9 : 0.4), 0.35, 1.55);
  const respiratoryPhase = Math.sin(phaseSeconds * 0.34);
  const hemoPhase = Math.sin(phaseSeconds * 0.17 + 1.1);
  const beatPhase = Math.sin(phaseSeconds * 1.85 + 0.4);

  const hrVariation = Math.round((1 + severityFactor * 2.4 + rhythmFactor * 1.6) * beatPhase + rhythmFactor * 1.2 * respiratoryPhase);
  const rrVariation = Math.round((1 + severityFactor * 1.6) * Math.sin(phaseSeconds * 0.22 + 0.8));
  const spo2Variation = Math.round((severityFactor > 1 ? 2 : 1) * Math.sin(phaseSeconds * 0.18 + 2.2));
  const sbpVariation = Math.round((3 + severityFactor * 4) * hemoPhase + (pattern === "vt_wide" ? -2 : 0));
  const dbpVariation = Math.round((2 + severityFactor * 2.5) * Math.sin(phaseSeconds * 0.16 + 1.7));
  const tempVariation = Math.sin(phaseSeconds * 0.03) * 0.08;

  const hr = vitals.hr > 0 ? Math.max(0, Math.round(vitals.hr + hrVariation)) : 0;
  const sbp = vitals.sbp > 0 ? Math.max(0, Math.round(vitals.sbp + sbpVariation)) : 0;
  const dbp = vitals.dbp > 0 ? Math.max(0, Math.round(vitals.dbp + dbpVariation)) : 0;
  const rr = vitals.rr > 0 ? Math.max(0, Math.round(vitals.rr + rrVariation)) : 0;
  const spo2 = vitals.spo2 > 0 ? clamp(Math.round(vitals.spo2 + spo2Variation), 0, 100) : 0;

  return {
    ...vitals,
    hr,
    sbp,
    dbp: dbp > sbp ? Math.max(0, sbp - 8) : dbp,
    spo2,
    rr,
    temp: Number((vitals.temp + tempVariation).toFixed(1)),
  };
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;
  const win = window as BrowserAudioWindow;
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

function scheduleMonitorPulse(ctx: AudioContext, when: number, accent = 1) {
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const oscMain = ctx.createOscillator();
  const oscHarmonic = ctx.createOscillator();

  filter.type = "bandpass";
  filter.frequency.value = 980;
  filter.Q.value = 2.8;

  oscMain.type = "triangle";
  oscMain.frequency.setValueAtTime(920, when);
  oscMain.frequency.exponentialRampToValueAtTime(760, when + 0.055);

  oscHarmonic.type = "sine";
  oscHarmonic.frequency.setValueAtTime(1340, when);
  oscHarmonic.frequency.exponentialRampToValueAtTime(980, when + 0.05);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(0.024 * accent, when + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.085);

  oscMain.connect(filter);
  oscHarmonic.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  oscMain.start(when);
  oscHarmonic.start(when);
  oscMain.stop(when + 0.09);
  oscHarmonic.stop(when + 0.08);
}

function scheduleMonitorAlarmBurst(ctx: AudioContext, when: number) {
  [0, 0.22].forEach((offset) => {
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    filter.type = "highpass";
    filter.frequency.value = 600;

    osc.type = "square";
    osc.frequency.setValueAtTime(740, when + offset);
    osc.frequency.exponentialRampToValueAtTime(880, when + offset + 0.09);

    gain.gain.setValueAtTime(0.0001, when + offset);
    gain.gain.linearRampToValueAtTime(0.016, when + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + offset + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(when + offset);
    osc.stop(when + offset + 0.13);
  });
}

function MonitorMetric({
  label,
  value,
  unit,
  tone,
  muted,
  compact,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "green" | "cyan" | "amber" | "violet" | "orange" | "white";
  muted?: boolean;
  compact?: boolean;
}) {
  const toneClass =
    tone === "green"
      ? "text-[#7BFF9A] border-[#7BFF9A]/20 bg-[#07120C]"
      : tone === "cyan"
      ? "text-[#7EDCFF] border-[#7EDCFF]/20 bg-[#06111A]"
      : tone === "amber"
      ? "text-[#FFD37A] border-[#FFD37A]/20 bg-[#161006]"
      : tone === "violet"
      ? "text-[#B7A6FF] border-[#B7A6FF]/20 bg-[#0F0A1B]"
      : tone === "orange"
      ? "text-[#FFB46B] border-[#FFB46B]/20 bg-[#181006]"
      : "text-white border-white/15 bg-[#0A0F17]";

  return (
    <div className={`min-w-0 rounded-2xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${toneClass}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] opacity-70">
        <span>{label}</span>
        <span>{muted ? "standby" : "live"}</span>
      </div>
      <div className={`mt-2 min-w-0 ${compact ? "space-y-1" : "flex items-end gap-2"}`}>
        <div
          className={`min-w-0 truncate font-mono font-semibold leading-none ${compact ? "text-[1.65rem]" : "text-3xl"} ${
            muted ? "opacity-55" : ""
          }`}
        >
          {value}
        </div>
        {unit ? (
          <div className={`${compact ? "text-[11px]" : "pb-1 text-xs"} ${muted ? "opacity-50" : "opacity-80"}`}>{unit}</div>
        ) : null}
      </div>
    </div>
  );
}

function MonitorLeadPreview({
  profile,
  phaseSeconds,
  active,
}: {
  profile: ECGCase["waveform"] | null;
  phaseSeconds: number;
  active: boolean;
}) {
  const width = 560;
  const height = 118;
  const path = useMemo(
    () =>
      profile
        ? buildWavePath({
            width,
            height,
            lead: "II",
            profile,
            phaseSeconds,
          })
        : "",
    [height, phaseSeconds, profile, width]
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-300/15 bg-[#03070D]">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(41,153,99,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(41,153,99,0.14) 1px, transparent 1px), linear-gradient(rgba(41,153,99,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(41,153,99,0.24) 1px, transparent 1px)",
          backgroundSize: "8px 8px, 8px 8px, 40px 40px, 40px 40px",
        }}
      />
      <div className="relative flex items-center justify-between px-3 pt-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100/75">
        <span>Lead II</span>
        <span>{active ? "Monitor activo" : "Sin señal"}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="relative h-[92px] w-full">
        {profile ? (
          <path d={path} fill="none" stroke="rgba(123,255,154,0.96)" strokeWidth="2.2" strokeLinecap="round" />
        ) : (
          <path
            d={`M 0 ${height / 2} L ${width} ${height / 2}`}
            fill="none"
            stroke="rgba(123,255,154,0.35)"
            strokeWidth="1.5"
            strokeDasharray="8 6"
          />
        )}
      </svg>
    </div>
  );
}

function MonitorTrendStrip({
  color,
  label,
  mode,
  bpm,
  phaseSeconds,
  active,
}: {
  color: string;
  label: string;
  mode: "pleth" | "resp";
  bpm: number;
  phaseSeconds: number;
  active: boolean;
}) {
  const width = 560;
  const height = 72;

  const path = useMemo(() => {
    const points: string[] = [];
    const yMid = height * 0.55;
    const cycleSeconds = mode === "resp" ? 60 / Math.max(8, bpm) : 60 / Math.max(30, bpm);
    const timeBase = phaseSeconds * (mode === "resp" ? 0.65 : 0.95);

    for (let x = 0; x <= width; x += 3) {
      const xNorm = x / width;
      const t = timeBase + xNorm * (mode === "resp" ? 12 : 7);
      const local = ((t / cycleSeconds) % 1 + 1) % 1;

      const value =
        !active
          ? 0
          : mode === "pleth"
          ? 0.95 * gauss(local, 0.18, 0.03) +
            0.46 * gauss(local, 0.28, 0.06) -
            0.22 * gauss(local, 0.36, 0.015) +
            0.06 * Math.sin(t * 1.2)
          : 0.72 * Math.sin(local * Math.PI) - 0.18 * Math.sin(local * Math.PI * 2.2);

      const scale = mode === "pleth" ? height * 0.35 : height * 0.28;
      const y = yMid - value * scale;
      points.push(`${x},${y.toFixed(2)}`);
    }

    return `M${points.join(" L")}`;
  }, [active, bpm, height, mode, phaseSeconds, width]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/25">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="relative flex items-center justify-between px-3 pt-2 text-[10px] uppercase tracking-[0.18em] text-white/65">
        <span>{label}</span>
        <span>{active ? "activo" : "standby"}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="relative h-[56px] w-full">
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function EcgLeadStrip({
  lead,
  profile,
  phaseSeconds,
  compact,
}: {
  lead: string;
  profile: ECGCase["waveform"];
  phaseSeconds: number;
  compact?: boolean;
}) {
  const width = compact ? 260 : 980;
  const height = compact ? 95 : 260;

  const path = useMemo(
    () =>
      buildWavePath({
        width,
        height,
        lead,
        profile,
        phaseSeconds,
      }),
    [width, height, lead, profile, phaseSeconds]
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-300/25 bg-[#04110A]">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(26,89,55,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(26,89,55,0.35) 1px, transparent 1px)",
          backgroundSize: compact ? "18px 18px" : "24px 24px",
        }}
      />

      <svg viewBox={`0 0 ${width} ${height}`} className="relative h-full w-full">
        <path d={path} fill="none" stroke="rgba(95,255,174,0.95)" strokeWidth={compact ? 1.8 : 2.5} strokeLinecap="round" />
      </svg>

      <div className="absolute left-2 top-1 rounded-md border border-emerald-300/25 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
        {lead}
      </div>
    </div>
  );
}

const STANDARD_PRINT_LAYOUT: ECGLead[][] = [
  ["I", "aVR", "V1", "V4"],
  ["II", "aVL", "V2", "V5"],
  ["III", "aVF", "V3", "V6"],
];

function EcgPaperLead({
  lead,
  profile,
  phaseSeconds,
  longStrip = false,
}: {
  lead: string;
  profile: ECGCase["waveform"];
  phaseSeconds: number;
  longStrip?: boolean;
}) {
  const width = longStrip ? 940 : 250;
  const height = 120;
  const path = useMemo(
    () =>
      buildWavePath({
        width,
        height,
        lead,
        profile,
        phaseSeconds,
      }),
    [height, lead, phaseSeconds, profile, width]
  );

  return (
    <div className="relative overflow-hidden rounded-lg border border-rose-900/10 bg-[#fffdf8]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239,68,68,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.12) 1px, transparent 1px), linear-gradient(rgba(244,63,94,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.22) 1px, transparent 1px)",
          backgroundSize: "4px 4px, 4px 4px, 20px 20px, 20px 20px",
        }}
      />
      <svg viewBox={`0 0 ${width} ${height}`} className="relative h-full w-full">
        <path d={path} fill="none" stroke="rgba(17,24,39,0.96)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div className="absolute left-2 top-1 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
        {lead}
      </div>
    </div>
  );
}

function EcgPrintSheet({
  ecgCase,
  phaseSeconds,
  visibleLeads,
  resolvedViewMode,
  timeLabel,
  contextLabel,
  currentRiskLabel,
  revealDiagnosis,
}: {
  ecgCase: ECGCase;
  phaseSeconds: number;
  visibleLeads: string[];
  resolvedViewMode: ECGViewMode;
  timeLabel: string;
  contextLabel: string;
  currentRiskLabel: string;
  revealDiagnosis: boolean;
}) {
  const extraLeads = visibleLeads.filter((lead) => !STANDARD_12_LEADS.includes(lead as ECGLead));

  return (
    <div className="mx-auto w-full max-w-[1180px] rounded-[28px] border border-black/10 bg-[#fffefb] p-5 text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Hoja de ECG</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {revealDiagnosis ? ecgCase.name : "Registro electrocardiográfico"}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {revealDiagnosis
              ? "Formato de impresión para interpretación clínica."
              : "Formato de impresión para interpretación sin diagnóstico revelado."}
          </div>
        </div>

        <div className="grid gap-1 text-right text-xs text-slate-600">
          <div>Velocidad: 25 mm/s</div>
          <div>Ganancia: 10 mm/mV</div>
          <div>Contexto: {contextLabel}</div>
          <div>Riesgo actual: {currentRiskLabel}</div>
          <div>Temporizador del caso: {timeLabel}</div>
        </div>
      </div>

      {resolvedViewMode === "rhythm_monitor" ? (
        <div className="mt-5 space-y-4">
          <div className="text-sm font-semibold text-slate-700">Tira de ritmo continua</div>
          <div className="h-[140px]">
            <EcgPaperLead lead="II" profile={ecgCase.waveform} phaseSeconds={phaseSeconds} longStrip />
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="text-sm font-semibold text-slate-700">ECG estándar de 12 derivaciones</div>
          <div className="grid gap-2 lg:grid-cols-4">
            {STANDARD_PRINT_LAYOUT.flat().map((lead) => (
              <div key={lead} className="h-[120px]">
                <EcgPaperLead lead={lead} profile={ecgCase.waveform} phaseSeconds={phaseSeconds} />
              </div>
            ))}
          </div>
        </div>
      )}

      {extraLeads.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="text-sm font-semibold text-slate-700">Derivaciones complementarias</div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {extraLeads.map((lead) => (
              <div key={lead} className="h-[120px]">
                <EcgPaperLead lead={lead} profile={ecgCase.waveform} phaseSeconds={phaseSeconds} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <div className="text-sm font-semibold text-slate-700">Tira larga de ritmo</div>
        <div className="h-[140px]">
          <EcgPaperLead lead="II" profile={ecgCase.waveform} phaseSeconds={phaseSeconds} longStrip />
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/65">
        <span>{label}</span>
        <span className="text-white/85">{value}/{max}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
        <div className="h-1.5 rounded-full bg-cyan-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EcgWorkspace(props: EcgWorkspaceProps) {
  const {
    open,
    caseObject,
    timeLabel,
    currentRiskLabel,
    standalone = false,
    embedded = false,
    autoRequestToken,
    onClose,
    onAddNote,
    onCaseObjectChange,
  } = props;

  const ecgConfig = useMemo<ECGModuleConfig>(
    () => normalizeEcgModuleConfig(caseObject?.meta?.ecg ?? caseObject?.ecg, caseObject),
    [caseObject]
  );
  const ecgConfigStable = useMemo<ECGModuleConfig>(
    () => ({
      enabled: ecgConfig.enabled,
      viewMode: ecgConfig.viewMode,
      selectionMode: ecgConfig.selectionMode,
      manualEcgId: ecgConfig.manualEcgId,
      difficulty: ecgConfig.difficulty,
      dynamicEnabled: ecgConfig.dynamicEnabled,
      showHints: ecgConfig.showHints,
      showRhythmName: ecgConfig.showRhythmName,
      allowAdditionalLeads: ecgConfig.allowAdditionalLeads,
      immediateFeedback: ecgConfig.immediateFeedback,
    }),
    [
      ecgConfig.enabled,
      ecgConfig.viewMode,
      ecgConfig.selectionMode,
      ecgConfig.manualEcgId,
      ecgConfig.difficulty,
      ecgConfig.dynamicEnabled,
      ecgConfig.showHints,
      ecgConfig.showRhythmName,
      ecgConfig.allowAdditionalLeads,
      ecgConfig.immediateFeedback,
    ]
  );

  const [activeEcg, setActiveEcg] = useState<ECGCase | null>(null);
  const [viewMode, setViewMode] = useState<ECGViewMode>(ecgConfig.viewMode);
  const [requested, setRequested] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printPhaseSeconds, setPrintPhaseSeconds] = useState(0);
  const [decision, setDecision] = useState<DecisionState>(EMPTY_DECISION);
  const [evaluation, setEvaluation] = useState<ReturnType<typeof evaluateEcgDecision> | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(ecgConfig.immediateFeedback);
  const [trend, setTrend] = useState<"improves" | "stable" | "deteriorates">("stable");
  const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [selectionMode, setSelectionMode] = useState<ECGSelectionMode>(ecgConfig.selectionMode);
  const [contextSelector, setContextSelector] = useState<"auto" | ECGClinicalContext>("auto");
  const [trainingMode, setTrainingMode] = useState<ECGTrainingMode>(ecgConfig.showRhythmName ? "practice" : "interpretation");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const printSheetRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatCounterRef = useRef(0);
  const nextAlarmTimeRef = useRef(0);
  const lastAutoRequestTokenRef = useRef<number | undefined>(undefined);

  const caseId = useMemo(
    () => String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default"),
    [caseObject]
  );
  const selectionContext = useMemo(
    () => ({
      meta: {
        title: caseObject?.meta?.title,
        category: caseObject?.meta?.category,
        dx_id: caseObject?.meta?.dx_id,
        dsm_tag: caseObject?.meta?.dsm_tag,
      },
      chief_complaint: caseObject?.chief_complaint,
      brief_context: caseObject?.brief_context,
      patient_profile: {
        context: caseObject?.patient_profile?.context,
      },
    }),
    [
      caseObject?.meta?.title,
      caseObject?.meta?.category,
      caseObject?.meta?.dx_id,
      caseObject?.meta?.dsm_tag,
      caseObject?.chief_complaint,
      caseObject?.brief_context,
      caseObject?.patient_profile?.context,
    ]
  );

  const inferredContext = useMemo(
    () => inferEcgClinicalContext(selectionContext),
    [selectionContext]
  );
  const effectiveContext = useMemo(
    () => (contextSelector === "auto" ? inferredContext : contextSelector),
    [contextSelector, inferredContext]
  );

  function pickEcgFromControls(args?: { excludeId?: string | null; modeOverride?: ECGSelectionMode }) {
    const mode = args?.modeOverride ?? selectionMode;
    const configForSelection = { ...ecgConfig, selectionMode: mode };
    const contextualFilter = mode === "contextual_random" ? effectiveContext : null;
    const pool = getEcgPoolForContext(configForSelection, contextualFilter).filter(
      (item) => item.id !== args?.excludeId
    );

    if (mode === "manual") {
      const manual = getEcgCaseById(ecgConfig.manualEcgId);
      if (manual) return manual;
    }

    const preferred = pickEcgStudyByConfig({
      config: configForSelection,
      caseObject: selectionContext,
      excludeId: args?.excludeId,
    });
    if (preferred && pool.some((item) => item.id === preferred.id)) return preferred;

    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return getEcgCaseById(ecgConfig.manualEcgId) ?? ECG_LIBRARY[0];
  }

  useEffect(() => {
    if (!ecgConfigStable.enabled) return;
    setSelectionMode(ecgConfigStable.selectionMode);
    setContextSelector("auto");
    setTrainingMode(ecgConfigStable.showRhythmName ? "practice" : "interpretation");

    const manual = ecgConfigStable.selectionMode === "manual" ? getEcgCaseById(ecgConfigStable.manualEcgId) : null;
    const seed =
      manual ??
      pickEcgStudyByConfig({
        config: ecgConfigStable,
        caseObject: selectionContext,
      }) ??
      ECG_LIBRARY[0];

    setActiveEcg(seed);
    setViewMode(ecgConfigStable.viewMode);
    setRequested(false);
    setDecision(EMPTY_DECISION);
    setEvaluation(null);
    setFeedbackVisible(ecgConfigStable.immediateFeedback);
    setTrend("stable");
    setStartedAt(null);
    setPrintPreviewOpen(false);
  }, [caseId, ecgConfigStable, inferredContext, selectionContext]);

  useEffect(() => {
    if (!open) return;
    setTick(Date.now());
    const id = window.setInterval(() => setTick(Date.now()), 110);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(`ecgAttempts:${caseId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setAttempts(
          parsed
            .map((item) => ({
              id: String(item.id ?? `attempt-${Math.random()}`),
              ecgId: String(item.ecgId ?? ""),
              ecgName: String(item.ecgName ?? "ECG"),
              score: Number(item.score ?? 0),
              trend:
                item.trend === "improves" || item.trend === "deteriorates" || item.trend === "stable"
                  ? item.trend
                  : "stable",
              at: String(item.at ?? new Date().toISOString()),
            }))
            .slice(0, 8)
        );
      }
    } catch {
      // ignore
    }
  }, [caseId, open]);

  useEffect(() => {
    try {
      localStorage.setItem(`ecgAttempts:${caseId}`, JSON.stringify(attempts.slice(0, 8)));
    } catch {
      // ignore
    }
  }, [attempts, caseId]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("ecgSoundEnabled");
      if (raw === "false") setSoundEnabled(false);
      if (raw === "true") setSoundEnabled(true);
    } catch {
      // ignore
    }
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem("ecgSoundEnabled", String(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      const ctx = audioContextRef.current;
      if (ctx) {
        void ctx.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  const contextLabel = useMemo(() => getClinicalContextLabel(effectiveContext), [effectiveContext]);

  const canUseRhythmMonitor = useMemo(
    () =>
      activeEcg
        ? supportsEcgViewMode({
            ecgCase: activeEcg,
            mode: "rhythm_monitor",
            allowAdditionalLeads: ecgConfig.allowAdditionalLeads,
          })
        : false,
    [activeEcg, ecgConfig.allowAdditionalLeads]
  );

  const canUseStandard12Lead = useMemo(
    () =>
      activeEcg
        ? supportsEcgViewMode({
            ecgCase: activeEcg,
            mode: "standard_12_lead",
            allowAdditionalLeads: ecgConfig.allowAdditionalLeads,
          })
        : false,
    [activeEcg, ecgConfig.allowAdditionalLeads]
  );

  const canUseExpanded = useMemo(
    () =>
      activeEcg
        ? supportsEcgViewMode({
            ecgCase: activeEcg,
            mode: "expanded",
            allowAdditionalLeads: ecgConfig.allowAdditionalLeads,
          })
        : false,
    [activeEcg, ecgConfig.allowAdditionalLeads]
  );

  const defaultAdditionalLeadRequest = useMemo(
    () => (activeEcg ? getDefaultAdditionalLeadRequestForCase(activeEcg) : "none"),
    [activeEcg]
  );

  const availableAdditionalLeadOptions = useMemo(() => {
    if (!activeEcg || !canUseExpanded) return ["none"] as ECGAdditionalLeadRequest[];

    const hasRight = RIGHT_LEADS.some((lead) => activeEcg.availableLeads.includes(lead));
    const hasPosterior = POSTERIOR_LEADS.some((lead) => activeEcg.availableLeads.includes(lead));
    const next: ECGAdditionalLeadRequest[] = ["none"];

    if (hasRight) next.push("right");
    if (hasPosterior) next.push("posterior");
    if (hasRight && hasPosterior) next.push("both");

    return next;
  }, [activeEcg, canUseExpanded]);

  const resolvedViewMode = useMemo(
    () =>
      activeEcg
        ? resolveEcgViewModeForCase({
            ecgCase: activeEcg,
            preferredMode: viewMode,
            allowAdditionalLeads: ecgConfig.allowAdditionalLeads,
          })
        : viewMode,
    [activeEcg, viewMode, ecgConfig.allowAdditionalLeads]
  );

  useEffect(() => {
    if (!activeEcg) return;
    if (resolvedViewMode !== viewMode) {
      setViewMode(resolvedViewMode);
    }
  }, [activeEcg, resolvedViewMode, viewMode]);

  useEffect(() => {
    if (!activeEcg) return;

    if (!canUseExpanded && decision.requestedAdditionalLeads !== "none") {
      setDecision((prev) => ({ ...prev, requestedAdditionalLeads: "none" }));
      return;
    }

    if (!availableAdditionalLeadOptions.includes(decision.requestedAdditionalLeads)) {
      setDecision((prev) => ({
        ...prev,
        requestedAdditionalLeads:
          defaultAdditionalLeadRequest !== "none" && availableAdditionalLeadOptions.includes(defaultAdditionalLeadRequest)
            ? defaultAdditionalLeadRequest
            : "none",
      }));
      return;
    }

    if (
      resolvedViewMode === "expanded" &&
      canUseExpanded &&
      decision.requestedAdditionalLeads === "none" &&
      defaultAdditionalLeadRequest !== "none"
    ) {
      setDecision((prev) => ({
        ...prev,
        requestedAdditionalLeads: defaultAdditionalLeadRequest,
      }));
    }
  }, [
    activeEcg,
    availableAdditionalLeadOptions,
    canUseExpanded,
    decision.requestedAdditionalLeads,
    defaultAdditionalLeadRequest,
    resolvedViewMode,
  ]);

  const visibleLeads = useMemo(() => {
    if (!activeEcg) return ["II"];
    return getVisibleLeads({
      ecgCase: activeEcg,
      mode: resolvedViewMode,
      allowAdditionalLeads: ecgConfig.allowAdditionalLeads,
      requestedAdditionalLeads: decision.requestedAdditionalLeads,
    });
  }, [activeEcg, resolvedViewMode, ecgConfig.allowAdditionalLeads, decision.requestedAdditionalLeads]);

  const phaseSeconds = useMemo(() => tick / 1000, [tick]);

  const derivedVitals = useMemo(() => {
    if (!activeEcg) return null;
    return deriveVitalsForTrend({
      ecgCase: activeEcg,
      trend,
    });
  }, [activeEcg, trend]);

  const monitorVitals = useMemo(
    () =>
      getAnimatedMonitorVitals({
        vitals: derivedVitals,
        ecgCase: activeEcg,
        phaseSeconds,
        trend,
        requested,
      }),
    [activeEcg, derivedVitals, phaseSeconds, requested, trend]
  );

  const monitorSubtitle = useMemo(() => {
    if (!activeEcg) return "Sin trazado activo";
    if (trainingMode === "practice" || selectionMode === "manual") return activeEcg.name;
    return `${getEcgDifficultyLabel(activeEcg.difficulty)} · ${activeEcg.category}`;
  }, [activeEcg, selectionMode, trainingMode]);

  const revealDiagnosis = useMemo(
    () => trainingMode === "practice" || selectionMode === "manual",
    [selectionMode, trainingMode]
  );

  const canSelectTraceDirectly = trainingMode === "practice" || selectionMode === "manual";

  const interpretationPrompt = revealDiagnosis
    ? "1. ¿Qué hallazgo del ECG confirma este diagnóstico?"
    : "1. ¿Qué ritmo o alteración observas?";

  const interpretationPlaceholder = revealDiagnosis
    ? "Ej: QRS ancho regular, ondas P ausentes, elevación del ST, etc."
    : "Ej: Fibrilación auricular";

  const interpretationFieldHelp = revealDiagnosis
    ? "En práctica guiada el diagnóstico ya está revelado; aquí describe el criterio ECG que lo sustenta."
    : "Este campo es manual y no se autocompleta.";

  const interpretationSuggestionOptions = useMemo(() => {
    if (revealDiagnosis && activeEcg) return activeEcg.keyFindings;
    return ECG_LIBRARY.map((item) => item.name);
  }, [activeEcg, revealDiagnosis]);

  const alarmShouldSound = useMemo(() => {
    if (!requested || !activeEcg) return false;

    if (activeEcg.waveform.pattern === "vf_chaotic" || activeEcg.waveform.pattern === "asystole_flat") return true;
    if (trend === "deteriorates") return true;
    if (activeEcg.probableStability === "critical") return true;
    if (!monitorVitals) return false;

    return (
      (monitorVitals.sbp > 0 && monitorVitals.sbp < 90) ||
      (monitorVitals.spo2 > 0 && monitorVitals.spo2 < 90) ||
      monitorVitals.hr <= 0
    );
  }, [activeEcg, monitorVitals, requested, trend]);

  const ensureAudioContext = useCallback(() => {
    const ctor = getAudioContextConstructor();
    if (!ctor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new ctor();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }

    return ctx;
  }, []);

  useEffect(() => {
    nextBeatTimeRef.current = 0;
    beatCounterRef.current = 0;
    nextAlarmTimeRef.current = 0;
  }, [activeEcg?.id, requested, soundEnabled]);

  useEffect(() => {
    if (!open || !requested || !activeEcg || !soundEnabled) return;

    const ctx = ensureAudioContext();
    if (!ctx) return;

    const effectiveHr = Math.max(25, Math.min(170, monitorVitals?.hr || activeEcg.waveform.bpm));
    const beatInterval = 60 / effectiveHr;
    const pulsePattern = activeEcg.waveform.pattern;
    const shouldPulse = pulsePattern !== "vf_chaotic" && pulsePattern !== "asystole_flat";

    const scheduleAudio = () => {
      if (ctx.state !== "running") return;

      const now = ctx.currentTime;
      if (nextBeatTimeRef.current <= now) {
        nextBeatTimeRef.current = now + 0.08;
        beatCounterRef.current = 0;
      }

      while (shouldPulse && nextBeatTimeRef.current < now + 0.35) {
        const beatIndex = beatCounterRef.current;
        const irregularJitter = activeEcg.waveform.irregularity * 0.18 * Math.sin(beatIndex * 1.71 + 0.42);
        const accent =
          pulsePattern === "vt_wide" ? 1.1 : pulsePattern === "hyperk" || pulsePattern === "bundle_branch" ? 0.92 : 1;

        scheduleMonitorPulse(ctx, nextBeatTimeRef.current, accent);
        nextBeatTimeRef.current += Math.max(0.2, beatInterval * (1 + irregularJitter));
        beatCounterRef.current += 1;
      }

      if (!alarmShouldSound) return;

      if (nextAlarmTimeRef.current <= now) {
        nextAlarmTimeRef.current = now + 0.12;
      }

      while (nextAlarmTimeRef.current < now + 0.45) {
        scheduleMonitorAlarmBurst(ctx, nextAlarmTimeRef.current);
        nextAlarmTimeRef.current += 3.8;
      }
    };

    scheduleAudio();
    const id = window.setInterval(scheduleAudio, 90);
    return () => window.clearInterval(id);
  }, [
    activeEcg,
    alarmShouldSound,
    ensureAudioContext,
    monitorVitals?.hr,
    open,
    requested,
    soundEnabled,
  ]);

  const handleViewModeChange = (nextMode: ECGViewMode) => {
    if (!activeEcg) {
      setViewMode(nextMode);
      return;
    }

    const supported = supportsEcgViewMode({
      ecgCase: activeEcg,
      mode: nextMode,
      allowAdditionalLeads: ecgConfig.allowAdditionalLeads,
    });

    if (!supported) return;

    setViewMode(nextMode);

    if (nextMode === "expanded" && decision.requestedAdditionalLeads === "none" && defaultAdditionalLeadRequest !== "none") {
      setDecision((prev) => ({
        ...prev,
        requestedAdditionalLeads: defaultAdditionalLeadRequest,
      }));
    }
  };

  const handleRequestEcg = () => {
    if (!activeEcg) return;
    if (soundEnabled) ensureAudioContext();
    setRequested(true);
    setStartedAt(Date.now());
    setEvaluation(null);
    setFeedbackVisible(ecgConfig.immediateFeedback);
    setPrintPreviewOpen(false);
  };

  useEffect(() => {
    if (!open || !activeEcg || autoRequestToken === undefined) return;
    if (lastAutoRequestTokenRef.current === autoRequestToken) return;
    lastAutoRequestTokenRef.current = autoRequestToken;
    handleRequestEcg();
  }, [activeEcg, autoRequestToken, open]);

  const handleSelectManual = (id: string) => {
    const found = getEcgCaseById(id);
    if (!found) return;
    setSelectionMode("manual");
    setActiveEcg(found);
    setRequested(false);
    setDecision(EMPTY_DECISION);
    setEvaluation(null);
    setTrend("stable");
    setStartedAt(null);
    setPrintPreviewOpen(false);
  };

  const handleRandomEcg = () => {
    const next = pickEcgFromControls({ excludeId: activeEcg?.id });
    setActiveEcg(next);
    setRequested(false);
    setDecision(EMPTY_DECISION);
    setEvaluation(null);
    setTrend("stable");
    setStartedAt(null);
    setPrintPreviewOpen(false);
  };

  const handleSelectionModeChange = (mode: ECGSelectionMode) => {
    setSelectionMode(mode);
    if (mode !== "manual") return;

    const manual = getEcgCaseById(ecgConfig.manualEcgId) ?? activeEcg ?? ECG_LIBRARY[0];
    setActiveEcg(manual);
    setRequested(false);
    setDecision(EMPTY_DECISION);
    setEvaluation(null);
    setTrend("stable");
    setStartedAt(null);
    setPrintPreviewOpen(false);
  };

  const handleOpenPrintPreview = () => {
    if (!activeEcg || !requested) return;
    setPrintPhaseSeconds(phaseSeconds);
    setPrintPreviewOpen(true);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    if (next) ensureAudioContext();
    setSoundEnabled(next);
  };

  const handleBrowserPrint = () => {
    if (!printSheetRef.current || typeof window === "undefined") return;

    const popup = window.open("", "_blank", "width=1280,height=900");
    if (!popup) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("\n");

    popup.document.open();
    popup.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Impresión ECG</title>
          ${styles}
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #f4f1eb;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            @page {
              margin: 12mm;
            }
          </style>
        </head>
        <body>
          ${printSheetRef.current.outerHTML}
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 250);
  };

  const handleEvaluate = () => {
    if (!activeEcg || !requested) return;

    const input: ECGDecisionInput = {
      interpretation: revealDiagnosis && activeEcg ? activeEcg.name : decision.interpretation,
      stabilityDecision: decision.stabilityDecision,
      conductId: decision.conductId,
      requestedAdditionalLeads: decision.requestedAdditionalLeads,
      justification: decision.justification,
      responseSeconds: startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0,
    };

    const result = evaluateEcgDecision({ ecgCase: activeEcg, input });
    setEvaluation(result);
    setTrend(result.trend);
    setFeedbackVisible(ecgConfig.immediateFeedback);

    const nextEntry: AttemptEntry = {
      id: `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      ecgId: activeEcg.id,
      ecgName: activeEcg.name,
      score: result.totalScore,
      trend: result.trend,
      at: new Date().toISOString(),
    };
    setAttempts((prev) => [nextEntry, ...prev].slice(0, 8));

    if (onAddNote) {
      onAddNote(
        `[ECG ${activeEcg.name}] Puntaje ${result.totalScore}/100 · ${trendLabel(result.trend)}. Conducta ${
          result.conductCorrect ? "adecuada" : "mejorable"
        }.`
      );
    }
  };

  const handleContinueEvolution = () => {
    if (!activeEcg) return;
    const evalTrend = evaluation?.trend ?? "stable";

    if (ecgConfig.dynamicEnabled) {
      const dynamicNext = getDynamicNextEcg({
        currentEcg: activeEcg,
        trend: evalTrend,
      });
      if (dynamicNext) {
        setActiveEcg(dynamicNext);
      }
    }

    setRequested(true);
    setDecision((prev) => ({
      ...EMPTY_DECISION,
      requestedAdditionalLeads: prev.requestedAdditionalLeads,
    }));
    setEvaluation(null);
    setFeedbackVisible(ecgConfig.immediateFeedback);
    setStartedAt(Date.now());
    setPrintPreviewOpen(false);

    if (onCaseObjectChange && caseObject) {
      const nextRisk = riskProgression(currentRiskLabel, evalTrend);
      const updated = {
        ...caseObject,
        meta: {
          ...(caseObject.meta ?? {}),
          risk_level: nextRisk,
        },
      };
      onCaseObjectChange(updated);
    }
  };

  if (!open || !ecgConfig.enabled) return null;

  const printPreviewModal =
    printPreviewOpen && activeEcg && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/75 p-4 sm:p-6">
            <div className="w-full max-w-[1240px]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#111827]/95 px-4 py-3 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/50">Vista de impresión</div>
                  <div className="mt-1 text-base font-semibold">Formato tipo cardiología para interpretación</div>
                  <div className="mt-1 text-xs text-white/65">
                    Hoja estática a 25 mm/s y 10 mm/mV con tira larga en DII.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBrowserPrint}
                    className="rounded-xl border border-slate-300/20 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                  >
                    Imprimir con navegador
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintPreviewOpen(false)}
                    className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/85"
                  >
                    Cerrar impresión
                  </button>
                </div>
              </div>

              <div ref={printSheetRef}>
                <EcgPrintSheet
                  ecgCase={activeEcg}
                  phaseSeconds={printPhaseSeconds}
                  visibleLeads={visibleLeads}
                  resolvedViewMode={resolvedViewMode}
                  timeLabel={timeLabel}
                  contextLabel={contextLabel}
                  currentRiskLabel={currentRiskLabel}
                  revealDiagnosis={revealDiagnosis}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  if (embedded) {
    return (
      <>
        <div className="rounded-2xl border border-cyan-300/20 bg-[#07131F] p-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/50">ECG del caso</div>
              <div className="mt-1 text-sm font-semibold text-white">{monitorSubtitle}</div>
              <div className="mt-1 text-xs text-cyan-50/75">
                {requested ? "Trazado solicitado dentro del flujo del caso." : "Pulsa solicitar ECG para cargar el trazado del paciente."}
              </div>
            </div>
            <div
              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                requested
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-white/65"
              }`}
            >
              {requested ? "Live" : "Standby"}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRequestEcg}
              disabled={!activeEcg}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-45"
            >
              Solicitar ECG
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("rhythm_monitor")}
              disabled={!canUseRhythmMonitor}
              className={`rounded-xl border px-3 py-2 text-xs ${
                resolvedViewMode === "rhythm_monitor"
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-black/30 text-white/70"
              } disabled:opacity-45`}
            >
              Monitor
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("standard_12_lead")}
              disabled={!canUseStandard12Lead}
              className={`rounded-xl border px-3 py-2 text-xs ${
                resolvedViewMode === "standard_12_lead"
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-black/30 text-white/70"
              } disabled:opacity-45`}
            >
              12 derivaciones
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("expanded")}
              disabled={!canUseExpanded}
              className={`rounded-xl border px-3 py-2 text-xs ${
                resolvedViewMode === "expanded"
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-black/30 text-white/70"
              } disabled:opacity-45`}
            >
              Extra
            </button>
            <button
              type="button"
              onClick={handleOpenPrintPreview}
              disabled={!requested || !activeEcg}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/85 disabled:opacity-45"
            >
              Imprimir ECG
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-300/25 bg-[#03130C] p-3">
            {!requested || !activeEcg ? (
              <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/25 p-6 text-center text-sm text-white/65">
                Solicita el ECG para visualizar el trazado del paciente en este panel.
              </div>
            ) : resolvedViewMode === "rhythm_monitor" ? (
              <div className="h-[240px]">
                <EcgLeadStrip lead="II" profile={activeEcg.waveform} phaseSeconds={phaseSeconds} />
              </div>
            ) : (
              <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto pr-1">
                {visibleLeads.map((lead) => (
                  <div key={lead} className="h-[150px]">
                    <EcgLeadStrip lead={lead} profile={activeEcg.waveform} phaseSeconds={phaseSeconds} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-xs uppercase tracking-wider text-white/50">Monitor multiparámetro</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MonitorMetric
                  label="FC"
                  value={monitorVitals ? String(Math.max(0, monitorVitals.hr)) : "--"}
                  unit="lpm"
                  tone="green"
                  muted={!monitorVitals}
                />
                <MonitorMetric
                  label="SpO₂"
                  value={monitorVitals ? (monitorVitals.spo2 <= 0 ? "--" : String(monitorVitals.spo2)) : "--"}
                  unit="%"
                  tone="cyan"
                  muted={!monitorVitals}
                />
                <MonitorMetric
                  label="PA"
                  value={monitorVitals ? (monitorVitals.sbp <= 0 || monitorVitals.dbp <= 0 ? "--/--" : `${monitorVitals.sbp}/${monitorVitals.dbp}`) : "--/--"}
                  unit="mmHg"
                  tone="amber"
                  muted={!monitorVitals}
                  compact
                />
                <MonitorMetric
                  label="FR"
                  value={monitorVitals ? (monitorVitals.rr <= 0 ? "--" : String(monitorVitals.rr)) : "--"}
                  unit="rpm"
                  tone="violet"
                  muted={!monitorVitals}
                />
                <MonitorMetric
                  label="Temp"
                  value={monitorVitals ? monitorVitals.temp.toFixed(1) : "--"}
                  unit="°C"
                  tone="orange"
                  muted={!monitorVitals}
                />
                <MonitorMetric label="Tiempo" value={timeLabel} unit="" tone="white" muted={!requested} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/75">
              <div className="font-semibold text-white/90">
                {!activeEcg ? "Sin trazado activo" : revealDiagnosis ? activeEcg.name : "ECG solicitado del caso"}
              </div>
              <div className="mt-2 text-xs text-white/60">Riesgo del caso: {currentRiskLabel}</div>
              {activeEcg ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-white/75">
                  {activeEcg.symptomHints.slice(0, 3).map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-xs text-white/60">El monitor se completará cuando se cargue el ECG del caso.</div>
              )}
            </div>
          </div>
        </div>

        {printPreviewModal}
      </>
    );
  }

  const shellClass = standalone
    ? "h-full w-full"
    : "fixed inset-0 z-[120] bg-black/70 p-3 sm:p-5";

  const frameClass = standalone
    ? "flex h-full min-h-[820px] w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#090D16] text-white shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
    : "mx-auto flex h-[94vh] w-full max-w-[1480px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#090D16] text-white shadow-[0_30px_120px_rgba(0,0,0,0.7)]";

  return (
    <div className={shellClass}>
      <div className={frameClass}>
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 bg-[#101826]/85 px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">Simulador de ECG</div>
            <h2 className="text-lg font-semibold">Herramienta de decisión clínica integrada al caso</h2>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/70">
              <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
                Selección: {getEcgSelectionModeLabel(selectionMode)}
              </span>
              <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
                Dificultad: {getEcgDifficultyLabel(ecgConfig.difficulty)}
              </span>
              <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">Contexto: {contextLabel}</span>
              <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
                {ecgConfig.dynamicEnabled ? "ECG dinámico activo" : "ECG dinámico desactivado"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              {standalone ? "Salir de simulador ECG" : "Cerrar simulador de ECG"}
            </button>
          </div>
        </header>

        <section className="border-b border-white/10 bg-[#0C1422]/85 px-4 py-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">Selección de caso ECG</div>
                <div className="mt-1 text-sm font-semibold text-white">Configura el caso antes de abrir el monitor</div>
                <div className="mt-2 text-[11px] text-cyan-100/75">
                  1) Elige contexto y modo. 2) Genera el caso. 3) Solicita ECG. 4) Interpreta y decide.
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/65">
                Contexto activo: {contextLabel}
              </div>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[0.9fr_1fr_1fr_1.15fr_0.9fr]">
              <div>
                <label className="text-xs text-white/60">Modo de resolución</label>
                <select
                  value={trainingMode}
                  onChange={(e) => setTrainingMode(e.target.value as ECGTrainingMode)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                >
                  <option value="interpretation">Interpretación ciega</option>
                  <option value="practice">Práctica guiada</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">Tipo de caso</label>
                <select
                  value={contextSelector}
                  onChange={(e) => setContextSelector(e.target.value as "auto" | ECGClinicalContext)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                >
                  {CONTEXT_SELECTOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">Modo de selección de ECG</label>
                <select
                  value={selectionMode}
                  onChange={(e) => handleSelectionModeChange(e.target.value as ECGSelectionMode)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                >
                  <option value="contextual_random">Aleatorio contextual</option>
                  <option value="random">Aleatorio libre</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60">Trazado seleccionado</label>
                {canSelectTraceDirectly ? (
                  <select
                    value={activeEcg?.id ?? ""}
                    onChange={(e) => handleSelectManual(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                  >
                    {ECG_LIBRARY.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/80">
                    {!activeEcg
                      ? "Sin ECG seleccionado"
                      : revealDiagnosis
                      ? activeEcg.name
                      : "ECG oculto para interpretación"}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={handleRandomEcg}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-left text-sm text-cyan-100"
                >
                  {trainingMode === "practice" ? "Generar caso" : "Generar caso aleatorio"}
                </button>
                <button
                  type="button"
                  onClick={handleContinueEvolution}
                  disabled={!requested}
                  className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-left text-sm text-white/80 disabled:opacity-50"
                >
                  Continuar evolución
                </button>
              </div>
            </div>

            {attempts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attempts.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] text-white/75">
                    <span className="font-semibold text-white/90">{item.ecgName}</span> · {item.score}/100 · {trendLabel(item.trend)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/10 bg-[#0B1220]/90 px-4 py-3">
          <div className="grid min-h-full grid-cols-1 gap-3 xl:grid-cols-[1.65fr_0.95fr] xl:items-start">
            <div className="space-y-3">
              <section className="rounded-2xl border border-white/10 bg-[#03090F] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-white/55">Zona central</div>
                    <div className="text-base font-semibold">{monitorSubtitle}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRequestEcg}
                      disabled={!activeEcg}
                      className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100 disabled:opacity-45"
                    >
                      Solicitar ECG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("rhythm_monitor")}
                      disabled={!canUseRhythmMonitor}
                      className={`rounded-xl border px-3 py-1.5 text-xs ${
                        resolvedViewMode === "rhythm_monitor"
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-black/30 text-white/70"
                      } disabled:opacity-45`}
                    >
                      Monitor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("standard_12_lead")}
                      disabled={!canUseStandard12Lead}
                      className={`rounded-xl border px-3 py-1.5 text-xs ${
                        resolvedViewMode === "standard_12_lead"
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-black/30 text-white/70"
                      } disabled:opacity-45`}
                    >
                      12 derivaciones
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("expanded")}
                      disabled={!canUseExpanded}
                      className={`rounded-xl border px-3 py-1.5 text-xs ${
                        resolvedViewMode === "expanded"
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-black/30 text-white/70"
                      } disabled:opacity-45`}
                    >
                      Derivaciones extra
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenPrintPreview}
                      disabled={!requested || !activeEcg}
                      className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80 disabled:opacity-45"
                    >
                      Imprimir ECG
                    </button>
                  </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-300/25 bg-[#03130C] p-3">
                  {!requested || !activeEcg ? (
                    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/25 p-6 text-center text-sm text-white/65">
                      Solicita monitor/ECG para iniciar análisis del trazado dentro del flujo del caso clínico.
                    </div>
                  ) : resolvedViewMode === "rhythm_monitor" ? (
                    <div className="h-[240px] lg:h-[260px]">
                      <EcgLeadStrip lead="II" profile={activeEcg.waveform} phaseSeconds={phaseSeconds} />
                    </div>
                  ) : (
                    <div className="grid max-h-[380px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleLeads.map((lead) => (
                        <div key={lead} className="h-[100px] sm:h-[120px]">
                          <EcgLeadStrip lead={lead} profile={activeEcg.waveform} phaseSeconds={phaseSeconds} compact />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                  <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1">
                    Visualización: {getEcgViewModeLabel(resolvedViewMode)}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1">
                    Derivaciones visibles: {activeEcg && requested ? visibleLeads.join(", ") : "Sin caso activo"}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 ${toneByTrend(trend)}`}>
                    Evolución actual: {trendLabel(trend)}
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-xs uppercase tracking-wider text-white/50">Zona inferior · Interacciones del estudiante</div>

              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs text-white/60">{interpretationPrompt}</label>
                  <input
                    value={decision.interpretation}
                    onChange={(e) => setDecision((prev) => ({ ...prev, interpretation: e.target.value }))}
                    list="ecg-interpretation-options"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                    placeholder={interpretationPlaceholder}
                  />
                  <datalist id="ecg-interpretation-options">
                    {interpretationSuggestionOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <div className="mt-1 text-[11px] text-white/50">{interpretationFieldHelp}</div>
                </div>

                <div>
                  <label className="text-xs text-white/60">2. ¿El paciente está estable o inestable?</label>
                  <select
                    value={decision.stabilityDecision}
                    onChange={(e) =>
                      setDecision((prev) => ({ ...prev, stabilityDecision: e.target.value as ECGDecisionStability | "" }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="stable">{getDecisionStabilityLabel("stable")}</option>
                    <option value="unstable">{getDecisionStabilityLabel("unstable")}</option>
                    <option value="critical">{getDecisionStabilityLabel("critical")}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/60">3. Conducta inicial más adecuada</label>
                  <select
                    value={decision.conductId}
                    onChange={(e) => setDecision((prev) => ({ ...prev, conductId: e.target.value as ECGConductId | "" }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                  >
                    <option value="">Selecciona una conducta</option>
                    {ECG_CONDUCT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/60">4. ¿Solicitarías derivaciones adicionales?</label>
                  <select
                    value={decision.requestedAdditionalLeads}
                    onChange={(e) =>
                      setDecision((prev) => ({
                        ...prev,
                        requestedAdditionalLeads: e.target.value as ECGAdditionalLeadRequest,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                    disabled={!canUseExpanded}
                  >
                    {availableAdditionalLeadOptions.map((option) => (
                      <option key={option} value={option}>
                        {getAdditionalLeadRequestLabel(option)}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[11px] text-white/50">
                    {canUseExpanded
                      ? `Set sugerido para este ECG: ${leadSetSummary(defaultAdditionalLeadRequest)}`
                      : "Este trazado no requiere derivaciones adicionales."}
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <label className="text-xs text-white/60">
                  {revealDiagnosis ? "5. Explica por qué el ECG corresponde a este diagnóstico" : "5. Justifica tu decisión clínica"}
                </label>
                <textarea
                  value={decision.justification}
                  onChange={(e) => setDecision((prev) => ({ ...prev, justification: e.target.value }))}
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                  placeholder={
                    revealDiagnosis
                      ? "Describe los hallazgos del ECG que sostienen el diagnóstico y explica la conducta inicial."
                      : "Incluye hallazgos clave del ECG, estabilidad hemodinámica y por qué eliges la conducta inicial."
                  }
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={!requested || !activeEcg}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Evaluar decisión
                </button>

                <button
                  type="button"
                  onClick={handleContinueEvolution}
                  disabled={!requested}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 disabled:opacity-50"
                >
                  Continuar caso
                </button>

              </div>

              {activeEcg && ecgConfig.showHints && revealDiagnosis && (
                <div className="mt-3 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-2.5 text-xs text-cyan-100">
                  <div className="font-semibold">Pistas opcionales</div>
                  <div className="mt-1">{activeEcg.keyFindings.slice(0, 3).join(" · ")}</div>
                  <div className="mt-1 text-cyan-50/90">
                    Derivaciones adicionales sugeridas: {leadSetSummary(activeEcg.expectedAdditionalLeads)}
                  </div>
                </div>
              )}
              </section>
            </div>

            <div className="space-y-3">
              <aside className="rounded-[26px] border border-cyan-300/10 bg-[#050A12] p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/45">Monitor multiparámetro</div>
                    <div className="mt-1 text-sm font-semibold text-white">Signos vitales y estado hemodinámico</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                        soundEnabled
                          ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                          : "border-white/10 bg-white/5 text-white/65"
                      }`}
                    >
                      Sonido {soundEnabled ? "ON" : "OFF"}
                    </button>
                    <div
                      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                        requested
                          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                          : "border-white/10 bg-white/5 text-white/65"
                      }`}
                    >
                      {requested ? "Live" : "Standby"}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <MonitorLeadPreview
                    profile={requested && activeEcg ? activeEcg.waveform : null}
                    phaseSeconds={phaseSeconds}
                    active={requested && !!activeEcg}
                  />
                </div>

                <div className="mt-2 text-[11px] text-cyan-100/70">
                  Audio del monitor: beep por latido y alarma crítica cuando el caso se deteriora.
                </div>

                <div className="mt-2 grid gap-2">
                  <MonitorTrendStrip
                    label="Pleth SpO₂"
                    color="rgba(126,220,255,0.95)"
                    mode="pleth"
                    bpm={monitorVitals?.hr || activeEcg?.waveform.bpm || 60}
                    phaseSeconds={phaseSeconds}
                    active={requested && !!activeEcg && (monitorVitals?.spo2 ?? 0) > 0}
                  />
                  <MonitorTrendStrip
                    label="Resp"
                    color="rgba(183,166,255,0.95)"
                    mode="resp"
                    bpm={monitorVitals?.rr || 14}
                    phaseSeconds={phaseSeconds}
                    active={requested && !!activeEcg && (monitorVitals?.rr ?? 0) > 0}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MonitorMetric
                    label="FC"
                    value={monitorVitals ? String(Math.max(0, monitorVitals.hr)) : "--"}
                    unit="lpm"
                    tone="green"
                    muted={!monitorVitals}
                  />
                  <MonitorMetric
                    label="SpO₂"
                    value={monitorVitals ? (monitorVitals.spo2 <= 0 ? "--" : String(monitorVitals.spo2)) : "--"}
                    unit="%"
                    tone="cyan"
                    muted={!monitorVitals}
                  />
                  <MonitorMetric
                    label="PA"
                    value={monitorVitals ? (monitorVitals.sbp <= 0 || monitorVitals.dbp <= 0 ? "--/--" : `${monitorVitals.sbp}/${monitorVitals.dbp}`) : "--/--"}
                    unit="mmHg"
                    tone="amber"
                    muted={!monitorVitals}
                    compact
                  />
                  <MonitorMetric
                    label="FR"
                    value={monitorVitals ? (monitorVitals.rr <= 0 ? "--" : String(monitorVitals.rr)) : "--"}
                    unit="rpm"
                    tone="violet"
                    muted={!monitorVitals}
                  />
                  <MonitorMetric
                    label="Temp"
                    value={monitorVitals ? monitorVitals.temp.toFixed(1) : "--"}
                    unit="°C"
                    tone="orange"
                    muted={!monitorVitals}
                  />
                  <MonitorMetric label="Tiempo" value={timeLabel} unit="" tone="white" muted={!requested} />
                </div>

                <div className="mt-3 grid gap-2 text-xs text-white/75">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/50">Estado clínico actual</span>
                      <span className={`rounded-full border px-2 py-1 ${toneByTrend(trend)}`}>{trendLabel(trend)}</span>
                    </div>
                    <div className="mt-2 text-sm text-white/90">
                      {activeEcg ? activeEcg.probableStability.replaceAll("_", " ") : "Sin trazado activo"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="text-white/50">Riesgo del caso</div>
                    <div className="mt-2 text-sm text-white/90">{currentRiskLabel}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="text-white/50">Síntomas principales</div>
                    {activeEcg ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-white/85">
                        {activeEcg.symptomHints.slice(0, 4).map((hint) => (
                          <li key={hint}>{hint}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-white/60">Solicita el ECG para activar los datos clínicos del monitor.</div>
                    )}
                  </div>
                </div>
              </aside>

              <section className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-xs uppercase tracking-wider text-white/50">Feedback automático</div>

                {!evaluation ? (
                  <div className="mt-2 rounded-xl border border-dashed border-white/20 bg-black/25 p-3 text-xs text-white/60">
                    El sistema calificará interpretación, gravedad, conducta inicial, velocidad, coherencia y justificación.
                  </div>
                ) : (
                  <>
                    <div
                      className={`mt-2 rounded-xl border px-3 py-2 text-sm ${
                        outcomeTone(evaluation.outcome) === "emerald"
                          ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100"
                          : outcomeTone(evaluation.outcome) === "cyan"
                          ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"
                          : outcomeTone(evaluation.outcome) === "amber"
                          ? "border-amber-400/35 bg-amber-400/10 text-amber-100"
                          : "border-red-400/35 bg-red-400/10 text-red-100"
                      }`}
                    >
                      Puntaje total: <span className="font-semibold">{evaluation.totalScore}/100</span>
                    </div>

                    {!feedbackVisible && !ecgConfig.immediateFeedback ? (
                      <button
                        type="button"
                        onClick={() => setFeedbackVisible(true)}
                        className="mt-2 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs text-white/85"
                      >
                        Ver feedback detallado
                      </button>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <ScoreRow label="Interpretación" value={evaluation.rubric.interpretation} max={20} />
                        <ScoreRow label="Gravedad" value={evaluation.rubric.severity} max={20} />
                        <ScoreRow label="Conducta" value={evaluation.rubric.conduct} max={25} />
                        <ScoreRow label="Velocidad" value={evaluation.rubric.speed} max={10} />
                        <ScoreRow label="Coherencia" value={evaluation.rubric.coherence} max={10} />
                        <ScoreRow label="Justificación" value={evaluation.rubric.justification} max={10} />
                        <ScoreRow label="Derivaciones" value={evaluation.rubric.additionalLeads} max={5} />

                        <div className="rounded-xl border border-white/10 bg-black/35 p-2.5 text-[11px] text-white/75">
                          <div>{evaluation.feedback.interpretation}</div>
                          <div className="mt-1">{evaluation.feedback.stability}</div>
                          <div className="mt-1">{evaluation.feedback.conduct}</div>
                          <div className="mt-1">{evaluation.feedback.additionalLeads}</div>
                          <div className="mt-1">{evaluation.feedback.speed}</div>
                          <div className="mt-1">{evaluation.feedback.justification}</div>
                          <div className="mt-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-white/85">
                            {evaluation.feedback.summary}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {printPreviewModal}
    </div>
  );
}
