"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MultiparameterMonitor from "@/components/advanced/MultiparameterMonitor";
import {
  EMERGENCY_SCENARIOS,
  applyEmergencyVitals,
  emergencyDifficultyLabel,
  emergencyTypeLabel,
  evaluateEmergencyScenario,
  type EmergencyAction,
  type EmergencyDifficulty,
  type EmergencyMode,
  type EmergencyScenario,
} from "@/src/lib/emergencySimulator";

type SelectionMode = "manual" | "random";
type DifficultyFilter = EmergencyDifficulty | "all";

function sampleFromPool<T>(pool: T[]) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function pickByDifficulty(pool: EmergencyScenario[], difficulty: DifficultyFilter) {
  if (difficulty === "all") return pool;
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  return filtered.length ? filtered : pool;
}

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function EmergencySimulatorPage() {
  const [mode, setMode] = useState<EmergencyMode>("practice");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [scenarioPool] = useState(EMERGENCY_SCENARIOS);
  const [scenario, setScenario] = useState<EmergencyScenario>(EMERGENCY_SCENARIOS[0]);
  const [manualScenarioId, setManualScenarioId] = useState(EMERGENCY_SCENARIOS[0]?.id ?? "");
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [revealedStudyIds, setRevealedStudyIds] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentVitals, setCurrentVitals] = useState(EMERGENCY_SCENARIOS[0].initialVitals);
  const [lastAction, setLastAction] = useState<EmergencyAction | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(EMERGENCY_SCENARIOS[0].timeLimitSec);
  const [timedOut, setTimedOut] = useState(false);

  const pickNextScenario = useMemo(() => {
    return (excludeId?: string) => {
      const basePool = pickByDifficulty(scenarioPool, difficultyFilter).filter((item) => item.id !== excludeId);
      if (!basePool.length) return scenarioPool[0] ?? EMERGENCY_SCENARIOS[0];

      if (selectionMode === "manual") {
        return scenarioPool.find((item) => item.id === manualScenarioId) ?? scenarioPool[0] ?? EMERGENCY_SCENARIOS[0];
      }

      return sampleFromPool(basePool) ?? basePool[0];
    };
  }, [difficultyFilter, manualScenarioId, scenarioPool, selectionMode]);

  const resetRun = useCallback((nextScenario?: EmergencyScenario) => {
    const activeScenario = nextScenario ?? scenario;
    setSelectedActionIds([]);
    setRevealedStudyIds([]);
    setCurrentStageIndex(0);
    setCurrentVitals(activeScenario.initialVitals);
    setLastAction(null);
    setTimedOut(false);
    setTimeRemaining(activeScenario.timeLimitSec);
  }, [scenario]);

  useEffect(() => {
    const next = pickNextScenario();
    if (!next) return;
    setScenario(next);
    if (selectionMode === "manual") {
      setManualScenarioId(next.id);
    }
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

  const revealedStudies = useMemo(
    () => scenario.studies.filter((item) => revealedStudyIds.includes(item.id)),
    [revealedStudyIds, scenario.studies]
  );

  const result = useMemo(() => {
    if (!timedOut && selectedActionIds.length < scenario.stages.length) return null;
    return evaluateEmergencyScenario({
      scenario,
      selectedActionIds,
      timedOut,
    });
  }, [scenario, selectedActionIds, timedOut]);

  const currentStage = scenario.stages[currentStageIndex] ?? null;

  function loadNewScenario() {
    const next = pickNextScenario(scenario.id);
    if (!next) return;
    setScenario(next);
    if (selectionMode === "manual") {
      setManualScenarioId(next.id);
    }
    resetRun(next);
  }

  function chooseAction(action: EmergencyAction) {
    if (!currentStage || result) return;

    setSelectedActionIds((prev) => [...prev, action.id]);
    setLastAction(action);
    setCurrentVitals((prev) => applyEmergencyVitals(prev, action.vitalDelta));
    const revealedIds = action.revealsStudyIds ?? [];
    if (revealedIds.length) {
      setRevealedStudyIds((prev) => Array.from(new Set([...prev, ...revealedIds])));
    }
    setCurrentStageIndex((prev) => prev + 1);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1600px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Simulador de urgencias</h1>
              <p className="mt-1 text-sm text-slate-600">
                Resuelve escenarios breves, prioriza acciones y observa evolución clínica por etapas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Tiempo: {mode === "evaluation" ? formatTimer(timeRemaining) : "Sin cronómetro"}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-xs text-slate-600">
              Modo
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as EmergencyMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="practice">Práctica guiada</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Selección
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
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

            <label className="text-xs text-slate-600 xl:col-span-2">
              Escenario de urgencia
              <select
                value={manualScenarioId}
                onChange={(event) => {
                  setManualScenarioId(event.target.value);
                  setSelectionMode("manual");
                  const next = scenarioPool.find((item) => item.id === event.target.value) ?? null;
                  if (!next) return;
                  setScenario(next);
                  resetRun(next);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                {scenarioPool.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Escenario actual</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{scenario.name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {scenario.patient.age} años ·{" "}
                      {scenario.patient.sex === "female" ? "Femenino" : scenario.patient.sex === "male" ? "Masculino" : "No especificado"}
                    </div>
                    <div className="text-sm text-slate-500">{scenario.context}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                      {emergencyTypeLabel(scenario.type)}
                    </span>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-700">
                      {emergencyDifficultyLabel(scenario.difficulty)}
                    </span>
                    <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-red-700">
                      Prioridad: {scenario.priorityLabel}
                    </span>
                  </div>
                </div>

              </div>

              <div className="mt-4">
                <MultiparameterMonitor
                  accent="cyan"
                  title="Monitor multiparámetro"
                  subtitle="Monitor continuo con ECG, curvas y contexto clínico para seguimiento del caso."
                  vitals={currentVitals}
                  baselineVitals={scenario.initialVitals}
                  statusLabel={lastAction ? "Reevaluación tras intervención" : "Valoración inicial"}
                  timeLabel={mode === "evaluation" ? formatTimer(timeRemaining) : "Libre"}
                  stageLabel={`Paso ${Math.min(currentStageIndex + 1, scenario.stages.length)}/${scenario.stages.length}`}
                  badges={[emergencyTypeLabel(scenario.type), emergencyDifficultyLabel(scenario.difficulty)]}
                  alerts={[scenario.priorityLabel]}
                  detailItems={[
                    {
                      label: "Paciente",
                      value: `${scenario.patient.age} años · ${scenario.patient.sex === "female" ? "Femenino" : scenario.patient.sex === "male" ? "Masculino" : "No especificado"}`,
                    },
                    { label: "Motivo de consulta", value: scenario.patient.chiefComplaint },
                    { label: "Contexto clínico", value: scenario.context },
                  ]}
                  footerNote="Los signos principales permanecen visibles arriba en el escenario actual; este monitor complementa el seguimiento continuo."
                />
              </div>

              {revealedStudies.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h2 className="text-lg font-semibold">Estudios solicitados</h2>
                  <div className="mt-3 grid gap-3 xl:grid-cols-2">
                    {revealedStudies.map((study) => (
                      <div key={study.id} className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{study.title}</div>
                          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                            {study.module === "ecg" ? "ECG" : study.module === "laboratory" ? "Laboratorio" : "Gasometría"}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{study.summary}</div>
                        <div className="mt-3 space-y-2">
                          {study.rows.map((row) => (
                            <div key={`${study.id}-${row.label}`} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-slate-500">{row.label}</span>
                              <span className="text-slate-900/90">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Decisión por etapas</h2>
                  <button
                    type="button"
                    onClick={loadNewScenario}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
                  >
                    Nuevo escenario
                  </button>
                </div>

                {!currentStage || result ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    Escenario finalizado. Revisa el resumen final y vuelve a intentarlo si quieres otra secuencia.
                  </div>
                ) : (
                  <>
                    <div className="mt-3 text-xs uppercase tracking-wide text-slate-400">{currentStage.title}</div>
                    <div className="mt-1 text-base text-slate-900/90">{currentStage.prompt}</div>

                    <div className="mt-4 grid gap-2">
                      {currentStage.actions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => chooseAction(action)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 hover:border-cyan-400/30 hover:bg-cyan-400/10"
                        >
                          <div className="font-medium">{action.label}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            Tipo: {action.type} · Impacto: {action.score} pts
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-4">
                {mode === "practice" && lastAction && !result && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <h3 className="text-sm font-semibold text-cyan-700">Feedback inmediato</h3>
                    <div className="mt-2 text-sm text-cyan-700/90">{lastAction.explanation}</div>
                  </div>
                )}

                {result ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">Resultado final</div>
                      <div className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-700">
                        {result.totalScore}/{result.maxScore}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      {result.stageFeedback.map((item) => (
                        <div key={`${item.stageTitle}-${item.actionLabel}`} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2">
                          <div className="font-medium text-slate-900/90">{item.stageTitle}</div>
                          <div className="mt-1 text-slate-600">{item.actionLabel}</div>
                          <div className="mt-1 text-xs text-slate-400">{item.explanation}</div>
                        </div>
                      ))}
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-slate-800">
                        {result.summary}
                      </div>
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-700">
                        {scenario.finalTeaching}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Estado del caso</h3>
                    <div className="mt-2 text-sm text-slate-600">
                      {mode === "practice"
                        ? "Puedes ver estudios solicitados y recibir feedback por paso."
                        : "El escenario se puntúa al final. En evaluación el tiempo sí cuenta."}
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500">
                      Integraciones activas: ECG, Laboratorio y Gasometría se muestran dentro del caso cuando los solicitas.
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Resumen operativo</h3>
                  <div className="mt-2 text-sm text-slate-600">
                    Mantén visible el monitor, revisa los estudios ya liberados y continúa resolviendo el escenario por etapas.
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500">
                    Este panel queda disponible para próximas tarjetas de apoyo clínico, checklist o ayudas del tutor.
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
