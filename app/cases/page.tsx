"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getAuthFetchHeaders } from "@/src/lib/clientAuth";
import {
  CASE_CATALOG,
  defaultApproachByCategory,
  getCatalogByAgeFilter,
  pickSeedByCategory,
  type CaseCatalogItem,
} from "@/src/lib/caseCatalog";
import type { AgeGroup } from "@/src/lib/types";

type SexValue = "female" | "male" | "nonbinary" | "unspecified";
type DifficultyValue = "beginner" | "intermediate" | "advanced";
type ConfigStep = 1 | 2 | 3;

type ApproachValue = "humanistic" | "cbt" | "psychodynamic" | "systemic";
type CatalogFilter = "all" | "adult" | "pediatric";

function prettyApproach(a: ApproachValue) {
  switch (a) {
    case "humanistic":
      return "Humanístico";
    case "cbt":
      return "Cognitivo-conductual (TCC)";
    case "psychodynamic":
      return "Psicodinámico";
    case "systemic":
      return "Sistémico / familiar";
    default:
      return "Humanístico";
  }
}

function deriveDsmTag(categoryId: string, selected: CaseCatalogItem | null) {
  const item = selected ?? CASE_CATALOG.find((c) => c.id === categoryId) ?? null;
  return item?.dsm_tag ? String(item.dsm_tag).trim() : "";
}

function deriveTopicsDx(categoryId: string, selected: CaseCatalogItem | null) {
  const item = selected ?? CASE_CATALOG.find((c) => c.id === categoryId) ?? null;
  return item?.dx_id ? String(item.dx_id).trim().toLowerCase() : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function safeStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function prettySex(sex: SexValue) {
  switch (sex) {
    case "female":
      return "Mujer";
    case "male":
      return "Hombre";
    case "nonbinary":
      return "No binario";
    default:
      return "No especificado";
  }
}

function prettyDifficulty(d: DifficultyValue) {
  switch (d) {
    case "beginner":
      return "Básico";
    case "intermediate":
      return "Intermedio";
    case "advanced":
      return "Avanzado";
    default:
      return "Básico";
  }
}

function prettyCompanionRole(
  role: "madre" | "padre" | "tutor" | "cuidador" | "otro"
) {
  switch (role) {
    case "madre":
      return "Madre";
    case "padre":
      return "Padre";
    case "tutor":
      return "Tutor";
    case "cuidador":
      return "Cuidador";
    default:
      return "Otro";
  }
}

function inferCaseRiskLevel(text: string): "alto" | "medio" | "bajo" {
  const t = String(text || "").toLowerCase();

  const high = [
    "suicid",
    "autoles",
    "plan",
    "acceso a medios",
    "psicosis",
    "alucin",
    "delirio",
    "agres",
    "violencia",
  ];
  const medium = [
    "desesperanza",
    "aislamiento",
    "insomnio severo",
    "consumo",
    "crisis",
    "impulsiv",
  ];

  if (high.some((k) => t.includes(k))) return "alto";
  if (medium.some((k) => t.includes(k))) return "medio";
  return "bajo";
}

function getCaseInterviewSuggestions(args: {
  categoryId: string;
  ageGroup: AgeGroup;
}) {
  const { categoryId, ageGroup } = args;
  const id = String(categoryId || "").toLowerCase();

  const focusBase =
    ageGroup === "child" || ageGroup === "adolescent"
      ? [
          "Explorar versión del paciente y del acompañante por separado.",
          "Indagar escolaridad, sueño, socialización y dinámica familiar.",
          "Valorar factores protectores y de riesgo en casa y escuela.",
        ]
      : [
          "Precisar cronología de síntomas e impacto funcional.",
          "Identificar comorbilidades y consumo de sustancias.",
          "Cerrar con plan de seguridad y objetivos de seguimiento.",
        ];

  let scales = ["PHQ-9", "GAD-7"];
  let tests = ["Mini examen orientativo", "Tamizaje funcional breve"];

  if (id.includes("depression") || id.includes("selfharm") || id.includes("suicide")) {
    scales = ["PHQ-9", "BDI simplificada", "Riesgo suicida estructurado"];
    tests = ["Tamizaje de depresión", "Evaluación breve de seguridad"];
  } else if (id.includes("anxiety") || id.includes("panic") || id.includes("ptsd") || id.includes("ocd")) {
    scales = ["GAD-7", "Hamilton Ansiedad", "Escala de estrés/trauma orientativa"];
    tests = ["Tamizaje de ansiedad", "Checklist de evitación/impacto funcional"];
  } else if (id.includes("substances")) {
    scales = ["AUDIT", "ASSIST simplificado"];
    tests = ["Tamizaje de consumo problemático", "Checklist de riesgo de recaída"];
  } else if (id.includes("adhd") || id.includes("asd") || id.includes("learning") || id.includes("mutism")) {
    scales = ["SNAP-IV (educativa)", "Conners abreviado (educativo)"];
    tests = ["Tamizaje de neurodesarrollo", "Valoración funcional familiar/escolar"];
  }

  return {
    scales,
    tests,
    focus: focusBase,
  };
}

// Busca el primer string no vacío para cualquiera de estas llaves, recorriendo el objeto en profundidad.
function deepFindString(obj: unknown, keys: string[], maxDepth = 6): string {
  const wanted = new Set(keys.map((k) => k.toLowerCase()));
  const seen = new Set<object>();

  function walk(node: unknown, depth: number): string {
    if (node === null || node === undefined) return "";
    if (depth > maxDepth) return "";
    if (typeof node !== "object") return "";
    const objNode = node as object;
    if (seen.has(objNode)) return "";
    seen.add(objNode);

    // 1) revisar propiedades directas primero
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (!wanted.has(String(k).toLowerCase())) continue;
      const s = safeStr(v, "").trim();
      if (s) return s;
    }

    // 2) luego recorrer hijos
    for (const v of Object.values(node as Record<string, unknown>)) {
      if (typeof v === "string") continue;
      const found = walk(v, depth + 1);
      if (found) return found;
    }

    return "";
  }

  return walk(obj, 0);
}

