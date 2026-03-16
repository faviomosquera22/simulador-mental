"use client";

import { useEffect, useMemo, useState } from "react";

export type MonitorVitals = {
  hr: number;
  sbp: number;
  dbp: number;
  spo2: number;
  rr: number;
  temp: number;
};

type MonitorAccent = "cyan" | "fuchsia" | "red";

type MonitorDetailItem = {
  label: string;
  value: string;
};

type MultiparameterMonitorProps = {
  vitals: MonitorVitals;
  accent?: MonitorAccent;
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  rhythmLabel?: string;
  timeLabel?: string;
  stageLabel?: string;
  badges?: string[];
  alerts?: string[];
  detailItems?: MonitorDetailItem[];
  footerNote?: string;
};

type MonitorPattern = "sinus" | "tachy" | "brady" | "vf" | "vt" | "asystole" | "pea" | "standby";

const ACCENT_STYLES: Record<
  MonitorAccent,
  {
    shell: string;
    badge: string;
    status: string;
    glow: string;
    overlay: string;
  }
> = {
  cyan: {
    shell: "border-cyan-400/15 bg-[#050A12]",
    badge: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    status: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
    glow: "shadow-[0_28px_80px_rgba(8,145,178,0.18)]",
    overlay: "radial-gradient(circle at top left, rgba(34,211,238,0.16), transparent 34%)",
  },
  fuchsia: {
    shell: "border-fuchsia-400/15 bg-[#050A12]",
    badge: "border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100",
    status: "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-100",
    glow: "shadow-[0_28px_80px_rgba(192,38,211,0.18)]",
    overlay: "radial-gradient(circle at top left, rgba(232,121,249,0.16), transparent 34%)",
  },
  red: {
    shell: "border-red-400/15 bg-[#050A12]",
    badge: "border-red-300/25 bg-red-300/10 text-red-100",
    status: "border-red-400/25 bg-red-400/10 text-red-100",
    glow: "shadow-[0_28px_80px_rgba(220,38,38,0.18)]",
    overlay: "radial-gradient(circle at top left, rgba(248,113,113,0.16), transparent 34%)",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function gauss(x: number, center: number, width: number) {
  const delta = (x - center) / Math.max(width, 0.0001);
  return Math.exp(-0.5 * delta * delta);
}

function resolvePattern(vitals: MonitorVitals, rhythmLabel?: string): MonitorPattern {
  const rhythm = normalizeText(rhythmLabel);
  if (rhythm.includes("pendiente de dea") || rhythm.includes("no analizado")) return "standby";
  if (rhythm.includes("asistolia")) return "asystole";
  if (rhythm.includes("fv")) return "vf";
  if (rhythm.includes("tv")) return "vt";
  if (rhythm.includes("aesp")) return "pea";
  if (vitals.hr <= 0 || vitals.sbp <= 0) return "asystole";
  if (vitals.hr >= 120) return "tachy";
  if (vitals.hr > 0 && vitals.hr <= 50) return "brady";
  return "sinus";
}

function severityIndex(vitals: MonitorVitals) {
  let score = 0;
  if (vitals.sbp > 0 && vitals.sbp < 90) score += 2;
  if (vitals.spo2 > 0 && vitals.spo2 < 92) score += 2;
  if (vitals.rr > 30 || (vitals.rr > 0 && vitals.rr < 10)) score += 2;
  if (vitals.hr > 130 || (vitals.hr > 0 && vitals.hr < 45)) score += 2;
  if (vitals.temp >= 39 || vitals.temp <= 35) score += 1;
  return clamp(score, 0, 5);
}

function getAnimatedVitals(vitals: MonitorVitals, phaseSeconds: number, pattern: MonitorPattern): MonitorVitals {
  const severity = severityIndex(vitals);
  if (pattern === "asystole" || pattern === "standby") {
    return {
      ...vitals,
      hr: 0,
      sbp: 0,
      dbp: 0,
      spo2: 0,
      rr: 0,
    };
  }

  const respPhase = Math.sin(phaseSeconds * 0.52);
  const hemoPhase = Math.sin(phaseSeconds * 0.22 + 1.2);
  const beatPhase = Math.sin(phaseSeconds * 1.95 + 0.45);
  const finePhase = Math.sin(phaseSeconds * 3.15 + 0.8);
  const variability = 0.7 + severity * 0.35;

  const hr = vitals.hr > 0 ? Math.max(0, Math.round(vitals.hr + variability * 2.3 * beatPhase + finePhase)) : 0;
  const sbp = vitals.sbp > 0 ? Math.max(0, Math.round(vitals.sbp + variability * 3.2 * hemoPhase)) : 0;
  const dbp = vitals.dbp > 0 ? Math.max(0, Math.round(vitals.dbp + variability * 2.2 * Math.sin(phaseSeconds * 0.19 + 2.1))) : 0;
  const rr = vitals.rr > 0 ? Math.max(0, Math.round(vitals.rr + variability * 1.2 * respPhase)) : 0;
  const spo2 = vitals.spo2 > 0 ? clamp(Math.round(vitals.spo2 + Math.sin(phaseSeconds * 0.16 + 1.7) * Math.max(1, severity * 0.7)), 0, 100) : 0;

  return {
    ...vitals,
    hr,
    sbp,
    dbp: dbp > sbp ? Math.max(0, sbp - 8) : dbp,
    spo2,
    rr,
    temp: Number((vitals.temp + Math.sin(phaseSeconds * 0.04) * 0.08).toFixed(1)),
  };
}

function ecgSignal(pattern: MonitorPattern, local: number, t: number) {
  if (pattern === "standby") {
    return 0.025 * Math.sin(t * 3.2);
  }

  if (pattern === "asystole") {
    return 0.01 * Math.sin(t * 8.5);
  }

  if (pattern === "vf") {
    return 0.56 * Math.sin(t * 13) + 0.33 * Math.sin(t * 21.4 + 1.1) + 0.18 * Math.sin(t * 32.2 + 0.3);
  }

  if (pattern === "vt") {
    return (
      0.42 * gauss(local, 0.22, 0.04) +
      0.94 * gauss(local, 0.34, 0.08) -
      0.24 * gauss(local, 0.43, 0.018) +
      0.45 * gauss(local, 0.52, 0.06) -
      0.14 * gauss(local, 0.68, 0.08)
    );
  }

  if (pattern === "pea") {
    return (
      0.04 * gauss(local, 0.18, 0.022) -
      0.07 * gauss(local, 0.28, 0.014) +
      0.38 * gauss(local, 0.32, 0.024) -
      0.06 * gauss(local, 0.37, 0.018) +
      0.12 * gauss(local, 0.58, 0.055)
    );
  }

  const qrsWidth = pattern === "brady" ? 0.016 : pattern === "tachy" ? 0.01 : 0.012;
  const tWave = pattern === "brady" ? 0.24 : pattern === "tachy" ? 0.18 : 0.22;

  return (
    0.08 * gauss(local, 0.17, 0.02) -
    0.1 * gauss(local, 0.275, 0.011) +
    1.05 * gauss(local, 0.31, qrsWidth) -
    0.18 * gauss(local, 0.34, 0.012) +
    tWave * gauss(local, 0.59, 0.06)
  );
}

function buildPath(args: {
  width: number;
  height: number;
  seconds: number;
  bpm: number;
  pattern: MonitorPattern;
}) {
  const { width, height, seconds, bpm, pattern } = args;
  const points: string[] = [];
  const yMid = height * 0.56;
  const amplitude = pattern === "pea" ? height * 0.14 : pattern === "vf" ? height * 0.16 : pattern === "standby" ? height * 0.06 : height * 0.25;
  const cycle = 60 / Math.max(pattern === "brady" ? 28 : 40, bpm || 60);

  for (let x = 0; x <= width; x += 4) {
    const xNorm = x / width;
    const t = seconds * 0.92 + xNorm * 8.5;
    const local = ((t / cycle) % 1 + 1) % 1;
    const baseline = 0.02 * Math.sin(t * 0.9);
    const value = ecgSignal(pattern, local, t) + baseline;
    const y = yMid - value * amplitude;
    points.push(`${x},${y.toFixed(2)}`);
  }

  return `M${points.join(" L")}`;
}

function buildPlethPath(width: number, height: number, seconds: number, bpm: number, active: boolean) {
  const points: string[] = [];
  const cycle = 60 / Math.max(40, bpm || 70);
  const yMid = height * 0.62;

  for (let x = 0; x <= width; x += 4) {
    const xNorm = x / width;
    const t = seconds * 0.95 + xNorm * 7;
    const local = ((t / cycle) % 1 + 1) % 1;
    const value = !active
      ? 0
      : 0.96 * gauss(local, 0.16, 0.03) +
        0.44 * gauss(local, 0.29, 0.06) -
        0.2 * gauss(local, 0.38, 0.014) +
        0.05 * Math.sin(t * 1.1);
    const y = yMid - value * (height * 0.34);
    points.push(`${x},${y.toFixed(2)}`);
  }

  return `M${points.join(" L")}`;
}

function buildRespPath(width: number, height: number, seconds: number, rr: number, active: boolean) {
  const points: string[] = [];
  const cycle = 60 / Math.max(6, rr || 14);
  const yMid = height * 0.56;

  for (let x = 0; x <= width; x += 4) {
    const xNorm = x / width;
    const t = seconds * 0.58 + xNorm * 10;
    const local = ((t / cycle) % 1 + 1) % 1;
    const value = !active ? 0 : 0.72 * Math.sin(local * Math.PI) - 0.16 * Math.sin(local * Math.PI * 2.2);
    const y = yMid - value * (height * 0.28);
    points.push(`${x},${y.toFixed(2)}`);
  }

  return `M${points.join(" L")}`;
}

function deriveAlerts(vitals: MonitorVitals) {
  const alerts: string[] = [];
  if (vitals.sbp > 0 && vitals.sbp < 90) alerts.push("Hipotensión");
  if (vitals.spo2 > 0 && vitals.spo2 < 92) alerts.push("Desaturación");
  if (vitals.hr > 130) alerts.push("Taquicardia");
  if (vitals.hr > 0 && vitals.hr < 45) alerts.push("Bradicardia");
  if (vitals.rr > 30) alerts.push("Taquipnea");
  if (vitals.rr > 0 && vitals.rr < 10) alerts.push("Bradipnea");
  if (vitals.temp >= 39) alerts.push("Fiebre alta");
  if (!alerts.length && vitals.hr > 0) alerts.push("Tendencia estable");
  if (!alerts.length && vitals.hr <= 0) alerts.push("Soporte vital en curso");
  return alerts;
}

function MetricTile({
  label,
  value,
  unit,
  tone,
  muted,
  compactValue = false,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "green" | "cyan" | "amber" | "violet" | "orange" | "white";
  muted?: boolean;
  compactValue?: boolean;
}) {
  const toneClass =
    tone === "green"
      ? "border-[#7BFF9A]/20 bg-[#07120C] text-[#7BFF9A]"
      : tone === "cyan"
      ? "border-[#7EDCFF]/20 bg-[#06111A] text-[#7EDCFF]"
      : tone === "amber"
      ? "border-[#FFD37A]/20 bg-[#161006] text-[#FFD37A]"
      : tone === "violet"
      ? "border-[#B7A6FF]/20 bg-[#0F0A1B] text-[#B7A6FF]"
      : tone === "orange"
      ? "border-[#FFB46B]/20 bg-[#181006] text-[#FFB46B]"
      : "border-white/10 bg-[#0A0F17] text-white";

  return (
    <div className={`rounded-2xl border px-3 py-3 min-h-[88px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${toneClass} ${muted ? "opacity-55" : ""}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] opacity-70">
        <span>{label}</span>
        <span className="shrink-0 text-[10px] opacity-70">{muted ? "mute" : "live"}</span>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className={`font-mono font-semibold leading-none ${compactValue ? "text-2xl" : "text-[30px]"}`}>{value}</div>
        {unit ? <div className="shrink-0 pb-1 text-xs opacity-75">{unit}</div> : null}
      </div>
    </div>
  );
}

function TrendStrip({
  label,
  path,
  color,
  active,
}: {
  label: string;
  path: string;
  color: string;
  active: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/25">
      <div
        className="absolute inset-0 opacity-75"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="relative flex items-center justify-between px-3 pt-2 text-[10px] uppercase tracking-[0.18em] text-white/60">
        <span>{label}</span>
        <span>{active ? "activo" : "standby"}</span>
      </div>
      <svg viewBox="0 0 560 72" className="relative h-[58px] w-full">
        <path d={path} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function MultiparameterMonitor(props: MultiparameterMonitorProps) {
  const {
    vitals,
    accent = "cyan",
    title = "Monitor multiparámetro",
    subtitle = "Tendencias dinámicas basadas en el caso actual.",
    statusLabel,
    rhythmLabel,
    timeLabel,
    stageLabel,
    badges = [],
    alerts = [],
    detailItems = [],
    footerNote,
  } = props;

  const [phaseSeconds, setPhaseSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhaseSeconds((previous) => previous + 0.12);
    }, 120);

    return () => window.clearInterval(id);
  }, []);

  const pattern = useMemo(() => resolvePattern(vitals, rhythmLabel), [rhythmLabel, vitals]);
  const liveVitals = useMemo(() => getAnimatedVitals(vitals, phaseSeconds, pattern), [pattern, phaseSeconds, vitals]);
  const style = ACCENT_STYLES[accent];
  const ecgPath = useMemo(
    () => buildPath({ width: 640, height: 140, seconds: phaseSeconds, bpm: liveVitals.hr || 70, pattern }),
    [liveVitals.hr, pattern, phaseSeconds]
  );
  const plethPath = useMemo(
    () => buildPlethPath(560, 72, phaseSeconds, liveVitals.hr || 70, liveVitals.spo2 > 0 && liveVitals.hr > 0),
    [liveVitals.hr, liveVitals.spo2, phaseSeconds]
  );
  const respPath = useMemo(
    () => buildRespPath(560, 72, phaseSeconds, liveVitals.rr || 14, liveVitals.rr > 0),
    [liveVitals.rr, phaseSeconds]
  );

  const mergedAlerts = useMemo(() => {
    return Array.from(new Set([...deriveAlerts(vitals), ...alerts])).slice(0, 5);
  }, [alerts, vitals]);

  return (
    <section className={`relative overflow-hidden rounded-[28px] border p-4 ${style.shell} ${style.glow}`}>
      <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-100" style={{ backgroundImage: style.overlay }} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">{title}</div>
          <div className="mt-1 text-base font-semibold text-white">{subtitle}</div>
          {badges.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span key={badge} className={`rounded-full border px-3 py-1 text-[11px] ${style.badge}`}>
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
          {stageLabel ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">{stageLabel}</span> : null}
          {timeLabel ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">{timeLabel}</span> : null}
          <span className={`rounded-full border px-3 py-1 ${style.status}`}>
            {pattern === "standby" ? "Standby" : pattern === "asystole" ? "Crítico" : "Live"}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Estado clínico</div>
            <div className="mt-2 text-lg font-semibold text-white">
              {statusLabel ?? (pattern === "asystole" ? "Sin perfusión efectiva" : "Monitorización continua")}
            </div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              {pattern === "asystole"
                ? "Paciente en condición crítica. Verificar respuesta clínica, perfusión y necesidad de soporte vital inmediato."
                : "Seguimiento en tiempo real del estado hemodinámico y respiratorio según la evolución del caso."}
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/72">
              {rhythmLabel ? `Ritmo actual: ${rhythmLabel}` : "Ritmo organizado con tendencias hemodinámicas dinámicas."}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Contexto del paciente</div>
            {detailItems.length ? (
              <div className="mt-3 grid gap-3">
                {detailItems.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="shrink-0 text-[12px] uppercase tracking-[0.12em] text-white/50">{item.label}</span>
                      <span className="min-w-0 max-w-[70%] text-right leading-6 text-white/88 break-words">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-black/15 px-3 py-3 text-sm text-white/55">
                Sin datos contextuales cargados para este caso.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Alertas prioritarias</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {mergedAlerts.map((alert) => (
                <span
                  key={alert}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    normalizeText(alert).includes("estable")
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                      : "border-red-400/20 bg-red-400/10 text-red-100"
                  }`}
                >
                  {alert}
                </span>
              ))}
            </div>
            <div className="mt-3 text-sm leading-6 text-white/62">
              Revisa primero los cambios de perfusión, oxigenación, ventilación y temperatura antes de intervenir.
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-300/15 bg-[#03070D]">
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(41,153,99,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(41,153,99,0.14) 1px, transparent 1px), linear-gradient(rgba(41,153,99,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(41,153,99,0.24) 1px, transparent 1px)",
                  backgroundSize: "8px 8px, 8px 8px, 40px 40px, 40px 40px",
                }}
              />
              <div className="relative flex items-center justify-between px-3 pt-2 text-[10px] uppercase tracking-[0.18em] text-emerald-100/75">
                <span>ECG · Derivación II</span>
                <span>{rhythmLabel ?? "Monitor activo"}</span>
              </div>
              <svg viewBox="0 0 640 140" className="relative h-[120px] w-full">
                <path d={ecgPath} fill="none" stroke="rgba(123,255,154,0.96)" strokeWidth="2.25" strokeLinecap="round" />
              </svg>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <TrendStrip label="Pleth SpO₂" path={plethPath} color="rgba(126,220,255,0.96)" active={liveVitals.spo2 > 0 && liveVitals.hr > 0} />
              <TrendStrip label="Respiración" path={respPath} color="rgba(183,166,255,0.96)" active={liveVitals.rr > 0} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Signos vitales</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MetricTile label="FC" value={liveVitals.hr <= 0 ? "--" : String(liveVitals.hr)} unit="lpm" tone="green" muted={liveVitals.hr <= 0} />
                <MetricTile label="SpO₂" value={liveVitals.spo2 <= 0 ? "--" : String(liveVitals.spo2)} unit="%" tone="cyan" muted={liveVitals.spo2 <= 0} />
                <MetricTile
                  label="PA"
                  value={liveVitals.sbp <= 0 || liveVitals.dbp <= 0 ? "--/--" : `${liveVitals.sbp}/${liveVitals.dbp}`}
                  unit="mmHg"
                  tone="amber"
                  muted={liveVitals.sbp <= 0 || liveVitals.dbp <= 0}
                />
                <MetricTile label="FR" value={liveVitals.rr <= 0 ? "--" : String(liveVitals.rr)} unit="rpm" tone="violet" muted={liveVitals.rr <= 0} />
                <MetricTile label="Temp" value={liveVitals.temp.toFixed(1)} unit="°C" tone="orange" />
                <MetricTile label="Tiempo" value={timeLabel ?? "Live"} unit="" tone="white" compactValue />
              </div>
            </div>
          </div>
        </div>
      </div>

      {footerNote ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/72">{footerNote}</div>
      ) : null}
    </section>
  );
}
