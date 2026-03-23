"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  MEDICATION_LIBRARY,
  MEDICATION_SAFETY_CHECKS,
  evaluateMedicationCase,
  medicationCategoryLabel,
  medicationDifficultyLabel,
  type MedicationCase,
  type MedicationDecision,
  type MedicationDifficulty,
  type MedicationMode,
  type MedicationSafetyCheckId,
} from "@/src/lib/medicationAdministration";

type SelectionMode = "manual" | "random";
type DifficultyFilter = MedicationDifficulty | "all";

function sampleFromPool<T>(pool: T[]) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function pickByDifficulty(pool: MedicationCase[], difficulty: DifficultyFilter) {
  if (difficulty === "all") return pool;
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  return filtered.length ? filtered : pool;
}

export default function MedicationsPage() {
  const [mode, setMode] = useState<MedicationMode>("practice");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [casePool] = useState(MEDICATION_LIBRARY);
  const [caseSet, setCaseSet] = useState<MedicationCase>(MEDICATION_LIBRARY[0]);
  const [manualCaseId, setManualCaseId] = useState(MEDICATION_LIBRARY[0]?.id ?? "");

  const [decision, setDecision] = useState<MedicationDecision | "">("");
  const [route, setRoute] = useState("");
  const [volumeMl, setVolumeMl] = useState("");
  const [selectedChecks, setSelectedChecks] = useState<MedicationSafetyCheckId[]>([]);
  const [justification, setJustification] = useState("");
  const [result, setResult] = useState<ReturnType<typeof evaluateMedicationCase> | null>(null);

  const clearAnswers = useCallback(() => {
    setDecision("");
    setRoute("");
    setVolumeMl("");
    setSelectedChecks([]);
    setJustification("");
    setResult(null);
  }, []);

  const pickNextCase = useCallback(
    (excludeId?: string) => {
      const basePool = pickByDifficulty(casePool, difficultyFilter).filter((item) => item.id !== excludeId);
      if (!basePool.length) return casePool[0] ?? MEDICATION_LIBRARY[0];

      if (selectionMode === "manual") {
        return casePool.find((item) => item.id === manualCaseId) ?? casePool[0] ?? MEDICATION_LIBRARY[0];
      }

      return sampleFromPool(basePool) ?? basePool[0];
    },
    [casePool, difficultyFilter, manualCaseId, selectionMode]
  );

  useEffect(() => {
    const next = pickNextCase();
    if (!next) return;
    setCaseSet(next);
    if (selectionMode === "manual") {
      setManualCaseId(next.id);
    }
    clearAnswers();
  }, [clearAnswers, pickNextCase, selectionMode]);

  const routeOptions = useMemo(
    () => Array.from(new Set(["IV", "IM", "SC", "VO", "No administrar", caseSet.correctRoute])),
    [caseSet.correctRoute]
  );

  function toggleCheck(id: MedicationSafetyCheckId) {
    setSelectedChecks((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function loadNewCase() {
    const next = pickNextCase(caseSet.id);
    if (!next) return;
    setCaseSet(next);
    if (selectionMode === "manual") {
      setManualCaseId(next.id);
    }
    clearAnswers();
  }

  function evaluate() {
    setResult(
      evaluateMedicationCase({
        caseSet,
        input: {
          decision,
          route,
          volumeMl,
          selectedChecks,
          justification,
        },
      })
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4faf8_0%,#edf4f1_48%,#e4efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Administración de medicamentos</h1>
              <p className="mt-1 text-sm text-slate-600">
                Practica verificación segura, decisión clínica, volumen y vía de administración.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Dificultad: {medicationDifficultyLabel(caseSet.difficulty)}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-xs text-slate-600">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as MedicationMode);
                  setResult(null);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="practice">Práctica guiada</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Selección
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="random">Aleatorio</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Dificultad
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="all">Todas</option>
                <option value="basic">Básico</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </label>

            <label className="text-xs text-slate-600 xl:col-span-2">
              Escenario de medicación
              <select
                value={manualCaseId}
                onChange={(event) => {
                  setManualCaseId(event.target.value);
                  setSelectionMode("manual");
                  const manual = casePool.find((item) => item.id === event.target.value) ?? null;
                  if (!manual) return;
                  setCaseSet(manual);
                  clearAnswers();
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                {casePool.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.3fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Escenario</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{caseSet.name}</div>
              <div className="mt-1 text-sm text-slate-600">
                {caseSet.patient.name} · {caseSet.patient.age} años ·{" "}
                {caseSet.patient.sex === "female" ? "Femenino" : caseSet.patient.sex === "male" ? "Masculino" : "No especificado"}
              </div>
              <div className="text-sm text-slate-500">{caseSet.context}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Orden médica</div>
              <div className="mt-2">Medicamento: {caseSet.order.medication}</div>
              <div className="mt-1">Dosis: {caseSet.order.doseLabel}</div>
              <div className="mt-1">Vía: {caseSet.order.route}</div>
              <div className="mt-1">Horario: {caseSet.order.schedule}</div>
              <div className="mt-1">Presentación: {caseSet.order.presentation}</div>
            </div>

            <div className="flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={loadNewCase}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
              >
                Nuevo caso
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Paciente y seguridad</h2>
                <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                  {medicationCategoryLabel(caseSet.category)}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Datos del paciente</div>
                  <div className="mt-2 text-sm text-slate-800">
                    Diagnósticos: {caseSet.patient.diagnoses.join(" · ")}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Alergias: {caseSet.patient.allergies.length ? caseSet.patient.allergies.join(", ") : "Ninguna conocida"}
                  </div>
                  {caseSet.patient.alerts?.length ? (
                    <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-700">
                      {caseSet.patient.alerts.join(" · ")}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-700">
                      Sin alertas adicionales críticas en el escenario base.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Preparación</div>
                  <div className="mt-2 text-sm text-slate-800">Indicación: {caseSet.order.indication}</div>
                  {caseSet.order.dilution && <div className="mt-1 text-sm text-slate-600">Dilución: {caseSet.order.dilution}</div>}
                  {caseSet.order.infusionRate && (
                    <div className="mt-1 text-sm text-slate-600">Velocidad / alerta: {caseSet.order.infusionRate}</div>
                  )}
                  {caseSet.order.volumePrompt && (
                    <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-700">
                      Cálculo integrado: {caseSet.order.volumePrompt}
                    </div>
                  )}
                </div>
              </div>

              {mode === "practice" && (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-700">
                  Antes de administrar, valida siempre los 5 correctos y agrega alergias/contraindicaciones si aplican.
                </div>
              )}
            </div>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <h3 className="text-base font-semibold">Decisión segura</h3>

                <div className="mt-3 space-y-3">
                  <label className="block text-xs text-slate-600">
                    1) Conducta
                    <select
                      value={decision}
                      onChange={(event) => setDecision(event.target.value as MedicationDecision | "")}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="administer">Administrar</option>
                      <option value="hold">Retener</option>
                      <option value="clarify">Aclarar antes de administrar</option>
                    </select>
                  </label>

                  <label className="block text-xs text-slate-600">
                    2) Vía de administración
                    <select
                      value={route}
                      onChange={(event) => setRoute(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">Selecciona una vía</option>
                      {routeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  {typeof caseSet.correctVolumeMl === "number" && (
                    <label className="block text-xs text-slate-600">
                      3) Volumen a administrar (mL)
                      <input
                        value={volumeMl}
                        onChange={(event) => setVolumeMl(event.target.value)}
                        placeholder="Ingresa el volumen en mL"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-900/35"
                      />
                    </label>
                  )}

                  <div>
                    <div className="text-xs text-slate-600">4) Controles de seguridad realizados</div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {MEDICATION_SAFETY_CHECKS.map((item) => {
                        const checked = selectedChecks.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`rounded-xl border px-3 py-2 text-xs ${
                              checked ? "border-cyan-400/35 bg-cyan-400/10 text-cyan-700" : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCheck(item.id)}
                              className="mr-2 h-4 w-4 align-middle"
                            />
                            <span className="align-middle">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block text-xs text-slate-600">
                    5) Justificación clínica
                    <textarea
                      value={justification}
                      onChange={(event) => setJustification(event.target.value)}
                      rows={4}
                      placeholder="Explica por qué administrarías, retendrías o aclararías la orden."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-900/35"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={evaluate}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Validar
                  </button>
                  <button
                    type="button"
                    onClick={clearAnswers}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900/90 hover:bg-slate-50"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>

              {result && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">Feedback automático</div>
                    <div className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-700">
                      {result.totalScore}/100
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <div>{result.feedback.decision}</div>
                    <div>{result.feedback.route}</div>
                    <div>{result.feedback.volume}</div>
                    <div>{result.feedback.safety}</div>
                    <div>{result.feedback.justification}</div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-slate-800">
                      {result.feedback.summary}
                    </div>
                  </div>

                  {mode === "practice" && (
                    <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-700">
                      Error frecuente a evitar: {caseSet.commonErrors[0]}
                    </div>
                  )}
                </div>
              )}
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