function deepFindNumber(obj: unknown, keys: string[], maxDepth = 6): number | null {
  const wanted = new Set(keys.map((k) => k.toLowerCase()));
  const seen = new Set<object>();

  function walk(node: unknown, depth: number): number | null {
    if (node === null || node === undefined) return null;
    if (depth > maxDepth) return null;
    if (typeof node !== "object") return null;
    const objNode = node as object;
    if (seen.has(objNode)) return null;
    seen.add(objNode);

    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (!wanted.has(String(k).toLowerCase())) continue;
      const n = Number(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return n;
    }

    for (const v of Object.values(node as Record<string, unknown>)) {
      if (typeof v === "number") continue;
      const found = walk(v, depth + 1);
      if (found !== null) return found;
    }

    return null;
  }

  return walk(obj, 0);
}

// Intenta leer “datos esenciales” aunque la IA cambie nombres de campos.
function extractEssentials(caseObj: unknown) {
  const base = asRecord(caseObj) ?? {};
  const meta = asRecord(base["meta"]) ?? {};
  // Título / resumen
  const title =
    safeStr(
      deepFindString(caseObj, [
        "case_title",
        "title",
        "nombre",
        "titulo",
        "caseName",
      ])
    ) ||
    safeStr(meta?.title) ||
    "Caso (sin título)";

  const summary =
    safeStr(
      deepFindString(caseObj, [
        "case_summary",
        "summary",
        "resumen",
        "descripcion",
        "case_description",
        "description",
      ])
    ) || safeStr(meta?.summary) || "";

  // Perfil del paciente (distintas variantes)
  const p =
    asRecord(base["patient_profile"]) ||
    asRecord(base["patientProfile"]) ||
    asRecord(base["patient"]) ||
    asRecord(base["profile"]) ||
    asRecord(base["persona"]) ||
    {};

  const name =
    safeStr(
      p?.display_name ||
        p?.name ||
        p?.nombre ||
        base?.patient_name ||
        deepFindString(caseObj, ["patient_name", "display_name", "nombre_paciente"]) ||
        "Paciente"
    ) || "Paciente";

  const age =
    (typeof p?.age === "number" ? p.age : null) ??
    (typeof base?.patient_age === "number" ? base.patient_age : null) ??
    (typeof meta?.patient_age === "number" ? meta.patient_age : null) ??
    deepFindNumber(caseObj, ["age", "edad", "patient_age", "edad_paciente"]) ??
    null;

  const sexRaw =
    p?.sex ??
    p?.gender ??
    p?.sexo ??
    base?.patient_sex ??
    base?.patient_gender ??
    deepFindString(caseObj, ["sex", "gender", "sexo", "genero", "patient_sex", "patient_gender"]) ??
    "unspecified";

  const sex =
    (function normalizeSex(v: unknown): SexValue {
      const s = String(v ?? "unspecified").toLowerCase();
      if (["female", "f", "mujer", "femenino"].includes(s)) return "female";
      if (["male", "m", "hombre", "masculino"].includes(s)) return "male";
      if (["nonbinary", "nb", "no binario", "nobinario"].includes(s)) return "nonbinary";
      return "unspecified";
    })(sexRaw);

  // Contexto / motivo / objetivo (aquí es donde a veces se “pierde” por cambios de esquema)
  const context =
    safeStr(
      deepFindString(caseObj, [
        "context",
        "case_context",
        "patient_context",
        "historia",
        "historia_breve",
        "contexto",
        "contexto_breve",
        "background",
      ])
    ) || safeStr(meta?.context) || "";

  const chiefComplaint =
    safeStr(
      deepFindString(caseObj, [
        "chief_complaint",
        "chiefComplaint",
        "presenting_problem",
        "presentingProblem",
        "motivo_consulta",
        "motivo",
        "reason_for_visit",
        "reason",
        "complaint",
      ])
    ) || safeStr(meta?.chief_complaint) || safeStr(meta?.chiefComplaint) || "";

  const learningObjective =
    safeStr(
      deepFindString(caseObj, [
        "learning_objective",
        "learningObjective",
        "objetivo_aprendizaje",
        "objetivo",
        "objective",
        "training_objective",
      ])
    ) || safeStr(meta?.learning_objective) || safeStr(meta?.learningObjective) || "";

  const difficultyRaw =
    meta?.difficulty ??
    base?.difficulty ??
    deepFindString(caseObj, ["difficulty", "dificultad", "nivel"]) ??
    "beginner";

  const difficulty =
    (function normalizeDifficulty(v: unknown): DifficultyValue {
      const s = String(v ?? "beginner").toLowerCase();
      if (["advanced", "avanzado", "alto"].includes(s)) return "advanced";
      if (["intermediate", "intermedio", "medio"].includes(s)) return "intermediate";
      return "beginner";
    })(difficultyRaw);

  const targetMinutes =
    (typeof meta?.target_minutes === "number" ? meta.target_minutes : null) ??
    (typeof base?.target_minutes === "number" ? base.target_minutes : null) ??
    deepFindNumber(caseObj, ["target_minutes", "duracion_min", "minutes", "minutos"]) ??
    null;

  return {
    title,
    summary,
    name,
    age,
    sex,
    context,
    chiefComplaint,
    learningObjective,
    difficulty,
    targetMinutes,
  };
}

