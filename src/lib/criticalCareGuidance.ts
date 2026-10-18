import {
  hasStudyResult,
  medicationsFor,
  scenarios,
  type SimulationState,
  type Vitals,
  type MonitoringKey,
} from "./criticalCareSimulation";

export type CarePanel = "assessment" | "interventions" | "medications" | "tests" | "ventilator" | "record" | "dialogue" | "monitoring" | "calls" | "history" | "position";
export type CareTarget = { panel: CarePanel; id?: string; zone?: number; read?: boolean };
export type GuidedTask = { title: string; why: string; cta: string; target: CareTarget; waiting?: boolean };
export type DecisionSnapshot = { at: number; title: string; explanation: string; before: Vitals; monitoring?: Partial<Record<MonitoringKey, number>>; observeAfter: number };

export const caseObjectives: Record<SimulationState["scenario"], string> = {
  ventilation: "Comprueba el tubo y el circuito, ajusta el soporte y compara oxigenación, ventilación y presión arterial.",
  stroke: "Reconoce el déficit, registra el inicio y coordina la evaluación y la imagen sin retrasos.",
  asthma: "Valora la respiración, inicia el soporte del caso y comprueba la respuesta al broncodilatador.",
  sepsis: "Reconoce la hipoperfusión, coordina el tratamiento causal y reevalúa la respuesta circulatoria.",
  anaphylaxis: "Identifica el compromiso respiratorio y circulatorio y comprueba la respuesta al tratamiento inicial.",
  hypoglycemia: "Confirma la glucemia, protege la vía aérea y compara conciencia y nuevas muestras tras el tratamiento.",
  obstetric: "Valora la perfusión y el sangrado, pide apoyo y reevalúa la respuesta al soporte.",
};
export const sampleKey = (id: string, at: number) => `${id}:${at}`;
export function priorityComplete(s: SimulationState, id: string) {
  return id.startsWith("study:") ? hasStudyResult(s, id.slice(6)) : s.actions.includes(id) || (id === "med:dextrose" && s.actions.includes("med:glucagon"));
}
export function nextGuidedTask(s: SimulationState, readSamples: string[]): GuidedTask {
  const scenario = scenarios[s.scenario];
  const resolveStudy = (id: string): GuidedTask | null => {
    const definition = scenario.studies.find(study => study.id === id);
    if (!definition) return null;
    const requests = s.studies.filter(study => study.id === id);
    const ready = requests.filter(study => study.readyAt <= s.elapsed);
    const sample = ready[ready.length - 1];
    if (sample && readSamples.includes(sampleKey(id, sample.requestedAt))) return null;
    if (sample) return { title: `Lee el resultado de ${definition.label.toLowerCase()}`, why: "Solicitar una prueba y revisar su resultado son pasos distintos. El valor corresponde al momento de tomar la muestra.", cta: "Leer resultado", target: { panel: "tests", id, read: true } };
    const pending = requests[requests.length - 1];
    if (pending) return { title: `${definition.label}: en proceso`, why: `Faltan ${pending.readyAt - s.elapsed} s de simulación. Puedes continuar otros cuidados mientras llega; pausar también detiene esta espera.`, cta: "Ver solicitud", target: { panel: "tests", id }, waiting: true };
    return { title: `Solicita ${definition.label.toLowerCase()}`, why: "Abre la prueba y pulsa Solicitar. El resultado aparecerá después del tiempo indicado.", cta: "Ir a esta prueba", target: { panel: "tests", id } };
  };
  const resolveAction = (id: string, visited: string[] = []): GuidedTask | null => {
    if (s.actions.includes(id) || visited.includes(id)) return null;
    const action = scenario.actions.find(a => a.id === id);
    if (!action) return null;
    for (const required of action.requires ?? []) {
      const dependency = resolveAction(required, [...visited, id]);
      if (dependency) return dependency;
    }
    if (action.requiresStudy && !hasStudyResult(s, action.requiresStudy)) return resolveStudy(action.requiresStudy);
    return { title: action.label, why: action.description, cta: "Ir a este cuidado", target: { panel: "interventions", id } };
  };
  const unreadComplication = s.complications.find(complication => complication.resolvedAt === undefined && !complication.acknowledged);
  if (unreadComplication) return { title: "Hay una complicación que debes revisar", why: unreadComplication.message, cta: "Ver la alerta activa", target: { panel: "medications", id: `alert:${unreadComplication.id}` } };
  if (s.assessed.length === 0) return { title: "Empieza por el estado general y la vía aérea", why: "Toca el punto 01 de la imagen o su botón con nombre. Leerás un hallazgo; explorar no administra tratamiento. Puedes intervenir sin completar todas las zonas.", cta: "Explorar zona 01", target: { panel: "assessment", zone: 0 } };
  let waiting: GuidedTask | null = null;
  for (const priority of scenario.priorities) {
    let task: GuidedTask | null = null;
    if (priority.startsWith("study:")) task = resolveStudy(priority.slice(6));
    else if (priority.startsWith("med:") && !priorityComplete(s, priority)) {
      const medication = medicationsFor(s.scenario).find(m => m.id === priority.slice(4));
      if (medication) {
        for (const required of medication.requires ?? []) {
          task = resolveAction(required);
          if (task) break;
        }
        if (!task && medication.requiresStudy && !hasStudyResult(s, medication.requiresStudy)) task = resolveStudy(medication.requiresStudy);
        if (!task) task = { title: `Revisa ${medication.name.toLowerCase()}`, why: medication.purpose, cta: "Preparar medicación", target: { panel: "medications", id: medication.id } };
      }
    } else if (priority === "ventilator" && !priorityComplete(s, priority)) task = { title: "Revisa los ajustes del ventilador", why: "Mover un control prepara un cambio. El paciente solo recibe los nuevos ajustes al pulsar Aplicar ajustes. Después compara el monitor.", cta: "Abrir ventilador", target: { panel: "ventilator" } };
    else if (!priorityComplete(s, priority)) task = resolveAction(priority);
    if (task?.waiting) waiting ??= task;
    else if (task) return task;
  }
  if (waiting) return waiting;
  if (s.assessed.length < 4) {
    const zone = scenario.zones.findIndex((_, i) => !s.assessed.includes(i));
    return { title: "Completa los hallazgos que aún no has revisado", why: "Ya registraste las prioridades del ejercicio. Revisa las zonas pendientes sin perder la vigilancia de los signos.", cta: `Explorar zona 0${zone + 1}`, target: { panel: "assessment", zone } };
  }
  if (s.reassessments.length === 0) return { title: "Ahora comprueba la respuesta del paciente", why: "Compara los signos actuales con los de tu última intervención y registra una reevaluación. Hacer clic en una acción no garantiza que el paciente mejore.", cta: "Revisar respuesta", target: { panel: "record", id: "response" } };
  return { title: "Revisa la evolución y las alertas antes de cerrar", why: "Puedes repetir una prueba para obtener una nueva muestra, volver a explorar o finalizar para revisar las decisiones pendientes.", cta: "Ver registro de la práctica", target: { panel: "record" } };
}
export function decisionSnapshot(s: SimulationState, type: "action" | "medication" | "stop-medication" | "ventilator", id?: string): DecisionSnapshot {
  const medication = medicationsFor(s.scenario).find(m => m.id === id);
  const action = scenarios[s.scenario].actions.find(a => a.id === id);
  return { at: s.elapsed, before: { ...s.vitals }, monitoring: { ...s.monitoring }, title: type === "ventilator" ? "Ajustes del ventilador aplicados" : type === "stop-medication" ? `Infusión detenida: ${medication?.name}` : medication?.name ?? action?.label ?? "Intervención registrada", explanation: type === "ventilator" ? "Observa SpO₂, EtCO₂ y presión arterial; los cambios de ventilación y circulación pueden ir en direcciones distintas." : type === "stop-medication" ? "Se detuvo el aporte. El efecto que ya está presente cede gradualmente." : medication?.purpose ?? action?.feedback ?? "Observa la tendencia y reevalúa.", observeAfter: type === "medication" ? (medication?.onset ?? 0) + 12 : 15 };
}
