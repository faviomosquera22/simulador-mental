// Welcome/Home UI (restored)
"use client";

import Link from "next/link";

function IconShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l7 3v6c0 6-3.5 10.5-7 11-3.5-.5-7-5-7-11V5l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 7L10.5 16.5 4 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21s-7-4.6-9.2-9C1.4 9 3 6 6.3 5.3 8.2 5 10 6 12 8c2-2 3.8-3 5.7-2.7C21 6 22.6 9 21.2 12c-2.2 4.4-9.2 9-9.2 9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDot(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" {...props}>
      <circle cx="4" cy="4" r="3" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070816] via-[#050614] to-black" />
        <div className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(110,231,255,0.22),rgba(110,231,255,0)_60%)] blur-2xl" />
        <div className="absolute -right-44 top-24 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.25),rgba(167,139,250,0)_60%)] blur-2xl" />
        <div className="absolute left-1/3 top-1/2 h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),rgba(59,130,246,0)_60%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.9)_100%)]" />
      </div>

      <div className="mx-auto flex max-w-6xl items-center px-6 py-10">
        <section className="w-full">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.24em] text-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <span className="flex items-center gap-1">
              <IconDot className="h-2 w-2 fill-sky-400" />
              <IconDot className="h-2 w-2 fill-indigo-400" />
            </span>
            <span>SIMULADOR</span>
            <span className="flex items-center gap-1">
              <IconDot className="h-2 w-2 fill-emerald-400" />
              <IconDot className="h-2 w-2 fill-lime-400" />
            </span>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            {/* Left */}
            <div>
              <h1 className="text-balance text-4xl font-semibold leading-tight text-white md:text-5xl">
                Simulador de entrevista clínica (salud mental)
              </h1>

              <p className="mt-4 max-w-3xl text-pretty text-[15px] leading-relaxed text-white/70">
                Entrena tu entrevista y razonamiento clínico con casos simulados: preguntas abiertas,
                escucha activa, exploración de riesgo (modo educativo) y cierre con plan. Aquí se
                practica, no reemplaza una evaluación profesional.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-sky-200">
                      <IconShield className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">Qué vas a encontrar</h3>
                  </div>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
                    <li>Biblioteca de casos (ansiedad, depresión, pánico, etc.).</li>
                    <li>Chat interactivo con “paciente” simulado (IA).</li>
                    <li>Guías educativas y señales a explorar.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-emerald-200">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">
                      Cómo se usa <span className="text-white/60">(rápido)</span>
                    </h3>
                  </div>
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/70">
                    <li>Inicia sesión.</li>
                    <li>Elige un tema y genera un caso.</li>
                    <li>Realiza la entrevista y revisa resultados.</li>
                  </ol>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-200">
                      <IconHeart className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">Reglas del juego</h3>
                  </div>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
                    <li>Usa datos ficticios (evita nombres reales).</li>
                    <li>Si aparece autolesión/suicidio: modo educativo + derivación.</li>
                    <li>Esto es práctica: no diagnostica.</li>
                  </ul>
                </div>
              </div>

              <p className="mt-6 text-xs text-white/50">
                Nota: los casos son ficticios. Si aparece contenido sensible, el sistema responde en
                modo educativo.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.6)]" />
                <span>
                  Listo para practicar <span className="text-white/40">•</span> modo educativo.
                </span>
              </div>
            </div>

            {/* Right: auth card (UX only) */}
            <aside className="relative">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <h2 className="text-2xl font-semibold text-white">Iniciar sesión</h2>
                <p className="mt-2 text-sm text-white/70">Accede a tus casos, progreso y biblioteca clínica.</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70" htmlFor="email">Correo</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:bg-black/25"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-medium text-white/70" htmlFor="password">Contraseña</label>
                      <Link href="/login" className="text-xs text-white/60 hover:text-white/85">¿Olvidaste tu clave?</Link>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:bg-black/25"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-white/65">
                      <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-black/30" />
                      Recordarme
                    </label>
                  </div>

                  {/* UX-only: send to real login page */}
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500/80 via-indigo-500/80 to-fuchsia-500/80 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_70px_rgba(59,130,246,0.25)] transition hover:shadow-[0_22px_90px_rgba(167,139,250,0.25)]"
                  >
                    Entrar
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
                  >
                    Crear cuenta
                  </Link>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[linear-gradient(120deg,rgba(110,231,255,0.15),rgba(167,139,250,0.12),rgba(236,72,153,0.12))] blur-2xl" />
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}