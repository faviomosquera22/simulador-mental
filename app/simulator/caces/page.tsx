"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "@/components/Sidebar";
import {
  CACES_QUESTION_BANK,
  CACES_CATEGORIES,
  buildCacesQuestionKey,
  dedupeCacesQuestions,
  deriveQuestionCountByMode,
  evaluateCacesAttempt,
  filterCacesQuestionBank,
  listCacesComponents,
  listCacesSubcomponents,
  listCacesTopics,
  sampleCacesQuestionsPrioritizingUnseen,
} from "@/src/lib/caces";
import {
  appendGeneratedCacesBank,
  getGeneratedCacesBank,
  getSeenCacesQuestionKeys,
  markSeenCacesQuestions,
} from "@/src/lib/cacesDynamicStore";
import { addCacesHistory, getCacesHistory } from "@/src/lib/cacesHistory";
import { getAuthFetchHeaders } from "@/src/lib/clientAuth";
import type {
  CacesAttemptAnswer,
  CacesAttemptConfig,
  CacesAttemptResult,
  CacesDifficulty,
  CacesFeedbackMode,
  CacesHistoryEntry,
  CacesOptionId,
  CacesPracticeMode,
  CacesQuestion,
  CacesQuestionType,
} from "@/src/lib/types";

type CacesGenerateApiResponse = {
  questions?: CacesQuestion[];
  provider?: string;
  requested?: number;
  generated?: number;
  detail?: string;
};

type AttemptState = {
  id: string;
  startedAtMs: number;
  endsAtMs: number | null;
  questions: CacesQuestion[];
  responses: Record<string, CacesAttemptAnswer>;
  currentIndex: number;
  immediateFeedbackQuestionId: string | null;
  result: CacesAttemptResult | null;
};

