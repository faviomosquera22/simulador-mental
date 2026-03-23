

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/Sidebar";

type TranscriptTurn = { role: "user" | "patient" | "caregiver" | "tutor"; content: string };

type FeedbackInstrumentResult = {
  total_score?: number;
  max_score?: number;
  severity_label?: string;
  classification?: string;
  interpretation?: string;
  educational_note?: string;
};

type FeedbackContext = {
  use_scale_result?: boolean;
  use_test_result?: boolean;
  scale_result?: FeedbackInstrumentResult | null;
  test_result?: FeedbackInstrumentResult | null;
  scale_definition?: { id?: string; name?: string; short_name?: string } | null;
  test_definition?: { id?: string; name?: string; short_name?: string } | null;
  saved_at?: string;
};

type AnyCase = any;

type ScoreBreakdown = {
  total: number;
  interview: number;
  mse: number;
  dsm: number;
  safety: number;
  durationMin: number;
  messages: number;
  dsmCovered?: string;
  mseCovered?: string;
  label: string;
  desc: string;
  strengths: string[];
  improvements: string[];
  missingQuestions: string[];
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function safeStr(v: any, fallback = "—") {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  const t = s.trim();
  return t ? t : fallback;
}

function extractPatient(caseObj: AnyCase) {
  const name = safeStr(caseObj?.patient?.name ?? caseObj?.patientName ?? caseObj?.name ?? caseObj?.essentials?.name, "Paciente");
  const age = caseObj?.patient?.age ?? caseObj?.age;
  const sex = safeStr(caseObj?.patient?.sex ?? caseObj?.sex, "—");
  return { name, age, sex };
}

function extractTitle(caseObj: AnyCase) {
  return safeStr(
    caseObj?.title ?? caseObj?.essentials?.title ?? caseObj?.meta?.title ?? caseObj?.scenario?.title,
    "Resultado de sesión"
  );
}

function computeDurationMin(caseObj: AnyCase, transcript: TranscriptTurn[]) {
  // Prefer explicit timer config if present; otherwise heuristic based on #turns
  const target = Number(caseObj?.config?.targetMinutes ?? caseObj?.timer?.minutes ?? caseObj?.meta?.target_minutes);
  if (Number.isFinite(target) && target > 0) return clampInt(target, 5, 60);
  const turns = transcript.length;
  const approx = Math.max(6, Math.round(turns * 1.2));
  return clampInt(approx, 5, 60);
}

function detectSignalsFromText(transcript: TranscriptTurn[]) {
  const joined = transcript.map((t) => t.content.toLowerCase()).join(" \n");

  const hasOpen = /\b(c[oó]mo te|qu[eé] te trajo|cu[eé]ntame|qu[eé] ha pasado|desde cu[aá]ndo)\b/.test(joined);
  const hasSleep = /\b(sue[nñ]o|insomnio|hipersomnia|dormir)\b/.test(joined);
  const hasAppetite = /\b(apetito|comer|peso|baj[ée] de peso|sub[íi] de peso)\b/.test(joined);
  const hasFunction = /\b(trabajo|funcional|vida diaria|estudio|rendimiento)\b/.test(joined);
  const hasSafety = /\b(hacerte da[nñ]o|suicid|no querer estar|me matar[ií]a|matarme|morir)\b/.test(joined);
  const hasBipolarScreen = /\b(euforia|hipoman[ií]a|man[ií]a|muy energ[ée]tic|sin dormir y)\b/.test(joined);
  const hasCognition = /\b(concentraci[oó]n|memoria|atenci[oó]n|orientad[ao])\b/.test(joined);
  const hasInsightJudgment = /\b(insight|juicio|conciencia de enfermedad|reconoce)\b/.test(joined);

  return {
    hasOpen,
    hasSleep,
    hasAppetite,
    hasFunction,
    hasSafety,
    hasBipolarScreen,
    hasCognition,
    hasInsightJudgment,
  };
}

function computeScore(caseObj: AnyCase, transcript: TranscriptTurn[]): ScoreBreakdown {
  const messages = transcript.length;
  const durationMin = computeDurationMin(caseObj, transcript);

  const sig = detectSignalsFromText(transcript);

  // Base scores (heurísticos, educativos)
  let interview = 60;
  if (sig.hasOpen) interview += 12;
  if (sig.hasFunction) interview += 8;
  if (messages >= 10) interview += 6;
  if (messages >= 18) interview += 6;

  let mse = 55;
  if (sig.hasSleep) mse += 6;
  if (sig.hasAppetite) mse += 6;
  if (sig.hasCognition) mse += 12;
  if (sig.hasInsightJudgment) mse += 10;

  let dsm = 58;
  // If the case has meta.dsm_tag, we reward some structure
  if (safeStr(caseObj?.meta?.dsm_tag, "").length > 1) dsm += 8;
  if (sig.hasSleep) dsm += 6;
  if (sig.hasAppetite) dsm += 6;
  if (sig.hasBipolarScreen) dsm += 10; // good differential safety

  let safety = 55;
  if (sig.hasSafety) safety += 18;
  if (sig.hasSafety && sig.hasFunction) safety += 4;

  interview = clampInt(interview, 35, 95);
  mse = clampInt(mse, 30, 95);
  dsm = clampInt(dsm, 30, 95);
  safety = clampInt(safety, 30, 95);

  const total = clampInt(Math.round(interview * 0.34 + mse * 0.22 + dsm * 0.26 + safety * 0.18), 0, 100);

  const label = total >= 85 ? "Excelente" : total >= 75 ? "Muy bien" : total >= 65 ? "Bien" : total >= 50 ? "En progreso" : "Por reforzar";
  const desc =
    total >= 85
      ? "Entrevista sólida con buena estructura. Mantén ese ritmo: abre, explora, resume y cierra con plan."
      : total >= 75
      ? "Buen desempeño general. Hay oportunidades puntuales para completar MSE y diferenciales."
      : total >= 65
      ? "Vas bien. Si ordenas mejor la entrevista y completas MSE, tu score sube rápido."
      : total >= 50
      ? "Tienes base, pero falta estructura: abre con preguntas abiertas, explora síntomas y prioriza seguridad."
      : "Enfócate en lo esencial: preguntas abiertas + exploración de síntomas + evaluación de riesgo.";

  const strengths: string[] = [];
  if (sig.hasOpen) strengths.push("Buena apertura con preguntas abiertas.");
  if (sig.hasFunction) strengths.push("Exploraste impacto funcional en la vida diaria.");
  if (sig.hasSafety) strengths.push("Detectaste/abordaste contenido de seguridad (riesgo).");
  if (!strengths.length) strengths.push("Participación constante durante la sesión.");

  const improvements: string[] = [];
  if (!sig.hasCognition) improvements.push("Completar MSE: cognición (memoria, atención, orientación).");
  if (!sig.hasInsightJudgment) improvements.push("Completar MSE: insight/juicio.");
  if (!sig.hasBipolarScreen) improvements.push("Indagar episodios de euforia/hipomanía para diferenciales.");
  if (!sig.hasFunction) improvements.push("Aterrizar el impacto funcional con ejemplos concretos.");
  if (!improvements.length) improvements.push("Profundiza con un resumen final + plan de seguimiento.");

  const missingQuestions: string[] = [];
  if (!sig.hasBipolarScreen) missingQuestions.push("Episodios previos de euforia/hipomanía");
  if (!sig.hasCognition) missingQuestions.push("Cognición: concentración y memoria");
  if (!sig.hasInsightJudgment) missingQuestions.push("Insight sobre su estado actual / juicio");
  if (!sig.hasFunction) missingQuestions.push("Funcionalidad laboral/estudio detallada");
  if (sig.hasSafety) {
    // If safety was mentioned, suggest the structured module
    missingQuestions.push("Mini C-SSRS (ítems 3–5) / plan / intención");
    missingQuestions.push("Acceso a medios letales / factores protectores");
  } else {
    missingQuestions.push("Tamizaje breve de seguridad (ideación, plan, intención)");
  }

  return {
    total,
    interview,
    mse,
    dsm,
    safety,
    durationMin,
    messages,
    label,
    desc,
    strengths,
    improvements,
    missingQuestions: missingQuestions.slice(0, 10),
  };
}

export default function ReportsPage() {
  const [caseObj, setCaseObj] = useState<AnyCase | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [feedbackContext, setFeedbackContext] = useState<FeedbackContext | null>(null);
  const [loadedAt, setLoadedAt] = useState<string>("");

useEffect(() => {
  try {
    const cRaw = localStorage.getItem("activeCase");
    const tRaw = localStorage.getItem("activeTranscript");
    const fRaw = localStorage.getItem("sessionFeedbackContext");
    const c = cRaw ? JSON.parse(cRaw) : null;
    const t = tRaw ? JSON.parse(tRaw) : [];
    const f = fRaw ? JSON.parse(fRaw) : null;
    const normalized = Array.isArray(t)
      ? (t as any[]).map((turn) => {
          const role = String((turn as any)?.role ?? "");
          const content = String((turn as any)?.content ?? "");
          if (role === "assistant") return { role: "patient" as const, content };
          if (role === "caregiver" || role === "acompanante" || role === "acompañante") return { role: "caregiver" as const, content };
          if (role === "system") return { role: "tutor" as const, content };
          if (role === "tutor") return { role: "tutor" as const, content };
          if (role === "patient") return { role: "patient" as const, content };
          return { role: "user" as const, content };
        })
      : [];
    setCaseObj(c);
    setTranscript(normalized);
    setFeedbackContext(f);
    setLoadedAt(new Date().toISOString());
  } catch {
    setCaseObj(null);
    setTranscript([]);
    setFeedbackContext(null);
    setLoadedAt(new Date().toISOString());
  }
}, []);

  const patient = useMemo(() => extractPatient(caseObj), [caseObj]);
  const caseTitle = useMemo(() => extractTitle(caseObj), [caseObj]);
  const score = useMemo(() => computeScore(caseObj, transcript), [caseObj, transcript]);

  const scoreColor = useMemo(() => {
    if (score.total >= 85) return "text-emerald-700";
    if (score.total >= 75) return "text-sky-700";
    if (score.total >= 65) return "text-amber-700";
    return "text-red-700";
  }, [score.total]);

  const ringDeg = useMemo(() => {
    const deg = Math.round((score.total / 100) * 360);
    return Math.max(0, Math.min(360, deg));
  }, [score.total]);

  const dsmTag = useMemo(() => safeStr(caseObj?.meta?.dsm_tag, "—"), [caseObj]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)]">
      <div className="mx-auto flex max-w-[1480px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] backdrop-blur-xl shadow-[0_24px_70px_rgba(99,126,118,0.16)]">
          {/* TOPNAV */}
          <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white/80 px-5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-slate-500">Reportes</span>
              <span className="text-slate-900/30">›</span>
              <span className="font-semibold text-slate-900">Resultado de sesión</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href="/cases" className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                Biblioteca
              </Link>
              <Link href="/simulator" className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black">
                Repetir caso
              </Link>
            </div>
          </header>

          <div className="overflow-y-auto px-5 py-6">
            <div className="mb-6">
              <div className="text-2xl font-semibold text-slate-900">Resultado de sesión</div>
              <div className="mt-1 text-sm text-slate-500">
                Caso: <span className="text-slate-800">{caseTitle}</span>
                <span className="text-slate-900/30"> · </span>
                <span className="text-slate-400">Cargado {loadedAt ? new Date(loadedAt).toLocaleString() : "—"}</span>
              </div>
            </div>

            {/* Score hero */}
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-[#f4faf8] to-[#edf4f1] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <div
                      className="grid h-[108px] w-[108px] place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(#2563EB 0deg, #2563EB ${ringDeg}deg, rgba(255,255,255,0.10) ${ringDeg}deg)`,
                      }}
                    >
                      <div className="grid h-[86px] w-[86px] place-items-center rounded-full bg-white">
                        <div className="text-3xl font-bold text-slate-900 leading-none">{score.total}</div>
                        <div className="text-[11px] text-slate-400">/100</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Puntuación global</div>
                  </div>

                  <div>
                    <div className={"text-3xl font-bold " + scoreColor}>{score.label}</div>
                    <div className="mt-2 text-sm text-slate-500 max-w-[64ch]">{score.desc}</div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Duración</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{score.durationMin} min</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Mensajes</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{score.messages}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Paciente</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {patient.name}
                          <span className="text-slate-400 font-normal">{patient.age ? ` · ${patient.age}a` : ""}{patient.sex && patient.sex !== "—" ? ` · ${patient.sex}` : ""}</span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">DSM tag</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{dsmTag}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Subscores */}
            <section className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  ["Entrevista", score.interview, "from-blue-500/15"],
                  ["MSE", score.mse, "from-emerald-500/15"],
                  ["DSM-5", score.dsm, "from-purple-500/15"],
                  ["Seguridad", score.safety, "from-amber-500/15"],
                ] as const
              ).map(([label, val, tint]) => (
                <div key={label} className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                  <div className={"h-9 w-9 rounded-xl border border-slate-200 bg-gradient-to-br " + tint + " to-transparent grid place-items-center text-slate-700"}>
                    ✦
                  </div>
                  <div className="mt-3 text-xs text-slate-400">{label}</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{val}<span className="text-sm font-normal text-slate-400">/100</span></div>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-white/70" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </section>

            {/* Strengths / improvements */}
            <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                <div className="text-sm font-semibold text-emerald-700">✔ Fortalezas</div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {score.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 text-emerald-700">✔</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-5">
                <div className="text-sm font-semibold text-amber-700">⚠ Oportunidades de mejora</div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {score.improvements.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 text-amber-700">⚠</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {(feedbackContext?.use_scale_result || feedbackContext?.use_test_result) && (
              <section className="mt-5 rounded-3xl border border-slate-200 bg-white/80 p-5">
                <div className="text-sm font-semibold text-slate-900">Instrumentos incluidos en retroalimentación final</div>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  {feedbackContext?.use_scale_result && feedbackContext?.scale_result && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="font-semibold text-slate-900">
                        Escala: {feedbackContext?.scale_definition?.short_name ?? feedbackContext?.scale_definition?.name ?? "Escala"}
                      </div>
                      <div className="mt-1">
                        Score: {feedbackContext.scale_result.total_score ?? "—"}/{feedbackContext.scale_result.max_score ?? "—"} ·{" "}
                        {feedbackContext.scale_result.severity_label ?? "Sin clasificación"}
                      </div>
                      {feedbackContext.scale_result.interpretation && (
                        <div className="mt-1 text-slate-500">{feedbackContext.scale_result.interpretation}</div>
                      )}
                    </div>
                  )}

                  {feedbackContext?.use_test_result && feedbackContext?.test_result && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="font-semibold text-slate-900">
                        Test: {feedbackContext?.test_definition?.short_name ?? feedbackContext?.test_definition?.name ?? "Test"}
                      </div>
                      <div className="mt-1">
                        Score: {feedbackContext.test_result.total_score ?? "—"}/{feedbackContext.test_result.max_score ?? "—"} ·{" "}
                        {feedbackContext.test_result.classification ?? "Sin clasificación"}
                      </div>
                      {feedbackContext.test_result.interpretation && (
                        <div className="mt-1 text-slate-500">{feedbackContext.test_result.interpretation}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Uso educativo. No sustituye valoración clínica real ni constituye diagnóstico definitivo.
                </div>
              </section>
            )}

            {/* Missing questions */}
            <section className="mt-5 rounded-3xl border border-slate-200 bg-white/80 p-5">
              <div className="text-sm font-semibold text-slate-900">Preguntas que no exploraste</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {score.missingQuestions.map((q, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </section>

            {/* Export / actions */}
            <section className="mt-5 rounded-3xl border border-slate-200 bg-white/80 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-base font-semibold text-slate-900">¿Qué deseas hacer con este resultado?</div>
                  <div className="mt-1 text-sm text-slate-500">Guardado local activo · Sesión educativa</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const payload = {
                          case: caseObj,
                          transcript,
                          score,
                          feedbackContext,
                        };
                        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "session-result.json";
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        // noop
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Exportar JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Imprimir / PDF
                  </button>

                  <Link
                    href="/cases"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Guardar y volver
                  </Link>
                </div>
              </div>
            </section>

            {/* Debug */}
            <details className="mt-5">
              <summary className="cursor-pointer text-xs text-slate-500">Ver datos (debug)</summary>
              <pre className="mt-2 overflow-auto rounded-2xl bg-black/40 p-4 text-xs text-slate-600">
{JSON.stringify({ hasCase: !!caseObj, transcriptLen: transcript.length, dsmTag, feedbackContext }, null, 2)}
              </pre>
            </details>
          </div>
        </main>
      </div>
    </div>
  );
}
