export type MonitorVitalsShape = {
  hr: number;
  sbp: number;
  dbp: number;
  spo2: number;
  rr: number;
  temp: number;
};

export type MonitorInsightTone = "stable" | "watch" | "critical";

export type MonitorDirection = "up" | "down" | "steady";

export type MonitorClinicalBlock = {
  id: string;
  label: string;
  status: string;
  detail: string;
  tone: MonitorInsightTone;
};

export type MonitorTrendItem = {
  id: string;
  label: string;
  value: string;
  deltaText: string;
  direction: MonitorDirection;
  tone: MonitorInsightTone;
};

export type MonitorDerivedMetric = {
  id: string;
  label: string;
  value: string;
  tone: MonitorInsightTone;
};

export type MonitorInsights = {
  severityLabel: string;
  severityTone: MonitorInsightTone;
  severitySummary: string;
  evolutionLabel: string;
  clinicalBlocks: MonitorClinicalBlock[];
  trendItems: MonitorTrendItem[];
  derivedMetrics: MonitorDerivedMetric[];
};

type BuildMonitorInsightsArgs = {
  vitals: MonitorVitalsShape;
  baselineVitals?: MonitorVitalsShape;
  rhythmLabel?: string;
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

function toneRank(tone: MonitorInsightTone) {
  if (tone === "critical") return 3;
  if (tone === "watch") return 2;
  return 1;
}

export function computeMap(vitals: MonitorVitalsShape) {
  if (vitals.sbp <= 0 || vitals.dbp <= 0) return 0;
  return Math.round((vitals.dbp * 2 + vitals.sbp) / 3);
}

export function computeShockIndex(vitals: MonitorVitalsShape) {
  if (vitals.hr <= 0 || vitals.sbp <= 0) return 0;
  return Number((vitals.hr / vitals.sbp).toFixed(2));
}

function computeSeverityScore(vitals: MonitorVitalsShape, rhythmLabel?: string) {
  const rhythm = normalizeText(rhythmLabel);
  let score = 0;

  if (vitals.hr <= 0 || vitals.sbp <= 0 || rhythm.includes("asistolia")) score += 5;
  if (vitals.sbp > 0 && vitals.sbp < 90) score += 2;
  if (computeMap(vitals) > 0 && computeMap(vitals) < 65) score += 1;
  if (vitals.spo2 > 0 && vitals.spo2 < 92) score += 2;
  if (vitals.spo2 > 0 && vitals.spo2 < 88) score += 1;
  if (vitals.rr > 30 || (vitals.rr > 0 && vitals.rr < 8)) score += 2;
  if (vitals.hr > 130 || (vitals.hr > 0 && vitals.hr < 45)) score += 2;
  if (vitals.temp >= 39.5 || vitals.temp <= 35) score += 1;
  if (computeShockIndex(vitals) >= 1) score += 1;

  return clamp(score, 0, 9);
}

function statusFromScore(score: number) {
  if (score >= 6) {
    return {
      label: "Compromiso critico",
      tone: "critical" as const,
      summary: "Perfusion, ventilacion u oxigenacion con alto riesgo de deterioro inmediato.",
    };
  }
  if (score >= 3) {
    return {
      label: "Vigilancia estrecha",
      tone: "watch" as const,
      summary: "Hay alteraciones fisiologicas que requieren reevaluacion y seguimiento continuo.",
    };
  }
  return {
    label: "Ventana relativamente estable",
    tone: "stable" as const,
    summary: "Las tendencias actuales permiten seguimiento continuo con menor carga de alarma.",
  };
}

function hemodynamicsBlock(vitals: MonitorVitalsShape): MonitorClinicalBlock {
  const map = computeMap(vitals);
  const shockIndex = computeShockIndex(vitals);

  if (vitals.sbp <= 0) {
    return {
      id: "hemodynamics",
      label: "Hemodinamica",
      status: "Sin perfusion",
      detail: "PA no detectable o perfusion no efectiva.",
      tone: "critical",
    };
  }

  if (vitals.sbp < 90 || map < 65 || shockIndex >= 1.1) {
    return {
      id: "hemodynamics",
      label: "Hemodinamica",
      status: "Perfusion critica",
      detail: `PAM ${map || "--"} · SI ${shockIndex || 0}`,
      tone: "critical",
    };
  }

  if (vitals.sbp < 100 || map < 75 || shockIndex >= 0.9) {
    return {
      id: "hemodynamics",
      label: "Hemodinamica",
      status: "Perfusion vigilada",
      detail: `PAM ${map || "--"} · SI ${shockIndex || 0}`,
      tone: "watch",
    };
  }

  return {
    id: "hemodynamics",
    label: "Hemodinamica",
    status: "Perfusion util",
    detail: `PAM ${map || "--"} · SI ${shockIndex || 0}`,
    tone: "stable",
  };
}

function oxygenationBlock(vitals: MonitorVitalsShape): MonitorClinicalBlock {
  if (vitals.spo2 <= 0) {
    return {
      id: "oxygenation",
      label: "Oxigenacion",
      status: "Sin lectura",
      detail: "Pulso o pleth no detectables.",
      tone: "critical",
    };
  }

  if (vitals.spo2 < 90) {
    return {
      id: "oxygenation",
      label: "Oxigenacion",
      status: "Desaturacion severa",
      detail: `${vitals.spo2}% actual`,
      tone: "critical",
    };
  }

  if (vitals.spo2 < 94) {
    return {
      id: "oxygenation",
      label: "Oxigenacion",
      status: "Reserva baja",
      detail: `${vitals.spo2}% actual`,
      tone: "watch",
    };
  }

  return {
    id: "oxygenation",
    label: "Oxigenacion",
    status: "Saturacion conservada",
    detail: `${vitals.spo2}% actual`,
    tone: "stable",
  };
}

function ventilationBlock(vitals: MonitorVitalsShape): MonitorClinicalBlock {
  if (vitals.rr <= 0) {
    return {
      id: "ventilation",
      label: "Ventilacion",
      status: "Sin ventilacion efectiva",
      detail: "FR no detectable.",
      tone: "critical",
    };
  }

  if (vitals.rr < 8 || vitals.rr > 30) {
    return {
      id: "ventilation",
      label: "Ventilacion",
      status: "Patron critico",
      detail: `${vitals.rr} rpm`,
      tone: "critical",
    };
  }

  if (vitals.rr < 10 || vitals.rr > 24) {
    return {
      id: "ventilation",
      label: "Ventilacion",
      status: "Trabajo aumentado",
      detail: `${vitals.rr} rpm`,
      tone: "watch",
    };
  }

  return {
    id: "ventilation",
    label: "Ventilacion",
    status: "Patron util",
    detail: `${vitals.rr} rpm`,
    tone: "stable",
  };
}

function temperatureBlock(vitals: MonitorVitalsShape): MonitorClinicalBlock {
  if (vitals.temp >= 39.5 || vitals.temp <= 35) {
    return {
      id: "temperature",
      label: "Temperatura",
      status: vitals.temp >= 39.5 ? "Hipertermia" : "Hipotermia",
      detail: `${vitals.temp.toFixed(1)} C`,
      tone: "critical",
    };
  }

  if (vitals.temp >= 38 || vitals.temp <= 35.8) {
    return {
      id: "temperature",
      label: "Temperatura",
      status: vitals.temp >= 38 ? "Febril" : "Baja",
      detail: `${vitals.temp.toFixed(1)} C`,
      tone: "watch",
    };
  }

  return {
    id: "temperature",
    label: "Temperatura",
    status: "Normotermia",
    detail: `${vitals.temp.toFixed(1)} C`,
    tone: "stable",
  };
}

function resolveDirection(delta: number, threshold: number): MonitorDirection {
  if (Math.abs(delta) < threshold) return "steady";
  return delta > 0 ? "up" : "down";
}

function formatDelta(delta: number, digits = 0) {
  const fixed = digits > 0 ? delta.toFixed(digits) : String(Math.round(delta));
  return delta > 0 ? `+${fixed}` : fixed;
}

function metricTrend(args: {
  id: string;
  label: string;
  current: number;
  baseline?: number;
  unit: string;
  threshold: number;
  digits?: number;
  tone: MonitorInsightTone;
}): MonitorTrendItem {
  const { id, label, current, baseline, unit, threshold, digits = 0, tone } = args;

  if (!Number.isFinite(Number(baseline))) {
    return {
      id,
      label,
      value: unit ? `${current}${unit}` : String(current),
      deltaText: "Sin basal",
      direction: "steady",
      tone,
    };
  }

  const delta = current - Number(baseline);
  return {
    id,
    label,
    value: unit ? `${current}${unit}` : String(current),
    deltaText: `${formatDelta(delta, digits)} vs basal`,
    direction: resolveDirection(delta, threshold),
    tone,
  };
}

function evolutionLabel(args: {
  vitals: MonitorVitalsShape;
  baselineVitals?: MonitorVitalsShape;
  rhythmLabel?: string;
}) {
  if (!args.baselineVitals) return "Sin comparacion basal";

  const currentScore = computeSeverityScore(args.vitals, args.rhythmLabel);
  const baselineScore = computeSeverityScore(args.baselineVitals, args.rhythmLabel);
  const delta = currentScore - baselineScore;

  if (delta >= 2) return "Deteriora respecto al basal";
  if (delta <= -2) return "Mejora respecto al basal";
  return "Variacion leve respecto al basal";
}

export function buildMonitorInsights(args: BuildMonitorInsightsArgs): MonitorInsights {
  const { vitals, baselineVitals, rhythmLabel } = args;
  const severity = statusFromScore(computeSeverityScore(vitals, rhythmLabel));
  const hemodynamics = hemodynamicsBlock(vitals);
  const oxygenation = oxygenationBlock(vitals);
  const ventilation = ventilationBlock(vitals);
  const temperature = temperatureBlock(vitals);
  const pulsePressure =
    vitals.sbp > 0 && vitals.dbp > 0 ? Math.max(0, vitals.sbp - vitals.dbp) : 0;
  const map = computeMap(vitals);
  const shockIndex = computeShockIndex(vitals);

  const blockTone = [hemodynamics, oxygenation, ventilation, temperature]
    .map((item) => item.tone)
    .sort((a, b) => toneRank(b) - toneRank(a))[0];

  return {
    severityLabel: severity.label,
    severityTone: toneRank(blockTone) > toneRank(severity.tone) ? blockTone : severity.tone,
    severitySummary: severity.summary,
    evolutionLabel: evolutionLabel(args),
    clinicalBlocks: [hemodynamics, oxygenation, ventilation, temperature],
    trendItems: [
      metricTrend({
        id: "hr",
        label: "FC",
        current: vitals.hr,
        baseline: baselineVitals?.hr,
        unit: " lpm",
        threshold: 4,
        tone: hemodynamics.tone,
      }),
      metricTrend({
        id: "spo2",
        label: "SpO2",
        current: vitals.spo2,
        baseline: baselineVitals?.spo2,
        unit: "%",
        threshold: 2,
        tone: oxygenation.tone,
      }),
      metricTrend({
        id: "rr",
        label: "FR",
        current: vitals.rr,
        baseline: baselineVitals?.rr,
        unit: " rpm",
        threshold: 2,
        tone: ventilation.tone,
      }),
      metricTrend({
        id: "temp",
        label: "Temp",
        current: Number(vitals.temp.toFixed(1)),
        baseline: baselineVitals ? Number(baselineVitals.temp.toFixed(1)) : undefined,
        unit: " C",
        threshold: 0.3,
        digits: 1,
        tone: temperature.tone,
      }),
    ],
    derivedMetrics: [
      {
        id: "map",
        label: "PAM",
        value: map > 0 ? `${map} mmHg` : "--",
        tone: hemodynamics.tone,
      },
      {
        id: "shock-index",
        label: "Shock index",
        value: shockIndex > 0 ? String(shockIndex) : "--",
        tone: shockIndex >= 1 ? "critical" : shockIndex >= 0.9 ? "watch" : "stable",
      },
      {
        id: "pulse-pressure",
        label: "Pulso",
        value: pulsePressure > 0 ? `${pulsePressure} mmHg` : "--",
        tone: pulsePressure > 0 && pulsePressure < 25 ? "watch" : "stable",
      },
      {
        id: "rhythm-context",
        label: "Ritmo",
        value: rhythmLabel || "Sin etiqueta",
        tone: severity.tone,
      },
    ],
  };
}
