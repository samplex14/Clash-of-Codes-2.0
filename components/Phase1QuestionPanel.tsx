"use client";

import React, { useMemo, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import { apiRequest } from "@/lib/api";

export interface Phase1QuestionItem {
  questionId: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

interface ConfirmResponse {
  confirmedAnswers: Record<string, string>;
}

interface SubmitResponse {
  success: boolean;
  score: number;
  total: number;
}

interface Phase1QuestionPanelProps {
  usn: string;
  questions: Phase1QuestionItem[];
  onSubmitted: (score: number) => void;
}

const Phase1QuestionPanel: React.FC<Phase1QuestionPanelProps> = ({ usn, questions, onSubmitted }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmedAnswers, setConfirmedAnswers] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const currentQuestionId = currentQuestion?.questionId ?? null;
  const currentAnswer = currentQuestionId ? answers[currentQuestionId] : undefined;
  const isCurrentConfirmed = currentQuestionId ? Boolean(confirmedAnswers[currentQuestionId]) : false;
  const hasSelectedOption = currentAnswer !== undefined;

  const allPriorConfirmed = useMemo<boolean>(() => {
    if (questions.length <= 1) {
      return true;
    }

    return questions.slice(0, -1).every((question) => Boolean(confirmedAnswers[question.questionId]));
  }, [confirmedAnswers, questions]);

  const handleSelectOption = (optionId: string): void => {
    if (!currentQuestionId || isCurrentConfirmed) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestionId]: optionId
    }));

    setSubmitError(null);
  };

  const handleLockAnswer = async (): Promise<void> => {
    if (!currentQuestionId || !currentAnswer || isConfirming) {
      return;
    }

    setIsConfirming(true);
    setSubmitError(null);

    try {
      const response = await apiRequest<ConfirmResponse>("/api/phase1/confirm", {
        method: "POST",
        json: {
          usn,
          questionId: currentQuestionId,
          selectedOptionId: currentAnswer
        }
      });

      setConfirmedAnswers(response.confirmedAnswers);
    } catch (requestError: unknown) {
      setSubmitError(requestError instanceof Error ? requestError.message : "Failed to lock answer.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSubmitToBattle = async (): Promise<void> => {
    if (!currentQuestionId || !currentAnswer || isSubmitting) {
      return;
    }

    if (!allPriorConfirmed) {
      setSubmitError("All previous answers must be locked before the final strike.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiRequest<SubmitResponse>("/api/phase1/submit", {
        method: "POST",
        json: {
          usn,
          lastQuestionId: currentQuestionId,
          lastSelectedOptionId: currentAnswer
        }
      });

      if (!response.success) {
        setSubmitError("Submission failed. Try again.");
        return;
      }

      onSubmitted(response.score);
    } catch (requestError: unknown) {
      setSubmitError(requestError instanceof Error ? requestError.message : "Failed to submit answers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-16">
      <div className="rounded-xl border-2 border-[#7c5535] bg-[#3f2617]/90 p-4 mb-5 flex items-center justify-between">
        <p className="text-[#f6d67c] uppercase tracking-widest text-sm font-bold">Rapid Fire Battle</p>
        <p className="text-[#e9d5ac] text-sm">
          {Object.keys(confirmedAnswers).length} / {questions.length} Answers Locked
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center my-6">
        {questions.map((question, index) => {
          const hasAnswer = answers[question.questionId] !== undefined;
          const isConfirmed = Boolean(confirmedAnswers[question.questionId]);
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
        disabled={isCurrentConfirmed}
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
            disabled={isSubmitting || !hasSelectedOption || !allPriorConfirmed}
            className={`btn-clash px-8 py-3 text-lg ${
              isSubmitting || !hasSelectedOption || !allPriorConfirmed ? "opacity-50 cursor-not-allowed" : "bg-clash-green"
            }`}
          >
            Send to Battle
          </button>
        ) : (
          <>
            {!isCurrentConfirmed ? (
              <button
                type="button"
                onClick={() => {
                  void handleLockAnswer();
                }}
                disabled={!hasSelectedOption || isConfirming}
                className={`btn-clash px-6 py-3 ${!hasSelectedOption || isConfirming ? "opacity-50 cursor-not-allowed" : "bg-clash-elixir"}`}
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
