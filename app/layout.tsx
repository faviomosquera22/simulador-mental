"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "../src/lib/supabaseClient";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    let alive = true;

    (async () => {
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      setUser(data.session?.user ?? null);
    })();

    const { data: authListener } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.auth.signOut();
  }

  const isCases = pathname.startsWith("/cases");
  const isHistory = pathname === "/history";

  return (
    <html lang="es">
      <body className="bg-black text-white">
        <header className="border-b border-white/10 bg-black/90 px-6 py-3 backdrop-blur-md">
          <nav className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-bold text-white">
                Simulador
              </Link>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                educativo
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                no diagnóstica
              </span>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/cases"
                    className={`rounded-md px-3 py-1 text-sm ${
                      isCases ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    Casos
                  </Link>
                  <Link
                    href="/history"
                    className={`rounded-md px-3 py-1 text-sm ${
                      isHistory ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    Historial
                  </Link>

                  {/* Icono de perfil (abre setup/perfil) */}
                  <Link
                    href="/cases/setup"
                    aria-label="Perfil"
                    title="Perfil"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-5 w-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 11a4 4 0 100-8 4 4 0 000 8z"
                      />
                    </svg>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="rounded-md border border-white/20 px-3 py-1 text-sm font-medium text-white/90 hover:bg-white/10"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md bg-white px-3 py-1 text-sm font-medium text-black"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md border border-white/20 px-3 py-1 text-sm font-medium text-white/90 hover:bg-white/10"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}