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
    "id": "anamnesis",
    "term": "Anamnesis",
    "short": "Entrevista estructurada para obtener motivo de consulta, antecedentes y evolución del cuadro.",
    "category": "General",
    "definition": "Entrevista estructurada para obtener motivo de consulta, antecedentes y evolución del cuadro.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con anamnesis.",
    "example": "En una discusión clínica, anamnesis ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "historia-clinica",
    "term": "Historia clínica",
    "short": "Registro longitudinal de datos, hallazgos, diagnósticos y plan del paciente.",
    "category": "General",
    "definition": "Registro longitudinal de datos, hallazgos, diagnósticos y plan del paciente.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con historia clínica.",
    "example": "En una discusión clínica, historia clínica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "motivo-de-consulta",
    "term": "Motivo de consulta",
    "short": "Razón principal por la que el paciente solicita atención.",
    "category": "General",
    "definition": "Razón principal por la que el paciente solicita atención.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con motivo de consulta.",
    "example": "En una discusión clínica, motivo de consulta ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "antecedente-personal",
    "term": "Antecedente personal",
    "short": "Dato previo de salud, enfermedad, cirugía o exposición del paciente.",
    "category": "General",
    "definition": "Dato previo de salud, enfermedad, cirugía o exposición del paciente.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con antecedente personal.",
    "example": "En una discusión clínica, antecedente personal ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "antecedente-familiar",
    "term": "Antecedente familiar",
    "short": "Información de enfermedades relevantes presentes en familiares.",
    "category": "General",
    "definition": "Información de enfermedades relevantes presentes en familiares.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con antecedente familiar.",
    "example": "En una discusión clínica, antecedente familiar ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "diagnostico-diferencial",
    "term": "Diagnóstico diferencial",
    "short": "Lista razonada de causas posibles para un mismo cuadro clínico.",
    "category": "General",
    "definition": "Lista razonada de causas posibles para un mismo cuadro clínico.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con diagnóstico diferencial.",
    "example": "En una discusión clínica, diagnóstico diferencial ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "hipotesis-clinica",
    "term": "Hipótesis clínica",
    "short": "Explicación provisional que guía la valoración y los estudios.",
    "category": "General",
    "definition": "Explicación provisional que guía la valoración y los estudios.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con hipótesis clínica.",
    "example": "En una discusión clínica, hipótesis clínica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "sindrome",
    "term": "Síndrome",
    "short": "Conjunto de signos y síntomas que aparecen asociados.",
    "category": "General",
    "definition": "Conjunto de signos y síntomas que aparecen asociados.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con síndrome.",
    "example": "En una discusión clínica, síndrome ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "signo",
    "term": "Signo",
    "short": "Hallazgo objetivo identificable por el profesional o una prueba.",
    "category": "General",
    "definition": "Hallazgo objetivo identificable por el profesional o una prueba.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con signo.",
    "example": "En una discusión clínica, signo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "sintoma",
    "term": "Síntoma",
    "short": "Manifestación subjetiva referida por el paciente.",
    "category": "General",
    "definition": "Manifestación subjetiva referida por el paciente.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con síntoma.",
    "example": "En una discusión clínica, síntoma ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "semiologia",
    "term": "Semiología",
    "short": "Disciplina que interpreta signos y síntomas para orientar diagnósticos.",
    "category": "General",
    "definition": "Disciplina que interpreta signos y síntomas para orientar diagnósticos.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con semiología.",
    "example": "En una discusión clínica, semiología ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "etiologia",
    "term": "Etiología",
    "short": "Causa o conjunto de causas de una enfermedad.",
    "category": "General",
    "definition": "Causa o conjunto de causas de una enfermedad.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con etiología.",
    "example": "En una discusión clínica, etiología ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "pronostico",
    "term": "Pronóstico",
    "short": "Estimación de la evolución esperada y del riesgo de complicaciones.",
    "category": "General",
    "definition": "Estimación de la evolución esperada y del riesgo de complicaciones.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con pronóstico.",
    "example": "En una discusión clínica, pronóstico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "comorbilidad",
    "term": "Comorbilidad",
    "short": "Presencia simultánea de otras enfermedades relevantes en el mismo paciente.",
    "category": "General",
    "definition": "Presencia simultánea de otras enfermedades relevantes en el mismo paciente.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con comorbilidad.",
    "example": "En una discusión clínica, comorbilidad ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "factor-de-riesgo",
    "term": "Factor de riesgo",
    "short": "Condición que aumenta la probabilidad de desarrollar enfermedad o daño.",
    "category": "General",
    "definition": "Condición que aumenta la probabilidad de desarrollar enfermedad o daño.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con factor de riesgo.",
    "example": "En una discusión clínica, factor de riesgo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "tamizaje",
    "term": "Tamizaje",
    "short": "Búsqueda sistemática de enfermedad en personas sin síntomas evidentes.",
    "category": "General",
    "definition": "Búsqueda sistemática de enfermedad en personas sin síntomas evidentes.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con tamizaje.",
    "example": "En una discusión clínica, tamizaje ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "sensibilidad",
    "term": "Sensibilidad",
    "short": "Capacidad de una prueba para identificar correctamente a los enfermos.",
    "category": "General",
    "definition": "Capacidad de una prueba para identificar correctamente a los enfermos.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con sensibilidad.",
    "example": "En una discusión clínica, sensibilidad ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "especificidad",
    "term": "Especificidad",
    "short": "Capacidad de una prueba para identificar correctamente a los sanos.",
    "category": "General",
    "definition": "Capacidad de una prueba para identificar correctamente a los sanos.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con especificidad.",
    "example": "En una discusión clínica, especificidad ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "valor-predictivo-positivo",
    "term": "Valor predictivo positivo",
    "short": "Probabilidad de enfermedad cuando una prueba sale positiva.",
    "category": "General",
    "definition": "Probabilidad de enfermedad cuando una prueba sale positiva.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con valor predictivo positivo.",
    "example": "En una discusión clínica, valor predictivo positivo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "valor-predictivo-negativo",
    "term": "Valor predictivo negativo",
    "short": "Probabilidad de ausencia de enfermedad cuando una prueba sale negativa.",
    "category": "General",
    "definition": "Probabilidad de ausencia de enfermedad cuando una prueba sale negativa.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con valor predictivo negativo.",
    "example": "En una discusión clínica, valor predictivo negativo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "incidencia",
    "term": "Incidencia",
    "short": "Número de casos nuevos en una población durante un periodo.",
    "category": "General",
    "definition": "Número de casos nuevos en una población durante un periodo.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con incidencia.",
    "example": "En una discusión clínica, incidencia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "prevalencia",
    "term": "Prevalencia",
    "short": "Número total de casos presentes en una población en un momento dado.",
    "category": "General",
    "definition": "Número total de casos presentes en una población en un momento dado.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con prevalencia.",
    "example": "En una discusión clínica, prevalencia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "morbilidad",
    "term": "Morbilidad",
    "short": "Carga o frecuencia de enfermedad en una población.",
    "category": "General",
    "definition": "Carga o frecuencia de enfermedad en una población.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con morbilidad.",
    "example": "En una discusión clínica, morbilidad ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "mortalidad",
    "term": "Mortalidad",
    "short": "Frecuencia de fallecimientos en una población o por una causa específica.",
    "category": "General",
    "definition": "Frecuencia de fallecimientos en una población o por una causa específica.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con mortalidad.",
    "example": "En una discusión clínica, mortalidad ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "consenso-clinico",
    "term": "Consenso clínico",
    "short": "Recomendación elaborada por acuerdo experto ante una situación clínica.",
    "category": "General",
    "definition": "Recomendación elaborada por acuerdo experto ante una situación clínica.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con consenso clínico.",
    "example": "En una discusión clínica, consenso clínico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "algoritmo-diagnostico",
    "term": "Algoritmo diagnóstico",
    "short": "Secuencia ordenada de pasos para orientar un diagnóstico.",
    "category": "General",
    "definition": "Secuencia ordenada de pasos para orientar un diagnóstico.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con algoritmo diagnóstico.",
    "example": "En una discusión clínica, algoritmo diagnóstico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "interconsulta",
    "term": "Interconsulta",
    "short": "Solicitud de valoración por otra especialidad o profesional.",
    "category": "General",
    "definition": "Solicitud de valoración por otra especialidad o profesional.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con interconsulta.",
    "example": "En una discusión clínica, interconsulta ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "referencia",
    "term": "Referencia",
    "short": "Derivación de un paciente a otro nivel o servicio asistencial.",
    "category": "General",
    "definition": "Derivación de un paciente a otro nivel o servicio asistencial.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con referencia.",
    "example": "En una discusión clínica, referencia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "contrarreferencia",
    "term": "Contrarreferencia",
    "short": "Retorno del paciente con información de continuidad desde otro servicio.",
    "category": "General",
    "definition": "Retorno del paciente con información de continuidad desde otro servicio.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con contrarreferencia.",
    "example": "En una discusión clínica, contrarreferencia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "consentimiento-informado",
    "term": "Consentimiento informado",
    "short": "Aceptación del paciente tras comprender riesgos, beneficios y alternativas.",
    "category": "General",
    "definition": "Aceptación del paciente tras comprender riesgos, beneficios y alternativas.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con consentimiento informado.",
    "example": "En una discusión clínica, consentimiento informado ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "adherencia-terapeutica",
    "term": "Adherencia terapéutica",
    "short": "Grado en que el paciente sigue el tratamiento indicado.",
    "category": "General",
    "definition": "Grado en que el paciente sigue el tratamiento indicado.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con adherencia terapéutica.",
    "example": "En una discusión clínica, adherencia terapéutica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "persistencia-terapeutica",
    "term": "Persistencia terapéutica",
    "short": "Tiempo durante el cual un paciente mantiene un tratamiento prescrito.",
    "category": "General",
    "definition": "Tiempo durante el cual un paciente mantiene un tratamiento prescrito.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con persistencia terapéutica.",
    "example": "En una discusión clínica, persistencia terapéutica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "iatrogenia",
    "term": "Iatrogenia",
    "short": "Daño o efecto indeseado causado por la atención sanitaria.",
    "category": "General",
    "definition": "Daño o efecto indeseado causado por la atención sanitaria.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con iatrogenia.",
    "example": "En una discusión clínica, iatrogenia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "nosocomial",
    "term": "Nosocomial",
    "short": "Relacionado con infección o evento adquirido durante la hospitalización.",
    "category": "General",
    "definition": "Relacionado con infección o evento adquirido durante la hospitalización.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con nosocomial.",
    "example": "En una discusión clínica, nosocomial ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "idiopatico",
    "term": "Idiopático",
    "short": "De causa desconocida pese a una valoración adecuada.",
    "category": "General",
    "definition": "De causa desconocida pese a una valoración adecuada.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con idiopático.",
    "example": "En una discusión clínica, idiopático ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "agudo",
    "term": "Agudo",
    "short": "De inicio reciente y evolución corta o rápida.",
    "category": "General",
    "definition": "De inicio reciente y evolución corta o rápida.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con agudo.",
    "example": "En una discusión clínica, agudo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "cronico",
    "term": "Crónico",
    "short": "De evolución prolongada o persistente en el tiempo.",
    "category": "General",
    "definition": "De evolución prolongada o persistente en el tiempo.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con crónico.",
    "example": "En una discusión clínica, crónico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "subagudo",
    "term": "Subagudo",
    "short": "De evolución intermedia entre agudo y crónico.",
    "category": "General",
    "definition": "De evolución intermedia entre agudo y crónico.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con subagudo.",
    "example": "En una discusión clínica, subagudo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "recurrente",
    "term": "Recurrente",
    "short": "Que reaparece en episodios separados en el tiempo.",
    "category": "General",
    "definition": "Que reaparece en episodios separados en el tiempo.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con recurrente.",
    "example": "En una discusión clínica, recurrente ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "intermitente",
    "term": "Intermitente",
    "short": "Que aparece y desaparece en periodos variables.",
    "category": "General",
    "definition": "Que aparece y desaparece en periodos variables.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con intermitente.",
    "example": "En una discusión clínica, intermitente ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "exacerbacion",
    "term": "Exacerbación",
    "short": "Empeoramiento agudo de una enfermedad crónica o controlada.",
    "category": "General",
    "definition": "Empeoramiento agudo de una enfermedad crónica o controlada.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con exacerbación.",
    "example": "En una discusión clínica, exacerbación ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "remision",
    "term": "Remisión",
    "short": "Disminución parcial o completa de manifestaciones de una enfermedad.",
    "category": "General",
    "definition": "Disminución parcial o completa de manifestaciones de una enfermedad.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con remisión.",
    "example": "En una discusión clínica, remisión ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "recaida",
    "term": "Recaída",
    "short": "Reaparición del cuadro tras una mejoría aparente.",
    "category": "General",
    "definition": "Reaparición del cuadro tras una mejoría aparente.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con recaída.",
    "example": "En una discusión clínica, recaída ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "recidiva",
    "term": "Recidiva",
    "short": "Retorno de una enfermedad después de un intervalo libre de enfermedad.",
    "category": "General",
    "definition": "Retorno de una enfermedad después de un intervalo libre de enfermedad.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con recidiva.",
    "example": "En una discusión clínica, recidiva ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "prodromico",
    "term": "Prodrómico",
    "short": "Síntoma inicial que precede a la fase típica del cuadro.",
    "category": "General",
    "definition": "Síntoma inicial que precede a la fase típica del cuadro.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con prodrómico.",
    "example": "En una discusión clínica, prodrómico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "paroxistico",
    "term": "Paroxístico",
    "short": "Que aparece de forma brusca e intensa en crisis.",
    "category": "General",
    "definition": "Que aparece de forma brusca e intensa en crisis.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con paroxístico.",
    "example": "En una discusión clínica, paroxístico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "refractario",
    "term": "Refractario",
    "short": "Que no responde adecuadamente al tratamiento habitual.",
    "category": "General",
    "definition": "Que no responde adecuadamente al tratamiento habitual.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con refractario.",
    "example": "En una discusión clínica, refractario ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "respuesta-parcial",
    "term": "Respuesta parcial",
    "short": "Mejoría clínica incompleta respecto al objetivo terapéutico.",
    "category": "General",
    "definition": "Mejoría clínica incompleta respecto al objetivo terapéutico.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con respuesta parcial.",
    "example": "En una discusión clínica, respuesta parcial ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "respuesta-completa",
    "term": "Respuesta completa",
    "short": "Resolución clínica o desaparición de criterios activos del cuadro.",
    "category": "General",
    "definition": "Resolución clínica o desaparición de criterios activos del cuadro.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con respuesta completa.",
    "example": "En una discusión clínica, respuesta completa ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "seguimiento",
    "term": "Seguimiento",
    "short": "Control seriado para vigilar evolución, respuesta y complicaciones.",
    "category": "General",
    "definition": "Control seriado para vigilar evolución, respuesta y complicaciones.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con seguimiento.",
    "example": "En una discusión clínica, seguimiento ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "escala-clinica",
    "term": "Escala clínica",
    "short": "Instrumento estandarizado para medir gravedad, riesgo o función.",
    "category": "General",
    "definition": "Instrumento estandarizado para medir gravedad, riesgo o función.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con escala clínica.",
    "example": "En una discusión clínica, escala clínica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "score-clinico",
    "term": "Score clínico",
    "short": "Puntaje derivado de variables clínicas para apoyar decisiones.",
    "category": "General",
    "definition": "Puntaje derivado de variables clínicas para apoyar decisiones.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con score clínico.",
    "example": "En una discusión clínica, score clínico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "punto-de-corte",
    "term": "Punto de corte",
    "short": "Valor a partir del cual una prueba cambia de interpretación.",
    "category": "General",
    "definition": "Valor a partir del cual una prueba cambia de interpretación.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con punto de corte.",
    "example": "En una discusión clínica, punto de corte ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "linea-basal",
    "term": "Línea basal",
    "short": "Valor inicial que sirve de comparación para medir cambios.",
    "category": "General",
    "definition": "Valor inicial que sirve de comparación para medir cambios.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con línea basal.",
    "example": "En una discusión clínica, línea basal ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "diagnostico-de-exclusion",
    "term": "Diagnóstico de exclusión",
    "short": "Diagnóstico al que se llega tras descartar alternativas relevantes.",
    "category": "General",
    "definition": "Diagnóstico al que se llega tras descartar alternativas relevantes.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con diagnóstico de exclusión.",
    "example": "En una discusión clínica, diagnóstico de exclusión ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "biomarcador",
    "term": "Biomarcador",
    "short": "Medida biológica utilizada para detectar proceso, riesgo o respuesta.",
    "category": "General",
    "definition": "Medida biológica utilizada para detectar proceso, riesgo o respuesta.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con biomarcador.",
    "example": "En una discusión clínica, biomarcador ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "correlacion-clinico-radiologica",
    "term": "Correlación clínico-radiológica",
    "short": "Relación entre hallazgos clínicos e imágenes diagnósticas.",
    "category": "General",
    "definition": "Relación entre hallazgos clínicos e imágenes diagnósticas.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con correlación clínico-radiológica.",
    "example": "En una discusión clínica, correlación clínico-radiológica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "correlacion-clinico-patologica",
    "term": "Correlación clínico-patológica",
    "short": "Relación entre cuadro clínico y hallazgos anatomopatológicos.",
    "category": "General",
    "definition": "Relación entre cuadro clínico y hallazgos anatomopatológicos.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con correlación clínico-patológica.",
    "example": "En una discusión clínica, correlación clínico-patológica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "patron-clinico",
    "term": "Patrón clínico",
    "short": "Combinación repetida de hallazgos que orienta un diagnóstico.",
    "category": "General",
    "definition": "Combinación repetida de hallazgos que orienta un diagnóstico.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con patrón clínico.",
    "example": "En una discusión clínica, patrón clínico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "dato-objetivo",
    "term": "Dato objetivo",
    "short": "Información medible u observable por terceros.",
    "category": "General",
    "definition": "Información medible u observable por terceros.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con dato objetivo.",
    "example": "En una discusión clínica, dato objetivo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "dato-subjetivo",
    "term": "Dato subjetivo",
    "short": "Información basada en la percepción o relato del paciente.",
    "category": "General",
    "definition": "Información basada en la percepción o relato del paciente.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con dato subjetivo.",
    "example": "En una discusión clínica, dato subjetivo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "diagnostico-presuntivo",
    "term": "Diagnóstico presuntivo",
    "short": "Diagnóstico probable establecido antes de la confirmación final.",
    "category": "General",
    "definition": "Diagnóstico probable establecido antes de la confirmación final.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con diagnóstico presuntivo.",
    "example": "En una discusión clínica, diagnóstico presuntivo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "diagnostico-definitivo",
    "term": "Diagnóstico definitivo",
    "short": "Diagnóstico confirmado con criterios suficientes o pruebas concluyentes.",
    "category": "General",
    "definition": "Diagnóstico confirmado con criterios suficientes o pruebas concluyentes.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con diagnóstico definitivo.",
    "example": "En una discusión clínica, diagnóstico definitivo ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "evolucion-clinica",
    "term": "Evolución clínica",
    "short": "Cambio del estado del paciente a lo largo del tiempo.",
    "category": "General",
    "definition": "Cambio del estado del paciente a lo largo del tiempo.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con evolución clínica.",
    "example": "En una discusión clínica, evolución clínica ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "plan-terapeutico",
    "term": "Plan terapéutico",
    "short": "Conjunto organizado de intervenciones, metas y seguimiento.",
    "category": "General",
    "definition": "Conjunto organizado de intervenciones, metas y seguimiento.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con plan terapéutico.",
    "example": "En una discusión clínica, plan terapéutico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "manejo-conservador",
    "term": "Manejo conservador",
    "short": "Tratamiento no invasivo basado en soporte y vigilancia.",
    "category": "General",
    "definition": "Tratamiento no invasivo basado en soporte y vigilancia.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con manejo conservador.",
    "example": "En una discusión clínica, manejo conservador ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "tratamiento-empirico",
    "term": "Tratamiento empírico",
    "short": "Terapia iniciada antes de conocer la causa exacta.",
    "category": "General",
    "definition": "Terapia iniciada antes de conocer la causa exacta.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con tratamiento empírico.",
    "example": "En una discusión clínica, tratamiento empírico ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "tratamiento-dirigido",
    "term": "Tratamiento dirigido",
    "short": "Terapia ajustada a etiología o hallazgos confirmados.",
    "category": "General",
    "definition": "Terapia ajustada a etiología o hallazgos confirmados.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con tratamiento dirigido.",
    "example": "En una discusión clínica, tratamiento dirigido ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "profilaxis",
    "term": "Profilaxis",
    "short": "Medida destinada a prevenir enfermedad, recaída o complicación.",
    "category": "General",
    "definition": "Medida destinada a prevenir enfermedad, recaída o complicación.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con profilaxis.",
    "example": "En una discusión clínica, profilaxis ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "prevencion-primaria",
    "term": "Prevención primaria",
    "short": "Acciones para evitar que una enfermedad aparezca.",
    "category": "General",
    "definition": "Acciones para evitar que una enfermedad aparezca.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con prevención primaria.",
    "example": "En una discusión clínica, prevención primaria ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "prevencion-secundaria",
    "term": "Prevención secundaria",
    "short": "Acciones para detectar y tratar precozmente una enfermedad.",
    "category": "General",
    "definition": "Acciones para detectar y tratar precozmente una enfermedad.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con prevención secundaria.",
    "example": "En una discusión clínica, prevención secundaria ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "prevencion-terciaria",
    "term": "Prevención terciaria",
    "short": "Acciones para reducir secuelas, discapacidad o recaídas.",
    "category": "General",
    "definition": "Acciones para reducir secuelas, discapacidad o recaídas.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con prevención terciaria.",
    "example": "En una discusión clínica, prevención terciaria ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "caso-indice",
    "term": "Caso índice",
    "short": "Primer caso detectado que motiva investigación o seguimiento.",
    "category": "General",
    "definition": "Primer caso detectado que motiva investigación o seguimiento.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con caso índice.",
    "example": "En una discusión clínica, caso índice ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "portador-asintomatico",
    "term": "Portador asintomático",
    "short": "Persona que alberga un agente o condición sin síntomas.",
    "category": "General",
    "definition": "Persona que alberga un agente o condición sin síntomas.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con portador asintomático.",
    "example": "En una discusión clínica, portador asintomático ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "brote",
    "term": "Brote",
    "short": "Aumento localizado de casos por encima de lo esperado.",
    "category": "General",
    "definition": "Aumento localizado de casos por encima de lo esperado.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con brote.",
    "example": "En una discusión clínica, brote ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "endemia",
    "term": "Endemia",
    "short": "Presencia habitual de una enfermedad en una región.",
    "category": "General",
    "definition": "Presencia habitual de una enfermedad en una región.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con endemia.",
    "example": "En una discusión clínica, endemia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "epidemia",
    "term": "Epidemia",
    "short": "Aumento inusual de casos en una población o área.",
    "category": "General",
    "definition": "Aumento inusual de casos en una población o área.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con epidemia.",
    "example": "En una discusión clínica, epidemia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "pandemia",
    "term": "Pandemia",
    "short": "Epidemia extendida a varios países o continentes.",
    "category": "General",
    "definition": "Epidemia extendida a varios países o continentes.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con pandemia.",
    "example": "En una discusión clínica, pandemia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "zoonosis",
    "term": "Zoonosis",
    "short": "Enfermedad transmisible entre animales y seres humanos.",
    "category": "General",
    "definition": "Enfermedad transmisible entre animales y seres humanos.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con zoonosis.",
    "example": "En una discusión clínica, zoonosis ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "vector",
    "term": "Vector",
    "short": "Organismo que transmite un agente infeccioso entre huéspedes.",
    "category": "General",
    "definition": "Organismo que transmite un agente infeccioso entre huéspedes.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con vector.",
    "example": "En una discusión clínica, vector ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "patogeno",
    "term": "Patógeno",
    "short": "Agente capaz de producir enfermedad.",
    "category": "General",
    "definition": "Agente capaz de producir enfermedad.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con patógeno.",
    "example": "En una discusión clínica, patógeno ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "asepsia",
    "term": "Asepsia",
    "short": "Conjunto de medidas para evitar contaminación por microorganismos.",
    "category": "General",
    "definition": "Conjunto de medidas para evitar contaminación por microorganismos.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con asepsia.",
    "example": "En una discusión clínica, asepsia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "antisepsia",
    "term": "Antisepsia",
    "short": "Aplicación de agentes para reducir microorganismos en tejidos vivos.",
    "category": "General",
    "definition": "Aplicación de agentes para reducir microorganismos en tejidos vivos.",
    "clinicalUse": "Refuerza el lenguaje clínico y mejora la comprensión de documentación, clases y simuladores relacionados con antisepsia.",
    "example": "En una discusión clínica, antisepsia ayuda a comunicar mejor el razonamiento y el plan.",
    "related": [
      "Lenguaje clínico",
      "Razonamiento clínico",
      "Historia clínica"
    ]
  },
  {
    "id": "bradi",
    "term": "Bradi-",
    "short": "Prefijo que indica lentitud o disminución de velocidad.",
    "category": "General",
    "definition": "Prefijo que indica lentitud o disminución de velocidad.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Bradi- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "taqui",
    "term": "Taqui-",
    "short": "Prefijo que indica rapidez o aumento de velocidad.",
    "category": "General",
    "definition": "Prefijo que indica rapidez o aumento de velocidad.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Taqui- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "hiper",
    "term": "Hiper-",
    "short": "Prefijo que indica exceso o aumento por encima de lo normal.",
    "category": "General",
    "definition": "Prefijo que indica exceso o aumento por encima de lo normal.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Hiper- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "hipo",
    "term": "Hipo-",
    "short": "Prefijo que indica disminución o cantidad inferior a lo normal.",
    "category": "General",
    "definition": "Prefijo que indica disminución o cantidad inferior a lo normal.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Hipo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "dis",
    "term": "Dis-",
    "short": "Prefijo que indica dificultad, alteración o anormalidad.",
    "category": "General",
    "definition": "Prefijo que indica dificultad, alteración o anormalidad.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Dis- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "eu",
    "term": "Eu-",
    "short": "Prefijo que indica normalidad o buen estado.",
    "category": "General",
    "definition": "Prefijo que indica normalidad o buen estado.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Eu- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "neo",
    "term": "Neo-",
    "short": "Prefijo que indica nuevo o reciente.",
    "category": "General",
    "definition": "Prefijo que indica nuevo o reciente.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Neo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "orto",
    "term": "Orto-",
    "short": "Prefijo que indica recto, correcto o posición normal.",
    "category": "General",
    "definition": "Prefijo que indica recto, correcto o posición normal.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Orto- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "hemi",
    "term": "Hemi-",
    "short": "Prefijo que indica mitad o un lado del cuerpo.",
    "category": "General",
    "definition": "Prefijo que indica mitad o un lado del cuerpo.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Hemi- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "pan",
    "term": "Pan-",
    "short": "Prefijo que indica totalidad o afectación generalizada.",
    "category": "General",
    "definition": "Prefijo que indica totalidad o afectación generalizada.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Pan- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "poli",
    "term": "Poli-",
    "short": "Prefijo que indica multiplicidad o cantidad elevada.",
    "category": "General",
    "definition": "Prefijo que indica multiplicidad o cantidad elevada.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Poli- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "oligo",
    "term": "Oligo-",
    "short": "Prefijo que indica escasez o cantidad reducida.",
    "category": "General",
    "definition": "Prefijo que indica escasez o cantidad reducida.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Oligo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "mono",
    "term": "Mono-",
    "short": "Prefijo que indica uno solo o único.",
    "category": "General",
    "definition": "Prefijo que indica uno solo o único.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Mono- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "bi",
    "term": "Bi-",
    "short": "Prefijo que indica dos elementos o dos lados.",
    "category": "General",
    "definition": "Prefijo que indica dos elementos o dos lados.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Bi- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "tri",
    "term": "Tri-",
    "short": "Prefijo que indica tres elementos o tres partes.",
    "category": "General",
    "definition": "Prefijo que indica tres elementos o tres partes.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Tri- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "tetra",
    "term": "Tetra-",
    "short": "Prefijo que indica cuatro elementos o cuatro partes.",
    "category": "General",
    "definition": "Prefijo que indica cuatro elementos o cuatro partes.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Tetra- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "endo",
    "term": "Endo-",
    "short": "Prefijo que indica dentro o interior.",
    "category": "General",
    "definition": "Prefijo que indica dentro o interior.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Endo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "ecto",
    "term": "Ecto-",
    "short": "Prefijo que indica fuera o superficie externa.",
    "category": "General",
    "definition": "Prefijo que indica fuera o superficie externa.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Ecto- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "peri",
    "term": "Peri-",
    "short": "Prefijo que indica alrededor de una estructura.",
    "category": "General",
    "definition": "Prefijo que indica alrededor de una estructura.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Peri- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "meta",
    "term": "Meta-",
    "short": "Prefijo que indica cambio, transformación o más allá.",
    "category": "General",
    "definition": "Prefijo que indica cambio, transformación o más allá.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Meta- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "intra",
    "term": "Intra-",
    "short": "Prefijo que indica dentro de un órgano o compartimento.",
    "category": "General",
    "definition": "Prefijo que indica dentro de un órgano o compartimento.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Intra- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "inter",
    "term": "Inter-",
    "short": "Prefijo que indica entre dos estructuras o espacios.",
    "category": "General",
    "definition": "Prefijo que indica entre dos estructuras o espacios.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Inter- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "extra",
    "term": "Extra-",
    "short": "Prefijo que indica fuera de una estructura.",
    "category": "General",
    "definition": "Prefijo que indica fuera de una estructura.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Extra- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "sub",
    "term": "Sub-",
    "short": "Prefijo que indica por debajo o nivel inferior.",
    "category": "General",
    "definition": "Prefijo que indica por debajo o nivel inferior.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Sub- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "supra",
    "term": "Supra-",
    "short": "Prefijo que indica por encima o nivel superior.",
    "category": "General",
    "definition": "Prefijo que indica por encima o nivel superior.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Supra- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "trans",
    "term": "Trans-",
    "short": "Prefijo que indica a través o de un lado a otro.",
    "category": "General",
    "definition": "Prefijo que indica a través o de un lado a otro.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Trans- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "retro",
    "term": "Retro-",
    "short": "Prefijo que indica hacia atrás o detrás de una estructura.",
    "category": "General",
    "definition": "Prefijo que indica hacia atrás o detrás de una estructura.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Retro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "ante",
    "term": "Ante-",
    "short": "Prefijo que indica delante o antes de otra estructura.",
    "category": "General",
    "definition": "Prefijo que indica delante o antes de otra estructura.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Ante- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "post",
    "term": "Post-",
    "short": "Prefijo que indica después o detrás en el tiempo o posición.",
    "category": "General",
    "definition": "Prefijo que indica después o detrás en el tiempo o posición.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Post- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "micro",
    "term": "Micro-",
    "short": "Prefijo que indica tamaño pequeño.",
    "category": "General",
    "definition": "Prefijo que indica tamaño pequeño.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Micro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "macro",
    "term": "Macro-",
    "short": "Prefijo que indica tamaño grande.",
    "category": "General",
    "definition": "Prefijo que indica tamaño grande.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Macro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "mega",
    "term": "Mega-",
    "short": "Prefijo que indica aumento importante de tamaño.",
    "category": "General",
    "definition": "Prefijo que indica aumento importante de tamaño.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Mega- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "leuco",
    "term": "Leuco-",
    "short": "Raíz que alude al color blanco o a leucocitos.",
    "category": "General",
    "definition": "Raíz que alude al color blanco o a leucocitos.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Leuco- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "eritro",
    "term": "Eritro-",
    "short": "Raíz que alude al color rojo o a eritrocitos.",
    "category": "General",
    "definition": "Raíz que alude al color rojo o a eritrocitos.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Eritro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "tromb",
    "term": "Tromb-",
    "short": "Raíz relacionada con coágulos o plaquetas.",
    "category": "General",
    "definition": "Raíz relacionada con coágulos o plaquetas.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Tromb- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "cardio",
    "term": "Cardio-",
    "short": "Raíz relacionada con el corazón.",
    "category": "General",
    "definition": "Raíz relacionada con el corazón.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Cardio- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "neuro",
    "term": "Neuro-",
    "short": "Raíz relacionada con nervios o sistema nervioso.",
    "category": "General",
    "definition": "Raíz relacionada con nervios o sistema nervioso.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Neuro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "nefro",
    "term": "Nefro-",
    "short": "Raíz relacionada con el riñón.",
    "category": "General",
    "definition": "Raíz relacionada con el riñón.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Nefro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "hepato",
    "term": "Hepato-",
    "short": "Raíz relacionada con el hígado.",
    "category": "General",
    "definition": "Raíz relacionada con el hígado.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Hepato- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "gastro",
    "term": "Gastro-",
    "short": "Raíz relacionada con el estómago.",
    "category": "General",
    "definition": "Raíz relacionada con el estómago.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Gastro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "entero",
    "term": "Entero-",
    "short": "Raíz relacionada con el intestino.",
    "category": "General",
    "definition": "Raíz relacionada con el intestino.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Entero- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "dermato",
    "term": "Dermato-",
    "short": "Raíz relacionada con la piel.",
    "category": "General",
    "definition": "Raíz relacionada con la piel.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Dermato- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "osteo",
    "term": "Osteo-",
    "short": "Raíz relacionada con el hueso.",
    "category": "General",
    "definition": "Raíz relacionada con el hueso.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Osteo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "artro",
    "term": "Artro-",
    "short": "Raíz relacionada con las articulaciones.",
    "category": "General",
    "definition": "Raíz relacionada con las articulaciones.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Artro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "mio",
    "term": "Mio-",
    "short": "Raíz relacionada con el músculo.",
    "category": "General",
    "definition": "Raíz relacionada con el músculo.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Mio- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "angio",
    "term": "Angio-",
    "short": "Raíz relacionada con vasos sanguíneos o conductos.",
    "category": "General",
    "definition": "Raíz relacionada con vasos sanguíneos o conductos.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Angio- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "hemo",
    "term": "Hemo-",
    "short": "Raíz relacionada con sangre.",
    "category": "General",
    "definition": "Raíz relacionada con sangre.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Hemo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "pleuro",
    "term": "Pleuro-",
    "short": "Raíz relacionada con la pleura.",
    "category": "General",
    "definition": "Raíz relacionada con la pleura.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Pleuro- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "pneumo",
    "term": "Pneumo-",
    "short": "Raíz relacionada con pulmón o aire.",
    "category": "General",
    "definition": "Raíz relacionada con pulmón o aire.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Pneumo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "oto",
    "term": "Oto-",
    "short": "Raíz relacionada con el oído.",
    "category": "General",
    "definition": "Raíz relacionada con el oído.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Oto- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "oftalmo",
    "term": "Oftalmo-",
    "short": "Raíz relacionada con el ojo.",
    "category": "General",
    "definition": "Raíz relacionada con el ojo.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Oftalmo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "rino",
    "term": "Rino-",
    "short": "Raíz relacionada con la nariz.",
    "category": "General",
    "definition": "Raíz relacionada con la nariz.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Rino- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "laringo",
    "term": "Laringo-",
    "short": "Raíz relacionada con la laringe.",
    "category": "General",
    "definition": "Raíz relacionada con la laringe.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Laringo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "faringo",
    "term": "Faringo-",
    "short": "Raíz relacionada con la faringe.",
    "category": "General",
    "definition": "Raíz relacionada con la faringe.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Faringo- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "gineco",
    "term": "Gineco-",
    "short": "Raíz relacionada con la mujer y el aparato reproductor femenino.",
    "category": "General",
    "definition": "Raíz relacionada con la mujer y el aparato reproductor femenino.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Gineco- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "obstetr",
    "term": "Obstetr-",
    "short": "Raíz relacionada con embarazo, parto y puerperio.",
    "category": "General",
    "definition": "Raíz relacionada con embarazo, parto y puerperio.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Obstetr- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "pediatr",
    "term": "Pediatr-",
    "short": "Raíz relacionada con la atención del niño.",
    "category": "General",
    "definition": "Raíz relacionada con la atención del niño.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Pediatr- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "geronto",
    "term": "Geronto-",
    "short": "Raíz relacionada con envejecimiento o adulto mayor.",
    "category": "General",
    "definition": "Raíz relacionada con envejecimiento o adulto mayor.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Geronto- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "onco",
    "term": "Onco-",
    "short": "Raíz relacionada con tumores o cáncer.",
    "category": "General",
    "definition": "Raíz relacionada con tumores o cáncer.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer Onco- permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "itis",
    "term": "-itis",
    "short": "Sufijo que indica inflamación.",
    "category": "General",
    "definition": "Sufijo que indica inflamación.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -itis permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "osis",
    "term": "-osis",
    "short": "Sufijo que indica proceso patológico o condición anormal.",
    "category": "General",
    "definition": "Sufijo que indica proceso patológico o condición anormal.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -osis permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "emia",
    "term": "-emia",
    "short": "Sufijo que indica condición de la sangre.",
    "category": "General",
    "definition": "Sufijo que indica condición de la sangre.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -emia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "uria",
    "term": "-uria",
    "short": "Sufijo que indica condición relacionada con la orina.",
    "category": "General",
    "definition": "Sufijo que indica condición relacionada con la orina.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -uria permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "algia",
    "term": "-algia",
    "short": "Sufijo que indica dolor.",
    "category": "General",
    "definition": "Sufijo que indica dolor.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -algia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "megalia",
    "term": "-megalia",
    "short": "Sufijo que indica aumento de tamaño.",
    "category": "General",
    "definition": "Sufijo que indica aumento de tamaño.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -megalia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "plejia",
    "term": "-plejia",
    "short": "Sufijo que indica parálisis completa.",
    "category": "General",
    "definition": "Sufijo que indica parálisis completa.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -plejia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "paresia",
    "term": "-paresia",
    "short": "Sufijo que indica debilidad o parálisis parcial.",
    "category": "General",
    "definition": "Sufijo que indica debilidad o parálisis parcial.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -paresia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "pnea",
    "term": "-pnea",
    "short": "Sufijo que indica respiración o patrón respiratorio.",
    "category": "General",
    "definition": "Sufijo que indica respiración o patrón respiratorio.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -pnea permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "cardia",
    "term": "-cardia",
    "short": "Sufijo que indica frecuencia o ritmo cardíaco.",
    "category": "General",
    "definition": "Sufijo que indica frecuencia o ritmo cardíaco.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -cardia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "penia",
    "term": "-penia",
    "short": "Sufijo que indica disminución o carencia.",
    "category": "General",
    "definition": "Sufijo que indica disminución o carencia.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -penia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "filia",
    "term": "-filia",
    "short": "Sufijo que indica afinidad o aumento por un tipo celular.",
    "category": "General",
    "definition": "Sufijo que indica afinidad o aumento por un tipo celular.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -filia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "fobia",
    "term": "-fobia",
    "short": "Sufijo que indica miedo o aversión.",
    "category": "General",
    "definition": "Sufijo que indica miedo o aversión.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -fobia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "lisis",
    "term": "-lisis",
    "short": "Sufijo que indica ruptura, disolución o destrucción.",
    "category": "General",
    "definition": "Sufijo que indica ruptura, disolución o destrucción.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -lisis permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "plasia",
    "term": "-plasia",
    "short": "Sufijo que indica formación o desarrollo tisular.",
    "category": "General",
    "definition": "Sufijo que indica formación o desarrollo tisular.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -plasia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "trofia",
    "term": "-trofia",
    "short": "Sufijo que indica tamaño o nutrición de un tejido.",
    "category": "General",
    "definition": "Sufijo que indica tamaño o nutrición de un tejido.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -trofia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "estesia",
    "term": "-estesia",
    "short": "Sufijo que indica sensibilidad o percepción.",
    "category": "General",
    "definition": "Sufijo que indica sensibilidad o percepción.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -estesia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "scopia",
    "term": "-scopia",
    "short": "Sufijo que indica visualización mediante un instrumento.",
    "category": "General",
    "definition": "Sufijo que indica visualización mediante un instrumento.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -scopia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "grafia",
    "term": "-grafía",
    "short": "Sufijo que indica registro o representación gráfica.",
    "category": "General",
    "definition": "Sufijo que indica registro o representación gráfica.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -grafía permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "tomia",
    "term": "-tomía",
    "short": "Sufijo que indica incisión o corte quirúrgico.",
    "category": "General",
    "definition": "Sufijo que indica incisión o corte quirúrgico.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -tomía permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "ectomia",
    "term": "-ectomía",
    "short": "Sufijo que indica extirpación quirúrgica.",
    "category": "General",
    "definition": "Sufijo que indica extirpación quirúrgica.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -ectomía permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "stomia",
    "term": "-stomía",
    "short": "Sufijo que indica creación de una abertura quirúrgica.",
    "category": "General",
    "definition": "Sufijo que indica creación de una abertura quirúrgica.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -stomía permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "rragia",
    "term": "-rragia",
    "short": "Sufijo que indica sangrado abundante.",
    "category": "General",
    "definition": "Sufijo que indica sangrado abundante.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -rragia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "rrea",
    "term": "-rrea",
    "short": "Sufijo que indica flujo o descarga.",
    "category": "General",
    "definition": "Sufijo que indica flujo o descarga.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -rrea permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "fagia",
    "term": "-fagia",
    "short": "Sufijo que indica acto de comer o deglutir.",
    "category": "General",
    "definition": "Sufijo que indica acto de comer o deglutir.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -fagia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "dipsia",
    "term": "-dipsia",
    "short": "Sufijo que indica sed.",
    "category": "General",
    "definition": "Sufijo que indica sed.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -dipsia permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "ptisis",
    "term": "-ptisis",
    "short": "Sufijo que indica expulsión o expectoración.",
    "category": "General",
    "definition": "Sufijo que indica expulsión o expectoración.",
    "clinicalUse": "Ayuda a descifrar palabras médicas compuestas y a entender vocabulario nuevo con más rapidez.",
    "example": "Reconocer -ptisis permite inferir mejor el significado de palabras clínicas relacionadas.",
    "related": [
      "Prefijos y sufijos",
      "Vocabulario médico",
      "Interpretación de términos"
    ]
  },
  {
    "id": "taquicardia",
    "term": "Taquicardia",
    "short": "Frecuencia cardiaca elevada para la edad y el contexto.",
    "category": "Valoración",
    "definition": "Frecuencia cardiaca elevada para la edad y el contexto.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con taquicardia.",
    "example": "En la exploración, taquicardia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "bradicardia",
    "term": "Bradicardia",
    "short": "Frecuencia cardiaca menor a la esperada para la edad y situación clínica.",
    "category": "Valoración",
    "definition": "Frecuencia cardiaca menor a la esperada para la edad y situación clínica.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con bradicardia.",
    "example": "En la exploración, bradicardia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "taquipnea",
    "term": "Taquipnea",
    "short": "Frecuencia respiratoria aumentada.",
    "category": "Valoración",
    "definition": "Frecuencia respiratoria aumentada.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con taquipnea.",
    "example": "En la exploración, taquipnea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "bradipnea",
    "term": "Bradipnea",
    "short": "Frecuencia respiratoria disminuida.",
    "category": "Valoración",
    "definition": "Frecuencia respiratoria disminuida.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con bradipnea.",
    "example": "En la exploración, bradipnea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hipoxemia",
    "term": "Hipoxemia",
    "short": "Disminución del oxígeno en sangre arterial.",
    "category": "Valoración",
    "definition": "Disminución del oxígeno en sangre arterial.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hipoxemia.",
    "example": "En la exploración, hipoxemia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hipoxia",
    "term": "Hipoxia",
    "short": "Déficit de oxígeno a nivel tisular.",
    "category": "Valoración",
    "definition": "Déficit de oxígeno a nivel tisular.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hipoxia.",
    "example": "En la exploración, hipoxia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "saturacion-de-oxigeno",
    "term": "Saturación de oxígeno",
    "short": "Porcentaje de hemoglobina unida a oxígeno medido habitualmente por pulsioximetría.",
    "category": "Valoración",
    "definition": "Porcentaje de hemoglobina unida a oxígeno medido habitualmente por pulsioximetría.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con saturación de oxígeno.",
    "example": "En la exploración, saturación de oxígeno debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "cianosis",
    "term": "Cianosis",
    "short": "Coloración azulada por aumento de hemoglobina reducida.",
    "category": "Valoración",
    "definition": "Coloración azulada por aumento de hemoglobina reducida.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con cianosis.",
    "example": "En la exploración, cianosis debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "palidez",
    "term": "Palidez",
    "short": "Disminución del color normal de piel o mucosas.",
    "category": "Valoración",
    "definition": "Disminución del color normal de piel o mucosas.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con palidez.",
    "example": "En la exploración, palidez debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "diaforesis",
    "term": "Diaforesis",
    "short": "Sudoración profusa, a menudo asociada a dolor, fiebre o estrés fisiológico.",
    "category": "Valoración",
    "definition": "Sudoración profusa, a menudo asociada a dolor, fiebre o estrés fisiológico.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con diaforesis.",
    "example": "En la exploración, diaforesis debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "edema",
    "term": "Edema",
    "short": "Acumulación de líquido en el espacio intersticial.",
    "category": "Valoración",
    "definition": "Acumulación de líquido en el espacio intersticial.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con edema.",
    "example": "En la exploración, edema debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "anasarca",
    "term": "Anasarca",
    "short": "Edema generalizado de gran magnitud.",
    "category": "Valoración",
    "definition": "Edema generalizado de gran magnitud.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con anasarca.",
    "example": "En la exploración, anasarca debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "fovea",
    "term": "Fóvea",
    "short": "Depresión persistente tras presionar una zona edematosa.",
    "category": "Valoración",
    "definition": "Depresión persistente tras presionar una zona edematosa.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con fóvea.",
    "example": "En la exploración, fóvea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "perfusion-capilar",
    "term": "Perfusión capilar",
    "short": "Tiempo necesario para recuperación del color tras comprimir la piel.",
    "category": "Valoración",
    "definition": "Tiempo necesario para recuperación del color tras comprimir la piel.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con perfusión capilar.",
    "example": "En la exploración, perfusión capilar debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "oliguria",
    "term": "Oliguria",
    "short": "Disminución de la producción urinaria.",
    "category": "Valoración",
    "definition": "Disminución de la producción urinaria.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con oliguria.",
    "example": "En la exploración, oliguria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "anuria",
    "term": "Anuria",
    "short": "Ausencia o producción mínima de orina.",
    "category": "Valoración",
    "definition": "Ausencia o producción mínima de orina.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con anuria.",
    "example": "En la exploración, anuria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "poliuria",
    "term": "Poliuria",
    "short": "Aumento del volumen urinario.",
    "category": "Valoración",
    "definition": "Aumento del volumen urinario.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con poliuria.",
    "example": "En la exploración, poliuria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "nicturia",
    "term": "Nicturia",
    "short": "Necesidad de orinar varias veces durante la noche.",
    "category": "Valoración",
    "definition": "Necesidad de orinar varias veces durante la noche.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con nicturia.",
    "example": "En la exploración, nicturia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "disuria",
    "term": "Disuria",
    "short": "Dolor o ardor al orinar.",
    "category": "Valoración",
    "definition": "Dolor o ardor al orinar.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con disuria.",
    "example": "En la exploración, disuria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hematuria",
    "term": "Hematuria",
    "short": "Presencia de sangre en la orina.",
    "category": "Valoración",
    "definition": "Presencia de sangre en la orina.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hematuria.",
    "example": "En la exploración, hematuria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "piuria",
    "term": "Piuria",
    "short": "Presencia de leucocitos o pus en la orina.",
    "category": "Valoración",
    "definition": "Presencia de leucocitos o pus en la orina.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con piuria.",
    "example": "En la exploración, piuria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "proteinuria",
    "term": "Proteinuria",
    "short": "Presencia aumentada de proteínas en la orina.",
    "category": "Valoración",
    "definition": "Presencia aumentada de proteínas en la orina.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con proteinuria.",
    "example": "En la exploración, proteinuria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "melena",
    "term": "Melena",
    "short": "Evacuación negra y alquitranada por sangrado digestivo alto.",
    "category": "Valoración",
    "definition": "Evacuación negra y alquitranada por sangrado digestivo alto.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con melena.",
    "example": "En la exploración, melena debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hematoquecia",
    "term": "Hematoquecia",
    "short": "Emisión de sangre roja por recto.",
    "category": "Valoración",
    "definition": "Emisión de sangre roja por recto.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hematoquecia.",
    "example": "En la exploración, hematoquecia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hematemesis",
    "term": "Hematemesis",
    "short": "Vómito con sangre.",
    "category": "Valoración",
    "definition": "Vómito con sangre.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hematemesis.",
    "example": "En la exploración, hematemesis debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "ictericia",
    "term": "Ictericia",
    "short": "Coloración amarilla de piel y mucosas por hiperbilirrubinemia.",
    "category": "Valoración",
    "definition": "Coloración amarilla de piel y mucosas por hiperbilirrubinemia.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con ictericia.",
    "example": "En la exploración, ictericia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "coluria",
    "term": "Coluria",
    "short": "Orina oscura por presencia de pigmentos biliares.",
    "category": "Valoración",
    "definition": "Orina oscura por presencia de pigmentos biliares.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con coluria.",
    "example": "En la exploración, coluria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "acolia",
    "term": "Acolia",
    "short": "Heces pálidas por ausencia de pigmentos biliares.",
    "category": "Valoración",
    "definition": "Heces pálidas por ausencia de pigmentos biliares.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con acolia.",
    "example": "En la exploración, acolia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "cefalea",
    "term": "Cefalea",
    "short": "Dolor localizado en la cabeza.",
    "category": "Valoración",
    "definition": "Dolor localizado en la cabeza.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con cefalea.",
    "example": "En la exploración, cefalea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "mareo",
    "term": "Mareo",
    "short": "Sensación inespecífica de inestabilidad o aturdimiento.",
    "category": "Valoración",
    "definition": "Sensación inespecífica de inestabilidad o aturdimiento.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con mareo.",
    "example": "En la exploración, mareo debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "sincope",
    "term": "Síncope",
    "short": "Pérdida transitoria de conciencia por hipoperfusión cerebral global.",
    "category": "Valoración",
    "definition": "Pérdida transitoria de conciencia por hipoperfusión cerebral global.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con síncope.",
    "example": "En la exploración, síncope debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "presincope",
    "term": "Presíncope",
    "short": "Sensación inminente de desmayo sin pérdida completa de conciencia.",
    "category": "Valoración",
    "definition": "Sensación inminente de desmayo sin pérdida completa de conciencia.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con presíncope.",
    "example": "En la exploración, presíncope debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "parestesia",
    "term": "Parestesia",
    "short": "Sensación anormal como hormigueo o adormecimiento.",
    "category": "Valoración",
    "definition": "Sensación anormal como hormigueo o adormecimiento.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con parestesia.",
    "example": "En la exploración, parestesia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hipoestesia",
    "term": "Hipoestesia",
    "short": "Disminución de la sensibilidad.",
    "category": "Valoración",
    "definition": "Disminución de la sensibilidad.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hipoestesia.",
    "example": "En la exploración, hipoestesia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "anestesia",
    "term": "Anestesia",
    "short": "Pérdida completa de la sensibilidad.",
    "category": "Valoración",
    "definition": "Pérdida completa de la sensibilidad.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con anestesia.",
    "example": "En la exploración, anestesia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hiperestesia",
    "term": "Hiperestesia",
    "short": "Aumento anormal de la sensibilidad.",
    "category": "Valoración",
    "definition": "Aumento anormal de la sensibilidad.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hiperestesia.",
    "example": "En la exploración, hiperestesia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "paresia-2",
    "term": "Paresia",
    "short": "Disminución parcial de la fuerza muscular.",
    "category": "Valoración",
    "definition": "Disminución parcial de la fuerza muscular.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con paresia.",
    "example": "En la exploración, paresia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "plejia-2",
    "term": "Plejia",
    "short": "Pérdida completa de la fuerza muscular.",
    "category": "Valoración",
    "definition": "Pérdida completa de la fuerza muscular.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con plejia.",
    "example": "En la exploración, plejia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "ataxia",
    "term": "Ataxia",
    "short": "Alteración de la coordinación motora.",
    "category": "Valoración",
    "definition": "Alteración de la coordinación motora.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con ataxia.",
    "example": "En la exploración, ataxia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "disartria",
    "term": "Disartria",
    "short": "Dificultad para articular palabras por alteración motora del habla.",
    "category": "Valoración",
    "definition": "Dificultad para articular palabras por alteración motora del habla.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con disartria.",
    "example": "En la exploración, disartria debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "afasia",
    "term": "Afasia",
    "short": "Alteración del lenguaje por lesión cerebral.",
    "category": "Valoración",
    "definition": "Alteración del lenguaje por lesión cerebral.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con afasia.",
    "example": "En la exploración, afasia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "rigidez-nucal",
    "term": "Rigidez nucal",
    "short": "Resistencia dolorosa a la flexión del cuello.",
    "category": "Valoración",
    "definition": "Resistencia dolorosa a la flexión del cuello.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con rigidez nucal.",
    "example": "En la exploración, rigidez nucal debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "fotofobia",
    "term": "Fotofobia",
    "short": "Molestia o intolerancia a la luz.",
    "category": "Valoración",
    "definition": "Molestia o intolerancia a la luz.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con fotofobia.",
    "example": "En la exploración, fotofobia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "fonofobia",
    "term": "Fonofobia",
    "short": "Molestia o intolerancia al sonido.",
    "category": "Valoración",
    "definition": "Molestia o intolerancia al sonido.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con fonofobia.",
    "example": "En la exploración, fonofobia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "dolor-toracico",
    "term": "Dolor torácico",
    "short": "Sensación dolorosa localizada en el tórax.",
    "category": "Valoración",
    "definition": "Sensación dolorosa localizada en el tórax.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con dolor torácico.",
    "example": "En la exploración, dolor torácico debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "dolor-pleuritico",
    "term": "Dolor pleurítico",
    "short": "Dolor torácico que aumenta con la respiración o la tos.",
    "category": "Valoración",
    "definition": "Dolor torácico que aumenta con la respiración o la tos.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con dolor pleurítico.",
    "example": "En la exploración, dolor pleurítico debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "dolor-opresivo",
    "term": "Dolor opresivo",
    "short": "Dolor descrito como presión, peso o constricción.",
    "category": "Valoración",
    "definition": "Dolor descrito como presión, peso o constricción.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con dolor opresivo.",
    "example": "En la exploración, dolor opresivo debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "epigastralgia",
    "term": "Epigastralgia",
    "short": "Dolor localizado en epigastrio.",
    "category": "Valoración",
    "definition": "Dolor localizado en epigastrio.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con epigastralgia.",
    "example": "En la exploración, epigastralgia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "pirosis",
    "term": "Pirosis",
    "short": "Sensación de ardor retroesternal o epigástrico.",
    "category": "Valoración",
    "definition": "Sensación de ardor retroesternal o epigástrico.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con pirosis.",
    "example": "En la exploración, pirosis debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "nausea",
    "term": "Náusea",
    "short": "Sensación de deseo de vomitar.",
    "category": "Valoración",
    "definition": "Sensación de deseo de vomitar.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con náusea.",
    "example": "En la exploración, náusea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "vomito",
    "term": "Vómito",
    "short": "Expulsión del contenido gástrico por la boca.",
    "category": "Valoración",
    "definition": "Expulsión del contenido gástrico por la boca.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con vómito.",
    "example": "En la exploración, vómito debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "diarrea",
    "term": "Diarrea",
    "short": "Aumento de la frecuencia o disminución de consistencia de las heces.",
    "category": "Valoración",
    "definition": "Aumento de la frecuencia o disminución de consistencia de las heces.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con diarrea.",
    "example": "En la exploración, diarrea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "estrenimiento",
    "term": "Estreñimiento",
    "short": "Dificultad o disminución en la evacuación intestinal.",
    "category": "Valoración",
    "definition": "Dificultad o disminución en la evacuación intestinal.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con estreñimiento.",
    "example": "En la exploración, estreñimiento debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "tenesmo",
    "term": "Tenesmo",
    "short": "Sensación persistente de evacuación incompleta.",
    "category": "Valoración",
    "definition": "Sensación persistente de evacuación incompleta.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con tenesmo.",
    "example": "En la exploración, tenesmo debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "ascitis",
    "term": "Ascitis",
    "short": "Acumulación de líquido en cavidad peritoneal.",
    "category": "Valoración",
    "definition": "Acumulación de líquido en cavidad peritoneal.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con ascitis.",
    "example": "En la exploración, ascitis debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "deshidratacion",
    "term": "Deshidratación",
    "short": "Déficit de agua corporal total.",
    "category": "Valoración",
    "definition": "Déficit de agua corporal total.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con deshidratación.",
    "example": "En la exploración, deshidratación debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "mucosas-secas",
    "term": "Mucosas secas",
    "short": "Hallazgo de escasa humedad en mucosas, común en deshidratación.",
    "category": "Valoración",
    "definition": "Hallazgo de escasa humedad en mucosas, común en deshidratación.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con mucosas secas.",
    "example": "En la exploración, mucosas secas debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "tiraje",
    "term": "Tiraje",
    "short": "Retracción de músculos intercostales o supraclaviculares al respirar.",
    "category": "Valoración",
    "definition": "Retracción de músculos intercostales o supraclaviculares al respirar.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con tiraje.",
    "example": "En la exploración, tiraje debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "aleteo-nasal",
    "term": "Aleteo nasal",
    "short": "Apertura exagerada de narinas durante la respiración.",
    "category": "Valoración",
    "definition": "Apertura exagerada de narinas durante la respiración.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con aleteo nasal.",
    "example": "En la exploración, aleteo nasal debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "uso-de-musculos-accesorios",
    "term": "Uso de músculos accesorios",
    "short": "Participación de músculos no habituales para respirar.",
    "category": "Valoración",
    "definition": "Participación de músculos no habituales para respirar.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con uso de músculos accesorios.",
    "example": "En la exploración, uso de músculos accesorios debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "glasgow",
    "term": "Glasgow",
    "short": "Escala para evaluar apertura ocular, respuesta verbal y respuesta motora.",
    "category": "Valoración",
    "definition": "Escala para evaluar apertura ocular, respuesta verbal y respuesta motora.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con glasgow.",
    "example": "En la exploración, glasgow debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "somnolencia",
    "term": "Somnolencia",
    "short": "Tendencia aumentada al sueño con respuesta a estímulos.",
    "category": "Valoración",
    "definition": "Tendencia aumentada al sueño con respuesta a estímulos.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con somnolencia.",
    "example": "En la exploración, somnolencia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "letargia",
    "term": "Letargia",
    "short": "Disminución del nivel de alerta con respuesta lenta.",
    "category": "Valoración",
    "definition": "Disminución del nivel de alerta con respuesta lenta.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con letargia.",
    "example": "En la exploración, letargia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "estupor",
    "term": "Estupor",
    "short": "Estado de profunda disminución de conciencia con respuesta solo a estímulos vigorosos.",
    "category": "Valoración",
    "definition": "Estado de profunda disminución de conciencia con respuesta solo a estímulos vigorosos.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con estupor.",
    "example": "En la exploración, estupor debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "coma",
    "term": "Coma",
    "short": "Ausencia de respuesta consciente a estímulos.",
    "category": "Valoración",
    "definition": "Ausencia de respuesta consciente a estímulos.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con coma.",
    "example": "En la exploración, coma debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "agitacion-psicomotriz",
    "term": "Agitación psicomotriz",
    "short": "Aumento desorganizado de actividad motora y tensión.",
    "category": "Valoración",
    "definition": "Aumento desorganizado de actividad motora y tensión.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con agitación psicomotriz.",
    "example": "En la exploración, agitación psicomotriz debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "desorientacion",
    "term": "Desorientación",
    "short": "Pérdida de referencia en tiempo, lugar o persona.",
    "category": "Valoración",
    "definition": "Pérdida de referencia en tiempo, lugar o persona.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con desorientación.",
    "example": "En la exploración, desorientación debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "confusion",
    "term": "Confusión",
    "short": "Alteración de la atención y claridad del pensamiento.",
    "category": "Valoración",
    "definition": "Alteración de la atención y claridad del pensamiento.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con confusión.",
    "example": "En la exploración, confusión debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "ortopnea",
    "term": "Ortopnea",
    "short": "Disnea que aparece o empeora en decúbito y mejora al incorporarse.",
    "category": "Valoración",
    "definition": "Disnea que aparece o empeora en decúbito y mejora al incorporarse.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con ortopnea.",
    "example": "En la exploración, ortopnea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "trepopnea",
    "term": "Trepopnea",
    "short": "Disnea al acostarse de un lado específico.",
    "category": "Valoración",
    "definition": "Disnea al acostarse de un lado específico.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con trepopnea.",
    "example": "En la exploración, trepopnea debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "disnea-paroxistica-nocturna",
    "term": "Disnea paroxística nocturna",
    "short": "Episodios súbitos de falta de aire que despiertan al paciente por la noche.",
    "category": "Valoración",
    "definition": "Episodios súbitos de falta de aire que despiertan al paciente por la noche.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con disnea paroxística nocturna.",
    "example": "En la exploración, disnea paroxística nocturna debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "hemoptisis",
    "term": "Hemoptisis",
    "short": "Expulsión de sangre proveniente del árbol respiratorio.",
    "category": "Valoración",
    "definition": "Expulsión de sangre proveniente del árbol respiratorio.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con hemoptisis.",
    "example": "En la exploración, hemoptisis debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "expectoracion",
    "term": "Expectoración",
    "short": "Eliminación de secreciones bronquiales con la tos.",
    "category": "Valoración",
    "definition": "Eliminación de secreciones bronquiales con la tos.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con expectoración.",
    "example": "En la exploración, expectoración debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "sibilancias",
    "term": "Sibilancias",
    "short": "Ruidos respiratorios agudos por obstrucción de vías aéreas.",
    "category": "Valoración",
    "definition": "Ruidos respiratorios agudos por obstrucción de vías aéreas.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con sibilancias.",
    "example": "En la exploración, sibilancias debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "estridor",
    "term": "Estridor",
    "short": "Ruido inspiratorio agudo por obstrucción de vía aérea alta.",
    "category": "Valoración",
    "definition": "Ruido inspiratorio agudo por obstrucción de vía aérea alta.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con estridor.",
    "example": "En la exploración, estridor debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "crepitos",
    "term": "Crépitos",
    "short": "Ruidos respiratorios discontinuos asociados a líquido o apertura alveolar.",
    "category": "Valoración",
    "definition": "Ruidos respiratorios discontinuos asociados a líquido o apertura alveolar.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con crépitos.",
    "example": "En la exploración, crépitos debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "roncus",
    "term": "Roncus",
    "short": "Ruidos respiratorios graves por secreciones en vías aéreas.",
    "category": "Valoración",
    "definition": "Ruidos respiratorios graves por secreciones en vías aéreas.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con roncus.",
    "example": "En la exploración, roncus debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "polidipsia",
    "term": "Polidipsia",
    "short": "Aumento anormal de la sed.",
    "category": "Valoración",
    "definition": "Aumento anormal de la sed.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con polidipsia.",
    "example": "En la exploración, polidipsia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "polifagia",
    "term": "Polifagia",
    "short": "Aumento anormal del apetito.",
    "category": "Valoración",
    "definition": "Aumento anormal del apetito.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con polifagia.",
    "example": "En la exploración, polifagia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "intolerancia-oral",
    "term": "Intolerancia oral",
    "short": "Incapacidad para tolerar líquidos o alimentos por vía oral.",
    "category": "Valoración",
    "definition": "Incapacidad para tolerar líquidos o alimentos por vía oral.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con intolerancia oral.",
    "example": "En la exploración, intolerancia oral debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "astenia",
    "term": "Astenia",
    "short": "Sensación generalizada de debilidad o falta de energía.",
    "category": "Valoración",
    "definition": "Sensación generalizada de debilidad o falta de energía.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con astenia.",
    "example": "En la exploración, astenia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "adinamia",
    "term": "Adinamia",
    "short": "Dificultad marcada para realizar actividad física por falta de fuerza.",
    "category": "Valoración",
    "definition": "Dificultad marcada para realizar actividad física por falta de fuerza.",
    "clinicalUse": "Se usa durante la valoración inicial para describir hallazgos y orientar gravedad, estudios o vigilancia relacionados con adinamia.",
    "example": "En la exploración, adinamia debe registrarse con contexto, intensidad y tiempo de evolución.",
    "related": [
      "Signos vitales",
      "Exploración física",
      "Semiología"
    ]
  },
  {
    "id": "farmacocinetica",
    "term": "Farmacocinética",
    "short": "Estudio de absorción, distribución, metabolismo y eliminación de un fármaco.",
    "category": "Farmacología",
    "definition": "Estudio de absorción, distribución, metabolismo y eliminación de un fármaco.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece farmacocinética.",
    "example": "Antes de administrar un medicamento, conviene revisar farmacocinética para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "farmacodinamia",
    "term": "Farmacodinamia",
    "short": "Estudio del efecto del fármaco sobre el organismo y sus receptores.",
    "category": "Farmacología",
    "definition": "Estudio del efecto del fármaco sobre el organismo y sus receptores.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece farmacodinamia.",
    "example": "Antes de administrar un medicamento, conviene revisar farmacodinamia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "biodisponibilidad",
    "term": "Biodisponibilidad",
    "short": "Fracción del fármaco que alcanza la circulación sistémica.",
    "category": "Farmacología",
    "definition": "Fracción del fármaco que alcanza la circulación sistémica.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece biodisponibilidad.",
    "example": "Antes de administrar un medicamento, conviene revisar biodisponibilidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "vida-media",
    "term": "Vida media",
    "short": "Tiempo necesario para reducir a la mitad la concentración plasmática de un fármaco.",
    "category": "Farmacología",
    "definition": "Tiempo necesario para reducir a la mitad la concentración plasmática de un fármaco.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vida media.",
    "example": "Antes de administrar un medicamento, conviene revisar vida media para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "estado-estable",
    "term": "Estado estable",
    "short": "Equilibrio entre administración y eliminación de un fármaco.",
    "category": "Farmacología",
    "definition": "Equilibrio entre administración y eliminación de un fármaco.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece estado estable.",
    "example": "Antes de administrar un medicamento, conviene revisar estado estable para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "dosis-de-carga",
    "term": "Dosis de carga",
    "short": "Dosis inicial mayor usada para alcanzar rápidamente una concentración terapéutica.",
    "category": "Farmacología",
    "definition": "Dosis inicial mayor usada para alcanzar rápidamente una concentración terapéutica.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece dosis de carga.",
    "example": "Antes de administrar un medicamento, conviene revisar dosis de carga para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "dosis-de-mantenimiento",
    "term": "Dosis de mantenimiento",
    "short": "Dosis usada para mantener concentraciones terapéuticas estables.",
    "category": "Farmacología",
    "definition": "Dosis usada para mantener concentraciones terapéuticas estables.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece dosis de mantenimiento.",
    "example": "Antes de administrar un medicamento, conviene revisar dosis de mantenimiento para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "depuracion",
    "term": "Depuración",
    "short": "Volumen de plasma del que se elimina un fármaco por unidad de tiempo.",
    "category": "Farmacología",
    "definition": "Volumen de plasma del que se elimina un fármaco por unidad de tiempo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece depuración.",
    "example": "Antes de administrar un medicamento, conviene revisar depuración para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "volumen-de-distribucion",
    "term": "Volumen de distribución",
    "short": "Relación entre cantidad total de fármaco y concentración plasmática.",
    "category": "Farmacología",
    "definition": "Relación entre cantidad total de fármaco y concentración plasmática.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece volumen de distribución.",
    "example": "Antes de administrar un medicamento, conviene revisar volumen de distribución para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "metabolismo-de-primer-paso",
    "term": "Metabolismo de primer paso",
    "short": "Transformación del fármaco antes de llegar a la circulación sistémica.",
    "category": "Farmacología",
    "definition": "Transformación del fármaco antes de llegar a la circulación sistémica.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece metabolismo de primer paso.",
    "example": "Antes de administrar un medicamento, conviene revisar metabolismo de primer paso para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "indice-terapeutico",
    "term": "Índice terapéutico",
    "short": "Relación entre dosis tóxica y dosis terapéutica.",
    "category": "Farmacología",
    "definition": "Relación entre dosis tóxica y dosis terapéutica.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece índice terapéutico.",
    "example": "Antes de administrar un medicamento, conviene revisar índice terapéutico para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "ventana-terapeutica",
    "term": "Ventana terapéutica",
    "short": "Rango de concentración con eficacia y toxicidad aceptables.",
    "category": "Farmacología",
    "definition": "Rango de concentración con eficacia y toxicidad aceptables.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece ventana terapéutica.",
    "example": "Antes de administrar un medicamento, conviene revisar ventana terapéutica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "interaccion-farmacologica",
    "term": "Interacción farmacológica",
    "short": "Cambio del efecto de un fármaco por otro medicamento o sustancia.",
    "category": "Farmacología",
    "definition": "Cambio del efecto de un fármaco por otro medicamento o sustancia.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece interacción farmacológica.",
    "example": "Antes de administrar un medicamento, conviene revisar interacción farmacológica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "evento-adverso",
    "term": "Evento adverso",
    "short": "Daño no intencional asociado al uso de medicamentos o a la atención.",
    "category": "Farmacología",
    "definition": "Daño no intencional asociado al uso de medicamentos o a la atención.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece evento adverso.",
    "example": "Antes de administrar un medicamento, conviene revisar evento adverso para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "reaccion-adversa",
    "term": "Reacción adversa",
    "short": "Respuesta nociva no deseada a dosis habitualmente utilizadas.",
    "category": "Farmacología",
    "definition": "Respuesta nociva no deseada a dosis habitualmente utilizadas.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece reacción adversa.",
    "example": "Antes de administrar un medicamento, conviene revisar reacción adversa para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "contraindicacion",
    "term": "Contraindicación",
    "short": "Situación en la que no debe emplearse un medicamento.",
    "category": "Farmacología",
    "definition": "Situación en la que no debe emplearse un medicamento.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece contraindicación.",
    "example": "Antes de administrar un medicamento, conviene revisar contraindicación para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "precaucion",
    "term": "Precaución",
    "short": "Condición que obliga a usar un fármaco con vigilancia adicional.",
    "category": "Farmacología",
    "definition": "Condición que obliga a usar un fármaco con vigilancia adicional.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece precaución.",
    "example": "Antes de administrar un medicamento, conviene revisar precaución para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "indicacion",
    "term": "Indicación",
    "short": "Situación clínica para la que un medicamento está recomendado.",
    "category": "Farmacología",
    "definition": "Situación clínica para la que un medicamento está recomendado.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece indicación.",
    "example": "Antes de administrar un medicamento, conviene revisar indicación para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "posologia",
    "term": "Posología",
    "short": "Dosis, intervalo y duración con que debe administrarse un fármaco.",
    "category": "Farmacología",
    "definition": "Dosis, intervalo y duración con que debe administrarse un fármaco.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece posología.",
    "example": "Antes de administrar un medicamento, conviene revisar posología para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "titulacion",
    "term": "Titulación",
    "short": "Ajuste progresivo de dosis según respuesta o tolerancia.",
    "category": "Farmacología",
    "definition": "Ajuste progresivo de dosis según respuesta o tolerancia.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece titulación.",
    "example": "Antes de administrar un medicamento, conviene revisar titulación para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "conciliacion-de-medicamentos",
    "term": "Conciliación de medicamentos",
    "short": "Revisión estructurada del tratamiento al ingreso, traslado o alta.",
    "category": "Farmacología",
    "definition": "Revisión estructurada del tratamiento al ingreso, traslado o alta.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece conciliación de medicamentos.",
    "example": "Antes de administrar un medicamento, conviene revisar conciliación de medicamentos para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "polifarmacia",
    "term": "Polifarmacia",
    "short": "Uso simultáneo de múltiples medicamentos.",
    "category": "Farmacología",
    "definition": "Uso simultáneo de múltiples medicamentos.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece polifarmacia.",
    "example": "Antes de administrar un medicamento, conviene revisar polifarmacia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "monoterapia",
    "term": "Monoterapia",
    "short": "Uso de un solo medicamento para una condición.",
    "category": "Farmacología",
    "definition": "Uso de un solo medicamento para una condición.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece monoterapia.",
    "example": "Antes de administrar un medicamento, conviene revisar monoterapia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "dosis-maxima",
    "term": "Dosis máxima",
    "short": "Mayor dosis recomendada de un fármaco.",
    "category": "Farmacología",
    "definition": "Mayor dosis recomendada de un fármaco.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece dosis máxima.",
    "example": "Antes de administrar un medicamento, conviene revisar dosis máxima para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "dosis-minima-eficaz",
    "term": "Dosis mínima eficaz",
    "short": "Menor dosis capaz de producir el efecto terapéutico esperado.",
    "category": "Farmacología",
    "definition": "Menor dosis capaz de producir el efecto terapéutico esperado.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece dosis mínima eficaz.",
    "example": "Antes de administrar un medicamento, conviene revisar dosis mínima eficaz para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "via-enteral",
    "term": "Vía enteral",
    "short": "Administración a través del tracto gastrointestinal.",
    "category": "Farmacología",
    "definition": "Administración a través del tracto gastrointestinal.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vía enteral.",
    "example": "Antes de administrar un medicamento, conviene revisar vía enteral para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "via-parenteral",
    "term": "Vía parenteral",
    "short": "Administración por rutas distintas al tracto gastrointestinal.",
    "category": "Farmacología",
    "definition": "Administración por rutas distintas al tracto gastrointestinal.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vía parenteral.",
    "example": "Antes de administrar un medicamento, conviene revisar vía parenteral para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "via-sublingual",
    "term": "Vía sublingual",
    "short": "Administración debajo de la lengua para absorción rápida.",
    "category": "Farmacología",
    "definition": "Administración debajo de la lengua para absorción rápida.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vía sublingual.",
    "example": "Antes de administrar un medicamento, conviene revisar vía sublingual para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "via-topica",
    "term": "Vía tópica",
    "short": "Aplicación local sobre piel o mucosas.",
    "category": "Farmacología",
    "definition": "Aplicación local sobre piel o mucosas.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vía tópica.",
    "example": "Antes de administrar un medicamento, conviene revisar vía tópica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "via-intravenosa",
    "term": "Vía intravenosa",
    "short": "Administración directa al torrente sanguíneo.",
    "category": "Farmacología",
    "definition": "Administración directa al torrente sanguíneo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vía intravenosa.",
    "example": "Antes de administrar un medicamento, conviene revisar vía intravenosa para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "via-intramuscular",
    "term": "Vía intramuscular",
    "short": "Administración dentro del músculo.",
    "category": "Farmacología",
    "definition": "Administración dentro del músculo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vía intramuscular.",
    "example": "Antes de administrar un medicamento, conviene revisar vía intramuscular para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "via-subcutanea",
    "term": "Vía subcutánea",
    "short": "Administración en tejido celular subcutáneo.",
    "category": "Farmacología",
    "definition": "Administración en tejido celular subcutáneo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece vía subcutánea.",
    "example": "Antes de administrar un medicamento, conviene revisar vía subcutánea para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "infusion-continua",
    "term": "Infusión continua",
    "short": "Administración mantenida a velocidad constante.",
    "category": "Farmacología",
    "definition": "Administración mantenida a velocidad constante.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece infusión continua.",
    "example": "Antes de administrar un medicamento, conviene revisar infusión continua para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "bolo",
    "term": "Bolo",
    "short": "Administración rápida de una dosis en corto tiempo.",
    "category": "Farmacología",
    "definition": "Administración rápida de una dosis en corto tiempo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece bolo.",
    "example": "Antes de administrar un medicamento, conviene revisar bolo para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "dilucion",
    "term": "Dilución",
    "short": "Reducción de concentración al mezclar con un diluyente.",
    "category": "Farmacología",
    "definition": "Reducción de concentración al mezclar con un diluyente.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece dilución.",
    "example": "Antes de administrar un medicamento, conviene revisar dilución para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "reconstitucion",
    "term": "Reconstitución",
    "short": "Preparación de un medicamento en polvo antes de administrarlo.",
    "category": "Farmacología",
    "definition": "Preparación de un medicamento en polvo antes de administrarlo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece reconstitución.",
    "example": "Antes de administrar un medicamento, conviene revisar reconstitución para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "compatibilidad",
    "term": "Compatibilidad",
    "short": "Capacidad de mezclarse sin perder estabilidad o seguridad.",
    "category": "Farmacología",
    "definition": "Capacidad de mezclarse sin perder estabilidad o seguridad.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece compatibilidad.",
    "example": "Antes de administrar un medicamento, conviene revisar compatibilidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "incompatibilidad",
    "term": "Incompatibilidad",
    "short": "Imposibilidad de mezclar sustancias por riesgo físico o químico.",
    "category": "Farmacología",
    "definition": "Imposibilidad de mezclar sustancias por riesgo físico o químico.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece incompatibilidad.",
    "example": "Antes de administrar un medicamento, conviene revisar incompatibilidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "extravasacion",
    "term": "Extravasación",
    "short": "Salida accidental de un fármaco al tejido adyacente al vaso.",
    "category": "Farmacología",
    "definition": "Salida accidental de un fármaco al tejido adyacente al vaso.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece extravasación.",
    "example": "Antes de administrar un medicamento, conviene revisar extravasación para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "flebitis",
    "term": "Flebitis",
    "short": "Inflamación de una vena, a menudo asociada a administración intravenosa.",
    "category": "Farmacología",
    "definition": "Inflamación de una vena, a menudo asociada a administración intravenosa.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece flebitis.",
    "example": "Antes de administrar un medicamento, conviene revisar flebitis para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "farmacovigilancia",
    "term": "Farmacovigilancia",
    "short": "Detección y análisis de problemas de seguridad relacionados con medicamentos.",
    "category": "Farmacología",
    "definition": "Detección y análisis de problemas de seguridad relacionados con medicamentos.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece farmacovigilancia.",
    "example": "Antes de administrar un medicamento, conviene revisar farmacovigilancia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "resistencia-antimicrobiana",
    "term": "Resistencia antimicrobiana",
    "short": "Capacidad de un microorganismo para sobrevivir a antimicrobianos.",
    "category": "Farmacología",
    "definition": "Capacidad de un microorganismo para sobrevivir a antimicrobianos.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece resistencia antimicrobiana.",
    "example": "Antes de administrar un medicamento, conviene revisar resistencia antimicrobiana para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "espectro-antibiotico",
    "term": "Espectro antibiótico",
    "short": "Rango de microorganismos frente a los que actúa un antibiótico.",
    "category": "Farmacología",
    "definition": "Rango de microorganismos frente a los que actúa un antibiótico.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece espectro antibiótico.",
    "example": "Antes de administrar un medicamento, conviene revisar espectro antibiótico para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "bactericida",
    "term": "Bactericida",
    "short": "Fármaco que destruye bacterias.",
    "category": "Farmacología",
    "definition": "Fármaco que destruye bacterias.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece bactericida.",
    "example": "Antes de administrar un medicamento, conviene revisar bactericida para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "bacteriostatico",
    "term": "Bacteriostático",
    "short": "Fármaco que inhibe el crecimiento bacteriano.",
    "category": "Farmacología",
    "definition": "Fármaco que inhibe el crecimiento bacteriano.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece bacteriostático.",
    "example": "Antes de administrar un medicamento, conviene revisar bacteriostático para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "analgesia-multimodal",
    "term": "Analgesia multimodal",
    "short": "Control del dolor mediante fármacos o técnicas con mecanismos distintos.",
    "category": "Farmacología",
    "definition": "Control del dolor mediante fármacos o técnicas con mecanismos distintos.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece analgesia multimodal.",
    "example": "Antes de administrar un medicamento, conviene revisar analgesia multimodal para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "sedacion",
    "term": "Sedación",
    "short": "Disminución controlada del nivel de alerta.",
    "category": "Farmacología",
    "definition": "Disminución controlada del nivel de alerta.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece sedación.",
    "example": "Antes de administrar un medicamento, conviene revisar sedación para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "antagonista",
    "term": "Antagonista",
    "short": "Sustancia que bloquea el efecto de un receptor.",
    "category": "Farmacología",
    "definition": "Sustancia que bloquea el efecto de un receptor.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece antagonista.",
    "example": "Antes de administrar un medicamento, conviene revisar antagonista para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "agonista",
    "term": "Agonista",
    "short": "Sustancia que activa un receptor y genera respuesta biológica.",
    "category": "Farmacología",
    "definition": "Sustancia que activa un receptor y genera respuesta biológica.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece agonista.",
    "example": "Antes de administrar un medicamento, conviene revisar agonista para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "agonista-parcial",
    "term": "Agonista parcial",
    "short": "Sustancia que activa un receptor con respuesta menor que un agonista completo.",
    "category": "Farmacología",
    "definition": "Sustancia que activa un receptor con respuesta menor que un agonista completo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece agonista parcial.",
    "example": "Antes de administrar un medicamento, conviene revisar agonista parcial para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "receptor-farmacologico",
    "term": "Receptor farmacológico",
    "short": "Estructura molecular a la que se une un fármaco para ejercer efecto.",
    "category": "Farmacología",
    "definition": "Estructura molecular a la que se une un fármaco para ejercer efecto.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece receptor farmacológico.",
    "example": "Antes de administrar un medicamento, conviene revisar receptor farmacológico para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "afinidad",
    "term": "Afinidad",
    "short": "Capacidad de un fármaco para unirse a su receptor.",
    "category": "Farmacología",
    "definition": "Capacidad de un fármaco para unirse a su receptor.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece afinidad.",
    "example": "Antes de administrar un medicamento, conviene revisar afinidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "potencia",
    "term": "Potencia",
    "short": "Cantidad de fármaco necesaria para producir un efecto determinado.",
    "category": "Farmacología",
    "definition": "Cantidad de fármaco necesaria para producir un efecto determinado.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece potencia.",
    "example": "Antes de administrar un medicamento, conviene revisar potencia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "eficacia",
    "term": "Eficacia",
    "short": "Capacidad máxima de un fármaco para producir un efecto.",
    "category": "Farmacología",
    "definition": "Capacidad máxima de un fármaco para producir un efecto.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece eficacia.",
    "example": "Antes de administrar un medicamento, conviene revisar eficacia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "liberacion-prolongada",
    "term": "Liberación prolongada",
    "short": "Formulación diseñada para liberar el fármaco lentamente.",
    "category": "Farmacología",
    "definition": "Formulación diseñada para liberar el fármaco lentamente.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece liberación prolongada.",
    "example": "Antes de administrar un medicamento, conviene revisar liberación prolongada para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "liberacion-inmediata",
    "term": "Liberación inmediata",
    "short": "Formulación que libera el fármaco rápidamente tras su administración.",
    "category": "Farmacología",
    "definition": "Formulación que libera el fármaco rápidamente tras su administración.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece liberación inmediata.",
    "example": "Antes de administrar un medicamento, conviene revisar liberación inmediata para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "ajuste-renal",
    "term": "Ajuste renal",
    "short": "Modificación de dosis según función renal.",
    "category": "Farmacología",
    "definition": "Modificación de dosis según función renal.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece ajuste renal.",
    "example": "Antes de administrar un medicamento, conviene revisar ajuste renal para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "ajuste-hepatico",
    "term": "Ajuste hepático",
    "short": "Modificación de dosis según función hepática.",
    "category": "Farmacología",
    "definition": "Modificación de dosis según función hepática.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece ajuste hepático.",
    "example": "Antes de administrar un medicamento, conviene revisar ajuste hepático para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "monitorizacion-terapeutica",
    "term": "Monitorización terapéutica",
    "short": "Medición de niveles o respuesta para optimizar tratamiento.",
    "category": "Farmacología",
    "definition": "Medición de niveles o respuesta para optimizar tratamiento.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece monitorización terapéutica.",
    "example": "Antes de administrar un medicamento, conviene revisar monitorización terapéutica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "margen-de-seguridad",
    "term": "Margen de seguridad",
    "short": "Distancia entre exposición terapéutica y exposición tóxica.",
    "category": "Farmacología",
    "definition": "Distancia entre exposición terapéutica y exposición tóxica.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece margen de seguridad.",
    "example": "Antes de administrar un medicamento, conviene revisar margen de seguridad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "desescalada-antibiotica",
    "term": "Desescalada antibiótica",
    "short": "Reducción del espectro antibiótico según resultados clínicos o microbiológicos.",
    "category": "Farmacología",
    "definition": "Reducción del espectro antibiótico según resultados clínicos o microbiológicos.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece desescalada antibiótica.",
    "example": "Antes de administrar un medicamento, conviene revisar desescalada antibiótica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "deprescripcion",
    "term": "Deprescripción",
    "short": "Retiro planificado de medicamentos innecesarios o dañinos.",
    "category": "Farmacología",
    "definition": "Retiro planificado de medicamentos innecesarios o dañinos.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece deprescripción.",
    "example": "Antes de administrar un medicamento, conviene revisar deprescripción para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "duplicidad-terapeutica",
    "term": "Duplicidad terapéutica",
    "short": "Presencia de fármacos equivalentes sin beneficio adicional claro.",
    "category": "Farmacología",
    "definition": "Presencia de fármacos equivalentes sin beneficio adicional claro.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece duplicidad terapéutica.",
    "example": "Antes de administrar un medicamento, conviene revisar duplicidad terapéutica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "bioequivalencia",
    "term": "Bioequivalencia",
    "short": "Comparabilidad farmacocinética entre dos productos con el mismo principio activo.",
    "category": "Farmacología",
    "definition": "Comparabilidad farmacocinética entre dos productos con el mismo principio activo.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece bioequivalencia.",
    "example": "Antes de administrar un medicamento, conviene revisar bioequivalencia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "generico",
    "term": "Genérico",
    "short": "Medicamento con mismo principio activo y bioequivalencia comprobada.",
    "category": "Farmacología",
    "definition": "Medicamento con mismo principio activo y bioequivalencia comprobada.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece genérico.",
    "example": "Antes de administrar un medicamento, conviene revisar genérico para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "medicamento-de-alto-riesgo",
    "term": "Medicamento de alto riesgo",
    "short": "Fármaco con mayor potencial de causar daño grave si se usa mal.",
    "category": "Farmacología",
    "definition": "Fármaco con mayor potencial de causar daño grave si se usa mal.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece medicamento de alto riesgo.",
    "example": "Antes de administrar un medicamento, conviene revisar medicamento de alto riesgo para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "medicamento-lasa",
    "term": "Medicamento LASA",
    "short": "Medicamento con nombre o apariencia similar a otro y riesgo de confusión.",
    "category": "Farmacología",
    "definition": "Medicamento con nombre o apariencia similar a otro y riesgo de confusión.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece medicamento lasa.",
    "example": "Antes de administrar un medicamento, conviene revisar medicamento lasa para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "prescripcion-segura",
    "term": "Prescripción segura",
    "short": "Proceso de indicar medicamentos reduciendo ambigüedad y errores.",
    "category": "Farmacología",
    "definition": "Proceso de indicar medicamentos reduciendo ambigüedad y errores.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece prescripción segura.",
    "example": "Antes de administrar un medicamento, conviene revisar prescripción segura para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "farmacoterapia",
    "term": "Farmacoterapia",
    "short": "Uso planificado de medicamentos para prevenir o tratar enfermedad.",
    "category": "Farmacología",
    "definition": "Uso planificado de medicamentos para prevenir o tratar enfermedad.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece farmacoterapia.",
    "example": "Antes de administrar un medicamento, conviene revisar farmacoterapia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "farmacogenomica",
    "term": "Farmacogenómica",
    "short": "Influencia de la genética sobre la respuesta a medicamentos.",
    "category": "Farmacología",
    "definition": "Influencia de la genética sobre la respuesta a medicamentos.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece farmacogenómica.",
    "example": "Antes de administrar un medicamento, conviene revisar farmacogenómica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "teratogenicidad",
    "term": "Teratogenicidad",
    "short": "Capacidad de una sustancia para causar malformaciones fetales.",
    "category": "Farmacología",
    "definition": "Capacidad de una sustancia para causar malformaciones fetales.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece teratogenicidad.",
    "example": "Antes de administrar un medicamento, conviene revisar teratogenicidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "hepatotoxicidad",
    "term": "Hepatotoxicidad",
    "short": "Daño hepático asociado a un fármaco o sustancia.",
    "category": "Farmacología",
    "definition": "Daño hepático asociado a un fármaco o sustancia.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece hepatotoxicidad.",
    "example": "Antes de administrar un medicamento, conviene revisar hepatotoxicidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "nefrotoxicidad",
    "term": "Nefrotoxicidad",
    "short": "Daño renal asociado a un fármaco o sustancia.",
    "category": "Farmacología",
    "definition": "Daño renal asociado a un fármaco o sustancia.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece nefrotoxicidad.",
    "example": "Antes de administrar un medicamento, conviene revisar nefrotoxicidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "ototoxicidad",
    "term": "Ototoxicidad",
    "short": "Daño auditivo o vestibular asociado a un medicamento.",
    "category": "Farmacología",
    "definition": "Daño auditivo o vestibular asociado a un medicamento.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece ototoxicidad.",
    "example": "Antes de administrar un medicamento, conviene revisar ototoxicidad para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "prolongacion-qt",
    "term": "Prolongación QT",
    "short": "Alargamiento del intervalo QT con riesgo arrítmico.",
    "category": "Farmacología",
    "definition": "Alargamiento del intervalo QT con riesgo arrítmico.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece prolongación qt.",
    "example": "Antes de administrar un medicamento, conviene revisar prolongación qt para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "interaccion-alimento-farmaco",
    "term": "Interacción alimento-fármaco",
    "short": "Cambio de absorción o efecto por alimentos o bebidas.",
    "category": "Farmacología",
    "definition": "Cambio de absorción o efecto por alimentos o bebidas.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece interacción alimento-fármaco.",
    "example": "Antes de administrar un medicamento, conviene revisar interacción alimento-fármaco para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "concentracion-plasmatica",
    "term": "Concentración plasmática",
    "short": "Cantidad de fármaco presente en plasma.",
    "category": "Farmacología",
    "definition": "Cantidad de fármaco presente en plasma.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece concentración plasmática.",
    "example": "Antes de administrar un medicamento, conviene revisar concentración plasmática para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "tolerancia-farmacologica",
    "term": "Tolerancia farmacológica",
    "short": "Disminución del efecto con uso repetido de un fármaco.",
    "category": "Farmacología",
    "definition": "Disminución del efecto con uso repetido de un fármaco.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece tolerancia farmacológica.",
    "example": "Antes de administrar un medicamento, conviene revisar tolerancia farmacológica para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "taquifilaxia",
    "term": "Taquifilaxia",
    "short": "Pérdida rápida de respuesta tras exposiciones repetidas.",
    "category": "Farmacología",
    "definition": "Pérdida rápida de respuesta tras exposiciones repetidas.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece taquifilaxia.",
    "example": "Antes de administrar un medicamento, conviene revisar taquifilaxia para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "antidoto",
    "term": "Antídoto",
    "short": "Sustancia usada para revertir o neutralizar un tóxico.",
    "category": "Farmacología",
    "definition": "Sustancia usada para revertir o neutralizar un tóxico.",
    "clinicalUse": "Es útil para prescribir, administrar y vigilar tratamientos con mayor seguridad cuando aparece antídoto.",
    "example": "Antes de administrar un medicamento, conviene revisar antídoto para reducir errores y eventos adversos.",
    "related": [
      "Seguridad del paciente",
      "Dosis",
      "Efectos adversos"
    ]
  },
  {
    "id": "inflamacion",
    "term": "Inflamación",
    "short": "Respuesta biológica ante daño, infección o irritación tisular.",
    "category": "Patologías",
    "definition": "Respuesta biológica ante daño, infección o irritación tisular.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha inflamación.",
    "example": "Reconocer inflamación ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "infeccion",
    "term": "Infección",
    "short": "Invasión y multiplicación de microorganismos en el huésped.",
    "category": "Patologías",
    "definition": "Invasión y multiplicación de microorganismos en el huésped.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha infección.",
    "example": "Reconocer infección ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "colonizacion",
    "term": "Colonización",
    "short": "Presencia de microorganismos sin causar invasión ni daño clínico.",
    "category": "Patologías",
    "definition": "Presencia de microorganismos sin causar invasión ni daño clínico.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha colonización.",
    "example": "Reconocer colonización ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "bacteriemia",
    "term": "Bacteriemia",
    "short": "Presencia de bacterias en la sangre.",
    "category": "Patologías",
    "definition": "Presencia de bacterias en la sangre.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha bacteriemia.",
    "example": "Reconocer bacteriemia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "viremia",
    "term": "Viremia",
    "short": "Presencia de virus en la sangre.",
    "category": "Patologías",
    "definition": "Presencia de virus en la sangre.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha viremia.",
    "example": "Reconocer viremia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "fungemia",
    "term": "Fungemia",
    "short": "Presencia de hongos en la sangre.",
    "category": "Patologías",
    "definition": "Presencia de hongos en la sangre.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha fungemia.",
    "example": "Reconocer fungemia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "isquemia",
    "term": "Isquemia",
    "short": "Disminución del flujo sanguíneo a un tejido.",
    "category": "Patologías",
    "definition": "Disminución del flujo sanguíneo a un tejido.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha isquemia.",
    "example": "Reconocer isquemia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "necrosis",
    "term": "Necrosis",
    "short": "Muerte celular no programada por lesión intensa.",
    "category": "Patologías",
    "definition": "Muerte celular no programada por lesión intensa.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha necrosis.",
    "example": "Reconocer necrosis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "apoptosis",
    "term": "Apoptosis",
    "short": "Muerte celular programada y regulada.",
    "category": "Patologías",
    "definition": "Muerte celular programada y regulada.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha apoptosis.",
    "example": "Reconocer apoptosis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "fibrosis",
    "term": "Fibrosis",
    "short": "Formación excesiva de tejido conectivo cicatricial.",
    "category": "Patologías",
    "definition": "Formación excesiva de tejido conectivo cicatricial.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha fibrosis.",
    "example": "Reconocer fibrosis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hiperplasia",
    "term": "Hiperplasia",
    "short": "Aumento del número de células en un tejido.",
    "category": "Patologías",
    "definition": "Aumento del número de células en un tejido.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hiperplasia.",
    "example": "Reconocer hiperplasia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hipertrofia",
    "term": "Hipertrofia",
    "short": "Aumento del tamaño de las células.",
    "category": "Patologías",
    "definition": "Aumento del tamaño de las células.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hipertrofia.",
    "example": "Reconocer hipertrofia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "atrofia",
    "term": "Atrofia",
    "short": "Disminución del tamaño o masa de un órgano o tejido.",
    "category": "Patologías",
    "definition": "Disminución del tamaño o masa de un órgano o tejido.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha atrofia.",
    "example": "Reconocer atrofia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "metaplasia",
    "term": "Metaplasia",
    "short": "Cambio reversible de un tipo celular maduro por otro.",
    "category": "Patologías",
    "definition": "Cambio reversible de un tipo celular maduro por otro.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha metaplasia.",
    "example": "Reconocer metaplasia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "displasia",
    "term": "Displasia",
    "short": "Alteración del crecimiento y maduración celular con atipia.",
    "category": "Patologías",
    "definition": "Alteración del crecimiento y maduración celular con atipia.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha displasia.",
    "example": "Reconocer displasia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "neoplasia",
    "term": "Neoplasia",
    "short": "Proliferación anormal y autónoma de células.",
    "category": "Patologías",
    "definition": "Proliferación anormal y autónoma de células.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha neoplasia.",
    "example": "Reconocer neoplasia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "benigno",
    "term": "Benigno",
    "short": "Tumor de crecimiento localizado sin capacidad metastásica.",
    "category": "Patologías",
    "definition": "Tumor de crecimiento localizado sin capacidad metastásica.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha benigno.",
    "example": "Reconocer benigno ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "maligno",
    "term": "Maligno",
    "short": "Tumor con capacidad de invasión y metástasis.",
    "category": "Patologías",
    "definition": "Tumor con capacidad de invasión y metástasis.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha maligno.",
    "example": "Reconocer maligno ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "metastasis",
    "term": "Metástasis",
    "short": "Diseminación de células tumorales a distancia.",
    "category": "Patologías",
    "definition": "Diseminación de células tumorales a distancia.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha metástasis.",
    "example": "Reconocer metástasis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "trombosis",
    "term": "Trombosis",
    "short": "Formación de un trombo dentro del sistema vascular.",
    "category": "Patologías",
    "definition": "Formación de un trombo dentro del sistema vascular.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha trombosis.",
    "example": "Reconocer trombosis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "embolia",
    "term": "Embolia",
    "short": "Obstrucción vascular por material desplazado desde otro sitio.",
    "category": "Patologías",
    "definition": "Obstrucción vascular por material desplazado desde otro sitio.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha embolia.",
    "example": "Reconocer embolia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "infarto",
    "term": "Infarto",
    "short": "Necrosis tisular por falta de irrigación.",
    "category": "Patologías",
    "definition": "Necrosis tisular por falta de irrigación.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha infarto.",
    "example": "Reconocer infarto ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "congestion",
    "term": "Congestión",
    "short": "Acumulación excesiva de sangre en un territorio.",
    "category": "Patologías",
    "definition": "Acumulación excesiva de sangre en un territorio.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha congestión.",
    "example": "Reconocer congestión ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "estenosis",
    "term": "Estenosis",
    "short": "Estrechamiento patológico de un conducto o vaso.",
    "category": "Patologías",
    "definition": "Estrechamiento patológico de un conducto o vaso.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha estenosis.",
    "example": "Reconocer estenosis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "insuficiencia-cardiaca",
    "term": "Insuficiencia cardiaca",
    "short": "Incapacidad del corazón para cubrir demandas de perfusión.",
    "category": "Patologías",
    "definition": "Incapacidad del corazón para cubrir demandas de perfusión.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha insuficiencia cardiaca.",
    "example": "Reconocer insuficiencia cardiaca ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "insuficiencia-renal-aguda",
    "term": "Insuficiencia renal aguda",
    "short": "Deterioro brusco de la función renal.",
    "category": "Patologías",
    "definition": "Deterioro brusco de la función renal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha insuficiencia renal aguda.",
    "example": "Reconocer insuficiencia renal aguda ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "enfermedad-renal-cronica",
    "term": "Enfermedad renal crónica",
    "short": "Daño renal persistente o reducción mantenida de función renal.",
    "category": "Patologías",
    "definition": "Daño renal persistente o reducción mantenida de función renal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha enfermedad renal crónica.",
    "example": "Reconocer enfermedad renal crónica ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "epoc",
    "term": "EPOC",
    "short": "Enfermedad pulmonar obstructiva crónica con limitación persistente del flujo aéreo.",
    "category": "Patologías",
    "definition": "Enfermedad pulmonar obstructiva crónica con limitación persistente del flujo aéreo.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha epoc.",
    "example": "Reconocer epoc ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "asma",
    "term": "Asma",
    "short": "Enfermedad inflamatoria crónica de la vía aérea con obstrucción variable.",
    "category": "Patologías",
    "definition": "Enfermedad inflamatoria crónica de la vía aérea con obstrucción variable.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha asma.",
    "example": "Reconocer asma ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "neumonia",
    "term": "Neumonía",
    "short": "Infección del parénquima pulmonar.",
    "category": "Patologías",
    "definition": "Infección del parénquima pulmonar.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha neumonía.",
    "example": "Reconocer neumonía ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "derrame-pleural",
    "term": "Derrame pleural",
    "short": "Acumulación de líquido en el espacio pleural.",
    "category": "Patologías",
    "definition": "Acumulación de líquido en el espacio pleural.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha derrame pleural.",
    "example": "Reconocer derrame pleural ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "neumotorax",
    "term": "Neumotórax",
    "short": "Presencia de aire en el espacio pleural.",
    "category": "Patologías",
    "definition": "Presencia de aire en el espacio pleural.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha neumotórax.",
    "example": "Reconocer neumotórax ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "broncoespasmo",
    "term": "Broncoespasmo",
    "short": "Contracción del músculo liso bronquial con obstrucción al flujo aéreo.",
    "category": "Patologías",
    "definition": "Contracción del músculo liso bronquial con obstrucción al flujo aéreo.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha broncoespasmo.",
    "example": "Reconocer broncoespasmo ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "edema-agudo-de-pulmon",
    "term": "Edema agudo de pulmón",
    "short": "Acumulación rápida de líquido en alvéolos y tejido pulmonar.",
    "category": "Patologías",
    "definition": "Acumulación rápida de líquido en alvéolos y tejido pulmonar.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha edema agudo de pulmón.",
    "example": "Reconocer edema agudo de pulmón ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hipertension-arterial",
    "term": "Hipertensión arterial",
    "short": "Elevación sostenida de la presión arterial.",
    "category": "Patologías",
    "definition": "Elevación sostenida de la presión arterial.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hipertensión arterial.",
    "example": "Reconocer hipertensión arterial ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "sindrome-coronario-agudo",
    "term": "Síndrome coronario agudo",
    "short": "Conjunto de cuadros por isquemia miocárdica aguda.",
    "category": "Patologías",
    "definition": "Conjunto de cuadros por isquemia miocárdica aguda.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha síndrome coronario agudo.",
    "example": "Reconocer síndrome coronario agudo ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "arritmia",
    "term": "Arritmia",
    "short": "Alteración del ritmo cardiaco normal.",
    "category": "Patologías",
    "definition": "Alteración del ritmo cardiaco normal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha arritmia.",
    "example": "Reconocer arritmia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "fibrilacion-auricular",
    "term": "Fibrilación auricular",
    "short": "Arritmia supraventricular irregular y desorganizada.",
    "category": "Patologías",
    "definition": "Arritmia supraventricular irregular y desorganizada.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha fibrilación auricular.",
    "example": "Reconocer fibrilación auricular ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "pericarditis",
    "term": "Pericarditis",
    "short": "Inflamación del pericardio.",
    "category": "Patologías",
    "definition": "Inflamación del pericardio.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha pericarditis.",
    "example": "Reconocer pericarditis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "endocarditis",
    "term": "Endocarditis",
    "short": "Infección o inflamación del endocardio, usualmente valvular.",
    "category": "Patologías",
    "definition": "Infección o inflamación del endocardio, usualmente valvular.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha endocarditis.",
    "example": "Reconocer endocarditis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hepatitis",
    "term": "Hepatitis",
    "short": "Inflamación del hígado.",
    "category": "Patologías",
    "definition": "Inflamación del hígado.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hepatitis.",
    "example": "Reconocer hepatitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "cirrosis",
    "term": "Cirrosis",
    "short": "Fibrosis hepática avanzada con nódulos de regeneración.",
    "category": "Patologías",
    "definition": "Fibrosis hepática avanzada con nódulos de regeneración.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha cirrosis.",
    "example": "Reconocer cirrosis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "pancreatitis",
    "term": "Pancreatitis",
    "short": "Inflamación del páncreas.",
    "category": "Patologías",
    "definition": "Inflamación del páncreas.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha pancreatitis.",
    "example": "Reconocer pancreatitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "colecistitis",
    "term": "Colecistitis",
    "short": "Inflamación de la vesícula biliar.",
    "category": "Patologías",
    "definition": "Inflamación de la vesícula biliar.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha colecistitis.",
    "example": "Reconocer colecistitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "apendicitis",
    "term": "Apendicitis",
    "short": "Inflamación del apéndice vermiforme.",
    "category": "Patologías",
    "definition": "Inflamación del apéndice vermiforme.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha apendicitis.",
    "example": "Reconocer apendicitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "peritonitis",
    "term": "Peritonitis",
    "short": "Inflamación del peritoneo por infección o irritación química.",
    "category": "Patologías",
    "definition": "Inflamación del peritoneo por infección o irritación química.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha peritonitis.",
    "example": "Reconocer peritonitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "obstruccion-intestinal",
    "term": "Obstrucción intestinal",
    "short": "Interrupción mecánica o funcional del tránsito intestinal.",
    "category": "Patologías",
    "definition": "Interrupción mecánica o funcional del tránsito intestinal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha obstrucción intestinal.",
    "example": "Reconocer obstrucción intestinal ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "ileo",
    "term": "Íleo",
    "short": "Disminución o ausencia de motilidad intestinal sin obstrucción mecánica clara.",
    "category": "Patologías",
    "definition": "Disminución o ausencia de motilidad intestinal sin obstrucción mecánica clara.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha íleo.",
    "example": "Reconocer íleo ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "gastritis",
    "term": "Gastritis",
    "short": "Inflamación de la mucosa gástrica.",
    "category": "Patologías",
    "definition": "Inflamación de la mucosa gástrica.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha gastritis.",
    "example": "Reconocer gastritis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "ulcera-peptica",
    "term": "Úlcera péptica",
    "short": "Lesión ulcerada en estómago o duodeno por daño ácido-péptico.",
    "category": "Patologías",
    "definition": "Lesión ulcerada en estómago o duodeno por daño ácido-péptico.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha úlcera péptica.",
    "example": "Reconocer úlcera péptica ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hemorragia-digestiva-alta",
    "term": "Hemorragia digestiva alta",
    "short": "Sangrado originado proximal al ángulo de Treitz.",
    "category": "Patologías",
    "definition": "Sangrado originado proximal al ángulo de Treitz.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hemorragia digestiva alta.",
    "example": "Reconocer hemorragia digestiva alta ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hemorragia-digestiva-baja",
    "term": "Hemorragia digestiva baja",
    "short": "Sangrado originado distal al ángulo de Treitz.",
    "category": "Patologías",
    "definition": "Sangrado originado distal al ángulo de Treitz.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hemorragia digestiva baja.",
    "example": "Reconocer hemorragia digestiva baja ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "desnutricion",
    "term": "Desnutrición",
    "short": "Déficit de nutrientes con repercusión funcional o estructural.",
    "category": "Patologías",
    "definition": "Déficit de nutrientes con repercusión funcional o estructural.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha desnutrición.",
    "example": "Reconocer desnutrición ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "obesidad",
    "term": "Obesidad",
    "short": "Exceso de tejido adiposo con impacto sobre la salud.",
    "category": "Patologías",
    "definition": "Exceso de tejido adiposo con impacto sobre la salud.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha obesidad.",
    "example": "Reconocer obesidad ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "diabetes-mellitus",
    "term": "Diabetes mellitus",
    "short": "Trastorno metabólico con hiperglucemia crónica.",
    "category": "Patologías",
    "definition": "Trastorno metabólico con hiperglucemia crónica.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha diabetes mellitus.",
    "example": "Reconocer diabetes mellitus ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "anemia",
    "term": "Anemia",
    "short": "Disminución de hemoglobina o capacidad de transporte de oxígeno.",
    "category": "Patologías",
    "definition": "Disminución de hemoglobina o capacidad de transporte de oxígeno.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha anemia.",
    "example": "Reconocer anemia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "trombocitopenia",
    "term": "Trombocitopenia",
    "short": "Disminución del número de plaquetas.",
    "category": "Patologías",
    "definition": "Disminución del número de plaquetas.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha trombocitopenia.",
    "example": "Reconocer trombocitopenia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "coagulopatia",
    "term": "Coagulopatía",
    "short": "Alteración de la coagulación con tendencia a sangrado o trombosis.",
    "category": "Patologías",
    "definition": "Alteración de la coagulación con tendencia a sangrado o trombosis.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha coagulopatía.",
    "example": "Reconocer coagulopatía ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "neutropenia",
    "term": "Neutropenia",
    "short": "Disminución del recuento de neutrófilos.",
    "category": "Patologías",
    "definition": "Disminución del recuento de neutrófilos.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha neutropenia.",
    "example": "Reconocer neutropenia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hipotiroidismo",
    "term": "Hipotiroidismo",
    "short": "Déficit de hormonas tiroideas.",
    "category": "Patologías",
    "definition": "Déficit de hormonas tiroideas.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hipotiroidismo.",
    "example": "Reconocer hipotiroidismo ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "hipertiroidismo",
    "term": "Hipertiroidismo",
    "short": "Exceso de hormonas tiroideas.",
    "category": "Patologías",
    "definition": "Exceso de hormonas tiroideas.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha hipertiroidismo.",
    "example": "Reconocer hipertiroidismo ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "sindrome-nefrotico",
    "term": "Síndrome nefrótico",
    "short": "Conjunto de proteinuria masiva, hipoalbuminemia y edema.",
    "category": "Patologías",
    "definition": "Conjunto de proteinuria masiva, hipoalbuminemia y edema.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha síndrome nefrótico.",
    "example": "Reconocer síndrome nefrótico ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "sindrome-nefritico",
    "term": "Síndrome nefrítico",
    "short": "Conjunto de hematuria, hipertensión y deterioro de función renal.",
    "category": "Patologías",
    "definition": "Conjunto de hematuria, hipertensión y deterioro de función renal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha síndrome nefrítico.",
    "example": "Reconocer síndrome nefrítico ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "pielonefritis",
    "term": "Pielonefritis",
    "short": "Infección del parénquima renal y pelvis renal.",
    "category": "Patologías",
    "definition": "Infección del parénquima renal y pelvis renal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha pielonefritis.",
    "example": "Reconocer pielonefritis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "litiasis-renal",
    "term": "Litiasis renal",
    "short": "Formación de cálculos en el riñón o la vía urinaria.",
    "category": "Patologías",
    "definition": "Formación de cálculos en el riñón o la vía urinaria.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha litiasis renal.",
    "example": "Reconocer litiasis renal ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "infeccion-urinaria",
    "term": "Infección urinaria",
    "short": "Infección del tracto urinario.",
    "category": "Patologías",
    "definition": "Infección del tracto urinario.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha infección urinaria.",
    "example": "Reconocer infección urinaria ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "glomerulonefritis",
    "term": "Glomerulonefritis",
    "short": "Inflamación del glomérulo renal.",
    "category": "Patologías",
    "definition": "Inflamación del glomérulo renal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha glomerulonefritis.",
    "example": "Reconocer glomerulonefritis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "celulitis",
    "term": "Celulitis",
    "short": "Infección bacteriana de piel y tejido subcutáneo.",
    "category": "Patologías",
    "definition": "Infección bacteriana de piel y tejido subcutáneo.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha celulitis.",
    "example": "Reconocer celulitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "osteomielitis",
    "term": "Osteomielitis",
    "short": "Infección del hueso.",
    "category": "Patologías",
    "definition": "Infección del hueso.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha osteomielitis.",
    "example": "Reconocer osteomielitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "artritis-septica",
    "term": "Artritis séptica",
    "short": "Infección dentro de una articulación.",
    "category": "Patologías",
    "definition": "Infección dentro de una articulación.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha artritis séptica.",
    "example": "Reconocer artritis séptica ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "osteoporosis",
    "term": "Osteoporosis",
    "short": "Disminución de masa ósea con mayor riesgo de fractura.",
    "category": "Patologías",
    "definition": "Disminución de masa ósea con mayor riesgo de fractura.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha osteoporosis.",
    "example": "Reconocer osteoporosis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "accidente-cerebrovascular",
    "term": "Accidente cerebrovascular",
    "short": "Déficit neurológico agudo de origen vascular.",
    "category": "Patologías",
    "definition": "Déficit neurológico agudo de origen vascular.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha accidente cerebrovascular.",
    "example": "Reconocer accidente cerebrovascular ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "epilepsia",
    "term": "Epilepsia",
    "short": "Trastorno caracterizado por predisposición a crisis epilépticas.",
    "category": "Patologías",
    "definition": "Trastorno caracterizado por predisposición a crisis epilépticas.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha epilepsia.",
    "example": "Reconocer epilepsia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "meningitis",
    "term": "Meningitis",
    "short": "Inflamación de meninges, habitualmente por infección.",
    "category": "Patologías",
    "definition": "Inflamación de meninges, habitualmente por infección.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha meningitis.",
    "example": "Reconocer meningitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "encefalopatia",
    "term": "Encefalopatía",
    "short": "Disfunción cerebral difusa por múltiples causas.",
    "category": "Patologías",
    "definition": "Disfunción cerebral difusa por múltiples causas.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha encefalopatía.",
    "example": "Reconocer encefalopatía ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "delirium",
    "term": "Delirium",
    "short": "Alteración aguda de atención, conciencia y cognición.",
    "category": "Patologías",
    "definition": "Alteración aguda de atención, conciencia y cognición.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha delirium.",
    "example": "Reconocer delirium ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "preeclampsia",
    "term": "Preeclampsia",
    "short": "Síndrome hipertensivo del embarazo con daño de órgano blanco.",
    "category": "Patologías",
    "definition": "Síndrome hipertensivo del embarazo con daño de órgano blanco.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha preeclampsia.",
    "example": "Reconocer preeclampsia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "eclampsia",
    "term": "Eclampsia",
    "short": "Preeclampsia complicada con convulsiones.",
    "category": "Patologías",
    "definition": "Preeclampsia complicada con convulsiones.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha eclampsia.",
    "example": "Reconocer eclampsia ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "sepsis-abdominal",
    "term": "Sepsis abdominal",
    "short": "Respuesta sistémica grave secundaria a foco infeccioso intraabdominal.",
    "category": "Patologías",
    "definition": "Respuesta sistémica grave secundaria a foco infeccioso intraabdominal.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha sepsis abdominal.",
    "example": "Reconocer sepsis abdominal ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "tromboembolismo-venoso",
    "term": "Tromboembolismo venoso",
    "short": "Enfermedad que incluye trombosis venosa profunda y embolia pulmonar.",
    "category": "Patologías",
    "definition": "Enfermedad que incluye trombosis venosa profunda y embolia pulmonar.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha tromboembolismo venoso.",
    "example": "Reconocer tromboembolismo venoso ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "miocardiopatia",
    "term": "Miocardiopatía",
    "short": "Enfermedad primaria del músculo cardiaco.",
    "category": "Patologías",
    "definition": "Enfermedad primaria del músculo cardiaco.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha miocardiopatía.",
    "example": "Reconocer miocardiopatía ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "bronquiolitis",
    "term": "Bronquiolitis",
    "short": "Inflamación aguda de vías aéreas pequeñas, frecuente en lactantes.",
    "category": "Patologías",
    "definition": "Inflamación aguda de vías aéreas pequeñas, frecuente en lactantes.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha bronquiolitis.",
    "example": "Reconocer bronquiolitis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "gastroenteritis",
    "term": "Gastroenteritis",
    "short": "Inflamación infecciosa de estómago e intestino.",
    "category": "Patologías",
    "definition": "Inflamación infecciosa de estómago e intestino.",
    "clinicalUse": "Ayuda a entender la enfermedad, anticipar complicaciones y priorizar manejo cuando se sospecha gastroenteritis.",
    "example": "Reconocer gastroenteritis ayuda a afinar diagnósticos diferenciales y prioridades de seguimiento.",
    "related": [
      "Etiología",
      "Fisiopatología",
      "Complicaciones"
    ]
  },
  {
    "id": "red-flags",
    "term": "Red flags",
    "short": "Signos de alarma que obligan a escalar la atención.",
    "category": "Urgencias",
    "definition": "Signos de alarma que obligan a escalar la atención.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece red flags.",
    "example": "Ante red flags, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "triage",
    "term": "Triage",
    "short": "Clasificación inicial según gravedad y tiempo de respuesta.",
    "category": "Urgencias",
    "definition": "Clasificación inicial según gravedad y tiempo de respuesta.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece triage.",
    "example": "Ante triage, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "sepsis",
    "term": "Sepsis",
    "short": "Disfunción orgánica por respuesta desregulada a una infección.",
    "category": "Urgencias",
    "definition": "Disfunción orgánica por respuesta desregulada a una infección.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece sepsis.",
    "example": "Ante sepsis, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "choque",
    "term": "Choque",
    "short": "Estado de hipoperfusión con riesgo vital.",
    "category": "Urgencias",
    "definition": "Estado de hipoperfusión con riesgo vital.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece choque.",
    "example": "Ante choque, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "choque-septico",
    "term": "Choque séptico",
    "short": "Sepsis con hipotensión y alteraciones de perfusión persistentes.",
    "category": "Urgencias",
    "definition": "Sepsis con hipotensión y alteraciones de perfusión persistentes.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece choque séptico.",
    "example": "Ante choque séptico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "choque-anafilactico",
    "term": "Choque anafiláctico",
    "short": "Choque distributivo secundario a anafilaxia.",
    "category": "Urgencias",
    "definition": "Choque distributivo secundario a anafilaxia.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece choque anafiláctico.",
    "example": "Ante choque anafiláctico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "choque-cardiogenico",
    "term": "Choque cardiogénico",
    "short": "Choque por falla del corazón como bomba.",
    "category": "Urgencias",
    "definition": "Choque por falla del corazón como bomba.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece choque cardiogénico.",
    "example": "Ante choque cardiogénico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "choque-obstructivo",
    "term": "Choque obstructivo",
    "short": "Choque causado por impedimento mecánico al llenado o eyección cardiaca.",
    "category": "Urgencias",
    "definition": "Choque causado por impedimento mecánico al llenado o eyección cardiaca.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece choque obstructivo.",
    "example": "Ante choque obstructivo, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "choque-hipovolemico",
    "term": "Choque hipovolémico",
    "short": "Choque por pérdida de volumen intravascular.",
    "category": "Urgencias",
    "definition": "Choque por pérdida de volumen intravascular.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece choque hipovolémico.",
    "example": "Ante choque hipovolémico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "anafilaxia",
    "term": "Anafilaxia",
    "short": "Reacción sistémica grave de hipersensibilidad de inicio rápido.",
    "category": "Urgencias",
    "definition": "Reacción sistémica grave de hipersensibilidad de inicio rápido.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece anafilaxia.",
    "example": "Ante anafilaxia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "paro-cardiorrespiratorio",
    "term": "Paro cardiorrespiratorio",
    "short": "Cese súbito de la circulación y la respiración efectivas.",
    "category": "Urgencias",
    "definition": "Cese súbito de la circulación y la respiración efectivas.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece paro cardiorrespiratorio.",
    "example": "Ante paro cardiorrespiratorio, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "reanimacion-cardiopulmonar",
    "term": "Reanimación cardiopulmonar",
    "short": "Maniobras para restaurar circulación y oxigenación en paro.",
    "category": "Urgencias",
    "definition": "Maniobras para restaurar circulación y oxigenación en paro.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece reanimación cardiopulmonar.",
    "example": "Ante reanimación cardiopulmonar, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "via-aerea-dificil",
    "term": "Vía aérea difícil",
    "short": "Situación con dificultad anticipada o real para ventilación o intubación.",
    "category": "Urgencias",
    "definition": "Situación con dificultad anticipada o real para ventilación o intubación.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece vía aérea difícil.",
    "example": "Ante vía aérea difícil, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "intubacion-orotraqueal",
    "term": "Intubación orotraqueal",
    "short": "Colocación de tubo en tráquea a través de la boca.",
    "category": "Urgencias",
    "definition": "Colocación de tubo en tráquea a través de la boca.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece intubación orotraqueal.",
    "example": "Ante intubación orotraqueal, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "ventilacion-bolsa-valvula-mascarilla",
    "term": "Ventilación bolsa-válvula-mascarilla",
    "short": "Soporte ventilatorio manual con dispositivo autoinflable.",
    "category": "Urgencias",
    "definition": "Soporte ventilatorio manual con dispositivo autoinflable.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece ventilación bolsa-válvula-mascarilla.",
    "example": "Ante ventilación bolsa-válvula-mascarilla, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "desfibrilacion",
    "term": "Desfibrilación",
    "short": "Descarga eléctrica no sincronizada para ritmos desfibrilables.",
    "category": "Urgencias",
    "definition": "Descarga eléctrica no sincronizada para ritmos desfibrilables.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece desfibrilación.",
    "example": "Ante desfibrilación, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "cardioversion",
    "term": "Cardioversión",
    "short": "Descarga eléctrica sincronizada para arritmias inestables.",
    "category": "Urgencias",
    "definition": "Descarga eléctrica sincronizada para arritmias inestables.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece cardioversión.",
    "example": "Ante cardioversión, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "bradicardia-inestable",
    "term": "Bradicardia inestable",
    "short": "Bradicardia con signos de mala perfusión o compromiso hemodinámico.",
    "category": "Urgencias",
    "definition": "Bradicardia con signos de mala perfusión o compromiso hemodinámico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece bradicardia inestable.",
    "example": "Ante bradicardia inestable, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "taquicardia-inestable",
    "term": "Taquicardia inestable",
    "short": "Taquicardia con hipotensión, dolor torácico o alteración del estado mental.",
    "category": "Urgencias",
    "definition": "Taquicardia con hipotensión, dolor torácico o alteración del estado mental.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece taquicardia inestable.",
    "example": "Ante taquicardia inestable, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipotension-refractaria",
    "term": "Hipotensión refractaria",
    "short": "Hipotensión que persiste pese a medidas iniciales adecuadas.",
    "category": "Urgencias",
    "definition": "Hipotensión que persiste pese a medidas iniciales adecuadas.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipotensión refractaria.",
    "example": "Ante hipotensión refractaria, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipovolemia-aguda",
    "term": "Hipovolemia aguda",
    "short": "Déficit rápido del volumen circulante efectivo.",
    "category": "Urgencias",
    "definition": "Déficit rápido del volumen circulante efectivo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipovolemia aguda.",
    "example": "Ante hipovolemia aguda, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hemorragia-masiva",
    "term": "Hemorragia masiva",
    "short": "Sangrado grave con riesgo de colapso hemodinámico.",
    "category": "Urgencias",
    "definition": "Sangrado grave con riesgo de colapso hemodinámico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hemorragia masiva.",
    "example": "Ante hemorragia masiva, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "politraumatismo",
    "term": "Politraumatismo",
    "short": "Paciente con múltiples lesiones potencialmente graves.",
    "category": "Urgencias",
    "definition": "Paciente con múltiples lesiones potencialmente graves.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece politraumatismo.",
    "example": "Ante politraumatismo, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "trauma-craneoencefalico",
    "term": "Trauma craneoencefálico",
    "short": "Lesión del cráneo o encéfalo por energía externa.",
    "category": "Urgencias",
    "definition": "Lesión del cráneo o encéfalo por energía externa.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece trauma craneoencefálico.",
    "example": "Ante trauma craneoencefálico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "trauma-toracico",
    "term": "Trauma torácico",
    "short": "Lesión traumática del tórax y sus estructuras.",
    "category": "Urgencias",
    "definition": "Lesión traumática del tórax y sus estructuras.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece trauma torácico.",
    "example": "Ante trauma torácico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "trauma-abdominal",
    "term": "Trauma abdominal",
    "short": "Lesión traumática de vísceras o pared abdominal.",
    "category": "Urgencias",
    "definition": "Lesión traumática de vísceras o pared abdominal.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece trauma abdominal.",
    "example": "Ante trauma abdominal, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "abdomen-agudo",
    "term": "Abdomen agudo",
    "short": "Dolor abdominal intenso con posible necesidad quirúrgica o urgente.",
    "category": "Urgencias",
    "definition": "Dolor abdominal intenso con posible necesidad quirúrgica o urgente.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece abdomen agudo.",
    "example": "Ante abdomen agudo, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "estatus-epileptico",
    "term": "Estatus epiléptico",
    "short": "Crisis prolongada o repetida sin recuperación adecuada entre episodios.",
    "category": "Urgencias",
    "definition": "Crisis prolongada o repetida sin recuperación adecuada entre episodios.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece estatus epiléptico.",
    "example": "Ante estatus epiléptico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "broncoespasmo-severo",
    "term": "Broncoespasmo severo",
    "short": "Obstrucción intensa de la vía aérea por contracción bronquial.",
    "category": "Urgencias",
    "definition": "Obstrucción intensa de la vía aérea por contracción bronquial.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece broncoespasmo severo.",
    "example": "Ante broncoespasmo severo, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "acidosis-metabolica",
    "term": "Acidosis metabólica",
    "short": "Disminución primaria del bicarbonato con descenso del pH.",
    "category": "Urgencias",
    "definition": "Disminución primaria del bicarbonato con descenso del pH.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece acidosis metabólica.",
    "example": "Ante acidosis metabólica, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "alcalosis-metabolica",
    "term": "Alcalosis metabólica",
    "short": "Aumento primario del bicarbonato con elevación del pH.",
    "category": "Urgencias",
    "definition": "Aumento primario del bicarbonato con elevación del pH.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece alcalosis metabólica.",
    "example": "Ante alcalosis metabólica, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "acidosis-respiratoria",
    "term": "Acidosis respiratoria",
    "short": "Retención de dióxido de carbono con descenso del pH.",
    "category": "Urgencias",
    "definition": "Retención de dióxido de carbono con descenso del pH.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece acidosis respiratoria.",
    "example": "Ante acidosis respiratoria, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "alcalosis-respiratoria",
    "term": "Alcalosis respiratoria",
    "short": "Descenso de dióxido de carbono con aumento del pH.",
    "category": "Urgencias",
    "definition": "Descenso de dióxido de carbono con aumento del pH.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece alcalosis respiratoria.",
    "example": "Ante alcalosis respiratoria, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hiperkalemia",
    "term": "Hiperkalemia",
    "short": "Elevación del potasio sérico.",
    "category": "Urgencias",
    "definition": "Elevación del potasio sérico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hiperkalemia.",
    "example": "Ante hiperkalemia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipokalemia",
    "term": "Hipokalemia",
    "short": "Disminución del potasio sérico.",
    "category": "Urgencias",
    "definition": "Disminución del potasio sérico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipokalemia.",
    "example": "Ante hipokalemia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hiponatremia",
    "term": "Hiponatremia",
    "short": "Disminución del sodio sérico.",
    "category": "Urgencias",
    "definition": "Disminución del sodio sérico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hiponatremia.",
    "example": "Ante hiponatremia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipernatremia",
    "term": "Hipernatremia",
    "short": "Elevación del sodio sérico.",
    "category": "Urgencias",
    "definition": "Elevación del sodio sérico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipernatremia.",
    "example": "Ante hipernatremia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipocalcemia",
    "term": "Hipocalcemia",
    "short": "Disminución del calcio sérico.",
    "category": "Urgencias",
    "definition": "Disminución del calcio sérico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipocalcemia.",
    "example": "Ante hipocalcemia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hiperglucemia-severa",
    "term": "Hiperglucemia severa",
    "short": "Elevación marcada de glucosa con riesgo metabólico agudo.",
    "category": "Urgencias",
    "definition": "Elevación marcada de glucosa con riesgo metabólico agudo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hiperglucemia severa.",
    "example": "Ante hiperglucemia severa, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "cetoacidosis-diabetica",
    "term": "Cetoacidosis diabética",
    "short": "Urgencia metabólica con hiperglucemia, cetosis y acidosis.",
    "category": "Urgencias",
    "definition": "Urgencia metabólica con hiperglucemia, cetosis y acidosis.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece cetoacidosis diabética.",
    "example": "Ante cetoacidosis diabética, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "estado-hiperosmolar",
    "term": "Estado hiperosmolar",
    "short": "Descompensación hiperglucémica con hiperosmolaridad severa y poca cetosis.",
    "category": "Urgencias",
    "definition": "Descompensación hiperglucémica con hiperosmolaridad severa y poca cetosis.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece estado hiperosmolar.",
    "example": "Ante estado hiperosmolar, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "crisis-hipertensiva",
    "term": "Crisis hipertensiva",
    "short": "Elevación aguda de la presión arterial con o sin daño de órgano blanco.",
    "category": "Urgencias",
    "definition": "Elevación aguda de la presión arterial con o sin daño de órgano blanco.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece crisis hipertensiva.",
    "example": "Ante crisis hipertensiva, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "urgencia-hipertensiva",
    "term": "Urgencia hipertensiva",
    "short": "Elevación marcada de presión arterial sin daño agudo evidente de órgano.",
    "category": "Urgencias",
    "definition": "Elevación marcada de presión arterial sin daño agudo evidente de órgano.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece urgencia hipertensiva.",
    "example": "Ante urgencia hipertensiva, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "emergencia-hipertensiva",
    "term": "Emergencia hipertensiva",
    "short": "Elevación marcada de presión arterial con daño agudo de órgano blanco.",
    "category": "Urgencias",
    "definition": "Elevación marcada de presión arterial con daño agudo de órgano blanco.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece emergencia hipertensiva.",
    "example": "Ante emergencia hipertensiva, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "sindrome-aortico-agudo",
    "term": "Síndrome aórtico agudo",
    "short": "Conjunto de cuadros como disección aórtica y hematoma intramural.",
    "category": "Urgencias",
    "definition": "Conjunto de cuadros como disección aórtica y hematoma intramural.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece síndrome aórtico agudo.",
    "example": "Ante síndrome aórtico agudo, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "tromboembolismo-pulmonar",
    "term": "Tromboembolismo pulmonar",
    "short": "Obstrucción de arterias pulmonares por trombos.",
    "category": "Urgencias",
    "definition": "Obstrucción de arterias pulmonares por trombos.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece tromboembolismo pulmonar.",
    "example": "Ante tromboembolismo pulmonar, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "ictus-agudo",
    "term": "Ictus agudo",
    "short": "Evento neurológico súbito de origen vascular con ventana terapéutica dependiente del tiempo.",
    "category": "Urgencias",
    "definition": "Evento neurológico súbito de origen vascular con ventana terapéutica dependiente del tiempo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece ictus agudo.",
    "example": "Ante ictus agudo, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "codigo-sepsis",
    "term": "Código sepsis",
    "short": "Activación institucional para manejo precoz de sepsis.",
    "category": "Urgencias",
    "definition": "Activación institucional para manejo precoz de sepsis.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece código sepsis.",
    "example": "Ante código sepsis, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "codigo-infarto",
    "term": "Código infarto",
    "short": "Activación rápida para atención del síndrome coronario agudo.",
    "category": "Urgencias",
    "definition": "Activación rápida para atención del síndrome coronario agudo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece código infarto.",
    "example": "Ante código infarto, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "codigo-ictus",
    "term": "Código ictus",
    "short": "Activación rápida para atención del accidente cerebrovascular agudo.",
    "category": "Urgencias",
    "definition": "Activación rápida para atención del accidente cerebrovascular agudo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece código ictus.",
    "example": "Ante código ictus, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "fast",
    "term": "FAST",
    "short": "Herramienta de reconocimiento rápido de ictus mediante cara, brazo, habla y tiempo.",
    "category": "Urgencias",
    "definition": "Herramienta de reconocimiento rápido de ictus mediante cara, brazo, habla y tiempo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece fast.",
    "example": "Ante fast, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "qsofa",
    "term": "qSOFA",
    "short": "Escala rápida para identificar riesgo de mal pronóstico en infección.",
    "category": "Urgencias",
    "definition": "Escala rápida para identificar riesgo de mal pronóstico en infección.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece qsofa.",
    "example": "Ante qsofa, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "news",
    "term": "NEWS",
    "short": "Puntaje basado en signos vitales para detectar deterioro clínico.",
    "category": "Urgencias",
    "definition": "Puntaje basado en signos vitales para detectar deterioro clínico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece news.",
    "example": "Ante news, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "abcde",
    "term": "ABCDE",
    "short": "Secuencia sistemática de valoración de vía aérea, respiración, circulación, déficit neurológico y exposición.",
    "category": "Urgencias",
    "definition": "Secuencia sistemática de valoración de vía aérea, respiración, circulación, déficit neurológico y exposición.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece abcde.",
    "example": "Ante abcde, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "estabilizacion-hemodinamica",
    "term": "Estabilización hemodinámica",
    "short": "Conjunto de medidas dirigidas a recuperar perfusión adecuada.",
    "category": "Urgencias",
    "definition": "Conjunto de medidas dirigidas a recuperar perfusión adecuada.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece estabilización hemodinámica.",
    "example": "Ante estabilización hemodinámica, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "sedoanalgesia",
    "term": "Sedoanalgesia",
    "short": "Uso combinado de sedación y analgesia durante procedimientos o urgencias.",
    "category": "Urgencias",
    "definition": "Uso combinado de sedación y analgesia durante procedimientos o urgencias.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece sedoanalgesia.",
    "example": "Ante sedoanalgesia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "inmovilizacion-cervical",
    "term": "Inmovilización cervical",
    "short": "Medida para limitar movimiento cervical ante trauma sospechoso.",
    "category": "Urgencias",
    "definition": "Medida para limitar movimiento cervical ante trauma sospechoso.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece inmovilización cervical.",
    "example": "Ante inmovilización cervical, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "intoxicacion-aguda",
    "term": "Intoxicación aguda",
    "short": "Síndrome por exposición reciente a una sustancia tóxica.",
    "category": "Urgencias",
    "definition": "Síndrome por exposición reciente a una sustancia tóxica.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece intoxicación aguda.",
    "example": "Ante intoxicación aguda, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "sindrome-anticolinergico",
    "term": "Síndrome anticolinérgico",
    "short": "Conjunto de hallazgos por bloqueo muscarínico agudo.",
    "category": "Urgencias",
    "definition": "Conjunto de hallazgos por bloqueo muscarínico agudo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece síndrome anticolinérgico.",
    "example": "Ante síndrome anticolinérgico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "sindrome-serotoninergico",
    "term": "Síndrome serotoninérgico",
    "short": "Exceso de actividad serotoninérgica con alteraciones neuromusculares y autonómicas.",
    "category": "Urgencias",
    "definition": "Exceso de actividad serotoninérgica con alteraciones neuromusculares y autonómicas.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece síndrome serotoninérgico.",
    "example": "Ante síndrome serotoninérgico, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "golpe-de-calor",
    "term": "Golpe de calor",
    "short": "Hipertermia grave con disfunción del sistema nervioso central.",
    "category": "Urgencias",
    "definition": "Hipertermia grave con disfunción del sistema nervioso central.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece golpe de calor.",
    "example": "Ante golpe de calor, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipotermia-accidental",
    "term": "Hipotermia accidental",
    "short": "Descenso involuntario de la temperatura corporal central.",
    "category": "Urgencias",
    "definition": "Descenso involuntario de la temperatura corporal central.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipotermia accidental.",
    "example": "Ante hipotermia accidental, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "ahogamiento",
    "term": "Ahogamiento",
    "short": "Compromiso respiratorio por sumersión o inmersión en líquido.",
    "category": "Urgencias",
    "definition": "Compromiso respiratorio por sumersión o inmersión en líquido.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece ahogamiento.",
    "example": "Ante ahogamiento, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "quemadura",
    "term": "Quemadura",
    "short": "Lesión térmica, química, eléctrica o radiante de tejidos.",
    "category": "Urgencias",
    "definition": "Lesión térmica, química, eléctrica o radiante de tejidos.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece quemadura.",
    "example": "Ante quemadura, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "status-asmatico",
    "term": "Status asmático",
    "short": "Exacerbación asmática grave que no responde al manejo inicial habitual.",
    "category": "Urgencias",
    "definition": "Exacerbación asmática grave que no responde al manejo inicial habitual.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece status asmático.",
    "example": "Ante status asmático, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "edema-laringeo",
    "term": "Edema laríngeo",
    "short": "Aumento de volumen en laringe con riesgo de obstrucción aérea.",
    "category": "Urgencias",
    "definition": "Aumento de volumen en laringe con riesgo de obstrucción aérea.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece edema laríngeo.",
    "example": "Ante edema laríngeo, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "obstruccion-de-via-aerea",
    "term": "Obstrucción de vía aérea",
    "short": "Interrupción parcial o completa del flujo aéreo.",
    "category": "Urgencias",
    "definition": "Interrupción parcial o completa del flujo aéreo.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece obstrucción de vía aérea.",
    "example": "Ante obstrucción de vía aérea, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "reanimacion-con-fluidos",
    "term": "Reanimación con fluidos",
    "short": "Administración rápida de soluciones para restaurar volumen circulante.",
    "category": "Urgencias",
    "definition": "Administración rápida de soluciones para restaurar volumen circulante.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece reanimación con fluidos.",
    "example": "Ante reanimación con fluidos, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "transfusion-masiva",
    "term": "Transfusión masiva",
    "short": "Estrategia de reposición sanguínea en hemorragia grave.",
    "category": "Urgencias",
    "definition": "Estrategia de reposición sanguínea en hemorragia grave.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece transfusión masiva.",
    "example": "Ante transfusión masiva, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipertension-intracraneal",
    "term": "Hipertensión intracraneal",
    "short": "Elevación de la presión dentro del cráneo con riesgo de herniación.",
    "category": "Urgencias",
    "definition": "Elevación de la presión dentro del cráneo con riesgo de herniación.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipertensión intracraneal.",
    "example": "Ante hipertensión intracraneal, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "neumotorax-a-tension",
    "term": "Neumotórax a tensión",
    "short": "Neumotórax con aumento progresivo de presión intratorácica y colapso hemodinámico.",
    "category": "Urgencias",
    "definition": "Neumotórax con aumento progresivo de presión intratorácica y colapso hemodinámico.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece neumotórax a tensión.",
    "example": "Ante neumotórax a tensión, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "taponamiento-cardiaco",
    "term": "Taponamiento cardíaco",
    "short": "Compresión del corazón por líquido en el pericardio.",
    "category": "Urgencias",
    "definition": "Compresión del corazón por líquido en el pericardio.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece taponamiento cardíaco.",
    "example": "Ante taponamiento cardíaco, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "codigo-trauma",
    "term": "Código trauma",
    "short": "Activación hospitalaria para atención organizada del paciente traumatizado.",
    "category": "Urgencias",
    "definition": "Activación hospitalaria para atención organizada del paciente traumatizado.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece código trauma.",
    "example": "Ante código trauma, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "crisis-convulsiva-febril",
    "term": "Crisis convulsiva febril",
    "short": "Convulsión asociada a fiebre, frecuente en la edad pediátrica.",
    "category": "Urgencias",
    "definition": "Convulsión asociada a fiebre, frecuente en la edad pediátrica.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece crisis convulsiva febril.",
    "example": "Ante crisis convulsiva febril, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "torniquete",
    "term": "Torniquete",
    "short": "Dispositivo o técnica para controlar hemorragia externa severa en extremidades.",
    "category": "Urgencias",
    "definition": "Dispositivo o técnica para controlar hemorragia externa severa en extremidades.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece torniquete.",
    "example": "Ante torniquete, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "analgesia-de-urgencia",
    "term": "Analgesia de urgencia",
    "short": "Control temprano del dolor como parte del abordaje inicial.",
    "category": "Urgencias",
    "definition": "Control temprano del dolor como parte del abordaje inicial.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece analgesia de urgencia.",
    "example": "Ante analgesia de urgencia, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "disnea-subita",
    "term": "Disnea súbita",
    "short": "Dificultad respiratoria de inicio abrupto que requiere valoración inmediata.",
    "category": "Urgencias",
    "definition": "Dificultad respiratoria de inicio abrupto que requiere valoración inmediata.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece disnea súbita.",
    "example": "Ante disnea súbita, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "dolor-toracico-tiempo-dependiente",
    "term": "Dolor torácico tiempo-dependiente",
    "short": "Dolor torácico con posibilidad de etiología que exige intervención rápida.",
    "category": "Urgencias",
    "definition": "Dolor torácico con posibilidad de etiología que exige intervención rápida.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece dolor torácico tiempo-dependiente.",
    "example": "Ante dolor torácico tiempo-dependiente, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  },
  {
    "id": "hipoperfusion",
    "term": "Hipoperfusión",
    "short": "Disminución de flujo sanguíneo efectivo hacia los tejidos.",
    "category": "Urgencias",
    "definition": "Disminución de flujo sanguíneo efectivo hacia los tejidos.",
    "clinicalUse": "Su reconocimiento precoz cambia la prioridad de atención y el escalamiento inicial cuando aparece hipoperfusión.",
    "example": "Ante hipoperfusión, se revaloran signos vitales, ABCDE y necesidad de intervención inmediata.",
    "related": [
      "Triage",
      "Estabilización",
      "Red flags"
    ]
  }
];
