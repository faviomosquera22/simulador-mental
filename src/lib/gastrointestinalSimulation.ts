export type GiMode = "practice" | "assessment";
export type GiVariant = "standard" | "intolerance";
export type GiTool = "identity" | "soap" | "gloves" | "thermometer" | "cuff" | "stethoscope" | "hydration" | "jug" | "ors" | "sample" | "medication" | "call" | "education" | "iv";
export type GiTarget = "patient" | "head" | "arm" | "abdomen" | "hands" | "bedside" | "bin";
export type GiActionId = "identify" | "wash" | "gloves" | "discard" | "triage" | "history" | "temperature" | "vitals" | "abdomen" | "hydration" | "balance" | "classify" | "diagnostics" | "prepare" | "drink" | "wait" | "reassess" | "teach" | "antibiotic" | "sample" | "urgent" | "position" | "iv" | "handoff";
export type GiAction = { id: GiActionId; value?: string | number; target?: GiTarget };
type GiFlag = "identified" | "triaged" | "symptoms" | "exposure" | "background" | "temperature" | "vitals" | "abdomen" | "hydration" | "balance" | "classified" | "diagnostics" | "educated" | "positioned" | "ivPrepared";
export type GiEvent = { id: number; minute: number; title: string; detail: string; kind: "care" | "observation" | "error" | "alert" };
export type GiCorrection = { title: string; reason: string; recommendation: string };
export type GiState = {
  mode: GiMode; variant: GiVariant; minute: number; paused: boolean;
  flags: Partial<Record<GiFlag, boolean>>; gloves: "available" | "worn" | "disposed"; cleanHands: boolean;
  solution: "unprepared" | "prepared" | "empty"; remainingMl: number; oralMl: number; pendingMl: number;
  stoolMl: number; vomitMl: number; urineMl: number; reviewAt: number; balanceAt: number;
  alertAt: number | null; urgentAt: number; mistakes: number; critical: number;
  outcome: "observing" | "escalated" | null; events: GiEvent[];
};
export const GI_PATIENT = { name: "Andrés Molina", age: 35, id: "GI-1042", weight: 70, reason: "Diarrea acuosa, cólicos y mucha sed desde ayer.", context: "Adulto consciente y colaborador, sin cardiopatía ni enfermedad renal conocida. Sospecha de gastroenteritis infecciosa; el agente no está confirmado." };
export const GI_HISTORY = [
  { id: "symptoms", question: "¿Cómo empezaron los síntomas?", response: "Desde hace 18 horas he ido al baño seis veces, muy líquido y sin sangre. Vomité dos veces; la última fue hace cuatro horas. Ahora puedo beber. El dolor es como cólicos, no en un punto fijo." },
  { id: "exposure", question: "¿Qué comiste y hay otros enfermos?", response: "Ayer comí fuera de casa. No sé de otras personas enfermas. No he viajado recientemente y no he tomado antibióticos en los últimos meses." },
  { id: "background", question: "¿Cuánto bebes, orinas y qué antecedentes tienes?", response: "He bebido poco. Oriné hace seis horas, poca cantidad y oscura. No tengo alergias conocidas, enfermedades renales o del corazón, ni inmunosupresión conocida." },
] as const;
export const GI_TOOLS: Record<GiTool, { name: string; purpose: string; target: GiTarget; action: GiActionId; singleUse?: boolean }> = {
  identity: { name: "Entrevista y pulsera", purpose: "Identifica, explica y escucha al paciente.", target: "patient", action: "identify" },
  soap: { name: "Agua y jabón", purpose: "Higiene de manos y prevención de transmisión.", target: "hands", action: "wash" },
  gloves: { name: "Guantes de protección", purpose: "Protección para el contacto del caso; retirar antes de preparar la bebida.", target: "hands", action: "gloves", singleUse: true },
  thermometer: { name: "Termómetro", purpose: "Mide y registra la temperatura.", target: "head", action: "temperature" },
  cuff: { name: "Tensiómetro y monitor", purpose: "Registra presión, pulso y respiración.", target: "arm", action: "vitals" },
  stethoscope: { name: "Exploración abdominal", purpose: "Ausculta y completa una exploración respetuosa, sin maniobras dolorosas repetidas.", target: "abdomen", action: "abdomen" },
  hydration: { name: "Valorar hidratación", purpose: "Observa sed, mucosas, perfusión, conciencia y capacidad de beber.", target: "head", action: "hydration" },
  jug: { name: "Balance de líquidos", purpose: "Registra entradas y pérdidas observadas; distingue los datos previos referidos.", target: "bedside", action: "balance" },
  ors: { name: "Sales de rehidratación oral", purpose: "Prepara el sobre del caso con el volumen indicado en su envase y ofrece sorbos fraccionados.", target: "bedside", action: "prepare", singleUse: true },
  sample: { name: "Recipiente para muestra", purpose: "La necesidad de estudio depende de los hallazgos y de la indicación clínica.", target: "bedside", action: "sample", singleUse: true },
  medication: { name: "Revisar medicación", purpose: "Valora si existe una indicación; no hay una prescripción de antibiótico en este caso.", target: "patient", action: "antibiotic" },
  call: { name: "Llamar al equipo", purpose: "Comunica el deterioro y solicita valoración urgente.", target: "bedside", action: "urgent" },
  education: { name: "Educación al paciente", purpose: "Explica hidratación, alimentación, higiene y señales de alarma.", target: "patient", action: "teach" },
  iv: { name: "Preparar acceso venoso", purpose: "Prepara el equipo para personal competente según protocolo; no inicia líquidos sin indicación.", target: "arm", action: "iv" },
};
export const GI_TARGETS: Record<GiTarget, string> = { patient: "Conversar con Andrés", head: "Cara e hidratación", arm: "Brazo / signos vitales", abdomen: "Abdomen", hands: "Tus manos y protección", bedside: "Mesa de cuidados", bin: "Retirar y desechar guantes" };
export function giToolAction(tool: GiTool, state: GiState): GiActionId {
  if (tool === "identity" && state.flags.identified) return "history";
  if (tool === "ors" && state.solution !== "unprepared") return "drink";
  if (tool === "gloves" && state.gloves === "worn") return "discard";
  return GI_TOOLS[tool].action;
}
export function giToolTarget(tool: GiTool, state: GiState): GiTarget {
  if (tool === "ors" && state.solution !== "unprepared") return "patient";
  if (tool === "gloves" && state.gloves === "worn") return "bin";
  return GI_TOOLS[tool].target;
}
export function createGiState(mode: GiMode = "practice", variant: GiVariant = "standard"): GiState {
  return { mode, variant, minute: 0, paused: false, flags: {}, gloves: "available", cleanHands: false, solution: "unprepared", remainingMl: 0, oralMl: 0, pendingMl: 0, stoolMl: 0, vomitMl: 0, urineMl: 0, reviewAt: -1, balanceAt: -1, alertAt: null, urgentAt: -1, mistakes: 0, critical: 0, outcome: null, events: [] };
}
export function giVitals(state: GiState) {
  if (state.alertAt !== null) return { hr: 124, systolic: 90, diastolic: 58, rr: 24, spo2: 98, temperature: 37.8, capillary: 4, thirst: "Intensa", consciousness: "Responde, con mareo y debilidad", pain: 5 };
  const absorbed = state.oralMl;
  const progress = Math.min(1, absorbed / 1000);
  return { hr: Math.round(108 - 18 * progress), systolic: Math.round(108 + 8 * progress), diastolic: Math.round(68 + 6 * progress), rr: Math.round(20 - 2 * progress), spo2: 98, temperature: 37.8, capillary: progress >= .5 ? 2 : 3, thirst: progress >= 1 ? "Menor, aún requiere vigilancia" : "Sed y mucosas secas", consciousness: "Alerta y orientado; puede beber", pain: progress >= .5 ? 3 : 5 };
}
export function giBalance(state: GiState) { return state.oralMl - state.stoolMl - state.vomitMl - state.urineMl; }
export function giScore(state: GiState) { return Math.max(0, 100 - state.mistakes * 5 - state.critical * 5); }
export function giAssessed(state: GiState) { return ["triaged", "symptoms", "exposure", "background", "temperature", "vitals", "abdomen", "hydration", "balance"].every(flag => state.flags[flag as GiFlag]); }
function log(state: GiState, title: string, detail: string, kind: GiEvent["kind"] = "care"): GiState {
  return { ...state, events: [...state.events, { id: state.events.length + 1, minute: state.minute, title, detail, kind }] };
}
function mark(state: GiState, flag: GiFlag, title: string, detail: string): GiState {
  return log({ ...state, flags: { ...state.flags, [flag]: true } }, title, detail);
}
export function giCorrection(state: GiState, action: GiAction): GiCorrection | undefined {
  const fail = (reason: string, recommendation: string, title = "Pausa para aprender") => ({ title, reason, recommendation });
  if (state.outcome || state.paused) return undefined;
  const actionTargets: Partial<Record<GiActionId, GiTarget>> = { identify: "patient", history: "patient", wash: "hands", gloves: "hands", discard: "bin", temperature: "head", vitals: "arm", abdomen: "abdomen", hydration: "head", balance: "bedside", prepare: "bedside", drink: "patient", teach: "patient", sample: "bedside", antibiotic: "patient", urgent: "bedside", iv: "arm" };
  if (action.target && actionTargets[action.id] && action.target !== actionTargets[action.id]) return fail("El destino elegido no corresponde a esta intervención; el cuidado no se realizó.", `Selecciona el destino «${GI_TARGETS[actionTargets[action.id]!]}».`, "Revisa dónde lo vas a utilizar");
  if (action.id === "urgent") return undefined; // Safety escalation is never locked behind routine tasks.
  if (state.alertAt !== null && !["position", "iv", "handoff", "reassess", "balance", "wash", "discard", "temperature", "vitals", "hydration"].includes(action.id)) return fail("Hay vómitos persistentes o signos de hipoperfusión. Continuar el plan oral o retrasar la atención no resuelve el deterioro.", "Suspende la administración oral, llama al equipo, protege al paciente durante el vómito y prepara el acceso según protocolo.", "Primero atiende el deterioro");
  if (action.id === "identify") return action.value === "two-identifiers" ? undefined : fail("El nombre por sí solo no verifica identidad, consentimiento ni alergias.", "Comprueba nombre e identificador, explica la atención y revisa alergias.");
  if (action.id === "wash") return undefined;
  if (action.id === "triage") return undefined;
  if (!state.flags.identified && !["position", "iv", "handoff"].includes(action.id)) return fail("Falta verificar la identidad antes de la intervención programada.", "Usa la pulsera y confirma los datos del paciente.");
  if (action.id === "gloves") {
    if (!state.cleanHands) return fail("Los guantes no sustituyen la higiene de manos.", "Realiza higiene de manos antes de colocarte la protección.");
    if (state.gloves !== "available") return fail("Esta unidad ya está en uso o descartada; no es un par nuevo.", state.gloves === "worn" ? "Conserva la protección para la valoración y después retírala en el contenedor." : "No reutilices los guantes descartados; la exploración inicial de este recorrido ya terminó.");
  }
  if (action.id === "discard" && state.gloves !== "worn") return fail("No tienes un par de guantes en uso para retirar.", "Comprueba el inventario; los guantes descartados no se reutilizan.");
  if (["temperature", "vitals", "abdomen", "hydration"].includes(action.id) && !state.flags.triaged) return fail("Falta la observación rápida de conciencia, respiración y capacidad de beber.", "Pulsa «Evaluación rápida»; si hay peligro, solicita ayuda inmediatamente.");
  if (["temperature", "vitals", "abdomen", "hydration"].includes(action.id) && !state.cleanHands && state.gloves !== "worn") return fail("El contacto requiere higiene y la protección indicada.", "Realiza higiene de manos; prepara la protección del caso antes de la exploración.");
  if (action.id === "history" && !GI_HISTORY.some(topic => topic.id === action.value)) return fail("No se ha seleccionado una pregunta de la entrevista.", "Pregunta por síntomas, exposición y antecedentes / balance previo.");
  if (action.id === "classify") {
    if (!giAssessed(state)) return fail("Faltan datos de la valoración: la gravedad no se decide solo por el número de deposiciones.", "Completa entrevista, temperatura, signos vitales, abdomen, hidratación y balance inicial.");
    if (action.value !== "oral-observation") return fail("Este adulto está alerta y puede beber, con signos de deshidratación y sin datos iniciales de shock. Un antibiótico o un alta inmediata no reemplazan la rehidratación.", "Elige rehidratación oral fraccionada con observación y reevaluación, según el plan del caso.");
  }
  if (action.id === "diagnostics" && action.value !== "clinical-review") return fail("La diarrea acuosa aguda de este caso, sin sangre ni otros datos de invasión, no exige identificar un microorganismo para iniciar la hidratación.", "Revisa las indicaciones: sangre, fiebre importante, dolor intenso, sepsis, persistencia o contexto de brote requieren valoración específica.");
  if (action.id === "sample" && action.value !== "not-indicated") return fail("No hay una solicitud de muestra en este recorrido. Recogerla de forma automática no confirma una causa y puede retrasar la prioridad.", "Revisa los hallazgos con el equipo y la indicación de pruebas; no retrases la hidratación si está indicada.");
  if (action.id === "antibiotic" && action.value !== "not-indicated") return fail("No existe prescripción ni indicación demostrada para antibiótico empírico en esta diarrea acuosa aguda. La etiología aún no está confirmada.", "Prioriza rehidratación y valoración clínica. Si aparecen criterios de infección invasiva, comunica y sigue la indicación específica.");
  if (action.id === "prepare") {
    if (!state.flags.classified) return fail("Todavía no se ha elegido un plan a partir de la valoración.", "Completa la valoración y selecciona la prioridad de cuidados.");
    if (state.gloves === "worn" || !state.cleanHands) return fail("Los guantes de contacto y las manos sin nueva higiene pueden contaminar la preparación.", "Retira los guantes usados, deséchalos y realiza higiene de manos antes de preparar la solución.");
    if (state.solution !== "unprepared") return fail("El sobre del caso ya fue preparado; no se vuelve a disolver ni se añade polvo a la solución existente.", "Usa el volumen preparado y registra lo administrado.");
    if (action.value !== 1000) return fail("La concentración cambia si se usa un volumen distinto al del envase. El sobre de este caso indica un litro; otros productos pueden indicar otro volumen.", "Disuelve todo este sobre en 1000 mL de agua segura, sin añadir azúcar, sal ni otros productos.");
  }
  if (action.id === "drink") {
    if (state.solution !== "prepared") return fail("Aún no hay solución preparada disponible.", "Prepara el sobre con el volumen de agua que indica su envase.");
    if (!state.cleanHands || state.gloves === "worn") return fail("La administración oral requiere una manipulación limpia.", "Retira los guantes de contacto y realiza higiene de manos.");
    if (state.pendingMl) return fail("La porción anterior sigue en observación; acumular tomas no demuestra tolerancia.", "Pulsa «Observar 30 min» y reevalúa antes de preparar la siguiente porción.");
    if (state.minute > 0 && state.reviewAt !== state.minute) return fail("Falta reevaluar la tolerancia y la perfusión tras el último intervalo.", "Pulsa «Reevaluar al paciente» antes de continuar.");
    if (action.value !== 250 || state.remainingMl < 250) return fail("El plan prescrito de este maniquí utiliza porciones de 250 mL ofrecidas en sorbos durante 30 minutos; no se da un litro de golpe.", "Selecciona 250 mL fraccionados. Es un plan individual del caso, no una pauta universal.");
  }
  if (action.id === "wait" && state.minute >= 180) return fail("Ya se prolongó la observación sin cerrar un plan.", "Reevalúa y comunica al equipo; no sigas retrasando la decisión.");
  if (action.id === "reassess" && !state.flags.triaged) return fail("Aún falta la evaluación rápida inicial.", "Comprueba conciencia, respiración y circulación antes de continuar.");
  if (action.id === "teach" && action.value !== "complete") return fail("La explicación omite cuidados o señales de alarma que el paciente necesita reconocer.", "Incluye preparación correcta de SRO, alimentación tolerada, higiene, evitar automedicación y consulta ante sangre, dolor intenso, fiebre importante, escasa orina o incapacidad de beber.");
  if (action.id === "position" && state.alertAt === null) return fail("No hay vómito activo en este momento; el adulto puede mantenerse incorporado para beber.", "Mantén comodidad y vigilancia; si vomita, suspende la toma y protege la vía aérea según su estado.");
  if (action.id === "iv" && (state.alertAt === null || state.urgentAt < state.alertAt)) return fail("Preparar una vía no reemplaza la valoración urgente ni autoriza administrar líquidos o medicación.", "Ante el deterioro, llama primero al equipo y prepara el acceso conforme al protocolo y a la indicación.");
  if (action.id === "handoff") {
    if (state.alertAt !== null) {
      if (action.value !== "urgent" || state.urgentAt < state.alertAt || !state.flags.positioned || !state.flags.ivPrepared) return fail("El deterioro sigue activo. Un aviso leído o una llamada sin entrega no resuelven la hipoperfusión.", "Solicita ayuda, protege al paciente, prepara el acceso y confirma la entrega del informe al equipo receptor.");
    } else {
      if (action.value !== "observation") return fail("La mejoría inicial no demuestra que la infección haya terminado ni autoriza por sí sola el alta.", "Continúa observación y el plan indicado; comunica respuesta, pérdidas y señales de alarma.");
      if (state.oralMl < 1000 || state.pendingMl || state.minute < 120 || state.reviewAt !== state.minute || state.balanceAt !== state.minute || !state.flags.educated || !state.flags.diagnostics) return fail("Falta completar el periodo del plan, la reevaluación, el balance actualizado o la educación.", "Completa las cuatro porciones observadas, reevalúa y actualiza el balance al minuto 120; revisa pruebas y educación antes de entregar el caso.");
    }
  }
  return undefined;
}
export function applyGiAction(state: GiState, action: GiAction): GiState {
  if (state.paused || state.outcome) return state;
  const correction = giCorrection(state, action);
  if (correction) return log({ ...state, mistakes: state.mistakes + 1, critical: state.critical + (["drink", "antibiotic", "handoff"].includes(action.id) ? 1 : 0) }, correction.title, `${correction.reason} Recomendación: ${correction.recommendation}`, "error");
  switch (action.id) {
    case "identify": return mark(state, "identified", "Identidad confirmada", "Andrés Molina · GI-1042. Explicación y aceptación de la atención; alergias revisadas.");
    case "wash": return log({ ...state, cleanHands: true }, "Higiene de manos", "Agua y jabón, técnica completa y secado. Se mantiene la prevención de transmisión durante la atención.");
    case "gloves": return log({ ...state, gloves: "worn" }, "Protección colocada", "Un par nuevo en uso para el contacto; no reemplaza la higiene de manos.");
    case "discard": return log({ ...state, gloves: "disposed", cleanHands: false }, "Guantes descartados", "Unidad usada retirada y desechada. Realiza higiene de manos; esta unidad no puede reutilizarse.");
    case "triage": return mark(state, "triaged", "Evaluación rápida", state.alertAt !== null ? "Deterioro de la perfusión: requiere ayuda urgente." : "Alerta, respiración sin dificultad, habla y puede beber. Se continúa valoración, con vigilancia de perfusión.");
    case "history": { const topic = GI_HISTORY.find(item => item.id === action.value)!; return mark(state, topic.id, "Andrés responde", topic.response); }
    case "temperature": return mark({ ...state, cleanHands: false }, "temperature", "Temperatura medida", "37,8 °C. Interpreta junto con el resto de los hallazgos; no identifica por sí sola el agente causal.");
    case "vitals": { const v = giVitals(state); return mark({ ...state, cleanHands: false }, "vitals", "Signos vitales registrados", `PA ${v.systolic}/${v.diastolic} mmHg · FC ${v.hr}/min · FR ${v.rr}/min · SpO₂ ${v.spo2} %.`); }
    case "abdomen": return mark({ ...state, cleanHands: false }, "abdomen", "Abdomen explorado", "Exploración explicada y consentida: abdomen blando, cólico difuso leve y ruidos aumentados; sin dolor focal intenso ni signos de irritación peritoneal en este caso.");
    case "hydration": return mark({ ...state, cleanHands: false }, "hydration", "Hidratación valorada", state.alertAt !== null ? "Mareo, taquicardia, hipotensión y relleno capilar de 4 s: reconocer hipoperfusión y escalar." : `${giVitals(state).thirst}. Relleno capilar ${giVitals(state).capillary} s. Está alerta y puede beber; contrasta la diuresis previa referida con las pérdidas medidas de la observación.`);
    case "balance": return mark({ ...state, balanceAt: state.minute }, "balance", "Balance registrado", `Desde el inicio: SRO ${state.oralMl} mL; heces ${state.stoolMl} mL, vómito ${state.vomitMl} mL, orina ${state.urineMl} mL. Balance parcial ${giBalance(state)} mL. Las seis deposiciones y dos vómitos previos fueron referidos, sin volumen medido; no se inventa ese volumen ni el déficit inicial.`);
    case "classify": return mark(state, "classified", "Prioridad de cuidados elegida", "Rehidratación oral fraccionada con observación. Plan individual supervisado del caso: 1000 mL en 2 horas si tolera, con reevaluación cada 30 minutos y ajuste por pérdidas y respuesta. No es una pauta universal.");
    case "diagnostics": return mark(state, "diagnostics", "Necesidad de estudios revisada", "Sin solicitud rutinaria de muestra en este caso no complicado. Sangre, dolor intenso, fiebre importante, sepsis, persistencia o brote cambian la evaluación. La causa permanece sin confirmar.");
    case "sample": return log(state, "Muestra sin indicación actual", "Se conserva el recipiente sin usar. No hay solicitud de muestra en este recorrido; se mantienen la valoración y los criterios para solicitar estudios.");
    case "antibiotic": return log(state, "Medicación revisada", "No se administra antibiótico: no hay indicación ni prescripción en este caso. Se continúa la hidratación y la valoración clínica.");
    case "prepare": return log({ ...state, solution: "prepared", remainingMl: 1000 }, "Solución preparada", "Sobre del caso disuelto en 1000 mL de agua segura, según su envase. Recipiente limpio, sin aditivos; conservación según producto y protocolo.");
    case "drink": return log({ ...state, remainingMl: state.remainingMl - 250, pendingMl: 250, solution: state.remainingMl === 250 ? "empty" : "prepared" }, "Porción iniciada · 250 mL", "Ofrece sorbos pequeños durante el siguiente intervalo, vigilando tolerancia. La porción en curso aún no cuenta como ingesta observada en el balance; falta completar el intervalo y reevaluar.");
    case "wait": {
      const minute = state.minute + 30;
      const oralMl = state.oralMl + state.pendingMl;
      const stoolMl = state.stoolMl + (minute === 60 ? 150 : 0);
      const intolerant = state.variant === "intolerance" && minute >= 60;
      const delayed = minute >= 90 && oralMl < 500;
      const alertAt = state.alertAt ?? (intolerant || delayed ? minute : null);
      let next = { ...state, minute, oralMl, pendingMl: 0, stoolMl, urineMl: minute >= 120 && oralMl >= 1000 && alertAt === null ? 200 : state.urineMl, vomitMl: state.vomitMl + (intolerant && state.alertAt === null ? 300 : 0), alertAt };
      next = log(next, `${minute} min · observación realizada`, "Tiempo clínico simulado. Se revisan pérdidas y tolerancia; la mejoría es ilustrativa y no constituye curación de la infección.", "observation");
      if (state.alertAt === null && alertAt !== null) next = log(next, "Deterioro activo", intolerant ? "Vómito de 300 mL y nueva deposición; no logra mantener la ingesta. Presenta mareo, PA 90/58, pulso 124 y relleno capilar de 4 s. Suspende el plan oral y solicita ayuda urgente." : "Persisten las pérdidas sin reposición suficiente y aparecen signos de hipoperfusión. PA 90/58, pulso 124 y relleno capilar de 4 s: solicita ayuda urgente.", "alert");
      return next;
    }
    case "reassess": return log({ ...state, reviewAt: state.minute }, "Reevaluación realizada", state.alertAt !== null ? "La alteración de perfusión y la intolerancia siguen activas. Una reevaluación no las corrige: requiere entrega al equipo." : state.minute ? `Observación de tolerancia, conciencia, sed, dolor y perfusión. Pulso ${giVitals(state).hr}/min; revisar pérdidas y continuar el plan indicado.` : "Valoración basal registrada. Repite después de observar la respuesta al tratamiento.", "observation");
    case "teach": return mark(state, "educated", "Educación comprobada", "Andrés repite cómo preparar la SRO según el envase, beber fraccionado y mantener alimentación tolerada. Explica higiene, evitar automedicación y consultar ante sangre, fiebre importante, dolor intenso, escasa orina o imposibilidad de beber.");
    case "urgent": return log({ ...state, urgentAt: state.minute }, "Equipo contactado", "Se comunica la situación y se solicita valoración. La llamada no administra tratamiento ni resuelve el deterioro; falta la entrega al equipo receptor.", state.alertAt !== null ? "alert" : "care");
    case "position": return mark(state, "positioned", "Paciente protegido", "Administración oral suspendida; posición segura según estado y presencia de vómito, vigilancia de vía aérea, respiración y conciencia, sin dejar al paciente solo.");
    case "iv": return mark(state, "ivPrepared", "Acceso preparado para el equipo", "Material de acceso y monitorización disponibles para personal competente según protocolo. No se han administrado líquidos IV ni fármacos; requieren indicación y seguimiento.");
    case "handoff": return log({ ...state, outcome: state.alertAt !== null ? "escalated" : "observing" }, "Entrega confirmada al equipo receptor", state.alertAt !== null ? "Informe de síntomas, signos de hipoperfusión, ingesta y pérdidas recibido por el equipo. Continúa atención urgente; la complicación no se declara resuelta." : "Informe de valoración, respuesta, balance y educación recibido. Continúa observación y reposición de pérdidas según el plan del equipo; no se declara curada la infección ni se concede un alta automática.");
    default: return state;
  }
}
export function giNextTask(state: GiState): { title: string; detail: string; tool?: GiTool; action?: GiActionId } {
  const task = (title: string, detail: string, tool?: GiTool, action?: GiActionId) => ({ title, detail, tool, action });
  if (state.outcome) return task("Recorrido completado", "Revisa tus decisiones y la continuidad de cuidados.");
  if (state.alertAt !== null) {
    if (state.urgentAt < state.alertAt) return task("Solicita ayuda urgente", "Suspende la administración oral y comunica los signos de hipoperfusión.", "call");
    if (!state.flags.positioned) return task("Protege al paciente", "Mantén una posición segura durante el vómito y vigila respiración y conciencia.", undefined, "position");
    if (!state.flags.ivPrepared) return task("Prepara el acceso para el equipo", "Prepara material y monitorización según protocolo; la terapia requiere indicación.", "iv");
    return task("Confirma la entrega urgente", "Entrega síntomas, signos vitales, ingesta, pérdidas y actuaciones al equipo receptor.", undefined, "handoff");
  }
  if (!state.flags.triaged) return task("Haz una evaluación rápida", "Comprueba conciencia, respiración y capacidad de beber.", undefined, "triage");
  if (!state.flags.identified) return task("Conoce e identifica a Andrés", "Confirma dos identificadores y explica la atención.", "identity");
  if (!state.cleanHands && state.gloves === "available") return task("Realiza higiene de manos", "Después prepara la protección para el contacto.", "soap");
  if (state.gloves === "available") return task("Prepara la protección", "Un par de guantes nuevo para la valoración de este caso.", "gloves");
  if (!state.flags.symptoms || !state.flags.exposure || !state.flags.background) return task("Completa la entrevista", "Pregunta por síntomas, exposición y antecedentes / pérdidas previas.", "identity", "history");
  for (const [flag, tool, label] of [["temperature", "thermometer", "Mide la temperatura"], ["vitals", "cuff", "Registra los signos vitales"], ["abdomen", "stethoscope", "Explora el abdomen"], ["hydration", "hydration", "Valora la hidratación"], ["balance", "jug", "Registra el balance inicial"]] as const) if (!state.flags[flag]) return task(label, GI_TOOLS[tool].purpose, tool);
  if (!state.flags.classified) return task("Elige la prioridad de cuidados", "Integra lo observado antes de indicar el plan.", undefined, "classify");
  if (!state.flags.diagnostics) return task("Decide si requiere estudios", "Las pruebas dependen de los hallazgos y del contexto.", undefined, "diagnostics");
  if (state.gloves === "worn") return task("Retira los guantes de contacto", "Selecciona los guantes y aplícalos al contenedor.", "gloves", "discard");
  if (!state.cleanHands) return task("Repite la higiene de manos", "Prepara las manos antes de manipular la bebida.", "soap");
  if (state.solution === "unprepared") return task("Prepara la solución oral", "Lee el volumen indicado en el envase de este sobre.", "ors");
  if (state.pendingMl) return task("Observa la tolerancia", "La porción se ofrece en sorbos durante 30 minutos simulados.", undefined, "wait");
  if (state.minute > 0 && state.reviewAt !== state.minute) return task("Reevalúa al paciente", "Comprueba tolerancia, conciencia, perfusión y pérdidas.", undefined, "reassess");
  if (state.oralMl < 1000) return task("Ofrece la siguiente porción", "Plan del caso: 250 mL en sorbos durante cada intervalo de 30 minutos, si tolera.", "ors", "drink");
  if (state.balanceAt !== state.minute) return task("Actualiza el balance", "Registra las entradas y las pérdidas de este periodo.", "jug");
  if (!state.flags.educated) return task("Comprueba la educación", "Pide que explique los cuidados y las señales de alarma.", "education");
  return task("Entrega el plan de continuidad", "Comunica respuesta, balance y vigilancia al equipo; continuará en observación.", undefined, "handoff");
}
export const GI_SOURCES = [
  { title: "IDSA · Diarrea infecciosa: valoración y tratamiento", href: "https://www.idsociety.org/practice-guideline/infectious-diarrhea/" },
  { title: "OMS · Enfermedades diarreicas", href: "https://www.who.int/news-room/fact-sheets/detail/Diarrhoeal-disease" },
  { title: "OMS · Uso de antibióticos AWaRe", href: "https://iris.who.int/bitstream/handle/10665/365237/9789240062382-eng.pdf" },
  { title: "MSF · Sales de rehidratación oral", href: "https://medicalguidelines.msf.org/en/viewport/EssDr/english/oral-rehydration-salts-ors-16684387.html" },
];
