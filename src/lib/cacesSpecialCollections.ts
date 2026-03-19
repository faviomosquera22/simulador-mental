import type {
  CacesDifficulty,
  CacesOptionId,
  CacesQuestion,
  CacesQuestionOption,
  CacesQuestionType,
} from "./types";
import rawImportedQuestions from "./data/cacesPdfImportedRaw.json";

type ChoiceSeed = {
  text: string;
  rationale: string;
};

type SpecialQuestionSeed = {
  id: string;
  category: string;
  subcomponent: string;
  topic: string;
  type: CacesQuestionType;
  difficulty: CacesDifficulty;
  question: string;
  correct: ChoiceSeed;
  distractors: [ChoiceSeed, ChoiceSeed, ChoiceSeed];
  explanation: string;
  tags: string[];
};

type RawImportedQuestion = {
  id: string;
  category: string;
  topic: string;
  type: "directa" | "caso_clinico";
  difficulty: CacesDifficulty;
  question: string;
  options: [string, string, string, string];
  tags: string[];
  source: string;
};

function option(id: CacesOptionId, text: string, rationale: string): CacesQuestionOption {
  return { id, text, rationale };
}

function buildOptions(
  correct: ChoiceSeed,
  distractors: [ChoiceSeed, ChoiceSeed, ChoiceSeed],
  correctSlot: number
) {
  const letters: CacesOptionId[] = ["A", "B", "C", "D"];
  const pool = [...distractors];
  const built: CacesQuestionOption[] = [];
  let correctAnswer: CacesOptionId = "A";

  for (let idx = 0; idx < letters.length; idx++) {
    const letter = letters[idx];
    if (idx === correctSlot) {
      built.push(option(letter, correct.text, correct.rationale));
      correctAnswer = letter;
      continue;
    }

    const next = pool.shift() ?? {
      text: "Distractor",
      rationale: "No responde al criterio clínico principal.",
    };
    built.push(option(letter, next.text, next.rationale));
  }

  return {
    options: built as [
      CacesQuestionOption,
      CacesQuestionOption,
      CacesQuestionOption,
      CacesQuestionOption,
    ],
    correctAnswer,
  };
}

