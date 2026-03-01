"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    const clean = email.trim();
    if (!clean) {
      setError("Ingresa tu correo.");
      return;
    }

    setLoading(true);
    try {
      // Enviará email de recuperación. Debe redirigir a /update-password
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/update-password`
          : undefined;

      const { error: err } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo,
      });

      if (err) {
        setError(err.message || "No se pudo enviar el correo de recuperación.");
        return;
      }

      setMsg("Listo. Revisa tu correo para continuar con el cambio de contraseña.");
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070A0F] to-[#0D1118] px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/20 p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-white">Psyke · Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-white/65">
          Te enviaremos un enlace para crear una nueva contraseña.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-white/70" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:bg-black/25"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {msg ? (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {msg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-xs text-white/60 hover:text-white/85">
              Volver a iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}