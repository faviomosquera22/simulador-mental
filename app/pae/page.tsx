"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  NIC_LIBRARY,
  NOC_LIBRARY,
  NANDA_LIBRARY,
  PAE_TEMPLATE_LIBRARY,
  type NandaDiagnosis,
  type NicIntervention,
  type NocOutcome,
  type PaeDiagnosis,
  type PaeIntervention,
  type PaeMode,
  type PaeOutcome,
  type PaeTemplate,
  type PaeTemplateContextFilter,
  getCueTypeLabel,
  getNandaByContext,
  getNicByNandaIds,
  getNocByNandaIds,
  getPaeContextLabel,
  getPaeModeLabel,
  getPaeTemplateById,
  getPriorityTone,
  inferPaeContextFromCase,
  pickContextualPaeTemplate,
  pickRandomPaeTemplate,
  pickRandomPaeTemplateByContext,
  suggestDiagnoses,
  suggestInterventions,
  suggestOutcomes,
  validatePaeDraft,
  validateTaxonomySelection,
} from "@/src/lib/paeIntelligent";

type Stage = 1 | 2 | 3 | 4 | 5 | 6;
type UsageMode = "integrated_case" | "standalone";
type SelectionMode = "manual" | "random" | "by_category" | "contextual_random";
type GuidanceMode = "guided" | "autonomous";
type NicScaleValue = 1 | 2 | 3 | 4 | 5;

type NicScaleSelection = {
  baseline: NicScaleValue;
  target: NicScaleValue;
  indicators: string[];
};

type GuidedRow = {
  kind: "guided";
  diagnosis: PaeDiagnosis;
  outcomes: PaeOutcome[];
  interventions: PaeIntervention[];
};