const SPECIAL_COLLECTION_SEEDS: SpecialQuestionSeed[] = [
  {
    id: "score-001",
    category: "Score MAMÁ",
    subcomponent: "Activación del protocolo",
    topic: "Hipertensión severa y respuesta inmediata",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Gestante de 34 semanas presenta cefalea intensa, fosfenos y tensión arterial de 166/112 mmHg repetida a los 15 minutos. Según el enfoque Score MAMÁ y claves obstétricas, ¿qué acción inicial es más adecuada?",
    correct: {
      text: "Activar respuesta obstétrica urgente, valorar severidad materno-fetal y preparar tratamiento antihipertensivo según protocolo.",
      rationale: "La hipertensión severa en gestación exige respuesta tiempo-dependiente y valoración integral inmediata.",
    },
    distractors: [
      {
        text: "Repetir la tensión arterial en 4 horas antes de escalar la conducta.",
        rationale: "Demora una emergencia obstétrica potencialmente grave.",
      },
      {
        text: "Indicar reposo domiciliario y control en consulta externa.",
        rationale: "No es seguro ante datos de severidad.",
      },
      {
        text: "Priorizar solo analgesia y reevaluar si persisten los síntomas.",
        rationale: "No aborda el riesgo hipertensivo materno-fetal.",
      },
    ],
    explanation:
      "La combinación de tensión arterial severa y síntomas de alarma obliga activación inmediata del protocolo y vigilancia obstétrica estrecha.",
    tags: ["score_mama", "preeclampsia", "obstetricia", "priorizacion"],
  },
  {
    id: "score-002",
    category: "Score MAMÁ",
    subcomponent: "Variables clínicas",
    topic: "Elementos que integran el Score MAMÁ",
    type: "directa",
    difficulty: "intermedia",
    question:
      "¿Cuál conjunto corresponde mejor a las variables clínicas utilizadas por el Score MAMÁ para reconocer deterioro temprano en pacientes obstétricas?",
    correct: {
      text: "Temperatura, tensión arterial sistólica y diastólica, frecuencia cardiaca, frecuencia respiratoria, saturación, oxigenoterapia, consciencia y diuresis.",
      rationale: "Resume las variables fisiológicas centrales del sistema de alerta temprana obstétrica.",
    },
    distractors: [
      {
        text: "Proteinuria, hemoglobina, leucocitos, glicemia, talla uterina y dinámica uterina.",
        rationale: "Incluye datos útiles, pero no corresponde al núcleo del Score MAMÁ.",
      },
      {
        text: "Glasgow, hemocultivos, lactato, rayos X, ecografía y proteinuria.",
        rationale: "Mezcla exámenes complementarios con variables clínicas no equivalentes.",
      },
      {
        text: "Frecuencia cardiaca fetal, Bishop, loquios, reflejos osteotendinosos y peso materno.",
        rationale: "No representa el panel fisiológico completo del score.",
      },
    ],
    explanation:
      "El Score MAMÁ se basa en signos clínicos y variables fisiológicas de alerta temprana, no en laboratorios aislados.",
    tags: ["score_mama", "signos_vitales", "alerta_temprana"],
  },
  {
    id: "score-003",
    category: "Score MAMÁ",
    subcomponent: "Uso clínico",
    topic: "Herramienta complementaria",
    type: "directa",
    difficulty: "basica",
    question:
      "Respecto al uso del Score MAMÁ, ¿cuál afirmación es correcta?",
    correct: {
      text: "Es una herramienta complementaria para apoyar decisiones y referencia temprana, sin reemplazar el juicio clínico ni la categorización de riesgo vigente.",
      rationale: "El protocolo la plantea como apoyo para reconocimiento temprano y escalamiento oportuno.",
    },
    distractors: [
      {
        text: "Reemplaza la valoración clínica integral cuando el puntaje es bajo.",
        rationale: "El puntaje nunca sustituye el criterio clínico.",
      },
      {
        text: "Solo debe aplicarse en hospitales de tercer nivel.",
        rationale: "Su uso está pensado desde el primer contacto asistencial.",
      },
      {
        text: "Se usa únicamente durante el trabajo de parto y no en puerperio.",
        rationale: "También se aplica en embarazo y puerperio.",
      },
    ],
    explanation:
      "El valor del Score MAMÁ está en detectar deterioro y apoyar referencia o intervención temprana en cualquier nivel de atención.",
    tags: ["score_mama", "uso_clinico", "referencia"],
  },
  {
    id: "score-004",
    category: "Score MAMÁ",
    subcomponent: "Clave obstétrica",
    topic: "Monitoreo y registro",
    type: "caso_clinico",
    difficulty: "intermedia",
    question:
      "Durante una clave obstétrica, la paciente permanece inestable pero con respuesta parcial al manejo inicial. ¿Qué acción de enfermería fortalece más la seguridad del seguimiento?",
    correct: {
      text: "Mantener monitorización seriada de signos vitales, consciencia y diuresis, registrando la evolución en los formularios y ficha de seguimiento.",
      rationale: "La reevaluación estructurada permite detectar deterioro y ajustar decisiones oportunamente.",
    },
    distractors: [
      {
        text: "Esperar estabilidad completa antes de volver a registrar signos vitales.",
        rationale: "Reduce la vigilancia en una paciente aún inestable.",
      },
      {
        text: "Suspender el registro formal para ganar tiempo operativo.",
        rationale: "La trazabilidad clínica es parte de la seguridad del caso.",
      },
      {
        text: "Delegar el control solo a la familia mientras se resuelven otros pendientes.",
        rationale: "No garantiza monitorización clínica segura.",
      },
    ],
    explanation:
      "En clave obstétrica, el registro continuo y la reevaluación seriada son esenciales para decisiones de traslado o resolución.",
    tags: ["score_mama", "clave_obstetrica", "monitoreo"],
  },
  {
    id: "score-005",
    category: "Score MAMÁ",
    subcomponent: "Hemorragia obstétrica",
    topic: "Prioridad inicial en hemorragia posparto",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Puérpera inmediata con sangrado abundante, palidez, taquicardia y útero blando. ¿Cuál conducta inicial de enfermería es más coherente con el enfoque Score MAMÁ y clave roja?",
    correct: {
      text: "Cuantificar la hemorragia, realizar masaje uterino, activar la clave roja y apoyar la reanimación hemodinámica inmediata.",
      rationale: "Integra control inicial de causa probable, valoración objetiva del sangrado y activación del protocolo.",
    },
    distractors: [
      {
        text: "Esperar resultado de hemoglobina antes de intervenir.",
        rationale: "Los laboratorios no deben retrasar el manejo inicial.",
      },
      {
        text: "Priorizar el traslado sin iniciar medidas en la sala.",
        rationale: "La estabilización debe comenzar desde el primer contacto.",
      },
      {
        text: "Indicar reposo absoluto y observación si la presión aún no cae.",
        rationale: "Subestima una hemorragia obstétrica activa.",
      },
    ],
    explanation:
      "La hemorragia posparto requiere respuesta inmediata con control inicial, cuantificación y soporte hemodinámico simultáneo.",
    tags: ["score_mama", "hemorragia", "clave_roja"],
  },
  {
    id: "score-006",
    category: "Score MAMÁ",
    subcomponent: "Sepsis materna",
    topic: "Referencia temprana",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Gestante con fiebre, taquicardia, frecuencia respiratoria elevada y deterioro progresivo del estado general. ¿Qué conducta es más segura?",
    correct: {
      text: "Reconocer posible sepsis materna, iniciar medidas iniciales protocolizadas y coordinar referencia temprana si supera la capacidad resolutiva del establecimiento.",
      rationale: "La sepsis obstétrica es tiempo-dependiente y exige escalamiento precoz.",
    },
    distractors: [
      {
        text: "Esperar confirmación microbiológica antes de activar el protocolo.",
        rationale: "La confirmación etiológica no debe retrasar acciones tempranas.",
      },
      {
        text: "Administrar antipirético y citar a control si cede la fiebre.",
        rationale: "No aborda el riesgo sistémico materno.",
      },
      {
        text: "Limitar la conducta a hidratación oral y observación local.",
        rationale: "Es insuficiente ante signos de deterioro.",
      },
    ],
    explanation:
      "El reconocimiento temprano de sepsis materna y la referencia oportuna son determinantes para reducir progresión a choque y falla orgánica.",
    tags: ["score_mama", "sepsis_materna", "referencia"],
  },
  {
    id: "crit-001",
    category: "Cuidados críticos",
    subcomponent: "Hemodinamia",
    topic: "Perfusión en paciente con vasopresor",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente en UCI con vasopresor, piel marmórea y diuresis de 0,2 mL/kg/h. ¿Qué valoración de enfermería aporta más a la vigilancia de perfusión?",
    correct: {
      text: "Integrar presión arterial, llenado capilar, estado mental, diuresis y tendencia del lactato para detectar hipoperfusión persistente.",
      rationale: "La perfusión se interpreta mejor con datos hemodinámicos y clínicos combinados.",
    },
    distractors: [
      {
        text: "Registrar solo la presión arterial media como parámetro suficiente.",
        rationale: "La presión aislada puede ocultar hipoperfusión en curso.",
      },
      {
        text: "Suspender la vigilancia horaria de diuresis si el monitor es estable.",
        rationale: "La diuresis es un marcador clave de perfusión renal.",
      },
      {
        text: "Centrarse únicamente en la frecuencia cardiaca.",
        rationale: "No resume la perfusión sistémica completa.",
      },
    ],
    explanation:
      "En cuidados críticos, la vigilancia de perfusión requiere lectura integrada de datos clínicos y tendencia hemodinámica.",
    tags: ["uci", "shock", "perfusión", "criticos"],
  },
  {
    id: "crit-002",
    category: "Cuidados críticos",
    subcomponent: "Ventilación mecánica",
    topic: "Prevención de NAV",
    type: "directa",
    difficulty: "intermedia",
    question:
      "¿Qué intervención forma parte de un paquete sólido para prevenir neumonía asociada a ventilación mecánica?",
    correct: {
      text: "Elevar cabecera, asegurar higiene oral protocolizada y reevaluar diariamente sedación y posibilidad de extubación.",
      rationale: "Combina medidas de prevención con reducción del tiempo de ventilación invasiva.",
    },
    distractors: [
      {
        text: "Mantener al paciente en decúbito plano para evitar desplazamientos del tubo.",
        rationale: "Aumenta riesgo de aspiración.",
      },
      {
        text: "Evitar higiene oral para no movilizar secreciones.",
        rationale: "La higiene oral es parte del paquete preventivo.",
      },
      {
        text: "Prolongar sedación profunda de forma rutinaria para evitar agitación.",
        rationale: "Puede aumentar días de ventilación y complicaciones.",
      },
    ],
    explanation:
      "La prevención de NAV depende de medidas agrupadas, no de una intervención aislada.",
    tags: ["uci", "ventilacion", "nav"],
  },
  {
    id: "crit-003",
    category: "Cuidados críticos",
    subcomponent: "Seguridad de dispositivos",
    topic: "Catéter venoso central",
    type: "directa",
    difficulty: "intermedia",
    question:
      "¿Qué conducta de enfermería reduce mejor infecciones asociadas a catéter venoso central?",
    correct: {
      text: "Cumplir técnica aséptica, vigilar necesidad diaria del dispositivo y mantener curación/puertos según protocolo.",
      rationale: "La prevención requiere inserción segura y mantenimiento correcto.",
    },
    distractors: [
      {
        text: "Cambiar el catéter de forma programada sin valoración clínica.",
        rationale: "No sustituye las medidas de mantenimiento basadas en evidencia.",
      },
      {
        text: "Manipular los conectores sin fricción desinfectante si el acceso fue rápido.",
        rationale: "Aumenta riesgo de contaminación intraluminal.",
      },
      {
        text: "Conservar el catéter aunque ya no sea necesario para evitar nuevas punciones.",
        rationale: "Todo dispositivo innecesario incrementa riesgo infeccioso.",
      },
    ],
    explanation:
      "El control del catéter central depende de mantenimiento estricto y retiro oportuno cuando ya no aporta beneficio.",
    tags: ["uci", "cateter", "infeccion"],
  },
  {
    id: "crit-004",
    category: "Cuidados críticos",
    subcomponent: "Sedación y analgesia",
    topic: "Reevaluación de sedación",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente ventilado permanece con sedación profunda sin reevaluación desde hace 24 horas. ¿Qué práctica mejora más la seguridad?",
    correct: {
      text: "Aplicar una escala validada, reevaluar objetivos de sedación con el equipo y evitar profundidad mayor a la necesaria.",
      rationale: "La sedación debe individualizarse y monitorizarse de forma continua.",
    },
    distractors: [
      {
        text: "Mantener la misma dosis mientras el paciente no se mueva.",
        rationale: "La inmovilidad no garantiza sedación adecuada ni segura.",
      },
      {
        text: "Suspender toda monitorización de sedación si está intubado.",
        rationale: "La intubación no elimina el riesgo de sobre o infra-sedación.",
      },
      {
        text: "Priorizar solo la presión arterial para ajustar sedantes.",
        rationale: "La monitorización de sedación requiere herramientas específicas.",
      },
    ],
    explanation:
      "La sedación en UCI debe evaluarse con metas explícitas y escalas estandarizadas para reducir complicaciones.",
    tags: ["uci", "sedacion", "seguridad"],
  },
  {
    id: "crit-005",
    category: "Cuidados críticos",
    subcomponent: "Balance hídrico",
    topic: "Diuresis y lesión renal aguda",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente crítico con creatinina en ascenso y balance positivo marcado. ¿Qué acción de enfermería es más valiosa para el seguimiento?",
    correct: {
      text: "Registrar ingresos-egresos con precisión, vigilar diuresis horaria y comunicar tendencia de sobrecarga/hipoperfusión al equipo.",
      rationale: "El balance y la diuresis orientan decisiones de perfusión y manejo renal.",
    },
    distractors: [
      {
        text: "Suspender el balance porque ya existen laboratorios diarios.",
        rationale: "El laboratorio no reemplaza la vigilancia continua.",
      },
      {
        text: "Medir diuresis solo al final del turno.",
        rationale: "La tendencia horaria es crítica en paciente inestable.",
      },
      {
        text: "Reducir toda hidratación por iniciativa propia sin valoración integral.",
        rationale: "Las decisiones terapéuticas requieren correlación clínica y orden médica.",
      },
    ],
    explanation:
      "En lesión renal aguda o sospecha de ella, la monitorización estricta del balance hídrico es parte del razonamiento crítico de enfermería.",
    tags: ["uci", "renal", "balance_hidrico"],
  },
  {
    id: "crit-006",
    category: "Cuidados críticos",
    subcomponent: "Lesiones por presión",
    topic: "Prevención en paciente inmovilizado",
    type: "directa",
    difficulty: "intermedia",
    question:
      "En un paciente crítico inmovilizado y con vasopresores, ¿qué estrategia preventiva es más sólida frente a lesiones por presión?",
    correct: {
      text: "Reposicionamiento según tolerancia hemodinámica, inspección frecuente de piel, manejo de humedad y soporte de superficie adecuado.",
      rationale: "La prevención requiere enfoque multimodal y vigilancia continua.",
    },
    distractors: [
      {
        text: "Masajear sistemáticamente prominencias óseas cada turno.",
        rationale: "Puede agravar tejido vulnerable y no es la medida recomendada.",
      },
      {
        text: "Mantener una sola posición para no alterar la presión arterial.",
        rationale: "La inmovilidad sostenida favorece daño tisular.",
      },
      {
        text: "Aplicar crema solo si ya existe lesión abierta.",
        rationale: "La prevención debe iniciarse antes del daño visible.",
      },
    ],
    explanation:
      "La prevención de lesiones por presión en cuidados críticos depende de vigilancia de piel, alivio de presión y control del microambiente cutáneo.",
    tags: ["uci", "piel", "seguridad_paciente"],
  },
  {
    id: "urg-001",
    category: "Urgencias",
    subcomponent: "Código ictus",
    topic: "Déficit neurológico focal",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente llega a triaje con desviación facial, hemiparesia y disartria iniciadas hace 35 minutos. ¿Cuál es la prioridad?",
    correct: {
      text: "Activar ruta de ictus/código ACV y acelerar evaluación tiempo-dependiente sin demoras administrativas.",
      rationale: "Los déficits focales agudos requieren respuesta inmediata para preservar opciones terapéuticas.",
    },
    distractors: [
      {
        text: "Ubicarlo en observación y reevaluar al completar una hora de evolución.",
        rationale: "Perder tiempo reduce oportunidad terapéutica.",
      },
      {
        text: "Indicar reposo y control posterior si los signos ceden parcialmente.",
        rationale: "Los síntomas transitorios también requieren evaluación urgente.",
      },
      {
        text: "Administrar analgésico y esperar resultados de laboratorio antes de alertar al equipo.",
        rationale: "No responde a la prioridad neurológica inmediata.",
      },
    ],
    explanation:
      "El ACV agudo es una urgencia tiempo-dependiente; la activación temprana de la ruta mejora el pronóstico.",
    tags: ["urgencias", "acv", "triaje"],
  },
  {
    id: "urg-002",
    category: "Urgencias",
    subcomponent: "Anafilaxia",
    topic: "Manejo inicial",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Tras recibir un antibiótico, la paciente presenta urticaria generalizada, disnea y compromiso hemodinámico. ¿Qué intervención inicial es prioritaria?",
    correct: {
      text: "Reconocer anafilaxia y administrar adrenalina intramuscular mientras se activa soporte avanzado y vigilancia estrecha.",
      rationale: "La adrenalina IM es la primera línea del manejo inicial.",
    },
    distractors: [
      {
        text: "Administrar solo antihistamínico oral y observar respuesta.",
        rationale: "Es insuficiente en anafilaxia con compromiso sistémico.",
      },
      {
        text: "Esperar confirmación médica antes de toda intervención urgente.",
        rationale: "Retrasa una emergencia potencialmente fatal.",
      },
      {
        text: "Iniciar nebulización aislada y diferir el resto de medidas.",
        rationale: "No aborda el mecanismo sistémico principal.",
      },
    ],
    explanation:
      "Ante anafilaxia, el reconocimiento temprano y la adrenalina intramuscular son decisivos.",
    tags: ["urgencias", "anafilaxia", "emergencia"],
  },
  {
    id: "urg-003",
    category: "Urgencias",
    subcomponent: "Trauma",
    topic: "Prioridad en valoración primaria",
    type: "directa",
    difficulty: "intermedia",
    question:
      "En trauma, ¿por qué el enfoque ABCDE sigue siendo central en la valoración primaria?",
    correct: {
      text: "Porque ordena la identificación y tratamiento de amenazas vitales inmediatas antes de profundizar estudios secundarios.",
      rationale: "La secuencia protege la supervivencia en la fase inicial.",
    },
    distractors: [
      {
        text: "Porque reemplaza la necesidad de monitorización continua posterior.",
        rationale: "El ABCDE no sustituye la reevaluación.",
      },
      {
        text: "Porque prioriza siempre estudios de imagen completos como primer paso.",
        rationale: "Los estudios no deben retrasar soporte vital.",
      },
      {
        text: "Porque descarta toda intervención simultánea del equipo.",
        rationale: "La valoración primaria puede ser paralela y coordinada.",
      },
    ],
    explanation:
      "El ABCDE estructura la respuesta inicial para que las amenazas vitales no pasen desapercibidas.",
    tags: ["urgencias", "trauma", "abcde"],
  },
  {
    id: "urg-004",
    category: "Urgencias",
    subcomponent: "Dolor torácico",
    topic: "Triage de alto riesgo",
    type: "caso_clinico",
    difficulty: "intermedia",
    question:
      "Adulto con dolor torácico opresivo, diaforesis y náusea activa ingresa al área de emergencias. ¿Qué medida inicial refleja mejor priorización clínica?",
    correct: {
      text: "Asignar prioridad alta, monitorizar y acelerar ECG/valoración según ruta de dolor torácico.",
      rationale: "El cuadro sugiere evento coronario tiempo-dependiente.",
    },
    distractors: [
      {
        text: "Ubicar en fila general por orden de llegada si mantiene conversación.",
        rationale: "No respeta el riesgo clínico del cuadro.",
      },
      {
        text: "Esperar laboratorio basal antes de monitorizar.",
        rationale: "La monitorización y el ECG deben ser tempranos.",
      },
      {
        text: "Tratar inicialmente como dolor musculoesquelético sin ruta específica.",
        rationale: "Subestima un posible síndrome coronario agudo.",
      },
    ],
    explanation:
      "Los síntomas autonómicos y el dolor opresivo obligan a priorización alta y evaluación inmediata.",
    tags: ["urgencias", "dolor_toracico", "triaje"],
  },
  {
    id: "urg-005",
    category: "Urgencias",
    subcomponent: "Respiratorio agudo",
    topic: "Crisis asmática severa",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente con sibilancias intensas, habla entrecortada y saturación de 88% pese a broncodilatador inicial. ¿Cuál es la conducta más adecuada?",
    correct: {
      text: "Escalar manejo de crisis asmática severa con oxígeno, reevaluación continua y alerta médica inmediata.",
      rationale: "La hipoxemia y dificultad respiratoria severa exigen escalamiento sin demora.",
    },
    distractors: [
      {
        text: "Mantener solo observación porque ya recibió una nebulización.",
        rationale: "No es seguro con hipoxemia persistente.",
      },
      {
        text: "Indicar retorno a domicilio con inhalador de rescate.",
        rationale: "No corresponde al compromiso actual.",
      },
      {
        text: "Esperar gasometría antes de iniciar oxígeno.",
        rationale: "El soporte inicial no debe retrasarse por estudios.",
      },
    ],
    explanation:
      "La crisis asmática severa requiere reevaluación estrecha y escalamiento rápido del soporte respiratorio.",
    tags: ["urgencias", "asma", "hipoxemia"],
  },
  {
    id: "urg-006",
    category: "Urgencias",
    subcomponent: "Metabólicas",
    topic: "Hipoglucemia con alteración neurológica",
    type: "caso_clinico",
    difficulty: "intermedia",
    question:
      "Paciente con diaforesis, temblor y alteración del estado mental presenta glicemia capilar de 42 mg/dL. ¿Cuál es la prioridad?",
    correct: {
      text: "Tratar la hipoglucemia de inmediato y vigilar respuesta clínica-neurológica de forma seriada.",
      rationale: "La corrección rápida reduce riesgo de daño neurológico.",
    },
    distractors: [
      {
        text: "Esperar una muestra venosa confirmatoria antes de tratar.",
        rationale: "La confirmación no debe retrasar la corrección inicial.",
      },
      {
        text: "Indicar solo observación si el paciente aún abre los ojos.",
        rationale: "La alteración neurológica ya indica urgencia.",
      },
      {
        text: "Posponer tratamiento hasta completar la anamnesis detallada.",
        rationale: "La prioridad es revertir la hipoglucemia.",
      },
    ],
    explanation:
      "La hipoglucemia sintomática es una urgencia clínica y debe tratarse sin demora.",
    tags: ["urgencias", "hipoglucemia", "priorizacion"],
  },
  {
    id: "lab-001",
    category: "Laboratorios clínicos",
    subcomponent: "Electrolitos",
    topic: "Hiperpotasemia y seguridad",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente con debilidad muscular, potasio sérico de 6,8 mEq/L y cambios electrocardiográficos. ¿Qué acción de enfermería es prioritaria?",
    correct: {
      text: "Reconocer hiperpotasemia grave, monitorizar continuamente y alertar de inmediato para tratamiento urgente.",
      rationale: "Existe riesgo de arritmias potencialmente fatales.",
    },
    distractors: [
      {
        text: "Repetir el potasio al día siguiente antes de comunicar.",
        rationale: "Demora una alteración potencialmente mortal.",
      },
      {
        text: "Solicitar dieta baja en potasio como única medida inicial.",
        rationale: "La situación requiere respuesta mucho más rápida.",
      },
      {
        text: "Retirar monitorización por no tratarse de dolor torácico.",
        rationale: "La monitorización es crucial ante riesgo eléctrico.",
      },
    ],
    explanation:
      "La hiperpotasemia grave con cambios ECG exige vigilancia intensiva y escalamiento inmediato.",
    tags: ["laboratorio", "potasio", "seguridad"],
  },
  {
    id: "lab-002",
    category: "Laboratorios clínicos",
    subcomponent: "Gasometría",
    topic: "Acidosis metabólica compensada",
    type: "directa",
    difficulty: "alta",
    question:
      "Una gasometría muestra pH bajo, bicarbonato disminuido y PaCO2 también disminuida. ¿Qué interpretación es más coherente?",
    correct: {
      text: "Sugiere acidosis metabólica con compensación respiratoria.",
      rationale: "La caída de bicarbonato es primaria y la PaCO2 baja actúa como compensación.",
    },
    distractors: [
      {
        text: "Sugiere alcalosis metabólica descompensada.",
        rationale: "El bicarbonato bajo no corresponde a alcalosis metabólica.",
      },
      {
        text: "Indica un trastorno exclusivamente respiratorio.",
        rationale: "No explica el descenso primario del bicarbonato.",
      },
      {
        text: "Equivale a una gasometría normal con hiperventilación voluntaria.",
        rationale: "El pH y el bicarbonato muestran alteración real.",
      },
    ],
    explanation:
      "La interpretación acidobásica debe identificar el trastorno primario y luego valorar si existe compensación.",
    tags: ["laboratorio", "gasometria", "acido_base"],
  },
  {
    id: "lab-003",
    category: "Laboratorios clínicos",
    subcomponent: "Marcadores de perfusión",
    topic: "Lactato seriado",
    type: "directa",
    difficulty: "intermedia",
    question:
      "En un paciente con sospecha de sepsis, ¿por qué la tendencia del lactato puede ser útil?",
    correct: {
      text: "Porque ayuda a vigilar la respuesta global a la perfusión y al tratamiento cuando se interpreta junto al contexto clínico.",
      rationale: "Su tendencia aporta información dinámica sobre gravedad y evolución.",
    },
    distractors: [
      {
        text: "Porque reemplaza completamente la valoración hemodinámica.",
        rationale: "Nunca sustituye la clínica ni la reevaluación integral.",
      },
      {
        text: "Porque confirma por sí solo el foco infeccioso.",
        rationale: "No identifica etiología específica.",
      },
      {
        text: "Porque descarta sepsis cuando un solo resultado es normal.",
        rationale: "Un valor aislado no excluye deterioro posterior.",
      },
    ],
    explanation:
      "Los marcadores de laboratorio son más útiles cuando se siguen en tendencia y se correlacionan con el estado clínico.",
    tags: ["laboratorio", "lactato", "sepsis"],
  },
  {
    id: "lab-004",
    category: "Laboratorios clínicos",
    subcomponent: "Microbiología",
    topic: "Hemocultivos y antibiótico",
    type: "directa",
    difficulty: "intermedia",
    question:
      "Ante sospecha de sepsis, ¿qué principio resume mejor la relación entre hemocultivos y antibioticoterapia inicial?",
    correct: {
      text: "Obtener cultivos si es posible sin retrasar el inicio oportuno del tratamiento antimicrobiano.",
      rationale: "La rapidez terapéutica sigue siendo prioritaria.",
    },
    distractors: [
      {
        text: "Diferir antibióticos hasta contar con todos los cultivos procesados.",
        rationale: "Retrasa el manejo tiempo-dependiente.",
      },
      {
        text: "Evitar cualquier muestra microbiológica al inicio.",
        rationale: "Las muestras siguen siendo valiosas si no retrasan el tratamiento.",
      },
      {
        text: "Tomar cultivos solo después de 24 horas de antibiótico.",
        rationale: "Reduce rendimiento diagnóstico y no es el enfoque inicial.",
      },
    ],
    explanation:
      "El balance correcto es obtener estudios diagnósticos útiles sin perder la ventana terapéutica inicial.",
    tags: ["laboratorio", "cultivos", "sepsis"],
  },
  {
    id: "lab-005",
    category: "Laboratorios clínicos",
    subcomponent: "Cardiomarcadores",
    topic: "Troponina seriada",
    type: "caso_clinico",
    difficulty: "intermedia",
    question:
      "Paciente con dolor torácico y primera troponina no concluyente permanece sintomático. ¿Qué decisión es más coherente con el uso clínico del laboratorio?",
    correct: {
      text: "Mantener vigilancia y solicitar determinaciones seriadas según la ruta de dolor torácico.",
      rationale: "La evolución seriada aumenta el rendimiento diagnóstico del marcador.",
    },
    distractors: [
      {
        text: "Descartar de inmediato síndrome coronario solo por la primera muestra.",
        rationale: "Una muestra aislada puede ser insuficiente.",
      },
      {
        text: "Suspender monitorización porque el resultado inicial no es alto.",
        rationale: "La clínica sigue mandando la prioridad.",
      },
      {
        text: "Repetir troponina solo si aparece fiebre.",
        rationale: "No corresponde al uso del marcador en dolor torácico.",
      },
    ],
    explanation:
      "Los biomarcadores cardíacos deben interpretarse junto a síntomas, ECG y evolución temporal.",
    tags: ["laboratorio", "troponina", "dolor_toracico"],
  },
  {
    id: "lab-006",
    category: "Laboratorios clínicos",
    subcomponent: "Función renal",
    topic: "Creatinina y diuresis",
    type: "directa",
    difficulty: "intermedia",
    question:
      "¿Qué enfoque es más útil para seguir función renal en un paciente hospitalizado inestable?",
    correct: {
      text: "Combinar tendencia de creatinina con diuresis, perfusión clínica y contexto terapéutico.",
      rationale: "La función renal no se interpreta de forma segura con un solo dato aislado.",
    },
    distractors: [
      {
        text: "Basarse solo en el volumen total ingerido.",
        rationale: "La ingesta no resume función renal ni perfusión.",
      },
      {
        text: "Interpretar una creatinina aislada sin tendencia clínica.",
        rationale: "La tendencia y el contexto son indispensables.",
      },
      {
        text: "Usar exclusivamente densidad urinaria para decidir gravedad.",
        rationale: "Es un dato parcial y no suficiente.",
      },
    ],
    explanation:
      "En deterioro renal, la interpretación debe integrar datos bioquímicos y evolución clínica.",
    tags: ["laboratorio", "renal", "diuresis"],
  },
  {
    id: "ess-001",
    category: "Esenciales CACES",
    subcomponent: "Proceso enfermero",
    topic: "Prioridad del PAE",
    type: "directa",
    difficulty: "basica",
    question:
      "En el razonamiento enfermero, ¿qué elemento permite definir prioridades de cuidado de manera más segura?",
    correct: {
      text: "Relacionar valoración clínica, riesgo inmediato y necesidades del paciente antes de seleccionar intervenciones.",
      rationale: "La priorización depende de datos y riesgos, no de tareas aisladas.",
    },
    distractors: [
      {
        text: "Iniciar intervenciones estándar sin completar valoración inicial.",
        rationale: "Puede ignorar prioridades reales del caso.",
      },
      {
        text: "Copiar el plan del turno previo para ahorrar tiempo.",
        rationale: "No garantiza pertinencia clínica actual.",
      },
      {
        text: "Priorizar siempre lo administrativo por sobre lo clínico.",
        rationale: "La seguridad clínica sigue siendo central.",
      },
    ],
    explanation:
      "La priorización en el PAE se apoya en valoración, riesgo y objetivos clínicos individualizados.",
    tags: ["esenciales", "pae", "priorizacion"],
  },
  {
    id: "ess-002",
    category: "Esenciales CACES",
    subcomponent: "Comunicación clínica",
    topic: "Uso de SBAR",
    type: "directa",
    difficulty: "basica",
    question:
      "¿Qué ventaja principal aporta SBAR durante una transferencia clínica?",
    correct: {
      text: "Organiza la información clave de forma breve y estructurada, reduciendo omisiones relevantes.",
      rationale: "SBAR mejora continuidad y seguridad del cuidado.",
    },
    distractors: [
      {
        text: "Sustituye el registro en la historia clínica.",
        rationale: "La comunicación verbal no reemplaza el registro formal.",
      },
      {
        text: "Evita la necesidad de reevaluar al paciente receptor.",
        rationale: "La reevaluación sigue siendo obligatoria.",
      },
      {
        text: "Se usa solo en contextos administrativos no asistenciales.",
        rationale: "Tiene alta utilidad clínica en pases y alertas.",
      },
    ],
    explanation:
      "La transferencia segura de pacientes depende de comunicación estandarizada y verificable.",
    tags: ["esenciales", "sbar", "comunicacion"],
  },
  {
    id: "ess-003",
    category: "Esenciales CACES",
    subcomponent: "Seguridad en medicación",
    topic: "Medicamentos de alto riesgo",
    type: "caso_clinico",
    difficulty: "intermedia",
    question:
      "En una sala con alta carga laboral se prescribe insulina rápida en dosis variable. ¿Qué medida protege mejor al paciente?",
    correct: {
      text: "Aplicar doble verificación independiente antes de administrar un medicamento de alto riesgo.",
      rationale: "Disminuye errores de dosis, paciente y vía en fármacos críticos.",
    },
    distractors: [
      {
        text: "Confiar solo en la memoria del profesional con mayor experiencia.",
        rationale: "La experiencia no sustituye barreras de seguridad.",
      },
      {
        text: "Administrar de inmediato para no retrasar el turno.",
        rationale: "La prisa aumenta riesgo de error.",
      },
      {
        text: "Pedir confirmación verbal del paciente como única barrera.",
        rationale: "Es insuficiente para alto riesgo.",
      },
    ],
    explanation:
      "Los medicamentos de alto riesgo requieren controles adicionales y verificación sistemática.",
    tags: ["esenciales", "medicacion", "seguridad"],
  },
  {
    id: "ess-004",
    category: "Esenciales CACES",
    subcomponent: "Ética",
    topic: "Confidencialidad con riesgo grave",
    type: "caso_clinico",
    difficulty: "intermedia",
    question:
      "Adolescente revela ideación suicida con plan actual y pide no informar a nadie. ¿Qué actuación es éticamente correcta?",
    correct: {
      text: "Explicar los límites de confidencialidad y activar las medidas de protección ante riesgo grave e inminente.",
      rationale: "La seguridad prevalece cuando existe amenaza seria para la vida.",
    },
    distractors: [
      {
        text: "Prometer confidencialidad absoluta para mantener la alianza.",
        rationale: "Ignora el deber de protección ante riesgo vital.",
      },
      {
        text: "Registrar la información pero no comunicarla para respetar autonomía.",
        rationale: "Mantiene al paciente sin medidas de seguridad necesarias.",
      },
      {
        text: "Diferir toda acción hasta la próxima consulta.",
        rationale: "No responde a la urgencia del riesgo.",
      },
    ],
    explanation:
      "La confidencialidad tiene límites claros cuando existe riesgo grave para el propio paciente o terceros.",
    tags: ["esenciales", "etica", "riesgo"],
  },
  {
    id: "ess-005",
    category: "Esenciales CACES",
    subcomponent: "Consentimiento informado",
    topic: "Capacidad y comprensión",
    type: "directa",
    difficulty: "basica",
    question:
      "Para que el consentimiento informado sea clínicamente válido, ¿qué elemento es indispensable?",
    correct: {
      text: "Que la persona comprenda la información relevante y pueda decidir libremente sin coerción.",
      rationale: "La firma sola no garantiza consentimiento válido.",
    },
    distractors: [
      {
        text: "Que el documento esté firmado aunque el paciente no entienda el procedimiento.",
        rationale: "La comprensión es esencial.",
      },
      {
        text: "Que la familia decida siempre por el paciente adulto orientado.",
        rationale: "No respeta autonomía del paciente competente.",
      },
      {
        text: "Que la explicación sea exclusivamente técnica para mayor formalidad.",
        rationale: "La información debe ser comprensible para quien decide.",
      },
    ],
    explanation:
      "El consentimiento informado exige comprensión, voluntariedad y capacidad, además del registro correspondiente.",
    tags: ["esenciales", "consentimiento", "bioetica"],
  },
  {
    id: "ess-006",
    category: "Esenciales CACES",
    subcomponent: "Seguridad del paciente",
    topic: "Prevención de caídas",
    type: "directa",
    difficulty: "basica",
    question:
      "¿Qué enfoque resume mejor la prevención de caídas en un paciente hospitalizado de riesgo?",
    correct: {
      text: "Aplicar valoración multifactorial, medidas ambientales seguras y vigilancia según nivel de riesgo.",
      rationale: "La prevención eficaz combina evaluación y acciones adaptadas al paciente.",
    },
    distractors: [
      {
        text: "Usar solo barandas elevadas en todos los casos.",
        rationale: "No basta como estrategia única y puede no ser apropiado siempre.",
      },
      {
        text: "Restringir deambulación sin educación ni reevaluación.",
        rationale: "No aborda causas ni favorece autonomía segura.",
      },
      {
        text: "Reevaluar el riesgo solo al alta.",
        rationale: "El riesgo cambia durante la hospitalización.",
      },
    ],
    explanation:
      "La prevención de caídas requiere medidas individualizadas y reevaluación continua.",
    tags: ["esenciales", "caidas", "seguridad_paciente"],
  },
  {
    id: "adv-001",
    category: "Alta dificultad CACES",
    subcomponent: "Shock complejo",
    topic: "Deterioro hemodinámico progresivo",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente con sepsis presenta hipotensión persistente, lactato en ascenso, piel fría y oliguria pese a fluidos iniciales. ¿Qué interpretación orienta mejor la prioridad enfermera?",
    correct: {
      text: "Existe hipoperfusión persistente con alto riesgo de progresión a choque, por lo que la reevaluación hemodinámica y el escalamiento terapéutico son urgentes.",
      rationale: "Integra datos clínicos y de laboratorio para priorizar deterioro tiempo-dependiente.",
    },
    distractors: [
      {
        text: "La hipotensión aislada ya resuelta descarta compromiso hemodinámico significativo.",
        rationale: "La oliguria y el lactato ascendente contradicen esa conclusión.",
      },
      {
        text: "Mientras no haya fiebre, el cuadro no requiere escalamiento.",
        rationale: "La gravedad no depende solo de la temperatura.",
      },
      {
        text: "El lactato pierde valor si la frecuencia cardiaca no aumenta más.",
        rationale: "La tendencia del lactato sigue siendo relevante.",
      },
    ],
    explanation:
      "Los estados de shock se reconocen por integración de perfusión, respuesta a fluidos y datos de evolución, no por un solo parámetro.",
    tags: ["alta_dificultad", "shock", "sepsis"],
  },
  {
    id: "adv-002",
    category: "Alta dificultad CACES",
    subcomponent: "Emergencias metabólicas",
    topic: "Cetoacidosis diabética",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente con cetoacidosis diabética inicia insulina y fluidos. ¿Qué parámetro exige vigilancia estrecha por riesgo de caer durante el tratamiento?",
    correct: {
      text: "El potasio sérico, junto con la monitorización clínica y electrocardiográfica.",
      rationale: "El tratamiento puede desplazar potasio al interior celular y generar complicaciones graves.",
    },
    distractors: [
      {
        text: "Solo la hemoglobina, porque resume la respuesta metabólica.",
        rationale: "No es el parámetro crítico en este contexto.",
      },
      {
        text: "Únicamente la glucosa capilar, sin otros controles.",
        rationale: "La glucosa importa, pero no es el único riesgo inmediato.",
      },
      {
        text: "El colesterol sérico por riesgo cardiovascular agudo.",
        rationale: "No es el parámetro prioritario del tratamiento inicial.",
      },
    ],
    explanation:
      "En cetoacidosis diabética, el potasio puede deteriorarse durante el manejo y requiere vigilancia cercana.",
    tags: ["alta_dificultad", "dka", "potasio"],
  },
  {
    id: "adv-003",
    category: "Alta dificultad CACES",
    subcomponent: "Trauma torácico",
    topic: "Sospecha de neumotórax a tensión",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente politraumatizado presenta disnea intensa, hipotensión, desviación traqueal y ausencia unilateral de ruidos respiratorios. ¿Qué razonamiento es más adecuado?",
    correct: {
      text: "Sospechar neumotórax a tensión y priorizar respuesta inmediata orientada a una causa obstructiva letal.",
      rationale: "El cuadro clínico obliga acción urgente sin esperar confirmaciones demoradas.",
    },
    distractors: [
      {
        text: "Pensar primero en dolor musculoesquelético por contusión simple.",
        rationale: "No explica el compromiso ventilatorio y hemodinámico.",
      },
      {
        text: "Esperar radiografía antes de notificar una urgencia vital.",
        rationale: "Puede retrasar una intervención crítica.",
      },
      {
        text: "Interpretarlo como ansiedad hasta que la saturación descienda más.",
        rationale: "Subestima signos de compromiso letal.",
      },
    ],
    explanation:
      "En trauma, ciertos patrones clínicos obligan a actuar como emergencia letal incluso antes de la confirmación imagenológica.",
    tags: ["alta_dificultad", "trauma", "neumotorax"],
  },
  {
    id: "adv-004",
    category: "Alta dificultad CACES",
    subcomponent: "Hemorragia digestiva",
    topic: "Priorización hemodinámica",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente con hematemesis abundante, taquicardia, llenado capilar lento y mareo al incorporarse. ¿Qué prioridad clínica resume mejor la situación?",
    correct: {
      text: "Existe alto riesgo de compromiso hemodinámico, por lo que se priorizan vía venosa, monitorización y respuesta urgente estructurada.",
      rationale: "Los signos sugieren sangrado activo con repercusión sistémica.",
    },
    distractors: [
      {
        text: "Programar endoscopia electiva si el dolor abdominal es bajo.",
        rationale: "La inestabilidad actual obliga primero a estabilizar.",
      },
      {
        text: "Esperar hemograma de control antes de iniciar medidas de soporte.",
        rationale: "El soporte inicial no debe retrasarse.",
      },
      {
        text: "Indicar solo reposo y líquidos por vía oral.",
        rationale: "No responde al riesgo de sangrado agudo.",
      },
    ],
    explanation:
      "Ante hemorragia digestiva con repercusión circulatoria, la prioridad es la estabilización y el reconocimiento temprano de shock.",
    tags: ["alta_dificultad", "hemorragia", "shock"],
  },
  {
    id: "adv-005",
    category: "Alta dificultad CACES",
    subcomponent: "Neurogeriatría",
    topic: "Delirium versus deterioro crónico",
    type: "directa",
    difficulty: "alta",
    question:
      "¿Qué hallazgo favorece más delirium agudo frente a demencia estable en una persona mayor hospitalizada?",
    correct: {
      text: "Inicio súbito, fluctuación horaria e inatención marcada sobre una posible condición médica precipitante.",
      rationale: "Son rasgos nucleares del delirium.",
    },
    distractors: [
      {
        text: "Deterioro lento de memoria de varios años sin cambios diarios.",
        rationale: "Orienta más a deterioro crónico.",
      },
      {
        text: "Tristeza persistente con apetito bajo y sueño fragmentado como único hallazgo.",
        rationale: "No define delirium.",
      },
      {
        text: "Dependencia funcional progresiva sin alteración de atención.",
        rationale: "No corresponde al patrón agudo-fluctuante.",
      },
    ],
    explanation:
      "El delirium se distingue por su curso agudo y fluctuante, con alteración prominente de la atención.",
    tags: ["alta_dificultad", "delirium", "geriatria"],
  },
  {
    id: "adv-006",
    category: "Alta dificultad CACES",
    subcomponent: "Trastornos hidroelectrolíticos",
    topic: "Hiponatremia sintomática",
    type: "caso_clinico",
    difficulty: "alta",
    question:
      "Paciente con sodio de 118 mEq/L desarrolla cefalea intensa, náusea y confusión. ¿Qué lectura clínica es más adecuada?",
    correct: {
      text: "Se trata de una hiponatremia sintomática potencialmente grave que requiere escalamiento urgente y vigilancia neurológica estrecha.",
      rationale: "Los síntomas neurológicos sugieren compromiso clínico relevante.",
    },
    distractors: [
      {
        text: "Es una alteración leve que puede resolverse solo con restricción de agua no supervisada.",
        rationale: "Subestima riesgo neurológico.",
      },
      {
        text: "La confusión no guarda relación con el sodio si la presión arterial es normal.",
        rationale: "La sintomatología neurológica puede ser consecuencia directa.",
      },
      {
        text: "Solo debe repetirse el examen en 48 horas si no convulsiona.",
        rationale: "La demora no es segura ante síntomas actuales.",
      },
    ],
    explanation:
      "Las alteraciones hidroelectrolíticas sintomáticas pueden deteriorar rápidamente el estado neurológico y requieren respuesta urgente.",
    tags: ["alta_dificultad", "sodio", "neurologico"],
  },
];

