"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { getAuthFetchHeaders } from "@/src/lib/clientAuth";
import {
  MEDICAL_CASE_CATALOG,
  getMedicalCatalogByFilter,
  pickMedicalSeedByCategory,
  type MedicalCaseCatalogItem,
} from "@/src/lib/medicalCaseCatalog";
import type { AgeGroup } from "@/src/lib/types";

type SexValue = "female" | "male" | "nonbinary" | "unspecified";
type DifficultyValue = "beginner" | "intermediate" | "advanced";
type ApproachValue = "humanistic" | "cbt" | "psychodynamic" | "systemic";
type MedicalFilter = "all" | "adult" | "pediatric" | "pregnancy" | "older_adult";

function safeStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
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
    case "advanced":
      return "Avanzado";
    case "intermediate":
      return "Intermedio";
    default:
      return "Básico";
  }
}

function inferCaseRiskLevel(text: string): "alto" | "medio" | "bajo" {
  const t = String(text || "").toLowerCase();
  const high = ["shock", "sepsis", "paro", "hemorragia", "eclamps", "ictus", "acv", "insuficiencia respiratoria"];
  const medium = ["fiebre", "dolor intenso", "deshidrat", "hipergluc", "crisis"];
  if (high.some((k) => t.includes(k))) return "alto";
  if (medium.some((k) => t.includes(k))) return "medio";
  return "bajo";
}

function extractEssentials(caseObj: unknown) {
  const base = asRecord(caseObj) ?? {};
  const meta = asRecord(base.meta) ?? {};
  const patient = asRecord(base.patient_profile) ?? {};

  const title =
    safeStr(meta.title) ||
    safeStr((base as any).title) ||
    safeStr((base as any).case_title) ||
    "Caso médico";
  const summary = safeStr((base as any).brief_context) || safeStr((base as any).context) || "";
  const chiefComplaint = safeStr((base as any).chief_complaint) || "";
  const learningObjective = safeStr((base as any).learning_objective) || "";
  const name = safeStr(patient.display_name, "Paciente");
  const age = Number(patient.age);
  const sexRaw = safeStr(patient.sex, "unspecified").toLowerCase();

  const sex: SexValue =
    sexRaw === "female" || sexRaw === "mujer"
      ? "female"
      : sexRaw === "male" || sexRaw === "hombre"
      ? "male"
      : sexRaw === "nonbinary"
      ? "nonbinary"
      : "unspecified";

  const ageGroupRaw = safeStr(meta.age_group, "").toLowerCase();
  const age_group: AgeGroup =
    ageGroupRaw === "child" || ageGroupRaw === "adolescent" || ageGroupRaw === "mixed" || ageGroupRaw === "adult"
      ? (ageGroupRaw as AgeGroup)
      : age > 0 && age < 13
      ? "child"
      : age >= 13 && age < 18
      ? "adolescent"
      : "adult";

  return {
    title,
    summary,
    chiefComplaint,
    learningObjective,
    name,
    age: Number.isFinite(age) ? age : 40,
    sex,
    age_group,
  };
}

