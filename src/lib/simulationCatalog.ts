import { DASHBOARD_MODULES, type DashboardModuleMeta, type DashboardModuleGroup } from "./dashboardCatalog";

export const SIMULATION_CAREERS = [
  { id: "enfermeria", label: "Enfermería", description: "Valoración, cuidados, procedimientos y continuidad de la atención.", color: "#327468" },
  { id: "medicina", label: "Medicina", description: "Entrevista clínica, razonamiento diagnóstico y decisiones de manejo.", color: "#42699a" },
  { id: "psicologia", label: "Psicología", description: "Entrevista, apoyo en crisis y evaluación de necesidades psicológicas.", color: "#84649d" },
] as const;
export type SimulationCareer = typeof SIMULATION_CAREERS[number]["id"];

/** Organization for learning, not permissions or proof of professional competence. */
export const CAREER_MODULE_IDS: Record<SimulationCareer, readonly string[]> = {
  enfermeria: ["gastrointestinal", "basic-care", "critical-care", "clinical-room", "pathologies", "urgencies", "triage", "materno-infantil", "dynamic-simulator", "rcp-algorithms", "ecg", "laboratory", "gasometry", "clinical-images", "calculations", "medical-terminology", "medications", "procedures", "notes", "pae", "pae-assistant", "caces"],
  medicina: ["pathologies", "critical-care", "clinical-room", "mental-sim", "urgencies", "triage", "materno-infantil", "dynamic-simulator", "rcp-algorithms", "ecg", "ultrasound", "laboratory", "gasometry", "clinical-images", "calculations", "medical-terminology", "medications", "procedures", "caces"],
  psicologia: ["psychological-first-aid", "mental-sim", "triage", "caces"],
};
export const CATALOG_GROUPS: { id: DashboardModuleGroup; label: string; description: string }[] = [
  { id: "simulacion", label: "Casos y escenarios", description: "Practica la valoración, la entrevista y las decisiones del caso." },
  { id: "avanzado", label: "Atención integrada", description: "Integra decisiones en escenarios y poblaciones específicas." },
  { id: "diagnostico", label: "Estudios e interpretación", description: "Explora hallazgos y su relación con el escenario clínico." },
  { id: "practica", label: "Habilidades y documentación", description: "Entrena técnicas, seguridad y registro de la atención." },
  { id: "seguimiento", label: "Preparación y evaluación", description: "Consolida conocimientos y revisa tu preparación académica." },
];
export const careerCatalogHref = (career: SimulationCareer) => `/simulation-hub/${career}`;
export const moduleCareers = (id: string) => SIMULATION_CAREERS.filter(career => CAREER_MODULE_IDS[career.id].includes(id));
export function isSimulationCareer(value: string): value is SimulationCareer { return SIMULATION_CAREERS.some(career => career.id === value); }
export function modulesForCareer(career: SimulationCareer, query = ""): DashboardModuleMeta[] {
  const normalized = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  const words = normalized(query).split(/\s+/).filter(Boolean);
  return CAREER_MODULE_IDS[career].map(id => DASHBOARD_MODULES.find(module => module.id === id)!).filter(module => module && words.every(word => normalized(`${module.label} ${module.summary} ${CATALOG_GROUPS.find(group => group.id === module.group)?.label}`).includes(word)));
}
