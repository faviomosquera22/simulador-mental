"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MultiparameterMonitor from "@/components/advanced/MultiparameterMonitor";
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1600px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">RCP y algoritmos</h1>
              <p className="mt-1 text-sm text-slate-600">
                Entrena RCP básica, DEA, ritmos desfibrilables/no desfibrilables y valoración ABCDE por ciclos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Biblioteca: {scenarioPool.length} escenarios
              </span>
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-red-700">
                Tiempo: {mode === "evaluation" ? formatTimer(timeRemaining) : "Libre"}
              </span>
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-red-700/70">Cómo usar este módulo</div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {[
                ["Paso 1", "Lee el caso y los signos vitales"],
                ["Paso 2", "Busca el bloque 'Paso actual'"],
                ["Paso 3", "Haz clic en una sola acción"],
                ["Paso 4", "Continúa hasta ver el score final"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white/78 p-3">
                  <div className="text-sm font-semibold text-slate-900">{title}</div>
                  <div className="mt-1 text-sm text-slate-600">{body}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-7">
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
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
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
            <label className="text-xs text-slate-600">
              Contexto
              <select
                value={effectiveContext}
                onChange={(event) => setContextFilter(event.target.value as ResuscitationContext)}
                disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
              >
                <option value="general">General</option>
                <option value="prehospital">Prehospitalario</option>
                <option value="ward">Hospitalización</option>
                <option value="icu">UCI</option>
                <option value="emergency">Emergencia</option>
              </select>
            </label>
            <label className="text-xs text-slate-600">
              Buscar
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                placeholder="FV, DEA, asistolia..."
              />
            </label>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.35fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Escenario actual</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{scenario.title}</div>
              <div className="mt-1 text-sm text-slate-600">{scenario.clinicalSummary}</div>
              <div className="mt-1 text-sm text-slate-500">
                {scenario.patientProfile.name} · {scenario.patientProfile.age} años · {scenario.patientProfile.setting}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Resumen del algoritmo</div>
              <div className="mt-2">Categoría: {resuscitationCategoryLabel(scenario.category)}</div>
              <div className="mt-1">Contexto: {resuscitationContextLabel(scenario.context)}</div>
              <div className="mt-1">Dificultad: {resuscitationDifficultyLabel(scenario.difficulty)}</div>
              <div className="mt-1">Pool filtrado: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}</div>
              {selectionMode === "manual" && (
                <label className="mt-3 block text-slate-600">
                  Escenario manual
                  <select
                    value={manualScenarioId}
                    onChange={(event) => {
                      setManualScenarioId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? RCP_ALGORITHM_LIBRARY[0];
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
                Nuevo escenario
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Progreso</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Has respondido {selectedActionIds.length} de {scenario.stages.length} pasos.
                    </div>
                  </div>
                  <div className="w-40 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-cyan-300"
                      style={{ width: `${(selectedActionIds.length / scenario.stages.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr_0.9fr]">
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-red-700/70">Estado clínico</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">{currentStatus}</div>
                    <div className="mt-3 text-sm leading-7 text-slate-600">
                      {currentRhythm ? `Ritmo actual: ${currentRhythm}.` : ""}
                      {" "}Prioriza perfusión, ventilación y secuencia correcta del algoritmo antes de avanzar.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Contexto del paciente</div>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <span className="shrink-0 text-[12px] uppercase tracking-[0.12em] text-slate-400">Paciente</span>
                          <span className="min-w-0 max-w-[70%] text-right leading-6 text-slate-800 break-words">
                            {scenario.patientProfile.name} · {scenario.patientProfile.age} años
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
                      {scenario.keyFindings.map((alert) => (
                        <span key={alert} className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[11px] text-red-700">
                          {alert}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-slate-500">
                      Revisa primero pulso, perfusión, respiración y cambios eléctricos antes de ejecutar el siguiente paso.
                    </div>
                  </div>
                </div>

                {currentStage ? (
                  <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="text-xs uppercase tracking-[0.14em] text-cyan-700/75">Paso actual · responde aquí</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{currentStage.prompt}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      No debes escribir. Elige una sola acción y el simulador avanzará al siguiente ciclo.
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
                    Secuencia completada. Revisa el score final y las decisiones por ciclo.
                  </div>
                )}

                {mode === "practice" && lastFeedback && (
                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-700">
                    {lastFeedback}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Qué debes mirar</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {scenario.keyFindings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  Perla del algoritmo: {scenario.feedback.algorithmPearl}
                </div>
              </div>

              <MultiparameterMonitor
                accent="red"
                layout="visual-only"
                title="Monitor de signos"
                subtitle="Seguimiento visual del caso para contrastar ritmo, perfusión y ventilación durante el algoritmo."
                vitals={currentVitals}
                rhythmLabel={currentRhythm}
                statusLabel={currentStatus}
                timeLabel={mode === "evaluation" ? formatTimer(timeRemaining) : "Libre"}
                stageLabel={`Ciclo ${Math.min(currentStageIndex + 1, scenario.stages.length)}/${scenario.stages.length}`}
                badges={[
                  resuscitationCategoryLabel(scenario.category),
                  resuscitationDifficultyLabel(scenario.difficulty),
                  resuscitationContextLabel(scenario.context),
                ]}
                alerts={scenario.keyFindings}
                detailItems={[
                  { label: "Paciente", value: `${scenario.patientProfile.name} · ${scenario.patientProfile.age} años` },
                  { label: "Entorno", value: scenario.patientProfile.setting ?? "No especificado" },
                  { label: "PA actual", value: formatAdvancedPressure(currentVitals.sbp, currentVitals.dbp) },
                ]}
                footerNote="En ritmos sin pulso el monitor cae a trazados y lecturas críticas para reforzar el algoritmo correcto."
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
