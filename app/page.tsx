"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "../src/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type UserProfile = {
  fullName: string;
  cedula: string;
  phone: string;
  role: "Estudiante" | "Docente" | "Profesional" | "Otro";
  institution: string;
  city: string;
};

const PROFILE_KEY = "sim_profile_v1";

type CatalogItem = {
  id: string;
  title: string;
  description: string;
  chip: string; // Entrevista / Seguimiento / Crisis
  gradientClass: string;
};

const CATALOG: CatalogItem[] = [
  {
    id: "ansiedad",
    title: "Ansiedad",
    description:
      "Preocupación persistente, tensión, síntomas físicos. Practica contención y preguntas abiertas.",
    chip: "Entrevista",
    gradientClass: "from-cyan-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "depresion",
    title: "Depresión",
    description:
      "Ánimo bajo, anhedonia, fatiga. Practica exploración de riesgo y apoyo.",
    chip: "Seguimiento",
    gradientClass: "from-violet-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "panico",
    title: "Crisis de pánico",
    description:
      "Inicio súbito, miedo intenso, palpitaciones. Practica grounding y psicoeducación.",
    chip: "Crisis",
    gradientClass: "from-rose-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "tept",
    title: "TEPT",
    description:
      "Recuerdos intrusivos, hipervigilancia. Practica seguridad y enfoque gradual.",
    chip: "Entrevista",
    gradientClass: "from-amber-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "toc",
    title: "TOC",
    description:
      "Obsesiones y compulsiones. Practica clarificación sin reforzar rituales.",
    chip: "Entrevista",
    gradientClass: "from-sky-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "bipolar",
    title: "Trastorno bipolar",
    description:
      "Cambios de ánimo, posible hipomanía/manía. Practica evaluación de curso.",
    chip: "Seguimiento",
    gradientClass: "from-indigo-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "delirio",
    title: "Delirio / confusión",
    description:
      "Desorientación, ideas falsas. Practica reorientación y seguridad.",
    chip: "Crisis",
    gradientClass: "from-orange-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "sustancias",
    title: "Consumo de sustancias",
    description:
      "Uso problemático y ambivalencia. Practica entrevista motivacional.",
    chip: "Seguimiento",
    gradientClass: "from-emerald-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "tca",
    title: "TCA",
    description:
      "Relación con comida/imagen corporal. Practica enfoque no estigmatizante.",
    chip: "Entrevista",
    gradientClass: "from-fuchsia-500/20 via-slate-900/20 to-slate-950/20",
  },
  {
    id: "autolesion",
    title: "Ideación autolesiva (educativo)",
    description:
      "Señales de alarma y plan de seguridad. Practica derivación y contención.",
    chip: "Crisis",
    gradientClass: "from-red-500/20 via-slate-900/20 to-slate-950/20",
  },
];