const SPECIAL_TARGET_PER_CATEGORY = 100;

type DerivedRule = {
  category: string;
  subcomponent: string;
  source?: string;
  include: RegExp[];
  exclude?: RegExp[];
};

const DERIVED_RULES: DerivedRule[] = [
  {
    category: "Score MAMÁ",
    subcomponent: "Colección Score MAMÁ",
    source: "score_mama_2025",
    include: [/\bscore mamá\b/i],
  },
  {
    category: "Laboratorios clínicos",
    subcomponent: "Interpretación de laboratorio",
    include: [
      /\blaboratorio\b/i,
      /\bgasometr/i,
      /\belectrol/i,
      /\bhemograma\b/i,
      /\btroponina\b/i,
      /\bcultivo\b/i,
      /\blactato\b/i,
      /\burea\b/i,
      /\bcreatinina\b/i,
      /\bproteinuria\b/i,
      /\bbilirrub/i,
      /\bglucosa\b/i,
      /\bpotasio\b/i,
      /\bsodio\b/i,
    ],
  },
  {
    category: "Cuidados críticos",
    subcomponent: "Paciente crítico",
    include: [
      /\buci\b/i,
      /\bshock\b/i,
      /\bsepsis\b/i,
      /\bventil/i,
      /\bhemodin/i,
      /\bperfusion\b/i,
      /\bvasopres/i,
      /\bhipoperfusion\b/i,
      /\btrauma\b/i,
      /\bhemorrag/i,
      /\bcritico\b/i,
    ],
  },
  {
    category: "Urgencias",
    subcomponent: "Atención inicial",
    include: [
      /\burgenc/i,
      /\bemergen/i,
      /\btriaje\b/i,
      /\bdolor torac/i,
      /\bictus\b/i,
      /\bacv\b/i,
      /\bbronquiol/i,
      /\basma\b/i,
      /\banafil/i,
      /\bagitaci/i,
      /\bdeshidrat/i,
      /\bconvulsion/i,
      /\bhipogluc/i,
    ],
  },
  {
    category: "Esenciales CACES",
    subcomponent: "Competencias transversales",
    include: [
      /\bpae\b/i,
      /\bnanda\b/i,
      /\bnoc\b/i,
      /\bnic\b/i,
      /\bseguridad\b/i,
      /\bbioseguridad\b/i,
      /\bsbar\b/i,
      /\bconsentimiento\b/i,
      /\betica\b/i,
      /\bconfidencial/i,
      /\bfamilia/i,
      /\bcomunic/i,
      /\bpromoc/i,
      /\bprevenc/i,
      /\bepidemiolog/i,
      /\binvestig/i,
      /\badministr/i,
      /\bproceso de atención\b/i,
    ],
  },
  {
    category: "Alta dificultad CACES",
    subcomponent: "Razonamiento avanzado",
    include: [/.*/],
  },
];

