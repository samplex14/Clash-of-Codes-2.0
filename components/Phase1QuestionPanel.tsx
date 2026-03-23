"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import { apiRequest } from "@/lib/api";
import type { Phase1SubmitResponse, SubmitPayload } from "@/types";

export interface Phase1QuestionItem {
  questionId: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

interface Phase1QuestionPanelProps {
  usn: string;
  questions: Phase1QuestionItem[];
  timeLimitSeconds: number;
  deadlineMs: number;
  onSubmitted: (score: number) => void;
}

const Phase1QuestionPanel: React.FC<Phase1QuestionPanelProps> = ({ usn, questions, timeLimitSeconds, deadlineMs, onSubmitted }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<string>>(new Set<string>());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState<boolean>(false);
  const autoSubmitTriggeredRef = useRef<boolean>(false);

  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const currentQuestionId = currentQuestion?.questionId ?? null;
  const currentAnswer = currentQuestionId ? answers[currentQuestionId] : undefined;
  const isCurrentConfirmed = currentQuestionId ? confirmedQuestions.has(currentQuestionId) : false;
  const hasSelectedOption = currentAnswer !== undefined;
  const answersStorageKey = useMemo(() => `phase1_answers_${usn}`, [usn]);
  const confirmedStorageKey = useMemo(() => `phase1_confirmed_${usn}`, [usn]);
  const resolvedTimeLimitSeconds = useMemo<number>(() => {
    if (!Number.isFinite(timeLimitSeconds) || timeLimitSeconds <= 0) {
      return 60 * 60;
    }

    return Math.floor(timeLimitSeconds);
  }, [timeLimitSeconds]);
  const fallbackDeadlineMs = useMemo<number>(() => Date.now() + resolvedTimeLimitSeconds * 1000, [resolvedTimeLimitSeconds]);
  const resolvedDeadlineMs = Number.isFinite(deadlineMs) && deadlineMs > 0 ? deadlineMs : fallbackDeadlineMs;
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(0, Math.floor((resolvedDeadlineMs - Date.now()) / 1000))
  );
  const isTimeUp = secondsLeft <= 0;

  useEffect(() => {
    const updateSeconds = (): void => {
      setSecondsLeft(Math.max(0, Math.floor((resolvedDeadlineMs - Date.now()) / 1000)));
    };

    updateSeconds();

    const timerId = window.setInterval(() => {
      updateSeconds();
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [resolvedDeadlineMs]);

  useEffect(() => {
    const savedAnswers = window.localStorage.getItem(answersStorageKey);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers) as Record<string, string>;
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed);
        }
      } catch {
        // Ignore invalid persisted state.
      }
    }

