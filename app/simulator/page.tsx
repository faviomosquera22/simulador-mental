"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { addSession, type EndReason } from "../../lib/history";
import { getAuthFetchHeaders } from "@/src/lib/clientAuth";
import {
  getScalesByDomain,
  getTestsByDomain,
  getScaleById,
  getTestById,
  scoreScale,
  scoreTest,
} from "@/src/lib/assessments";
import { getBatteriesByDomain, getBatteryById } from "@/src/lib/batteries";
import {
  getMedicalExamById,
  getMedicalExamsForCase,
  runMedicalExam,
  type MedicalExamResult,
} from "@/src/lib/medicalExams";
import {
  deriveAgeGroup,
  isPediatricCase,
  normalizeSpeakerRole,
  pediatricExplorationChecklist,
} from "@/src/lib/clinicalRuntime";
import type {
  ActiveInstrumentContext,
  BatterySession,
  BatteryStepResult,
  ScaleAnswer,
  ScaleSession,
  SpeakerRole,
  TestAnswer,
  TestSession,
} from "@/src/lib/types";

type TranscriptTurn = { role: "user" | "patient" | "caregiver" | "tutor"; content: string; kind?: "tip" | "alert" };
type ApproachValue = "humanistic" | "cbt" | "psychodynamic" | "systemic";
type RiskWorkflowKind =
  | "medical_alert_checklist"
  | "medical_stabilization_plan"
  | "mental_cssrs"
  | "mental_safety_plan";
type RiskWorkflowEntry = {
  id: string;
  kind: RiskWorkflowKind;
  title: string;
  summary: string;
  items: string[];
  caution: string;
  created_at: string;
};





function chipClass(f: string) {
  const key = String(f).toLowerCase();
  // Chips por prioridad (educativo, no diagnóstico)
  if (key.includes("risk") || key.includes("suic") || key.includes("self") || key.includes("harm")) {
    return "border-red-400/25 bg-red-400/10 text-red-100";
  }
  if (key.includes("panic") || key.includes("anx") || key.includes("agitat")) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  }
  if (key.includes("sleep") || key.includes("insom")) {
    return "border-sky-400/25 bg-sky-400/10 text-sky-100";
  }
  return "border-white/15 bg-white/5 text-white/80";
}

function prettyFlag(f: string) {
  const cleaned = String(f).replace(/[_-]+/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";
}

function flagCategory(f: string):
  | "Riesgo"
  | "Ansiedad"
  | "Sueño"
  | "Ánimo"
  | "Funcionamiento"
  | "Otros" {
  const key = String(f).toLowerCase();

  // Riesgo (educativo): señales que sugieren explorar seguridad
  if (key.includes("risk") || key.includes("suic") || key.includes("self") || key.includes("harm") || key.includes("safety")) {
    return "Riesgo";
  }

  // Ansiedad / activación
  if (key.includes("anx") || key.includes("panic") || key.includes("agitat") || key.includes("worry") || key.includes("tension")) {
    return "Ansiedad";
  }

  // Sueño
  if (key.includes("sleep") || key.includes("insom") || key.includes("night") || key.includes("dream") || key.includes("fatigue")) {
    return "Sueño";
  }

  // Ánimo
  if (key.includes("sad") || key.includes("depress") || key.includes("mood") || key.includes("hopeless") || key.includes("anhedon")) {
    return "Ánimo";
  }

  // Funcionamiento / vida diaria
  if (key.includes("work") || key.includes("school") || key.includes("function") || key.includes("daily") || key.includes("social") || key.includes("family") || key.includes("appetite")) {
    return "Funcionamiento";
  }

  return "Otros";
}

function makeSessionId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.floor(Math.random() * 10_000)}`;
}

function AvatarFace({
  state,
  intensity,
}: {
  state: string;
  intensity: number;
}) {
  const t = Number.isFinite(intensity) ? Math.max(0, Math.min(100, intensity)) : 0;
  const k = t / 100;

  // Rasgos simples por estado (SVG). No es arte final; es un “rig” básico para expresiones.
  const cfg = (() => {
    switch (state) {
      case "anxious":
        return { brow: -6, mouth: -10, eyes: 0.9, blush: 0.25 + 0.35 * k, wobble: true };
      case "sad":
        return { brow: 8, mouth: -18, eyes: 0.75, blush: 0.05, wobble: false };
      case "irritable":
        return { brow: -14, mouth: -6, eyes: 0.95, blush: 0.12, wobble: false };
      case "confused":
        return { brow: -2, mouth: -4, eyes: 0.85, blush: 0.08, wobble: false };
      case "fearful":
        return { brow: 10, mouth: -14, eyes: 1.1, blush: 0.18, wobble: true };
      case "hopeful":
        return { brow: -4, mouth: 10, eyes: 0.95, blush: 0.06, wobble: false };
      case "calm":
        return { brow: 0, mouth: 6, eyes: 0.85, blush: 0.04, wobble: false };
      case "neutral":
      default:
        return { brow: 0, mouth: 0, eyes: 0.9, blush: 0.05, wobble: false };
    }
  })();

  const browY = 34 + cfg.brow * (0.35 + 0.65 * k);
  const mouthC = cfg.mouth * (0.35 + 0.65 * k);
  const eyeScaleY = cfg.eyes;

  return (
    <div
      className={`relative h-40 w-40 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-black/30 flex items-center justify-center overflow-hidden motion-reduce:animate-none ${
        cfg.wobble
          ? "animate-[wiggle_1.4s_ease-in-out_infinite]"
          : "animate-[breathe_2.8s_ease-in-out_infinite]"
      }`}
    >
      {/* Fondo suave */}
      <div className="absolute inset-0 opacity-70" />

      {/* Cara */}
      <svg
        viewBox="0 0 120 120"
        className="h-32 w-32"
        aria-label="Avatar del paciente"
      >
        {/* cabeza */}
        <circle cx="60" cy="60" r="44" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />

        {/* rubor (intensidad) */}
        <g opacity={cfg.blush}>
          <ellipse cx="36" cy="70" rx="10" ry="6" fill="rgba(255,255,255,0.25)" />
          <ellipse cx="84" cy="70" rx="10" ry="6" fill="rgba(255,255,255,0.25)" />
        </g>

        {/* cejas */}
        <path
          d={`M 34 ${browY} Q 44 ${browY - 10} 54 ${browY}`}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M 66 ${browY} Q 76 ${browY - 10} 86 ${browY}`}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* ojos */}
        <g
          transform={`translate(0 ${state === "fearful" ? -2 : 0})`}
          style={{ transformOrigin: "60px 52px", animation: "blink 4.6s infinite" }}
        >
          <ellipse cx="44" cy="52" rx="7" ry={7 * eyeScaleY} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.25)" />
          <ellipse cx="76" cy="52" rx="7" ry={7 * eyeScaleY} fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.25)" />
          <circle cx="44" cy="54" r="2" fill="rgba(255,255,255,0.55)" />
          <circle cx="76" cy="54" r="2" fill="rgba(255,255,255,0.55)" />
        </g>

        {/* boca */}
        <path
          d={`M 42 82 Q 60 ${82 + mouthC} 78 82`}
          stroke="rgba(255,255,255,0.70)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* detalle: gota de sudor para anxious/fearful */}
        {(state === "anxious" || state === "fearful") && (
          <path
            d="M92 40 C92 34 98 34 98 40 C98 46 92 50 92 50 C92 50 86 46 86 40 C86 34 92 34 92 40 Z"
            fill="rgba(255,255,255,0.25)"
            stroke="rgba(255,255,255,0.30)"
          />
        )}
      </svg>

      {/* keyframes local */}
      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          20% { transform: translate3d(-1px,0,0) rotate(-0.6deg); }
          40% { transform: translate3d(1px,0,0) rotate(0.6deg); }
          60% { transform: translate3d(-1px,0,0) rotate(-0.4deg); }
          80% { transform: translate3d(1px,0,0) rotate(0.4deg); }
        }

        @keyframes breathe {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(0, -1px, 0) scale(1.01); }
        }

        @keyframes blink {
          0%, 92%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.1); }
          96% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

function AvatarCard({
  name,
  stateKey,
  stateLabel,
  intensity,
}: {
  name: string;
  stateKey: string;
  stateLabel: string;
  intensity: number;
}) {
  const safeIntensity = Number.isFinite(intensity) ? Math.max(0, Math.min(100, intensity)) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-white/60">Paciente</div>
      <div className="mt-1 text-base font-semibold text-white">{name}</div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/60">Estado actual</div>
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{stateLabel}</span>
        </div>

        {/* Avatar (expresivo) */}
        <div className="mt-4 flex items-center justify-center">
          <AvatarFace state={stateKey} intensity={safeIntensity} />
        </div>

        {/* Intensidad */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Intensidad</span>
            <span className="text-white/80">{Math.round(safeIntensity)} / 100</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-white/70" style={{ width: `${Math.round(safeIntensity)}%` }} />
          </div>
          <div className="mt-2 text-xs text-white/50">(Avatar ya reacciona al estado; luego pulimos estilo/realismo)</div>
        </div>
      </div>
    </div>
  );
}


