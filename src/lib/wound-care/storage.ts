"use client";

import { addSession } from "@/lib/history";
import { getWoundCaseById } from "@/src/lib/wound-care/cases";
import { evaluateWoundSession } from "@/src/lib/wound-care/engine";
import {
  type WoundAnalytics,
  type WoundCompetencyKey,
  type WoundEvaluationResult,
  type WoundSimulationSession,
  WOUND_COMPETENCY_LABELS,
} from "@/src/lib/wound-care/types";

const PROFILE_STORAGE_KEYS = ["profile", "userProfile", "app_profile"] as const;
const ANALYTICS_PREFIX = "wound-care:analytics";
const SESSION_PREFIX = "wound-care:session";

function safeParse<T>(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeText(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function getUserKey() {
  if (typeof window === "undefined") return "anonymous";
  for (const key of PROFILE_STORAGE_KEYS) {
    const profile = safeParse<Record<string, unknown>>(window.localStorage.getItem(key));
    if (!profile) continue;
    const userId = normalizeText(typeof profile.userId === "string" ? profile.userId : "");
    const email = normalizeText(typeof profile.email === "string" ? profile.email : "");
    if (userId) return userId;
    if (email) return email.toLowerCase();
  }
  return "anonymous";
}

function analyticsKey(userKey: string) {
  return `${ANALYTICS_PREFIX}:${userKey}`;
}

function sessionKey(userKey: string, caseId: string, mode: string) {
  return `${SESSION_PREFIX}:${userKey}:${caseId}:${mode}`;
}

function emptyAnalytics(userKey: string): WoundAnalytics {
  const competencyAverages = Object.keys(WOUND_COMPETENCY_LABELS).reduce((acc, key) => {
    acc[key as WoundCompetencyKey] = 0;
    return acc;
  }, {} as Record<WoundCompetencyKey, number>);

  return {
    userKey,
    totalAttempts: 0,
    completedCases: [],
    averageScore: 0,
    competencyAverages,
    frequentErrors: {},
    moduleProgress: {},
  };
}

export function readWoundAnalytics() {
  if (typeof window === "undefined") return emptyAnalytics("anonymous");
  const userKey = getUserKey();
  return safeParse<WoundAnalytics>(window.localStorage.getItem(analyticsKey(userKey))) ?? emptyAnalytics(userKey);
}

export function saveWoundAnalytics(analytics: WoundAnalytics) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(analyticsKey(analytics.userKey), JSON.stringify(analytics));
}

export function readWoundSession(caseId: string, mode: string) {
  if (typeof window === "undefined") return null;
  return safeParse<WoundSimulationSession>(window.localStorage.getItem(sessionKey(getUserKey(), caseId, mode)));
}

export function saveWoundSession(session: WoundSimulationSession) {
  if (typeof window === "undefined") return;
  const userKey = getUserKey();
  window.localStorage.setItem(
    sessionKey(userKey, session.caseId, session.mode),
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() })
  );
}

export function clearWoundSession(caseId: string, mode: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionKey(getUserKey(), caseId, mode));
}

function mergeCompetencyAverages(
  previous: Record<WoundCompetencyKey, number>,
  nextResult: WoundEvaluationResult,
  totalAttempts: number
) {
  const merged = { ...previous };
  for (const competency of nextResult.competencies) {
    const prev = previous[competency.key] ?? 0;
    merged[competency.key] = Math.round(((prev * (totalAttempts - 1)) + competency.score) / totalAttempts);
  }
  return merged;
}

export function finalizeWoundSession(session: WoundSimulationSession) {
  const result = session.finalResult ?? evaluateWoundSession(session);
  if (!result) return null;
  const caseData = getWoundCaseById(session.caseId);

  const analytics = readWoundAnalytics();
  const totalAttempts = analytics.totalAttempts + 1;
  const nextAverage = Math.round(((analytics.averageScore * analytics.totalAttempts) + result.overallScore) / totalAttempts);
  const existingProgress = analytics.moduleProgress[session.caseId];

  const nextAnalytics: WoundAnalytics = {
    ...analytics,
    totalAttempts,
    averageScore: nextAverage,
    completedCases: Array.from(new Set([...analytics.completedCases, session.caseId])),
    competencyAverages: mergeCompetencyAverages(analytics.competencyAverages, result, totalAttempts),
    frequentErrors: { ...analytics.frequentErrors },
    moduleProgress: {
      ...analytics.moduleProgress,
      [session.caseId]: {
        attempts: (existingProgress?.attempts ?? 0) + 1,
        completed: true,
        bestScore: Math.max(existingProgress?.bestScore ?? 0, result.overallScore),
        lastScore: result.overallScore,
        lastMode: session.mode,
        lastEvolution: result.evolution,
        lastPlayedAt: new Date().toISOString(),
      },
    },
  };

  for (const errorLabel of result.frequentErrorLabels) {
    nextAnalytics.frequentErrors[errorLabel] = (nextAnalytics.frequentErrors[errorLabel] ?? 0) + 1;
  }

  saveWoundAnalytics(nextAnalytics);

  const finalizedSession: WoundSimulationSession = {
    ...session,
    updatedAt: new Date().toISOString(),
    completedAt: session.completedAt ?? new Date().toISOString(),
    currentStep: "results",
    finalResult: result,
  };
  saveWoundSession(finalizedSession);
  const completedAt = finalizedSession.completedAt ?? new Date().toISOString();

  addSession({
    sessionId: finalizedSession.sessionId,
    caseId: finalizedSession.caseId,
    caseTitle: `Curación de heridas · ${caseData?.name ?? finalizedSession.caseId}`,
    patientName: caseData ? `${caseData.patient.age} años · ${caseData.patient.sex}` : "Módulo de LPP",
    mode: finalizedSession.mode,
    startedAt: finalizedSession.startedAt,
    endedAt: completedAt,
    endReason: "manual",
    durationSec: Math.max(
      60,
      Math.round((new Date(completedAt).getTime() - new Date(finalizedSession.startedAt).getTime()) / 1000)
    ),
    score: result.overallScore,
    moduleId: "wound-care",
    moduleLabel: "Curación de heridas",
    riskLevel:
      result.evolution === "empeora"
        ? "Alto"
        : result.evolution === "sin cambios"
        ? "Moderado"
        : "Bajo",
    lastMeta: {
      state: result.evolution,
      intensity: result.overallScore,
      rapport: result.overallScore,
      flags: result.criticalErrors.map((item) => `risk:${item.toLowerCase()}`),
    },
    transcript: result.competencies.map((competency) => ({
      role: "tutor",
      content: `${competency.label}: ${competency.score}/100`,
    })),
  });

  return finalizedSession;
}
