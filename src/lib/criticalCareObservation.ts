import type { MonitoringKey, SimulationState, Vitals } from "./criticalCareSimulation";

export const MONITORING_OPTIONS: { key: MonitoringKey; label: string; detail: string }[] = [
  { key: "ecg", label: "ECG y frecuencia cardíaca", detail: "Conectar electrodos al monitor cardíaco." },
  { key: "bp", label: "Presión arterial", detail: "Colocar el manguito e iniciar vigilancia de PA." },
  { key: "spo2", label: "Saturación de oxígeno", detail: "Conectar el pulsioxímetro." },
  { key: "rr", label: "Frecuencia respiratoria", detail: "Iniciar vigilancia de la respiración." },
  { key: "temperature", label: "Temperatura", detail: "Conectar la medición de temperatura." },
  { key: "etco2", label: "Capnografía · EtCO₂", detail: "Conectar el sensor de CO₂ espirado." },
];
export const vitalSensor: Partial<Record<keyof Vitals, MonitoringKey>> = { hr: "ecg", sbp: "bp", dbp: "bp", spo2: "spo2", rr: "rr", temperature: "temperature", etco2: "etco2" };
export type ObservationState = Pick<SimulationState, "monitoring"> & { vitals: Partial<Vitals> };
export function sensorConnected(state: Pick<SimulationState, "monitoring">, key: MonitoringKey) { return state.monitoring[key] !== undefined; }
export function observedVital(state: ObservationState, key: keyof Vitals): number | null {
  const sensor = vitalSensor[key];
  return sensor && sensorConnected(state, sensor) ? state.vitals[key] ?? null : null;
}
export const patientProfiles: Record<SimulationState["scenario"], { age: number; weight: number; height: number; setting: string; difficulty: string }> = {
  ventilation: { age: 58, weight: 78, height: 172, setting: "Unidad de cuidados intensivos", difficulty: "Avanzado" },
  stroke: { age: 68, weight: 84, height: 175, setting: "Servicio de urgencias", difficulty: "Avanzado" },
  asthma: { age: 48, weight: 76, height: 174, setting: "Sala de atención inmediata", difficulty: "Intermedio" },
  sepsis: { age: 64, weight: 82, height: 170, setting: "Servicio de urgencias", difficulty: "Avanzado" },
  anaphylaxis: { age: 45, weight: 80, height: 178, setting: "Sala de reanimación", difficulty: "Avanzado" },
  hypoglycemia: { age: 52, weight: 86, height: 173, setting: "Servicio de urgencias", difficulty: "Intermedio" },
  obstetric: { age: 27, weight: 70, height: 163, setting: "Unidad obstétrica", difficulty: "Avanzado" },
};
