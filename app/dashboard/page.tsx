"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";

type TranscriptTurn = { role: string; content: string };

type StoredSession = {
  id?: string;
  createdAt?: string;
  endedAt?: string;
  reason?: string;
  caseTitle?: string;
  category?: string;
  difficulty?: string;
  targetMinutes?: number;
  dsmTag?: string;
  dxId?: string;
  score?: number;
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
  const category = safeText(meta?.category, "—");
  const difficulty = safeText(meta?.difficulty, "—");
  const targetMinutes = Number(meta?.target_minutes ?? caseObj?.config?.targetMinutes ?? caseObj?.timer?.minutes);
  const dsmTag = safeText(meta?.dsm_tag, "—");
  const dxId = safeText(meta?.dx_id ?? caseObj?.dx_id, "—");
  const patientName = safeText(
    caseObj?.patient_profile?.display_name ?? caseObj?.patient?.name ?? caseObj?.patientName,
    "Paciente"
  );
  const risk = safeText(caseObj?.safety?.risk_level ?? meta?.risk_level, "—");

  return {
    title,
    patientName,
    category,
    difficulty,
    targetMinutes: Number.isFinite(targetMinutes) ? clampInt(targetMinutes, 5, 60) : undefined,
    dsmTag,
    dxId,
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

function readHistorySessions(): StoredSession[] {
  const rawA = loadJSON("sessionHistory");
  const rawB = loadJSON("vita.sessionHistory");
  const raw = rawA ?? rawB;

  const mapSession = (s: any, idx: number): StoredSession => ({
    id: safeText(s?.id, String(idx)),
    createdAt: s?.createdAt ?? s?.created_at ?? s?.startedAt,
    endedAt: s?.endedAt ?? s?.ended_at,
    reason: s?.reason ?? s?.end_reason ?? s?.endReason,
    caseTitle: s?.caseTitle ?? s?.case_title ?? s?.case?.meta?.title,
    category: s?.category ?? s?.case?.meta?.category,
    difficulty: s?.difficulty ?? s?.case?.meta?.difficulty,
    targetMinutes: s?.targetMinutes ?? s?.case?.meta?.target_minutes,
    dsmTag: s?.dsmTag ?? s?.case?.meta?.dsm_tag,
    dxId: s?.dxId ?? s?.case?.meta?.dx_id,
    score: s?.score,
  });

  if (Array.isArray(raw)) return raw.map(mapSession);
  if (raw && Array.isArray((raw as any).sessions)) return (raw as any).sessions.map(mapSession);
  return [];
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
      setActiveTranscript(Array.isArray(t) ? (t as any[]) : []);
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

  const lastScore = useMemo(() => {
    if (!activeTranscript.length) return undefined;
    return computeSimpleScoreFromTranscript(activeTranscript);
  }, [activeTranscript]);

  const completedCount = useMemo(() => history.length, [history]);

  const avgTarget = useMemo(() => {
    const mins = history
      .map((h) => Number(h.targetMinutes))
      .filter((n) => Number.isFinite(n) && n > 0) as number[];
    if (!mins.length) return undefined;
    const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
    return clampInt(avg, 5, 60);
  }, [history]);

  const recommended = useMemo(() => {
    const timeouts = history.filter((h) => (h.reason || "").toLowerCase().includes("timeout")).length;
    const needSafety = history.length > 0 && history.length < 3;
    return {
      focus: needSafety ? "Seguridad" : timeouts >= 2 ? "Cierre y manejo del tiempo" : "MSE y diferenciales",
      cards: [
        { title: "Practicar Seguridad", desc: "Entrena tamizaje de riesgo y cierre seguro.", href: "/cases" },
        { title: "Mejorar MSE", desc: "Completa cognición, insight/juicio y percepción.", href: "/cases" },
        { title: "Diferenciales", desc: "Descarta bipolaridad/sustancias/causa médica.", href: "/cases" },
      ],
    };
  }, [history]);

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
          <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-white/5 px-5">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="font-semibold text-white">Dashboard</span>
              <span className="text-white/30">·</span>
              <span className="text-white/55">Psyke · Simulador clínico (educativo)</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href="/cases" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
                + Generar caso
              </Link>
              <Link href="/topics" className="hidden rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5 sm:inline-flex">
                Biblioteca clínica
              </Link>
            </div>
          </header>

          <div className="overflow-y-auto px-5 py-6">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F1117] to-[#1E2433] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-2xl font-semibold text-white">Psyke · Entrenamiento clínico, con feedback</div>
                  <div className="mt-2 max-w-[72ch] text-sm text-white/65">
                    Genera casos ficticios, practica entrevista, explora MSE/DSM y recibe sugerencias del Tutor IA.
                    <span className="text-white/80"> No diagnostica.</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href="/cases" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
                      Generar caso (IA)
                    </Link>

                    <Link
                      href={hasActive ? "/simulator" : "/cases"}
                      className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                      title={hasActive ? "Continuar caso en curso" : "No hay caso en curso. Genera uno primero."}
                    >
                      {hasActive ? "Reanudar caso" : "Reanudar (no disponible)"}
                    </Link>

                    <Link href="/reports" className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                      Ver reporte
                    </Link>
                  </div>
                </div>

                <div className="grid w-full max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Caso en curso</div>
                    <div className="mt-2 text-sm font-semibold text-white">{hasActive ? meta.title : "No hay caso activo"}</div>
                    <div className="mt-1 text-sm text-white/60">{hasActive ? `Paciente: ${meta.patientName}` : "Genera un caso para empezar"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                        {hasActive ? `Dificultad: ${safeText(meta.difficulty)}` : "—"}
                      </span>
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                        {hasActive ? `Duración: ${meta.targetMinutes ?? "—"} min` : "—"}
                      </span>
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                        {hasActive ? `DSM: ${safeText(meta.dsmTag)}` : "DSM: —"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Último cierre</div>
                    <div className="mt-2 text-sm font-semibold text-white">{endedInfo?.ended_at ? formatDate(endedInfo.ended_at) : "—"}</div>
                    <div className="mt-1 text-sm text-white/60">
                      Motivo: <span className="text-white/80">{shortReason(endedInfo?.reason)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">Mensajes: {activeTranscript.length || "—"}</span>
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">Score (aprox): {typeof lastScore === "number" ? lastScore : "—"}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Progreso</div>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-white/40">Sesiones</div>
                        <div className="mt-1 text-lg font-semibold text-white">{completedCount}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-white/40">Promedio (objetivo)</div>
                        <div className="mt-1 text-lg font-semibold text-white">{avgTarget ? `${avgTarget} min` : "—"}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-white/60">Enfoque recomendado: <span className="text-white/85">{recommended.focus}</span></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
              {recommended.cards.map((c) => (
                <Link key={c.title} href={c.href} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                  <div className="text-sm font-semibold text-white">✦ {c.title}</div>
                  <div className="mt-2 text-sm text-white/65">{c.desc}</div>
                  <div className="mt-4 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black">Ir a casos →</div>
                </Link>
              ))}
            </section>

            <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">Últimas sesiones</div>
                  <div className="mt-1 text-sm text-white/60">Historial local (si está disponible)</div>
                </div>
                <Link href="/history" className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80 hover:bg-white/5">Ver todas</Link>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-12 bg-black/25 px-4 py-2 text-xs font-semibold text-white/50">
                  <div className="col-span-5">Caso</div>
                  <div className="col-span-2">DSM</div>
                  <div className="col-span-2">Dificultad</div>
                  <div className="col-span-2">Cierre</div>
                  <div className="col-span-1 text-right">Score</div>
                </div>

                {(history.length ? history.slice(0, 6) : []).map((h) => (
                  <div key={h.id} className="grid grid-cols-12 border-t border-white/10 px-4 py-3 text-sm">
                    <div className="col-span-5">
                      <div className="font-semibold text-white">{safeText(h.caseTitle, "Sesión")}</div>
                      <div className="text-xs text-white/50">{formatDate(h.endedAt ?? h.createdAt)}</div>
                    </div>
                    <div className="col-span-2 text-white/70">{safeText(h.dsmTag, "—")}</div>
                    <div className="col-span-2 text-white/70">{safeText(h.difficulty, "—")}</div>
                    <div className="col-span-2 text-white/70">{shortReason(h.reason)}</div>
                    <div className="col-span-1 text-right text-white/80">{typeof h.score === "number" ? h.score : "—"}</div>
                  </div>
                ))}

                {!history.length && (
                  <div className="px-4 py-4 text-sm text-white/60">Aún no hay sesiones guardadas. Completa un caso y finaliza para ver historial.</div>
                )}
              </div>
            </section>

            <div className="mt-6 text-xs text-white/45">Psyke es una herramienta educativa. Si aparece contenido sensible, prioriza seguridad y sugiere ayuda profesional.</div>
          </div>
        </main>
      </div>
    </div>
  );
}