import type { BatteryDefinition } from "./types";

export const CLINICAL_BATTERIES: BatteryDefinition[] = [
  {
    id: "adult_emotional_screening",
    name: "Tamizaje emocional adulto",
    description:
      "Batería breve para explorar depresión, ansiedad y seguridad de forma estructurada en entrenamiento clínico.",
    target_population: "Adultos",
    suggested_age_range: "18+",
    educational_only: true,
    steps: [
      {
        id: "adult_emotional_phq9",
        mode: "test",
        instrument_id: "phq9",
        label: "PHQ-9 (depresión)",
      },
      {
        id: "adult_emotional_gad7",
        mode: "test",
        instrument_id: "gad7",
        label: "GAD-7 (ansiedad)",
      },
      {
        id: "adult_emotional_risk",
        mode: "scale",
        instrument_id: "suicide_risk_structured",
        label: "Riesgo suicida estructurado",
      },
    ],
    educational_note: "Resultado orientativo para entrenamiento. No reemplaza juicio clínico.",
  },
  {
    id: "adolescent_safety_screening",
    name: "Adolescente: tamizaje + seguridad",
    description:
      "Secuencia orientada a síntomas emocionales en adolescencia y tamizaje de seguridad con contexto de apoyo.",
    target_population: "Adolescentes",
    suggested_age_range: "12-17",
    educational_only: true,
    steps: [
      {
        id: "adolescent_safety_phq9",
        mode: "test",
        instrument_id: "phq9",
        label: "PHQ-9 (síntomas depresivos)",
      },
      {
        id: "adolescent_safety_gad7",
        mode: "test",
        instrument_id: "gad7",
        label: "GAD-7 (ansiedad)",
      },
      {
        id: "adolescent_safety_risk",
        mode: "scale",
        instrument_id: "suicide_risk_structured",
        label: "Riesgo suicida estructurado",
      },
      {
        id: "adolescent_safety_support",
        mode: "test",
        instrument_id: "family_support_brief",
        label: "Apoyo familiar / red social breve",
      },
    ],
    educational_note: "Útil para práctica en fuente dual (paciente + acompañante).",
  },
  {
    id: "cognitive_orientative_adult",
    name: "Cognición orientativa adulto mayor",
    description:
      "Explora funciones cognitivas globales y apoyo funcional en una ruta de screening educativo.",
    target_population: "Adulto mayor",
    suggested_age_range: "60+",
    educational_only: true,
    steps: [
      {
        id: "cognitive_orientative_mmse",
        mode: "test",
        instrument_id: "mmse_edu",
        label: "MMSE educativo",
      },
      {
        id: "cognitive_orientative_moca",
        mode: "test",
        instrument_id: "moca_simplified",
        label: "MoCA simplificado",
      },
      {
        id: "cognitive_orientative_support",
        mode: "test",
        instrument_id: "family_support_brief",
        label: "Función familiar / apoyo",
      },
    ],
    educational_note: "Interpretar junto con escolaridad, contexto sociocultural y funcionamiento diario.",
  },
  {
    id: "anxiety_depression_deep_dive",
    name: "Ansiedad-depresión (profundización)",
    description:
      "Batería de mayor detalle para integrar síntomas ansiosos, depresivos y seguridad.",
    target_population: "Adultos y adolescentes mayores",
    suggested_age_range: "15+",
    educational_only: true,
    steps: [
      {
        id: "anxdep_hama",
        mode: "scale",
        instrument_id: "ham_a_simplified",
        label: "HAM-A simplificada",
      },
      {
        id: "anxdep_hamd",
        mode: "scale",
        instrument_id: "ham_d_simplified",
        label: "HAM-D simplificada",
      },
      {
        id: "anxdep_bdi",
        mode: "scale",
        instrument_id: "bdi_simplified",
        label: "BDI simplificado",
      },
      {
        id: "anxdep_risk",
        mode: "scale",
        instrument_id: "suicide_risk_structured",
        label: "Riesgo suicida estructurado",
      },
    ],
    educational_note: "Resultado educativo de integración sintomática, no diagnóstico definitivo.",
  },
  {
    id: "substance_use_brief",
    name: "Consumo de sustancias (ruta breve)",
    description:
      "Ruta orientativa para consumo problemático, impacto funcional y seguridad.",
    target_population: "Adultos",
    suggested_age_range: "18+",
    educational_only: true,
    steps: [
      {
        id: "substance_audit",
        mode: "test",
        instrument_id: "audit_simplified",
        label: "AUDIT simplificado",
      },
      {
        id: "substance_support",
        mode: "test",
        instrument_id: "family_support_brief",
        label: "Apoyo familiar / red social breve",
      },
      {
        id: "substance_risk",
        mode: "scale",
        instrument_id: "suicide_risk_structured",
        label: "Riesgo suicida estructurado",
      },
    ],
    educational_note: "Se recomienda complementar con entrevista motivacional en el cierre.",
  },
];