const MANUAL_VARIANT_BUILDERS: Array<(seed: SpecialQuestionSeed) => string> = [
  (seed) => seed.question,
  (seed) => `En relación con ${String(seed.topic).toLowerCase()}, ¿cuál alternativa refleja mejor la decisión clínica prioritaria?`,
  (seed) => `Respecto a ${String(seed.topic).toLowerCase()}, identifica la conducta más segura para el personal de enfermería.`,
  (seed) => `Caso clínico: contexto de ${String(seed.topic).toLowerCase()}. ¿Qué intervención es más adecuada como primera respuesta?`,
  (seed) => `En una pregunta de alta prioridad sobre ${String(seed.topic).toLowerCase()}, ¿qué opción mantiene mejor la seguridad del paciente?`,
  (seed) => `¿Qué decisión demuestra razonamiento clínico sólido al abordar ${String(seed.topic).toLowerCase()}?`,
  (seed) => `Durante la valoración de ${String(seed.topic).toLowerCase()}, ¿qué acción debe priorizarse?`,
  (seed) => `¿Cuál es el error más importante que debe evitarse en ${String(seed.topic).toLowerCase()}?`,
  (seed) => `Al analizar ${String(seed.topic).toLowerCase()}, ¿qué medida favorece mejor la continuidad del cuidado?`,
  (seed) => `En un escenario docente sobre ${String(seed.topic).toLowerCase()}, ¿qué respuesta sería la más correcta?`,
  (seed) => `Si el caso se agrava en ${String(seed.topic).toLowerCase()}, ¿qué conducta sigue siendo la más segura?`,
  (seed) => `En la práctica CACES, ¿qué alternativa resume mejor el manejo de ${String(seed.topic).toLowerCase()}?`,
  (seed) => `¿Qué hallazgo o decisión se alinea de forma más consistente con ${String(seed.subcomponent).toLowerCase()}?`,
  (seed) => `Tras una reevaluación clínica sobre ${String(seed.topic).toLowerCase()}, ¿qué opción fortalece más la respuesta profesional?`,
  (seed) => `En una discusión de caso sobre ${String(seed.topic).toLowerCase()}, ¿cuál enunciado es más defendible?`,
  (seed) => `¿Qué conducta evita omisiones críticas al abordar ${String(seed.topic).toLowerCase()}?`,
  (seed) => `En formación para el CACES, ¿cuál respuesta sería la mejor frente a ${String(seed.topic).toLowerCase()}?`,
];

