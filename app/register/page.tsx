"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import PsykeLogo from "@/components/brand/PsykeLogo";

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
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,rgba(250,253,252,0.7),rgba(231,240,236,0.94))] p-6">
      <div className="w-full max-w-md rounded-[30px] border border-[#1b2130]/10 bg-white/84 p-8 shadow-[0_28px_88px_rgba(84,104,112,0.16)]">
        <PsykeLogo compact />
        <h1 className="mt-6 text-2xl font-semibold text-[#17212A]">Crear cuenta</h1>
        <p className="mt-1 text-sm text-[#60727d]">
          Registro para usar el simulador. Usa tu correo real (entorno de prueba).
        </p>

        <div className="mt-6">
          <label className="text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]">Correo</label>
          <input
            className="mt-2 w-full rounded-2xl border border-[#1b2130]/10 bg-white/80 px-4 py-3 text-sm text-[#17212A] outline-none transition focus:border-[#6f95a0]/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu.correo@ejemplo.com"
            autoComplete="email"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium uppercase tracking-[0.18em] text-[#60727d]">Contraseña</label>
          <input
            className="mt-2 w-full rounded-2xl border border-[#1b2130]/10 bg-white/80 px-4 py-3 text-sm text-[#17212A] outline-none transition focus:border-[#6f95a0]/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mínimo 8 caracteres"
            type="password"
            autoComplete="new-password"
          />
          <div className="mt-2 text-xs text-[#6d808a]">
            Requisito: 8+ caracteres. (Luego podemos exigir más seguridad.)
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-2xl border border-[#bf5d57]/25 bg-[#bf5d57]/10 p-3 text-sm text-[#8d403b]">
            {err}
          </div>
        )}
        {msg && (
          <div className="mt-4 rounded-2xl border border-[#5f9177]/25 bg-[#5f9177]/10 p-3 text-sm text-[#426650]">
            {msg}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onRegister}
            disabled={!canSubmit || loading}
            className="rounded-2xl bg-[linear-gradient(135deg,#6f95a0,#89b2a7)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(111,149,160,0.28)] disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>

          <Link
            href="/login"
            className="rounded-2xl border border-[#1b2130]/10 bg-white/70 px-4 py-3 text-center text-sm text-[#17212A] transition hover:bg-white"
          >
            Ya tengo cuenta → Iniciar sesión
          </Link>
        </div>

        <p className="mt-4 text-xs text-[#6d808a]">
          Esto es un simulador educativo. El paciente del caso siempre es ficticio.
        </p>
      </div>
    </main>
  );
}
