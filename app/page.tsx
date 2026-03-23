"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";
import PsykeLogo from "@/components/brand/PsykeLogo";

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
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,253,252,0.72),rgba(231,240,236,0.92))]" />
        <div className="absolute -left-28 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(137,178,167,0.28),rgba(137,178,167,0)_62%)] blur-3xl float-drift" />
        <div className="absolute -right-40 top-14 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(111,149,160,0.22),rgba(111,149,160,0)_62%)] blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.74),rgba(255,255,255,0)_65%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(23,33,42,0.28)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(23,33,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,33,42,0.04)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="mx-auto flex max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-10">
        <section className="w-full">
          <PsykeLogo className="animate-rise-1" />

          <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
            <div className="order-2 lg:order-1">
              <div className="animate-rise-2 mt-5 inline-flex rounded-full border border-[#1b2130]/10 bg-white/60 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-[#607885] shadow-[0_18px_48px_rgba(84,104,112,0.12)] backdrop-blur-md">
                Plataforma de simulacion clinica
              </div>

              <h1 className="animate-rise-2 mt-5 text-balance text-4xl font-semibold leading-tight text-[#17212A] md:text-5xl">
                Practica entrevistas clínicas con criterio y estructura
              </h1>
              <p className="animate-rise-2 mt-2 text-sm text-[#556e7b]">
                Psyke · simulador educativo con identidad visual mas limpia y enfocada
              </p>

              <p className="animate-rise-3 mt-4 max-w-3xl text-pretty text-[15px] leading-relaxed text-[#485d69]">
                Mejora tu razonamiento clínico con casos guiados, feedback útil y un entorno seguro para practicar
                preguntas abiertas, exploración de riesgo y cierre con plan.
              </p>

              <div className="animate-rise-3 mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#6f95a0]/20 bg-[#6f95a0]/10 px-3 py-1 text-xs font-medium text-[#55727d]">
                  Biblioteca por síntomas
                </span>
                <span className="rounded-full border border-[#89b2a7]/25 bg-[#89b2a7]/12 px-3 py-1 text-xs font-medium text-[#557468]">
                  Simulación conversacional IA
                </span>
                <span className="rounded-full border border-[#b88c53]/18 bg-[#b88c53]/10 px-3 py-1 text-xs font-medium text-[#836641]">
                  Enfoque educativo, no diagnóstico
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="animate-rise-4 rounded-[28px] border border-[#1b2130]/10 bg-white/72 p-5 shadow-[0_22px_64px_rgba(84,104,112,0.14)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#6f95a0]/20 bg-[#6f95a0]/10 text-[#55727d]">
                      <IconShield className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-[#17212A]">Qué vas a encontrar</h3>
                  </div>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#536874]">
                    <li>Casos de ansiedad, depresión, pánico y más.</li>
                    <li>Paciente simulado con IA en tiempo real.</li>
                    <li>Señales clínicas para orientar la entrevista.</li>
                  </ul>
                </div>

                <div className="animate-rise-5 rounded-[28px] border border-[#1b2130]/10 bg-white/72 p-5 shadow-[0_22px_64px_rgba(84,104,112,0.14)] backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#89b2a7]/24 bg-[#89b2a7]/12 text-[#557468]">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-[#17212A]">
                      Flujo rápido <span className="text-[#607885]">(3 pasos)</span>
                    </h3>
                  </div>
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#536874]">
                    <li>Inicia sesión.</li>
                    <li>Elige tema y genera caso.</li>
                    <li>Entrevista y revisa feedback.</li>
                  </ol>
                </div>

                <div className="animate-rise-6 rounded-[28px] border border-[#1b2130]/10 bg-white/72 p-5 shadow-[0_22px_64px_rgba(84,104,112,0.14)] backdrop-blur-md sm:col-span-2 xl:col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#718099]/20 bg-[#718099]/10 text-[#5c6a83]">
                      <IconHeart className="h-5 w-5" />
                    </span>
                    <h3 className="text-sm font-semibold text-[#17212A]">Reglas de uso</h3>
                  </div>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#536874]">
                    <li>Usa datos ficticios y evita nombres reales.</li>
                    <li>Riesgo suicida: modo educativo y derivación.</li>
                    <li>Psyke no diagnostica ni reemplaza evaluación.</li>
                  </ul>
                </div>
              </div>

              <div className="animate-rise-6 mt-6 max-w-3xl rounded-2xl border border-[#1b2130]/10 bg-white/65 px-4 py-3 text-xs text-[#60727d] shadow-[0_12px_32px_rgba(84,104,112,0.1)]">
                Nota de seguridad: si aparece contenido sensible, Psyke responde en modo educativo y sugiere
                derivación a recursos profesionales cuando corresponde.
              </div>
            </div>

            <aside className="order-1 relative lg:order-2">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] bg-[radial-gradient(circle_at_30%_20%,rgba(137,178,167,0.28),rgba(137,178,167,0)_58%),radial-gradient(circle_at_80%_80%,rgba(111,149,160,0.2),rgba(111,149,160,0)_55%)] blur-2xl float-drift" />
              <div className="animate-rise-3 rounded-[30px] border border-[#1b2130]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,249,247,0.86))] p-5 shadow-[0_34px_110px_rgba(84,104,112,0.18)] backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <PsykeLogo compact showTagline={false} />
                  <span className="rounded-full border border-[#1b2130]/10 bg-white/70 px-3 py-1 text-[11px] text-[#5c6f79]">
                    Acceso seguro
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-[#17212A]">Bienvenido de vuelta</h2>
                <p className="mt-2 text-sm text-[#536874]">
                  Inicia sesión para retomar tus casos, progreso y biblioteca clínica.
                </p>

                <form onSubmit={onLogin} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]" htmlFor="email">
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
                      className="w-full rounded-2xl border border-[#1b2130]/10 bg-white/80 px-4 py-3 text-sm text-[#17212A] placeholder:text-[#7d9099] outline-none transition focus:border-[#6f95a0]/40 focus:bg-white"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]" htmlFor="password">
                        Contraseña
                      </label>
                      <Link href="/reset-password" className="text-xs text-[#607885] transition hover:text-[#17212A]">
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
                        className="w-full rounded-2xl border border-[#1b2130]/10 bg-white/80 px-4 py-3 pr-12 text-sm text-[#17212A] placeholder:text-[#7d9099] outline-none transition focus:border-[#6f95a0]/40 focus:bg-white"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#607885] transition hover:text-[#17212A]"
                      >
                        {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg ? (
                    <div className="rounded-2xl border border-[#bf5d57]/25 bg-[#bf5d57]/10 px-3 py-2 text-sm text-[#8d403b]">
                      {errorMsg}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-[#60727d]">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#1b2130]/20 bg-white/80" />
                      Recordarme
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6f95a0,#89b2a7)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(111,149,160,0.28)] transition hover:brightness-[1.04] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Entrando…" : "Entrar"}
                  </button>

                  <Link
                    href="/register"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-[#1b2130]/10 bg-white/70 px-4 py-3 text-sm font-medium text-[#17212A] transition hover:bg-white"
                  >
                    Crear cuenta en Psyke
                  </Link>
                </form>

                <p className="mt-4 text-xs text-[#6b7f8a]">
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
