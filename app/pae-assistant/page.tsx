"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { CARE_GUIDES, TEACHING_INDICATORS, TEACHING_ACTIVITIES, matchesCatalogQuery } from "@/src/lib/paeCareSupport";
import { GYNECOLOGY_CASES } from "@/src/lib/gynecologySimulation";
import styles from "./assistant.module.css";
import {
  NANDA_LIBRARY,
  NIC_LIBRARY,
  NOC_LIBRARY,
  getNandaByContext,
  getPaeContextLabel,
  getSuggestedNicOptions,
  getSuggestedNocOptions,
  inferPaeContextFromText,
  suggestPaeTaxonomyBundles,
  type NandaDiagnosis,
  type NicIntervention,
  type NocOutcome,
} from "@/src/lib/paeIntelligent";

type ScaleValue = 1 | 2 | 3 | 4 | 5;

type IndicatorPlanRow = {
  label: string;
  assessment: ScaleValue | "";
  goal: ScaleValue | "";
  active: boolean;
};

type TaxonomyMeta = {
  domainCode: string;
  domainLabel: string;
  classCode: string;
  classLabel: string;
};

type AssistantStep = "data" | "suggestions" | "nanda" | "noc" | "nic" | "evaluation";

const SCALE_OPTIONS: ScaleValue[] = [1, 2, 3, 4, 5];
const SECTION_CARD =
  "rounded-[28px] border border-slate-200 bg-white/88 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]";
const STEP_WINDOW_CLASS =
  "rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]";
const EVALUATION_PRESETS = [
  {
    id: "pendiente",
    label: "Pendiente",
    template: "Pendiente de reevaluación al cierre del turno.",
  },
  {
    id: "progreso",
    label: "En progreso",
    template: "Paciente en evolución favorable parcial; se mantiene vigilancia y ajustes según respuesta.",
  },
  {
    id: "cumplido",
    label: "Cumplido",
    template: "Objetivos alcanzados en el turno con respuesta clínica esperada.",
  },
  {
    id: "reevaluar",
    label: "Reevaluar",
    template: "Meta no consolidada; se requiere reevaluación y continuidad del plan de atención.",
  },
] as const;
const ASSISTANT_STEPS: Array<{
  id: AssistantStep;
  label: string;
  shortLabel: string;
  helper: string;
}> = [
  { id: "data", label: "Datos y motivo clínico", shortLabel: "Datos", helper: "Paciente, diagnóstico y contexto base." },
  { id: "suggestions", label: "Sugerencias automáticas", shortLabel: "Ayuda", helper: "Paquetes sugeridos con NANDA, NOC y NIC." },
  { id: "nanda", label: "Diagnóstico NANDA", shortLabel: "NANDA", helper: "Confirma el diagnóstico de enfermería." },
  { id: "noc", label: "Resultado NOC", shortLabel: "NOC", helper: "Selecciona resultado e indicadores." },
  { id: "nic", label: "Intervención NIC", shortLabel: "NIC", helper: "Activa las actividades que usarás." },
  { id: "evaluation", label: "Evaluación y salida", shortLabel: "Cierre", helper: "Completa evaluación e imprime el formato." },
];

function normalizeSearch(value: string) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function formatCatalogLabel(value: string) {
  return String(value ?? "").replace(/:/g, ": ").replace(/\s+/g, " ").trim();
}

function printValue(value: string) {
  return value.trim() || "\u00A0";
}

function scaleLabel(value: ScaleValue) {
  if (value === 1) return "1 · Menor logro";
  if (value === 2) return "2 · Logro limitado";
  if (value === 3) return "3 · Logro parcial";
  if (value === 4) return "4 · Logro sustancial";
  return "5 · Mayor logro";
}

function formatPreviewList(items: string[], max = 2) {
  return items
    .filter(Boolean)
    .slice(0, max)
    .map((item) => formatCatalogLabel(item))
    .join(" · ");
}

function defaultOutcomeIndicators(outcome: NocOutcome | null) {
  if (!outcome) return [];
  if (outcome.indicators.length) return outcome.indicators.slice(0, 5);

  return TEACHING_INDICATORS[outcome.code] ?? [];
}

function defaultNicActivities(intervention: NicIntervention | null) {
  if (!intervention) return [];
  if (intervention.activities.length) return intervention.activities.slice(0, 6);

  return TEACHING_ACTIVITIES[intervention.code] ?? [];
}

function buildEvaluationText(statusId: string, note: string) {
  const preset = EVALUATION_PRESETS.find((item) => item.id === statusId)?.template ?? "";
  return [preset, note.trim()].filter(Boolean).join(" ");
}

