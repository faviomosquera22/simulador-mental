"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";

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
    <div className="min-h-screen bg-gradient-to-b from-[#070A0F] to-[#0D1118] px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/20 p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-white">Psyke · Nueva contraseña</h1>
        <p className="mt-2 text-sm text-white/65">
          {ready
            ? "Escribe tu nueva contraseña."
            : "Preparando el cambio de contraseña…"}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-white/70" htmlFor="p1">
              Nueva contraseña
            </label>
            <input
              id="p1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/20 focus:bg-black/25"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-white/70" htmlFor="p2">
              Confirmar contraseña
            </label>
            <input
              id="p2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="••••••••"
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
            disabled={loading || !ready}
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Guardar contraseña"}
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