"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import { getHistory, type SessionRecord } from "../../lib/history";
import { supabase } from "@/src/lib/supabaseClient";
import {
  DASHBOARD_GROUP_LABELS,
  DASHBOARD_MODULES,
  DASHBOARD_NEW_BANK_TOTAL,
  DASHBOARD_NEW_MODULES,
  type DashboardModuleGroup,
  type DashboardModuleMeta,
} from "@/src/lib/dashboardCatalog";
import {
  EMPTY_PROFILE,
  PROFILE_UPDATED_EVENT,
  extractProfileFromAuth,
  getProfileDisplayName,
  isProfileComplete,
  mergeProfiles,
  normalizeProfile,
  normalizeText,
  persistProfile,
  readStoredProfile,
  serializeComparableProfile,
  type UserProfile,
} from "@/src/lib/userProfile";

type TranscriptTurn = { role: string; content: string };

type StoredSession = {
  id: string;
  caseId?: string;
  caseTitle?: string;
  patientName?: string;
  endedAt?: string;
  reason?: string;
  targetMinutes?: number;
  durationMin?: number;
  score?: number;
  riskLevel: "Bajo" | "Moderado" | "Alto" | "—";
  transcript?: TranscriptTurn[];
};

type AdvisorIntent = "continuidad" | "diagnostico" | "intervencion" | "documentacion" | "avanzado";
type AdvisorFormat = "guiado" | "visual" | "intensivo";
type AdvisorTime = "15" | "30" | "60";

type ModuleAdvisorMeta = {
  intents: AdvisorIntent[];
  formats: AdvisorFormat[];
  minMinutes: number;
  maxMinutes: number;
  companionIds: string[];
};

type CareerTrack = {
  label: string;
  helper: string;
  primaryId: string;
  supportIds: string[];
  weaknessIds: string[];
  intent: AdvisorIntent;
  format: AdvisorFormat;
};

type ProfileNotice = {
  tone: "success" | "error" | "info";
  message: string;
};

const DASHBOARD_GROUP_ORDER: DashboardModuleGroup[] = [
  "simulacion",
  "diagnostico",
  "avanzado",
  "practica",
  "seguimiento",
];

const GROUP_DESCRIPTIONS: Record<DashboardModuleGroup, string> = {
  simulacion: "Escenarios progresivos, priorización inicial y decisiones clínicas con continuidad.",
  diagnostico: "Interpretación de ECG, ecografía, laboratorio y gasometría para decidir mejor.",
  avanzado: "Entrenamiento inmersivo, soporte vital y casos clínicos de mayor complejidad.",
  practica: "Procedimientos, medicamentos, cálculo, notas y PAE como bloque operativo.",
  seguimiento: "Historial, evaluación y consolidación del progreso académico.",
};

const GROUP_PRIMARY_LINKS: Record<DashboardModuleGroup, string> = {
  simulacion: "/cases",
  diagnostico: "/ecg-simulator",
  avanzado: "/dynamic-simulator",
  practica: "/medications",
  seguimiento: "/history",
};

const INTENT_OPTIONS: Array<{ id: AdvisorIntent; label: string; helper: string }> = [
  {
    id: "continuidad",
    label: "Continuidad",
    helper: "Entrevista, evolución y cierre clínico.",
  },
  {
    id: "diagnostico",
    label: "Estudios",
    helper: "ECG, eco, laboratorio y gasometría.",
  },
  {
    id: "intervencion",
    label: "Intervención",
    helper: "Urgencias, medicamentos y procedimientos.",
  },
  {
    id: "documentacion",
    label: "Documentación",
    helper: "PAE, notas y evaluación rápida.",
  },
  {
    id: "avanzado",
    label: "Avanzado",
    helper: "Escenarios inmersivos y algoritmos.",
  },
];

const FORMAT_OPTIONS: Array<{ id: AdvisorFormat; label: string; helper: string }> = [
  {
    id: "guiado",
    label: "Guiado",
    helper: "Paso a paso, ideal para ordenar criterio y flujo.",
  },
  {
    id: "visual",
    label: "Visual",
    helper: "Lectura e interpretación clínica sobre hallazgos o monitores.",
  },
  {
    id: "intensivo",
    label: "Intensivo",
    helper: "Mayor presión, respuesta rápida y decisiones más densas.",
  },
];

const TIME_OPTIONS: Array<{ id: AdvisorTime; label: string; helper: string }> = [
  { id: "15", label: "15 min", helper: "Sesión breve y enfocada." },
  { id: "30", label: "30 min", helper: "Bloque equilibrado para practicar." },
  { id: "60", label: "60+ min", helper: "Trabajo profundo o inmersivo." },
];

