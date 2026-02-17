// Restored public landing page (welcome)
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../src/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Si ya hay sesión, manda directo a /cases (home es público)
  useEffect(() => {
    let alive = true;
    const sb = getSupabaseClient();
    if (!sb) {
      setChecking(false);
      return;
    }

    (async () => {
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      if (data.session) {
        router.replace("/cases");
        return;
      }
      setChecking(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  // Mientras revisa sesión, evita parpadeo
  if (checking) {
    return <main className="min-h-[calc(100vh-72px)]" />;
  }

  return (
    <main className="min-h-[calc(100vh-72px)] px-6 pb-10 pt-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.35)]">
          <h1 className="text-3xl font-semibold text-white">
            Simulador de entrevista clínica (salud mental)
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Entrena tu entrevista y razonamiento clínico con casos simulados:
            preguntas abiertas, escucha activa, exploración de riesgo (modo
            educativo) y cierre con plan. Aquí se practica; no se reemplaza a un
            profesional.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium text-white">Qué vas a encontrar</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/60">
                <li>Biblioteca de casos (ansiedad, depresión, pánico, etc.).</li>
                <li>Chat con “paciente” simulado (IA).</li>
                <li>Feedback educativo con guías y señales a explorar.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium text-white">Cómo se usa (rápido)</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-white/60">
                <li>Inicia sesión o crea tu cuenta.</li>
                <li>Elige un tema y genera un caso.</li>
                <li>Conduce la entrevista y cierra con plan.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-medium text-white">Reglas del juego</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/60">
                <li>Usa datos ficticios (evita nombres reales).</li>
                <li>
                  Si aparece autolesión/suicidio: modo educativo + derivación.
                </li>
                <li>Esto es práctica: no diagnostica.</li>
              </ul>
            </div>
          </div>

          {/* No repetimos botones si el layout ya los muestra; dejamos accesos discretos */}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-white px-5 py-2 text-sm font-medium text-black"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white/85 hover:bg-white/10"
            >
              Crear cuenta
            </Link>
          </div>

          <div className="mt-4 text-xs text-white/35">
            Nota: los casos son ficticios. Si aparece contenido sensible, el sistema
            responde en modo educativo.
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/35">
          Hecho para práctica educativa • Versión MVP
        </div>
      </div>
    </main>
  );
}