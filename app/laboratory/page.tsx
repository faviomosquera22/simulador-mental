"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
        if (manual) return manual;
        return labPool[0] ?? LAB_CASE_LIBRARY[0];
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Laboratorio clínico</h1>
              <p className="mt-1 text-sm text-slate-600">
                Interpreta resultados, prioriza hallazgos y define conducta inicial con feedback automático.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Dificultad: {difficultyLabel(labSet.difficulty)}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs text-slate-600">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as LabMode);
                  setResult(null);
                }}
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
                <option value="integrated_case">Integrado al caso</option>
                <option value="standalone">Módulo independiente</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Selección de laboratorio
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
              Filtro de dificultad
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
              Set de laboratorio
              <select
                value={manualLabId}
                onChange={(event) => {
                  setManualLabId(event.target.value);
                  setSelectionMode("manual");
                  const manual = labPool.find((item) => item.id === event.target.value) ?? null;
                  if (manual) {
                    setLabSet(manual);
                    clearAnswers();
                  }
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                {labPool.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-[11px] text-slate-400">
                Al elegir un set, el modo cambia automáticamente a Manual.
              </div>
            </label>
          </section>

          {poolError && (
            <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-700">
              {poolError}
            </div>
          )}

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.5fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Contexto</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{labSet.name}</div>
              <div className="mt-1 text-sm text-slate-600">
                Paciente: {labSet.patient.name} · {labSet.patient.age} años ·{" "}
                {labSet.patient.sex === "female" ? "Femenino" : labSet.patient.sex === "male" ? "Masculino" : "No especificado"}
              </div>
              <div className="text-sm text-slate-500">Motivo de consulta: {labSet.patient.chiefComplaint}</div>
              {useContextualCase && (
                <div className="mt-2 text-xs text-cyan-700">
                  Caso activo detectado: {caseTitle(activeCaseObj)} · Contexto inferido:{" "}
                  {contextLabel(contextualTag ?? "general")}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Integraciones sugeridas</div>
              <div className="mt-2">ECG · Triage · Urgencias · Casos clínicos</div>
              <div className="mt-1">
                Hallazgo principal esperado: <span className="text-slate-800">{labSet.mainFinding}</span>
              </div>
              <div className="mt-1">Alteraciones seleccionadas por ti: {selectedCount}</div>
              <div className="mt-1">
                Fuente de casos:{" "}
                <span className="text-slate-800">
                  {poolLoading ? "Cargando..." : poolSource === "database" ? "Base de datos" : "Biblioteca local"}
                </span>
              </div>
              <div className="mt-1">Casos disponibles en pool: {labPool.length}</div>
            </div>
            <div className="flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={loadNewCase}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
              >
                Nuevo set
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Resultados de laboratorio</h2>
                <div className="text-xs text-slate-500">
                  {mode === "practice"
                    ? "En práctica se muestran alteraciones visuales."
                    : "En evaluación no se muestran pistas hasta enviar."}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {labSet.panels.map((panel) => (
                  <div key={panel.id} className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900/90">{panel.name}</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white text-xs uppercase tracking-wide text-slate-400">
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
                              <tr key={parameter.id} className={`border-t border-slate-200 ${highlighted}`}>
                                <td className="px-3 py-2 font-medium text-slate-900/90">{parameter.name}</td>
                                <td className="px-3 py-2 text-slate-900/90">{String(parameter.value)}</td>
                                <td className="px-3 py-2 text-slate-600">{parameter.unit || "—"}</td>
                                <td className="px-3 py-2 text-slate-600">{parameter.referenceRange}</td>
                                <td className="px-3 py-2">
                                  <label className="inline-flex items-center gap-2 text-xs text-slate-700">
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
                                    <span className="text-xs text-slate-400">Oculto</span>
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
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <h3 className="text-base font-semibold">Interpretación clínica</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Responde primero y luego valida para recibir retroalimentación automática.
                </p>

                <div className="mt-3 space-y-3">
                  <label className="block text-xs text-slate-600">
                    1) Hallazgo principal
                    <select
                      value={mainFindingInput}
                      onChange={(event) => setMainFindingInput(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">Selecciona una opción</option>
                      {mainFindingOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs text-slate-600">
                    2) Sospecha clínica
                    <textarea
                      value={clinicalSuspicionInput}
                      onChange={(event) => setClinicalSuspicionInput(event.target.value)}
                      rows={3}
                      placeholder="¿Qué sospecha clínica generan estos resultados?"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-900/35"
                    />
                  </label>

                  <label className="block text-xs text-slate-600">
                    3) Conducta inicial
                    <textarea
                      value={nextStepInput}
                      onChange={(event) => setNextStepInput(event.target.value)}
                      rows={3}
                      placeholder="¿Qué harías a continuación?"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-900/35"
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
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>

              {result && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">Feedback automático</div>
                    <div className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-700">
                      {result.totalScore}/100
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div>Valores alterados: {result.feedback.alteredValues}</div>
                    <div>Hallazgo principal: {result.feedback.mainFinding}</div>
                    <div>Correlación clínica: {result.feedback.clinicalCorrelation}</div>
                    <div>Conducta inicial: {result.feedback.nextStep}</div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-slate-800">
                      {result.feedback.summary}
                    </div>
                  </div>

                  {showExplanation && (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-700">
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
