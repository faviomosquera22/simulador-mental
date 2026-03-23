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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1640px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Simulador dinámico</h1>
              <p className="mt-1 text-sm text-slate-600">
                Integra signos vitales, ECG, laboratorio, gasometría e intervenciones en una evolución clínica inmersiva.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Biblioteca: {scenarioPool.length} casos
              </span>
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-red-700">
                Tiempo: {progressionMode === "realtime" ? formatTimer(timeRemaining) : "Por turnos"}
              </span>
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-emerald-700/70">Cómo usar este módulo</div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {[
                ["Paso 1", "Lee el estado del paciente"],
                ["Paso 2", "Busca la fase actual"],
                ["Paso 3", "Haz clic en una sola acción"],
                ["Paso 4", "Mira cómo cambia la evolución"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white/78 p-3">
                  <div className="text-sm font-semibold text-slate-900">{title}</div>
                  <div className="mt-1 text-sm text-slate-600">{body}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-9">
            <label className="text-xs text-slate-600">
              Modo
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as AdvancedMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="practice">Práctica guiada</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Uso
              <select
                value={usageMode}
                onChange={(event) => setUsageMode(event.target.value as UsageMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="standalone">Módulo independiente</option>
                <option value="integrated_case">Integrado al caso</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Selección
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="contextual_random">Aleatorio contextual</option>
                <option value="random">Aleatorio</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Dificultad
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="all">Todas</option>
                <option value="basic">Básico</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Área clínica
              <select
                value={effectiveCategory}
                onChange={(event) => setCategoryFilter(event.target.value as DynamicSimulationCategory | "all")}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
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
            <label className="text-xs text-slate-600">
              Contexto
              <select
                value={effectiveContext}
                onChange={(event) => setContextFilter(event.target.value as DynamicSimulationContext)}
                disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
              >
                <option value="general">General</option>
                <option value="emergency">Emergencia</option>
                <option value="icu">UCI</option>
                <option value="ward">Hospitalización</option>
                <option value="prehospital">Prehospitalario</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Progresión
              <select
                value={progressionMode}
                onChange={(event) => setProgressionMode(event.target.value as ProgressionMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="turns">Por turnos</option>
                <option value="realtime">Tiempo real</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Velocidad
              <select
                value={progressionSpeed}
                onChange={(event) => setProgressionSpeed(event.target.value as ProgressionSpeed)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="slow">Lenta</option>
                <option value="normal">Normal</option>
                <option value="fast">Rápida</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Buscar
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                placeholder="shock, DKA, trauma..."
              />
            </label>
          </section>

          <section className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.3fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Caso dinámico actual</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{scenario.title}</div>
              <div className="mt-1 text-sm text-slate-600">{scenario.clinicalSummary}</div>
              <div className="mt-1 text-sm text-slate-500">
                {scenario.patientProfile.name} · {scenario.patientProfile.age} años · {scenario.patientProfile.setting}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                  {dynamicSimulationCategoryLabel(scenario.category)}
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-700">
                  {dynamicSimulationDifficultyLabel(scenario.difficulty)}
                </span>
                <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-orange-100">
                  {dynamicSimulationContextLabel(scenario.context)}
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-700">
                  {scenario.progressionLabel}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Configuración del caso</div>
              <div className="mt-2">Pool filtrado: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}</div>
              <div className="mt-1">Feedback: {mode === "practice" ? feedbackStyle : "Final"}</div>
              <div className="mt-1">Estudios revelados: {revealedStudies.length}/{scenario.availableStudies.length}</div>
              {selectionMode === "manual" && (
                <label className="mt-3 block text-slate-600">
                  Caso manual
                  <select
                    value={manualScenarioId}
                    onChange={(event) => {
                      setManualScenarioId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? DYNAMIC_SIMULATION_LIBRARY[0];
                      setScenario(next);
                      resetRun(next);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
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
                <label className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  Feedback
                  <select
                    value={feedbackStyle}
                    onChange={(event) => setFeedbackStyle(event.target.value as FeedbackStyle)}
                    className="mt-1 block w-full bg-transparent text-sm text-slate-900 outline-none"
                  >
                    <option value="immediate">Inmediato</option>
                    <option value="final">Solo final</option>
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={loadNewScenario}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
              >
                Nuevo caso
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Progreso del caso</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Has resuelto {selectedActionIds.length} de {scenario.stages.length} fases.
                    </div>
                  </div>
                  <div className="w-40 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-emerald-300"
                      style={{ width: `${(selectedActionIds.length / scenario.stages.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: "FC", value: `${currentVitals.hr} lpm` },
                    { label: "PA", value: formatAdvancedPressure(currentVitals.sbp, currentVitals.dbp) },
                    { label: "SpO₂", value: `${currentVitals.spo2}%` },
                    { label: "FR", value: `${currentVitals.rr} rpm` },
                    { label: "Temp", value: `${currentVitals.temp.toFixed(1)}°C` },
                    { label: "Fase", value: `${Math.min(currentStageIndex + 1, scenario.stages.length)}/${scenario.stages.length}` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-900/42">{item.label}</div>
                      <div className="mt-2 text-base font-semibold text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-700/72">Estado dinámico</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">{currentStatus}</div>
                    <div className="mt-3 text-sm text-slate-600">{scenario.expectedOutcome}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Monitor actual</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{currentRhythm}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scenario.alerts.map((alert) => (
                        <span key={alert} className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[11px] text-red-700">
                          {alert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {currentStage ? (
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-emerald-700/75">Fase actual · responde aquí</div>
                        <div className="mt-2 text-lg font-semibold text-slate-900">{currentStage.prompt}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          No debes escribir. Elige una sola acción y luego el paciente cambiará de estado.
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600">
                        {progressionMode === "realtime" ? formatTimer(timeRemaining) : "Paso guiado"}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {currentStage.actions.map((action, index) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => chooseAction(action.id)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <div className="font-medium text-slate-900">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-xs text-slate-600">
                              {index + 1}
                            </span>
                            {action.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Todas las fases fueron resueltas. Revisa el score global, la cronología y los estudios revelados.
                  </div>
                )}

                {mode === "practice" && feedbackStyle === "immediate" && lastFeedback && !result && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-700">
                    {lastFeedback}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Bitácora de evolución</div>
                    <div className="mt-1 text-sm text-slate-500">El caso registra cambios según tus decisiones.</div>
                  </div>
                  <div className="text-xs text-slate-400">{eventLog.length} eventos</div>
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
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-700">{item.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Hallazgos clave</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {scenario.keyFindings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  Criterios de éxito: {scenario.successCriteria.join(" · ")}
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  Riesgos de fallo: {scenario.failureCriteria.join(" · ")}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Estudios integrados</div>
                    <div className="mt-1 text-sm text-slate-500">ECG, laboratorio y gasometría se liberan según tu secuencia clínica.</div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600">
                    {revealedStudies.length}/{scenario.availableStudies.length}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {revealedStudies.length ? (
                    revealedStudies.map((study) => (
                      <div key={study.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{study.title}</div>
                            <div className="text-xs text-slate-400">{study.summary}</div>
                          </div>
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-700">
                            {dynamicStudyModuleLabel(study.module)}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                          {study.rows.map((row) => (
                            <div key={`${study.id}-${row.label}`} className="flex items-center justify-between gap-3">
                              <span className="text-slate-400">{row.label}</span>
                              <span className="text-right text-slate-800">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
                      Aún no has solicitado ni desbloqueado estudios. La secuencia de tus acciones define qué información aparece.
                    </div>
                  )}
                </div>
              </div>

              {result && (
                <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Resultado final</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">
                        {result.totalScore}/{result.maxScore}
                      </div>
                    </div>
                    <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-700">
                      {result.outcome}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {result.stageFeedback.map((item) => (
                      <div key={`${item.stageTitle}-${item.actionLabel}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-400">{item.stageTitle}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{item.actionLabel}</div>
                        <div className="mt-1 text-sm text-slate-600">{item.feedback}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-sm text-emerald-700">
                    {scenario.feedback.explanation}
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Conducta esperada: {scenario.feedback.expectedConduct}
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    Perla dinámica: {scenario.feedback.dynamicPearl}
                  </div>
                  <div className="mt-3 text-sm text-slate-700">{result.summary}</div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
