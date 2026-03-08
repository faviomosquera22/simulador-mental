"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import {
  DX_AGE_BANDS,
  DX_CATEGORIES,
  DX_LIBRARY,
  type DxAgeBand,
  type DxCategory,
  type DxDifficulty,
  type DxUrgency,
} from "../../src/lib/clinicalLibrary";

type DetailTab =
  | "Resumen"
  | "DSM-5"
  | "Evaluación"
  | "Diferenciales"
  | "Red flags"
  | "Preguntas"
  | "Plan inicial";

function getDxFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("dx");
}

function setDxInUrl(dxId: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("dx", dxId);
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

export default function TopicsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DxCategory | "Todas">("Todas");
  const [ageBand, setAgeBand] = useState<DxAgeBand | "todas">("todas");
  const [urgencyFilter, setUrgencyFilter] = useState<DxUrgency | "todas">("todas");
  const [difficultyFilter, setDifficultyFilter] = useState<DxDifficulty | "todas">("todas");
  const [sortBy, setSortBy] = useState<"relevancia" | "riesgo" | "alfabetico">(
    "relevancia"
  );
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [activeId, setActiveId] = useState<string>(DX_LIBRARY[0]?.id ?? "mdd");
  const [tab, setTab] = useState<DetailTab>("Resumen");
  const [compareId, setCompareId] = useState<string>("");

  useEffect(() => {
    const dx = getDxFromUrl();
    if (!dx) return;
    if (DX_LIBRARY.some((d) => d.id === dx)) setActiveId(dx);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = DX_LIBRARY.filter((d) => {
      if (category !== "Todas" && d.category !== category) return false;
      if (ageBand !== "todas" && !d.meta.ageBands.includes(ageBand)) return false;
      if (urgencyFilter !== "todas" && d.meta.urgency !== urgencyFilter) return false;
      if (difficultyFilter !== "todas" && d.meta.difficulty !== difficultyFilter) return false;
      if (emergencyOnly && !d.meta.frequentEmergency) return false;

      if (!q) return true;
      const haystack = [
        d.name,
        d.category,
        d.quick.definition,
        ...d.keywords,
        ...d.meta.comorbidities,
        ...d.meta.recommendedScales,
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
          urgencyWeight[b.meta.urgency] - urgencyWeight[a.meta.urgency] ||
          a.name.localeCompare(b.name, "es")
      );
    }
    if (!q) return base;

    const score = (d: (typeof base)[number]) => {
      let s = 0;
      if (d.name.toLowerCase().includes(q)) s += 3;
      if (d.category.toLowerCase().includes(q)) s += 2;
      s += d.keywords.filter((k) => k.toLowerCase().includes(q)).length;
      return s;
    };

    return [...base].sort((a, b) => score(b) - score(a));
  }, [query, category, ageBand, urgencyFilter, difficultyFilter, emergencyOnly, sortBy]);

  const active = useMemo(() => {
    return DX_LIBRARY.find((d) => d.id === activeId) ?? filtered[0] ?? DX_LIBRARY[0];
  }, [activeId, filtered]);

  const compareTarget = useMemo(() => {
    if (!compareId) return null;
    return DX_LIBRARY.find((d) => d.id === compareId) ?? null;
  }, [compareId]);

  const compareOptions = useMemo(() => {
    if (!active) return filtered;
    return filtered.filter((d) => d.id !== active.id);
  }, [filtered, active]);

  useEffect(() => {
    if (!active?.id) return;
    setDxInUrl(active.id);
  }, [active?.id]);

  useEffect(() => {
    if (!active) return;
    const inFiltered = filtered.some((d) => d.id === active.id);
    if (!inFiltered && filtered[0]) setActiveId(filtered[0].id);
  }, [filtered, active]);

  useEffect(() => {
    if (!compareTarget && compareId) setCompareId("");
  }, [compareTarget, compareId]);

  const stats = useMemo(() => {
    const highRisk = DX_LIBRARY.filter((d) => d.meta.urgency === "alto").length;
    const emergency = DX_LIBRARY.filter((d) => d.meta.frequentEmergency).length;
    const pediatric = DX_LIBRARY.filter(
      (d) =>
        d.meta.ageBands.includes("niñez") || d.meta.ageBands.includes("adolescencia")
    ).length;
    return { highRisk, emergency, pediatric };
  }, []);

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Biblioteca clínica</h1>
              <p className="mt-1 text-sm text-white/70">
                Guía práctica para entrevista clínica, priorización de riesgo y plan inicial.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                  Diagnósticos: {DX_LIBRARY.length}
                </span>
                <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-xs text-red-100">
                  Riesgo alto: {stats.highRisk}
                </span>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                  Frecuentes en urgencias: {stats.emergency}
                </span>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                  Niñez/adolescencia: {stats.pediatric}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
          </header>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="space-y-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca: depresión, psicosis, TDAH, trauma..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategory("Todas")}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      category === "Todas"
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    Todas
                  </button>
                  {DX_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        category === c
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <select
                    value={ageBand}
                    onChange={(e) => setAgeBand(e.target.value as DxAgeBand | "todas")}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/85 outline-none"
                  >
                    <option value="todas">Grupo etario: todos</option>
                    {DX_AGE_BANDS.map((band) => (
                      <option key={band} value={band}>
                        {band}
                      </option>
                    ))}
                  </select>

                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value as DxUrgency | "todas")}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/85 outline-none"
                  >
                    <option value="todas">Urgencia: todas</option>
                    <option value="alto">Urgencia alta</option>
                    <option value="medio">Urgencia media</option>
                    <option value="bajo">Urgencia baja</option>
                  </select>

                  <select
                    value={difficultyFilter}
                    onChange={(e) =>
                      setDifficultyFilter(e.target.value as DxDifficulty | "todas")
                    }
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/85 outline-none"
                  >
                    <option value="todas">Dificultad: todas</option>
                    <option value="básico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>

                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80">
                    <input
                      type="checkbox"
                      checked={emergencyOnly}
                      onChange={(e) => setEmergencyOnly(e.target.checked)}
                    />
                    Frecuentes en urgencias
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
                <span>Resultados: {filtered.length}</span>
                <div className="flex items-center gap-2">
                  <label className="text-white/60">Orden:</label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "relevancia" | "riesgo" | "alfabetico"
                      )
                    }
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white/80 outline-none"
                  >
                    <option value="relevancia">Relevancia</option>
                    <option value="riesgo">Riesgo clínico</option>
                    <option value="alfabetico">Alfabético</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setCategory("Todas");
                      setAgeBand("todas");
                      setUrgencyFilter("todas");
                      setDifficultyFilter("todas");
                      setSortBy("relevancia");
                      setEmergencyOnly(false);
                    }}
                    className="rounded-lg border border-white/10 px-2 py-1 text-white/75 hover:bg-white/5"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    No hay diagnósticos para este filtro. Ajusta categoría, urgencia o grupo
                    etario para ampliar resultados.
                  </div>
                ) : (
                  filtered.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setActiveId(d.id);
                        setTab("Resumen");
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active?.id === d.id
                          ? "border-white/25 bg-white/10"
                          : "border-white/10 bg-black/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-white/60">{d.category}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${urgencyBadge(
                            d.meta.urgency
                          )}`}
                        >
                          Riesgo {d.meta.urgency}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${difficultyBadge(
                            d.meta.difficulty
                          )}`}
                        >
                          {d.meta.difficulty}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">{d.name}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-white/65">
                        {d.quick.definition}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {!active ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                  Selecciona un diagnóstico a la izquierda.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-white/60">{active.category}</div>
                      <h2 className="mt-1 text-xl font-semibold text-white">{active.name}</h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${urgencyBadge(
                            active.meta.urgency
                          )}`}
                        >
                          Riesgo {active.meta.urgency}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${difficultyBadge(
                            active.meta.difficulty
                          )}`}
                        >
                          Complejidad {active.meta.difficulty}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/75">
                          {active.meta.ageBands.join(" · ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/cases"
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

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-white/50">
                        Ficha 30 segundos
                      </div>
                      <div className="mt-1 text-xs text-white/80">{active.meta.severityHint}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-white/50">
                        Comorbilidades frecuentes
                      </div>
                      <div className="mt-1 text-xs text-white/80">
                        {listPreview(active.meta.comorbidities, 3)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-white/50">
                        Escalas sugeridas
                      </div>
                      <div className="mt-1 text-xs text-white/80">
                        {listPreview(active.meta.recommendedScales, 3)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-[11px] uppercase tracking-wider text-white/50">
                        Enfoque inicial
                      </div>
                      <div className="mt-1 text-xs text-white/80">
                        Seguridad, funcionalidad y diferenciales prioritarios.
                      </div>
                    </div>
                  </div>

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
                          <div className="mt-1 text-sm text-white/85">{active.quick.definition}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Presentación típica</div>
                          <div className="mt-1 text-sm text-white/85">{active.quick.typical}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Comorbilidades frecuentes</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {active.meta.comorbidities.map((c) => (
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
                            {active.dsm5.core.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        {active.dsm5.duration && (
                          <div>
                            <div className="text-xs text-white/60">Duración</div>
                            <div className="mt-1 text-sm text-white/85">{active.dsm5.duration}</div>
                          </div>
                        )}
                        {!!active.dsm5.specifiers?.length && (
                          <div>
                            <div className="text-xs text-white/60">Especificadores frecuentes</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {active.dsm5.specifiers.map((s) => (
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
                            {active.evaluation.firstQuestions.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Qué no olvidar</div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                            {active.evaluation.mustNotMiss.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Qué descartar</div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                            {active.evaluation.ruleOut.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Cuándo derivar urgente</div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                            {active.evaluation.urgentReferral.map((x) => (
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
                          {active.differentials.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tab === "Red flags" && (
                      <div>
                        <div className="text-xs text-white/60">Banderas rojas</div>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                          {active.redFlags.map((x) => (
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
                          {active.questions.map((x) => (
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
                            {active.plan.goals24h72h.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Intervenciones no farmacológicas</div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                            {active.plan.nonPharmacological.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="lg:col-span-2">
                          <div className="text-xs text-white/60">Marcadores de seguimiento</div>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-white/85">
                            {active.plan.followupMarkers.map((x) => (
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
                          <div className="mt-1 text-sm font-semibold text-white">{active.name}</div>
                          <div className="mt-2 text-xs text-white/70">{active.quick.definition}</div>
                          <div className="mt-3 text-xs text-white/55">
                            Duración clave: {active.dsm5.duration ?? "Según criterios nucleares"}
                          </div>
                          <div className="mt-2 text-xs text-white/70">
                            Red flags: {listPreview(active.redFlags, 2)}
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
