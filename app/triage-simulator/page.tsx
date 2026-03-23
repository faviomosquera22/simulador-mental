"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  TRIAGE_CAREERS,
  TRIAGE_METRIC_KEYS,
  TRIAGE_METRIC_LABELS,
  applyOptionImpact,
  createInitialTriageScores,
  evaluateTriageSession,
  getCareerById,
  getScenarioById,
  getScenarioForCareer,
  getScenariosForCareer,
  prepareScenarioForRun,
  pickRandomScenarioForCareer,
  type TriageCareerId,
  type TriageDecisionRecord,
  type TriageMetricScores,
  type TriageScenario,
  type TriageStepOption,
} from "@/src/lib/triageCareerSimulator";

type Phase = "setup" | "running" | "finished";
type ScenarioMode = "random" | "manual";

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-700";
}

function scoreBar(score: number) {
  if (score >= 75) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-red-400";
}

function levelTone(level: string) {
  if (level === "Excelente") return "border-emerald-400/35 bg-emerald-400/10 text-emerald-700";
  if (level === "Competente") return "border-sky-400/35 bg-sky-400/10 text-sky-700";
  if (level === "En desarrollo") return "border-amber-400/35 bg-amber-400/10 text-amber-700";
  return "border-red-400/35 bg-red-400/10 text-red-700";
}

