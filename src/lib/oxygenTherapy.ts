export const OXYGEN_DEVICES = {
  cannula: { label: "Cánula nasal", min: 1, max: 6, initial: 2 },
  mask: { label: "Mascarilla simple", min: 5, max: 10, initial: 5 },
  reservoir: { label: "Mascarilla con reservorio", min: 10, max: 15, initial: 15 },
} as const;
export type OxygenTherapy = { device: keyof typeof OXYGEN_DEVICES; flow: number };
export function validOxygen(value: OxygenTherapy) {
  const device = OXYGEN_DEVICES[value.device];
  return !!device && Number.isFinite(value.flow) && value.flow >= device.min && value.flow <= device.max && Number.isInteger(value.flow * 2);
}
/** Qualitative scenario response, not a measured FiO2 or a physiological prediction. */
export function oxygenSupport(value: OxygenTherapy | null) {
  if (!value) return 0;
  return Math.min(1, value.device === "cannula" ? value.flow / 4 : value.device === "mask" ? value.flow / 8 : value.flow / 15);
}
