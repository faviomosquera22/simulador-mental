"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.length >= 8;
  }, [email, password]);

  const onLogin = async () => {
    setErr(null);
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("No se pudo iniciar sesión (sin sesión).");
      }

      window.location.href = "/cases";
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo iniciar sesión.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setErr(null);
    const e = email.trim();
    if (!e.includes("@")) {
      setErr("Escribe tu correo para enviarte el enlace de recuperación.");
      return;
    }

    setLoading(true);
    try {
      // Nota: Necesitas configurar redirect en Supabase si quieres un flujo completo.
      const { error } = await supabase.auth.resetPasswordForEmail(e);
      if (error) throw error;
      setErr("Listo: revisa tu correo para recuperar la contraseña.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo enviar el correo de recuperación.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-white/70">Accede con tu correo y contraseña.</p>

        <div className="mt-6">
          <label className="text-xs text-white/60">Correo</label>
          <input
            className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu.correo@ejemplo.com"
            autoComplete="email"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs text-white/60">Contraseña</label>
          <input
            className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mínimo 8 caracteres"
            type="password"
            autoComplete="current-password"
          />
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
            {err}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onLogin}
            disabled={!canSubmit || loading}
            className="rounded-xl bg-white text-black px-4 py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <button
            onClick={onForgot}
            disabled={loading}
            className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:bg-white/5"
          >
            Olvidé mi contraseña
          </button>

          <Link
            href="/register"
            className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:bg-white/5 text-center"
          >
            No tengo cuenta → Registrarme
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/60">
          Simulador educativo. No diagnostica. El paciente del caso es ficticio.
        </p>
      </div>
    </main>
  );
}
