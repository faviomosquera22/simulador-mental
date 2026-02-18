"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  badge?: string;
};

const NAV: NavItem[] = [
  { label: "Perfil", href: "/profile" },
  { label: "Historial de casos", href: "/history" },
  { label: "Biblioteca de casos", href: "/cases" },
  { label: "Información de los temas", href: "/topics" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-[260px] md:shrink-0">
      <div className="w-full rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        {/* Marco naranja “pro” */}
        <div className="rounded-2xl ring-1 ring-orange-500/60 p-3">
          <div className="px-3 py-4">
            <div className="text-xs tracking-widest uppercase text-white/50">
              Navegación
            </div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              Simulador
            </div>
          </div>

          <nav className="px-2 pb-3">
            <ul className="space-y-2">
              {NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-3 py-3",
                        "transition-colors outline-none",
                        "focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30",
                        active
                          ? "bg-white/10 text-white ring-1 ring-white/15"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="text-sm font-medium">{item.label}</span>

                      {/* Puntito indicador */}
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full transition-opacity",
                          active ? "bg-orange-400" : "bg-white/30 opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer mini */}
          <div className="px-3 pb-3 pt-2 text-xs text-white/40">
            Tip: usa el historial para comparar evolución.
          </div>
        </div>
      </div>
    </aside>
  );
}