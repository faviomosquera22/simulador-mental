"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CoverageMap = Record<string, number>;

type Evaluation = {
  summary: string;
  strengths: string[];
  improvements: string[];
  coverage: CoverageMap;
  overall_score?: number;
  next_steps?: string[];
  red_flags?: string[];
};

type TranscriptTurn = { role: "user" | "patient"; content: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function scoreLabel(score: number) {
  if (score >= 85) return "Muy bien";
  if (score >= 70) return "Bien";
  if (score >= 55) return "Regular";
  return "Por mejorar";
}

export default function ResultsPage() {
  const [caseObject, setCaseObject] = useState<Record<string, unknown> | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const caseId = useMemo(() => {
    const meta = asRecord(caseObject?.meta);
    return String(caseObject?.id ?? meta?.case_id ?? "default");
  }, [caseObject]);

  useEffect(() => {
    // Cargar caso + transcript
    try {
      const rawCase =
        localStorage.getItem("activeCase") ??
        sessionStorage.getItem("activeCase") ??
        localStorage.getItem("sim_case") ??
        sessionStorage.getItem("sim_case");

      const rawTranscript =
        localStorage.getItem("activeTranscript") ??
        sessionStorage.getItem("activeTranscript") ??
        localStorage.getItem("sim_transcript") ??
        sessionStorage.getItem("sim_transcript");

      if (rawCase) setCaseObject(JSON.parse(rawCase));
      if (rawTranscript) setTranscript(JSON.parse(rawTranscript));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setError(null);
      setLoading(true);

      if (!caseObject || !Array.isArray(transcript) || transcript.length === 0) {
        setEvaluation(null);
        setLoading(false);
        return;
      }

      // Cache por caso
      const cacheKey = `lastEvaluation:${caseId}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setEvaluation(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch("/api/ai/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseObject, transcript }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || "No se pudo evaluar la sesión.");

        const ev: Evaluation = {
          summary: String(data?.summary ?? "—"),
          strengths: Array.isArray(data?.strengths) ? data.strengths.map(String) : [],
          improvements: Array.isArray(data?.improvements) ? data.improvements.map(String) : [],
          coverage: typeof data?.coverage === "object" && data?.coverage ? data.coverage : {},
          overall_score: Number.isFinite(Number(data?.overall_score))
            ? Number(data?.overall_score)
            : undefined,
          next_steps: Array.isArray(data?.next_steps) ? data.next_steps.map(String) : [],
          red_flags: Array.isArray(data?.red_flags) ? data.red_flags.map(String) : [],
        };

        setEvaluation(ev);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(ev));
        } catch {
          // ignore
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Error al generar resultados.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, caseObject]);

  const modeLabel = useMemo(() => {
    const meta = asRecord(caseObject?.meta);
    const m = meta?.mode ?? (caseObject as Record<string, unknown> | null)?.["mode"] ?? "training";
    return String(m);
  }, [caseObject]);

  const coverageEntries = useMemo(() => {
    const cov = evaluation?.coverage ?? {};
    return Object.entries(cov)
      .map(([k, v]) => [String(k), Number(v)] as const)
      .filter(([, v]) => Number.isFinite(v))
      .sort((a, b) => b[1] - a[1]);
  }, [evaluation]);

  const handleNewCase = () => {
    try {
      localStorage.removeItem("activeCase");
      sessionStorage.removeItem("activeCase");
      localStorage.removeItem("sim_case");
      sessionStorage.removeItem("sim_case");

      localStorage.removeItem("activeTranscript");
      sessionStorage.removeItem("activeTranscript");
      localStorage.removeItem("sim_transcript");
      sessionStorage.removeItem("sim_transcript");

      localStorage.removeItem("lastEmotion");
      localStorage.removeItem("sessionEnded");
    } catch {
      // ignore
    }
    window.location.href = "/cases";
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Resultados</h1>
            <p className="mt-1 text-sm text-white/70">
              Feedback educativo. No es diagnóstico. Modo: {modeLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/simulator"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
            >
              Volver al chat
            </Link>
            <button onClick={handleNewCase} className="rounded-xl bg-white text-black px-4 py-2 text-sm">
              Nuevo caso
            </button>
          </div>
        </div>

        {!caseObject || transcript.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">No hay sesión para evaluar</div>
            <p className="mt-2 text-sm text-white/70">
              Inicia una entrevista y finaliza la sesión para ver resultados.
            </p>
            <div className="mt-4">
              <Link className="inline-flex items-center justify-center rounded-xl bg-white text-black px-4 py-2" href="/cases">
                Ir a Biblioteca de casos
              </Link>
            </div>
          </div>
        ) : (
          <>
            {loading && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm text-white/70">Analizando la sesión…</div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
                {error}
              </div>
            )}

            {!loading && evaluation && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">Resumen</h2>
                    {typeof evaluation.overall_score === "number" && (
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/80">
                        {evaluation.overall_score}/100 • {scoreLabel(evaluation.overall_score)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-white/80 whitespace-pre-wrap">
                    {evaluation.summary || "—"}
                  </p>

                  {evaluation.next_steps?.length ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-white/60">Siguientes pasos</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                        {evaluation.next_steps.slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  {evaluation.red_flags?.length ? (
                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                      <div className="text-xs text-amber-100">Señales a vigilar (educativo)</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-50">
                        {evaluation.red_flags.slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-base font-semibold">Fortalezas</h2>
                  {evaluation.strengths.length === 0 ? (
                    <p className="mt-3 text-sm text-white/70">—</p>
                  ) : (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/80">
                      {evaluation.strengths.slice(0, 8).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-base font-semibold">Mejoras</h2>
                  {evaluation.improvements.length === 0 ? (
                    <p className="mt-3 text-sm text-white/70">—</p>
                  ) : (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/80">
                      {evaluation.improvements.slice(0, 8).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-base font-semibold">Cobertura por áreas</h2>
                  {coverageEntries.length === 0 ? (
                    <p className="mt-3 text-sm text-white/70">—</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {coverageEntries.slice(0, 10).map(([k, v]) => (
                        <div key={k}>
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>{k}</span>
                            <span className="text-white/80">{Math.round(v)}/100</span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-white/60"
                              style={{ width: `${Math.round(clamp01(v / 100) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <details>
                    <summary className="cursor-pointer text-sm text-white/70">Debug (JSON completo)</summary>
                    <pre className="mt-3 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-white/70">
                      {JSON.stringify({ evaluation, caseId, turns: transcript.length }, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
