"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  RCP_ALGORITHM_LIBRARY,
  applyResuscitationVitals,
  evaluateResuscitationScenario,
  inferResuscitationContext,
  resuscitationCategoryLabel,
  resuscitationContextLabel,
  resuscitationDifficultyLabel,
  type ResuscitationCategory,
  type ResuscitationContext,
  type ResuscitationScenario,
} from "@/src/lib/resuscitationAlgorithms";
import { formatAdvancedPressure, normalizeText, type AdvancedDifficulty, type AdvancedMode } from "@/src/lib/advancedModuleUtils";

type SelectionMode = "manual" | "random" | "contextual_random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = AdvancedDifficulty | "all";
type CategoryFilter = ResuscitationCategory | "all";

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

export default function RcpAlgorithmsPage() {
  const [mode, setMode] = useState<AdvancedMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("standalone");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [contextFilter, setContextFilter] = useState<ResuscitationContext>("general");
  const [search, setSearch] = useState("");
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [scenarioPool] = useState(RCP_ALGORITHM_LIBRARY);
  const [scenario, setScenario] = useState<ResuscitationScenario>(RCP_ALGORITHM_LIBRARY[0]);
  const [manualScenarioId, setManualScenarioId] = useState(RCP_ALGORITHM_LIBRARY[0]?.id ?? "");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentVitals, setCurrentVitals] = useState(RCP_ALGORITHM_LIBRARY[0].initialVitals);
  const [currentRhythm, setCurrentRhythm] = useState(RCP_ALGORITHM_LIBRARY[0].initialRhythm);
  const [currentStatus, setCurrentStatus] = useState(RCP_ALGORITHM_LIBRARY[0].initialStatus);
  const [lastFeedback, setLastFeedback] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(RCP_ALGORITHM_LIBRARY[0].timeLimitSec);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  const effectiveContext = useMemo(() => {
    if (usageMode === "integrated_case" && activeCaseObj) {
      return inferResuscitationContext(activeCaseObj);
    }
    return contextFilter;
  }, [activeCaseObj, contextFilter, usageMode]);

  const filteredPool = useMemo(() => {
    return scenarioPool.filter((item) => {
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (search.trim()) {
        const haystack = normalizeText(
          [item.title, item.subcategory, item.clinicalSummary, item.tags.join(" ")].join(" ")
        );
        if (!haystack.includes(normalizeText(search))) return false;
      }
      return true;
    });
  }, [categoryFilter, difficultyFilter, scenarioPool, search]);

  const contextualPool = useMemo(() => {
    const contextual = filteredPool.filter((item) => item.context === effectiveContext);
    return contextual.length ? contextual : filteredPool;
  }, [effectiveContext, filteredPool]);

  const resetRun = useCallback((nextScenario?: ResuscitationScenario) => {
    const activeScenario = nextScenario ?? scenario;
    setSelectedActionIds([]);
    setCurrentStageIndex(0);
    setCurrentVitals(activeScenario.initialVitals);
    setCurrentRhythm(activeScenario.initialRhythm);
    setCurrentStatus(activeScenario.initialStatus);
    setLastFeedback("");
    setTimedOut(false);
    setTimeRemaining(activeScenario.timeLimitSec);
  }, [scenario]);

  const pickNextScenario = useCallback(
    (excludeId?: string) => {
      const sourcePool = selectionMode === "contextual_random" ? contextualPool : filteredPool;
      const available = sourcePool.filter((item) => item.id !== excludeId);

      if (selectionMode === "manual") {
        return filteredPool.find((item) => item.id === manualScenarioId) ?? filteredPool[0] ?? RCP_ALGORITHM_LIBRARY[0];
      }

      return (
        available[Math.floor(Math.random() * Math.max(available.length, 1))] ??
        available[0] ??
        filteredPool[0] ??
        RCP_ALGORITHM_LIBRARY[0]
      );
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
    if (mode !== "evaluation") return;
    if (timedOut) return;
    if (selectedActionIds.length >= scenario.stages.length) return;

    const id = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [mode, scenario.stages.length, selectedActionIds.length, timedOut]);

  const currentStage = scenario.stages[currentStageIndex] ?? null;
  const result = useMemo(() => {
    if (!timedOut && selectedActionIds.length < scenario.stages.length) return null;
    return evaluateResuscitationScenario({
      scenario,
      selectedActionIds,
      timedOut,
    });
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
    setCurrentVitals((prev) => applyResuscitationVitals(prev, action.vitalDelta));
    if (action.resultingRhythm) setCurrentRhythm(action.resultingRhythm);
    if (action.resultingStatus) setCurrentStatus(action.resultingStatus);
    setLastFeedback(action.feedback);
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1600px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">RCP y algoritmos</h1>
              <p className="mt-1 text-sm text-white/70">
                Entrena RCP básica, DEA, ritmos desfibrilables/no desfibrilables y valoración ABCDE por ciclos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Biblioteca: {scenarioPool.length} escenarios
              </span>
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-red-100">
                Tiempo: {mode === "evaluation" ? formatTimer(timeRemaining) : "Libre"}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0B111D]/85 p-4 md:grid-cols-2 xl:grid-cols-7">
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
              Categoría
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas</option>
                <option value="bls">RCP básica</option>
                <option value="aed">DEA</option>
                <option value="vf">FV</option>
                <option value="pulseless_vt">TV sin pulso</option>
                <option value="asystole">Asistolia</option>
                <option value="pea">AESP</option>
                <option value="abcde">ABCDE</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Contexto
              <select
                value={effectiveContext}
                onChange={(event) => setContextFilter(event.target.value as ResuscitationContext)}
                disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                <option value="general">General</option>
                <option value="prehospital">Prehospitalario</option>
                <option value="ward">Hospitalización</option>
                <option value="icu">UCI</option>
                <option value="emergency">Emergencia</option>
              </select>
            </label>
            <label className="text-xs text-white/70">
              Buscar
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="FV, DEA, asistolia..."
              />
            </label>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 xl:grid-cols-[1.35fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Escenario actual</div>
              <div className="mt-1 text-base font-semibold text-white">{scenario.title}</div>
              <div className="mt-1 text-sm text-white/70">{scenario.clinicalSummary}</div>
              <div className="mt-1 text-sm text-white/65">
                {scenario.patientProfile.name} · {scenario.patientProfile.age} años · {scenario.patientProfile.setting}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              <div className="font-semibold text-white/85">Resumen del algoritmo</div>
              <div className="mt-2">Categoría: {resuscitationCategoryLabel(scenario.category)}</div>
              <div className="mt-1">Contexto: {resuscitationContextLabel(scenario.context)}</div>
              <div className="mt-1">Dificultad: {resuscitationDifficultyLabel(scenario.difficulty)}</div>
              <div className="mt-1">Pool filtrado: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}</div>
              {selectionMode === "manual" && (
                <label className="mt-3 block text-white/70">
                  Escenario manual
                  <select
                    value={manualScenarioId}
                    onChange={(event) => {
                      setManualScenarioId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? RCP_ALGORITHM_LIBRARY[0];
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
              <button
                type="button"
                onClick={loadNewScenario}
                className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nuevo escenario
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-4">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: "FC", value: currentVitals.hr <= 0 ? "Sin pulso" : `${currentVitals.hr} lpm` },
                    { label: "PA", value: formatAdvancedPressure(currentVitals.sbp, currentVitals.dbp) },
                    { label: "SpO₂", value: currentVitals.spo2 <= 0 ? "No lectura" : `${currentVitals.spo2}%` },
                    { label: "FR", value: currentVitals.rr <= 0 ? "Apnea" : `${currentVitals.rr} rpm` },
                    { label: "Temp", value: `${currentVitals.temp.toFixed(1)}°C` },
                    { label: "Ciclo", value: `${Math.min(currentStageIndex + 1, scenario.stages.length)}/${scenario.stages.length}` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/42">{item.label}</div>
                      <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-red-100/70">Ritmo actual</div>
                    <div className="mt-2 text-xl font-semibold text-white">{currentRhythm}</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Estado</div>
                    <div className="mt-2 text-xl font-semibold text-white">{currentStatus}</div>
                  </div>
                </div>

                {currentStage ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-white/45">{currentStage.title}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{currentStage.prompt}</div>
                    <div className="mt-4 space-y-2">
                      {currentStage.actions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => chooseAction(action.id)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/82 transition hover:bg-white/10"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                    Secuencia completada. Revisa el score final y las decisiones por ciclo.
                  </div>
                )}

                {mode === "practice" && lastFeedback && (
                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                    {lastFeedback}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-white/45">Pistas del escenario</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/72">
                  {scenario.keyFindings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/65">
                  Perla del algoritmo: {scenario.feedback.algorithmPearl}
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
