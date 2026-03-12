"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  CLINICAL_CALCULATION_EXERCISES,
  filterCalculationExercises,
  type CalculationCategory,
  type CalculationDifficulty,
  type CalculationEvaluation,
  type CalculationMode,
  type ClinicalCalculationExercise,
  classifyBmi,
  evaluateCalculationAnswer,
  getCalculationCategoryLabel,
  getCalculationDifficultyLabel,
  getExerciseTypeLabel,
} from "@/src/lib/clinicalCalculations";
import { fetchClinicalExercisesFromDb } from "@/src/lib/clinicalCalculationsDb";

type CategoryFilter = CalculationCategory | "all";
type DifficultyFilter = CalculationDifficulty | "all";

type AttemptRecord = {
  exerciseId: string;
  category: CalculationCategory;
  correct: boolean;
  elapsedSec: number;
  at: string;
};

const STORAGE_KEY = "clinicalCalculationsHistory";

function loadHistory(): AttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        exerciseId: String(item?.exerciseId ?? ""),
        category: item?.category as CalculationCategory,
        correct: Boolean(item?.correct),
        elapsedSec: Number(item?.elapsedSec ?? 0),
        at: String(item?.at ?? ""),
      }))
      .filter((item) => item.exerciseId && item.category);
  } catch {
    return [];
  }
}

function persistHistory(history: AttemptRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 250)));
  } catch {
    // ignore
  }
}

