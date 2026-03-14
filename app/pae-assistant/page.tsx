"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
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
  type NicIntervention,
  type NocOutcome,
} from "@/src/lib/paeIntelligent";

type ScaleValue = 1 | 2 | 3 | 4 | 5;

type IndicatorPlanRow = {
  label: string;
  assessment: ScaleValue;
  goal: ScaleValue;
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
  "rounded-[28px] border border-white/10 bg-[#09111f]/92 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]";
const STEP_WINDOW_CLASS =
  "rounded-[28px] border border-white/10 bg-[#09111f]/96 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]";
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
  if (value === 1) return "1 · Grave";
  if (value === 2) return "2 · Bajo";
  if (value === 3) return "3 · Medio";
  if (value === 4) return "4 · Bueno";
  return "5 · Óptimo";
}

function defaultOutcomeIndicators(outcome: NocOutcome | null) {
  if (!outcome) return [];
  if (outcome.indicators.length) return outcome.indicators.slice(0, 5);

  const focus = formatCatalogLabel(outcome.label).toLowerCase();
  return [
    `Valoración inicial de ${focus}`,
    `Respuesta clínica frente a ${focus}`,
    `Cumplimiento de meta para ${focus}`,
    "Seguridad del paciente durante el plan",
  ];
}

function defaultNicActivities(intervention: NicIntervention | null) {
  if (!intervention) return [];
  if (intervention.activities.length) return intervention.activities.slice(0, 6);

  const focus = formatCatalogLabel(intervention.label).toLowerCase();
  return [
    `Aplicar acciones priorizadas para ${focus}.`,
    `Vigilar respuesta clínica y tolerancia del paciente.`,
    "Registrar actividades, hallazgos y respuesta en enfermería.",
    "Reforzar educación breve al paciente o familia según el caso.",
  ];
}

function buildEvaluationText(statusId: string, note: string) {
  const preset = EVALUATION_PRESETS.find((item) => item.id === statusId)?.template ?? "";
  return [preset, note.trim()].filter(Boolean).join(" ");
}

function scoreTone(score: number) {
  if (score >= 60) return "border-emerald-400/35 bg-emerald-400/12 text-emerald-100";
  if (score >= 35) return "border-sky-400/35 bg-sky-400/12 text-sky-100";
  if (score >= 18) return "border-amber-400/35 bg-amber-400/12 text-amber-100";
  return "border-white/15 bg-white/5 text-white/70";
}

function createTaxonomyMeta(
  domainCode: string,
  domainLabel: string,
  classCode: string,
  classLabel: string
): TaxonomyMeta {
  return { domainCode, domainLabel, classCode, classLabel };
}

