"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import { getHistory, type SessionRecord } from "../../lib/history";
import {
  DASHBOARD_GROUP_LABELS,
  DASHBOARD_MODULES,
  DASHBOARD_NEW_BANK_TOTAL,
  DASHBOARD_NEW_MODULES,
  type DashboardModuleGroup,
  type DashboardModuleMeta,
} from "@/src/lib/dashboardCatalog";

type TranscriptTurn = { role: string; content: string };

type StoredSession = {
  id: string;
  caseId?: string;
  caseTitle?: string;
  patientName?: string;
  endedAt?: string;
  reason?: string;
  targetMinutes?: number;
  durationMin?: number;
  score?: number;
  riskLevel: "Bajo" | "Moderado" | "Alto" | "—";
  transcript?: TranscriptTurn[];
};

type AdvisorIntent = "continuidad" | "diagnostico" | "intervencion" | "documentacion" | "avanzado";
type AdvisorFormat = "guiado" | "visual" | "intensivo";
type AdvisorTime = "15" | "30" | "60";

type ModuleAdvisorMeta = {
  intents: AdvisorIntent[];
  formats: AdvisorFormat[];
  minMinutes: number;
  maxMinutes: number;
  companionIds: string[];
};

const DASHBOARD_GROUP_ORDER: DashboardModuleGroup[] = [
  "simulacion",
  "diagnostico",
  "avanzado",
  "practica",
  "seguimiento",
];

const GROUP_DESCRIPTIONS: Record<DashboardModuleGroup, string> = {
  simulacion: "Escenarios progresivos, priorización inicial y decisiones clínicas con continuidad.",
  diagnostico: "Interpretación de ECG, ecografía, laboratorio y gasometría para decidir mejor.",
  avanzado: "Entrenamiento inmersivo, soporte vital y casos clínicos de mayor complejidad.",
  practica: "Procedimientos, medicamentos, cálculo, notas y PAE como bloque operativo.",
  seguimiento: "Historial, evaluación y consolidación del progreso académico.",
};

const GROUP_PRIMARY_LINKS: Record<DashboardModuleGroup, string> = {
  simulacion: "/cases",
  diagnostico: "/ecg-simulator",
  avanzado: "/dynamic-simulator",
  practica: "/medications",
  seguimiento: "/history",
};

const INTENT_OPTIONS: Array<{ id: AdvisorIntent; label: string; helper: string }> = [
  {
    id: "continuidad",
    label: "Continuidad",
    helper: "Entrevista, evolución y cierre clínico.",
  },
  {
    id: "diagnostico",
    label: "Estudios",
    helper: "ECG, eco, laboratorio y gasometría.",
  },
  {
    id: "intervencion",
    label: "Intervención",
    helper: "Urgencias, medicamentos y procedimientos.",
  },
  {
    id: "documentacion",
    label: "Documentación",
    helper: "PAE, notas y evaluación rápida.",
  },
  {
    id: "avanzado",
    label: "Avanzado",
    helper: "Escenarios inmersivos y algoritmos.",
  },
];

const FORMAT_OPTIONS: Array<{ id: AdvisorFormat; label: string; helper: string }> = [
  {
    id: "guiado",
    label: "Guiado",
    helper: "Paso a paso, ideal para ordenar criterio y flujo.",
  },
  {
    id: "visual",
    label: "Visual",
    helper: "Lectura e interpretación clínica sobre hallazgos o monitores.",
  },
  {
    id: "intensivo",
    label: "Intensivo",
    helper: "Mayor presión, respuesta rápida y decisiones más densas.",
  },
];

const TIME_OPTIONS: Array<{ id: AdvisorTime; label: string; helper: string }> = [
  { id: "15", label: "15 min", helper: "Sesión breve y enfocada." },
  { id: "30", label: "30 min", helper: "Bloque equilibrado para practicar." },
  { id: "60", label: "60+ min", helper: "Trabajo profundo o inmersivo." },
];

