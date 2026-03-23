"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import Sidebar from "@/components/Sidebar";
import {
  MEDICAL_TERMINOLOGY_CATEGORIES,
  MEDICAL_TERMINOLOGY_LIBRARY,
  type MedicalTerminologyCategory,
} from "@/src/lib/medicalTerminologyLibrary";

type CategoryFilter = MedicalTerminologyCategory | "Todas";

function getTermKind(item: (typeof MEDICAL_TERMINOLOGY_LIBRARY)[number]) {
  if (item.term.endsWith("-")) return "prefijo";
  if (item.term.startsWith("-")) return "sufijo";
  return "termino";
}

export default function MedicalTerminologyPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("Todas");
  const [activeId, setActiveId] = useState<string>(MEDICAL_TERMINOLOGY_LIBRARY[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDICAL_TERMINOLOGY_LIBRARY.filter((item) => {
      if (category !== "Todas" && item.category !== category) return false;
      if (!q) return true;

      const haystack = [
        item.term,
        item.short,
        item.category,
        item.definition,
        item.clinicalUse,
        item.example,
        ...item.related,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [category, query]);

  const active = useMemo(() => {
    return filtered.find((item) => item.id === activeId) ?? filtered[0] ?? MEDICAL_TERMINOLOGY_LIBRARY[0];
  }, [activeId, filtered]);

  const stats = useMemo(
    () => ({
      total: MEDICAL_TERMINOLOGY_LIBRARY.length,
      pharmacology: MEDICAL_TERMINOLOGY_LIBRARY.filter((item) => item.category === "Farmacología").length,
      pathologies: MEDICAL_TERMINOLOGY_LIBRARY.filter((item) => item.category === "Patologías").length,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4faf8_0%,#edf4f1_48%,#e4efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Terminología médica</h1>
              <p className="mt-1 text-sm text-slate-600">
                Glosario rápido para reforzar lenguaje clínico, farmacología básica y conceptos de patologías.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-700">
                  Términos: {stats.total}
                </span>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-emerald-700">
                  Farmacología: {stats.pharmacology}
                </span>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                  Patologías: {stats.pathologies}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/medications"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Ver fármacos
              </Link>
              <Link
                href="/medical-pathologies"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Ver patologías
              </Link>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Qué encontrarás</div>
              <div className="mt-2 text-sm text-slate-700">
                Definiciones cortas, utilidad clínica y ejemplos para que el término no se quede solo en memoria teórica.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Cómo usarlo</div>
              <div className="mt-2 text-sm text-slate-700">
                Busca por término, categoría o concepto relacionado cuando necesites repasar antes de un caso, un simulacro o una práctica.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Conexión con la app</div>
              <div className="mt-2 text-sm text-slate-700">
                Este módulo sirve como puente rápido hacia medicamentos y biblioteca de patologías para ampliar el contexto.
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white/82 p-5">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700">
                Biblioteca de definiciones
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Consulta rápida del glosario</h2>
              <p className="mt-2 text-sm text-slate-600">
                Este módulo queda como biblioteca de consulta. Usa el buscador, los filtros y el panel de detalle para revisar definiciones, uso clínico, ejemplos y conceptos relacionados.
              </p>
            </div>
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar término, concepto o uso clínico..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-300/40"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("Todas")}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    category === "Todas"
                      ? "border-white/30 bg-white/10 text-slate-900"
                      : "border-slate-200 bg-white/78 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Todas
                </button>
                {MEDICAL_TERMINOLOGY_CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      category === item
                        ? "border-white/30 bg-white/10 text-slate-900"
                        : "border-slate-200 bg-white/78 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                {filtered.map((item) => {
                  const selected = active?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-cyan-300/35 bg-cyan-300/10"
                          : "border-slate-200 bg-white hover:bg-white"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{item.term}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.category}</div>
                      <div className="mt-2 text-sm text-slate-600">{item.short}</div>
                    </button>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                    No hay términos para este filtro.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
              {!active ? (
                <div className="text-sm text-slate-500">Selecciona un término para ver el detalle.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700">
                      {active.category}
                    </div>
                    <div className="ml-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                      {getTermKind(active) === "prefijo"
                        ? "Prefijo médico"
                        : getTermKind(active) === "sufijo"
                        ? "Sufijo médico"
                        : "Término clínico"}
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">{active.term}</h2>
                    <p className="mt-2 text-sm text-slate-600">{active.definition}</p>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">Uso clínico</div>
                      <div className="mt-2 text-sm text-slate-800">{active.clinicalUse}</div>
                    </div>

                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                      <div className="text-xs uppercase tracking-wider text-emerald-700/80">Ejemplo rápido</div>
                      <div className="mt-2 text-sm text-emerald-700">{active.example}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-400">Conceptos relacionados</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {active.related.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Link
                      href="/medications"
                      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-900">Ir a fármacos</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Practica seguridad farmacológica, vías, dosis y grupos terapéuticos.
                      </div>
                    </Link>

                    <Link
                      href="/medical-pathologies"
                      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-900">Ir a patologías</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Revisa pistas clínicas, red flags y prioridades de cuidados por enfermedad.
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
