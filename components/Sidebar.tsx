"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  requiresActiveCase?: boolean;
};

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Caso en curso",
    href: "/simulator",
    requiresActiveCase: true,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    label: "Biblioteca clínica",
    href: "/topics",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 3H5a2 2 0 0 0-2 2v4" />
        <path d="M9 3h10a2 2 0 0 1 2 2v4" />
        <path d="M9 3v18" />
        <path d="M9 21h10a2 2 0 0 0 2-2V9" />
        <path d="M9 21H5a2 2 0 0 1-2-2V9" />
        <path d="M3 9h18" />
      </svg>
    ),
  },
  {
    label: "Simulador de patologías",
    href: "/medical-cases",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18" />
        <path d="M3 12h18" />
        <rect x="5" y="5" width="14" height="14" rx="3" />
      </svg>
    ),
  },
  {
    label: "Simulador de ECG",
    href: "/ecg-simulator",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12h4l2.5-6 5 12 2.5-6H21" />
        <path d="M4 5h16" />
        <path d="M4 19h16" />
      </svg>
    ),
  },
  {
    label: "Laboratorio",
    href: "/laboratory",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 2v6l-4.5 7.6A4 4 0 0 0 8.9 22h6.2a4 4 0 0 0 3.4-6.4L14 8V2" />
        <path d="M9 13h6" />
      </svg>
    ),
  },
  {
    label: "Cálculo clínico",
    href: "/clinical-calculations",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
        <path d="M8 7h8" />
        <path d="M8 11h2" />
        <path d="M12 11h4" />
        <path d="M8 15h2" />
        <path d="M12 15h4" />
      </svg>
    ),
  },
  {
    label: "PAE",
    href: "/pae",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4" />
        <path d="M9 11h6" />
        <path d="M9 15h6" />
      </svg>
    ),
  },
  {
    label: "Triage por carrera",
    href: "/triage-simulator",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 6h11" />
        <path d="M8 12h11" />
        <path d="M8 18h11" />
        <path d="M3.5 6h.01" />
        <path d="M3.5 12h.01" />
        <path d="M3.5 18h.01" />
      </svg>
    ),
  },
  {
    label: "CACES",
    href: "/caces",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.6.4-1 .7-1.2 1.4" />
        <circle cx="12" cy="17" r="1" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    label: "Simulador de trastornos mentales",
    href: "/cases",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Mis sesiones",
    href: "/history",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Reportes",
    href: "/reports",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Perfil",
    href: "/profile",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    ),
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function hasCaseInProgress(): boolean {
  try {
    const ended = localStorage.getItem("sessionEnded");
    if (ended === "true") return false;
    const raw = localStorage.getItem("activeCase");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed;
  } catch {
    return false;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasActiveCase, setHasActiveCase] = useState(false);
  const [isCacesRoute, setIsCacesRoute] = useState(false);

  useEffect(() => {
    const check = () => {
      setHasActiveCase(hasCaseInProgress());
      try {
        const search = new URLSearchParams(window.location.search);
        setIsCacesRoute(
          window.location.pathname === "/caces" ||
          (window.location.pathname === "/simulator" && search.get("tab") === "caces")
        );
      } catch {
        setIsCacesRoute(false);
      }
    };
    check();

    window.addEventListener("storage", check);
    window.addEventListener("popstate", check);
    const id = window.setInterval(check, 750);

    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("popstate", check);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    try {
      localStorage.removeItem("activeCase");
      localStorage.removeItem("activeTranscript");
      localStorage.removeItem("sessionEnded");
      localStorage.removeItem("sessionEndedInfo");
      localStorage.removeItem("activeReport");
    } catch {
      // ignore
    }

    try {
      window.location.replace("/login");
    } catch {
      window.location.href = "/login";
    }
  };

  const renderNavItems = (options?: { compact?: boolean; closeOnNavigate?: boolean }) => {
    const compact = Boolean(options?.compact);
    const closeOnNavigate = Boolean(options?.closeOnNavigate);

    return (
      <ul className="space-y-1">
        {NAV.map((item) => {
          const disabledCase = Boolean(item.requiresActiveCase) && !hasActiveCase;
          const href = disabledCase ? "/cases" : item.href;
          const isCacesItem = item.label === "CACES";
          const active = !disabledCase && (
            isCacesItem
              ? isCacesRoute
              : pathname === item.href || pathname.startsWith(item.href + "/")
          );

          return (
            <li key={`${item.href}::${item.label}`}>
              <Link
                href={href}
                onClick={() => {
                  if (closeOnNavigate) setMobileOpen(false);
                }}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-blue-400/10 text-sky-300"
                    : disabledCase
                    ? "text-white/35 hover:bg-white/5 hover:text-white/60"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
                aria-current={active ? "page" : undefined}
                title={
                  disabledCase
                    ? "No hay caso en curso. Genera un caso primero en Simulador de trastornos mentales."
                    : compact
                    ? item.label
                    : undefined
                }
              >
                <span className={cn("flex h-6 w-6 items-center justify-center", active ? "text-sky-300" : "text-white/70")}>
                  {item.icon}
                </span>

                {!compact && (
                  <span className={cn("min-w-0 flex-1 truncate", active ? "font-semibold" : "font-medium")}>
                    {item.label === "Caso en curso" && !hasActiveCase ? "Genera un caso" : item.label}
                  </span>
                )}

                {!compact && item.label === "Caso en curso" && hasActiveCase && (
                  <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">1</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#0F1117]/95 text-white shadow-[0_12px_35px_rgba(0,0,0,0.45)] md:hidden"
        aria-label="Abrir menú principal"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[304px] max-w-[88vw] border-r border-white/10 bg-[#0F1117] shadow-[0_30px_120px_rgba(0,0,0,0.55)] transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">Psyke</div>
                <div className="text-[10px] text-white/40">Simulador clínico</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/80"
            >
              Cerrar
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            <div className="px-2 pb-2 text-[10px] font-semibold tracking-[0.14em] text-white/25">PRINCIPAL</div>
            {renderNavItems({ closeOnNavigate: true })}
          </nav>

          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M21 12a9 9 0 0 0-9-9" />
                  <path d="M12 21a9 9 0 0 0 9-9" />
                </svg>
              </span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <aside className="hidden md:flex md:shrink-0">
        <div
          className={cn(
            "h-full min-h-0 rounded-3xl border border-white/10 bg-[#0F1117] shadow-[0_30px_120px_rgba(0,0,0,0.55)]",
            "flex min-h-0 flex-col overflow-hidden",
            collapsed ? "w-[76px]" : "w-[292px]"
          )}
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
            <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">Psyke</div>
              <div className="text-[10px] text-white/40">Simulador clínico</div>
            </div>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {!collapsed && (
            <div className="px-2 pb-2 text-[10px] font-semibold tracking-[0.14em] text-white/25">PRINCIPAL</div>
          )}
          {renderNavItems({ compact: collapsed })}
        </nav>

        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
              "text-white/50 hover:bg-white/5 hover:text-white/80"
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
            {!collapsed && <span>Colapsar</span>}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
              "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 12a9 9 0 0 0-9-9" />
                <path d="M12 21a9 9 0 0 0 9-9" />
              </svg>
            </span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