const MODULE_PLAYBOOK: Record<string, ModuleAdvisorMeta> = {
  "mental-sim": {
    intents: ["continuidad", "documentacion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 30,
    maxMinutes: 60,
    companionIds: ["notes", "pae-assistant"],
  },
  pathologies: {
    intents: ["continuidad", "diagnostico"],
    formats: ["guiado", "intensivo"],
    minMinutes: 20,
    maxMinutes: 45,
    companionIds: ["laboratory", "clinical-calculations"],
  },
  urgencies: {
    intents: ["intervencion", "continuidad"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["triage", "medications"],
  },
  triage: {
    intents: ["intervencion", "continuidad"],
    formats: ["guiado"],
    minMinutes: 10,
    maxMinutes: 20,
    companionIds: ["urgencies", "pathologies"],
  },
  ecg: {
    intents: ["diagnostico", "avanzado"],
    formats: ["visual", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["laboratory", "dynamic-simulator"],
  },
  ultrasound: {
    intents: ["diagnostico", "avanzado"],
    formats: ["visual", "guiado"],
    minMinutes: 20,
    maxMinutes: 40,
    companionIds: ["clinical-images", "dynamic-simulator"],
  },
  laboratory: {
    intents: ["diagnostico", "intervencion"],
    formats: ["visual", "guiado"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["gasometry", "ecg"],
  },
  gasometry: {
    intents: ["diagnostico", "intervencion"],
    formats: ["visual", "intensivo"],
    minMinutes: 15,
    maxMinutes: 25,
    companionIds: ["laboratory", "urgencies"],
  },
  "clinical-images": {
    intents: ["avanzado", "diagnostico"],
    formats: ["visual", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["ultrasound", "dynamic-simulator"],
  },
  "rcp-algorithms": {
    intents: ["avanzado", "intervencion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["urgencies", "dynamic-simulator"],
  },
  "dynamic-simulator": {
    intents: ["avanzado", "continuidad"],
    formats: ["intensivo", "visual"],
    minMinutes: 30,
    maxMinutes: 60,
    companionIds: ["ecg", "laboratory"],
  },
  "materno-infantil": {
    intents: ["avanzado", "continuidad"],
    formats: ["guiado", "intensivo"],
    minMinutes: 25,
    maxMinutes: 45,
    companionIds: ["ultrasound", "medications"],
  },
  calculations: {
    intents: ["intervencion", "documentacion"],
    formats: ["guiado"],
    minMinutes: 10,
    maxMinutes: 20,
    companionIds: ["medications", "procedures"],
  },
  medications: {
    intents: ["intervencion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 25,
    companionIds: ["calculations", "procedures"],
  },
  procedures: {
    intents: ["intervencion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["medications", "urgencies"],
  },
  notes: {
    intents: ["documentacion"],
    formats: ["guiado"],
    minMinutes: 15,
    maxMinutes: 25,
    companionIds: ["pae", "pae-assistant"],
  },
  pae: {
    intents: ["documentacion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 25,
    maxMinutes: 45,
    companionIds: ["notes", "pae-assistant"],
  },
  "pae-assistant": {
    intents: ["documentacion"],
    formats: ["guiado"],
    minMinutes: 10,
    maxMinutes: 20,
    companionIds: ["pae", "notes"],
  },
  caces: {
    intents: ["documentacion", "avanzado"],
    formats: ["intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["notes", "pae"],
  },
};

function safeText(v: any, fallback = "—") {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t ? t : fallback;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function formatDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return s;
  }
}

function shortReason(reason?: string) {
  const r = (reason || "").toLowerCase();
  if (r.includes("timeout")) return "Tiempo";
  if (r.includes("manual")) return "Manual";
  return reason ? safeText(reason) : "—";
}

function loadJSON(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hasCaseInProgress(): boolean {
  try {
    const ended = localStorage.getItem("sessionEnded");
    if (ended === "true") return false;
    const raw = localStorage.getItem("activeCase");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed;
  } catch {
    return false;
  }
}

function extractActiveCaseMeta(caseObj: any) {
  const meta = caseObj?.meta ?? {};
  const title = safeText(meta?.title ?? caseObj?.title ?? caseObj?.essentials?.title, "Caso");
  const targetMinutes = Number(meta?.target_minutes ?? caseObj?.config?.targetMinutes ?? caseObj?.timer?.minutes);
  const dsmTag = safeText(meta?.dsm_tag, "—");
  const patientName = safeText(
    caseObj?.patient_profile?.display_name ?? caseObj?.patient?.name ?? caseObj?.patientName,
    "Paciente"
  );
  const risk = safeText(caseObj?.safety?.risk_level ?? meta?.risk_level, "—");

  return {
    title,
    patientName,
    targetMinutes: Number.isFinite(targetMinutes) ? clampInt(targetMinutes, 5, 60) : undefined,
    dsmTag,
    risk,
  };
}

function computeSimpleScoreFromTranscript(transcript: TranscriptTurn[]) {
  const joined = transcript
    .map((t) => String(t.content || "").toLowerCase())
    .join(" \n");

  const hasOpen = /\b(c[oó]mo te|qu[eé] te trajo|cu[eé]ntame|qu[eé] ha pasado|desde cu[aá]ndo)\b/.test(joined);
  const hasSafety = /\b(suicid|hacerte da[nñ]o|no querer estar|matarme|morir)\b/.test(joined);
  const hasFunction = /\b(trabajo|funcional|vida diaria|estudio)\b/.test(joined);

  let score = 60;
  if (hasOpen) score += 10;
  if (hasFunction) score += 8;
  if (hasSafety) score += 12;
  score += Math.min(10, Math.floor(transcript.length / 4));
  return clampInt(score, 0, 100);
}

function deriveRiskLevelFromFlags(flags: string[] | undefined): "Bajo" | "Moderado" | "Alto" | "—" {
  if (!Array.isArray(flags) || flags.length === 0) return "—";
  const clean = flags.map((f) => String(f).toLowerCase());
  const riskFlags = clean.filter((f) => f.includes("risk:"));
  if (!riskFlags.length) return "Bajo";
  if (riskFlags.some((f) => f.includes("self_harm") || f.includes("plan") || f.includes("intent") || f.includes("means"))) {
    return "Alto";
  }
  if (riskFlags.length >= 2) return "Moderado";
  return "Bajo";
}

function normalizeRiskLevel(value?: string | null): StoredSession["riskLevel"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("alto")) return "Alto";
  if (normalized.includes("moderado")) return "Moderado";
  if (normalized.includes("bajo")) return "Bajo";
  return "—";
}

function mapSessionRecord(s: SessionRecord): StoredSession {
  const transcript = Array.isArray(s.transcript) ? (s.transcript as TranscriptTurn[]) : [];
  return {
    id: safeText(s.sessionId, String(Date.now())),
    caseId: s.caseId,
    caseTitle: s.caseTitle,
    patientName: s.patientName,
    endedAt: s.endedAt,
    reason: s.endReason,
    targetMinutes: s.targetMinutes,
    durationMin: Number.isFinite(s.durationSec) ? clampInt(s.durationSec / 60, 1, 120) : undefined,
    score: transcript.length ? computeSimpleScoreFromTranscript(transcript) : undefined,
    riskLevel: deriveRiskLevelFromFlags(s.lastMeta?.flags),
    transcript,
  };
}

function readHistorySessions(): StoredSession[] {
  const modern = getHistory();
  if (modern.length) return modern.map(mapSessionRecord);

  const rawA = loadJSON("sessionHistory");
  const rawB = loadJSON("vita.sessionHistory");
  const raw = rawA ?? rawB;

  const mapLegacy = (s: any, idx: number): StoredSession => {
    const transcript = Array.isArray(s?.transcript) ? (s.transcript as TranscriptTurn[]) : [];
    return {
      id: safeText(s?.id, String(idx)),
      caseId: s?.caseId,
      caseTitle: s?.caseTitle ?? s?.case_title,
      patientName: s?.patientName,
      endedAt: s?.endedAt ?? s?.ended_at ?? s?.createdAt,
      reason: s?.reason ?? s?.end_reason,
      targetMinutes: Number(s?.targetMinutes),
      durationMin: Number.isFinite(Number(s?.durationSec)) ? clampInt(Number(s.durationSec) / 60, 1, 120) : undefined,
      score:
        typeof s?.score === "number"
          ? clampInt(s.score, 0, 100)
          : transcript.length
          ? computeSimpleScoreFromTranscript(transcript)
          : undefined,
      riskLevel: deriveRiskLevelFromFlags(Array.isArray(s?.lastMeta?.flags) ? s.lastMeta.flags : undefined),
      transcript,
    };
  };

  if (Array.isArray(raw)) return raw.map(mapLegacy);
  if (raw && Array.isArray((raw as any).sessions)) return (raw as any).sessions.map(mapLegacy);
  return [];
}

function riskBadgeClass(level: StoredSession["riskLevel"]) {
  if (level === "Alto") return "border-red-400/25 bg-red-400/10 text-red-100";
  if (level === "Moderado") return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (level === "Bajo") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  return "border-white/15 bg-black/30 text-white/70";
}

function groupBadgeClass(group: DashboardModuleGroup) {
  if (group === "simulacion") return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  if (group === "diagnostico") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  if (group === "avanzado") return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100";
  if (group === "practica") return "border-orange-400/20 bg-orange-400/10 text-orange-100";
  return "border-slate-300/20 bg-slate-300/10 text-slate-100";
}

function getIntentLabel(intent: AdvisorIntent) {
  return INTENT_OPTIONS.find((option) => option.id === intent)?.label ?? intent;
}

function getFormatLabel(format: AdvisorFormat) {
  return FORMAT_OPTIONS.find((option) => option.id === format)?.label ?? format;
}

function getTimeLabel(time: AdvisorTime) {
  return TIME_OPTIONS.find((option) => option.id === time)?.label ?? time;
}

function formatWindow(playbook: ModuleAdvisorMeta) {
  return playbook.minMinutes === playbook.maxMinutes
    ? `${playbook.minMinutes} min`
    : `${playbook.minMinutes}-${playbook.maxMinutes} min`;
}

function getTimeScore(time: AdvisorTime, playbook: ModuleAdvisorMeta) {
  const minutes = Number(time);
  if (minutes >= playbook.minMinutes && minutes <= playbook.maxMinutes) return 3;
  const distance = minutes < playbook.minMinutes ? playbook.minMinutes - minutes : minutes - playbook.maxMinutes;
  if (distance <= 15) return 1;
  return 0;
}

function compactText(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function getFocusState(intent: AdvisorIntent, hasActive: boolean, hasHighRisk: boolean, avgScore?: number) {
  if (hasActive && intent === "continuidad") {
    return {
      eyebrow: "Continuidad prioritaria",
      title: "Retoma el caso activo",
      description:
        "Conserva contexto, evolución y cierre clínico sin perder continuidad.",
    };
  }

  if (hasHighRisk && intent === "intervencion") {
    return {
      eyebrow: "Seguridad primero",
      title: "Prioriza respuesta rápida",
      description:
        "Tus datos recientes piden reforzar urgencias, monitorización y conducta inicial.",
    };
  }

  if (intent === "diagnostico") {
    return {
      eyebrow: "Lectura clínica",
      title: "Entrena lectura antes de decidir",
      description:
        "Elige el módulo diagnóstico que mejor encaje con tu tiempo y modalidad.",
    };
  }

  if (intent === "documentacion") {
    return {
      eyebrow: "Cierre y evidencia",
      title: "Convierte práctica en registro",
      description:
        "Consolida lo aprendido con notas, PAE y evaluación más ordenada.",
    };
  }

  if (typeof avgScore === "number" && avgScore < 72) {
    return {
      eyebrow: "Reforzamiento",
      title: "Primero precisión clínica",
      description:
        "Conviene fortalecer la base diagnóstica y operativa antes de subir complejidad.",
    };
  }

  return {
    eyebrow: "Navegador clínico",
    title: "Elige mejor y entra más rápido",
    description:
      "Selecciona objetivo, modalidad y tiempo para recibir una ruta recomendada.",
  };
}

export default function DashboardPage() {
  const [hasActive, setHasActive] = useState(false);
  const [activeCase, setActiveCase] = useState<any>(null);
  const [activeTranscript, setActiveTranscript] = useState<TranscriptTurn[]>([]);
  const [endedInfo, setEndedInfo] = useState<any>(null);
  const [history, setHistory] = useState<StoredSession[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<AdvisorIntent>("continuidad");
  const [selectedFormat, setSelectedFormat] = useState<AdvisorFormat>("guiado");
  const [selectedTime, setSelectedTime] = useState<AdvisorTime>("30");
  const [advisorTouched, setAdvisorTouched] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setHasActive(hasCaseInProgress());
      setActiveCase(loadJSON("activeCase"));
      const t = loadJSON("activeTranscript");
      setActiveTranscript(Array.isArray(t) ? (t as TranscriptTurn[]) : []);
      setEndedInfo(loadJSON("sessionEndedInfo"));
      setHistory(readHistorySessions());
    };

    refresh();

    window.addEventListener("storage", refresh);
    const id = window.setInterval(refresh, 900);
    return () => {
      window.removeEventListener("storage", refresh);
      window.clearInterval(id);
    };
  }, []);

  const meta = useMemo(() => extractActiveCaseMeta(activeCase), [activeCase]);

  const activeScore = useMemo(() => {
    if (!activeTranscript.length) return undefined;
    return computeSimpleScoreFromTranscript(activeTranscript);
  }, [activeTranscript]);

  const completedCount = history.length;

  const avgDuration = useMemo(() => {
    const values = history
      .map((h) => Number(h.durationMin ?? h.targetMinutes))
      .filter((n) => Number.isFinite(n) && n > 0) as number[];
    if (!values.length) return undefined;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return clampInt(avg, 1, 120);
  }, [history]);

  const avgScore = useMemo(() => {
    const values = history
      .map((h) => Number(h.score))
      .filter((n) => Number.isFinite(n)) as number[];
    if (!values.length) return undefined;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return clampInt(avg, 0, 100);
  }, [history]);

  const lastClosed = history[0];
  const currentRiskLevel = hasActive ? normalizeRiskLevel(meta.risk) : lastClosed?.riskLevel ?? "—";
  const hasHighRisk = history.some((h) => h.riskLevel === "Alto") || currentRiskLevel === "Alto";

  const suggestedAdvisor = useMemo(() => {
    const intent: AdvisorIntent = hasActive
      ? "continuidad"
      : hasHighRisk
      ? "intervencion"
      : typeof avgScore === "number" && avgScore < 72
      ? "diagnostico"
      : completedCount > 0
      ? "avanzado"
      : "continuidad";

    const format: AdvisorFormat =
      intent === "diagnostico" ? "visual" : intent === "avanzado" ? "intensivo" : "guiado";

    const time: AdvisorTime = hasActive && meta.targetMinutes
      ? meta.targetMinutes <= 20
        ? "15"
        : meta.targetMinutes <= 45
        ? "30"
        : "60"
      : avgDuration
      ? avgDuration <= 20
        ? "15"
        : avgDuration <= 45
        ? "30"
        : "60"
      : "30";

    return { intent, format, time };
  }, [avgDuration, avgScore, completedCount, hasActive, hasHighRisk, meta.targetMinutes]);

  useEffect(() => {
    if (advisorTouched) return;
    setSelectedIntent(suggestedAdvisor.intent);
    setSelectedFormat(suggestedAdvisor.format);
    setSelectedTime(suggestedAdvisor.time);
  }, [advisorTouched, suggestedAdvisor]);

  const focusState = useMemo(
    () => getFocusState(selectedIntent, hasActive, hasHighRisk, avgScore),
    [avgScore, hasActive, hasHighRisk, selectedIntent]
  );

  const recommendations = useMemo(() => {
    return DASHBOARD_MODULES.map((module) => {
      const playbook = MODULE_PLAYBOOK[module.id] ?? {
        intents: ["continuidad"],
        formats: ["guiado"],
        minMinutes: 15,
        maxMinutes: 30,
        companionIds: [],
      };

      let score = module.highlight ? 1 : 0;
      if (playbook.intents.includes(selectedIntent)) score += 5;
      if (playbook.formats.includes(selectedFormat)) score += 3;
      score += getTimeScore(selectedTime, playbook);

      if (hasActive && selectedIntent === "continuidad" && module.group === "simulacion") score += 2;
      if (hasHighRisk && ["urgencies", "ecg", "laboratory", "gasometry", "rcp-algorithms"].includes(module.id)) score += 2;
      if (typeof avgScore === "number" && avgScore < 72 && (module.group === "diagnostico" || module.group === "practica")) {
        score += 2;
      }
      if (selectedIntent === "documentacion" && ["pae", "pae-assistant", "notes", "caces"].includes(module.id)) {
        score += 1;
      }
      if (selectedIntent === "avanzado" && module.group === "avanzado") {
        score += 1;
      }

      const reasons: string[] = [];
      if (playbook.intents.includes(selectedIntent)) {
        reasons.push(`Alineado con ${getIntentLabel(selectedIntent).toLowerCase()}.`);
      }
      if (playbook.formats.includes(selectedFormat)) {
        reasons.push(`Encaja con modalidad ${getFormatLabel(selectedFormat).toLowerCase()}.`);
      }
      reasons.push(`Ventana sugerida: ${formatWindow(playbook)}.`);

      if (hasActive && selectedIntent === "continuidad" && module.group === "simulacion") {
        reasons.push("Mantiene continuidad clínica con tu caso actual.");
      } else if (hasHighRisk && ["urgencies", "ecg", "laboratory", "gasometry", "rcp-algorithms"].includes(module.id)) {
        reasons.push("Refuerza seguridad y respuesta rápida.");
      } else if (typeof avgScore === "number" && avgScore < 72 && (module.group === "diagnostico" || module.group === "practica")) {
        reasons.push("Ayuda a subir precisión antes de escenarios más complejos.");
      } else if (module.count && module.countLabel) {
        reasons.push(`${module.count} ${module.countLabel} disponibles para practicar.`);
      }

      return {
        ...module,
        score,
        reasons: reasons.slice(0, 4),
        playbook,
      };
    }).sort((a, b) => b.score - a.score || Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)));
  }, [avgScore, hasActive, hasHighRisk, selectedFormat, selectedIntent, selectedTime]);

  const topRecommendation = recommendations[0];
  const secondaryRecommendations = recommendations.slice(1, 4);

  const topRoute = useMemo(() => {
    if (!topRecommendation) return [];
    const ids = [topRecommendation.id, ...topRecommendation.playbook.companionIds];
    const seen = new Set<string>();
    return ids
      .map((id) => DASHBOARD_MODULES.find((module) => module.id === id))
      .filter((module): module is DashboardModuleMeta => Boolean(module))
      .filter((module) => {
        if (seen.has(module.id)) return false;
        seen.add(module.id);
        return true;
      })
      .slice(0, 3);
  }, [topRecommendation]);

  const groupedModules = useMemo(
    () =>
      DASHBOARD_GROUP_ORDER.map((group) => ({
        group,
        label: DASHBOARD_GROUP_LABELS[group],
        items: DASHBOARD_MODULES.filter((item) => item.group === group),
      })),
    []
  );

  const primaryAction = hasActive
    ? { href: "/simulator", label: "Reanudar caso", helper: "Retoma entrevista, decisiones y evolución del escenario activo." }
    : { href: topRecommendation?.href ?? "/cases", label: "Abrir recomendación", helper: "Entra directo al módulo que mejor se ajusta al objetivo actual." };

  const contextMetrics = [
    {
      label: "Sesiones cerradas",
      value: String(completedCount),
      helper: "Historial listo para orientar la práctica.",
    },
    {
      label: "Puntaje clínico",
      value: avgScore != null ? `${avgScore}/100` : activeScore != null ? `${activeScore}/100` : "—",
      helper: avgScore != null ? "Promedio de cierres guardados." : "Estimado de la sesión actual.",
    },
    {
      label: "Riesgo reciente",
      value: currentRiskLevel,
      helper: "Se usa para priorizar seguridad cuando hace falta.",
    },
    {
      label: "Banco nuevo",
      value: String(DASHBOARD_NEW_BANK_TOTAL),
      helper: `${DASHBOARD_NEW_MODULES.length} módulos ampliados disponibles.`,
    },
  ];

  const openSessionReport = (session: StoredSession) => {
    try {
      localStorage.setItem("activeTranscript", JSON.stringify(session.transcript ?? []));
      localStorage.setItem(
        "activeCase",
        JSON.stringify({
          id: session.caseId,
          meta: { title: session.caseTitle },
          patient_profile: { display_name: session.patientName ?? "Paciente" },
        })
      );
    } catch {
      // ignore
    }
    window.location.assign("/results");
  };

  const selectIntent = (intent: AdvisorIntent) => {
    setAdvisorTouched(true);
    setSelectedIntent(intent);
  };

  const selectFormat = (format: AdvisorFormat) => {
    setAdvisorTouched(true);
    setSelectedFormat(format);
  };

  const selectTime = (time: AdvisorTime) => {
    setAdvisorTouched(true);
    setSelectedTime(time);
  };

  const restoreSuggestedAdvisor = () => {
    setAdvisorTouched(false);
    setSelectedIntent(suggestedAdvisor.intent);
    setSelectedFormat(suggestedAdvisor.format);
    setSelectedTime(suggestedAdvisor.time);
  };

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1520px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,11,17,0.96),rgba(8,11,17,0.88))] shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <header className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 lg:flex-row lg:items-center">
            <div>
              <div className="text-sm text-white/55">Dashboard</div>
              <div className="mt-1 text-xl font-semibold text-white">Navegador clínico del ecosistema Psyke</div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Link href="/reports" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5">
                Reportes
              </Link>
              <Link href="/history" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5">
                Historial
              </Link>
              <Link href="/cases" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90">
                + Nuevo caso
              </Link>
            </div>
          </header>

          <div className="overflow-y-auto px-5 py-6">
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0A1018] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_24%),linear-gradient(135deg,#0B1018,#101826_55%,#0A0F17)]" />

              <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px] 2xl:grid-cols-[minmax(0,1.55fr)_390px]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
                    {focusState.eyebrow}
                  </div>
                  <h1 className="mt-4 max-w-[14ch] text-3xl font-semibold leading-tight text-white sm:text-[2.7rem]">
                    {focusState.title}
                  </h1>
                  <p className="mt-4 max-w-[62ch] text-sm leading-6 text-white/70 sm:text-[15px]">
                    {focusState.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/75">
                      {DASHBOARD_MODULES.length} módulos activos
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
                      Recomendación en tiempo real
                    </span>
                    <span className={`rounded-full border px-3 py-1.5 text-xs ${riskBadgeClass(currentRiskLevel)}`}>
                      Riesgo {currentRiskLevel}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/75">
                      Tiempo sugerido: {getTimeLabel(selectedTime)}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">1. ¿Qué quieres practicar hoy?</div>
                        <span className="text-xs text-white/45">Objetivo principal</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                        {INTENT_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectIntent(option.id)}
                            className={`rounded-2xl border px-4 py-3 text-left transition ${
                              selectedIntent === option.id
                                ? "border-cyan-300/30 bg-cyan-400/12 text-white shadow-[0_18px_45px_rgba(34,211,238,0.08)]"
                                : "border-white/10 bg-white/[0.03] text-white/76 hover:bg-white/8"
                            }`}
                          >
                            <div className="text-sm font-semibold">{option.label}</div>
                            <div className="mt-1 text-xs leading-5 text-white/55">{option.helper}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">2. Ajusta el modo</div>
                          <span className="text-xs text-white/45">Cómo entrenar</span>
                        </div>
                        <div className="mt-4 grid gap-3 lg:grid-cols-3">
                          {FORMAT_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => selectFormat(option.id)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                selectedFormat === option.id
                                  ? "border-emerald-300/30 bg-emerald-400/12 text-white"
                                  : "border-white/10 bg-white/[0.03] text-white/76 hover:bg-white/8"
                              }`}
                            >
                              <div className="text-sm font-semibold">{option.label}</div>
                              <div className="mt-1 text-xs leading-5 text-white/55">{option.helper}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">3. Tiempo disponible</div>
                          <span className="text-xs text-white/45">Duración estimada</span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {TIME_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => selectTime(option.id)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                selectedTime === option.id
                                  ? "border-orange-300/30 bg-orange-400/12 text-white"
                                  : "border-white/10 bg-white/[0.03] text-white/76 hover:bg-white/8"
                              }`}
                            >
                              <div className="text-sm font-semibold">{option.label}</div>
                              <div className="mt-1 text-xs leading-5 text-white/55">{option.helper}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[30px] border border-white/10 bg-black/28 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          Mejor ajuste hoy
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-white">{topRecommendation?.label ?? "Sin recomendación"}</div>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${groupBadgeClass(topRecommendation?.group ?? "seguimiento")}`}>
                        {topRecommendation ? DASHBOARD_GROUP_LABELS[topRecommendation.group] : "—"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/8 to-black/25 p-4">
                      <div className="text-sm leading-6 text-white/72">
                        {topRecommendation ? compactText(topRecommendation.summary, 16) : "Selecciona un objetivo para ver sugerencias."}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/75">
                          {getIntentLabel(selectedIntent)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/75">
                          {getFormatLabel(selectedFormat)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/75">
                          {formatWindow(topRecommendation?.playbook ?? MODULE_PLAYBOOK["mental-sim"])}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2">
                      {(topRecommendation?.reasons ?? []).map((reason) => (
                        <div key={reason} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-5 text-white/72">
                          {reason}
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={topRecommendation?.href ?? "/cases"}
                        className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                      >
                        Abrir recomendación
                      </Link>
                      <button
                        type="button"
                        onClick={restoreSuggestedAdvisor}
                        className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/8"
                      >
                        Restaurar sugerencia
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-white/48">
                      Sugerencia automática: {getIntentLabel(suggestedAdvisor.intent)} · {getFormatLabel(suggestedAdvisor.format)} · {getTimeLabel(suggestedAdvisor.time)}
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-black/28 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          Ruta sugerida
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">Secuencia de trabajo</div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-white/65">
                        {topRoute.length} pasos
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {topRoute.map((module, index) => (
                        <Link
                          key={module.id}
                          href={module.href}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:bg-white/8"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-sm font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">{module.label}</div>
                            <div className="text-xs text-white/55">{compactText(module.summary, 10)}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_340px] 2xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">Opciones sugeridas para hoy</div>
                    <div className="mt-1 text-sm text-white/58">
                      Las tarjetas cambian según objetivo, modalidad, tiempo y contexto clínico reciente.
                    </div>
                  </div>
                  <div className="text-xs text-white/45">Top 4 recomendaciones</div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {[topRecommendation, ...secondaryRecommendations].filter(Boolean).map((module, index) => (
                    <Link
                      key={module!.id}
                      href={module!.href}
                      className={`group rounded-[28px] border p-5 transition hover:-translate-y-0.5 ${
                        index === 0
                          ? "border-cyan-300/25 bg-gradient-to-br from-cyan-400/10 to-black/20 shadow-[0_20px_55px_rgba(0,0,0,0.35)]"
                          : "border-white/10 bg-black/20 hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                            {index === 0 ? "Mejor ajuste" : "Alternativa"}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-white">{module!.label}</div>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${groupBadgeClass(module!.group)}`}>
                          {DASHBOARD_GROUP_LABELS[module!.group]}
                        </span>
                      </div>

                      <div className={`mt-4 rounded-2xl border border-white/10 bg-gradient-to-r ${module!.accent} p-4`}>
                        <div className="text-sm leading-6 text-white/72">{compactText(module!.summary, 16)}</div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {module!.reasons.slice(0, 2).map((reason) => (
                          <div key={reason} className="text-xs text-white/55">
                            {reason}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-white/45">{module!.status}</span>
                        <span className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs font-medium text-white/82">
                          Abrir módulo
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Estado actual
                      </div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {hasActive ? "Caso en progreso" : "Sin sesión activa"}
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${riskBadgeClass(currentRiskLevel)}`}>
                      Riesgo {currentRiskLevel}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/58">Caso</span>
                      <span className="max-w-[220px] truncate text-right text-white/88">
                        {hasActive ? meta.title : safeText(lastClosed?.caseTitle, "—")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/58">Paciente</span>
                      <span className="max-w-[220px] truncate text-right text-white/88">
                        {hasActive ? meta.patientName : safeText(lastClosed?.patientName, "—")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/58">Duración</span>
                      <span className="text-white/88">
                        {hasActive ? (meta.targetMinutes ? `${meta.targetMinutes} min` : "Libre") : avgDuration ? `${avgDuration} min` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/58">Último cierre</span>
                      <span className="text-right text-white/88">{formatDate(lastClosed?.endedAt ?? endedInfo?.ended_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/58">Motivo</span>
                      <span className="text-white/88">{shortReason(lastClosed?.reason ?? endedInfo?.reason)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={primaryAction.href}
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      {primaryAction.label}
                    </Link>
                    <Link
                      href="/history"
                      className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white/82 transition hover:bg-white/8"
                    >
                      Ver historial
                    </Link>
                  </div>

                  <div className="mt-3 text-xs text-white/50">{primaryAction.helper}</div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Contexto del sistema
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">Resumen de orientación</div>
                    </div>
                    <div className="text-xs text-white/45">Local y en tiempo real</div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {contextMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">{metric.label}</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{metric.value}</div>
                        <div className="mt-2 text-xs leading-5 text-white/52">{metric.helper}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">Explorar por dominio</div>
                  <div className="mt-1 text-sm text-white/58">
                    Si no quieres usar la recomendación automática, puedes entrar por el área clínica que más te interese.
                  </div>
                </div>
                <Link href="/topics" className="rounded-xl border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/82 transition hover:bg-white/5">
                  Ir a biblioteca clínica
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-4">
                {groupedModules.map(({ group, label, items }) => (
                  <div key={group} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${groupBadgeClass(group)}`}>
                          {label}
                        </span>
                        <div className="mt-3 text-lg font-semibold text-white">{items.length} módulos</div>
                      </div>
                      <Link href={GROUP_PRIMARY_LINKS[group]} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/80 transition hover:bg-white/5">
                        Abrir
                      </Link>
                    </div>

                    <div className="mt-3 text-sm leading-6 text-white/65">{compactText(GROUP_DESCRIPTIONS[group], 10)}</div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/75 transition hover:bg-white/5"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">Últimas sesiones</div>
                  <div className="mt-1 text-sm text-white/60">
                    Revisión rápida de cierres recientes para mantener continuidad y reabrir reportes.
                  </div>
                </div>
                <Link href="/history" className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5">
                  Ver todas
                </Link>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-12 bg-black/25 px-4 py-2 text-xs font-semibold text-white/50">
                  <div className="col-span-4">Caso</div>
                  <div className="col-span-3">Fecha cierre</div>
                  <div className="col-span-2">Riesgo</div>
                  <div className="col-span-1 text-right">Score</div>
                  <div className="col-span-2 text-right">Acción</div>
                </div>

                {(history.length ? history.slice(0, 6) : []).map((session) => (
                  <div key={session.id} className="grid grid-cols-12 border-t border-white/10 px-4 py-3 text-sm">
                    <div className="col-span-4 min-w-0">
                      <div className="truncate font-semibold text-white">{safeText(session.caseTitle, "Sesión")}</div>
                      <div className="truncate text-xs text-white/50">{safeText(session.patientName, "Paciente")}</div>
                    </div>
                    <div className="col-span-3 text-white/70">{formatDate(session.endedAt)}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${riskBadgeClass(session.riskLevel)}`}>
                        {session.riskLevel}
                      </span>
                    </div>
                    <div className="col-span-1 text-right text-white/85">{typeof session.score === "number" ? session.score : "—"}</div>
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => openSessionReport(session)}
                        className="rounded-lg border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/5"
                      >
                        Ver reporte
                      </button>
                    </div>
                  </div>
                ))}

                {!history.length && (
                  <div className="px-4 py-6 text-sm text-white/60">
                    Aún no hay sesiones guardadas. Usa el orientador para elegir un módulo y empezar a construir historial.
                  </div>
                )}
              </div>
            </section>

            <div className="mt-6 text-xs text-white/45">Psyke es una herramienta educativa. No sustituye valoración clínica real.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
