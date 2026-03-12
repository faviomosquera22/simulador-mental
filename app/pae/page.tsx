"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  PAE_TEMPLATE_LIBRARY,
  type PaeDiagnosis,
  type PaeMode,
  type PaeOutcome,
  type PaeTemplate,
  getCueTypeLabel,
  getPaeModeLabel,
  getPaeTemplateById,
  getPriorityTone,
  inferPaeContextFromCase,
  pickContextualPaeTemplate,
  pickRandomPaeTemplate,
  suggestDiagnoses,
  suggestInterventions,
  suggestOutcomes,
  validatePaeDraft,
} from "@/src/lib/paeIntelligent";

type Stage = 1 | 2 | 3 | 4 | 5 | 6;
type UsageMode = "integrated_case" | "standalone";
type SelectionMode = "manual" | "random" | "contextual_random";

function parseActiveCase(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function stageLabel(stage: Stage) {
  if (stage === 1) return "Valoración";
  if (stage === 2) return "Diagnóstico";
  if (stage === 3) return "Resultados";
  if (stage === 4) return "Intervenciones";
  if (stage === 5) return "Fundamentación";
  return "Evaluación";
}

function contextLabel(context: string) {
  if (context === "respiratory") return "Respiratorio";
  if (context === "infection") return "Infeccioso";
  if (context === "metabolic") return "Metabólico";
  if (context === "renal") return "Renal";
  if (context === "postoperative") return "Postoperatorio";
  return "General";
}

function toggleSelection(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export default function PaePage() {
  const [mode, setMode] = useState<PaeMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("integrated_case");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [stage, setStage] = useState<Stage>(1);
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [template, setTemplate] = useState<PaeTemplate>(PAE_TEMPLATE_LIBRARY[0]);
  const [manualTemplateId, setManualTemplateId] = useState(PAE_TEMPLATE_LIBRARY[0]?.id ?? "");

  const [internName, setInternName] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [clinicalRecord, setClinicalRecord] = useState("");

  const [selectedCueIds, setSelectedCueIds] = useState<string[]>([]);
  const [subjectiveNotes, setSubjectiveNotes] = useState("");
  const [objectiveNotes, setObjectiveNotes] = useState("");
  const [selectedDiagnosisIds, setSelectedDiagnosisIds] = useState<string[]>([]);
  const [diagnosisJustification, setDiagnosisJustification] = useState("");
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([]);
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<string[]>([]);
  const [rationaleText, setRationaleText] = useState("");
  const [evaluationText, setEvaluationText] = useState("");
  const [validationVisible, setValidationVisible] = useState(false);

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  const useIntegratedContext = usageMode === "integrated_case" && activeCaseObj;

  const resetDraft = useCallback(() => {
    setStage(1);
    setSelectedCueIds([]);
    setSubjectiveNotes("");
    setObjectiveNotes("");
    setSelectedDiagnosisIds([]);
    setDiagnosisJustification("");
    setSelectedOutcomeIds([]);
    setSelectedInterventionIds([]);
    setRationaleText("");
    setEvaluationText("");
    setValidationVisible(false);
  }, []);

  const pickTemplate = useCallback(
    (excludeId?: string) => {
      if (selectionMode === "manual") {
        const manual = getPaeTemplateById(manualTemplateId);
        return manual ?? PAE_TEMPLATE_LIBRARY[0];
      }

      if (selectionMode === "contextual_random" && useIntegratedContext) {
        return pickContextualPaeTemplate(activeCaseObj, excludeId) ?? PAE_TEMPLATE_LIBRARY[0];
      }

      return pickRandomPaeTemplate(excludeId) ?? PAE_TEMPLATE_LIBRARY[0];
    },
    [activeCaseObj, manualTemplateId, selectionMode, useIntegratedContext]
  );

  useEffect(() => {
    const next = pickTemplate();
    if (!next) return;
    setTemplate(next);
    if (selectionMode === "manual") {
      setManualTemplateId(next.id);
    }
    resetDraft();
  }, [pickTemplate, resetDraft, selectionMode]);

  const diagnosisSuggestions = useMemo(
    () =>
      suggestDiagnoses({
        template,
        selectedCueIds,
        valuationText: [subjectiveNotes, objectiveNotes].join(" "),
      }),
    [template, selectedCueIds, subjectiveNotes, objectiveNotes]
  );

  const outcomeSuggestions = useMemo(
    () => suggestOutcomes(template, selectedDiagnosisIds),
    [template, selectedDiagnosisIds]
  );

  const interventionSuggestions = useMemo(
    () => suggestInterventions(template, selectedDiagnosisIds),
    [template, selectedDiagnosisIds]
  );

  const draftValidation = useMemo(
    () =>
      validatePaeDraft({
        template,
        draft: {
          selectedCueIds,
          selectedDiagnosisIds,
          selectedOutcomeIds,
          selectedInterventionIds,
          rationaleText,
          evaluationText,
        },
      }),
    [
      evaluationText,
      rationaleText,
      selectedCueIds,
      selectedDiagnosisIds,
      selectedInterventionIds,
      selectedOutcomeIds,
      template,
    ]
  );

  const diagnosisMap = useMemo(() => {
    const map = new Map<string, PaeDiagnosis>();
    for (const item of template.diagnoses) {
      map.set(item.id, item);
    }
    return map;
  }, [template.diagnoses]);

  function chooseNewTemplate() {
    const next = pickTemplate(template.id);
    if (!next) return;
    setTemplate(next);
    if (selectionMode === "manual") {
      setManualTemplateId(next.id);
    }
    resetDraft();
  }

  function goNext() {
    setStage((prev) => (prev < 6 ? ((prev + 1) as Stage) : prev));
  }

  function goPrev() {
    setStage((prev) => (prev > 1 ? ((prev - 1) as Stage) : prev));
  }

  function rowByDiagnosis(diagnosisId: string) {
    const diagnosis = diagnosisMap.get(diagnosisId);
    if (!diagnosis) return null;

    const outcomes = template.outcomes.filter(
      (item) => item.diagnosisId === diagnosisId && selectedOutcomeIds.includes(item.id)
    );
    const interventions = template.interventions.filter(
      (item) =>
        item.diagnosisId === diagnosisId && selectedInterventionIds.includes(item.id)
    );
    return {
      diagnosis,
      outcomes,
      interventions,
    };
  }

  const mappedRows = selectedDiagnosisIds.map(rowByDiagnosis).filter(Boolean) as Array<{
    diagnosis: PaeDiagnosis;
    outcomes: PaeOutcome[];
    interventions: ReturnType<typeof suggestInterventions>;
  }>;

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1660px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">PAE inteligente</h1>
              <p className="mt-1 text-sm text-white/70">
                Construye el Proceso de Atención de Enfermería en 6 etapas con asistencia clínica y validación de coherencia.
              </p>
            </div>
            <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              {getPaeModeLabel(mode)}
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0D121E]/90 p-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs text-white/70">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as PaeMode);
                  setValidationVisible(false);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
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
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="integrated_case">Desde caso clínico</option>
                <option value="standalone">Módulo independiente</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Selección
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="contextual_random">Aleatorio contextual</option>
                <option value="random">Aleatorio</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            <label className="text-xs text-white/70 xl:col-span-2">
              Plantilla PAE
              <select
                value={manualTemplateId}
                onChange={(event) => {
                  setManualTemplateId(event.target.value);
                  const next = getPaeTemplateById(event.target.value);
                  if (next) {
                    setTemplate(next);
                    resetDraft();
                  }
                }}
                disabled={selectionMode !== "manual"}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {PAE_TEMPLATE_LIBRARY.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={chooseNewTemplate}
                className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
              >
                Nueva plantilla
              </button>
              <Link
                href="/laboratory"
                className="rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
              >
                Ir a Laboratorio
              </Link>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="grid gap-2 xl:grid-cols-[1.2fr_1fr_auto]">
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-white/45">Caso / escenario</div>
                <div className="mt-1 text-lg font-semibold">{template.name}</div>
                <div className="text-sm text-white/70">
                  {template.patient.name} · {template.patient.age} años ·{" "}
                  {template.patient.sex === "female" ? "Femenino" : template.patient.sex === "male" ? "Masculino" : "No especificado"}
                </div>
                <div className="text-sm text-white/70">Motivo: {template.patient.chiefComplaint}</div>
                {useIntegratedContext && (
                  <div className="mt-1 text-xs text-cyan-100">
                    Contexto inferido desde caso activo: {contextLabel(inferPaeContextFromCase(activeCaseObj))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A101A] p-3 text-xs text-white/70">
                <div className="font-semibold text-white/85">Referencia visual PAE</div>
                <div className="mt-1">
                  Estructura inspirada en formato: Diagnóstico, Resultados, Intervenciones y Evaluación con campos de identificación clínica.
                </div>
                <div className="mt-2 text-white/60">
                  Diagnóstico médico: {template.patient.medicalDiagnosis}
                </div>
                <div className="mt-1 text-white/60">
                  Tratamiento: {template.patient.pharmacologicGroup}
                </div>
                <div className="mt-1 text-white/60">Dieta: {template.patient.dietType}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A101A] p-3 text-xs text-white/70">
                <div className="font-semibold text-white/85">Progreso</div>
                <div className="mt-2">Etapa actual: {stage}/6</div>
                <div className="mt-1">Valoración: {selectedCueIds.length} hallazgos</div>
                <div className="mt-1">Diagnósticos: {selectedDiagnosisIds.length}</div>
                <div className="mt-1">Resultados: {selectedOutcomeIds.length}</div>
                <div className="mt-1">Intervenciones: {selectedInterventionIds.length}</div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((raw) => {
              const current = raw as Stage;
              const active = current === stage;
              return (
                <button
                  key={raw}
                  type="button"
                  onClick={() => setStage(current)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-black/25 text-white/75 hover:bg-white/10"
                  }`}
                >
                  <div className="text-xs text-white/55">Etapa {raw}</div>
                  <div className="font-medium">{stageLabel(current)}</div>
                </button>
              );
            })}
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <article className="rounded-2xl border border-white/10 bg-[#0B101A]/90 p-4">
              {stage === 1 && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 1 · Valoración</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Selecciona hallazgos subjetivos/objetivos y completa notas clínicas.
                  </p>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {template.assessmentCues.map((cue) => {
                      const selected = selectedCueIds.includes(cue.id);
                      return (
                        <label
                          key={cue.id}
                          className={`rounded-xl border p-3 text-sm transition ${
                            selected
                              ? "border-cyan-400/35 bg-cyan-400/10 text-cyan-100"
                              : "border-white/10 bg-black/25 text-white/80"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedCueIds((prev) => toggleSelection(prev, cue.id))
                            }
                            className="mr-2 h-4 w-4 align-middle"
                          />
                          <span className="align-middle">{cue.label}</span>
                          <span className="mt-1 block text-xs text-white/60">{getCueTypeLabel(cue.type)}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <label className="text-xs text-white/70">
                      Datos subjetivos (narrativa)
                      <textarea
                        value={subjectiveNotes}
                        onChange={(event) => setSubjectiveNotes(event.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                      />
                    </label>
                    <label className="text-xs text-white/70">
                      Datos objetivos (exploración/signos)
                      <textarea
                        value={objectiveNotes}
                        onChange={(event) => setObjectiveNotes(event.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                      />
                    </label>
                  </div>
                </div>
              )}

              {stage === 2 && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 2 · Diagnóstico de enfermería</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Elige uno o más diagnósticos en función de la valoración.
                  </p>

                  <div className="mt-4 space-y-2">
                    {diagnosisSuggestions.map((item) => {
                      const selected = selectedDiagnosisIds.includes(item.diagnosis.id);
                      return (
                        <label
                          key={item.diagnosis.id}
                          className={`block rounded-xl border p-3 ${
                            selected ? "border-cyan-400/35 bg-cyan-400/10" : "border-white/10 bg-black/25"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-white/90">
                              {item.diagnosis.diagnosticLabel}
                            </div>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getPriorityTone(
                                item.diagnosis.priority
                              )}`}
                            >
                              Prioridad {item.diagnosis.priority === "high" ? "alta" : item.diagnosis.priority}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            {item.diagnosis.domain} · {item.diagnosis.classLabel}
                          </div>
                          {mode === "practice" && (
                            <div className="mt-1 text-xs text-cyan-100/90">
                              Compatibilidad sugerida: {item.score}/100 · hallazgos coincidentes {item.matchedCueCount}
                            </div>
                          )}
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setSelectedDiagnosisIds((prev) =>
                                  toggleSelection(prev, item.diagnosis.id)
                                )
                              }
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm text-white/85">Seleccionar diagnóstico</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <label className="mt-4 block text-xs text-white/70">
                    Justificación diagnóstica
                    <textarea
                      value={diagnosisJustification}
                      onChange={(event) => setDiagnosisJustification(event.target.value)}
                      rows={4}
                      placeholder="Justifica por qué elegiste estos diagnósticos."
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>
              )}

              {stage === 3 && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 3 · Resultados esperados</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Define metas e indicadores relacionados con cada diagnóstico.
                  </p>

                  {!selectedDiagnosisIds.length && (
                    <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                      Selecciona diagnósticos en la etapa anterior para habilitar resultados sugeridos.
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    {outcomeSuggestions.map((outcome) => {
                      const selected = selectedOutcomeIds.includes(outcome.id);
                      return (
                        <label
                          key={outcome.id}
                          className={`block rounded-xl border p-3 ${
                            selected ? "border-emerald-400/35 bg-emerald-400/10" : "border-white/10 bg-black/25"
                          }`}
                        >
                          <div className="text-sm font-semibold text-white/90">{outcome.label}</div>
                          <div className="mt-1 text-xs text-white/60">
                            Meta: {outcome.target}
                          </div>
                          <div className="mt-1 text-xs text-white/70">
                            Indicadores: {outcome.indicators.join(" · ")}
                          </div>
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setSelectedOutcomeIds((prev) => toggleSelection(prev, outcome.id))
                              }
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm text-white/85">Seleccionar resultado</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {stage === 4 && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 4 · Intervenciones</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Selecciona intervenciones coherentes con diagnóstico y objetivos.
                  </p>

                  {!selectedDiagnosisIds.length && (
                    <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                      Selecciona diagnósticos para habilitar intervenciones sugeridas.
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    {interventionSuggestions.map((intervention) => {
                      const selected = selectedInterventionIds.includes(intervention.id);
                      return (
                        <label
                          key={intervention.id}
                          className={`block rounded-xl border p-3 ${
                            selected ? "border-sky-400/35 bg-sky-400/10" : "border-white/10 bg-black/25"
                          }`}
                        >
                          <div className="text-sm font-semibold text-white/90">{intervention.label}</div>
                          <div className="mt-1 text-xs text-white/70">
                            Actividades: {intervention.activities.join(" · ")}
                          </div>
                          {mode === "practice" && (
                            <div className="mt-1 text-xs text-cyan-100/90">
                              Fundamento: {intervention.rationale}
                            </div>
                          )}
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setSelectedInterventionIds((prev) =>
                                  toggleSelection(prev, intervention.id)
                                )
                              }
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm text-white/85">Seleccionar intervención</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {stage === 5 && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 5 · Fundamentación</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Resume el razonamiento clínico del PAE y por qué tus decisiones son coherentes.
                  </p>
                  <label className="mt-3 block text-xs text-white/70">
                    Fundamentación clínica
                    <textarea
                      value={rationaleText}
                      onChange={(event) => setRationaleText(event.target.value)}
                      rows={8}
                      placeholder="Relaciona valoración + diagnóstico + resultados + intervenciones."
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>
              )}

              {stage === 6 && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 6 · Evaluación</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Registra evolución y cumplimiento de objetivos para cerrar el PAE.
                  </p>

                  <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/85">
                    Criterios sugeridos: {template.evaluationCriteria.join(" · ")}
                  </div>

                  <label className="mt-3 block text-xs text-white/70">
                    Evaluación final
                    <textarea
                      value={evaluationText}
                      onChange={(event) => setEvaluationText(event.target.value)}
                      rows={6}
                      placeholder="Describe evolución clínica y grado de cumplimiento de metas."
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={stage === 1}
                  className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={stage === 6}
                  className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 disabled:opacity-40"
                >
                  Siguiente
                </button>
                <button
                  type="button"
                  onClick={() => setValidationVisible(true)}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Validar PAE
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90"
                >
                  Reiniciar
                </button>
              </div>
            </article>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#0B121F]/90 p-4">
                <h3 className="text-sm font-semibold text-white">Datos de identificación</h3>
                <div className="mt-3 grid gap-2">
                  <label className="text-xs text-white/70">
                    Cama #
                    <input
                      type="text"
                      value={bedNumber}
                      onChange={(event) => setBedNumber(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-white/70">
                    N° Historia clínica
                    <input
                      type="text"
                      value={clinicalRecord}
                      onChange={(event) => setClinicalRecord(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-white/70">
                    Nombre del interno/a
                    <input
                      type="text"
                      value={internName}
                      onChange={(event) => setInternName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>
                </div>
              </div>

              {mode === "practice" && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <h3 className="text-sm font-semibold">Asistencia inteligente</h3>
                  <ul className="mt-2 space-y-1 text-xs text-white/75">
                    {template.automaticFeedback.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationVisible && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Coherencia del PAE</h3>
                    <span className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-100">
                      {draftValidation.totalScore}/100
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-white/70">{draftValidation.summary}</div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">
                      Valoración: {draftValidation.rubric.assessment}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">
                      Diagnóstico: {draftValidation.rubric.diagnosis}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">
                      Resultados: {draftValidation.rubric.outcomes}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">
                      Intervenciones: {draftValidation.rubric.interventions}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">
                      Fundamentación: {draftValidation.rubric.rationale}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">
                      Evaluación: {draftValidation.rubric.evaluation}
                    </div>
                  </div>

                  {draftValidation.criticalGaps.length > 0 && (
                    <div className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 p-2 text-xs text-red-100">
                      {draftValidation.criticalGaps.map((gap) => (
                        <div key={gap}>• {gap}</div>
                      ))}
                    </div>
                  )}

                  {draftValidation.notices.length > 0 && (
                    <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-2 text-xs text-amber-100">
                      {draftValidation.notices.map((notice) => (
                        <div key={notice}>• {notice}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </aside>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-[#0A0F18]/90 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Formato final de Plan de Atención de Enfermería</h2>
              <span className="text-xs text-white/55">Vista resumen editable</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
                  <tr>
                    <th className="px-3 py-2 text-left">Diagnóstico de Enfermería</th>
                    <th className="px-3 py-2 text-left">Resultados de Enfermería</th>
                    <th className="px-3 py-2 text-left">Intervenciones de Enfermería</th>
                    <th className="px-3 py-2 text-left">Evaluación</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.map((row) => (
                    <tr key={row.diagnosis.id} className="border-t border-white/10 align-top">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-white/90">{row.diagnosis.diagnosticLabel}</div>
                        <div className="text-xs text-white/60">{row.diagnosis.domain}</div>
                        <div className="text-xs text-white/60">{row.diagnosis.classLabel}</div>
                      </td>
                      <td className="px-3 py-3">
                        {row.outcomes.length ? (
                          row.outcomes.map((outcome) => (
                            <div key={outcome.id} className="mb-2 rounded-lg border border-white/10 bg-black/25 p-2">
                              <div className="font-medium text-white/90">{outcome.label}</div>
                              <div className="text-xs text-white/65">Meta: {outcome.target}</div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-white/50">Sin resultado seleccionado</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {row.interventions.length ? (
                          row.interventions.map((intervention) => (
                            <div key={intervention.id} className="mb-2 rounded-lg border border-white/10 bg-black/25 p-2">
                              <div className="font-medium text-white/90">{intervention.label}</div>
                              <div className="text-xs text-white/65">
                                {intervention.activities.slice(0, 2).join(" · ")}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-white/50">Sin intervención seleccionada</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-white/70">
                          {evaluationText.trim() || "Pendiente de completar evaluación final."}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!mappedRows.length && (
                    <tr className="border-t border-white/10">
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-white/60">
                        Completa etapas 2, 3 y 4 para generar la matriz final del PAE.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-white/65 md:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                Diagnóstico médico: {template.patient.medicalDiagnosis}
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                Tratamiento farmacológico: {template.patient.pharmacologicGroup}
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                Tipo de dieta: {template.patient.dietType}
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                Interno/a: {internName.trim() || "—"}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
