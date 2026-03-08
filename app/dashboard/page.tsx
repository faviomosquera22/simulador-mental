"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import { getHistory, type SessionRecord } from "../../lib/history";

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

type RecommendationCard = {
  priority: "Alta" | "Media" | "Baja";
  title: string;
  desc: string;
  href: string;
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
      score: typeof s?.score === "number" ? clampInt(s.score, 0, 100) : transcript.length ? computeSimpleScoreFromTranscript(transcript) : undefined,
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

  const nextStep = useMemo(() => {
    if (hasActive) return `Reanuda el caso activo: ${meta.title}.`;
    if (!history.length) return "Empieza con tu primer caso para generar métricas y feedback.";
    return "Genera un nuevo caso para consolidar seguridad, MSE y cierre clínico.";
  }, [hasActive, history.length, meta.title]);

  const recommended = useMemo(() => {
    const hasHighRisk = history.some((h) => h.riskLevel === "Alto") || String(meta.risk).toLowerCase() === "alto";

    const cards: RecommendationCard[] = hasHighRisk
      ? [
          { priority: "Alta", title: "Practicar seguridad", desc: "Enfoca tamizaje suicida, factores protectores y cierre seguro.", href: "/cases" },
          { priority: "Media", title: "Practicar CACES", desc: "Resuelve preguntas tipo examen para reforzar razonamiento clínico.", href: "/simulator?tab=caces" },
          { priority: "Baja", title: "Fortalecer MSE", desc: "Completa cognición, juicio e insight en cada entrevista.", href: "/cases" },
        ]
      : [
          { priority: "Alta", title: "Mejorar MSE", desc: "Haz un barrido completo y consistente del examen mental.", href: "/cases" },
          { priority: "Media", title: "Practicar CACES", desc: "Entrena estructura de examen y toma de decisiones clínicas.", href: "/simulator?tab=caces" },
          { priority: "Baja", title: "Diferenciales", desc: "Contrasta hipótesis clínicas antes del cierre de sesión.", href: "/cases" },
        ];

    return { focus: cards[0].title, cards };
  }, [history, meta.risk]);

  const primaryAction = hasActive
    ? { href: "/simulator", label: "Reanudar caso", helper: "Continuar entrevista en curso" }
    : { href: "/cases", label: "Generar caso", helper: "Paso 1: crear un caso para empezar" };

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
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
          <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-white/5 px-5">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="font-semibold text-white">Dashboard</span>
              <span className="text-white/30">·</span>
              <span className="text-white/55">Centro de control de entrenamiento</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href="/history" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                Historial
              </Link>
              <Link href="/cases" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
                + Nuevo caso
              </Link>
            </div>
          </header>

          <div className="overflow-y-auto px-5 py-6">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F1117] to-[#1E2433] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/45">Qué hacer ahora</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{hasActive ? "Tienes un caso en curso" : "No hay caso activo"}</div>
                  <div className="mt-2 max-w-[70ch] text-sm text-white/65">{nextStep}</div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Link href={primaryAction.href} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
                      {primaryAction.label}
                    </Link>
                    <Link href="/reports" className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                      Ver reporte
                    </Link>
                    <Link href="/simulator?tab=caces" className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                      Practicar CACES
                    </Link>
                    <Link href="/topics" className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                      Biblioteca clínica
                    </Link>
                  </div>

                  <div className="mt-3 text-xs text-white/55">{primaryAction.helper}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/45">Estado de sesión</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/60">Caso</span>
                      <span className="max-w-[210px] truncate text-white/85">{hasActive ? meta.title : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/60">Paciente</span>
                      <span className="max-w-[210px] truncate text-white/85">{hasActive ? meta.patientName : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/60">DSM</span>
                      <span className="text-white/85">{hasActive ? meta.dsmTag : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/60">Último cierre</span>
                      <span className="text-white/85">{formatDate(lastClosed?.endedAt ?? endedInfo?.ended_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white/60">Motivo cierre</span>
                      <span className="text-white/85">{shortReason(lastClosed?.reason ?? endedInfo?.reason)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5">
              <div className="text-sm font-semibold text-white">Resumen rápido</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45">Sesiones completadas</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{completedCount}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45">Duración promedio</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{avgDuration ? `${avgDuration} min` : "—"}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45">Puntaje</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{avgScore ?? activeScore ?? "—"}</div>
                  <div className="text-xs text-white/55">{avgScore != null ? "Promedio de sesiones" : "Estimado de sesión activa"}</div>
                </div>
              </div>
            </section>

            <section className="mt-5">
              <div className="text-sm font-semibold text-white">Entrenamiento recomendado</div>
              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <Link href={recommended.cards[0].href} className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-black/20 p-5 hover:bg-white/15">
                  <div className="inline-flex rounded-full border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-[11px] font-semibold text-red-100">
                    Prioridad {recommended.cards[0].priority}
                  </div>
                  <div className="mt-3 text-base font-semibold text-white">{recommended.cards[0].title}</div>
                  <div className="mt-2 text-sm text-white/70">{recommended.cards[0].desc}</div>
                  <div className="mt-4 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black">Empezar</div>
                </Link>

                {recommended.cards.slice(1).map((c) => (
                  <Link key={c.title} href={c.href} className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
                    <div className="inline-flex rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                      Prioridad {c.priority}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-white">{c.title}</div>
                    <div className="mt-2 text-sm text-white/65">{c.desc}</div>
                    <div className="mt-4 inline-flex rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/80">Ir a casos</div>
                  </Link>
                ))}
              </div>
              <div className="mt-2 text-xs text-white/50">Foco actual: {recommended.focus}</div>
            </section>

            <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">Últimas sesiones</div>
                  <div className="mt-1 text-sm text-white/60">Vista resumida para revisar progreso rápido</div>
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
                  <div className="px-4 py-4 text-sm text-white/60">Aún no hay sesiones guardadas. Genera un caso y finalízalo para ver resultados aquí.</div>
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
