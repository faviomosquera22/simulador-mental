"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/Sidebar";
import {
  MEDICAL_TERMINOLOGY_CATEGORIES,
  MEDICAL_TERMINOLOGY_LIBRARY,
  type MedicalTerminologyCategory,
} from "@/src/lib/medicalTerminologyLibrary";

type CategoryFilter = MedicalTerminologyCategory | "Todas";
type PracticeTone = "idle" | "success" | "error";
type PracticeScope = "solo_terminos" | "incluye_afijos";

function normalizeTerm(value: string) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTermKind(item: (typeof MEDICAL_TERMINOLOGY_LIBRARY)[number]) {
  if (item.term.endsWith("-")) return "prefijo";
  if (item.term.startsWith("-")) return "sufijo";
  return "termino";
}

function isWordPartItem(item: (typeof MEDICAL_TERMINOLOGY_LIBRARY)[number]) {
  return getTermKind(item) !== "termino" || item.related.includes("Prefijos y sufijos");
}

function simplifyDefinition(item: (typeof MEDICAL_TERMINOLOGY_LIBRARY)[number]) {
  const kind = getTermKind(item);
  if (kind === "prefijo") {
    return item.definition.replace(/^Prefijo que indica\s*/i, "").replace(/[.]+$/u, "").trim();
  }
  if (kind === "sufijo") {
    return item.definition.replace(/^Sufijo que indica\s*/i, "").replace(/[.]+$/u, "").trim();
  }
  return item.definition;
}

function getPracticeHelper(item: (typeof MEDICAL_TERMINOLOGY_LIBRARY)[number]) {
  const kind = getTermKind(item);
  if (kind === "prefijo") {
    return "Es una partícula que va al inicio de una palabra médica. Escríbela con el guion final.";
  }
  if (kind === "sufijo") {
    return "Es una partícula que va al final de una palabra médica. Escríbela con el guion inicial.";
  }
  return "Corresponde a un término clínico completo, no a un prefijo o sufijo.";
}

