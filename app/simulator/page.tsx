"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type TranscriptTurn = { role: "user" | "patient"; content: string };

type CaseLike = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

type EndReason = "manual" | "timeout";

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
  const [caseObject, setCaseObject] = useState<CaseLike | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEmotionRaw, setLastEmotionRaw] = useState<string>("(sin datos)");

  // Timer
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerReason, setTimerReason] = useState<EndReason | null>(null);
  const finishingRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
    // Gate suave: si no hay alias, vuelve a bienvenida
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sim_user");
      if (!raw) window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }, []);

  const readActiveCaseRaw = useCallback(() => {
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

  const getTargetMinutes = useCallback((obj: unknown) => {
    const base = asRecord(obj);
    const meta = base ? asRecord(base["meta"]) : null;

    // Intenta varias rutas comunes para duración
    const raw =
      meta?.target_minutes ??
      meta?.targetMinutes ??
      base?.target_minutes ??
      base?.targetMinutes ??
      base?.duration_minutes ??
      base?.durationMinutes ??
      meta?.duration_minutes ??
      meta?.durationMinutes;

    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    return 20; // default
  }, []);

  const initTimer = useCallback(
    (obj: unknown) => {
      const base = asRecord(obj);
      const meta = base ? asRecord(base["meta"]) : null;

      const minutes = getTargetMinutes(obj);

      // Persistimos un endAt para que si refrescas no se reinicie.
      // Se guarda por caso (si tiene id) o global.
      const key = `sessionEndAt:${String(base?.id ?? meta?.case_id ?? "default")}`;

      const existing = Number(localStorage.getItem(key));
      const now = Date.now();

      const endAt = Number.isFinite(existing) && existing > now - 24 * 60 * 60 * 1000
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
        localStorage.setItem(
          "sessionEnded",
          JSON.stringify({
            reason,
            ended_at: new Date().toISOString(),
            remaining_sec: remainingSec,
          })
        );
      } catch {
        // ignore
      }

      window.location.href = "/results";
    },
    [transcript, remainingSec]
  );

  useEffect(() => {
    const raw = readActiveCaseRaw();
    if (!raw) {
      setCaseObject(null);
      setTranscript([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setCaseObject(parsed);

      // init timer (depende del caso)
      initTimer(parsed);

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
    const profile = asRecord(caseObject?.patient_profile) ?? asRecord(caseObject?.patient);
    return (profile?.display_name as string | undefined) ?? "Paciente";
  }, [caseObject]);

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

      setTranscript((prev) => [...prev, { role: "patient", content: data.message_text ?? "(sin respuesta)" }]);

      const last = JSON.stringify({
        state: data.emotion_state,
        intensity: data.emotion_intensity,
        arousal: data.arousal,
        rapport: data.rapport,
        flags: data.flags,
      });
      localStorage.setItem("lastEmotion", last);
      setLastEmotionRaw(last);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo enviar el mensaje.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userMessage, transcript, caseObject, inputDisabled]);

  if (!caseObject) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
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
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Simulador</h1>
            <p className="mt-1 text-sm text-white/70">
              Paciente: <span className="text-white">{patientName}</span> • Modo educativo • No diagnostica.
            </p>
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

            <Link href="/cases" className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
              Volver
            </Link>
            <button onClick={() => finishSession("manual")} className="rounded-xl bg-white text-black px-4 py-2 text-sm">
              Finalizar sesión
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4">
          {/* Panel izquierdo (avatar) */}
          <div className="lg:sticky lg:top-6 h-fit">
            <AvatarCard
              name={patientName}
              stateKey={lastMeta.state}
              stateLabel={emotionLabel[lastMeta.state] ?? lastMeta.state}
              intensity={lastMeta.intensity}
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 h-[calc(100vh-170px)] min-h-[520px] max-h-[760px] flex flex-col min-w-0 overflow-hidden">
            {/* Aviso si el tiempo está bajo */}
            {timeIsLow && remainingSec != null && remainingSec > 0 && (
              <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                Queda poco tiempo: <span className="font-semibold">{timeLabel}</span>. Enfoca el cierre (resumen + plan).
              </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1">
              {transcript.length === 0 ? (
                <div className="text-sm text-white/70">Escribe tu primer mensaje para iniciar la entrevista.</div>
              ) : (
                transcript.map((t, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      t.role === "user" ? "ml-auto bg-white text-black" : "mr-auto bg-black/40 border border-white/10"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">{t.role === "user" ? "Tú" : patientName}</div>
                    {t.content}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!inputDisabled) sendMessage();
                  }
                }}
                placeholder={remainingSec != null && remainingSec <= 0 ? "Sesión finalizada" : "Escribe tu mensaje…"}
                disabled={inputDisabled}
                className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={inputDisabled}
                className="rounded-xl bg-white text-black px-4 py-3 text-sm disabled:opacity-60"
              >
                {loading ? "Enviando…" : "Enviar"}
              </button>
            </div>

            <p className="mt-3 text-xs text-white/60">
              Nota: usa información ficticia. Si aparece contenido sensible, el sistema responde en modo educativo.
            </p>
          </div>

          {/* Panel derecho (educativo) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-white/60">Panel educativo</div>
                <div className="mt-1 text-base font-semibold">Guía rápida</div>
              </div>

              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                {emotionLabel[lastMeta.state] ?? lastMeta.state}
              </span>
            </div>

            {/* Objetivo */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Objetivo</div>
              <div className="mt-1 text-sm text-white/85">Practicar estructura de entrevista: apertura → exploración → cierre.</div>
            </div>
            {/* Estado del paciente (resumen) */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-white/60">Estado del paciente</div>
                  <div className="mt-1 text-sm text-white/85">Cómo está reaccionando durante la entrevista</div>
                </div>
                <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-white/70">
                  {emotionLabel[lastMeta.state] ?? lastMeta.state}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {/* Intensidad emocional */}
                <div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Intensidad emocional</span>
                    <span className="text-white/80">{Math.round(lastMeta.intensity)} / 100</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-white/70"
                      style={{ width: `${Math.round(clamp01(lastMeta.intensity / 100) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Conexión / confianza */}
                <div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Conexión / confianza</span>
                    <span className="text-white/80">{Math.round(lastMeta.rapport)} / 100</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-white/50"
                      style={{ width: `${Math.round(clamp01(lastMeta.rapport / 100) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-white/45">Más conexión = el paciente se abre más y responde con más detalle.</div>
                </div>
              </div>

              {/* Señales (flags) */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">Señales a explorar</div>
                  <span className="text-[10px] text-white/45">educativo</span>
                </div>

                {Array.isArray(lastMeta.flags) && lastMeta.flags.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {(
                      ["Riesgo", "Ansiedad", "Sueño", "Ánimo", "Funcionamiento", "Otros"] as const
                    ).map((cat) => {
                      const items = lastMeta.flags
                        .map((x: unknown) => String(x))
                        .filter(Boolean)
                        .filter((f: string) => flagCategory(f) === cat);

                      if (items.length === 0) return null;

                      return (
                        <div key={cat} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-white/70">{cat}</div>
                            <div className="text-[10px] text-white/45">{items.length}</div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {items.slice(0, 8).map((f: string, i: number) => (
                              <span
                                key={`${cat}-${f}-${i}`}
                                className={`rounded-full border px-3 py-1 text-xs ${chipClass(f)}`}
                                title={f}
                              >
                                {prettyFlag(f)}
                              </span>
                            ))}
                            {items.length > 8 && (
                              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/60">
                                +{items.length - 8}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-white/60">Sin señales marcadas aún.</div>
                )}

                <div className="mt-2 text-[11px] text-white/45">Guían tu entrevista. No son diagnóstico.</div>
              </div>
            </div>

            {/* Siguiente paso sugerido */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-white/60">Siguiente paso sugerido</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                <li>Haz una pregunta abierta (“¿Qué ha cambiado últimamente?”).</li>
                <li>Refleja emoción (“Suena agotador / frustrante”).</li>
                <li>Profundiza con ejemplo (“¿Cuándo fue la última vez que…?”).</li>
              </ul>
            </div>

            {/* Checklist */}
            <div className="mt-4">
              <div className="text-xs text-white/60">Checklist de habilidades</div>
              <div className="mt-2 grid gap-2">
                {["Pregunta abierta", "Reflejo emocional", "Clarificación", "Resumen breve", "Cierre con plan"].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                  >
                    <span className="h-2 w-2 rounded-full bg-white/40" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Debug opcional */}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-white/60">Ver datos (debug)</summary>
              <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/70">
                {JSON.stringify({ lastMeta, remainingSec, timerEndAt }, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
