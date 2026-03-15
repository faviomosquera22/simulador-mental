import "server-only";

import type { AdvancedPatientProfile } from "./advancedModuleUtils";
import type { UltrasoundCategory } from "./ultrasoundModule";

export type UltrasoundImageInput = {
  title: string;
  category: UltrasoundCategory;
  subcategory: string;
  clinicalSummary: string;
  scanPlane: string;
  keyFindings: string[];
  correctAnswer: string;
  patientProfile: Pick<AdvancedPatientProfile, "age" | "sex" | "chiefComplaint" | "gestationalAgeWeeks">;
};

export type GeneratedUltrasoundImage = {
  imageDataUrl: string;
  mimeType: string;
  prompt: string;
  modelUsed: string;
  providerText: string;
};

function sexLabel(value: string | undefined) {
  if (value === "female") return "female";
  if (value === "male") return "male";
  return "unspecified sex";
}

function categoryDirective(input: UltrasoundImageInput) {
  if (input.category === "obstetricia") {
    const weeks = input.patientProfile.gestationalAgeWeeks
      ? ` around ${input.patientProfile.gestationalAgeWeeks} weeks`
      : "";
    return [
      `Produce a transabdominal obstetric ultrasound B-mode frame${weeks}.`,
      "Show uterine context and fetal structures with realistic sonographic speckle.",
      "If the case implies viability, include a visible fetal pole or fetus within the gestational context.",
      "If the case implies breech presentation, place the fetal head toward the upper uterine segment and pelvis toward the cervix.",
    ].join(" ");
  }

  if (input.category === "cardiaca") {
    return [
      "Produce a focused echocardiography frame in grayscale B-mode.",
      "Use a realistic sector probe appearance and cardiac chamber silhouettes.",
      "If the case is pericardial effusion, include an anechoic rim around the heart.",
      "If the case is low ejection fraction, show a dilated left ventricle with minimal contraction.",
    ].join(" ");
  }

  if (input.category === "renal") {
    return [
      "Produce a longitudinal renal ultrasound frame in grayscale B-mode.",
      "Show renal contour, cortex, sinus, and collecting system with realistic acoustic texture.",
      "Include dilated anechoic calyces and pelvis when hydronephrosis is described.",
    ].join(" ");
  }

  return [
    "Produce a right upper quadrant hepatobiliary ultrasound frame in grayscale B-mode.",
    "Show a realistic gallbladder lumen and surrounding hepatic parenchyma.",
    "If cholelithiasis is described, include bright echogenic stones with posterior acoustic shadowing.",
  ].join(" ");
}

export function buildUltrasoundImagePrompt(input: UltrasoundImageInput) {
  const findings = input.keyFindings.slice(0, 4).join(", ");
  const patientLine = `Patient context: ${input.patientProfile.age}-year-old ${sexLabel(input.patientProfile.sex)} with complaint "${input.patientProfile.chiefComplaint}".`;
  const gestationalLine =
    typeof input.patientProfile.gestationalAgeWeeks === "number"
      ? `Gestational age: ${input.patientProfile.gestationalAgeWeeks} weeks.`
      : "";

  return [
    "Create a synthetic diagnostic ultrasound image for nursing and medical education.",
    "The image must look like a raw grayscale B-mode ultrasound frame, not an illustration or infographic.",
    "No labels, no letters, no measurements, no UI overlay, no split screen, no arrows, no decorative elements.",
    "Realistic ultrasound grain, attenuation, soft blur, and clinically plausible anatomy.",
    categoryDirective(input),
    patientLine,
    gestationalLine,
    `Study plane: ${input.scanPlane}.`,
    `Case title: ${input.title}.`,
    `Clinical context: ${input.clinicalSummary}.`,
    `Expected main interpretation: ${input.correctAnswer}.`,
    `Important sonographic findings to depict: ${findings}.`,
    `Subcategory: ${input.subcategory.replaceAll("_", " ")}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function extractImagePart(payload: any) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const inline = part?.inlineData ?? part?.inline_data;
      const data = inline?.data;
      const mimeType = inline?.mimeType ?? inline?.mime_type;
      if (data && typeof data === "string" && mimeType && String(mimeType).startsWith("image/")) {
        return { data, mimeType: String(mimeType) };
      }
    }
  }

  return null;
}

function extractTextParts(payload: any) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const texts: string[] = [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === "string" && part.text.trim()) {
        texts.push(part.text.trim());
      }
    }
  }

  return texts.join("\n").trim();
}

export async function generateUltrasoundImage(args: {
  input: UltrasoundImageInput;
  model?: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("missing_GEMINI_API_KEY");

  const modelUsed = args.model || process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const prompt = buildUltrasoundImagePrompt(args.input);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelUsed}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `gemini_image_error_${response.status}`;
    const error = new Error(String(message));
    (error as any).status = response.status;
    throw error;
  }

  const imagePart = extractImagePart(payload);
  const providerText = extractTextParts(payload);

  if (!imagePart) {
    const error = new Error(providerText || "gemini_image_missing_inline_data");
    (error as any).status = 502;
    throw error;
  }

  return {
    imageDataUrl: `data:${imagePart.mimeType};base64,${imagePart.data}`,
    mimeType: imagePart.mimeType,
    prompt,
    modelUsed,
    providerText,
  } satisfies GeneratedUltrasoundImage;
}
