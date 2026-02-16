"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type TranscriptTurn = { role: "user" | "patient"; content: string };

type EndReason = "manual" | "timeout";

export default function SimulatorPage() {
  const [caseObject, setCaseObject] = useState<any>(null);
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
    return caseObject?.patient_profile?.display_name ?? "Paciente";
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
    } catch (e: any) {
      setError(e?.message ?? "No se pudo enviar el mensaje.");
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
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-[520px] flex flex-col min-w-0">
            {/* Aviso si el tiempo está bajo */}
            {timeIsLow && remainingSec != null && remainingSec > 0 && (
              <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                Queda poco tiempo: <span className="font-semibold">{timeLabel}</span>. Enfoca el cierre (resumen + plan).
              </div>
            )}

            <div className="flex-1 overflow-auto space-y-3 pr-1">
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

            {/* Intensidad emocional */}
            <div className="mt-4">
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

            {/* Rapport */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Rapport</span>
                <span className="text-white/80">{Math.round(lastMeta.rapport)} / 100</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-white/50"
                  style={{ width: `${Math.round(clamp01(lastMeta.rapport / 100) * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-white/50">Más rapport = más apertura del paciente.</div>
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
