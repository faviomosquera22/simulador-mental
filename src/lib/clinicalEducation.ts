import { buildClinicalQuestions } from "./clinicalQuestionBank";
export type SourceId = "gina-asthma" | "nice-stroke" | "ssc-sepsis" | "rcuk-anaphylaxis" | "cdc-pid" | "msp-allergy" | "msp-emergency" | "msp-diabetes" | "msp-obstetric" | "msp-ventilation" | "msp-maternal";
export type ClinicalSource = { id: SourceId; title: string; year: number; url: string; section: string; scope: string };
export const CLINICAL_SOURCES: Record<SourceId, ClinicalSource> = {
  "gina-asthma": { id: "gina-asthma", title: "GINA · Global Strategy for Asthma Management and Prevention", year: 2026, url: "https://ginasthma.org/wp-content/uploads/2026/05/GINA-2026-Strategy-Report-WMS.pdf", section: "Evaluación y manejo de exacerbaciones; reevaluación de gravedad", scope: "Crisis asmática y signos de agotamiento. Las preguntas no prescriben dosis." },
  "nice-stroke": { id: "nice-stroke", title: "NICE · Stroke and transient ischaemic attack in over 16s", year: 2019, url: "https://www.nice.org.uk/guidance/ng128/chapter/recommendations", section: "Evaluación inicial, neuroimagen y seguridad de deglución", scope: "Valoración inicial del ACV en adultos; tratamiento según evaluación especializada." },
  "ssc-sepsis": { id: "ssc-sepsis", title: "SCCM/ESICM · Surviving Sepsis Campaign", year: 2026, url: "https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026", section: "Reevaluación de perfusión, tratamiento antimicrobiano y control del foco", scope: "Sepsis adulta. No se extrapolan esquemas maternos ni se indican dosis individuales." },
  "rcuk-anaphylaxis": { id: "rcuk-anaphylaxis", title: "Resuscitation Council UK · Emergency treatment of anaphylaxis", year: 2021, url: "https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment-anaphylactic-reactions", section: "Reconocimiento ABC, adrenalina IM y papel de coadyuvantes", scope: "Atención inicial y reevaluación de anafilaxia; observación individualizada." },
  "cdc-pid": { id: "cdc-pid", title: "CDC · Pelvic Inflammatory Disease", year: 2021, url: "https://www.cdc.gov/std/treatment-guidelines/pid.htm", section: "Diagnóstico diferencial y criterios de hospitalización", scope: "EIP, enfermedad grave e intolerancia oral; selección individual del tratamiento." },
  "msp-allergy": { id: "msp-allergy", title: "MSP · Prevención, diagnóstico y tratamiento de la alergia a la proteína de la leche de vaca", year: 2016, url: "https://www.salud.gob.ec/wp-content/uploads/2017/02/Alergia-a-la-prote%C3%ADna-d-ela-leche-de-vaca.pdf", section: "Algoritmo de respuesta inmediata a anafilaxia", scope: "Se consulta el principio de adrenalina inicial y coadyuvantes en anafilaxia. El documento se centra en alergia alimentaria pediátrica: no se extrapolan dosis ni se presenta como guía general de anafilaxia adulta." },
  "msp-emergency": { id: "msp-emergency", title: "MSP · Protocolos de atención prehospitalaria para emergencias médicas", year: 2011, url: "https://aplicaciones.msp.gob.ec/salud/archivosdigitales/documentosDirecciones/dnn/archivos/PROTOCOLOS%20DE%20ATENCI%C3%93N%20PREHOSPITALARIA%20PARA%20EMERGENCIAS%20M%C3%89DICAS.pdf", section: "Choque, pp. 36–38; asma, pp. 55–57; hipoglicemia, pp. 129–130", scope: "Marco prehospitalario histórico. Se utilizan principios de valoración y soporte, sin trasladar automáticamente sus dosis o recomendaciones antiguas a UCI." },
  "msp-diabetes": { id: "msp-diabetes", title: "MSP · Diabetes mellitus tipo 2", year: 2017, url: "https://www.salud.gob.ec/wp-content/uploads/downloads/2017/05/Diabetes-mellitus_GPC.pdf", section: "Manejo de hipoglucemia y anexo farmacológico de glucagón", scope: "Adultos con DM2; corrección de hipoglucemia, selección de vía y reevaluación." },
  "msp-obstetric": { id: "msp-obstetric", title: "MSP · Score MAMÁ y Claves Obstétricas", year: 2025, url: "https://intranet.hospitalguayaquil.gob.ec/storage/manuales/GUIAS%20PRACTICAS%20CLINICAS/2025%20-%20Protocolo%20Score%20MAMA%CC%81%20y%20Claves%20Obste%CC%81tricas%202025.pdf", section: "Claves roja, azul y amarilla; anexos 8 y 17", scope: "Emergencias durante embarazo, parto y puerperio. Los esquemas de sepsis materna no se extrapolan a sepsis general." },
  "msp-ventilation": { id: "msp-ventilation", title: "MSP · Lineamiento de ventilación mecánica", year: 2020, url: "https://hjmvi.gob.ec/wp-content/uploads/2022/02/LINEAMIENTO-DE-VENTILACION-MECANICA-2020.pdf", section: "Seguridad, vigilancia, sedación y prevención de complicaciones", scope: "Cuidado del paciente ventilado. La simulación no prescribe dosis ni sustituye un protocolo de UCI." },
  "msp-maternal": { id: "msp-maternal", title: "MSP · Componente Normativo Materno", year: 2008, url: "https://www.conasa.gob.ec/biblioteca-conasa/Prestaciones/bt172%20-%20Componente%20Normativo%20Materno.pdf", section: "Hemorragia de la primera mitad del embarazo y referencia", scope: "Referencia histórica para valoración y referencia obstétrica. EIP grave conserva un plan antimicrobiano institucional por individualizar: no se atribuye un esquema específico a esta norma." },
};
export type DecisionJudgment = "appropriate" | "alternative" | "unnecessary" | "harmful";
export type LearningDecision = { kind: "medication" | "action" | "study"; id: string; at: number; judgment: DecisionJudgment; rationale: string; source: SourceId; presentation?: string };
export type CaseQuestion = { id: string; caseId: string; stage: "during" | "final"; triggers: string[]; prompt: string; options: { id: string; label: string }[]; correct: string; explanation: string; source: SourceId };
export type QuestionAnswer = { questionId: string; optionId: string; correct: boolean; at: number };
export const CASE_QUESTIONS: CaseQuestion[] = buildClinicalQuestions();
export function triggeredQuestion(caseId: string, trigger: string, answers: QuestionAnswer[]) { return CASE_QUESTIONS.find(q=>q.caseId===caseId && q.stage==="during" && q.triggers.includes(trigger) && !answers.some(a=>a.questionId===q.id)) ?? null; }
/** Called only after an accepted clinical decision, never by sensor toggles or elapsed time. */
export function caseQuestionAfterDecision(caseId: string, trigger: string, decisionCount: number, answers: QuestionAnswer[]) {
 const direct = triggeredQuestion(caseId, trigger, answers);
 if (direct) return direct;
 const questions = CASE_QUESTIONS.filter(q => q.caseId === caseId && q.stage === "during");
 return questions.find((q, index) => decisionCount >= (index + 1) * 3 && !answers.some(a => a.questionId === q.id)) ?? null;
}
export const gynecologyQuestionAfterDecision = caseQuestionAfterDecision;
export const criticalCareQuestionAfterDecision = caseQuestionAfterDecision;
export function finalQuestions(caseId: string) { return CASE_QUESTIONS.filter(q=>q.caseId===caseId && q.stage==="final"); }
export function answerQuestion(answers: QuestionAnswer[], questionId: string, optionId: string, at: number): QuestionAnswer[] {
 const q=CASE_QUESTIONS.find(q=>q.id===questionId);
 if(!q || !q.options.some(o=>o.id===optionId) || answers.some(a=>a.questionId===questionId)) return answers;
 return [...answers,{questionId,optionId,correct:optionId===q.correct,at}];
}

/** Each confirmed answer contributes once; only this case's real questions count. */
export function scoreWithQuestions(caseId: string, clinicalScore: number, answers: QuestionAnswer[], ceiling = 100) {
 const seen = new Set<string>();
 let correct = 0, incorrect = 0;
 for (const answer of answers) {
  const question = CASE_QUESTIONS.find(q => q.caseId === caseId && q.id === answer.questionId);
  if (!question || seen.has(question.id) || !question.options.some(o => o.id === answer.optionId)) continue;
  seen.add(question.id);
  if (answer.optionId === question.correct) correct++; else incorrect++;
 }
 const adjustment = (correct - incorrect) * 5;
 const base = Math.round(Math.max(0, Math.min(100, clinicalScore)));
 return { clinical: base, correct, incorrect, adjustment, total: Math.max(0, Math.min(ceiling, base + adjustment)), ceiling };
}
