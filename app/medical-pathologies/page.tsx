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
  if (level === "alta") return "border-red-400/25 bg-red-400/10 text-red-100";
  if (level === "media") return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
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

        <main className="flex-1 rounded-2xl border border-[#1b2130]/10 bg-[linear-gradient(180deg,rgba(28,37,46,0.82),rgba(18,25,34,0.84))] p-6 shadow-[0_28px_72px_rgba(84,104,112,0.18)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Biblioteca de patologías médicas</h1>
              <p className="mt-1 text-sm text-white/70">
                Referencia rápida para enfermería y medicina. Uso educativo y orientativo.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                  Total: {stats.total}
                </span>
                <span className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1 text-red-100">
                  Alta prioridad: {stats.high}
                </span>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-100">
                  Prioridad media: {stats.medium}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/cases"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Simulador de trastornos mentales
              </Link>
              <Link
                href="/caces"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Practicar CACES
              </Link>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar patología..."
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setArea("Todas")}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    area === "Todas"
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
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
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
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
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/85 outline-none"
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
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
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
                          : "border-white/10 bg-black/25 hover:bg-black/35"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">{item.name}</div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${urgencyBadge(item.urgency)}`}>
                          {item.urgency}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/65">
                        <span>{item.area}</span>
                        <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] text-white/75">
                          {item.codeSystem}: {item.code}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/60">
                    No hay patologías para este filtro.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {!active ? (
                <div className="text-sm text-white/60">Selecciona una patología para ver detalles.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/45">{active.area}</div>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{active.name}</h2>
                    <div className="mt-2 inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      {active.codeSystem}: {active.code}
                    </div>
                    <p className="mt-2 text-sm text-white/75">{active.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-wider text-white/45">Pistas clínicas</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                        {active.clinical_clues.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                      <div className="text-xs uppercase tracking-wider text-red-100/80">Red flags</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-100">
                        {active.red_flags.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                      <div className="text-xs uppercase tracking-wider text-cyan-100/80">Prioridades de enfermería</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyan-100">
                        {active.nursing_priorities.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs uppercase tracking-wider text-white/45">Apoyo diagnóstico</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                        {active.diagnostic_support.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
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
