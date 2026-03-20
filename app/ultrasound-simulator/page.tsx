"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UltrasoundViewer from "@/components/advanced/UltrasoundViewer";
import { getAuthFetchHeaders } from "@/src/lib/clientAuth";
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
type GeneratedPreview = {
  imageDataUrl: string;
  mimeType: string;
  prompt: string;
  modelUsed: string;
  providerText: string;
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

function hash(value: string) {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 100000;
  }
  return total;
}

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
  const [casePool] = useState(ULTRASOUND_LIBRARY);
  const [caseSet, setCaseSet] = useState<UltrasoundCase>(ULTRASOUND_LIBRARY[0]);
  const [manualCaseId, setManualCaseId] = useState(ULTRASOUND_LIBRARY[0]?.id ?? "");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [justification, setJustification] = useState("");
  const [result, setResult] = useState<ReturnType<typeof evaluateUltrasoundCase> | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
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
        return filteredPool.find((item) => item.id === manualCaseId) ?? filteredPool[0] ?? ULTRASOUND_LIBRARY[0];
      }

      return (
        available[Math.floor(Math.random() * Math.max(available.length, 1))] ??
        available[0] ??
        filteredPool[0] ??
        ULTRASOUND_LIBRARY[0]
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

  useEffect(() => {
    setGeneratedPreview(null);
    setPreviewError("");
    setPreviewLoading(false);
  }, [caseSet.id]);

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

  async function generateAiPreview() {
    setPreviewLoading(true);
    setPreviewError("");

    try {
      const headers = await getAuthFetchHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/ai/generate-ultrasound-image", {
        method: "POST",
        headers,
        body: JSON.stringify({
          caseSet: {
            title: caseSet.title,
            category: caseSet.category,
            subcategory: caseSet.subcategory,
            clinicalSummary: caseSet.clinicalSummary,
            scanPlane: caseSet.scanPlane,
            keyFindings: caseSet.keyFindings,
            correctAnswer: caseSet.correctAnswer,
            patientProfile: {
              age: caseSet.patientProfile.age,
              sex: caseSet.patientProfile.sex,
              chiefComplaint: caseSet.patientProfile.chiefComplaint,
              gestationalAgeWeeks: caseSet.patientProfile.gestationalAgeWeeks,
            },
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(String(payload?.detail ?? "No se pudo generar la imagen de prueba."));
      }

      setGeneratedPreview(payload as GeneratedPreview);
    } catch (error: any) {
      setGeneratedPreview(null);
      setPreviewError(String(error?.message ?? "Error generando la imagen de prueba."));
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1600px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Simulador de ecografia</h1>
              <p className="mt-1 text-sm text-white/70">
                Practica obstetrica, ecocardiografia, renal, hepatobiliar y FAST / E-FAST con visor comparativo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {mode === "practice" ? "Modo practica" : "Modo evaluacion"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Biblioteca: {casePool.length} estudios
              </span>
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Como usar este modulo</div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {[
                ["Paso 1", "Compara referencia y caso"],
                ["Paso 2", "Ubica ecos, liquido libre, pleura o cavidades"],
                ["Paso 3", "Responde con la interpretacion"],
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
                <option value="obstetricia">Obstetrica</option>
                <option value="cardiaca">Ecocardiografia</option>
                <option value="renal">Renal</option>
                <option value="abdomen">Abdomen hepatobiliar</option>
                <option value="trauma">FAST / E-FAST</option>
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
                <option value="general">General</option>
                <option value="maternal">Materno-fetal</option>
                <option value="cardiac">Cardiaco</option>
                <option value="renal">Renal</option>
                <option value="abdominal">Abdominal</option>
                <option value="trauma">Trauma</option>
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
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 xl:grid-cols-[1.45fr_0.95fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-white/45">Caso actual</div>
              <div className="mt-1 text-base font-semibold text-white">{caseSet.title}</div>
              <div className="mt-1 text-sm text-white/70">{caseSet.clinicalSummary}</div>
              <div className="mt-1 text-sm text-white/65">
                {caseSet.patientProfile.name} · {caseSet.patientProfile.age} años ·{" "}
                {caseSet.patientProfile.sex === "female"
                  ? "Femenino"
                  : caseSet.patientProfile.sex === "male"
                  ? "Masculino"
                  : "No especificado"}
                {caseSet.patientProfile.gestationalAgeWeeks ? ` · ${caseSet.patientProfile.gestationalAgeWeeks} semanas` : ""}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
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
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              <div className="font-semibold text-white/85">Panel del estudio</div>
              <div className="mt-2">Subcategoria: {caseSet.subcategory.replaceAll("_", " ")}</div>
              <div className="mt-1">Plano: {caseSet.scanPlane}</div>
              <div className="mt-1">Transductor: {ultrasoundProbeLabel(caseSet.probe)}</div>
              <div className="mt-1">Pregunta: {caseSet.questionStem}</div>
              <div className="mt-1">Uso: {usageMode === "integrated_case" ? "Integrado al caso" : "Practica independiente"}</div>
              <div className="mt-1">Pool filtrado: {selectionMode === "contextual_random" ? contextualPool.length : filteredPool.length}</div>
              {selectionMode === "manual" && (
                <label className="mt-3 block text-white/70">
                  Estudio manual
                  <select
                    value={manualCaseId}
                    onChange={(event) => {
                      setManualCaseId(event.target.value);
                      const next = filteredPool.find((item) => item.id === event.target.value) ?? ULTRASOUND_LIBRARY[0];
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
                onClick={generateAiPreview}
                disabled={previewLoading}
                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50 hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-70"
              >
                {previewLoading ? "Generando preview IA..." : "Generar preview IA"}
              </button>
              <button
                type="button"
                onClick={loadNewCase}
                className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nuevo estudio
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.48fr)_380px] 2xl:grid-cols-[minmax(0,1.56fr)_410px]">
            <div className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Paso 1 · Observa la ventana</div>
                  <div className="mt-1 text-lg font-semibold text-white">{caseSet.patientProfile.chiefComplaint}</div>
                  <div className="mt-1 text-sm text-white/60">
                    Prioriza referencia, orientacion anatomica y hallazgo dominante antes de responder.
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

              {previewError ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                  {previewError}
                </div>
              ) : null}

              {generatedPreview ? (
                <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-black/25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Preview IA experimental</div>
                      <div className="mt-1 text-sm text-white/72">
                        Imagen sintetica generada con {generatedPreview.modelUsed}. Sirve para explorar estilo visual, no como referencia diagnostica.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGeneratedPreview(null)}
                      className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/75"
                    >
                      Ocultar preview
                    </button>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10 bg-[#050A11]">
                    <Image
                      src={generatedPreview.imageDataUrl}
                      alt={`Preview IA para ${caseSet.title}`}
                      width={960}
                      height={960}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <details className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/65">
                    <summary className="cursor-pointer text-white/80">Ver prompt usado</summary>
                    <div className="mt-2 whitespace-pre-wrap leading-5">{generatedPreview.prompt}</div>
                    {generatedPreview.providerText ? (
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-white/60">
                        Texto devuelto por el modelo: {generatedPreview.providerText}
                      </div>
                    ) : null}
                  </details>
                </div>
              ) : null}

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
        </main>
      </div>
    </div>
  );
}
