"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MultiparameterMonitor from "@/components/advanced/MultiparameterMonitor";
import {
  MATERNO_INFANT_LIBRARY,
  applyMaternoInfantVitals,
  evaluateMaternoInfantScenario,
  inferMaternoInfantContext,
  inferMaternoInfantPopulation,
  maternoInfantCategoryLabel,
  maternoInfantContextLabel,
  maternoInfantDifficultyLabel,
  maternoInfantPopulationLabel,
  type MaternoInfantCategory,
  type MaternoInfantContext,
  type MaternoInfantPopulation,
  type MaternoInfantScenario,
} from "@/src/lib/maternoInfantModule";
import { formatAdvancedPressure, normalizeText, type AdvancedDifficulty, type AdvancedMode } from "@/src/lib/advancedModuleUtils";

type SelectionMode = "manual" | "random" | "contextual_random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = AdvancedDifficulty | "all";

type LogItem = {
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

export default function MaternoInfantilPage() {
  const [mode, setMode] = useState<AdvancedMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("standalone");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<MaternoInfantCategory | "all">("all");
  const [populationFilter, setPopulationFilter] = useState<MaternoInfantPopulation | "all">("all");
  const [contextFilter, setContextFilter] = useState<MaternoInfantContext>("general");
  const [search, setSearch] = useState("");
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [scenarioPool] = useState(MATERNO_INFANT_LIBRARY);
  const [scenario, setScenario] = useState<MaternoInfantScenario>(MATERNO_INFANT_LIBRARY[0]);
  const [manualScenarioId, setManualScenarioId] = useState(MATERNO_INFANT_LIBRARY[0]?.id ?? "");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentVitals, setCurrentVitals] = useState(MATERNO_INFANT_LIBRARY[0].initialVitals);
  const [currentStatus, setCurrentStatus] = useState(MATERNO_INFANT_LIBRARY[0].initialStatus);
  const [timeRemaining, setTimeRemaining] = useState(MATERNO_INFANT_LIBRARY[0].timeLimitSec);
  const [timedOut, setTimedOut] = useState(false);
  const [decisionLog, setDecisionLog] = useState<LogItem[]>([]);
  const [lastFeedback, setLastFeedback] = useState("");

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  const effectivePopulation = useMemo(() => {
    if (usageMode === "integrated_case" && activeCaseObj && populationFilter === "all") {
      return inferMaternoInfantPopulation(activeCaseObj);
    }
    return populationFilter;
  }, [activeCaseObj, populationFilter, usageMode]);

  const effectiveContext = useMemo(() => {
    if (usageMode === "integrated_case" && activeCaseObj) {
      return inferMaternoInfantContext(inferMaternoInfantPopulation(activeCaseObj));
    }
    return contextFilter;
  }, [activeCaseObj, contextFilter, usageMode]);

  const filteredPool = useMemo(() => {
    return scenarioPool.filter((item) => {
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (effectivePopulation !== "all" && item.population !== effectivePopulation) return false;
      if (search.trim()) {
        const haystack = normalizeText(
          [item.title, item.subcategory, item.clinicalSummary, item.tags.join(" ")].join(" ")
        );
        if (!haystack.includes(normalizeText(search))) return false;
      }
      return true;
    });
  }, [categoryFilter, difficultyFilter, effectivePopulation, scenarioPool, search]);

  const contextualPool = useMemo(() => {
    const contextual = filteredPool.filter((item) => item.context === effectiveContext);
    return contextual.length ? contextual : filteredPool;
  }, [effectiveContext, filteredPool]);

  const resetRun = useCallback(
    (nextScenario?: MaternoInfantScenario) => {
      const activeScenario = nextScenario ?? scenario;
      setSelectedActionIds([]);
      setCurrentStageIndex(0);
      setCurrentVitals(activeScenario.initialVitals);
      setCurrentStatus(activeScenario.initialStatus);
      setTimeRemaining(activeScenario.timeLimitSec);
      setTimedOut(false);
      setLastFeedback("");
      setDecisionLog([
        {
          id: `${activeScenario.id}-start`,
          title: "Inicio del escenario",
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
        return filteredPool.find((item) => item.id === manualScenarioId) ?? filteredPool[0] ?? MATERNO_INFANT_LIBRARY[0];
      }

      return available[Math.floor(Math.random() * Math.max(available.length, 1))] ?? available[0] ?? filteredPool[0] ?? MATERNO_INFANT_LIBRARY[0];
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
    return evaluateMaternoInfantScenario({ scenario, selectedActionIds, timedOut });
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
    setCurrentVitals((prev) => applyMaternoInfantVitals(prev, action.vitalDelta));
    if (action.resultingStatus) setCurrentStatus(action.resultingStatus);
    setLastFeedback(action.feedback);
    setDecisionLog((prev) => [
      {
        id: `${currentStage.id}-${action.id}-${prev.length}`,
        title: currentStage.title,
        body: `${action.label}. ${action.feedback}`,
        tone: action.score >= 20 ? "success" : action.score > 0 ? "info" : "warning",
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
              <h1 className="text-2xl font-semibold">Materno-infantil</h1>
              <p className="mt-1 text-sm text-slate-600">
                Entrena escenarios obstétricos, neonatales y pediátricos con decisiones adaptadas a cada población.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-fuchsia-100">
                Biblioteca: {scenarioPool.length} casos
              </span>
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-red-700">
                Tiempo: {mode === "evaluation" ? formatTimer(timeRemaining) : "Libre"}
              </span>
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-fuchsia-100/70">Cómo usar este módulo</div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {[
                ["Paso 1", "Lee la población y el contexto"],
                ["Paso 2", "Revisa signos y alertas"],
                ["Paso 3", "Responde en la fase actual"],
                ["Paso 4", "Continúa hasta el resultado final"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white/78 p-3">
                  <div className="text-sm font-semibold text-slate-900">{title}</div>
                  <div className="mt-1 text-sm text-slate-600">{body}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-8">
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
              Categoría
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as MaternoInfantCategory | "all")}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="all">Todas</option>
                <option value="prenatal_alerts">Prenatal y alarmas</option>
                <option value="labor_puerperium">Parto y puerperio</option>
                <option value="neonatal_resuscitation">Reanimación neonatal</option>
                <option value="growth_development">Crecimiento y desarrollo</option>
                <option value="pediatric_emergency">Urgencias pediátricas</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Población
              <select
                value={effectivePopulation}
                onChange={(event) => setPopulationFilter(event.target.value as MaternoInfantPopulation | "all")}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="all">Todas</option>
                <option value="obstetric">Obstétrico</option>
                <option value="neonatal">Neonatal</option>
                <option value="pediatric">Pediátrico</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Contexto
              <select
                value={effectiveContext}
                onChange={(event) => setContextFilter(event.target.value as MaternoInfantContext)}
                disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
              >
                <option value="general">General</option>
                <option value="prenatal_clinic">Control prenatal</option>
                <option value="delivery_room">Sala de partos</option>
                <option value="puerperium_ward">Sala de puerperio</option>
                <option value="neonatal_unit">Unidad neonatal</option>
                <option value="pediatric_emergency">Urgencias pediátricas</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Buscar
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                placeholder="puerperio, neonatal, deshidratación..."
              />
            </label>
          </section>

          <section className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.35fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Escenario actual</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{scenario.title}</div>
              <div className="mt-1 text-sm text-slate-600">{scenario.clinicalSummary}</div>
              <div className="mt-1 text-sm text-slate-500">
                {scenario.patientProfile.name} · {scenario.patientProfile.ageLabel ?? `${scenario.patientProfile.age} años`} · {scenario.patientProfile.setting}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                  {maternoInfantCategoryLabel(scenario.category)}
                </span>
                <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-1 text-fuchsia-100">
                  {maternoInfantPopulationLabel(scenario.population)}
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-700">
                  {maternoInfantDifficultyLabel(scenario.difficulty)}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-600">
                  {maternoInfantContextLabel(scenario.context)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Ficha específica</div>
              <div className="mt-2">Pool filtrado: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}</div>
              <div className="mt-1">Estado actual: {currentStatus}</div>
              <div className="mt-1">Peso: {scenario.patientProfile.weightKg ? `${scenario.patientProfile.weightKg} kg` : "No aplica"}</div>
              <div className="mt-1">EG: {scenario.patientProfile.gestationalAgeWeeks ? `${scenario.patientProfile.gestationalAgeWeeks} semanas` : "No aplica"}</div>
              {selectionMode === "manual" && (
                <label className="mt-3 block text-slate-600">
                  Caso manual
                  <select
                    value={manualScenarioId}
                    onChange={(event) => {
                      setManualScenarioId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? MATERNO_INFANT_LIBRARY[0];
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
              <button
                type="button"
                onClick={loadNewScenario}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
              >
                Nuevo caso
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.22fr_0.78fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Progreso</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Has respondido {selectedActionIds.length} de {scenario.stages.length} etapas.
                    </div>
                  </div>
                  <div className="w-40 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-fuchsia-300"
                      style={{ width: `${(selectedActionIds.length / scenario.stages.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr_0.9fr]">
                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-fuchsia-100/70">Estado clínico</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">{currentStatus}</div>
                    <div className="mt-3 text-sm leading-7 text-slate-600">{scenario.expectedOutcome}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Contexto del paciente</div>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <span className="shrink-0 text-[12px] uppercase tracking-[0.12em] text-slate-400">Paciente</span>
                          <span className="min-w-0 max-w-[70%] text-right leading-6 text-slate-800 break-words">
                            {scenario.patientProfile.name} · {scenario.patientProfile.ageLabel ?? `${scenario.patientProfile.age} años`}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <span className="shrink-0 text-[12px] uppercase tracking-[0.12em] text-slate-400">Entorno</span>
                          <span className="min-w-0 max-w-[70%] text-right leading-6 text-slate-800 break-words">
                            {scenario.patientProfile.setting ?? "No especificado"}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <span className="shrink-0 text-[12px] uppercase tracking-[0.12em] text-slate-400">PA actual</span>
                          <span className="min-w-0 max-w-[70%] text-right leading-6 text-slate-800 break-words">
                            {formatAdvancedPressure(currentVitals.sbp, currentVitals.dbp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Alertas prioritarias</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scenario.alerts.map((alert) => (
                        <span key={alert} className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[11px] text-red-700">
                          {alert}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-500">
                      Revisa primero perfusión, oxigenación, ventilación y signos de alarma del desarrollo antes de intervenir.
                    </div>
                  </div>
                </div>

                {currentStage ? (
                  <div className="mt-4 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-fuchsia-100/75">Etapa actual · responde aquí</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{currentStage.prompt}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      No debes escribir. Elige una sola conducta y el escenario avanzará a la siguiente etapa.
                    </div>
                    <div className="mt-4 space-y-2">
                      {currentStage.actions.map((action, index) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => chooseAction(action.id)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-xs text-slate-600">
                            {index + 1}
                          </span>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Escenario completado. Revisa el desempeño final y los puntos específicos de esta población.
                  </div>
                )}

                {mode === "practice" && lastFeedback && !result && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-700">
                    {lastFeedback}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Cronología clínica</div>
                    <div className="mt-1 text-sm text-slate-500">Cada decisión se registra para análisis posterior.</div>
                  </div>
                  <div className="text-xs text-slate-400">{decisionLog.length} eventos</div>
                </div>
                <div className="mt-4 space-y-3">
                  {decisionLog.map((item) => (
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
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Hallazgos de referencia</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {scenario.keyFindings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Conducta esperada: {scenario.feedback.expectedConduct}
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Perla poblacional: {scenario.feedback.populationPearl}
                </div>
              </div>

              <MultiparameterMonitor
                accent="fuchsia"
                layout="visual-only"
                title="Monitor de signos"
                subtitle="Seguimiento visual del caso para reevaluar tendencia hemodinámica y respiratoria."
                vitals={currentVitals}
                baselineVitals={scenario.initialVitals}
                statusLabel={currentStatus}
                timeLabel={mode === "evaluation" ? formatTimer(timeRemaining) : "Libre"}
                stageLabel={`Etapa ${Math.min(currentStageIndex + 1, scenario.stages.length)}/${scenario.stages.length}`}
                badges={[
                  maternoInfantPopulationLabel(scenario.population),
                  maternoInfantDifficultyLabel(scenario.difficulty),
                  maternoInfantContextLabel(scenario.context),
                ]}
                alerts={scenario.alerts}
                detailItems={[
                  { label: "Paciente", value: `${scenario.patientProfile.name} · ${scenario.patientProfile.ageLabel ?? `${scenario.patientProfile.age} años`}` },
                  { label: "Entorno", value: scenario.patientProfile.setting ?? "No especificado" },
                  { label: "PA actual", value: formatAdvancedPressure(currentVitals.sbp, currentVitals.dbp) },
                ]}
                footerNote="Las variaciones del monitor son visuales y ayudan a percibir tendencia clínica sin alterar el avance del escenario."
              />

              {result && (
                <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Resultado final</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">
                        {result.totalScore}/{result.maxScore}
                      </div>
                    </div>
                    <div className="rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-xs text-fuchsia-100">
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
