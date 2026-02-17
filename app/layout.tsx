import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";

type SessionView = {
  email: string;
  isAuthed: boolean;
};

function TopBar() {
  // Layout is a Server Component; keep the top bar simple and stable in production builds.
  // If you later want real auth state here, we can add a small Client Component.
  const cookieStore = cookies();
  const hasSb = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // NOTE: We can't read Supabase session client-side here. This just avoids crashing builds.
  const session: SessionView = { email: "", isAuthed: false };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold text-white/90 hover:text-white">
            Simulador
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">educativo</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">no diagnostica</span>
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
                href="/simulator"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                title={session.email || "Cuenta"}
              >
                <span className="hidden sm:inline">{session.email || "Cuenta"}</span>
                <span className="sm:hidden">Cuenta</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
              <Link href="/register" className="hidden sm:inline-flex rounded-xl bg-white px-3 py-2 text-sm text-black">
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
        <meta name="description" content="Simulador educativo para practicar entrevistas clínicas en salud mental. No diagnostica." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <TopBar />
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}
