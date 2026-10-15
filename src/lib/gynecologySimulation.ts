import type { MonitorVitalsShape } from "./monitorClinical";

export type ActionGroup = "valoracion" | "estudios" | "intervencion" | "equipo";
export type SimulationAction = {
  id: string; label: string; group: ActionGroup; minutes?: number;
  requires?: string[]; result: string; rationale: string;
  critical?: boolean; deadline?: number; harmful?: boolean;
  effect?: "support" | "definitive" | "oxygen" | "iv";
};
export type GynecologyCase = {
  id: string; title: string; specialty: string; difficulty: string;
  name: string; age: number; background: string; complaint: string;
  handover: string; initial: MonitorVitalsShape; bleeding: number; bleedingRate: number;
  deterioration: number; diagnosis: string; differentials: string[];
  findings: Record<"head" | "chest" | "abdomen" | "pelvis", string>;
  history: string; actions: SimulationAction[]; objectives: string[];
  source: { label: string; url: string };
};
const shared: SimulationAction[] = [
  { id: "abcde", label: "Evaluación primaria ABCDE", group: "valoracion", critical: true, deadline: 120, result: "Vía aérea permeable. Ventila espontáneamente. Revisa perfusión, estado mental y exposición con privacidad.", rationale: "La evaluación inicial permite reconocer deterioro y priorizar amenazas vitales." },
  { id: "history", label: "Entrevistar a la paciente", group: "valoracion", result: "Historia clínica obtenida.", rationale: "Escucha el motivo de consulta, antecedentes, alergias y posibilidad de embarazo antes de decidir." },
  { id: "consent", label: "Explicar y solicitar consentimiento", group: "valoracion", result: "La paciente acepta la exploración tras explicar su finalidad. Se ofrece acompañante clínico y privacidad; puede detenerla en cualquier momento.", rationale: "El consentimiento es específico y continuo, especialmente en la exploración íntima." },
  { id: "iv", label: "Acceso venoso y toma de muestras", group: "intervencion", effect: "iv", result: "Acceso venoso disponible; muestras obtenidas. La analítica debe solicitarse por separado.", rationale: "Permite el soporte intravenoso y la obtención de muestras sin retrasar la atención." },
  { id: "oxygen", label: "Oxígeno titulado y reevaluación", group: "intervencion", effect: "oxygen", result: "Se inicia oxígeno con monitorización y reevaluación de la saturación.", rationale: "El oxígeno se titula a la situación clínica; no sustituye el control de la causa del deterioro." },
  { id: "discharge", label: "Dar de alta sin más evaluación", group: "equipo", harmful: true, result: "La evaluación queda incompleta y la causa del dolor o sangrado no está resuelta.", rationale: "En estos escenarios no es seguro dar el alta sin resolver las señales de alarma y establecer un plan." },
];
const lab = (result: string): SimulationAction => ({ id: "labs", label: "Solicitar hemograma y perfil inicial", group: "estudios", minutes: 0.5, result, rationale: "La analítica complementa la evaluación. Un resultado aislado no descarta una urgencia ni debe retrasar la estabilización." });
const ultrasound = (result: string): SimulationAction => ({ id: "ultrasound", label: "Solicitar ecografía pélvica", group: "estudios", minutes: 0.75, requires: ["consent"], result, rationale: "La vía de exploración se acuerda con la paciente. Interpreta los hallazgos junto con la clínica; no demores la atención urgente por obtener imágenes." });
const pregnancy = (result: string): SimulationAction => ({ id: "pregnancy", label: "Solicitar prueba de embarazo / β-hCG", group: "estudios", minutes: 0.5, result, rationale: "La posibilidad de embarazo cambia el diagnóstico diferencial del dolor pélvico; una cifra aislada de β-hCG no localiza el embarazo." });
const fluids: SimulationAction = { id: "fluids", label: "Iniciar soporte con cristaloides y reevaluar", group: "intervencion", requires: ["iv"], effect: "support", result: "Se inicia soporte según valoración y protocolo. La respuesta es parcial: hay que tratar la causa y reevaluar la perfusión.", rationale: "El soporte inicial no sustituye el tratamiento definitivo ni la preparación de sangre cuando está indicada." };
const call: SimulationAction = { id: "call", label: "Activar equipo de ginecología / emergencias", group: "equipo", critical: true, deadline: 180, result: "Equipo avisado mediante comunicación estructurada: situación, antecedentes, valoración y recomendación (SBAR).", rationale: "La ayuda temprana permite abordar en paralelo la estabilización y el tratamiento definitivo." };

