"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Sidebar from "../../components/Sidebar";
import { getHistory, type SessionRecord } from "../../lib/history";
import { supabase } from "@/src/lib/supabaseClient";
import {
  EMPTY_PROFILE,
  PROFILE_KEYS,
  clearStoredProfile,
  extractProfileFromAuth,
  mergeProfiles,
  normalizeProfile,
  normalizeText,
  persistProfile,
  readStoredProfile,
  serializeComparableProfile,
  type UserProfile as Profile,
} from "@/src/lib/userProfile";

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
};

function formatLastUpdate(value?: string) {
  if (!value) return "Aun no guardado";
  try {
    return new Date(value).toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function formatLastSession(session?: SessionRecord) {
  if (!session) return "Sin sesiones registradas";
  try {
    return new Date(session.endedAt).toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return session.endedAt;
  }
}

function getNoticeClass(tone: Notice["tone"]) {
  if (tone === "success") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (tone === "error") return "border-red-400/25 bg-red-400/10 text-red-100";
  return "border-sky-400/25 bg-sky-400/10 text-sky-100";
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<Profile>(EMPTY_PROFILE);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [authDetected, setAuthDetected] = useState(false);

  useEffect(() => {
    const refreshHistory = () => {
      setHistory(getHistory());
    };

    const loadProfile = async () => {
      let nextProfile = EMPTY_PROFILE;
      let storedProfile: Profile | null = null;

      try {
        storedProfile = readStoredProfile();
        if (storedProfile) nextProfile = mergeProfiles(storedProfile, nextProfile);
      } catch {
        setNotice({
          tone: "error",
          message: "No se pudieron leer los datos guardados del perfil.",
        });
      }

      try {
        const { data } = await supabase.auth.getUser();
        const authProfile = extractProfileFromAuth(data.user);

        if (authProfile) {
          setAuthDetected(true);
          nextProfile = mergeProfiles(nextProfile, authProfile);

          if (!storedProfile || serializeComparableProfile(storedProfile) !== serializeComparableProfile(nextProfile)) {
            nextProfile = persistProfile(nextProfile);
          }
        }
      } catch {
        setAuthDetected(false);
      }

      setProfile(nextProfile);
      setDraft(nextProfile);
      setReady(true);
    };

    refreshHistory();
    loadProfile();

    window.addEventListener("storage", refreshHistory);
    return () => {
      window.removeEventListener("storage", refreshHistory);
    };
  }, []);

  const stats = useMemo(() => {
    const completedFields = [draft.name, draft.email, draft.role, draft.career].filter((value) =>
      normalizeText(value).length > 0
    ).length;
    const totalSessions = history.length;
    const avgRapport =
      totalSessions === 0
        ? 0
        : Math.round(
            history.reduce((acc, item) => acc + (Number(item.lastMeta?.rapport ?? 0) || 0), 0) /
              totalSessions
          );

    return {
      completion: Math.round((completedFields / 4) * 100),
      totalSessions,
      avgRapport,
      latestSession: history[0],
    };
  }, [draft, history]);

  const displayName = normalizeText(draft.name) || "Usuario";
  const displayEmail = normalizeText(draft.email) || "Sin correo configurado";
  const displayRole = normalizeText(draft.role) || "Define tu rol academico";
  const displayCareer = normalizeText(draft.career) || "Completa tu carrera o programa";
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const hasChanges = serializeComparableProfile(draft) !== serializeComparableProfile(profile);

  const handleFieldChange =
    (field: keyof Profile) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDraft((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();

    const normalized = normalizeProfile(draft);
    if (!normalized.name) {
      setNotice({
        tone: "error",
        message: "Agrega al menos tu nombre para guardar el perfil.",
      });
      return;
    }

    if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      setNotice({
        tone: "error",
        message: "El correo no tiene un formato valido.",
      });
      return;
    }

    try {
      const saved = persistProfile(normalized);
      setProfile(saved);
      setDraft(saved);
      setNotice({
        tone: "success",
        message: "Perfil actualizado y guardado localmente.",
      });
    } catch {
      setNotice({
        tone: "error",
        message: "No se pudo guardar el perfil en este navegador.",
      });
    }
  };

  const handleReset = () => {
    setDraft(profile);
    setNotice({
      tone: "info",
      message: "Se restauraron los datos guardados actualmente.",
    });
  };

  const handleLoadDemo = () => {
    const demo = persistProfile({
      userId: profile.userId,
      name: "Favio Mendoza",
      email: "favio@psyke.academy",
      role: "Estudiante",
      career: "Enfermeria clinica",
    });

    setProfile(demo);
    setDraft(demo);
    setNotice({
      tone: "success",
      message: "Se cargo un perfil demo para revisar la interfaz.",
    });
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    const keys = [
      "activeCase",
      "activeTranscript",
      "lastEmotion",
      "sessionEnded",
      "sessionEndedInfo",
      "activeReport",
    ];

    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    clearStoredProfile();
    PROFILE_KEYS.forEach((key) => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    });

    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1520px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,16,24,0.96),rgba(6,9,14,0.92))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.08),transparent_30%)]" />

          <div className="relative space-y-6">
            <section className="flex flex-col gap-5 rounded-[26px] border border-white/10 bg-white/[0.03] p-5 sm:p-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100">
                  Perfil profesional
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-[2.1rem]">
                  Cuenta, progreso y configuracion personal
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-[15px]">
                  Mantiene tus datos listos para el simulador, la biblioteca y el seguimiento academico.
                  Esta version ya permite editar y conservar tu perfil desde el navegador.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 2xl:max-w-[360px] 2xl:justify-end">
                <Link
                  href="/history"
                  className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
                >
                  Ver historial
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
                >
                  Ir al dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Cerrar sesion
                </button>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.14fr)_340px] 2xl:grid-cols-[minmax(0,1.2fr)_360px]">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,24,39,0.88),rgba(12,18,30,0.66))]">
                <div className="flex flex-col gap-6 p-5 sm:p-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.28),rgba(15,23,42,0.95))] text-3xl font-semibold text-white shadow-[0_20px_50px_rgba(14,165,233,0.12)]">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                        Identidad
                      </div>
                      <div className="mt-2 text-2xl font-semibold leading-tight text-white break-words">{displayName}</div>
                      <div className="mt-1 text-sm text-white/60 break-all">{displayEmail}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                          {authDetected ? "Cuenta detectada" : "Modo local"}
                        </span>
                      </div>
                      <div className="mt-3 text-xs leading-5 text-white/52">
                        Ultima actualizacion: {formatLastUpdate(profile.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:w-full 2xl:max-w-[430px] 2xl:self-start 2xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Completitud</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{stats.completion}%</div>
                      <div className="mt-3 h-2 rounded-full bg-white/8">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#38BDF8,#22C55E)]"
                          style={{ width: `${stats.completion}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Sesiones</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{stats.totalSessions}</div>
                      <div className="mt-2 text-xs text-white/55">Casos almacenados localmente</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2 xl:col-span-1 2xl:col-span-2">
                      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Rapport medio</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{stats.avgRapport}/100</div>
                      <div className="mt-2 text-xs text-white/55">Promedio de tus sesiones guardadas</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                      Estado de cuenta
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-white">Resumen rapido</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/65">
                    {ready ? "Listo" : "Cargando"}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/45">Rol actual</div>
                    <div className="mt-1 text-sm font-medium text-white/88">{displayRole}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/45">Programa o carrera</div>
                    <div className="mt-1 text-sm font-medium text-white/88">{displayCareer}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/45">Ultima sesion</div>
                    <div className="mt-1 text-sm font-medium text-white/88">
                      {formatLastSession(stats.latestSession)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/simulator"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/10"
                  >
                    Abrir simulador
                  </Link>
                  <Link
                    href="/topics"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/10"
                  >
                    Biblioteca clinica
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <form
                onSubmit={handleSave}
                className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                      Datos personales
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-white">Editar perfil</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                      Guarda aqui la identidad que quieres ver en el ecosistema de Psyke. Si detectamos
                      datos de tu cuenta, los usamos como base inicial.
                    </p>
                  </div>
                  <div className="text-xs text-white/45">
                    {hasChanges ? "Tienes cambios pendientes" : "Sin cambios pendientes"}
                  </div>
                </div>

                {notice ? (
                  <div
                    aria-live="polite"
                    className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${getNoticeClass(notice.tone)}`}
                  >
                    {notice.message}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/72">Nombre completo</span>
                    <input
                      type="text"
                      value={draft.name ?? ""}
                      onChange={handleFieldChange("name")}
                      disabled={!ready}
                      placeholder="Ej. Favio Mendoza"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-sky-300/35 focus:bg-black/25 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/72">Correo</span>
                    <input
                      type="email"
                      value={draft.email ?? ""}
                      onChange={handleFieldChange("email")}
                      disabled={!ready}
                      placeholder="correo@institucion.edu"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-sky-300/35 focus:bg-black/25 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/72">Rol academico</span>
                    <input
                      type="text"
                      value={draft.role ?? ""}
                      onChange={handleFieldChange("role")}
                      disabled={!ready}
                      placeholder="Estudiante, docente, coordinador..."
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-sky-300/35 focus:bg-black/25 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/72">Carrera o programa</span>
                    <input
                      type="text"
                      value={draft.career ?? ""}
                      onChange={handleFieldChange("career")}
                      disabled={!ready}
                      placeholder="Enfermeria, medicina, salud mental..."
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-sky-300/35 focus:bg-black/25 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={!ready}
                    className="rounded-2xl bg-[linear-gradient(135deg,#38BDF8,#2563EB)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(37,99,235,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!ready || !hasChanges}
                    className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/82 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Restaurar
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    disabled={!ready}
                    className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/82 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Cargar demo
                  </button>
                </div>
              </form>

              <aside className="space-y-5">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                    Persistencia
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-white">Como funciona</h2>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/62">
                    <p>
                      El perfil se guarda en este navegador para que la experiencia siga siendo util aunque
                      Auth o Supabase aun no esten conectados del todo.
                    </p>
                    <p>
                      Si ya existe una sesion autenticada, usamos esos datos como base y luego puedes
                      refinarlos manualmente desde aqui.
                    </p>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                    Acciones
                  </div>
                  <div className="mt-4 space-y-3">
                    <Link
                      href="/results"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white/84 transition hover:bg-white/8"
                    >
                      Revisar resultados
                      <span className="text-white/35">/</span>
                    </Link>
                    <Link
                      href="/reports"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white/84 transition hover:bg-white/8"
                    >
                      Abrir reportes
                      <span className="text-white/35">/</span>
                    </Link>
                    <Link
                      href="/cases"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-white/84 transition hover:bg-white/8"
                    >
                      Casos clinicos
                      <span className="text-white/35">/</span>
                    </Link>
                  </div>
                </div>
              </aside>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
