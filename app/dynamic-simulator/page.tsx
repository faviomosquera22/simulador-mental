"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  DYNAMIC_SIMULATION_LIBRARY,
  applyDynamicSimulationVitals,
  dynamicSimulationCategoryLabel,
  dynamicSimulationContextLabel,
  dynamicSimulationDifficultyLabel,
  dynamicStudyModuleLabel,
  evaluateDynamicSimulationScenario,
  inferDynamicSimulationCategory,
  inferDynamicSimulationContext,
  type DynamicSimulationCategory,
  type DynamicSimulationContext,
  type DynamicSimulationScenario,
} from "@/src/lib/dynamicSimulatorModule";
import { formatAdvancedPressure, normalizeText, type AdvancedDifficulty, type AdvancedMode } from "@/src/lib/advancedModuleUtils";

type SelectionMode = "manual" | "random" | "contextual_random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = AdvancedDifficulty | "all";
type ProgressionMode = "turns" | "realtime";
type ProgressionSpeed = "slow" | "normal" | "fast";
type FeedbackStyle = "immediate" | "final";

type EventLogItem = {
  id: string;
  title: string;
  body: string;
  tone: "info" | "success" | "warning";
};

function parseActiveCase(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function speedStep(speed: ProgressionSpeed) {
  if (speed === "slow") return 1;
  if (speed === "fast") return 3;
  return 2;
}

export default function DynamicSimulatorPage() {
  const [mode, setMode] = useState<AdvancedMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("standalone");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<DynamicSimulationCategory | "all">("all");
  const [contextFilter, setContextFilter] = useState<DynamicSimulationContext>("general");
  const [search, setSearch] = useState("");
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>("turns");
  const [progressionSpeed, setProgressionSpeed] = useState<ProgressionSpeed>("normal");
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>("immediate");
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [scenarioPool] = useState(DYNAMIC_SIMULATION_LIBRARY);
  const [scenario, setScenario] = useState<DynamicSimulationScenario>(DYNAMIC_SIMULATION_LIBRARY[0]);
  const [manualScenarioId, setManualScenarioId] = useState(DYNAMIC_SIMULATION_LIBRARY[0]?.id ?? "");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [revealedStudyIds, setRevealedStudyIds] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentVitals, setCurrentVitals] = useState(DYNAMIC_SIMULATION_LIBRARY[0].initialVitals);
  const [currentStatus, setCurrentStatus] = useState(DYNAMIC_SIMULATION_LIBRARY[0].initialStatus);
  const [currentRhythm, setCurrentRhythm] = useState(DYNAMIC_SIMULATION_LIBRARY[0].initialRhythm ?? "No especificado");
  const [timeRemaining, setTimeRemaining] = useState(DYNAMIC_SIMULATION_LIBRARY[0].timeLimitSec);
  const [timedOut, setTimedOut] = useState(false);
  const [eventLog, setEventLog] = useState<EventLogItem[]>([]);
  const [lastFeedback, setLastFeedback] = useState("");

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  useEffect(() => {
    if (mode === "evaluation") setFeedbackStyle("final");
  }, [mode]);

  const effectiveContext = useMemo(() => {
    if (usageMode === "integrated_case" && activeCaseObj) {
      return inferDynamicSimulationContext(activeCaseObj);
    }
    return contextFilter;
  }, [activeCaseObj, contextFilter, usageMode]);

  const effectiveCategory = useMemo(() => {
    if (usageMode === "integrated_case" && activeCaseObj && categoryFilter === "all") {
      return inferDynamicSimulationCategory(activeCaseObj);
    }
    return categoryFilter;
  }, [activeCaseObj, categoryFilter, usageMode]);

  const filteredPool = useMemo(() => {
    return scenarioPool.filter((item) => {
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (effectiveCategory !== "all" && item.category !== effectiveCategory) return false;
      if (search.trim()) {
        const haystack = normalizeText(
          [item.title, item.subcategory, item.clinicalSummary, item.tags.join(" ")].join(" ")
        );
        if (!haystack.includes(normalizeText(search))) return false;
      }
      return true;
    });
  }, [difficultyFilter, effectiveCategory, scenarioPool, search]);

  const contextualPool = useMemo(() => {
    const contextual = filteredPool.filter((item) => item.context === effectiveContext);
    return contextual.length ? contextual : filteredPool;
  }, [effectiveContext, filteredPool]);

  const resetRun = useCallback(
    (nextScenario?: DynamicSimulationScenario) => {
      const activeScenario = nextScenario ?? scenario;
      setSelectedActionIds([]);
      setRevealedStudyIds([]);
      setCurrentStageIndex(0);
      setCurrentVitals(activeScenario.initialVitals);
      setCurrentStatus(activeScenario.initialStatus);
      setCurrentRhythm(activeScenario.initialRhythm ?? "No especificado");
      setTimeRemaining(activeScenario.timeLimitSec);
      setTimedOut(false);
      setLastFeedback("");
      setEventLog([
        {
          id: `${activeScenario.id}-start`,
          title: "Inicio del caso",
          body: activeScenario.clinicalSummary,
          tone: "info",
        },
      ]);
    },
    [scenario]
  );

  const pickNextScenario = useCallback(
    (excludeId?: string) => {
      const sourcePool = selectionMode === "contextual_random" ? contextualPool : filteredPool;
      const available = sourcePool.filter((item) => item.id !== excludeId);

      if (selectionMode === "manual") {
        return filteredPool.find((item) => item.id === manualScenarioId) ?? filteredPool[0] ?? DYNAMIC_SIMULATION_LIBRARY[0];
      }

      return available[Math.floor(Math.random() * Math.max(available.length, 1))] ?? available[0] ?? filteredPool[0] ?? DYNAMIC_SIMULATION_LIBRARY[0];
    },
    [contextualPool, filteredPool, manualScenarioId, selectionMode]
  );

  useEffect(() => {
    const next = pickNextScenario();
    if (!next) return;
    setScenario(next);
    if (selectionMode === "manual") setManualScenarioId(next.id);
    resetRun(next);
  }, [pickNextScenario, resetRun, selectionMode]);

  useEffect(() => {
    if (progressionMode !== "realtime") return;
    if (mode !== "evaluation") return;
    if (timedOut) return;
    if (selectedActionIds.length >= scenario.stages.length) return;

    const id = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const next = Math.max(0, prev - speedStep(progressionSpeed));
        if (next === 0) {
          window.clearInterval(id);
          setTimedOut(true);
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [mode, progressionMode, progressionSpeed, scenario.stages.length, selectedActionIds.length, timedOut]);

  const currentStage = scenario.stages[currentStageIndex] ?? null;
  const revealedStudies = useMemo(
    () => scenario.availableStudies.filter((study) => revealedStudyIds.includes(study.id)),
    [revealedStudyIds, scenario.availableStudies]
  );

  const result = useMemo(() => {
    if (!timedOut && selectedActionIds.length < scenario.stages.length) return null;
    return evaluateDynamicSimulationScenario({ scenario, selectedActionIds, timedOut });
  }, [scenario, selectedActionIds, timedOut]);

  function loadNewScenario() {
    const next = pickNextScenario(scenario.id);
    if (!next) return;
    setScenario(next);
    if (selectionMode === "manual") setManualScenarioId(next.id);
    resetRun(next);
  }

  function chooseAction(actionId: string) {
    if (!currentStage || result) return;
    const action = currentStage.actions.find((item) => item.id === actionId);
    if (!action) return;

    setSelectedActionIds((prev) => [...prev, action.id]);
    setCurrentStageIndex((prev) => prev + 1);
    setCurrentVitals((prev) => applyDynamicSimulationVitals(prev, action.vitalDelta));
    if (action.resultingRhythm) setCurrentRhythm(action.resultingRhythm);
    if (action.resultingStatus) setCurrentStatus(action.resultingStatus);
    if (action.revealsStudyIds?.length) {
      setRevealedStudyIds((prev) => Array.from(new Set([...prev, ...action.revealsStudyIds!])));
    }
    setLastFeedback(action.feedback);
    setEventLog((prev) => [
      {
        id: `${currentStage.id}-${action.id}-${prev.length}`,
        title: currentStage.title,
        body: `${action.label}. ${action.feedback}`,
        tone: action.score >= 25 ? "success" : action.score > 0 ? "info" : "warning",
      },
      ...prev,
    ]);
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1640px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Simulador dinámico</h1>
              <p className="mt-1 text-sm text-white/70">
                Integra signos vitales, ECG, laboratorio, gasometría e intervenciones en una evolución clínica inmersiva.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Biblioteca: {scenarioPool.length} casos
              </span>
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-red-100">
                Tiempo: {progressionMode === "realtime" ? formatTimer(timeRemaining) : "Por turnos"}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0B111D]/85 p-4 md:grid-cols-2 xl:grid-cols-9">
            <label className="text-xs text-white/70">
              Modo
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as AdvancedMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="practice">Práctica guiada</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Uso
              <select
                value={usageMode}
                onChange={(event) => setUsageMode(event.target.value as UsageMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="standalone">Módulo independiente</option>
                <option value="integrated_case">Integrado al caso</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Selección
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="contextual_random">Aleatorio contextual</option>
                <option value="random">Aleatorio</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Dificultad
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas</option>
                <option value="basic">Básico</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Área clínica
              <select
                value={effectiveCategory}
                onChange={(event) => setCategoryFilter(event.target.value as DynamicSimulationCategory | "all")}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas</option>
                <option value="cardiovascular">Cardiovascular</option>
                <option value="respiratory">Respiratorio</option>
                <option value="infectious">Infeccioso</option>
                <option value="metabolic">Metabólico</option>
                <option value="neurologic">Neurológico</option>
                <option value="trauma">Trauma</option>
                <option value="toxicologic">Toxicológico</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Contexto
              <select
                value={effectiveContext}
                onChange={(event) => setContextFilter(event.target.value as DynamicSimulationContext)}
                disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                <option value="general">General</option>
                <option value="emergency">Emergencia</option>
                <option value="icu">UCI</option>
                <option value="ward">Hospitalización</option>
                <option value="prehospital">Prehospitalario</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Progresión
              <select
                value={progressionMode}
                onChange={(event) => setProgressionMode(event.target.value as ProgressionMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="turns">Por turnos</option>
                <option value="realtime">Tiempo real</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Velocidad
              <select
                value={progressionSpeed}
                onChange={(event) => setProgressionSpeed(event.target.value as ProgressionSpeed)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="slow">Lenta</option>
                <option value="normal">Normal</option>
                <option value="fast">Rápida</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Buscar
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="shock, DKA, trauma..."
              />
            </label>
          </section>

          <section className="mt-3 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 xl:grid-cols-[1.3fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Caso dinámico actual</div>
              <div className="mt-1 text-base font-semibold text-white">{scenario.title}</div>
              <div className="mt-1 text-sm text-white/70">{scenario.clinicalSummary}</div>
              <div className="mt-1 text-sm text-white/65">
                {scenario.patientProfile.name} · {scenario.patientProfile.age} años · {scenario.patientProfile.setting}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-white/70">
                  {dynamicSimulationCategoryLabel(scenario.category)}
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-100">
                  {dynamicSimulationDifficultyLabel(scenario.difficulty)}
                </span>
                <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-orange-100">
                  {dynamicSimulationContextLabel(scenario.context)}
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                  {scenario.progressionLabel}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              <div className="font-semibold text-white/85">Configuración del caso</div>
              <div className="mt-2">Pool filtrado: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}</div>
              <div className="mt-1">Feedback: {mode === "practice" ? feedbackStyle : "Final"}</div>
              <div className="mt-1">Estudios revelados: {revealedStudies.length}/{scenario.availableStudies.length}</div>
              {selectionMode === "manual" && (
                <label className="mt-3 block text-white/70">
                  Caso manual
                  <select
                    value={manualScenarioId}
                    onChange={(event) => {
                      setManualScenarioId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? DYNAMIC_SIMULATION_LIBRARY[0];
                      setScenario(next);
                      resetRun(next);
                    }}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                  >
                    {filteredPool.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="flex items-start justify-end gap-2">
              {mode === "practice" && (
                <label className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
                  Feedback
                  <select
                    value={feedbackStyle}
                    onChange={(event) => setFeedbackStyle(event.target.value as FeedbackStyle)}
                    className="mt-1 block w-full bg-transparent text-sm text-white outline-none"
                  >
                    <option value="immediate">Inmediato</option>
                    <option value="final">Solo final</option>
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={loadNewScenario}
                className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nuevo caso
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-4">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: "FC", value: `${currentVitals.hr} lpm` },
                    { label: "PA", value: formatAdvancedPressure(currentVitals.sbp, currentVitals.dbp) },
                    { label: "SpO₂", value: `${currentVitals.spo2}%` },
                    { label: "FR", value: `${currentVitals.rr} rpm` },
                    { label: "Temp", value: `${currentVitals.temp.toFixed(1)}°C` },
                    { label: "Fase", value: `${Math.min(currentStageIndex + 1, scenario.stages.length)}/${scenario.stages.length}` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">{item.label}</div>
                      <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/72">Estado dinámico</div>
                    <div className="mt-2 text-xl font-semibold text-white">{currentStatus}</div>
                    <div className="mt-3 text-sm text-white/72">{scenario.expectedOutcome}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Monitor actual</div>
                    <div className="mt-2 text-lg font-semibold text-white">{currentRhythm}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scenario.alerts.map((alert) => (
                        <span key={alert} className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[11px] text-red-100">
                          {alert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {currentStage ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-white/45">{currentStage.title}</div>
                        <div className="mt-2 text-lg font-semibold text-white">{currentStage.prompt}</div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        {progressionMode === "realtime" ? formatTimer(timeRemaining) : "Paso guiado"}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {currentStage.actions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => chooseAction(action.id)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/82 transition hover:bg-white/10"
                        >
                          <div className="font-medium text-white">{action.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                    Todas las fases fueron resueltas. Revisa el score global, la cronología y los estudios revelados.
                  </div>
                )}

                {mode === "practice" && feedbackStyle === "immediate" && lastFeedback && !result && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                    {lastFeedback}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-white/45">Bitácora de evolución</div>
                    <div className="mt-1 text-sm text-white/60">El caso registra cambios según tus decisiones.</div>
                  </div>
                  <div className="text-xs text-white/45">{eventLog.length} eventos</div>
                </div>
                <div className="mt-4 space-y-3">
                  {eventLog.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-3 ${
                        item.tone === "success"
                          ? "border-emerald-400/20 bg-emerald-400/10"
                          : item.tone === "warning"
                          ? "border-amber-400/20 bg-amber-400/10"
                          : "border-white/10 bg-black/25"
                      }`}
                    >
                      <div className="text-xs uppercase tracking-[0.14em] text-white/45">{item.title}</div>
                      <div className="mt-1 text-sm text-white/80">{item.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-white/45">Hallazgos clave</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/72">
                  {scenario.keyFindings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/65">
                  Criterios de éxito: {scenario.successCriteria.join(" · ")}
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/65">
                  Riesgos de fallo: {scenario.failureCriteria.join(" · ")}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B111D]/90 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-white/45">Estudios integrados</div>
                    <div className="mt-1 text-sm text-white/60">ECG, laboratorio y gasometría se liberan según tu secuencia clínica.</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {revealedStudies.length}/{scenario.availableStudies.length}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {revealedStudies.length ? (
                    revealedStudies.map((study) => (
                      <div key={study.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{study.title}</div>
                            <div className="text-xs text-white/55">{study.summary}</div>
                          </div>
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100">
                            {dynamicStudyModuleLabel(study.module)}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1.5 text-sm text-white/72">
                          {study.rows.map((row) => (
                            <div key={`${study.id}-${row.label}`} className="flex items-center justify-between gap-3">
                              <span className="text-white/50">{row.label}</span>
                              <span className="text-right text-white/88">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 text-sm text-white/55">
                      Aún no has solicitado ni desbloqueado estudios. La secuencia de tus acciones define qué información aparece.
                    </div>
                  )}
                </div>
              </div>

              {result && (
                <div className="rounded-2xl border border-white/10 bg-[#0B111D]/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-white/45">Resultado final</div>
                      <div className="mt-1 text-2xl font-semibold text-white">
                        {result.totalScore}/{result.maxScore}
                      </div>
                    </div>
                    <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      {result.outcome}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {result.stageFeedback.map((item) => (
                      <div key={`${item.stageTitle}-${item.actionLabel}`} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                        <div className="text-xs text-white/50">{item.stageTitle}</div>
                        <div className="mt-1 text-sm font-semibold text-white">{item.actionLabel}</div>
                        <div className="mt-1 text-sm text-white/68">{item.feedback}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                    {scenario.feedback.explanation}
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/72">
                    Conducta esperada: {scenario.feedback.expectedConduct}
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/72">
                    Perla dinámica: {scenario.feedback.dynamicPearl}
                  </div>
                  <div className="mt-3 text-sm text-white/82">{result.summary}</div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
