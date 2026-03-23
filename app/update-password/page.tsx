"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";
import PsykeLogo from "@/components/brand/PsykeLogo";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Asegura que Supabase “vea” la sesión del link (según el tipo de enlace)
  useEffect(() => {
    const run = async () => {
      try {
        // Esto suele bastar en muchos setups; si tu proyecto usa PKCE con "code",
        // necesitarías exchangeCodeForSession (lo ajustamos si te sale error).
        await supabase.auth.getSession();
      } finally {
        setReady(true);
      }
    };
    run();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message || "No se pudo actualizar la contraseña.");
        return;
      }

      setMsg("Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => router.replace("/login"), 800);
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
        <h1 className="mt-6 text-2xl font-semibold text-[#17212A]">Psyke · Nueva contraseña</h1>
        <p className="mt-2 text-sm text-[#60727d]">
          {ready
            ? "Escribe tu nueva contraseña."
            : "Preparando el cambio de contraseña…"}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]" htmlFor="p1">
              Nueva contraseña
            </label>
            <input
              id="p1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#1b2130]/10 bg-white/80 px-4 py-3 text-sm text-[#17212A] placeholder:text-[#7d9099] outline-none transition focus:border-[#6f95a0]/40 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]" htmlFor="p2">
              Confirmar contraseña
            </label>
            <input
              id="p2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="••••••••"
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
            disabled={loading || !ready}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6f95a0,#89b2a7)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(111,149,160,0.28)] transition disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Guardar contraseña"}
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
