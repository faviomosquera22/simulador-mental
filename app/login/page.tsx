"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";
import PsykeLogo from "@/components/brand/PsykeLogo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
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
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(250,253,252,0.7),rgba(231,240,236,0.94))]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:flex lg:items-center lg:justify-between lg:py-20 lg:px-8">
        <div className="max-w-xl">
          <PsykeLogo className="animate-rise-1" />
          <p className="mt-6 inline-flex rounded-full border border-[#1b2130]/10 bg-white/60 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-[#607885]">
            Acceso al ecosistema clinico
          </p>
          <p className="mt-6 max-w-3xl text-lg leading-7 text-[#4f6672]">
            Bienvenido a Psyke. Inicia sesión para acceder a la biblioteca de casos y al simulador.
            <span className="text-[#17212A]"> No diagnostica.</span>
          </p>
        </div>

        <div className="mt-10 w-full max-w-sm rounded-[30px] border border-[#1b2130]/10 bg-white/84 p-8 shadow-[0_28px_88px_rgba(84,104,112,0.16)] backdrop-blur-xl sm:mt-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#17212A]">Psyke · Iniciar sesión</h2>
            <span className="rounded-full border border-[#1b2130]/10 bg-[#6f95a0]/10 px-3 py-1 text-xs text-[#5d7680]">Acceso</span>
          </div>
          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]" htmlFor="email">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-[#1b2130]/10 bg-white/80 px-4 py-3 text-sm text-[#17212A] placeholder:text-[#7d9099] outline-none transition focus:border-[#6f95a0]/40 focus:bg-white"
              />
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
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6f95a0,#89b2a7)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(111,149,160,0.28)] transition hover:brightness-[1.04] disabled:opacity-60"
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
        </div>
      </div>
    </div>
  );
}
