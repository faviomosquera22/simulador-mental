"use client";

export type UserProfile = {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  career?: string;
  avatarUrl?: string;
  updatedAt?: string;
};

export const PROFILE_KEYS = ["profile", "userProfile", "app_profile"] as const;
export const PROFILE_UPDATED_EVENT = "psyke:profile-updated";
export const PROFILE_ONBOARDING_DISMISSED_PREFIX = "psyke:profile-onboarding-dismissed";

export const EMPTY_PROFILE: UserProfile = {
  userId: "",
  name: "",
  email: "",
  role: "",
  career: "",
  avatarUrl: "",
};

export function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function normalizeText(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProfile(profile?: UserProfile | null): UserProfile {
  return {
    userId: normalizeText(profile?.userId),
    name: normalizeText(profile?.name),
    email: normalizeText(profile?.email),
    role: normalizeText(profile?.role),
    career: normalizeText(profile?.career),
    avatarUrl: normalizeText(profile?.avatarUrl),
    updatedAt: profile?.updatedAt,
  };
}

export function serializeComparableProfile(profile: UserProfile) {
  const normalized = normalizeProfile(profile);
  return JSON.stringify({
    userId: normalized.userId,
    name: normalized.name,
    email: normalized.email,
    role: normalized.role,
    career: normalized.career,
    avatarUrl: normalized.avatarUrl,
  });
}

export function dispatchProfileUpdated(profile?: UserProfile) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PROFILE_UPDATED_EVENT, {
      detail: normalizeProfile(profile ?? EMPTY_PROFILE),
    })
  );
}

export function readStoredProfile() {
  if (typeof window === "undefined") return null;
  for (const key of PROFILE_KEYS) {
    const parsed = safeParse<UserProfile>(window.localStorage.getItem(key));
    if (parsed) return normalizeProfile(parsed);
  }
  return null;
}

export function persistProfile(profile: UserProfile) {
  if (typeof window === "undefined") {
    return normalizeProfile(profile);
  }

  const payload: UserProfile = {
    ...normalizeProfile(profile),
    updatedAt: new Date().toISOString(),
  };

  PROFILE_KEYS.forEach((key) => {
    window.localStorage.setItem(key, JSON.stringify(payload));
  });

  dispatchProfileUpdated(payload);
  return payload;
}

export function clearStoredProfile() {
  if (typeof window === "undefined") return;
  PROFILE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
  dispatchProfileUpdated(EMPTY_PROFILE);
}

function pickMetaString(meta: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function extractProfileFromAuth(user: any): UserProfile | null {
  if (!user) return null;

  const meta = typeof user.user_metadata === "object" && user.user_metadata ? user.user_metadata : {};
  const safeMeta = meta as Record<string, unknown>;

  const profile = normalizeProfile({
    userId: typeof user.id === "string" ? user.id : "",
    name: pickMetaString(safeMeta, ["full_name", "name", "display_name", "user_name"]),
    email: typeof user.email === "string" ? user.email.trim() : pickMetaString(safeMeta, ["email"]),
    role: pickMetaString(safeMeta, ["role", "user_role", "position"]),
    career: pickMetaString(safeMeta, ["career", "program", "specialty"]),
    avatarUrl: pickMetaString(safeMeta, ["avatar_url", "picture", "avatarUrl"]),
  });

  if (!profile.userId && !profile.name && !profile.email && !profile.role && !profile.career && !profile.avatarUrl) {
    return null;
  }

  return profile;
}

export function mergeProfiles(primary?: UserProfile | null, fallback?: UserProfile | null): UserProfile {
  const base = normalizeProfile(primary);
  const incoming = normalizeProfile(fallback);

  return {
    userId: base.userId || incoming.userId,
    name: base.name || incoming.name,
    email: base.email || incoming.email,
    role: base.role || incoming.role,
    career: base.career || incoming.career,
    avatarUrl: base.avatarUrl || incoming.avatarUrl,
    updatedAt: base.updatedAt || incoming.updatedAt,
  };
}

export function getProfileDisplayName(profile?: UserProfile | null, fallback = "Usuario") {
  return normalizeText(profile?.name) || normalizeText(profile?.email) || fallback;
}

export function getProfileInitial(profile?: UserProfile | null, fallback = "U") {
  return getProfileDisplayName(profile, fallback).charAt(0).toUpperCase() || fallback;
}

export function isProfileComplete(profile?: UserProfile | null) {
  const normalized = normalizeProfile(profile);
  return Boolean(normalized.name && normalized.email && normalized.role && normalized.career);
}

export function getOnboardingDismissedKey(userId?: string) {
  return `${PROFILE_ONBOARDING_DISMISSED_PREFIX}:${normalizeText(userId) || "anonymous"}`;
}

