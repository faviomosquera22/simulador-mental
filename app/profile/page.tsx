"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { supabase } from "@/src/lib/supabaseClient";

type Profile = {
  name?: string;
  email?: string;
  role?: string;
  career?: string;
  avatarUrl?: string;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Soporta varias claves por compatibilidad con lo que hayas guardado antes
    const p =
      safeParse<Profile>(localStorage.getItem("profile")) ||
      safeParse<Profile>(localStorage.getItem("userProfile")) ||
      safeParse<Profile>(localStorage.getItem("app_profile"));

    setProfile(p);
  }, []);

  const display = useMemo(() => {
    const name = profile?.name?.trim() || "Usuario";
    const email = profile?.email?.trim() || "—";
    const role = profile?.role?.trim() || "Estudiante";
    const career = profile?.career?.trim() || "—";
    const initial = (name?.[0] || "U").toUpperCase();

    return { name, email, role, career, initial };
  }, [profile]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    // “Borrar la huella” (lo básico)
    const keys = [
      "profile",
      "userProfile",
      "app_profile",
      "activeCase",
      "activeTranscript",
      "lastEmotion",
      "sessionEnded",
    ];
    keys.forEach((k) => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch {}
    });

    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />
<Link href="/history" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
  Historial
</Link>
        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Perfil</h1>
              <p className="mt-1 text-sm text-white/70">
                Tu identidad aquí no es solo datos… es tu mapa para el futuro.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/cases"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                Biblioteca
              </Link>
              <button
                onClick={logout}
                className="rounded-xl bg-white text-black px-4 py-2 text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-5">
            {/* Card avatar */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 h-fit">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center text-2xl font-semibold text-white">
                  {display.initial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-white/60">Nombre</div>
                  <div className="mt-1 text-lg font-semibold text-white truncate">
                    {display.name}
                  </div>
                  <div className="mt-1 text-sm text-white/60 truncate">
                    {display.email}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Rol</div>
                  <div className="mt-1 text-sm text-white/85">{display.role}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Carrera</div>
                  <div className="mt-1 text-sm text-white/85">{display.career}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Estado</div>
                  <div className="mt-1 text-sm text-white/85">
                    Activo • Modo educativo
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-white/50">
                Tip: si esto sale vacío, aún no guardas el perfil en localStorage.
                (Tu app no está rota… solo está amnésica 😄)
              </p>
            </div>

            {/* Panel info / acciones */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/60">Acciones</div>
              <div className="mt-1 text-base font-semibold">Gestión rápida</div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.href = "/simulator"}
                  className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/5 text-left"
                >
                  <div className="font-semibold">Ir al simulador</div>
                  <div className="text-xs text-white/60 mt-1">
                    Continua entrevistas y revisa tu progreso.
                  </div>
                </button>

                <button
                  onClick={() => {
                    try {
                      const demo: Profile = {
                        name: "Favio",
                        email: "favio@email.com",
                        role: "Estudiante",
                        career: "Enfermería",
                      };
                      localStorage.setItem("profile", JSON.stringify(demo));
                      setProfile(demo);
                    } catch {}
                  }}
                  className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/5 text-left"
                >
                  <div className="font-semibold">Cargar perfil demo</div>
                  <div className="text-xs text-white/60 mt-1">
                    Para probar visual sin auth todavía.
                  </div>
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/60">Nota</div>
                <div className="mt-1 text-sm text-white/85">
                  Luego conectamos esto a Supabase/Auth. Por ahora, esta pantalla vive
                  feliz con datos locales.
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-white/60">
                  Ver datos (debug)
                </summary>
                <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/70">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
