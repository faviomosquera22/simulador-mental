"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import {
  DX_LIBRARY,
  type ClinicalDx,
  type DxAgeBand,
  type DxDifficulty,
  type DxUrgency,
} from "../../src/lib/clinicalLibrary";
import {
  MEDICAL_PATHOLOGY_LIBRARY,
  type MedicalPathology,
} from "../../src/lib/medicalPathologyLibrary";

type DetailTab =
  | "Resumen"
  | "DSM-5"
  | "Evaluación"
  | "Diferenciales"
  | "Red flags"
  | "Preguntas"
  | "Plan inicial";

function getSelectionFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const dx = params.get("dx");
  const med = params.get("med");
  if (dx) return `mental:${dx}`;
  if (med) return `medical:${med}`;
  return null;
}

function setSelectionInUrl(item: UnifiedLibraryItem) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("dx");
  url.searchParams.delete("med");
  if (item.kind === "mental") {
    url.searchParams.set("dx", item.id);
  } else {
    url.searchParams.set("med", item.id);
  }
  window.history.replaceState({}, "", url.toString());
}

function urgencyBadge(urgency: DxUrgency) {
  if (urgency === "alto") return "border-red-400/25 bg-red-400/10 text-red-100";
  if (urgency === "medio") return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
}

function difficultyBadge(level: DxDifficulty) {
  if (level === "avanzado") return "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-100";
  if (level === "intermedio") return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  return "border-slate-300/20 bg-slate-300/10 text-slate-100";
}

function listPreview(values: string[], count: number) {
  return values.slice(0, count).join(" · ");
}

function ageBandLabel(value: DxAgeBand) {
  if (value === "niñez") return "Niñez";
  if (value === "adolescencia") return "Adolescencia";
  if (value === "adulto_mayor") return "Adulto mayor";
  return "Adulto";
}

function ageBandSummary(values: DxAgeBand[]) {
  return values.map(ageBandLabel).join(" · ");
}

type LibraryType = "todas" | "trastornos" | "patologias";
type UnifiedLibraryItem = {
  key: string;
  kind: "mental" | "medical";
  id: string;
  name: string;
  groupLabel: string;
  keywords: string[];
  urgency: DxUrgency;
  difficulty: DxDifficulty;
  ageBands: DxAgeBand[];
  frequentEmergency: boolean;
  definition: string;
  typical: string;
  comorbidities: string[];
  scales: string[];
  codeSystem?: string;
  code?: string;
  source: ClinicalDx | MedicalPathology;
};

function mapMedicalUrgencyToDx(urgency: MedicalPathology["urgency"]): DxUrgency {
  if (urgency === "alta") return "alto";
  if (urgency === "media") return "medio";
  return "bajo";
}

function deriveMedicalAgeBands(pathology: MedicalPathology): DxAgeBand[] {
  if (pathology.area === "Pediatría") return ["niñez", "adolescencia"];
  if (pathology.area === "Gineco-obstétrico") return ["adulto"];
  return ["adulto", "adulto_mayor"];
}