type TaxonomyRow = {
  kind: "taxonomy";
  nanda: NandaDiagnosis;
  outcomes: NocOutcome[];
  interventions: NicIntervention[];
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

function stageLabel(stage: Stage) {
  if (stage === 1) return "Valoración";
  if (stage === 2) return "Diagnóstico";
  if (stage === 3) return "Resultados";
  if (stage === 4) return "Intervenciones";
  if (stage === 5) return "Fundamentación";
  return "Evaluación";
}

function toggleSelection(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

const NIC_SCALE_VALUES: NicScaleValue[] = [1, 2, 3, 4, 5];
const NIC_GENERIC_INDICATORS = [
  "Aplicación correcta de la intervención",
  "Seguridad del paciente durante la intervención",
  "Respuesta clínica inicial favorable",
  "Registro de enfermería completo",
];

function nicScaleLabel(value: NicScaleValue) {
  if (value === 1) return "1 · Muy comprometido";
  if (value === 2) return "2 · Compromiso moderado";
  if (value === 3) return "3 · Intermedio";
  if (value === 4) return "4 · Mejoría clara";
  return "5 · Objetivo alcanzado";
}

function nicIndicatorOptions(item: NicIntervention) {
  const fromActivities = item.activities.filter(Boolean).slice(0, 4);
  return fromActivities.length ? fromActivities : NIC_GENERIC_INDICATORS;
}

export default function PaePage() {
  const [mode, setMode] = useState<PaeMode>("practice");
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode>("guided");
  const [usageMode, setUsageMode] = useState<UsageMode>("integrated_case");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("random");
  const [caseCategory, setCaseCategory] = useState<PaeTemplateContextFilter>("all");
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
  const [nicScaleById, setNicScaleById] = useState<Record<string, NicScaleSelection>>({});

  const [nandaQuery, setNandaQuery] = useState("");
  const [nocQuery, setNocQuery] = useState("");
  const [nicQuery, setNicQuery] = useState("");

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
  const integratedContext = useMemo<PaeTemplateContextFilter>(
    () => (useIntegratedContext ? inferPaeContextFromCase(activeCaseObj) : "all"),
    [activeCaseObj, useIntegratedContext]
  );

  useEffect(() => {
    if (selectionMode === "contextual_random" && useIntegratedContext && integratedContext !== "all") {
      setCaseCategory(integratedContext);
    }
  }, [integratedContext, selectionMode, useIntegratedContext]);

  const resetDraft = useCallback(() => {
    setStage(1);
    setSelectedCueIds([]);
    setSubjectiveNotes("");
    setObjectiveNotes("");
    setSelectedDiagnosisIds([]);
    setDiagnosisJustification("");
    setSelectedOutcomeIds([]);
    setSelectedInterventionIds([]);
    setNicScaleById({});
    setNandaQuery("");
    setNocQuery("");
    setNicQuery("");
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

      if (selectionMode === "by_category") {
        return (
          pickRandomPaeTemplateByContext({
            context: caseCategory,
            excludeId,
          }) ?? PAE_TEMPLATE_LIBRARY[0]
        );
      }

      if (selectionMode === "contextual_random") {
        if (useIntegratedContext) {
          return pickContextualPaeTemplate(activeCaseObj, excludeId) ?? PAE_TEMPLATE_LIBRARY[0];
        }

        return (
          pickRandomPaeTemplateByContext({
            context: caseCategory,
            excludeId,
          }) ?? PAE_TEMPLATE_LIBRARY[0]
        );
      }

      return pickRandomPaeTemplate(excludeId) ?? PAE_TEMPLATE_LIBRARY[0];
    },
    [activeCaseObj, caseCategory, manualTemplateId, selectionMode, useIntegratedContext]
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

  const nandaPool = useMemo(() => getNandaByContext(caseCategory), [caseCategory]);
  const nocPool = useMemo(() => getNocByNandaIds(selectedDiagnosisIds), [selectedDiagnosisIds]);
  const nicPool = useMemo(() => getNicByNandaIds(selectedDiagnosisIds), [selectedDiagnosisIds]);

  const filteredNanda = useMemo(() => {
    const q = nandaQuery.trim().toLowerCase();
    if (!q) return nandaPool;
    return nandaPool.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q)
    );
  }, [nandaPool, nandaQuery]);

  const filteredNoc = useMemo(() => {
    const q = nocQuery.trim().toLowerCase();
    if (!q) return nocPool;
    return nocPool.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q)
    );
  }, [nocPool, nocQuery]);

  const filteredNic = useMemo(() => {
    const q = nicQuery.trim().toLowerCase();
    if (!q) return nicPool;
    return nicPool.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.classLabel.toLowerCase().includes(q)
    );
  }, [nicPool, nicQuery]);

  const draftValidation = useMemo(() => {
    if (guidanceMode === "guided") {
      return validatePaeDraft({
        template,
        draft: {
          selectedCueIds,
          selectedDiagnosisIds,
          selectedOutcomeIds,
          selectedInterventionIds,
          rationaleText,
          evaluationText,
        },
      });
    }

    return validateTaxonomySelection({
      selectedCueIds,
      selectedNandaIds: selectedDiagnosisIds,
      selectedNocIds: selectedOutcomeIds,
      selectedNicIds: selectedInterventionIds,
      rationaleText,
      evaluationText,
    });
  }, [
    evaluationText,
    guidanceMode,
    rationaleText,
    selectedCueIds,
    selectedDiagnosisIds,
    selectedInterventionIds,
    selectedOutcomeIds,
    template,
  ]);

  const diagnosisMap = useMemo(() => {
    const map = new Map<string, PaeDiagnosis>();
    for (const item of template.diagnoses) map.set(item.id, item);
    return map;
  }, [template.diagnoses]);

  const nandaMap = useMemo(() => {
    const map = new Map<string, NandaDiagnosis>();
    for (const item of NANDA_LIBRARY) map.set(item.id, item);
    return map;
  }, []);

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

  function ensureNicScaleSelection(interventionId: string) {
    setNicScaleById((prev) => {
      if (prev[interventionId]) return prev;
      return {
        ...prev,
        [interventionId]: {
          baseline: 2,
          target: 4,
          indicators: [],
        },
      };
    });
  }

  function setNicScaleValue(interventionId: string, field: "baseline" | "target", value: NicScaleValue) {
    setNicScaleById((prev) => {
      const base = prev[interventionId] ?? { baseline: 2 as NicScaleValue, target: 4 as NicScaleValue, indicators: [] };
      return {
        ...prev,
        [interventionId]: {
          ...base,
          [field]: value,
        },
      };
    });
  }

  function toggleNicIndicator(interventionId: string, indicator: string) {
    setNicScaleById((prev) => {
      const base = prev[interventionId] ?? { baseline: 2 as NicScaleValue, target: 4 as NicScaleValue, indicators: [] };
      const indicators = base.indicators.includes(indicator)
        ? base.indicators.filter((item) => item !== indicator)
        : [...base.indicators, indicator];

      return {
        ...prev,
        [interventionId]: {
          ...base,
          indicators,
        },
      };
    });
  }

  function rowByGuidedDiagnosis(diagnosisId: string): GuidedRow | null {
    const diagnosis = diagnosisMap.get(diagnosisId);
    if (!diagnosis) return null;

    const outcomes = template.outcomes.filter(
      (item) => item.diagnosisId === diagnosisId && selectedOutcomeIds.includes(item.id)
    );
    const interventions = template.interventions.filter(
      (item) => item.diagnosisId === diagnosisId && selectedInterventionIds.includes(item.id)
    );

    return {
      kind: "guided",
      diagnosis,
      outcomes,
      interventions,
    };
  }

  function rowByNanda(nandaId: string): TaxonomyRow | null {
    const nanda = nandaMap.get(nandaId);
    if (!nanda) return null;

    const primaryNandaId = selectedDiagnosisIds[0];

    const outcomes = NOC_LIBRARY.filter(
      (item) =>
        selectedOutcomeIds.includes(item.id) &&
        (item.linkedNandaIds.includes(nandaId) ||
          (!item.linkedNandaIds.length && primaryNandaId === nandaId))
    );
    const interventions = NIC_LIBRARY.filter(
      (item) =>
        selectedInterventionIds.includes(item.id) &&
        (item.linkedNandaIds.includes(nandaId) ||
          (!item.linkedNandaIds.length && primaryNandaId === nandaId))
    );

    return {
      kind: "taxonomy",
      nanda,
      outcomes,
      interventions,
    };
  }

  const mappedRows: Array<GuidedRow | TaxonomyRow> =
    guidanceMode === "guided"
      ? (selectedDiagnosisIds.map(rowByGuidedDiagnosis).filter(Boolean) as GuidedRow[])
      : (selectedDiagnosisIds.map(rowByNanda).filter(Boolean) as TaxonomyRow[]);

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1660px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">PAE inteligente</h1>
              <p className="mt-1 text-sm text-white/70">
                Ahora incluye flujo guiado o autónomo con base taxonómica NANDA/NOC/NIC.
              </p>
            </div>
            <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
              {getPaeModeLabel(mode)} · {guidanceMode === "guided" ? "Flujo guiado" : "Flujo autónomo"}
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-[#0D121E]/90 p-4 md:grid-cols-2 xl:grid-cols-7">
            <label className="text-xs text-white/70">
              Modalidad
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as PaeMode);
                  setValidationVisible(false);
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="practice">Práctica</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Estructura
              <select
                value={guidanceMode}
                onChange={(event) => {
                  setGuidanceMode(event.target.value as GuidanceMode);
                  resetDraft();
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="guided">Guiada (sugerencias)</option>
                <option value="autonomous">No guiada (NANDA/NOC/NIC)</option>
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
              Generación de caso
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
              >
                <option value="random">Aleatorio</option>
                <option value="by_category">Aleatorio por categoría</option>
                <option value="contextual_random">Aleatorio contextual</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            <label className="text-xs text-white/70">
              Categoría clínica
              <select
                value={caseCategory}
                onChange={(event) => setCaseCategory(event.target.value as PaeTemplateContextFilter)}
                disabled={selectionMode === "contextual_random" && useIntegratedContext}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                <option value="all">Todas</option>
                <option value="respiratory">Respiratorio</option>
                <option value="infection">Infeccioso</option>
                <option value="metabolic">Metabólico</option>
                <option value="renal">Renal</option>
                <option value="postoperative">Postoperatorio</option>
                <option value="general">General</option>
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
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="grid gap-2 xl:grid-cols-[1.2fr_1fr_auto]">
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-white/45">Caso / escenario</div>
                <div className="mt-1 text-lg font-semibold">{template.name}</div>
                <div className="text-sm text-white/70">
                  {template.patient.name} · {template.patient.age} años ·{" "}
                  {template.patient.sex === "female"
                    ? "Femenino"
                    : template.patient.sex === "male"
                    ? "Masculino"
                    : "No especificado"}
                </div>
                <div className="text-sm text-white/70">Motivo: {template.patient.chiefComplaint}</div>
                <div className="mt-1 text-xs text-cyan-100">
                  Categoría del caso: {getPaeContextLabel(template.context)}
                </div>
                {useIntegratedContext && (
                  <div className="mt-1 text-xs text-cyan-100">
                    Contexto del caso activo: {getPaeContextLabel(integratedContext)}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0A101A] p-3 text-xs text-white/70">
                <div className="font-semibold text-white/85">Diseño estructurado</div>
                <div className="mt-1">
                  Flujo en 6 etapas + formato final tipo plan de atención. En modo autónomo puedes elegir taxonomías
                  NANDA/NOC/NIC manualmente.
                </div>
                <div className="mt-2 text-white/60">Diagnóstico médico: {template.patient.medicalDiagnosis}</div>
                <div className="mt-1 text-white/60">Tratamiento: {template.patient.pharmacologicGroup}</div>
                <div className="mt-1 text-white/60">Dieta: {template.patient.dietType}</div>
              </div>

              <div className="flex items-start justify-end gap-2">
                <button
                  type="button"
                  onClick={chooseNewTemplate}
                  className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                >
                  Generar caso
                </button>
                <Link
                  href="/laboratory"
                  className="rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
                >
                  Ir a Laboratorio
                </Link>
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
                            onChange={() => setSelectedCueIds((prev) => toggleSelection(prev, cue.id))}
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

              {stage === 2 && guidanceMode === "guided" && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 2 · Diagnóstico (guiado)</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Elige diagnósticos sugeridos según hallazgos seleccionados.
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
                            <div className="text-sm font-semibold text-white/90">{item.diagnosis.diagnosticLabel}</div>
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
                              Compatibilidad: {item.score}/100 · hallazgos coincidentes {item.matchedCueCount}
                            </div>
                          )}
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setSelectedDiagnosisIds((prev) => toggleSelection(prev, item.diagnosis.id))
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

              {stage === 2 && guidanceMode === "autonomous" && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 2 · Selección NANDA (no guiado)</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Selecciona manualmente diagnósticos NANDA para practicar razonamiento autónomo.
                  </p>

                  <input
                    type="text"
                    value={nandaQuery}
                    onChange={(event) => setNandaQuery(event.target.value)}
                    placeholder="Buscar NANDA por código, etiqueta o dominio"
                    className="mt-3 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                  />

                  <div className="mt-3 space-y-2 max-h-[430px] overflow-auto pr-1">
                    {filteredNanda.map((item) => {
                      const selected = selectedDiagnosisIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`block rounded-xl border p-3 ${
                            selected ? "border-cyan-400/35 bg-cyan-400/10" : "border-white/10 bg-black/25"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-white/90">
                              {item.code} · {item.label}
                            </div>
                            <div className="text-xs text-white/55">NANDA</div>
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            {item.domain} · {item.classLabel}
                          </div>
                          <div className="mt-1 text-xs text-cyan-100/85">
                            Contexto sugerido: {item.contexts.map((ctx) => getPaeContextLabel(ctx)).join(" · ")}
                          </div>
                          <div className="mt-1 text-xs text-white/65">
                            Diagnóstico de respuesta humana para priorizar problemas de enfermería en este caso.
                          </div>
                          {mode === "practice" && (
                            <div className="mt-1 text-xs text-white/70">
                              Características clave:{" "}
                              {item.definingCharacteristics.length
                                ? item.definingCharacteristics.slice(0, 3).join(" · ")
                                : "Revisa signos/síntomas y factores de riesgo en la valoración."}
                            </div>
                          )}
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => setSelectedDiagnosisIds((prev) => toggleSelection(prev, item.id))}
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm text-white/85">Seleccionar NANDA</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {stage === 3 && guidanceMode === "guided" && (
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
                          <div className="mt-1 text-xs text-white/60">Meta: {outcome.target}</div>
                          <div className="mt-1 text-xs text-white/70">
                            Indicadores: {outcome.indicators.join(" · ")}
                          </div>
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => setSelectedOutcomeIds((prev) => toggleSelection(prev, outcome.id))}
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

              {stage === 3 && guidanceMode === "autonomous" && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 3 · Selección NOC (no guiado)</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Elige resultados NOC relacionados a tus diagnósticos NANDA seleccionados.
                  </p>

                  {!selectedDiagnosisIds.length && (
                    <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                      Selecciona NANDA primero para filtrar NOC relacionados.
                    </div>
                  )}

                  <input
                    type="text"
                    value={nocQuery}
                    onChange={(event) => setNocQuery(event.target.value)}
                    placeholder="Buscar NOC por código, etiqueta o dominio"
                    className="mt-3 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                  />

                  <div className="mt-3 space-y-2 max-h-[430px] overflow-auto pr-1">
                    {filteredNoc.map((item) => {
                      const selected = selectedOutcomeIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`block rounded-xl border p-3 ${
                            selected ? "border-emerald-400/35 bg-emerald-400/10" : "border-white/10 bg-black/25"
                          }`}
                        >
                          <div className="text-sm font-semibold text-white/90">
                            {item.code} · {item.label}
                          </div>
                          <div className="mt-1 text-xs text-white/60">{item.domain}</div>
                          <div className="mt-1 text-xs text-emerald-100/85">
                            Este NOC mide evolución clínica y respuesta al cuidado de enfermería.
                          </div>
                          <div className="mt-1 text-xs text-white/65">
                            Sugerencia de escala: 1 (muy comprometido) a 5 (objetivo alcanzado).
                          </div>
                          {mode === "practice" && (
                            <div className="mt-1 text-xs text-white/70">
                              Indicadores:{" "}
                              {item.indicators.length
                                ? item.indicators.slice(0, 3).join(" · ")
                                : "Selecciona un resultado y define después línea base y meta clínica."}
                            </div>
                          )}
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => setSelectedOutcomeIds((prev) => toggleSelection(prev, item.id))}
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm text-white/85">Seleccionar NOC</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {stage === 4 && guidanceMode === "guided" && (
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
                            <div className="mt-1 text-xs text-cyan-100/90">Fundamento: {intervention.rationale}</div>
                          )}
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => setSelectedInterventionIds((prev) => toggleSelection(prev, intervention.id))}
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

              {stage === 4 && guidanceMode === "autonomous" && (
                <div>
                  <h2 className="text-lg font-semibold">Etapa 4 · Selección NIC (no guiado)</h2>
                  <p className="mt-1 text-sm text-white/65">
                    Elige intervenciones NIC asociadas a tus diagnósticos NANDA.
                  </p>

                  {!selectedDiagnosisIds.length && (
                    <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                      Selecciona NANDA primero para filtrar NIC relacionados.
                    </div>
                  )}

                  <input
                    type="text"
                    value={nicQuery}
                    onChange={(event) => setNicQuery(event.target.value)}
                    placeholder="Buscar NIC por código, etiqueta o clase"
                    className="mt-3 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
                  />

                  <div className="mt-3 space-y-2 max-h-[430px] overflow-auto pr-1">
                    {filteredNic.map((item) => {
                      const selected = selectedInterventionIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`block rounded-xl border p-3 ${
                            selected ? "border-sky-400/35 bg-sky-400/10" : "border-white/10 bg-black/25"
                          }`}
                        >
                          <div className="text-sm font-semibold text-white/90">
                            {item.code} · {item.label}
                          </div>
                          <div className="mt-1 text-xs text-white/60">Clase: {item.classLabel}</div>
                          <div className="mt-1 text-xs text-sky-100/85">
                            Contexto: intervención inicial para actuar sobre la prioridad NANDA seleccionada.
                          </div>
                          <div className="mt-1 text-xs text-white/65">
                            Define escala NIC e indicadores de ejecución para dejar el PAE más operativo.
                          </div>
                          {mode === "practice" && (
                            <div className="mt-1 text-xs text-white/70">
                              Actividades:{" "}
                              {item.activities.length
                                ? item.activities.slice(0, 3).join(" · ")
                                : "Intervención taxonómica; añade indicadores de ejecución abajo."}
                            </div>
                          )}
                          <div className="mt-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                setSelectedInterventionIds((prev) => {
                                  const next = toggleSelection(prev, item.id);
                                  if (next.includes(item.id)) {
                                    ensureNicScaleSelection(item.id);
                                  }
                                  return next;
                                })
                              }
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm text-white/85">Seleccionar NIC</span>
                          </div>
                          {selected && (
                            <div className="mt-3 rounded-lg border border-sky-300/20 bg-black/35 p-3">
                              <div className="text-xs font-medium text-sky-100">Indicadores y escala NIC</div>
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <label className="text-[11px] text-white/70">
                                  Línea base
                                  <select
                                    value={nicScaleById[item.id]?.baseline ?? 2}
                                    onChange={(event) =>
                                      setNicScaleValue(item.id, "baseline", Number(event.target.value) as NicScaleValue)
                                    }
                                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                                  >
                                    {NIC_SCALE_VALUES.map((value) => (
                                      <option key={`${item.id}-base-${value}`} value={value}>
                                        {nicScaleLabel(value)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="text-[11px] text-white/70">
                                  Meta
                                  <select
                                    value={nicScaleById[item.id]?.target ?? 4}
                                    onChange={(event) =>
                                      setNicScaleValue(item.id, "target", Number(event.target.value) as NicScaleValue)
                                    }
                                    className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
                                  >
                                    {NIC_SCALE_VALUES.map((value) => (
                                      <option key={`${item.id}-target-${value}`} value={value}>
                                        {nicScaleLabel(value)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              <div className="mt-2 text-[11px] text-white/70">Indicadores de ejecución</div>
                              <div className="mt-1 grid gap-1">
                                {nicIndicatorOptions(item).map((indicator) => {
                                  const checked = nicScaleById[item.id]?.indicators.includes(indicator) ?? false;
                                  return (
                                    <label key={`${item.id}-${indicator}`} className="text-xs text-white/75">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleNicIndicator(item.id, indicator)}
                                        className="mr-2 h-3.5 w-3.5 align-middle"
                                      />
                                      <span className="align-middle">{indicator}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
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

              {mode === "practice" && guidanceMode === "guided" && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <h3 className="text-sm font-semibold">Asistencia inteligente</h3>
                  <ul className="mt-2 space-y-1 text-xs text-white/75">
                    {template.automaticFeedback.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {mode === "practice" && guidanceMode === "autonomous" && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <h3 className="text-sm font-semibold">Base taxonómica activa</h3>
                  <div className="mt-2 text-xs text-white/75">NANDA: {NANDA_LIBRARY.length} entradas</div>
                  <div className="mt-1 text-xs text-white/75">NOC: {NOC_LIBRARY.length} entradas</div>
                  <div className="mt-1 text-xs text-white/75">NIC: {NIC_LIBRARY.length} entradas</div>
                  <div className="mt-2 text-xs text-cyan-100/90">
                    En modo no guiado la calificación evalúa coherencia entre NANDA, NOC y NIC seleccionados.
                  </div>
                </div>
              )}

              {validationVisible && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      {guidanceMode === "guided" ? "Coherencia del PAE" : "Coherencia NANDA/NOC/NIC"}
                    </h3>
                    <span className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-100">
                      {draftValidation.totalScore}/100
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-white/70">{draftValidation.summary}</div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">Valoración: {draftValidation.rubric.assessment}</div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">Diagnóstico: {draftValidation.rubric.diagnosis}</div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">Resultados: {draftValidation.rubric.outcomes}</div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">Intervenciones: {draftValidation.rubric.interventions}</div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">Fundamentación: {draftValidation.rubric.rationale}</div>
                    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">Evaluación: {draftValidation.rubric.evaluation}</div>
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
                    <tr
                      key={row.kind === "guided" ? row.diagnosis.id : row.nanda.id}
                      className="border-t border-white/10 align-top"
                    >
                      <td className="px-3 py-3">
                        {row.kind === "guided" ? (
                          <>
                            <div className="font-semibold text-white/90">{row.diagnosis.diagnosticLabel}</div>
                            <div className="text-xs text-white/60">{row.diagnosis.domain}</div>
                            <div className="text-xs text-white/60">{row.diagnosis.classLabel}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-white/90">
                              {row.nanda.code} · {row.nanda.label}
                            </div>
                            <div className="text-xs text-white/60">{row.nanda.domain}</div>
                            <div className="text-xs text-white/60">{row.nanda.classLabel}</div>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {row.outcomes.length ? (
                          row.outcomes.map((outcome) => (
                            <div
                              key={outcome.id}
                              className="mb-2 rounded-lg border border-white/10 bg-black/25 p-2"
                            >
                              <div className="font-medium text-white/90">
                                {"target" in outcome
                                  ? outcome.label
                                  : `${outcome.code} · ${outcome.label}`}
                              </div>
                              <div className="text-xs text-white/65">
                                {"target" in outcome
                                  ? `Meta: ${outcome.target}`
                                  : outcome.indicators.slice(0, 2).join(" · ")}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-white/50">Sin resultado seleccionado</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {row.interventions.length ? (
                          row.interventions.map((intervention) => (
                            <div
                              key={intervention.id}
                              className="mb-2 rounded-lg border border-white/10 bg-black/25 p-2"
                            >
                              <div className="font-medium text-white/90">
                                {"rationale" in intervention
                                  ? intervention.label
                                  : `${intervention.code} · ${intervention.label}`}
                              </div>
                              <div className="text-xs text-white/65">
                                {intervention.activities.length
                                  ? intervention.activities.slice(0, 2).join(" · ")
                                  : "Sin actividades cargadas en catálogo."}
                              </div>
                              {guidanceMode === "autonomous" && nicScaleById[intervention.id] && (
                                <div className="mt-1 text-[11px] text-sky-100/90">
                                  Escala NIC: {nicScaleById[intervention.id].baseline} →{" "}
                                  {nicScaleById[intervention.id].target}
                                  {nicScaleById[intervention.id].indicators.length
                                    ? ` · Indicadores: ${nicScaleById[intervention.id].indicators.join(" · ")}`
                                    : " · Indicadores pendientes"}
                                </div>
                              )}
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
