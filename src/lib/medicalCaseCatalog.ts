import type { AgeGroup } from "./types";

export type MedicalCaseTag =
  | "Medicina"
  | "Urgencias"
  | "Pediatría"
  | "Gineco-obstetricia"
  | "Geriatría";

export type MedicalCaseArea =
  | "Cardiovascular"
  | "Respiratorio"
  | "Neurológico"
  | "Endocrino-metabólico"
  | "Renal-urinario"
  | "Infeccioso"
  | "Gastrointestinal"
  | "Gineco-obstétrico"
  | "Pediátrico"
  | "Geriátrico"
  | "Críticos y urgencias";

export type MedicalCaseCohort =
  | "adult"
  | "pediatric"
  | "pregnancy"
  | "older_adult"
  | "mixed";

export type MedicalCaseCatalogItem = {
  id: string;
  title: string;
  desc: string;
  tag: MedicalCaseTag;
  area: MedicalCaseArea;
  age_group: AgeGroup;
  cohort: MedicalCaseCohort;
  urgency: "baja" | "media" | "alta";
  dx_tag: string;
  dx_id: string;
  accent: string;
};

type RawPathology = {
  title: string;
  urgency: "baja" | "media" | "alta";
};

type GroupDefinition = {
  area: MedicalCaseArea;
  tag: MedicalCaseTag;
  age_group: AgeGroup;
  cohort: MedicalCaseCohort;
  items: RawPathology[];
};

const ACCENTS = [
  "from-sky-500/20 to-transparent",
  "from-cyan-500/20 to-transparent",
  "from-blue-500/20 to-transparent",
  "from-indigo-500/20 to-transparent",
  "from-violet-500/20 to-transparent",
  "from-emerald-500/20 to-transparent",
  "from-teal-500/20 to-transparent",
  "from-amber-500/20 to-transparent",
  "from-orange-500/20 to-transparent",
  "from-rose-500/20 to-transparent",
];

function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function shortDxTag(title: string) {
  const words = title
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    .slice(0, 3);
  const tag = words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return tag || "MED";
}