export const MEDICAL_BATTERIES: BatteryDefinition[] = [
  {
    id: "adult_emergency_triage_med",
    name: "Urgencias adulto: triage rápido",
    description:
      "Ruta breve de priorización clínica para pacientes adultos en contexto de urgencias.",
    target_population: "Adultos",
    suggested_age_range: "18+",
    educational_only: true,
    steps: [
      {
        id: "adult_emergency_qsofa",
        mode: "scale",
        instrument_id: "qsofa_edu",
        label: "qSOFA simplificado",
      },
      {
        id: "adult_emergency_news2",
        mode: "scale",
        instrument_id: "news2_simplified_edu",
        label: "NEWS2 simplificado",
      },
      {
        id: "adult_emergency_gcs",
        mode: "test",
        instrument_id: "glasgow_simplified_edu",
        label: "Glasgow simplificado",
      },
      {
        id: "adult_emergency_pain",
        mode: "scale",
        instrument_id: "pain_functional_edu",
        label: "Dolor e impacto funcional",
      },
    ],
    educational_note: "Secuencia orientativa para priorización inicial. No reemplaza protocolo institucional.",
  },
  {
    id: "pregnancy_warning_med",
    name: "Embarazo: alerta y seguridad clínica",
    description:
      "Batería orientativa para identificar signos de alarma obstétrica y deterioro clínico.",
    target_population: "Gestantes / puérperas",
    suggested_age_range: "12+",
    educational_only: true,
    steps: [
      {
        id: "pregnancy_warning_scale",
        mode: "scale",
        instrument_id: "obstetric_warning_brief",
        label: "Alerta obstétrica breve",
      },
      {
        id: "pregnancy_news2",
        mode: "scale",
        instrument_id: "news2_simplified_edu",
        label: "NEWS2 simplificado",
      },
      {
        id: "pregnancy_pain",
        mode: "scale",
        instrument_id: "pain_functional_edu",
        label: "Dolor e impacto funcional",
      },
    ],
    educational_note: "Interpretar con evaluación obstétrica integral y protocolo local.",
  },
  {
    id: "pediatric_hydration_resp_med",
    name: "Pediatría: hidratación y estado general",
    description:
      "Ruta breve para práctica de entrevista y detección de deterioro clínico en pediatría.",
    target_population: "Niñez y adolescencia",
    suggested_age_range: "5-17",
    educational_only: true,
    steps: [
      {
        id: "pediatric_dehydration",
        mode: "test",
        instrument_id: "dehydration_pediatric_screen",
        label: "Deshidratación pediátrica",
      },
      {
        id: "pediatric_pain",
        mode: "scale",
        instrument_id: "pain_functional_edu",
        label: "Dolor e impacto funcional",
      },
      {
        id: "pediatric_gcs",
        mode: "test",
        instrument_id: "glasgow_simplified_edu",
        label: "Glasgow simplificado",
      },
    ],
    educational_note: "Útil para escenarios con fuente dual (paciente + acompañante).",
  },
  {
    id: "chronic_followup_med",
    name: "Seguimiento crónico y funcionalidad",
    description:
      "Integra funcionalidad, adherencia terapéutica y severidad fisiológica orientativa.",
    target_population: "Adulto y adulto mayor",
    suggested_age_range: "40+",
    educational_only: true,
    steps: [
      {
        id: "chronic_barthel",
        mode: "test",
        instrument_id: "barthel_brief_edu",
        label: "Barthel breve",
      },
      {
        id: "chronic_adherence",
        mode: "test",
        instrument_id: "medication_adherence_brief",
        label: "Adherencia terapéutica breve",
      },
      {
        id: "chronic_news2",
        mode: "scale",
        instrument_id: "news2_simplified_edu",
        label: "NEWS2 simplificado",
      },
    ],
    educational_note: "Resultado orientativo para entrenamiento clínico; no diagnóstico.",
  },
];

const ALL_BATTERIES: BatteryDefinition[] = [...CLINICAL_BATTERIES, ...MEDICAL_BATTERIES];

export function getBatteriesByDomain(domain: "mental" | "medical"): BatteryDefinition[] {
  return domain === "medical" ? MEDICAL_BATTERIES : CLINICAL_BATTERIES;
}

export function getBatteryById(id: string): BatteryDefinition | undefined {
  return ALL_BATTERIES.find((b) => b.id === id);
}