function cleanImportedText(value: string) {
  return String(value ?? "")
    .replace(/…/g, "")
    .replace(/\s+/g, " ")
    .replace(/^(?:\d+\.\s*){2,}/, "")
    .replace(/^\d+\.\d+\s+/, "")
    .replace(/^\d+\s+/, "")
    .replace(/^(?:desarrollo\s+)?7\.1\s+/i, "")
    .trim();
}

function buildRawHaystack(item: RawImportedQuestion) {
  return [
    item.category,
    item.topic,
    item.question,
    ...(Array.isArray(item.options) ? item.options : []),
    ...(Array.isArray(item.tags) ? item.tags : []),
    item.source,
  ]
    .join(" ")
    .toLowerCase();
}

function matchesDerivedRule(item: RawImportedQuestion, rule: DerivedRule) {
  if (rule.source && item.source !== rule.source) return false;
  const haystack = buildRawHaystack(item);
  if (!rule.include.some((pattern) => pattern.test(haystack))) return false;
  if (Array.isArray(rule.exclude) && rule.exclude.some((pattern) => pattern.test(haystack))) return false;
  if (rule.category === "Alta dificultad CACES") {
    return item.difficulty === "alta" || cleanImportedText(item.question).length > 180;
  }
  return true;
}

function mapImportedType(item: RawImportedQuestion): CacesQuestionType {
  if (/^caso/i.test(cleanImportedText(item.question))) return "caso_clinico";
  return item.type;
}