const GROUPS: GroupDefinition[] = [
  {
    area: "Cardiovascular",
    tag: "Medicina",
    age_group: "adult",
    cohort: "adult",
    items: [
      { title: "Hipertensión arterial", urgency: "media" },
      { title: "Crisis hipertensiva", urgency: "alta" },
      { title: "Insuficiencia cardiaca", urgency: "alta" },
      { title: "Síndrome coronario agudo", urgency: "alta" },
      { title: "Fibrilación auricular", urgency: "media" },
      { title: "Arritmia supraventricular", urgency: "media" },
      { title: "Pericarditis aguda", urgency: "media" },
      { title: "Miocarditis", urgency: "alta" },
      { title: "Trombosis venosa profunda", urgency: "media" },
      { title: "Embolia pulmonar", urgency: "alta" },
      { title: "Valvulopatía aórtica descompensada", urgency: "media" },
      { title: "Endocarditis infecciosa", urgency: "alta" },
    ],
  },
  {
    area: "Respiratorio",
    tag: "Medicina",
    age_group: "adult",
    cohort: "adult",
    items: [
      { title: "Asma bronquial", urgency: "media" },
      { title: "Exacerbación asmática grave", urgency: "alta" },
      { title: "EPOC", urgency: "media" },
      { title: "Neumonía adquirida en la comunidad", urgency: "alta" },
      { title: "Neumonía intrahospitalaria", urgency: "alta" },
      { title: "Tuberculosis pulmonar", urgency: "media" },
      { title: "Derrame pleural", urgency: "media" },
      { title: "Neumotórax", urgency: "alta" },
      { title: "Insuficiencia respiratoria aguda", urgency: "alta" },
      { title: "Apnea obstructiva del sueño", urgency: "baja" },
    ],
  },
  {
    area: "Neurológico",
    tag: "Medicina",
    age_group: "adult",
    cohort: "adult",
    items: [
      { title: "ACV isquémico", urgency: "alta" },
      { title: "ACV hemorrágico", urgency: "alta" },
      { title: "Epilepsia", urgency: "media" },
      { title: "Estatus epiléptico", urgency: "alta" },
      { title: "Meningitis", urgency: "alta" },
      { title: "Encefalitis", urgency: "alta" },
      { title: "Migraña complicada", urgency: "media" },
      { title: "Neuropatía periférica diabética", urgency: "baja" },
      { title: "Síndrome confusional agudo", urgency: "alta" },
      { title: "Traumatismo craneoencefálico leve", urgency: "media" },
    ],
  },
  {
    area: "Endocrino-metabólico",
    tag: "Medicina",
    age_group: "adult",
    cohort: "adult",
    items: [
      { title: "Diabetes mellitus tipo 2", urgency: "media" },
      { title: "Cetoacidosis diabética", urgency: "alta" },
      { title: "Estado hiperosmolar hiperglucémico", urgency: "alta" },
      { title: "Hipotiroidismo", urgency: "baja" },
      { title: "Hipertiroidismo", urgency: "media" },
      { title: "Tormenta tiroidea", urgency: "alta" },
      { title: "Insuficiencia suprarrenal", urgency: "alta" },
      { title: "Síndrome metabólico", urgency: "baja" },
      { title: "Obesidad con comorbilidad", urgency: "baja" },
      { title: "Hipoglucemia severa", urgency: "alta" },
    ],
  },
  {
    area: "Renal-urinario",
    tag: "Medicina",
    age_group: "adult",
    cohort: "adult",
    items: [
      { title: "Lesión renal aguda", urgency: "alta" },
      { title: "Enfermedad renal crónica", urgency: "media" },
      { title: "Pielonefritis", urgency: "media" },
      { title: "Litiasis renal", urgency: "media" },
      { title: "Síndrome nefrótico", urgency: "media" },
      { title: "Retención urinaria aguda", urgency: "alta" },
      { title: "Sepsis urinaria", urgency: "alta" },
      { title: "Hematuria macroscópica", urgency: "media" },
      { title: "Incontinencia urinaria complicada", urgency: "baja" },
      { title: "Hiperplasia prostática complicada", urgency: "media" },
    ],
  },
  {
    area: "Infeccioso",
    tag: "Medicina",
    age_group: "adult",
    cohort: "adult",
    items: [
      { title: "Sepsis", urgency: "alta" },
      { title: "Shock séptico", urgency: "alta" },
      { title: "Dengue", urgency: "media" },
      { title: "Chikungunya", urgency: "media" },
      { title: "Influenza grave", urgency: "alta" },
      { title: "COVID-19 moderado-severo", urgency: "media" },
      { title: "Celulitis", urgency: "media" },
      { title: "Infección de piel y tejidos blandos", urgency: "media" },
      { title: "Fiebre de origen desconocido", urgency: "media" },
      { title: "Neutropenia febril", urgency: "alta" },
    ],
  },
  {
    area: "Gastrointestinal",
    tag: "Medicina",
    age_group: "adult",
    cohort: "adult",
    items: [
      { title: "Gastroenteritis aguda", urgency: "media" },
      { title: "Apendicitis aguda", urgency: "alta" },
      { title: "Pancreatitis aguda", urgency: "alta" },
      { title: "Colecistitis aguda", urgency: "media" },
      { title: "Hepatitis aguda", urgency: "media" },
      { title: "Cirrosis descompensada", urgency: "alta" },
      { title: "Hemorragia digestiva alta", urgency: "alta" },
      { title: "Hemorragia digestiva baja", urgency: "alta" },
      { title: "Obstrucción intestinal", urgency: "alta" },
      { title: "Peritonitis secundaria", urgency: "alta" },
    ],
  },
  {
    area: "Gineco-obstétrico",
    tag: "Gineco-obstetricia",
    age_group: "adult",
    cohort: "pregnancy",
    items: [
      { title: "Embarazo ectópico", urgency: "alta" },
      { title: "Amenaza de aborto", urgency: "media" },
      { title: "Preeclampsia", urgency: "alta" },
      { title: "Eclampsia", urgency: "alta" },
      { title: "Hemorragia posparto", urgency: "alta" },
      { title: "Sepsis puerperal", urgency: "alta" },
      { title: "Trabajo de parto pretérmino", urgency: "alta" },
      { title: "Ruptura prematura de membranas", urgency: "media" },
      { title: "Diabetes gestacional", urgency: "media" },
      { title: "Infección urinaria en embarazo", urgency: "media" },
      { title: "Placenta previa", urgency: "alta" },
      { title: "Desprendimiento prematuro de placenta", urgency: "alta" },
    ],
  },
  {
    area: "Pediátrico",
    tag: "Pediatría",
    age_group: "child",
    cohort: "pediatric",
    items: [
      { title: "Bronquiolitis", urgency: "media" },
      { title: "Neumonía pediátrica", urgency: "media" },
      { title: "Diarrea aguda pediátrica", urgency: "media" },
      { title: "Deshidratación moderada-severa", urgency: "alta" },
      { title: "Crisis asmática pediátrica", urgency: "alta" },
      { title: "Convulsión febril", urgency: "media" },
      { title: "Sepsis neonatal", urgency: "alta" },
      { title: "Ictericia neonatal", urgency: "media" },
      { title: "Otitis media aguda", urgency: "baja" },
      { title: "Faringoamigdalitis", urgency: "baja" },
      { title: "Anemia ferropénica pediátrica", urgency: "baja" },
      { title: "Malnutrición pediátrica", urgency: "media" },
    ],
  },
  {
    area: "Geriátrico",
    tag: "Geriatría",
    age_group: "adult",
    cohort: "older_adult",
    items: [
      { title: "Delirium en adulto mayor", urgency: "alta" },
      { title: "Demencia tipo Alzheimer", urgency: "media" },
      { title: "Demencia vascular", urgency: "media" },
      { title: "Fragilidad geriátrica", urgency: "media" },
      { title: "Caídas recurrentes", urgency: "media" },
      { title: "Síndrome de inmovilidad", urgency: "media" },
      { title: "Úlceras por presión", urgency: "media" },
      { title: "Polifarmacia", urgency: "media" },
      { title: "Neumonía aspirativa", urgency: "alta" },
      { title: "Infección urinaria en adulto mayor", urgency: "media" },
      { title: "Depresión en adulto mayor", urgency: "media" },
      { title: "Dolor crónico osteoarticular", urgency: "baja" },
    ],
  },
  {
    area: "Críticos y urgencias",
    tag: "Urgencias",
    age_group: "mixed",
    cohort: "mixed",
    items: [
      { title: "Politrauma", urgency: "alta" },
      { title: "Shock hipovolémico", urgency: "alta" },
      { title: "Shock cardiogénico", urgency: "alta" },
      { title: "Paro cardiorrespiratorio", urgency: "alta" },
      { title: "Intoxicación aguda por fármacos", urgency: "alta" },
      { title: "Quemaduras moderadas-graves", urgency: "alta" },
      { title: "Anafilaxia", urgency: "alta" },
      { title: "Estado de mal asmático", urgency: "alta" },
      { title: "Sepsis de foco abdominal", urgency: "alta" },
      { title: "Trauma torácico", urgency: "alta" },
      { title: "Sangrado masivo", urgency: "alta" },
      { title: "Reanimación post-paro (post-RCE)", urgency: "alta" },
    ],
  },
];