function formatElapsedSeconds(startedAt: string | null, endedAt: string | null) {
  if (!startedAt || !endedAt) return null;
  const started = new Date(startedAt).getTime();
  const ended = new Date(endedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return null;
  return Math.max(0, Math.round((ended - started) / 1000));
}

export default function TriageSimulatorPage() {
  const [careerId, setCareerId] = useState<TriageCareerId>(TRIAGE_CAREERS[0].id);
  const [phase, setPhase] = useState<Phase>("setup");
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("random");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("random");
  const [activeScenario, setActiveScenario] = useState<TriageScenario | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [scores, setScores] = useState<TriageMetricScores>(createInitialTriageScores());
  const [decisions, setDecisions] = useState<TriageDecisionRecord[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [stepFeedback, setStepFeedback] = useState<string>("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);

  const career = useMemo(() => getCareerById(careerId), [careerId]);
  const availableScenarios = useMemo(() => [...getScenariosForCareer(careerId)], [careerId]);

  const setupScenario = useMemo(() => {
    const fallback = getScenarioForCareer(careerId);
    if (!availableScenarios.length) return fallback;
    if (scenarioMode === "manual" && selectedScenarioId !== "random") {
      return availableScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? availableScenarios[0];
    }
    return availableScenarios[0];
  }, [careerId, availableScenarios, scenarioMode, selectedScenarioId]);

  const scenario = phase === "setup" ? setupScenario : activeScenario ?? setupScenario;
  const currentStep = phase === "running" ? scenario.steps[stepIndex] ?? null : null;

  useEffect(() => {
    if (scenarioMode !== "manual") return;
    if (!availableScenarios.length) {
      setSelectedScenarioId("random");
      return;
    }

    if (selectedScenarioId === "random") {
      setSelectedScenarioId(availableScenarios[0].id);
      return;
    }

    const exists = availableScenarios.some((item) => item.id === selectedScenarioId);
    if (!exists) {
      setSelectedScenarioId(availableScenarios[0].id);
    }
  }, [scenarioMode, availableScenarios, selectedScenarioId]);

  const progress = useMemo(() => {
    if (phase !== "running" || !scenario.steps.length) return 0;
    const value = ((stepIndex + (selectedOptionId ? 1 : 0)) / scenario.steps.length) * 100;
    return Math.max(0, Math.min(100, Math.round(value)));
  }, [phase, scenario.steps.length, stepIndex, selectedOptionId]);

  const elapsedSeconds = useMemo(() => formatElapsedSeconds(startedAt, endedAt), [startedAt, endedAt]);

  const debrief = useMemo(() => {
    if (phase !== "finished" || !activeScenario) return null;
    return evaluateTriageSession({
      career,
      scenario: activeScenario,
      scores,
      decisions,
    });
  }, [phase, activeScenario, career, scores, decisions]);

  function startRunWithScenario(nextScenario: TriageScenario) {
    setActiveScenario(prepareScenarioForRun(nextScenario));
    setPhase("running");
    setStepIndex(0);
    setScores(createInitialTriageScores());
    setDecisions([]);
    setSelectedOptionId(null);
    setStepFeedback("");
    setStartedAt(new Date().toISOString());
    setEndedAt(null);
  }

  function startSimulation() {
    const manualScenario =
      scenarioMode === "manual" && selectedScenarioId !== "random"
        ? getScenarioById(selectedScenarioId)
        : null;

    const scenarioForRun =
      manualScenario ??
      pickRandomScenarioForCareer(careerId, activeScenario?.id);

    startRunWithScenario(scenarioForRun);
  }

  function repeatCurrentScenario() {
    if (!activeScenario) {
      startSimulation();
      return;
    }
    startRunWithScenario(activeScenario);
  }

  function resetToSetup() {
    setPhase("setup");
    setActiveScenario(null);
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

  const roleObjective = scenario.roleObjectiveByCareer[careerId] ?? scenario.learningGoal;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Simulador de triaje por carrera</h1>
              <p className="mt-1 text-sm text-slate-600">
                Entrena priorizacion, manejo inicial y comunicacion interprofesional con rubricas por rol.
              </p>
            </div>
          </header>

          {phase === "setup" && (
            <>
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white/82 p-5">
                <div className="text-sm text-slate-500">Paso 1</div>
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
                            : "border-slate-200 bg-white hover:bg-white"
                        }`}
                      >
                        <div className="text-base font-semibold">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Objetivo por carrera</div>
                    <div className="mt-2 text-sm text-slate-800">{roleObjective}</div>

                    <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Paso 2 · Tipo de escenario</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioMode("random");
                          setSelectedScenarioId("random");
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          scenarioMode === "random"
                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Aleatorio por carrera
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScenarioMode("manual");
                          if (selectedScenarioId === "random" && availableScenarios[0]) {
                            setSelectedScenarioId(availableScenarios[0].id);
                          }
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          scenarioMode === "manual"
                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Escoger manual
                      </button>
                    </div>

                    {scenarioMode === "manual" && (
                      <div className="mt-3">
                        <label className="text-xs text-slate-500">Escenario</label>
                        <select
                          value={selectedScenarioId === "random" ? (availableScenarios[0]?.id ?? "") : selectedScenarioId}
                          onChange={(e) => setSelectedScenarioId(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                        >
                          {availableScenarios.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white/78 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          {scenarioMode === "manual" ? "Escenario seleccionado" : "Escenario (vista previa)"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {availableScenarios.length} disponibles
                        </div>
                      </div>

                      <div className="mt-2 text-sm font-semibold text-slate-900">{scenario.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{scenario.setting}</div>

                      {scenarioMode === "random" && availableScenarios.length > 1 && (
                        <div className="mt-2 text-xs text-cyan-700/85">
                          Al iniciar se elige uno aleatorio de esta carrera.
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Paciente</div>
                          <div className="mt-1 text-xs text-slate-700">{scenario.patientSummary}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Motivo de consulta</div>
                          <div className="mt-1 text-xs text-slate-700">{scenario.chiefComplaint}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">Objetivo docente</div>
                          <div className="mt-1 text-xs text-slate-700">{scenario.learningGoal}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Enfoques de evaluacion</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {career.focus.map((focusLine) => (
                        <li key={focusLine}>{focusLine}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Estructura</div>
                    <div className="mt-2 text-sm text-slate-700">5 decisiones guiadas</div>
                    <div className="mt-1 text-sm text-slate-700">Feedback inmediato por turno</div>
                    <div className="mt-1 text-sm text-slate-700">Debrief con scoring por rol</div>
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
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white/82 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-slate-500">
                    Carrera: <span className="font-semibold text-slate-900">{career.name}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Paso {stepIndex + 1} de {scenario.steps.length}
                  </div>
                </div>

                <div className="mt-1 text-xs text-slate-400">Escenario activo: {scenario.title}</div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{currentStep.title}</div>
                    <h2 className="mt-2 text-lg font-semibold">{currentStep.prompt}</h2>
                    <div className="mt-2 text-sm text-slate-500">{currentStep.hint}</div>

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
                                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-700"
                                : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-black/45"
                            } disabled:cursor-not-allowed disabled:opacity-85`}
                          >
                            <div className="text-sm font-medium">{option.label}</div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedOptionId && (
                      <div className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-700">
                        <div className="text-xs uppercase tracking-wide text-cyan-700/80">Respuesta del escenario</div>
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

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Objetivo del rol</div>
                    <div className="mt-2 text-sm text-slate-700">{roleObjective}</div>

                    <div className="mt-4 text-xs uppercase tracking-wide text-slate-400">Metricas en tiempo real</div>
                    <div className="mt-2 space-y-2">
                      {TRIAGE_METRIC_KEYS.map((key) => {
                        const value = scores[key];
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{TRIAGE_METRIC_LABELS[key]}</span>
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
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white/82 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="text-sm text-slate-500">Debrief final</div>
                    <h2 className="mt-1 text-xl font-semibold">{scenario.title}</h2>
                    <div className="mt-2 text-sm text-slate-600">Carrera evaluada: {career.name}</div>
                    {typeof elapsedSeconds === "number" && (
                      <div className="mt-1 text-sm text-slate-500">Tiempo total: {elapsedSeconds}s</div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${levelTone(debrief.level)}`}>
                        Nivel {debrief.level}
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                        Score ponderado: {debrief.weightedScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Metricas finales</div>
                    <div className="mt-2 space-y-2">
                      {TRIAGE_METRIC_KEYS.map((key) => {
                        const value = debrief.metricScores[key];
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{TRIAGE_METRIC_LABELS[key]}</span>
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
                    <div className="text-xs uppercase tracking-wide text-emerald-700/80">Fortalezas</div>
                    {debrief.strengths.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                        {debrief.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-sm text-emerald-700/85">No hubo metricas en rango alto aun.</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                    <div className="text-xs uppercase tracking-wide text-amber-700/80">Para mejorar</div>
                    {debrief.improvementAreas.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                        {debrief.improvementAreas.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-sm text-amber-700/85">Buen control global en este escenario.</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-slate-200 bg-white/82 p-5">
                <div className="text-sm text-slate-500">Revision por decision</div>
                <h3 className="mt-1 text-lg font-semibold">Comparacion de tus elecciones vs mejor alternativa</h3>

                <div className="mt-4 space-y-3">
                  {debrief.stepReviews.map((review) => (
                    <div key={review.stepId} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">{review.title}</div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                            review.isBestChoice
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-700"
                              : "border-amber-400/30 bg-amber-400/10 text-amber-700"
                          }`}
                        >
                          {review.isBestChoice ? "Decision optima" : "Mejorable"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-700">Tu eleccion: {review.selectedLabel}</div>
                      <div className="mt-1 text-xs text-slate-500">{review.selectedSummary}</div>
                      {!review.isBestChoice && (
                        <>
                          <div className="mt-2 text-sm text-cyan-700">Alternativa sugerida: {review.bestLabel}</div>
                          <div className="mt-1 text-xs text-cyan-700/80">{review.bestSummary}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-slate-200 bg-white/82 p-5">
                <div className="text-sm text-slate-500">Hallazgos del debrief</div>
                <h3 className="mt-1 text-lg font-semibold">Sesgos y riesgos detectados</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {debrief.flags.map((flag) => (
                    <span key={flag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                      {flag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={repeatCurrentScenario}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Repetir escenario
                  </button>
                  <button
                    type="button"
                    onClick={resetToSetup}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cambiar carrera
                  </button>
                </div>
              </section>
            </>
          )}

          <div className="mt-6 text-xs text-slate-400">
            Simulador educativo. Las decisiones clinicas reales deben seguir protocolos institucionales y supervision docente.
          </div>
        </main>
      </div>
    </div>
  );
}
