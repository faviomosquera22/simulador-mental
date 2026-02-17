// Home page is a welcome/landing page with login/register. If already logged in, show an "Ir a casos" CTA but DO NOT auto-redirect.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../src/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function HomePage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let alive = true;
    const sb = getSupabaseClient();
    if (!sb) return;

    (async () => {
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      const ok = Boolean(data.session);
      setIsAuthed(ok);
    })();

    const { data: sub } = sb.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const ok = Boolean(session);
        setIsAuthed(ok);
      }
    );

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  // Mientras comprobamos sesión, mostramos la bienvenida igual (no bloquea).
  return (
    <main className="min-h-[calc(100vh-72px)] px-6 pb-10 pt-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="text-xs uppercase tracking-wide text-white/50">Simulador</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
            Simulador de entrevista clínica (salud mental)
          </h1>
          <p className="mt-3 text-white/70">
            Aquí entrenas entrevista y razonamiento clínico con casos simulados: preguntas abiertas,
            escucha activa, exploración de riesgo (modo educativo) y cierre con plan.
            <span className="text-white/60"> No diagnostica ni reemplaza una evaluación profesional.</span>
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-medium text-white/85">¿Qué vas a encontrar?</div>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                <li>• Biblioteca de temas (ansiedad, depresión, crisis, etc.).</li>
                <li>• Chat interactivo con “paciente” simulado (IA).</li>
                <li>• Panel educativo con guías y señales a explorar.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-medium text-white/85">Cómo se usa (rápido)</div>
              <ol className="mt-3 space-y-2 text-sm text-white/65">
                <li>1) Inicia sesión o crea cuenta.</li>
                <li>2) Elige un tema y genera un caso.</li>
                <li>3) Conduce la entrevista y finaliza para ver feedback.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-medium text-white/85">Reglas del juego</div>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                <li>• Usa datos ficticios (evita nombres reales).</li>
                <li>• Si aparece autolesión/suicidio: modo educativo + derivación.</li>
                <li>• Esto es práctica: no diagnostica.</li>
              </ul>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/10"
            >
              Crear cuenta
            </Link>
            {isAuthed ? (
              <button
                onClick={() => router.push("/cases")}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/10"
              >
                Ir a casos
              </button>
            ) : null}
          </div>

          <div className="mt-4 text-xs text-white/40">
            Nota: los casos son ficticios. Si aparece contenido sensible, el sistema responde en modo educativo.
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/35">
          Hecho para práctica educativa • Versión MVP
        </div>
      </div>
    </main>
  );
}