function buildDescription(item: RawPathology, area: MedicalCaseArea) {
  return `${item.title}. Entrevista y valoración inicial enfocada en ${area.toLowerCase()}, priorización clínica y seguridad del paciente.`;
}

export const MEDICAL_CASE_CATALOG: MedicalCaseCatalogItem[] = (() => {
  const seen = new Map<string, number>();
  let index = 0;
  const out: MedicalCaseCatalogItem[] = [];

  for (const group of GROUPS) {
    for (const item of group.items) {
      const baseSlug = slugify(item.title);
      const n = seen.get(baseSlug) ?? 0;
      seen.set(baseSlug, n + 1);
      const id = n === 0 ? baseSlug : `${baseSlug}-${n + 1}`;
      const accent = ACCENTS[index % ACCENTS.length];
      index += 1;

      out.push({
        id,
        title: item.title,
        desc: buildDescription(item, group.area),
        tag: group.tag,
        area: group.area,
        age_group: group.age_group,
        cohort: group.cohort,
        urgency: item.urgency,
        dx_tag: shortDxTag(item.title),
        dx_id: id,
        accent,
      });
    }
  }

  return out;
})();

export function getMedicalCatalogByFilter(
  filter: "all" | "adult" | "pediatric" | "pregnancy" | "older_adult"
) {
  if (filter === "all") return MEDICAL_CASE_CATALOG;
  if (filter === "adult") return MEDICAL_CASE_CATALOG.filter((c) => c.cohort === "adult" || c.cohort === "mixed");
  if (filter === "pediatric") return MEDICAL_CASE_CATALOG.filter((c) => c.cohort === "pediatric");
  if (filter === "pregnancy") return MEDICAL_CASE_CATALOG.filter((c) => c.cohort === "pregnancy");
  return MEDICAL_CASE_CATALOG.filter((c) => c.cohort === "older_adult");
}