export default function SimulatorPage() {
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [caseObject, setCaseObject] = useState<any>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEmotionRaw, setLastEmotionRaw] = useState<string>("(sin datos)");
  const [lastProvider, setLastProvider] = useState<"gemini" | "groq" | "openrouter" | null>(null);
  const [rollingSummary, setRollingSummary] = useState<string>("");
  const [summaryDebugOpen, setSummaryDebugOpen] = useState(false);

  // UI (layout estilo Claude)
  const [eduExpanded, setEduExpanded] = useState(false);
  const [rightTab, setRightTab] = useState<"patient" | "mse" | "dsm" | "risk" | "scales" | "tests" | "batteries">("patient");
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  const [mseOpen, setMseOpen] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cfgApproach, setCfgApproach] = useState<ApproachValue>("humanistic");
  const [tutorEnabled, setTutorEnabled] = useState(true);
  const [targetSpeaker, setTargetSpeaker] = useState<SpeakerRole>("patient");

  // Escalas clínicas
  const [selectedScaleId, setSelectedScaleId] = useState<string>("");
  const [scaleSession, setScaleSession] = useState<ScaleSession | null>(null);
  const [lastScaleResult, setLastScaleResult] = useState<ReturnType<typeof scoreScale> | null>(null);

  // Tests mentales
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [lastTestResult, setLastTestResult] = useState<ReturnType<typeof scoreTest> | null>(null);

  // Baterías clínicas
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>("");
  const [batterySession, setBatterySession] = useState<BatterySession | null>(null);
  const [lastBatterySession, setLastBatterySession] = useState<BatterySession | null>(null);

  // Exámenes clínicos (patologías médicas)
  const [selectedMedicalExamId, setSelectedMedicalExamId] = useState<string>("");
  const [medicalExamResults, setMedicalExamResults] = useState<MedicalExamResult[]>([]);
  const [runningMedicalExam, setRunningMedicalExam] = useState(false);
  const [runningRiskWorkflow, setRunningRiskWorkflow] = useState<RiskWorkflowKind | null>(null);
  const [riskWorkflowHistory, setRiskWorkflowHistory] = useState<RiskWorkflowEntry[]>([]);

  const [sessionNotes, setSessionNotes] = useState<string[]>([]);
  const [useScaleInFeedback, setUseScaleInFeedback] = useState(false);
  const [useTestInFeedback, setUseTestInFeedback] = useState(false);

  const [activeInstrumentContext, setActiveInstrumentContext] = useState<ActiveInstrumentContext | null>(null);
  const [instrumentAutoRun, setInstrumentAutoRun] = useState(false);
  useEffect(() => {
    const tab = String(
      typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("tab") ?? "" : ""
    )
      .toLowerCase()
      .trim();
    if (tab === "patient" || tab === "mse" || tab === "dsm" || tab === "risk" || tab === "scales" || tab === "tests" || tab === "batteries") {
      setRightTab(tab);
    }
  }, []);

  useEffect(() => {
    // Preferencia (fallback). La fuente de verdad puede venir del caso activo.
    try {
      const raw = localStorage.getItem("tutorEnabled");
      if (raw === null) {
        setTutorEnabled(true);
      } else {
        setTutorEnabled(raw === "true");
      }
    } catch {
      setTutorEnabled(true);
    }
  }, []);

  // Timer
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerReason, setTimerReason] = useState<EndReason | null>(null);
  const finishingRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Ref para abortar peticiones en curso (evita errores "This operation was aborted" al navegar/re-render)
  const requestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      try {
        requestAbortRef.current?.abort();
      } catch {}
      requestAbortRef.current = null;
    };
  }, []);

  const readActiveCaseRaw = useCallback(() => {
    // Cargar caso guardado desde /cases (soporta varias claves por compatibilidad)
    // 1) clave actual
    const rawActive = localStorage.getItem("activeCase");
    if (rawActive) return rawActive;

    // 2) compat: versiones previas guardaban en sessionStorage
    const rawSession = sessionStorage.getItem("activeCase");
    if (rawSession) return rawSession;

    // 3) compat: algunas rutas usaban sim_case
    const rawSim = localStorage.getItem("sim_case") ?? sessionStorage.getItem("sim_case");
    if (rawSim) return rawSim;

    // Si NO hay caso, entonces sí aplica el gate de cierre
    try {
      const ended = localStorage.getItem("sessionEnded");
      if (ended === "true") return null;
    } catch {
      // ignore
    }

    return null;
  }, []);

  const getTargetMinutes = useCallback((obj: any) => {
    // Intenta varias rutas comunes para duración
    const raw =
      obj?.meta?.target_minutes ??
      obj?.meta?.targetMinutes ??
      obj?.target_minutes ??
      obj?.targetMinutes ??
      obj?.duration_minutes ??
      obj?.durationMinutes ??
      obj?.meta?.duration_minutes ??
      obj?.meta?.durationMinutes;

    // parse flexible ("30", "30 min", etc.)
    const n = Number.parseInt(String(raw ?? ""), 10);
    if (Number.isFinite(n) && n > 0) return Math.max(5, Math.min(90, n));

    return 30; // default
  }, []);

  const initTimer = useCallback(
    (obj: any) => {
      const minutes = getTargetMinutes(obj);

      // Persistimos un endAt para que si refrescas no se reinicie.
      // Se guarda por caso (si tiene id) o global.
      const caseId = String(obj?.id ?? obj?.meta?.case_id ?? "default");
      const key = `sessionEndAt:${caseId}:${minutes}`;

      const existing = Number(localStorage.getItem(key));
      const now = Date.now();

      // Solo reutiliza un endAt si todavía está en el futuro.
      // Si quedó un endAt viejo (ya vencido), reinicia el timer para no mandar a /results al instante.
      const endAt = Number.isFinite(existing) && existing > now
        ? existing
        : now + minutes * 60 * 1000;

      localStorage.setItem(key, String(endAt));
      setTimerEndAt(endAt);
      setRemainingSec(Math.max(0, Math.floor((endAt - now) / 1000)));
    },
    [getTargetMinutes]
  );

  const finishSession = useCallback(
    (reason: EndReason) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setTimerReason(reason);

      try {
        localStorage.setItem("activeTranscript", JSON.stringify(transcript));
      } catch {
        // ignore
      }

      try {
        const scaleDef = getScaleById(selectedScaleId);
        const testDef = getTestById(selectedTestId);
        localStorage.setItem(
          "sessionFeedbackContext",
          JSON.stringify({
            use_scale_result: Boolean(useScaleInFeedback),
            use_test_result: Boolean(useTestInFeedback),
            scale_result: useScaleInFeedback ? lastScaleResult : null,
            test_result: useTestInFeedback ? lastTestResult : null,
            scale_definition:
              useScaleInFeedback && scaleDef
                ? { id: scaleDef.id, name: scaleDef.name, short_name: scaleDef.short_name }
                : null,
            test_definition:
              useTestInFeedback && testDef
                ? { id: testDef.id, name: testDef.name, short_name: testDef.short_name }
                : null,
            saved_at: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }

      // Mark session as ended (used by Sidebar + Simulator gate)
      try {
        localStorage.setItem("sessionEnded", "true");
      } catch {
        // ignore
      }

      // Store optional end details separately (used by /reports if needed)
      try {
        localStorage.setItem(
          "sessionEndedInfo",
          JSON.stringify({
            reason,
            ended_at: new Date().toISOString(),
            remaining_sec: remainingSec,
          })
        );
      } catch {
        // ignore
      }

      // Guardar historial (una sola vez, al finalizar)
      try {
        const endedAt = new Date().toISOString();

        const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
        const caseTitle = String(caseObject?.meta?.title ?? caseObject?.title ?? "Caso clínico");
        const patientName = String(caseObject?.patient_profile?.display_name ?? "Paciente");

        const startedAt = sessionStartedAt ?? endedAt;

        // duración aproximada
        const startMs = Date.parse(startedAt);
        const endMs = Date.parse(endedAt);
        const durationSec = Number.isFinite(startMs)
          ? Math.max(0, Math.floor((endMs - startMs) / 1000))
          : 0;

        // intenta leer lastEmotion ya guardado
        let lastMeta: any = undefined;
        try {
          const raw = localStorage.getItem("lastEmotion");
          if (raw) lastMeta = JSON.parse(raw);
        } catch {}

        // Map transcript for history (avoid Tutor IA breaking store)
        const transcriptForHistory = transcript.map((t) => ({
          role: t.role,
          content: t.content,
        }));

        addSession({
          sessionId: `${caseId}:${Date.now()}`,
          caseId,
          caseTitle,
          patientName,
          startedAt,
          endedAt,
          endReason: reason,
          durationSec,
          targetMinutes: (() => {
            const raw =
              caseObject?.meta?.target_minutes ??
              caseObject?.meta?.targetMinutes ??
              caseObject?.target_minutes ??
              caseObject?.targetMinutes;
            const n = Number(raw);
            return Number.isFinite(n) ? n : undefined;
          })(),
          lastMeta: {
            state: lastMeta?.state,
            intensity: lastMeta?.intensity,
            rapport: lastMeta?.rapport,
            flags: Array.isArray(lastMeta?.flags) ? lastMeta.flags : [],
          },
          transcript: transcriptForHistory as any,
        });
      } catch {
        // si falla el historial, igual deja terminar
      }

      // Persist active case for /reports page
      try {
        localStorage.setItem("activeCase", JSON.stringify(caseObject));
      } catch {
        // ignore
      }

      window.location.href = "/reports";
    },
    [
      transcript,
      remainingSec,
      caseObject,
      sessionStartedAt,
      useScaleInFeedback,
      useTestInFeedback,
      lastScaleResult,
      lastTestResult,
      selectedScaleId,
      selectedTestId,
    ]
  );

  useEffect(() => {
    const raw = readActiveCaseRaw();
    if (!raw) {
      finishingRef.current = false;
      setTimerReason(null);
      setCaseObject(null);
      setTranscript([]);
      setTimerEndAt(null);
      setRemainingSec(null);
      try {
        if (typeof window !== "undefined" && window.location?.pathname === "/simulator") {
          window.location.replace("/dashboard");
        }
      } catch {
        // ignore
      }
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setCaseObject(parsed);
      // Tutor IA: si el caso trae preferencia explícita, úsala (y persiste para el simulador)
      try {
        const v = parsed?.meta?.tutor_enabled;
        if (typeof v === "boolean") {
          setTutorEnabled(v);
          try {
            localStorage.setItem("tutorEnabled", String(v));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      try {
        const a = String(parsed?.meta?.approach ?? parsed?.approach ?? "humanistic").toLowerCase().trim();
        const allowed: ApproachValue[] = ["humanistic", "cbt", "psychodynamic", "systemic"];
        setCfgApproach((allowed as string[]).includes(a) ? (a as ApproachValue) : "humanistic");
      } catch {
        setCfgApproach("humanistic");
      }
      // New case loaded → allow session to be in progress
      try {
        localStorage.setItem("sessionEnded", "false");
      } catch {
        // ignore
      }

      // Reset de estado de cierre cuando entra un caso nuevo
      finishingRef.current = false;
      setTimerReason(null);

      // init timer (depende del caso)
      initTimer(parsed);
      // guardar inicio de sesión (persistente por caso)
      const startKey = `sessionStartedAt:${String(parsed?.id ?? parsed?.meta?.case_id ?? "default")}:${getTargetMinutes(parsed)}`;
      const existingStart = localStorage.getItem(startKey);
      const startedAt = existingStart ?? new Date().toISOString();
      localStorage.setItem(startKey, startedAt);
      setSessionStartedAt(startedAt);
      // si hay transcript guardado
      const t =
        localStorage.getItem("activeTranscript") ??
        sessionStorage.getItem("activeTranscript") ??
        localStorage.getItem("sim_transcript") ??
        sessionStorage.getItem("sim_transcript");

      if (t) {
        try {
          setTranscript(JSON.parse(t));
        } catch {
          setTranscript([]);
        }
      } else {
        setTranscript([]);
      }

      // Load rolling summary (keeps prompt small across long chats)
      try {
        const caseId = String(parsed?.id ?? parsed?.meta?.case_id ?? "default");
        const key = `rollingSummary:${caseId}`;
        const rs = localStorage.getItem(key);
        setRollingSummary(rs ?? "");
      } catch {
        setRollingSummary("");
      }
    } catch {
      setCaseObject(null);
      setTranscript([]);
      setRollingSummary("");
    }
  }, [readActiveCaseRaw, initTimer, getTargetMinutes]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastEmotion");
      setLastEmotionRaw(raw ?? "(sin datos)");

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const p = String(parsed?.provider ?? "").toLowerCase();
          setLastProvider(p === "gemini" || p === "groq" || p === "openrouter" ? (p as any) : null);
        } catch {
          setLastProvider(null);
        }
      } else {
        setLastProvider(null);
      }
    } catch {
      setLastEmotionRaw("(sin datos)");
      setLastProvider(null);
    }
  }, [transcript]);

  useEffect(() => {
    // persistir transcript (solo si hay caso cargado)
    try {
      if (caseObject) {
        localStorage.setItem("activeTranscript", JSON.stringify(transcript));
      }
    } catch {
      // ignore
    }

    // Persist rolling summary per case (prevents prompt growth)
    try {
      if (caseObject) {
        const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
        localStorage.setItem(`rollingSummary:${caseId}`, String(rollingSummary ?? ""));
      }
    } catch {
      // ignore
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, caseObject, rollingSummary]);

  // Tick del cronómetro
  useEffect(() => {
    if (!timerEndAt) return;

    const tick = () => {
      const now = Date.now();
      const sec = Math.max(0, Math.floor((timerEndAt - now) / 1000));
      setRemainingSec(sec);

      if (sec <= 0) {
        // Auto cierre por tiempo
        finishSession("timeout");
      }
    };

    // tick inmediato + interval
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timerEndAt, finishSession]);

  const patientName = useMemo(() => {
    return caseObject?.patient_profile?.display_name ?? "Paciente";
  }, [caseObject]);
  const companionName = useMemo(() => {
    return String(caseObject?.companion_profile?.display_name ?? "Acompañante");
  }, [caseObject]);
  const pediatricCase = useMemo(() => isPediatricCase(caseObject), [caseObject]);
  const caseAgeGroup = useMemo(() => deriveAgeGroup(caseObject), [caseObject]);
  const caseDomain = useMemo<"mental" | "medical">(
    () => (String(caseObject?.meta?.domain ?? "").toLowerCase() === "medical" ? "medical" : "mental"),
    [caseObject]
  );
  const isMedicalCase = caseDomain === "medical";

  useEffect(() => {
    if (!caseObject) return;
    if (!pediatricCase) setTargetSpeaker("patient");
    else if (targetSpeaker === "both") setTargetSpeaker("patient");
  }, [caseObject, pediatricCase, targetSpeaker]);

  useEffect(() => {
    if (rightPanelCollapsed) {
      setMobileRightOpen(false);
    }
  }, [rightPanelCollapsed]);

  useEffect(() => {
    try {
      if (!caseObject) return;
      const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
      const raw = localStorage.getItem(`sessionNotes:${caseId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSessionNotes(parsed.map((x: any) => String(x)).filter(Boolean).slice(0, 30));
        }
      }
    } catch {
      // ignore
    }
  }, [caseObject]);

  useEffect(() => {
    try {
      if (!caseObject) return;
      const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
      localStorage.setItem(`sessionNotes:${caseId}`, JSON.stringify(sessionNotes.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [caseObject, sessionNotes]);

  useEffect(() => {
    try {
      if (!caseObject || !isMedicalCase) return;
      const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
      const raw = localStorage.getItem(`medicalExamResults:${caseId}`);
      if (!raw) {
        setMedicalExamResults([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setMedicalExamResults([]);
        return;
      }
      setMedicalExamResults(
        parsed
          .map((item) => (item && typeof item === "object" ? (item as MedicalExamResult) : null))
          .filter(Boolean)
          .slice(0, 40) as MedicalExamResult[]
      );
    } catch {
      setMedicalExamResults([]);
    }
  }, [caseObject, isMedicalCase]);

  useEffect(() => {
    try {
      if (!caseObject || !isMedicalCase) return;
      const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
      localStorage.setItem(`medicalExamResults:${caseId}`, JSON.stringify(medicalExamResults.slice(0, 40)));
    } catch {
      // ignore
    }
  }, [caseObject, isMedicalCase, medicalExamResults]);

  useEffect(() => {
    try {
      if (!caseObject) {
        setRiskWorkflowHistory([]);
        return;
      }
      const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
      const raw = localStorage.getItem(`riskWorkflowHistory:${caseId}`);
      if (!raw) {
        setRiskWorkflowHistory([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setRiskWorkflowHistory([]);
        return;
      }
      setRiskWorkflowHistory(
        parsed
          .map((row) => (row && typeof row === "object" ? (row as RiskWorkflowEntry) : null))
          .filter(Boolean)
          .slice(0, 24) as RiskWorkflowEntry[]
      );
    } catch {
      setRiskWorkflowHistory([]);
    }
  }, [caseObject]);

  useEffect(() => {
    try {
      if (!caseObject) return;
      const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
      localStorage.setItem(`riskWorkflowHistory:${caseId}`, JSON.stringify(riskWorkflowHistory.slice(0, 24)));
    } catch {
      // ignore
    }
  }, [caseObject, riskWorkflowHistory]);

  const clinicalDxId = useMemo(() => {
    // tag corto para conectar con /topics?dx=
    const raw =
      caseObject?.meta?.dx_id ??
      caseObject?.meta?.dxId ??
      caseObject?.meta?.dx ??
      caseObject?.meta?.dsm_tag ??
      caseObject?.meta?.dsmTag ??
      caseObject?.meta?.diagnosis_tag ??
      caseObject?.meta?.diagnosisTag ??
      caseObject?.dsm_tag ??
      caseObject?.dx;

    const s = String(raw ?? "").trim().toLowerCase();
    // permite solo slug simple (evita romper URL)
    if (!s) return null;
    if (!/^[a-z0-9_-]{2,32}$/.test(s)) return null;
    return s;
  }, [caseObject]);

  const clinicalHref = useMemo(() => {
    if (isMedicalCase) return "/medical-pathologies";
    return clinicalDxId ? `/topics?dx=${encodeURIComponent(clinicalDxId)}` : "/topics";
  }, [clinicalDxId, isMedicalCase]);

  const backHref = isMedicalCase ? "/medical-cases" : "/cases";
  const libraryButtonLabel = isMedicalCase ? "Simulador de patologías" : "Biblioteca clínica";
  const codeBadgeLabel = isMedicalCase ? "Código clínico" : "DSM/CIE";
  const riskBadgeLabel = isMedicalCase ? "Urgencia" : "Riesgo";

  const lastMeta = useMemo(() => {
    try {
      const parsed = JSON.parse(lastEmotionRaw);
      return {
        state: String(parsed?.state ?? "neutral"),
        intensity: Number(parsed?.intensity ?? 0),
        rapport: Number(parsed?.rapport ?? 0),
        flags: Array.isArray(parsed?.flags) ? parsed.flags : [],
      };
    } catch {
      return {
        state: "neutral",
        intensity: 0,
        rapport: 0,
        flags: [],
      };
    }
  }, [lastEmotionRaw]);

  const emotionLabel: Record<string, string> = {
    neutral: "Neutral",
    calm: "Calma",
    anxious: "Ansiedad",
    sad: "Tristeza",
    irritable: "Irritabilidad",
    confused: "Confusión",
    fearful: "Miedo",
    hopeful: "Esperanza",
  };

  const approachLabel = useMemo(() => {
    const a = String(caseObject?.meta?.approach ?? caseObject?.approach ?? "humanistic").toLowerCase().trim();
    if (a === "cbt") return "TCC";
    if (a === "psychodynamic") return "Psicodinámico";
    if (a === "systemic") return "Sistémico";
    return "Humanístico";
  }, [caseObject]);

  const selectedScale = useMemo(() => getScaleById(selectedScaleId), [selectedScaleId]);
  const selectedTest = useMemo(() => getTestById(selectedTestId), [selectedTestId]);
  const selectedBattery = useMemo(() => getBatteryById(selectedBatteryId), [selectedBatteryId]);
  const scaleCatalog = useMemo(() => getScalesByDomain(caseDomain), [caseDomain]);
  const testCatalog = useMemo(() => getTestsByDomain(caseDomain), [caseDomain]);
  const batteryCatalog = useMemo(() => getBatteriesByDomain(caseDomain), [caseDomain]);
  const medicalExamCatalog = useMemo(
    () => (isMedicalCase ? getMedicalExamsForCase(caseObject) : []),
    [isMedicalCase, caseObject]
  );
  const selectedMedicalExam = useMemo(
    () => getMedicalExamById(selectedMedicalExamId),
    [selectedMedicalExamId]
  );

  useEffect(() => {
    if (!scaleCatalog.length) {
      setSelectedScaleId("");
      return;
    }
    if (!scaleCatalog.some((s) => s.id === selectedScaleId)) {
      setSelectedScaleId(scaleCatalog[0].id);
    }
  }, [scaleCatalog, selectedScaleId]);

  useEffect(() => {
    if (!testCatalog.length) {
      setSelectedTestId("");
      return;
    }
    if (!testCatalog.some((t) => t.id === selectedTestId)) {
      setSelectedTestId(testCatalog[0].id);
    }
  }, [testCatalog, selectedTestId]);

  useEffect(() => {
    if (!batteryCatalog.length) {
      setSelectedBatteryId("");
      return;
    }
    if (!batteryCatalog.some((b) => b.id === selectedBatteryId)) {
      setSelectedBatteryId(batteryCatalog[0].id);
    }
  }, [batteryCatalog, selectedBatteryId]);

  useEffect(() => {
    if (!isMedicalCase) {
      setSelectedMedicalExamId("");
      setMedicalExamResults([]);
      return;
    }
    if (!medicalExamCatalog.length) {
      setSelectedMedicalExamId("");
      return;
    }
    if (!medicalExamCatalog.some((exam) => exam.id === selectedMedicalExamId)) {
      setSelectedMedicalExamId(medicalExamCatalog[0].id);
    }
  }, [isMedicalCase, medicalExamCatalog, selectedMedicalExamId]);

  const batteryViewSession = batterySession ?? lastBatterySession;
  const batteryViewDef = useMemo(
    () => (batteryViewSession ? getBatteryById(batteryViewSession.battery_id) : null),
    [batteryViewSession]
  );

  const batterySummary = useMemo(() => {
    if (!batteryViewSession || !batteryViewDef) return null;
    const totalSteps = batteryViewDef.steps.length;
    const completedSteps = batteryViewSession.step_results.length;
    const completionPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const highRisk = batteryViewSession.step_results.some((step) => {
      const label = String(step.classification ?? "").toLowerCase();
      return (
        step.risk_alert === true ||
        /(alto|cr[ií]tico|severo|muy alto|alteraci[oó]n marcada)/.test(label)
      );
    });
    const weakAreas = batteryViewSession.step_results
      .filter((step) => /(moderado|severo|alto|cr[ií]tico|riesgo|alteraci[oó]n)/.test(String(step.classification ?? "").toLowerCase()))
      .map((step) => step.instrument_name)
      .slice(0, 4);

    return {
      totalSteps,
      completedSteps,
      completionPct,
      highRisk,
      weakAreas,
    };
  }, [batteryViewSession, batteryViewDef]);

  // --- UI helpers (Claude-style layout) ---
  const riskLevel = useMemo<"Bajo" | "Moderado" | "Alto" | "Sin datos">(() => {
    const s = String(caseObject?.safety?.risk_level ?? caseObject?.meta?.risk_level ?? "").toLowerCase().trim();
    if (s === "alto") return "Alto";
    if (s === "moderado") return "Moderado";
    if (s === "bajo") return "Bajo";

    const flags = Array.isArray(lastMeta.flags) ? lastMeta.flags.map((x: any) => String(x)) : [];
    if (!flags.length) return "Sin datos";
    const riskFlags = flags.filter((f) => flagCategory(f) === "Riesgo");
    if (!riskFlags.length) return "Bajo";
    return riskFlags.length >= 3 ? "Alto" : "Moderado";
  }, [caseObject, lastMeta.flags]);

  const quickChipMap = useMemo(() => {
    const sq = caseObject?.suggested_questions ?? {};

    const toList = (arr: any, fallbacks: string[]) => {
      const out = Array.isArray(arr)
        ? arr
            .map((x) => String(x ?? "").trim())
            .filter((s) => s.length > 0)
        : [];
      // ensure 3–4 options (use fallbacks to fill)
      const merged = [...out, ...fallbacks].filter(Boolean);
      const uniq: string[] = [];
      for (const s of merged) {
        if (!uniq.includes(s)) uniq.push(s);
        if (uniq.length >= 4) break;
      }
      return uniq.slice(0, 4);
    };

    if (isMedicalCase) {
      return {
        "Motivo y cronología": toList(sq.openers, [
          "¿Cuál es el síntoma principal que más le preocupa hoy?",
          "¿Desde cuándo comenzó este cuadro y cómo ha evolucionado?",
          "¿Qué cambió antes de que iniciaran los síntomas?",
          "¿Qué le motivó a consultar hoy específicamente?",
        ]),
        "Explorar síntomas": toList(sq.symptoms, [
          "¿Qué síntomas presenta ahora y con qué intensidad?",
          "¿Hay fiebre, dolor, dificultad respiratoria o mareo?",
          "¿Qué empeora o alivia sus síntomas?",
          "¿Se acompañan de náusea, vómito, sangrado o confusión?",
        ]),
        "⚠ Signos de alarma": toList(sq.safety, [
          "¿Ha presentado desmayo, sangrado, dolor intenso o dificultad para respirar?",
          "¿Ha notado empeoramiento rápido en las últimas horas?",
          "¿Tiene confusión, somnolencia marcada o disminución de diuresis?",
          "¿Ha requerido atención de urgencia reciente por este cuadro?",
        ]),
        "Antecedentes y medicación": toList(sq.duration, [
          "¿Qué antecedentes médicos relevantes tiene?",
          "¿Qué medicamentos usa actualmente y cuál fue la última dosis?",
          "¿Tiene alergias medicamentosas conocidas?",
          "¿Ha tenido episodios similares antes?",
        ]),
        "Impacto funcional": toList(sq.function, [
          "¿Cómo afecta esto su movilidad, sueño y alimentación?",
          "¿Ha limitado trabajo, estudio o autocuidado?",
          "¿Cuenta con apoyo en casa para su cuidado actual?",
          "¿Ha podido mantener hidratación y tratamiento indicados?",
        ]),
      } as Record<string, string[]>;
    }

    return {
      "Pregunta abierta": toList(sq.openers, [
        "¿Qué es lo que te trajo hoy aquí?",
        "¿Qué te gustaría trabajar en esta sesión?",
        "Cuéntame qué ha sido lo más difícil últimamente.",
        "¿Qué cambió recientemente que te hizo buscar ayuda?",
      ]),
      "Explorar síntomas": toList(sq.symptoms, [
        "¿Qué síntomas has notado y cómo han cambiado últimamente?",
        "¿Qué pasa en tu cuerpo y en tu mente cuando te sientes así?",
        "¿Con qué frecuencia te ocurre y cuánto dura?",
        "¿Hay algo que lo empeore o lo alivie?",
      ]),
      "⚠ Riesgo suicida": toList(sq.safety, [
        "¿Has pensado en hacerte daño o en que sería mejor no estar aquí?",
        "En los últimos días, ¿has tenido pensamientos de no querer vivir?",
        "¿Has pensado en lastimarte o en suicidarte?",
        "Si esos pensamientos aparecen, ¿qué tan intensos son y qué te detiene?",
      ]),
      "Clarificar duración": toList(sq.duration, [
        "¿Desde cuándo exactamente empezaste a sentirte así?",
        "¿Recuerdas cuándo fue la primera vez que te pasó?",
        "En una línea de tiempo, ¿qué cambió antes de que esto empezara?",
        "¿Ha sido continuo o viene por episodios?",
      ]),
      "Impacto funcional": toList(sq.function, [
        "¿Cómo han afectado estos síntomas tu trabajo o tu vida diaria?",
        "¿Qué cosas has dejado de hacer por sentirte así?",
        "¿Cómo está tu rendimiento en estudio/trabajo y tus relaciones?",
        "¿Qué áreas de tu vida se han visto más afectadas?",
      ]),
    } as Record<string, string[]>;
  }, [caseObject, isMedicalCase]);

  function toggleMse(key: string) {
    setMseOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const applyApproach = useCallback(() => {
    setCaseObject((prev: any) => {
      const next = prev ? { ...prev } : {};
      const meta = { ...(next.meta ?? {}) };
      meta.approach = cfgApproach;
      next.meta = meta;
      // compat
      next.approach = cfgApproach;

      try {
        localStorage.setItem("activeCase", JSON.stringify(next));
      } catch {
        // ignore
      }

      return next;
    });

    setSettingsOpen(false);
  }, [cfgApproach]);

  function asStrArray(v: any): string[] {
    return Array.isArray(v) ? v.map((x) => String(x)).filter((s) => s.trim().length > 0) : [];
  }

  function safeText(v: any, fallback = "—") {
    const s = v == null ? "" : String(v);
    const t = s.trim();
    return t ? t : fallback;
  }

  function labelAppliesTo(value: string) {
    const v = String(value ?? "").toLowerCase();
    if (v === "both") return "Adulto y adolescente";
    if (v === "adolescent") return "Adolescente";
    return "Adulto";
  }

  function examStatusLabel(status: string) {
    const key = String(status ?? "").toLowerCase();
    if (key === "critical") return "Crítico";
    if (key === "altered") return "Alterado";
    return "Normal";
  }

  function examStatusClass(status: string) {
    const key = String(status ?? "").toLowerCase();
    if (key === "critical") return "border-red-400/25 bg-red-400/10 text-red-100";
    if (key === "altered") return "border-amber-400/25 bg-amber-400/10 text-amber-100";
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  }

  const timeLabel = useMemo(() => {
    if (remainingSec == null) return "--:--";
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainingSec]);

  const timeIsLow = useMemo(() => {
    if (remainingSec == null) return false;
    return remainingSec <= 120; // 2 min
  }, [remainingSec]);

  const inputDisabled = useMemo(() => {
    // Bloquea si está enviando, o si el tiempo se acabó / en proceso de cerrar
    return loading || (remainingSec != null && remainingSec <= 0) || !!timerReason;
  }, [loading, remainingSec, timerReason]);

  const beginScaleSession = useCallback((scaleId: string, auto = false) => {
    const definition = scaleCatalog.find((s) => s.id === scaleId) ?? getScaleById(scaleId);
    if (!definition) {
      setError("No se pudo iniciar la escala seleccionada.");
      return false;
    }
    setSelectedScaleId(definition.id);
    setLastScaleResult(null);
    setInstrumentAutoRun(auto);
    setScaleSession({
      session_id: makeSessionId("scale"),
      scale_id: definition.id,
      status: "in_progress",
      current_index: 0,
      answers: [],
      started_at: new Date().toISOString(),
    });
    setActiveInstrumentContext({
      mode: "scale",
      instrument_id: definition.id,
      instrument_name: definition.short_name,
      item_index: 0,
      total_items: definition.items.length,
      item_id: definition.items[0]?.id ?? "item_1",
      item_prompt: definition.items[0]?.prompt ?? "Pregunta clínica",
      response_type: definition.response_type,
      options: definition.items[0]?.options ?? [],
    });
    return true;
  }, [scaleCatalog]);

  const beginTestSession = useCallback((testId: string, auto = false) => {
    const definition = testCatalog.find((t) => t.id === testId) ?? getTestById(testId);
    if (!definition) {
      setError("No se pudo iniciar el test seleccionado.");
      return false;
    }
    setSelectedTestId(definition.id);
    setLastTestResult(null);
    setInstrumentAutoRun(auto);
    setTestSession({
      session_id: makeSessionId("test"),
      test_id: definition.id,
      status: "in_progress",
      current_index: 0,
      answers: [],
      started_at: new Date().toISOString(),
    });
    setActiveInstrumentContext({
      mode: "test",
      instrument_id: definition.id,
      instrument_name: definition.short_name,
      item_index: 0,
      total_items: definition.items.length,
      item_id: definition.items[0]?.id ?? "item_1",
      item_prompt: definition.items[0]?.prompt ?? "Pregunta clínica",
      response_type: definition.response_type,
      options: definition.items[0]?.options ?? [],
    });
    return true;
  }, [testCatalog]);

  const startScaleInChat = useCallback((auto = false) => {
    if (!selectedScaleId) return;
    void beginScaleSession(selectedScaleId, auto);
  }, [selectedScaleId, beginScaleSession]);

  const startTestInChat = useCallback((auto = false) => {
    if (!selectedTestId) return;
    void beginTestSession(selectedTestId, auto);
  }, [selectedTestId, beginTestSession]);

  const startBatteryInChat = useCallback((auto = true) => {
    if (!selectedBattery || selectedBattery.steps.length === 0) {
      setError("La batería seleccionada no tiene pasos configurados.");
      return;
    }
    setError(null);
    setRightTab("batteries");
    setLastBatterySession(null);
    const session: BatterySession = {
      session_id: makeSessionId("battery"),
      battery_id: selectedBattery.id,
      status: "in_progress",
      current_step_index: 0,
      step_results: [],
      started_at: new Date().toISOString(),
      auto_run: auto,
    };
    setBatterySession(session);

    const firstStep = selectedBattery.steps[0];
    const ok =
      firstStep.mode === "scale"
        ? beginScaleSession(firstStep.instrument_id, auto)
        : beginTestSession(firstStep.instrument_id, auto);

    if (!ok) {
      setBatterySession((prev) => (prev ? { ...prev, status: "cancelled", completed_at: new Date().toISOString() } : prev));
    }
  }, [selectedBattery, beginScaleSession, beginTestSession]);

  const cancelActiveInstrument = useCallback(() => {
    setInstrumentAutoRun(false);
    setActiveInstrumentContext(null);
    setScaleSession((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    setTestSession((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
  }, []);

  const cancelBatterySession = useCallback(() => {
    cancelActiveInstrument();
    setBatterySession((prev) =>
      prev
        ? {
            ...prev,
            status: "cancelled",
            completed_at: new Date().toISOString(),
          }
        : prev
    );
  }, [cancelActiveInstrument]);

  useEffect(() => {
    if (!batterySession || batterySession.status !== "in_progress") return;
    const batteryDef = getBatteryById(batterySession.battery_id);
    if (!batteryDef) return;
    if (activeInstrumentContext) return;

    const currentStep = batteryDef.steps[batterySession.current_step_index];
    if (!currentStep) return;
    if (batterySession.step_results.some((r) => r.step_id === currentStep.id)) return;

    let stepResult: BatteryStepResult | null = null;

    if (currentStep.mode === "scale") {
      if (scaleSession?.status === "cancelled") {
        setBatterySession((prev) =>
          prev ? { ...prev, status: "cancelled", completed_at: new Date().toISOString() } : prev
        );
        return;
      }
      if (scaleSession?.status !== "completed" || scaleSession.scale_id !== currentStep.instrument_id || !scaleSession.result) {
        return;
      }
      stepResult = {
        step_id: currentStep.id,
        mode: "scale",
        instrument_id: currentStep.instrument_id,
        instrument_name: getScaleById(currentStep.instrument_id)?.short_name ?? currentStep.label,
        total_score: scaleSession.result.total_score,
        max_score: scaleSession.result.max_score,
        classification: scaleSession.result.severity_label,
        interpretation: scaleSession.result.interpretation,
        risk_alert: !!scaleSession.result.risk_alert,
        completed_at: scaleSession.result.completed_at,
      };
    } else {
      if (testSession?.status === "cancelled") {
        setBatterySession((prev) =>
          prev ? { ...prev, status: "cancelled", completed_at: new Date().toISOString() } : prev
        );
        return;
      }
      if (testSession?.status !== "completed" || testSession.test_id !== currentStep.instrument_id || !testSession.result) {
        return;
      }
      stepResult = {
        step_id: currentStep.id,
        mode: "test",
        instrument_id: currentStep.instrument_id,
        instrument_name: getTestById(currentStep.instrument_id)?.short_name ?? currentStep.label,
        total_score: testSession.result.total_score,
        max_score: testSession.result.max_score,
        classification: testSession.result.classification,
        interpretation: testSession.result.interpretation,
        completed_at: testSession.result.completed_at,
      };
    }

    setBatterySession((prev) => {
      if (!prev || prev.status !== "in_progress") return prev;
      if (prev.step_results.some((r) => r.step_id === currentStep.id)) return prev;

      const nextResults = [...prev.step_results, stepResult as BatteryStepResult];
      const nextStepIndex = prev.current_step_index + 1;
      if (nextStepIndex >= batteryDef.steps.length) {
        return {
          ...prev,
          current_step_index: batteryDef.steps.length,
          step_results: nextResults,
          status: "completed",
          completed_at: new Date().toISOString(),
        };
      }

      return {
        ...prev,
        current_step_index: nextStepIndex,
        step_results: nextResults,
      };
    });
  }, [batterySession, activeInstrumentContext, scaleSession, testSession]);

  useEffect(() => {
    if (!batterySession || batterySession.status !== "in_progress") return;
    const batteryDef = getBatteryById(batterySession.battery_id);
    if (!batteryDef) return;
    if (activeInstrumentContext) return;
    if (batterySession.step_results.length !== batterySession.current_step_index) return;

    const step = batteryDef.steps[batterySession.current_step_index];
    if (!step) return;
    const ok =
      step.mode === "scale"
        ? beginScaleSession(step.instrument_id, batterySession.auto_run)
        : beginTestSession(step.instrument_id, batterySession.auto_run);

    if (!ok) {
      setBatterySession((prev) =>
        prev ? { ...prev, status: "cancelled", completed_at: new Date().toISOString() } : prev
      );
    }
  }, [batterySession, activeInstrumentContext, beginScaleSession, beginTestSession]);

  useEffect(() => {
    if (!batterySession || batterySession.status !== "completed") return;
    setLastBatterySession(batterySession);
  }, [batterySession]);

  const addNote = useCallback((text: string) => {
    const clean = String(text ?? "").trim();
    if (!clean) return;
    setSessionNotes((prev) => [clean, ...prev].slice(0, 30));
  }, []);

  const mergeMedicalExamResults = useCallback((generated: MedicalExamResult[]) => {
    if (!generated.length) return;
    setMedicalExamResults((prev) => {
      const next = [...generated.reverse(), ...prev];
      const dedupe = new Map<string, MedicalExamResult>();
      for (const row of next) {
        if (!dedupe.has(row.exam_id)) dedupe.set(row.exam_id, row);
      }
      return Array.from(dedupe.values()).slice(0, 40);
    });
  }, []);

  const appendRiskWorkflow = useCallback((entry: RiskWorkflowEntry) => {
    setRiskWorkflowHistory((prev) => [entry, ...prev].slice(0, 24));
  }, []);

  const runSingleMedicalExam = useCallback(
    (examId: string) => {
      if (!isMedicalCase || !caseObject) return;
      const exam = getMedicalExamById(examId);
      if (!exam) return;
      const result = runMedicalExam(exam, caseObject);
      mergeMedicalExamResults([result]);
    },
    [isMedicalCase, caseObject, mergeMedicalExamResults]
  );

  const runMedicalExamBundle = useCallback(() => {
    if (!isMedicalCase || !caseObject) return;
    const bundle = medicalExamCatalog.slice(0, 5);
    if (!bundle.length) return;
    setRunningMedicalExam(true);
    const generated = bundle.map((exam) => runMedicalExam(exam, caseObject));
    mergeMedicalExamResults(generated);
    window.setTimeout(() => setRunningMedicalExam(false), 180);
  }, [isMedicalCase, caseObject, medicalExamCatalog, mergeMedicalExamResults]);

  const runRiskWorkflow = useCallback((kind: RiskWorkflowKind) => {
    if (!caseObject) return;
    setRunningRiskWorkflow(kind);

    const toList = (value: unknown) =>
      Array.isArray(value)
        ? value
            .map((item) => String(item ?? "").trim())
            .filter(Boolean)
        : [];

    const normalize = (items: string[], limit = 8) =>
      Array.from(
        new Set(
          items
            .map((item) => String(item ?? "").trim())
            .filter(Boolean)
            .map((item) => item.replace(/\s+/g, " "))
        )
      ).slice(0, limit);

    const now = new Date().toISOString();

    if (isMedicalCase) {
      if (kind === "medical_alert_checklist") {
        const hiddenExamIds = [
          "vital_signs_targeted",
          "cardiorespiratory_exam",
          "perfusion_hydration",
        ];
        const generated = hiddenExamIds
          .map((id) => getMedicalExamById(id))
          .filter((exam): exam is NonNullable<typeof exam> => Boolean(exam))
          .map((exam) => runMedicalExam(exam, caseObject));
        mergeMedicalExamResults(generated);

        const examAlerts = normalize(generated.flatMap((result) => result.red_flags));
        const examFindings = normalize(
          generated
            .filter((result) => result.status !== "normal")
            .flatMap((result) => result.findings)
            .slice(0, 6)
        );
        const riskFactors = normalize(toList(caseObject?.safety?.risk_factors), 6);
        const flags = normalize(
          Array.isArray(lastMeta.flags)
            ? lastMeta.flags
                .map((f: any) => prettyFlag(String(f)))
                .filter(Boolean)
            : [],
          6
        );
        const checklist = normalize([...examAlerts, ...riskFactors, ...flags, ...examFindings], 10);
        const summary =
          riskLevel === "Alto"
            ? "Checklist ejecutado con múltiples señales de alarma. Prioriza escalamiento clínico inmediato."
            : riskLevel === "Moderado"
            ? "Checklist ejecutado con hallazgos de vigilancia estrecha y reevaluación frecuente."
            : "Checklist ejecutado sin descompensación mayor en esta corrida educativa.";

        const entry: RiskWorkflowEntry = {
          id: makeSessionId("risk"),
          kind,
          title: "Checklist de signos de alarma",
          summary,
          items: checklist.length
            ? checklist
            : ["Sin señales críticas nuevas en esta corrida. Mantener monitorización clínica."],
          caution:
            "Uso educativo. Validar siempre con valoración clínica real, constantes vitales y protocolo institucional.",
          created_at: now,
        };
        appendRiskWorkflow(entry);
      }

      if (kind === "medical_stabilization_plan") {
        const plan =
          riskLevel === "Alto"
            ? [
                "Activar protocolo de urgencia institucional y solicitar apoyo del equipo.",
                "Asegurar ABC (vía aérea, ventilación y perfusión) con monitorización continua.",
                "Reevaluar signos vitales seriados y perfusión cada 5-10 minutos.",
                "Preparar ruta de derivación/traslado a área crítica según evolución.",
              ]
            : riskLevel === "Moderado"
            ? [
                "Monitorizar signos vitales y evolución sintomática con reevaluaciones frecuentes.",
                "Completar exámenes iniciales orientativos y priorizar diferenciales de riesgo.",
                "Corregir barreras de adherencia/medicación y reforzar educación de alarma.",
                "Definir criterios claros de escalamiento si hay deterioro clínico.",
              ]
            : [
                "Mantener vigilancia clínica y educación de signos de alarma para reconsulta.",
                "Organizar seguimiento oportuno y adherencia terapéutica.",
                "Registrar evolución y factores de riesgo en notas del caso simulado.",
              ];
        const entry: RiskWorkflowEntry = {
          id: makeSessionId("risk"),
          kind,
          title: "Plan inicial de estabilización",
          summary: "Plan orientativo generado según prioridad clínica actual y datos del caso activo.",
          items: plan,
          caution:
            "Resultado orientativo de entrenamiento. No reemplaza juicio clínico ni guías institucionales.",
          created_at: now,
        };
        appendRiskWorkflow(entry);
      }
    } else {
      if (kind === "mental_cssrs") {
        const hints = normalize(toList(caseObject?.safety?.cssrs_hint), 8);
        const fallback = [
          "Explorar ideación suicida actual (frecuencia, duración e intensidad).",
          "Explorar plan, medios disponibles e intencionalidad.",
          "Registrar intentos previos y factores precipitantes recientes.",
          "Cuantificar factores protectores y red de apoyo inmediata.",
        ];
        const entry: RiskWorkflowEntry = {
          id: makeSessionId("risk"),
          kind,
          title: "Mini C-SSRS orientativo",
          summary:
            riskLevel === "Alto"
              ? "Tamizaje orientativo sugiere riesgo elevado. Prioriza seguridad y derivación urgente."
              : "Tamizaje orientativo completado para estructurar la exploración de riesgo.",
          items: hints.length ? hints : fallback,
          caution:
            "Instrumento educativo de entrenamiento. No sustituye valoración clínica de riesgo suicida real.",
          created_at: now,
        };
        appendRiskWorkflow(entry);
      }

      if (kind === "mental_safety_plan") {
        const protective = normalize(toList(caseObject?.safety?.protective_factors), 5);
        const plan = normalize(
          [
            "Acordar señales de alerta personales y pasos de autocuidado inmediato.",
            "Reducir acceso a medios letales y definir acompañamiento seguro.",
            "Activar red de apoyo (familia/cuidador/contacto de confianza).",
            "Establecer ruta de emergencia y seguimiento clínico cercano.",
            ...protective.map((item) => `Fortalecer factor protector: ${item}`),
          ],
          8
        );
        const entry: RiskWorkflowEntry = {
          id: makeSessionId("risk"),
          kind,
          title: "Plan de seguridad inicial",
          summary:
            "Plan educativo de seguridad generado para usar en cierre de sesión y notas clínicas simuladas.",
          items: plan,
          caution:
            "Uso educativo. En riesgo real, activar protocolo local y servicios de emergencia correspondientes.",
          created_at: now,
        };
        appendRiskWorkflow(entry);
      }
    }

    window.setTimeout(() => setRunningRiskWorkflow(null), 180);
  }, [
    appendRiskWorkflow,
    caseObject,
    isMedicalCase,
    lastMeta.flags,
    mergeMedicalExamResults,
    riskLevel,
  ]);

  const sendMessage = useCallback(async (opts?: {
    message?: string;
    mode?: "free" | "scale" | "test";
    instrumentContext?: ActiveInstrumentContext | null;
    speakerTarget?: SpeakerRole;
    silent?: boolean;
  }) => {
    setError(null);

    const msg = String(opts?.message ?? userMessage).trim();
    if (!msg) return;
    if (inputDisabled) return;
    const interactionMode = opts?.mode ?? activeInstrumentContext?.mode ?? "free";
    const instrumentContext = opts?.instrumentContext ?? activeInstrumentContext ?? null;
    const speakerTarget = opts?.speakerTarget ?? targetSpeaker;
    const silent = Boolean(opts?.silent);

    const nextTranscript: TranscriptTurn[] = silent
      ? [...transcript]
      : [...transcript, { role: "user", content: msg }];
    if (!silent) {
      setTranscript(nextTranscript);
    }

    try {
      if (!silent) {
        localStorage.setItem("activeTranscript", JSON.stringify(nextTranscript));
      }
    } catch {
      // ignore
    }

    if (!opts?.message) {
      setUserMessage("");
    }
    setLoading(true);

    // Si hay una petición previa en vuelo, abórtala (por ejemplo, doble Enter o navegación rápida)
    try {
      requestAbortRef.current?.abort();
    } catch {}
    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const headers = await getAuthFetchHeaders({
        "Content-Type": "application/json",
      });

      const res = await fetch("/api/ai/patient-turn", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          caseObject,
          transcript: nextTranscript,
          userMessage: msg,
          tutorEnabled,
          rollingSummary,
          interviewMode: interactionMode,
          instrumentContext,
          targetSpeaker: speakerTarget,
        }),
      });

      const data = await res.json();
      // Si la petición fue abortada después de empezar a recibir respuesta, no continuar
      if (controller.signal.aborted) return;

      if (!res.ok) {
        throw new Error(data?.detail || "Error en patient-turn");
      }

      // Update rolling summary returned by the backend (keeps prompts small)
      if (typeof data?.rolling_summary === "string") {
        setRollingSummary(data.rolling_summary);
        try {
          const caseId = String(caseObject?.id ?? caseObject?.meta?.case_id ?? "default");
          localStorage.setItem(`rollingSummary:${caseId}`, data.rolling_summary);
        } catch {
          // ignore
        }
      }

      if (!silent) {
        setTranscript((prev) => {
          const role =
            normalizeSpeakerRole(data?.speaker_role ?? "") === "caregiver"
              ? "caregiver"
              : "patient";
          const next: TranscriptTurn[] = [...prev, { role, content: data.message_text ?? "(sin respuesta)" }];
          if (
            tutorEnabled &&
            typeof data?.tutor_message === "string" &&
            data.tutor_message.trim().length > 0
          ) {
            next.push({
              role: "tutor",
              content: data.tutor_message,
              kind:
                data.tutor_kind === "alert" || data.tutor_kind === "tip"
                  ? data.tutor_kind
                  : undefined,
            });
          }
          return next;
        });
      }

      const resolveOption = (
        options: Array<{ id: string; label: string; value: number }>,
        answerPayload: any
      ) => {
        if (!Array.isArray(options) || options.length === 0) return null;
        const byId = options.find((o) => String(o.id) === String(answerPayload?.option_id ?? ""));
        if (byId) return byId;

        const idx = Number(answerPayload?.option_index);
        if (Number.isFinite(idx) && idx >= 0 && idx < options.length) return options[idx];

        const val = Number(answerPayload?.option_value);
        if (Number.isFinite(val)) {
          const nearest = [...options].sort((a, b) => Math.abs(a.value - val) - Math.abs(b.value - val))[0];
          if (nearest) return nearest;
        }
        return options[0];
      };

      if (interactionMode === "scale" && instrumentContext?.mode === "scale") {
        setScaleSession((prev) => {
          if (!prev || prev.status !== "in_progress") return prev;
          const def = getScaleById(prev.scale_id);
          if (!def) return prev;
          const item = def.items[prev.current_index];
          if (!item) return prev;
          const option = resolveOption(item.options, data?.instrument_answer);
          if (!option) return prev;

          const answer: ScaleAnswer = {
            item_id: item.id,
            option_id: option.id,
            value: option.value,
            label: option.label,
            speaker:
              normalizeSpeakerRole(data?.speaker_role ?? "") === "caregiver"
                ? "caregiver"
                : "patient",
          };

          const answers = [...prev.answers, answer];
          const nextIndex = prev.current_index + 1;

          if (nextIndex >= def.items.length) {
            const result = scoreScale(def, answers);
            setLastScaleResult(result);
            setActiveInstrumentContext(null);
            return {
              ...prev,
              status: "completed",
              answers,
              current_index: def.items.length,
              completed_at: new Date().toISOString(),
              result,
            };
          }

          const nextItem = def.items[nextIndex];
          setActiveInstrumentContext({
            mode: "scale",
            instrument_id: def.id,
            instrument_name: def.short_name,
            item_index: nextIndex,
            total_items: def.items.length,
            item_id: nextItem.id,
            item_prompt: nextItem.prompt,
            response_type: def.response_type,
            options: nextItem.options,
          });
          return {
            ...prev,
            answers,
            current_index: nextIndex,
          };
        });
      }

      if (interactionMode === "test" && instrumentContext?.mode === "test") {
        setTestSession((prev) => {
          if (!prev || prev.status !== "in_progress") return prev;
          const def = getTestById(prev.test_id);
          if (!def) return prev;
          const item = def.items[prev.current_index];
          if (!item) return prev;
          const option = resolveOption(item.options, data?.instrument_answer);
          if (!option) return prev;

          const answer: TestAnswer = {
            item_id: item.id,
            option_id: option.id,
            value: option.value,
            label: option.label,
            speaker:
              normalizeSpeakerRole(data?.speaker_role ?? "") === "caregiver"
                ? "caregiver"
                : "patient",
          };

          const answers = [...prev.answers, answer];
          const nextIndex = prev.current_index + 1;

          if (nextIndex >= def.items.length) {
            const result = scoreTest(def, answers);
            setLastTestResult(result);
            setActiveInstrumentContext(null);
            return {
              ...prev,
              status: "completed",
              answers,
              current_index: def.items.length,
              completed_at: new Date().toISOString(),
              result,
            };
          }

          const nextItem = def.items[nextIndex];
          setActiveInstrumentContext({
            mode: "test",
            instrument_id: def.id,
            instrument_name: def.short_name,
            item_index: nextIndex,
            total_items: def.items.length,
            item_id: nextItem.id,
            item_prompt: nextItem.prompt,
            response_type: def.response_type,
            options: nextItem.options,
          });
          return {
            ...prev,
            answers,
            current_index: nextIndex,
          };
        });
      }

      const providerRaw = String(data?.provider ?? "").toLowerCase();
      const provider =
        providerRaw === "gemini" || providerRaw === "groq" || providerRaw === "openrouter"
          ? (providerRaw as "gemini" | "groq" | "openrouter")
          : null;
      setLastProvider(provider);

      const last = JSON.stringify({
        state: data.emotion_state,
        intensity: data.emotion_intensity,
        arousal: data.arousal,
        rapport: data.rapport,
        flags: data.flags,
        provider: provider ?? undefined,
      });
      localStorage.setItem("lastEmotion", last);
      setLastEmotionRaw(last);
    } catch (e: any) {
      const name = String(e?.name ?? "");
      const msgText = String(e?.message ?? "");
      const aborted = name === "AbortError" || /aborted/i.test(msgText);

      // Si fue abortada (navegación, doble envío, hot-reload), no lo mostramos como error.
      if (!aborted) {
        if (/401|unauthorized/i.test(msgText)) {
          setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
        } else {
          setError(msgText || "No se pudo enviar el mensaje.");
        }
      }
    } finally {
      setLoading(false);
      // Limpia el controller si esta llamada sigue siendo la activa
      if (requestAbortRef.current) {
        requestAbortRef.current = null;
      }
    }
  }, [
    userMessage,
    inputDisabled,
    transcript,
    caseObject,
    tutorEnabled,
    rollingSummary,
    activeInstrumentContext,
    targetSpeaker,
  ]);

  const askCurrentInstrumentItem = useCallback(async () => {
    if (!activeInstrumentContext) return;
    const lines = [
      `${activeInstrumentContext.mode === "scale" ? "Escala clínica" : "Test clínico"} ${activeInstrumentContext.instrument_name} · ítem ${activeInstrumentContext.item_index + 1}/${activeInstrumentContext.total_items}`,
      activeInstrumentContext.item_prompt,
      "Opciones codificadas para respuesta automática del paciente simulado.",
      "Responde como paciente simulado según el caso activo.",
    ];
    const message = lines.join("\n");
    await sendMessage({
      message,
      mode: activeInstrumentContext.mode,
      instrumentContext: activeInstrumentContext,
      speakerTarget: pediatricCase ? targetSpeaker : "patient",
      silent: true,
    });
  }, [activeInstrumentContext, pediatricCase, targetSpeaker, sendMessage]);

  useEffect(() => {
    if (!instrumentAutoRun) return;
    if (!activeInstrumentContext) return;
    if (loading || inputDisabled) return;
    const id = window.setTimeout(() => {
      void askCurrentInstrumentItem();
    }, 220);
    return () => window.clearTimeout(id);
  }, [instrumentAutoRun, activeInstrumentContext, loading, inputDisabled, askCurrentInstrumentItem]);

  if (!caseObject) {
    return (
      <div className="min-h-screen bg-[#070A0F]">
        <div className="mx-auto flex max-w-[1480px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
          <Sidebar />
          <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-xl sm:p-6 flex items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
              <h1 className="text-xl font-semibold">Psyke · No hay un caso activo</h1>
              <p className="mt-2 text-sm text-white/70">Vuelve a la biblioteca, genera un caso y presiona “Iniciar simulación”.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-black" href="/cases">
                  Simulador de trastornos mentales
                </Link>
                <Link className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-white/85" href="/medical-cases">
                  Simulador de patologías
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- New Claude-style UI Layout ---
  return (
    <div className="h-dvh overflow-hidden bg-[#070A0F]">
      <div className="mx-auto flex h-full max-w-[1480px] gap-3 px-3 pb-3 pt-14 sm:gap-6 sm:px-4 sm:py-4 md:pt-4">
        <Sidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
          {/* TOPNAV */}
          <header className="flex min-h-[56px] flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2 sm:px-5">
            <div className="flex items-center gap-2 text-xs text-white/70 sm:text-sm">
              <span className="font-semibold text-white">Psyke</span>
              <span className="text-white/30">·</span>
              <span className="hidden text-white/60 sm:inline">Sesión</span>
              <span className="hidden text-white/30 sm:inline">›</span>
              <span className="font-semibold text-white">Caso en curso</span>
            </div>

            {/* Approach badge */}
            <span
              className="hidden lg:inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70"
              title={isMedicalCase ? "Enfoque de entrevista clínica (educativo)" : "Enfoque psicoterapéutico (educativo)"}
            >
              Enfoque: {approachLabel}
            </span>

            <div className="ml-auto hidden w-full max-w-[360px] items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 xl:flex">
              <span className="text-xs text-white/50">Buscar</span>
              <input
                className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/35"
                placeholder={isMedicalCase ? "Buscar en Biblioteca de patologías…" : "Buscar en Biblioteca Clínica DSM-5…"}
              />
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {/* Cronómetro */}
              <div
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm ${
                  timeIsLow
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    : "border-white/15 bg-black/30 text-white/80"
                }`}
                title="Tiempo restante de la sesión"
              >
                <span className="hidden text-xs opacity-80 sm:inline">Tiempo</span>
                <span className="font-semibold tabular-nums">{timeLabel}</span>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="rounded-xl border border-white/15 px-2.5 py-1.5 text-xs hover:bg-white/5 sm:px-3 sm:py-2 sm:text-sm"
                title="Configuraciones"
              >
                Config
              </button>
              <button
                type="button"
                onClick={() => {
                  setRightPanelCollapsed(false);
                  setMobileRightOpen(true);
                }}
                className="rounded-xl border border-white/15 px-2.5 py-1.5 text-xs hover:bg-white/5 lg:hidden"
                title="Abrir panel clínico"
              >
                Panel
              </button>
              <button
                type="button"
                onClick={() => setSummaryDebugOpen((v) => !v)}
                className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 sm:inline-flex"
                title="Ver/ocultar resumen vivo (debug)"
              >
                Resumen
              </button>
              <button
                type="button"
                onClick={() => setRightPanelCollapsed((v) => !v)}
                className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 lg:inline-flex"
                title={rightPanelCollapsed ? "Mostrar panel clínico" : "Expandir chat"}
              >
                {rightPanelCollapsed ? "Mostrar panel clínico" : "Expandir chat"}
              </button>

              <Link href={backHref} className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 sm:inline-flex">
                Volver
              </Link>

              <Link
                href={clinicalHref}
                className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 lg:inline-flex"
                title={isMedicalCase ? "Abrir Biblioteca de patologías" : clinicalDxId ? `Abrir ficha: ${clinicalDxId}` : "Abrir Biblioteca clínica"}
              >
                {libraryButtonLabel}
              </Link>

              <button
                onClick={() => finishSession("manual")}
                className="rounded-xl bg-white px-3 py-1.5 text-xs text-black sm:py-2 sm:text-sm"
              >
                Finalizar
              </button>
            </div>
          </header>

          {/* EDUCATIONAL PANEL */}
          <section className="border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3 px-3 py-3 sm:px-5">
              <button
                onClick={() => setEduExpanded((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 hover:bg-black/40"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>{eduExpanded ? "Colapsar panel educativo" : "Expandir panel educativo"}</span>
                <span className="text-white/40">{eduExpanded ? "▴" : "▾"}</span>
              </button>

              <span className="text-xs text-white/50">Panel educativo activo</span>

              <div className="ml-auto hidden items-center gap-2 md:flex">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                  Modo: Guiado
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    riskLevel === "Alto"
                      ? "border-red-400/25 bg-red-400/10 text-red-100"
                      : riskLevel === "Moderado"
                      ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
                      : riskLevel === "Bajo"
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                      : "border-white/15 bg-black/30 text-white/70"
                  }`}
                >
                  {riskBadgeLabel}: {riskLevel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                  {clinicalDxId ? `${codeBadgeLabel}: ${clinicalDxId}` : `${codeBadgeLabel}: —`}
                </span>
              </div>
            </div>

            {eduExpanded && (
              <div className="px-3 pb-4 sm:px-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[260px] flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/50">{isMedicalCase ? "Valoración clínica (guía rápida)" : "DSM-5 (guía rápida)"}</div>
                    <div className="mt-1 text-sm font-semibold text-white">Estructura sugerida</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                      {isMedicalCase ? (
                        <>
                          <li>Motivo de consulta + cronología del cuadro.</li>
                          <li>Síntomas clave, severidad y factores de alarma.</li>
                          <li>Antecedentes, medicación y barreras de adherencia.</li>
                          <li>Cierre con priorización clínica y plan educativo.</li>
                        </>
                      ) : (
                        <>
                          <li>Apertura empática + motivo de consulta.</li>
                          <li>Explora síntomas, duración e impacto funcional.</li>
                          <li>Si hay señales de riesgo, prioriza seguridad.</li>
                          <li>Cierra con resumen y plan.</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/50">Tip del tutor IA</div>
                    <div className="mt-2 text-sm text-white/75">
                      {isMedicalCase ? (
                        <>
                          Antes de cerrar, confirma <span className="font-semibold text-white">signos de alarma</span>, estado funcional y
                          plan de <span className="font-semibold text-white">seguimiento/derivación</span>.
                        </>
                      ) : (
                        <>
                          Antes de cerrar el MSE, pregunta por <span className="font-semibold text-white">impacto funcional</span> y
                          una <span className="font-semibold text-white">pregunta de seguridad</span> si hay señales.
                        </>
                      )}
                    </div>
                  </div>

                  <Link
                    href={clinicalHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    {isMedicalCase ? "Abrir Biblioteca de patologías" : "Abrir Biblioteca clínica"}
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* CONTENT AREA */}
          <div className="relative flex min-h-0 flex-1">
            {/* CHAT PANEL */}
            <section className={`flex min-h-0 min-w-0 flex-1 flex-col bg-black/10 ${rightPanelCollapsed ? "lg:flex-[1_1_100%]" : ""}`}>
              {/* Chat header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/5 px-3 py-3 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-red-500 text-center text-sm font-semibold leading-9 text-black">
                    {String(patientName).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">Paciente: “{patientName}”</div>
                    <div className="text-xs text-white/55">
                      Modo educativo · No diagnostica · {sessionStartedAt ? `Inicio: ${new Date(sessionStartedAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                </div>

                <div className="ml-auto hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 lg:flex">
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                    Estado: {emotionLabel[lastMeta.state] ?? lastMeta.state}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                    Enfoque: {approachLabel}
                  </span>
                  {pediatricCase && (
                    <span className="rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-xs text-lime-100">
                      Fuente activa: {targetSpeaker === "caregiver" ? "Acompañante" : targetSpeaker === "both" ? "Ambos" : "Paciente"}
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      riskLevel === "Alto"
                        ? "border-red-400/25 bg-red-400/10 text-red-100"
                        : riskLevel === "Moderado"
                        ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
                        : riskLevel === "Bajo"
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                        : "border-white/15 bg-black/30 text-white/70"
                    }`}
                  >
                    {riskBadgeLabel}: {riskLevel}
                  </span>

                  {lastProvider && (
                    <span
                      className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70"
                      title="Proveedor que generó la respuesta"
                    >
                      {String(lastProvider).toUpperCase()}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setRightTab("risk")}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                    title={isMedicalCase ? "Abrir módulo de urgencia y seguridad" : "Abrir módulo de seguridad"}
                  >
                    {isMedicalCase ? "Urgencia" : "Seguridad"}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
                {summaryDebugOpen && (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-black/35 p-3">
                    <div className="text-xs text-white/50">Resumen vivo (debug)</div>
                    <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-white/70">
                      {rollingSummary || "(vacío)"}
                    </pre>
                  </div>
                )}

                {timeIsLow && remainingSec != null && remainingSec > 0 && (
                  <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                    Queda poco tiempo: <span className="font-semibold">{timeLabel}</span>. Enfoca el cierre (resumen + plan).
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {transcript.length === 0 ? (
                    <div className="text-sm text-white/70">Escribe tu primer mensaje para iniciar la entrevista.</div>
                  ) : (
                    transcript.map((t, idx) => {
                      const isUser = t.role === "user";
                      const isTutor = t.role === "tutor";
                      const isCaregiver = t.role === "caregiver";
                      const align = isUser ? "justify-end" : "justify-start";

                      const avatar = isTutor
                        ? { label: "IA", cls: "bg-gradient-to-br from-emerald-400 to-teal-500" }
                        : isCaregiver
                        ? { label: "A", cls: "bg-gradient-to-br from-lime-400 to-emerald-500" }
                        : isUser
                        ? { label: "E", cls: "bg-gradient-to-br from-blue-500 to-purple-500" }
                        : { label: String(patientName).slice(0, 1).toUpperCase(), cls: "bg-gradient-to-br from-amber-400 to-red-500" };

                      const roleLabel = isTutor
                        ? "Tutor IA"
                        : isUser
                        ? "Estudiante (Tú)"
                        : isCaregiver
                        ? `${companionName} (Acompañante)`
                        : `${patientName} (Paciente)`;

                      const bubbleCls = isTutor
                        ? t.kind === "alert"
                          ? "border border-amber-400/25 bg-amber-400/10 text-amber-100"
                          : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                        : isUser
                        ? "bg-white text-black"
                        : "border border-white/10 bg-black/40 text-white/85";

                      return (
                        <div key={idx} className={`flex gap-2 ${align}`}>
                          {!isUser && (
                            <div className={`h-7 w-7 flex-shrink-0 rounded-full ${avatar.cls} text-center text-[11px] font-semibold leading-7 text-black`}>
                              {avatar.label}
                            </div>
                          )}

                          <div className={`${rightPanelCollapsed ? "max-w-[92%] lg:max-w-[92%]" : "max-w-[92%] lg:max-w-[86%]"} ${isUser ? "text-right" : "text-left"}`}>
                            <div className={`mb-1 text-[10px] text-white/50 ${isUser ? "text-right" : "text-left"}`}>
                              {roleLabel}
                            </div>

                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${bubbleCls}`}>
                              {isTutor && (
                                <div
                                  className={`mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                    t.kind === "alert"
                                      ? "bg-amber-400/15 text-amber-200"
                                      : "bg-emerald-400/15 text-emerald-200"
                                  }`}
                                >
                                  {t.kind === "alert" ? "Alerta de seguridad" : "Sugerencia clínica"}
                                </div>
                              )}
                              <div className={isTutor ? "text-white/90" : undefined}>{t.content}</div>
                            </div>
                          </div>

                          {isUser && (
                            <div className={`h-7 w-7 flex-shrink-0 rounded-full ${avatar.cls} text-center text-[11px] font-semibold leading-7 text-black`}>
                              {avatar.label}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
                    {error}
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="border-t border-white/10 bg-white/5 px-3 py-3 sm:px-5">
                {pediatricCase && (
                  <div className="mb-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="text-xs text-white/55">Fuente dual (pediatría)</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetSpeaker("patient")}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          targetSpeaker === "patient"
                            ? "border-white/25 bg-white/10 text-white"
                            : "border-white/15 bg-black/30 text-white/70"
                        }`}
                      >
                        Preguntar al paciente
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetSpeaker("caregiver")}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          targetSpeaker === "caregiver"
                            ? "border-white/25 bg-white/10 text-white"
                            : "border-white/15 bg-black/30 text-white/70"
                        }`}
                      >
                        Preguntar al acompañante
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSpeaker("both");
                          setUserMessage("Quisiera explorar dinámica familiar, escuela y desarrollo reciente.");
                        }}
                        className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70"
                      >
                        Explorar dinámica familiar
                      </button>
                    </div>
                    <div className="mt-2 text-[11px] text-white/50">
                      Activo: {targetSpeaker === "caregiver" ? companionName : targetSpeaker === "both" ? "Ambos" : patientName}
                    </div>
                  </div>
                )}

                <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-2">
                  {Object.keys(quickChipMap ?? {}).map((label) => {
                    const isRisk = label.includes("Riesgo") || label.toLowerCase().includes("alarma");
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const list = (quickChipMap as any)[label] as string[] | undefined;
                          const opts = Array.isArray(list) ? list : [];
                          const pick = opts.length ? opts[Math.floor(Math.random() * opts.length)] : "";
                          setUserMessage(pick);
                        }}
                        className={`max-w-full rounded-full border px-3 py-1.5 text-xs leading-snug transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-[0.99] ${
                          isRisk
                            ? "border-red-400/30 bg-red-400/10 text-red-100"
                            : "border-white/15 bg-black/30 text-white/70"
                        }`}
                      >
                        <span className="whitespace-normal break-words">{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!inputDisabled) void sendMessage();
                      }
                    }}
                    placeholder={remainingSec != null && remainingSec <= 0 ? "Sesión finalizada" : "Escribe tu pregunta clínica…"}
                    disabled={inputDisabled}
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/20 disabled:opacity-60"
                  />

                  <button
                    onClick={() => void sendMessage()}
                    disabled={inputDisabled}
                    className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-60"
                  >
                    {loading ? "Enviando…" : "Enviar"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-white/50">Educativo: no diagnostica. Usa información ficticia.</p>
              </div>
            </section>

            {mobileRightOpen && (
              <button
                type="button"
                onClick={() => setMobileRightOpen(false)}
                className="fixed inset-0 z-40 bg-black/65 lg:hidden"
                aria-label="Cerrar panel clínico"
              />
            )}

            {/* RIGHT PANEL */}
            <aside
              className={`fixed inset-y-0 right-0 z-50 flex w-[92vw] max-w-[430px] flex-col border-l border-white/10 bg-[#10131A] shadow-[-24px_0_60px_rgba(0,0,0,0.45)] transition-transform duration-200 lg:static lg:inset-auto lg:z-auto lg:w-[390px] lg:max-w-none lg:bg-white/5 lg:shadow-none ${
                mobileRightOpen ? "translate-x-0" : "translate-x-full"
              } ${rightPanelCollapsed ? "lg:hidden" : "lg:translate-x-0"}`}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 lg:hidden">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Panel clínico</div>
                <button
                  type="button"
                  onClick={() => setMobileRightOpen(false)}
                  className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/80"
                >
                  Cerrar
                </button>
              </div>

              <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3">
                {(
                  [
                    ["patient", "Paciente"],
                    ["mse", isMedicalCase ? "Examen" : "MSE"],
                    ["dsm", isMedicalCase ? "Impresión" : "DSM-5"],
                    ["risk", isMedicalCase ? "Urgencia" : "Seguridad"],
                    ["scales", "Escalas"],
                    ["tests", "Tests"],
                    ["batteries", "Baterías"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setRightTab(key);
                      if (window.innerWidth < 1024) setMobileRightOpen(false);
                    }}
                    className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition ${
                      rightTab === key ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {rightTab === "patient" && (
                  <div className="space-y-4">
                    {isMedicalCase ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="text-sm text-white/60">Paciente</div>
                        <div className="mt-1 text-base font-semibold text-white">{patientName}</div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                            <div className="text-[11px] text-white/55">Estado clínico</div>
                            <div className="mt-1 text-sm text-white/85">{emotionLabel[lastMeta.state] ?? lastMeta.state}</div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                            <div className="text-[11px] text-white/55">Prioridad</div>
                            <div className="mt-1 text-sm text-white/85">{riskLevel}</div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-white/55">
                          Vista compacta para casos de patologías: prioridad en datos clínicos sobre avatar emocional.
                        </div>
                      </div>
                    ) : (
                      <AvatarCard
                        name={patientName}
                        stateKey={lastMeta.state}
                        stateLabel={emotionLabel[lastMeta.state] ?? lastMeta.state}
                        intensity={lastMeta.intensity}
                      />
                    )}

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Datos del caso</div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between"><span className="text-white/60">Alias</span><span className="text-white/85">{safeText(caseObject?.patient_profile?.display_name, patientName)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Edad</span><span className="text-white/85">{safeText(caseObject?.patient_profile?.age, "—")}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Sexo</span><span className="text-white/85">{safeText(caseObject?.patient_profile?.sex, "—")}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Ocupación</span><span className="text-white/85">{safeText(caseObject?.patient_profile?.occupation, "—")}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Estado civil</span><span className="text-white/85">{safeText(caseObject?.patient_profile?.marital_status, "—")}</span></div>
                        <div className="flex items-center justify-between"><span className="text-white/60">Derivación</span><span className="text-white/85">{safeText(caseObject?.patient_profile?.referral_source, "—")}</span></div>
                      </div>

                      {asStrArray(caseObject?.background_chips).length > 0 && (
                        <>
                          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Antecedentes</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {asStrArray(caseObject?.background_chips).slice(0, 12).map((c, i) => (
                              <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{c}</span>
                            ))}
                          </div>
                        </>
                      )}

                      {Array.isArray(caseObject?.timeline) && caseObject.timeline.length > 0 && (
                        <>
                          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Línea temporal</div>
                          <div className="mt-3 space-y-3">
                            {(caseObject.timeline as any[]).slice(0, 6).map((it, i) => {
                              const lvl = String(it?.level ?? "normal").toLowerCase();
                              const dot = lvl === "warning" ? "bg-amber-400" : lvl === "neutral" ? "bg-white/25" : "bg-white";
                              return (
                                <div key={i} className="flex gap-3">
                                  <div className={`mt-1 h-2 w-2 rounded-full ${dot}`} />
                                  <div className="min-w-0">
                                    <div className="text-xs text-white/50">{safeText(it?.date_label, "—")}</div>
                                    <div className="text-sm text-white/75">{safeText(it?.text, "")}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {pediatricCase && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Checklist pediátrico</div>
                        <div className="mt-2 text-xs text-white/55">
                          Grupo etario detectado: {caseAgeGroup === "child" ? "Niñez" : "Adolescencia"}.
                        </div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/75">
                          {pediatricExplorationChecklist().map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Señales (flags)</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.isArray(lastMeta.flags) && lastMeta.flags.length ? (
                          lastMeta.flags
                            .map((x: any) => String(x))
                            .filter(Boolean)
                            .slice(0, 16)
                            .map((f: string, i: number) => (
                              <span key={i} className={`rounded-full border px-3 py-1 text-xs ${chipClass(f)}`}>{prettyFlag(f)}</span>
                            ))
                        ) : (
                          <span className="text-xs text-white/50">Sin señales marcadas aún.</span>
                        )}
                      </div>
                      <div className="mt-2 text-[11px] text-white/45">Guían tu entrevista. No son diagnóstico.</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Notas de sesión</div>
                      {sessionNotes.length === 0 ? (
                        <div className="mt-2 text-xs text-white/55">Sin notas guardadas aún.</div>
                      ) : (
                        <ul className="mt-2 space-y-2 text-xs text-white/75">
                          {sessionNotes.slice(0, 8).map((n, i) => (
                            <li key={`${i}:${n.slice(0, 18)}`} className="rounded-xl border border-white/10 bg-black/30 p-2">
                              {n}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {rightTab === "mse" && (
                  <div className="space-y-2">
                    {isMedicalCase ? (
                      <>
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                          Exámenes clínicos sugeridos
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <label className="text-xs text-white/60">Selecciona examen</label>
                          <select
                            value={selectedMedicalExamId}
                            onChange={(e) => setSelectedMedicalExamId(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            {medicalExamCatalog.map((exam) => (
                              <option key={exam.id} value={exam.id}>
                                {exam.short_name} · {exam.name}
                              </option>
                            ))}
                          </select>

                          {selectedMedicalExam && (
                            <div className="mt-3 text-xs text-white/60">
                              <div>Categoría: {selectedMedicalExam.category}</div>
                              <div className="mt-1 text-white/50">{selectedMedicalExam.description}</div>
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => selectedMedicalExamId && runSingleMedicalExam(selectedMedicalExamId)}
                              disabled={!selectedMedicalExamId}
                              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/80 disabled:opacity-50"
                            >
                              Ejecutar examen oculto
                            </button>
                            <button
                              type="button"
                              onClick={runMedicalExamBundle}
                              disabled={!medicalExamCatalog.length || runningMedicalExam}
                              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
                            >
                              {runningMedicalExam ? "Ejecutando..." : "Autoejecutar panel básico"}
                            </button>
                          </div>

                          <div className="mt-2 text-[11px] text-white/50">
                            Ejecución oculta: los resultados no se muestran en el chat, solo en este panel.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Resultados</div>
                          {medicalExamResults.length === 0 ? (
                            <div className="mt-2 text-xs text-white/55">Aún no hay exámenes ejecutados.</div>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {medicalExamResults.slice(0, 8).map((result) => (
                                <div key={`${result.exam_id}:${result.completed_at}`} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-semibold text-white">{result.exam_name}</div>
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${examStatusClass(result.status)}`}>
                                      {examStatusLabel(result.status)}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs text-white/75">{result.summary}</div>
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/70">
                                    {result.findings.slice(0, 3).map((finding) => (
                                      <li key={finding}>{finding}</li>
                                    ))}
                                  </ul>
                                  <div className="mt-2 text-[11px] text-white/55">{result.interpretation}</div>
                                  {result.red_flags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {result.red_flags.slice(0, 4).map((flag) => (
                                        <span key={flag} className="rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 text-[10px] text-red-100">
                                          {flag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => addNote(`[Examen ${result.exam_name}] ${result.summary}. ${result.interpretation}`)}
                                      className="rounded-xl border border-white/15 bg-black/30 px-2.5 py-1 text-[11px] text-white/80"
                                    >
                                      Guardar en notas
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setRightTab("risk")}
                          className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-black/40"
                        >
                          Ir a Urgencia y seguridad
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Examen Mental (MSE)</div>
                        {(() => {
                          const tmpl = Array.isArray(caseObject?.mse_template) ? (caseObject.mse_template as any[]) : [];
                          const fallback = [
                            { key: "appearance", title: "Apariencia / Conducta", chips: ["Adecuada", "Descuidada", "Agitación", "Enlentecimiento"], note_prompt: "Nota clínica…" },
                            { key: "speech", title: "Habla / Lenguaje", chips: ["Fluida", "Enlentecida", "Escasa", "Latencia ↑"], note_prompt: "Nota clínica…" },
                            { key: "mood", title: "Ánimo / Afecto", chips: ["Deprimido", "Eutímico", "Ansioso", "Lábil", "Restringido"], note_prompt: "Nota clínica…" },
                            { key: "thought", title: "Pensamiento", chips: ["Coherente", "Rumiación", "Desesperanza", "Lentificado"], note_prompt: "Nota clínica…" },
                            { key: "perception", title: "Percepción", chips: ["Sin alteraciones", "Alucinaciones", "Ilusiones"], note_prompt: "Nota clínica…" },
                            { key: "cognition", title: "Cognición", chips: ["Orientada", "Concentración ↓", "Memoria OK"], note_prompt: "Nota clínica…" },
                            { key: "insight", title: "Insight / Juicio", chips: ["Conciencia parcial", "Niega enfermedad", "Juicio conservado"], note_prompt: "Nota clínica…" },
                          ];
                          const sections = tmpl.length ? tmpl : fallback;
                          return sections.map((sec) => {
                            const title = safeText(sec?.title, "Sección");
                            const key = safeText(sec?.key, title);
                            const chips = asStrArray(sec?.chips);
                            const notePrompt = safeText(sec?.note_prompt, "Nota clínica…");
                            return (
                              <div key={key} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                                <button onClick={() => toggleMse(key)} className="flex w-full items-center justify-between px-3 py-2 text-left">
                                  <span className="text-sm text-white/85">{title}</span>
                                  <span className="text-xs text-white/40">{mseOpen[key] ? "—" : "+"}</span>
                                </button>
                                {mseOpen[key] && (
                                  <div className="border-t border-white/10 px-3 py-3">
                                    {chips.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {chips.slice(0, 16).map((c: string, i: number) => (
                                          <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{c}</span>
                                        ))}
                                      </div>
                                    )}
                                    <textarea
                                      rows={2}
                                      className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm text-white/80 outline-none placeholder:text-white/35"
                                      placeholder={notePrompt}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                        <button
                          type="button"
                          onClick={() => setRightTab("risk")}
                          className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-black/40"
                        >
                          Ir a Seguridad
                        </button>
                      </>
                    )}
                  </div>
                )}

                {rightTab === "dsm" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {isMedicalCase ? "Impresión clínica orientativa" : "DSM-5"}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {safeText(caseObject?.dsm?.primary?.label, isMedicalCase ? "Problema clínico principal" : "Hipótesis principal")}
                        </div>
                        <div className="text-xs text-white/60">{safeText(caseObject?.meta?.dsm_tag, "—")}</div>
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        {isMedicalCase ? "Prioridad clínica" : "Confianza"}:{" "}
                        <span className="font-semibold text-white">{safeText(caseObject?.dsm?.primary?.confidence, "—")}</span>
                      </div>

                      {Array.isArray(caseObject?.dsm?.primary?.criteria) && caseObject.dsm.primary.criteria.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {(caseObject.dsm.primary.criteria as any[]).slice(0, 8).map((c, i) => {
                            const status = String(c?.status ?? "no").toLowerCase();
                            const badge =
                              status === "yes"
                                ? "bg-emerald-400/15 text-emerald-200 border-emerald-400/20"
                                : status === "partial"
                                ? "bg-amber-400/15 text-amber-200 border-amber-400/20"
                                : "bg-black/30 text-white/60 border-white/10";
                            const label = status === "yes" ? "✓" : status === "partial" ? "~" : "·";
                            return (
                              <div key={i} className="flex items-start gap-2">
                                <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border text-xs ${badge}`}>{label}</span>
                                <div className="text-sm text-white/75">{safeText(c?.text, "")}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {asStrArray(caseObject?.dsm?.differentials).length > 0 && (
                        <>
                          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                            {isMedicalCase ? "Diagnósticos diferenciales" : "Diferenciales"}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {asStrArray(caseObject?.dsm?.differentials).slice(0, 10).map((d, i) => (
                              <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{d}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {rightTab === "risk" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {isMedicalCase ? "Urgencia y seguridad" : "Seguridad"}
                    </div>
                    <div
                      className={`rounded-2xl border p-4 ${
                        riskLevel === "Alto"
                          ? "border-red-400/25 bg-red-400/10"
                          : riskLevel === "Moderado"
                          ? "border-amber-400/25 bg-amber-400/10"
                          : riskLevel === "Bajo"
                          ? "border-emerald-400/25 bg-emerald-400/10"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {isMedicalCase ? "Prioridad clínica actual" : "Riesgo suicida"}
                        </div>
                        <div className="text-xs text-white/70">{riskLevel}</div>
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        {safeText(
                          caseObject?.safety?.summary,
                          isMedicalCase
                            ? "Si detectas deterioro, prioriza estabilización, reevaluación y escalamiento clínico (educativo)."
                            : "Si detectas señales, prioriza evaluación de riesgo y factores protectores (educativo)."
                        )}
                      </div>
                      <div className="mt-3 grid gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            runRiskWorkflow(
                              isMedicalCase ? "medical_alert_checklist" : "mental_cssrs"
                            )
                          }
                          disabled={runningRiskWorkflow != null}
                          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-black/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {runningRiskWorkflow ===
                          (isMedicalCase ? "medical_alert_checklist" : "mental_cssrs")
                            ? "Ejecutando..."
                            : isMedicalCase
                            ? "Checklist de signos de alarma"
                            : "Aplicar Mini C-SSRS"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runRiskWorkflow(
                              isMedicalCase
                                ? "medical_stabilization_plan"
                                : "mental_safety_plan"
                            )
                          }
                          disabled={runningRiskWorkflow != null}
                          className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {runningRiskWorkflow ===
                          (isMedicalCase
                            ? "medical_stabilization_plan"
                            : "mental_safety_plan")
                            ? "Construyendo plan..."
                            : isMedicalCase
                            ? "Plan inicial de estabilización"
                            : "Crear plan de seguridad"}
                        </button>
                      </div>
                      {(asStrArray(caseObject?.safety?.risk_factors).length > 0 || asStrArray(caseObject?.safety?.protective_factors).length > 0) && (
                        <div className="mt-4 grid gap-3">
                          {asStrArray(caseObject?.safety?.risk_factors).length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                                {isMedicalCase ? "Factores agravantes" : "Factores de riesgo"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {asStrArray(caseObject?.safety?.risk_factors).slice(0, 10).map((x, i) => (
                                  <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{x}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {asStrArray(caseObject?.safety?.protective_factors).length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                                {isMedicalCase ? "Recursos protectores" : "Factores protectores"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {asStrArray(caseObject?.safety?.protective_factors).slice(0, 10).map((x, i) => (
                                  <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{x}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {asStrArray(caseObject?.safety?.cssrs_hint).length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                                {isMedicalCase ? "Preguntas de seguridad sugeridas" : "Mini C-SSRS sugerido"}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {asStrArray(caseObject?.safety?.cssrs_hint).slice(0, 10).map((x, i) => (
                                  <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{x}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-3 text-xs text-white/55">
                        {isMedicalCase ? (
                          <>
                            <span className="font-semibold">Si urgencia alta:</span> activar protocolo institucional y derivación a urgencias.
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">Si riesgo alto:</span> derivación a urgencias y no dejar sin acompañante.
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                          {isMedicalCase
                            ? "Acciones de urgencia ejecutadas"
                            : "Acciones de seguridad ejecutadas"}
                        </div>
                        {riskWorkflowHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setRiskWorkflowHistory([])}
                            className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/70 hover:bg-white/5"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      {riskWorkflowHistory.length === 0 ? (
                        <div className="mt-2 text-xs text-white/55">
                          No hay acciones ejecutadas aún. Ejecuta checklist o plan para registrar resultados.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {riskWorkflowHistory.slice(0, 5).map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-xl border border-white/10 bg-black/30 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-semibold text-white">{entry.title}</div>
                                <div className="text-[10px] text-white/45">
                                  {new Date(entry.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-white/75">{entry.summary}</div>
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/70">
                                {entry.items.slice(0, 4).map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                              <div className="mt-2 text-[11px] text-white/55">{entry.caution}</div>
                              <button
                                type="button"
                                onClick={() =>
                                  addNote(
                                    `[${entry.title}] ${entry.summary} | ${entry.items
                                      .slice(0, 3)
                                      .join(" · ")}`
                                  )
                                }
                                className="mt-2 rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/75 hover:bg-white/5"
                              >
                                Guardar en notas
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Señales detectadas</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.isArray(lastMeta.flags) && lastMeta.flags.length ? (
                          lastMeta.flags
                            .map((x: any) => String(x))
                            .filter((f: string) => flagCategory(f) === "Riesgo")
                            .slice(0, 12)
                            .map((f: string, i: number) => (
                              <span key={i} className={`rounded-full border px-3 py-1 text-xs ${chipClass(f)}`}>{prettyFlag(f)}</span>
                            ))
                        ) : (
                          <span className="text-xs text-white/50">Sin señales de riesgo aún.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {rightTab === "scales" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {isMedicalCase ? "Escalas clínicas (patologías)" : "Escalas clínicas"}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <label className="text-xs text-white/60">Selecciona escala</label>
                      <select
                        value={selectedScaleId}
                        onChange={(e) => setSelectedScaleId(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                      >
                        {scaleCatalog.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.short_name} · {s.name}
                          </option>
                        ))}
                      </select>

                      {selectedScale && (
                        <div className="mt-3 text-xs text-white/60">
                          <div>Población: {selectedScale.population}</div>
                          <div>Rango sugerido: {selectedScale.suggested_age_range}</div>
                          <div className="mt-1 text-white/50">{selectedScale.description}</div>
                          {selectedScale.placeholder && (
                            <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-amber-100">
                              Placeholder técnico: escala pendiente de validar/reemplazar.
                            </div>
                          )}
                        </div>
                      )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startScaleInChat(false)}
                        className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/80"
                      >
                        Paso a paso (oculto)
                      </button>
                      <button
                        type="button"
                        onClick={() => startScaleInChat(true)}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
                      >
                        Autoejecutar oculto
                      </button>
                      {activeInstrumentContext?.mode === "scale" && !instrumentAutoRun && (
                        <button
                          type="button"
                          onClick={() => void askCurrentInstrumentItem()}
                          disabled={loading || inputDisabled}
                          className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50"
                        >
                          Ejecutar siguiente ítem
                        </button>
                      )}
                      {activeInstrumentContext?.mode === "scale" && (
                        <button
                          type="button"
                          onClick={cancelActiveInstrument}
                          className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-100"
                          >
                            Cancelar escala
                          </button>
                        )}
                      </div>
                    </div>

                    {scaleSession && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs text-white/60">
                          Estado: <span className="text-white/85">{scaleSession.status}</span>
                        </div>
                        {activeInstrumentContext?.mode === "scale" && (
                          <div className="mt-1 text-xs text-cyan-100/90">
                            Aplicación oculta en curso (sin mostrar ítems en el chat).
                          </div>
                        )}
                        <div className="mt-1 text-xs text-white/60">
                          Ítems respondidos: {scaleSession.answers.length} / {selectedScale?.items.length ?? "—"}
                        </div>
                        {lastScaleResult && (
                          <div
                            className={`mt-3 rounded-xl border p-3 text-sm ${
                              lastScaleResult.risk_alert
                                ? "border-red-400/25 bg-red-400/10 text-red-100"
                                : "border-white/10 bg-black/30 text-white/80"
                            }`}
                          >
                            <div className="font-semibold">
                              Score: {lastScaleResult.total_score}/{lastScaleResult.max_score} · {lastScaleResult.severity_label}
                            </div>
                            <div className="mt-1">{lastScaleResult.interpretation}</div>
                            <div className="mt-1 text-xs text-white/60">{lastScaleResult.educational_note}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  addNote(
                                    `[Escala ${selectedScale?.short_name}] ${lastScaleResult.total_score}/${lastScaleResult.max_score} · ${lastScaleResult.severity_label}: ${lastScaleResult.interpretation}`
                                  )
                                }
                                className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80"
                              >
                                Guardar en notas de sesión
                              </button>
                              <button
                                type="button"
                                onClick={() => setUseScaleInFeedback((v) => !v)}
                                className={`rounded-xl border px-3 py-1.5 text-xs ${
                                  useScaleInFeedback
                                    ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
                                    : "border-white/15 bg-black/30 text-white/80"
                                }`}
                              >
                                {useScaleInFeedback ? "Usando en feedback final" : "Usar resultado en retroalimentación final"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {rightTab === "tests" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {isMedicalCase ? "Tests clínicos orientativos" : "Tests mentales"}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <label className="text-xs text-white/60">Selecciona test</label>
                      <select
                        value={selectedTestId}
                        onChange={(e) => setSelectedTestId(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                      >
                        {testCatalog.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.short_name} · {t.name}
                          </option>
                        ))}
                      </select>
                      {selectedTest && (
                        <div className="mt-3 text-xs text-white/60">
                          <div>Tipo: {selectedTest.kind === "screening" ? "Tamizaje" : "Evaluación orientativa"}</div>
                          <div>Aplica a: {labelAppliesTo(selectedTest.applies_to)}</div>
                          <div className="mt-1 text-white/50">{selectedTest.description}</div>
                        </div>
                      )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startTestInChat(false)}
                        className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/80"
                      >
                          Paso a paso (oculto)
                      </button>
                      <button
                        type="button"
                        onClick={() => startTestInChat(true)}
                        className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
                      >
                          Autoejecutar oculto
                      </button>
                      {activeInstrumentContext?.mode === "test" && !instrumentAutoRun && (
                        <button
                          type="button"
                          onClick={() => void askCurrentInstrumentItem()}
                          disabled={loading || inputDisabled}
                          className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50"
                        >
                          Ejecutar siguiente ítem
                        </button>
                      )}
                      {activeInstrumentContext?.mode === "test" && (
                        <button
                          type="button"
                          onClick={cancelActiveInstrument}
                          className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-100"
                          >
                            Cancelar test actual
                          </button>
                        )}
                      </div>
                    </div>

                    {testSession && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs text-white/60">
                          Estado: <span className="text-white/85">{testSession.status}</span>
                        </div>
                        {activeInstrumentContext?.mode === "test" && (
                          <div className="mt-1 text-xs text-cyan-100/90">
                            Test en ejecución oculta (sin mostrar ítems en el chat).
                          </div>
                        )}
                        <div className="mt-1 text-xs text-white/60">
                          Ítems respondidos: {testSession.answers.length} / {selectedTest?.items.length ?? "—"}
                        </div>
                        {lastTestResult && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/80">
                            <div className="font-semibold">
                              Score: {lastTestResult.total_score}/{lastTestResult.max_score} · {lastTestResult.classification}
                            </div>
                            <div className="mt-1">{lastTestResult.interpretation}</div>
                            {lastTestResult.observations.length > 0 && (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/70">
                                {lastTestResult.observations.map((o, i) => (
                                  <li key={i}>{o}</li>
                                ))}
                              </ul>
                            )}
                            {lastTestResult.limitations.length > 0 && (
                              <div className="mt-2 text-xs text-white/60">
                                Limitaciones: {lastTestResult.limitations.join(" · ")}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-white/60">{lastTestResult.educational_note}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  addNote(
                                    `[Test ${selectedTest?.short_name}] ${lastTestResult.total_score}/${lastTestResult.max_score} · ${lastTestResult.classification}: ${lastTestResult.interpretation}`
                                  )
                                }
                                className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80"
                              >
                                Guardar en notas de sesión
                              </button>
                              <button
                                type="button"
                                onClick={() => setUseTestInFeedback((v) => !v)}
                                className={`rounded-xl border px-3 py-1.5 text-xs ${
                                  useTestInFeedback
                                    ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
                                    : "border-white/15 bg-black/30 text-white/80"
                                }`}
                              >
                                {useTestInFeedback ? "Usando en feedback final" : "Usar resultado en retroalimentación final"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {rightTab === "batteries" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      {isMedicalCase ? "Baterías clínicas de patologías" : "Baterías mentales"}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <label className="text-xs text-white/60">Selecciona batería</label>
                      <select
                        value={selectedBatteryId}
                        onChange={(e) => setSelectedBatteryId(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                      >
                        {batteryCatalog.map((battery) => (
                          <option key={battery.id} value={battery.id}>
                            {battery.name}
                          </option>
                        ))}
                      </select>

                      {selectedBattery && (
                        <div className="mt-3 text-xs text-white/60">
                          <div>Población: {selectedBattery.target_population}</div>
                          <div>Rango sugerido: {selectedBattery.suggested_age_range}</div>
                          <div className="mt-1 text-white/50">{selectedBattery.description}</div>
                          <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-2 text-[11px] text-white/65">
                            {selectedBattery.educational_note}
                          </div>
                          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">Secuencia</div>
                          <div className="mt-2 space-y-2">
                            {selectedBattery.steps.map((step, idx) => (
                              <div key={step.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/75">
                                {idx + 1}. {step.label} <span className="text-white/45">({step.mode === "scale" ? "Escala" : "Test"})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startBatteryInChat(false)}
                          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/80"
                        >
                          Iniciar paso a paso
                        </button>
                        <button
                          type="button"
                          onClick={() => startBatteryInChat(true)}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
                        >
                          Autoejecutar batería
                        </button>
                        {batterySession?.status === "in_progress" && activeInstrumentContext && !instrumentAutoRun && (
                          <button
                            type="button"
                            onClick={() => void askCurrentInstrumentItem()}
                            disabled={loading || inputDisabled}
                            className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50"
                          >
                            Ejecutar siguiente ítem
                          </button>
                        )}
                        {batterySession?.status === "in_progress" && (
                          <button
                            type="button"
                            onClick={cancelBatterySession}
                            className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-100"
                          >
                            Cancelar batería
                          </button>
                        )}
                      </div>
                    </div>

                    {(batteryViewSession || lastBatterySession) && batteryViewDef && batterySummary && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>Estado: <span className="text-white/85">{batteryViewSession?.status ?? "completed"}</span></span>
                          <span>
                            {batterySummary.completedSteps}/{batterySummary.totalSteps} pasos
                          </span>
                        </div>

                        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                          <div
                            className={`h-2 rounded-full ${batterySummary.highRisk ? "bg-red-300" : "bg-cyan-300"}`}
                            style={{ width: `${batterySummary.completionPct}%` }}
                          />
                        </div>

                        <div className="mt-3 space-y-2">
                          {batteryViewDef.steps.map((step, idx) => {
                            const done = (batteryViewSession?.step_results ?? []).some((r) => r.step_id === step.id);
                            const isCurrent = batteryViewSession?.status === "in_progress" && idx === batteryViewSession.current_step_index;
                            return (
                              <div
                                key={step.id}
                                className={`rounded-xl border px-3 py-2 text-xs ${
                                  done
                                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                                    : isCurrent
                                    ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                                    : "border-white/10 bg-black/30 text-white/70"
                                }`}
                              >
                                {idx + 1}. {step.label}
                              </div>
                            );
                          })}
                        </div>

                        {(batteryViewSession?.step_results ?? []).length > 0 && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/75">
                            <div className="font-semibold text-white/90">Reporte integrado</div>
                            <div className="mt-1">
                              {batterySummary.highRisk
                                ? "Se detectaron resultados de mayor severidad/riesgo en al menos un instrumento."
                                : "No se detectaron puntajes de alto riesgo en los instrumentos completados."}
                            </div>
                            {batterySummary.weakAreas.length > 0 && (
                              <div className="mt-2">
                                Áreas a reforzar: {batterySummary.weakAreas.join(" · ")}
                              </div>
                            )}
                            <div className="mt-2 text-white/60">
                              Resultado orientativo para entrenamiento. No sustituye valoración clínica real.
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const s = batteryViewSession;
                                  if (!s) return;
                                  addNote(
                                    `[Batería ${batteryViewDef.name}] ${batterySummary.completedSteps}/${batterySummary.totalSteps} pasos · ${
                                      batterySummary.highRisk ? "requiere seguimiento de seguridad" : "sin alerta crítica"
                                    }.`
                                  );
                                }}
                                className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80"
                              >
                                Guardar en notas de sesión
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </aside>
          </div>
          {/* SETTINGS MODAL */}
          {settingsOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0F1117] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">Configuraciones</div>
                    <div className="mt-1 text-sm text-white/60">
                      Ajustes educativos para guiar la entrevista. No reemplaza supervisión clínica.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="mt-5">
                  <label className="block text-xs text-white/60">Tutor IA (sugerencias)</label>
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-sm text-white/80">
                      {tutorEnabled ? "Activado" : "Desactivado"}
                      <div className="text-xs text-white/50">
                        {tutorEnabled
                          ? "Mostrará sugerencias/alertas durante la entrevista."
                          : "No se mostrarán mensajes del tutor en el chat."}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTutorEnabled((v) => {
                          const next = !v;
                          try {
                            localStorage.setItem("tutorEnabled", String(next));
                          } catch {
                            // ignore
                          }

                          // Persistir también en el caso activo para que sea parte de la configuración del escenario
                          setCaseObject((prev: any) => {
                            if (!prev) return prev;
                            const updated = { ...prev, meta: { ...(prev.meta ?? {}), tutor_enabled: next } };
                            try {
                              localStorage.setItem("activeCase", JSON.stringify(updated));
                            } catch {
                              // ignore
                            }
                            return updated;
                          });

                          return next;
                        });
                      }}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
                        tutorEnabled
                          ? "border-emerald-400/30 bg-emerald-400/20"
                          : "border-white/15 bg-black/30"
                      }`}
                      aria-pressed={tutorEnabled}
                      title="Activar o desactivar el tutor IA"
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                          tutorEnabled ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4" />
                  <label className="block text-xs text-white/60">
                    {isMedicalCase ? "Enfoque de entrevista clínica (guía)" : "Enfoque psicoterapéutico (guía)"}
                  </label>
                  <select
                    value={cfgApproach}
                    onChange={(e) => setCfgApproach(e.target.value as ApproachValue)}
                    className="mt-2 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="humanistic">{isMedicalCase ? "Centrado en persona" : "Humanístico"}</option>
                    <option value="cbt">{isMedicalCase ? "Estructurado por síntomas" : "Cognitivo-conductual (TCC)"}</option>
                    <option value="psychodynamic">{isMedicalCase ? "Narrativa y antecedentes" : "Psicodinámico"}</option>
                    <option value="systemic">Sistémico / familiar</option>
                  </select>

                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                    <div className="font-semibold text-white">¿Qué cambia?</div>
                    {isMedicalCase ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li><span className="font-semibold text-white">Centrado en persona</span>: empatía clínica y comunicación clara.</li>
                        <li><span className="font-semibold text-white">Estructurado por síntomas</span>: cronología, severidad y signos de alarma.</li>
                        <li><span className="font-semibold text-white">Narrativo/antecedentes</span>: contexto, comorbilidades y evolución.</li>
                        <li><span className="font-semibold text-white">Sistémico</span>: red familiar/social y barreras de adherencia.</li>
                      </ul>
                    ) : (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li><span className="font-semibold text-white">Humanístico</span>: empatía, validación, reflejos, preguntas abiertas.</li>
                        <li><span className="font-semibold text-white">TCC</span>: pensamiento–emoción–conducta, ejemplos concretos, activación/evitación.</li>
                        <li><span className="font-semibold text-white">Psicodinámico</span>: patrones relacionales, significados, defensas (sin interpretar de más).</li>
                        <li><span className="font-semibold text-white">Sistémico</span>: contexto, red de apoyo, roles y dinámica familiar.</li>
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applyApproach}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