export const GYNECOLOGY_CASES: GynecologyCase[] = [
  {
    id: "gyn-01", title: "Dolor pélvico y mareo", specialty: "Ginecología", difficulty: "Alta prioridad",
    name: "Lucía M.", age: 27, background: "G2P1 · última menstruación hace 7 semanas", complaint: "Me duele mucho de este lado y siento que me voy a desmayar.",
    handover: "Dolor en fosa ilíaca derecha de inicio súbito, manchado vaginal y presíncope. No se ha realizado una prueba de embarazo.",
    initial: { hr: 116, sbp: 94, dbp: 60, spo2: 97, rr: 24, temp: 36.6 }, bleeding: 80, bleedingRate: 5, deterioration: 1.4,
    diagnosis: "Sospecha de embarazo ectópico complicado", differentials: ["Torsión anexial", "Enfermedad inflamatoria pélvica", "Hemorragia posparto"],
    findings: { head: "Está consciente, ansiosa y pálida. Refiere mareo al incorporarse.", chest: "Ventila espontáneamente; taquicardia y pulsos periféricos débiles.", abdomen: "Dolor predominante en fosa ilíaca derecha, defensa y sensibilidad a la palpación.", pelvis: "Manchado vaginal escaso. El sangrado visible no permite estimar la posible hemorragia interna." },
    history: "Dolor de 2 horas de evolución, amenorrea de 7 semanas y dolor referido al hombro. No refiere alergias conocidas ni tratamiento habitual.",
    actions: [...shared, call, { ...fluids, critical: true }, pregnancy("β-hCG: positiva, 2.450 UI/L. El valor no confirma por sí solo la localización."), lab("Hb 10,2 g/dL · plaquetas 225.000/µL. La Hb inicial puede subestimar una hemorragia aguda."), ultrasound("Sin gestación intrauterina identificada; masa anexial derecha y líquido libre moderado. Hallazgos preocupantes en este contexto."),
      { id: "blood", label: "Solicitar grupo, pruebas cruzadas y reserva de sangre", group: "estudios", critical: true, requires: ["iv"], minutes: 0.5, result: "Banco de sangre avisado y pruebas cruzadas en curso.", rationale: "La posible hemorragia interna requiere anticipar la necesidad de hemoderivados." },
      { id: "definitive", label: "Coordinar valoración quirúrgica urgente", group: "equipo", requires: ["call"], critical: true, effect: "definitive", result: "El equipo acepta valoración quirúrgica urgente. Se mantiene soporte y vigilancia durante el traslado; la causa aún requiere control definitivo.", rationale: "La inestabilidad con sospecha de ectópico requiere atención urgente; no se debe esperar una serie de β-hCG." },
      { id: "wait", label: "Esperar 48 horas para repetir β-hCG", group: "equipo", harmful: true, result: "La espera retrasa la atención de una paciente con signos de compromiso circulatorio.", rationale: "El seguimiento diferido corresponde a pacientes seleccionadas y estables, no a esta presentación." }],
    objectives: ["Reconocer compromiso circulatorio", "Considerar embarazo en el dolor pélvico", "Activar ayuda y anticipar hemorragia interna"],
    source: { label: "NICE · NG126", url: "https://www.nice.org.uk/guidance/ng126" },
  },
  {
    id: "gyn-02", title: "Dolor pélvico y fiebre", specialty: "Ginecología", difficulty: "Intermedia",
    name: "Valeria R.", age: 24, background: "G0 · dolor progresivo desde hace 3 días", complaint: "Me duele abajo del vientre, tengo fiebre y no consigo comer.",
    handover: "Dolor pélvico bilateral, flujo anormal, fiebre y vómitos. Requiere evaluación de embarazo, infección y otras causas de abdomen agudo.",
    initial: { hr: 108, sbp: 108, dbp: 68, spo2: 98, rr: 21, temp: 38.8 }, bleeding: 0, bleedingRate: 0, deterioration: 0.6,
    diagnosis: "Enfermedad inflamatoria pélvica grave", differentials: ["Sospecha de embarazo ectópico complicado", "Torsión anexial", "Hemorragia posparto"],
    findings: { head: "Consciente, fatigada y con mucosas secas.", chest: "Taquicardia, ventilación espontánea sin dificultad aparente.", abdomen: "Dolor en hipogastrio y ambas fosas ilíacas, sin rigidez generalizada.", pelvis: "Con consentimiento: dolor a la movilización cervical, dolor anexial y secreción mucopurulenta." },
    history: "Fiebre desde ayer y vómitos persistentes. Refiere nueva pareja sexual. La entrevista se realiza con privacidad y sin juicios. No tolera medicación oral.",
    actions: [...shared, call, fluids, pregnancy("Prueba de embarazo negativa. Mantener el diagnóstico diferencial según evolución."), lab("Leucocitos 17.800/µL · PCR 96 mg/L · creatinina 0,9 mg/dL."), ultrasound("Engrosamiento tubárico y cambios inflamatorios pélvicos; sin colección definida en este estudio."),
      { id: "samples", label: "Solicitar pruebas de ITS y muestras pertinentes", group: "estudios", requires: ["consent"], minutes: 0.5, result: "Muestras enviadas para gonococo y clamidia; se ofrecen otras pruebas según protocolo y consentimiento.", rationale: "Las pruebas orientan el seguimiento, pero no deben retrasar el tratamiento empírico indicado." },
      { id: "antibiotics", label: "Coordinar antibióticos empíricos según protocolo", group: "intervencion", requires: ["iv", "call"], critical: true, effect: "definitive", result: "Tratamiento parenteral coordinado tras verificar alergias, embarazo y protocolo institucional. La mejoría no es inmediata y requiere vigilancia.", rationale: "La enfermedad grave y la intolerancia oral justifican valorar ingreso y tratamiento parenteral." },
      { id: "admit", label: "Coordinar ingreso y seguimiento de parejas", group: "equipo", requires: ["call"], critical: true, result: "Se coordina ingreso, seguimiento clínico y orientación confidencial sobre parejas y prevención de reinfección.", rationale: "La fiebre alta y los vómitos hacen inadecuado un plan ambulatorio sin reevaluación." }],
    objectives: ["Evaluar infección y diagnósticos alternativos", "Reconocer criterios de ingreso", "Tratar con privacidad y seguimiento"],
    source: { label: "CDC · Enfermedad inflamatoria pélvica", url: "https://www.cdc.gov/std/treatment-guidelines/pid.htm" },
  },
  {
    id: "obs-01", title: "Sangrado después del parto", specialty: "Obstetricia", difficulty: "Alta prioridad",
    name: "Camila A.", age: 28, background: "G2P2 · 20 minutos después de parto vaginal", complaint: "Me siento muy débil… sigo sangrando.",
    handover: "Sangrado continuo tras parto prolongado. Pérdida cuantificada inicial de 1.200 mL. La placenta se describe completa. Requiere respuesta coordinada inmediata.",
    initial: { hr: 118, sbp: 86, dbp: 52, spo2: 92, rr: 26, temp: 36 }, bleeding: 1200, bleedingRate: 65, deterioration: 1.8,
    diagnosis: "Hemorragia posparto con sospecha de atonía uterina", differentials: ["Sospecha de embarazo ectópico complicado", "Enfermedad inflamatoria pélvica", "Torsión anexial"],
    findings: { head: "Palidez marcada, ansiedad y respuesta verbal conservada.", chest: "Pulsos rápidos y débiles. Saturación baja y taquipnea.", abdomen: "Útero aumentado de tamaño, blando y poco contraído a la palpación.", pelvis: "Sangrado vaginal activo. Valorar tono, trauma, tejido y trombina; no asumir una única causa." },
    history: "Parto vaginal de 4 horas de expulsivo; placenta aparentemente íntegra. Sin alergias conocidas. Es necesario revisar antecedentes, fármacos administrados y factores de riesgo.",
    actions: [...shared, call, { ...fluids, critical: true }, lab("Hb 8,7 g/dL · plaquetas 165.000/µL · fibrinógeno 180 mg/dL. Interpretar en contexto de sangrado activo."),
      { id: "quantify", label: "Cuantificar sangrado y evaluar las 4 T", group: "valoracion", critical: true, result: "Se utiliza un sistema de recolección y se revisan tono, trauma, tejido y trombina. El útero permanece hipotónico.", rationale: "La cuantificación objetiva y la búsqueda de causas permiten reconocer y dirigir la respuesta." },
      { id: "massage", label: "Realizar masaje uterino terapéutico", group: "intervencion", requires: ["consent"], critical: true, effect: "support", result: "Se realiza masaje ante sospecha de atonía. La respuesta inicial es parcial; continúa el manejo en equipo.", rationale: "El masaje forma parte del paquete inicial de respuesta a la hemorragia posparto." },
      { id: "uterotonic", label: "Coordinar oxitócico según orden y protocolo", group: "intervencion", requires: ["iv", "call"], critical: true, effect: "support", result: "Se coordina el oxitócico tras verificar orden, vía y contraindicaciones. Se reevalúa el tono y el sangrado.", rationale: "Los oxitócicos se integran en la respuesta inicial junto con las demás medidas, sin esperar una secuencia rígida." },
      { id: "txa", label: "Coordinar ácido tranexámico temprano", group: "intervencion", requires: ["iv", "call"], critical: true, deadline: 240, result: "Se verifica el tiempo desde el parto, orden, vía y administración conforme al protocolo; se mantiene vigilancia.", rationale: "La OMS recomienda el uso temprano dentro de las primeras 3 horas del parto como parte del paquete de respuesta." },
      { id: "blood", label: "Activar banco de sangre y pruebas cruzadas", group: "equipo", requires: ["call"], critical: true, result: "Banco de sangre y equipo de respuesta avisados. Se prepara soporte transfusional según valoración.", rationale: "La inestabilidad y el sangrado activo requieren anticipar soporte transfusional." },
      { id: "definitive", label: "Escalar por sangrado persistente", group: "equipo", requires: ["call", "quantify"], critical: true, effect: "definitive", result: "Se coordina control avanzado de la hemorragia por el equipo. Continúan soporte, búsqueda de causa y reevaluación.", rationale: "El sangrado persistente requiere escalar oportunamente a medidas de control avanzado según recursos y protocolo." }],
    objectives: ["Reconocer hemorragia y compromiso circulatorio", "Iniciar respuesta simultánea y buscar las 4 T", "Escalar y preparar soporte transfusional"],
    source: { label: "OMS · Hemorragia posparto, 2025", url: "https://www.who.int/publications/i/item/9789240115637" },
  },
];