export function pickMedicalSeedByCategory(item: MedicalCaseCatalogItem | null) {
  if (!item) return null;
  const ageByCohort: Record<MedicalCaseCohort, number> = {
    adult: 47,
    pediatric: 9,
    pregnancy: 28,
    older_adult: 74,
    mixed: 52,
  };
  const sexByCohort: Record<MedicalCaseCohort, "female" | "male" | "nonbinary" | "unspecified"> = {
    adult: "unspecified",
    pediatric: "unspecified",
    pregnancy: "female",
    older_adult: "unspecified",
    mixed: "unspecified",
  };

  return {
    id: `seed-med-${item.id}`,
    title: `Caso clínico: ${item.title}`,
    category: item.id,
    age_group: item.age_group,
    age: ageByCohort[item.cohort],
    sex_gender: sexByCohort[item.cohort],
    chief_complaint: `Consulta por cuadro compatible con ${item.title.toLowerCase()} con deterioro funcional reciente.`,
    probable_primary_diagnosis: item.title,
    differential_diagnoses: [
      `Complicación aguda de ${item.title.toLowerCase()}`,
      "Condición infecciosa concomitante",
      "Descompensación por comorbilidad crónica",
    ],
    difficulty: item.urgency === "alta" ? "advanced" : item.urgency === "media" ? "intermediate" : "beginner",
    family_social_context:
      item.cohort === "pediatric"
        ? "Acude con cuidador principal; impacto en escolaridad y dinámica familiar."
        : item.cohort === "older_adult"
        ? "Vive con red de apoyo parcial; comorbilidades y dependencia funcional variable."
        : item.cohort === "pregnancy"
        ? "Gestante con red de apoyo variable y preocupación por bienestar materno-fetal."
        : "Contexto familiar y social con barreras parciales para adherencia terapéutica.",
    personality_behavior_traits: ["ansiedad por síntomas", "búsqueda de alivio rápido", "preocupación por pronóstico"],
    guiding_symptoms: ["empeoramiento de síntomas", "impacto funcional", "señales de alarma potenciales"],
    antecedents: ["comorbilidad crónica a precisar", "adherencia terapéutica variable"],
    red_flags: ["deterioro clínico progresivo", "riesgo de complicación aguda"],
    response_style: "Describe síntomas de forma concreta y requiere entrevista estructurada.",
    teaching_objectives: [
      "Priorizar evaluación clínica y signos de alarma",
      "Organizar plan inicial de cuidado de enfermería/medicina",
      "Definir criterios de derivación y seguridad clínica",
    ],
  };
}

