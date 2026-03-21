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
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1600px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Archivo de ultrasonido real</h1>
              <p className="mt-1 text-sm text-white/70">
                Banco curado de ventanas reales para lectura comparativa, orientación anatómica y feedback guiado.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {mode === "practice" ? "Modo practica" : "Modo evaluacion"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Banco real: {casePool.length} estudios
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {availableCategories.length} dominios activos
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_360px]">
            <div className="rounded-2xl border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(6,22,35,0.95),rgba(12,17,29,0.92))] p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Lectura sonográfica</div>
              <div className="mt-2 max-w-3xl text-lg font-semibold text-white">
                La selección activa usa solo estudios reales enlazados al visor principal.
              </div>
              <div className="mt-2 max-w-3xl text-sm text-white/68">
                Prioriza orientación, profundidad y hallazgo dominante antes de responder. La interfaz ya no mezcla previews sintéticos con el banco real.
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Ventana real", "Cada caso visible en el flujo activo tiene asset clínico enlazado."],
                  ["Comparación directa", "Referencia compacta y estudio principal con más área útil."],
                  ["Feedback clínico", "Hallazgos y conducta esperada dentro del mismo recorrido."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="mt-1 text-sm text-white/66">{body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B111D]/90 p-5">
              {hasFilteredCases ? (
                <>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Estudio activo</div>
                  <div className="mt-2 text-lg font-semibold text-white">{caseSet.title}</div>
                  <div className="mt-2 text-sm text-white/70">{caseSet.clinicalSummary}</div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/68">
                    {caseSet.patientProfile.name} · {caseSet.patientProfile.age} años ·{" "}
                    {caseSet.patientProfile.sex === "female"
                      ? "Femenino"
                      : caseSet.patientProfile.sex === "male"
                      ? "Masculino"
                      : "No especificado"}
                    {caseSet.patientProfile.gestationalAgeWeeks ? ` · ${caseSet.patientProfile.gestationalAgeWeeks} semanas` : ""}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-white/70">
                      {ultrasoundCategoryLabel(caseSet.category)}
                    </span>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-100">
                      {ultrasoundDifficultyLabel(caseSet.difficulty)}
                    </span>
                    <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                      {ultrasoundContextLabel(caseSet.context)}
                    </span>
                  </div>
                  <div className="mt-4 text-xs uppercase tracking-[0.14em] text-white/45">Plano y sonda</div>
                  <div className="mt-1 text-sm text-white/72">
                    {caseSet.scanPlane} · {ultrasoundProbeLabel(caseSet.probe)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Sin coincidencias</div>
                  <div className="mt-2 text-lg font-semibold text-white">No hay estudios reales con esos filtros</div>
                  <div className="mt-2 text-sm text-white/70">
                    Ajusta dominio, dificultad, contexto o búsqueda para volver al banco sonográfico disponible.
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                  >
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-[#0B111D]/85 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-white/45">Control del estudio</div>
                <div className="mt-1 text-sm text-white/68">
                  Filtra solo sobre el banco real enlazado y mantén la lectura enfocada por dominio o contexto.
                </div>
              </div>
              <button
                type="button"
                onClick={loadNewCase}
                disabled={!hasFilteredCases}
                className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nuevo estudio
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <label className="text-xs text-white/70">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as AdvancedMode);
                  setResult(null);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="practice">Practica guiada</option>
                <option value="evaluation">Evaluacion</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Uso
              <select
                value={usageMode}
                onChange={(event) => setUsageMode(event.target.value as UsageMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="standalone">Modulo independiente</option>
                <option value="integrated_case">Integrado al caso</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Seleccion
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
                <option value="basic">Basico</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Categoria
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              >
                <option value="all">Todas</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {ultrasoundCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-white/70">
              Contexto
              <select
                value={effectiveContext}
                onChange={(event) => setContextFilter(event.target.value as UltrasoundContext)}
                disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                {contextOptions.map((context) => (
                  <option key={context} value={context}>
                    {ultrasoundContextLabel(context)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-white/70">
              Buscar
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="embarazo, derrame, hidronefrosis, FAST..."
              />
            </label>

              {selectionMode === "manual" && hasFilteredCases && (
                <label className="text-xs text-white/70 md:col-span-2 xl:col-span-2 2xl:col-span-3">
                  Estudio manual
                  <select
                    value={manualCaseId}
                    onChange={(event) => {
                      setManualCaseId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? FALLBACK_ULTRASOUND_CASE;
                      setCaseSet(next);
                      clearInputs();
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

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                Pool activo: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}
              </span>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                Subcategoria: {caseSet.subcategory.replaceAll("_", " ")}
              </span>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1">
                Uso: {usageMode === "integrated_case" ? "Integrado al caso" : "Practica independiente"}
              </span>
            </div>
          </section>

          {hasFilteredCases ? (
            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px] 2xl:grid-cols-[minmax(0,1.78fr)_390px]">
            <div className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Paso 1 · Lee la ventana real</div>
                  <div className="mt-1 text-lg font-semibold text-white">{caseSet.patientProfile.chiefComplaint}</div>
                  <div className="mt-1 text-sm text-white/60">
                    Prioriza referencia, orientación anatómica y hallazgo dominante antes de responder.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-white/65">
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
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/75">
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

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-white/65">
                {mode === "practice"
                  ? `Pista visual: ${caseSet.feedback.highlightHint}`
                  : result
                  ? "Revision desbloqueada: ahora puedes activar los hallazgos para contrastar tu respuesta."
                  : "Modo evaluacion activo: valida primero para desbloquear la revision visual."}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0B111D]/90 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Paso 2 · Responde aqui</div>
                <div className="mt-2 text-lg font-semibold text-white">{caseSet.questionStem}</div>
                <div className="mt-1 text-sm text-white/65">
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
                          ? "border-cyan-300/35 bg-cyan-300/12 text-cyan-50"
                          : "border-white/10 bg-black/30 text-white/78 hover:bg-white/8"
                      }`}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs text-white/70">
                        {index + 1}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-xs text-white/60">Justificacion clinica</label>
                  <textarea
                    value={justification}
                    onChange={(event) => setJustification(event.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
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
                    className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-white/45">Hallazgos esperados</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
                  {caseSet.keyFindings.map((finding) => (
                    <li key={finding}>{finding}</li>
                  ))}
                </ul>
              </div>

              {result && (
                <div className="rounded-2xl border border-white/10 bg-[#0B111D]/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Paso 4 · Feedback</div>
                      <div className="mt-1 text-lg font-semibold text-white">{result.totalScore}/100</div>
                    </div>
                    <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      {result.outcome}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3 text-sm text-white/72">
                    <div>{result.feedback.answer}</div>
                    <div>{result.feedback.justification}</div>
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-emerald-100">
                      {caseSet.feedback.explanation}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-white/72">
                      Conducta esperada: {caseSet.feedback.expectedConduct}
                    </div>
                    <div className="text-white/80">{result.feedback.summary}</div>
                  </div>
                </div>
              )}
            </div>
            </section>
          ) : (
            <section className="mt-4 rounded-2xl border border-dashed border-white/15 bg-[#0B101A]/75 p-8 text-center">
              <div className="text-xs uppercase tracking-[0.16em] text-white/45">Banco temporalmente vacío</div>
              <div className="mt-3 text-2xl font-semibold text-white">No hay estudios reales que coincidan con esta búsqueda</div>
              <div className="mx-auto mt-3 max-w-2xl text-sm text-white/65">
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
                  className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-sm text-white/80"
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
