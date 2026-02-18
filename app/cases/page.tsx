"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

type CatalogItem = { id: string; title: string; desc: string; tag: string };

type SexValue = "female" | "male" | "nonbinary" | "unspecified";
type DifficultyValue = "beginner" | "intermediate" | "advanced";

const CATALOG: CatalogItem[] = [
  {
    id: "anxiety",
    title: "Ansiedad",
    desc: "Preocupación persistente, tensión, síntomas físicos. Practica contención y preguntas abiertas.",
    tag: "Entrevista",
  },
  {
    id: "depression",
    title: "Depresión",
    desc: "Ánimo bajo, anhedonia, fatiga. Practica exploración de riesgo y apoyo.",
    tag: "Seguimiento",
  },
  {
    id: "panic",
    title: "Crisis de pánico",
    desc: "Inicio súbito, miedo intenso, palpitaciones. Practica grounding y psicoeducación.",
    tag: "Crisis",
  },
  {
    id: "ptsd",
    title: "TEPT",
    desc: "Recuerdos intrusivos, hipervigilancia. Practica seguridad y enfoque gradual.",
    tag: "Entrevista",
  },
  {
    id: "ocd",
    title: "TOC",
    desc: "Obsesiones y compulsiones. Practica clarificación sin reforzar rituales.",
    tag: "Entrevista",
  },
  {
    id: "bipolar",
    title: "Trastorno bipolar",
    desc: "Cambios de ánimo, posible hipomanía/manía. Practica evaluación de curso.",
    tag: "Seguimiento",
  },
  {
    id: "delirium",
    title: "Delirio / confusión",
    desc: "Desorientación, ideas falsas. Practica reorientación y seguridad.",
    tag: "Crisis",
  },
  {
    id: "substances",
    title: "Consumo de sustancias",
    desc: "Uso problemático y ambivalencia. Practica entrevista motivacional.",
    tag: "Seguimiento",
  },
  {
    id: "eating",
    title: "TCA",
    desc: "Relación con comida/imagen corporal. Practica enfoque no estigmatizante.",
    tag: "Entrevista",
  },
  {
    id: "selfharm",
    title: "Ideación autolesiva (educativo)",
    desc: "Señales de alarma y plan de seguridad. Practica derivación y contención.",
    tag: "Crisis",
  },
];

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseObj, setCaseObj] = useState<Record<string, unknown> | null>(null);

  // ✅ Biblioteca
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [selectedCard, setSelectedCard] = useState<CatalogItem | null>(null);
  const [query, setQuery] = useState<string>("");

  // ✅ Config inline (modal en la MISMA página)
  const [showConfig, setShowConfig] = useState(false);

  // Campos editables (se prellenan cuando se genera un caso)
  const [cfgName, setCfgName] = useState<string>("");
  const [cfgSex, setCfgSex] = useState<SexValue>("unspecified");
  const [cfgAge, setCfgAge] = useState<number>(25);
  const [cfgContext, setCfgContext] = useState<string>("");

  const [cfgDifficulty, setCfgDifficulty] =
    useState<DifficultyValue>("beginner");
  const [cfgTargetMinutes, setCfgTargetMinutes] = useState<number>(8);

  const [cfgChiefComplaint, setCfgChiefComplaint] = useState<string>("");
  const [cfgLearningObjective, setCfgLearningObjective] = useState<string>("");

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q)
    );
  }, [query]);

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

    setCfgDifficulty(
      (["beginner", "intermediate", "advanced"].includes(e.difficulty)
        ? e.difficulty
        : "beginner") as DifficultyValue
    );

    setCfgTargetMinutes(
      typeof e.targetMinutes === "number"
        ? clampInt(e.targetMinutes, 5, 30)
        : 8
    );

    setCfgChiefComplaint(safeStr(e.chiefComplaint, "") || safeStr(fallbackFromCatalog?.chief, ""));
    setCfgLearningObjective(safeStr(e.learningObjective, "") || safeStr(fallbackFromCatalog?.objective, ""));
  }

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setCaseObj(null);

    try {
      const res = await fetch("/api/ai/generate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory, // ✅ biblioteca -> IA
          difficulty: cfgDifficulty, // usa lo que tengas seteado (por defecto beginner)
          target_minutes: cfgTargetMinutes, // por defecto 8
          // Pide explícitamente campos educativos (si tu backend los soporta)
          include_educational_fields: true,
          language: "es",
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.detail || data?.error || "No se pudo generar el caso."
        );

      setCaseObj(data);

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

  function openConfig() {
    if (!caseObj) return;
    // refresca por si el caso cambió
    prefillConfigFromCase(caseObj);
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

    // Campos "educativos" / metadata
    next.meta = {
      ...metaObj,
      difficulty: cfgDifficulty,
      target_minutes: clampInt(Number(cfgTargetMinutes), 5, 30),
      learning_objective:
        cfgLearningObjective || (metaObj.learning_objective as string | undefined) || "",
      chief_complaint: cfgChiefComplaint || (metaObj.chief_complaint as string | undefined) || "",
      category: selectedCategory,
    };

    // Contexto + etiquetas alternativas
    next.context = cfgContext || next.context || "";
    next.chief_complaint = cfgChiefComplaint || next.chief_complaint || "";
    next.learning_objective =
      cfgLearningObjective || next.learning_objective || "";

    return next;
  }

  function saveConfig() {
    if (!caseObj) return;
    const updated = applyConfigToCaseObj(caseObj);
    setCaseObj(updated);

    try {
      localStorage.setItem("activeCase", JSON.stringify(updated));
    } catch {}

    setShowConfig(false);
  }

  function goStart() {
    if (!caseObj) return;

    // Antes de iniciar, aplica configuración por si cambiaste algo y no guardaste
    const updated = applyConfigToCaseObj(caseObj);
    try {
      localStorage.setItem("activeCase", JSON.stringify(updated));
      localStorage.setItem("activeTranscript", JSON.stringify([]));
    } catch {}
    window.location.href = "/simulator";
  }

  const essentials = useMemo(() => (caseObj ? extractEssentials(caseObj) : null), [caseObj]);

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-[#070a12] via-[#0b1020] to-black">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <Sidebar />
        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          <div className="mx-auto w-full max-w-5xl relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(125,211,252,0.18),rgba(0,0,0,0)_60%)] blur-2xl"
        />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Biblioteca de casos</h1>
            <p className="mt-1 text-sm text-white/70">
              Elige una temática y genera un caso ficticio para practicar entrevista.{" "}
              <span className="text-white">No diagnostica</span>.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
          >
            Volver
          </Link>
        </div>

        {/* ✅ Biblioteca visual (SIEMPRE visible) */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm text-white/60">Antes de generar</div>
              <h2 className="mt-1 text-lg font-semibold">
                Elige un tema para practicar
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Selecciona una temática y luego presiona “Generar caso (IA)”.
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar (ej. ansiedad, crisis, seguimiento…)"
              className="w-full sm:w-[360px] rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/40"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCatalog.map((item) => {
              const selected = selectedCard?.id === item.id;

              const accentById: Record<string, string> = {
                anxiety: "from-sky-500/20 to-transparent",
                depression: "from-violet-500/20 to-transparent",
                panic: "from-rose-500/20 to-transparent",
                ptsd: "from-amber-500/20 to-transparent",
                ocd: "from-cyan-500/20 to-transparent",
                bipolar: "from-indigo-500/20 to-transparent",
                delirium: "from-orange-500/20 to-transparent",
                substances: "from-emerald-500/20 to-transparent",
                eating: "from-pink-500/20 to-transparent",
                selfharm: "from-red-500/20 to-transparent",
              };
              const accent = accentById[item.id] ?? "from-white/10 to-transparent";

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedCategory(item.id);
                    setSelectedCard(item);
                  }}
                  className={
                    "relative overflow-hidden rounded-2xl border p-4 transition cursor-pointer " +
                    (selected
                      ? "border-white/25 bg-white/10 ring-2 ring-white/20"
                      : "border-white/10 bg-black/25 hover:bg-black/35")
                  }
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`}
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-base font-semibold">{item.title}</div>
                      <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                    </div>

                    <div className="text-sm text-white/70 mt-1">{item.desc}</div>

                    <div className="inline-flex items-center rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-xs text-white/70 mt-3">
                      {item.tag}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-white/70">
            Seleccionado:{" "}
            <span className="text-white">{selectedCard?.title ?? "General"}</span>
          </div>
        </section>

        {/* Controles */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading ? "Generando…" : "Generar caso (IA)"}
          </button>

          <button
            onClick={openConfig}
            disabled={!caseObj}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Configurar
          </button>

          <button
            onClick={goStart}
            disabled={!caseObj}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Iniciar entrevista
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
            {error}
          </div>
        )}

        {/* Vista del caso generado (más educativo + datos esenciales) */}
        {caseObj && essentials && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="text-sm text-white/60">Caso generado</div>
                <div className="mt-2 text-base font-semibold">
                  {essentials.title}
                </div>
                {essentials.summary ? (
                  <div className="mt-2 text-sm text-white/70">
                    {essentials.summary}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-white/60">
                    Caso listo. Revisa los datos esenciales abajo y ajusta en “Configurar”.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                  Tema: {selectedCard?.title ?? "General"}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                  Dificultad: {prettyDifficulty(cfgDifficulty)}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                  Duración: {cfgTargetMinutes} min
                </span>
              </div>
            </div>

            {/* Datos esenciales */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/60">Paciente</div>
                <div className="mt-1 text-sm">
                  <span className="text-white font-medium">{cfgName || essentials.name}</span>
                </div>
                <div className="mt-1 text-sm text-white/70">
                  {prettySex(cfgSex)} · {cfgAge} años
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 lg:col-span-2">
                <div className="text-xs text-white/60">Motivo de consulta</div>
                <div className="mt-1 text-sm text-white/80">
                  {cfgChiefComplaint || essentials.chiefComplaint || "—"}
                </div>

                <div className="mt-3 text-xs text-white/60">Contexto breve</div>
                <div className="mt-1 text-sm text-white/70">
                  {cfgContext || essentials.context || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 lg:col-span-3">
                <div className="text-xs text-white/60">Objetivo de aprendizaje</div>
                <div className="mt-1 text-sm text-white/80">
                  {cfgLearningObjective || essentials.learningObjective || "—"}
                </div>
              </div>
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

        {/* ✅ Modal de configuración INLINE */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowConfig(false)}
            />
            <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b1020]/95 backdrop-blur-xl shadow-2xl">
              <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
                <div>
                  <div className="text-sm text-white/60">Configurar caso</div>
                  <h3 className="mt-1 text-lg font-semibold">Ajusta el escenario antes de iniciar</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Esto no “diagnostica”: solo define el guion educativo del caso.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfig(false)}
                  className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
                >
                  Cerrar
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Paciente */}
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm font-semibold">Paciente</div>

                    <label className="mt-3 block text-xs text-white/60">Nombre</label>
                    <input
                      value={cfgName}
                      onChange={(e) => setCfgName(e.target.value)}
                      placeholder="Ej: Carla Rodríguez"
                      className="mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/40"
                    />

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-white/60">Sexo</label>
                        <select
                          value={cfgSex}
                          onChange={(e) => setCfgSex(e.target.value as SexValue)}
                          className="mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                        >
                          <option value="unspecified">No especificado</option>
                          <option value="female">Mujer</option>
                          <option value="male">Hombre</option>
                          <option value="nonbinary">No binario</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-white/60">Edad</label>
                        <input
                          type="number"
                          value={cfgAge}
                          onChange={(e) => setCfgAge(clampInt(Number(e.target.value), 5, 95))}
                          className="mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                          min={5}
                          max={95}
                        />
                      </div>
                    </div>

                    <label className="mt-3 block text-xs text-white/60">Contexto breve</label>
                    <textarea
                      value={cfgContext}
                      onChange={(e) => setCfgContext(e.target.value)}
                      placeholder="Ej: presión laboral, insomnio, palpitaciones…"
                      className="mt-1 w-full min-h-[92px] resize-none rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/40"
                    />
                  </div>

                  {/* Parámetros educativos */}
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 md:col-span-2">
                    <div className="text-sm font-semibold">Parámetros educativos</div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-white/60">Dificultad</label>
                        <select
                          value={cfgDifficulty}
                          onChange={(e) => setCfgDifficulty(e.target.value as DifficultyValue)}
                          className="mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                        >
                          <option value="beginner">Básico</option>
                          <option value="intermediate">Intermedio</option>
                          <option value="advanced">Avanzado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-white/60">Duración (min)</label>
                        <input
                          type="number"
                          value={cfgTargetMinutes}
                          onChange={(e) =>
                            setCfgTargetMinutes(clampInt(Number(e.target.value), 5, 30))
                          }
                          className="mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                          min={5}
                          max={30}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-white/60">Tema</label>
                        <div className="mt-1 rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm text-white/70">
                          {selectedCard?.title ?? "General"}
                        </div>
                      </div>
                    </div>

                    <label className="mt-3 block text-xs text-white/60">
                      Motivo de consulta (1 línea)
                    </label>
                    <input
                      value={cfgChiefComplaint}
                      onChange={(e) => setCfgChiefComplaint(e.target.value)}
                      placeholder="Ej: “Ansiedad intensa con palpitaciones y miedo a fallar”"
                      className="mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/40"
                    />

                    <label className="mt-3 block text-xs text-white/60">
                      Objetivo de aprendizaje
                    </label>
                    <textarea
                      value={cfgLearningObjective}
                      onChange={(e) => setCfgLearningObjective(e.target.value)}
                      placeholder="Ej: practicar preguntas abiertas, psicoeducación y cierre seguro."
                      className="mt-1 w-full min-h-[92px] resize-none rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/40"
                    />

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={saveConfig}
                        className="rounded-xl bg-white text-black px-4 py-2 text-sm"
                      >
                        Guardar cambios
                      </button>

                      <button
                        onClick={() => setShowConfig(false)}
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
                      >
                        Seguir revisando
                      </button>

                      <button
                        onClick={() => {
                          saveConfig();
                          // iniciar al vuelo (con lo guardado)
                          window.setTimeout(() => goStart(), 50);
                        }}
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
                      >
                        Guardar e iniciar
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-white/50">
                      Tip: si luego cambias algo, vuelve a “Configurar” y guarda otra vez. Aquí mandas tú, no el caos 😄
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-white/40">
          Nota: los casos son ficticios. Si aparece contenido sensible, el sistema debe responder en modo educativo.
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}
