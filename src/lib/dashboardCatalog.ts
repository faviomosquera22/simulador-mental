export type DashboardModuleGroup = "simulacion" | "diagnostico" | "practica" | "seguimiento";

export type DashboardModuleMeta = {
  id: string;
  label: string;
  href: string;
  group: DashboardModuleGroup;
  summary: string;
  accent: string;
  count?: number;
  countLabel?: string;
  status: string;
  highlight?: boolean;
};

export const DASHBOARD_MODULES: DashboardModuleMeta[] = [
  {
    id: "mental-sim",
    label: "Trastornos mentales",
    href: "/cases",
    group: "simulacion",
    summary: "Casos narrativos con entrevista, seguridad, MSE y cierre clínico.",
    accent: "from-cyan-500/18 via-sky-500/8 to-transparent",
    status: "Simulación longitudinal",
    highlight: true,
  },
  {
    id: "pathologies",
    label: "Patologías",
    href: "/medical-cases",
    group: "simulacion",
    summary: "Escenarios clínicos generales para razonamiento por especialidad.",
    accent: "from-blue-500/18 via-indigo-500/8 to-transparent",
    status: "Casos estructurados",
  },
  {
    id: "urgencies",
    label: "Urgencias",
    href: "/emergency-simulator",
    group: "simulacion",
    summary: "Escenarios breves con decisiones por pasos, tiempo y evolución clínica.",
    accent: "from-red-500/18 via-orange-500/10 to-transparent",
    count: 120,
    countLabel: "escenarios",
    status: "Nuevo banco ampliado",
    highlight: true,
  },
  {
    id: "triage",
    label: "Triage por carrera",
    href: "/triage-simulator",
    group: "simulacion",
    summary: "Priorización inicial, seguridad y tiempo de respuesta por rol.",
    accent: "from-amber-500/18 via-yellow-500/8 to-transparent",
    status: "Entrenamiento rápido",
  },
  {
    id: "ecg",
    label: "Simulador de ECG",
    href: "/ecg-simulator",
    group: "diagnostico",
    summary: "Monitor, 12 derivaciones y toma de conducta dentro del caso.",
    accent: "from-emerald-500/18 via-teal-500/10 to-transparent",
    status: "Simulación visual clínica",
    highlight: true,
  },
  {
    id: "laboratory",
    label: "Laboratorio",
    href: "/laboratory",
    group: "diagnostico",
    summary: "Interpretación de resultados, hallazgos principales y conducta inicial.",
    accent: "from-fuchsia-500/16 via-pink-500/8 to-transparent",
    status: "Integrado a casos",
  },
  {
    id: "gasometry",
    label: "Gasometría",
    href: "/gasometry",
    group: "diagnostico",
    summary: "Acidosis, alcalosis, origen, compensación y correlación clínica.",
    accent: "from-violet-500/16 via-sky-500/8 to-transparent",
    count: 120,
    countLabel: "gasometrías",
    status: "Nuevo banco ampliado",
    highlight: true,
  },
  {
    id: "calculations",
    label: "Cálculo clínico",
    href: "/clinical-calculations",
    group: "practica",
    summary: "Dosis, goteo, balance hídrico, IMC y calculadora integrada.",
    accent: "from-cyan-500/16 via-blue-500/8 to-transparent",
    status: "Práctica con validación",
  },
  {
    id: "medications",
    label: "Medicamentos",
    href: "/medications",
    group: "practica",
    summary: "Verificación segura, vía, dosis, volumen y justificación clínica.",
    accent: "from-lime-500/16 via-emerald-500/8 to-transparent",
    count: 120,
    countLabel: "casos",
    status: "Nuevo banco ampliado",
    highlight: true,
  },
  {
    id: "procedures",
    label: "Procedimientos",
    href: "/procedures",
    group: "practica",
    summary: "Materiales, secuencia de pasos y decisiones críticas del procedimiento.",
    accent: "from-orange-500/16 via-amber-500/8 to-transparent",
    count: 120,
    countLabel: "procedimientos",
    status: "Nuevo banco ampliado",
    highlight: true,
  },
  {
    id: "notes",
    label: "Notas clínicas",
    href: "/clinical-notes",
    group: "practica",
    summary: "Nota de enfermería, SOAPIE, Kardex, turno e incidentes.",
    accent: "from-sky-500/16 via-cyan-500/8 to-transparent",
    count: 120,
    countLabel: "plantillas",
    status: "Nuevo banco ampliado",
    highlight: true,
  },
  {
    id: "pae",
    label: "PAE",
    href: "/pae",
    group: "practica",
    summary: "Valoración, NANDA, NOC, NIC, indicadores y estructura final.",
    accent: "from-purple-500/16 via-fuchsia-500/8 to-transparent",
    status: "Flujo guiado y autónomo",
  },
  {
    id: "caces",
    label: "CACES",
    href: "/caces",
    group: "seguimiento",
    summary: "Banco de preguntas para examen, práctica rápida y análisis de temas débiles.",
    accent: "from-slate-400/16 via-slate-200/8 to-transparent",
    status: "Banco de preguntas",
  },
];

export const DASHBOARD_GROUP_LABELS: Record<DashboardModuleGroup, string> = {
  simulacion: "Simulación",
  diagnostico: "Diagnóstico",
  practica: "Práctica clínica",
  seguimiento: "Seguimiento",
};

export const DASHBOARD_NEW_BANK_TOTAL = DASHBOARD_MODULES.reduce((acc, item) => acc + (item.count ?? 0), 0);

export const DASHBOARD_NEW_MODULES = DASHBOARD_MODULES.filter((item) => item.highlight && typeof item.count === "number");
