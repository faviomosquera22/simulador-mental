"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";

export default function HomePage() {
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
    <div className="min-h-screen bg-gradient-to-b from-[#070A0F] to-[#0D1118]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:flex lg:items-center lg:justify-between lg:py-20 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Simulador Mental
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-7 text-white/70">
            Bienvenido al simulador. Inicia sesión para acceder a la biblioteca de casos y el simulador.
          </p>
        </div>

        <div className="mt-10 w-full max-w-sm rounded-2xl border border-white/10 bg-black/20 p-8 backdrop-blur-xl sm:mt-0">
          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-white/70" htmlFor="email">
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
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:bg-black/25"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-medium text-white/70" htmlFor="password">
                  Contraseña
                </label>
                <Link href="/login" className="text-xs text-white/60 hover:text-white/85">
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
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:bg-black/25"
              />
            </div>

            {errorMsg ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
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
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500/80 via-indigo-500/80 to-fuchsia-500/80 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_70px_rgba(59,130,246,0.25)] transition hover:shadow-[0_22px_90px_rgba(167,139,250,0.25)] disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>

            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
            >
              Crear cuenta
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}