"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import LoadingCard from "@/components/LoadingCard";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { useSocket } from "@/hooks/useSocket";
import { useTimer } from "@/hooks/useTimer";
import type { Phase1QuestionsEvent } from "@/types/socket";

type Phase1Status = "loading" | "waiting" | "active" | "submitted" | "error";

const MAX_PHASE1_TIME = 900;

const Phase1Client: React.FC = () => {
  const { participant, updateParticipant } = useParticipant();
  const router = useRouter();
  const { socket, isConnected } = useSocket("/phase1");

  const [status, setStatus] = useState<Phase1Status>("loading");
  const [questions, setQuestions] = useState<Phase1QuestionsEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmedSet, setConfirmedSet] = useState<Set<string>>(new Set<string>());
  const [score, setScore] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const joinedRef = useRef<boolean>(false);

  const handleTimerExpiry = useCallback(() => {
    if (!socket || questions.length === 0) {
      return;
    }

    const last = questions[questions.length - 1];
    if (answers[last.questionId] === undefined) {
      return;
    }

    socket.emit("phase1:submit", {
      questionId: last.questionId,
      selectedOptionId: answers[last.questionId]
    });
  }, [answers, questions, socket]);

  const { secondsLeft, startTimer, stopTimer } = useTimer(MAX_PHASE1_TIME, handleTimerExpiry);

  useEffect(() => {
    if (!socket || !isConnected || !participant?.usn || joinedRef.current) {
      return;
    }

    joinedRef.current = true;
    setIsLoading(true);

    socket.emit("phase1:rejoin", { usn: participant.usn }, (response) => {
      setIsLoading(false);
      if (response?.ok) {
        return;
      }

      if (response?.status === "not_started") {
        setStatus("waiting");
        return;
      }

      if (response?.status === "unauthorized") {
        setStatus("error");
        setError("You are not authorized for this Phase 1 round.");
        return;
      }

      setStatus("error");
      setError(response?.error ?? "Failed to join Phase 1");
    });
  }, [isConnected, participant?.usn, socket]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleQuestions = (payload: Phase1QuestionsEvent[]): void => {
      setQuestions(payload);
      setCurrentIndex(0);
      setAnswers({});
      setConfirmedSet(new Set<string>());
      setScore(null);
      setSubmitError(null);
      setStatus("active");
      setIsLoading(false);
      startTimer();
    };

    const handleStarted = (): void => {
      if (!participant?.usn) {
        return;
      }

      setIsLoading(true);
      socket.emit("phase1:rejoin", { usn: participant.usn });
    };

    const handleNotStarted = (): void => {
      setStatus("waiting");
      setIsLoading(false);
    };

    const handleUnauthorized = (): void => {
      setStatus("error");
      setError("You are not authorized for this Phase 1 round.");
      setIsLoading(false);
    };

    socket.on("phase1:questions", handleQuestions);
    socket.on("phase1:started", handleStarted);
    socket.on("phase1:not_started", handleNotStarted);
    socket.on("phase1:unauthorized", handleUnauthorized);

    return () => {
      socket.off("phase1:questions", handleQuestions);
      socket.off("phase1:started", handleStarted);
      socket.off("phase1:not_started", handleNotStarted);
      socket.off("phase1:unauthorized", handleUnauthorized);
    };
  }, [participant?.usn, socket, startTimer]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleConfirmed = ({ questionId }: { questionId: string }): void => {
      setConfirmedSet((previous: Set<string>) => {
        const next = new Set(previous);
        next.add(questionId);
        return next;
      });
    };

    socket.on("phase1:answer_confirmed", handleConfirmed);
    return () => {
      socket.off("phase1:answer_confirmed", handleConfirmed);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleResult = ({ score: nextScore, total: nextTotal }: { score: number; total: number }): void => {
      stopTimer();
      setScore(nextScore);
      setTotal(nextTotal);
      setStatus("submitted");
      updateParticipant({
        phase1Score: nextScore
      });
    };

    socket.on("phase1:result", handleResult);
    return () => {
      socket.off("phase1:result", handleResult);
    };
  }, [socket, stopTimer, updateParticipant]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleSubmitError = ({ message, missingQuestions }: { message: string; missingQuestions: string[] }): void => {
      setSubmitError(`${message}. ${missingQuestions.length} question(s) still need to be confirmed.`);
    };

    socket.on("phase1:submit_error", handleSubmitError);
    return () => {
      socket.off("phase1:submit_error", handleSubmitError);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleQualified = ({ rank, score: currentScore, name, usn }: { rank: number; score: number; name: string; usn: string }): void => {
      stopTimer();
      updateParticipant({
        usn,
        name,
        phase1Qualified: true,
        phase1Rank: rank,
        phase1Score: currentScore
      });
      router.replace("/waiting");
    };

    const handleEliminated = ({ rank, score: currentScore, name, usn }: { rank: number; score: number; name: string; usn: string }): void => {
      stopTimer();
      updateParticipant({
        usn,
        name,
        phase1Qualified: false,
        phase1Rank: rank,
        phase1Score: currentScore
      });
      router.replace("/eliminated");
    };

    socket.on("phase1:qualified", handleQualified);
    socket.on("phase1:eliminated", handleEliminated);

    return () => {
      socket.off("phase1:qualified", handleQualified);
      socket.off("phase1:eliminated", handleEliminated);
    };
  }, [router, socket, stopTimer, updateParticipant]);

  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const currentQuestionId = currentQuestion?.questionId ?? null;
  const currentAnswer = currentQuestionId ? answers[currentQuestionId] : undefined;
  const isCurrentConfirmed = currentQuestionId ? confirmedSet.has(currentQuestionId) : false;
  const hasSelectedOption = currentAnswer !== undefined;

  const allPriorConfirmed = useMemo<boolean>(() => {
    if (questions.length === 0) {
      return false;
    }

    return questions.slice(0, -1).every((question) => confirmedSet.has(question.questionId));
  }, [confirmedSet, questions]);

  const handleSelectOption = (optionId: string): void => {
    if (!currentQuestionId || isCurrentConfirmed) {
      return;
    }

    setAnswers((previous: Record<string, string>) => ({
      ...previous,
      [currentQuestionId]: optionId
    }));
    setSubmitError(null);
  };

  const handleConfirmAnswer = (): void => {
    if (!socket || !currentQuestionId || !currentAnswer) {
      return;
    }

    socket.emit(
      "phase1:confirm_answer",
      {
        questionId: currentQuestionId,
        selectedOptionId: currentAnswer
      },
      (response) => {
        if (!response?.ok) {
          setSubmitError(response?.error ?? "Failed to confirm answer");
        }
      }
    );
  };

  const handleSubmit = (): void => {
    if (!socket || !currentQuestionId || !currentAnswer) {
      return;
    }

    if (!allPriorConfirmed) {
      setSubmitError("You must confirm all previous questions before submitting.");
      return;
    }

    socket.emit(
      "phase1:submit",
      {
        questionId: currentQuestionId,
        selectedOptionId: currentAnswer
      },
      (response) => {
        if (!response?.ok) {
          setSubmitError(response?.error ?? "Failed to submit");
        }
      }
    );
  };

  if (isLoading || status === "loading") {
    return <LoadingCard message="Scouting Base..." />;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh] space-y-6 text-center">
        <h2 className="text-4xl font-clash text-clash-red drop-shadow-md">Connection Lost</h2>
        <p className="text-xl text-white max-w-md">{error ?? "Failed to connect to the Village Server."}</p>
      </div>
    );
  }

  if (status === "waiting") {
    return <LoadingCard message="Prepare for War..." />;
  }

  if (status === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="card-clash max-w-lg w-full text-center space-y-6">
          <h2 className="text-4xl font-clash text-clash-gold">Attack Finished</h2>
          <p className="text-xl text-white">
            Score: <span className="text-3xl font-bold font-clash ml-2 text-clash-elixir">{score ?? 0}</span>
            {total !== null ? <span className="text-gray-400 text-lg ml-1">/ {total}</span> : null}
          </p>
          <p className="text-gray-300">Wait for the Clan Chief (Admin) to end Phase 1 for qualification outcome.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="sticky top-0 z-50 bg-clash-dark/95 border-b-4 border-clash-wood p-4 mb-4 flex justify-between items-center shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl md:text-3xl font-clash tracking-wide text-clash-gold hidden md:block">Phase 1: Rapid Fire</h2>
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <span className="text-white font-bold opacity-80 uppercase tracking-widest text-sm">
            {confirmedSet.size} / {questions.length} Locked
          </span>
          <Timer secondsLeft={secondsLeft} maxSeconds={MAX_PHASE1_TIME} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center my-6">
        {questions.map((question, index) => {
          const hasAnswer = answers[question.questionId] !== undefined;
          const isConfirmed = confirmedSet.has(question.questionId);
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

      {currentQuestion ? (
        <div className="px-2 md:px-0">
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

          <div className="flex gap-4 mt-6 justify-center">
            {!isFirstQuestion ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((value: number) => value - 1)}
                className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-6 py-3 rounded-lg shadow-sm hover:bg-clash-wood transition-colors"
              >
                ← Previous
              </button>
            ) : null}

            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasSelectedOption || !allPriorConfirmed}
                className={`btn-clash px-8 py-3 text-lg ${
                  !hasSelectedOption || !allPriorConfirmed ? "opacity-50 cursor-not-allowed" : "bg-clash-green"
                }`}
              >
                ⚔️ SUBMIT ATTACK
              </button>
            ) : (
              <>
                {!isCurrentConfirmed ? (
                  <button
                    type="button"
                    onClick={handleConfirmAnswer}
                    disabled={!hasSelectedOption}
                    className={`btn-clash px-6 py-3 ${!hasSelectedOption ? "opacity-50 cursor-not-allowed" : "bg-clash-elixir"}`}
                  >
                    🔒 Confirm Answer
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setCurrentIndex((value: number) => value + 1)}
                  className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-6 py-3 rounded-lg shadow-sm hover:bg-clash-wood transition-colors"
                >
                  Next →
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Phase1Client;
