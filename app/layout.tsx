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
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}