function formatTime(totalSec: number) {
  const sec = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function scoreTone(correctRate: number) {
  if (correctRate >= 85) return "text-emerald-100 border-emerald-400/35 bg-emerald-400/10";
  if (correctRate >= 65) return "text-sky-100 border-sky-400/35 bg-sky-400/10";
  if (correctRate >= 45) return "text-amber-100 border-amber-400/35 bg-amber-400/10";
  return "text-red-100 border-red-400/35 bg-red-400/10";
}

function normalizeCalcExpression(value: string) {
  return String(value).replace(/×/g, "*").replace(/÷/g, "/");
}

function isValidCalcExpression(value: string) {
  return /^[0-9+\-*/().\s]+$/.test(value);
}

function evaluateCalcExpression(value: string) {
  const normalized = normalizeCalcExpression(value).replace(/\s+/g, "");
  if (!normalized) return "0";
  if (!isValidCalcExpression(normalized)) {
    throw new Error("Expresión inválida");
  }

  const result = Function(`"use strict"; return (${normalized});`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Resultado no válido");
  }

  return Number(result.toFixed(10)).toString();
}

export default function ClinicalCalculationsPage() {
  const [mode, setMode] = useState<CalculationMode>("practice");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [exercisePool, setExercisePool] = useState<ClinicalCalculationExercise[]>(
    CLINICAL_CALCULATION_EXERCISES
  );
  const [poolSource, setPoolSource] = useState<"database" | "local">("local");
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ClinicalCalculationExercise>(
    CLINICAL_CALCULATION_EXERCISES[0]
  );
  const [answerInput, setAnswerInput] = useState("");
  const [result, setResult] = useState<CalculationEvaluation | null>(null);
  const [history, setHistory] = useState<AttemptRecord[]>([]);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [now, setNow] = useState<number>(Date.now());
  const [calcExpression, setCalcExpression] = useState("");
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!(mode === "evaluation" && timerEnabled && !result)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [mode, timerEnabled, result]);

  const filteredCount = useMemo(() => exercisePool.length, [exercisePool.length]);

  const elapsedSec = useMemo(() => {
    if (!(mode === "evaluation" && timerEnabled)) return 0;
    return Math.max(0, Math.floor((now - startedAt) / 1000));
  }, [mode, timerEnabled, now, startedAt]);

  const stats = useMemo(() => {
    if (!history.length) return { attempts: 0, correct: 0, rate: 0, meanSec: 0 };
    const attempts = history.length;
    const correct = history.filter((item) => item.correct).length;
    const rate = Math.round((correct / attempts) * 100);
    const meanSec =
      Math.round(history.reduce((sum, item) => sum + Math.max(0, item.elapsedSec), 0) / attempts) || 0;
    return { attempts, correct, rate, meanSec };
  }, [history]);

  function pickNextExercise(excludeId?: string) {
    const pool = exercisePool.filter((item) => item.id !== excludeId);
    const source = pool.length ? pool : exercisePool;
    if (!source.length) return;
    const next = source[Math.floor(Math.random() * source.length)];
    setExercise(next);
    setAnswerInput("");
    setResult(null);
    setStartedAt(Date.now());
    setNow(Date.now());
  }

  useEffect(() => {
    let mounted = true;

    async function loadExercisePool() {
      setPoolLoading(true);
      setPoolError(null);

      const localFallback = filterCalculationExercises({
        category: categoryFilter,
        difficulty: difficultyFilter,
      });

      try {
        const fromDb = await fetchClinicalExercisesFromDb({
          category: categoryFilter,
          difficulty: difficultyFilter,
          limit: 2500,
        });

        if (!mounted) return;

        if (fromDb.length > 0) {
          setExercisePool(fromDb);
          setPoolSource("database");
          const next = fromDb[Math.floor(Math.random() * fromDb.length)];
          setExercise(next);
          setAnswerInput("");
          setResult(null);
          setStartedAt(Date.now());
          setNow(Date.now());
          return;
        }

        setExercisePool(localFallback);
        setPoolSource("local");
        if (localFallback.length > 0) {
          const next = localFallback[Math.floor(Math.random() * localFallback.length)];
          setExercise(next);
          setAnswerInput("");
          setResult(null);
          setStartedAt(Date.now());
          setNow(Date.now());
        }
      } catch (error) {
        if (!mounted) return;
        setExercisePool(localFallback);
        setPoolSource("local");
        if (!localFallback.length) {
          setPoolError("No se pudieron cargar ejercicios desde base de datos ni desde el respaldo local.");
        } else if (process.env.NODE_ENV !== "production") {
          const detail = error instanceof Error ? error.message : "Error desconocido.";
          setPoolError(`Modo local activo (debug): ${detail}`);
        } else {
          setPoolError(null);
        }
        if (localFallback.length > 0) {
          const next = localFallback[Math.floor(Math.random() * localFallback.length)];
          setExercise(next);
          setAnswerInput("");
          setResult(null);
          setStartedAt(Date.now());
          setNow(Date.now());
        }
      } finally {
        if (mounted) {
          setPoolLoading(false);
        }
      }
    }

    loadExercisePool();

    return () => {
      mounted = false;
    };
  }, [categoryFilter, difficultyFilter]);

  function validateCurrentAnswer() {
    const evaluation = evaluateCalculationAnswer({
      exercise,
      rawAnswer: answerInput,
      mode,
    });
    setResult(evaluation);

    if (evaluation.isValidNumber) {
      const record: AttemptRecord = {
        exerciseId: exercise.id,
        category: exercise.category,
        correct: evaluation.isCorrect,
        elapsedSec: mode === "evaluation" && timerEnabled ? elapsedSec : 0,
        at: new Date().toISOString(),
      };
      setHistory((prev) => {
        const next = [record, ...prev];
        persistHistory(next);
        return next;
      });
    }
  }

  function appendCalcToken(token: string) {
    setCalcError(null);
    setCalcExpression((prev) => `${prev}${token}`);
    setCalcDisplay((prev) => (prev === "0" ? token : `${prev}${token}`));
  }

  function clearCalculator() {
    setCalcExpression("");
    setCalcDisplay("0");
    setCalcError(null);
  }

  function backspaceCalculator() {
    setCalcError(null);
    setCalcExpression((prev) => {
      const next = prev.slice(0, -1);
      setCalcDisplay(next || "0");
      return next;
    });
  }

  function solveCalculator() {
    try {
      const resultValue = evaluateCalcExpression(calcExpression);
      setCalcExpression(resultValue);
      setCalcDisplay(resultValue);
      setCalcError(null);
    } catch {
      setCalcDisplay("Error");
      setCalcError("No se pudo resolver la expresión. Verifica operadores y paréntesis.");
    }
  }

  const showGuidedInfo = mode === "practice" || Boolean(result);
  const isBmiExercise = exercise.category === "anthropometry";
  const bmiCategory = result?.isCorrect && isBmiExercise ? classifyBmi(result.expectedAnswer) : null;

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1540px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Cálculo clínico</h1>
              <p className="mt-1 text-sm text-white/70">
                Practica dosis, infusión, balance hídrico e IMC con validación automática y explicación.
              </p>
            </div>

            <div className={`rounded-full border px-3 py-1 text-xs ${scoreTone(stats.rate)}`}>
              Rendimiento global: {stats.rate}% ({stats.correct}/{stats.attempts})
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0C111C]/90 p-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs text-white/70">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  const nextMode = event.target.value as CalculationMode;
                  setMode(nextMode);
                  setResult(null);
                  setStartedAt(Date.now());
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="practice">Práctica</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Categoría
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas</option>
                <option value="dose_medication">Dosis y medicación</option>
                <option value="infusion_drip">Infusión y goteo</option>
                <option value="fluid_balance">Balance hídrico</option>
                <option value="anthropometry">Antropometría</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Dificultad
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas</option>
                <option value="basic">Básico</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Cronómetro
              <select
                value={timerEnabled ? "yes" : "no"}
                onChange={(event) => setTimerEnabled(event.target.value === "yes")}
                disabled={mode !== "evaluation"}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                <option value="yes">Activado</option>
                <option value="no">Desactivado</option>
              </select>
            </label>

            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
              <div className="uppercase tracking-[0.12em] text-white/45">Set actual</div>
              <div className="mt-1 text-sm font-semibold text-white/90">{filteredCount} ejercicios disponibles</div>
              <div className="mt-1">Tipo: {getExerciseTypeLabel(exercise.type)}</div>
              <div className="mt-1">
                Fuente: {poolLoading ? "Cargando..." : poolSource === "database" ? "Base de datos" : "Local"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70">
              <div className="uppercase tracking-[0.12em] text-white/45">Tiempo</div>
              <div className="mt-1 text-sm font-semibold text-white/90">
                {mode === "evaluation" && timerEnabled ? formatTime(elapsedSec) : "Sin cronómetro"}
              </div>
              <div className="mt-1">Promedio histórico: {formatTime(stats.meanSec)}</div>
            </div>
          </section>

          {poolError && (
            <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              {poolError}
            </div>
          )}

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <article className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/50">Ejercicio clínico</div>
                  <h2 className="mt-1 text-lg font-semibold">{exercise.title}</h2>
                </div>
                <div className="space-y-1 text-right text-xs">
                  <div className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-1 text-cyan-100">
                    {getCalculationCategoryLabel(exercise.category)}
                  </div>
                  <div className="text-white/65">{getCalculationDifficultyLabel(exercise.difficulty)}</div>
                </div>
              </div>

              <p className="mt-3 text-sm text-white/80">{exercise.statement}</p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="text-xs uppercase tracking-wide text-white/50">Datos del paciente</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {exercise.patientData.map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                      <span className="text-white/60">{item.label}:</span>{" "}
                      <span className="font-medium text-white/90">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <label className="text-xs text-white/70">
                  Respuesta ({exercise.answerUnit})
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(event) => setAnswerInput(event.target.value)}
                    placeholder={`Ingresa el valor en ${exercise.answerUnit}`}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={validateCurrentAnswer}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Validar
                </button>
                <button
                  type="button"
                  onClick={() => pickNextExercise(exercise.id)}
                  className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                >
                  Nuevo ejercicio
                </button>
              </div>
            </article>

            <aside className="space-y-3">
              {showGuidedInfo && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <h3 className="text-sm font-semibold text-white">Guía de resolución</h3>
                  <div className="mt-2 text-xs text-white/65">Fórmula esperada</div>
                  <div className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                    {exercise.formula}
                  </div>
                  <div className="mt-3 text-xs text-white/65">Pistas</div>
                  <ul className="mt-1 space-y-1 text-sm text-white/80">
                    {exercise.hints.map((hint) => (
                      <li key={hint}>• {hint}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-[#0C1422]/90 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Mini calculadora</h3>
                  <button
                    type="button"
                    onClick={() => setAnswerInput(calcDisplay === "Error" ? "" : calcDisplay)}
                    className="rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100 hover:bg-cyan-400/20"
                  >
                    Usar en respuesta
                  </button>
                </div>

                <div className="mt-3 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-right">
                  <div className="text-xs text-white/50">{calcExpression || " "}</div>
                  <div className="text-xl font-semibold text-white">{calcDisplay}</div>
                </div>

                {calcError && (
                  <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-100">
                    {calcError}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                  {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "-", "0", ".", "(", ")", "C", "⌫", "=", "+"].map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === "C") {
                            clearCalculator();
                            return;
                          }
                          if (key === "⌫") {
                            backspaceCalculator();
                            return;
                          }
                          if (key === "=") {
                            solveCalculator();
                            return;
                          }
                          appendCalcToken(key);
                        }}
                        className={`rounded-lg border px-2 py-2 transition ${
                          key === "="
                            ? "border-cyan-400/35 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                            : key === "C" || key === "⌫"
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                            : "border-white/10 bg-black/25 text-white/85 hover:bg-white/10"
                        }`}
                      >
                        {key}
                      </button>
                    )
                  )}
                </div>
              </div>

              {result && (
                <div className="rounded-2xl border border-white/10 bg-[#0C1422]/90 p-4">
                  <h3 className="text-sm font-semibold">Resultado</h3>
                  <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
                    {result.feedback}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
                    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                      Esperado: <span className="font-semibold text-white/90">{result.expectedAnswer}</span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                      Tu respuesta:{" "}
                      <span className="font-semibold text-white/90">
                        {result.parsedAnswer == null ? "—" : result.parsedAnswer}
                      </span>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 col-span-2">
                      Rango válido: {result.acceptedMin.toFixed(2)} a {result.acceptedMax.toFixed(2)}
                    </div>
                  </div>

                  {!result.isCorrect && result.commonErrorHint && (
                    <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                      Error frecuente detectado: {result.commonErrorHint}
                    </div>
                  )}

                  {(mode === "practice" || result.isCorrect) && (
                    <div className="mt-3">
                      <div className="text-xs text-white/60">Resolución paso a paso</div>
                      <ol className="mt-1 space-y-1 text-sm text-white/80">
                        {exercise.stepByStep.map((step, index) => (
                          <li key={step}>
                            {index + 1}. {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {bmiCategory && (
                    <div className="mt-3 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
                      Clasificación IMC: {bmiCategory}
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