function formatTimer(totalSec: number) {
  const s = Math.max(0, totalSec);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function getPriorityClass(priority: "Alta" | "Media" | "Baja") {
  if (priority === "Alta") return "border-red-400/25 bg-red-400/10 text-red-100";
  if (priority === "Media") return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
}

function getModeLabel(mode: CacesPracticeMode) {
  if (mode === "practica_individual") return "Práctica individual";
  if (mode === "quiz_5") return "Quiz de 5";
  if (mode === "simulacro_10") return "Simulacro de 10";
  if (mode === "simulacro_20") return "Simulacro de 20";
  if (mode === "simulacro_30") return "Simulacro de 30";
  if (mode === "simulacro_40") return "Simulacro de 40";
  if (mode === "simulacro_50_mixto") return "Examen amplio (50 mixtas)";
  return "Simulacro amplio (80 mixtas)";
}

export default function SimulatorCacesPage() {
  const [loadingBank, setLoadingBank] = useState(true);
  const [history, setHistory] = useState<CacesHistoryEntry[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<string>("");
  const [selectedSubcomponent, setSelectedSubcomponent] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<CacesDifficulty | "all">("all");
  const [selectedType, setSelectedType] = useState<CacesQuestionType | "all">("all");

  const [mode, setMode] = useState<CacesPracticeMode>("quiz_5");
  const [feedbackMode, setFeedbackMode] = useState<CacesFeedbackMode>("inmediata");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [minutesPerQuestion, setMinutesPerQuestion] = useState<1 | 2>(2);
  const [mixCategories, setMixCategories] = useState(false);
  const [saveResult, setSaveResult] = useState(true);
  const [enableAIDynamicBank, setEnableAIDynamicBank] = useState(true);
  const [generatedQuestions, setGeneratedQuestions] = useState<CacesQuestion[]>([]);
  const [seenQuestionKeys, setSeenQuestionKeys] = useState<Set<string>>(new Set());
  const [aiBusy, setAiBusy] = useState(false);
  const [aiInfo, setAiInfo] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [selectedOption, setSelectedOption] = useState<CacesOptionId | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [showErrorReview, setShowErrorReview] = useState(false);
  const [savedCurrentResult, setSavedCurrentResult] = useState(false);
  const [nowMs, setNowMs] = useState<number>(0);

  const finishingRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setLoadingBank(false);
      setHistory(getCacesHistory());
      setGeneratedQuestions(getGeneratedCacesBank());
      setSeenQuestionKeys(new Set(getSeenCacesQuestionKeys()));
    }, 180);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  const questionCountByMode = useMemo(() => deriveQuestionCountByMode(mode), [mode]);
  const isWideMixedMode =
    mode === "simulacro_50_mixto" || mode === "simulacro_maximo";

  useEffect(() => {
    if (!isWideMixedMode) return;
    setMixCategories(true);
    setSelectedCategory("");
    setSelectedComponent("");
    setSelectedSubcomponent("");
    setSelectedTopic("");
    setSelectedDifficulty("all");
    setSelectedType("all");
  }, [isWideMixedMode]);

  useEffect(() => {
    setSelectedComponent("");
    setSelectedSubcomponent("");
    setSelectedTopic("");
  }, [selectedCategory, mixCategories]);

  useEffect(() => {
    setSelectedSubcomponent("");
    setSelectedTopic("");
  }, [selectedComponent]);

  useEffect(() => {
    setSelectedTopic("");
  }, [selectedSubcomponent]);

  useEffect(() => {
    if (!attempt || attempt.result) return;
    if (!attempt.endsAtMs) return;

    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, [attempt]);

  const effectiveMixCategories = isWideMixedMode || mixCategories;

  const effectiveCategory = useMemo(() => {
    if (effectiveMixCategories) return undefined;
    return selectedCategory || undefined;
  }, [effectiveMixCategories, selectedCategory]);

  const combinedQuestionBank = useMemo(
    () => dedupeCacesQuestions([...CACES_QUESTION_BANK, ...generatedQuestions]),
    [generatedQuestions]
  );

  const componentOptions = useMemo(
    () => listCacesComponents(effectiveCategory, combinedQuestionBank),
    [effectiveCategory, combinedQuestionBank]
  );

  const subcomponentOptions = useMemo(
    () => listCacesSubcomponents(selectedComponent || undefined, effectiveCategory, combinedQuestionBank),
    [selectedComponent, effectiveCategory, combinedQuestionBank]
  );

  const topicOptions = useMemo(
    () =>
      listCacesTopics(
        selectedComponent || undefined,
        selectedSubcomponent || undefined,
        effectiveCategory,
        combinedQuestionBank
      ),
    [selectedComponent, selectedSubcomponent, effectiveCategory, combinedQuestionBank]
  );

  const activeFilterPayload = useMemo(
    () => ({
      category: effectiveCategory,
      component: selectedComponent || undefined,
      subcomponent: selectedSubcomponent || undefined,
      topic: selectedTopic || undefined,
      difficulty: selectedDifficulty === "all" ? undefined : selectedDifficulty,
      type: selectedType === "all" ? undefined : selectedType,
      mix_categories: effectiveMixCategories,
    }),
    [
      effectiveCategory,
      selectedComponent,
      selectedSubcomponent,
      selectedTopic,
      selectedDifficulty,
      selectedType,
      effectiveMixCategories,
    ]
  );

  const filteredQuestions = useMemo(() => {
    return filterCacesQuestionBank(activeFilterPayload, combinedQuestionBank);
  }, [activeFilterPayload, combinedQuestionBank]);

  const unseenFilteredCount = useMemo(
    () =>
      filteredQuestions.filter(
        (q) => !seenQuestionKeys.has(buildCacesQuestionKey(q))
      ).length,
    [filteredQuestions, seenQuestionKeys]
  );

  const plannedQuestionCount = questionCountByMode;

  const estimatedTimeMinutes = useMemo(
    () => plannedQuestionCount * minutesPerQuestion,
    [plannedQuestionCount, minutesPerQuestion]
  );

  const currentQuestion = useMemo(() => {
    if (!attempt || attempt.result) return null;
    return attempt.questions[attempt.currentIndex] ?? null;
  }, [attempt]);

  useEffect(() => {
    if (!attempt || !currentQuestion) {
      setSelectedOption(null);
      return;
    }
    const saved = attempt.responses[currentQuestion.id]?.selected ?? null;
    setSelectedOption(saved);
  }, [attempt, currentQuestion]);

  const currentResponse = useMemo(() => {
    if (!attempt || !currentQuestion) return null;
    return attempt.responses[currentQuestion.id] ?? null;
  }, [attempt, currentQuestion]);

  const answeredCount = useMemo(() => {
    if (!attempt) return 0;
    return attempt.questions.filter((q) => {
      const a = attempt.responses[q.id];
      return Boolean(a && (a.selected !== null || a.skipped));
    }).length;
  }, [attempt]);

  const immediateCorrectCount = useMemo(() => {
    if (!attempt) return 0;
    return attempt.questions.filter((q) => {
      const a = attempt.responses[q.id];
      return Boolean(a && a.selected !== null && a.selected === q.correctAnswer);
    }).length;
  }, [attempt]);

  const immediateIncorrectCount = useMemo(() => {
    if (!attempt) return 0;
    return attempt.questions.filter((q) => {
      const a = attempt.responses[q.id];
      return Boolean(a && a.selected !== null && a.selected !== q.correctAnswer);
    }).length;
  }, [attempt]);

  const remainingSec = useMemo(() => {
    if (!attempt || attempt.result || !attempt.endsAtMs) return null;
    return Math.max(0, Math.round((attempt.endsAtMs - nowMs) / 1000));
  }, [attempt, nowMs]);

  const progressPct = useMemo(() => {
    if (!attempt) return 0;
    if (attempt.questions.length === 0) return 0;
    return Math.round((answeredCount / attempt.questions.length) * 100);
  }, [attempt, answeredCount]);

  const cacesConfig: CacesAttemptConfig = useMemo(
    () => ({
      category: effectiveCategory,
      component: selectedComponent || undefined,
      subcomponent: selectedSubcomponent || undefined,
      topic: selectedTopic || undefined,
      difficulty: selectedDifficulty === "all" ? undefined : selectedDifficulty,
      type: selectedType === "all" ? undefined : selectedType,
      mode,
      number_of_questions: plannedQuestionCount,
      minutes_per_question: minutesPerQuestion,
      estimated_time_minutes: estimatedTimeMinutes,
      feedback_mode: feedbackMode,
      timer_enabled: timerEnabled,
      mix_categories: effectiveMixCategories,
      save_result: saveResult,
    }),
    [
      effectiveCategory,
      selectedComponent,
      selectedSubcomponent,
      selectedTopic,
      selectedDifficulty,
      selectedType,
      mode,
      plannedQuestionCount,
      minutesPerQuestion,
      estimatedTimeMinutes,
      feedbackMode,
      timerEnabled,
      effectiveMixCategories,
      saveResult,
    ]
  );

  const generateMoreQuestionsWithAI = useCallback(
    async (requestedCount: number, reason: string) => {
      setAiError(null);
      setAiInfo(`Generando preguntas con IA (${reason})...`);
      setAiBusy(true);

      try {
        const headers = await getAuthFetchHeaders({
          "Content-Type": "application/json",
        });

        const existingKeys = combinedQuestionBank.map((q) => buildCacesQuestionKey(q));
        const exclude = [...new Set([...Array.from(seenQuestionKeys), ...existingKeys])].slice(-220);

        const res = await fetch("/api/ai/caces-generate", {
          method: "POST",
          headers,
          body: JSON.stringify({
            count: requestedCount,
            filters: activeFilterPayload,
            exclude_question_keys: exclude,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as CacesGenerateApiResponse;
        if (!res.ok) {
          throw new Error(data?.detail || "No se pudo generar preguntas con IA.");
        }

        const incoming = Array.isArray(data?.questions) ? dedupeCacesQuestions(data.questions) : [];
        if (incoming.length === 0) {
          throw new Error("La IA no devolvió preguntas válidas para este filtro.");
        }

        const merged = appendGeneratedCacesBank(incoming);
        setGeneratedQuestions(merged);
        setAiInfo(
          `IA agregó ${incoming.length} preguntas nuevas (${data?.provider || "proveedor AI"}).`
        );
        return incoming.length;
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "No se pudo generar preguntas con IA en este momento.";
        setAiError(message);
        return 0;
      } finally {
        setAiBusy(false);
      }
    },
    [activeFilterPayload, combinedQuestionBank, seenQuestionKeys]
  );

  const persistResultToHistory = useCallback(
    (result: CacesAttemptResult) => {
      const entry: CacesHistoryEntry = {
        id: `caces:${Date.now()}:${Math.floor(Math.random() * 10_000)}`,
        created_at: new Date().toISOString(),
        config: cacesConfig,
        result,
      };
      addCacesHistory(entry);
      setHistory(getCacesHistory());
      setSavedCurrentResult(true);
    },
    [cacesConfig]
  );

  const finishAttempt = useCallback(
    (finishedAtMs?: number) => {
      if (!attempt || attempt.result || finishingRef.current) return;
      finishingRef.current = true;

      const doneAt = finishedAtMs ?? Date.now();
      const result = evaluateCacesAttempt({
        attempt_id: attempt.id,
        questions: attempt.questions,
        answers: attempt.responses,
        started_at: attempt.startedAtMs,
        finished_at: doneAt,
      });

      setAttempt((prev) => {
        if (!prev) return prev;
        return { ...prev, result, immediateFeedbackQuestionId: null };
      });

      if (saveResult) {
        persistResultToHistory(result);
      }

      finishingRef.current = false;
    },
    [attempt, persistResultToHistory, saveResult]
  );

  useEffect(() => {
    if (!attempt || attempt.result || remainingSec == null) return;
    if (remainingSec <= 0) {
      finishAttempt(Date.now());
    }
  }, [attempt, remainingSec, finishAttempt]);

  const moveToNextQuestion = useCallback(() => {
    setAttempt((prev) => {
      if (!prev || prev.result) return prev;
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) return prev;
      return { ...prev, currentIndex: nextIndex, immediateFeedbackQuestionId: null };
    });
    setAnswerError(null);
  }, []);

  const handleStart = useCallback(async () => {
    setConfigError(null);
    setAnswerError(null);
    setShowErrorReview(false);
    setSavedCurrentResult(false);
    setAiError(null);

    if (!effectiveMixCategories && !selectedCategory) {
      setConfigError("Selecciona una categoría para comenzar.");
      return;
    }

    const count = plannedQuestionCount;
    let candidatePool = filteredQuestions;

    if (
      enableAIDynamicBank &&
      count > 0
    ) {
      const currentSeen = new Set(getSeenCacesQuestionKeys());
      const unseenNow = candidatePool.filter(
        (q) => !currentSeen.has(buildCacesQuestionKey(q))
      ).length;

      if (candidatePool.length < count || unseenNow < count) {
        const missing = Math.max(count - candidatePool.length, count - unseenNow);
        const batchSize = Math.min(80, Math.max(missing, count >= 20 ? 14 : 8));
        await generateMoreQuestionsWithAI(batchSize, "inicio de simulacro");

        const refreshedBank = dedupeCacesQuestions([
          ...CACES_QUESTION_BANK,
          ...getGeneratedCacesBank(),
        ]);
        candidatePool = filterCacesQuestionBank(activeFilterPayload, refreshedBank);
      }
    }

    if (candidatePool.length === 0) {
      setConfigError("No hay preguntas disponibles para este filtro.");
      return;
    }

    if (candidatePool.length < count) {
      setConfigError(
        `Este modo requiere ${count} preguntas y solo hay ${candidatePool.length} disponibles con el filtro actual.`
      );
      return;
    }

    const freshSeen = new Set(getSeenCacesQuestionKeys());
    const picked = sampleCacesQuestionsPrioritizingUnseen({
      input: candidatePool,
      size: count,
      seenQuestionKeys: freshSeen,
    });
    const selected = picked.selected;
    if (selected.length < count) {
      setConfigError(
        `No se pudo completar el intento con ${count} preguntas válidas.`
      );
      return;
    }

    markSeenCacesQuestions(selected);
    setSeenQuestionKeys(new Set(getSeenCacesQuestionKeys()));
    if (picked.seen_reused > 0) {
      setAiInfo(
        enableAIDynamicBank
          ? `Se reutilizaron ${picked.seen_reused} preguntas por disponibilidad del filtro. Puedes generar un lote IA adicional para variar más.`
          : `Se reutilizaron ${picked.seen_reused} preguntas por disponibilidad del filtro. Activa IA para reducir repeticiones.`
      );
    }

    const responses: Record<string, CacesAttemptAnswer> = {};
    selected.forEach((q) => {
      responses[q.id] = {
        question_id: q.id,
        selected: null,
        skipped: false,
        marked_for_review: false,
      };
    });

    const attemptId = `attempt:${Date.now()}:${Math.floor(Math.random() * 10_000)}`;
    const startedAt = Date.now();
    const timerPerQuestionSec = minutesPerQuestion * 60;

    setAttempt({
      id: attemptId,
      startedAtMs: startedAt,
      endsAtMs: timerEnabled ? startedAt + count * timerPerQuestionSec * 1000 : null,
      questions: selected,
      responses,
      currentIndex: 0,
      immediateFeedbackQuestionId: null,
      result: null,
    });
  }, [
    effectiveMixCategories,
    selectedCategory,
    filteredQuestions,
    plannedQuestionCount,
    minutesPerQuestion,
    timerEnabled,
    enableAIDynamicBank,
    generateMoreQuestionsWithAI,
    activeFilterPayload,
  ]);

  const handleGeneratePack = useCallback(async () => {
    const batch = mode === "simulacro_maximo" ? 50 : Math.max(20, Math.min(60, plannedQuestionCount));
    await generateMoreQuestionsWithAI(batch, "ampliar banco manual");
  }, [generateMoreQuestionsWithAI, mode, plannedQuestionCount]);

  const handleToggleMark = useCallback(() => {
    if (!attempt || !currentQuestion || attempt.result) return;
    setAttempt((prev) => {
      if (!prev) return prev;
      const current = prev.responses[currentQuestion.id];
      if (!current) return prev;

      return {
        ...prev,
        responses: {
          ...prev.responses,
          [currentQuestion.id]: {
            ...current,
            marked_for_review: !current.marked_for_review,
          },
        },
      };
    });
  }, [attempt, currentQuestion]);

  const handleSkip = useCallback(() => {
    if (!attempt || !currentQuestion || attempt.result) return;

    setAttempt((prev) => {
      if (!prev) return prev;

      const nextResponses = {
        ...prev.responses,
        [currentQuestion.id]: {
          ...prev.responses[currentQuestion.id],
          selected: null,
          skipped: true,
        },
      };

      const isLast = prev.currentIndex >= prev.questions.length - 1;
      if (isLast) {
        return {
          ...prev,
          responses: nextResponses,
          immediateFeedbackQuestionId: null,
        };
      }

      return {
        ...prev,
        responses: nextResponses,
        currentIndex: prev.currentIndex + 1,
        immediateFeedbackQuestionId: null,
      };
    });

    setSelectedOption(null);
    setAnswerError(null);
  }, [attempt, currentQuestion]);

  useEffect(() => {
    if (!attempt || attempt.result) return;
    const isLast = attempt.currentIndex >= attempt.questions.length - 1;
    if (!isLast) return;

    const q = attempt.questions[attempt.currentIndex];
    const a = attempt.responses[q.id];
    if (a && (a.selected !== null || a.skipped) && !attempt.immediateFeedbackQuestionId) {
      finishAttempt(Date.now());
    }
  }, [attempt, finishAttempt]);

  const handleAnswer = useCallback(() => {
    if (!attempt || !currentQuestion || attempt.result) return;
    if (!selectedOption) {
      setAnswerError("Selecciona una opción antes de responder.");
      return;
    }

    setAnswerError(null);

    setAttempt((prev) => {
      if (!prev) return prev;
      const nextResponses = {
        ...prev.responses,
        [currentQuestion.id]: {
          ...prev.responses[currentQuestion.id],
          selected: selectedOption,
          skipped: false,
        },
      };

      const isLast = prev.currentIndex >= prev.questions.length - 1;

      if (feedbackMode === "inmediata") {
        return {
          ...prev,
          responses: nextResponses,
          immediateFeedbackQuestionId: currentQuestion.id,
        };
      }

      if (isLast) {
        return {
          ...prev,
          responses: nextResponses,
          immediateFeedbackQuestionId: null,
        };
      }

      return {
        ...prev,
        responses: nextResponses,
        currentIndex: prev.currentIndex + 1,
        immediateFeedbackQuestionId: null,
      };
    });
  }, [attempt, currentQuestion, selectedOption, feedbackMode]);

  const immediateFeedback = useMemo(() => {
    if (!attempt || !currentQuestion || !attempt.immediateFeedbackQuestionId) return null;
    if (attempt.immediateFeedbackQuestionId !== currentQuestion.id) return null;

    const answer = attempt.responses[currentQuestion.id];
    const selected = answer?.selected ?? null;
    const isCorrect = selected !== null && selected === currentQuestion.correctAnswer;

    return {
      selected,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
    };
  }, [attempt, currentQuestion]);

  const handleSaveCurrentResult = useCallback(() => {
    if (!attempt?.result || savedCurrentResult) return;
    persistResultToHistory(attempt.result);
  }, [attempt, savedCurrentResult, persistResultToHistory]);

  const retryWithCurrentConfig = useCallback(() => {
    setAttempt(null);
    setSelectedOption(null);
    setConfigError(null);
    setAnswerError(null);
    setShowErrorReview(false);
    setSavedCurrentResult(false);
    window.setTimeout(() => {
      handleStart();
    }, 40);
  }, [handleStart]);

  const resultQuestionMap = useMemo(() => {
    if (!attempt) return new Map<string, CacesQuestion>();
    return new Map(attempt.questions.map((q) => [q.id, q]));
  }, [attempt]);

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl">
          <header className="border-b border-white/10 bg-white/5 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-white">Preguntas CACES</h1>
                <p className="mt-1 text-sm text-white/65">Práctica académica con preguntas tipo examen</p>
                <p className="mt-1 text-xs text-white/50">
                  Preguntas originales inspiradas en estructura temática académica. Uso educativo. No corresponde a reactivos oficiales.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/simulator" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
                  Volver al simulador
                </Link>
              </div>
            </div>
          </header>

          <div className="overflow-y-auto px-5 py-6">
            {loadingBank ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">Cargando banco de preguntas...</div>
            ) : (
              <>
                {!attempt || attempt.result ? (
                  <>
                    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0F1117] to-[#1E2433] p-5">
                      <div className="text-sm font-semibold text-white">Categorías rápidas</div>
                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {CACES_CATEGORIES.map((cat) => {
                          const active = !effectiveMixCategories && selectedCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedCategory(cat)}
                              disabled={isWideMixedMode}
                              className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                                active
                                  ? "border-white/25 bg-white/10 text-white"
                                  : "border-white/10 bg-black/25 text-white/75 hover:bg-black/35"
                              } ${isWideMixedMode ? "cursor-not-allowed opacity-55" : ""}`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                      {isWideMixedMode && (
                        <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
                          El modo de examen amplio usa automáticamente mezcla total de categorías.
                        </div>
                      )}
                    </section>

                    <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="text-sm font-semibold text-white">Configuración previa del intento</div>

                      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div>
                          <label className="text-xs text-white/60">Componente</label>
                          <select
                            value={selectedComponent}
                            onChange={(e) => setSelectedComponent(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="">Todos</option>
                            {componentOptions.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-white/60">Subcomponente</label>
                          <select
                            value={selectedSubcomponent}
                            onChange={(e) => setSelectedSubcomponent(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="">Todos</option>
                            {subcomponentOptions.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-white/60">Tema</label>
                          <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="">Todos</option>
                            {topicOptions.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
                        <div>
                          <label className="text-xs text-white/60">Dificultad</label>
                          <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value as CacesDifficulty | "all")}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="all">Todas</option>
                            <option value="basica">Básica</option>
                            <option value="intermedia">Intermedia</option>
                            <option value="alta">Alta</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-white/60">Modo</label>
                          <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as CacesPracticeMode)}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="practica_individual">Práctica individual</option>
                            <option value="quiz_5">Quiz de 5</option>
                            <option value="simulacro_10">Simulacro de 10</option>
                            <option value="simulacro_20">Simulacro de 20</option>
                            <option value="simulacro_30">Simulacro de 30</option>
                            <option value="simulacro_40">Simulacro de 40</option>
                            <option value="simulacro_50_mixto">Examen amplio (50 mixtas)</option>
                            <option value="simulacro_maximo">Simulacro amplio de 80</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-white/60">Tipo de pregunta</label>
                          <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as CacesQuestionType | "all")}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                          >
                            <option value="all">Directa + caso clínico</option>
                            <option value="directa">Directa académica</option>
                            <option value="caso_clinico">Mini caso clínico</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-white/60">Preguntas definidas por modo</label>
                          <div className="mt-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90">
                            {plannedQuestionCount} ({getModeLabel(mode)})
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Opciones del intento</div>
                          <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                            <label className="flex items-center gap-2 text-white/80">
                              <input
                                type="radio"
                                name="feedback"
                                checked={feedbackMode === "inmediata"}
                                onChange={() => setFeedbackMode("inmediata")}
                              />
                              Retroalimentación inmediata
                            </label>
                            <label className="flex items-center gap-2 text-white/80">
                              <input
                                type="radio"
                                name="feedback"
                                checked={feedbackMode === "final"}
                                onChange={() => setFeedbackMode("final")}
                              />
                              Retroalimentación al final
                            </label>
                            <label className="flex items-center gap-2 text-white/80">
                              <input
                                type="checkbox"
                                checked={timerEnabled}
                                onChange={(e) => setTimerEnabled(e.target.checked)}
                              />
                              Temporizador activado
                            </label>
                            <label className="text-white/80">
                              <span className="mb-1 block text-xs text-white/60">Tiempo por pregunta (recomendado: 2 min)</span>
                              <select
                                value={minutesPerQuestion}
                                onChange={(e) => setMinutesPerQuestion(Number(e.target.value) === 1 ? 1 : 2)}
                                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none"
                              >
                                <option value={1}>1 minuto por pregunta (rápido)</option>
                                <option value={2}>2 minutos por pregunta (más realista)</option>
                              </select>
                            </label>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Alcance de preguntas</div>
                          <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                            <label className="flex items-center gap-2 text-white/80">
                              <input
                                type="checkbox"
                                checked={effectiveMixCategories}
                                disabled={isWideMixedMode}
                                onChange={(e) => setMixCategories(e.target.checked)}
                              />
                              Mezclar categorías {isWideMixedMode ? "(obligatorio en examen amplio)" : ""}
                            </label>
                            <label className="flex items-center gap-2 text-white/80">
                              <input
                                type="checkbox"
                                checked={saveResult}
                                onChange={(e) => setSaveResult(e.target.checked)}
                              />
                              Guardar resultado en historial
                            </label>
                            <label className="flex items-center gap-2 text-white/80">
                              <input
                                type="checkbox"
                                checked={enableAIDynamicBank}
                                onChange={(e) => setEnableAIDynamicBank(e.target.checked)}
                              />
                              IA bajo demanda para ampliar banco
                            </label>
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">
                              Banco total CACES: <span className="font-semibold text-white">{CACES_QUESTION_BANK.length}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">
                              Banco IA acumulado: <span className="font-semibold text-white">{generatedQuestions.length}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">
                              Banco disponible para este filtro: <span className="font-semibold text-white">{filteredQuestions.length}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">
                              Preguntas no vistas para este filtro: <span className="font-semibold text-white">{unseenFilteredCount}</span>
                            </div>
                            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
                              {timerEnabled
                                ? `Tiempo límite antes de iniciar: ${estimatedTimeMinutes} min (${plannedQuestionCount} preguntas x ${minutesPerQuestion} min).`
                                : `Tiempo estimado sugerido: ${estimatedTimeMinutes} min (${plannedQuestionCount} preguntas x ${minutesPerQuestion} min).`}
                            </div>
                            {filteredQuestions.length < plannedQuestionCount && (
                              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                                {enableAIDynamicBank
                                  ? `Faltan preguntas locales (${plannedQuestionCount} requeridas, ${filteredQuestions.length} disponibles). Al iniciar se intentará completar automáticamente con IA.`
                                  : `Faltan preguntas para este modo: se requieren ${plannedQuestionCount} y hay ${filteredQuestions.length}.`}
                              </div>
                            )}
                            {aiInfo && (
                              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                                {aiInfo}
                              </div>
                            )}
                            {aiError && (
                              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-100">
                                {aiError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {!effectiveMixCategories && !selectedCategory && (
                        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                          Selecciona una categoría para comenzar.
                        </div>
                      )}

                      {filteredQuestions.length === 0 && (effectiveMixCategories || selectedCategory) && (
                        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
                          No hay preguntas disponibles para este filtro.
                        </div>
                      )}

                      {configError && (
                        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                          {configError}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleStart}
                          disabled={aiBusy}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {aiBusy
                            ? "Preparando banco..."
                            : mode === "practica_individual"
                              ? "Iniciar práctica"
                              : mode === "simulacro_50_mixto" || mode === "simulacro_maximo"
                                ? "Iniciar examen amplio"
                                : "Iniciar simulacro"}
                        </button>
                        <button
                          type="button"
                          onClick={handleGeneratePack}
                          disabled={aiBusy || !enableAIDynamicBank}
                          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {aiBusy ? "Generando..." : "Generar lote IA"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("");
                            setSelectedComponent("");
                            setSelectedSubcomponent("");
                            setSelectedTopic("");
                            setSelectedDifficulty("all");
                            setSelectedType("all");
                            setMode("quiz_5");
                            setFeedbackMode("inmediata");
                            setTimerEnabled(true);
                            setMinutesPerQuestion(2);
                            setMixCategories(false);
                            setSaveResult(true);
                            setEnableAIDynamicBank(true);
                            setConfigError(null);
                            setAiError(null);
                            setAiInfo(null);
                          }}
                          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </section>

                    {attempt?.result && (
                      <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="text-lg font-semibold text-white">Resultado final</div>
                        <div className="mt-1 text-sm text-white/60">Resumen de rendimiento del intento actual</div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/55">Puntaje total</div>
                            <div className="mt-1 text-2xl font-semibold text-white">
                              {attempt.result.total_score}/{attempt.result.total_questions}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/55">Porcentaje</div>
                            <div className="mt-1 text-2xl font-semibold text-white">{attempt.result.accuracy}%</div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/55">Correctas / Incorrectas</div>
                            <div className="mt-1 text-2xl font-semibold text-white">
                              {attempt.result.correct_answers} / {attempt.result.incorrect_answers}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs text-white/55">Tiempo total</div>
                            <div className="mt-1 text-2xl font-semibold text-white">{formatTimer(attempt.result.elapsed_seconds)}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="text-sm font-semibold text-white">Desempeño por categoría</div>
                            <div className="mt-2 space-y-2 text-sm">
                              {attempt.result.by_category.map((row) => (
                                <div key={row.category} className="rounded-xl border border-white/10 bg-black/20 p-2">
                                  <div className="font-medium text-white">{row.category}</div>
                                  <div className="mt-1 text-white/70">
                                    {row.correct}/{row.total} correctas · {row.accuracy}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="text-sm font-semibold text-white">Temas débiles</div>
                            {attempt.result.weak_topics.length === 0 ? (
                              <div className="mt-2 text-sm text-white/65">Sin temas débiles predominantes en este intento.</div>
                            ) : (
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                                {attempt.result.weak_topics.map((topic) => (
                                  <li key={topic}>{topic}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={retryWithCurrentConfig}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                          >
                            Repetir
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowErrorReview((v) => !v)}
                            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                          >
                            Revisar errores
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveCurrentResult}
                            disabled={savedCurrentResult}
                            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
                          >
                            {savedCurrentResult ? "Guardado en historial" : "Guardar en historial"}
                          </button>
                        </div>

                        {showErrorReview && (
                          <div className="mt-4 space-y-3">
                            {attempt.result.review.filter((r) => !r.is_correct).length === 0 ? (
                              <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                                No hubo errores en este intento.
                              </div>
                            ) : (
                              attempt.result.review
                                .filter((r) => !r.is_correct)
                                .map((r) => {
                                  const q = resultQuestionMap.get(r.question_id);
                                  if (!q) return null;
                                  return (
                                    <div key={r.question_id} className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm">
                                      <div className="text-xs text-white/55">{q.category} · {q.topic}</div>
                                      <div className="mt-1 font-medium text-white">{q.question}</div>
                                      <div className="mt-2 text-white/75">Tu respuesta: {r.selected ?? "Sin respuesta"} · Correcta: {r.correct}</div>
                                      <div className="mt-2 text-white/70">{q.explanation}</div>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        )}
                      </section>
                    )}

                    <section className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-white">Intentos recientes</div>
                          <div className="mt-1 text-sm text-white/60">Historial local de prácticas y simulacros</div>
                        </div>
                      </div>

                      {history.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/65">
                          Aún no has realizado simulacros.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {history.slice(0, 6).map((item) => (
                            <div key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="font-semibold text-white">
                                  {getModeLabel(item.config.mode)} · {item.result.correct_answers}/{item.result.total_questions}
                                </div>
                                <div className="text-xs text-white/55">{new Date(item.created_at).toLocaleString()}</div>
                              </div>
                              <div className="mt-1 text-white/70">
                                {item.result.accuracy}% · Tiempo {formatTimer(item.result.elapsed_seconds)} ·
                                {item.config.timer_enabled
                                  ? ` Límite ${item.config.estimated_time_minutes ?? item.config.number_of_questions * (item.config.minutes_per_question ?? 2)} min ·`
                                  : " Sin límite ·"}
                                {item.config.category ? ` ${item.config.category}` : " Categorías mixtas"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                ) : (
                  <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-white/60">Pregunta {attempt.currentIndex + 1} de {attempt.questions.length}</div>
                        <div className="mt-1 text-xs text-white/50">
                          {currentQuestion?.category} · {currentQuestion?.topic}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/75">
                          Dificultad: {currentQuestion?.difficulty}
                        </span>
                        <span className={`rounded-full border px-3 py-1 ${getPriorityClass(currentQuestion?.difficulty === "alta" ? "Alta" : currentQuestion?.difficulty === "intermedia" ? "Media" : "Baja")}`}>
                          {currentQuestion?.type === "caso_clinico" ? "Caso clínico" : "Directa"}
                        </span>
                        {currentQuestion?.manualProfile?.cognitiveLevel && (
                          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/75">
                            Nivel cognitivo: {currentQuestion.manualProfile.cognitiveLevel}
                          </span>
                        )}
                        {currentQuestion?.manualProfile?.complexityLevel && (
                          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/75">
                            Complejidad: {currentQuestion.manualProfile.complexityLevel}
                          </span>
                        )}
                        {remainingSec != null && (
                          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-100">
                            Tiempo: {formatTimer(remainingSec)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-white/70" style={{ width: `${progressPct}%` }} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="text-sm font-medium text-white">{currentQuestion?.question}</div>

                      <div className="mt-3 space-y-2">
                        {currentQuestion?.options.map((opt) => {
                          const isSelected = selectedOption === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedOption(opt.id)}
                              className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                                isSelected
                                  ? "border-white/30 bg-white/10 text-white"
                                  : "border-white/10 bg-black/30 text-white/75 hover:bg-black/40"
                              }`}
                            >
                              <span className="font-semibold">{opt.id}.</span> {opt.text}
                            </button>
                          );
                        })}
                      </div>

                      {answerError && (
                        <div className="mt-3 rounded-xl border border-red-400/25 bg-red-400/10 p-2 text-sm text-red-100">
                          {answerError}
                        </div>
                      )}

                      {feedbackMode === "inmediata" && immediateFeedback && (
                        <div
                          className={`mt-3 rounded-2xl border p-3 text-sm ${
                            immediateFeedback.isCorrect
                              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                              : "border-amber-400/25 bg-amber-400/10 text-amber-100"
                          }`}
                        >
                          <div className="font-semibold">
                            {immediateFeedback.isCorrect ? "Respuesta correcta" : "Respuesta incorrecta"}
                          </div>
                          <div className="mt-1 text-white/85">{currentQuestion?.explanation}</div>
                          <div className="mt-2 space-y-1 text-xs text-white/80">
                            {currentQuestion?.options.map((opt) => (
                              <div key={`feedback-${opt.id}`}>
                                <span className="font-semibold">{opt.id}:</span> {opt.rationale}
                              </div>
                            ))}
                          </div>
                          {!!currentQuestion?.references?.length && (
                            <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-2 text-xs text-white/70">
                              <div className="font-semibold text-white/80">Referencia base</div>
                              <div className="mt-1">
                                {currentQuestion.references[0]}
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const isLast = attempt.currentIndex >= attempt.questions.length - 1;
                              if (isLast) {
                                finishAttempt(Date.now());
                              } else {
                                moveToNextQuestion();
                              }
                            }}
                            className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black"
                          >
                            Siguiente pregunta
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
                        {feedbackMode === "inmediata" ? (
                          <>
                            <span>Aciertos: {immediateCorrectCount}</span>
                            <span>·</span>
                            <span>Errores: {immediateIncorrectCount}</span>
                          </>
                        ) : (
                          <>
                            <span>Respondidas: {answeredCount}</span>
                            <span>·</span>
                            <span>Pendientes: {attempt.questions.length - answeredCount}</span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSkip}
                          disabled={Boolean(attempt.immediateFeedbackQuestionId)}
                          className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
                        >
                          Saltar
                        </button>
                        <button
                          type="button"
                          onClick={handleToggleMark}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            currentResponse?.marked_for_review
                              ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
                              : "border-white/15 text-white/80 hover:bg-white/5"
                          }`}
                        >
                          {currentResponse?.marked_for_review ? "Marcada para revisar" : "Marcar para revisar"}
                        </button>
                        <button
                          type="button"
                          onClick={handleAnswer}
                          disabled={Boolean(attempt.immediateFeedbackQuestionId)}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                        >
                          Responder
                        </button>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