function scoreTone(score: number) {
  if (score >= 60) return "border-emerald-400/35 bg-emerald-400/12 text-emerald-700";
  if (score >= 35) return "border-sky-400/35 bg-sky-400/12 text-sky-700";
  if (score >= 18) return "border-amber-400/35 bg-amber-400/12 text-amber-100";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function buildNandaDescription(item: NandaDiagnosis | null) {
  if (!item) return "";

  const characteristics = formatPreviewList(item.definingCharacteristics, 2);
  const relatedFactors = formatPreviewList(item.relatedFactors, 2);

  if (characteristics && relatedFactors) {
    return `Diagnóstico de enfermería orientado a ${formatCatalogLabel(item.label).toLowerCase()}. Suele reconocerse por ${characteristics} y se relaciona con ${relatedFactors}.`;
  }

  if (characteristics) {
    return `Diagnóstico de enfermería orientado a ${formatCatalogLabel(item.label).toLowerCase()}. Se apoya en hallazgos como ${characteristics}.`;
  }

  if (relatedFactors) {
    return `Diagnóstico de enfermería orientado a ${formatCatalogLabel(item.label).toLowerCase()}. Considera factores asociados como ${relatedFactors}.`;
  }

  return `Diagnóstico de enfermería enfocado en ${formatCatalogLabel(item.label).toLowerCase()} dentro de ${formatCatalogLabel(item.domain).toLowerCase()}.`;
}

function buildNocDescription(item: NocOutcome | null) {
  if (!item) return "";

  const indicators = formatPreviewList(item.indicators, 3);
  if (indicators) {
    return `Resultado esperado para valorar ${formatCatalogLabel(item.label).toLowerCase()}. Puede medirse con indicadores como ${indicators}.`;
  }

  return `Resultado NOC utilizado para medir la evolución clínica de ${formatCatalogLabel(item.label).toLowerCase()}.`;
}

function buildNicDescription(item: NicIntervention | null) {
  if (!item) return "";

  const activities = formatPreviewList(item.activities, 3);
  if (activities) {
    return `Intervención de enfermería dirigida a ${formatCatalogLabel(item.label).toLowerCase()}. Suele incluir actividades como ${activities}.`;
  }

  return `Intervención NIC orientada a ${formatCatalogLabel(item.label).toLowerCase()} con acciones planificadas de enfermería.`;
}

function createTaxonomyMeta(
  domainCode: string,
  domainLabel: string,
  classCode: string,
  classLabel: string
): TaxonomyMeta {
  return { domainCode, domainLabel, classCode, classLabel };
}

// The import does not contain verified NOC/NIC domain and class mappings.
// Do not fabricate taxonomy metadata from a label or numeric code range.
function inferNocTaxonomy(outcome: NocOutcome | null): TaxonomyMeta {
  return createTaxonomyMeta("—", outcome && !/^Taxonom/i.test(outcome.domain) ? outcome.domain : "No documentado en el catálogo local", "—", "No documentada en el catálogo local");
}
function inferNicTaxonomy(intervention: NicIntervention | null): TaxonomyMeta {
  return createTaxonomyMeta("—", "No documentado en el catálogo local", "—", intervention && !/^Taxonom/i.test(intervention.classLabel) ? intervention.classLabel : "No documentada en el catálogo local");
}

export default function PaeAssistantPage() {
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [clinicalRecord, setClinicalRecord] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [internName, setInternName] = useState("");
  const [medicalDiagnosis, setMedicalDiagnosis] = useState("");
  const [assessmentSummary, setAssessmentSummary] = useState("");
  const [pharmacologicGroup, setPharmacologicGroup] = useState("");
  const [dietType, setDietType] = useState("");
  const [nandaQuery, setNandaQuery] = useState("");
  const [nocQuery, setNocQuery] = useState("");
  const [nicQuery, setNicQuery] = useState("");
  const [selectedNandaId, setSelectedNandaId] = useState("");
  const [selectedNocId, setSelectedNocId] = useState("");
  const [selectedNicId, setSelectedNicId] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [relatedFactorsText, setRelatedFactorsText] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [customIndicator, setCustomIndicator] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [extraActivities, setExtraActivities] = useState<string[]>([]);
  const [indicatorRows, setIndicatorRows] = useState<IndicatorPlanRow[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [evaluationStatus, setEvaluationStatus] = useState<(typeof EVALUATION_PRESETS)[number]["id"]>("pendiente");
  const [evaluationNote, setEvaluationNote] = useState("");
  const [activeStep, setActiveStep] = useState<AssistantStep>("data");
  const [showAllNandaCatalog, setShowAllNandaCatalog] = useState(false);
  const [showAllNocCatalog, setShowAllNocCatalog] = useState(false);
  const [showAllNicCatalog, setShowAllNicCatalog] = useState(false);

  const deferredMedicalDiagnosis = useDeferredValue(medicalDiagnosis);
  const deferredAssessmentSummary = useDeferredValue(assessmentSummary);
  const deferredNandaQuery = useDeferredValue(nandaQuery);
  const deferredNocQuery = useDeferredValue(nocQuery);
  const deferredNicQuery = useDeferredValue(nicQuery);

  const assistantQuery = useMemo(
    () => [deferredMedicalDiagnosis, deferredAssessmentSummary].filter(Boolean).join(" ").trim(),
    [deferredAssessmentSummary, deferredMedicalDiagnosis]
  );

  const inferredContext = useMemo(
    () => inferPaeContextFromText(assistantQuery),
    [assistantQuery]
  );

  const taxonomySuggestions = useMemo(
    () =>
      suggestPaeTaxonomyBundles({
        diagnosisText: assistantQuery,
        context: assistantQuery ? inferredContext : "all",
        limit: 6,
      }),
    [assistantQuery, inferredContext]
  );

  const nandaPool = useMemo(
    () => getNandaByContext(assistantQuery ? inferredContext : "all"),
    [assistantQuery, inferredContext]
  );

  const nandaCatalogBase = useMemo(
    () => uniqueById([...taxonomySuggestions.map((item) => item.nanda), ...getNandaByContext("all")]),
    [taxonomySuggestions]
  );

  const filteredNandaOptions = useMemo(() => {
    const query = normalizeSearch(deferredNandaQuery);
    if (query) {
      return nandaCatalogBase.filter(item => matchesCatalogQuery(query, [item.code, item.label, item.domain, item.classLabel]));
    }

    if (showAllNandaCatalog) {
      return nandaCatalogBase;
    }

    const base = uniqueById([...taxonomySuggestions.map((item) => item.nanda), ...nandaPool]);
    return base.slice(0, 10);
  }, [deferredNandaQuery, nandaCatalogBase, nandaPool, showAllNandaCatalog, taxonomySuggestions]);

  const selectedNanda = useMemo(
    () => NANDA_LIBRARY.find((item) => item.id === selectedNandaId) ?? null,
    [selectedNandaId]
  );

  const suggestedNocOptions = useMemo(
    () =>
      selectedNanda
        ? getSuggestedNocOptions({
            nanda: selectedNanda,
            diagnosisText: assistantQuery,
            limit: 8,
          })
        : [],
    [assistantQuery, selectedNanda]
  );

  const suggestedNicOptions = useMemo(
    () =>
      selectedNanda
        ? getSuggestedNicOptions({
            nanda: selectedNanda,
            diagnosisText: assistantQuery,
            limit: 8,
          })
        : [],
    [assistantQuery, selectedNanda]
  );

  const filteredNocOptions = useMemo(() => {
    const query = normalizeSearch(deferredNocQuery);
    const base = uniqueById([...suggestedNocOptions, ...NOC_LIBRARY]);
    if (query) {
      return base.filter(item => matchesCatalogQuery(query, [item.code, item.label, item.domain, ...item.indicators]));
    }

    return showAllNocCatalog ? base : suggestedNocOptions;
  }, [deferredNocQuery, showAllNocCatalog, suggestedNocOptions]);

  const filteredNicOptions = useMemo(() => {
    const query = normalizeSearch(deferredNicQuery);
    const base = uniqueById([...suggestedNicOptions, ...NIC_LIBRARY]);
    if (query) {
      return base.filter(item => matchesCatalogQuery(query, [item.code, item.label, item.classLabel, ...item.activities]));
    }

    return showAllNicCatalog ? base : suggestedNicOptions;
  }, [deferredNicQuery, showAllNicCatalog, suggestedNicOptions]);

  const selectedNoc = useMemo(
    () => NOC_LIBRARY.find((item) => item.id === selectedNocId) ?? null,
    [selectedNocId]
  );

  const selectedNic = useMemo(
    () => NIC_LIBRARY.find((item) => item.id === selectedNicId) ?? null,
    [selectedNicId]
  );

  const nocTaxonomy = useMemo(
    () => inferNocTaxonomy(selectedNoc),
    [selectedNoc]
  );

  const nicTaxonomy = useMemo(
    () => inferNicTaxonomy(selectedNic),
    [selectedNic]
  );

  const availableIndicators = useMemo(
    () => defaultOutcomeIndicators(selectedNoc),
    [selectedNoc]
  );

  const availableActivities = useMemo(
    () => [...new Set([...defaultNicActivities(selectedNic), ...extraActivities])],
    [selectedNic, extraActivities]
  );

  const activeSuggestion = useMemo(
    () => taxonomySuggestions.find((item) => item.nanda.id === selectedNandaId) ?? null,
    [selectedNandaId, taxonomySuggestions]
  );

  const selectedNandaDescription = useMemo(
    () => buildNandaDescription(selectedNanda),
    [selectedNanda]
  );

  const selectedNocDescription = useMemo(
    () => buildNocDescription(selectedNoc),
    [selectedNoc]
  );

  const selectedNicDescription = useMemo(
    () => buildNicDescription(selectedNic),
    [selectedNic]
  );

  const evaluationText = useMemo(
    () => buildEvaluationText(evaluationStatus, evaluationNote),
    [evaluationNote, evaluationStatus]
  );

  useEffect(() => {
    const scenarioId = new URLSearchParams(window.location.search).get("scenario");
    const scenario = GYNECOLOGY_CASES.find(item => item.id === scenarioId);
    if (!scenario) return;
    setPatientName(scenario.name);
    setPatientAge(String(scenario.age));
    setMedicalDiagnosis(scenario.diagnosis);
    setAssessmentSummary(`${scenario.handover} FC ${scenario.initial.hr} lpm; PA ${scenario.initial.sbp}/${scenario.initial.dbp} mmHg; SpO₂ ${scenario.initial.spo2}%. Caso ficticio para práctica.`);
  }, []);

  useEffect(() => {
    if (!availableIndicators.length) {
      setIndicatorRows([]);
      return;
    }

    setIndicatorRows((current) =>
      availableIndicators.map((label, index) => {
        const existing = current.find((item) => item.label === label);
        if (existing) return existing;

        return {
          label,
          assessment: "" as const,
          goal: "" as const,
          active: index < 4,
        };
      })
    );
  }, [availableIndicators]);

  useEffect(() => {
    if (!availableActivities.length) {
      setSelectedActivities([]);
      return;
    }

    setSelectedActivities((current) => {
      const valid = current.filter((activity) => availableActivities.includes(activity));
      return valid.length ? valid : availableActivities.slice(0, 4);
    });
  }, [availableActivities]);

  const selectedIndicatorRows = useMemo(() => indicatorRows.filter((item) => item.active).slice(0, 5), [indicatorRows]);
  const selectedActivityRows = useMemo(() => selectedActivities.slice(0, 6), [selectedActivities]);
  const activeStepIndex = ASSISTANT_STEPS.findIndex((item) => item.id === activeStep);
  const activeStepMeta = ASSISTANT_STEPS[activeStepIndex] ?? ASSISTANT_STEPS[0];
  const canGoBack = activeStepIndex > 0;
  const canGoForward = activeStepIndex < ASSISTANT_STEPS.length - 1;
  const stepProgress = ((activeStepIndex + 1) / ASSISTANT_STEPS.length) * 100;

  const stepState = useMemo<Record<AssistantStep, { complete: boolean; summary: string }>>(
    () => ({
      data: {
        complete: Boolean(medicalDiagnosis.trim() && patientName.trim()),
        summary: medicalDiagnosis.trim() || "Completa datos básicos",
      },
      suggestions: {
        complete: Boolean(taxonomySuggestions.length),
        summary: taxonomySuggestions[0]
          ? `${taxonomySuggestions[0].nanda.code} sugerido`
          : "Sin sugerencias aún",
      },
      nanda: {
        complete: Boolean(selectedNanda),
        summary: selectedNanda ? `${selectedNanda.code} ${formatCatalogLabel(selectedNanda.label)}` : "Sin NANDA",
      },
      noc: {
        complete: Boolean(selectedNoc && selectedIndicatorRows.length && selectedIndicatorRows.every(row => row.assessment !== "" && row.goal !== "")),
        summary: selectedNoc ? `${selectedNoc.code} ${formatCatalogLabel(selectedNoc.label)}` : "Sin NOC",
      },
      nic: {
        complete: Boolean(selectedNic && selectedActivityRows.length),
        summary: selectedNic ? `${selectedNic.code} ${formatCatalogLabel(selectedNic.label)}` : "Sin NIC",
      },
      evaluation: {
        complete: Boolean(evaluationStatus !== "pendiente" || evaluationNote.trim()),
        summary: evaluationText.trim() || "Pendiente de evaluación",
      },
    }),
    [
      evaluationText,
      evaluationStatus,
      evaluationNote,
      medicalDiagnosis,
      patientName,
      selectedActivityRows.length,
      selectedIndicatorRows,
      selectedNic,
      selectedNanda,
      selectedNoc,
      taxonomySuggestions,
    ]
  );

  function chooseNanda(id: string) {
    if (id === selectedNandaId) return;
    setSelectedNandaId(id); setSelectedNocId(""); setSelectedNicId("");
    setIndicatorRows([]); setSelectedActivities([]); setExtraActivities([]);
    setRelatedFactorsText(""); setEvidenceText("");
    setNocQuery(""); setNicQuery(""); setCustomIndicator(""); setCustomActivity("");
  }
  function chooseNoc(id: string) {
    if (id === selectedNocId) return;
    setIndicatorRows([]); setSelectedNocId(id); setCustomIndicator("");
  }
  function chooseNic(id: string) {
    if (id === selectedNicId) return;
    setSelectedActivities([]); setExtraActivities([]); setSelectedNicId(id); setCustomActivity("");
  }
  function addIndicator() {
    const label = customIndicator.trim();
    if (!label || indicatorRows.some(row => row.label === label)) return;
    setIndicatorRows(rows => [...rows, { label, assessment: 2, goal: "" as const, active: true }]); setCustomIndicator("");
  }
  function addActivity() {
    const label = customActivity.trim();
    if (!label || availableActivities.includes(label) || selectedActivities.length >= 6) return;
    setExtraActivities(current => [...current, label]); setSelectedActivities(current => [...current, label]); setCustomActivity("");
  }

  function goToStep(step: AssistantStep) {
    setActiveStep(step);
  }

  function goToPreviousStep() {
    if (!canGoBack) return;
    setActiveStep(ASSISTANT_STEPS[activeStepIndex - 1].id);
  }

  function goToNextStep() {
    if (!canGoForward) return;
    setActiveStep(ASSISTANT_STEPS[activeStepIndex + 1].id);
  }

  function resetAssistantForm() {
    setPatientName("");
    setPatientAge("");
    setClinicalRecord("");
    setBedNumber("");
    setInternName("");
    setMedicalDiagnosis("");
    setAssessmentSummary("");
    setPharmacologicGroup("");
    setDietType("");
    setNandaQuery("");
    setNocQuery("");
    setNicQuery("");
    setSelectedNandaId("");
    setSelectedNocId("");
    setSelectedNicId("");
    setExtraActivities([]);
    setCustomIndicator("");
    setCustomActivity("");
    setIndicatorRows([]);
    setSelectedActivities([]);
    setRelatedFactorsText(""); setEvidenceText("");
    setEvaluationStatus("pendiente");
    setEvaluationNote("");
    setShowAllNandaCatalog(false);
    setShowAllNocCatalog(false);
    setShowAllNicCatalog(false);
    setActiveStep("data");
  }

  return (
    <div className={styles.page}>
      <div className={`psyke-workspace ${styles.shell}`}>
        <Sidebar />

        <main className={styles.main}>
          <header className={`${styles.header} no-print`}><div><span className={styles.eyebrow}>PSYKE / PLANIFICACIÓN DEL CUIDADO</span><h1>PAE asistido.<br/><em>Del razonamiento al cuidado.</em></h1><p>Conecta la valoración, el diagnóstico y las acciones de enfermería, paso a paso.</p></div><button onClick={() => setShowPreview(value => !value)} className={styles.previewButton}>{showPreview ? "Volver al editor" : "Vista del formato ↗"}</button></header>
          <div className={`${styles.taxonomyPath} no-print`}><span><b>NANDA</b> Qué necesita la persona</span><i>→</i><span><b>NOC</b> Qué queremos alcanzar</span><i>→</i><span><b>NIC</b> Cómo vamos a actuar</span></div>
          <div className="mx-auto max-w-[1640px]">
            <div className={showPreview ? styles.previewLayout : styles.editorLayout}>
              <aside className={`${styles.editor} no-print ${showPreview ? styles.editorHidden : ""}`}>
                <section className={SECTION_CARD}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Llenado guiado
                      </div>
                      <h2 className="mt-1 text-base font-semibold text-slate-900">
                        Paso {activeStepIndex + 1} de {ASSISTANT_STEPS.length}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">{activeStepMeta.helper}</p>
                    </div>
                    <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-700">
                      {Math.round(stepProgress)}%
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>

                  <div className={styles.steps}>
                    {ASSISTANT_STEPS.map((step, index) => {
                      const active = step.id === activeStep;
                      const complete = stepState[step.id].complete;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          aria-current={active ? "step" : undefined}
                          onClick={() => goToStep(step.id)}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${
                            active
                              ? "border-cyan-400/55 bg-cyan-400/12"
                              : complete
                              ? "border-emerald-400/25 bg-emerald-400/10"
                              : "border-slate-200 bg-white/80 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {index + 1}. {step.shortLabel}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                              {complete ? "listo" : "editar"}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                            {stepState[step.id].summary}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {activeStep === "data" && (
                  <section className={STEP_WINDOW_CLASS}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">1. Datos y motivo clínico</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Registra la valoración. El resumen del plan se actualizará con tus elecciones.
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Ventana 1
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-slate-600">
                        Nombre
                        <input
                          type="text"
                          value={patientName}
                          onChange={(event) => setPatientName(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="text-xs text-slate-600">
                        Edad
                        <input
                          type="text"
                          value={patientAge}
                          onChange={(event) => setPatientAge(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="text-xs text-slate-600">
                        Nº H clínica
                        <input
                          type="text"
                          value={clinicalRecord}
                          onChange={(event) => setClinicalRecord(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="text-xs text-slate-600">
                        Cama #
                        <input
                          type="text"
                          value={bedNumber}
                          onChange={(event) => setBedNumber(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block text-xs text-slate-600">
                      Diagnóstico médico o problema principal
                      <textarea
                        value={medicalDiagnosis}
                        onChange={(event) => setMedicalDiagnosis(event.target.value)}
                        rows={3}
                        placeholder="Ej. neumonía con hipoxemia, dolor postoperatorio, riesgo de infección..."
                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                      />
                    </label>

                    <label className="mt-3 block text-xs text-slate-600">
                      Hallazgos o valoración breve
                      <textarea
                        value={assessmentSummary}
                        onChange={(event) => setAssessmentSummary(event.target.value)}
                        rows={3}
                        placeholder="Ej. disnea, SpO2 88%, dolor 8/10, herida quirúrgica limpia..."
                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                      />
                    </label>

                    <div className="mt-4 grid gap-3">
                      <label className="text-xs text-slate-600">
                        Tratamiento farmacológico / grupos
                        <input
                          type="text"
                          value={pharmacologicGroup}
                          onChange={(event) => setPharmacologicGroup(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="text-xs text-slate-600">
                        Tipo de dieta
                        <input
                          type="text"
                          value={dietType}
                          onChange={(event) => setDietType(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                      <label className="text-xs text-slate-600">
                        Nombre del interno/a
                        <input
                          type="text"
                          value={internName}
                          onChange={(event) => setInternName(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                        />
                      </label>
                    </div>
                  </section>
                )}

                {activeStep === "suggestions" && (
                  <section className={STEP_WINDOW_CLASS}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">2. Sugerencias automáticas</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Elige una propuesta y luego la afinas en las siguientes ventanitas.
                        </p>
                      </div>
                      <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-700">
                        {assistantQuery ? getPaeContextLabel(inferredContext) : "Sin contexto"}
                      </div>
                    </div>

                    <div className={styles.suggestions}>
                      {taxonomySuggestions.map((item) => {
                        const selected = item.nanda.id === selectedNandaId;
                        return (
                          <button
                            key={item.nanda.id}
                            type="button"
                            onClick={() => {
                              chooseNanda(item.nanda.id);
                              goToStep("nanda");
                            }}
                            className={`w-full rounded-[24px] border p-4 text-left transition ${
                              selected
                                ? "border-cyan-400/55 bg-cyan-400/12 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
                                : "border-slate-200 bg-white/82 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">
                                  {item.nanda.code} · {formatCatalogLabel(item.nanda.label)}
                                </div>
                                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                                  {formatCatalogLabel(item.nanda.domain)} · {formatCatalogLabel(item.nanda.classLabel)}
                                </div>
                              </div>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${scoreTone(item.score)}`}
                              >
                                Coincidencia textual
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.matchedTerms.slice(0, 4).map((term) => (
                                <span
                                  key={term}
                                  className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-600"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-slate-900/65">
                              <div>
                                <span className="font-medium text-slate-700">NOC:</span>{" "}
                                {item.nocOptions
                                  .slice(0, 2)
                                  .map((option) => `${option.code} ${formatCatalogLabel(option.label)}`)
                                  .join(" · ")}
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">NIC:</span>{" "}
                                {item.nicOptions
                                  .slice(0, 2)
                                  .map((option) => `${option.code} ${formatCatalogLabel(option.label)}`)
                                  .join(" · ")}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {!taxonomySuggestions.length && (
                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/82 px-4 py-5 text-sm text-slate-400">
                          Completa el paso 1 con diagnóstico y hallazgos para activar sugerencias más precisas.
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {activeStep === "nanda" && (
                  <section className={STEP_WINDOW_CLASS}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">3. Diagnóstico NANDA</h2>
                        <p className="mt-1 text-xs text-slate-500">Acepta la sugerencia o cambia el diagnóstico manualmente.</p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-500">
                        Lista rápida
                      </span>
                    </div>

                    <input
                      type="text"
                      value={nandaQuery}
                      onChange={(event) => setNandaQuery(event.target.value)}
                      placeholder="Buscar NANDA por código, etiqueta, dominio..."
                      className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                      <span>Mostrando {filteredNandaOptions.length} de {NANDA_LIBRARY.length} códigos NANDA</span>
                      <button
                        type="button"
                        onClick={() => setShowAllNandaCatalog((current) => !current)}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-600 transition hover:border-slate-300"
                      >
                        {showAllNandaCatalog ? "Solo sugeridos" : "Ver catálogo completo"}
                      </button>
                    </div>

                    <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                      {!filteredNandaOptions.length && <p className={styles.empty}>No hay coincidencias para esta búsqueda. Prueba otra palabra o código, o abre el catálogo completo.</p>}
                      {filteredNandaOptions.map((item) => {
                        const active = item.id === selectedNandaId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => chooseNanda(item.id)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-cyan-400/55 bg-cyan-400/12"
                                : "border-slate-200 bg-white/82 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="text-sm font-medium text-slate-900">
                              {item.code} · {formatCatalogLabel(item.label)}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {formatCatalogLabel(item.domain)} · {formatCatalogLabel(item.classLabel)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedNanda && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/82 p-4">
                        <div className="text-sm font-semibold text-slate-900">
                          Seleccionado: {selectedNanda.code} · {formatCatalogLabel(selectedNanda.label)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {formatCatalogLabel(selectedNanda.domain)} · {formatCatalogLabel(selectedNanda.classLabel)}
                        </div>
                        <div className="mt-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/8 px-3 py-3 text-sm leading-6 text-slate-600">
                          {selectedNandaDescription}
                        </div>
                        {CARE_GUIDES[selectedNanda.code] && <div className={styles.teachingNote}><strong>Aspectos para valorar, no hallazgos confirmados:</strong><ul>{CARE_GUIDES[selectedNanda.code].observations.map(observation => <li key={observation}>• {observation}</li>)}</ul></div>}
                        <label className={styles.diagnosticInput}>{/^riesgo/i.test(selectedNanda.label) ? "Factores de riesgo identificados" : "Factores contribuyentes identificados"}<textarea value={relatedFactorsText} onChange={e => setRelatedFactorsText(e.target.value)} placeholder="Registra solo factores respaldados por la valoración…" rows={2}/></label>
                        {!/^riesgo/i.test(selectedNanda.label) && <label className={styles.diagnosticInput}>Signos y síntomas que sustentan el diagnóstico<textarea value={evidenceText} onChange={e => setEvidenceText(e.target.value)} placeholder="Describe los hallazgos observados en esta persona…" rows={2}/></label>}


                        <div className="mt-3 flex flex-wrap gap-2">
                          {(activeSuggestion?.supportingSigns.length
                            ? activeSuggestion.supportingSigns
                            : selectedNanda.definingCharacteristics.slice(0, 4)
                          ).map((sign) => (
                            <span
                              key={sign}
                              className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] text-slate-600"
                            >
                              {formatCatalogLabel(sign)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {activeStep === "noc" && (
                  <section className={STEP_WINDOW_CLASS}>
                    <h2 className="text-base font-semibold text-slate-900">4. Resultado NOC</h2>
                    <p className="mt-1 text-xs text-slate-500">Elige una etiqueta y ajusta valoración/meta por indicador.</p>

                    <input
                      type="text"
                      value={nocQuery}
                      onChange={(event) => setNocQuery(event.target.value)}
                      placeholder="Buscar NOC por código, etiqueta o indicador..."
                      className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                      <span>Mostrando {filteredNocOptions.length} de {NOC_LIBRARY.length} códigos NOC</span>
                      <button
                        type="button"
                        onClick={() => setShowAllNocCatalog((current) => !current)}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-600 transition hover:border-slate-300"
                      >
                        {showAllNocCatalog ? "Solo sugeridos" : "Ver catálogo completo"}
                      </button>
                    </div>

                    <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                      {!filteredNocOptions.length && <p className={styles.empty}>No hay coincidencias. Selecciona primero un NANDA, prueba otra búsqueda o abre el catálogo completo.</p>}
                      {filteredNocOptions.map((item) => {
                        const active = item.id === selectedNocId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => chooseNoc(item.id)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-emerald-400/55 bg-emerald-400/12"
                                : "border-slate-200 bg-white/82 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="text-sm font-medium text-slate-900">
                              {item.code} · {formatCatalogLabel(item.label)}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {formatCatalogLabel(item.domain)} · Clasificación pendiente de verificar
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedNoc && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/82 p-4">
                        <div className="text-sm font-semibold text-slate-900">
                          Seleccionado: {selectedNoc.code} · {formatCatalogLabel(selectedNoc.label)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Dominio {nocTaxonomy.domainCode} · {nocTaxonomy.domainLabel} · Clase {nocTaxonomy.classCode}
                        </div>
                        <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/8 px-3 py-3 text-sm leading-6 text-slate-600">
                          {selectedNocDescription}
                        </div>
                      </div>
                    )}

                    {selectedNoc && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/82 p-4">
                        <div className="text-sm font-semibold text-slate-900">Indicadores del plan</div>
                        <p className={styles.teachingNote}>{selectedNoc?.indicators.length ? "Indicadores incluidos en el catálogo local." : "Propuestas educativas editables; no son los indicadores oficiales de NOC. Escala local de logro de 1 a 5, que debes adaptar al caso."}</p>
                        <div className={styles.customRow}><input aria-label="Nuevo indicador personalizado" value={customIndicator} onChange={e => setCustomIndicator(e.target.value)} placeholder="Escribe un indicador observable…"/><button type="button" onClick={addIndicator} disabled={!customIndicator.trim()}>Añadir</button></div>
                        <div className="mt-3 space-y-3">
                          {indicatorRows.map((row) => (
                            <div key={row.label} className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                              <label className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={row.active}
                                  disabled={!row.active && selectedIndicatorRows.length >= 5}
                                  onChange={() =>
                                    setIndicatorRows((current) =>
                                      current.map((item) =>
                                        item.label === row.label ? { ...item, active: !item.active } : item
                                      )
                                    )
                                  }
                                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/82 text-cyan-400"
                                />
                                <div className="flex-1">
                                  <div className="text-sm text-slate-800">{formatCatalogLabel(row.label)}</div>
                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <label className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                                      Valoración
                                      <select
                                        value={row.assessment}
                                        onChange={(event) =>
                                          setIndicatorRows((current) =>
                                            current.map((item) =>
                                              item.label === row.label
                                                ? {
                                                    ...item,
                                                    assessment: event.target.value ? Number(event.target.value) as ScaleValue : "",
                                                  }
                                                : item
                                            )
                                          )
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                                      >
                                        <option value="">Sin valorar</option>
                                        {SCALE_OPTIONS.map((value) => (
                                          <option key={value} value={value}>
                                            {scaleLabel(value)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                                      Meta
                                      <select
                                        value={row.goal}
                                        onChange={(event) =>
                                          setIndicatorRows((current) =>
                                            current.map((item) =>
                                              item.label === row.label
                                                ? {
                                                    ...item,
                                                    goal: event.target.value ? Number(event.target.value) as ScaleValue : "",
                                                  }
                                                : item
                                            )
                                          )
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                                      >
                                        <option value="">Sin valorar</option>
                                        {SCALE_OPTIONS.map((value) => (
                                          <option key={value} value={value}>
                                            {scaleLabel(value)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {activeStep === "nic" && (
                  <section className={STEP_WINDOW_CLASS}>
                    <h2 className="text-base font-semibold text-slate-900">5. Intervención NIC</h2>
                    <p className="mt-1 text-xs text-slate-500">Selecciona una NIC y deja activas solo las actividades que usarás.</p>

                    <input
                      type="text"
                      value={nicQuery}
                      onChange={(event) => setNicQuery(event.target.value)}
                      placeholder="Buscar NIC por código, etiqueta o actividad..."
                      className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                      <span>Mostrando {filteredNicOptions.length} de {NIC_LIBRARY.length} códigos NIC</span>
                      <button
                        type="button"
                        onClick={() => setShowAllNicCatalog((current) => !current)}
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-600 transition hover:border-slate-300"
                      >
                        {showAllNicCatalog ? "Solo sugeridos" : "Ver catálogo completo"}
                      </button>
                    </div>

                    <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                      {!filteredNicOptions.length && <p className={styles.empty}>No hay coincidencias. Selecciona primero un NANDA, prueba otra búsqueda o abre el catálogo completo.</p>}
                      {filteredNicOptions.map((item) => {
                        const active = item.id === selectedNicId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => chooseNic(item.id)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-fuchsia-400/55 bg-fuchsia-400/12"
                                : "border-slate-200 bg-white/82 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="text-sm font-medium text-slate-900">
                              {item.code} · {formatCatalogLabel(item.label)}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Intervención del catálogo local
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedNic && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/82 p-4">
                        <div className="text-sm font-semibold text-slate-900">
                          Seleccionado: {selectedNic.code} · {formatCatalogLabel(selectedNic.label)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Campo {nicTaxonomy.domainCode} · {nicTaxonomy.domainLabel} · Clase {nicTaxonomy.classCode}
                        </div>
                        <div className="mt-3 rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/8 px-3 py-3 text-sm leading-6 text-slate-600">
                          {selectedNicDescription}
                        </div>
                      </div>
                    )}

                    {selectedNic && (
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/82 p-4">
                        <div className="text-sm font-semibold text-slate-900">Actividades del plan</div>
                        <p className={styles.teachingNote}>{selectedNic?.activities.length ? "Actividades incluidas en el catálogo local." : "Propuestas educativas para adaptar al contexto y al rol profesional; no reproducen el listado oficial de NIC."}</p>
                        <div className={styles.customRow}><input aria-label="Nueva actividad personalizada" value={customActivity} onChange={e => setCustomActivity(e.target.value)} placeholder="Añade una actividad específica…"/><button type="button" onClick={addActivity} disabled={!customActivity.trim() || selectedActivities.length >= 6}>Añadir</button></div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {availableActivities.map((activity) => {
                            const active = selectedActivities.includes(activity);
                            return (
                              <button
                                key={activity}
                                type="button"
                                disabled={!active && selectedActivities.length >= 6}
                                onClick={() =>
                                  setSelectedActivities((current) =>
                                    current.includes(activity)
                                      ? current.filter((item) => item !== activity)
                                      : [...current, activity]
                                  )
                                }
                                className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${
                                  active
                                    ? "border-fuchsia-400/55 bg-fuchsia-400/14 text-slate-900"
                                    : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                {formatCatalogLabel(activity)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {activeStep === "evaluation" && (
                  <section className={STEP_WINDOW_CLASS}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">6. Evaluación y salida</h2>
                        <p className="mt-1 text-xs text-slate-500">Cierra el PAE y genera el mismo formato listo para imprimir.</p>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-500">
                        Poca escritura
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {EVALUATION_PRESETS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setEvaluationStatus(option.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            evaluationStatus === option.id
                              ? "border-cyan-400/55 bg-cyan-400/12 text-cyan-700"
                              : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <label className="mt-4 block text-xs text-slate-600">
                      Nota breve opcional
                      <textarea
                        value={evaluationNote}
                        onChange={(event) => setEvaluationNote(event.target.value)}
                        rows={3}
                        placeholder="Ej. tolera oxigenoterapia, se educa sobre signos de alarma, continúa vigilancia..."
                        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300/40"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-100"
                      >
                        Imprimir / PDF
                      </button>
                      <button
                        type="button"
                        onClick={resetAssistantForm}
                        className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Reiniciar
                      </button>
                    </div>
                  </section>
                )}

                <section className={SECTION_CARD}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Navegación
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{activeStepMeta.label}</div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-500">
                      Vista viva
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      disabled={!canGoBack}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-300"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={goToNextStep}
                      disabled={!canGoForward}
                      className="flex-1 rounded-2xl bg-cyan-100 px-4 py-2.5 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white"
                    >
                      Siguiente
                    </button>
                  </div>
                </section>
              </aside>

              <section className={`${styles.summary} no-print ${showPreview ? styles.editorHidden : ""}`} aria-label="Resumen del plan">
                <span className={styles.eyebrow}>TU PLAN / EN CONSTRUCCIÓN</span><h2>{patientName || "Paciente por definir"}</h2><p>{medicalDiagnosis || "Empieza por los datos y la valoración clínica."}</p>
                <div className={styles.summaryChain}>{[{ tag: "NANDA", item: selectedNanda, step: "nanda" }, { tag: "NOC", item: selectedNoc, step: "noc" }, { tag: "NIC", item: selectedNic, step: "nic" }].map(({ tag, item, step }) => <button key={tag} onClick={() => goToStep(step as AssistantStep)}><span>{tag}</span><strong>{item ? formatCatalogLabel(item.label) : "Pendiente de seleccionar"}</strong><small>{item ? item.code : "Seleccionar →"}</small></button>)}</div>
                <div className={styles.summaryCounts}><div><b>{selectedIndicatorRows.length}</b><span>Indicadores</span></div><div><b>{selectedActivityRows.length}</b><span>Actividades</span></div></div>
                <div className={styles.teachingNote}>Las sugerencias se basan en coincidencias y guías educativas locales. Confirma cada elección con la valoración. La importación no incluye las definiciones completas ni vínculos oficiales NNN. El formato admite hasta 5 indicadores y 6 actividades.</div>
                <a href="https://nursing.uiowa.edu/center-for-nursing-classification-and-clinical-effectiveness" target="_blank" rel="noreferrer" className={styles.sourceLink}>Acerca de NIC y NOC ↗</a>
              </section>
              <section className={`${styles.preview} ${showPreview ? styles.previewOpen : ""}`}>
                <div className="no-print mb-4 flex items-center justify-between gap-3 px-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Vista final del formato</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      La hoja replica la estructura del archivo institucional y se imprime en horizontal.
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] text-slate-500">
                    Actualización en vivo
                  </div>
                </div>

                <div
                  id="pae-print-sheet"
                  className="mx-auto w-[1120px] max-w-full rounded-[28px] bg-white p-7 text-black shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
                >
                  <div className="grid grid-cols-[1fr_auto] gap-6 text-[13px] font-semibold">
                    <div className="space-y-0.5 uppercase leading-snug">
                      <div>Facultad de Ciencias de la Salud y Desarrollo Humano</div>
                      <div>Carrera de Enfermería</div>
                      <div>Internado Rotativo - Cohorte Mayo</div>
                    </div>

                    <div className="justify-self-end text-right text-[#0d66ad]">
                      <div className="inline-flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#0d66ad] text-sm font-bold">
                          UE
                        </div>
                        <div className="leading-tight">
                          <div className="text-[13px] font-semibold text-[#6b7280]">Universidad</div>
                          <div className="text-[18px] font-bold text-[#0d66ad]">Ecotec</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-[1fr_auto] gap-6 text-[12px] font-semibold">
                    <div>
                      <div className="uppercase">Datos de identificación</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="min-w-[68px]">Nombre:</span>
                        <span className="flex-1 border-b border-dotted border-black pb-0.5">{printValue(patientName)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="min-w-[68px]">Edad:</span>
                        <span className="flex-1 border-b border-dotted border-black pb-0.5">{printValue(patientAge)}</span>
                      </div>
                    </div>

                    <div className="w-[230px]">
                      <div className="flex items-center gap-2">
                        <span className="min-w-[70px]">Cama #</span>
                        <span className="flex-1 border-b border-dotted border-black pb-0.5">{printValue(bedNumber)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="min-w-[92px]">Nº H clínica:</span>
                        <span className="flex-1 border-b border-dotted border-black pb-0.5">{printValue(clinicalRecord)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-center text-[14px] font-bold uppercase underline">
                    Formato de Plan de Atención de Enfermería
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">Borrador educativo. Indicadores, actividades y asociaciones locales deben revisarse; la clasificación oficial incompleta no se infiere.</p>

                  <div className="mt-4 grid grid-cols-[1.05fr_1.28fr_1.28fr_1.1fr] border border-black text-[11px] leading-[1.25]">
                    <div className="flex min-h-[470px] flex-col border-r border-black">
                      <div className="border-b border-black px-2 py-1.5 text-[11px] font-bold uppercase">
                        Diagnóstico de Enfermería
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Dominio:</div>
                        <div className="mt-1 min-h-[28px]">{printValue(formatCatalogLabel(selectedNanda?.domain ?? ""))}</div>
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Clase:</div>
                        <div className="mt-1 min-h-[28px]">{printValue(formatCatalogLabel(selectedNanda?.classLabel ?? ""))}</div>
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Etiqueta diagnóstica:</div>
                        <div className="mt-1 min-h-[34px]">
                          {printValue(
                            selectedNanda
                              ? `${selectedNanda.code} · ${formatCatalogLabel(selectedNanda.label)}`
                              : ""
                          )}
                        </div>
                      </div>
                      <div className="flex-1 px-2 py-3">
                        <div className="space-y-2"><p><strong>{/^riesgo/i.test(selectedNanda?.label ?? "") ? "Factores de riesgo:" : "Factores contribuyentes:"}</strong> {relatedFactorsText || "Pendiente de registrar"}</p>{!/^riesgo/i.test(selectedNanda?.label ?? "") && <p><strong>Hallazgos:</strong> {evidenceText || "Pendiente de registrar"}</p>}
                          {(activeSuggestion?.supportingSigns.length
                            ? activeSuggestion.supportingSigns
                            : selectedNanda?.definingCharacteristics.slice(0, 5) ?? []
                          ).map((item) => (
                            <div key={item}>• {formatCatalogLabel(item)}</div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex min-h-[470px] flex-col border-r border-black">
                      <div className="border-b border-black px-2 py-1.5 text-[11px] font-bold uppercase">
                        Resultados de Enfermería
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Dominio:</div>
                        <div className="mt-1 min-h-[28px]">
                          {printValue(
                            selectedNoc
                              ? `Dominio ${nocTaxonomy.domainCode} · ${nocTaxonomy.domainLabel} · NOC ${selectedNoc.code}`
                              : ""
                          )}
                        </div>
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Clase:</div>
                        <div className="mt-1 min-h-[28px]">
                          {printValue(
                            selectedNoc
                              ? `Clase ${nocTaxonomy.classCode} · ${nocTaxonomy.classLabel}`
                              : ""
                          )}
                        </div>
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Etiqueta:</div>
                        <div className="mt-1 min-h-[34px]">
                          {printValue(selectedNoc ? `${selectedNoc.code} · ${formatCatalogLabel(selectedNoc.label)}` : "")}
                        </div>
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Escala:</div>
                        <div className="mt-1 min-h-[24px]">Escala educativa de logro: 1 a 5 (adaptar al caso)</div>
                      </div>
                      <div className="flex-1">
                        <table className="h-full w-full border-collapse">
                          <thead>
                            <tr className="border-b border-black">
                              <th className="border-r border-black px-2 py-1 text-left font-bold">Indicadores</th>
                              <th className="border-r border-black px-2 py-1 text-left font-bold">Valoración</th>
                              <th className="px-2 py-1 text-left font-bold">Meta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[0, 1, 2, 3, 4].map((rowIndex) => {
                              const row = selectedIndicatorRows[rowIndex];
                              return (
                                <tr key={rowIndex} className="border-b border-black last:border-b-0">
                                  <td className="border-r border-black px-2 py-2 align-top">
                                    {row ? formatCatalogLabel(row.label) : "\u00A0"}
                                  </td>
                                  <td className="border-r border-black px-2 py-2 align-top">
                                    {row ? row.assessment : "\u00A0"}
                                  </td>
                                  <td className="px-2 py-2 align-top">{row ? row.goal : "\u00A0"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex min-h-[470px] flex-col border-r border-black">
                      <div className="border-b border-black px-2 py-1.5 text-[11px] font-bold uppercase">
                        Intervenciones de Enfermería
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Dominio:</div>
                        <div className="mt-1 min-h-[28px]">
                          {printValue(
                            selectedNic
                              ? `Campo ${nicTaxonomy.domainCode} · ${nicTaxonomy.domainLabel} · NIC ${selectedNic.code}`
                              : ""
                          )}
                        </div>
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Clase:</div>
                        <div className="mt-1 min-h-[28px]">
                          {printValue(
                            selectedNic
                              ? `Clase ${nicTaxonomy.classCode} · ${nicTaxonomy.classLabel}`
                              : ""
                          )}
                        </div>
                      </div>
                      <div className="border-b border-black px-2 py-2">
                        <div className="font-bold uppercase">Etiqueta:</div>
                        <div className="mt-1 min-h-[34px]">
                          {printValue(selectedNic ? `${selectedNic.code} · ${formatCatalogLabel(selectedNic.label)}` : "")}
                        </div>
                      </div>
                      <div className="flex-1 border-t border-black px-2 py-2">
                        <div className="font-bold uppercase">Actividades</div>
                        <div className="mt-2 space-y-2">
                          {selectedActivityRows.map((activity) => (
                            <div key={activity}>• {formatCatalogLabel(activity)}</div>
                          ))}
                          {!selectedActivityRows.length && <div>{printValue("")}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="flex min-h-[470px] flex-col">
                      <div className="border-b border-black px-2 py-1.5 text-[11px] font-bold uppercase">Evaluación</div>
                      <div className="flex-1 px-2 py-2 whitespace-pre-line">{printValue(evaluationText)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.05fr_1.28fr_1.28fr_1.1fr] border-x border-b border-black text-[11px]">
                    <div className="min-h-[88px] border-r border-black px-2 py-2">
                      <div className="font-bold">Diagnóstico médico</div>
                      <div className="mt-2">{printValue(medicalDiagnosis)}</div>
                    </div>
                    <div className="min-h-[88px] border-r border-black px-2 py-2">
                      <div className="font-bold">Tratamiento Farmacológico: Grupos</div>
                      <div className="mt-2">{printValue(pharmacologicGroup)}</div>
                    </div>
                    <div className="min-h-[88px] border-r border-black px-2 py-2 text-center">
                      <div className="font-bold">Tipo de Dieta</div>
                      <div className="mt-2 text-left">{printValue(dietType)}</div>
                    </div>
                    <div className="min-h-[88px] px-2 py-2">
                      <div className="font-bold">Nombre del Interno de enfermería</div>
                      <div className="mt-2">{printValue(internName)}</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @page {
          size: landscape;
          margin: 10mm;
        }

        @media print {
          html:has(#pae-print-sheet), body:has(#pae-print-sheet), body:has(#pae-print-sheet) #app, body:has(#pae-print-sheet) #app > div {
            height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important;
          }
          body:has(#pae-print-sheet)::before, body:has(#pae-print-sheet)::after { display: none !important; }
          body {
            background: #ffffff !important;
          }

          .no-print {
            display: none !important;
          }

          body * {
            visibility: hidden;
          }

          #pae-print-sheet,
          #pae-print-sheet * {
            visibility: visible;
          }

          #pae-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border-radius: 0;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
