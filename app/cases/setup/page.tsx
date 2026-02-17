"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

export default function SetupPage() {
  const router = useRouter();
  const [caseObj, setCaseObj] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSetup, setShowSetup] = useState(false);
  const [mode, setMode] = useState<"training" | "assessment">("training");
  const [avatarStyle, setAvatarStyle] = useState<"2d" | "3d">("2d");

  // Ajustes del caso (override) — se aplican sobre el JSON generado antes de iniciar
  const [patientName, setPatientName] = useState<string>("");
  const [patientSex, setPatientSex] = useState<"female" | "male" | "nonbinary" | "unspecified">(
    "unspecified"
  );
  const [patientAge, setPatientAge] = useState<number>(25);
  const [caseContext, setCaseContext] = useState<string>("");

  // Parámetros educativos (override)
  const [chiefComplaint, setChiefComplaint] = useState<string>("");
  const [learningObjective, setLearningObjective] = useState<string>("");
  const [difficulty, setDifficulty] = useState<number>(2);

  const meta = asRecord(caseObj?.meta) ?? {};
  const metaTitle = (meta.title as string | undefined) ?? "Caso generado";
  const metaDescription = (meta.description as string | undefined) ?? "Descripción del caso.";

  const outFirst = (...vals: unknown[]) => {
    for (const v of vals) {
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (s) return v;
    }
    return "";
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sim_case");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setCaseObj(parsed);

      // Prefill desde el caso (si existe)
      const p = parsed?.patient_profile ?? {};
      const meta = parsed?.meta ?? {};

      setPatientName(String(p.display_name ?? ""));

      const sexRaw = String(p.sex ?? "").toLowerCase();
      if (sexRaw === "female" || sexRaw === "f" || sexRaw === "mujer") setPatientSex("female");
      else if (sexRaw === "male" || sexRaw === "m" || sexRaw === "hombre") setPatientSex("male");
      else if (sexRaw === "nonbinary" || sexRaw === "nb" || sexRaw === "no binario")
        setPatientSex("nonbinary");
      else setPatientSex("unspecified");

      const ageNum = Number(p.age);
      setPatientAge(Number.isFinite(ageNum) && ageNum > 0 ? ageNum : 25);

      setCaseContext(String(p.context ?? meta.description ?? ""));

      // Prefill parámetros educativos
      setChiefComplaint(String(outFirst(meta?.chief_complaint, parsed?.chief_complaint, "")));
      setLearningObjective(String(outFirst(meta?.learning_objective, parsed?.learning_objective, "")));

      const dRaw = Number(outFirst(meta?.difficulty, p?.difficulty, parsed?.difficulty, meta?.level, 2));
      setDifficulty(Number.isFinite(dRaw) && dRaw >= 1 && dRaw <= 3 ? dRaw : 2);
    } catch {}
  }, []);

  function handleGenerate() {
    setLoading(true);
    setError(null);
    // fetch or generate the case here...
    // After success:
    // setCaseObj(generatedCase);
    setLoading(false);
  }

  function persistSetup() {
    try {
      sessionStorage.setItem("sim_setup", JSON.stringify({ mode, avatarStyle }));
    } catch {}
  }

  function applyCaseOverrides(base: Record<string, unknown> | null) {
    if (!base) return base;
    // Clonado simple para evitar mutaciones accidentales
    const out = JSON.parse(JSON.stringify(base));

    out.patient_profile = out.patient_profile ?? {};
    out.meta = out.meta ?? {};

    // Nombre
    const cleanName = patientName.trim();
    if (cleanName) out.patient_profile.display_name = cleanName;

    // Sexo
    if (patientSex !== "unspecified") out.patient_profile.sex = patientSex;
    else delete out.patient_profile.sex;

    // Edad
    const cleanAge = Number(patientAge);
    if (Number.isFinite(cleanAge) && cleanAge > 0) out.patient_profile.age = cleanAge;

    // Contexto (lo guardamos tanto en patient_profile como en meta.description para que el UI lo muestre)
    const cleanCtx = caseContext.trim();
    if (cleanCtx) {
      out.patient_profile.context = cleanCtx;
      out.meta.description = cleanCtx;
    }

    // Parámetros educativos
    const cc = chiefComplaint.trim();
    const lo = learningObjective.trim();
    const d = Number(difficulty);

    if (cc) {
      out.meta.chief_complaint = cc;
      // también lo ponemos en patient_profile para que sea fácil de leer desde otras pantallas
      out.patient_profile.chief_complaint = cc;
    } else {
      delete out.meta.chief_complaint;
      delete out.patient_profile.chief_complaint;
    }

    if (lo) {
      out.meta.learning_objective = lo;
    } else {
      delete out.meta.learning_objective;
    }

    if (Number.isFinite(d) && d >= 1 && d <= 3) {
      out.meta.difficulty = d;
      // compat: si tu UI lee meta.difficulty o patient_profile.difficulty
      out.patient_profile.difficulty = d;
    }

    return out;
  }

  function persistOverrides() {
    try {
      sessionStorage.setItem(
        "sim_case_overrides",
        JSON.stringify({
          patientName,
          patientSex,
          patientAge,
          caseContext,
          chiefComplaint,
          learningObjective,
          difficulty,
        })
      );
    } catch {}
  }

  function startInterviewFromModal() {
    if (!caseObj) return;
    persistSetup();
    persistOverrides();

    const merged = applyCaseOverrides(caseObj);

    try {
      sessionStorage.setItem("sim_case", JSON.stringify(merged));
    } catch {}

    setShowSetup(false);
    router.push("/simulator");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Paso 1: Generar caso (IA)</h1>

        {!caseObj && (
          <div className="mt-6">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              {loading ? "Generando..." : "Generar caso"}
            </button>
            {error && <p className="mt-2 text-red-500">{error}</p>}
          </div>
        )}

        {caseObj && (
          <>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">{metaTitle}</h2>
              <p className="mt-2 text-white/70">{metaDescription}</p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSetup(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Configurar
                </button>

                <button
                  onClick={handleGenerate}
                  className="rounded-xl border border-white/20 bg-black/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/5"
                >
                  Generar otro caso
                </button>
              </div>
            </div>

            {showSetup && caseObj && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
                <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Configurar entrevista</h2>
                      <p className="mt-1 text-sm text-white/60">
                        Ajusta paciente, objetivo y modo antes de iniciar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSetup(false)}
                      className="shrink-0 rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* Paciente */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-sm text-white/60">Paciente</div>

                      <label className="mt-3 block text-sm text-white/70">Nombre</label>
                      <input
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Ej: Ana"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                      />

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-white/70">Sexo</label>
                          <select
                            value={patientSex}
                            onChange={(e) =>
                              setPatientSex(
                                e.target.value as "female" | "male" | "nonbinary" | "unspecified"
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-white/30"
                          >
                            <option value="unspecified">No especificar</option>
                            <option value="female">Femenino</option>
                            <option value="male">Masculino</option>
                            <option value="nonbinary">No binario</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-white/70">Edad</label>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={patientAge}
                            onChange={(e) => setPatientAge(Number(e.target.value || 0))}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                          />
                        </div>
                      </div>

                      <label className="mt-4 block text-sm text-white/70">Contexto breve</label>
                      <textarea
                        value={caseContext}
                        onChange={(e) => setCaseContext(e.target.value)}
                        rows={4}
                        placeholder="Ej: Lleva semanas con insomnio y palpitaciones tras estrés laboral..."
                        className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                      />

                      <p className="mt-3 text-xs text-white/50">
                        Tip: esto no “diagnostica”; solo define el escenario para practicar la entrevista.
                      </p>

                      <div className="mt-5 border-t border-white/10 pt-4">
                        <div className="text-sm text-white/60">Parámetros educativos</div>

                        <label className="mt-3 block text-sm text-white/70">Motivo de consulta (1 línea)</label>
                        <input
                          value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          placeholder="Ej: ‘Ansiedad intensa y palpitaciones desde hace 2 semanas’"
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />

                        <label className="mt-4 block text-sm text-white/70">Objetivo de aprendizaje</label>
                        <input
                          value={learningObjective}
                          onChange={(e) => setLearningObjective(e.target.value)}
                          placeholder="Ej: ‘Practicar preguntas abiertas y validación emocional’"
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />

                        <label className="mt-4 block text-sm text-white/70">Dificultad</label>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => setDifficulty(1)}
                            className={`rounded-xl px-3 py-3 text-sm font-medium ${
                              difficulty === 1
                                ? "bg-white text-black"
                                : "border border-white/20 bg-black/30 text-white hover:bg-white/5"
                            }`}
                          >
                            1 · Básica
                          </button>
                          <button
                            type="button"
                            onClick={() => setDifficulty(2)}
                            className={`rounded-xl px-3 py-3 text-sm font-medium ${
                              difficulty === 2
                                ? "bg-white text-black"
                                : "border border-white/20 bg-black/30 text-white hover:bg-white/5"
                            }`}
                          >
                            2 · Media
                          </button>
                          <button
                            type="button"
                            onClick={() => setDifficulty(3)}
                            className={`rounded-xl px-3 py-3 text-sm font-medium ${
                              difficulty === 3
                                ? "bg-white text-black"
                                : "border border-white/20 bg-black/30 text-white hover:bg-white/5"
                            }`}
                          >
                            3 · Avanzada
                          </button>
                        </div>

                        <p className="mt-3 text-xs text-white/50">
                          Esto guía el enfoque del caso y lo que se evalúa, sin convertirlo en diagnóstico.
                        </p>
                      </div>
                    </div>
                    {/* Columna derecha: Modo + Avatar */}
                    <div className="grid gap-6">
                      {/* Modo */}
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="text-sm text-white/60">Modo</div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setMode("training")}
                            className={`w-full rounded-xl px-4 py-3 text-sm font-medium ${
                              mode === "training"
                                ? "bg-white text-black"
                                : "border border-white/20 bg-black/30 text-white hover:bg-white/5"
                            }`}
                          >
                            Entrenamiento
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode("assessment")}
                            className={`w-full rounded-xl px-4 py-3 text-sm font-medium ${
                              mode === "assessment"
                                ? "bg-white text-black"
                                : "border border-white/20 bg-black/30 text-white hover:bg-white/5"
                            }`}
                          >
                            Evaluación
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-white/60">
                          Entrenamiento te guía; Evaluación te puntúa al final.
                        </p>
                      </div>

                      {/* Avatar */}
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="text-sm text-white/60">Avatar</div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setAvatarStyle("2d")}
                            className={`w-full rounded-xl px-4 py-3 text-sm font-medium ${
                              avatarStyle === "2d"
                                ? "bg-white text-black"
                                : "border border-white/20 bg-black/30 text-white hover:bg-white/5"
                            }`}
                          >
                            2D simple
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarStyle("3d")}
                            className={`w-full rounded-xl px-4 py-3 text-sm font-medium ${
                              avatarStyle === "3d"
                                ? "bg-white text-black"
                                : "border border-white/20 bg-black/30 text-white hover:bg-white/5"
                            }`}
                          >
                            3D simple
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-white/60">
                          El avatar es visual; la entrevista es el núcleo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={startInterviewFromModal}
                      className="w-full rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 sm:w-auto"
                    >
                      Guardar cambios y comenzar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSetup(false)}
                      className="w-full rounded-xl border border-white/20 bg-black/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/5 sm:w-auto"
                    >
                      Seguir revisando caso
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