function inferNocTaxonomy(outcome: NocOutcome | null): TaxonomyMeta {
  if (!outcome) return createTaxonomyMeta("", "", "", "");

  const code = Number(outcome.code);
  const text = normalizeSearch(outcome.label);

  if (/control del riesgo|prevencion|seguridad|conducta preventiva|riesgo/.test(text)) {
    return createTaxonomyMeta("IV", "Conocimiento y conducta de salud", "T", "Control del riesgo y seguridad");
  }

  if (/conocimiento|educacion|aprendizaje/.test(text)) {
    return createTaxonomyMeta("IV", "Conocimiento y conducta de salud", "R", "Conocimiento sobre la salud");
  }

  if (/autocontrol|automanejo|conducta|adherencia|cumplimiento/.test(text)) {
    return createTaxonomyMeta("IV", "Conocimiento y conducta de salud", "Q", "Conducta de salud");
  }

  if (/sintoma|dolor|nausea|fatiga|malestar/.test(text)) {
    return createTaxonomyMeta("IV", "Conocimiento y conducta de salud", "S", "Control de síntomas");
  }

  if (/familia|cuidador|parental|crianza|lactancia/.test(text)) {
    return createTaxonomyMeta("VI", "Salud familiar", "V", "Estado de salud familiar");
  }

  if (/comunidad|comunitaria|poblacion|salud publica/.test(text)) {
    return createTaxonomyMeta("VII", "Salud comunitaria", "Y", "Bienestar comunitario");
  }

  if (/ansiedad|depres|afrontamiento|duelo|miedo|autoestima|estres|espiritual|soledad/.test(text)) {
    return createTaxonomyMeta("III", "Salud psicosocial", "O", "Bienestar psicológico");
  }

  if (/interaccion|rol|apoyo social|relacion|violencia/.test(text)) {
    return createTaxonomyMeta("III", "Salud psicosocial", "P", "Adaptación psicosocial");
  }

  if (/satisfaccion|calidad de vida|salud personal|bienestar general/.test(text)) {
    return createTaxonomyMeta("V", "Salud percibida", "U", "Salud y calidad de vida percibida");
  }

  if (/movilidad|deambul|transfer|caminar|actividad|ejercicio|marcha/.test(text)) {
    return createTaxonomyMeta("I", "Salud funcional", "C", "Movilidad");
  }

  if (/autocuidado|bano|higiene|vestido|alimentacion independiente/.test(text)) {
    return createTaxonomyMeta("I", "Salud funcional", "D", "Autocuidado");
  }

  if (/energia|resistencia|sueno|descanso|fatiga/.test(text) || (code >= 1 && code <= 399)) {
    return createTaxonomyMeta("I", "Salud funcional", "A", "Mantenimiento de la energía");
  }

  if (/crecimiento|desarrollo/.test(text)) {
    return createTaxonomyMeta("I", "Salud funcional", "B", "Crecimiento y desarrollo");
  }

  if (/respir|ventila|gaseoso|oxigen|cardi|hemodin|perfusion|circula/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "E", "Cardiopulmonar");
  }

  if (/urin|intestinal|elimin|renal|diuresis|continencia/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "F", "Eliminación");
  }

  if (/liquido|hidrat|electrol|potasio|sodio/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "G", "Líquidos y electrólitos");
  }

  if (/infecc|inmun|sepsis/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "H", "Respuesta inmune");
  }

  if (/gluc|metabol|diabet|endocr|peso|nutricion metabolica/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "I", "Regulación metabólica");
  }

  if (/conciencia|orientacion|memoria|neurol|cogn/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "J", "Neurocognitiva");
  }

  if (/nutric|deglu|digest|gastro|nausea|vomito|apetito/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "K", "Digestión y nutrición");
  }

  if (/piel|herida|cicatr|tejid|ulcera|mucosa/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "L", "Integridad tisular");
  }

  if (/visual|audicion|sensorial/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "M", "Función sensorial");
  }

  if (/temper|termorreg|fiebre|hiperterm/.test(text)) {
    return createTaxonomyMeta("II", "Salud fisiológica", "N", "Termorregulación");
  }

  if (code >= 1601 && code <= 1999) {
    return createTaxonomyMeta("IV", "Conocimiento y conducta de salud", "Q", "Conducta de salud");
  }

  if (code >= 1200 && code <= 1599) {
    return createTaxonomyMeta("III", "Salud psicosocial", "O", "Bienestar psicológico");
  }

  return createTaxonomyMeta("II", "Salud fisiológica", "I", "Regulación fisiológica");
}

