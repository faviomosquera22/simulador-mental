import { NextResponse } from "next/server";

import { generateUltrasoundImage } from "@/src/lib/ultrasoundImageGeneration";
import { enforceRateLimit, requireAuthenticatedUser } from "@/src/lib/serverGuards";

const RATE_LIMIT_WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60_000);
const RATE_LIMIT_ULTRASOUND_IMAGE = Number(process.env.AI_RATE_LIMIT_ULTRASOUND_IMAGE ?? 4);

function validateCaseSet(input: any) {
  if (!input || typeof input !== "object") return "Falta caseSet.";
  if (!String(input.title ?? "").trim()) return "Falta el titulo del caso.";
  if (!String(input.category ?? "").trim()) return "Falta la categoria.";
  if (!String(input.subcategory ?? "").trim()) return "Falta la subcategoria.";
  if (!String(input.clinicalSummary ?? "").trim()) return "Falta el resumen clinico.";
  if (!String(input.scanPlane ?? "").trim()) return "Falta el plano ecografico.";
  if (!String(input.correctAnswer ?? "").trim()) return "Falta la interpretacion esperada.";
  if (!Array.isArray(input.keyFindings) || input.keyFindings.length === 0) return "Faltan hallazgos clave.";
  if (!input.patientProfile || typeof input.patientProfile !== "object") return "Falta el perfil del paciente.";
  if (!String(input.patientProfile.chiefComplaint ?? "").trim()) return "Falta el motivo principal.";
  return null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) return auth.response;

    const limited = enforceRateLimit({
      key: `ultrasound-image:${auth.data.userId}`,
      limit:
        Number.isFinite(RATE_LIMIT_ULTRASOUND_IMAGE) && RATE_LIMIT_ULTRASOUND_IMAGE > 0
          ? RATE_LIMIT_ULTRASOUND_IMAGE
          : 4,
      windowMs:
        Number.isFinite(RATE_LIMIT_WINDOW_MS) && RATE_LIMIT_WINDOW_MS >= 1_000
          ? RATE_LIMIT_WINDOW_MS
          : 60_000,
    });
    if (!limited.ok) return limited.response;

    const body = await req.json();
    const caseSet = body?.caseSet;

    const validationError = validateCaseSet(caseSet);
    if (validationError) {
      return NextResponse.json({ detail: validationError }, { status: 400 });
    }

    const generated = await generateUltrasoundImage({
      input: {
        title: String(caseSet.title),
        category: caseSet.category,
        subcategory: String(caseSet.subcategory),
        clinicalSummary: String(caseSet.clinicalSummary),
        scanPlane: String(caseSet.scanPlane),
        keyFindings: caseSet.keyFindings.map((item: unknown) => String(item)).slice(0, 6),
        correctAnswer: String(caseSet.correctAnswer),
        patientProfile: {
          age: Number(caseSet?.patientProfile?.age ?? 0),
          sex: caseSet?.patientProfile?.sex,
          chiefComplaint: String(caseSet?.patientProfile?.chiefComplaint ?? ""),
          gestationalAgeWeeks:
            typeof caseSet?.patientProfile?.gestationalAgeWeeks === "number"
              ? caseSet.patientProfile.gestationalAgeWeeks
              : undefined,
        },
      },
    });

    return NextResponse.json(generated);
  } catch (error: any) {
    const status = Number(error?.status ?? NaN);
    const detail = String(error?.message ?? "Error generando imagen de ultrasonido.");

    if (status === 429) {
      return NextResponse.json(
        {
          code: "RATE_LIMIT",
          detail: "Se alcanzo un limite del proveedor de IA. Intenta nuevamente en unos segundos.",
        },
        { status: 429 }
      );
    }

    if (status === 401 || status === 403) {
      return NextResponse.json(
        {
          code: "IMAGE_PROVIDER_AUTH",
          detail: "La configuracion del proveedor de imagen no es valida en este momento.",
        },
        { status: 503 }
      );
    }

    if (status === 400) {
      return NextResponse.json(
        {
          code: "IMAGE_PROVIDER_BAD_REQUEST",
          detail,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        code: "ULTRASOUND_IMAGE_ERROR",
        detail,
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
