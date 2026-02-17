"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl items-center px-6 py-10">
      <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <h1 className="text-3xl font-semibold text-white">
          Simulador de entrevista clínica (salud mental)
        </h1>

        <p className="mt-3 max-w-3xl text-white/70">
          Entrena tu entrevista y razonamiento clínico con casos simulados: preguntas abiertas,
          escucha activa, exploración de riesgo (modo educativo) y cierre con plan. Aquí se practica;
          no reemplaza una evaluación profesional.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-semibold text-white/90">Qué vas a encontrar</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
              <li>Biblioteca de casos (ansiedad, depresión, pánico, etc.).</li>
              <li>Chat interactivo con “paciente” simulado (IA).</li>
              <li>Guías educativas y señales a explorar.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-semibold text-white/90">Cómo se usa (rápido)</h3>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-white/70">
              <li>Inicia sesión.</li>
              <li>Elige un tema y genera un caso.</li>
              <li>Realiza la entrevista y revisa resultados.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-sm font-semibold text-white/90">Reglas del juego</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/70">
              <li>Usa datos ficticios (evita nombres reales).</li>
              <li>Si aparece autolesión/suicidio: modo educativo + derivación.</li>
              <li>Esto es práctica: no diagnostica.</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/50">
          Nota: los casos son ficticios. Si aparece contenido sensible, el sistema responde en modo educativo.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}