"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { addSession, type EndReason } from "../../lib/history";
import { getAuthFetchHeaders } from "@/src/lib/clientAuth";
import {
  CLINICAL_SCALES,
  MENTAL_TESTS,
  getScaleById,
  getTestById,
  scoreScale,
  scoreTest,
} from "@/src/lib/assessments";
import {
  CACES_CATEGORIES,
  getCacesQuestions,
  sampleQuestions,
} from "@/src/lib/caces";
import {
  deriveAgeGroup,
  isPediatricCase,
  normalizeSpeakerRole,
  pediatricExplorationChecklist,
} from "@/src/lib/clinicalRuntime";
import type {
  ActiveInstrumentContext,
  QuizQuestion,
  QuizResult,
  ScaleAnswer,
  ScaleSession,
  SpeakerRole,
  TestAnswer,
  TestSession,
} from "@/src/lib/types";

type TranscriptTurn = { role: "user" | "patient" | "caregiver" | "tutor"; content: string; kind?: "tip" | "alert" };
type ApproachValue = "humanistic" | "cbt" | "psychodynamic" | "systemic";
type CacesMode = "practice" | "quiz_5" | "simulacro_10" | "simulacro_20";

type QuizSession = {
  mode: CacesMode;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Array<{
    questionId: string;
    selected: "A" | "B" | "C" | "D" | null;
    correct: "A" | "B" | "C" | "D";
  }>;
  completed: boolean;
  showImmediate: boolean;
  result?: QuizResult;
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
  const [rightTab, setRightTab] = useState<"patient" | "mse" | "dsm" | "risk" | "scales" | "tests" | "caces">("patient");
  const [mseOpen, setMseOpen] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cfgApproach, setCfgApproach] = useState<ApproachValue>("humanistic");
  const [tutorEnabled, setTutorEnabled] = useState(true);
  const [targetSpeaker, setTargetSpeaker] = useState<SpeakerRole>("patient");

  // Escalas clínicas
  const [selectedScaleId, setSelectedScaleId] = useState<string>(CLINICAL_SCALES[0]?.id ?? "");
  const [scaleSession, setScaleSession] = useState<ScaleSession | null>(null);
  const [lastScaleResult, setLastScaleResult] = useState<ReturnType<typeof scoreScale> | null>(null);

  // Tests mentales
  const [selectedTestId, setSelectedTestId] = useState<string>(MENTAL_TESTS[0]?.id ?? "");
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [lastTestResult, setLastTestResult] = useState<ReturnType<typeof scoreTest> | null>(null);

  // CACES
  const [cacesCategory, setCacesCategory] = useState<string>("Salud mental y entrevista clínica");
  const [cacesDifficulty, setCacesDifficulty] = useState<"all" | "basic" | "intermediate" | "advanced">("all");
  const [cacesMode, setCacesMode] = useState<CacesMode>("practice");
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [lastQuizResult, setLastQuizResult] = useState<QuizResult | null>(null);

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
    if (tab === "patient" || tab === "mse" || tab === "dsm" || tab === "risk" || tab === "scales" || tab === "tests" || tab === "caces") {
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

  useEffect(() => {
    if (!caseObject) return;
    if (!pediatricCase) setTargetSpeaker("patient");
    else if (targetSpeaker === "both") setTargetSpeaker("patient");
  }, [caseObject, pediatricCase, targetSpeaker]);

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
    return clinicalDxId ? `/topics?dx=${encodeURIComponent(clinicalDxId)}` : "/topics";
  }, [clinicalDxId]);

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
  }, [caseObject]);

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

  const startScaleInChat = useCallback((auto = false) => {
    if (!selectedScale) return;
    setLastScaleResult(null);
    setInstrumentAutoRun(auto);
    setScaleSession({
      session_id: makeSessionId("scale"),
      scale_id: selectedScale.id,
      status: "in_progress",
      current_index: 0,
      answers: [],
      started_at: new Date().toISOString(),
    });
    setActiveInstrumentContext({
      mode: "scale",
      instrument_id: selectedScale.id,
      instrument_name: selectedScale.short_name,
      item_index: 0,
      total_items: selectedScale.items.length,
      item_id: selectedScale.items[0]?.id ?? "item_1",
      item_prompt: selectedScale.items[0]?.prompt ?? "Pregunta clínica",
      response_type: selectedScale.response_type,
      options: selectedScale.items[0]?.options ?? [],
    });
  }, [selectedScale]);

  const startTestInChat = useCallback((auto = false) => {
    if (!selectedTest) return;
    setLastTestResult(null);
    setInstrumentAutoRun(auto);
    setTestSession({
      session_id: makeSessionId("test"),
      test_id: selectedTest.id,
      status: "in_progress",
      current_index: 0,
      answers: [],
      started_at: new Date().toISOString(),
    });
    setActiveInstrumentContext({
      mode: "test",
      instrument_id: selectedTest.id,
      instrument_name: selectedTest.short_name,
      item_index: 0,
      total_items: selectedTest.items.length,
      item_id: selectedTest.items[0]?.id ?? "item_1",
      item_prompt: selectedTest.items[0]?.prompt ?? "Pregunta clínica",
      response_type: selectedTest.response_type,
      options: selectedTest.items[0]?.options ?? [],
    });
  }, [selectedTest]);

  const cancelActiveInstrument = useCallback(() => {
    setInstrumentAutoRun(false);
    setActiveInstrumentContext(null);
    setScaleSession((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    setTestSession((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
  }, []);

  const addNote = useCallback((text: string) => {
    const clean = String(text ?? "").trim();
    if (!clean) return;
    setSessionNotes((prev) => [clean, ...prev].slice(0, 30));
  }, []);

  const startCacesSession = useCallback(() => {
    const source = getCacesQuestions({
      category: cacesCategory,
      difficulty: cacesDifficulty,
    });
    const modeSize = cacesMode === "quiz_5" ? 5 : cacesMode === "simulacro_10" ? 10 : cacesMode === "simulacro_20" ? 20 : 1;
    const picked = sampleQuestions(source, modeSize);
    setLastQuizResult(null);
    setQuizSession({
      mode: cacesMode,
      questions: picked,
      currentIndex: 0,
      answers: [],
      completed: false,
      showImmediate: cacesMode === "practice",
    });
  }, [cacesCategory, cacesDifficulty, cacesMode]);

  const answerCacesQuestion = useCallback((choice: "A" | "B" | "C" | "D") => {
    setQuizSession((prev) => {
      if (!prev || prev.completed) return prev;
      const q = prev.questions[prev.currentIndex];
      if (!q) return prev;

      const nextAnswers = [
        ...prev.answers,
        { questionId: q.id, selected: choice, correct: q.correct_option },
      ];
      const nextIndex = prev.currentIndex + 1;
      const done = nextIndex >= prev.questions.length;

      if (!done) {
        return {
          ...prev,
          answers: nextAnswers,
          currentIndex: nextIndex,
        };
      }

      const correctAnswers = nextAnswers.filter((a) => a.selected === a.correct).length;
      const result: QuizResult = {
        mode: prev.mode,
        total_questions: prev.questions.length,
        correct_answers: correctAnswers,
        accuracy: prev.questions.length > 0 ? Math.round((correctAnswers / prev.questions.length) * 100) : 0,
        finished_at: new Date().toISOString(),
        review: nextAnswers.map((a) => ({
          question_id: a.questionId,
          selected: a.selected,
          correct: a.correct,
        })),
      };
      setLastQuizResult(result);
      return {
        ...prev,
        answers: nextAnswers,
        currentIndex: prev.questions.length,
        completed: true,
        result,
      };
    });
  }, []);

  const sendMessage = useCallback(async (opts?: {
    message?: string;
    mode?: "free" | "scale" | "test";
    instrumentContext?: ActiveInstrumentContext | null;
    speakerTarget?: SpeakerRole;
  }) => {
    setError(null);

    const msg = String(opts?.message ?? userMessage).trim();
    if (!msg) return;
    if (inputDisabled) return;
    const interactionMode = opts?.mode ?? activeInstrumentContext?.mode ?? "free";
    const instrumentContext = opts?.instrumentContext ?? activeInstrumentContext ?? null;
    const speakerTarget = opts?.speakerTarget ?? targetSpeaker;

    const nextTranscript: TranscriptTurn[] = [...transcript, { role: "user", content: msg }];
    setTranscript(nextTranscript);

    try {
      localStorage.setItem("activeTranscript", JSON.stringify(nextTranscript));
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
      `${activeInstrumentContext.mode === "scale" ? "Escala clínica" : "Test mental"} ${activeInstrumentContext.instrument_name} · ítem ${activeInstrumentContext.item_index + 1}/${activeInstrumentContext.total_items}`,
      activeInstrumentContext.item_prompt,
      "Opciones:",
      ...activeInstrumentContext.options.map((o, i) => `${i}. ${o.label}`),
      "Responde como paciente simulado según el caso activo.",
    ];
    const message = lines.join("\n");
    await sendMessage({
      message,
      mode: activeInstrumentContext.mode,
      instrumentContext: activeInstrumentContext,
      speakerTarget: pediatricCase ? targetSpeaker : "patient",
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
        <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
          <Sidebar />
          <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-6 flex items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
              <h1 className="text-xl font-semibold">Psyke · No hay un caso activo</h1>
              <p className="mt-2 text-sm text-white/70">Vuelve a la biblioteca, genera un caso y presiona “Iniciar simulación”.</p>
              <div className="mt-4">
                <Link className="inline-flex items-center justify-center rounded-xl bg-white text-black px-4 py-2" href="/cases">
                  Ir a Biblioteca de casos
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
      <div className="mx-auto flex h-full max-w-[1480px] gap-6 px-4 py-4">
        <Sidebar />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
          {/* TOPNAV */}
          <header className="flex h-12 items-center gap-3 border-b border-white/10 bg-white/5 px-5">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="font-semibold text-white">Psyke</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60">Sesión</span>
              <span className="text-white/30">›</span>
              <span className="font-semibold text-white">Caso en curso</span>
            </div>

            {/* Approach badge */}
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70" title="Enfoque psicoterapéutico (educativo)">
              🧭 Enfoque: {approachLabel}
            </span>

            <div className="ml-auto hidden w-full max-w-[360px] items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 sm:flex">
              <span className="text-xs text-white/50">🔎</span>
              <input
                className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/35"
                placeholder="Buscar en Biblioteca Clínica DSM-5…"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Cronómetro */}
              <div
                className={`hidden sm:flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                  timeIsLow
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    : "border-white/15 bg-black/30 text-white/80"
                }`}
                title="Tiempo restante de la sesión"
              >
                <span className="text-xs opacity-80">⏳</span>
                <span className="font-semibold tabular-nums">{timeLabel}</span>
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
                title="Configuraciones"
              >
                ⚙️ Config
              </button>
              <button
                type="button"
                onClick={() => setSummaryDebugOpen((v) => !v)}
                className="hidden sm:inline-flex rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
                title="Ver/ocultar resumen vivo (debug)"
              >
                🧾 Resumen
              </button>

              <Link href="/cases" className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5">
                Volver
              </Link>

              <Link
                href={clinicalHref}
                className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 sm:inline-flex"
                title={clinicalDxId ? `Abrir ficha: ${clinicalDxId}` : "Abrir Biblioteca clínica"}
              >
                Biblioteca clínica
              </Link>

              <button
                onClick={() => finishSession("manual")}
                className="rounded-xl bg-white px-3 py-2 text-sm text-black"
              >
                Finalizar
              </button>
            </div>
          </header>

          {/* EDUCATIONAL PANEL */}
          <section className="border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3 px-5 py-3">
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
                  Riesgo: {riskLevel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                  {clinicalDxId ? `DSM/CIE: ${clinicalDxId}` : "DSM/CIE: —"}
                </span>
              </div>
            </div>

            {eduExpanded && (
              <div className="px-5 pb-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[260px] flex-1 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/50">DSM-5 (guía rápida)</div>
                    <div className="mt-1 text-sm font-semibold text-white">Estructura sugerida</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                      <li>Apertura empática + motivo de consulta.</li>
                      <li>Explora síntomas, duración e impacto funcional.</li>
                      <li>Si hay señales de riesgo, prioriza seguridad.</li>
                      <li>Cierra con resumen y plan.</li>
                    </ul>
                  </div>

                  <div className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/50">Tip del tutor IA</div>
                    <div className="mt-2 text-sm text-white/75">
                      Antes de cerrar el MSE, pregunta por <span className="font-semibold text-white">impacto funcional</span> y
                      una <span className="font-semibold text-white">pregunta de seguridad</span> si hay señales.
                    </div>
                  </div>

                  <Link
                    href={clinicalHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    📚 Abrir Biblioteca Clínica
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* CONTENT AREA */}
          <div className="flex min-h-0 flex-1">
            {/* CHAT PANEL */}
            <section className="flex min-w-0 flex-1 min-h-0 flex-col bg-black/10">
              {/* Chat header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-3">
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

                <div className="ml-auto hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-2 md:flex">
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
                    ⚠ Riesgo: {riskLevel}
                  </span>

                  {lastProvider && (
                    <span
                      className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70"
                      title="Proveedor que generó la respuesta"
                    >
                      ☁️ {String(lastProvider).toUpperCase()}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setRightTab("risk")}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                    title="Abrir módulo de seguridad"
                  >
                    🛡 Seguridad
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
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

                          <div className={`max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
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
                                  {t.kind === "alert" ? "⚠ Alerta de seguridad" : "✦ Sugerencia clínica"}
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
              <div className="border-t border-white/10 bg-white/5 px-5 py-3">
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

                {activeInstrumentContext && (
                  <div className="mb-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-white/55">
                        {activeInstrumentContext.mode === "scale" ? "Escala clínica en curso" : "Test mental en curso"} ·{" "}
                        {activeInstrumentContext.instrument_name}
                      </div>
                      <div className="text-xs text-white/70">
                        {activeInstrumentContext.item_index + 1}/{activeInstrumentContext.total_items}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-white/80">{activeInstrumentContext.item_prompt}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void askCurrentInstrumentItem()}
                        disabled={loading || inputDisabled}
                        className="rounded-xl border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80 disabled:opacity-50"
                      >
                        {instrumentAutoRun ? "Reenviar ítem" : "Aplicar ítem en chat"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelActiveInstrument}
                        className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs text-red-100"
                      >
                        Cancelar instrumento
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-2">
                  {Object.keys(quickChipMap ?? {}).map((label) => {
                    const isRisk = label.includes("Riesgo");
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

            {/* RIGHT PANEL */}
            <aside className="hidden w-[320px] flex-shrink-0 min-h-0 flex-col border-l border-white/10 bg-white/5 md:flex">
              <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3">
                {(
                  [
                    ["patient", "Paciente"],
                    ["mse", "MSE"],
                    ["dsm", "DSM-5"],
                    ["risk", "Seguridad"],
                    ["scales", "Escalas"],
                    ["tests", "Tests"],
                    ["caces", "CACES"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setRightTab(key)}
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
                    <AvatarCard
                      name={patientName}
                      stateKey={lastMeta.state}
                      stateLabel={emotionLabel[lastMeta.state] ?? lastMeta.state}
                      intensity={lastMeta.intensity}
                    />

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
                  </div>
                )}

                {rightTab === "dsm" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">DSM-5</div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">{safeText(caseObject?.dsm?.primary?.label, "Hipótesis principal")}</div>
                        <div className="text-xs text-white/60">{safeText(caseObject?.meta?.dsm_tag, "—")}</div>
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        Confianza: <span className="font-semibold text-white">{safeText(caseObject?.dsm?.primary?.confidence, "—")}</span>
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
                          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">Diferenciales</div>
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
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Seguridad</div>
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
                        <div className="text-sm font-semibold text-white">Riesgo suicida</div>
                        <div className="text-xs text-white/70">{riskLevel}</div>
                      </div>
                      <div className="mt-2 text-sm text-white/70">
                        {safeText(caseObject?.safety?.summary, "Si detectas señales, prioriza evaluación de riesgo y factores protectores (educativo).")}
                      </div>
                      <div className="mt-3 grid gap-2">
                        <button className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-black/40">
                          Aplicar Mini C-SSRS (demo)
                        </button>
                        <button className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black">
                          Crear plan de seguridad (demo)
                        </button>
                      </div>
                      {(asStrArray(caseObject?.safety?.risk_factors).length > 0 || asStrArray(caseObject?.safety?.protective_factors).length > 0) && (
                        <div className="mt-4 grid gap-3">
                          {asStrArray(caseObject?.safety?.risk_factors).length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Factores de riesgo</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {asStrArray(caseObject?.safety?.risk_factors).slice(0, 10).map((x, i) => (
                                  <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{x}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {asStrArray(caseObject?.safety?.protective_factors).length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Factores protectores</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {asStrArray(caseObject?.safety?.protective_factors).slice(0, 10).map((x, i) => (
                                  <span key={i} className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">{x}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {asStrArray(caseObject?.safety?.cssrs_hint).length > 0 && (
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Mini C-SSRS sugerido</div>
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
                        <span className="font-semibold">Si riesgo alto:</span> derivación a urgencias y no dejar sin acompañante.
                      </div>
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
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Escalas clínicas</div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <label className="text-xs text-white/60">Selecciona escala</label>
                      <select
                        value={selectedScaleId}
                        onChange={(e) => setSelectedScaleId(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                      >
                        {CLINICAL_SCALES.map((s) => (
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
                          Aplicar paso a paso
                        </button>
                        <button
                          type="button"
                          onClick={() => startScaleInChat(true)}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
                        >
                          Aplicación automática
                        </button>
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
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Tests mentales</div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <label className="text-xs text-white/60">Selecciona test</label>
                      <select
                        value={selectedTestId}
                        onChange={(e) => setSelectedTestId(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                      >
                        {MENTAL_TESTS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.short_name} · {t.name}
                          </option>
                        ))}
                      </select>
                      {selectedTest && (
                        <div className="mt-3 text-xs text-white/60">
                          <div>Tipo: {selectedTest.kind === "screening" ? "Tamizaje" : "Evaluación orientativa"}</div>
                          <div>Aplica a: {selectedTest.applies_to === "both" ? "Adulto y adolescente" : selectedTest.applies_to}</div>
                          <div className="mt-1 text-white/50">{selectedTest.description}</div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startTestInChat(false)}
                          className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white/80"
                        >
                          Aplicar paso a paso
                        </button>
                        <button
                          type="button"
                          onClick={() => startTestInChat(true)}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
                        >
                          Autoejecutar
                        </button>
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

                {rightTab === "caces" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Preguntas CACES (estilo original)</div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <label className="text-xs text-white/60">Categoría</label>
                      <select
                        value={cacesCategory}
                        onChange={(e) => setCacesCategory(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                      >
                        {CACES_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-white/60">Dificultad</label>
                          <select
                            value={cacesDifficulty}
                            onChange={(e) => setCacesDifficulty(e.target.value as any)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="all">Todas</option>
                            <option value="basic">Básica</option>
                            <option value="intermediate">Intermedia</option>
                            <option value="advanced">Avanzada</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-white/60">Modo</label>
                          <select
                            value={cacesMode}
                            onChange={(e) => setCacesMode(e.target.value as CacesMode)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="practice">Pregunta individual</option>
                            <option value="quiz_5">Mini quiz (5)</option>
                            <option value="simulacro_10">Simulacro (10)</option>
                            <option value="simulacro_20">Simulacro (20)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={startCacesSession}
                        className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black"
                      >
                        Iniciar
                      </button>
                    </div>

                    {quizSession && !quizSession.completed && quizSession.questions[quizSession.currentIndex] && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs text-white/60">
                          Pregunta {quizSession.currentIndex + 1}/{quizSession.questions.length}
                        </div>
                        <div className="mt-2 text-sm text-white/85">
                          {quizSession.questions[quizSession.currentIndex].prompt}
                        </div>
                        <div className="mt-3 space-y-2">
                          {quizSession.questions[quizSession.currentIndex].options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => answerCacesQuestion(opt.id)}
                              className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-left text-sm text-white/80 hover:bg-black/40"
                            >
                              <span className="font-semibold">{opt.id}.</span> {opt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {quizSession?.completed && quizSession.result && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-sm font-semibold text-white">
                          Resultado: {quizSession.result.correct_answers}/{quizSession.result.total_questions} ({quizSession.result.accuracy}%)
                        </div>
                        <div className="mt-2 text-xs text-white/60">
                          Banco académico independiente, con preguntas originales estilo CACES.
                        </div>
                        <div className="mt-3 space-y-2">
                          {quizSession.result.review.slice(0, 6).map((r) => {
                            const q = quizSession.questions.find((x) => x.id === r.question_id);
                            return (
                              <div key={r.question_id} className="rounded-xl border border-white/10 bg-black/30 p-2 text-xs text-white/75">
                                <div className="font-semibold">
                                  {q?.subcategory ?? "Pregunta"} · {r.selected === r.correct ? "Correcta" : "Incorrecta"}
                                </div>
                                <div className="mt-1">
                                  Tu respuesta: {r.selected ?? "—"} · Correcta: {r.correct}
                                </div>
                                {q?.rationale && <div className="mt-1 text-white/60">{q.rationale}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!quizSession && lastQuizResult && (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-xs text-white/60">Último resultado</div>
                        <div className="mt-1 text-sm text-white/85">
                          {lastQuizResult.correct_answers}/{lastQuizResult.total_questions} ({lastQuizResult.accuracy}%)
                        </div>
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
                  <label className="block text-xs text-white/60">Enfoque psicoterapéutico (guía)</label>
                  <select
                    value={cfgApproach}
                    onChange={(e) => setCfgApproach(e.target.value as ApproachValue)}
                    className="mt-2 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="humanistic">Humanístico</option>
                    <option value="cbt">Cognitivo-conductual (TCC)</option>
                    <option value="psychodynamic">Psicodinámico</option>
                    <option value="systemic">Sistémico / familiar</option>
                  </select>

                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                    <div className="font-semibold text-white">¿Qué cambia?</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li><span className="font-semibold text-white">Humanístico</span>: empatía, validación, reflejos, preguntas abiertas.</li>
                      <li><span className="font-semibold text-white">TCC</span>: pensamiento–emoción–conducta, ejemplos concretos, activación/evitación.</li>
                      <li><span className="font-semibold text-white">Psicodinámico</span>: patrones relacionales, significados, defensas (sin interpretar de más).</li>
                      <li><span className="font-semibold text-white">Sistémico</span>: contexto, red de apoyo, roles y dinámica familiar.</li>
                    </ul>
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
