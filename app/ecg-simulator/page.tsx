"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import EcgWorkspace from "@/components/ecg/EcgWorkspace";
import { DEFAULT_ECG_MODULE_CONFIG } from "@/src/lib/ecgLibrary";

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function buildStandaloneCase(source?: any) {
  const existingConfig = source?.meta?.ecg ?? source?.ecg ?? {};
  const config = {
    ...DEFAULT_ECG_MODULE_CONFIG,
    ...existingConfig,
    enabled: true,
  };

  return {
    ...(source ?? {}),
    id: source?.id ?? "standalone-ecg-case",
    meta: {
      ...(source?.meta ?? {}),
      title: source?.meta?.title ?? "Simulador de ECG",
      category: source?.meta?.category ?? "cardiology_training",
      risk_level: source?.meta?.risk_level ?? "moderado",
      ecg: config,
    },
    ecg: config,
    chief_complaint:
      source?.chief_complaint ?? "Entrenamiento de interpretación de ritmos y trazados ECG",
    brief_context:
      source?.brief_context ??
      "Práctica independiente: interpretar ritmo, estimar estabilidad, decidir conducta y recibir feedback.",
    patient_profile: {
      ...(source?.patient_profile ?? {}),
      context:
        source?.patient_profile?.context ??
        "palpitaciones, dolor torácico o colapso según el trazado seleccionado",
    },
  };
}

export default function EcgSimulatorPage() {
  const router = useRouter();
  const [caseObject, setCaseObject] = useState<any>(() => buildStandaloneCase());
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [syncWithActiveCase, setSyncWithActiveCase] = useState(false);

  useEffect(() => {
    try {
      const active = safeParse(localStorage.getItem("activeCase"));
      if (active) {
        setCaseObject(buildStandaloneCase(active));
        setSyncWithActiveCase(true);
      } else {
        setCaseObject(buildStandaloneCase());
      }
    } catch {
      setCaseObject(buildStandaloneCase());
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsedSeconds = useMemo(
    () => Math.max(0, Math.floor((now - startedAt) / 1000)),
    [now, startedAt]
  );
  const timeLabel = useMemo(() => formatTime(elapsedSeconds), [elapsedSeconds]);
  const riskLabel = String(caseObject?.meta?.risk_level ?? "moderado");

  function handleCaseObjectChange(nextCaseObject: any) {
    const normalized = buildStandaloneCase(nextCaseObject);
    setCaseObject(normalized);

    if (!syncWithActiveCase) return;
    try {
      localStorage.setItem("activeCase", JSON.stringify(normalized));
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto flex max-w-[1660px] gap-3 px-3 pb-6 pt-14 sm:gap-6 sm:px-4 md:pt-6">
        <Sidebar />

        <main className="min-h-0 flex-1">
          <EcgWorkspace
            open
            standalone
            caseObject={caseObject}
            timeLabel={timeLabel}
            currentRiskLabel={riskLabel}
            onClose={() => router.push("/dashboard")}
            onCaseObjectChange={handleCaseObjectChange}
          />
        </main>
      </div>
    </div>
  );
}