function buildRawStem(rule: DerivedRule, item: RawImportedQuestion) {
  const topic = cleanImportedText(item.topic) || cleanImportedText(item.question);
  if (rule.category === "Score MAMÁ") {
    if (mapImportedType(item) === "caso_clinico") {
      return `Caso clínico obstétrico: con base en Score MAMÁ 2025, identifica la afirmación correcta sobre ${topic}.`;
    }
    return `Según Score MAMÁ 2025, ¿cuál enunciado es correcto sobre ${topic}?`;
  }

  if (mapImportedType(item) === "caso_clinico") {
    return `Caso clínico de ${rule.category.toLowerCase()}: identifica la alternativa correcta sobre ${topic}.`;
  }

  return `En ${rule.category.toLowerCase()}, ¿cuál enunciado es correcto sobre ${topic}?`;
}

function buildRawOptions(rule: DerivedRule, item: RawImportedQuestion) {
  const letters: CacesOptionId[] = ["A", "B", "C", "D"];
  return letters.map((letter, idx) => {
    const isCorrect = idx === 0;
    return option(
      letter,
      cleanImportedText(String(item.options[idx] ?? "")),
      isCorrect
        ? `Es la alternativa más consistente con la colección ${rule.category}.`
        : `No es la alternativa priorizada en la colección ${rule.category}.`
    );
  }) as [CacesQuestionOption, CacesQuestionOption, CacesQuestionOption, CacesQuestionOption];
}