function safeStr(v: any, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

export default function HomePage() {
  const router = useRouter();

  // --- auth status (para ocultar CTAs de login/registro si ya hay sesión) ---
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const sb = getSupabaseClient();
    if (!sb) return;

    (async () => {
      const { data } = await sb.auth.getSession();
      if (!alive) return;
      const email = data.session?.user?.email ?? "";
      setIsAuthed(Boolean(data.session));
      setUserEmail(email);
    })();

    const { data: sub } = sb.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const email = session?.user?.email ?? "";
        setIsAuthed(Boolean(session));
        setUserEmail(email);
      }
    );

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // --- Perfil (sidebar) ---
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    cedula: "",
    phone: "",
    role: "Estudiante",
    institution: "",
    city: "",
  });
  const [profileSavedAt, setProfileSavedAt] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw));
      const last = localStorage.getItem(PROFILE_KEY + "_savedAt");
      if (last) setProfileSavedAt(last);
    } catch {
      // ignore
    }
  }, []);

  function saveProfile() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      const when = new Date().toISOString();
      localStorage.setItem(PROFILE_KEY + "_savedAt", when);
      setProfileSavedAt(when);
    } catch {
      // ignore
    }
  }

  // --- Biblioteca / IA ---
  const [selectedCategory, setSelectedCategory] = useState<string>("depresion");
  const [search, setSearch] = useState<string>("");

  const [cfDifficulty, setCfDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner"
  );
  const [targetMinutes, setTargetMinutes] = useState<number>(8);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [caseObj, setCaseObj] = useState<any>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((c) =>
      (c.title + " " + c.description + " " + c.chip).toLowerCase().includes(q)
    );
  }, [search]);

  function prefillConfigFromCase(nextCase: any) {
    // Si el backend devuelve campos, los usamos para prellenar.
    // Mantenerlo suave para no romper si cambian los nombres.
    try {
      const difficulty = safeStr(nextCase?.difficulty, "");
      if (difficulty === "beginner" || difficulty === "intermediate" || difficulty === "advanced") {
        setCfDifficulty(difficulty);
      }
      const mins = nextCase?.target_minutes;
      if (typeof mins === "number" && mins >= 3 && mins <= 60) setTargetMinutes(mins);
    } catch {
      // ignore
    }
  }

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setCaseObj(null);

    // (Opcional) si quieres bloquear generación sin sesión
    if (!isAuthed) {
      setLoading(false);
      setError("Inicia sesión para generar casos.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/ai/generate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          difficulty: cfDifficulty,
          target_minutes: targetMinutes,
          include_educational_fields: true,
          language: "es",
          // Enviamos perfil (si existe) para que la IA lo adapte (sin datos sensibles obligatorios)
          user_profile: profile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "No se pudo generar el caso.");
      }

      setCaseObj(data);
      prefillConfigFromCase(data);

      // Guardar caso activo para /simulator
      try {
        localStorage.setItem("activeCase", JSON.stringify(data));
      } catch {
        // ignore
      }

      router.push("/simulator");
    } catch (e: any) {
      setError(e?.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function ProfileSidebar() {
    return (
      <aside className="w-[320px] shrink-0">
        <div className="sticky top-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/50">Perfil</div>
              <div className="mt-1 text-sm text-white/80">Completa tus datos para personalizar la práctica.</div>
            </div>

            <button
              onClick={saveProfile}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15"
            >
              Guardar
            </button>
          </div>

          {profileSavedAt ? (
            <div className="mt-2 text-[11px] text-white/40">Guardado: {new Date(profileSavedAt).toLocaleString()}</div>
          ) : (
            <div className="mt-2 text-[11px] text-white/40">Aún no has guardado cambios.</div>
          )}

          {isAuthed ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/50">Sesión</div>
              <div className="mt-1 text-sm text-white/80 break-all">{userEmail || "Usuario"}</div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-sm text-white/75">Inicia sesión para generar casos y guardar historial.</div>
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white/80 hover:bg-white/10"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white/80 hover:bg-white/10"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-white/55">Nombre completo</label>
              <input
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                placeholder="Ej: Ana Pérez"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/55">Cédula</label>
                <input
                  value={profile.cedula}
                  onChange={(e) => setProfile((p) => ({ ...p, cedula: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                  placeholder="CI"
                />
              </div>
              <div>
                <label className="text-xs text-white/55">Teléfono</label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                  placeholder="+593..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/55">Rol</label>
                <select
                  value={profile.role}
                  onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value as any }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                >
                  <option>Estudiante</option>
                  <option>Docente</option>
                  <option>Profesional</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/55">Ciudad</label>
                <input
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                  placeholder="Guayaquil"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/55">Institución</label>
              <input
                value={profile.institution}
                onChange={(e) => setProfile((p) => ({ ...p, institution: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                placeholder="Universidad / Hospital"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Link
              href="/history"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white/80 hover:bg-white/10"
            >
              Ver historial
            </Link>
          </div>

          <div className="mt-3 text-[11px] text-white/40">Tip: por ahora el perfil se guarda en tu navegador.</div>
        </div>
      </aside>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] px-6 pb-10 pt-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex gap-6">
          <ProfileSidebar />

          <section className="min-w-0 flex-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.55)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50">Antes de generar</div>
                  <h1 className="mt-1 text-xl md:text-2xl font-semibold">Elige un tema para practicar</h1>
                  <p className="mt-1 text-sm text-white/70">
                    Selecciona una temática y luego presiona “Generar caso (IA)”.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 md:w-[520px]">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar (ej. ansiedad, crisis, seguimiento...)"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none focus:border-white/20"
                  />

                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="flex-1">
                      <div className="text-xs text-white/50">Nivel</div>
                      <div className="mt-1 flex gap-2">
                        {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setCfDifficulty(lvl)}
                            className={
                              "rounded-full border px-3 py-1 text-xs transition " +
                              (cfDifficulty === lvl
                                ? "border-white/20 bg-white/15 text-white"
                                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                            }
                          >
                            {lvl === "beginner" ? "Básico" : lvl === "intermediate" ? "Intermedio" : "Avanzado"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full md:w-[160px]">
                      <div className="text-xs text-white/50">Minutos objetivo</div>
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={targetMinutes}
                        onChange={(e) => setTargetMinutes(Number(e.target.value || 0))}
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white/85 outline-none focus:border-white/20"
                      />
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className={
                        "w-full md:w-[180px] rounded-2xl px-4 py-3 text-sm font-medium transition " +
                        (loading
                          ? "bg-white/20 text-white/60"
                          : "bg-white text-black hover:bg-white/90")
                      }
                    >
                      {loading ? "Generando..." : "Generar caso (IA)"}
                    </button>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {filtered.map((item) => {
                  const selected = item.id === selectedCategory;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCategory(item.id)}
                      className={
                        "group text-left rounded-3xl border bg-gradient-to-br p-5 transition " +
                        item.gradientClass +
                        " " +
                        (selected
                          ? "border-white/25 ring-1 ring-white/15"
                          : "border-white/10 hover:border-white/20")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-white/90">{item.title}</div>
                          <div className="mt-1 text-sm text-white/70">{item.description}</div>
                        </div>
                        <div className={"mt-1 h-2 w-2 rounded-full " + (selected ? "bg-white" : "bg-white/35")} />
                      </div>

                      <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/75">
                        {item.chip}
                      </div>

                      {selected ? (
                        <div className="mt-3 text-xs text-white/60">Seleccionado</div>
                      ) : (
                        <div className="mt-3 text-xs text-white/50 group-hover:text-white/60">Seleccionar</div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-xs text-white/40">Seleccionado: {CATALOG.find((c) => c.id === selectedCategory)?.title ?? selectedCategory}</div>

              {/* para debug rápido si lo necesitas */}
              {caseObj ? (
                <details className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <summary className="cursor-pointer text-sm text-white/75">Ver último caso generado (debug)</summary>
                  <pre className="mt-3 overflow-auto text-xs text-white/70">{JSON.stringify(caseObj, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}