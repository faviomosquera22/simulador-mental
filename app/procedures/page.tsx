"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  NURSING_PROCEDURE_LIBRARY,
  evaluateProcedure,
  procedureCategoryLabel,
  procedureDifficultyLabel,
  type NursingProcedure,
  type ProcedureDifficulty,
  type ProcedureMode,
} from "@/src/lib/nursingProcedures";

type SelectionMode = "manual" | "random";
type DifficultyFilter = ProcedureDifficulty | "all";

function sampleFromPool<T>(pool: T[]) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickByDifficulty(pool: NursingProcedure[], difficulty: DifficultyFilter) {
  if (difficulty === "all") return pool;
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  return filtered.length ? filtered : pool;
}

export default function ProceduresPage() {
  const [mode, setMode] = useState<ProcedureMode>("practice");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [casePool] = useState(NURSING_PROCEDURE_LIBRARY);
  const [procedure, setProcedure] = useState<NursingProcedure>(NURSING_PROCEDURE_LIBRARY[0]);
  const [manualProcedureId, setManualProcedureId] = useState(NURSING_PROCEDURE_LIBRARY[0]?.id ?? "");
  const [displayedMaterials, setDisplayedMaterials] = useState(NURSING_PROCEDURE_LIBRARY[0]?.materials ?? []);
  const [displayedSteps, setDisplayedSteps] = useState(NURSING_PROCEDURE_LIBRARY[0]?.steps ?? []);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [stepOrderMap, setStepOrderMap] = useState<Record<string, string>>({});
  const [decisionId, setDecisionId] = useState("");
  const [result, setResult] = useState<ReturnType<typeof evaluateProcedure> | null>(null);

  const resetExercise = useCallback((nextProcedure?: NursingProcedure) => {
    const base = nextProcedure ?? procedure;
    setDisplayedMaterials(shuffleArray(base.materials));
    setDisplayedSteps(shuffleArray(base.steps));
    setSelectedMaterialIds([]);
    setStepOrderMap({});
    setDecisionId("");
    setResult(null);
  }, [procedure]);

  const pickNextProcedure = useCallback(
    (excludeId?: string) => {
      const basePool = pickByDifficulty(casePool, difficultyFilter).filter((item) => item.id !== excludeId);
      if (!basePool.length) return casePool[0] ?? NURSING_PROCEDURE_LIBRARY[0];

      if (selectionMode === "manual") {
        return casePool.find((item) => item.id === manualProcedureId) ?? casePool[0] ?? NURSING_PROCEDURE_LIBRARY[0];
      }

      return sampleFromPool(basePool) ?? basePool[0];
    },
    [casePool, difficultyFilter, manualProcedureId, selectionMode]
  );

  useEffect(() => {
    const next = pickNextProcedure();
    if (!next) return;
    setProcedure(next);
    if (selectionMode === "manual") {
      setManualProcedureId(next.id);
    }
    resetExercise(next);
  }, [pickNextProcedure, resetExercise, selectionMode]);

  function toggleMaterial(id: string) {
    setSelectedMaterialIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function buildOrderedSteps() {
    return procedure.steps.map((_, index) => {
      const currentOrder = String(index + 1);
      const match = displayedSteps.find((step) => stepOrderMap[step] === currentOrder);
      return match ?? `missing-${currentOrder}`;
    });
  }

  function loadNewProcedure() {
    const next = pickNextProcedure(procedure.id);
    if (!next) return;
    setProcedure(next);
    if (selectionMode === "manual") {
      setManualProcedureId(next.id);
    }
    resetExercise(next);
  }

  function evaluate() {
    setResult(
      evaluateProcedure({
        procedure,
        selectedMaterialIds,
        orderedStepIds: buildOrderedSteps(),
        decisionId,
      })
    );
  }

  const orderChoices = useMemo(
    () => Array.from({ length: procedure.steps.length }, (_, index) => String(index + 1)),
    [procedure.steps.length]
  );

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Procedimientos de enfermería</h1>
              <p className="mt-1 text-sm text-white/70">
                Ordena pasos, selecciona insumos y decide conductas seguras durante el procedimiento.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Dificultad: {procedureDifficultyLabel(procedure.difficulty)}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0B111D]/85 p-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-xs text-white/70">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as ProcedureMode);
                  setResult(null);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="practice">Práctica guiada</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Selección
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
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

            <label className="text-xs text-white/70 xl:col-span-2">
              Procedimiento
              <select
                value={manualProcedureId}
                onChange={(event) => {
                  setManualProcedureId(event.target.value);
                  setSelectionMode("manual");
                  const next = casePool.find((item) => item.id === event.target.value) ?? null;
                  if (!next) return;
                  setProcedure(next);
                  resetExercise(next);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {casePool.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 xl:grid-cols-[1.35fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Procedimiento</div>
              <div className="mt-1 text-base font-semibold text-white">{procedure.name}</div>
              <div className="mt-1 text-sm text-white/70">{procedure.context}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              <div className="font-semibold text-white/85">Perfil del ejercicio</div>
              <div className="mt-2">Categoría: {procedureCategoryLabel(procedure.category)}</div>
              <div className="mt-1">Errores críticos: {procedure.criticalErrors.join(" · ")}</div>
            </div>

            <div className="flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={loadNewProcedure}
                className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nuevo procedimiento
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <h2 className="text-lg font-semibold">Materiales necesarios</h2>
                  <div className="mt-3 grid gap-2">
                    {displayedMaterials.map((item) => {
                      const checked = selectedMaterialIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            checked ? "border-cyan-400/35 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-black/25 text-white/80"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMaterial(item.id)}
                            className="mr-2 h-4 w-4 align-middle"
                          />
                          <span className="align-middle">{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Ordena los pasos</h2>
                  <div className="mt-3 space-y-2">
                    {displayedSteps.map((step) => (
                      <div key={step} className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="text-sm text-white/85">{step}</div>
                        <select
                          value={stepOrderMap[step] ?? ""}
                          onChange={(event) =>
                            setStepOrderMap((prev) => ({
                              ...prev,
                              [step]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-xs text-white"
                        >
                          <option value="">Selecciona el orden</option>
                          {orderChoices.map((choice) => (
                            <option key={`${step}-${choice}`} value={choice}>
                              Paso {choice}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {mode === "practice" && (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">
                  En práctica, piensa siempre en preparación, técnica segura, reevaluación y registro final.
                </div>
              )}
            </div>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#0C1422]/90 p-4">
                <h3 className="text-base font-semibold">Decisión durante el procedimiento</h3>
                <p className="mt-1 text-xs text-white/60">{procedure.decisionPoint.prompt}</p>

                <div className="mt-3 space-y-2">
                  {procedure.decisionPoint.options.map((option) => {
                    const checked = decisionId === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`block rounded-xl border px-3 py-2 text-sm ${
                          checked ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-black/25 text-white/80"
                        }`}
                      >
                        <input
                          type="radio"
                          name="procedure-decision"
                          checked={checked}
                          onChange={() => setDecisionId(option.id)}
                          className="mr-2 h-4 w-4 align-middle"
                        />
                        <span className="align-middle">{option.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={evaluate}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Validar procedimiento
                  </button>
                  <button
                    type="button"
                    onClick={() => resetExercise()}
                    className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>

              {result && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">Feedback automático</div>
                    <div className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">
                      {result.totalScore}/100
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-white/80">
                    <div>{result.feedback.materials}</div>
                    <div>{result.feedback.order}</div>
                    <div>{result.feedback.decision}</div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85">
                      {result.feedback.summary}
                    </div>
                  </div>

                  {mode === "practice" && (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                      {procedure.rationale}
                    </div>
                  )}
                </div>
              )}
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
