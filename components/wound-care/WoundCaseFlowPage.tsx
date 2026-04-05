"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import MaterialTray from "@/components/wound-care/MaterialTray";
import NursingNoteForm from "@/components/wound-care/NursingNoteForm";
import PatientRiskPanel from "@/components/wound-care/PatientRiskPanel";
import PreventionMeasuresPanel from "@/components/wound-care/PreventionMeasuresPanel";
import ProcedureChecklist from "@/components/wound-care/ProcedureChecklist";
import StageClassificationCard from "@/components/wound-care/StageClassificationCard";
import WoundAssessmentForm from "@/components/wound-care/WoundAssessmentForm";
import WoundPageShell from "@/components/wound-care/WoundPageShell";
import WoundProcedureWorkspace from "@/components/wound-care/WoundProcedureWorkspace";
import WoundResultsDashboard from "@/components/wound-care/WoundResultsDashboard";
import WoundViewer from "@/components/wound-care/WoundViewer";
import {
  WOUND_FLOW_STEPS,
  createWoundSession,
  getTutorFeedback,
  nextWoundStep,
  previousWoundStep,
  woundStepRoute,
} from "@/src/lib/wound-care/engine";
import { getWoundCaseById } from "@/src/lib/wound-care/cases";
import {
  clearWoundSession,
  finalizeWoundSession,
  readWoundSession,
  saveWoundSession,
} from "@/src/lib/wound-care/storage";
import {
  type WoundFlowStep,
  type WoundSimulationSession,
  WOUND_MATERIAL_OPTIONS,
  WOUND_PROCEDURE_STEPS,
  WOUND_STAGE_OPTIONS,
} from "@/src/lib/wound-care/types";

type FlowPageProps = {
  step: Exclude<WoundFlowStep, "summary">;
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  "Estadio I": "Piel intacta con eritema no blanqueable.",
  "Estadio II": "Pérdida parcial de espesor con lecho visible.",
  "Estadio III": "Pérdida total de piel con tejido adiposo visible, sin estructuras profundas expuestas.",
  "Estadio IV": "Pérdida total con fascia, músculo, tendón o hueso expuestos.",
  "No clasificable": "La profundidad real queda oculta por esfacelos o necrosis.",
  "Lesión tisular profunda": "Piel intacta o no intacta con tonalidad profunda violácea o ampolla hemática.",
};

const STEP_GUIDES: Record<Exclude<WoundFlowStep, "summary" | "results">, { title: string; steps: string[] }> = {
  assessment: {
    title: "Guía breve de valoración",
    steps: [
      "Revisa primero el riesgo general del paciente y los factores predisponentes.",
      "Observa la lesión central, usa los hotspots y confirma dimensiones básicas.",
      "Completa la ficha de valoración con bordes, tejido, exudado, piel perilesional y dolor.",
    ],
  },
  classification: {
    title: "Guía breve de clasificación",
    steps: [
      "Clasifica la lesión según el tejido visible y la profundidad apreciable.",
      "Diferencia estadio, lesión tisular profunda o lesión no clasificable.",
      "Justifica la decisión con hallazgos concretos, no solo con el nombre del estadio.",
    ],
  },
  procedure: {
    title: "Guía breve del procedimiento",
    steps: [
      "Selecciona materiales acordes al exudado y al estado de la piel perilesional.",
      "Sigue la secuencia de seguridad desde higiene de manos hasta registro.",
      "Evita materiales irritantes o claramente inadecuados para el caso.",
    ],
  },
  prevention: {
    title: "Guía breve de prevención",
    steps: [
      "Piensa en medidas de descarga, humedad, nutrición y reevaluación.",
      "Prioriza las intervenciones que cambian el riesgo de progresión.",
      "No cierres el caso sin un plan preventivo complementario.",
    ],
  },
  documentation: {
    title: "Guía breve de registro",
    steps: [
      "Documenta localización, clasificación y características del lecho.",
      "Describe intervención, apósito utilizado y respuesta del paciente.",
      "Cierra con un plan de seguimiento claro y coherente con el caso.",
    ],
  },
};

