"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import {
  TRIAGE_CAREERS,
  TRIAGE_METRIC_KEYS,
  TRIAGE_METRIC_LABELS,
  applyOptionImpact,
  createInitialTriageScores,
  evaluateTriageSession,
  getCareerById,
  getScenarioForCareer,
  type TriageCareerId,
  type TriageDecisionRecord,
  type TriageMetricScores,
  type TriageStepOption,
} from "@/src/lib/triageCareerSimulator";

type Phase = "setup" | "running" | "finished";

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-200";
  if (score >= 60) return "text-amber-200";
  return "text-red-200";
}

function scoreBar(score: number) {
  if (score >= 75) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-red-400";
}

function levelTone(level: string) {
  if (level === "Excelente") return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
  if (level === "Competente") return "border-sky-400/35 bg-sky-400/10 text-sky-100";
  if (level === "En desarrollo") return "border-amber-400/35 bg-amber-400/10 text-amber-100";
  return "border-red-400/35 bg-red-400/10 text-red-100";
}

function formatElapsedSeconds(startedAt: string | null, endedAt: string | null) {
  if (!startedAt || !endedAt) return null;
  const started = new Date(startedAt).getTime();
  const ended = new Date(endedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return null;
  const delta = Math.max(0, Math.round((ended - started) / 1000));
  return delta;
}

export default function TriageSimulatorPage() {
  const [careerId, setCareerId] = useState<TriageCareerId>(TRIAGE_CAREERS[0].id);
  const [phase, setPhase] = useState<Phase>("setup");
  const [stepIndex, setStepIndex] = useState(0);
  const [scores, setScores] = useState<TriageMetricScores>(createInitialTriageScores());
  const [decisions, setDecisions] = useState<TriageDecisionRecord[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [stepFeedback, setStepFeedback] = useState<string>("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);

  const career = useMemo(() => getCareerById(careerId), [careerId]);
  const scenario = useMemo(() => getScenarioForCareer(careerId), [careerId]);
  const currentStep = scenario.steps[stepIndex] ?? null;

  const progress = useMemo(() => {
    if (!scenario.steps.length) return 0;
    const value = ((stepIndex + (selectedOptionId ? 1 : 0)) / scenario.steps.length) * 100;
    return Math.max(0, Math.min(100, Math.round(value)));
  }, [scenario.steps.length, stepIndex, selectedOptionId]);

  const elapsedSeconds = useMemo(() => formatElapsedSeconds(startedAt, endedAt), [startedAt, endedAt]);

  const debrief = useMemo(() => {
    if (phase !== "finished") return null;
    return evaluateTriageSession({
      career,
      scenario,
      scores,
      decisions,
    });
  }, [phase, career, scenario, scores, decisions]);

  function startSimulation() {
    setPhase("running");
    setStepIndex(0);
    setScores(createInitialTriageScores());
    setDecisions([]);
    setSelectedOptionId(null);
    setStepFeedback("");
    setStartedAt(new Date().toISOString());
    setEndedAt(null);
  }

  function resetToSetup() {
    setPhase("setup");
    setStepIndex(0);
    setScores(createInitialTriageScores());
    setDecisions([]);
    setSelectedOptionId(null);
    setStepFeedback("");
    setStartedAt(null);
    setEndedAt(null);
  }

  function handleSelectOption(option: TriageStepOption) {
    if (phase !== "running" || !currentStep || selectedOptionId) return;

    setSelectedOptionId(option.id);
    setStepFeedback(option.npcReply);
    setScores((prev) => applyOptionImpact(prev, option.impact));
    setDecisions((prev) => [
      ...prev,
      {
        stepId: currentStep.id,
        optionId: option.id,
        impact: option.impact,
        tags: option.tags,
      },
    ]);
  }

  function continueStep() {
    if (phase !== "running" || !currentStep || !selectedOptionId) return;

    const isLastStep = stepIndex >= scenario.steps.length - 1;
    if (isLastStep) {
      setPhase("finished");
      setEndedAt(new Date().toISOString());
      return;
    }

    setStepIndex((prev) => prev + 1);
    setSelectedOptionId(null);
    setStepFeedback("");
  }

  const roleObjective =
    scenario.roleObjectiveByCareer[careerId] ?? scenario.learningGoal;

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-7xl gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Simulador de triaje por carrera</h1>
              <p className="mt-1 text-sm text-white/70">
                Entrena priorizacion, manejo inicial y comunicacion interprofesional con rubricas por rol.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/medical-cases"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Patologias medicas
              </Link>
              <Link
                href="/cases"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Trastornos mentales
              </Link>
            </div>
          </header>

          {phase === "setup" && (
            <>
              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/85 p-5">
                <div className="text-sm text-white/60">Escenario V1</div>
                <h2 className="mt-1 text-xl font-semibold">{scenario.title}</h2>
                <div className="mt-2 text-sm text-white/75">{scenario.setting}</div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/50">Paciente</div>
                    <div className="mt-1 text-sm text-white/85">{scenario.patientSummary}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/50">Motivo de consulta</div>
                    <div className="mt-1 text-sm text-white/85">{scenario.chiefComplaint}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/50">Objetivo docente</div>
                    <div className="mt-1 text-sm text-white/85">{scenario.learningGoal}</div>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/80 p-5">
                <div className="text-sm text-white/60">Paso 1</div>
                <h2 className="mt-1 text-lg font-semibold">Selecciona carrera de salud</h2>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {TRIAGE_CAREERS.map((item) => {
                    const active = item.id === careerId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCareerId(item.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-cyan-400/35 bg-cyan-500/10 ring-2 ring-cyan-400/25"
                            : "border-white/10 bg-black/25 hover:bg-black/35"
                        }`}
                      >
                        <div className="text-base font-semibold">{item.name}</div>
                        <div className="mt-1 text-sm text-white/70">{item.description}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/50">Objetivo por carrera</div>
                    <div className="mt-2 text-sm text-white/85">{roleObjective}</div>
                    <div className="mt-4 text-xs uppercase tracking-wide text-white/50">Enfoques de evaluacion</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                      {career.focus.map((focusLine) => (
                        <li key={focusLine}>{focusLine}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/50">Estructura</div>
                    <div className="mt-2 text-sm text-white/80">5 decisiones guiadas</div>
                    <div className="mt-1 text-sm text-white/80">Feedback inmediato por turno</div>
                    <div className="mt-1 text-sm text-white/80">Debrief con scoring por rol</div>
                    <button
                      type="button"
                      onClick={startSimulation}
                      className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
                    >
                      Iniciar simulacion
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {phase === "running" && currentStep && (
            <>
              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/85 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-white/65">
                    Carrera: <span className="font-semibold text-white">{career.name}</span>
                  </div>
                  <div className="text-xs text-white/60">
                    Paso {stepIndex + 1} de {scenario.steps.length}
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/50">{currentStep.title}</div>
                    <h2 className="mt-2 text-lg font-semibold">{currentStep.prompt}</h2>
                    <div className="mt-2 text-sm text-white/65">{currentStep.hint}</div>

                    <div className="mt-4 space-y-2">
                      {currentStep.options.map((option) => {
                        const selected = selectedOptionId === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={Boolean(selectedOptionId)}
                            onClick={() => handleSelectOption(option)}
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              selected
                                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                                : "border-white/10 bg-black/30 text-white/85 hover:bg-black/45"
                            } disabled:cursor-not-allowed disabled:opacity-85`}
                          >
                            <div className="text-sm font-medium">{option.label}</div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedOptionId && (
                      <div className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">
                        <div className="text-xs uppercase tracking-wide text-cyan-100/80">Respuesta del escenario</div>
                        <div className="mt-1">{stepFeedback}</div>
                        <button
                          type="button"
                          onClick={continueStep}
                          className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black"
                        >
                          {stepIndex >= scenario.steps.length - 1 ? "Finalizar debrief" : "Continuar"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/50">Objetivo del rol</div>
                    <div className="mt-2 text-sm text-white/80">{roleObjective}</div>

                    <div className="mt-4 text-xs uppercase tracking-wide text-white/50">Metricas en tiempo real</div>
                    <div className="mt-2 space-y-2">
                      {TRIAGE_METRIC_KEYS.map((key) => {
                        const value = scores[key];
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/70">{TRIAGE_METRIC_LABELS[key]}</span>
                              <span className={scoreTone(value)}>{value}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full ${scoreBar(value)}`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {phase === "finished" && debrief && (
            <>
              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/85 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="text-sm text-white/60">Debrief final</div>
                    <h2 className="mt-1 text-xl font-semibold">{scenario.title}</h2>
                    <div className="mt-2 text-sm text-white/70">Carrera evaluada: {career.name}</div>
                    {typeof elapsedSeconds === "number" && (
                      <div className="mt-1 text-sm text-white/60">Tiempo total: {elapsedSeconds}s</div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${levelTone(debrief.level)}`}>
                        Nivel {debrief.level}
                      </span>
                      <span className="inline-flex rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/80">
                        Score ponderado: {debrief.weightedScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wide text-white/50">Metricas finales</div>
                    <div className="mt-2 space-y-2">
                      {TRIAGE_METRIC_KEYS.map((key) => {
                        const value = debrief.metricScores[key];
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/70">{TRIAGE_METRIC_LABELS[key]}</span>
                              <span className={scoreTone(value)}>{value}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div className={`h-full rounded-full ${scoreBar(value)}`} style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                    <div className="text-xs uppercase tracking-wide text-emerald-100/80">Fortalezas</div>
                    {debrief.strengths.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-100">
                        {debrief.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-sm text-emerald-100/85">No hubo metricas en rango alto aun.</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                    <div className="text-xs uppercase tracking-wide text-amber-100/80">Para mejorar</div>
                    {debrief.improvementAreas.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100">
                        {debrief.improvementAreas.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-sm text-amber-100/85">Buen control global en este escenario.</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/80 p-5">
                <div className="text-sm text-white/60">Revision por decision</div>
                <h3 className="mt-1 text-lg font-semibold">Comparacion de tus elecciones vs mejor alternativa</h3>

                <div className="mt-4 space-y-3">
                  {debrief.stepReviews.map((review) => (
                    <div key={review.stepId} className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">{review.title}</div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                            review.isBestChoice
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                              : "border-amber-400/30 bg-amber-400/10 text-amber-100"
                          }`}
                        >
                          {review.isBestChoice ? "Decision optima" : "Mejorable"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-white/80">Tu eleccion: {review.selectedLabel}</div>
                      <div className="mt-1 text-xs text-white/60">{review.selectedSummary}</div>
                      {!review.isBestChoice && (
                        <>
                          <div className="mt-2 text-sm text-cyan-100">Alternativa sugerida: {review.bestLabel}</div>
                          <div className="mt-1 text-xs text-cyan-100/80">{review.bestSummary}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/80 p-5">
                <div className="text-sm text-white/60">Hallazgos del debrief</div>
                <h3 className="mt-1 text-lg font-semibold">Sesgos y riesgos detectados</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {debrief.flags.map((flag) => (
                    <span key={flag} className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80">
                      {flag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startSimulation}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Repetir escenario
                  </button>
                  <button
                    type="button"
                    onClick={resetToSetup}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Cambiar carrera
                  </button>
                </div>
              </section>
            </>
          )}

          <div className="mt-6 text-xs text-white/45">
            Simulador educativo. Las decisiones clinicas reales deben seguir protocolos institucionales y supervision docente.
          </div>
        </main>
      </div>
    </div>
  );
}
