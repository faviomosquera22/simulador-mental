import { criticalCareScenarios, criticalCareMedications } from "./criticalCareCatalog";

/** Educational trajectories, not a validated physiological or treatment model. */
export type ScenarioId = "obstetric" | "ventilation" | "stroke" | "asthma" | "sepsis" | "anaphylaxis" | "hypoglycemia";
export type Vitals = { hr: number; spo2: number; sbp: number; dbp: number; rr: number; etco2: number; bloodLoss: number; temperature: number; glucose: number; lactate: number; gcs: number };
export type Ventilator = { fio2: number; peep: number; rate: number; volume: number };
export type ClinicalAction = { id: string; label: string; description: string; feedback: string; requires?: string[]; requiresStudy?: string };
export type Study = { kind?: "bedside" | "lab" | "imaging"; id: string; label: string; delay: number; result: string };
export type Scenario = { id: ScenarioId; title: string; patient: string; subtitle: string; presentation: string; baseline: Vitals; zones: { label: string; finding: string }[]; actions: ClinicalAction[]; studies: Study[]; priorities: string[] };
export type Medication = { id: string; name: string; route: string; purpose: string; onset: number; duration: number; cooldown: number; maxDoses: number; requires?: string[]; requiresStudy?: string; continuous?: boolean; effects: Partial<Vitals>; adverse?: { threshold: number; id: string; title: string; message: string; effects: Partial<Vitals> } };
export type MedicationDose = { id: string; at: number; stoppedAt?: number };
export type Complication = { id: string; title: string; message: string; at: number; resolvedAt?: number; acknowledged: boolean };
export type StudyRequest = { id: string; requestedAt: number; readyAt: number; result: string; snapshot: Vitals };
export const criticalCareCaseIds: ScenarioId[] = ["ventilation", "stroke", "asthma", "sepsis", "anaphylaxis", "hypoglycemia"];
export const scenarios: Record<ScenarioId, Scenario> = {
  ...criticalCareScenarios,
  obstetric: {
    id: "obstetric", title: "Hemorragia obstétrica", patient: "Lucía M.", subtitle: "27 años · G2P2 · 30 minutos después del parto",
    presentation: "Sangrado vaginal persistente tras un parto vaginal. Está pálida, mareada y refiere mucha sed. Valora, solicita ayuda e inicia la respuesta a la hemorragia.",
    baseline: { temperature: 36.6, glucose: 112, lactate: 1.4, gcs: 15, hr: 122, spo2: 96, sbp: 88, dbp: 54, rr: 26, etco2: 30, bloodLoss: 900 },
    zones: [
      { label: "A · Conciencia y vía aérea", finding: "Responde a la voz, orientada, ansiosa. Vía aérea permeable; habla en frases completas." },
      { label: "B · Respiración", finding: "Taquipnea, expansión simétrica, sin ruidos agregados. Revalora la respiración durante la colocación del traje." },
      { label: "C · Abdomen y sangrado", finding: "Útero blando y aumentado de tamaño; sangrado vaginal abundante. Sospecha atonía uterina y cuantifica la pérdida." },
      { label: "D/E · Perfusión y exposición", finding: "Extremidades frías, llenado capilar de 4 segundos y palidez. Revisa piel y pérdida sanguínea preservando intimidad y temperatura." },
    ],
    actions: [
      { id: "help", label: "Activar equipo de hemorragia", description: "Pedir apoyo obstétrico y coordinar atención definitiva.", feedback: "Equipo alertado. La coordinación permite la atención definitiva; por sí sola no detiene el sangrado." },
      { id: "iv", label: "Obtener acceso venoso", description: "Preparar acceso para reanimación y muestras.", feedback: "Acceso disponible. Ahora puedes iniciar la reanimación y preparar hemoderivados." },
      { id: "fluids", label: "Iniciar reanimación con líquidos", description: "Cristaloides según protocolo, con reevaluación.", requires: ["iv"], feedback: "La presión tenderá a recuperarse parcialmente. Persiste la pérdida de sangre si no se trata la causa." },
      { id: "massage", label: "Realizar masaje uterino", description: "Respuesta inicial ante el hallazgo de atonía.", feedback: "Mejora transitoria del tono. El sangrado disminuye parcialmente y necesita tratamiento adicional." },
      { id: "uterotonic", label: "Administrar uterotónico indicado", description: "Según prescripción y protocolo obstétrico.", requires: ["help", "iv"], feedback: "Se inicia el tratamiento de la atonía. La pérdida sanguínea se reduce gradualmente, sin revertir la sangre ya perdida." },
      { id: "blood", label: "Coordinar soporte transfusional", description: "Activar banco de sangre y soporte según evaluación del equipo.", requires: ["help", "iv"], feedback: "Soporte transfusional coordinado e iniciado en este escenario. La recuperación circulatoria es progresiva." },
      { id: "definitive", label: "Coordinar control definitivo", description: "Atención obstétrica para controlar la fuente del sangrado.", requires: ["help"], feedback: "Atención definitiva iniciada. El traje es una medida temporal y no sustituye el control de la hemorragia." },
    ],
    studies: [{ id: "cbc", label: "Hemograma", delay: 25, result: "Hb 8,1 g/dL · plaquetas 182.000/µL. Un valor inicial de Hb no permite descartar hemorragia aguda." }, { id: "coag", label: "Coagulación y fibrinógeno", delay: 35, result: "INR 1,4 · fibrinógeno 180 mg/dL. Comunicar al equipo de hemorragia." }, { id: "cross", label: "Grupo y pruebas cruzadas", delay: 30, result: "O positivo · muestra procesada. Coordinar disponibilidad con banco de sangre." }],
    priorities: ["help", "iv", "fluids", "massage", "uterotonic", "blood", "definitive"],
  },
  ventilation: {
    id: "ventilation", title: "Ventilación y oxigenación", patient: "Daniel R.", subtitle: "58 años · Neumonía · Paciente intubado en UCI",
    presentation: "Paciente ya intubado por insuficiencia respiratoria. Desaturación con ventilación inicial insuficiente. Comprueba el circuito y ajusta el ventilador observando la respuesta simultánea.",
    baseline: { temperature: 36.6, glucose: 112, lactate: 1.4, gcs: 15, hr: 112, spo2: 86, sbp: 108, dbp: 68, rr: 28, etco2: 52, bloodLoss: 0 },
    zones: [{ label: "A · Tubo y vía aérea", finding: "Tubo fijado. Verifica posición, permeabilidad y conexiones; secreciones visibles en el circuito." }, { label: "B · Tórax y ventilación", finding: "Expansión bilateral, crepitantes basales. Peso corporal predicho del caso: 65 kg. Relaciona volumen y frecuencia con ventilación minuto." }, { label: "C · Circulación", finding: "Taquicardia y perfusión conservada inicialmente. La PEEP elevada puede reducir la presión arterial." }, { label: "D/E · Conciencia y seguridad", finding: "Sedación prescrita, pupilas simétricas. Revisa fijación, puntos de presión y cabecera." }],
    actions: [{ id: "iv", label: "Obtener acceso venoso", description: "Preparar el acceso para tratamiento prescrito.", feedback: "Acceso venoso disponible." }, { id: "circuit", label: "Comprobar tubo y circuito", description: "Revisar conexiones, expansión y permeabilidad.", feedback: "Circuito verificado. Puedes ajustar el soporte ventilatorio con vigilancia de presión y oxigenación." }, { id: "suction", label: "Aspirar secreciones indicadas", description: "Tras valorar la vía aérea y según técnica del servicio.", requires: ["circuit"], feedback: "Secreciones retiradas en el escenario. La oxigenación puede mejorar de forma parcial." }, { id: "head", label: "Elevar cabecera y revisar fijación", description: "Aplicar medidas de cuidado del paciente ventilado.", feedback: "Cabecera y fijación revisadas. Previene complicaciones; no produce una recuperación inmediata de los signos." }, { id: "help", label: "Solicitar valoración del equipo UCI", description: "Comunicar hipoxemia y respuesta al soporte.", feedback: "Equipo UCI informado. Continúa vigilando respuesta y alarmas." }],
    studies: [{ id: "ecg", kind: "bedside", label: "ECG de 12 derivaciones", delay: 8, result: "ECG del caso." }, { id: "gas", label: "Gasometría arterial inicial", delay: 20, result: "Muestra inicial: pH 7,28 · PaCO₂ 55 mmHg · PaO₂ 58 mmHg. Resultado de la muestra basal; no representa ajustes posteriores. EtCO₂ no equivale a PaCO₂." }, { id: "xray", label: "Radiografía de tórax", delay: 35, result: "Infiltrados bibasales. Tubo endotraqueal en posición adecuada en la imagen del caso." }], priorities: ["circuit", "suction", "head", "help", "ventilator"],
  },
  stroke: {
    id: "stroke", title: "Evaluación inicial de ACV", patient: "Miguel A.", subtitle: "68 años · Déficit neurológico de aparición súbita",
    presentation: "Su acompañante refiere dificultad para hablar y debilidad derecha. Identifica la última vez que estuvo bien, evalúa la vía aérea y activa la ruta de ACV sin retrasar la imagen.",
    baseline: { temperature: 36.6, glucose: 112, lactate: 1.4, gcs: 15, hr: 98, spo2: 90, sbp: 182, dbp: 102, rr: 23, etco2: 36, bloodLoss: 0 },
    zones: [{ label: "A · Conciencia y lenguaje", finding: "Despierto, con disartria y dificultad para nombrar objetos. Última vez visto bien: hace 50 minutos, según acompañante." }, { label: "B · Respiración", finding: "Vía aérea permeable, respiración espontánea. Hipoxemia basal; monitoriza respuesta al oxígeno." }, { label: "C · Circulación", finding: "Presión elevada, pulso regular. No bajar la presión de forma automática: requiere evaluación y protocolo del equipo de ACV." }, { label: "D/E · Evaluación neurológica", finding: "Asimetría facial, caída del brazo derecho y dificultad del lenguaje. Cribado compatible con ACV; requiere escala y evaluación completas." }],
    actions: [{ id: "pressure-plan", label: "Confirmar objetivos de presión con equipo de ACV", description: "Revisión especializada tras la imagen; se documenta la indicación individual del caso.", requires: ["help", "onset"], requiresStudy: "ct", feedback: "Objetivos revisados con el equipo. La opción farmacológica requiere prescripción individual y vigilancia; no bajar presión automáticamente por una cifra aislada." }, { id: "onset", label: "Registrar última vez visto bien", description: "Confirmar hora con paciente o acompañante.", feedback: "Inicio documentado: hace 50 minutos al ingreso. Es información crítica para el equipo; el déficit no desaparece por valorarlo." }, { id: "help", label: "Activar código ACV", description: "Solicitar evaluación urgente del equipo de ictus.", feedback: "Ruta de ACV activada. No se ha seleccionado tratamiento de reperfusión: requiere imagen y evaluación especializada." }, { id: "oxygen", label: "Administrar oxígeno por hipoxemia", description: "Titular y reevaluar saturación según protocolo.", feedback: "La saturación tenderá a mejorar. El oxígeno no resuelve por sí mismo la lesión neurológica." }, { id: "glucose", label: "Medir glucemia capilar", description: "Buscar hipoglucemia como diagnóstico alternativo.", feedback: "Glucemia: 112 mg/dL. No hay hipoglucemia en este caso." }, { id: "swallow", label: "Mantener ayuno y solicitar cribado de deglución", description: "Prevenir aspiración hasta valoración de seguridad.", feedback: "Ayuno y evaluación de deglución registrados. No se administran líquidos ni medicación por boca." }, { id: "iv", label: "Obtener acceso venoso", description: "Preparar muestras y atención especializada.", feedback: "Acceso disponible, sin retrasar el traslado a imagen." }],
    studies: [{ id: "glucose", kind: "bedside", label: "Glucemia capilar", delay: 3, result: "Muestra capilar." }, { id: "fast", kind: "bedside", label: "Cribado FAST y última vez visto bien", delay: 5, result: "Asimetría facial, caída de brazo derecho y alteración de lenguaje. Última vez visto bien: 50 min antes del ingreso. Cribado positivo; no reemplaza NIHSS ni evaluación especializada." }, { id: "ct", label: "TC de cráneo sin contraste", delay: 30, result: "Sin hemorragia intracraneal visible en la TC simulada. No descarta isquemia precoz. El equipo debe completar la evaluación para decidir tratamiento." }, { id: "cbc", label: "Hemograma y coagulación", delay: 25, result: "Plaquetas 215.000/µL · INR 1,0. Integrar antecedentes, imagen y criterios del protocolo." }], priorities: ["onset", "help", "oxygen", "glucose", "swallow", "iv", "study:ct"],
  },
};
export const garmentSteps = [
  { title: "Preparar y colocar debajo", detail: "Explica el procedimiento. Despliega el traje debajo de la paciente y alinea su borde superior con las costillas inferiores." },
  { title: "Segmento 1 · Tobillos", detail: "Cierra los dos segmentos de los tobillos antes de avanzar hacia arriba." },
  { title: "Segmento 2 · Pantorrillas", detail: "Coloca ambos segmentos de pantorrillas y deja libres las rodillas." },
  { title: "Segmento 3 · Muslos", detail: "Cierra los segmentos de ambos muslos manteniendo libres las rodillas." },
  { title: "Segmento 4 · Pelvis", detail: "Una persona cierra el segmento pélvico; el borde inferior queda a nivel del pubis." },
  { title: "Segmento 5 · Compresión abdominal", detail: "Alinea la bola de presión sobre el ombligo según las instrucciones del dispositivo." },
  { title: "Segmento 6 · Cierre abdominal", detail: "Completa el cierre abdominal y comprueba que la paciente pueda respirar con normalidad." },
  { title: "Reevaluar y coordinar traslado", detail: "Revisa respiración, perfusión y signos. Mantén la atención de la causa y coordina atención definitiva. No retires el traje en esta práctica." },
];
export type SimulationState = {
  scenario: ScenarioId; status: "ready" | "running" | "paused" | "finished"; elapsed: number; vitals: Vitals;
  assessed: number[]; actions: string[]; studies: StudyRequest[]; medications: MedicationDose[]; complications: Complication[]; reassessments: { at: number; vitals: Vitals }[]; garment: number; ventilator: Ventilator;
  log: { at: number; text: string }[]; feedback: string; history: { at: number; hr: number; sbp: number; spo2: number }[];
};
export type SimulationEvent = { type: "start" | "pause" | "finish" | "tick" | "reassess" } | { type: "reset"; scenario: ScenarioId } | { type: "assess"; zone: number } | { type: "action"; id: string } | { type: "study"; id: string } | { type: "garment"; step: number } | { type: "ventilator"; settings: Ventilator } | { type: "medication"; id: string } | { type: "stop-medication"; id: string } | { type: "acknowledge"; id: string };
export function createSimulation(scenario: ScenarioId): SimulationState {
  const vitals = { ...scenarios[scenario].baseline };
  return { scenario, status: "ready", elapsed: 0, vitals, assessed: [], actions: [], studies: [], medications: [], complications: [], reassessments: [], garment: 0, ventilator: { fio2: 30, peep: 3, rate: 10, volume: 350 }, log: [], feedback: "Lee la presentación e inicia la práctica para valorar al paciente.", history: [{ at: 0, hr: vitals.hr, sbp: vitals.sbp, spo2: vitals.spo2 }] };
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
function record(s: SimulationState, text: string): SimulationState { return { ...s, feedback: text, log: [...s.log, { at: s.elapsed, text }] }; }
export function simulationReducer(s: SimulationState, event: SimulationEvent): SimulationState {
  if (event.type === "reset") return createSimulation(event.scenario);
  if (event.type === "start" && (s.status === "ready" || s.status === "paused")) return record({ ...s, status: "running" }, "Simulación en curso. El tiempo y la fisiología evolucionan juntos.");
  if (event.type === "pause" && s.status === "running") return { ...s, status: "paused" };
  if (event.type === "finish" && (s.status === "running" || s.status === "paused")) return record({ ...s, status: "finished" }, "Práctica finalizada. Revisa tus decisiones y los pendientes.");
  if (s.status !== "running") return s;
  const scenario = scenarios[s.scenario];
  if (event.type === "reassess") {
    return record({ ...s, reassessments: [...s.reassessments, { at: s.elapsed, vitals: { ...s.vitals } }] }, `Reevaluación registrada: FC ${Math.round(s.vitals.hr)} lpm, SpO₂ ${Math.round(s.vitals.spo2)}%, PA ${Math.round(s.vitals.sbp)}/${Math.round(s.vitals.dbp)} mmHg, FR ${Math.round(s.vitals.rr)} rpm. Leer y registrar los signos no modifica la fisiología.`);
  }
  if (event.type === "assess") {
    const zone = scenario.zones[event.zone];
    if (!zone) return s;
    return record({ ...s, assessed: [...new Set([...s.assessed, event.zone])] }, assessmentFinding(s, event.zone));
  }
  if (event.type === "action") {
    const action = scenario.actions.find(a => a.id === event.id);
    if (!action || s.actions.includes(action.id)) return s;
    if (action.requiresStudy && !hasStudyResult(s, action.requiresStudy)) return record(s, "Necesitas el resultado de " + scenario.studies.find(a => a.id === action.requiresStudy)?.label + ".");
    if (action.requires?.some(id => !s.actions.includes(id))) return record(s, "Primero: " + action.requires.filter(id => !s.actions.includes(id)).map(id => scenario.actions.find(a => a.id === id)?.label).join(" y ") + ".");
    return record({ ...s, actions: [...s.actions, action.id] }, action.feedback);
  }
  if (event.type === "study") {
    const study = scenario.studies.find(a => a.id === event.id);
    if (!study || s.studies.some(a => a.id === event.id && a.readyAt > s.elapsed)) return s;
    const snapshot = { ...s.vitals };
    const request: StudyRequest = { id: study.id, requestedAt: s.elapsed, readyAt: s.elapsed + study.delay, snapshot, result: studyResult(study, s) };
    return record({ ...s, studies: [...s.studies, request], actions: [...new Set([...s.actions, "study:" + study.id])] }, `${study.label}: muestra/solicitud registrada a ${formatClinicalTime(s.elapsed)}. Resultado en ${study.delay} segundos de simulación.`);
  }
  if (event.type === "medication") {
    const medication = medicationsFor(s.scenario).find(m => m.id === event.id);
    if (!medication) return s;
    const blocked = medicationBlock(s, medication);
    if (blocked) return record(s, blocked);
    return record({ ...s, medications: [...s.medications, { id: medication.id, at: s.elapsed }], actions: [...new Set([...s.actions, "med:" + medication.id])] }, `${medication.name} administrado en pauta simulada. Inicio tras ${medication.onset} s; vigila respuesta y complicaciones. Los tiempos están acelerados para el ejercicio.`);
  }
  if (event.type === "stop-medication") {
    const medication = medicationsFor(s.scenario).find(m => m.id === event.id);
    if (!medication?.continuous) return s;
    if (!s.medications.some(d => d.id === event.id && d.stoppedAt === undefined && s.elapsed < d.at + medication.onset + medication.duration)) return s;
    return record({ ...s, medications: s.medications.map(d => d.id === event.id && d.stoppedAt === undefined ? { ...d, stoppedAt: s.elapsed } : d) }, `Aporte de ${medication.name} detenido. El efecto disminuye gradualmente; no desaparece de inmediato.`);
  }
  if (event.type === "acknowledge") {
    return { ...s, complications: s.complications.map(c => c.id === event.id ? { ...c, acknowledged: true } : c) };
  }
  if (event.type === "garment") {
    if (s.scenario !== "obstetric" || event.step !== s.garment || s.garment >= garmentSteps.length) return s;
    if (!s.actions.includes("help")) return record(s, "Activa primero al equipo de hemorragia. El traje acompaña la reanimación y el control de la causa.");
    return record({ ...s, garment: s.garment + 1 }, garmentSteps[s.garment].detail);
  }
  if (event.type === "ventilator") {
    if (s.scenario !== "ventilation" || !s.actions.includes("circuit")) return record(s, "Comprueba primero el tubo y el circuito.");
    const v = event.settings;
    if (Object.values(v).some(n => !Number.isFinite(n))) return s;
    const settings = { fio2: clamp(v.fio2, 21, 100), peep: clamp(v.peep, 0, 18), rate: clamp(v.rate, 6, 30), volume: clamp(v.volume, 250, 650) };
    return record({ ...s, ventilator: settings, actions: [...new Set([...s.actions, "ventilator"])] }, `Ajuste aplicado: FiO₂ ${settings.fio2}%, PEEP ${settings.peep}, FR ${settings.rate}, VT ${settings.volume} mL. Observa la tendencia y las alarmas antes de otro ajuste.`);
  }
  if (event.type !== "tick") return s;
  const elapsed = s.elapsed + 1;
  const has = (id: string) => s.actions.includes(id);
  let target = { ...scenario.baseline };
  if (s.scenario === "obstetric") {
    const control = has("definitive") && has("uterotonic");
    const rate = control ? 0.12 : Math.max(0.6, 3.5 - (has("massage") ? 0.7 : 0) - (has("uterotonic") ? 1.3 : 0) - (s.garment >= 7 ? 0.6 : 0));
    const bloodLoss = s.vitals.bloodLoss + rate;
    const deficit = Math.max(0, bloodLoss - 900) / 70;
    const support = (has("fluids") ? 8 : 0) + (has("blood") ? 14 : 0) + (s.garment >= 7 ? 9 : s.garment >= 5 ? 3 : 0);
    target = { ...target, hr: clamp(122 + deficit * 1.5 - support * 0.6, 78, 160), sbp: clamp(88 - deficit + support, 55, 118), dbp: clamp(54 - deficit * 0.6 + support * 0.5, 30, 78), spo2: clamp(96 - deficit * 0.08, 88, 99), rr: clamp(26 + deficit * 0.2 - support * 0.12, 16, 36), etco2: 30, bloodLoss };
  } else if (s.scenario === "ventilation") {
    const v = s.ventilator;
    const minute = v.rate * v.volume / 1000;
    target.spo2 = clamp(83 + (v.fio2 - 21) * 0.22 + v.peep * 0.65 + (has("suction") ? 2 : 0) - elapsed / 200, 76, 99);
    target.etco2 = clamp(52 * 3.5 / minute, 22, 70);
    target.rr = v.rate;
    target.sbp = clamp(108 - Math.max(0, v.peep - 8) * 3, 65, 115);
    target.dbp = target.sbp * 0.63;
    target.hr = clamp(112 - (target.spo2 - 86) * 1.4 + Math.max(0, 90 - target.sbp) * 0.4, 75, 145);
  } else if (s.scenario === "stroke") {
    target.spo2 = has("oxygen") ? 96 : clamp(90 - elapsed / 90, 84, 90);
    target.hr = has("oxygen") ? 90 : 98 + Math.min(12, elapsed / 30);
    target.rr = has("oxygen") ? 19 : 23;
    // Observation, activation and CT do not magically resolve the neurological lesion or hypertension.
  }
  if (s.scenario === "asthma") {
    const bronchodilation = medicationExposure(s, "salbutamol", elapsed);
    const deterioration = Math.min(1, elapsed / 120) * (bronchodilation > 0.6 ? 0.15 : 1);
    target.spo2 = 88 - deterioration * 4 + (has("oxygen") ? 4 : 0);
    target.hr = 124 + deterioration * 10;
    target.rr = 32 + deterioration * 5;
    target.etco2 = 45 + deterioration * 8;
  }
  if (s.scenario === "sepsis") {
    const causal = Math.min(1, medicationExposure(s, "antibiotic", elapsed));
    const deterioration = Math.min(1, elapsed / 180) * (1 - causal * 0.75);
    target.sbp = 84 - deterioration * 12 + (has("fluids") ? 10 : 0) + (has("source") ? 4 : 0);
    target.dbp = 48 - deterioration * 7 + (has("fluids") ? 6 : 0);
    target.hr = 126 + deterioration * 10 - (has("fluids") ? 5 : 0);
    target.spo2 = 90 - deterioration * 2 + (has("oxygen") ? 6 : 0);
    target.temperature = 39.2 + deterioration * 0.3;
    target.lactate = 4.8 + deterioration * 1.5 - (has("fluids") ? 0.5 : 0);
  }
  if (s.scenario === "anaphylaxis") {
    const adrenaline = medicationExposure(s, "adrenaline", elapsed);
    const deterioration = Math.min(1, elapsed / 90) * (adrenaline > 0.5 ? 0.1 : 1);
    target.sbp = 78 - deterioration * 16 + (has("fluids") ? 10 : 0);
    target.dbp = 44 - deterioration * 9 + (has("fluids") ? 6 : 0);
    target.spo2 = 89 - deterioration * 7 + (has("oxygen") ? 3 : 0);
    target.hr = 132 + deterioration * 12;
    target.rr = 30 + deterioration * 6;
  }
  if (s.scenario === "hypoglycemia") {
    target.glucose = Math.max(28, 38 - elapsed / 35);
    target.hr = 114 + Math.min(12, elapsed / 15);
  }
  const activeComplications: { id: string; title: string; message: string }[] = [];
  for (const medication of medicationsFor(s.scenario)) {
    const exposure = medicationExposure(s, medication.id, elapsed);
    for (const [key, value] of Object.entries(medication.effects)) target[key as keyof Vitals] += (value ?? 0) * exposure;
    if (medication.adverse && exposure >= medication.adverse.threshold) {
      activeComplications.push(medication.adverse);
      for (const [key, value] of Object.entries(medication.adverse.effects)) target[key as keyof Vitals] += value ?? 0;
    }
  }
  if (s.scenario === "hypoglycemia") {
    target.gcs = target.glucose >= 75 ? 15 : target.glucose >= 55 ? 13 : 10;
    if (target.glucose > 75) target.hr = Math.min(target.hr, 94);
  }
  const bounds: Record<keyof Vitals, [number, number]> = { hr: [40, 190], spo2: [65, 99], sbp: [50, 230], dbp: [28, 140], rr: [6, 44], etco2: [20, 80], bloodLoss: [0, 100000], temperature: [35, 41], glucose: [20, 400], lactate: [0.8, 12], gcs: [3, 15] };
  const vitals = { ...s.vitals };
  for (const key of Object.keys(bounds) as (keyof Vitals)[]) {
    if (key === "bloodLoss") vitals[key] = target[key];
    else vitals[key] += (clamp(target[key], ...bounds[key]) - vitals[key]) * 0.14;
  }
  if (s.scenario === "asthma" && elapsed >= 60 && medicationExposure(s, "salbutamol", elapsed) < 0.3) activeComplications.push({ id: "bronchospasm", title: "Broncoespasmo persistente", message: "Persisten obstrucción y fatiga. El oxígeno aislado no trata el broncoespasmo; solicita reevaluación urgente." });
  if (s.scenario === "sepsis" && vitals.sbp < 85 && elapsed >= 45) activeComplications.push({ id: "septic-shock", title: "Hipoperfusión persistente", message: "Presión y perfusión comprometidas. Reevalúa líquidos, soporte indicado, antimicrobiano y control del foco." });
  if (s.scenario === "anaphylaxis" && elapsed >= 45 && medicationExposure(s, "adrenaline", elapsed) < 0.3) activeComplications.push({ id: "airway-edema", title: "Progresión de compromiso respiratorio", message: "La amenaza respiratoria y el choque persisten. El antihistamínico no sustituye el tratamiento inicial de la anafilaxia." });
  if (s.scenario === "hypoglycemia" && vitals.glucose < 45) activeComplications.push({ id: "neuroglycopenia", title: "Neuroglucopenia", message: "Glucemia baja con conciencia alterada. Mantén seguridad de vía aérea, tratamiento indicado y reevaluación capilar." });
  const results = s.studies.filter(study => study.readyAt === elapsed).map(study => `${scenario.studies.find(a => a.id === study.id)?.label}: resultado disponible.`);
  let next: SimulationState = { ...s, elapsed, vitals, history: elapsed % 3 === 0 ? [...s.history, { at: elapsed, hr: vitals.hr, sbp: vitals.sbp, spo2: vitals.spo2 }].slice(-120) : s.history };
  for (const result of results) next = record(next, result);
  const activeIds = new Set(activeComplications.map(c => c.id));
  next = { ...next, complications: next.complications.map(c => activeIds.has(c.id) ? c : c.resolvedAt === undefined ? { ...c, resolvedAt: elapsed } : c) };
  for (const complication of activeComplications) {
    const previous = next.complications.find(c => c.id === complication.id);
    if (!previous || previous.resolvedAt !== undefined) {
      next = { ...next, complications: [...next.complications.filter(c => c.id !== complication.id), { id: complication.id, title: complication.title, message: complication.message, at: elapsed, acknowledged: false }] };
      next = record(next, `ALERTA · ${complication.title}: ${complication.message}`);
    }
  }
  for (const previous of s.complications.filter(c => c.resolvedAt === undefined)) {
    if (!activeIds.has(previous.id)) next = record(next, `Reevaluación · ${previous.title}: dejó de cumplir el criterio de alerta; continúa la vigilancia.`);
  }
  return next;
}
export function medicationsFor(scenario: ScenarioId): Medication[] { return criticalCareMedications[scenario] ?? []; }
export function hasStudyResult(s: SimulationState, id: string) { return s.studies.some(study => study.id === id && study.readyAt <= s.elapsed); }
export function medicationExposure(s: SimulationState, id: string, at = s.elapsed): number {
  const medication = medicationsFor(s.scenario).find(m => m.id === id);
  if (!medication) return 0;
  return s.medications.filter(d => d.id === id).reduce((sum, dose) => {
    const age = at - dose.at - medication.onset;
    if (age <= 0 || age >= medication.duration) return sum;
    const onset = Math.min(1, age / 12);
    const fading = Math.min(1, (medication.duration - age) / 30);
    const stopped = dose.stoppedAt === undefined ? 1 : Math.max(0, 1 - (at - dose.stoppedAt) / 18);
    return sum + onset * fading * stopped;
  }, 0);
}
export function medicationBlock(s: SimulationState, medication: Medication): string | null {
  if (s.status !== "running") return "Inicia o continúa la práctica para administrar.";
  const doses = s.medications.filter(d => d.id === medication.id);
  if (doses.length >= medication.maxDoses) return "Límite de exposiciones del ejercicio alcanzado. Reevalúa con el equipo.";
  const last = doses[doses.length - 1];
  if (last && s.elapsed - last.at < medication.cooldown) return `Reevalúa antes de repetir: disponible en ${medication.cooldown - (s.elapsed - last.at)} s de simulación.`;
  const missing = medication.requires?.filter(id => !s.actions.includes(id)) ?? [];
  if (missing.length) return "Antes: " + missing.map(id => scenarios[s.scenario].actions.find(a => a.id === id)?.label ?? id).join(" · ");
  if (medication.requiresStudy && !hasStudyResult(s, medication.requiresStudy)) return "Requiere resultado: " + scenarios[s.scenario].studies.find(study => study.id === medication.requiresStudy)?.label;
  return null;
}
function studyResult(study: Study, s: SimulationState): string {
  const v = s.vitals;
  if (study.id === "glucose") return `Glucemia capilar: ${Math.round(v.glucose)} mg/dL. ${v.glucose < 70 ? "Hipoglucemia en esta muestra." : v.glucose > 180 ? "Glucemia elevada en esta muestra; reevalúa la pauta." : "Correlaciona con conciencia y vigila recurrencia."}`;
  if (study.id === "gcs") return `Conciencia simulada: Glasgow ${Math.round(v.gcs)}/15. ${v.gcs < 14 ? "Alteración de conciencia; no administrar por boca." : "Revisar alerta y realizar cribado formal antes de ingesta."}`;
  if (study.id === "lactate") return `Lactato: ${v.lactate.toFixed(1)} mmol/L. Interpretar con presión, perfusión y tendencia.`;
  if (study.id === "perfusion") return `PA ${Math.round(v.sbp)}/${Math.round(v.dbp)} mmHg · PAM ${Math.round((v.sbp + 2 * v.dbp) / 3)} mmHg · FR ${Math.round(v.rr)} rpm · Glasgow ${Math.round(v.gcs)}/15. Reevaluación de esta muestra, no una certificación de estabilidad.`;
  if (study.id === "peakflow") return `Flujo espiratorio simulado: ${Math.round(Math.min(75, 30 + medicationExposure(s, "salbutamol") * 15 + medicationExposure(s, "ipratropium") * 8))}% del mejor/predicho del caso. Si no tolera la maniobra, prioriza soporte y tratamiento.`;
  if (study.id === "ecg") return `Muestra ECG del escenario: ritmo sinusal, FC ${Math.round(v.hr)} lpm. El trazado del monitor es ilustrativo; esta prueba no interpreta un ECG real.`;
  if (study.id === "gas") return `Gasometría sintética del caso: pH ${(7.40 - (v.etco2 + 5 - 40) * 0.008).toFixed(2)} · PaCO₂ ${Math.round(v.etco2 + 5)} mmHg · PaO₂ ${Math.round(45 + Math.max(0, v.spo2 - 80) * 2.5)} mmHg. Valores generados por el modelo para esta muestra; EtCO₂ no equivale a PaCO₂ en clínica.`;
  if (study.id === "potassium") return `Potasio de la muestra simulada: ${(3.7 - Math.min(1, medicationExposure(s, "salbutamol") * 0.25)).toFixed(1)} mmol/L. Correlaciona con exposiciones broncodilatadoras y ECG.`;
  return study.result;
}

export function clinicalAlerts(s: SimulationState): string[] {
  const alerts: string[] = [];
  if (s.vitals.spo2 < 92) alerts.push("Hipoxemia: revalora vía aérea y oxigenación.");
  if (s.vitals.sbp < 90) alerts.push("Hipotensión: revalora perfusión y respuesta al soporte.");
  if (s.scenario === "obstetric" && s.vitals.hr / s.vitals.sbp >= 1) alerts.push("Índice de choque elevado; la hemorragia requiere atención urgente.");
  if (s.scenario === "ventilation") {
    if (s.ventilator.volume / 65 > 8) alerts.push("VT superior a 8 mL/kg de peso predicho en este caso; revisa protección pulmonar.");
    if (s.ventilator.peep > 12) alerts.push("PEEP elevada: vigila repercusión hemodinámica.");
    if (s.vitals.etco2 < 28 || s.vitals.etco2 > 50) alerts.push("EtCO₂ fuera del intervalo del ejercicio: revisa ventilación y gasometría.");
  }
  if (s.scenario === "stroke" && !s.actions.includes("help")) alerts.push("Déficit neurológico: activa la ruta de ACV y solicita imagen.");
  if (s.vitals.temperature >= 38.5) alerts.push("Fiebre: reevalúa foco y tratamiento indicado.");
  if (s.scenario === "hypoglycemia" && s.vitals.glucose < 70) alerts.push("Glucemia baja: confirma muestra y reevalúa tratamiento y conciencia.");
  if (s.vitals.hr > 150) alerts.push("Taquicardia marcada: reevalúa causa y exposición farmacológica.");
  return alerts;
}
export function formatClinicalTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

export function assessmentFinding(s: SimulationState, zone: number): string {
  const initial = scenarios[s.scenario].zones[zone]?.finding;
  if (!initial) return "Zona no disponible.";
  const v = s.vitals;
  const current = zone === 0 ? `Glasgow actual ${Math.round(v.gcs)}/15; continúa la vigilancia de vía aérea.` : zone === 1 ? `FR ${Math.round(v.rr)} rpm, SpO₂ ${Math.round(v.spo2)}%, EtCO₂ ${Math.round(v.etco2)} mmHg.` : zone === 2 ? `FC ${Math.round(v.hr)} lpm, PA ${Math.round(v.sbp)}/${Math.round(v.dbp)} mmHg.` : `Temperatura ${v.temperature.toFixed(1)} °C, Glasgow ${Math.round(v.gcs)}/15${s.scenario === "hypoglycemia" && hasStudyResult(s, "glucose") ? `. Consulta la última muestra de glucemia y repite si necesitas una nueva medición` : ""}.`;
  return `Hallazgo al ingreso: ${initial} Reevaluación ${formatClinicalTime(s.elapsed)}: ${current}`;
}