export default function MedicalTerminologyPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("Todas");
  const [activeId, setActiveId] = useState<string>(MEDICAL_TERMINOLOGY_LIBRARY[0]?.id ?? "");
  const [practiceId, setPracticeId] = useState<string>(MEDICAL_TERMINOLOGY_LIBRARY[0]?.id ?? "");
  const [practiceScope, setPracticeScope] = useState<PracticeScope>("solo_terminos");
  const [attempt, setAttempt] = useState("");
  const [practiceTone, setPracticeTone] = useState<PracticeTone>("idle");
  const [practiceMessage, setPracticeMessage] = useState("Lee la definición y escribe el término correcto.");
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDICAL_TERMINOLOGY_LIBRARY.filter((item) => {
      if (category !== "Todas" && item.category !== category) return false;
      if (!q) return true;

      const haystack = [
        item.term,
        item.short,
        item.category,
        item.definition,
        item.clinicalUse,
        item.example,
        ...item.related,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [category, query]);

  const practicePool = useMemo(() => {
    const base = filtered.length ? filtered : MEDICAL_TERMINOLOGY_LIBRARY;
    if (practiceScope === "incluye_afijos") return base;
    return base.filter((item) => !isWordPartItem(item));
  }, [filtered, practiceScope]);

  const active = useMemo(() => {
    return filtered.find((item) => item.id === activeId) ?? filtered[0] ?? MEDICAL_TERMINOLOGY_LIBRARY[0];
  }, [activeId, filtered]);

  const practiceItem = useMemo(() => {
    if (!practicePool.length) return undefined;
    return practicePool.find((item) => item.id === practiceId) ?? practicePool[0];
  }, [practicePool, practiceId]);

  useEffect(() => {
    if (!practicePool.length) {
      setPracticeId("");
      return;
    }

    if (!practicePool.some((item) => item.id === practiceId)) {
      setPracticeId(practicePool[0].id);
      setAttempt("");
      setPracticeTone("idle");
      setPracticeMessage("Lee la definición y escribe el término correcto.");
      setShowAnswer(false);
    }
  }, [practicePool, practiceId]);

  const stats = useMemo(
    () => ({
      total: MEDICAL_TERMINOLOGY_LIBRARY.length,
      pharmacology: MEDICAL_TERMINOLOGY_LIBRARY.filter((item) => item.category === "Farmacología").length,
      pathologies: MEDICAL_TERMINOLOGY_LIBRARY.filter((item) => item.category === "Patologías").length,
    }),
    []
  );

  function loadNextPractice(excludeId?: string) {
    const pool = practicePool.length ? practicePool : MEDICAL_TERMINOLOGY_LIBRARY.filter((item) => !isWordPartItem(item));
    if (!pool.length) return;

    const candidates = pool.filter((item) => item.id !== excludeId);
    const nextPool = candidates.length ? candidates : pool;
    const next = nextPool[Math.floor(Math.random() * nextPool.length)] ?? nextPool[0];

    setPracticeId(next.id);
    setAttempt("");
    setPracticeTone("idle");
    setPracticeMessage("Lee la definición y escribe el término correcto.");
    setShowAnswer(false);
  }

  function checkPracticeAnswer() {
    if (!practiceItem) return;

    const normalizedAttempt = normalizeTerm(attempt);
    if (!normalizedAttempt) {
      setPracticeTone("error");
      setPracticeMessage("Escribe una respuesta antes de validar.");
      return;
    }

    setAttemptCount((value) => value + 1);

    if (normalizedAttempt === normalizeTerm(practiceItem.term)) {
      setCorrectCount((value) => value + 1);
      setPracticeTone("success");
      setPracticeMessage(`Correcto. ${practiceItem.term} se usa cuando ${practiceItem.clinicalUse}`);
      setShowAnswer(true);
      return;
    }

    setPracticeTone("error");
    setPracticeMessage(`No corresponde. La respuesta correcta es ${practiceItem.term}. ${practiceItem.example}`);
    setShowAnswer(true);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4faf8_0%,#edf4f1_48%,#e4efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Terminología médica</h1>
              <p className="mt-1 text-sm text-slate-600">
                Glosario rápido para reforzar lenguaje clínico, farmacología básica y conceptos de patologías.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-700">
                  Términos: {stats.total}
                </span>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-emerald-700">
                  Farmacología: {stats.pharmacology}
                </span>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                  Patologías: {stats.pathologies}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/medications"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Ver fármacos
              </Link>
              <Link
                href="/medical-pathologies"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Ver patologías
              </Link>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Qué encontrarás</div>
              <div className="mt-2 text-sm text-slate-700">
                Definiciones cortas, utilidad clínica y ejemplos para que el término no se quede solo en memoria teórica.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Cómo usarlo</div>
              <div className="mt-2 text-sm text-slate-700">
                Busca por término, categoría o concepto relacionado cuando necesites repasar antes de un caso, un simulacro o una práctica.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Conexión con la app</div>
              <div className="mt-2 text-sm text-slate-700">
                Este módulo sirve como puente rápido hacia medicamentos y biblioteca de patologías para ampliar el contexto.
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white/82 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700">
                  Práctica de completar
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">Práctica guiada</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Te mostramos el concepto y tú completas la palabra o expresión médica. La práctica usa el mismo banco del glosario y respeta los filtros activos.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPracticeScope("solo_terminos")}
                    className={`rounded-full border px-3 py-1 ${
                      practiceScope === "solo_terminos"
                        ? "border-teal-200 bg-teal-50 font-semibold text-teal-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Solo términos completos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticeScope("incluye_afijos")}
                    className={`rounded-full border px-3 py-1 ${
                      practiceScope === "incluye_afijos"
                        ? "border-cyan-200 bg-cyan-50 font-semibold text-cyan-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Incluir prefijos y sufijos
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                  Intentos: {attemptCount}
                </span>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-emerald-700">
                  Correctas: {correctCount}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                  Base práctica: {practicePool.length || 0}
                </span>
              </div>
            </div>

            {practiceItem ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_320px]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Práctica guiada</div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      {getTermKind(practiceItem) === "prefijo"
                        ? "Prefijo"
                        : getTermKind(practiceItem) === "sufijo"
                        ? "Sufijo"
                        : "Término"}
                    </span>
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-500">Significado</div>
                    <div className="mt-2 text-base font-medium text-slate-900">{simplifyDefinition(practiceItem)}</div>
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <div className="text-xs uppercase tracking-wider text-emerald-700/80">Cómo responder</div>
                    <div className="mt-2 text-sm text-emerald-700">{getPracticeHelper(practiceItem)}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {practiceItem.related.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={attempt}
                      onChange={(event) => setAttempt(event.target.value)}
                      placeholder={
                        getTermKind(practiceItem) === "prefijo"
                          ? "Ejemplo: Hiper-"
                          : getTermKind(practiceItem) === "sufijo"
                          ? "Ejemplo: -itis"
                          : "Escribe aquí el término..."
                      }
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-300/40"
                    />
                    <button
                      type="button"
                      onClick={checkPracticeAnswer}
                      className="rounded-xl bg-[#183640] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#224652]"
                    >
                      Validar
                    </button>
                    <button
                      type="button"
                      onClick={() => loadNextPractice(practiceItem.id)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Otro concepto
                    </button>
                  </div>

                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                      practiceTone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : practiceTone === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {practiceMessage}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Respuesta esperada</div>
                  {showAnswer ? (
                    <>
                      <div className="mt-3 text-2xl font-semibold text-slate-900">{practiceItem.term}</div>
                      <div className="mt-2 text-sm text-slate-600">{practiceItem.short}</div>
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        {getPracticeHelper(practiceItem)}
                      </div>
                      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                        <div className="text-xs uppercase tracking-wider text-cyan-700/80">Ejemplo rápido</div>
                        <div className="mt-2 text-sm text-cyan-700">{practiceItem.example}</div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 text-sm text-slate-500">
                      La respuesta se muestra después de validar. Si quieres pasar al siguiente concepto sin responder, usa “Otro concepto”.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                No hay términos disponibles para la práctica con el filtro actual. Prueba cambiar a “Incluir prefijos y sufijos” o ajustar la categoría.
              </div>
            )}
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar término, concepto o uso clínico..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-300/40"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("Todas")}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    category === "Todas"
                      ? "border-white/30 bg-white/10 text-slate-900"
                      : "border-slate-200 bg-white/78 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Todas
                </button>
                {MEDICAL_TERMINOLOGY_CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      category === item
                        ? "border-white/30 bg-white/10 text-slate-900"
                        : "border-slate-200 bg-white/78 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                {filtered.map((item) => {
                  const selected = active?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-cyan-300/35 bg-cyan-300/10"
                          : "border-slate-200 bg-white hover:bg-white"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{item.term}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.category}</div>
                      <div className="mt-2 text-sm text-slate-600">{item.short}</div>
                    </button>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                    No hay términos para este filtro.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
              {!active ? (
                <div className="text-sm text-slate-500">Selecciona un término para ver el detalle.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-700">
                      {active.category}
                    </div>
                    <div className="ml-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                      {getTermKind(active) === "prefijo"
                        ? "Prefijo médico"
                        : getTermKind(active) === "sufijo"
                        ? "Sufijo médico"
                        : "Término clínico"}
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">{active.term}</h2>
                    <p className="mt-2 text-sm text-slate-600">{active.definition}</p>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-wider text-slate-400">Uso clínico</div>
                      <div className="mt-2 text-sm text-slate-800">{active.clinicalUse}</div>
                    </div>

                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                      <div className="text-xs uppercase tracking-wider text-emerald-700/80">Ejemplo rápido</div>
                      <div className="mt-2 text-sm text-emerald-700">{active.example}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wider text-slate-400">Conceptos relacionados</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {active.related.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Link
                      href="/medications"
                      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-900">Ir a fármacos</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Practica seguridad farmacológica, vías, dosis y grupos terapéuticos.
                      </div>
                    </Link>

                    <Link
                      href="/medical-pathologies"
                      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-900">Ir a patologías</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Revisa pistas clínicas, red flags y prioridades de cuidados por enfermedad.
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