function buildManualVariantQuestion(seed: SpecialQuestionSeed, variantIdx: number, seedIdx: number): CacesQuestion {
  const { options, correctAnswer } = buildOptions(
    seed.correct,
    seed.distractors,
    (seedIdx + variantIdx) % 4
  );

  return {
    id: `caces-special-${seed.id}-v${String(variantIdx + 1).padStart(2, "0")}`,
    component: seed.category,
    subcomponent: seed.subcomponent,
    topic: seed.topic,
    sourceGroup: `special:${seed.id}:v${variantIdx + 1}`,
    category: seed.category,
    type: variantIdx % 3 === 0 ? "caso_clinico" : seed.type,
    question: MANUAL_VARIANT_BUILDERS[variantIdx % MANUAL_VARIANT_BUILDERS.length](seed),
    options,
    correctAnswer,
    explanation: `${seed.explanation} Esta variante refuerza el mismo núcleo conceptual desde un enunciado diferente.`,
    difficulty:
      seed.category === "Alta dificultad CACES"
        ? "alta"
        : variantIdx % 5 === 0 && seed.difficulty === "basica"
          ? "intermedia"
          : seed.difficulty,
    tags: [...new Set([seed.category.toLowerCase().replace(/\s+/g, "_"), "special_variant", ...seed.tags])],
    references: ["Banco especializado de práctica CACES con redacción original orientada a entrenamiento clínico."],
  };
}

