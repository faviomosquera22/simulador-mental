import "./globals.css";
import type { Metadata } from "next";

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
      <body className="min-h-screen bg-[#070A0F] text-white antialiased font-sans overflow-x-hidden">
        <div id="app" className="relative z-10">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-6">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}