export default function TopicsPage() {
  const [query, setQuery] = useState("");
  const [libraryType, setLibraryType] = useState<LibraryType>("todas");
  const [sortBy, setSortBy] = useState<"relevancia" | "riesgo" | "alfabetico">(
    "relevancia"
  );
  const [activeKey, setActiveKey] = useState<string>("mental:mdd");
  const [tab, setTab] = useState<DetailTab>("Resumen");
  const [compareId, setCompareId] = useState<string>("");

  const unifiedLibrary = useMemo<UnifiedLibraryItem[]>(() => {
    const mentalItems: UnifiedLibraryItem[] = DX_LIBRARY.map((dx) => ({
      key: `mental:${dx.id}`,
      kind: "mental",
      id: dx.id,
      name: dx.name,
      groupLabel: dx.category,
      keywords: dx.keywords,
      urgency: dx.meta.urgency,
      difficulty: dx.meta.difficulty,
      ageBands: dx.meta.ageBands,
      frequentEmergency: dx.meta.frequentEmergency,
      definition: dx.quick.definition,
      typical: dx.quick.typical,
      comorbidities: dx.meta.comorbidities,
      scales: dx.meta.recommendedScales,
      codeSystem: "DSM-5",
      code: dx.id.toUpperCase(),
      source: dx,
    }));

    const medicalItems: UnifiedLibraryItem[] = MEDICAL_PATHOLOGY_LIBRARY.map((item) => ({
      key: `medical:${item.id}`,
      kind: "medical",
      id: item.id,
      name: item.name,
      groupLabel: item.area,
      keywords: [item.name, item.area, ...item.clinical_clues, ...item.red_flags],
      urgency: mapMedicalUrgencyToDx(item.urgency),
      difficulty:
        item.urgency === "alta"
          ? "avanzado"
          : item.urgency === "media"
          ? "intermedio"
          : "básico",
      ageBands: deriveMedicalAgeBands(item),
      frequentEmergency: item.urgency === "alta" || item.area === "Urgencias y críticos",
      definition: item.summary,
      typical: item.clinical_clues.join(", "),
      comorbidities: item.red_flags,
      scales: item.diagnostic_support,
      codeSystem: item.codeSystem,
      code: item.code,
      source: item,
    }));

    return [...mentalItems, ...medicalItems];
  }, []);

  useEffect(() => {
    const selected = getSelectionFromUrl();
    if (!selected) return;
    if (unifiedLibrary.some((item) => item.key === selected)) {
      setActiveKey(selected);
    }
  }, [unifiedLibrary]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = unifiedLibrary.filter((item) => {
      if (libraryType === "trastornos" && item.kind !== "mental") return false;
      if (libraryType === "patologias" && item.kind !== "medical") return false;

      if (!q) return true;
      const haystack = [
        item.name,
        item.groupLabel,
        item.definition,
        item.typical,
        ...item.keywords,
        ...item.comorbidities,
        ...item.scales,
        item.codeSystem ?? "",
        item.code ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });

    const urgencyWeight: Record<DxUrgency, number> = { alto: 3, medio: 2, bajo: 1 };

    if (sortBy === "alfabetico") {
      return [...base].sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    if (sortBy === "riesgo") {
      return [...base].sort(
        (a, b) =>
          urgencyWeight[b.urgency] - urgencyWeight[a.urgency] ||
          a.name.localeCompare(b.name, "es")
      );
    }
    if (!q) return base;

    const score = (item: UnifiedLibraryItem) => {
      let points = 0;
      if (item.name.toLowerCase().includes(q)) points += 3;
      if (item.groupLabel.toLowerCase().includes(q)) points += 2;
      points += item.keywords.filter((k) => k.toLowerCase().includes(q)).length;
      return points;
    };

    return [...base].sort((a, b) => score(b) - score(a));
  }, [
    query,
    unifiedLibrary,
    libraryType,
    sortBy,
  ]);

  const active = useMemo(
    () => unifiedLibrary.find((item) => item.key === activeKey) ?? filtered[0] ?? unifiedLibrary[0] ?? null,
    [activeKey, filtered, unifiedLibrary]
  );

  const activeMental = useMemo(
    () => (active?.kind === "mental" ? (active.source as ClinicalDx) : null),
    [active]
  );
  const activeMedical = useMemo(
    () => (active?.kind === "medical" ? (active.source as MedicalPathology) : null),
    [active]
  );

  const compareTarget = useMemo(() => {
    if (!compareId || !activeMental) return null;
    return DX_LIBRARY.find((d) => d.id === compareId) ?? null;
  }, [compareId, activeMental]);

  const compareOptions = useMemo(() => {
    if (!activeMental) return [];
    return filtered
      .filter((item) => item.kind === "mental" && item.id !== activeMental.id)
      .map((item) => item.source as ClinicalDx);
  }, [filtered, activeMental]);

  useEffect(() => {
    if (!active) return;
    setSelectionInUrl(active);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const inFiltered = filtered.some((item) => item.key === active.key);
    if (!inFiltered && filtered[0]) setActiveKey(filtered[0].key);
  }, [filtered, active]);

  useEffect(() => {
    if (!activeMental && compareId) setCompareId("");
    if (!compareTarget && compareId) setCompareId("");
  }, [activeMental, compareTarget, compareId]);

  const stats = useMemo(() => {
    const highRisk = unifiedLibrary.filter((item) => item.urgency === "alto").length;
    const emergency = unifiedLibrary.filter((item) => item.frequentEmergency).length;
    const pediatric = unifiedLibrary.filter(
      (item) =>
        item.ageBands.includes("niñez") || item.ageBands.includes("adolescencia")
    ).length;
    return {
      total: unifiedLibrary.length,
      mental: DX_LIBRARY.length,
      medical: MEDICAL_PATHOLOGY_LIBRARY.length,
      highRisk,
      emergency,
      pediatric,
    };
  }, [unifiedLibrary]);

  const activeQuickFocus = useMemo(() => {
    if (activeMental) return activeMental.evaluation.firstQuestions[0] ?? activeMental.meta.severityHint;
    if (activeMedical) return activeMedical.nursing_priorities[0] ?? activeMedical.clinical_clues[0] ?? activeMedical.summary;
    return "Selecciona una referencia clínica para ver el foco inicial.";
  }, [activeMedical, activeMental]);

  const activeAlertSummary = useMemo(() => {
    if (activeMental) return activeMental.redFlags[0] ?? "Valorar seguridad, funcionalidad y necesidad de escalamiento.";
    if (activeMedical) return activeMedical.red_flags[0] ?? "Revisar signos de alarma y prioridades de estabilización.";
    return "Sin alerta prioritaria.";
  }, [activeMedical, activeMental]);

  const activeToolSummary = useMemo(() => {
    if (activeMental) return listPreview(activeMental.meta.recommendedScales, 3) || "Escalas clínicas y entrevista estructurada.";
    if (activeMedical) return listPreview(activeMedical.diagnostic_support, 3) || "Laboratorio, imágenes y evaluación dirigida.";
    return "Herramientas clínicas sugeridas.";
  }, [activeMedical, activeMental]);

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-[30px] border border-white/10 bg-black/20 p-4 backdrop-blur-xl sm:p-6">
          <header className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(248,113,113,0.10),transparent_24%),rgba(255,255,255,0.03)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">
                  Biblioteca de entrenamiento clínico
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Biblioteca clínica
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                  Explora trastornos mentales y patologías médicas con una vista más útil para escaneo rápido, priorización clínica y práctica guiada.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Cobertura</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{stats.total}</div>
                    <div className="mt-1 text-xs text-white/65">referencias totales activas</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Alta prioridad</div>
                    <div className="mt-2 text-3xl font-semibold text-cyan-100">{stats.highRisk}</div>
                    <div className="mt-1 text-xs text-cyan-50/80">riesgo o urgencia alta</div>
                  </div>
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-amber-100/75">Uso frecuente</div>
                    <div className="mt-2 text-3xl font-semibold text-amber-100">{stats.emergency}</div>
                    <div className="mt-1 text-xs text-amber-50/80">frecuentes en urgencias</div>
                  </div>
                </div>
              </div>

              <div className="min-w-[260px] space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Accesos rápidos</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/cases"
                      className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5"
                    >
                      Biblioteca de casos
                    </Link>
                    <Link
                      href="/caces"
                      className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5"
                    >
                      Practicar CACES
                    </Link>
                    <Link
                      href="/history"
                      className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5"
                    >
                      Historial
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs text-sky-100">
                    Trastornos: {stats.mental}
                  </span>
                  <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                    Patologías: {stats.medical}
                  </span>
                  <span className="rounded-full border border-indigo-400/25 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-100">
                    Niñez/adolescencia: {stats.pediatric}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
            <section className="rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Explorador</div>
                <div className="mt-2 text-lg font-semibold text-white">Encuentra una referencia en segundos</div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca: depresión, ansiedad, sepsis, preeclampsia..."
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setLibraryType("todas")}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      libraryType === "todas"
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setLibraryType("trastornos")}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      libraryType === "trastornos"
                        ? "border-sky-400/30 bg-sky-400/10 text-sky-100"
                        : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    Trastornos mentales
                  </button>
                  <button
                    onClick={() => setLibraryType("patologias")}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      libraryType === "patologias"
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                        : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    Patologías médicas
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-white/70">
                    Resultados filtrados: <span className="font-semibold text-white">{filtered.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as "relevancia" | "riesgo" | "alfabetico"
                        )
                      }
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 outline-none"
                    >
                      <option value="relevancia">Orden: relevancia</option>
                      <option value="riesgo">Orden: riesgo clínico</option>
                      <option value="alfabetico">Orden: alfabético</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setLibraryType("todas");
                        setSortBy("relevancia");
                      }}
                      className="rounded-xl border border-white/10 px-3 py-2 text-white/75 hover:bg-white/5"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 max-h-[640px] space-y-3 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    No hay resultados para este filtro. Prueba cambiando tipo de contenido o búsqueda.
                  </div>
                ) : (
                  filtered.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        setActiveKey(d.key);
                        setTab("Resumen");
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active?.key === d.key
                          ? "border-white/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))] shadow-[0_18px_45px_rgba(0,0,0,0.22)]"
                          : "border-white/10 bg-black/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-white/45">{d.groupLabel}</span>
                        {!!d.code && (
                          <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-white/55">
                            {d.codeSystem}: {d.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${
                            d.kind === "mental"
                              ? "border-sky-400/25 bg-sky-400/10 text-sky-100"
                              : "border-cyan-400/25 bg-cyan-400/10 text-cyan-100"
                          }`}
                        >
                          {d.kind === "mental"
                            ? "Trastorno mental"
                            : "Patología médica"}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${urgencyBadge(
                            d.urgency
                          )}`}
                        >
                          {d.kind === "mental" ? "Riesgo" : "Urgencia"} {d.urgency}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${difficultyBadge(
                            d.difficulty
                          )}`}
                        >
                          {d.difficulty}
                        </span>
                      </div>
                      <div className="mt-3 text-base font-semibold leading-snug text-white">{d.name}</div>
                      <div className="mt-2 line-clamp-2 text-sm text-white/68">
                        {d.definition}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                        <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1">
                          {ageBandSummary(d.ageBands)}
                        </span>
                        {d.frequentEmergency && (
                          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-100">
                            Frecuente en urgencias
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              {!active ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                  Selecciona una referencia clínica a la izquierda.
                </div>
              ) : (
                <>
                  <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_24%),rgba(255,255,255,0.03)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-3xl">
                        <div className="text-xs uppercase tracking-[0.18em] text-white/45">{active.groupLabel}</div>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{active.name}</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${urgencyBadge(
                              active.urgency
                            )}`}
                          >
                            {active.kind === "mental" ? "Riesgo" : "Urgencia"} {active.urgency}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${difficultyBadge(
                              active.difficulty
                            )}`}
                          >
                            Complejidad {active.difficulty}
                          </span>
                          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/75">
                            {ageBandSummary(active.ageBands)}
                          </span>
                          {!!active.code && (
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                              {active.codeSystem}: {active.code}
                            </span>
                          )}
                        </div>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72">
                          {active.definition}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={active.kind === "mental" ? "/cases" : "/medical-cases"}
                          className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                        >
                          Practicar caso
                        </Link>
                        <Link
                          href="/simulator"
                          className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                        >
                          Abrir simulador
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(window.location.href);
                            } catch {}
                          }}
                          className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                        >
                          Copiar link
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Ficha rápida</div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {active.kind === "mental"
                            ? activeMental?.meta.severityHint
                            : activeMedical?.summary}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-red-100/80">Qué no perder</div>
                        <div className="mt-2 text-sm font-medium text-red-50">{activeAlertSummary}</div>
                      </div>
                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">Primer foco</div>
                        <div className="mt-2 text-sm font-medium text-cyan-50">{activeQuickFocus}</div>
                      </div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">Herramientas</div>
                        <div className="mt-2 text-sm font-medium text-emerald-50">{activeToolSummary}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-white/60">{active.groupLabel}</div>
                      <div className="mt-1 text-sm text-white/55">
                        Módulo de consulta y entrenamiento clínico activo.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${urgencyBadge(
                            active.urgency
                          )}`}
                        >
                          {active.kind === "mental" ? "Riesgo" : "Urgencia"} {active.urgency}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${difficultyBadge(
                            active.difficulty
                          )}`}
                        >
                          Complejidad {active.difficulty}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/75">
                          {active.ageBands.join(" · ")}
                        </span>
                        {!!active.code && (
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                            {active.codeSystem}: {active.code}
                          </span>
                        )}
                      </div>
                  </div>

                  {activeMental && (
                    <>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(
                          [
                            "Resumen",
                            "DSM-5",
                            "Evaluación",
                            "Diferenciales",
                            "Red flags",
                            "Preguntas",
                            "Plan inicial",
                          ] as const
                        ).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`rounded-full border px-3 py-1 text-xs ${
                              tab === t
                                ? "border-white/30 bg-white/10 text-white"
                                : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                        {tab === "Resumen" && (
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-white/60">Definición</div>
                              <div className="mt-1 text-sm text-white/85">{activeMental.quick.definition}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Presentación típica</div>
                              <div className="mt-1 text-sm text-white/85">{activeMental.quick.typical}</div>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Comorbilidades frecuentes</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {activeMental.meta.comorbidities.map((c) => (
                                  <span
                                    key={c}
                                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/75"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {tab === "DSM-5" && (
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-white/60">Checklist núcleo</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.dsm5.core.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                            {activeMental.dsm5.duration && (
                              <div>
                                <div className="text-xs text-white/60">Duración</div>
                                <div className="mt-1 text-sm text-white/85">{activeMental.dsm5.duration}</div>
                              </div>
                            )}
                            {!!activeMental.dsm5.specifiers?.length && (
                              <div>
                                <div className="text-xs text-white/60">Especificadores frecuentes</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {activeMental.dsm5.specifiers.map((s) => (
                                    <span
                                      key={s}
                                      className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/75"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {tab === "Evaluación" && (
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                              <div className="text-xs text-white/60">Qué preguntar primero</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.evaluation.firstQuestions.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Qué no olvidar</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.evaluation.mustNotMiss.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Qué descartar</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.evaluation.ruleOut.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Cuándo derivar urgente</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.evaluation.urgentReferral.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {tab === "Diferenciales" && (
                          <div>
                            <div className="text-xs text-white/60">Diferenciales clave</div>
                            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                              {activeMental.differentials.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {tab === "Red flags" && (
                          <div>
                            <div className="text-xs text-white/60">Banderas rojas</div>
                            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                              {activeMental.redFlags.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                              Si aparece una red flag, prioriza seguridad y ruta de derivación.
                            </div>
                          </div>
                        )}

                        {tab === "Preguntas" && (
                          <div>
                            <div className="text-xs text-white/60">Preguntas guía de entrevista</div>
                            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                              {activeMental.questions.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {tab === "Plan inicial" && (
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                              <div className="text-xs text-white/60">Objetivos de 24-72h</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.plan.goals24h72h.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs text-white/60">Intervenciones no farmacológicas</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.plan.nonPharmacological.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="lg:col-span-2">
                              <div className="text-xs text-white/60">Marcadores de seguimiento</div>
                              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                                {activeMental.plan.followupMarkers.map((x) => (
                                  <li key={x}>{x}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-white">Comparador clínico</div>
                            <div className="text-xs text-white/60">
                              Compara rápidamente diagnóstico activo vs otro diagnóstico filtrado.
                            </div>
                          </div>
                          <select
                            value={compareId}
                            onChange={(e) => setCompareId(e.target.value)}
                            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/85 outline-none"
                          >
                            <option value="">Selecciona diagnóstico para comparar</option>
                            {compareOptions.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {!compareTarget ? (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/65">
                            Sin comparador seleccionado.
                          </div>
                        ) : (
                          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                              <div className="text-xs text-white/50">Diagnóstico activo</div>
                              <div className="mt-1 text-sm font-semibold text-white">{activeMental.name}</div>
                              <div className="mt-2 text-xs text-white/70">{activeMental.quick.definition}</div>
                              <div className="mt-3 text-xs text-white/55">
                                Duración clave: {activeMental.dsm5.duration ?? "Según criterios nucleares"}
                              </div>
                              <div className="mt-2 text-xs text-white/70">
                                Red flags: {listPreview(activeMental.redFlags, 2)}
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                              <div className="text-xs text-white/50">Comparador</div>
                              <div className="mt-1 text-sm font-semibold text-white">
                                {compareTarget.name}
                              </div>
                              <div className="mt-2 text-xs text-white/70">
                                {compareTarget.quick.definition}
                              </div>
                              <div className="mt-3 text-xs text-white/55">
                                Duración clave:{" "}
                                {compareTarget.dsm5.duration ?? "Según criterios nucleares"}
                              </div>
                              <div className="mt-2 text-xs text-white/70">
                                Red flags: {listPreview(compareTarget.redFlags, 2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeMedical && (
                    <>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/45">
                          Resumen clínico
                        </div>
                        <p className="mt-2 text-sm text-white/80">{activeMedical.summary}</p>

                        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-white/45">
                              Pistas clínicas
                            </div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                              {activeMedical.clinical_clues.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-red-100/85">
                              Signos de alarma
                            </div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-100">
                              {activeMedical.red_flags.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-100/85">
                              Prioridades de cuidado
                            </div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyan-100">
                              {activeMedical.nursing_priorities.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-white/45">
                              Apoyo diagnóstico sugerido
                            </div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                              {activeMedical.diagnostic_support.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-white/45">
                            Preguntas rápidas de triaje
                          </div>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                            <li>¿Cuál es el síntoma principal y su cronología exacta?</li>
                            <li>¿Qué signos de alarma han aparecido en las últimas horas?</li>
                            <li>¿Qué antecedentes y medicación actual pueden agravar el cuadro?</li>
                            <li>¿Qué condición funcional actual limita el autocuidado del paciente?</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
