export type MedicalTerminologyCategory =
  | "General"
  | "Valoración"
  | "Farmacología"
  | "Patologías"
  | "Urgencias";

export type MedicalTerminologyEntry = {
  id: string;
  term: string;
  short: string;
  category: MedicalTerminologyCategory;
  definition: string;
  clinicalUse: string;
  example: string;
  related: string[];
};

export const MEDICAL_TERMINOLOGY_CATEGORIES: MedicalTerminologyCategory[] = [
  "General",
  "Valoración",
  "Farmacología",
  "Patologías",
  "Urgencias",
];

export const MEDICAL_TERMINOLOGY_LIBRARY: MedicalTerminologyEntry[] = [
  {
    id: "anamnesis",
    term: "Anamnesis",
    short: "Recogida estructurada de antecedentes y síntomas.",
    category: "General",
    definition:
      "Proceso de entrevista clínica orientado a obtener información relevante sobre motivo de consulta, antecedentes, evolución y contexto del paciente.",
    clinicalUse:
      "Sirve para organizar el razonamiento clínico inicial y orientar la exploración física y los estudios complementarios.",
    example:
      "En una anamnesis respiratoria se explora inicio de disnea, tos, fiebre, exposición y comorbilidades.",
    related: ["Motivo de consulta", "Antecedentes", "Exploración física"],
  },
  {
    id: "semiologia",
    term: "Semiología",
    short: "Lenguaje clínico para describir signos y síntomas.",
    category: "Valoración",
    definition:
      "Disciplina que estudia los signos y síntomas para reconocer síndromes y orientar diagnósticos diferenciales.",
    clinicalUse:
      "Permite describir hallazgos con precisión y evitar interpretaciones vagas durante la valoración.",
    example:
      "No es lo mismo registrar dolor abdominal que describir dolor epigástrico irradiado a espalda de inicio súbito.",
    related: ["Signo", "Síntoma", "Síndrome"],
  },
  {
    id: "diagnostico-diferencial",
    term: "Diagnóstico diferencial",
    short: "Lista razonada de posibles causas del cuadro clínico.",
    category: "General",
    definition:
      "Proceso de comparar alternativas diagnósticas según hallazgos clínicos, factores de riesgo y respuesta temporal del cuadro.",
    clinicalUse:
      "Ayuda a priorizar hipótesis seguras y a decidir qué datos faltan para confirmar o descartar patologías.",
    example:
      "Dolor torácico puede requerir diferenciar síndrome coronario, tromboembolismo, neumotórax o ansiedad.",
    related: ["Hipótesis clínica", "Red flags", "Priorización"],
  },
  {
    id: "farmacocinetica",
    term: "Farmacocinética",
    short: "Cómo el organismo absorbe, distribuye, metaboliza y elimina un fármaco.",
    category: "Farmacología",
    definition:
      "Estudio del recorrido del medicamento en el cuerpo desde su administración hasta su eliminación.",
    clinicalUse:
      "Permite ajustar dosis, intervalos, vía de administración y precauciones en insuficiencia renal o hepática.",
    example:
      "Un antibiótico con eliminación renal puede requerir ajuste si el paciente tiene deterioro de función renal.",
    related: ["Absorción", "Metabolismo", "Eliminación"],
  },
  {
    id: "farmacodinamia",
    term: "Farmacodinamia",
    short: "Cómo el fármaco actúa sobre el organismo.",
    category: "Farmacología",
    definition:
      "Describe mecanismo de acción, efectos terapéuticos y efectos adversos derivados de la interacción del fármaco con su diana.",
    clinicalUse:
      "Ayuda a entender por qué un medicamento produce el efecto esperado y qué reacciones adversas deben vigilarse.",
    example:
      "Los beta bloqueadores disminuyen frecuencia cardiaca y pueden precipitar bradicardia o hipotensión.",
    related: ["Mecanismo de acción", "Efectos adversos", "Contraindicaciones"],
  },
  {
    id: "interaccion-farmacologica",
    term: "Interacción farmacológica",
    short: "Cambio del efecto de un fármaco por otro medicamento o sustancia.",
    category: "Farmacología",
    definition:
      "Modificación clínica relevante del efecto terapéutico o tóxico de un medicamento cuando se combina con otro fármaco, alimento o sustancia.",
    clinicalUse:
      "Es clave en conciliación farmacológica y seguridad del paciente, especialmente en polifarmacia.",
    example:
      "Anticoagulantes junto con AINE pueden incrementar el riesgo de sangrado.",
    related: ["Polifarmacia", "Conciliación", "Seguridad del paciente"],
  },
  {
    id: "evento-adverso",
    term: "Evento adverso",
    short: "Daño no intencional asociado a la atención o al tratamiento.",
    category: "Farmacología",
    definition:
      "Incidente que produce daño al paciente y que puede relacionarse con medicamentos, procedimientos, dispositivos o procesos asistenciales.",
    clinicalUse:
      "Debe documentarse, notificarse y analizarse para reducir recurrencias y mejorar barreras de seguridad.",
    example:
      "Una reacción anafiláctica tras administrar un antibiótico constituye un evento adverso grave.",
    related: ["Farmacovigilancia", "Incidente", "Notificación"],
  },
  {
    id: "fisiopatologia",
    term: "Fisiopatología",
    short: "Mecanismos que explican cómo se produce una enfermedad.",
    category: "Patologías",
    definition:
      "Estudio de las alteraciones funcionales y biológicas que originan signos, síntomas y complicaciones en una patología.",
    clinicalUse:
      "Conecta hallazgos clínicos con la enfermedad de base y mejora la comprensión del porqué del tratamiento.",
    example:
      "En insuficiencia cardiaca, la congestión pulmonar se explica por aumento de presiones de llenado y retención hídrica.",
    related: ["Etiología", "Manifestaciones clínicas", "Complicaciones"],
  },
  {
    id: "etiologia",
    term: "Etiología",
    short: "Causa o conjunto de causas de una enfermedad.",
    category: "Patologías",
    definition:
      "Origen biológico, ambiental, conductual o multifactorial que explica el desarrollo de una condición clínica.",
    clinicalUse:
      "Es útil para enfocar prevención, educación y manejo causal cuando es posible.",
    example:
      "La neumonía puede tener etiología bacteriana, viral o aspirativa.",
    related: ["Factor de riesgo", "Fisiopatología", "Prevención"],
  },
  {
    id: "pronostico",
    term: "Pronóstico",
    short: "Evolución esperada de una enfermedad o cuadro clínico.",
    category: "Patologías",
    definition:
      "Estimación de la evolución clínica futura considerando severidad, respuesta al tratamiento y riesgo de complicaciones.",
    clinicalUse:
      "Ayuda a definir vigilancia, educación, nivel de atención y seguimiento.",
    example:
      "Un sepsis con hipotensión refractaria tiene peor pronóstico que una infección localizada sin disfunción orgánica.",
    related: ["Evolución", "Complicaciones", "Seguimiento"],
  },
  {
    id: "red-flags",
    term: "Red flags",
    short: "Signos de alarma que obligan a escalar la atención.",
    category: "Urgencias",
    definition:
      "Hallazgos clínicos o contextuales que sugieren alto riesgo de deterioro, daño grave o necesidad de intervención urgente.",
    clinicalUse:
      "Permiten priorizar seguridad, activar protocolos y acelerar derivación o tratamiento.",
    example:
      "Disnea progresiva, cianosis y alteración del estado mental son red flags respiratorias.",
    related: ["Triage", "Priorización", "Escalamiento"],
  },
  {
    id: "triage",
    term: "Triage",
    short: "Clasificación inicial según gravedad y tiempo de respuesta.",
    category: "Urgencias",
    definition:
      "Proceso de priorización clínica para decidir qué paciente necesita atención primero según riesgo y urgencia.",
    clinicalUse:
      "Ordena recursos y evita demoras en cuadros tiempo-dependientes.",
    example:
      "Un paciente con dolor torácico y diaforesis no puede esperar igual que un control ambulatorio estable.",
    related: ["Emergencia", "Urgencia", "Red flags"],
  },
  {
    id: "sepsis",
    term: "Sepsis",
    short: "Disfunción orgánica por respuesta desregulada a una infección.",
    category: "Urgencias",
    definition:
      "Síndrome grave en el que una infección desencadena una respuesta sistémica capaz de comprometer órganos y perfusión tisular.",
    clinicalUse:
      "Debe reconocerse temprano para iniciar antibióticos, fluidos, monitorización y escalamiento oportuno.",
    example:
      "Hipotensión, fiebre, taquicardia y alteración del sensorio en un paciente infectado obligan a sospechar sepsis.",
    related: ["Choque séptico", "Perfusión", "Disfunción orgánica"],
  },
  {
    id: "choque",
    term: "Choque",
    short: "Estado de hipoperfusión con riesgo vital.",
    category: "Urgencias",
    definition:
      "Síndrome de falla circulatoria que impide una perfusión adecuada y provoca hipoxia tisular y daño orgánico progresivo.",
    clinicalUse:
      "Exige reconocimiento inmediato, monitorización estrecha y manejo dirigido a la causa.",
    example:
      "Choque hipovolémico, cardiogénico, distributivo y obstructivo tienen abordajes iniciales distintos.",
    related: ["Hipoperfusión", "Lactato", "Reanimación"],
  },
  {
    id: "conciliacion",
    term: "Conciliación de medicamentos",
    short: "Revisión estructurada del tratamiento farmacológico en transiciones asistenciales.",
    category: "Farmacología",
    definition:
      "Proceso de comparar los medicamentos que el paciente usa con las nuevas prescripciones para detectar omisiones, duplicidades o interacciones.",
    clinicalUse:
      "Reduce errores al ingreso, traslado y alta hospitalaria.",
    example:
      "Antes del alta se compara el tratamiento previo con el nuevo plan y se aclaran suspensiones o cambios.",
    related: ["Polifarmacia", "Interacciones", "Alta segura"],
  },
  {
    id: "sindrome",
    term: "Síndrome",
    short: "Conjunto de signos y síntomas que aparecen asociados.",
    category: "General",
    definition:
      "Agrupación de manifestaciones clínicas que suelen presentarse juntas y orientan a un mismo proceso patológico.",
    clinicalUse:
      "Permite reconocer patrones clínicos antes de tener un diagnóstico etiológico definitivo.",
    example:
      "El síndrome meníngeo orienta a explorar causas infecciosas, inflamatorias o hemorrágicas.",
    related: ["Semiología", "Diagnóstico", "Patrón clínico"],
  },
  {
    id: "taquicardia",
    term: "Taquicardia",
    short: "Frecuencia cardiaca elevada para la edad y el contexto.",
    category: "Valoración",
    definition:
      "Aumento de la frecuencia cardiaca por encima de rangos esperados, que puede ser fisiológico o indicar compromiso hemodinámico.",
    clinicalUse:
      "Debe interpretarse junto con dolor, fiebre, hipovolemia, hipoxia, ansiedad o arritmias.",
    example:
      "Una taquicardia persistente con hipotensión obliga a buscar choque o sangrado.",
    related: ["Bradicardia", "Perfusión", "Signos vitales"],
  },
  {
    id: "hipoxemia",
    term: "Hipoxemia",
    short: "Disminución del oxígeno en sangre arterial.",
    category: "Valoración",
    definition:
      "Reducción anormal de la oxigenación arterial, evidenciable por gasometría o sospechable por saturación baja y signos de dificultad respiratoria.",
    clinicalUse:
      "Guía decisiones sobre oxigenoterapia, ventilación y necesidad de escalamiento.",
    example:
      "Una saturación de 86% con tiraje y taquipnea orienta a hipoxemia clínicamente relevante.",
    related: ["Hipoxia", "Saturación", "Oxigenoterapia"],
  },
];
