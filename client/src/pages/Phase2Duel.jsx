import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParticipant } from "../context/ParticipantContext";
import { useSocket } from "../hooks/useSocket";
import QuestionCard from "../components/QuestionCard";

const Phase2Duel = () => {
  const { participant, updateParticipant } = useParticipant();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket("/phase1");

  const [matchId, setMatchId] = useState(null);
  const [matchRound, setMatchRound] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [confirmedSet, setConfirmedSet] = useState(new Set());
  const [submitError, setSubmitError] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  const currentQuestionIndex = useMemo(() => {
    if (!questions.length) return 0;
    return Math.min(
      questions.length - 1,
      Array.from({ length: questions.length }).findIndex(
        (_, idx) => answers[questions[idx].questionId] === undefined,
      ) === -1
        ? questions.length - 1
        : Array.from({ length: questions.length }).findIndex(
            (_, idx) => answers[questions[idx].questionId] === undefined,
          ),
    );
  }, [questions, answers]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentQId = currentQuestion?.questionId;
  const currentAnswer = currentQId ? answers[currentQId] : undefined;
  const isCurrentConfirmed = currentQId ? confirmedSet.has(currentQId) : false;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const applyMatchPayload = (payload) => {
    setMatchId(payload.matchId);
    setMatchRound(payload.matchRound);
    setOpponent(payload.opponent || null);
    setQuestions(Array.isArray(payload.questions) ? payload.questions : []);

    const restoredAnswers = payload.confirmedAnswers || {};
    setAnswers(restoredAnswers);
    setConfirmedSet(new Set(Object.keys(restoredAnswers)));
    setSubmitError(null);
    setWaitingForOpponent(Boolean(payload.submitted));
  };

  useEffect(() => {
    if (!participant?.usn) {
      navigate("/register", { replace: true });
      return;
    }

    const cached = localStorage.getItem("phase2ActiveMatch");
    if (cached) {
      try {
        applyMatchPayload(JSON.parse(cached));
      } catch {
        localStorage.removeItem("phase2ActiveMatch");
      }
    }
  }, [participant?.usn, navigate]);

  useEffect(() => {
    if (!socket || !participant?.usn || !isConnected) return;

    socket.emit("phase2:rejoin", { usn: participant.usn });

    const handleMatchStart = (payload) => {
      localStorage.setItem("phase2ActiveMatch", JSON.stringify(payload));
      applyMatchPayload(payload);
    };

    const handleMatchResume = (payload) => {
      localStorage.setItem("phase2ActiveMatch", JSON.stringify(payload));
      applyMatchPayload(payload);
    };

    const handleAnswerConfirmed = ({ questionId }) => {
      setConfirmedSet((prev) => new Set(prev).add(questionId));
    };

    const handleWaiting = () => {
      setWaitingForOpponent(true);
    };

    const handleResult = (payload) => {
      localStorage.removeItem("phase2ActiveMatch");

      if (payload.result === "eliminated") {
        updateParticipant({ phase2Eliminated: true, phase2Active: false });
        navigate("/eliminated", { replace: true });
        return;
      }

      updateParticipant({ phase2Active: true, phase2Eliminated: false });
      navigate("/phase2/waiting", { replace: true });
    };

    const handleAdvancedFinals = () => {
      localStorage.removeItem("phase2ActiveMatch");
      updateParticipant({ phase3Qualified: true, phase2Active: false });
      navigate("/phase2/waiting", { replace: true });
    };

    socket.on("phase2:match_start", handleMatchStart);
    socket.on("phase2:match_resume", handleMatchResume);
    socket.on("phase2:answer_confirmed", handleAnswerConfirmed);
    socket.on("phase2:waiting_for_opponent", handleWaiting);
    socket.on("phase2:result", handleResult);
    socket.on("phase2:advanced_finals", handleAdvancedFinals);

    return () => {
      socket.off("phase2:match_start", handleMatchStart);
      socket.off("phase2:match_resume", handleMatchResume);
      socket.off("phase2:answer_confirmed", handleAnswerConfirmed);
      socket.off("phase2:waiting_for_opponent", handleWaiting);
      socket.off("phase2:result", handleResult);
      socket.off("phase2:advanced_finals", handleAdvancedFinals);
    };
  }, [socket, participant?.usn, isConnected, navigate, updateParticipant]);

  const handleSelectOption = (optionId) => {
    if (!currentQId || isCurrentConfirmed || waitingForOpponent) return;
    setAnswers((prev) => ({ ...prev, [currentQId]: optionId }));
    setSubmitError(null);
  };

  const handleConfirm = () => {
    if (!socket || !matchId || !currentQId || currentAnswer === undefined)
      return;

    socket.emit(
      "phase2:confirm_answer",
      {
        matchId,
        questionId: currentQId,
        selectedOptionId: currentAnswer,
      },
      (res) => {
        if (!res?.ok) {
          setSubmitError(res?.error || "Failed to confirm answer");
        }
      },
    );
  };

  const allPriorConfirmed =
    questions.length > 0 &&
    questions.slice(0, -1).every((q) => confirmedSet.has(q.questionId));

  const handleSubmit = () => {
    if (!socket || !matchId || !currentQId || currentAnswer === undefined)
      return;

    if (!allPriorConfirmed) {
      setSubmitError("Confirm all previous questions before submit.");
      return;
    }

    socket.emit(
      "phase2:submit",
      {
        matchId,
        questionId: currentQId,
        selectedOptionId: currentAnswer,
      },
      (res) => {
        if (!res?.ok) {
          setSubmitError(res?.error || "Failed to submit answers");
        } else {
          setWaitingForOpponent(true);
        }
      },
    );
  };

  if (!matchId || !questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-4">
        <h2 className="text-4xl font-clash text-clash-gold">Preparing Duel</h2>
        <p className="text-white">Waiting for your match assignment...</p>
      </div>
    );
  }

  if (waitingForOpponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-4">
        <h2 className="text-4xl font-clash text-clash-gold">Match Submitted</h2>
        <p className="text-white">
          Your opponent is still answering, please wait.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      <div className="card-clash">
        <h2 className="text-3xl font-clash text-clash-gold">Phase 2 Duel</h2>
        <p className="text-gray-300 mt-2">
          Round {matchRound} | Match {matchId}
        </p>
        <p className="text-white mt-1">
          Opponent: {opponent?.name || "Opponent"} ({opponent?.usn || "-"})
        </p>
      </div>

      <div className="card-clash">
        <QuestionCard
          question={currentQuestion}
          index={currentQuestionIndex}
          selectedOption={currentAnswer}
          onSelectOption={handleSelectOption}
          disabled={isCurrentConfirmed}
          isLocked={isCurrentConfirmed}
        />

        {submitError && (
          <div className="mt-4 bg-clash-red/20 border-2 border-clash-red text-white p-3 rounded text-center">
            {submitError}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          {!isLastQuestion ? (
            <button
              onClick={handleConfirm}
              disabled={currentAnswer === undefined || isCurrentConfirmed}
              className="btn-clash disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Answer
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={currentAnswer === undefined || !allPriorConfirmed}
              className="btn-clash disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          )}
        </div>
      </div>

      <div className="card-clash">
        <h3 className="text-xl text-white mb-3">Progress</h3>
        <p className="text-gray-300">
          Confirmed: {confirmedSet.size} / {questions.length}
        </p>
      </div>
    </div>
  );
};

export default Phase2Duel;
