"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import {
  MEDICAL_AREAS,
  MEDICAL_PATHOLOGY_LIBRARY,
  type MedicalArea,
  type MedicalUrgency,
} from "../../src/lib/medicalPathologyLibrary";

function urgencyBadge(level: MedicalUrgency) {
  if (level === "alta") return "border-red-400/25 bg-red-400/10 text-red-700";
  if (level === "media") return "border-amber-400/25 bg-amber-400/10 text-amber-700";
  return "border-emerald-400/25 bg-emerald-400/10 text-emerald-700";
}

export default function MedicalPathologiesPage() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<MedicalArea | "Todas">("Todas");
  const [urgency, setUrgency] = useState<MedicalUrgency | "todas">("todas");
  const [activeId, setActiveId] = useState<string>(MEDICAL_PATHOLOGY_LIBRARY[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDICAL_PATHOLOGY_LIBRARY.filter((item) => {
      if (area !== "Todas" && item.area !== area) return false;
      if (urgency !== "todas" && item.urgency !== urgency) return false;
      if (!q) return true;
      const text = [
        item.name,
        item.codeSystem,
        item.code,
        item.area,
        item.summary,
        ...item.clinical_clues,
        ...item.red_flags,
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [query, area, urgency]);

  const active = useMemo(() => {
    return filtered.find((item) => item.id === activeId) ?? filtered[0] ?? MEDICAL_PATHOLOGY_LIBRARY[0];
  }, [activeId, filtered]);

  const stats = useMemo(() => {
    return {
      total: MEDICAL_PATHOLOGY_LIBRARY.length,
      high: MEDICAL_PATHOLOGY_LIBRARY.filter((x) => x.urgency === "alta").length,
      medium: MEDICAL_PATHOLOGY_LIBRARY.filter((x) => x.urgency === "media").length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4faf8_0%,#edf4f1_48%,#e4efeb_100%)]">
      <div className="mx-auto flex max-w-[1480px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-6 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Biblioteca de patologías médicas</h1>
              <p className="mt-1 text-sm text-slate-600">
                Referencia rápida para enfermería y medicina. Uso educativo y orientativo.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-700">
                  Total: {stats.total}
                </span>
                <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-red-700">
                  Alta prioridad: {stats.high}
                </span>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-700">
                  Prioridad media: {stats.medium}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/cases"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Simulador de trastornos mentales
              </Link>
              <Link
                href="/caces"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Practicar CACES
              </Link>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar patología..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-300/40"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setArea("Todas")}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    area === "Todas"
                      ? "border-white/30 bg-white/10 text-slate-900"
                      : "border-slate-200 bg-white/78 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Todas
                </button>
                {MEDICAL_AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setArea(a)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      area === a
                        ? "border-white/30 bg-white/10 text-slate-900"
                        : "border-slate-200 bg-white/78 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as MedicalUrgency | "todas")}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="todas">Urgencia: todas</option>
                  <option value="alta">Urgencia alta</option>
                  <option value="media">Urgencia media</option>
                  <option value="baja">Urgencia baja</option>
                </select>
                <button
                  onClick={() => {
                    setQuery("");
                    setArea("Todas");
                    setUrgency("todas");
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                {filtered.map((item) => {
                  const selected = active?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-cyan-300/35 bg-cyan-300/10"
                          : "border-slate-200 bg-white hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${urgencyBadge(item.urgency)}`}>
                          {item.urgency}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{item.area}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                          {item.codeSystem}: {item.code}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                    No hay patologías para este filtro.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
              {!active ? (
                <div className="text-sm text-slate-500">Selecciona una patología para ver detalles.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400">{active.area}</div>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">{active.name}</h2>
                    <div className="mt-2 inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-700">
                      {active.codeSystem}: {active.code}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{active.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">Pistas clínicas</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {active.clinical_clues.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                      <div className="text-xs uppercase tracking-wider text-red-700/80">Red flags</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                        {active.red_flags.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <div className="text-xs uppercase tracking-wider text-cyan-700/80">Prioridades de enfermería</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyan-700">
                        {active.nursing_priorities.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">Apoyo diagnóstico</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {active.diagnostic_support.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                    Contenido orientativo de entrenamiento académico. No sustituye protocolos institucionales ni valoración clínica real.
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
