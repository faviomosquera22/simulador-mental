import type { AgeGroup, CaseCategory, CaseSeed } from "./types";

export type CaseCatalogItem = {
  id: CaseCategory;
  title: string;
  desc: string;
  tag: "Entrevista" | "Seguimiento" | "Crisis" | "Pediatría" | "Sexualidad";
  age_group: AgeGroup;
  dsm_tag: string;
  dx_id: string;
  accent: string;
};

export const CASE_CATALOG: CaseCatalogItem[] = [
  { id: "anxiety", title: "Ansiedad", desc: "Preocupación persistente, tensión y evitación.", tag: "Entrevista", age_group: "adult", dsm_tag: "TAG", dx_id: "gad", accent: "from-sky-500/20 to-transparent" },
  { id: "depression", title: "Depresión", desc: "Ánimo bajo, anhedonia y deterioro funcional.", tag: "Seguimiento", age_group: "adult", dsm_tag: "TDM", dx_id: "mdd", accent: "from-violet-500/20 to-transparent" },
  { id: "panic", title: "Crisis de pánico", desc: "Inicio súbito, miedo intenso y síntomas autonómicos.", tag: "Crisis", age_group: "adult", dsm_tag: "Pánico", dx_id: "panic", accent: "from-rose-500/20 to-transparent" },
  { id: "ptsd", title: "TEPT", desc: "Intrusiones, evitación e hipervigilancia tras trauma.", tag: "Entrevista", age_group: "adult", dsm_tag: "TEPT", dx_id: "ptsd", accent: "from-amber-500/20 to-transparent" },
  { id: "ocd", title: "TOC", desc: "Obsesiones/compulsiones con interferencia funcional.", tag: "Entrevista", age_group: "adult", dsm_tag: "TOC", dx_id: "ocd", accent: "from-cyan-500/20 to-transparent" },
  { id: "bipolar", title: "Trastorno bipolar", desc: "Historia de elevación del ánimo y depresión.", tag: "Seguimiento", age_group: "adult", dsm_tag: "Bipolar", dx_id: "bipolar1", accent: "from-indigo-500/20 to-transparent" },
  { id: "delirium", title: "Delirio / confusión", desc: "Desorientación e ideas falsas con alto riesgo.", tag: "Crisis", age_group: "adult", dsm_tag: "Delirio", dx_id: "delirium", accent: "from-orange-500/20 to-transparent" },
  { id: "substances", title: "Consumo de sustancias", desc: "Uso problemático, craving y daño funcional.", tag: "Seguimiento", age_group: "adult", dsm_tag: "Sustancias", dx_id: "aud", accent: "from-emerald-500/20 to-transparent" },
  { id: "eating", title: "TCA", desc: "Relación conflictiva con comida, peso e imagen.", tag: "Entrevista", age_group: "adult", dsm_tag: "TCA", dx_id: "tca", accent: "from-pink-500/20 to-transparent" },
  { id: "selfharm", title: "Ideación autolesiva", desc: "Explorar seguridad y factores protectores.", tag: "Crisis", age_group: "adult", dsm_tag: "Autolesión", dx_id: "selfharm", accent: "from-red-500/20 to-transparent" },

  { id: "sexual_dysfunction", title: "Disfunción sexual", desc: "Malestar sexual persistente e impacto relacional.", tag: "Sexualidad", age_group: "adult", dsm_tag: "Disfunción sexual", dx_id: "sexual_dysfunction", accent: "from-fuchsia-500/20 to-transparent" },
  { id: "gender_dysphoria", title: "Disforia de género", desc: "Malestar clínico asociado a incongruencia de género.", tag: "Sexualidad", age_group: "adolescent", dsm_tag: "Disforia de género", dx_id: "gender_dysphoria", accent: "from-cyan-400/20 to-transparent" },
  { id: "sexual_risk", title: "Conducta sexual de riesgo", desc: "Impulsividad, consumo y vulnerabilidad psicosocial.", tag: "Sexualidad", age_group: "adult", dsm_tag: "Riesgo sexual", dx_id: "sexual_risk", accent: "from-rose-400/20 to-transparent" },
  { id: "its_impact", title: "Impacto psicológico de ITS", desc: "Ansiedad, estigma y duelo tras diagnóstico de ITS.", tag: "Sexualidad", age_group: "adult", dsm_tag: "Ajuste", dx_id: "its_impact", accent: "from-purple-500/20 to-transparent" },
  { id: "sexual_trauma_history", title: "Antecedente de violencia sexual", desc: "Trauma previo con síntomas actuales y evitación.", tag: "Sexualidad", age_group: "adult", dsm_tag: "Trauma sexual", dx_id: "sexual_trauma", accent: "from-red-400/20 to-transparent" },
  { id: "paraphilic_behavior", title: "Conducta parafílica (académico)", desc: "Evaluación clínica prudente y éticamente guiada.", tag: "Sexualidad", age_group: "adult", dsm_tag: "Parafílico", dx_id: "paraphilic_behavior", accent: "from-slate-400/20 to-transparent" },

  { id: "asd_pediatric", title: "TEA en infancia", desc: "Dificultades en socialización, flexibilidad y comunicación.", tag: "Pediatría", age_group: "child", dsm_tag: "TEA", dx_id: "asd", accent: "from-blue-400/20 to-transparent" },
  { id: "adhd_pediatric", title: "TDAH", desc: "Inatención/hiperactividad en casa y escuela.", tag: "Pediatría", age_group: "child", dsm_tag: "TDAH", dx_id: "adhd", accent: "from-lime-500/20 to-transparent" },
  { id: "odd_pediatric", title: "Trastorno negativista desafiante", desc: "Irritabilidad, discusiones y desafío persistente.", tag: "Pediatría", age_group: "child", dsm_tag: "TND", dx_id: "odd", accent: "from-amber-400/20 to-transparent" },
  { id: "separation_anxiety_pediatric", title: "Ansiedad por separación", desc: "Miedo intenso a alejarse de figuras de apego.", tag: "Pediatría", age_group: "child", dsm_tag: "Ansiedad separación", dx_id: "separation_anxiety", accent: "from-sky-400/20 to-transparent" },
  { id: "social_anxiety_adolescent", title: "Ansiedad social en adolescencia", desc: "Temor al juicio y evitación escolar/social.", tag: "Pediatría", age_group: "adolescent", dsm_tag: "Ansiedad social", dx_id: "social_anxiety_adolescent", accent: "from-indigo-400/20 to-transparent" },
  { id: "depression_adolescent", title: "Depresión adolescente", desc: "Irritabilidad, retraimiento y bajo rendimiento.", tag: "Pediatría", age_group: "adolescent", dsm_tag: "TDM", dx_id: "depression_adolescent", accent: "from-violet-400/20 to-transparent" },
  { id: "suicide_risk_adolescent", title: "Riesgo suicida adolescente", desc: "Autolesión, desesperanza y factores precipitantes.", tag: "Pediatría", age_group: "adolescent", dsm_tag: "Riesgo suicida", dx_id: "suicide_risk_adolescent", accent: "from-red-500/20 to-transparent" },
  { id: "eating_adolescent", title: "TCA en adolescencia", desc: "Restricción/purga con distorsión de imagen corporal.", tag: "Pediatría", age_group: "adolescent", dsm_tag: "TCA", dx_id: "eating_adolescent", accent: "from-pink-400/20 to-transparent" },
  { id: "conduct_disorder_pediatric", title: "Trastorno de conducta", desc: "Conductas agresivas y transgresión de normas.", tag: "Pediatría", age_group: "adolescent", dsm_tag: "TC", dx_id: "conduct_disorder", accent: "from-orange-500/20 to-transparent" },
  { id: "selective_mutism_pediatric", title: "Mutismo selectivo", desc: "Habla limitada en contextos sociales específicos.", tag: "Pediatría", age_group: "child", dsm_tag: "Mutismo selectivo", dx_id: "selective_mutism", accent: "from-cyan-500/20 to-transparent" },
  { id: "learning_disorder_pediatric", title: "Trastorno del aprendizaje", desc: "Dificultad académica específica y frustración emocional.", tag: "Pediatría", age_group: "child", dsm_tag: "Aprendizaje", dx_id: "learning_disorder", accent: "from-teal-500/20 to-transparent" },
  { id: "sleep_disorder_pediatric", title: "Trastornos del sueño pediátrico", desc: "Insomnio, despertares y deterioro diurno.", tag: "Pediatría", age_group: "child", dsm_tag: "Sueño", dx_id: "sleep_disorder_pediatric", accent: "from-slate-500/20 to-transparent" },
];

