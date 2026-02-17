"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SimUser = {
  nickname: string;
  role: "estudiante" | "docente";
};

function readUser(): SimUser | null {
  try {
    const raw = localStorage.getItem("sim_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.nickname) return null;
    return {
      nickname: String(parsed.nickname).slice(0, 40),
      role: parsed.role === "docente" ? "docente" : "estudiante",
    };
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [existing, setExisting] = useState<SimUser | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [role, setRole] = useState<SimUser["role"]>("estudiante");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = readUser();
    setExisting(u);
    if (u) {
      setNickname(u.nickname);
      setRole(u.role);
    }
  }, []);

  const canContinue = useMemo(() => nickname.trim().length >= 2, [nickname]);

  const save = () => {
    setError(null);
    const n = nickname.trim();
    if (n.length < 2) {
      setError("Escribe un alias (mínimo 2 caracteres).");
      return;
    }

    // Nota ética: alias, no datos personales reales.
    const payload: SimUser = { nickname: n.slice(0, 40), role };
    try {
      localStorage.setItem("sim_user", JSON.stringify(payload));
      setExisting(payload);
    } catch {
      // ignore
    }

    window.location.href = "/cases";
  };

  const logout = () => {
    try {
      localStorage.removeItem("sim_user");
    } catch {
      // ignore
    }
    setExisting(null);
    setNickname("");
    setRole("estudiante");
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold">Simulador de entrevista clínica (salud mental)</h1>
            <p className="text-white/70">
              Entrena tu entrevista y razonamiento clínico con casos simulados.{" "}
              <span className="text-white">No diagnostica</span> ni reemplaza evaluación profesional.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm text-white/60">Antes de empezar</div>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li>• Usa datos ficticios. No ingreses nombres reales.</li>
                <li>• Si surge autolesión/suicidio: el sistema responde en modo educativo (derivación genérica).</li>
                <li>• Esto es entrenamiento, no un servicio clínico.</li>
              </ul>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                Consejo: trata la entrevista como un viaje: apertura → exploración → cierre. No corras, guía.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm text-white/60">Bienvenida</div>
              <div className="mt-2 text-base font-semibold">Inicia tu sesión</div>
              <p className="mt-1 text-sm text-white/70">Solo pedimos un alias (sin correo, sin contraseña).</p>

              <label className="mt-4 block text-xs text-white/60">Tu alias</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej: Favio (solo alias)"
                className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20"
              />

              <label className="mt-4 block text-xs text-white/60">Rol</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("estudiante")}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    role === "estudiante"
                      ? "border-white/30 bg-white text-black"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => setRole("docente")}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    role === "docente"
                      ? "border-white/30 bg-white text-black"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Docente
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={save}
                  disabled={!canContinue}
                  className="rounded-xl bg-white text-black px-4 py-3 text-sm disabled:opacity-60"
                >
                  Entrar a la biblioteca de casos
                </button>

                {existing ? (
                  <button
                    onClick={logout}
                    className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:bg-white/5"
                  >
                    Cerrar sesión (borrar alias)
                  </button>
                ) : (
                  <Link
                    href="/cases"
                    className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:bg-white/5 text-center"
                    title="Modo invitado (sin alias)"
                  >
                    Continuar como invitado
                  </Link>
                )}
              </div>

              <p className="mt-4 text-xs text-white/60">
                Al continuar aceptas que esto es solo un simulador educativo. No guardamos datos personales reales.
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-white/50">
          Hecho para práctica educativa • Versión MVP
        </footer>
      </div>
    </main>
  );
}