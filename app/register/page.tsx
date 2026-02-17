"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.length >= 8;
  }, [email, password]);

  const onRegister = async () => {
    setErr(null);
    setMsg(null);
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Si tienes confirmación de email activada, aquí te dirá que revises tu correo.
      if (!data.session) {
        setMsg("Cuenta creada. Revisa tu correo para confirmar el registro (si está activado).");
      } else {
        setMsg("Cuenta creada y sesión iniciada. Entrando...");
        window.location.href = "/cases";
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo crear la cuenta.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-white/70">
          Registro para usar el simulador. Usa tu correo real (entorno de prueba).
        </p>

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
            autoComplete="new-password"
          />
          <div className="mt-2 text-xs text-white/50">
            Requisito: 8+ caracteres. (Luego podemos exigir más seguridad.)
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
            {err}
          </div>
        )}
        {msg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            {msg}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onRegister}
            disabled={!canSubmit || loading}
            className="rounded-xl bg-white text-black px-4 py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>

          <Link
            href="/login"
            className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/80 hover:bg-white/5 text-center"
          >
            Ya tengo cuenta → Iniciar sesión
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/60">
          Esto es un simulador educativo. El paciente del caso siempre es ficticio.
        </p>
      </div>
    </main>
  );
}
