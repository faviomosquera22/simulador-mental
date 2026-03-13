"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ECG_CONDUCT_OPTIONS,
  ECG_LIBRARY,
  type ECGAdditionalLeadRequest,
  type ECGCase,
  type ECGClinicalContext,
  type ECGConductId,
  type ECGDecisionInput,
  type ECGDecisionStability,
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
  supportsEcgViewMode,
} from "@/src/lib/ecgLibrary";

type EcgWorkspaceProps = {
  open: boolean;
  caseObject: any;
  timeLabel: string;
  currentRiskLabel: string;
  standalone?: boolean;
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
  const t = phaseSeconds + xNorm * 6.2;
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
    return 1.05 * gauss(local, 0.3, 0.036) - 0.24 * gauss(local, 0.39, 0.04) + baselineWander * 0.25;
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

function formatPressure(sbp: number, dbp: number) {
  if (sbp <= 0 || dbp <= 0) return "No detectable";
  return `${sbp}/${dbp} mmHg`;
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
  const [frozen, setFrozen] = useState(false);
  const [decision, setDecision] = useState<DecisionState>(EMPTY_DECISION);
  const [evaluation, setEvaluation] = useState<ReturnType<typeof evaluateEcgDecision> | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(ecgConfig.immediateFeedback);
  const [trend, setTrend] = useState<"improves" | "stable" | "deteriorates">("stable");
  const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [selectionMode, setSelectionMode] = useState<ECGSelectionMode>(ecgConfig.selectionMode);
  const [contextSelector, setContextSelector] = useState<"auto" | ECGClinicalContext>("auto");

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
    const contextualFilter = mode === "contextual_random" ? effectiveContext : null;
    const pool = getEcgPoolForContext({ ...ecgConfig, selectionMode: mode }, contextualFilter).filter(
      (item) => item.id !== args?.excludeId
    );

    if (mode === "manual") {
      const manual = getEcgCaseById(ecgConfig.manualEcgId);
      if (manual) return manual;
    }

    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return getEcgCaseById(ecgConfig.manualEcgId) ?? ECG_LIBRARY[0];
  }

  useEffect(() => {
    if (!ecgConfigStable.enabled) return;
    setSelectionMode(ecgConfigStable.selectionMode);
    setContextSelector("auto");

    const defaultContext = ecgConfigStable.selectionMode === "contextual_random" ? inferredContext : null;
    const defaultPool = getEcgPoolForContext(ecgConfigStable, defaultContext);
    const manual = ecgConfigStable.selectionMode === "manual" ? getEcgCaseById(ecgConfigStable.manualEcgId) : null;
    const seed =
      manual ??
      (defaultPool.length > 0 ? defaultPool[Math.floor(Math.random() * defaultPool.length)] : null) ??
      ECG_LIBRARY[0];

    setActiveEcg(seed);
    setViewMode(ecgConfigStable.viewMode);
    setRequested(false);
    setDecision(EMPTY_DECISION);
    setEvaluation(null);
    setFeedbackVisible(ecgConfigStable.immediateFeedback);
    setTrend("stable");
    setStartedAt(null);
  }, [caseId, ecgConfigStable, inferredContext]);

  useEffect(() => {
    if (!open) return;
    if (frozen) return;
    setTick(Date.now());
    const id = window.setInterval(() => setTick(Date.now()), 110);
    return () => window.clearInterval(id);
  }, [open, frozen]);

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

  const interpretationOptions = useMemo(() => ECG_LIBRARY.map((item) => item.name), []);

  const monitorSubtitle = useMemo(() => {
    if (!activeEcg) return "Sin trazado activo";
    if (ecgConfig.showRhythmName) return activeEcg.name;
    return `${getEcgDifficultyLabel(activeEcg.difficulty)} · ${activeEcg.category}`;
  }, [activeEcg, ecgConfig.showRhythmName]);

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
    setRequested(true);
    setStartedAt(Date.now());
    setEvaluation(null);
    setFeedbackVisible(ecgConfig.immediateFeedback);
  };

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
  };

  const handleRandomEcg = () => {
    const next = pickEcgFromControls({ excludeId: activeEcg?.id });
    setActiveEcg(next);
    setRequested(false);
    setDecision(EMPTY_DECISION);
    setEvaluation(null);
    setTrend("stable");
    setStartedAt(null);
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
  };

  const handleEvaluate = () => {
    if (!activeEcg || !requested) return;

    const input: ECGDecisionInput = {
      interpretation: decision.interpretation,
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
    setFrozen(false);
    setDecision((prev) => ({
      ...EMPTY_DECISION,
      requestedAdditionalLeads: prev.requestedAdditionalLeads,
    }));
    setEvaluation(null);
    setFeedbackVisible(ecgConfig.immediateFeedback);
    setStartedAt(Date.now());

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

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1.65fr_0.95fr]">
          <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#03090F] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-white/55">Zona central</div>
                <div className="text-base font-semibold">{monitorSubtitle}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestEcg}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100"
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
                  onClick={() => setFrozen((prev) => !prev)}
                  className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80"
                >
                  {frozen ? "Continuar trazado" : "Pausar/congelar"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-emerald-300/25 bg-[#03130C] p-3">
              {!requested || !activeEcg ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/25 p-6 text-center text-sm text-white/65">
                  Solicita monitor/ECG para iniciar análisis del trazado dentro del flujo del caso clínico.
                </div>
              ) : resolvedViewMode === "rhythm_monitor" ? (
                <div className="h-full min-h-[260px]">
                  <EcgLeadStrip lead="II" profile={activeEcg.waveform} phaseSeconds={phaseSeconds} />
                </div>
              ) : (
                <div className="grid max-h-full grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
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
                Derivaciones visibles: {visibleLeads.join(", ")}
              </span>
              <span className={`rounded-full border px-2.5 py-1 ${toneByTrend(trend)}`}>
                Evolución actual: {trendLabel(trend)}
              </span>
            </div>
          </section>

          <aside className="min-h-0 space-y-3 overflow-y-auto">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs uppercase tracking-wider text-white/50">Panel lateral derecho</div>
              <div className="mt-2 text-sm font-semibold">Signos vitales y estado</div>

              {derivedVitals ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <div className="text-white/55">FC</div>
                    <div className="mt-1 text-white/90">{derivedVitals.hr <= 0 ? "Sin pulso" : `${derivedVitals.hr} lpm`}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <div className="text-white/55">PA</div>
                    <div className="mt-1 text-white/90">{formatPressure(derivedVitals.sbp, derivedVitals.dbp)}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <div className="text-white/55">SpO₂</div>
                    <div className="mt-1 text-white/90">{derivedVitals.spo2 <= 0 ? "No lectura" : `${derivedVitals.spo2}%`}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <div className="text-white/55">FR</div>
                    <div className="mt-1 text-white/90">{derivedVitals.rr <= 0 ? "Apnea" : `${derivedVitals.rr} rpm`}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <div className="text-white/55">Temp</div>
                    <div className="mt-1 text-white/90">{derivedVitals.temp.toFixed(1)}°C</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                    <div className="text-white/55">Temporizador</div>
                    <div className="mt-1 text-white/90">{timeLabel}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-white/65">Sin trazado activo.</div>
              )}

              {activeEcg && (
                <>
                  <div className="mt-3 text-xs text-white/55">Estado clínico actual</div>
                  <div className="mt-1 text-sm text-white/85">{activeEcg.probableStability.replaceAll("_", " ")}</div>

                  <div className="mt-3 text-xs text-white/55">Síntomas principales</div>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-white/75">
                    {activeEcg.symptomHints.slice(0, 4).map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                </>
              )}

              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs text-white/65">
                Riesgo del caso: {currentRiskLabel}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs uppercase tracking-wider text-white/50">Selección de caso ECG</div>
              <div className="mt-2 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-2.5 text-[11px] text-cyan-100">
                1) Elige tipo de caso y modo. 2) Pulsa &quot;Generar caso aleatorio&quot;. 3) Luego solicita ECG.
              </div>

              <div className="mt-3 space-y-2">
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

                {selectionMode === "manual" && (
                  <div>
                    <label className="text-xs text-white/60">Seleccionar trazado manual</label>
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
                  </div>
                )}
              </div>

              <div className="mt-2 text-[11px] text-white/60">
                Contexto activo: <span className="text-white/85">{contextLabel}</span>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleRandomEcg}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-left text-cyan-100"
                >
                  Generar caso aleatorio
                </button>
                <button
                  type="button"
                  onClick={handleContinueEvolution}
                  disabled={!requested}
                  className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-left text-white/80 disabled:opacity-50"
                >
                  Continuar evolución
                </button>
              </div>

              {attempts.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] text-white/55">Últimos intentos</div>
                  {attempts.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[11px] text-white/75">
                      <div className="font-semibold text-white/90">{item.ecgName}</div>
                      <div className="mt-0.5">{item.score}/100 · {trendLabel(item.trend)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        <section className="border-t border-white/10 bg-[#0B1220]/90 px-4 py-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="text-xs uppercase tracking-wider text-white/50">Zona inferior · Interacciones del estudiante</div>

              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs text-white/60">1. ¿Qué ritmo o alteración observas?</label>
                  <input
                    value={decision.interpretation}
                    onChange={(e) => setDecision((prev) => ({ ...prev, interpretation: e.target.value }))}
                    list="ecg-interpretation-options"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                    placeholder="Ej: Fibrilación auricular"
                  />
                  <datalist id="ecg-interpretation-options">
                    {interpretationOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <div className="mt-1 text-[11px] text-white/50">Este campo es manual y no se autocompleta.</div>
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
                <label className="text-xs text-white/60">5. Justifica tu decisión clínica</label>
                <textarea
                  value={decision.justification}
                  onChange={(e) => setDecision((prev) => ({ ...prev, justification: e.target.value }))}
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white/85 outline-none"
                  placeholder="Incluye hallazgos clave del ECG, estabilidad hemodinámica y por qué eliges la conducta inicial."
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

              {activeEcg && ecgConfig.showHints && (
                <div className="mt-3 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-2.5 text-xs text-cyan-100">
                  <div className="font-semibold">Pistas opcionales</div>
                  <div className="mt-1">{activeEcg.keyFindings.slice(0, 3).join(" · ")}</div>
                  <div className="mt-1 text-cyan-50/90">
                    Derivaciones adicionales sugeridas: {leadSetSummary(activeEcg.expectedAdditionalLeads)}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
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
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