export function getCatalogByAgeFilter(filter: "all" | "adult" | "pediatric") {
  if (filter === "all") return CASE_CATALOG;
  if (filter === "adult") return CASE_CATALOG.filter((c) => c.age_group === "adult");
  return CASE_CATALOG.filter((c) => c.age_group === "child" || c.age_group === "adolescent");
}

export function defaultApproachByCategory(categoryId: string): "humanistic" | "cbt" | "psychodynamic" | "systemic" {
  const id = String(categoryId).toLowerCase();
  if (id.includes("substances") || id.includes("risk")) return "cbt";
  if (id.includes("sexual_trauma") || id.includes("ptsd")) return "humanistic";
  if (id.includes("family") || id.includes("pediatric") || id.includes("adolescent")) return "systemic";
  return "humanistic";
}

export const CASE_SEEDS: CaseSeed[] = [
  {
    id: "seed-sexual-dysfunction-01",
    title: "Malestar sexual con evitación de intimidad",
    category: "sexual_dysfunction",
    age_group: "adult",
    age: 35,
    sex_gender: "female",
    chief_complaint: "Evito relaciones íntimas por ansiedad y dolor anticipatorio.",
    probable_primary_diagnosis: "Disfunción sexual con componente ansioso",
    differential_diagnoses: ["Trastorno depresivo", "TEPT relacionado a trauma sexual", "Efecto adverso farmacológico"],
    difficulty: "intermediate",
    family_social_context: "Convive con pareja estable; alta carga laboral y baja comunicación emocional.",
    personality_behavior_traits: ["perfeccionismo", "evitación", "autocrítica"],
    guiding_symptoms: ["ansiedad anticipatoria", "disminución del deseo", "culpa"],
    antecedents: ["episodio depresivo previo", "sin tratamiento sexual previo"],
    red_flags: ["malestar intenso", "deterioro relacional"],
    response_style: "Reservada al inicio; mejora con validación.",
    teaching_objectives: ["Explorar historia sexual con lenguaje respetuoso", "Evaluar impacto funcional y emocional", "Descartar trauma y comorbilidad"],
  },
  {
    id: "seed-gender-dysphoria-01",
    title: "Malestar de género en adolescente con conflicto familiar",
    category: "gender_dysphoria",
    age_group: "adolescent",
    age: 16,
    sex_gender: "nonbinary",
    chief_complaint: "Ansiedad intensa y tristeza por rechazo familiar a identidad de género.",
    probable_primary_diagnosis: "Disforia de género con síntomas ansioso-depresivos",
    differential_diagnoses: ["Depresión adolescente", "Ansiedad social", "Reacción de ajuste"],
    difficulty: "advanced",
    family_social_context: "Vive con madre y padrastro; apoyo parcial en entorno escolar.",
    personality_behavior_traits: ["hipervigilancia social", "evitación", "autoobservación crítica"],
    guiding_symptoms: ["insomnio", "llanto frecuente", "aislamiento"],
    antecedents: ["acoso escolar previo", "autolesión superficial previa (sin intento)"],
    red_flags: ["ideación pasiva de muerte", "rechazo familiar activo"],
    response_style: "El adolescente responde breve al inicio; acompañante minimiza.",
    teaching_objectives: ["Construir alianza terapéutica dual", "Evaluar riesgo suicida en adolescencia", "Mapear red de apoyo y factores protectores"],
    companion_available: true,
    companion_role: "madre",
  },
  {
    id: "seed-asd-child-01",
    title: "Dificultad social y rigidez conductual en niño escolar",
    category: "asd_pediatric",
    age_group: "child",
    age: 8,
    sex_gender: "male",
    chief_complaint: "Problemas para socializar y crisis ante cambios de rutina.",
    probable_primary_diagnosis: "Trastorno del espectro autista (probable)",
    differential_diagnoses: ["TDAH", "Trastorno de ansiedad", "Discapacidad intelectual leve"],
    difficulty: "intermediate",
    family_social_context: "Vive con ambos padres; escuela reporta aislamiento y estereotipias.",
    personality_behavior_traits: ["hiperfoco", "rigidez", "sensibilidad sensorial"],
    guiding_symptoms: ["contacto visual limitado", "intereses restringidos", "conducta repetitiva"],
    antecedents: ["hitos de lenguaje tardíos", "sin evaluación formal previa"],
    red_flags: ["sobrecarga sensorial en escuela"],
    response_style: "Niño con respuestas cortas; acompañante aporta desarrollo temprano.",
    teaching_objectives: ["Explorar desarrollo y escolaridad", "Distinguir TEA vs TDAH", "Recabar información de cuidador y escuela"],
    companion_available: true,
    companion_role: "madre",
  },
  {
    id: "seed-adhd-child-01",
    title: "Inatención e hiperactividad con deterioro académico",
    category: "adhd_pediatric",
    age_group: "child",
    age: 10,
    sex_gender: "male",
    chief_complaint: "No termina tareas, se levanta en clase y discute en casa.",
    probable_primary_diagnosis: "TDAH combinado (probable)",
    differential_diagnoses: ["Trastorno negativista desafiante", "Ansiedad", "Trastorno del sueño"],
    difficulty: "beginner",
    family_social_context: "Padre trabaja fuera; madre sobrecargada en cuidado.",
    personality_behavior_traits: ["impulsividad", "baja tolerancia a frustración"],
    guiding_symptoms: ["distracción", "olvidos frecuentes", "inquietud motora"],
    antecedents: ["dificultades desde preescolar"],
    red_flags: ["riesgo escolar por bajo rendimiento"],
    response_style: "Niño inquieto; cuidador extenso y ansioso.",
    teaching_objectives: ["Explorar síntomas en dos contextos", "Indagar sueño y hábitos", "Valorar dinámica familiar"],
    companion_available: true,
    companion_role: "madre",
  },
  {
    id: "seed-suicide-adolescent-01",
    title: "Ideación suicida en adolescente tras ruptura y acoso digital",
    category: "suicide_risk_adolescent",
    age_group: "adolescent",
    age: 15,
    sex_gender: "female",
    chief_complaint: "Pensamientos de no querer vivir y autolesión reciente.",
    probable_primary_diagnosis: "Riesgo suicida adolescente (urgencia educativa)",
    differential_diagnoses: ["Depresión mayor", "Trastorno de adaptación", "Trastorno límite emergente"],
    difficulty: "advanced",
    family_social_context: "Convivencia con madre; relación distante con padre.",
    personality_behavior_traits: ["impulsividad", "desregulación afectiva", "vergüenza intensa"],
    guiding_symptoms: ["desesperanza", "insomnio", "aislamiento", "autolesión"],
    antecedents: ["bullying digital", "consumo ocasional de alcohol"],
    red_flags: ["plan suicida no estructurado", "acceso a medicamentos en casa"],
    response_style: "Adolescente ambivalente; madre inicialmente minimiza.",
    teaching_objectives: ["Aplicar tamizaje estructurado de seguridad", "Explorar plan/intención/medios", "Activar contención educativa y red de apoyo"],
    companion_available: true,
    companion_role: "madre",
  },
  {
    id: "seed-learning-child-01",
    title: "Dificultad lectoescritora con desmotivación escolar",
    category: "learning_disorder_pediatric",
    age_group: "child",
    age: 9,
    sex_gender: "female",
    chief_complaint: "Lee lento, evita tareas y llora antes de ir a clase.",
    probable_primary_diagnosis: "Trastorno específico del aprendizaje (probable)",
    differential_diagnoses: ["TDAH inatento", "Ansiedad escolar", "Déficit sensorial no pesquisado"],
    difficulty: "intermediate",
    family_social_context: "Familia nuclear; alta expectativa académica.",
    personality_behavior_traits: ["ansiedad de desempeño", "evitación", "baja autoeficacia"],
    guiding_symptoms: ["errores de lectura", "fatiga en tareas", "frustración"],
    antecedents: ["dificultades persistentes desde 2do grado"],
    red_flags: ["baja autoestima progresiva"],
    response_style: "Niña tímida; cuidador detallista.",
    teaching_objectives: ["Explorar historia escolar y desarrollo", "Valorar impacto emocional", "Diferenciar aprendizaje vs ansiedad"],
    companion_available: true,
    companion_role: "padre",
  },
];

export function pickSeedByCategory(category: string) {
  const matches = CASE_SEEDS.filter((s) => s.category === category);
  if (!matches.length) return null;
  return matches[Math.floor(Math.random() * matches.length)];
}

