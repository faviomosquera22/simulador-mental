"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  CLINICAL_NOTES_LIBRARY,
  clinicalNoteDifficultyLabel,
  clinicalNoteTypeLabel,
  evaluateClinicalNote,
  getClinicalNoteSections,
  type ClinicalNoteCase,
  type ClinicalNoteDifficulty,
  type ClinicalNoteMode,
  type ClinicalNoteType,
} from "@/src/lib/clinicalNotesModule";

type SelectionMode = "manual" | "random";
type UsageMode = "integrated_case" | "standalone";
type DifficultyFilter = ClinicalNoteDifficulty | "all";

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

function pickByDifficulty(pool: ClinicalNoteCase[], difficulty: DifficultyFilter) {
  if (difficulty === "all") return pool;
  const filtered = pool.filter((item) => item.difficulty === difficulty);
  return filtered.length ? filtered : pool;
}

export default function ClinicalNotesPage() {
  const [mode, setMode] = useState<ClinicalNoteMode>("practice");
  const [usageMode, setUsageMode] = useState<UsageMode>("integrated_case");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("random");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [noteType, setNoteType] = useState<ClinicalNoteType>("nursing_note");
  const [activeCaseObj, setActiveCaseObj] = useState<any>(null);
  const [casePool] = useState(CLINICAL_NOTES_LIBRARY);
  const [caseSet, setCaseSet] = useState<ClinicalNoteCase>(CLINICAL_NOTES_LIBRARY[0]);
  const [manualCaseId, setManualCaseId] = useState(CLINICAL_NOTES_LIBRARY[0]?.id ?? "");
  const [content, setContent] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof evaluateClinicalNote> | null>(null);

  useEffect(() => {
    try {
      setActiveCaseObj(parseActiveCase(localStorage.getItem("activeCase")));
    } catch {
      setActiveCaseObj(null);
    }
  }, []);

  const filteredByType = useMemo(
    () => casePool.filter((item) => item.type === noteType),
    [casePool, noteType]
  );

  const clearDraft = useCallback(() => {
    const nextContent: Record<string, string> = {};
    for (const section of getClinicalNoteSections(caseSet.type)) {
      nextContent[section.id] = "";
    }
    setContent(nextContent);
    setResult(null);
  }, [caseSet.type]);

  const pickNextCase = useCallback(
    (excludeId?: string) => {
      const typedPool = filteredByType.length ? filteredByType : casePool;
      const basePool = pickByDifficulty(typedPool, difficultyFilter).filter((item) => item.id !== excludeId);
      if (!basePool.length) return typedPool[0] ?? casePool[0] ?? CLINICAL_NOTES_LIBRARY[0];

      if (selectionMode === "manual") {
        return typedPool.find((item) => item.id === manualCaseId) ?? typedPool[0] ?? casePool[0] ?? CLINICAL_NOTES_LIBRARY[0];
      }

      return sampleFromPool(basePool) ?? basePool[0];
    },
    [casePool, difficultyFilter, filteredByType, manualCaseId, selectionMode]
  );

  useEffect(() => {
    const next = pickNextCase();
    if (!next) return;
    setCaseSet(next);
    setManualCaseId(next.id);
  }, [pickNextCase]);

  useEffect(() => {
    clearDraft();
  }, [clearDraft, caseSet.id]);

  const sections = useMemo(() => getClinicalNoteSections(caseSet.type), [caseSet.type]);

  function loadNewCase() {
    const next = pickNextCase(caseSet.id);
    if (!next) return;
    setCaseSet(next);
    setManualCaseId(next.id);
  }

  function evaluate() {
    setResult(evaluateClinicalNote({ caseSet, content }));
  }

  const requiredMissing = useMemo(
    () => sections.filter((section) => section.required && !String(content[section.id] ?? "").trim()),
    [content, sections]
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)] text-slate-900">
      <div className="mx-auto flex max-w-[1580px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] p-5 shadow-[0_24px_70px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Notas clínicas y reporte</h1>
              <p className="mt-1 text-sm text-slate-600">
                Entrena redacción clínica estructurada con checklist de calidad y coherencia básica.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
                {mode === "practice" ? "Modo práctica" : "Modo evaluación"}
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-cyan-700">
                Formato: {clinicalNoteTypeLabel(caseSet.type)}
              </span>
            </div>
          </header>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/82 p-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="text-xs text-slate-600">
              Modo
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as ClinicalNoteMode);
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
                <option value="integrated_case">Desde caso activo</option>
                <option value="standalone">Módulo independiente</option>
              </select>
            </label>

            <label className="text-xs text-slate-600">
              Formato
              <select
                value={noteType}
                onChange={(event) => setNoteType(event.target.value as ClinicalNoteType)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="nursing_note">Nota de enfermería</option>
                <option value="soapie">SOAPIE</option>
                <option value="shift_report">Reporte de turno</option>
                <option value="kardex">Kardex</option>
                <option value="incident_report">Incidente de seguridad</option>
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
              Caso documental
              <select
                value={manualCaseId}
                onChange={(event) => {
                  setManualCaseId(event.target.value);
                  setSelectionMode("manual");
                  const next = casePool.find((item) => item.id === event.target.value) ?? null;
                  if (!next) return;
                  setCaseSet(next);
                  setNoteType(next.type);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                {(filteredByType.length ? filteredByType : casePool).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.3fr_1fr_auto]">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Contexto del paciente</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{caseSet.name}</div>
              <div className="mt-1 text-sm text-slate-600">
                {caseSet.patient.name} · {caseSet.patient.age} años ·{" "}
                {caseSet.patient.sex === "female" ? "Femenino" : caseSet.patient.sex === "male" ? "Masculino" : "No especificado"}
              </div>
              <div className="text-sm text-slate-500">Diagnóstico: {caseSet.patient.diagnosis}</div>
              <div className="mt-1 text-sm text-slate-500">{caseSet.context}</div>
              {usageMode === "integrated_case" && activeCaseObj && (
                <div className="mt-2 text-xs text-cyan-700">Caso activo detectado: {caseTitle(activeCaseObj)}</div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Checklist esperado</div>
              <div className="mt-2">{caseSet.qualityChecklist.join(" · ")}</div>
              <div className="mt-2 text-slate-500">Dificultad: {clinicalNoteDifficultyLabel(caseSet.difficulty)}</div>
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
                <h2 className="text-lg font-semibold">Plantilla estructurada</h2>
                <div className="text-xs text-slate-500">
                  {mode === "practice" ? "En práctica se muestra checklist en vivo." : "En evaluación solo valida al final."}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {sections.map((section) => (
                  <label key={section.id} className="text-xs text-slate-600">
                    {section.label}
                    <textarea
                      value={content[section.id] ?? ""}
                      onChange={(event) =>
                        setContent((prev) => ({
                          ...prev,
                          [section.id]: event.target.value,
                        }))
                      }
                      rows={section.id === "analysis" || section.id === "event" ? 5 : 4}
                      placeholder={section.placeholder}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-900/35"
                    />
                  </label>
                ))}
              </div>
            </div>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white/82 p-4">
                <h3 className="text-base font-semibold">Calidad documental</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  {caseSet.qualityChecklist.map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>

                {mode === "practice" && (
                  <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-700">
                    {requiredMissing.length === 0
                      ? "La estructura obligatoria está completa."
                      : `Faltan campos obligatorios: ${requiredMissing.map((item) => item.label).join(", ")}.`}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={evaluate}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                  >
                    Validar nota
                  </button>
                  <button
                    type="button"
                    onClick={clearDraft}
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
                    <div>{result.feedback.completeness}</div>
                    <div>{result.feedback.content}</div>
                    <div>{result.feedback.coherence}</div>
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-slate-800">
                      {result.feedback.summary}
                    </div>
                  </div>

                  {mode === "practice" && (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-700">
                      {caseSet.educationalHint}
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
