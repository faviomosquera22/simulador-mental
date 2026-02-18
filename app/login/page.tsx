"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabaseClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070A0F] flex items-center justify-center px-4">
          <div className="text-sm text-white/60">Cargando…</div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceLogin = searchParams.get("force") === "1";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // If a session/user exists, /login normally redirects to /cases.
  // But when force=1 (coming from welcome), we clear any existing session and show the login form.
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (forceLogin) {
          await supabase.auth.signOut();
          if (!alive) return;
          setChecking(false);
          return;
        }

        const { data } = await supabase.auth.getUser();
        if (!alive) return;

        if (data?.user) {
          router.replace("/cases");
          return;
        }
      } catch {
        // ignore
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, forceLogin]);

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

      router.replace("/cases");
    } catch {
      setErrorMsg("Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex items-center justify-center px-4">
        <div className="text-sm text-white/60">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-white">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-white/60">
            Entra para acceder a la biblioteca de casos y el simulador.
          </p>
        </div>

        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Correo</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-orange-400/60"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-orange-400/60"
            />
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link className="text-white/60 hover:text-white" href="/">
            Volver
          </Link>
          <Link className="text-white/60 hover:text-white" href="/register">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}