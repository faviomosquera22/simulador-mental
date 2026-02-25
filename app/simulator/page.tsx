"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import { addSession, type EndReason } from "../../lib/history";
type TranscriptTurn = { role: "user" | "patient" | "tutor"; content: string; kind?: "tip" | "alert" };





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

  // UI (layout estilo Claude)
  const [eduExpanded, setEduExpanded] = useState(true);
  const [rightTab, setRightTab] = useState<"patient" | "mse" | "dsm" | "risk">("patient");
  const [mseOpen, setMseOpen] = useState<Record<string, boolean>>({});

  // Timer
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerReason, setTimerReason] = useState<EndReason | null>(null);
  const finishingRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const readActiveCaseRaw = useCallback(() => {
    // If the last session was finalized, do not allow reopening it as “in progress”.
    try {
      const ended = localStorage.getItem("sessionEnded");
      if (ended === "true") return null;
    } catch {
      // ignore
    }
    // cargar caso guardado desde /cases (soporta varias claves por compatibilidad)
    // 1) clave actual
    const rawActive = localStorage.getItem("activeCase");
    if (rawActive) return rawActive;

    // 2) compat: versiones previas guardaban en sessionStorage
    const rawSession = sessionStorage.getItem("activeCase");
    if (rawSession) return rawSession;

    // 3) compat: algunas rutas usaban sim_case
    const rawSim = localStorage.getItem("sim_case") ?? sessionStorage.getItem("sim_case");
    if (rawSim) return rawSim;

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

    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    return 20; // default
  }, []);

  const initTimer = useCallback(
    (obj: any) => {
      const minutes = getTargetMinutes(obj);

      // Persistimos un endAt para que si refrescas no se reinicie.
      // Se guarda por caso (si tiene id) o global.
      const key = `sessionEndAt:${String(obj?.id ?? obj?.meta?.case_id ?? "default")}`;

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
    [transcript, remainingSec, caseObject, sessionStartedAt]
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
      const startKey = `sessionStartedAt:${String(parsed?.id ?? parsed?.meta?.case_id ?? "default")}`;
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
    } catch {
      setCaseObject(null);
      setTranscript([]);
    }
  }, [readActiveCaseRaw, initTimer]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastEmotion");
      setLastEmotionRaw(raw ?? "(sin datos)");
    } catch {
      setLastEmotionRaw("(sin datos)");
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, caseObject]);

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
    const pick = (arr: any, fallback: string) => {
      if (Array.isArray(arr) && typeof arr[0] === "string" && arr[0].trim()) return arr[0].trim();
      return fallback;
    };

    return {
      "Pregunta abierta": pick(sq.openers, "¿Qué es lo que te trajo hoy aquí?"),
      "Explorar síntomas": pick(sq.symptoms, "¿Qué síntomas has notado y cómo han cambiado últimamente?"),
      "⚠ Riesgo suicida": pick(sq.safety, "¿Has pensado en hacerte daño o en que sería mejor no estar aquí?"),
      "Clarificar duración": pick(sq.duration, "¿Desde cuándo exactamente empezaste a sentirte así?"),
      "Impacto funcional": pick(sq.function, "¿Cómo han afectado estos síntomas tu trabajo o tu vida diaria?"),
    };
  }, [caseObject]);

  function toggleMse(key: string) {
    setMseOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function asStrArray(v: any): string[] {
    return Array.isArray(v) ? v.map((x) => String(x)).filter((s) => s.trim().length > 0) : [];
  }

  function safeText(v: any, fallback = "—") {
    const s = v == null ? "" : String(v);
    const t = s.trim();
    return t ? t : fallback;
  }

  function clamp01(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
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

  const sendMessage = useCallback(async () => {
    setError(null);

    const msg = userMessage.trim();
    if (!msg) return;
    if (inputDisabled) return;

    const nextTranscript: TranscriptTurn[] = [...transcript, { role: "user", content: msg }];
    setTranscript(nextTranscript);

    try {
      localStorage.setItem("activeTranscript", JSON.stringify(nextTranscript));
    } catch {
      // ignore
    }

    setUserMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/patient-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseObject,
          transcript: nextTranscript,
          userMessage: msg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Error en patient-turn");
      }

      setTranscript((prev) => {
        const next: TranscriptTurn[] = [...prev, { role: "patient", content: data.message_text ?? "(sin respuesta)" }];
        if (typeof data?.tutor_message === "string" && data.tutor_message.trim().length > 0) {
          next.push({
            role: "tutor",
            content: data.tutor_message,
            kind: (data.tutor_kind === "alert" || data.tutor_kind === "tip") ? data.tutor_kind : undefined,
          });
        }
        return next;
      });

      const last = JSON.stringify({
        state: data.emotion_state,
        intensity: data.emotion_intensity,
        arousal: data.arousal,
        rapport: data.rapport,
        flags: data.flags,
      });
      localStorage.setItem("lastEmotion", last);
      setLastEmotionRaw(last);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setLoading(false);
    }
  }, [userMessage, transcript, caseObject, inputDisabled]);

  if (!caseObject) {
    return (
      <div className="min-h-screen bg-[#070A0F]">
        <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
          <Sidebar />
          <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-6 flex items-center justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
              <h1 className="text-xl font-semibold">No hay un caso activo</h1>
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
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
          {/* TOPNAV */}
          <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-white/5 px-5">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="text-white/60">Sesión</span>
              <span className="text-white/30">›</span>
              <span className="font-semibold text-white">Caso en curso</span>
            </div>

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
            <section className="flex min-w-0 flex-1 flex-col bg-black/10">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
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

                <div className="hidden items-center gap-2 md:flex">
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                    Estado: {emotionLabel[lastMeta.state] ?? lastMeta.state}
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
                    ⚠ Riesgo: {riskLevel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
              <div className="flex-1 overflow-y-auto px-5 py-5">
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
                      const align = isUser ? "justify-end" : "justify-start";

                      const avatar = isTutor
                        ? { label: "IA", cls: "bg-gradient-to-br from-emerald-400 to-teal-500" }
                        : isUser
                        ? { label: "E", cls: "bg-gradient-to-br from-blue-500 to-purple-500" }
                        : { label: String(patientName).slice(0, 1).toUpperCase(), cls: "bg-gradient-to-br from-amber-400 to-red-500" };

                      const roleLabel = isTutor ? "Tutor IA" : isUser ? "Estudiante (Tú)" : `${patientName} (Paciente)`;

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
              <div className="border-t border-white/10 bg-white/5 px-5 py-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {Object.keys(quickChipMap).map((label) => {
                    const isRisk = label.includes("Riesgo");
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setUserMessage((quickChipMap as any)[label] ?? "")}
                        className={`rounded-full border px-3 py-1 text-xs transition hover:bg-white/5 ${
                          isRisk ? "border-red-400/30 bg-red-400/10 text-red-100" : "border-white/15 bg-black/30 text-white/70"
                        }`}
                      >
                        {label}
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
                        if (!inputDisabled) sendMessage();
                      }
                    }}
                    placeholder={remainingSec != null && remainingSec <= 0 ? "Sesión finalizada" : "Escribe tu pregunta clínica…"}
                    disabled={inputDisabled}
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none placeholder:text-white/35 focus:ring-2 focus:ring-white/20 disabled:opacity-60"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={inputDisabled}
                    className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-60"
                  >
                    {loading ? "Enviando…" : "Enviar"}
                  </button>
                </div>

                <p className="mt-3 text-xs text-white/50">Educativo: no diagnostica. Usa información ficticia.</p>
              </div>
            </section>

            {/* RIGHT PANEL */}
            <aside className="hidden w-[360px] flex-shrink-0 flex-col border-l border-white/10 bg-white/5 md:flex">
              <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3">
                {(
                  [
                    ["patient", "Paciente"],
                    ["mse", "MSE"],
                    ["dsm", "DSM-5"],
                    ["risk", "Seguridad"],
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
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
