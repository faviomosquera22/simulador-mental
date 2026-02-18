import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "../components/Sidebar";

export const metadata: Metadata = {
  title: "Simulador de entrevista clínica (salud mental)",
  description:
    "Simulador educativo (no diagnóstica) para practicar entrevista clínica en salud mental.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen text-white antialiased bg-gradient-to-b from-[#070a12] via-[#0b1020] to-black">
        <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6">
          <Sidebar />
          <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}