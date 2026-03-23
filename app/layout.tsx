import "./globals.css";
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: {
    default: "Psyke",
    template: "%s · Psyke",
  },
  description:
    "Psyke es un simulador educativo (no diagnostica) para practicar entrevista clínica en salud mental.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased font-sans overflow-x-hidden text-[var(--text-primary)]">
        <div id="app" className="relative z-10">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-6">
            {children}
          </div>
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
