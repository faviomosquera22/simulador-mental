/** Educational case rules, separate from the actor. Values are fictional, never clinical scales. */
export type PapPhase = "observe" | "listen" | "support" | "link";
export type PapMode = "practice" | "assessment";
export type PapMotion = "pacing" | "guarded" | "listening" | "settled" | "agitated" | "withdrawing" | "tearful" | "recovering";
export type PapReaction = "worried" | "angry" | "withdrawn" | "tearful" | "reconnecting";
export type PapAction = { id: string; phase: PapPhase; label: string; words?: string; reply: string; feedback: string; requires?: string[]; distress?: number; trust?: number; harmful?: boolean; finding?: string };
export type PapEntry = { id: string; label: string; words?: string; reply: string; feedback: string; at: number; harmful?: boolean; kind?: "speech" | "action"; understood?: boolean; provider?: "gemini" | "local" };
export type PapRun = {
  status: "ready" | "running" | "paused" | "finished";
  mode: PapMode; variant: "standard" | "medical"; elapsed: number; distress: number; trust: number;
  completed: string[]; history: PapEntry[]; findings: string[]; event: boolean; eventHandled: boolean;
  reaction: PapReaction; ruptures: number; repairProgress: number; posture?: "standing" | "seated"; closure?: "complete" | "incomplete";
};
export const PAP_PHASES: { id: PapPhase; label: string; description: string }[] = [
  { id: "observe", label: "Observar", description: "Seguridad, entorno y primer contacto" },
  { id: "listen", label: "Escuchar", description: "Necesidades, preocupaciones y riesgos" },
  { id: "support", label: "Acompañar", description: "Presencia y ayuda práctica con permiso" },
  { id: "link", label: "Conectar", description: "Apoyos, reevaluación y continuidad" },
];
export const PAP_ACTIONS: PapAction[] = [
  { id: "scene", phase: "observe", label: "Valorar seguridad y entorno", reply: "La sala está fuera del área del accidente. La salida está despejada. Se oyen conversaciones del pasillo y hay otras personas mirando hacia aquí.", feedback: "La preparación incluye tu seguridad, la de la persona y recursos disponibles. Observar no sustituye preguntar.", finding: "Entorno seguro; ruido y privacidad mejorables." },
  { id: "observe", phase: "observe", label: "Observar sin invadir", reply: "Camina por la sala, aprieta las manos y mira hacia la puerta. Está despierta y puede responder. La conducta por sí sola no permite establecer un diagnóstico.", feedback: "Describe lo que ves y escuchas; evita convertir gestos en diagnósticos.", finding: "Camina repetidamente; manos tensas; responde al contacto verbal." },
  { id: "introduce", phase: "observe", label: "Presentarte y ofrecer compañía", words: "Hola, soy parte del equipo de apoyo. ¿Te parece bien que me quede aquí contigo?", reply: "Sí… pero no te acerques tanto. Soy Valeria. No sé qué hacer.", feedback: "Preséntate, ofrece ayuda y respeta la distancia que pide. La persona conserva sus decisiones.", trust: 12, requires: ["scene"], finding: "Valeria acepta compañía y pide mantener distancia." },
  { id: "distance", phase: "observe", label: "Respetar espacio y explicar privacidad", words: "Me quedaré a esta distancia. Cuidaré tu privacidad; si hay un peligro inmediato, pediré la ayuda necesaria y te explicaré qué comparto.", reply: "Está bien. No quiero que todo el mundo se entere.", feedback: "No prometas secreto absoluto. Explica de forma sencilla los límites ante un riesgo inmediato.", trust: 8, requires: ["introduce"] },
  { id: "quiet", phase: "observe", label: "Ofrecer menos ruido y miradas", words: "¿Te parece que pidamos a los demás un poco de espacio y bajemos el ruido? La salida seguirá libre.", reply: "Sí, por favor. Aquí hay demasiadas personas mirando.", feedback: "La privacidad se acuerda; no implica aislar, encerrar ni bloquear la salida.", trust: 6, distress: -5, requires: ["introduce"], finding: "Acepta reducir ruido y observadores." },
  { id: "needs", phase: "listen", label: "Preguntar qué necesita ahora", words: "¿Qué es lo que más te preocupa o qué necesitas en este momento? No tienes que contarme detalles del accidente.", reply: "Mi hermana iba conmigo. Se la llevaron a otra zona y no sé dónde está. Necesito saber de ella y llamar a mi tía.", feedback: "Prioriza las preocupaciones actuales y necesidades prácticas; no fuerces una reconstrucción del suceso.", trust: 10, requires: ["introduce"], finding: "Prioridades expresadas: información de su hermana y contactar a su tía." },
  { id: "physical", phase: "listen", label: "Comprobar necesidades físicas urgentes", words: "¿Estás herida, tienes algún dolor importante o necesitas atención médica ahora?", reply: "No me duele nada y ya me revisaron al llegar. Tengo la boca seca. Me asusté mucho.", feedback: "El malestar emocional no excluye una urgencia médica. Si aparecen señales nuevas, vuelve a valorar y activa atención.", requires: ["introduce"], finding: "Refiere revisión inicial, sin dolor actual y con sed." },
  { id: "risk", phase: "listen", label: "Explorar seguridad personal", words: "Para cuidarte mejor: ¿hay alguien que pueda hacerte daño? ¿Has pensado en hacerte daño o sientes que no puedes mantenerte a salvo?", reply: "No, no quiero hacerme daño y nadie me amenaza. Solo quiero saber dónde está mi hermana.", feedback: "Pregunta con claridad y respeto. Una respuesta negativa se interpreta junto con la observación y se reevalúa si cambia la situación.", requires: ["introduce"], finding: "Niega amenaza actual e ideas de hacerse daño en esta entrevista breve." },
  { id: "validate", phase: "listen", label: "Reconocer lo que siente", words: "Lo que pasó fue muy difícil. Veo que te preocupa tu hermana. Podemos ir paso a paso con lo que necesitas ahora.", reply: "Sí. No puedo dejar de pensar en ella… gracias por escucharme.", feedback: "Reconoce el sufrimiento sin minimizarlo ni prometer resultados que desconoces.", distress: -8, trust: 8, requires: ["needs"] },
  { id: "supports", phase: "listen", label: "Explorar apoyos y recursos propios", words: "¿Con quién te sientes segura? ¿Hay algo que te haya ayudado antes cuando te has sentido sobrepasada?", reply: "Con mi tía Elena. Estar acompañada me ayuda. No quiero quedarme sola ahora.", feedback: "Identifica apoyos elegidos por la persona y recursos que ella ya utiliza.", requires: ["needs"], finding: "Apoyo elegido: tía Elena; desea estar acompañada." },
  { id: "silence", phase: "support", label: "Escuchar y dar espacio al silencio", words: "Estoy aquí. Podemos quedarnos un momento en silencio si lo prefieres.", reply: "[Permanece un momento en silencio.] No quiero hablar de cómo fue el choque.", feedback: "El silencio puede ser una forma de acompañar. No lo penalices ni lo llenes de preguntas.", distress: -4, trust: 6, requires: ["introduce"] },
  { id: "water", phase: "support", label: "Ofrecer agua y comprobar aceptación", words: "Dijiste que tienes sed. ¿Quieres un poco de agua?", reply: "Sí, gracias. Puedo beber por mí misma.", feedback: "Responde a una necesidad concreta con permiso y sin sustituir la autonomía de la persona.", distress: -4, requires: ["physical"] },
  { id: "orient", phase: "support", label: "Ofrecer orientación al presente", words: "Si te resulta útil, podemos fijarnos en dónde estamos y sentir los pies en el suelo. Puedes decirme si prefieres parar.", reply: "Puedo intentarlo… noto el suelo. Prefiero mantener los ojos abiertos.", feedback: "Ofrece una opción, comprueba tolerancia y respeta que no quiera continuar. No es una técnica obligatoria ni una cura.", distress: -5, requires: ["validate"] },
  { id: "event-response", phase: "support", label: "Responder a su nueva preocupación", words: "Ese sonido te sobresaltó. Seguimos aquí, en la sala de apoyo. ¿Qué necesitas ahora? Podemos averiguar la información sin suponer qué ocurrió.", reply: "Pensé que era otra ambulancia por mi hermana. Quédate conmigo mientras averiguan, por favor.", feedback: "Reevalúa después de un cambio. Reconocer una alerta no resuelve la necesidad que la provoca.", distress: -8, trust: 5, requires: ["introduce"], finding: "Tras oír una sirena, solicita compañía e información verificada." },
  { id: "repair", phase: "support", label: "Reconocer una intervención poco útil", words: "Lo que dije no te ayudó. Gracias por decírmelo. No tienes que contar detalles ni calmarte para que pueda acompañarte.", reply: "Eso me hace sentir menos presionada. Podemos seguir, pero despacio.", feedback: "Reconocer el impacto y cambiar de conducta puede reparar el vínculo. No borra lo ocurrido.", trust: 10, distress: -5, requires: ["introduce"] },
  { id: "force-story", phase: "listen", label: "Pedirle que relate todo el accidente", words: "Cuéntame todo desde el principio, con cada detalle, para que puedas desahogarte.", reply: "¡No quiero volver a contarlo! ¿No me estás escuchando?", feedback: "Presionar para reconstruir el evento no forma parte de PAP. Escucha si desea hablar y respeta que no quiera hacerlo.", distress: 16, trust: -18, harmful: true, requires: ["introduce"] },
  { id: "minimize", phase: "support", label: "Decirle que se calme y que todo estará bien", words: "Cálmate, no pasa nada. Seguro que tu hermana está bien.", reply: "¡No sabes cómo está! Si pudiera calmarme, lo haría.", feedback: "Minimizar o asegurar un desenlace desconocido puede deteriorar la confianza. Puedes reconocerlo y reparar.", distress: 14, trust: -16, harmful: true, requires: ["introduce"] },
  { id: "information", phase: "link", label: "Acordar buscar información verificada", words: "No sé cómo está tu hermana. ¿Me autorizas a preguntar al punto de información? Te diré solo lo que confirmen.", reply: "Sí. [El punto de información confirma que está siendo valorada y que darán novedades aquí; no informa aún de su estado.] Gracias por decirme lo que sí se sabe.", feedback: "Distingue hechos de suposiciones y acuerda dónde recibirá novedades. La incertidumbre no desaparece por completo.", distress: -6, trust: 8, requires: ["needs", "distance"], finding: "Información confirmada: hermana en valoración; novedades en el punto de información." },
  { id: "contact", phase: "link", label: "Pedir permiso y contactar a la tía", words: "¿Quieres que llamemos juntas a Elena y le digamos solo lo necesario para que venga a acompañarte?", reply: "Sí, quiero llamarla contigo. [Valeria habla con Elena, que confirma que vendrá a la sala de apoyo.] Ya sabe dónde estoy.", feedback: "La red de apoyo se elige y se contacta con consentimiento. En este caso la llamada sí fue realizada y se confirmó el punto de encuentro.", distress: -8, trust: 8, requires: ["supports", "distance"], finding: "Contacto realizado con consentimiento; Elena confirma que acudirá a la sala." },
  { id: "emergency", phase: "link", label: "Activar valoración médica y permanecer con ella", words: "Ese dolor nuevo necesita valoración médica. Voy a pedir al equipo que venga y me quedaré contigo mientras llega.", reply: "[El equipo médico recibe la solicitud y se dirige a la sala.] Gracias, no quiero estar sola.", feedback: "No atribuyas automáticamente síntomas nuevos a ansiedad. Solicitar ayuda no equivale a que el equipo ya haya recibido a la persona.", finding: "Se solicita evaluación médica por dolor torácico nuevo y se mantiene acompañamiento." },
  { id: "handoff", phase: "link", label: "Entregar el caso al equipo que llega", words: "Valeria, el equipo ya está aquí. Con tu conocimiento, les explico lo observado, el dolor nuevo y el apoyo que has pedido.", reply: "[El equipo confirma recepción y asume la valoración médica. Valeria permanece acompañada.]", feedback: "La continuidad requiere confirmar quién recibe a la persona. Se comparte solo información pertinente.", requires: ["emergency"], finding: "Equipo médico presente, informado y recepción confirmada." },
  { id: "reassess", phase: "link", label: "Reevaluar cómo está y qué necesita", words: "¿Cómo estás ahora? ¿Qué sigue preocupándote y te parece bien lo que acordamos?", reply: "Sigo preocupada y tal vez llore otra vez. Pero sé dónde pedir información y quiero esperar acompañada.", feedback: "Un buen apoyo no exige dejar de llorar. Comprueba necesidades pendientes, seguridad y aceptación del plan.", requires: ["needs", "physical", "risk"] },
  { id: "plan", phase: "link", label: "Acordar continuidad y cómo pedir ayuda", words: "Si estás de acuerdo, esperamos aquí con apoyo hasta que llegue Elena. Las novedades se consultan en información. Si aparece dolor, más malestar o no te sientes segura, avisamos al equipo de inmediato. ¿Te parece?", reply: "Sí. Me quedaré aquí acompañada y pediré ayuda si lo necesito. No quiero estar sola mientras llega mi tía.", feedback: "El cierre combina un plan concreto, apoyos confirmados y una vía para pedir ayuda. Los PAP no sustituyen atención especializada cuando se necesita.", requires: ["contact", "information", "reassess"], finding: "Plan aceptado: espera acompañada, información verificada y acceso al equipo si cambia la situación." },
];
export const PAP_SOURCES = [
  { label: "OMS · Primera ayuda psicológica: guía para trabajadores de campo (2011)", url: "https://www.who.int/publications/i/item/9789241548205" },
  { label: "OMS · Manual para facilitadores de PAP (2013)", url: "https://www.who.int/publications/i/item/psychological-first-aid" },
];
export function createPapRun(mode: PapMode = "practice", variant: PapRun["variant"] = "standard"): PapRun {
  return { status: "ready", mode, variant, elapsed: 0, distress: 72, trust: 20, completed: [], history: [], findings: [], event: false, eventHandled: false, reaction: "worried", ruptures: 0, repairProgress: 0 };
}
export const hasPap = (run: PapRun, id: string) => run.completed.includes(id);
/** Recovery takes multiple distinct interventions; an apology does not erase the record. */
export function reactPap(run: PapRun, tone: "harmful" | "repair" | "supportive" | "neutral", repeated = false): PapRun {
  if (tone === "harmful") return { ...run, ruptures: run.ruptures + 1, repairProgress: 0, reaction: run.ruptures >= 2 ? "withdrawn" : "angry" };
  if (run.ruptures > 0 && run.repairProgress < 2 && (tone === "repair" || tone === "supportive")) {
    const progress = Math.min(2, run.repairProgress + (repeated || tone === "repair" && run.repairProgress >= 1 ? 0 : 1));
    return { ...run, repairProgress: progress, reaction: progress >= 2 ? "reconnecting" : "tearful" };
  }
  if (tone === "supportive" && run.reaction === "reconnecting") return { ...run, reaction: "worried" };
  return run;
}
export function contextualPapAction(run: PapRun, action: PapAction): PapAction {
  if (action.id === "reassess" && (!hasPap(run, "information") || !hasPap(run, "contact"))) {
    return { ...action, reply: "Sigo preocupada. Necesito noticias de mi hermana y apoyo para no estar sola. ¿Qué podemos hacer ahora?" };
  }
  if (run.variant !== "medical" || !run.event) return action;
  if (action.id === "physical") return { ...action, words: "El equipo está valorando el dolor nuevo. ¿Hay otra molestia o necesidad que quieras que les comuniquemos?", reply: "El dolor es lo que más me preocupa ahora. Quiero seguir acompañada mientras me revisan.", finding: "Refiere dolor torácico nuevo, actualmente en valoración por el equipo médico; solicita compañía." };
  if (action.id === "water") return { ...action, label: "Consultar al equipo sobre la necesidad de agua", words: "Si sigues con sed, podemos preguntarle al equipo qué es adecuado mientras te valoran. ¿Quieres que lo consultemos?", reply: "Sí. [El equipo indica esperar a completar su valoración antes de ofrecer agua.] Gracias por preguntar.", feedback: "Tras una señal médica nueva, coordina las necesidades físicas con el equipo que asumió la valoración. No des por hecho que las indicaciones iniciales siguen vigentes." };
  if (action.id === "plan") return { ...action, words: "Si estás de acuerdo, continúas con el equipo médico y mantenemos a Elena informada de dónde estás. Te acompañamos y comunicamos cualquier cambio al equipo. ¿Te parece?", reply: "Sí. Seguiré con el equipo médico y quiero que Elena sepa dónde estoy. Les diré si aparece algo más.", finding: "Plan aceptado: continuidad con el equipo médico, acompañamiento y apoyo de Elena informado." };
  if (action.id === "reassess" && hasPap(run, "handoff")) return { ...action, reply: "El equipo está conmigo y va a revisar el dolor. Quiero que mi tía se mantenga informada." };
  return action;
}
export function papBlock(run: PapRun, action: PapAction): string | null {
  if (run.status !== "running") return "Inicia o reanuda la sesión para intervenir.";
  if (hasPap(run, action.id) && !["reassess", "plan", "repair"].includes(action.id)) return "Ya realizaste esta intervención.";
  if (action.id === "event-response" && (!run.event || run.eventHandled)) return "Disponible cuando surja una nueva preocupación.";
  if (action.id === "repair" && !run.history.some(h => h.harmful)) return "Disponible si necesitas reparar una intervención poco útil.";
  if (action.id === "emergency" && !(run.variant === "medical" && run.event)) return "En este caso aún no se ha identificado una señal médica nueva; valora primero las necesidades.";
  if (run.variant === "medical" && run.event && !hasPap(run, "handoff") && !["emergency", "handoff", "event-response", "introduce"].includes(action.id)) return "Hay un dolor torácico nuevo: prioriza solicitar atención y confirmar la entrega al equipo.";
  const missing = action.requires?.find(id => !hasPap(run, id));
  if (missing) return `Antes: ${PAP_ACTIONS.find(a => a.id === missing)?.label.toLocaleLowerCase()}.`;
  return null;
}
function triggerPapEvent(run: PapRun): PapRun {
  if (run.event || run.status !== "running" || (run.elapsed < 90 && run.history.filter(h => h.id !== "reassess").length < 7)) return run;
  const medical = run.variant === "medical";
  return { ...run, event: true, distress: Math.min(95, run.distress + 13), history: [...run.history, { id: "event", label: medical ? "Cambio de situación · dolor nuevo" : "Cambio de situación · una sirena en el exterior", reply: medical ? "Ahora me duele fuerte el pecho. Antes no me dolía… necesito ayuda." : "[Se oye una sirena a lo lejos. Valeria se sobresalta y vuelve a caminar.] ¿Y si le pasó algo a mi hermana?", feedback: medical ? "Síntoma nuevo: activa valoración médica sin asumir que se debe al malestar emocional." : "Surge una nueva necesidad. Observa, escucha y comprueba qué apoyo necesita ahora.", at: run.elapsed }] };
}
export function tickPap(run: PapRun, seconds = 1): PapRun {
  if (run.status !== "running") return run;
  return triggerPapEvent({ ...run, elapsed: run.elapsed + Math.max(0, seconds) });
}
export function performPap(run: PapRun, id: string): PapRun {
  const original = PAP_ACTIONS.find(a => a.id === id);
  if (!original || papBlock(run, original)) return run;
  const action = contextualPapAction(run, original);
  const reply = id === "event-response" && run.variant === "medical" ? "Me asusta este dolor. Por favor, pide que venga el equipo médico." : action.reply;
  const next: PapRun = { ...run, completed: hasPap(run, id) ? run.completed : [...run.completed, id], elapsed: run.elapsed + 8,
    distress: Math.max(24, Math.min(98, run.distress + (action.distress ?? 0))), trust: Math.max(0, Math.min(95, run.trust + (action.trust ?? 0))),
    eventHandled: run.eventHandled || id === "event-response" || id === "handoff",
    history: [...run.history, { id, label: action.label, words: action.words, reply, feedback: action.feedback, harmful: action.harmful, at: run.elapsed }],
    findings: action.finding ? [...run.findings, action.finding] : run.findings,
  };
  return triggerPapEvent(reactPap(next, action.harmful ? "harmful" : id === "repair" ? "repair" : ["validate", "silence", "distance", "event-response"].includes(id) ? "supportive" : "neutral", id === "repair" && hasPap(run, "repair")));
}
export function papMotion(run: PapRun): PapMotion {
  if (run.variant === "medical" && run.event) return hasPap(run, "handoff") ? "listening" : "guarded";
  if (run.reaction === "angry") return "agitated";
  if (run.reaction === "withdrawn") return "withdrawing";
  if (run.reaction === "tearful") return "tearful";
  if (run.reaction === "reconnecting") return "recovering";
  if (run.posture === "seated") return "listening";
  if (run.event && !run.eventHandled) return "pacing";
  if (run.trust < 18) return "guarded";
  if (run.distress > 58) return "pacing";
  return run.distress > 38 ? "listening" : "settled";
}
export function papObservation(run: PapRun): string {
  if (run.variant === "medical" && run.event && !hasPap(run, "handoff")) return "Se detiene y refiere dolor nuevo en el pecho. Requiere valoración médica.";
  if (run.variant === "medical" && hasPap(run, "handoff")) return "Permanece en el lugar mientras el equipo médico asume la valoración. Sigue necesitando compañía e información.";
  if (run.posture === "seated") return run.reaction === "angry" || run.reaction === "withdrawn" ? "Permanece sentada, gira el rostro y mantiene distancia. Sentarse no significa que haya recuperado la confianza." : "Ha aceptado sentarse. Alterna la mirada entre la puerta y quien la acompaña; sigue necesitando información y apoyo.";
  const motion = papMotion(run);
  if (motion === "agitated") return "Marca un límite con la mano, protesta y después mantiene una postura tensa. Su tono es firme: pide que dejes de presionarla.";
  if (motion === "withdrawing") return "Retrocede, gira para apartarse y evita continuar la conversación. Necesita espacio; insistir puede aumentar el rechazo.";
  if (motion === "tearful") return "Baja la cabeza y acerca una mano al rostro. Sigue afectada; aún no ha recuperado la confianza.";
  if (motion === "recovering") return "Baja lentamente las manos y vuelve a orientarse hacia ti. Acepta continuar poco a poco; sigue preocupada.";
  return motion === "pacing" ? "Camina de un lado a otro y mira hacia la salida. Habla con inquietud." : motion === "guarded" ? "Gira el cuerpo, evita la mirada y responde con distancia. Pide menos presión." : motion === "listening" ? "Se detiene para escucharte. Las manos siguen tensas y aún busca noticias de su hermana." : "Permanece en el lugar y escucha. Sigue preocupada, pero acepta el acompañamiento.";
}
export function papFinishBlock(run: PapRun): string | null {
  if (run.status !== "running") return "La sesión debe estar en curso.";
  if (run.ruptures > 0 && run.repairProgress < 2) return "El vínculo sigue afectado. Respeta su espacio y comprueba si acepta continuar o acuerda otro apoyo.";
  if (run.event && !run.eventHandled) return "Atiende el cambio de situación antes de cerrar.";
  if (run.variant === "medical" && run.event && !hasPap(run, "handoff")) return "Confirma la recepción por el equipo médico.";
  for (const id of ["observe", "distance", "needs", "physical", "risk", "supports", "validate", "contact", "information", "plan"]) {
    if (!hasPap(run, id)) return `Pendiente: ${PAP_ACTIONS.find(a => a.id === id)?.label.toLowerCase()}.`;
  }
  const last = (id: string) => run.history.map(h => h.id).lastIndexOf(id);
  if (last("reassess") < Math.max(last("contact"), last("information"), last("event"), last("handoff"))) return "Reevalúa después de los últimos cambios y apoyos confirmados.";
  if (last("plan") < last("reassess")) return "Confirma de nuevo el plan tras la última reevaluación.";
  return null;
}
export function finishPap(run: PapRun): PapRun { return papFinishBlock(run) ? run : { ...run, status: "finished", closure: "complete" }; }
export function endPapPractice(run: PapRun): PapRun { return run.status !== "running" ? run : { ...run, status: "finished", closure: papFinishBlock(run) ? "incomplete" : "complete" }; }
export function papRubric(run: PapRun) {
  const groups = [
    { label: "Seguridad y respeto", ids: ["scene", "observe", "introduce", "distance", "physical", "risk"] },
    { label: "Escucha y autonomía", ids: ["needs", "validate", "supports", "silence"] },
    { label: "Ayuda práctica", ids: ["quiet", "water", "information"] },
    { label: "Conexión y continuidad", ids: ["contact", "reassess", "plan"] },
  ];
  const rows = groups.map(g => ({ ...g, earned: g.ids.filter(id => hasPap(run, id)).length, total: g.ids.length }));
  const base = Math.round(rows.reduce((n, r) => n + r.earned / r.total * 25, 0));
  const penalties = run.history.filter(h => h.harmful).length * 10;
  const safetyCap = run.variant === "medical" && run.event && !hasPap(run, "handoff") ? 40 : 100;
  return { rows, score: Math.min(safetyCap, Math.max(0, base - penalties)), penalties, omissions: PAP_ACTIONS.filter(a => groups.some(g => g.ids.includes(a.id)) && !hasPap(run, a.id)).map(a => a.label) };
}
export function papHint(run: PapRun): string {
  if (run.variant === "medical" && run.event && !hasPap(run, "handoff")) return hasPap(run, "emergency") ? "El equipo llega. Confirma la entrega y recepción del caso." : "Apareció dolor torácico nuevo. Solicita valoración médica y permanece con Valeria.";
  if (run.ruptures > 0 && run.repairProgress < 2) return "El vínculo está afectado. Puedes reconocer el impacto de tus palabras, ofrecer espacio y comprobar qué necesita. La recuperación puede requerir varias intervenciones; no fuerces una respuesta.";
  if (run.event && !run.eventHandled) return "Una sirena la sobresaltó. Atiende su nueva preocupación antes de continuar.";
  const priorities = ["scene", "observe", "introduce", "distance", "quiet", "needs", "physical", "risk", "validate", "supports", "silence", "water", "information", "contact", "reassess", "plan"];
  const id = priorities.find(id => !hasPap(run, id));
  return id ? PAP_ACTIONS.find(a => a.id === id)!.feedback : papFinishBlock(run) ?? "Puedes cerrar la atención y revisar tu devolución.";
}
