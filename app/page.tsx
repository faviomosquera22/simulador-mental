"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../src/lib/supabaseClient";

type UserProfile = {
  fullName: string;
  cedula: string;
  phone: string;
  role: "Estudiante" | "Docente" | "Profesional" | "Otro";
  institution: string;
  city: string;
};

type CatalogItem = {
  id: string;
  title: string;
  description: string;
  chip: string; // Entrevista / Seguimiento / Crisis
  gradientClass: string;
};

const PROFILE_KEY = "sim_profile_v1";

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
    gradientClass: "from-teal-500/20 via-slate-900/20 to-slate-950/20",
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
    id: "autolesiva",
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

export default function CasesPage() {
  const router = useRouter();

  // ---- auth guard ----
  const [userEmail, setUserEmail] = useState<string>("");
  const [isAuthed, setIsAuthed] = useState(false);

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
      if (!data.session) router.replace("/");
    })();

    const { data: sub } = sb.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const email = session?.user?.email ?? "";
        setIsAuthed(Boolean(session));
        setUserEmail(email);
        if (!session) router.replace("/");
      }
    );

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  // ---- profile (sidebar) ----
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    cedula: "",
    phone: "",
    role: "Estudiante",
    institution: "",
    city: "",
  });
  const [profileSavedAt, setProfileSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile((p) => ({ ...p, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  function saveProfile() {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setProfileSavedAt(Date.now());
    } catch {
      // ignore
    }
  }

  // ---- library state ----
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("general");
  const [cfgDifficulty, setCfgDifficulty] = useState<"basico" | "intermedio" | "avanzado">(
    "basico"
  );
  const [cfgTargetMinutes, setCfgTargetMinutes] = useState<number>(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((c) =>
      [c.title, c.description, c.chip].some((x) => x.toLowerCase().includes(q))
    );
  }, [query]);

  async function handleGenerate() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/generate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          difficulty: cfgDifficulty,
          target_minutes: cfgTargetMinutes,
          include_educational_fields: true,
          language: "es",
        }),
      });

      const data: any = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          safeStr(data?.detail) || safeStr(data?.error) || "No se pudo generar el caso."
        );
      }

      // Guardar caso activo para /simulator
      localStorage.setItem("activeCase", JSON.stringify(data));

      // NOTA: no mandar a resultados aquí.
      router.push("/simulator");
    } catch (e: any) {
      setError(e?.message || "Error al generar el caso");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthed) {
    // mientras redirige, evitamos flash de UI
    return <main className="min-h-screen" />;
  }

  return (
    <main className="min-h-[calc(100vh-72px)] px-6 pb-10 pt-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Sidebar Perfil */}
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/50">Perfil</div>
                <div className="mt-1 text-sm text-white/70">
                  Completa tus datos para personalizar la práctica.
                </div>
              </div>
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/85 hover:bg-white/10"
              >
                Guardar
              </button>
            </div>

            {profileSavedAt ? (
              <div className="mt-2 text-xs text-white/40">Guardado hace un momento.</div>
            ) : (
              <div className="mt-2 text-xs text-white/40">Aún no has guardado cambios.</div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs text-white/50">Sesión</div>
                <div className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">
                  {userEmail || "Usuario"}
                </div>
              </div>

              <div>
                <div className="text-xs text-white/50">Nombre completo</div>
                <input
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Ej: Ana Pérez"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85 placeholder:text-white/35"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-white/50">Cédula</div>
                  <input
                    value={profile.cedula}
                    onChange={(e) => setProfile((p) => ({ ...p, cedula: e.target.value }))}
                    placeholder="CI"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85 placeholder:text-white/35"
                  />
                </div>
                <div>
                  <div className="text-xs text-white/50">Teléfono</div>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+593..."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85 placeholder:text-white/35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-white/50">Rol</div>
                  <select
                    value={profile.role}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, role: e.target.value as UserProfile["role"] }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85"
                  >
                    <option>Estudiante</option>
                    <option>Docente</option>
                    <option>Profesional</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-white/50">Ciudad</div>
                  <input
                    value={profile.city}
                    onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Guayaquil"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85 placeholder:text-white/35"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-white/50">Institución</div>
                <input
                  value={profile.institution}
                  onChange={(e) => setProfile((p) => ({ ...p, institution: e.target.value }))}
                  placeholder="Universidad / Hospital"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85 placeholder:text-white/35"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/results")}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  Ver historial
                </button>
                <div className="mt-2 text-[11px] text-white/35">
                  Tip: por ahora el perfil se guarda en tu navegador.
                </div>
              </div>
            </div>
          </aside>

          {/* Main: Biblioteca de casos */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/50">Antes de generar</div>
                <h1 className="mt-1 text-2xl font-semibold text-white">Elige un tema para practicar</h1>
                <p className="mt-1 text-sm text-white/60">
                  Selecciona una temática y luego presiona “Generar caso (IA)”.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 md:w-[520px]">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar (ej. ansiedad, crisis, seguimiento...)"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85 placeholder:text-white/35"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-white/50">Nivel</span>
                  <button
                    type="button"
                    onClick={() => setCfgDifficulty("basico")}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      cfgDifficulty === "basico"
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Básico
                  </button>
                  <button
                    type="button"
                    onClick={() => setCfgDifficulty("intermedio")}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      cfgDifficulty === "intermedio"
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Intermedio
                  </button>
                  <button
                    type="button"
                    onClick={() => setCfgDifficulty("avanzado")}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      cfgDifficulty === "avanzado"
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Avanzado
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-white/50">Minutos objetivo</span>
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={cfgTargetMinutes}
                      onChange={(e) => setCfgTargetMinutes(Number(e.target.value) || 8)}
                      className="w-20 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85"
                    />
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={loading}
                      className="rounded-2xl bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-60"
                    >
                      {loading ? "Generando…" : "Generar caso (IA)"}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => {
                const selected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition ${
                      selected
                        ? "border-white/25 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.gradientClass}`} />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-white">{c.title}</div>
                          <div className="mt-2 text-sm text-white/65">{c.description}</div>
                        </div>
                        <div
                          className={`h-2 w-2 rounded-full ${
                            selected ? "bg-white" : "bg-white/35 group-hover:bg-white/60"
                          }`}
                        />
                      </div>

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs text-white/75">
                        {c.chip}
                      </div>

                      <div className="mt-4 text-xs text-white/45">
                        {selected ? "Seleccionado" : "Seleccionar"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-xs text-white/35">
              Nota: los casos son ficticios. Si aparece contenido sensible, el sistema responde en modo educativo.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}