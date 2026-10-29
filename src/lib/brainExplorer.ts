export type RegionId = 'prefrontal' | 'amygdala' | 'hippocampus' | 'insula' | 'cingulate' | 'reward';
export type BrainPhase = 'context' | 'experience' | 'support';
export const BRAIN_REGIONS: { id: RegionId; name: string; color: string; position: [number, number, number]; role: string }[] = [
  { id: 'prefrontal', name: 'Corteza prefrontal', color: '#67baff', position: [34, 43, 26], role: 'Participa en atención, planificación y regulación emocional; trabaja con otras redes.' },
  { id: 'amygdala', name: 'Amígdala', color: '#ff927c', position: [23, -5, -18], role: 'Contribuye al aprendizaje y a la relevancia emocional de las amenazas. Hay una en cada hemisferio.' },
  { id: 'hippocampus', name: 'Hipocampo', color: '#c29aff', position: [27, -23, -13], role: 'Relaciona memoria y contexto; ayuda a distinguir una situación presente de recuerdos previos.' },
  { id: 'insula', name: 'Ínsula anterior', color: '#ffd27d', position: [34, 16, 2], role: 'Integra señales corporales, como latidos y respiración, con la experiencia emocional.' },
  { id: 'cingulate', name: 'Corteza cingulada anterior', color: '#f18ed6', position: [6, 30, 22], role: 'Participa en monitoreo, motivación y regulación junto con redes prefrontales y límbicas.' },
  { id: 'reward', name: 'Estriado ventral', color: '#77e3bd', position: [12, 10, -8], role: 'Participa en motivación y aprendizaje de recompensas. No es un único “centro de placer”.' },
];
export type BrainCase = {
  id: string; title: string; person: string; tag: string; history: string; symptoms: string[];
  phases: Record<BrainPhase, { label: string; quote: string; explanation: string; focus: RegionId[] }>;
  links: Partial<Record<RegionId, string>>;
  question: string; options: string[]; answer: number; feedback: string;
};
export const BRAIN_PHASES: BrainPhase[] = ['context', 'experience', 'support'];
export const BRAIN_CASES: BrainCase[] = [
  {
    id: 'depression', title: 'Depresión', person: 'Lucía · 29 años', tag: 'Ánimo y motivación',
    history: 'Desde hace seis semanas, Lucía ha perdido el interés por pintar y salir con sus amistades. Se despierta muy temprano, se siente agotada y le cuesta concentrarse en el trabajo. Acude a consulta para una valoración integral.',
    symptoms: ['Pérdida de interés', 'Cansancio', 'Autocrítica persistente'],
    phases: {
      context: { label: 'Contexto', quote: 'Antes disfrutaba pintar. Ahora todo me cuesta.', explanation: 'Explora cómo memoria, motivación y regulación se relacionan con la experiencia. El caso ilustra síntomas compatibles; el diagnóstico exige evaluación clínica.', focus: ['reward', 'prefrontal', 'hippocampus'] },
      experience: { label: 'Rumiación', quote: 'Repaso mis errores una y otra vez y no logro empezar nada.', explanation: 'La rumiación puede involucrar redes autorreferenciales, cinguladas y prefrontales. La pérdida de interés se ha asociado a diferencias en circuitos de recompensa; no equivale a una zona apagada.', focus: ['cingulate', 'prefrontal', 'reward', 'hippocampus'] },
      support: { label: 'Apoyo inicial', quote: 'Puedo contar lo que me pasa y acordar un siguiente paso.', explanation: 'Escuchar, explorar seguridad y acordar evaluación y seguimiento son pasos iniciales. Esta vista destaca redes de regulación y motivación; no representa una curación ni un cambio cerebral medido tras conversar.', focus: ['prefrontal', 'cingulate', 'reward'] },
    },
    links: { reward: 'Relaciona el interés por pintar y la motivación con circuitos de recompensa.', prefrontal: 'Ayuda a explicar la dificultad para dirigir la atención y organizar actividades.', cingulate: 'Se incluye por su participación en regulación y procesamiento autorreferencial.', hippocampus: 'Permite explorar memoria y contexto de experiencias personales.' },
    question: '¿Qué conclusión puedes extraer de esta visualización?', options: ['Los colores confirman depresión en Lucía.', 'Varias redes pueden participar; la imagen no permite diagnosticar.', 'La depresión ocurre únicamente en el estriado ventral.'], answer: 1,
    feedback: 'La depresión es heterogénea. Un mapa educativo de redes no sustituye entrevista, evaluación de seguridad y diagnóstico diferencial.',
  },
  {
    id: 'anxiety', title: 'Ansiedad generalizada', person: 'Andrés · 24 años', tag: 'Preocupación y anticipación',
    history: 'Andrés lleva ocho meses preocupado por estudios, dinero y salud, incluso cuando no existe un problema inmediato. Le resulta difícil controlar esa preocupación y presenta tensión muscular e insomnio.',
    symptoms: ['Preocupación difícil de controlar', 'Tensión muscular', 'Dificultad para dormir'],
    phases: {
      context: { label: 'Contexto', quote: 'Siempre siento que algo podría salir mal.', explanation: 'La anticipación de amenazas y la regulación de la preocupación implican redes distribuidas. Estos síntomas requieren valorar contexto, causas médicas y otras condiciones.', focus: ['prefrontal', 'hippocampus', 'amygdala'] },
      experience: { label: 'Anticipación', quote: 'Noto mis latidos, me tenso y pienso en todos los problemas posibles.', explanation: 'Amígdala e ínsula participan en relevancia emocional y señales del cuerpo. Las redes prefrontales y cinguladas intervienen en atención y regulación; su relación varía entre personas.', focus: ['amygdala', 'insula', 'prefrontal', 'cingulate'] },
      support: { label: 'Apoyo inicial', quote: 'Me ayuda hablar despacio y reconocer lo que siento.', explanation: 'Validar, ofrecer un entorno tranquilo y acordar valoración puede ayudar. Si la persona lo desea, puede orientarse al entorno y respirar cómodamente, sin forzar. El mapa no mide una respuesta terapéutica.', focus: ['insula', 'prefrontal', 'cingulate', 'hippocampus'] },
    },
    links: { amygdala: 'Señala participación en detección y aprendizaje de amenazas.', insula: 'Relaciona la percepción de latidos y tensión con sensaciones internas.', prefrontal: 'Participa en anticipación, atención y regulación de preocupaciones.', cingulate: 'Participa en monitoreo y control atencional.', hippocampus: 'Aporta información contextual a las redes emocionales.' },
    question: 'Andrés nota latidos intensos. ¿Qué relación ilustra la ínsula?', options: ['Integra señales corporales con la experiencia emocional.', 'Demuestra que hay una lesión cerebral.', 'Determina por sí sola el diagnóstico de ansiedad.'], answer: 0,
    feedback: 'La ínsula participa en interocepción. Notar palpitaciones no permite asumir que todo es ansiedad; síntomas nuevos o intensos requieren valoración apropiada.',
  },
  {
    id: 'claustrophobia', title: 'Claustrofobia', person: 'Mateo · 32 años', tag: 'Miedo a espacios cerrados',
    history: 'Mateo evita los ascensores desde hace un año por miedo a quedar atrapado. Al entrar en uno, aunque funciona con normalidad, siente miedo intenso y desea salir. La evitación interfiere con su trabajo.',
    symptoms: ['Miedo situacional intenso', 'Sensación de falta de aire', 'Evitación'],
    phases: {
      context: { label: 'Contexto', quote: 'Ver las puertas del ascensor ya me pone en alerta.', explanation: 'La claustrofobia es una presentación de fobia específica. El contexto y los aprendizajes previos pueden contribuir a la anticipación del miedo.', focus: ['hippocampus', 'amygdala', 'prefrontal'] },
      experience: { label: 'Dentro del ascensor', quote: 'Siento que no podré salir. Quiero que abran la puerta.', explanation: 'Redes de amenaza, interocepción y contexto participan en el miedo ante el estímulo. Las luces representan esa relación didáctica, sin simular descargas eléctricas registradas.', focus: ['amygdala', 'insula', 'hippocampus', 'cingulate'] },
      support: { label: 'Apoyo inicial', quote: 'Puedo decidir salir y hablar de cómo buscar ayuda.', explanation: 'Respetar la decisión, acompañar y orientar a valoración. No bloquear la salida ni imponer exposición. La exposición terapéutica requiere planificación y consentimiento con un profesional.', focus: ['prefrontal', 'hippocampus', 'insula'] },
    },
    links: { amygdala: 'Participa en la relevancia amenazante atribuida al ascensor.', insula: 'Relaciona sensaciones de respiración y latidos con la experiencia de miedo.', hippocampus: 'Contribuye al contexto y a los recuerdos asociados al espacio cerrado.', cingulate: 'Participa en atención a la amenaza y preparación de respuesta.', prefrontal: 'Participa en interpretación contextual y regulación junto con otras regiones.' },
    question: '¿Qué respuesta respeta la autonomía de Mateo?', options: ['Cerrar la puerta hasta que deje de tener miedo.', 'Asegurar que una luz roja demuestra una amígdala enferma.', 'Permitir salir, acompañar y proponer valoración profesional.'], answer: 2,
    feedback: 'No se fuerza la permanencia ni la exposición. El apoyo inicial respeta decisiones; no sustituye un tratamiento planificado.',
  },
];
export const BRAIN_SOURCES = [
  { label: 'NIMH · Depresión', url: 'https://www.nimh.nih.gov/health/publications/depression' },
  { label: 'NIMH · Trastornos de ansiedad', url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders' },
  { label: 'NIMH · Fobias', url: 'https://www.nimh.nih.gov/health/publications/phobias-and-phobia-related-disorders' },
  { label: 'NIMH · Circuitos y redes', url: 'https://www.nimh.nih.gov/research/research-funded-by-nimh/rdoc/units/circuits' },
  { label: 'Ipser et al. · Metaanálisis de neuroimagen en fobia específica', url: 'https://onlinelibrary.wiley.com/doi/10.1111/pcn.12055' },
];

export const BRAIN_REGION_DETAILS: Record<RegionId, { short: string; location: string; function: string; mechanism: string; caution: string; source: string }> = {
  prefrontal: { short: 'Regulación y atención', location: 'Parte anterior de los lóbulos frontales. El área coloreada es una referencia aproximada.', function: 'Mantiene objetivos en mente y ayuda a cambiar el foco de atención y valorar una situación.', mechanism: 'Intercambia información con redes emocionales y de memoria. Regular una emoción requiere coordinación entre regiones; no basta con “encender” la corteza prefrontal.', caution: 'Una dificultad para concentrarse no demuestra daño prefrontal ni falta de voluntad.', source: 'https://www.nimh.nih.gov/research/research-funded-by-nimh/rdoc/constructs/cognitive-control' },
  amygdala: { short: 'Relevancia emocional', location: 'Estructura profunda del lóbulo temporal, por delante del hipocampo. Se representa en ambos lados.', function: 'Participa en aprender qué señales son relevantes y en preparar respuestas ante una posible amenaza.', mechanism: 'Recibe información sensorial y contextual e interactúa con circuitos que coordinan respuestas corporales y conductuales. También participa en aprendizajes que no son de miedo.', caution: 'El miedo consciente depende de una red más amplia. La amígdala no es un botón único de ansiedad.', source: 'https://www.nimh.nih.gov/research/research-funded-by-nimh/rdoc/negative-valence-systems-active-threat-fear-nimh-research-domain-criteria-rdoc' },
  hippocampus: { short: 'Memoria y contexto', location: 'Estructura curva y profunda de la región temporal medial, en ambos hemisferios.', function: 'Relaciona experiencias con su contexto y participa en la memoria episódica.', mechanism: 'Aporta información sobre dónde y cuándo ocurre algo. Esa información puede ayudar a diferenciar el presente de una experiencia recordada y modifica cómo otras redes interpretan una situación.', caution: 'Recordar algo desagradable no prueba que el hipocampo esté alterado; es una función normal de la memoria.', source: 'https://www.nimh.nih.gov/research/research-funded-by-nimh/rdoc/units/circuits' },
  insula: { short: 'Señales del cuerpo', location: 'Corteza situada en profundidad dentro de la cisura lateral. La vista interior facilita verla.', function: 'Integra señales internas del cuerpo con atención y experiencia emocional.', mechanism: 'Las señales de respiración, latidos y tensión adquieren significado según el contexto. La atención a estas sensaciones puede influir en cómo se vive una situación.', caution: 'La ínsula no genera por sí sola las palpitaciones. Los síntomas físicos también pueden tener otras causas.', source: 'https://www.nimh.nih.gov/research/research-funded-by-nimh/rdoc/negative-valence-systems-active-threat-fear-nimh-research-domain-criteria-rdoc' },
  cingulate: { short: 'Monitoreo y motivación', location: 'Zona medial de los hemisferios, sobre y delante del cuerpo calloso. Se muestra una porción anterior orientativa.', function: 'Contribuye a detectar información relevante, monitorear conflictos y ajustar la atención y la conducta.', mechanism: 'Sus distintas subdivisiones participan en redes de control, emoción y motivación. Su función depende de la tarea y de sus conexiones con otras regiones.', caution: 'La rumiación involucra redes autorreferenciales distribuidas. No se localiza en una única porción cingulada.', source: 'https://www.nimh.nih.gov/research/research-funded-by-nimh/rdoc/constructs/cognitive-control' },
  reward: { short: 'Motivación y recompensa', location: 'Región profunda de los ganglios basales. El marcador representa de forma aproximada el territorio ventral, incluido el núcleo accumbens.', function: 'Participa en aprender de los resultados y en la motivación para acercarse a experiencias valiosas.', mechanism: 'Integra información de recompensa, contexto y objetivos. En investigación sobre anhedonia se estudian diferencias de respuesta y conectividad en este circuito.', caution: 'Perder interés no significa que la región esté apagada ni se explica por una sola sustancia química.', source: 'https://www.nimh.nih.gov/research/research-funded-by-nimh/rdoc/constructs/reward-responsiveness' },
};

const CASE_REGION_REASONS: Record<string, Partial<Record<RegionId, { trigger: string; why: string; experience: string }>>> = {
  depression: {
    reward: { trigger: 'Actividades que antes eran gratificantes, como pintar.', why: 'Se destaca para explicar la relación entre anhedonia y procesamiento de recompensas. En algunos grupos con depresión se observan respuestas distintas ante recompensas; no se presupone un aumento de actividad.', experience: 'Lucía pierde el interés y le cuesta iniciar actividades, aunque antes las disfrutaba.' },
    prefrontal: { trigger: 'Intentar trabajar mientras pensamientos autocríticos captan la atención.', why: 'Mantener una meta y desplazar la atención requiere redes de control. El esfuerzo por concentrarse y regular pensamientos permite estudiar su relación con otras redes.', experience: 'Lucía tarda en empezar tareas y siente que no consigue concentrarse.' },
    cingulate: { trigger: 'Volver una y otra vez sobre errores personales.', why: 'Se destaca por su participación en monitoreo y regulación. Las relaciones con redes autorreferenciales ayudan a explorar la atención repetida hacia uno mismo, sin atribuir toda la rumiación a esta estructura.', experience: 'Lucía describe una autocrítica que se repite y de la que le cuesta salir.' },
    hippocampus: { trigger: 'Recuperar recuerdos personales al pensar en lo que ha cambiado.', why: 'Recordar experiencias y situarlas en contexto requiere sistemas de memoria. Se incluye para conectar el contenido de esos recuerdos con las redes emocionales.', experience: 'Lucía compara su situación actual con momentos en los que disfrutaba pintar.' },
  },
  anxiety: {
    amygdala: { trigger: 'Interpretar problemas futuros como posibles amenazas.', why: 'Se destaca por su participación en relevancia emocional y aprendizaje de amenaza. La incertidumbre implica una red distribuida, incluida la amígdala extendida, no solo este marcador.', experience: 'Andrés permanece en alerta aunque no haya un peligro inmediato.' },
    insula: { trigger: 'Notar latidos, tensión muscular y cambios respiratorios.', why: 'Se destaca porque integra señales corporales. Al prestar mucha atención a ellas e interpretarlas como preocupantes, pueden formar parte de la experiencia de ansiedad.', experience: 'Andrés nota más su cuerpo y esas sensaciones alimentan su preocupación.' },
    prefrontal: { trigger: 'Intentar anticipar y resolver muchos escenarios posibles.', why: 'La planificación y el control de la atención dependen de redes prefrontales. Se ilustra la dificultad de cambiar el foco de pensamientos repetidos hacia una tarea concreta.', experience: 'Andrés intenta preverlo todo y le resulta difícil desconectar de las preocupaciones.' },
    cingulate: { trigger: 'Detectar conflictos entre lo que debe hacer y lo que le preocupa.', why: 'Participa con otras regiones en monitoreo y ajuste de la atención. Se destaca para explicar cómo la información interpretada como importante compite por los recursos de atención.', experience: 'Andrés revisa mentalmente los problemas y se mantiene tenso.' },
    hippocampus: { trigger: 'Usar recuerdos y circunstancias actuales para interpretar el futuro.', why: 'El contexto y la memoria contribuyen a la interpretación de seguridad o amenaza. Se incluye para mostrar cómo la preocupación está vinculada a lo que la persona recuerda y anticipa.', experience: 'Andrés relaciona situaciones presentes con problemas que teme que se repitan.' },
  },
  claustrophobia: {
    amygdala: { trigger: 'Ver cerrarse las puertas del ascensor y anticipar quedar atrapado.', why: 'El estímulo puede adquirir relevancia de amenaza por aprendizaje. Esta región participa en esa valoración junto con información de contexto y redes que preparan respuestas defensivas.', experience: 'Mateo siente miedo intenso y urgencia por salir.' },
    insula: { trigger: 'Percibir la respiración y los latidos durante el miedo.', why: 'Las sensaciones corporales se integran con la interpretación del espacio cerrado. Si se viven como señal de asfixia o peligro, pueden acompañar un aumento del temor.', experience: 'Mateo siente que le falta aire aunque esa sensación no demuestra por sí sola falta de oxígeno.' },
    hippocampus: { trigger: 'Reconocer el ascensor como un contexto asociado a temor.', why: 'La memoria contextual ayuda a relacionar lugares con experiencias y expectativas. Se destaca para explicar por qué una señal situacional puede evocar miedo aprendido.', experience: 'Mateo ya se pone en alerta al acercarse al ascensor.' },
    cingulate: { trigger: 'Centrar la atención en el peligro percibido y en encontrar una salida.', why: 'Participa en monitoreo de información relevante y preparación de ajustes conductuales. Es una pieza de la red que relaciona atención, emoción y acción.', experience: 'La atención de Mateo se concentra en la puerta y en la posibilidad de escapar.' },
    prefrontal: { trigger: 'Valorar el contexto actual y considerar opciones para responder.', why: 'Las redes prefrontales contribuyen a interpretar señales y regular la respuesta con otras estructuras. Saber que el ascensor funciona no elimina automáticamente la experiencia de miedo.', experience: 'Mateo puede reconocer que está a salvo y seguir sintiendo mucho temor.' },
  },
};

export function brainRegionExplanation(caseId: string, phase: BrainPhase, regionId: RegionId) {
  const c = BRAIN_CASES.find(item => item.id === caseId)!;
  const active = c.phases[phase].focus.includes(regionId);
  const detail = BRAIN_REGION_DETAILS[regionId];
  const reason = CASE_REGION_REASONS[caseId]?.[regionId];
  return {
    active,
    trigger: phase === 'support' && active ? 'Escuchar, reconocer la situación y considerar un siguiente paso con apoyo.' : reason?.trigger || 'Esta región no forma parte de la selección de este ejemplo.',
    why: !active ? `Se muestra como referencia anatómica. No está destacada en este momento; eso no significa que esté inactiva. ${detail.function}` : phase === 'support' ? `${detail.function} Se incluye como función que permite comprender el apoyo, sin afirmar que su actividad aumente ni que el malestar haya desaparecido.` : reason!.why,
    experience: phase === 'support' && active ? c.phases.support.quote : reason?.experience || 'La experiencia del caso no se atribuye a esta región de forma aislada.',
  };
}