export default function WoundCaseFlowPage({ step }: FlowPageProps) {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "evaluation" ? "evaluation" : "tutor";
  const caseData = getWoundCaseById(params.caseId);

  const [session, setSession] = useState<WoundSimulationSession | null>(null);
  const [zoom, setZoom] = useState(8);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | undefined>(caseData?.wound.hotspots[0]?.id);
  const [isComputingResults, setIsComputingResults] = useState(false);

  useEffect(() => {
    if (!caseData) return;
    const existing = readWoundSession(caseData.id, mode);
    const base = existing ?? createWoundSession(caseData.id, mode);
    if (!base) return;
    const next = { ...base, currentStep: step };
    setSession(next);
    saveWoundSession(next);
  }, [caseData, mode, step]);

  useEffect(() => {
    if (!caseData) return;
    setSelectedHotspotId(caseData.wound.hotspots[0]?.id);
  }, [caseData]);

  useEffect(() => {
    if (step !== "documentation" || !session) return;

    const patch: Partial<WoundSimulationSession["documentation"]> = {};
    if (!session.documentation.classification && session.classification.stage) patch.classification = session.classification.stage;
    if (!session.documentation.woundBed && session.assessment.tissue) patch.woundBed = session.assessment.tissue;
    if (!session.documentation.exudate && session.assessment.exudate) patch.exudate = session.assessment.exudate;
    if (!session.documentation.odor && session.assessment.odor) patch.odor = session.assessment.odor;
    if (!session.documentation.pain && session.assessment.pain) patch.pain = session.assessment.pain;

    if (Object.keys(patch).length) {
      const next: WoundSimulationSession = {
        ...session,
        documentation: {
          ...session.documentation,
          ...patch,
        },
        updatedAt: new Date().toISOString(),
      };
      setSession(next);
      saveWoundSession(next);
    }
  }, [step, session]);

  const tutorMessage = useMemo(() => {
    if (!caseData || !session || step === "results") return "";
    return getTutorFeedback(step, session, caseData);
  }, [caseData, session, step]);

  useEffect(() => {
    if (step !== "results" || !session) return;
    if (session.finalResult) return;

    setIsComputingResults(true);
    let timeoutId: number | undefined;

    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        finalizeResults();
        setIsComputingResults(false);
      }, 0);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (typeof timeoutId === "number") window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, session?.finalResult, session?.sessionId]);

  if (!caseData) {
    return (
      <WoundPageShell title="Caso no encontrado" description="No fue posible cargar el caso solicitado.">
        <Link href="/simulators/wound-care/lpp/cases" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
          Volver a biblioteca
        </Link>
      </WoundPageShell>
    );
  }

  if (!session) {
    return (
      <WoundPageShell title={caseData.name} description="Cargando sesión de curación de heridas...">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Preparando caso y progreso guardado.</div>
      </WoundPageShell>
    );
  }

  const activeSession = session;
  const activeCase = caseData;
  const stepIndex = WOUND_FLOW_STEPS.findIndex((item) => item.id === step);
  const progressPercent = Math.round((Math.max(0, stepIndex) / (WOUND_FLOW_STEPS.length - 1)) * 100);

  function patchSession(patch: Partial<WoundSimulationSession>) {
    const next = {
      ...activeSession,
      ...patch,
      updatedAt: new Date().toISOString(),
    } as WoundSimulationSession;
    setSession(next);
    saveWoundSession(next);
  }

  function patchAssessment(patch: Partial<WoundSimulationSession["assessment"]>) {
    patchSession({
      assessment: {
        ...activeSession.assessment,
        ...patch,
      },
    });
  }

  function patchClassification(patch: Partial<WoundSimulationSession["classification"]>) {
    patchSession({
      classification: {
        ...activeSession.classification,
        ...patch,
      },
    });
  }

  function patchProcedure(patch: Partial<WoundSimulationSession["procedure"]>) {
    patchSession({
      procedure: {
        ...activeSession.procedure,
        ...patch,
      },
    });
  }

  function patchPrevention(patch: Partial<WoundSimulationSession["prevention"]>) {
    patchSession({
      prevention: {
        ...activeSession.prevention,
        ...patch,
      },
    });
  }

  function patchDocumentation(patch: Partial<WoundSimulationSession["documentation"]>) {
    patchSession({
      documentation: {
        ...activeSession.documentation,
        ...patch,
      },
    });
  }

  function goToFlowStep(targetStep: WoundFlowStep) {
    patchSession({ currentStep: targetStep });
    router.push(`${woundStepRoute(activeCase.id, targetStep)}?mode=${mode}`);
  }

  function toggleHotspot(hotspotId: string) {
    setSelectedHotspotId(hotspotId);
    if (!activeSession.assessment.hotspotFindings.includes(hotspotId)) {
      patchAssessment({ hotspotFindings: [...activeSession.assessment.hotspotFindings, hotspotId] });
    }
  }

  function toggleMaterial(materialId: string) {
    patchProcedure({
      selectedMaterialIds: activeSession.procedure.selectedMaterialIds.includes(materialId)
        ? activeSession.procedure.selectedMaterialIds.filter((item) => item !== materialId)
        : [...activeSession.procedure.selectedMaterialIds, materialId],
    });
  }

  function selectProcedureStep(stepId: string) {
    const expectedStepId = activeCase.expected.procedureSequence[activeSession.procedure.selectedSequence.length];
    if (mode === "tutor" && stepId !== expectedStepId) {
      patchProcedure({
        tutorMessages: [`El siguiente paso esperado era: ${expectedLabel(expectedStepId)}.`],
      });
      return;
    }

    patchProcedure({
      selectedSequence: [...activeSession.procedure.selectedSequence, stepId],
      tutorMessages:
        mode === "tutor"
          ? [`Paso correcto: ${expectedLabel(stepId)}.`]
          : activeSession.procedure.tutorMessages,
    });
  }

  function resetProcedure() {
    patchProcedure({
      selectedSequence: [],
      tutorMessages: [],
    });
  }

  function finalizeResults() {
    const finalized = finalizeWoundSession({
      ...activeSession,
      currentStep: "results",
    });

    if (!finalized) return;
    setSession(finalized);
  }

  const assessmentReady =
    activeSession.assessment.reviewedDomains.length >= 4 &&
    activeSession.assessment.selectedRiskFactors.length >= 2 &&
    activeSession.assessment.edges &&
    activeSession.assessment.tissue &&
    activeSession.assessment.exudate;

  const classificationReady =
    Boolean(activeSession.classification.stage) && activeSession.classification.justification.trim().length >= 20;

  const procedureReady =
    activeSession.procedure.selectedMaterialIds.length >= 4 &&
    activeSession.procedure.selectedSequence.length === activeCase.expected.procedureSequence.length;

  const preventionReady =
    activeSession.prevention.selectedMeasures.length >= 3 && activeSession.prevention.followUpPlan.trim().length >= 20;

  const documentationReady =
    activeSession.documentation.location.trim().length > 0 &&
    activeSession.documentation.classification.trim().length > 0 &&
    activeSession.documentation.intervention.trim().length > 0 &&
    activeSession.documentation.followUpPlan.trim().length > 0;

  const canContinue =
    step === "assessment"
      ? assessmentReady
      : step === "classification"
      ? classificationReady
      : step === "procedure"
      ? procedureReady
      : step === "prevention"
      ? preventionReady
      : step === "documentation"
      ? documentationReady
      : true;

  function handleContinue() {
    if (step === "results") return;
    const targetStep = nextWoundStep(step);
    goToFlowStep(targetStep);
  }

  function handleBack() {
    const targetStep = previousWoundStep(step);
    if (targetStep === "summary") {
      router.push(`/simulators/wound-care/lpp/cases/${activeCase.id}?mode=${mode}`);
      return;
    }
    goToFlowStep(targetStep);
  }

  function repeatCase(nextMode: "tutor" | "evaluation") {
    clearWoundSession(activeCase.id, nextMode);
    const next = createWoundSession(activeCase.id, nextMode);
    if (!next) return;
    saveWoundSession(next);
    router.push(`${woundStepRoute(activeCase.id, "assessment")}?mode=${nextMode}`);
  }

  return (
    <WoundPageShell
      title={activeCase.name}
      description={activeCase.learningObjective}
      badge={mode === "tutor" ? "Modo tutor" : "Modo evaluación"}
      actions={
        <>
          <Link href="/simulators/wound-care/lpp/cases" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
            Biblioteca de casos
          </Link>
          {step !== "results" ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </button>
          ) : null}
          {step !== "results" ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={handleContinue}
              className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === "documentation" ? "Ir a resultados" : "Guardar y continuar"}
            </button>
          ) : null}
        </>
      }
    >
      <section className="mb-5 rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {WOUND_FLOW_STEPS.slice(1).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => (item.id === "results" && !activeSession.finalResult ? null : goToFlowStep(item.id))}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  item.id === step
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500">{progressPercent}% del flujo completado</div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#89b2a7,#3e6771)]" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      {step !== "results" ? (
        <section className="mb-5 rounded-[24px] border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{STEP_GUIDES[step].title}</div>
          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            {STEP_GUIDES[step].steps.map((item, index) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <span className="mb-2 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-800">
                  Paso {index + 1}
                </span>
                <div>{item}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === "assessment" ? (
        <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr_1fr]">
          <PatientRiskPanel caseData={caseData} />
          <WoundViewer
            caseData={caseData}
            zoom={zoom}
            measurementMode={measurementMode}
            selectedHotspotId={selectedHotspotId}
            onSelectHotspot={toggleHotspot}
            onZoomChange={setZoom}
            onToggleMeasurementMode={() => setMeasurementMode((prev) => !prev)}
          />
          <WoundAssessmentForm state={activeSession.assessment} onChange={patchAssessment} />
        </div>
      ) : null}

      {step === "classification" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">¿Cómo clasificarías esta lesión?</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {WOUND_STAGE_OPTIONS.map((option) => (
                <StageClassificationCard
                  key={option}
                  label={option}
                  description={STAGE_DESCRIPTIONS[option]}
                  selected={activeSession.classification.stage === option}
                  onSelect={() => patchClassification({ stage: option })}
                />
              ))}
            </div>
            <label className="mt-4 block text-xs text-slate-500">
              Justificación breve
              <textarea
                rows={5}
                value={activeSession.classification.justification}
                onChange={(event) => patchClassification({ justification: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900"
                placeholder="Sustenta la clasificación con profundidad, tipo de tejido, integridad de piel y visibilidad del lecho."
              />
            </label>
            <button
              type="button"
              onClick={() => patchClassification({ differentialChecked: !activeSession.classification.differentialChecked })}
              className={`mt-4 rounded-xl border px-4 py-2 text-sm transition ${
                activeSession.classification.differentialChecked
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {activeSession.classification.differentialChecked ? "Diferencial revisado" : "Marcar que revisaste diagnósticos diferenciales"}
            </button>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tutor / referencia</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "tutor" ? tutorMessage : "Modo evaluación sin ayudas."}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Clave educativa</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{activeCase.education.differentiation}</p>
            </div>
          </aside>
        </div>
      ) : null}

      {step === "procedure" ? (
        <div className="space-y-4">
          <MaterialTray selectedIds={activeSession.procedure.selectedMaterialIds} onToggle={toggleMaterial} />
          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.35fr_0.8fr]">
            <ProcedureChecklist selectedSequence={activeSession.procedure.selectedSequence} />
            <WoundProcedureWorkspace
              selectedSequence={activeSession.procedure.selectedSequence}
              tutorMessage={activeSession.procedure.tutorMessages[0] ?? tutorMessage}
              mode={mode}
              onSelectStep={selectProcedureStep}
              onReset={resetProcedure}
            />
            <aside className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Materiales seleccionados</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeSession.procedure.selectedMaterialIds.length ? (
                    activeSession.procedure.selectedMaterialIds.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                        {WOUND_MATERIAL_OPTIONS.find((option) => option.id === item)?.label ?? item}
                      </span>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">Aún no has completado la bandeja.</div>
                  )}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Feedback</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "tutor" ? tutorMessage : "La retroalimentación se mostrará al final."}</p>
              </div>
            </aside>
          </div>
        </div>
      ) : null}

      {step === "prevention" ? (
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <PreventionMeasuresPanel
            selectedMeasures={activeSession.prevention.selectedMeasures}
            followUpPlan={activeSession.prevention.followUpPlan}
            onToggle={(id) =>
              patchPrevention({
                selectedMeasures: activeSession.prevention.selectedMeasures.includes(id)
                  ? activeSession.prevention.selectedMeasures.filter((item) => item !== id)
                  : [...activeSession.prevention.selectedMeasures, id],
              })
            }
            onPlanChange={(value) => patchPrevention({ followUpPlan: value })}
          />
          <aside className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Prevención esperada</div>
              <div className="mt-3 space-y-2">
                {activeCase.education.prevention.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tutor</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "tutor" ? tutorMessage : "Sin ayuda activa en evaluación."}</p>
            </div>
          </aside>
        </div>
      ) : null}

      {step === "documentation" ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <NursingNoteForm value={activeSession.documentation} onChange={patchDocumentation} />
          <aside className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resumen clínico para la nota</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>Localización: {activeCase.wound.location}</div>
                <div>Clasificación correcta: {activeCase.wound.stage}</div>
                <div>Lecho: {activeCase.wound.tissue}</div>
                <div>Exudado: {activeCase.wound.exudate}</div>
                <div>Dolor: {activeCase.wound.pain}</div>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tutor</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "tutor" ? tutorMessage : "Completa la nota sin ayudas."}</p>
            </div>
          </aside>
        </div>
      ) : null}

      {step === "results" ? (
        activeSession.finalResult ? (
          <div className="space-y-5">
            <WoundResultsDashboard result={activeSession.finalResult} />
            <div className="flex flex-wrap gap-3">
              <Link href="/simulators/wound-care/lpp/cases" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                Volver a casos
              </Link>
              <button
                type="button"
                onClick={() => repeatCase("tutor")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                Repetir en tutor
              </button>
              <button
                type="button"
                onClick={() => repeatCase("evaluation")}
                className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]"
              >
                Repetir en evaluación
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {isComputingResults ? "Generando resultados del caso..." : "Preparando pantalla de resultados..."}
          </div>
        )
      ) : null}
    </WoundPageShell>
  );
}

function expectedLabel(stepId: string) {
  return WOUND_PROCEDURE_STEPS.find((item) => item.id === stepId)?.label ?? stepId;
}