export type Decision = { id: string; at: number };
export type SimulationRun = { caseId: string; elapsed: number; decisions: Decision[]; diagnosis: string; status: "ready" | "running" | "paused" | "finished" };
export const RUN_LIMIT = 12 * 60;
export function createRun(caseId: string): SimulationRun { return { caseId, elapsed: 0, decisions: [], diagnosis: "", status: "ready" }; }
export function actionAvailable(action: SimulationAction, run: SimulationRun) {
  return (action.requires ?? []).every(id => run.decisions.some(d => d.id === id));
}
export function performAction(c: GynecologyCase, run: SimulationRun, id: string): SimulationRun {
  const action = c.actions.find(a => a.id === id);
  if (run.status !== "running" || !action || !actionAvailable(action, run) || run.decisions.some(d => d.id === id)) return run;
  return { ...run, decisions: [...run.decisions, { id, at: run.elapsed }] };
}
export function resultReady(action: SimulationAction, run: SimulationRun) {
  const decision = run.decisions.find(d => d.id === action.id);
  return !!decision && run.elapsed >= decision.at + (action.minutes ?? 0) * 60;
}
export function getPhysiology(c: GynecologyCase, run: SimulationRun) {
  const minutes = run.elapsed / 60;
  const used = (id: string) => run.decisions.some(d => d.id === id);
  const definitiveId = c.id === "gyn-02" ? "antibiotics" : "definitive";
  const escalation = run.decisions.find(d => d.id === definitiveId);
  // Escalation slows deterioration; arranging care does not instantly cure the patient.
  const exposure = escalation ? Math.min(minutes, escalation.at / 60) + Math.max(0, minutes - escalation.at / 60) * 0.15 : minutes;
  const support = Math.min(3, c.actions.filter(a => a.effect === "support" && used(a.id)).length);
  const d = Math.max(0, exposure * c.deterioration - support * 1.5);
  // Integrate loss over the decision timeline so treatment cannot erase earlier blood loss.
  let bloodLoss = c.bleeding;
  const checkpoints = [...new Set([0, ...run.decisions.map(item => item.at), run.elapsed])].sort((a, b) => a - b);
  for (let i = 1; i < checkpoints.length; i++) {
    const from = checkpoints[i - 1];
    const supportAtTime = c.actions.filter(a => a.effect === "support" && run.decisions.some(item => item.id === a.id && item.at <= from)).length;
    const escalationFactor = escalation && escalation.at <= from ? 0.15 : 1;
    bloodLoss += c.bleedingRate * (checkpoints[i] - from) / 60 * escalationFactor / (1 + supportAtTime * 0.35);
  }
  const bleeding = Math.round(bloodLoss);
  const vitals = { ...c.initial,
    hr: Math.min(160, Math.round(c.initial.hr + d * 2)),
    sbp: Math.max(60, Math.round(c.initial.sbp - d * 2)),
    dbp: Math.max(35, Math.round(c.initial.dbp - d)),
    rr: Math.min(36, Math.round(c.initial.rr + d * 0.5)),
    spo2: used("oxygen") ? Math.min(98, c.initial.spo2 + 5) : c.initial.spo2,
  };
  return { vitals, bleeding, shockIndex: vitals.hr / vitals.sbp, escalated: !!escalation, critical: vitals.sbp < 90 || vitals.spo2 < 94 || vitals.hr / vitals.sbp >= 1 };
}
export function evaluateRun(c: GynecologyCase, run: SimulationRun) {
  const expected = c.actions.filter(a => a.critical);
  const omitted = expected.filter(a => !run.decisions.some(d => d.id === a.id));
  const late = expected.filter(a => a.deadline !== undefined && run.decisions.some(d => d.id === a.id && d.at > a.deadline!));
  const harmful = c.actions.filter(a => a.harmful && run.decisions.some(d => d.id === a.id));
  const correctDiagnosis = run.diagnosis === c.diagnosis;
  const raw = Math.round((expected.length - omitted.length) / expected.length * 75 + (correctDiagnosis ? 25 : 0) - harmful.length * 15 - late.length * 5);
  // A strong total cannot hide an omitted critical action.
  const score = Math.max(0, Math.min(omitted.length ? 69 : 100, raw));
  return { score, omitted, late, harmful, correctDiagnosis, safe: !omitted.length && !harmful.length && correctDiagnosis };
}
