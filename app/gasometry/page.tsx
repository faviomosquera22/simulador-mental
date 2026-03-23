"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  BLOOD_GAS_LIBRARY,
  bloodGasContextLabel,
  bloodGasDifficultyLabel,
  bloodGasParameterState,
  evaluateBloodGasInterpretation,
  inferBloodGasContextFromCase,
  type BloodGasAcidBase,
  type BloodGasCase,
  type BloodGasCompensation,
  type BloodGasDifficulty,
  type BloodGasMode,
  type BloodGasPrimaryDisorder,
} from "@/src/lib/bloodGasModule";

type SelectionMode = "manual" | "random" | "contextual_random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = BloodGasDifficulty | "all";

function parseActiveCase(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function caseTitle(caseObj: any) {
  return (
    String(caseObj?.meta?.title ?? caseObj?.title ?? caseObj?.essentials?.title ?? "").trim() || "Caso activo"
  );
}

function sampleFromPool<T>(pool: T[]) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function pickByDifficulty(pool: BloodGasCase[], difficulty: DifficultyFilter) {
  if (difficulty === "all") return pool;
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  return filtered.length ? filtered : pool;
}

function parameterTone(state: "low" | "normal" | "high") {
  if (state === "low") return "border-amber-400/30 bg-amber-400/10 text-amber-700";
  if (state === "high") return "border-red-400/30 bg-red-400/10 text-red-700";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-700";
}

export default function GasometryPage() {
  const [mode, setMode] = useState<BloodGasMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("integrated_case");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("contextual_random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [casePool] = useState(BLOOD_GAS_LIBRARY);
  const [caseSet, setCaseSet] = useState<BloodGasCase>(BLOOD_GAS_LIBRARY[0]);
  const [manualCaseId, setManualCaseId] = useState(BLOOD_GAS_LIBRARY[0]?.id ?? "");

  const [acidBase, setAcidBase] = useState<BloodGasAcidBase | "">("");
  const [primaryDisorder, setPrimaryDisorder] = useState<BloodGasPrimaryDisorder | "">("");
  const [compensation, setCompensation] = useState<BloodGasCompensation | "">("");
  const [interpretationText, setInterpretationText] = useState("");
  const [conductText, setConductText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof evaluateBloodGasInterpretation> | null>(null);

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  const useIntegratedContext = usageMode === "integrated_case" && activeCaseObj;
  const contextualTag = useMemo(
    () => (useIntegratedContext ? inferBloodGasContextFromCase(activeCaseObj) : null),
    [activeCaseObj, useIntegratedContext]
  );

  const clearAnswers = useCallback(() => {
    setAcidBase("");
    setPrimaryDisorder("");
    setCompensation("");
    setInterpretationText("");
    setConductText("");
    setResult(null);
  }, []);

  const pickNextCase = useCallback(
    (excludeId?: string) => {
      const basePool = pickByDifficulty(casePool, difficultyFilter).filter((item) => item.id !== excludeId);
      if (!basePool.length) return casePool[0] ?? BLOOD_GAS_LIBRARY[0];

      if (selectionMode === "manual") {
        return casePool.find((item) => item.id === manualCaseId) ?? casePool[0] ?? BLOOD_GAS_LIBRARY[0];
      }

      if (selectionMode === "contextual_random" && contextualTag) {
        const contextualPool = basePool.filter((item) => item.context === contextualTag);
        if (contextualPool.length) return sampleFromPool(contextualPool) ?? contextualPool[0];
      }

      return sampleFromPool(basePool) ?? basePool[0];
    },
    [casePool, contextualTag, difficultyFilter, manualCaseId, selectionMode]
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
      evaluateBloodGasInterpretation({
        caseSet,
        input: {
          acidBase,
          primaryDisorder,
          compensation,
          interpretationText,
          conductText,
        },
      })
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Gasometría arterial</h1>
              <p className="mt-1 text-sm text-slate-600">
                Interpreta pH, PaCO2, HCO3, oxigenación y lactato con validación clínica.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Dificultad: {bloodGasDifficultyLabel(caseSet.difficulty)}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs text-slate-600">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as BloodGasMode);
                  setResult(null);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="practice">Práctica guiada</option>
                <option value="evaluation">Evaluación</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Uso
              <select
                value={usageMode}
                onChange={(event) => setUsageMode(event.target.value as UsageMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="integrated_case">Integrado al caso</option>
                <option value="standalone">Módulo independiente</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Selección
              <select
                value={selectionMode}
                onChange={(event) => setSelectionMode(event.target.value as SelectionMode)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="contextual_random">Aleatorio contextual</option>
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
              Caso de gasometría
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

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.35fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Contexto clínico</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{caseSet.name}</div>
              <div className="mt-1 text-sm text-slate-600">
                Paciente: {caseSet.patient.name} · {caseSet.patient.age} años ·{" "}
                {caseSet.patient.sex === "female" ? "Femenino" : caseSet.patient.sex === "male" ? "Masculino" : "No especificado"}
              </div>
              <div className="text-sm text-slate-500">Motivo de consulta: {caseSet.patient.chiefComplaint}</div>
              {useIntegratedContext && (
                <div className="mt-2 text-xs text-cyan-700">
                  Caso activo detectado: {caseTitle(activeCaseObj)} · Contexto inferido:{" "}
                  {bloodGasContextLabel(contextualTag ?? "general")}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Interpretación objetivo</div>
              <div className="mt-2">Hallazgo principal: {caseSet.mainFinding}</div>
              <div className="mt-1">Contexto: {bloodGasContextLabel(caseSet.context)}</div>
              <div className="mt-1">Conducta esperada: {caseSet.expectedConduct}</div>
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

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.65fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Valores de gasometría</h2>
                <div className="text-xs text-slate-500">
                  {mode === "practice" ? "En práctica se resaltan alteraciones." : "En evaluación interpretas sin ayudas visuales."}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { key: "ph", label: "pH", value: caseSet.values.ph.toFixed(2), unit: "", hint: "7.35 - 7.45" },
                  { key: "paCO2", label: "PaCO2", value: String(caseSet.values.paCO2), unit: "mmHg", hint: "35 - 45" },
                  { key: "hco3", label: "HCO3", value: String(caseSet.values.hco3), unit: "mEq/L", hint: "22 - 26" },
                  { key: "paO2", label: "PaO2", value: String(caseSet.values.paO2), unit: "mmHg", hint: "80 - 100" },
                  { key: "saturation", label: "Sat O2", value: String(caseSet.values.saturation), unit: "%", hint: "95 - 100" },
                  { key: "lactate", label: "Lactato", value: String(caseSet.values.lactate), unit: "mmol/L", hint: "< 2.0" },
                ].map((item) => {
                  const state = bloodGasParameterState(item.key as keyof BloodGasCase["values"], Number(item.value));
                  return (
                    <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-400">{item.label}</div>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">
                        {item.value} <span className="text-sm text-slate-400">{item.unit}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">Referencia: {item.hint}</div>
                      {mode === "practice" && (
                        <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs ${parameterTone(state)}`}>
                          {state === "normal" ? "Normal" : state === "low" ? "Bajo" : "Alto"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {mode === "practice" && (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-700">
                  Secuencia sugerida: pH primero, luego PaCO2/HCO3, después compensación y correlación clínica.
                </div>
              )}
            </div>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <h3 className="text-base font-semibold">Interpretación</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Resuelve el trastorno ácido-base y plantea conducta inicial.
                </p>

                <div className="mt-3 space-y-3">
                  <label className="block text-xs text-slate-600">
                    1) ¿Predomina acidosis o alcalosis?
                    <select
                      value={acidBase}
                      onChange={(event) => setAcidBase(event.target.value as BloodGasAcidBase | "")}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="acidosis">Acidosis</option>
                      <option value="alcalosis">Alcalosis</option>
                      <option value="normal">Normal / casi normal</option>
                    </select>
                  </label>

                  <label className="block text-xs text-slate-600">
                    2) ¿Es metabólica o respiratoria?
                    <select
                      value={primaryDisorder}
                      onChange={(event) => setPrimaryDisorder(event.target.value as BloodGasPrimaryDisorder | "")}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="respiratory">Respiratoria</option>
                      <option value="metabolic">Metabólica</option>
                    </select>
                  </label>

                  <label className="block text-xs text-slate-600">
                    3) Compensación
                    <select
                      value={compensation}
                      onChange={(event) => setCompensation(event.target.value as BloodGasCompensation | "")}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="none">Sin compensación</option>
                      <option value="partial">Parcial</option>
                      <option value="full">Completa</option>
                    </select>
                  </label>

                  <label className="block text-xs text-slate-600">
                    4) Interpretación clínica
                    <textarea
                      value={interpretationText}
                      onChange={(event) => setInterpretationText(event.target.value)}
                      rows={4}
                      placeholder="Describe el trastorno ácido-base y su contexto clínico."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-900/35"
                    />
                  </label>

                  <label className="block text-xs text-slate-600">
                    5) Conducta inicial
                    <textarea
                      value={conductText}
                      onChange={(event) => setConductText(event.target.value)}
                      rows={3}
                      placeholder="¿Qué harías a continuación?"
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
                    Validar interpretación
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
                    <div>{result.feedback.acidBase}</div>
                    <div>{result.feedback.primaryDisorder}</div>
                    <div>{result.feedback.compensation}</div>
                    <div>{result.feedback.interpretation}</div>
                    <div>{result.feedback.conduct}</div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-slate-800">
                      {result.feedback.summary}
                    </div>
                  </div>

                  {mode === "practice" && (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-700">
                      {caseSet.explanationSteps.join(" ")}
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