    const savedConfirmed = window.localStorage.getItem(confirmedStorageKey);
    if (savedConfirmed) {
      try {
        const parsed = JSON.parse(savedConfirmed) as string[];
        if (Array.isArray(parsed)) {
          setConfirmedQuestions(new Set<string>(parsed.map((value) => String(value))));
        }
      } catch {
        // Ignore invalid persisted state.
      }
    }
  }, [answersStorageKey, confirmedStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(answersStorageKey, JSON.stringify(answers));
  }, [answers, answersStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(confirmedStorageKey, JSON.stringify(Array.from(confirmedQuestions)));
  }, [confirmedQuestions, confirmedStorageKey]);

  const allPriorConfirmed = useMemo<boolean>(() => {
    if (questions.length <= 1) {
      return true;
    }

    return questions.slice(0, -1).every((question) => confirmedQuestions.has(question.questionId));
  }, [confirmedQuestions, questions]);

  const handleSelectOption = (optionId: string): void => {
    if (!currentQuestionId || isCurrentConfirmed || isTimeUp) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestionId]: optionId
    }));

    setSubmitError(null);
  };

  const handleLockAnswer = (): void => {
    if (!currentQuestionId || !currentAnswer || isTimeUp) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestionId]: currentAnswer
    }));

    setConfirmedQuestions((previous) => {
      const next = new Set(previous);
      next.add(currentQuestionId);
      return next;
    });

    setSubmitError(null);
  };

  const handleSubmitToBattle = async (): Promise<void> => {
    if (!currentQuestionId || !currentAnswer || isSubmitting) {
      return;
    }

    if (!allPriorConfirmed) {
      setSubmitError("All previous answers must be locked before the final strike.");
      return;
    }

    const finalAnswers: Record<string, string> = {
      ...answers,
      [currentQuestionId]: currentAnswer
    };

    const missingQuestion = questions.find((question) => !finalAnswers[question.questionId]);
    if (missingQuestion) {
      setSubmitError("All questions must have selected answers before submission.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: SubmitPayload = {
        usn,
        answers: finalAnswers
      };

      const response = await apiRequest<Phase1SubmitResponse>("/api/phase1/submit", {
        method: "POST",
        json: payload
      });

      if (!response.success) {
        setSubmitError("Submission failed. Try again.");
        return;
      }

      window.localStorage.removeItem(answersStorageKey);
      window.localStorage.removeItem(confirmedStorageKey);

      onSubmitted(response.score);
    } catch (requestError: unknown) {
      setSubmitError(requestError instanceof Error ? requestError.message : "Failed to submit answers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isTimeUp || isSubmitting || hasAutoSubmitted || autoSubmitTriggeredRef.current) {
      return;
    }

    autoSubmitTriggeredRef.current = true;

    const submitLockedAnswers = async (): Promise<void> => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const lockedAnswers: Record<string, string> = {};
        confirmedQuestions.forEach((questionId) => {
          const selectedOption = answers[questionId];
          if (typeof selectedOption === "string") {
            lockedAnswers[questionId] = selectedOption;
          }
        });

        const payload: SubmitPayload = {
          usn,
          answers: lockedAnswers,
          autoSubmitted: true
        };

        const response = await apiRequest<Phase1SubmitResponse>("/api/phase1/submit", {
          method: "POST",
          json: payload
        });

        if (!response.success) {
          setSubmitError("Auto submission failed. Please contact an organizer.");
          autoSubmitTriggeredRef.current = false;
          return;
        }

        window.localStorage.removeItem(answersStorageKey);
        window.localStorage.removeItem(confirmedStorageKey);

        setHasAutoSubmitted(true);
        onSubmitted(response.score);
      } catch (requestError: unknown) {
        setSubmitError(requestError instanceof Error ? requestError.message : "Auto submission failed.");
        autoSubmitTriggeredRef.current = false;
      } finally {
        setIsSubmitting(false);
      }
    };

    void submitLockedAnswers();
  }, [
    answers,
    answersStorageKey,
    confirmedQuestions,
    confirmedStorageKey,
    hasAutoSubmitted,
    isSubmitting,
    isTimeUp,
    onSubmitted,
    usn
  ]);

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-16">
      <div className="rounded-xl border-2 border-[#7c5535] bg-[#3f2617]/90 p-4 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[#f6d67c] uppercase tracking-widest text-sm font-bold">Rapid Fire Battle</p>
          <p className="text-[#e9d5ac] text-sm">
            {confirmedQuestions.size} / {questions.length} Answers Locked
          </p>
          {isTimeUp ? <p className="text-[#ff9a9a] text-xs font-semibold mt-1">Time up. Auto-submitting locked answers...</p> : null}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-[#f6d67c] uppercase tracking-widest text-xs font-bold">Time Left</p>
          <Timer secondsLeft={secondsLeft} maxSeconds={resolvedTimeLimitSeconds} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center my-6">
        {questions.map((question, index) => {
          const hasAnswer = answers[question.questionId] !== undefined;
          const isConfirmed = confirmedQuestions.has(question.questionId);
          const isCurrent = index === currentIndex;

          return (
            <button
              type="button"
              key={question.questionId}
              onClick={() => setCurrentIndex(index)}
              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
                isCurrent
                  ? "bg-clash-gold text-clash-dark border-yellow-600 scale-110 shadow-lg"
                  : isConfirmed
                    ? "bg-clash-green/80 text-white border-green-700"
                    : hasAnswer
                      ? "bg-clash-elixir/60 text-white border-purple-700"
                      : "bg-clash-wood/50 text-gray-300 border-clash-wood hover:bg-clash-wood/80"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <QuestionCard
        question={currentQuestion}
        index={currentIndex}
        selectedOption={currentAnswer}
        onSelectOption={handleSelectOption}
        disabled={isCurrentConfirmed || isTimeUp}
        isLocked={isCurrentConfirmed}
      />

      {submitError ? (
        <div className="mt-4 bg-clash-red/20 border-2 border-clash-red text-white p-3 rounded text-center shadow-inner">
          {submitError}
        </div>
      ) : null}

      <div className="flex gap-4 mt-6 justify-center flex-wrap">
        {!isFirstQuestion ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((value) => value - 1)}
            className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-6 py-3 rounded-lg shadow-sm hover:bg-clash-wood transition-colors"
          >
            Scout Previous
          </button>
        ) : null}

        {isLastQuestion ? (
          <button
            type="button"
            onClick={() => {
              void handleSubmitToBattle();
            }}
            disabled={isSubmitting || isTimeUp || !hasSelectedOption || !allPriorConfirmed}
            className={`btn-clash px-8 py-3 text-lg ${
              isSubmitting || isTimeUp || !hasSelectedOption || !allPriorConfirmed ? "opacity-50 cursor-not-allowed" : "bg-clash-green"
            }`}
          >
            Send to Battle
          </button>
        ) : (
          <>
            {!isCurrentConfirmed ? (
              <button
                type="button"
                onClick={handleLockAnswer}
                disabled={isTimeUp || !hasSelectedOption}
                className={`btn-clash px-6 py-3 ${isTimeUp || !hasSelectedOption ? "opacity-50 cursor-not-allowed" : "bg-clash-elixir"}`}
              >
                Lock Answer
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.min(value + 1, questions.length - 1))}
              className="btn-clash px-6 py-3"
            >
              Next Raid
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Phase1QuestionPanel;
