"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SessionView = {
  email: string;
  isAuthed: boolean;
};

function makeSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

function TopBar() {
  const hasSb = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const sb = useMemo(() => makeSupabaseClient(), []);
  const [session, setSession] = useState<SessionView>({ email: "", isAuthed: false });

  useEffect(() => {
    let alive = true;
    if (!sb) {
      setSession({ email: "", isAuthed: false });
      return;
    }

    // Estado inicial
    sb.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        const email = data.session?.user?.email ?? "";
        setSession({ email, isAuthed: Boolean(data.session) });
      })
      .catch(() => {
        if (!alive) return;
        setSession({ email: "", isAuthed: false });
      });

    // Cambios en vivo
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      if (!alive) return;
      const email = s?.user?.email ?? "";
      setSession({ email, isAuthed: Boolean(s) });
    });

    return () => {
      alive = false;
      sub.subscription?.unsubscribe();
    };
  }, [sb]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold text-white/90 hover:text-white">
            Simulador
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              educativo
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              no diagnostica
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.isAuthed ? (
            <>
              <Link
                href="/cases"
                className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Casos
              </Link>

              <Link
                href="/history"
                className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Historial
              </Link>

              <div
                className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80"
                title={session.email || "Cuenta"}
              >
                {session.email || "Cuenta"}
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await sb?.auth.signOut();
                  } finally {
                    setSession({ email: "", isAuthed: false });
                  }
                }}
                className="inline-flex rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex rounded-xl bg-white px-3 py-2 text-sm text-black"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>

      {!hasSb && (
        <div className="mx-auto w-full max-w-6xl px-4 pb-3">
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            Configuración incompleta: faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.
          </div>
        </div>
      )}
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <title>Simulador de entrevista clínica</title>
        <meta
          name="description"
          content="Simulador educativo para practicar entrevistas clínicas en salud mental. No diagnostica."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <TopBar />
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}