function inferNicTaxonomy(intervention: NicIntervention | null): TaxonomyMeta {
  if (!intervention) return createTaxonomyMeta("", "", "", "");

  const text = normalizeSearch(intervention.label);

  if (/control de infecciones|infecc|aislamiento|precauc|caida|seguridad|proteccion|vigilancia|riesgo/.test(text)) {
    return createTaxonomyMeta("4", "Seguridad", "V", "Control de riesgos");
  }

  if (/resucit|reanim|paro|crisis|emergenc|triage|desastre/.test(text)) {
    return createTaxonomyMeta("4", "Seguridad", "W", "Cuidados en crisis");
  }

  if (/familia|cuidador|lactancia|parental|crianza|apoyo familiar/.test(text)) {
    return createTaxonomyMeta("5", "Familia", "X", "Cuidados familiares");
  }

  if (/comunidad|comunitaria|salud publica|poblacion|vigilancia epidemiologica/.test(text)) {
    return createTaxonomyMeta("7", "Comunidad", "b", "Salud comunitaria");
  }

  if (/ensenanza|educacion|asesoramiento|orientacion|informacion/.test(text)) {
    return createTaxonomyMeta("3", "Conductual", "S", "Educación del paciente");
  }

  if (/ansiedad|apoyo emocional|afrontamiento|escucha|comunicacion|conducta|terapia/.test(text)) {
    return createTaxonomyMeta("3", "Conductual", "R", "Facilitación del afrontamiento");
  }

  if (/movilidad|deambul|posicion|ejercicio|actividad|descanso|sueno/.test(text)) {
    return createTaxonomyMeta("1", "Fisiológico: básico", "A", "Control de la actividad y el ejercicio");
  }

  if (/elimin|urin|intestinal|continencia|sonda/.test(text)) {
    return createTaxonomyMeta("1", "Fisiológico: básico", "B", "Control de la eliminación");
  }

  if (/inmovilidad|transferencia|yeso|traccion/.test(text)) {
    return createTaxonomyMeta("1", "Fisiológico: básico", "C", "Control de la inmovilidad");
  }

  if (/nutric|aliment|deglu|dieta/.test(text)) {
    return createTaxonomyMeta("1", "Fisiológico: básico", "D", "Apoyo nutricional");
  }

  if (/confort|dolor|masaje|relajacion/.test(text)) {
    return createTaxonomyMeta("1", "Fisiológico: básico", "E", "Promoción del confort físico");
  }

  if (/autocuidado|higiene|bano|vestido|aseo/.test(text)) {
    return createTaxonomyMeta("1", "Fisiológico: básico", "F", "Facilitación del autocuidado");
  }

  if (/electrol|acido|base|hidrat|liquido/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "G", "Control electrolítico y acidobásico");
  }

  if (/medic|farmac|sedac|analges|quimio|insulina/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "H", "Control farmacológico");
  }

  if (/neurol|convulsion|conciencia|cogn|presion intracraneal/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "I", "Control neurológico");
  }

  if (/perioperator|quirurg|anestesia/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "J", "Cuidados perioperatorios");
  }

  if (/respir|oxigen|ventil|via aerea|aspiracion/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "K", "Control respiratorio");
  }

  if (/piel|herida|cicatr|ulcera|curacion|drenaje/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "L", "Control de la piel y heridas");
  }

  if (/temper|termorreg|fiebre/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "M", "Termorregulación");
  }

  if (/hemodinam|perfusion|circula|choque|cardiac|hemorrag/.test(text)) {
    return createTaxonomyMeta("2", "Fisiológico: complejo", "N", "Control de la perfusión tisular");
  }

  if (/gestion|coordinacion|alta|derivacion|caso|documentacion/.test(text)) {
    return createTaxonomyMeta("6", "Sistema sanitario", "Z", "Gestión del sistema sanitario");
  }

  if (/registro|informat|reporte|comunicacion interprofesional/.test(text)) {
    return createTaxonomyMeta("6", "Sistema sanitario", "a", "Gestión de la información");
  }

  return createTaxonomyMeta("2", "Fisiológico: complejo", "H", "Intervención fisiológica compleja");
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
  const [lastNandaSeeded, setLastNandaSeeded] = useState("");
  const [indicatorRows, setIndicatorRows] = useState<IndicatorPlanRow[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [evaluationStatus, setEvaluationStatus] = useState<(typeof EVALUATION_PRESETS)[number]["id"]>("pendiente");
  const [evaluationNote, setEvaluationNote] = useState("");
  const [activeStep, setActiveStep] = useState<AssistantStep>("data");

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

  const filteredNandaOptions = useMemo(() => {
    const query = normalizeSearch(deferredNandaQuery);
    const base = uniqueById([...taxonomySuggestions.map((item) => item.nanda), ...nandaPool]);
    if (!query) return base.slice(0, 10);

    return base
      .filter((item) =>
        [item.code, item.label, item.domain, item.classLabel].some((field) =>
          normalizeSearch(field).includes(query)
        )
      )
      .slice(0, 10);
  }, [deferredNandaQuery, nandaPool, taxonomySuggestions]);

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
    if (!selectedNanda) return [];

    const query = normalizeSearch(deferredNocQuery);
    const base = uniqueById([...suggestedNocOptions, ...NOC_LIBRARY]);
    if (!query) return base.slice(0, 8);

    return base
      .filter((item) =>
        [item.code, item.label, item.domain, ...item.indicators].some((field) =>
          normalizeSearch(field).includes(query)
        )
      )
      .slice(0, 8);
  }, [deferredNocQuery, selectedNanda, suggestedNocOptions]);

  const filteredNicOptions = useMemo(() => {
    if (!selectedNanda) return [];

    const query = normalizeSearch(deferredNicQuery);
    const base = uniqueById([...suggestedNicOptions, ...NIC_LIBRARY]);
    if (!query) return base.slice(0, 8);

    return base
      .filter((item) =>
        [item.code, item.label, item.classLabel, ...item.activities].some((field) =>
          normalizeSearch(field).includes(query)
        )
      )
      .slice(0, 8);
  }, [deferredNicQuery, selectedNanda, suggestedNicOptions]);

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
    () => defaultNicActivities(selectedNic),
    [selectedNic]
  );

  const activeSuggestion = useMemo(
    () => taxonomySuggestions.find((item) => item.nanda.id === selectedNandaId) ?? null,
    [selectedNandaId, taxonomySuggestions]
  );

  const evaluationText = useMemo(
    () => buildEvaluationText(evaluationStatus, evaluationNote),
    [evaluationNote, evaluationStatus]
  );

  useEffect(() => {
    if (!selectedNandaId && taxonomySuggestions[0]) {
      setSelectedNandaId(taxonomySuggestions[0].nanda.id);
    }
  }, [selectedNandaId, taxonomySuggestions]);

  useEffect(() => {
    if (!selectedNanda) {
      setSelectedNocId("");
      setSelectedNicId("");
      setLastNandaSeeded("");
      return;
    }

    if (selectedNanda.id === lastNandaSeeded) return;

    setSelectedNocId(suggestedNocOptions[0]?.id ?? "");
    setSelectedNicId(suggestedNicOptions[0]?.id ?? "");
    setLastNandaSeeded(selectedNanda.id);
  }, [lastNandaSeeded, selectedNanda, suggestedNicOptions, suggestedNocOptions]);

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
          assessment: index === 0 ? 2 : 3,
          goal: 4,
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

  const selectedIndicatorRows = indicatorRows.filter((item) => item.active).slice(0, 5);
  const selectedActivityRows = selectedActivities.slice(0, 6);
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
        complete: Boolean(selectedNoc && selectedIndicatorRows.length),
        summary: selectedNoc ? `${selectedNoc.code} ${formatCatalogLabel(selectedNoc.label)}` : "Sin NOC",
      },
      nic: {
        complete: Boolean(selectedNic && selectedActivityRows.length),
        summary: selectedNic ? `${selectedNic.code} ${formatCatalogLabel(selectedNic.label)}` : "Sin NIC",
      },
      evaluation: {
        complete: Boolean(evaluationText.trim()),
        summary: evaluationText.trim() || "Pendiente de evaluación",
      },
    }),
    [
      evaluationText,
      medicalDiagnosis,
      patientName,
      selectedActivityRows.length,
      selectedIndicatorRows.length,
      selectedNic,
      selectedNanda,
      selectedNoc,
      taxonomySuggestions,
    ]
  );

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
    setLastNandaSeeded("");
    setIndicatorRows([]);
    setSelectedActivities([]);
    setEvaluationStatus("pendiente");
    setEvaluationNote("");
    setActiveStep("data");
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1640px]">
            <header className="no-print rounded-[30px] border border-white/10 bg-[#09111f]/92 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                    Nueva ayuda educativa
                  </div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">PAE asistido</h1>
                  <p className="mt-2 max-w-3xl text-sm text-white/68">
                    Escribe el diagnóstico médico o problema principal, recibe sugerencias NANDA, NOC y NIC,
                    elige por listas y genera el plan en el formato institucional listo para imprimir.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-white/70">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    Contexto sugerido: {getPaeContextLabel(assistantQuery ? inferredContext : "all")}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    NANDA {NANDA_LIBRARY.length} · NOC {NOC_LIBRARY.length} · NIC {NIC_LIBRARY.length}
                  </span>
                </div>
              </div>
            </header>

            <div className="mt-6 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
              <aside className="no-print space-y-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto xl:pr-1">
                <section className={SECTION_CARD}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Llenado guiado
                      </div>
                      <h2 className="mt-1 text-base font-semibold text-white">
                        Paso {activeStepIndex + 1} de {ASSISTANT_STEPS.length}
                      </h2>
                      <p className="mt-1 text-xs text-white/60">{activeStepMeta.helper}</p>
                    </div>
                    <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100">
                      {Math.round(stepProgress)}%
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {ASSISTANT_STEPS.map((step, index) => {
                      const active = step.id === activeStep;
                      const complete = stepState[step.id].complete;

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => goToStep(step.id)}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${
                            active
                              ? "border-cyan-400/55 bg-cyan-400/12"
                              : complete
                              ? "border-emerald-400/25 bg-emerald-400/10"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white">
                              {index + 1}. {step.shortLabel}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                              {complete ? "listo" : "editar"}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-white/55 line-clamp-2">
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
                        <h2 className="text-base font-semibold text-white">1. Datos y motivo clínico</h2>
                        <p className="mt-1 text-xs text-white/60">
                          Completa la base del caso y el PDF se actualizará a la derecha.
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                        Ventana 1
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-white/70">
                        Nombre
                        <input
                          type="text"
                          value={patientName}
                          onChange={(event) => setPatientName(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                        />
                      </label>
                      <label className="text-xs text-white/70">
                        Edad
                        <input
                          type="text"
                          value={patientAge}
                          onChange={(event) => setPatientAge(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                        />
                      </label>
                      <label className="text-xs text-white/70">
                        Nº H clínica
                        <input
                          type="text"
                          value={clinicalRecord}
                          onChange={(event) => setClinicalRecord(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                        />
                      </label>
                      <label className="text-xs text-white/70">
                        Cama #
                        <input
                          type="text"
                          value={bedNumber}
                          onChange={(event) => setBedNumber(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block text-xs text-white/70">
                      Diagnóstico médico o problema principal
                      <textarea
                        value={medicalDiagnosis}
                        onChange={(event) => setMedicalDiagnosis(event.target.value)}
                        rows={3}
                        placeholder="Ej. neumonía con hipoxemia, dolor postoperatorio, riesgo de infección..."
                        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                      />
                    </label>

                    <label className="mt-3 block text-xs text-white/70">
                      Hallazgos o valoración breve
                      <textarea
                        value={assessmentSummary}
                        onChange={(event) => setAssessmentSummary(event.target.value)}
                        rows={3}
                        placeholder="Ej. disnea, SpO2 88%, dolor 8/10, herida quirúrgica limpia..."
                        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
                      />
                    </label>

                    <div className="mt-4 grid gap-3">
                      <label className="text-xs text-white/70">
                        Tratamiento farmacológico / grupos
                        <input
                          type="text"
                          value={pharmacologicGroup}
                          onChange={(event) => setPharmacologicGroup(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                        />
                      </label>
                      <label className="text-xs text-white/70">
                        Tipo de dieta
                        <input
                          type="text"
                          value={dietType}
                          onChange={(event) => setDietType(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                        />
                      </label>
                      <label className="text-xs text-white/70">
                        Nombre del interno/a
                        <input
                          type="text"
                          value={internName}
                          onChange={(event) => setInternName(event.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                        />
                      </label>
                    </div>
                  </section>
                )}

                {activeStep === "suggestions" && (
                  <section className={STEP_WINDOW_CLASS}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-white">2. Sugerencias automáticas</h2>
                        <p className="mt-1 text-xs text-white/60">
                          Elige una propuesta y luego la afinas en las siguientes ventanitas.
                        </p>
                      </div>
                      <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100">
                        {assistantQuery ? getPaeContextLabel(inferredContext) : "Sin contexto"}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {taxonomySuggestions.map((item) => {
                        const selected = item.nanda.id === selectedNandaId;
                        return (
                          <button
                            key={item.nanda.id}
                            type="button"
                            onClick={() => {
                              setSelectedNandaId(item.nanda.id);
                              setSelectedNocId(item.nocOptions[0]?.id ?? "");
                              setSelectedNicId(item.nicOptions[0]?.id ?? "");
                              goToStep("nanda");
                            }}
                            className={`w-full rounded-[24px] border p-4 text-left transition ${
                              selected
                                ? "border-cyan-400/55 bg-cyan-400/12 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
                                : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-white">
                                  {item.nanda.code} · {formatCatalogLabel(item.nanda.label)}
                                </div>
                                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                                  {formatCatalogLabel(item.nanda.domain)} · {formatCatalogLabel(item.nanda.classLabel)}
                                </div>
                              </div>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${scoreTone(item.score)}`}
                              >
                                {item.score} pts
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.matchedTerms.slice(0, 4).map((term) => (
                                <span
                                  key={term}
                                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/75"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-white/65">
                              <div>
                                <span className="font-medium text-white/82">NOC:</span>{" "}
                                {item.nocOptions
                                  .slice(0, 2)
                                  .map((option) => `${option.code} ${formatCatalogLabel(option.label)}`)
                                  .join(" · ")}
                              </div>
                              <div>
                                <span className="font-medium text-white/82">NIC:</span>{" "}
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
                        <div className="rounded-[24px] border border-dashed border-white/12 bg-black/20 px-4 py-5 text-sm text-white/55">
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
                        <h2 className="text-base font-semibold text-white">3. Diagnóstico NANDA</h2>
                        <p className="mt-1 text-xs text-white/60">Acepta la sugerencia o cambia el diagnóstico manualmente.</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
                        Lista rápida
                      </span>
                    </div>

                    <input
                      type="text"
                      value={nandaQuery}
                      onChange={(event) => setNandaQuery(event.target.value)}
                      placeholder="Buscar NANDA por código, etiqueta, dominio..."
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                    />

                    <div className="mt-3 space-y-2">
                      {filteredNandaOptions.map((item) => {
                        const active = item.id === selectedNandaId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedNandaId(item.id)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-cyan-400/55 bg-cyan-400/12"
                                : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/5"
                            }`}
                          >
                            <div className="text-sm font-medium text-white">
                              {item.code} · {formatCatalogLabel(item.label)}
                            </div>
                            <div className="mt-1 text-xs text-white/55">
                              {formatCatalogLabel(item.domain)} · {formatCatalogLabel(item.classLabel)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedNanda && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-sm font-semibold text-white">
                          Seleccionado: {selectedNanda.code} · {formatCatalogLabel(selectedNanda.label)}
                        </div>
                        <div className="mt-2 text-xs text-white/60">
                          {formatCatalogLabel(selectedNanda.domain)} · {formatCatalogLabel(selectedNanda.classLabel)}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(activeSuggestion?.supportingSigns.length
                            ? activeSuggestion.supportingSigns
                            : selectedNanda.definingCharacteristics.slice(0, 4)
                          ).map((sign) => (
                            <span
                              key={sign}
                              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/75"
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
                    <h2 className="text-base font-semibold text-white">4. Resultado NOC</h2>
                    <p className="mt-1 text-xs text-white/60">Elige una etiqueta y ajusta valoración/meta por indicador.</p>

                    <input
                      type="text"
                      value={nocQuery}
                      onChange={(event) => setNocQuery(event.target.value)}
                      placeholder="Buscar NOC por código, etiqueta o indicador..."
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                    />

                    <div className="mt-3 space-y-2">
                      {filteredNocOptions.map((item) => {
                        const active = item.id === selectedNocId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedNocId(item.id)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-emerald-400/55 bg-emerald-400/12"
                                : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/5"
                            }`}
                          >
                            <div className="text-sm font-medium text-white">
                              {item.code} · {formatCatalogLabel(item.label)}
                            </div>
                            <div className="mt-1 text-xs text-white/55">
                              {formatCatalogLabel(item.domain)} · Clase {inferNocTaxonomy(item).classCode}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {!!availableIndicators.length && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-sm font-semibold text-white">Indicadores</div>
                        <div className="mt-3 space-y-3">
                          {indicatorRows.map((row) => (
                            <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <label className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={row.active}
                                  onChange={() =>
                                    setIndicatorRows((current) =>
                                      current.map((item) =>
                                        item.label === row.label ? { ...item, active: !item.active } : item
                                      )
                                    )
                                  }
                                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/20 text-cyan-400"
                                />
                                <div className="flex-1">
                                  <div className="text-sm text-white/88">{formatCatalogLabel(row.label)}</div>
                                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <label className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                                      Valoración
                                      <select
                                        value={row.assessment}
                                        onChange={(event) =>
                                          setIndicatorRows((current) =>
                                            current.map((item) =>
                                              item.label === row.label
                                                ? {
                                                    ...item,
                                                    assessment: Number(event.target.value) as ScaleValue,
                                                  }
                                                : item
                                            )
                                          )
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                                      >
                                        {SCALE_OPTIONS.map((value) => (
                                          <option key={value} value={value}>
                                            {scaleLabel(value)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                                      Meta
                                      <select
                                        value={row.goal}
                                        onChange={(event) =>
                                          setIndicatorRows((current) =>
                                            current.map((item) =>
                                              item.label === row.label
                                                ? {
                                                    ...item,
                                                    goal: Number(event.target.value) as ScaleValue,
                                                  }
                                                : item
                                            )
                                          )
                                        }
                                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                                      >
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
                    <h2 className="text-base font-semibold text-white">5. Intervención NIC</h2>
                    <p className="mt-1 text-xs text-white/60">Selecciona una NIC y deja activas solo las actividades que usarás.</p>

                    <input
                      type="text"
                      value={nicQuery}
                      onChange={(event) => setNicQuery(event.target.value)}
                      placeholder="Buscar NIC por código, etiqueta o actividad..."
                      className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                    />

                    <div className="mt-3 space-y-2">
                      {filteredNicOptions.map((item) => {
                        const active = item.id === selectedNicId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedNicId(item.id)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                              active
                                ? "border-fuchsia-400/55 bg-fuchsia-400/12"
                                : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-white/5"
                            }`}
                          >
                            <div className="text-sm font-medium text-white">
                              {item.code} · {formatCatalogLabel(item.label)}
                            </div>
                            <div className="mt-1 text-xs text-white/55">
                              Campo {inferNicTaxonomy(item).domainCode} · Clase {inferNicTaxonomy(item).classCode}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {!!availableActivities.length && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-sm font-semibold text-white">Actividades</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {availableActivities.map((activity) => {
                            const active = selectedActivities.includes(activity);
                            return (
                              <button
                                key={activity}
                                type="button"
                                onClick={() =>
                                  setSelectedActivities((current) =>
                                    current.includes(activity)
                                      ? current.filter((item) => item !== activity)
                                      : [...current, activity]
                                  )
                                }
                                className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${
                                  active
                                    ? "border-fuchsia-400/55 bg-fuchsia-400/14 text-white"
                                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
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
                        <h2 className="text-base font-semibold text-white">6. Evaluación y salida</h2>
                        <p className="mt-1 text-xs text-white/60">Cierra el PAE y genera el mismo formato listo para imprimir.</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
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
                              ? "border-cyan-400/55 bg-cyan-400/12 text-cyan-100"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <label className="mt-4 block text-xs text-white/70">
                      Nota breve opcional
                      <textarea
                        value={evaluationNote}
                        onChange={(event) => setEvaluationNote(event.target.value)}
                        rows={3}
                        placeholder="Ej. tolera oxigenoterapia, se educa sobre signos de alarma, continúa vigilancia..."
                        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
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
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/8"
                      >
                        Reiniciar
                      </button>
                    </div>
                  </section>
                )}

                <section className={SECTION_CARD}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                        Navegación
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">{activeStepMeta.label}</div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
                      Vista viva
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      disabled={!canGoBack}
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-white/20"
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

              <section className="overflow-x-auto rounded-[30px] border border-white/10 bg-[#07101d] p-3 sm:p-5 xl:sticky xl:top-5 xl:self-start">
                <div className="no-print mb-4 flex items-center justify-between gap-3 px-2">
                  <div>
                    <h2 className="text-base font-semibold text-white">Vista final del formato</h2>
                    <p className="mt-1 text-xs text-white/60">
                      La hoja replica la estructura del archivo institucional y se imprime en horizontal.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/60">
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
                        <div className="space-y-2">
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
                        <div className="mt-1 min-h-[24px]">1 a 5</div>
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
