"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";

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

function IconEye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconEyeOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.8a11 11 0 0 1 1.4-.3C18.5 5.5 22 12 22 12a20 20 0 0 1-3.4 4.4M14.8 14.8A3 3 0 0 1 9.2 9.2M6.2 6.2A18.7 18.7 0 0 0 2 12s3.5 6.5 10 6.5a10.8 10.8 0 0 0 5.1-1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");


  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || "No se pudo iniciar sesión.");
        return;
      }

      try {
        sessionStorage.setItem("postLoginLanding", "dashboard");
      } catch {
        // ignore
      }
      router.replace("/dashboard");
    } catch {
      setErrorMsg("Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030916] via-[#020A14] to-black" />
        <div className="absolute -left-36 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.24),rgba(14,165,233,0)_62%)] blur-2xl float-drift" />
        <div className="absolute -right-40 top-12 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.24),rgba(20,184,166,0)_62%)] blur-2xl" />
        <div className="absolute left-1/3 top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.14),rgba(251,191,36,0)_65%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.9)_100%)]" />
      </div>

      <div className="mx-auto flex max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-10">
        <section className="w-full">
          <div className="animate-rise-1 mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.24em] text-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <span className="flex items-center gap-1">
              <IconDot className="h-2 w-2 fill-sky-400" />
              <IconDot className="h-2 w-2 fill-teal-400" />
            </span>
            <span>PSYKE</span>
            <span className="flex items-center gap-1">
              <IconDot className="h-2 w-2 fill-emerald-400" />
              <IconDot className="h-2 w-2 fill-amber-300 pulse-soft" />
            </span>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
            <div className="order-2 lg:order-1">
              <h1 className="animate-rise-2 text-balance text-4xl font-semibold leading-tight text-white md:text-5xl">
                Practica entrevistas clínicas con criterio y estructura
              </h1>
              <p className="animate-rise-2 mt-2 text-sm text-white/65">
                Psyke · simulador educativo para salud mental
              </p>

              <p className="animate-rise-3 mt-4 max-w-3xl text-pretty text-[15px] leading-relaxed text-white/75">
                Mejora tu razonamiento clínico con casos guiados, feedback útil y un entorno seguro para practicar
                preguntas abiertas, exploración de riesgo y cierre con plan.
              </p>

              <div className="animate-rise-3 mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-xs text-sky-100">
                  Biblioteca por síntomas
                </span>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                  Simulación conversacional IA
                </span>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                  Enfoque educativo, no diagnóstico
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="animate-rise-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-sky-200">
                      <IconShield className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">Qué vas a encontrar</h3>
                  </div>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
                    <li>Casos de ansiedad, depresión, pánico y más.</li>
                    <li>Paciente simulado con IA en tiempo real.</li>
                    <li>Señales clínicas para orientar la entrevista.</li>
                  </ul>
                </div>

                <div className="animate-rise-5 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-emerald-200">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">
                      Flujo rápido <span className="text-white/60">(3 pasos)</span>
                    </h3>
                  </div>
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/70">
                    <li>Inicia sesión.</li>
                    <li>Elige tema y genera caso.</li>
                    <li>Entrevista y revisa feedback.</li>
                  </ol>
                </div>

                <div className="animate-rise-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-200">
                      <IconHeart className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-white/90">Reglas de uso</h3>
                  </div>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
                    <li>Usa datos ficticios y evita nombres reales.</li>
                    <li>Riesgo suicida: modo educativo y derivación.</li>
                    <li>Psyke no diagnostica ni reemplaza evaluación.</li>
                  </ul>
                </div>
              </div>

              <div className="animate-rise-6 mt-6 max-w-3xl rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/65">
                Nota de seguridad: si aparece contenido sensible, Psyke responde en modo educativo y sugiere
                derivación a recursos profesionales cuando corresponde.
              </div>
            </div>

            <aside className="order-1 relative lg:order-2">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.28),rgba(14,165,233,0)_58%),radial-gradient(circle_at_80%_80%,rgba(20,184,166,0.22),rgba(20,184,166,0)_55%)] blur-2xl float-drift" />
              <div className="animate-rise-3 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(16,26,42,0.75),rgba(13,18,34,0.8))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-white">Bienvenido de vuelta</h2>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                    Acceso seguro
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/75">
                  Inicia sesión para retomar tus casos, progreso y biblioteca clínica.
                </p>

                <form onSubmit={onLogin} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70" htmlFor="email">
                      Correo
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-300/40 focus:bg-black/35"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-medium text-white/70" htmlFor="password">
                        Contraseña
                      </label>
                      <Link href="/reset-password" className="text-xs text-white/60 hover:text-white/85">
                        ¿Olvidaste tu clave?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 pr-12 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-300/40 focus:bg-black/35"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/55 transition hover:text-white/85"
                      >
                        {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                      {errorMsg}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-white/65">
                      <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-black/30" />
                      Recordarme
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_70px_rgba(14,165,233,0.3)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Entrando…" : "Entrar"}
                  </button>

                  <Link
                    href="/register"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
                  >
                    Crear cuenta en Psyke
                  </Link>
                </form>

                <p className="mt-4 text-xs text-white/55">
                  Espacio de práctica clínica. No reemplaza evaluación profesional.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