export default function CasesPage() {
  const router = useRouter();

  // If we arrive here right after login (mis-route), bounce to /dashboard once.
  useEffect(() => {
    try {
      const landing = sessionStorage.getItem("postLoginLanding");
      if (landing === "dashboard") {
        sessionStorage.removeItem("postLoginLanding");
        router.replace("/dashboard");
      }
    } catch {
      // ignore
    }
  }, [router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseObj, setCaseObj] = useState<Record<string, unknown> | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // ✅ Biblioteca
  const [selectedCategory, setSelectedCategory] = useState<string>("anxiety");
  const [selectedCard, setSelectedCard] = useState<CaseCatalogItem | null>(CASE_CATALOG[0] ?? null);
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [query, setQuery] = useState<string>("");

  // ✅ Config inline (modal en la MISMA página)
  const [showConfig, setShowConfig] = useState(false);
  const [configStep, setConfigStep] = useState<ConfigStep>(1);
  const [configModalTopOffset, setConfigModalTopOffset] = useState<number>(72);

  // Campos editables (se prellenan cuando se genera un caso)
  const [cfgName, setCfgName] = useState<string>("");
  const [cfgSex, setCfgSex] = useState<SexValue>("unspecified");
  const [cfgAge, setCfgAge] = useState<number>(25);
  const [cfgAgeGroup, setCfgAgeGroup] = useState<AgeGroup>("adult");
  const [cfgCompanionAvailable, setCfgCompanionAvailable] = useState<boolean>(false);
  const [cfgCompanionRole, setCfgCompanionRole] = useState<"madre" | "padre" | "tutor" | "cuidador" | "otro">("madre");
  const [cfgContext, setCfgContext] = useState<string>("");

  const [cfgDifficulty, setCfgDifficulty] =
    useState<DifficultyValue>("beginner");
  const [cfgTargetMinutes, setCfgTargetMinutes] = useState<number>(30);

  const [cfgApproach, setCfgApproach] = useState<ApproachValue>("humanistic");
  const [cfgTutorEnabled, setCfgTutorEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("tutorEnabled");
      if (v === "true") return true;
      if (v === "false") return false;
    } catch {}
    return true;
  });

  const [cfgChiefComplaint, setCfgChiefComplaint] = useState<string>("");
  const [cfgLearningObjective, setCfgLearningObjective] = useState<string>("");

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = getCatalogByAgeFilter(catalogFilter);
    if (!q) return visible;
    return visible.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q)
    );
  }, [query, catalogFilter]);

  const cooldownLabel = useMemo(() => {
    if (!cooldownUntil) return null;
    const left = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
    return left > 0 ? `Espera ${left}s` : null;
  }, [cooldownUntil, now]);

  const isCooldownActive = cooldownUntil != null && cooldownUntil > now;

  function prefillConfigFromCase(nextCase: unknown) {
    const e = extractEssentials(nextCase);

    // Si por algún motivo el caso viene sin estos campos, damos un borrador mínimo
    // para que no quede vacío (si el backend/IA los trae, esto se sobrescribe).
    const fallbackFromCatalog = selectedCard
      ? {
          chief: selectedCard.title,
          context: selectedCard.desc,
          objective: `Practicar entrevista clínica y psicoeducación en: ${selectedCard.title}.`,
        }
      : null;

    setCfgName(e.name || "");
    setCfgSex(e.sex || "unspecified");
    setCfgAge(
      typeof e.age === "number" ? clampInt(e.age, 5, 95) : 25
    );
    setCfgContext(safeStr(e.context, "") || safeStr(fallbackFromCatalog?.context, ""));
    try {
      const base = asRecord(nextCase) ?? {};
      const meta = asRecord((base as any).meta) ?? {};
      const rawGroup = safeStr((meta as any).age_group as unknown, "").trim().toLowerCase();
      const fromMeta: AgeGroup | null =
        rawGroup === "child" || rawGroup === "adolescent" || rawGroup === "mixed" || rawGroup === "adult"
          ? (rawGroup as AgeGroup)
          : null;
      const pickedGroup = fromMeta ?? selectedCard?.age_group ?? "adult";
      setCfgAgeGroup(pickedGroup);

      const companionAvailable =
        Boolean((meta as any).companion_available ?? (base as any).companion_available) ||
        pickedGroup === "child" ||
        pickedGroup === "adolescent";
      setCfgCompanionAvailable(companionAvailable);

      const roleRaw = safeStr((meta as any).companion_role as unknown, "").toLowerCase();
      if (roleRaw === "madre" || roleRaw === "padre" || roleRaw === "tutor" || roleRaw === "cuidador" || roleRaw === "otro") {
        setCfgCompanionRole(roleRaw as any);
      } else {
        setCfgCompanionRole("madre");
      }
    } catch {
      setCfgAgeGroup(selectedCard?.age_group ?? "adult");
      setCfgCompanionAvailable((selectedCard?.age_group ?? "adult") !== "adult");
      setCfgCompanionRole("madre");
    }

    setCfgDifficulty(
      (["beginner", "intermediate", "advanced"].includes(e.difficulty)
        ? e.difficulty
        : "beginner") as DifficultyValue
    );

    setCfgTargetMinutes(
      typeof e.targetMinutes === "number"
        ? clampInt(e.targetMinutes, 5, 30)
        : 30
    );

    // Enfoque psicoterapéutico (si el caso ya lo trae, lo respetamos)
    try {
      const base = asRecord(nextCase) ?? {};
      const meta = asRecord((base as any).meta) ?? {};
      const raw = safeStr((meta as any).approach as unknown, "").trim().toLowerCase();
      const allowed: ApproachValue[] = ["humanistic", "cbt", "psychodynamic", "systemic"];
      const picked = (allowed as string[]).includes(raw) ? (raw as ApproachValue) : defaultApproachByCategory(selectedCategory);
      setCfgApproach(picked);
    } catch {
      setCfgApproach(defaultApproachByCategory(selectedCategory));
    }

    // Tutor IA (si el caso lo trae, lo respetamos; si no, usamos preferencia local)
    try {
      const base = asRecord(nextCase) ?? {};
      const meta = asRecord((base as any).meta) ?? {};
      const rawTutor = (meta as any).tutor_enabled ?? (base as any).tutor_enabled;
      if (typeof rawTutor === "boolean") {
        setCfgTutorEnabled(rawTutor);
      } else {
        const v = localStorage.getItem("tutorEnabled");
        if (v === "true") setCfgTutorEnabled(true);
        else if (v === "false") setCfgTutorEnabled(false);
      }
    } catch {
      // ignore
    }

    setCfgChiefComplaint(safeStr(e.chiefComplaint, "") || safeStr(fallbackFromCatalog?.chief, ""));
    setCfgLearningObjective(safeStr(e.learningObjective, "") || safeStr(fallbackFromCatalog?.objective, ""));
  }

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setCaseObj(null);

    try {
      const headers = await getAuthFetchHeaders({
        "Content-Type": "application/json",
      });

      const res = await fetch("/api/ai/generate-case", {
        method: "POST",
        headers,
        body: JSON.stringify({
          category: selectedCategory, // ✅ biblioteca -> IA
          age_group: cfgAgeGroup,
          difficulty: cfgDifficulty, // usa lo que tengas seteado (por defecto beginner)
          target_minutes: cfgTargetMinutes, // por defecto 8
          approach: cfgApproach,
          case_seed: pickSeedByCategory(selectedCategory),
          // Pide explícitamente campos educativos (si tu backend los soporta)
          include_educational_fields: true,
          language: "es",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        const ms = Number((data as any)?.retry_after_ms ?? 120000);
        setError(
          (data as any)?.detail ||
            "Se alcanzó el límite de solicitudes. Intenta nuevamente en unos minutos."
        );
        setCooldownUntil(Date.now() + (Number.isFinite(ms) ? ms : 120000));
        setLoading(false);
        return;
      }

      if (!res.ok)
        throw new Error(
          (data as any)?.detail || (data as any)?.error || "No se pudo generar el caso."
        );

      setCaseObj(data);
      setCooldownUntil(null);

      // Prefill configuración con lo que devolvió la IA
      prefillConfigFromCase(data);

      // guardar como caso activo para /simulator
      try {
        localStorage.setItem("activeCase", JSON.stringify(data));
      } catch {
        // ignore
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (cooldownUntil == null) return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [cooldownUntil]);

  function openConfig(anchorEl?: HTMLElement) {
    if (!caseObj) return;
    // refresca por si el caso cambió
    prefillConfigFromCase(caseObj);
    setConfigStep(1);
    if (typeof window !== "undefined") {
      const vh = window.innerHeight || 900;
      const anchorTop = anchorEl?.getBoundingClientRect().top ?? vh * 0.45;
      // Mantiene el modal cerca de la zona donde el usuario hizo click, evitando pegarlo arriba.
      const desiredTop = anchorTop - 84;
      const boundedTop = Math.max(20, Math.min(desiredTop, vh - 220));
      setConfigModalTopOffset(Math.round(boundedTop));
    }
    setShowConfig(true);
  }

  function applyConfigToCaseObj(current: Record<string, unknown> | null) {
    const next: Record<string, unknown> = { ...(current ?? {}) };

    const patientProfile = asRecord(next.patient_profile) ?? asRecord(next.patient) ?? {};
    const metaObj = asRecord(next.meta) ?? {};

    // Normaliza estructura principal (no sabemos el schema exacto, pero dejamos todo coherente)
    const patient_profile = {
      ...(patientProfile ?? {}),
      display_name: cfgName || (patientProfile?.display_name as string | undefined) || "Paciente",
      sex: cfgSex,
      age: clampInt(Number(cfgAge), 5, 95),
    };

    next.patient_profile = patient_profile;

    // --- DSM/dx helpers
    const existingDsmTag = safeStr((metaObj as any).dsm_tag as unknown, "").trim();
    const existingDxId = safeStr((metaObj as any).dx_id as unknown, "").trim();
    const derivedDsm = deriveDsmTag(selectedCategory, selectedCard);
    const derivedDx = deriveTopicsDx(selectedCategory, selectedCard);

    // Campos "educativos" / metadata
    next.meta = {
      ...metaObj,
      difficulty: cfgDifficulty,
      target_minutes: clampInt(Number(cfgTargetMinutes), 5, 30),
      learning_objective:
        cfgLearningObjective || (metaObj.learning_objective as string | undefined) || "",
      chief_complaint: cfgChiefComplaint || (metaObj.chief_complaint as string | undefined) || "",
      category: selectedCategory,
      // Mantén el dsm_tag que viene del generador IA; si falta, usa el derivado
      dsm_tag: existingDsmTag || derivedDsm,
      // dx_id se usa para /topics?dx=
      dx_id: existingDxId || derivedDx,
      age_group: cfgAgeGroup,
      pediatric_mode: cfgAgeGroup === "child" || cfgAgeGroup === "adolescent",
      companion_available: cfgCompanionAvailable,
      companion_role: cfgCompanionRole,
      approach: cfgApproach,
      tutor_enabled: cfgTutorEnabled,
    };

    // Contexto + etiquetas alternativas
    next.context = cfgContext || next.context || "";
    next.chief_complaint = cfgChiefComplaint || next.chief_complaint || "";
    next.learning_objective =
      cfgLearningObjective || next.learning_objective || "";
    (next as any).companion_profile = cfgCompanionAvailable
      ? {
          display_name: (next as any)?.companion_profile?.display_name ?? "Acompañante",
          relation: cfgCompanionRole,
          cooperativeness: (next as any)?.companion_profile?.cooperativeness ?? "medium",
          reliability: (next as any)?.companion_profile?.reliability ?? "medium",
          narrative_style: (next as any)?.companion_profile?.narrative_style ?? "detailed",
        }
      : undefined;

    // Mantener dsm_tag y dx_id a nivel raíz para compatibilidad
    (next as any).dsm_tag = safeStr((next as any).dsm_tag, "").trim() || safeStr((next as any)?.meta?.dsm_tag, "").trim() || derivedDsm;
    (next as any).dx_id = safeStr((next as any).dx_id, "").trim() || safeStr((next as any)?.meta?.dx_id, "").trim() || derivedDx;
    (next as any).approach = safeStr((next as any).approach, "").trim() || safeStr((next as any)?.meta?.approach, "").trim() || cfgApproach;
    (next as any).tutor_enabled = typeof (next as any).tutor_enabled === "boolean" ? (next as any).tutor_enabled : cfgTutorEnabled;
    (next as any).age_group = cfgAgeGroup;
    (next as any).companion_available = cfgCompanionAvailable;
    (next as any).companion_role = cfgCompanionRole;

    return next;
  }

  function saveConfig() {
    if (!caseObj) return;
    const updated = applyConfigToCaseObj(caseObj);
    setCaseObj(updated);

    try {
      localStorage.setItem("activeCase", JSON.stringify(updated));
      localStorage.setItem("tutorEnabled", cfgTutorEnabled ? "true" : "false");
    } catch {}

    setShowConfig(false);
  }

  function goStart() {
    if (!caseObj) return;

    // Antes de iniciar, aplica configuración por si cambiaste algo y no guardaste
    const updated = applyConfigToCaseObj(caseObj);
    try {
      localStorage.setItem("activeCase", JSON.stringify(updated));
      localStorage.setItem("tutorEnabled", cfgTutorEnabled ? "true" : "false");
      localStorage.setItem("activeTranscript", JSON.stringify([]));
      // Ensure simulator treats this as a new in-progress session
      localStorage.setItem("sessionEnded", "false");
      localStorage.removeItem("sessionEndedInfo");
    } catch {}
    window.location.href = "/simulator";
  }

  const essentials = useMemo(() => (caseObj ? extractEssentials(caseObj) : null), [caseObj]);
  const isPediatricCase = cfgAgeGroup === "child" || cfgAgeGroup === "adolescent";

  const computedDx = useMemo(
    () =>
      safeStr(
        (caseObj as any)?.meta?.dx_id,
        deriveTopicsDx(selectedCategory, selectedCard) || ""
      ),
    [caseObj, selectedCategory, selectedCard]
  );

  const caseRiskLevel = useMemo(() => {
    if (!essentials) return "bajo" as const;
    return inferCaseRiskLevel(
      [essentials.summary, cfgChiefComplaint, cfgContext, cfgLearningObjective]
        .filter(Boolean)
        .join(" ")
    );
  }, [essentials, cfgChiefComplaint, cfgContext, cfgLearningObjective]);

  const interviewSuggestions = useMemo(
    () =>
      getCaseInterviewSuggestions({
        categoryId: selectedCategory,
        ageGroup: cfgAgeGroup,
      }),
    [selectedCategory, cfgAgeGroup]
  );

  const riskBadgeClass =
    caseRiskLevel === "alto"
      ? "border-red-400/30 bg-red-400/10 text-red-100"
      : caseRiskLevel === "medio"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  const topicsHref = computedDx
    ? `/topics?dx=${encodeURIComponent(computedDx)}`
    : "/topics";

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="relative mx-auto w-full max-w-6xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(64,194,255,0.22),rgba(0,0,0,0)_60%)] blur-2xl"
            />

            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Biblioteca de casos clínicos</h1>
                <p className="mt-1 text-sm text-white/70">
                  Selecciona un tema, genera un caso IA y prepáralo antes de entrar al simulador.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/topics"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  Biblioteca clínica
                </Link>
                <Link
                  href="/"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  Volver a inicio
                </Link>
              </div>
            </header>

            <section className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-4">
              {[
                { id: 1, label: "Selecciona tema", done: true },
                { id: 2, label: "Genera caso", done: Boolean(caseObj) },
                { id: 3, label: "Configura", done: Boolean(caseObj) },
                { id: 4, label: "Inicia entrevista", done: false },
              ].map((step) => (
                <div
                  key={step.id}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    step.done
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-black/25 text-white/65"
                  }`}
                >
                  {step.id}. {step.label}
                </div>
              ))}
            </section>

            <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/80 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-white/60">Paso 1</div>
                  <h2 className="text-lg font-semibold">Elige la temática del caso</h2>
                </div>

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar temática…"
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm outline-none focus:border-white/20 sm:w-[300px]"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Todos"],
                    ["adult", "Adulto"],
                    ["pediatric", "Niño / Adolescente"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCatalogFilter(value)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      catalogFilter === value
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/25 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCatalog.map((item) => {
                  const selected = selectedCard?.id === item.id;
                  const accent = item.accent ?? "from-white/10 to-transparent";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(item.id);
                        setSelectedCard(item);
                        setCfgAgeGroup(item.age_group);
                        setCfgCompanionAvailable(
                          item.age_group === "child" || item.age_group === "adolescent"
                        );
                        setCfgApproach(defaultApproachByCategory(item.id));
                      }}
                      className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-cyan-400/35 bg-cyan-500/10 ring-2 ring-cyan-400/25"
                          : "border-white/10 bg-black/25 hover:bg-black/35"
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-base font-semibold">{item.title}</div>
                          <span className="rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-[10px] text-white/70">
                            {item.tag}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-white/70">{item.desc}</div>
                        <div className="mt-3 text-[11px] text-white/55">
                          Grupo etario:{" "}
                          {item.age_group === "adult"
                            ? "Adulto"
                            : item.age_group === "adolescent"
                            ? "Adolescente"
                            : "Niñez"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/75">
                  Seleccionado: {selectedCard?.title ?? "—"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/75">
                  Enfoque: {prettyApproach(cfgApproach)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={goStart}
                  disabled={!caseObj}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  Iniciar entrevista
                </button>
                <button
                  onClick={(e) => openConfig(e.currentTarget)}
                  disabled={!caseObj}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5 disabled:opacity-50"
                >
                  Configurar caso
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || isCooldownActive}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 disabled:opacity-60"
                >
                  {loading
                    ? "Generando caso…"
                    : cooldownLabel
                    ? cooldownLabel
                    : "Generar caso (IA)"}
                </button>
              </div>
            </section>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {!caseObj && (
              <section className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
                <div className="text-base font-semibold">Aún no hay caso generado</div>
                <p className="mt-2 text-sm text-white/65">
                  Elige una temática y genera un caso IA para continuar al simulador.
                </p>
              </section>
            )}

            {caseObj && essentials && (
              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/85 p-5">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wider text-white/55">
                      Resumen clínico
                    </div>
                    <div className="mt-2 text-xl font-semibold">{essentials.title}</div>
                    <div className="mt-2 text-sm text-white/75">
                      {essentials.summary || "Caso generado correctamente. Revisa motivo y contexto para iniciar."}
                    </div>
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-xs text-white/55">Motivo de consulta</div>
                      <div className="mt-1 text-sm text-white/85">
                        {cfgChiefComplaint || essentials.chiefComplaint || "—"}
                      </div>
                      <div className="mt-3 text-xs text-white/55">Contexto breve</div>
                      <div className="mt-1 text-sm text-white/75">
                        {cfgContext || essentials.context || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-wider text-white/55">
                        Riesgo educativo
                      </div>
                      <span
                        className={`mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs ${riskBadgeClass}`}
                      >
                        Nivel {caseRiskLevel}
                      </span>
                      <p className="mt-2 text-xs text-white/70">
                        Resultado orientativo para priorizar seguridad en el entrenamiento.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-wider text-white/55">
                        Datos del caso
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs text-white/75">
                          {prettySex(cfgSex)} · {cfgAge} años
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs text-white/75">
                          {prettyDifficulty(cfgDifficulty)}
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs text-white/75">
                          {cfgTargetMinutes} min
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs text-white/75">
                          {cfgAgeGroup === "adult"
                            ? "Adulto"
                            : cfgAgeGroup === "adolescent"
                            ? "Adolescente"
                            : "Niñez"}
                        </span>
                        {cfgCompanionAvailable && (
                          <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs text-white/75">
                            Acompañante: {prettyCompanionRole(cfgCompanionRole)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-white/60">
                        DSM: {safeStr((caseObj as any)?.meta?.dsm_tag, deriveDsmTag(selectedCategory, selectedCard) || "—")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wider text-white/55">
                      Objetivo docente
                    </div>
                    <div className="mt-2 text-sm text-white/85">
                      {cfgLearningObjective || essentials.learningObjective || "—"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wider text-white/55">
                      Sugerencias para entrevista
                    </div>
                    <div className="mt-2 text-sm text-white/80">
                      Escalas: {interviewSuggestions.scales.join(" · ")}
                    </div>
                    <div className="mt-1 text-sm text-white/80">
                      Tests: {interviewSuggestions.tests.join(" · ")}
                    </div>
                    <div className="mt-2 text-xs text-white/65">
                      {interviewSuggestions.focus[0]}
                    </div>
                    <div className="mt-1 text-xs text-white/65">
                      {interviewSuggestions.focus[1]}
                    </div>
                    <div className="mt-1 text-xs text-white/65">
                      {interviewSuggestions.focus[2]}
                    </div>
                  </div>

                  {isPediatricCase && (
                    <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 lg:col-span-2">
                      <div className="text-sm font-semibold text-cyan-100">
                        Checklist pediátrico sugerido
                      </div>
                      <div className="mt-2 text-xs text-cyan-100/90">
                        Desarrollo · Escolaridad · Conducta en casa · Conducta en escuela · Sueño · Alimentación · Socialización · Antecedentes perinatales.
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={topicsHref}
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                  >
                    Abrir referencia clínica
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => openConfig(e.currentTarget)}
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                  >
                    Ajustar escenario
                  </button>
                  <button
                    type="button"
                    onClick={goStart}
                    className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-black"
                  >
                    Iniciar entrevista ahora
                  </button>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-white/60">
                    Ver JSON (debug)
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/70">
                    {JSON.stringify(caseObj, null, 2)}
                  </pre>
                </details>
              </section>
            )}

            {showConfig && (
              <div className="fixed inset-0 z-50">
                <div
                  className="absolute inset-0 bg-black/70"
                  onClick={() => setShowConfig(false)}
                />

                <div className="relative h-full w-full overflow-y-auto px-2 py-3 sm:px-4 sm:py-4">
                  <div
                    className="relative mx-auto mb-6 flex max-h-[calc(100dvh-20px)] w-full max-w-[1080px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A1020]/95 shadow-2xl backdrop-blur-xl sm:max-h-[calc(100dvh-32px)]"
                    style={{ marginTop: configModalTopOffset }}
                  >
                    <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-white/60">Configurar caso</div>
                        <h3 className="mt-1 text-lg font-semibold">
                          Ajusta el escenario antes de iniciar
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowConfig(false)}
                        className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
                      >
                        Cerrar
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {([
                        [1, "Paciente"],
                        [2, "Parámetros"],
                        [3, "Objetivo y revisión"],
                      ] as const).map(([step, label]) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setConfigStep(step)}
                          className={`rounded-full border px-3 py-1 text-xs ${
                            configStep === step
                              ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                              : "border-white/10 bg-black/20 text-white/65"
                          }`}
                        >
                          {step}. {label}
                        </button>
                      ))}
                    </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                      {configStep === 1 && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                            <label className="text-xs text-white/60">Nombre</label>
                            <input
                              value={cfgName}
                              onChange={(e) => setCfgName(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                            />

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-white/60">Sexo</label>
                                <select
                                  value={cfgSex}
                                  onChange={(e) => setCfgSex(e.target.value as SexValue)}
                                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                                >
                                  <option value="unspecified">No especificado</option>
                                  <option value="female">Mujer</option>
                                  <option value="male">Hombre</option>
                                  <option value="nonbinary">No binario</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-white/60">Edad</label>
                                <input
                                  type="number"
                                  value={cfgAge}
                                  min={5}
                                  max={95}
                                  onChange={(e) =>
                                    setCfgAge(clampInt(Number(e.target.value), 5, 95))
                                  }
                                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                                />
                              </div>
                            </div>

                            <label className="mt-3 block text-xs text-white/60">Contexto breve</label>
                            <textarea
                              value={cfgContext}
                              onChange={(e) => setCfgContext(e.target.value)}
                              className="mt-1 min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                            />
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                            <div className="text-sm font-semibold">Vista rápida</div>
                            <div className="mt-3 text-sm text-white/80">
                              Paciente: {cfgName || "—"}
                            </div>
                            <div className="mt-1 text-sm text-white/80">
                              Perfil: {prettySex(cfgSex)} · {cfgAge} años
                            </div>
                            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
                              Completa estos datos para que la narrativa del caso sea coherente antes
                              de configurar parámetros docentes.
                            </div>
                          </div>
                        </div>
                      )}

                    {configStep === 2 && (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-white/60">Dificultad</label>
                              <select
                                value={cfgDifficulty}
                                onChange={(e) =>
                                  setCfgDifficulty(e.target.value as DifficultyValue)
                                }
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                <option value="beginner">Básico</option>
                                <option value="intermediate">Intermedio</option>
                                <option value="advanced">Avanzado</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-white/60">Duración (min)</label>
                              <select
                                value={cfgTargetMinutes}
                                onChange={(e) =>
                                  setCfgTargetMinutes(clampInt(Number(e.target.value), 5, 30))
                                }
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                {[5, 10, 15, 20, 25, 30].map((m) => (
                                  <option key={m} value={m}>
                                    {m} min
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-white/60">Grupo etario</label>
                              <select
                                value={cfgAgeGroup}
                                onChange={(e) => {
                                  const value = e.target.value as AgeGroup;
                                  const pediatric = value === "child" || value === "adolescent";
                                  setCfgAgeGroup(value);
                                  if (pediatric) setCfgCompanionAvailable(true);
                                }}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                <option value="adult">Adulto</option>
                                <option value="adolescent">Adolescente</option>
                                <option value="child">Niñez</option>
                                <option value="mixed">Mixto</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-white/60">Acompañante</label>
                              <select
                                value={cfgCompanionAvailable ? "yes" : "no"}
                                onChange={(e) =>
                                  setCfgCompanionAvailable(e.target.value === "yes")
                                }
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                <option value="no">No</option>
                                <option value="yes">Sí</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-white/60">Rol acompañante</label>
                              <select
                                value={cfgCompanionRole}
                                onChange={(e) => setCfgCompanionRole(e.target.value as any)}
                                disabled={!cfgCompanionAvailable}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none disabled:opacity-50"
                              >
                                <option value="madre">Madre</option>
                                <option value="padre">Padre</option>
                                <option value="tutor">Tutor</option>
                                <option value="cuidador">Cuidador</option>
                                <option value="otro">Otro</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-white/60">Enfoque</label>
                              <select
                                value={cfgApproach}
                                onChange={(e) => setCfgApproach(e.target.value as ApproachValue)}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                <option value="humanistic">Humanístico</option>
                                <option value="cbt">Cognitivo-conductual (TCC)</option>
                                <option value="psychodynamic">Psicodinámico</option>
                                <option value="systemic">Sistémico / familiar</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                            <div>
                              <div className="text-sm font-medium">Tutor IA</div>
                              <div className="text-xs text-white/60">
                                Sugerencias durante la entrevista (opcional)
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCfgTutorEnabled((v) => !v)}
                              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                                cfgTutorEnabled
                                  ? "border-white/20 bg-white/85"
                                  : "border-white/15 bg-black/40"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-black transition ${
                                  cfgTutorEnabled ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
                            Usa este paso para fijar el nivel de exigencia y la dinámica del caso
                            antes de trabajar objetivos clínicos.
                          </div>
                        </div>
                      </div>
                    )}

                    {configStep === 3 && (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <label className="text-xs text-white/60">
                            Motivo de consulta (1 línea)
                          </label>
                          <input
                            value={cfgChiefComplaint}
                            onChange={(e) => setCfgChiefComplaint(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                          />

                          <label className="mt-3 block text-xs text-white/60">
                            Objetivo de aprendizaje
                          </label>
                          <textarea
                            value={cfgLearningObjective}
                            onChange={(e) => setCfgLearningObjective(e.target.value)}
                            className="mt-1 min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                            <div className="text-xs uppercase tracking-wider text-white/55">
                              Validación rápida
                            </div>
                            <div className="mt-2 text-sm text-white/80">
                              Riesgo orientativo:{" "}
                              <span
                                className={`rounded-full border px-2 py-0.5 text-xs ${riskBadgeClass}`}
                              >
                                {caseRiskLevel}
                              </span>
                            </div>
                            {isPediatricCase && !cfgCompanionAvailable && (
                              <div className="mt-2 rounded-xl border border-amber-400/25 bg-amber-400/10 p-2 text-xs text-amber-100">
                                Caso pediátrico sin acompañante: confirma si esto es intencional.
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                            <div className="text-xs uppercase tracking-wider text-white/55">
                              Herramientas sugeridas
                            </div>
                            <div className="mt-2 text-xs text-white/75">
                              Escalas: {interviewSuggestions.scales.join(" · ")}
                            </div>
                            <div className="mt-1 text-xs text-white/75">
                              Tests: {interviewSuggestions.tests.join(" · ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/25 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="text-xs text-white/60">Paso {configStep} de 3</div>

                    <div className="flex flex-wrap gap-2">
                      {configStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setConfigStep((s) => (Math.max(1, s - 1) as ConfigStep))}
                          className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/85 hover:bg-white/5"
                        >
                          Anterior
                        </button>
                      )}

                      {configStep < 3 && (
                        <button
                          type="button"
                          onClick={() => setConfigStep((s) => (Math.min(3, s + 1) as ConfigStep))}
                          className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/85 hover:bg-white/5"
                        >
                          Siguiente
                        </button>
                      )}

                      {configStep === 3 && (
                        <>
                          <button
                            type="button"
                            onClick={saveConfig}
                            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/85 hover:bg-white/5"
                          >
                            Guardar cambios
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              saveConfig();
                              window.setTimeout(() => goStart(), 50);
                            }}
                            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black"
                          >
                            Guardar e iniciar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            <div className="mt-8 text-xs text-white/40">
              Psyke es una herramienta educativa. Los casos son ficticios. Resultado orientativo.
              No sustituye valoración clínica real.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