const MODULE_PLAYBOOK: Record<string, ModuleAdvisorMeta> = {
  "mental-sim": {
    intents: ["continuidad", "documentacion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 30,
    maxMinutes: 60,
    companionIds: ["notes", "pae-assistant"],
  },
  pathologies: {
    intents: ["continuidad", "diagnostico"],
    formats: ["guiado", "intensivo"],
    minMinutes: 20,
    maxMinutes: 45,
    companionIds: ["laboratory", "clinical-calculations"],
  },
  urgencies: {
    intents: ["intervencion", "continuidad"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["triage", "medications"],
  },
  triage: {
    intents: ["intervencion", "continuidad"],
    formats: ["guiado"],
    minMinutes: 10,
    maxMinutes: 20,
    companionIds: ["urgencies", "pathologies"],
  },
  ecg: {
    intents: ["diagnostico", "avanzado"],
    formats: ["visual", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["laboratory", "dynamic-simulator"],
  },
  ultrasound: {
    intents: ["diagnostico", "avanzado"],
    formats: ["visual", "guiado"],
    minMinutes: 20,
    maxMinutes: 40,
    companionIds: ["clinical-images", "dynamic-simulator"],
  },
  laboratory: {
    intents: ["diagnostico", "intervencion"],
    formats: ["visual", "guiado"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["gasometry", "ecg"],
  },
  gasometry: {
    intents: ["diagnostico", "intervencion"],
    formats: ["visual", "intensivo"],
    minMinutes: 15,
    maxMinutes: 25,
    companionIds: ["laboratory", "urgencies"],
  },
  "clinical-images": {
    intents: ["avanzado", "diagnostico"],
    formats: ["visual", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["ultrasound", "dynamic-simulator"],
  },
  "rcp-algorithms": {
    intents: ["avanzado", "intervencion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["urgencies", "dynamic-simulator"],
  },
  "dynamic-simulator": {
    intents: ["avanzado", "continuidad"],
    formats: ["intensivo", "visual"],
    minMinutes: 30,
    maxMinutes: 60,
    companionIds: ["ecg", "laboratory"],
  },
  "materno-infantil": {
    intents: ["avanzado", "continuidad"],
    formats: ["guiado", "intensivo"],
    minMinutes: 25,
    maxMinutes: 45,
    companionIds: ["ultrasound", "medications"],
  },
  calculations: {
    intents: ["intervencion", "documentacion"],
    formats: ["guiado"],
    minMinutes: 10,
    maxMinutes: 20,
    companionIds: ["medications", "procedures"],
  },
  medications: {
    intents: ["intervencion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 25,
    companionIds: ["calculations", "procedures"],
  },
  procedures: {
    intents: ["intervencion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["medications", "urgencies"],
  },
  notes: {
    intents: ["documentacion"],
    formats: ["guiado"],
    minMinutes: 15,
    maxMinutes: 25,
    companionIds: ["pae", "pae-assistant"],
  },
  pae: {
    intents: ["documentacion"],
    formats: ["guiado", "intensivo"],
    minMinutes: 25,
    maxMinutes: 45,
    companionIds: ["notes", "pae-assistant"],
  },
  "pae-assistant": {
    intents: ["documentacion"],
    formats: ["guiado"],
    minMinutes: 10,
    maxMinutes: 20,
    companionIds: ["pae", "notes"],
  },
  caces: {
    intents: ["documentacion", "avanzado"],
    formats: ["intensivo"],
    minMinutes: 15,
    maxMinutes: 30,
    companionIds: ["notes", "pae"],
  },
};

const CAREER_TRACKS: Array<CareerTrack & { keywords: string[] }> = [
  {
    label: "Enfermería clínica",
    helper: "Prioriza continuidad, seguridad, procedimientos y documentación estructurada.",
    primaryId: "mental-sim",
    supportIds: ["medications", "notes", "pae-assistant"],
    weaknessIds: ["triage", "urgencies", "notes"],
    intent: "documentacion",
    format: "guiado",
    keywords: ["enfermer", "nursing", "auxiliar", "tecnolog", "terapia"],
  },
  {
    label: "Medicina general",
    helper: "Sube razonamiento clínico con diagnóstico, urgencias y simulación progresiva.",
    primaryId: "pathologies",
    supportIds: ["ecg", "laboratory", "dynamic-simulator"],
    weaknessIds: ["ecg", "gasometry", "urgencies"],
    intent: "diagnostico",
    format: "intensivo",
    keywords: ["medicin", "doctor", "médic", "intern", "residen"],
  },
  {
    label: "Salud mental",
    helper: "Concentra entrevista, formulación clínica, riesgo y seguimiento longitudinal.",
    primaryId: "mental-sim",
    supportIds: ["notes", "pae-assistant", "dynamic-simulator"],
    weaknessIds: ["urgencies", "notes", "dynamic-simulator"],
    intent: "continuidad",
    format: "guiado",
    keywords: ["psicolog", "mental", "psiqui", "psicoter", "consejer"],
  },
  {
    label: "Emergencias y respuesta rápida",
    helper: "Practica priorización, soporte vital, monitorización y conducta inicial.",
    primaryId: "urgencies",
    supportIds: ["triage", "rcp-algorithms", "ecg"],
    weaknessIds: ["triage", "rcp-algorithms", "gasometry"],
    intent: "intervencion",
    format: "intensivo",
    keywords: ["emergen", "urgenc", "critico", "uci", "intensiv"],
  },
  {
    label: "Materno infantil",
    helper: "Integra obstetricia, pediatría y ultrasonido con decisiones por contexto.",
    primaryId: "materno-infantil",
    supportIds: ["ultrasound", "medications", "pathologies"],
    weaknessIds: ["ultrasound", "triage", "medications"],
    intent: "avanzado",
    format: "guiado",
    keywords: ["obstet", "gine", "materno", "neonat", "pediatr"],
  },
  {
    label: "Imagen y diagnóstico",
    helper: "Enfoca lectura visual, correlación de hallazgos y soporte diagnóstico.",
    primaryId: "clinical-images",
    supportIds: ["ultrasound", "ecg", "laboratory"],
    weaknessIds: ["clinical-images", "ultrasound", "laboratory"],
    intent: "diagnostico",
    format: "visual",
    keywords: ["imagen", "radiolog", "diagnost", "eco", "ultrason"],
  },
];

const DEFAULT_TRACK: CareerTrack = {
  label: "Ruta clínica general",
  helper: "Empieza con un módulo sólido y luego abre diagnóstico y práctica operativa.",
  primaryId: "pathologies",
  supportIds: ["mental-sim", "ecg", "notes"],
  weaknessIds: ["ecg", "laboratory", "notes"],
  intent: "continuidad",
  format: "guiado",
};

function safeText(v: any, fallback = "—") {
  const s = v == null ? "" : String(v);
  const t = s.trim();
  return t ? t : fallback;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function formatDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return s;
  }
}

function shortReason(reason?: string) {
  const r = (reason || "").toLowerCase();
  if (r.includes("timeout")) return "Tiempo";
  if (r.includes("manual")) return "Manual";
  return reason ? safeText(reason) : "—";
}

function loadJSON(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hasCaseInProgress(): boolean {
  try {
    const ended = localStorage.getItem("sessionEnded");
    if (ended === "true") return false;
    const raw = localStorage.getItem("activeCase");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed;
  } catch {
    return false;
  }
}

function extractActiveCaseMeta(caseObj: any) {
  const meta = caseObj?.meta ?? {};
  const title = safeText(meta?.title ?? caseObj?.title ?? caseObj?.essentials?.title, "Caso");
  const targetMinutes = Number(meta?.target_minutes ?? caseObj?.config?.targetMinutes ?? caseObj?.timer?.minutes);
  const dsmTag = safeText(meta?.dsm_tag, "—");
  const patientName = safeText(
    caseObj?.patient_profile?.display_name ?? caseObj?.patient?.name ?? caseObj?.patientName,
    "Paciente"
  );
  const risk = safeText(caseObj?.safety?.risk_level ?? meta?.risk_level, "—");

  return {
    title,
    patientName,
    targetMinutes: Number.isFinite(targetMinutes) ? clampInt(targetMinutes, 5, 60) : undefined,
    dsmTag,
    risk,
  };
}

function computeSimpleScoreFromTranscript(transcript: TranscriptTurn[]) {
  const joined = transcript
    .map((t) => String(t.content || "").toLowerCase())
    .join(" \n");

  const hasOpen = /\b(c[oó]mo te|qu[eé] te trajo|cu[eé]ntame|qu[eé] ha pasado|desde cu[aá]ndo)\b/.test(joined);
  const hasSafety = /\b(suicid|hacerte da[nñ]o|no querer estar|matarme|morir)\b/.test(joined);
  const hasFunction = /\b(trabajo|funcional|vida diaria|estudio)\b/.test(joined);

  let score = 60;
  if (hasOpen) score += 10;
  if (hasFunction) score += 8;
  if (hasSafety) score += 12;
  score += Math.min(10, Math.floor(transcript.length / 4));
  return clampInt(score, 0, 100);
}

function deriveRiskLevelFromFlags(flags: string[] | undefined): "Bajo" | "Moderado" | "Alto" | "—" {
  if (!Array.isArray(flags) || flags.length === 0) return "—";
  const clean = flags.map((f) => String(f).toLowerCase());
  const riskFlags = clean.filter((f) => f.includes("risk:"));
  if (!riskFlags.length) return "Bajo";
  if (riskFlags.some((f) => f.includes("self_harm") || f.includes("plan") || f.includes("intent") || f.includes("means"))) {
    return "Alto";
  }
  if (riskFlags.length >= 2) return "Moderado";
  return "Bajo";
}

function normalizeRiskLevel(value?: string | null): StoredSession["riskLevel"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("alto")) return "Alto";
  if (normalized.includes("moderado")) return "Moderado";
  if (normalized.includes("bajo")) return "Bajo";
  return "—";
}

function mapSessionRecord(s: SessionRecord): StoredSession {
  const transcript = Array.isArray(s.transcript) ? (s.transcript as TranscriptTurn[]) : [];
  return {
    id: safeText(s.sessionId, String(Date.now())),
    caseId: s.caseId,
    caseTitle: s.caseTitle,
    patientName: s.patientName,
    endedAt: s.endedAt,
    reason: s.endReason,
    targetMinutes: s.targetMinutes,
    durationMin: Number.isFinite(s.durationSec) ? clampInt(s.durationSec / 60, 1, 120) : undefined,
    score: transcript.length ? computeSimpleScoreFromTranscript(transcript) : undefined,
    riskLevel: deriveRiskLevelFromFlags(s.lastMeta?.flags),
    transcript,
  };
}

function readHistorySessions(): StoredSession[] {
  const modern = getHistory();
  if (modern.length) return modern.map(mapSessionRecord);

  const rawA = loadJSON("sessionHistory");
  const rawB = loadJSON("vita.sessionHistory");
  const raw = rawA ?? rawB;

  const mapLegacy = (s: any, idx: number): StoredSession => {
    const transcript = Array.isArray(s?.transcript) ? (s.transcript as TranscriptTurn[]) : [];
    return {
      id: safeText(s?.id, String(idx)),
      caseId: s?.caseId,
      caseTitle: s?.caseTitle ?? s?.case_title,
      patientName: s?.patientName,
      endedAt: s?.endedAt ?? s?.ended_at ?? s?.createdAt,
      reason: s?.reason ?? s?.end_reason,
      targetMinutes: Number(s?.targetMinutes),
      durationMin: Number.isFinite(Number(s?.durationSec)) ? clampInt(Number(s.durationSec) / 60, 1, 120) : undefined,
      score:
        typeof s?.score === "number"
          ? clampInt(s.score, 0, 100)
          : transcript.length
          ? computeSimpleScoreFromTranscript(transcript)
          : undefined,
      riskLevel: deriveRiskLevelFromFlags(Array.isArray(s?.lastMeta?.flags) ? s.lastMeta.flags : undefined),
      transcript,
    };
  };

  if (Array.isArray(raw)) return raw.map(mapLegacy);
  if (raw && Array.isArray((raw as any).sessions)) return (raw as any).sessions.map(mapLegacy);
  return [];
}

function riskBadgeClass(level: StoredSession["riskLevel"]) {
  if (level === "Alto") return "border-red-200 bg-red-50 text-red-700";
  if (level === "Moderado") return "border-amber-200 bg-amber-50 text-amber-700";
  if (level === "Bajo") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function groupBadgeClass(group: DashboardModuleGroup) {
  if (group === "simulacion") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (group === "diagnostico") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (group === "avanzado") return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
  if (group === "practica") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getIntentLabel(intent: AdvisorIntent) {
  return INTENT_OPTIONS.find((option) => option.id === intent)?.label ?? intent;
}

function getFormatLabel(format: AdvisorFormat) {
  return FORMAT_OPTIONS.find((option) => option.id === format)?.label ?? format;
}

function getTimeLabel(time: AdvisorTime) {
  return TIME_OPTIONS.find((option) => option.id === time)?.label ?? time;
}

function formatWindow(playbook: ModuleAdvisorMeta) {
  return playbook.minMinutes === playbook.maxMinutes
    ? `${playbook.minMinutes} min`
    : `${playbook.minMinutes}-${playbook.maxMinutes} min`;
}

function getTimeScore(time: AdvisorTime, playbook: ModuleAdvisorMeta) {
  const minutes = Number(time);
  if (minutes >= playbook.minMinutes && minutes <= playbook.maxMinutes) return 3;
  const distance = minutes < playbook.minMinutes ? playbook.minMinutes - minutes : minutes - playbook.maxMinutes;
  if (distance <= 15) return 1;
  return 0;
}

function compactText(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function getFocusState(intent: AdvisorIntent, hasActive: boolean, hasHighRisk: boolean, avgScore?: number) {
  if (hasActive && intent === "continuidad") {
    return {
      eyebrow: "Continuidad prioritaria",
      title: "Retoma el caso activo",
      description:
        "Conserva contexto, evolución y cierre clínico sin perder continuidad.",
    };
  }

  if (hasHighRisk && intent === "intervencion") {
    return {
      eyebrow: "Seguridad primero",
      title: "Prioriza respuesta rápida",
      description:
        "Tus datos recientes piden reforzar urgencias, monitorización y conducta inicial.",
    };
  }

  if (intent === "diagnostico") {
    return {
      eyebrow: "Lectura clínica",
      title: "Entrena lectura antes de decidir",
      description:
        "Elige el módulo diagnóstico que mejor encaje con tu tiempo y modalidad.",
    };
  }

  if (intent === "documentacion") {
    return {
      eyebrow: "Cierre y evidencia",
      title: "Convierte práctica en registro",
      description:
        "Consolida lo aprendido con notas, PAE y evaluación más ordenada.",
    };
  }

  if (typeof avgScore === "number" && avgScore < 72) {
    return {
      eyebrow: "Reforzamiento",
      title: "Primero precisión clínica",
      description:
        "Conviene fortalecer la base diagnóstica y operativa antes de subir complejidad.",
    };
  }

  return {
    eyebrow: "Navegador clínico",
    title: "Elige mejor y entra más rápido",
    description:
      "Selecciona objetivo, modalidad y tiempo para recibir una ruta recomendada.",
  };
}

function getNoticeClass(tone: ProfileNotice["tone"]) {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (tone === "error") return "border-red-200 bg-red-50 text-red-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function inferCareerTrack(career?: string, role?: string): CareerTrack {
  const haystack = normalizeText(`${career ?? ""} ${role ?? ""}`).toLowerCase();
  if (!haystack) return DEFAULT_TRACK;
  return CAREER_TRACKS.find((track) => track.keywords.some((keyword) => haystack.includes(keyword))) ?? DEFAULT_TRACK;
}

function pickModuleById(moduleId?: string) {
  return DASHBOARD_MODULES.find((module) => module.id === moduleId);
}

export default function DashboardPage() {
  const [hasActive, setHasActive] = useState(false);
  const [activeCase, setActiveCase] = useState<any>(null);
  const [activeTranscript, setActiveTranscript] = useState<TranscriptTurn[]>([]);
  const [endedInfo, setEndedInfo] = useState<any>(null);
  const [history, setHistory] = useState<StoredSession[]>([]);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [profileDraft, setProfileDraft] = useState<UserProfile>(EMPTY_PROFILE);
  const [profileReady, setProfileReady] = useState(false);
  const [profileNotice, setProfileNotice] = useState<ProfileNotice | null>(null);
  const [authDetected, setAuthDetected] = useState(false);
  const [selectedTime, setSelectedTime] = useState<AdvisorTime>("30");
  const [timeTouched, setTimeTouched] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setHasActive(hasCaseInProgress());
      setActiveCase(loadJSON("activeCase"));
      const t = loadJSON("activeTranscript");
      setActiveTranscript(Array.isArray(t) ? (t as TranscriptTurn[]) : []);
      setEndedInfo(loadJSON("sessionEndedInfo"));
      setHistory(readHistorySessions());
    };

    refresh();

    window.addEventListener("storage", refresh);
    const id = window.setInterval(refresh, 900);
    return () => {
      window.removeEventListener("storage", refresh);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const refreshProfile = async () => {
      let nextProfile = readStoredProfile() ?? EMPTY_PROFILE;
      const storedProfile = readStoredProfile();

      try {
        const { data } = await supabase.auth.getUser();
        const authProfile = extractProfileFromAuth(data.user);

        if (authProfile) {
          setAuthDetected(true);
          nextProfile = mergeProfiles(storedProfile, authProfile);
          if (
            !storedProfile ||
            serializeComparableProfile(storedProfile) !== serializeComparableProfile(nextProfile)
          ) {
            nextProfile = persistProfile(nextProfile);
          }
        } else {
          setAuthDetected(false);
        }
      } catch {
        setAuthDetected(false);
      }

      if (!active) return;
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
      setProfileReady(true);
    };

    const handleProfileEvent = () => {
      void refreshProfile();
    };

    void refreshProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshProfile();
    });

    window.addEventListener("storage", handleProfileEvent);
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileEvent);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleProfileEvent);
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileEvent);
    };
  }, []);

  const meta = useMemo(() => extractActiveCaseMeta(activeCase), [activeCase]);

  const activeScore = useMemo(() => {
    if (!activeTranscript.length) return undefined;
    return computeSimpleScoreFromTranscript(activeTranscript);
  }, [activeTranscript]);

  const completedCount = history.length;

  const avgDuration = useMemo(() => {
    const values = history
      .map((h) => Number(h.durationMin ?? h.targetMinutes))
      .filter((n) => Number.isFinite(n) && n > 0) as number[];
    if (!values.length) return undefined;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return clampInt(avg, 1, 120);
  }, [history]);

  const avgScore = useMemo(() => {
    const values = history
      .map((h) => Number(h.score))
      .filter((n) => Number.isFinite(n)) as number[];
    if (!values.length) return undefined;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return clampInt(avg, 0, 100);
  }, [history]);

  const lastClosed = history[0];
  const currentRiskLevel = hasActive ? normalizeRiskLevel(meta.risk) : lastClosed?.riskLevel ?? "—";
  const hasHighRisk = history.some((h) => h.riskLevel === "Alto") || currentRiskLevel === "Alto";
  const profileComplete = useMemo(() => isProfileComplete(profile), [profile]);
  const displayName = useMemo(
    () => getProfileDisplayName(normalizeText(profileDraft.name) ? profileDraft : profile, "Usuario"),
    [profile, profileDraft]
  );
  const displayCareer = normalizeText(profileDraft.career) || normalizeText(profile.career) || "Perfil aún sin carrera definida";
  const displayRole = normalizeText(profileDraft.role) || normalizeText(profile.role) || "Rol aún sin completar";
  const careerTrack = useMemo(
    () => inferCareerTrack(normalizeText(profileDraft.career) || profile.career, normalizeText(profileDraft.role) || profile.role),
    [profile.career, profile.role, profileDraft.career, profileDraft.role]
  );

  const suggestedAdvisor = useMemo(() => {
    const intent: AdvisorIntent = hasActive
      ? "continuidad"
      : hasHighRisk
      ? "intervencion"
      : typeof avgScore === "number" && avgScore < 72
      ? "diagnostico"
      : careerTrack.intent;

    const format: AdvisorFormat = hasHighRisk
      ? "intensivo"
      : intent === "diagnostico"
      ? "visual"
      : careerTrack.format;

    const time: AdvisorTime = hasActive && meta.targetMinutes
      ? meta.targetMinutes <= 20
        ? "15"
        : meta.targetMinutes <= 45
        ? "30"
        : "60"
      : avgDuration
      ? avgDuration <= 20
        ? "15"
        : avgDuration <= 45
        ? "30"
        : "60"
      : careerTrack.primaryId === "urgencies" || careerTrack.primaryId === "triage"
      ? "15"
      : careerTrack.primaryId === "dynamic-simulator" || careerTrack.primaryId === "materno-infantil"
      ? "60"
      : "30";

    return { intent, format, time };
  }, [avgDuration, avgScore, careerTrack.format, careerTrack.intent, careerTrack.primaryId, hasActive, hasHighRisk, meta.targetMinutes]);

  useEffect(() => {
    if (timeTouched) return;
    setSelectedTime(suggestedAdvisor.time);
  }, [suggestedAdvisor.time, timeTouched]);

  const focusState = useMemo(
    () => getFocusState(suggestedAdvisor.intent, hasActive, hasHighRisk, avgScore),
    [avgScore, hasActive, hasHighRisk, suggestedAdvisor.intent]
  );

  const recommendations = useMemo(() => {
    return DASHBOARD_MODULES.map((module) => {
      const playbook = MODULE_PLAYBOOK[module.id] ?? {
        intents: ["continuidad"],
        formats: ["guiado"],
        minMinutes: 15,
        maxMinutes: 30,
        companionIds: [],
      };

      let score = module.highlight ? 1 : 0;
      if (playbook.intents.includes(suggestedAdvisor.intent)) score += 5;
      if (playbook.formats.includes(suggestedAdvisor.format)) score += 3;
      score += getTimeScore(selectedTime, playbook);
      if (module.id === careerTrack.primaryId) score += 4;
      if (careerTrack.supportIds.includes(module.id)) score += 2;

      if (hasActive && suggestedAdvisor.intent === "continuidad" && module.group === "simulacion") score += 2;
      if (hasHighRisk && ["urgencies", "ecg", "laboratory", "gasometry", "rcp-algorithms"].includes(module.id)) score += 2;
      if (typeof avgScore === "number" && avgScore < 72 && (module.group === "diagnostico" || module.group === "practica")) {
        score += 2;
      }
      if (suggestedAdvisor.intent === "documentacion" && ["pae", "pae-assistant", "notes", "caces"].includes(module.id)) {
        score += 1;
      }
      if (suggestedAdvisor.intent === "avanzado" && module.group === "avanzado") {
        score += 1;
      }

      const reasons: string[] = [];
      if (module.id === careerTrack.primaryId) {
        reasons.push(`Encaja con tu perfil de ${careerTrack.label.toLowerCase()}.`);
      } else if (careerTrack.supportIds.includes(module.id)) {
        reasons.push("Complementa bien tu ruta principal actual.");
      }
      if (playbook.intents.includes(suggestedAdvisor.intent)) {
        reasons.push(`Alineado con ${getIntentLabel(suggestedAdvisor.intent).toLowerCase()}.`);
      }
      if (playbook.formats.includes(suggestedAdvisor.format)) {
        reasons.push(`Encaja con modalidad ${getFormatLabel(suggestedAdvisor.format).toLowerCase()}.`);
      }
      reasons.push(`Ventana sugerida: ${formatWindow(playbook)}.`);

      if (hasActive && suggestedAdvisor.intent === "continuidad" && module.group === "simulacion") {
        reasons.push("Mantiene continuidad clínica con tu caso actual.");
      } else if (hasHighRisk && ["urgencies", "ecg", "laboratory", "gasometry", "rcp-algorithms"].includes(module.id)) {
        reasons.push("Refuerza seguridad y respuesta rápida.");
      } else if (typeof avgScore === "number" && avgScore < 72 && (module.group === "diagnostico" || module.group === "practica")) {
        reasons.push("Ayuda a subir precisión antes de escenarios más complejos.");
      } else if (module.count && module.countLabel) {
        reasons.push(`${module.count} ${module.countLabel} disponibles para practicar.`);
      }

      return {
        ...module,
        score,
        reasons: reasons.slice(0, 4),
        playbook,
      };
    }).sort((a, b) => b.score - a.score || Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)));
  }, [avgScore, careerTrack.label, careerTrack.primaryId, careerTrack.supportIds, hasActive, hasHighRisk, selectedTime, suggestedAdvisor.format, suggestedAdvisor.intent]);

  const topRecommendation = recommendations[0];
  const secondaryRecommendations = recommendations.slice(1, 4);
  const idealSimulator = pickModuleById(careerTrack.primaryId) ?? topRecommendation;
  const quickPractice = recommendations.find((module) => module.id !== idealSimulator?.id) ?? topRecommendation;

  const topRoute = useMemo(() => {
    if (!topRecommendation) return [];
    const ids = [topRecommendation.id, ...topRecommendation.playbook.companionIds];
    const seen = new Set<string>();
    return ids
      .map((id) => DASHBOARD_MODULES.find((module) => module.id === id))
      .filter((module): module is DashboardModuleMeta => Boolean(module))
      .filter((module) => {
        if (seen.has(module.id)) return false;
        seen.add(module.id);
        return true;
      })
      .slice(0, 3);
  }, [topRecommendation]);

  const nextModule = useMemo(() => {
    if (hasActive) return topRoute[1] ?? pickModuleById(careerTrack.supportIds[0]) ?? quickPractice;
    if (lastClosed && hasHighRisk) return pickModuleById("urgencies") ?? quickPractice;
    if (lastClosed && typeof avgScore === "number" && avgScore < 72) {
      return pickModuleById(careerTrack.weaknessIds[0]) ?? quickPractice;
    }
    return topRoute[1] ?? pickModuleById(careerTrack.supportIds[0]) ?? quickPractice;
  }, [avgScore, careerTrack.supportIds, careerTrack.weaknessIds, hasActive, hasHighRisk, lastClosed, quickPractice, topRoute]);

  const weaknessFocus = useMemo(() => {
    if (hasHighRisk) {
      return {
        title: "Seguridad y respuesta rápida",
        helper: "Tus datos recientes piden reforzar contención, priorización y conducta inicial.",
        modules: ["urgencies", "triage", "rcp-algorithms"]
          .map(pickModuleById)
          .filter((module): module is DashboardModuleMeta => Boolean(module)),
      };
    }

    if (typeof avgScore === "number" && avgScore < 72) {
      return {
        title: "Base diagnóstica y operativa",
        helper: "Conviene reforzar interpretación y secuencia clínica antes de subir complejidad.",
        modules: careerTrack.weaknessIds
          .map(pickModuleById)
          .filter((module): module is DashboardModuleMeta => Boolean(module)),
      };
    }

    if (completedCount < 3) {
      return {
        title: "Base de práctica todavía corta",
        helper: "Aún hace falta consolidar una rutina básica de entrenamiento y cierre.",
        modules: careerTrack.supportIds
          .map(pickModuleById)
          .filter((module): module is DashboardModuleMeta => Boolean(module)),
      };
    }

    return {
      title: "Subir complejidad con control",
      helper: "Tu siguiente refuerzo puede orientarse a integrar módulos complementarios más densos.",
      modules: [pickModuleById("dynamic-simulator"), pickModuleById("clinical-images"), pickModuleById("materno-infantil")].filter(
        (module): module is DashboardModuleMeta => Boolean(module)
      ),
    };
  }, [avgScore, careerTrack.supportIds, careerTrack.weaknessIds, completedCount, hasHighRisk]);

  const profileCompletion = useMemo(() => {
    const normalized = normalizeProfile(profileDraft);
    const completedFields = [normalized.name, normalized.email, normalized.role, normalized.career].filter(Boolean).length;
    return Math.round((completedFields / 4) * 100);
  }, [profileDraft]);

  const groupedModules = useMemo(
    () =>
      DASHBOARD_GROUP_ORDER.map((group) => ({
        group,
        label: DASHBOARD_GROUP_LABELS[group],
        items: DASHBOARD_MODULES.filter((item) => item.group === group),
      })),
    []
  );

  const primaryAction = hasActive
    ? { href: "/simulator", label: "Reanudar caso", helper: "Retoma entrevista, decisiones y evolución del escenario activo." }
    : { href: topRecommendation?.href ?? "/cases", label: "Abrir recomendación", helper: "Entra directo al módulo que mejor se ajusta a tu estado actual." };

  const contextMetrics = [
    {
      label: "Sesiones cerradas",
      value: String(completedCount),
      helper: "Historial listo para orientar la práctica.",
    },
    {
      label: "Puntaje clínico",
      value: avgScore != null ? `${avgScore}/100` : activeScore != null ? `${activeScore}/100` : "—",
      helper: avgScore != null ? "Promedio de cierres guardados." : "Estimado de la sesión actual.",
    },
    {
      label: "Riesgo reciente",
      value: currentRiskLevel,
      helper: "Se usa para priorizar seguridad cuando hace falta.",
    },
    {
      label: "Banco nuevo",
      value: String(DASHBOARD_NEW_BANK_TOTAL),
      helper: `${DASHBOARD_NEW_MODULES.length} módulos ampliados disponibles.`,
    },
  ];

  const openSessionReport = (session: StoredSession) => {
    try {
      localStorage.setItem("activeTranscript", JSON.stringify(session.transcript ?? []));
      localStorage.setItem(
        "activeCase",
        JSON.stringify({
          id: session.caseId,
          meta: { title: session.caseTitle },
          patient_profile: { display_name: session.patientName ?? "Paciente" },
        })
      );
    } catch {
      // ignore
    }
    window.location.assign("/results");
  };

  const handleProfileFieldChange =
    (field: keyof UserProfile) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setProfileDraft((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const saveProfileFromDashboard = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeProfile(profileDraft);

    if (!normalized.name || !normalized.email || !normalized.role || !normalized.career) {
      setProfileNotice({
        tone: "error",
        message: "Completa nombre, correo, rol y carrera para activar la personalización del dashboard.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email ?? "")) {
      setProfileNotice({
        tone: "error",
        message: "El correo no tiene un formato válido.",
      });
      return;
    }

    const saved = persistProfile({
      ...normalized,
      userId: profile.userId,
    });
    setProfile(saved);
    setProfileDraft(saved);
    setProfileNotice({
      tone: "success",
      message: "Perfil guardado. El dashboard ya está usando tu ruta personalizada.",
    });
  };

  const selectTime = (time: AdvisorTime) => {
    setTimeTouched(true);
    setSelectedTime(time);
  };

  const resetTimeSuggestion = () => {
    setTimeTouched(false);
    setSelectedTime(suggestedAdvisor.time);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbf9_0%,#eef5f2_48%,#e6efeb_100%)]">
      <div className="mx-auto flex max-w-[1520px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-[30px] border border-[#d9e7e1] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,246,0.98))] shadow-[0_28px_80px_rgba(99,126,118,0.16)] backdrop-blur-xl">
          <header className="flex flex-col gap-4 border-b border-[#d9e7e1] bg-white/70 px-5 py-4 xl:flex-row xl:items-center">
            <div>
              <div className="text-sm text-slate-500">Dashboard</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">Navegador clínico del ecosistema Psyke</div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
              <Link href="/reports" className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                Reportes
              </Link>
              <Link href="/history" className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                Historial
              </Link>
              <Link href="/cases" className="rounded-xl bg-[#183640] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#224652]">
                + Nuevo caso
              </Link>
            </div>
          </header>

          <div className="overflow-y-auto px-5 py-6">
            <section className="relative overflow-hidden rounded-[32px] border border-[#d7e6df] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,250,247,0.94))] p-5 shadow-[0_24px_70px_rgba(130,154,146,0.16)] sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(249,115,22,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.82),rgba(240,247,244,0.9)_55%,rgba(232,242,238,0.96))]" />

              <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_0.92fr] 2xl:grid-cols-[minmax(0,1.12fr)_0.88fr]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                    {profileComplete ? "Ruta personalizada activa" : "Onboarding clínico"}
                  </div>
                  <h1 className="mt-4 max-w-[18ch] text-3xl font-semibold leading-tight text-slate-900 sm:text-[2.55rem]">
                    Hola, {displayName}. {profileComplete ? "Tu siguiente bloque ya está orientado." : "Completa tu perfil y activamos tu ruta ideal."}
                  </h1>
                  <p className="mt-4 max-w-[68ch] text-sm leading-6 text-slate-600 sm:text-[15px]">
                    {profileComplete
                      ? `${focusState.description} Tu perfil actual se interpreta como ${careerTrack.label.toLowerCase()} y usa tu historial para priorizar módulos.`
                      : "Usa este bloque para dejar listo tu perfil académico y, al mismo tiempo, recibir recomendaciones por carrera, tiempo disponible e historial reciente."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600">
                      {DASHBOARD_MODULES.length} módulos activos
                    </span>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs text-cyan-700">
                      {careerTrack.label}
                    </span>
                    <span className={`rounded-full border px-3 py-1.5 text-xs ${riskBadgeClass(currentRiskLevel)}`}>
                      Riesgo {currentRiskLevel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600">
                      Tiempo activo: {getTimeLabel(selectedTime)}
                    </span>
                  </div>

                  {!profileComplete ? (
                    <form onSubmit={saveProfileFromDashboard} className="mt-6 rounded-[28px] border border-slate-200/90 bg-white/78 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Completa tu perfil inicial</div>
                          <div className="mt-1 text-sm text-slate-500">
                            Esto reemplaza el popup de bienvenida y deja listo el dashboard desde aquí.
                          </div>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                          {profileCompletion}% completo
                        </span>
                      </div>

                      {profileNotice ? (
                        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${getNoticeClass(profileNotice.tone)}`}>
                          {profileNotice.message}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          value={profileDraft.name ?? ""}
                          onChange={handleProfileFieldChange("name")}
                          placeholder="Nombre completo"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-400"
                        />
                        <input
                          type="email"
                          value={profileDraft.email ?? ""}
                          onChange={handleProfileFieldChange("email")}
                          placeholder="Correo"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-400"
                        />
                        <input
                          type="text"
                          value={profileDraft.role ?? ""}
                          onChange={handleProfileFieldChange("role")}
                          placeholder="Rol académico"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-400"
                        />
                        <input
                          type="text"
                          value={profileDraft.career ?? ""}
                          onChange={handleProfileFieldChange("career")}
                          placeholder="Carrera o programa"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-400"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={!profileReady}
                          className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652] disabled:opacity-60"
                        >
                          Guardar perfil y personalizar
                        </button>
                        <span className="text-xs text-slate-500">
                          {authDetected ? "Cuenta detectada: usaremos estos datos en toda la plataforma." : "Modo local: el perfil se guarda en este navegador."}
                        </span>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-6 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
                      <div className="rounded-[28px] border border-slate-200/90 bg-white/78 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Perfil listo</div>
                            <div className="mt-1 text-sm text-slate-500">{careerTrack.helper}</div>
                          </div>
                          <Link href="/profile" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50">
                            Editar perfil
                          </Link>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Rol</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{displayRole}</div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Carrera</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{displayCareer}</div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2 2xl:col-span-1">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Ruta sugerida</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{getIntentLabel(suggestedAdvisor.intent)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-200/90 bg-white/78 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Práctica rápida</div>
                            <div className="mt-1 text-sm text-slate-500">Ajusta solo el tiempo y mantenemos la recomendación.</div>
                          </div>
                          <button
                            type="button"
                            onClick={resetTimeSuggestion}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50"
                          >
                            Restaurar
                          </button>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {TIME_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => selectTime(option.id)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                selectedTime === option.id
                                  ? "border-orange-300 bg-orange-50 text-slate-900"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="text-sm font-semibold">{option.label}</div>
                              <div className="mt-2 text-xs leading-5 text-slate-500">{option.helper}</div>
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                          Sugerencia automática: {getIntentLabel(suggestedAdvisor.intent)} · {getFormatLabel(suggestedAdvisor.format)} · {getTimeLabel(suggestedAdvisor.time)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                  <div className="flex h-full flex-col rounded-[30px] border border-slate-200/90 bg-white/78 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Simulador ideal según tu perfil</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">{idealSimulator?.label ?? "Sin recomendación"}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {careerTrack.helper}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${groupBadgeClass(idealSimulator?.group ?? "seguimiento")}`}>
                        {idealSimulator ? DASHBOARD_GROUP_LABELS[idealSimulator.group] : "—"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        {displayCareer}
                      </span>
                    </div>
                    <Link
                      href={idealSimulator?.href ?? "/cases"}
                      className="mt-auto inline-flex rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]"
                    >
                      Abrir simulador ideal
                    </Link>
                  </div>

                  <div className="flex h-full flex-col rounded-[30px] border border-slate-200/90 bg-white/78 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Práctica rápida según tiempo</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">{quickPractice?.label ?? "Sin sugerencia"}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {quickPractice ? compactText(quickPractice.summary, 16) : "Selecciona un bloque de tiempo para ver la mejor sesión corta."}
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      Mejor encaje para {getTimeLabel(selectedTime)} en modalidad {getFormatLabel(suggestedAdvisor.format).toLowerCase()}.
                    </div>
                    <Link
                      href={quickPractice?.href ?? "/cases"}
                      className="mt-auto inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Entrar a práctica rápida
                    </Link>
                  </div>

                  <div className="flex h-full flex-col rounded-[30px] border border-slate-200/90 bg-white/78 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Siguiente módulo según historial</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">{nextModule?.label ?? "Sin siguiente paso"}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {hasActive
                        ? "Lo colocamos después de tu caso activo para mantener continuidad sin cortar el flujo."
                        : lastClosed
                        ? "Se apoya en tu último cierre, tu promedio reciente y la ruta complementaria de tu perfil."
                        : "Todavía no hay historial suficiente, así que tomamos la mejor continuación desde tu ruta base."}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topRoute.slice(0, 3).map((module) => (
                        <span key={module.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                          {module.label}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={nextModule?.href ?? "/cases"}
                      className="mt-auto inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Abrir siguiente módulo
                    </Link>
                  </div>

                  <div className="flex h-full flex-col rounded-[30px] border border-slate-200/90 bg-white/78 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Refuerzo de áreas débiles</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">{weaknessFocus.title}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-600">{weaknessFocus.helper}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {weaknessFocus.modules.slice(0, 3).map((module) => (
                        <Link
                          key={module.id}
                          href={module.href}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:bg-white"
                        >
                          {module.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_340px] 2xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <div className="rounded-[30px] border border-slate-200/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">Opciones sugeridas para hoy</div>
                    <div className="mt-1 text-sm text-slate-500">
                      Las tarjetas cambian según objetivo, modalidad, tiempo y contexto clínico reciente.
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">Top 4 recomendaciones</div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {[topRecommendation, ...secondaryRecommendations].filter(Boolean).map((module, index) => (
                    <Link
                      key={module!.id}
                      href={module!.href}
                      className={`group rounded-[28px] border p-5 transition hover:-translate-y-0.5 ${
                        index === 0
                          ? "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-orange-50 shadow-[0_18px_40px_rgba(125,211,252,0.18)]"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            {index === 0 ? "Mejor ajuste" : "Alternativa"}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-slate-900">{module!.label}</div>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${groupBadgeClass(module!.group)}`}>
                          {DASHBOARD_GROUP_LABELS[module!.group]}
                        </span>
                      </div>

                      <div className={`mt-4 rounded-2xl border border-slate-200 bg-gradient-to-r ${module!.accent} p-4`}>
                        <div className="text-sm leading-6 text-slate-700">{compactText(module!.summary, 16)}</div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {module!.reasons.slice(0, 2).map((reason) => (
                          <div key={reason} className="text-xs text-slate-500">
                            {reason}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">{module!.status}</span>
                        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                          Abrir módulo
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[30px] border border-slate-200/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Estado actual
                      </div>
                      <div className="mt-2 text-xl font-semibold text-slate-900">
                        {hasActive ? "Caso en progreso" : "Sin sesión activa"}
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${riskBadgeClass(currentRiskLevel)}`}>
                      Riesgo {currentRiskLevel}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Caso</span>
                      <span className="max-w-[220px] truncate text-right text-slate-800">
                        {hasActive ? meta.title : safeText(lastClosed?.caseTitle, "—")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Paciente</span>
                      <span className="max-w-[220px] truncate text-right text-slate-800">
                        {hasActive ? meta.patientName : safeText(lastClosed?.patientName, "—")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Duración</span>
                      <span className="text-slate-800">
                        {hasActive ? (meta.targetMinutes ? `${meta.targetMinutes} min` : "Libre") : avgDuration ? `${avgDuration} min` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Último cierre</span>
                      <span className="text-right text-slate-800">{formatDate(lastClosed?.endedAt ?? endedInfo?.ended_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Motivo</span>
                      <span className="text-slate-800">{shortReason(lastClosed?.reason ?? endedInfo?.reason)}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={primaryAction.href}
                      className="rounded-xl bg-[#183640] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#224652]"
                    >
                      {primaryAction.label}
                    </Link>
                    <Link
                      href="/history"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      Ver historial
                    </Link>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">{primaryAction.helper}</div>
                </div>

                <div className="rounded-[30px] border border-slate-200/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Contexto del sistema
                      </div>
                      <div className="mt-2 text-lg font-semibold text-slate-900">Resumen de orientación</div>
                    </div>
                    <div className="text-xs text-slate-400">Local y en tiempo real</div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {contextMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{metric.label}</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-500">{metric.helper}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-900">Explorar por dominio</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Si no quieres usar la recomendación automática, puedes entrar por el área clínica que más te interese.
                  </div>
                </div>
                <Link href="/topics" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                  Ir a biblioteca clínica
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-4">
                {groupedModules.map(({ group, label, items }) => (
                  <div key={group} className="rounded-[28px] border border-slate-200/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${groupBadgeClass(group)}`}>
                          {label}
                        </span>
                        <div className="mt-3 text-lg font-semibold text-slate-900">{items.length} módulos</div>
                      </div>
                      <Link href={GROUP_PRIMARY_LINKS[group]} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50">
                        Abrir
                      </Link>
                    </div>

                    <div className="mt-3 text-sm leading-6 text-slate-600">{compactText(GROUP_DESCRIPTIONS[group], 10)}</div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition hover:bg-white"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-[30px] border border-slate-200/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-900">Últimas sesiones</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Revisión rápida de cierres recientes para mantener continuidad y reabrir reportes.
                  </div>
                </div>
                <Link href="/history" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                  Ver todas
                </Link>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-12 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                  <div className="col-span-4">Caso</div>
                  <div className="col-span-3">Fecha cierre</div>
                  <div className="col-span-2">Riesgo</div>
                  <div className="col-span-1 text-right">Score</div>
                  <div className="col-span-2 text-right">Acción</div>
                </div>

                {(history.length ? history.slice(0, 6) : []).map((session) => (
                  <div key={session.id} className="grid grid-cols-12 border-t border-slate-200 px-4 py-3 text-sm">
                    <div className="col-span-4 min-w-0">
                      <div className="truncate font-semibold text-slate-900">{safeText(session.caseTitle, "Sesión")}</div>
                      <div className="truncate text-xs text-slate-500">{safeText(session.patientName, "Paciente")}</div>
                    </div>
                    <div className="col-span-3 text-slate-600">{formatDate(session.endedAt)}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${riskBadgeClass(session.riskLevel)}`}>
                        {session.riskLevel}
                      </span>
                    </div>
                    <div className="col-span-1 text-right text-slate-700">{typeof session.score === "number" ? session.score : "—"}</div>
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => openSessionReport(session)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver reporte
                      </button>
                    </div>
                  </div>
                ))}

                {!history.length && (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    Aún no hay sesiones guardadas. Usa el orientador para elegir un módulo y empezar a construir historial.
                  </div>
                )}
              </div>
            </section>

            <div className="mt-6 text-xs text-slate-400">Psyke es una herramienta educativa. No sustituye valoración clínica real.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
