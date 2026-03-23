"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import PsykeLogo from "@/components/brand/PsykeLogo";
import {
  EMPTY_PROFILE,
  PROFILE_KEYS,
  PROFILE_UPDATED_EVENT,
  clearStoredProfile,
  extractProfileFromAuth,
  getProfileDisplayName,
  getProfileInitial,
  mergeProfiles,
  normalizeText,
  persistProfile,
  readStoredProfile,
  serializeComparableProfile,
  type UserProfile,
} from "@/src/lib/userProfile";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  requiresActiveCase?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navIcons = {
  dashboard: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  activeCase: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" />
    </svg>
  ),
  library: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3H5a2 2 0 0 0-2 2v4" />
      <path d="M9 3h10a2 2 0 0 1 2 2v4" />
      <path d="M9 3v18" />
      <path d="M9 21h10a2 2 0 0 0 2-2V9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V9" />
      <path d="M3 9h18" />
    </svg>
  ),
  pathologies: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="5" y="5" width="14" height="14" rx="3" />
    </svg>
  ),
  ecg: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h4l2.5-6 5 12 2.5-6H21" />
      <path d="M4 5h16" />
      <path d="M4 19h16" />
    </svg>
  ),
  lab: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 2v6l-4.5 7.6A4 4 0 0 0 8.9 22h6.2a4 4 0 0 0 3.4-6.4L14 8V2" />
      <path d="M9 13h6" />
    </svg>
  ),
  gasometry: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4h12" />
      <path d="M7 4v7l-3 5a3 3 0 0 0 2.6 4.5h10.8A3 3 0 0 0 20 16l-3-5V4" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </svg>
  ),
  ultrasound: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 9c2.5 1.7 2.5 4.3 0 6" />
      <path d="M12 8c3.8 2.4 3.8 5.6 0 8" />
      <path d="M15 10.5c1.6 1.1 1.6 1.9 0 3" />
    </svg>
  ),
  images: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M21 16l-5-5-4 4-2-2-5 5" />
    </svg>
  ),
  rcp: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s-6.5-4.3-8.6-8A4.8 4.8 0 0 1 7.5 5c1.8 0 3 1 4.5 2.6C13.5 6 14.7 5 16.5 5a4.8 4.8 0 0 1 4.1 8c-2.1 3.7-8.6 8-8.6 8z" />
      <path d="M9 13h2l1-3 2 6 1-3h2" />
    </svg>
  ),
  dynamic: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12a8 8 0 0 1 14-5" />
      <path d="M20 12a8 8 0 0 1-14 5" />
      <path d="M18 4v5h-5" />
      <path d="M6 20v-5h5" />
    </svg>
  ),
  maternal: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21a4 4 0 0 0 4-4v-2a4 4 0 0 0-8 0v2a4 4 0 0 0 4 4z" />
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 19c0-2.8 2.3-5 5-5h4c2.7 0 5 2.2 5 5" />
    </svg>
  ),
  calculations: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
      <path d="M8 7h8" />
      <path d="M8 11h2" />
      <path d="M12 11h4" />
      <path d="M8 15h2" />
      <path d="M12 15h4" />
    </svg>
  ),
  medications: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 4h8" />
      <path d="M9 4v6" />
      <path d="M15 4v6" />
      <rect x="6" y="10" width="12" height="10" rx="2" />
      <path d="M10 15h4" />
    </svg>
  ),
  terminology: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20" />
      <path d="M6.5 4H20v16H6.5A2.5 2.5 0 0 0 4 22V6.5" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  ),
  procedures: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20l6-6" />
      <path d="M14 4l6 6" />
      <path d="M13 5l6 6" />
      <path d="M3 21l5-1 10-10-4-4L4 16l-1 5z" />
    </svg>
  ),
  notes: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M9 18h4" />
    </svg>
  ),
  pae: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </svg>
  ),
  urgency: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  triage: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 6h11" />
      <path d="M8 12h11" />
      <path d="M8 18h11" />
      <path d="M3.5 6h.01" />
      <path d="M3.5 12h.01" />
      <path d="M3.5 18h.01" />
    </svg>
  ),
  caces: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.6.4-1 .7-1.2 1.4" />
      <circle cx="12" cy="17" r="1" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  mental: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  history: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  reports: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  profile: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  ),
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Inicio",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: navIcons.dashboard },
      { label: "Caso en curso", href: "/simulator", requiresActiveCase: true, icon: navIcons.activeCase },
      { label: "Biblioteca clínica", href: "/topics", icon: navIcons.library },
      { label: "PAE asistido", href: "/pae-assistant", icon: navIcons.pae },
    ],
  },
  {
    title: "Simulación",
    items: [
      { label: "Simulador de patologías", href: "/medical-cases", icon: navIcons.pathologies },
      { label: "Simulador de trastornos mentales", href: "/cases", icon: navIcons.mental },
      { label: "Urgencias", href: "/emergency-simulator", icon: navIcons.urgency },
      { label: "Triage por carrera", href: "/triage-simulator", icon: navIcons.triage },
    ],
  },
  {
    title: "Diagnóstico",
    items: [
      { label: "Simulador de ECG", href: "/ecg-simulator", icon: navIcons.ecg },
      { label: "Simulador de ecografía", href: "/ultrasound-simulator", icon: navIcons.ultrasound },
      { label: "Laboratorio", href: "/laboratory", icon: navIcons.lab },
      { label: "Gasometría", href: "/gasometry", icon: navIcons.gasometry },
    ],
  },
  {
    title: "Avanzado",
    items: [
      { label: "Imágenes clínicas", href: "/clinical-images", icon: navIcons.images },
      { label: "RCP y algoritmos", href: "/rcp-algorithms", icon: navIcons.rcp },
      { label: "Simulador dinámico", href: "/dynamic-simulator", icon: navIcons.dynamic },
      { label: "Materno-infantil", href: "/materno-infantil", icon: navIcons.maternal },
    ],
  },
  {
    title: "Práctica clínica",
    items: [
      { label: "Cálculo clínico", href: "/clinical-calculations", icon: navIcons.calculations },
      { label: "Terminología médica", href: "/medical-terminology", icon: navIcons.terminology },
      { label: "Medicamentos", href: "/medications", icon: navIcons.medications },
      { label: "Procedimientos", href: "/procedures", icon: navIcons.procedures },
      { label: "Notas clínicas", href: "/clinical-notes", icon: navIcons.notes },
      { label: "PAE", href: "/pae", icon: navIcons.pae },
    ],
  },
  {
    title: "Seguimiento",
    items: [
      { label: "CACES", href: "/caces", icon: navIcons.caces },
      { label: "Mis sesiones", href: "/history", icon: navIcons.history },
      { label: "Reportes", href: "/reports", icon: navIcons.reports },
      { label: "Perfil", href: "/profile", icon: navIcons.profile },
    ],
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
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  const displayName = getProfileDisplayName(profile, "Usuario");
  const displayInitial = getProfileInitial(profile, "U");
  const displayRole = normalizeText(profile.role) || "Perfil por completar";

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

  useEffect(() => {
    let active = true;

    const refreshProfile = async () => {
      const storedProfile = readStoredProfile();
      let nextProfile = storedProfile ?? EMPTY_PROFILE;

      try {
        const { data } = await supabase.auth.getUser();
        const authProfile = extractProfileFromAuth(data.user);

        if (authProfile) {
          const nextUserId = normalizeText(authProfile.userId);
          const sameOwner =
            !storedProfile?.userId || !nextUserId || normalizeText(storedProfile.userId) === nextUserId;
          nextProfile = mergeProfiles(sameOwner ? storedProfile : EMPTY_PROFILE, authProfile);

          if (
            !storedProfile ||
            !sameOwner ||
            serializeComparableProfile(storedProfile) !== serializeComparableProfile(nextProfile)
          ) {
            nextProfile = persistProfile(nextProfile);
          }
        }
      } catch {
        // ignore auth sync failures
      }

      if (!active) return;

      setProfile(nextProfile);
    };

    const handleProfileEvent = () => {
      void refreshProfile();
    };

    void refreshProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshProfile();
    });

    window.addEventListener("storage", handleProfileEvent);
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileEvent);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleProfileEvent);
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileEvent);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    try {
      clearStoredProfile();
      localStorage.removeItem("activeCase");
      localStorage.removeItem("activeTranscript");
      localStorage.removeItem("sessionEnded");
      localStorage.removeItem("sessionEndedInfo");
      localStorage.removeItem("activeReport");
      PROFILE_KEYS.forEach((key) => sessionStorage.removeItem(key));
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
      <div className={compact ? "space-y-3" : "space-y-4"}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className={cn(compact ? "border-t border-[#1b2130]/6 pt-3 first:border-t-0 first:pt-0" : "")}>
            {!compact && (
              <div className="px-2 pb-2 text-[10px] font-semibold tracking-[0.14em] text-[#6d808a]">
                {section.title.toUpperCase()}
              </div>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const disabledCase = Boolean(item.requiresActiveCase) && !hasActiveCase;
                const href = disabledCase ? "/cases" : item.href;
                const isCacesItem = item.label === "CACES";
                const active = !disabledCase && (
                  isCacesItem
                    ? isCacesRoute
                    : pathname === item.href || pathname.startsWith(item.href + "/")
                );

                return (
                  <li key={`${section.title}::${item.href}::${item.label}`}>
                    <Link
                      href={href}
                      onClick={() => {
                        if (closeOnNavigate) setMobileOpen(false);
                      }}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                        active
                          ? "bg-[#6f95a0]/12 text-[#28414b]"
                          : disabledCase
                          ? "text-[#9cacb4] hover:bg-white/60 hover:text-[#71828b]"
                          : "text-[#526874] hover:bg-white/70 hover:text-[#17212A]"
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
                      <span className={cn("flex h-6 w-6 items-center justify-center", active ? "text-[#54747e]" : "text-[#718690]")}>
                        {item.icon}
                      </span>

                      {!compact && (
                        <span className={cn("min-w-0 flex-1 truncate", active ? "font-semibold" : "font-medium")}>
                          {item.label === "Caso en curso" && !hasActiveCase ? "Genera un caso" : item.label}
                        </span>
                      )}

                      {!compact && item.label === "Caso en curso" && hasActiveCase && (
                        <span className="ml-auto rounded-full bg-[#6f95a0] px-2 py-0.5 text-[10px] font-semibold text-white">1</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Link
        href="/profile"
        className="fixed right-3 top-3 z-40 hidden max-w-[calc(100vw-4.5rem)] items-center gap-3 rounded-2xl border border-[#1b2130]/10 bg-white/85 px-3 py-2 text-left shadow-[0_18px_55px_rgba(84,104,112,0.18)] backdrop-blur-xl max-md:flex"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6f95a0]/20 bg-[#6f95a0]/10 text-sm font-semibold text-[#4f6d77]">
          {displayInitial}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#6d808a]">Sesion activa</div>
          <div className="max-w-[180px] truncate text-sm font-semibold text-[#17212A]">{displayName}</div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1b2130]/10 bg-white/90 text-[#17212A] shadow-[0_12px_35px_rgba(84,104,112,0.18)] md:hidden"
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
          className="fixed inset-0 z-40 bg-[#17212A]/30 md:hidden"
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[304px] max-w-[88vw] border-r border-[#1b2130]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(240,246,244,0.96))] shadow-[0_30px_120px_rgba(84,104,112,0.22)] transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#1b2130]/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <PsykeLogo compact />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-[#1b2130]/10 bg-white/70 px-2 py-1 text-xs text-[#526874]"
            >
              Cerrar
            </button>
          </div>

          <div className="border-b border-[#1b2130]/10 px-4 py-4">
            <Link href="/profile" className="flex items-center gap-3 rounded-2xl border border-[#1b2130]/10 bg-white/72 px-3 py-3 shadow-[0_16px_30px_rgba(84,104,112,0.08)]">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[#6f95a0]/20 bg-[#6f95a0]/10 text-sm font-semibold text-[#4f6d77]">
                {displayInitial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[#17212A]">{displayName}</div>
                <div className="truncate text-xs text-[#6d808a]">{displayRole}</div>
              </div>
            </Link>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {renderNavItems({ closeOnNavigate: true })}
          </nav>

          <div className="border-t border-[#1b2130]/10 p-2">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                "text-[#526874] hover:bg-white/70 hover:text-[#17212A]"
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
            "h-full min-h-0 rounded-3xl border border-[#1b2130]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,246,244,0.95))] shadow-[0_30px_120px_rgba(84,104,112,0.18)]",
            "flex min-h-0 flex-col overflow-hidden",
            collapsed ? "w-[76px]" : "w-[292px]"
          )}
        >
          <div className={cn("flex items-center gap-3 border-b border-[#1b2130]/10 px-4 py-4", collapsed && "justify-center")}>
            <PsykeLogo compact markOnly={collapsed} showTagline={!collapsed} />
          </div>

          <div className="border-b border-[#1b2130]/10 px-3 py-4">
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-[#1b2130]/10 bg-white/72 shadow-[0_16px_30px_rgba(84,104,112,0.08)] transition hover:bg-white",
                collapsed ? "justify-center px-2 py-3" : "px-3 py-3"
              )}
              title={collapsed ? displayName : undefined}
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[#6f95a0]/20 bg-[#6f95a0]/10 text-sm font-semibold text-[#4f6d77]">
                {displayInitial}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#17212A]">{displayName}</div>
                  <div className="truncate text-xs text-[#6d808a]">{displayRole}</div>
                </div>
              )}
            </Link>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {renderNavItems({ compact: collapsed })}
          </nav>

          <div className="border-t border-[#1b2130]/10 p-2">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                "text-[#6d808a] hover:bg-white/70 hover:text-[#17212A]"
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
                "text-[#526874] hover:bg-white/70 hover:text-[#17212A]"
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