export default function MedicalCasesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseObj, setCaseObj] = useState<Record<string, unknown> | null>(null);

  const [selectedCard, setSelectedCard] = useState<MedicalCaseCatalogItem | null>(MEDICAL_CASE_CATALOG[0] ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string>(MEDICAL_CASE_CATALOG[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<MedicalFilter>("all");

  const [showConfig, setShowConfig] = useState(false);
  const [configModalTopOffset, setConfigModalTopOffset] = useState<number>(72);

  const [cfgName, setCfgName] = useState("Paciente");
  const [cfgSex, setCfgSex] = useState<SexValue>("unspecified");
  const [cfgAge, setCfgAge] = useState(40);
  const [cfgAgeGroup, setCfgAgeGroup] = useState<AgeGroup>("adult");
  const [cfgContext, setCfgContext] = useState("");
  const [cfgDifficulty, setCfgDifficulty] = useState<DifficultyValue>("intermediate");
  const [cfgTargetMinutes, setCfgTargetMinutes] = useState<number>(25);
  const [cfgApproach, setCfgApproach] = useState<ApproachValue>("systemic");
  const [cfgTutorEnabled, setCfgTutorEnabled] = useState<boolean>(true);
  const [cfgChiefComplaint, setCfgChiefComplaint] = useState("");
  const [cfgLearningObjective, setCfgLearningObjective] = useState("");

  const filteredCatalog = useMemo(() => {
    const base = getMedicalCatalogByFilter(catalogFilter);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q)
    );
  }, [catalogFilter, query]);

  const essentials = useMemo(() => (caseObj ? extractEssentials(caseObj) : null), [caseObj]);
  const isPediatricCase = cfgAgeGroup === "child" || cfgAgeGroup === "adolescent";
  const caseRiskLevel = useMemo(() => {
    const text = [essentials?.summary, cfgChiefComplaint, cfgContext].filter(Boolean).join(" ");
    return inferCaseRiskLevel(text);
  }, [essentials, cfgChiefComplaint, cfgContext]);

  const riskBadgeClass =
    caseRiskLevel === "alto"
      ? "border-red-400/30 bg-red-400/10 text-red-100"
      : caseRiskLevel === "medio"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";

  useEffect(() => {
    try {
      const v = localStorage.getItem("tutorEnabled");
      if (v === "true") setCfgTutorEnabled(true);
      if (v === "false") setCfgTutorEnabled(false);
    } catch {
      // ignore
    }
  }, []);

  function prefillConfigFromCase(nextCase: unknown) {
    const e = extractEssentials(nextCase);
    setCfgName(e.name || "Paciente");
    setCfgSex(e.sex);
    setCfgAge(clampInt(Number(e.age), 1, 95));
    setCfgAgeGroup(e.age_group);
    setCfgContext(e.summary || selectedCard?.desc || "");
    setCfgChiefComplaint(e.chiefComplaint || `Consulta por ${selectedCard?.title?.toLowerCase() ?? "síntomas actuales"}.`);
    setCfgLearningObjective(
      e.learningObjective ||
        `Practicar valoración inicial y priorización clínica en ${selectedCard?.title ?? "patología médica"}.`
    );
  }

  async function handleGenerate() {
    if (!selectedCard) return;
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
          domain: "medical",
          category: selectedCategory,
          age_group: cfgAgeGroup,
          difficulty: cfgDifficulty,
          target_minutes: cfgTargetMinutes,
          case_seed: pickMedicalSeedByCategory(selectedCard),
          language: "es",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.detail || (data as any)?.error || "No se pudo generar el caso médico.");

      const patched = {
        ...(data as any),
        meta: {
          ...((data as any)?.meta ?? {}),
          domain: "medical",
          category: selectedCategory,
          dsm_tag: safeStr((data as any)?.meta?.dsm_tag, selectedCard.dx_tag),
          dx_id: safeStr((data as any)?.meta?.dx_id, selectedCard.dx_id),
        },
      };
      setCaseObj(patched);
      prefillConfigFromCase(patched);
      try {
        localStorage.setItem("activeCase", JSON.stringify(patched));
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

  function openConfig(anchorEl?: HTMLElement) {
    if (!caseObj) return;
    prefillConfigFromCase(caseObj);
    if (typeof window !== "undefined") {
      const vh = window.innerHeight || 900;
      const anchorTop = anchorEl?.getBoundingClientRect().top ?? vh * 0.45;
      const desiredTop = anchorTop - 84;
      const boundedTop = Math.max(20, Math.min(desiredTop, vh - 220));
      setConfigModalTopOffset(Math.round(boundedTop));
    }
    setShowConfig(true);
  }

  function applyConfigToCaseObj(current: Record<string, unknown> | null) {
    const next: Record<string, unknown> = { ...(current ?? {}) };
    const patient = asRecord(next.patient_profile) ?? {};
    const meta = asRecord(next.meta) ?? {};

    next.patient_profile = {
      ...patient,
      display_name: cfgName || "Paciente",
      age: clampInt(Number(cfgAge), 1, 95),
      sex: cfgSex,
      context: cfgContext,
    };
    next.chief_complaint = cfgChiefComplaint;
    next.learning_objective = cfgLearningObjective;
    next.brief_context = cfgContext;

    next.meta = {
      ...meta,
      domain: "medical",
      category: selectedCategory,
      age_group: cfgAgeGroup,
      difficulty: cfgDifficulty,
      target_minutes: clampInt(Number(cfgTargetMinutes), 5, 40),
      dsm_tag: safeStr(meta.dsm_tag, selectedCard?.dx_tag ?? "MED"),
      dx_id: safeStr(meta.dx_id, selectedCard?.dx_id ?? selectedCategory),
      risk_level: caseRiskLevel,
      approach: cfgApproach,
      tutor_enabled: cfgTutorEnabled,
    };

    (next as any).age_group = cfgAgeGroup;
    (next as any).approach = cfgApproach;
    (next as any).tutor_enabled = cfgTutorEnabled;
    (next as any).dsm_tag = safeStr((next as any).dsm_tag, safeStr((next as any)?.meta?.dsm_tag, selectedCard?.dx_tag ?? "MED"));
    (next as any).dx_id = safeStr((next as any).dx_id, safeStr((next as any)?.meta?.dx_id, selectedCard?.dx_id ?? selectedCategory));

    return next;
  }

  function saveConfig() {
    if (!caseObj) return;
    const updated = applyConfigToCaseObj(caseObj);
    setCaseObj(updated);
    try {
      localStorage.setItem("activeCase", JSON.stringify(updated));
      localStorage.setItem("tutorEnabled", cfgTutorEnabled ? "true" : "false");
    } catch {
      // ignore
    }
    setShowConfig(false);
  }

  function goStart() {
    if (!caseObj) return;
    const updated = applyConfigToCaseObj(caseObj);
    try {
      localStorage.setItem("activeCase", JSON.stringify(updated));
      localStorage.setItem("tutorEnabled", cfgTutorEnabled ? "true" : "false");
      localStorage.setItem("activeTranscript", JSON.stringify([]));
      localStorage.setItem("sessionEnded", "false");
      localStorage.removeItem("sessionEndedInfo");
    } catch {
      // ignore
    }
    window.location.href = "/simulator";
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="relative mx-auto w-full max-w-6xl">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Biblioteca de patologías médicas</h1>
                <p className="mt-1 text-sm text-white/70">
                  Casos clínicos de medicina y enfermería para entrenamiento de entrevista y priorización.
                </p>
                <div className="mt-2 text-xs text-white/55">
                  Banco base: {MEDICAL_CASE_CATALOG.length} patologías (adulto, pediatría, embarazo y adulto mayor).
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/cases"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  Trastornos mentales
                </Link>
                <Link
                  href="/medical-pathologies"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  Referencia médica
                </Link>
              </div>
            </header>

            <section className="mt-5 grid grid-cols-1 gap-2 md:grid-cols-4">
              {[
                { id: 1, label: "Selecciona patología", done: true },
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
                  <h2 className="text-lg font-semibold">Elige la patología médica</h2>
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar patología..."
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm outline-none focus:border-white/20 sm:w-[320px]"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Todos"],
                    ["adult", "Adulto"],
                    ["pediatric", "Pediatría"],
                    ["pregnancy", "Embarazo"],
                    ["older_adult", "Adulto mayor"],
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
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedCard(item);
                        setSelectedCategory(item.id);
                        setCfgAgeGroup(item.age_group);
                      }}
                      className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-cyan-400/35 bg-cyan-500/10 ring-2 ring-cyan-400/25"
                          : "border-white/10 bg-black/25 hover:bg-black/35"
                      }`}
                    >
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent}`} />
                      <div className="relative">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-base font-semibold">{item.title}</div>
                          <span className="rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-[10px] text-white/70">
                            {item.tag}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-white/70">{item.desc}</div>
                        <div className="mt-3 text-[11px] text-white/55">
                          Área: {item.area} · Urgencia: {item.urgency}
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
                  Área: {selectedCard?.area ?? "—"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/75">
                  Urgencia: {selectedCard?.urgency ?? "—"}
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
                  disabled={loading}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 disabled:opacity-60"
                >
                  {loading ? "Generando caso..." : "Generar caso (IA)"}
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
                  Selecciona una patología y genera un caso IA para iniciar.
                </p>
              </section>
            )}

            {caseObj && essentials && (
              <section className="mt-5 rounded-2xl border border-white/10 bg-[#0C111D]/85 p-5">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-wider text-white/55">Resumen clínico</div>
                    <div className="mt-2 text-xl font-semibold">{essentials.title}</div>
                    <div className="mt-2 text-sm text-white/75">
                      {essentials.summary || "Caso médico generado. Ajusta parámetros y comienza entrevista."}
                    </div>
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-xs text-white/55">Motivo de consulta</div>
                      <div className="mt-1 text-sm text-white/85">{cfgChiefComplaint || essentials.chiefComplaint || "—"}</div>
                      <div className="mt-3 text-xs text-white/55">Contexto breve</div>
                      <div className="mt-1 text-sm text-white/75">{cfgContext || essentials.summary || "—"}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-wider text-white/55">Riesgo educativo</div>
                      <span className={`mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs ${riskBadgeClass}`}>
                        Nivel {caseRiskLevel}
                      </span>
                      <p className="mt-2 text-xs text-white/70">
                        Resultado orientativo para priorizar seguridad clínica en el entrenamiento.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-wider text-white/55">Datos del caso</div>
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
                      </div>
                      <div className="mt-3 text-xs text-white/60">
                        Código clínico: {safeStr((caseObj as any)?.meta?.dsm_tag, selectedCard?.dx_tag ?? "MED")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/55">Objetivo docente</div>
                  <div className="mt-2 text-sm text-white/85">{cfgLearningObjective || essentials.learningObjective || "—"}</div>
                  {isPediatricCase && (
                    <div className="mt-3 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-3 text-xs text-cyan-100">
                      Caso pediátrico: sugiere incluir cuidador y explorar impacto escolar/familiar.
                    </div>
                  )}
                </div>
              </section>
            )}

            {showConfig && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/70" onClick={() => setShowConfig(false)} />
                <div className="relative h-full w-full overflow-y-auto px-2 py-3 sm:px-4 sm:py-4">
                  <div
                    className="relative mx-auto mb-6 flex max-h-[calc(100dvh-20px)] w-full max-w-[980px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A1020]/95 shadow-2xl backdrop-blur-xl sm:max-h-[calc(100dvh-32px)]"
                    style={{ marginTop: configModalTopOffset }}
                  >
                    <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-white/60">Configurar caso médico</div>
                          <h3 className="mt-1 text-lg font-semibold">Ajusta el escenario antes de iniciar</h3>
                        </div>
                        <button
                          onClick={() => setShowConfig(false)}
                          className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
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
                                min={1}
                                max={95}
                                onChange={(e) => setCfgAge(clampInt(Number(e.target.value), 1, 95))}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-white/60">Grupo etario</label>
                              <select
                                value={cfgAgeGroup}
                                onChange={(e) => setCfgAgeGroup(e.target.value as AgeGroup)}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                <option value="adult">Adulto</option>
                                <option value="adolescent">Adolescente</option>
                                <option value="child">Niñez</option>
                                <option value="mixed">Mixto</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-white/60">Duración</label>
                              <select
                                value={cfgTargetMinutes}
                                onChange={(e) => setCfgTargetMinutes(clampInt(Number(e.target.value), 5, 40))}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                {[10, 15, 20, 25, 30, 35, 40].map((m) => (
                                  <option key={m} value={m}>
                                    {m} min
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <label className="mt-3 block text-xs text-white/60">Contexto clínico breve</label>
                          <textarea
                            value={cfgContext}
                            onChange={(e) => setCfgContext(e.target.value)}
                            className="mt-1 min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                          />
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-white/60">Dificultad</label>
                              <select
                                value={cfgDifficulty}
                                onChange={(e) => setCfgDifficulty(e.target.value as DifficultyValue)}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                <option value="beginner">Básico</option>
                                <option value="intermediate">Intermedio</option>
                                <option value="advanced">Avanzado</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-white/60">Enfoque</label>
                              <select
                                value={cfgApproach}
                                onChange={(e) => setCfgApproach(e.target.value as ApproachValue)}
                                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                              >
                                <option value="systemic">Sistémico</option>
                                <option value="cbt">TCC</option>
                                <option value="humanistic">Humanístico</option>
                                <option value="psychodynamic">Psicodinámico</option>
                              </select>
                            </div>
                          </div>

                          <label className="mt-3 block text-xs text-white/60">Motivo de consulta</label>
                          <input
                            value={cfgChiefComplaint}
                            onChange={(e) => setCfgChiefComplaint(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                          />

                          <label className="mt-3 block text-xs text-white/60">Objetivo docente</label>
                          <textarea
                            value={cfgLearningObjective}
                            onChange={(e) => setCfgLearningObjective(e.target.value)}
                            className="mt-1 min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                          />

                          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                            <div>
                              <div className="text-sm font-medium">Tutor IA</div>
                              <div className="text-xs text-white/60">Sugerencias durante la entrevista</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCfgTutorEnabled((v) => !v)}
                              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                                cfgTutorEnabled ? "border-white/20 bg-white/85" : "border-white/15 bg-black/40"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-black transition ${
                                  cfgTutorEnabled ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-black/25 px-4 py-3 sm:px-6 sm:py-4">
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
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

