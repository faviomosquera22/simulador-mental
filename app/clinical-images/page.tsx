"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ClinicalImageViewer from "@/components/advanced/ClinicalImageViewer";
import {
  CLINICAL_IMAGES_LIBRARY,
  clinicalImageCategoryLabel,
  clinicalImageContextLabel,
  clinicalImageDifficultyLabel,
  evaluateClinicalImageCase,
  inferClinicalImageContext,
  type ClinicalImageCase,
  type ClinicalImageCategory,
  type ClinicalImageContext,
} from "@/src/lib/clinicalImagesModule";
import { normalizeText, type AdvancedDifficulty, type AdvancedMode } from "@/src/lib/advancedModuleUtils";

type SelectionMode = "manual" | "random" | "contextual_random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = AdvancedDifficulty | "all";
type CategoryFilter = ClinicalImageCategory | "all";

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

export default function ClinicalImagesPage() {
  const [mode, setMode] = useState<AdvancedMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("standalone");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [contextFilter, setContextFilter] = useState<ClinicalImageContext>("general");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [showHighlights, setShowHighlights] = useState(true);
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [casePool] = useState(CLINICAL_IMAGES_LIBRARY);
  const [caseSet, setCaseSet] = useState<ClinicalImageCase>(CLINICAL_IMAGES_LIBRARY[0]);
  const [manualCaseId, setManualCaseId] = useState(CLINICAL_IMAGES_LIBRARY[0]?.id ?? "");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [justification, setJustification] = useState("");
  const [result, setResult] = useState<ReturnType<typeof evaluateClinicalImageCase> | null>(null);

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  const effectiveContext = useMemo(() => {
    if (usageMode === "integrated_case" && activeCaseObj) {
      return inferClinicalImageContext(activeCaseObj);
    }
    return contextFilter;
  }, [activeCaseObj, contextFilter, usageMode]);

  const filteredPool = useMemo(() => {
    return casePool.filter((item) => {
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (search.trim()) {
        const haystack = normalizeText(
          [item.title, item.category, item.subcategory, item.clinicalSummary, item.tags.join(" ")].join(" ")
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

  const answerOptions = useMemo(() => {
    const pool = Array.from(new Set([caseSet.correctAnswer, ...caseSet.distractors, ...caseSet.optionPool]));
    return [...pool].sort((a, b) => hash(`${caseSet.id}:${a}`) - hash(`${caseSet.id}:${b}`));
  }, [caseSet]);

  const clearInputs = useCallback(() => {
    setSelectedAnswer("");
    setJustification("");
    setResult(null);
  }, []);

  const pickNextCase = useCallback(
    (excludeId?: string) => {
      const sourcePool = selectionMode === "contextual_random" ? contextualPool : filteredPool;
      const available = sourcePool.filter((item) => item.id !== excludeId);

      if (selectionMode === "manual") {
        return filteredPool.find((item) => item.id === manualCaseId) ?? filteredPool[0] ?? CLINICAL_IMAGES_LIBRARY[0];
      }

      return available[Math.floor(Math.random() * Math.max(available.length, 1))] ?? available[0] ?? filteredPool[0] ?? CLINICAL_IMAGES_LIBRARY[0];
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
    if (mode === "evaluation") {
      setShowHighlights(false);
    } else if (!result) {
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
      evaluateClinicalImageCase({
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
              <h1 className="text-2xl font-semibold">Imágenes clínicas</h1>
              <p className="mt-1 text-sm text-white/70">
                Interpreta radiología básica, lesiones, heridas, quemaduras y tiras visuales con feedback clínico.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Biblioteca: {casePool.length} casos
              </span>
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Cómo usar este módulo</div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {[
                ["Paso 1", "Observa la referencia y el caso"],
                ["Paso 2", "Busca la diferencia principal"],
                ["Paso 3", "Responde en el panel derecho"],
                ["Paso 4", "Valida y revisa feedback"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-1 text-sm text-white/70">{body}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0B111D]/85 p-4 md:grid-cols-2 xl:grid-cols-7">
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
                <option value="radiologia_torax">Radiología de tórax</option>
                <option value="fracturas">Fracturas</option>
                <option value="dermatologia">Dermatología</option>
                <option value="ulceras">Úlceras</option>
                <option value="heridas">Heridas</option>
                <option value="quemaduras">Quemaduras</option>
                <option value="tiras_visuales">Tiras visuales</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Contexto
              <select
                value={effectiveContext}
                onChange={(event) => setContextFilter(event.target.value as ClinicalImageContext)}
                disabled={usageMode === "integrated_case" && Boolean(activeCaseObj)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                <option value="general">General</option>
                <option value="respiratory">Respiratorio</option>
                <option value="trauma">Trauma</option>
                <option value="skin">Piel</option>
                <option value="wound">Heridas</option>
                <option value="burn">Quemaduras</option>
                <option value="screening">Tamizaje visual</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Buscar
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                placeholder="neumonía, úlcera, fractura..."
              />
            </label>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 xl:grid-cols-[1.35fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Caso actual</div>
              <div className="mt-1 text-base font-semibold text-white">{caseSet.title}</div>
              <div className="mt-1 text-sm text-white/70">{caseSet.clinicalSummary}</div>
              <div className="mt-1 text-sm text-white/65">
                {caseSet.patientProfile.name} · {caseSet.patientProfile.age} años ·{" "}
                {caseSet.patientProfile.sex === "female" ? "Femenino" : caseSet.patientProfile.sex === "male" ? "Masculino" : "No especificado"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-white/70">
                  {clinicalImageCategoryLabel(caseSet.category)}
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-cyan-100">
                  {clinicalImageDifficultyLabel(caseSet.difficulty)}
                </span>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                  {clinicalImageContextLabel(caseSet.context)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              <div className="font-semibold text-white/85">Panel del caso</div>
              <div className="mt-2">Subcategoría: {caseSet.subcategory.replaceAll("_", " ")}</div>
              <div className="mt-1">Pregunta: {caseSet.questionStem}</div>
              <div className="mt-1">Uso: {usageMode === "integrated_case" ? "Integrado al caso" : "Práctica independiente"}</div>
              <div className="mt-1">Pool filtrado: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}</div>
              {selectionMode === "manual" && (
                <label className="mt-3 block text-white/70">
                  Imagen manual
                  <select
                    value={manualCaseId}
                    onChange={(event) => {
                      setManualCaseId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? CLINICAL_IMAGES_LIBRARY[0];
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

            <div className="flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={loadNewCase}
                className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nueva imagen
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Paso 1 · Observa la imagen</div>
                  <div className="mt-1 text-lg font-semibold text-white">{caseSet.patientProfile.chiefComplaint}</div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-white/65">
                    Zoom
                    <input
                      type="range"
                      min="0.8"
                      max="1.6"
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
                      disabled={mode === "evaluation"}
                    />
                    Resaltar hallazgos
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <ClinicalImageViewer caseSet={caseSet} zoom={zoom} showHighlights={showHighlights && mode === "practice"} />
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-white/65">
                {mode === "practice"
                  ? `Pista visual: ${caseSet.feedback.highlightHint}`
                  : "Modo evaluación activo: la imagen se muestra sin pistas ni resaltados."}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#0B111D]/90 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Paso 2 · Responde aquí</div>
                <div className="mt-2 text-lg font-semibold text-white">{caseSet.questionStem}</div>
                <div className="mt-1 text-sm text-white/65">
                  Selecciona una sola interpretación y luego escribe brevemente por qué.
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
                  <label className="text-xs text-white/60">Justificación clínica</label>
                  <textarea
                    value={justification}
                    onChange={(event) => setJustification(event.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                    placeholder="Describe qué hallazgo observas y por qué cambia tu interpretación."
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
        </main>
      </div>
    </div>
  );
}
