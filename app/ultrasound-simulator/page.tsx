"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UltrasoundViewer from "@/components/advanced/UltrasoundViewer";
import {
  ULTRASOUND_LIBRARY,
  evaluateUltrasoundCase,
  inferUltrasoundContext,
  ultrasoundCategoryLabel,
  ultrasoundContextLabel,
  ultrasoundDifficultyLabel,
  ultrasoundProbeLabel,
  type UltrasoundCase,
  type UltrasoundCategory,
  type UltrasoundContext,
} from "@/src/lib/ultrasoundModule";
import { normalizeText, type AdvancedDifficulty, type AdvancedMode } from "@/src/lib/advancedModuleUtils";

type SelectionMode = "manual" | "random" | "contextual_random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = AdvancedDifficulty | "all";
type CategoryFilter = UltrasoundCategory | "all";

function parseActiveCase(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function hash(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 100000;
  }
  return total;
}

const REAL_ULTRASOUND_LIBRARY = ULTRASOUND_LIBRARY.filter((item) => Boolean(item.realImageAssets?.caseSrc));
const FALLBACK_ULTRASOUND_CASE = REAL_ULTRASOUND_LIBRARY[0] ?? ULTRASOUND_LIBRARY[0];

export default function UltrasoundSimulatorPage() {
  const [mode, setMode] = useState<AdvancedMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("standalone");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [contextFilter, setContextFilter] = useState<UltrasoundContext>("general");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [showHighlights, setShowHighlights] = useState(true);
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const casePool = REAL_ULTRASOUND_LIBRARY;
  const [caseSet, setCaseSet] = useState<UltrasoundCase>(FALLBACK_ULTRASOUND_CASE);
  const [manualCaseId, setManualCaseId] = useState(FALLBACK_ULTRASOUND_CASE?.id ?? "");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [justification, setJustification] = useState("");
  const [result, setResult] = useState<ReturnType<typeof evaluateUltrasoundCase> | null>(null);
  const canReviewHighlights = mode === "practice" || Boolean(result);

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  const effectiveContext = useMemo(() => {
    if (usageMode === "integrated_case" && activeCaseObj) {
      return inferUltrasoundContext(activeCaseObj);
    }
    return contextFilter;
  }, [activeCaseObj, contextFilter, usageMode]);

  const availableCategories = useMemo(
    () => Array.from(new Set(casePool.map((item) => item.category))) as UltrasoundCategory[],
    [casePool]
  );

  const availableContexts = useMemo(
    () => Array.from(new Set(casePool.map((item) => item.context))) as UltrasoundContext[],
    [casePool]
  );

  const contextOptions = useMemo(
    () => ["general", ...availableContexts.filter((context) => context !== "general")] as UltrasoundContext[],
    [availableContexts]
  );

  const filteredPool = useMemo(() => {
    return casePool.filter((item) => {
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (search.trim()) {
        const haystack = normalizeText(
          [
            item.title,
            item.category,
            item.subcategory,
            item.clinicalSummary,
            item.scanPlane,
            item.tags.join(" "),
          ].join(" ")
        );
        if (!haystack.includes(normalizeText(search))) return false;
      }
      return true;
    });
  }, [casePool, categoryFilter, difficultyFilter, search]);

  const contextualPool = useMemo(() => {
    const contextual = filteredPool.filter((item) => item.context === effectiveContext);
    return contextual.length ? contextual : filteredPool;
  }, [effectiveContext, filteredPool]);

  const hasFilteredCases = filteredPool.length > 0;

  const answerOptions = useMemo(() => {
    const pool = Array.from(new Set([caseSet.correctAnswer, ...caseSet.distractors, ...caseSet.optionPool]));
    return [...pool].sort((a, b) => hash(`${caseSet.id}:${a}`) - hash(`${caseSet.id}:${b}`));
  }, [caseSet]);

  const clearInputs = useCallback(() => {
    setSelectedAnswer("");
    setJustification("");
    setResult(null);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectionMode("contextual_random");
    setDifficultyFilter("all");
    setCategoryFilter("all");
    setContextFilter("general");
    setSearch("");
    clearInputs();
  }, [clearInputs]);

  const pickNextCase = useCallback(
    (excludeId?: string) => {
      const sourcePool = selectionMode === "contextual_random" ? contextualPool : filteredPool;
      const available = sourcePool.filter((item) => item.id !== excludeId);

      if (selectionMode === "manual") {
        return filteredPool.find((item) => item.id === manualCaseId) ?? filteredPool[0] ?? FALLBACK_ULTRASOUND_CASE;
      }

      return (
        available[Math.floor(Math.random() * Math.max(available.length, 1))] ??
        available[0] ??
        filteredPool[0] ??
        FALLBACK_ULTRASOUND_CASE
      );
    },
    [contextualPool, filteredPool, manualCaseId, selectionMode]
  );

  useEffect(() => {
    const next = pickNextCase();
    if (!next) return;
    setCaseSet(next);
    if (selectionMode === "manual") setManualCaseId(next.id);
    clearInputs();
  }, [clearInputs, pickNextCase, selectionMode]);

  useEffect(() => {
    if (mode === "evaluation" && !result) {
      setShowHighlights(false);
    } else if (mode === "practice" && !result) {
      setShowHighlights(true);
    }
  }, [mode, result]);

  useEffect(() => {
    if (mode === "evaluation" && result) {
      setShowHighlights(true);
    }
  }, [mode, result]);

  function loadNewCase() {
    const next = pickNextCase(caseSet.id);
    if (!next) return;
    setCaseSet(next);
    if (selectionMode === "manual") setManualCaseId(next.id);
    clearInputs();
  }

  function validate() {
    setResult(
      evaluateUltrasoundCase({
        caseSet,
        selectedAnswer,
        justification,
      })
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1600px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Archivo de ultrasonido real</h1>
              <p className="mt-1 text-sm text-slate-600">
                Banco curado de ventanas reales para lectura comparativa, orientación anatómica y feedback guiado.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo practica" : "Modo evaluacion"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Banco real: {casePool.length} estudios
              </span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {availableCategories.length} dominios activos
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_360px]">
            <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Control de caso</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Filtra solo sobre el banco real enlazado y mantén la lectura enfocada por dominio o contexto.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadNewCase}
                  disabled={!hasFilteredCases}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
                >
                  Nuevo estudio
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                <label className="text-xs text-slate-600">
                  Modo
                  <select
                    value={mode}
                    onChange={(event) => {
                      setMode(event.target.value as AdvancedMode);
                      setResult(null);
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="practice">Practica guiada</option>
                    <option value="evaluation">Evaluacion</option>
                  </select>
                </label>

                <label className="text-xs text-slate-600">
                  Uso
                  <select
                    value={usageMode}
                    onChange={(event) => setUsageMode(event.target.value as UsageMode)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="standalone">Modulo independiente</option>
                    <option value="integrated_case">Integrado al caso</option>
                  </select>
                </label>

                <label className="text-xs text-slate-600">
                  Seleccion
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
                    <option value="basic">Basico</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </label>

                <label className="text-xs text-slate-600">
                  Categoria
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="all">Todas</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {ultrasoundCategoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate-600">
                  Contexto
                  <select
                    value={effectiveContext}
                    onChange={(event) => setContextFilter(event.target.value as UltrasoundContext)}
                    disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
                  >
                    {contextOptions.map((context) => (
                      <option key={context} value={context}>
                        {ultrasoundContextLabel(context)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate-600">
                  Buscar
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                    placeholder="embarazo, derrame, hidronefrosis, FAST..."
                  />
                </label>

                {selectionMode === "manual" && hasFilteredCases && (
                  <label className="text-xs text-slate-600 md:col-span-2 xl:col-span-2 2xl:col-span-3">
                    Estudio manual
                    <select
                      value={manualCaseId}
                      onChange={(event) => {
                        setManualCaseId(event.target.value);
                        const next = filteredPool.find((item) => item.id === event.target.value) ?? FALLBACK_ULTRASOUND_CASE;
                        setCaseSet(next);
                        clearInputs();
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

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Pool activo: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Subcategoría: {caseSet.subcategory.replaceAll("_", " ")}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Uso: {usageMode === "integrated_case" ? "Integrado al caso" : "Práctica independiente"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/82 p-5">
              {hasFilteredCases ? (
                <>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Estudio activo</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{caseSet.title}</div>
                  <div className="mt-2 text-sm text-slate-600">{caseSet.clinicalSummary}</div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                    {caseSet.patientProfile.name} · {caseSet.patientProfile.age} años ·{" "}
                    {caseSet.patientProfile.sex === "female"
                      ? "Femenino"
                      : caseSet.patientProfile.sex === "male"
                      ? "Masculino"
                      : "No especificado"}
                    {caseSet.patientProfile.gestationalAgeWeeks ? ` · ${caseSet.patientProfile.gestationalAgeWeeks} semanas` : ""}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                      {ultrasoundCategoryLabel(caseSet.category)}
                    </span>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-700">
                      {ultrasoundDifficultyLabel(caseSet.difficulty)}
                    </span>
                    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-700">
                      {ultrasoundContextLabel(caseSet.context)}
                    </span>
                  </div>
                  <div className="mt-4 text-xs uppercase tracking-[0.14em] text-slate-400">Plano y sonda</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {caseSet.scanPlane} · {ultrasoundProbeLabel(caseSet.probe)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Sin coincidencias</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">No hay estudios reales con esos filtros</div>
                  <div className="mt-2 text-sm text-slate-600">
                    Ajusta dominio, dificultad, contexto o búsqueda para volver al banco sonográfico disponible.
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
                  >
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>
          </section>

          {hasFilteredCases ? (
            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px] 2xl:grid-cols-[minmax(0,1.78fr)_390px]">
            <div className="rounded-2xl border border-slate-200 bg-white/82 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Paso 1 · Lee la ventana real</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{caseSet.patientProfile.chiefComplaint}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Prioriza referencia, orientación anatómica y hallazgo dominante antes de responder.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-500">
                    Zoom
                    <input
                      type="range"
                      min="0.85"
                      max="1.45"
                      step="0.05"
                      value={zoom}
                      onChange={(event) => setZoom(Number(event.target.value))}
                      className="mt-2 w-36 accent-cyan-300"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={showHighlights}
                      onChange={(event) => setShowHighlights(event.target.checked)}
                      disabled={!canReviewHighlights}
                    />
                    {canReviewHighlights ? "Resaltar hallazgos" : "Disponible tras validar"}
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <UltrasoundViewer caseSet={caseSet} zoom={zoom} showHighlights={showHighlights && canReviewHighlights} />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                {mode === "practice"
                  ? `Pista visual: ${caseSet.feedback.highlightHint}`
                  : result
                  ? "Revision desbloqueada: ahora puedes activar los hallazgos para contrastar tu respuesta."
                  : "Modo evaluacion activo: valida primero para desbloquear la revision visual."}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-cyan-700">Paso 2 · Responde aqui</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{caseSet.questionStem}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Selecciona la interpretacion mas precisa y justifica con hallazgos sonograficos.
                </div>

                <div className="mt-4 space-y-2">
                  {answerOptions.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedAnswer(option)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                        selectedAnswer === option
                          ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-700"
                          : "border-slate-200 bg-slate-50 text-slate-900/78 hover:bg-slate-50"
                      }`}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white/78 text-xs text-slate-600">
                        {index + 1}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-xs text-slate-500">Justificacion clinica</label>
                  <textarea
                    value={justification}
                    onChange={(event) => setJustification(event.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none"
                    placeholder="Describe que zona observas, que cambia respecto a la referencia y por que importa."
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={validate}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Paso 3 · Validar respuesta
                  </button>
                  <button
                    type="button"
                    onClick={clearInputs}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Hallazgos esperados</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {caseSet.keyFindings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              </div>

              {result && (
                <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-cyan-700">Paso 4 · Feedback</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{result.totalScore}/100</div>
                    </div>
                    <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-700">
                      {result.outcome}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3 text-sm text-slate-600">
                    <div>{result.feedback.answer}</div>
                    <div>{result.feedback.justification}</div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-emerald-700">
                      {caseSet.feedback.explanation}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                      Conducta esperada: {caseSet.feedback.expectedConduct}
                    </div>
                    <div className="text-slate-700">{result.feedback.summary}</div>
                  </div>
                </div>
              )}
            </div>
            </section>
          ) : (
            <section className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/82 p-8 text-center">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Banco temporalmente vacío</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">No hay estudios reales que coincidan con esta búsqueda</div>
              <div className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
                El simulador ya no mezcla ventanas sintéticas con el banco curado. Si el filtro deja el pool en cero, ocultamos el estudio previo para evitar una lectura equivocada.
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                  Restablecer filtros
                </button>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                >
                  Limpiar búsqueda
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
