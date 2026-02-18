"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { deleteSession, getHistory, type SessionRecord } from "../../lib/history";

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const avgRapport =
      total === 0
        ? 0
        : Math.round(
            items.reduce((acc, s) => acc + (Number(s.lastMeta?.rapport ?? 0) || 0), 0) / total
          );
    return { total, avgRapport };
  }, [items]);

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />
        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Historial de casos</h1>
              <p className="mt-1 text-sm text-white/70">
                Cada sesión es un capítulo: unas terminan en “timeout”, otras en “aprendí algo”.
              </p>
            </div>
            <Link href="/cases" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
              Volver a Biblioteca
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">Sesiones</div>
              <div className="mt-1 text-lg font-semibold">{stats.total}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">Rapport promedio</div>
              <div className="mt-1 text-lg font-semibold">{stats.avgRapport} / 100</div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                Aún no hay historial. Ve a la biblioteca, inicia un caso, y deja tu primera huella.
              </div>
            ) : (
              items.map((s) => (
                <div key={s.sessionId} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-white/60">Caso</div>
                      <div className="mt-1 text-base font-semibold text-white truncate">
                        {s.caseTitle}
                      </div>
                      <div className="mt-1 text-sm text-white/70">
                        Paciente: <span className="text-white">{s.patientName}</span>
                        {" • "}
                        Fin: <span className="text-white">{s.endReason}</span>
                      </div>
                      <div className="mt-1 text-xs text-white/55">
                        Inicio: {fmt(s.startedAt)} • Fin: {fmt(s.endedAt)} • Duración: {Math.round(s.durationSec/60)} min
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/70">
                          Estado: {s.lastMeta?.state ?? "—"}
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/70">
                          Intensidad: {Math.round(Number(s.lastMeta?.intensity ?? 0))} / 100
                        </span>
                        <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/70">
                          Rapport: {Math.round(Number(s.lastMeta?.rapport ?? 0))} / 100
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => {
                          // Para "revisar": guarda esta sesión como "activeTranscript" y abre results
                          try {
                            localStorage.setItem("activeTranscript", JSON.stringify(s.transcript ?? []));
                            localStorage.setItem("activeCase", JSON.stringify({ id: s.caseId, meta: { title: s.caseTitle }, patient_profile: { display_name: s.patientName } }));
                          } catch {}
                          window.location.href = "/results";
                        }}
                        className="rounded-xl bg-white text-black px-4 py-2 text-sm"
                      >
                        Ver resultados
                      </button>

                      <button
                        onClick={() => {
                          // Para "repetir": vuelve a cargar el caso como activo y abre simulador
                          // (Ideal: aquí deberíamos guardar el caseObject real. Si ya lo tienes en biblioteca, lo recuperas por id.)
                          try {
                            localStorage.setItem("activeCase", JSON.stringify({ id: s.caseId }));
                          } catch {}
                          window.location.href = "/cases";
                        }}
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
                      >
                        Repetir caso
                      </button>

                      <button
                        onClick={() => {
                          deleteSession(s.sessionId);
                          setItems(getHistory());
                        }}
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5 text-white/80"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}