function buildDerivedQuestion(rule: DerivedRule, item: RawImportedQuestion): CacesQuestion {
  return {
    id: `caces-derived-${rule.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${item.id}`,
    component: rule.category,
    subcomponent: rule.subcomponent,
    topic: cleanImportedText(item.topic) || cleanImportedText(item.question),
    sourceGroup: `derived:${rule.category}:${item.id}`,
    category: rule.category,
    type: mapImportedType(item),
    question: buildRawStem(rule, item),
    options: buildRawOptions(rule, item),
    correctAnswer: "A",
    explanation: `Pregunta derivada y curada para la colección ${rule.category} a partir del banco importado.`,
    difficulty: rule.category === "Alta dificultad CACES" ? "alta" : item.difficulty,
    tags: [...new Set([rule.category.toLowerCase().replace(/\s+/g, "_"), ...(item.tags ?? []), item.source])],
    references: [`Colección derivada desde banco importado para ${rule.category}.`],
  };
}

function buildSpecialCollectionBank() {
  const rawPool = rawImportedQuestions as RawImportedQuestion[];
  const usedRawIds = new Set<string>();
  const output: CacesQuestion[] = [];

  for (const rule of DERIVED_RULES) {
    const selectedRaw = rawPool
      .filter((item) => !usedRawIds.has(item.id))
      .filter((item) => matchesDerivedRule(item, rule))
      .slice(0, SPECIAL_TARGET_PER_CATEGORY);

    for (const item of selectedRaw) {
      usedRawIds.add(item.id);
      output.push(buildDerivedQuestion(rule, item));
    }

    const currentCount = output.filter((item) => item.category === rule.category).length;
    if (currentCount >= SPECIAL_TARGET_PER_CATEGORY) continue;

    const seeds = SPECIAL_COLLECTION_SEEDS.filter((seed) => seed.category === rule.category);
    let variantCounter = 0;
    while (
      output.filter((item) => item.category === rule.category).length < SPECIAL_TARGET_PER_CATEGORY &&
      seeds.length > 0
    ) {
      const seed = seeds[variantCounter % seeds.length];
      const seedIdx = SPECIAL_COLLECTION_SEEDS.indexOf(seed);
      output.push(buildManualVariantQuestion(seed, Math.floor(variantCounter / seeds.length), seedIdx));
      variantCounter += 1;
    }
  }

  return output;
}

export const CACES_SPECIAL_COLLECTION_BANK: CacesQuestion[] = buildSpecialCollectionBank();
