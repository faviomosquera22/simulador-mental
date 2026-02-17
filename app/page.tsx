"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-5xl">

        {/* Hero */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Simulador de entrevista clínica (salud mental)
          </h1>
          <p className="mt-3 max-w-3xl text-sm md:text-base text-white/75">
            Entrena tu entrevista y razonamiento clínico con casos simulados: preguntas abiertas,
            escucha activa, exploración de riesgo (modo educativo) y cierre con plan.
            Aquí se practica; no se reemplaza a un profesional. Para acceder a los casos y al simulador, primero inicia sesión.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs text-white/60">Qué vas a encontrar</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-white/80 space-y-1">
                <li>Biblioteca de casos (ansiedad, depresión, pánico, etc.).</li>
                <li>Chat interactivo con “paciente” simulado (IA).</li>
                <li>Panel educativo con guías y señales a explorar.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs text-white/60">Cómo se usa (rápido)</div>
              <ol className="mt-3 list-decimal pl-5 text-sm text-white/80 space-y-1">
                <li>Entra a la biblioteca.</li>
                <li>Genera/elige un caso.</li>
                <li>Inicia la entrevista y practica el cierre.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs text-white/60">Reglas del juego</div>
              <ul className="mt-3 list-disc pl-5 text-sm text-white/80 space-y-1">
                <li>Usa datos ficticios (evita nombres reales).</li>
                <li>Si aparece autolesión/suicidio: modo educativo + derivación.</li>
                <li>Esto es práctica: no diagnostica.</li>
              </ul>
            </div>
          </div>

          <p className="mt-5 text-xs text-white/55">
            Nota: los casos son ficticios. Si aparece contenido sensible, el sistema responde en modo educativo.
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-white/45">
          Hecho para práctica educativa • Versión MVP
        </div>
      </div>
    </main>
  );
}