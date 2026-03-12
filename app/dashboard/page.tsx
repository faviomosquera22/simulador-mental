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

type DashboardRouteCard = {
  id: string;
  title: string;
  desc: string;
  href: string;
  action: string;
  note: string;
  accent: string;
  modules: DashboardModuleMeta[];
  recommended?: boolean;
};

const DASHBOARD_GROUP_ORDER: DashboardModuleGroup[] = [
  "simulacion",
  "diagnostico",
  "practica",
  "seguimiento",
];

const GROUP_DESCRIPTIONS: Record<DashboardModuleGroup, string> = {
  simulacion: "Escenarios progresivos, dinámicos y centrados en toma de decisiones.",
  diagnostico: "Interpretación clínica de estudios y monitorización aplicada.",
  practica: "Habilidades operativas, intervenciones y documentación profesional.",
  seguimiento: "Evaluación, historial y consolidación académica.",
};

const GROUP_PRIMARY_LINKS: Record<DashboardModuleGroup, string> = {
  simulacion: "/cases",
  diagnostico: "/ecg-simulator",
  practica: "/clinical-calculations",
  seguimiento: "/history",
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
    return new Date(s).toLocaleString();
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
  if (group === "practica") return "border-orange-400/20 bg-orange-400/10 text-orange-100";
  return "border-slate-300/20 bg-slate-300/10 text-slate-100";
}

