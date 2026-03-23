"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import PsykeLogo from "@/components/brand/PsykeLogo";

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
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(250,253,252,0.7),rgba(231,240,236,0.94))] px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-[30px] border border-[#1b2130]/10 bg-white/84 p-8 shadow-[0_28px_88px_rgba(84,104,112,0.16)] backdrop-blur-xl">
        <PsykeLogo compact />
        <h1 className="mt-6 text-2xl font-semibold text-[#17212A]">Psyke · Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-[#60727d]">
          Te enviaremos un enlace para crear una nueva contraseña.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-2xl border border-[#1b2130]/10 bg-white/80 px-4 py-3 text-sm text-[#17212A] placeholder:text-[#7d9099] outline-none transition focus:border-[#6f95a0]/40 focus:bg-white"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-[#bf5d57]/25 bg-[#bf5d57]/10 px-3 py-2 text-sm text-[#8d403b]">
              {error}
            </div>
          ) : null}

          {msg ? (
            <div className="rounded-2xl border border-[#5f9177]/25 bg-[#5f9177]/10 px-3 py-2 text-sm text-[#426650]">
              {msg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6f95a0,#89b2a7)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(111,149,160,0.28)] transition disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-xs text-[#607885] transition hover:text-[#17212A]">
              Volver a iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
