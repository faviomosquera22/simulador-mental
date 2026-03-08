import type { AgeGroup, SpeakerRole } from "./types";

export function deriveAgeGroup(caseObject: any): AgeGroup {
  const meta = caseObject?.meta ?? {};
  const raw = String(
    meta?.age_group ??
      meta?.case_age_group ??
      caseObject?.age_group ??
      caseObject?.case_age_group ??
      ""
  )
    .toLowerCase()
    .trim();

  if (raw === "child" || raw === "children" || raw === "niño" || raw === "nino") return "child";
  if (raw === "adolescent" || raw === "adolescente") return "adolescent";
  if (raw === "mixed" || raw === "mixto") return "mixed";

  const age = Number(
    caseObject?.patient_profile?.age ??
      caseObject?.patient?.age ??
      meta?.age ??
      caseObject?.age
  );

  if (Number.isFinite(age) && age < 13) return "child";
  if (Number.isFinite(age) && age < 18) return "adolescent";
  return "adult";
}

export function isPediatricCase(caseObject: any) {
  const group = deriveAgeGroup(caseObject);
  return group === "child" || group === "adolescent";
}

export function normalizeSpeakerRole(input: string | undefined | null): SpeakerRole {
  const v = String(input ?? "").toLowerCase().trim();
  if (v === "caregiver" || v === "acompanante" || v === "acompañante") return "caregiver";
  if (v === "both" || v === "ambos") return "both";
  return "patient";
}

export function pediatricExplorationChecklist() {
  return [
    "Desarrollo (hitos, lenguaje, regulación emocional).",
    "Escolaridad y rendimiento.",
    "Conducta en casa y en escuela.",
    "Sueño y alimentación.",
    "Socialización y pares.",
    "Antecedentes perinatales/familiares.",
  ];
}

