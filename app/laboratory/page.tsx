"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  LAB_CASE_LIBRARY,
  type LabCaseSet,
  type LabDifficulty,
  type LabInterpretationResult,
  type LabMode,
  difficultyLabel,
  evaluateLabInterpretation,
  inferLabContextFromCase,
  statusBadge,
  statusLabel,
} from "@/src/lib/laboratoryModule";
import { fetchLaboratoryCasesFromDb } from "@/src/lib/laboratoryDb";

type SelectionMode = "manual" | "random" | "contextual_random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = LabDifficulty | "all";

function safeCaseObject(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function caseTitle(caseObj: any) {
  const fromMeta = String(caseObj?.meta?.title ?? "").trim();
  if (fromMeta) return fromMeta;
  const fromEssentials = String(caseObj?.essentials?.title ?? "").trim();
  if (fromEssentials) return fromEssentials;
  const fromDirect = String(caseObj?.title ?? "").trim();
  return fromDirect || "Caso activo";
}

function pickByDifficulty(pool: LabCaseSet[], difficulty: DifficultyFilter) {
  if (difficulty === "all") return pool;
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  return filtered.length ? filtered : pool;
}

function contextLabel(label: string) {
  if (label === "infection") return "Infeccioso";
  if (label === "renal") return "Renal";
  if (label === "anemia") return "Anemia";
  if (label === "metabolic") return "Metabólico";
  if (label === "urinary") return "Urinario";
  if (label === "hepatobiliary") return "Hepatobiliar";
  if (label === "chest_pain") return "Dolor torácico";
  return "General";
}

function sampleFromPool(pool: LabCaseSet[]) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function buildMainFindingOptions(caseSet: LabCaseSet, pool: LabCaseSet[]) {
  const distractors = pool
    .filter((item) => item.id !== caseSet.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4)
    .map((item) => item.mainFinding);

  const options = [caseSet.mainFinding, ...distractors];
  return Array.from(new Set(options)).slice(0, 5);
}

export default function LaboratoryPage() {
  const [mode, setMode] = useState<LabMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("integrated_case");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [labPool, setLabPool] = useState<LabCaseSet[]>(LAB_CASE_LIBRARY);
  const [poolSource, setPoolSource] = useState<"database" | "local">("local");
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [labSet, setLabSet] = useState<LabCaseSet>(LAB_CASE_LIBRARY[0]);
  const [manualLabId, setManualLabId] = useState<string>(LAB_CASE_LIBRARY[0]?.id ?? "");
  const [selectedAlteredIds, setSelectedAlteredIds] = useState<string[]>([]);
  const [mainFindingInput, setMainFindingInput] = useState("");
  const [clinicalSuspicionInput, setClinicalSuspicionInput] = useState("");
  const [nextStepInput, setNextStepInput] = useState("");
  const [result, setResult] = useState<LabInterpretationResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    try {
      setActiveCaseObj(safeCaseObject(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPoolFromDb() {
      setPoolLoading(true);
      setPoolError(null);

      try {
        const fromDb = await fetchLaboratoryCasesFromDb(1200);
        if (!mounted) return;
        if (fromDb.length > 0) {
          setLabPool(fromDb);
          setPoolSource("database");
          return;
        }

        setLabPool(LAB_CASE_LIBRARY);
        setPoolSource("local");
        if (!LAB_CASE_LIBRARY.length) {
          setPoolError("No se encontraron casos activos ni respaldo local disponible.");
        } else if (process.env.NODE_ENV !== "production") {
          setPoolError("Modo local activo (debug): base de datos sin casos activos.");
        } else {
          setPoolError(null);
        }
      } catch (error) {
        if (!mounted) return;
        setLabPool(LAB_CASE_LIBRARY);
        setPoolSource("local");
        if (!LAB_CASE_LIBRARY.length) {
          setPoolError(
            error instanceof Error
              ? `No se pudo cargar laboratorio: ${error.message}.`
              : "No se pudo cargar laboratorio y no hay respaldo local."
          );
        } else if (process.env.NODE_ENV !== "production") {
          const detail = error instanceof Error ? error.message : "Error desconocido.";
          setPoolError(`Modo local activo (debug): ${detail}`);
        } else {
          setPoolError(null);
        }
      } finally {
        if (mounted) setPoolLoading(false);
      }
    }

    loadPoolFromDb();

    return () => {
      mounted = false;
    };
  }, []);

  const useContextualCase = usageMode === "integrated_case" && activeCaseObj;

  const clearAnswers = useCallback(() => {
    setSelectedAlteredIds([]);
    setMainFindingInput("");
    setClinicalSuspicionInput("");
    setNextStepInput("");
    setResult(null);
    setShowExplanation(false);
  }, []);

  const pickNextLabSet = useCallback(
    (excludeId?: string) => {
      const basePool = pickByDifficulty(labPool, difficultyFilter).filter((item) => item.id !== excludeId);
      if (!basePool.length) return labPool[0] ?? LAB_CASE_LIBRARY[0];

      if (selectionMode === "manual") {
        const manual = labPool.find((item) => item.id === manualLabId) ?? null;
        if (manual && (difficultyFilter === "all" || manual.difficulty === difficultyFilter)) {
          return manual;
        }
        return basePool[0];
      }

      if (selectionMode === "contextual_random" && useContextualCase) {
        const context = inferLabContextFromCase(activeCaseObj);
        const contextualPool = basePool.filter((item) => item.context === context);
        if (contextualPool.length > 0) {
          return sampleFromPool(contextualPool) ?? contextualPool[0];
        }
      }

      return sampleFromPool(basePool) ?? basePool[0] ?? labPool[0] ?? LAB_CASE_LIBRARY[0];
    },
    [activeCaseObj, difficultyFilter, labPool, manualLabId, selectionMode, useContextualCase]
  );

  useEffect(() => {
    if (!labPool.length) return;
    const next = pickNextLabSet();
    if (next) {
      setLabSet(next);
      if (selectionMode === "manual") {
        setManualLabId(next.id);
      }
      clearAnswers();
    }
  }, [labPool.length, pickNextLabSet, clearAnswers, selectionMode]);

  const mainFindingOptions = useMemo(
    () => buildMainFindingOptions(labSet, labPool),
    [labPool, labSet]
  );
  const showStatusColumn = mode === "practice" || Boolean(result);
  const contextualTag = useContextualCase ? inferLabContextFromCase(activeCaseObj) : null;

  const selectedCount = selectedAlteredIds.length;

  function toggleAltered(parameterId: string) {
    setSelectedAlteredIds((prev) =>
      prev.includes(parameterId)
        ? prev.filter((item) => item !== parameterId)
        : [...prev, parameterId]
    );
  }

  function evaluate() {
    const evaluation = evaluateLabInterpretation({
      caseSet: labSet,
      mode,
      input: {
        alteredParameterIds: selectedAlteredIds,
        mainFinding: mainFindingInput,
        clinicalSuspicion: clinicalSuspicionInput,
        nextStep: nextStepInput,
      },
    });
    setResult(evaluation);
    setShowExplanation(true);
  }

  function loadNewCase() {
    const next = pickNextLabSet(labSet.id);
    if (!next) return;
    setLabSet(next);
    if (selectionMode === "manual") {
      setManualLabId(next.id);
    }
    clearAnswers();
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Laboratorio clínico</h1>
              <p className="mt-1 text-sm text-white/70">
                Interpreta resultados, prioriza hallazgos y define conducta inicial con feedback automático.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Dificultad: {difficultyLabel(labSet.difficulty)}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0B111D]/85 p-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs text-white/70">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as LabMode);
                  setResult(null);
                }}
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
                <option value="integrated_case">Integrado al caso</option>
                <option value="standalone">Módulo independiente</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Selección de laboratorio
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
              Filtro de dificultad
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
              Set de laboratorio
              <select
                value={manualLabId}
                onChange={(event) => {
                  setManualLabId(event.target.value);
                  const manual = labPool.find((item) => item.id === event.target.value) ?? null;
                  if (manual) {
                    setLabSet(manual);
                    clearAnswers();
                  }
                }}
                disabled={selectionMode !== "manual"}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {labPool.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {poolError && (
            <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              {poolError}
            </div>
          )}

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 xl:grid-cols-[1.5fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Contexto</div>
              <div className="mt-1 text-base font-semibold text-white">{labSet.name}</div>
              <div className="mt-1 text-sm text-white/70">
                Paciente: {labSet.patient.name} · {labSet.patient.age} años ·{" "}
                {labSet.patient.sex === "female" ? "Femenino" : labSet.patient.sex === "male" ? "Masculino" : "No especificado"}
              </div>
              <div className="text-sm text-white/65">Motivo de consulta: {labSet.patient.chiefComplaint}</div>
              {useContextualCase && (
                <div className="mt-2 text-xs text-cyan-100">
                  Caso activo detectado: {caseTitle(activeCaseObj)} · Contexto inferido:{" "}
                  {contextLabel(contextualTag ?? "general")}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              <div className="font-semibold text-white/85">Integraciones sugeridas</div>
              <div className="mt-2">ECG · Triage · Urgencias · Casos clínicos</div>
              <div className="mt-1">
                Hallazgo principal esperado: <span className="text-white/85">{labSet.mainFinding}</span>
              </div>
              <div className="mt-1">Alteraciones seleccionadas por ti: {selectedCount}</div>
              <div className="mt-1">
                Fuente de casos:{" "}
                <span className="text-white/85">
                  {poolLoading ? "Cargando..." : poolSource === "database" ? "Base de datos" : "Biblioteca local"}
                </span>
              </div>
              <div className="mt-1">Casos disponibles en pool: {labPool.length}</div>
            </div>
            <div className="flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={loadNewCase}
                className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nuevo set
              </button>
              <Link
                href="/simulator?tab=ecg"
                className="rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
              >
                Ir a ECG
              </Link>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Resultados de laboratorio</h2>
                <div className="text-xs text-white/60">
                  {mode === "practice"
                    ? "En práctica se muestran alteraciones visuales."
                    : "En evaluación no se muestran pistas hasta enviar."}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {labSet.panels.map((panel) => (
                  <div key={panel.id} className="overflow-hidden rounded-2xl border border-white/10">
                    <div className="bg-white/5 px-3 py-2 text-sm font-semibold text-white/90">{panel.name}</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-black/35 text-xs uppercase tracking-wide text-white/55">
                          <tr>
                            <th className="px-3 py-2 text-left">Parámetro</th>
                            <th className="px-3 py-2 text-left">Valor</th>
                            <th className="px-3 py-2 text-left">Unidad</th>
                            <th className="px-3 py-2 text-left">Rango</th>
                            <th className="px-3 py-2 text-left">¿Alterado?</th>
                            <th className="px-3 py-2 text-left">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {panel.parameters.map((parameter) => {
                            const selected = selectedAlteredIds.includes(parameter.id);
                            const highlighted =
                              showStatusColumn && parameter.status !== "normal"
                                ? "bg-red-500/[0.04]"
                                : "";
                            return (
                              <tr key={parameter.id} className={`border-t border-white/10 ${highlighted}`}>
                                <td className="px-3 py-2 font-medium text-white/90">{parameter.name}</td>
                                <td className="px-3 py-2 text-white/90">{String(parameter.value)}</td>
                                <td className="px-3 py-2 text-white/70">{parameter.unit || "—"}</td>
                                <td className="px-3 py-2 text-white/70">{parameter.referenceRange}</td>
                                <td className="px-3 py-2">
                                  <label className="inline-flex items-center gap-2 text-xs text-white/80">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleAltered(parameter.id)}
                                      className="h-4 w-4 rounded border-white/30 bg-transparent"
                                    />
                                    Marcar
                                  </label>
                                </td>
                                <td className="px-3 py-2">
                                  {showStatusColumn ? (
                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${statusBadge(parameter.status)}`}>
                                      {statusLabel(parameter.status)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-white/40">Oculto</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#0C1422]/90 p-4">
                <h3 className="text-base font-semibold">Interpretación clínica</h3>
                <p className="mt-1 text-xs text-white/60">
                  Responde primero y luego valida para recibir retroalimentación automática.
                </p>

                <div className="mt-3 space-y-3">
                  <label className="block text-xs text-white/70">
                    1) Hallazgo principal
                    <select
                      value={mainFindingInput}
                      onChange={(event) => setMainFindingInput(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Selecciona una opción</option>
                      {mainFindingOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs text-white/70">
                    2) Sospecha clínica
                    <textarea
                      value={clinicalSuspicionInput}
                      onChange={(event) => setClinicalSuspicionInput(event.target.value)}
                      rows={3}
                      placeholder="¿Qué sospecha clínica generan estos resultados?"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35"
                    />
                  </label>

                  <label className="block text-xs text-white/70">
                    3) Conducta inicial
                    <textarea
                      value={nextStepInput}
                      onChange={(event) => setNextStepInput(event.target.value)}
                      rows={3}
                      placeholder="¿Qué harías a continuación?"
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={evaluate}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Validar interpretación
                  </button>
                  <button
                    type="button"
                    onClick={clearAnswers}
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
                    <div>Valores alterados: {result.feedback.alteredValues}</div>
                    <div>Hallazgo principal: {result.feedback.mainFinding}</div>
                    <div>Correlación clínica: {result.feedback.clinicalCorrelation}</div>
                    <div>Conducta inicial: {result.feedback.nextStep}</div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85">
                      {result.feedback.summary}
                    </div>
                  </div>

                  {showExplanation && (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                      {labSet.educationalExplanation}
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