export default function DashboardPage() {
  const [hasActive, setHasActive] = useState(false);
  const [activeCase, setActiveCase] = useState<any>(null);
  const [activeTranscript, setActiveTranscript] = useState<TranscriptTurn[]>([]);
  const [endedInfo, setEndedInfo] = useState<any>(null);
  const [history, setHistory] = useState<StoredSession[]>([]);

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

  const focusState = useMemo(() => {
    if (hasActive) {
      return {
        eyebrow: "Sesión activa",
        title: "Continúa el caso clínico en curso",
        description: `Retoma ${meta.title} y mantén continuidad diagnóstica, seguridad y cierre clínico.`,
      };
    }
    if (hasHighRisk) {
      return {
        eyebrow: "Prioridad clínica",
        title: "Refuerza seguridad, monitorización y respuesta rápida",
        description:
          "Tus datos recientes justifican entrenar ECG, urgencias, laboratorio y conducta inicial frente a mayor riesgo.",
      };
    }
    if (typeof avgScore === "number" && avgScore < 72) {
      return {
        eyebrow: "Siguiente enfoque",
        title: "Conviene reforzar interpretación y secuencia clínica",
        description:
          "Trabaja primero el bloque diagnóstico y procedimental para subir precisión antes de ir a escenarios más complejos.",
      };
    }
    return {
      eyebrow: "Centro de entrenamiento clínico",
      title: "Unifica simulación, diagnóstico, intervención y documentación",
      description:
        "El dashboard ahora concentra casos, estudios, procedimientos, notas y rutas de práctica con una lectura más operativa.",
    };
  }, [avgScore, hasActive, hasHighRisk, meta.title]);

  const primaryAction = hasActive
    ? { href: "/simulator", label: "Reanudar caso", helper: "Continúa entrevista, decisiones y evolución." }
    : { href: "/cases", label: "Generar caso", helper: "Inicia un nuevo escenario clínico para empezar." };

  const quickLaunchModules = useMemo(() => DASHBOARD_NEW_MODULES.slice(0, 5), []);

  const routeCards = useMemo(() => {
    const byId = new Map(DASHBOARD_MODULES.map((item) => [item.id, item]));
    const buildModules = (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((item): item is DashboardModuleMeta => Boolean(item));

    const items: DashboardRouteCard[] = [
      {
        id: "simulation",
        title: "Simulación longitudinal",
        desc: "Casos de continuidad, priorización y progresión clínica con foco en criterio y estructura.",
        href: hasActive ? "/simulator" : "/cases",
        action: hasActive ? "Retomar flujo" : "Abrir simulación",
        note: hasActive ? "Ruta recomendada por sesión en curso." : "Entrada principal al ecosistema.",
        accent: "from-cyan-500/18 via-sky-500/10 to-transparent",
        modules: buildModules(["mental-sim", "pathologies", "triage"]),
      },
      {
        id: "diagnostic",
        title: "Diagnóstico y monitorización",
        desc: "Integra ECG, laboratorio y gasometría para interpretar antes de decidir conducta.",
        href: "/ecg-simulator",
        action: "Ir a diagnóstico",
        note: "Ideal para fortalecer lectura clínica estructurada.",
        accent: "from-emerald-500/18 via-teal-500/10 to-transparent",
        modules: buildModules(["ecg", "laboratory", "gasometry"]),
      },
      {
        id: "intervention",
        title: "Intervención segura",
        desc: "Entrena medicamentos, procedimientos y urgencias como bloque operativo.",
        href: "/medications",
        action: "Practicar intervención",
        note: "Útil para seguridad, secuencia y respuesta inmediata.",
        accent: "from-orange-500/18 via-red-500/10 to-transparent",
        modules: buildModules(["medications", "procedures", "urgencies"]),
      },
      {
        id: "documentation",
        title: "Documentación y evaluación",
        desc: "Consolida PAE, notas clínicas y práctica de examen en un mismo recorrido.",
        href: "/pae",
        action: "Abrir ruta documental",
        note: "Conviene después de completar simulación o diagnóstico.",
        accent: "from-fuchsia-500/18 via-violet-500/10 to-transparent",
        modules: buildModules(["pae", "notes", "caces"]),
      },
    ];

    const recommendedId = hasHighRisk
      ? "intervention"
      : typeof avgScore === "number" && avgScore < 72
      ? "diagnostic"
      : hasActive
      ? "simulation"
      : "documentation";

    return [...items]
      .map((item) => ({ ...item, recommended: item.id === recommendedId }))
      .sort((a, b) => Number(b.recommended) - Number(a.recommended));
  }, [avgScore, hasActive, hasHighRisk]);

  const groupedModules = useMemo(
    () =>
      DASHBOARD_GROUP_ORDER.map((group) => ({
        group,
        label: DASHBOARD_GROUP_LABELS[group],
        items: DASHBOARD_MODULES.filter((item) => item.group === group),
      })),
    []
  );

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

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1520px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
          <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-white/5 px-5">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="font-semibold text-white">Dashboard</span>
              <span className="text-white/30">·</span>
              <span className="text-white/55">Panel operativo del ecosistema clínico</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href="/reports" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                Reportes
              </Link>
              <Link href="/history" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                Historial
              </Link>
              <Link href="/cases" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
                + Nuevo caso
              </Link>
            </div>
          </header>

          <div className="overflow-y-auto px-5 py-6">
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#091019] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(7,169,255,0.18),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(255,148,46,0.18),transparent_30%),linear-gradient(135deg,#0B1018,#121A28_58%,#0A0F17)]" />
              <div className="relative grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                    {focusState.eyebrow}
                  </div>
                  <div className="mt-3 max-w-[17ch] text-3xl font-semibold leading-tight text-white sm:text-4xl">
                    {focusState.title}
                  </div>
                  <div className="mt-3 max-w-[72ch] text-sm leading-6 text-white/68">{focusState.description}</div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/80">
                      {DASHBOARD_MODULES.length} módulos activos
                    </div>
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
                      {DASHBOARD_NEW_BANK_TOTAL} casos nuevos
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100">
                      {DASHBOARD_NEW_MODULES.length} módulos ampliados
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/70">
                      práctica + evaluación
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Link href={primaryAction.href} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black">
                      {primaryAction.label}
                    </Link>
                    <Link
                      href="/ecg-simulator"
                      className="rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white/82 hover:bg-white/5"
                    >
                      Abrir ECG
                    </Link>
                    <Link
                      href="/laboratory"
                      className="rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white/82 hover:bg-white/5"
                    >
                      Ir a laboratorio
                    </Link>
                    <Link
                      href="/clinical-calculations"
                      className="rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white/82 hover:bg-white/5"
                    >
                      Cálculo clínico
                    </Link>
                    <Link
                      href="/topics"
                      className="rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white/82 hover:bg-white/5"
                    >
                      Biblioteca clínica
                    </Link>
                  </div>

                  <div className="mt-3 text-xs text-white/52">{primaryAction.helper}</div>

                  <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1.1fr_1fr]">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        Lanzamientos activos
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        Banco nuevo integrado al dashboard para práctica guiada y evaluación.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickLaunchModules.map((module) => (
                        <Link
                          key={module.id}
                          href={module.href}
                          className={`rounded-full border border-white/10 bg-gradient-to-r ${module.accent} px-3 py-1.5 text-xs text-white/90`}
                        >
                          {module.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-white/10 bg-black/28 p-5">
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
                        <span className="text-white/58">Objetivo</span>
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
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-black/28 p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Cobertura del sistema
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Módulos</div>
                        <div className="mt-1 text-2xl font-semibold text-white">{DASHBOARD_MODULES.length}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Dominios</div>
                        <div className="mt-1 text-2xl font-semibold text-white">{DASHBOARD_GROUP_ORDER.length}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Banco nuevo</div>
                        <div className="mt-1 text-2xl font-semibold text-white">{DASHBOARD_NEW_BANK_TOTAL}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Módulos nuevos</div>
                        <div className="mt-1 text-2xl font-semibold text-white">{DASHBOARD_NEW_MODULES.length}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {DASHBOARD_NEW_MODULES.slice(0, 3).map((module) => (
                        <div key={module.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                          <div>
                            <div className="text-sm font-semibold text-white">{module.label}</div>
                            <div className="text-xs text-white/55">{module.status}</div>
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {module.count} {module.countLabel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Panel operativo</div>
                  <div className="mt-1 text-sm text-white/58">Lectura rápida de rendimiento, ritmo de trabajo y capacidad instalada.</div>
                </div>
                <div className="text-xs text-white/45">Actualización local en tiempo real</div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/8 to-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Sesiones completadas</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{completedCount}</div>
                  <div className="mt-2 text-xs text-white/55">Historial consolidado del usuario actual.</div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/8 to-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Duración promedio</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{avgDuration ? `${avgDuration} min` : "—"}</div>
                  <div className="mt-2 text-xs text-white/55">Ritmo medio de resolución o práctica.</div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-gradient-to-br from-white/8 to-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">Puntaje clínico</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{avgScore ?? activeScore ?? "—"}</div>
                  <div className="mt-2 text-xs text-white/55">
                    {avgScore != null ? "Promedio de sesiones cerradas." : "Estimado de la sesión en curso."}
                  </div>
                </div>
                <div className="rounded-[26px] border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 to-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/72">Banco clínico nuevo</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{DASHBOARD_NEW_BANK_TOTAL}</div>
                  <div className="mt-2 text-xs text-white/60">
                    Casos y escenarios nuevos en gasometría, urgencias, medicamentos, procedimientos y notas.
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Rutas clínicas recomendadas</div>
                  <div className="mt-1 text-sm text-white/58">Agrupa módulos por objetivo práctico para que el entrenamiento tenga más continuidad.</div>
                </div>
                <div className="text-xs text-white/45">La tarjeta destacada cambia según tu contexto reciente.</div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-4">
                {routeCards.map((route) => (
                  <Link
                    key={route.id}
                    href={route.href}
                    className={`group rounded-[28px] border p-5 transition hover:-translate-y-0.5 ${
                      route.recommended
                        ? "border-cyan-300/25 bg-gradient-to-br from-white/12 to-black/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                        : "border-white/10 bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <div className={`rounded-2xl border border-white/10 bg-gradient-to-r ${route.accent} p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                            {route.recommended ? "Ruta recomendada" : "Ruta disponible"}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-white">{route.title}</div>
                        </div>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/70">
                          {route.modules.length} módulos
                        </span>
                      </div>
                      <div className="mt-3 text-sm leading-6 text-white/70">{route.desc}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {route.modules.map((module) => (
                        <span key={module.id} className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-xs text-white/72">
                          {module.label}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 text-xs text-white/50">{route.note}</div>
                    <div className="mt-4 inline-flex rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs font-medium text-white/85">
                      {route.action}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Biblioteca nueva de práctica</div>
                  <div className="mt-1 text-sm text-white/58">Accesos directos a los módulos que ya quedaron ampliados entre 100 y 200 casos.</div>
                </div>
                <div className="text-xs text-white/45">Banco actual: {DASHBOARD_NEW_BANK_TOTAL} casos</div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {DASHBOARD_NEW_MODULES.map((module) => (
                  <Link
                    key={module.id}
                    href={module.href}
                    className="group rounded-[28px] border border-white/10 bg-[#0B1118] p-5 transition hover:-translate-y-0.5 hover:border-white/20"
                  >
                    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${module.accent} p-4`}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">{module.status}</div>
                      <div className="mt-3 text-3xl font-semibold text-white">{module.count}</div>
                      <div className="text-xs text-white/60">{module.countLabel}</div>
                    </div>

                    <div className="mt-4 text-base font-semibold text-white">{module.label}</div>
                    <div className="mt-2 text-sm leading-6 text-white/65">{module.summary}</div>
                    <div className="mt-4 inline-flex rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/82">
                      Abrir módulo
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Mapa del ecosistema</div>
                  <div className="mt-1 text-sm text-white/58">Vista agrupada por dominio para entender mejor dónde entra cada módulo.</div>
                </div>
                <Link href="/topics" className="rounded-xl border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/82 hover:bg-white/5">
                  Ir a biblioteca clínica
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-4">
                {groupedModules.map(({ group, label, items }) => (
                  <div key={group} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${groupBadgeClass(group)}`}>
                          {label}
                        </span>
                        <div className="mt-3 text-lg font-semibold text-white">{items.length} módulos</div>
                      </div>
                      <Link href={GROUP_PRIMARY_LINKS[group]} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/80 hover:bg-white/5">
                        Abrir
                      </Link>
                    </div>

                    <div className="mt-3 text-sm leading-6 text-white/65">{GROUP_DESCRIPTIONS[group]}</div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/75 hover:bg-white/5"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-[30px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">Últimas sesiones</div>
                  <div className="mt-1 text-sm text-white/60">Revisión rápida de cierre, riesgo y acceso directo a resultados previos.</div>
                </div>
                <Link href="/history" className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
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

                {(history.length ? history.slice(0, 6) : []).map((h) => (
                  <div key={h.id} className="grid grid-cols-12 border-t border-white/10 px-4 py-3 text-sm">
                    <div className="col-span-4 min-w-0">
                      <div className="truncate font-semibold text-white">{safeText(h.caseTitle, "Sesión")}</div>
                      <div className="truncate text-xs text-white/50">{safeText(h.patientName, "Paciente")}</div>
                    </div>
                    <div className="col-span-3 text-white/70">{formatDate(h.endedAt)}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${riskBadgeClass(h.riskLevel)}`}>
                        {h.riskLevel}
                      </span>
                    </div>
                    <div className="col-span-1 text-right text-white/85">{typeof h.score === "number" ? h.score : "—"}</div>
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => openSessionReport(h)}
                        className="rounded-lg border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
                      >
                        Ver reporte
                      </button>
                    </div>
                  </div>
                ))}

                {!history.length && (
                  <div className="px-4 py-6 text-sm text-white/60">
                    Aún no hay sesiones guardadas. Genera un caso o entra a uno de los módulos nuevos para empezar a construir historial.
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
