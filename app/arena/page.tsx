"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Crown } from "lucide-react";
import LoadingRadar from "@/components/ui/loading-radar";
import Phase1QuestionPanel from "@/components/Phase1QuestionPanel";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { useSocket } from "@/hooks/useSocket";
import { apiRequest } from "@/lib/api";
import type {
  MatchmakingOpponentFoundPayload,
  MatchmakingTimeoutPayload,
  MatchmakingWaitingInQueuePayload,
  Phase1OutcomeEvent,
  Phase1QuestionsEvent,
  Phase1ResultEvent
} from "@/types/socket";

type MatchmakingState = "searching" | "found" | "battle" | "result";
type ResultType = "qualified" | "eliminated" | null;

interface OpponentInfo {
  name: string;
  usn: string;
}

interface ParticipantApiRecord {
  usn: string;
  name: string;
  mappedTo: string | null;
  phase1Score: number;
  qualified: boolean;
}

interface ParticipantApiResponse {
  participant: ParticipantApiRecord;
}

const searchingLines = [
  "Scanning the battlefield...",
  "Summoning a worthy opponent...",
  "Checking enemy strength...",
  "Preparing your weapons...",
  "Locking onto target..."
] as const;

const finaleLines = [
  "Buckle up, Warrior. The real matrix awaits you.",
  "Only the elite 8 stand here. The Grand Finale is about to begin.",
  "Your coding blade has been sharpened.",
  "Now prepare to conquer the ultimate arena."
] as const;

const ArenaPage: React.FC = () => {
  const { participant, updateParticipant } = useParticipant();
  const { socket, isConnected } = useSocket("/phase1");

  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>("searching");
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [resultType, setResultType] = useState<ResultType>(null);

  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [battleQuestions, setBattleQuestions] = useState<Phase1QuestionsEvent[]>([]);
  const [lastConfirmedQuestionId, setLastConfirmedQuestionId] = useState<string | null>(null);
  const [resultPayload, setResultPayload] = useState<Phase1ResultEvent | null>(null);
  const [outcomePayload, setOutcomePayload] = useState<Phase1OutcomeEvent | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);
  const [opponentBattleLine, setOpponentBattleLine] = useState<string>("Your rival's final result is hidden in the war fog.");
  const [visibleFinaleLines, setVisibleFinaleLines] = useState<string[]>([]);

  const hasEnteredArenaRef = useRef<boolean>(false);
  const queueRequestedRef = useRef<boolean>(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!participant?.usn) {
      window.location.replace("/");
    }
  }, [participant?.usn]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((previous) => (previous + 1) % searchingLines.length);
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !participant?.usn || hasEnteredArenaRef.current) {
      return;
    }

    // State transition trigger: once socket connects in arena, begin matchmaking search.
    hasEnteredArenaRef.current = true;
    socket.emit("matchmaking:enter_arena", { usn: participant.usn });
  }, [isConnected, participant?.usn, socket]);

  useEffect(() => {
    if (!socket || !participant?.usn) {
      return;
    }

    // Register all arena listeners from mount and keep them active across searching/found/battle/result.
    const handleOpponentFound = (payload: MatchmakingOpponentFoundPayload): void => {
      setOpponent({ name: payload.opponentName, usn: payload.opponentUSN });
      setMatchmakingState("found");
      setResultType(null);
      queueRequestedRef.current = false;
      updateParticipant({ mappedTo: payload.opponentUSN, mappedAt: payload.matchedAt });
    };

    const handleWaitingInQueue = (_payload: MatchmakingWaitingInQueuePayload): void => {
      setMatchmakingState("searching");
      if (!queueRequestedRef.current) {
        queueRequestedRef.current = true;
        socket.emit("matchmaking:find_opponent", { usn: participant.usn });
      }
    };

    const handleTimeout = (payload: MatchmakingTimeoutPayload): void => {
      setOpponent({
        name: payload.ghostOpponent.name,
        usn: payload.ghostOpponent.usn
      });
      setMatchmakingState("found");
      queueRequestedRef.current = false;
      updateParticipant({ mappedTo: payload.ghostOpponent.usn, mappedAt: new Date().toISOString() });
    };

    const handleQuestions = (payload: Phase1QuestionsEvent[]): void => {
      // State transition trigger: admin started phase1 and server delivered pre-shuffled questions.
      setBattleQuestions(payload);
      setResultPayload(null);
      setOutcomePayload(null);
      setLastConfirmedQuestionId(null);

      setIsTransitioning(true);
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = setTimeout(() => {
        setMatchmakingState("battle");
        setIsTransitioning(false);
      }, 700);
    };

    const handleAnswerConfirmed = ({ questionId }: { questionId: string }): void => {
      setLastConfirmedQuestionId(questionId);
    };

    const handleResult = (payload: Phase1ResultEvent): void => {
      // State transition trigger: participant submitted and server graded attempt.
      setResultPayload(payload);
      if (typeof payload.qualified === "boolean") {
        setResultType(payload.qualified ? "qualified" : "eliminated");
      }

      if (typeof payload.rank === "number") {
        updateParticipant({ phase1Rank: payload.rank });
      }

      updateParticipant({ phase1Score: payload.score });

      setIsTransitioning(true);
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = setTimeout(() => {
        setMatchmakingState("result");
        setIsTransitioning(false);
      }, 700);
    };

    const handleQualified = (payload: Phase1OutcomeEvent): void => {
      setResultType("qualified");
      setOutcomePayload(payload);
      updateParticipant({
        phase1Qualified: true,
        phase1Rank: payload.rank,
        phase1Score: payload.score
      });
    };

    const handleEliminated = (payload: Phase1OutcomeEvent): void => {
      setResultType("eliminated");
      setOutcomePayload(payload);
      updateParticipant({
        phase1Qualified: false,
        phase1Rank: payload.rank,
        phase1Score: payload.score
      });
    };

    socket.on("matchmaking:opponent_found", handleOpponentFound);
    socket.on("matchmaking:waiting_in_queue", handleWaitingInQueue);
    socket.on("matchmaking:timeout", handleTimeout);
    socket.on("phase1:questions", handleQuestions);
    socket.on("phase1:answer_confirmed", handleAnswerConfirmed);
    socket.on("phase1:result", handleResult);
    socket.on("phase1:qualified", handleQualified);
    socket.on("phase1:eliminated", handleEliminated);

    return () => {
      socket.off("matchmaking:opponent_found", handleOpponentFound);
      socket.off("matchmaking:waiting_in_queue", handleWaitingInQueue);
      socket.off("matchmaking:timeout", handleTimeout);
      socket.off("phase1:questions", handleQuestions);
      socket.off("phase1:answer_confirmed", handleAnswerConfirmed);
      socket.off("phase1:result", handleResult);
      socket.off("phase1:qualified", handleQualified);
      socket.off("phase1:eliminated", handleEliminated);

      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [participant?.usn, socket, updateParticipant]);

  useEffect(() => {
    if (matchmakingState !== "result" || resultType !== "qualified") {
      return;
    }

    setVisibleFinaleLines([]);
    const timer = window.setInterval(() => {
      setVisibleFinaleLines((previous) => {
        if (previous.length >= finaleLines.length) {
          window.clearInterval(timer);
          return previous;
        }

        return [...previous, finaleLines[previous.length]];
      });
    }, 800);

    return () => {
      window.clearInterval(timer);
    };
  }, [matchmakingState, resultType]);

  useEffect(() => {
    if (matchmakingState !== "result" || resultType !== "eliminated" || !participant?.usn) {
      return;
    }

    const run = async (): Promise<void> => {
      try {
        const self = await apiRequest<ParticipantApiResponse>(`/api/participants/${participant.usn}`);
        const mappedTo = self.participant.mappedTo;

        if (!mappedTo || mappedTo === "WAITING_FOR_OPPONENT") {
          setOpponentScore(null);
          setOpponentBattleLine("Your rival's final result is hidden in the war fog.");
          return;
        }

        if (mappedTo.startsWith("BOT_")) {
          setOpponentScore(null);
          setOpponentBattleLine("A ghost warrior stood against you in this skirmish.");
          return;
        }

        const response = await apiRequest<ParticipantApiResponse>(`/api/participants/${mappedTo}`);
        setOpponentScore(response.participant.phase1Score);
        setOpponentBattleLine(
          response.participant.qualified
            ? "Your opponent advanced but you fought with honor."
            : "Your opponent also fell in battle today."
        );
      } catch {
        setOpponentScore(null);
        setOpponentBattleLine("Your rival's final result is hidden in the war fog.");
      }
    };

    void run();
  }, [matchmakingState, participant?.usn, resultType]);

  const activeMessage = useMemo<string>(() => searchingLines[messageIndex], [messageIndex]);

  if (!participant) {
    return null;
  }

  const resultScore = outcomePayload?.score ?? resultPayload?.score ?? participant.phase1Score ?? 0;
  const resultRank = outcomePayload?.rank ?? resultPayload?.rank ?? participant.phase1Rank ?? 0;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 arena-bg-texture">
      <div className={`w-full transition-opacity duration-700 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        {matchmakingState === "searching" ? (
          <div className="w-full max-w-3xl mx-auto rounded-2xl border-4 border-[#d7b56f] bg-[#6f4628]/95 shadow-[0_16px_0_0_#2d1b0f] p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-5xl text-[#f4d17d] font-serif tracking-wide mb-8">Entering the Arena...</h1>
            <div className="flex justify-center mb-8">
              <LoadingRadar />
            </div>
            <p key={activeMessage} className="text-[#f5e1b0] text-lg md:text-xl mb-8 arena-message-fade min-h-8">
              {activeMessage}
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border-2 border-[#d7b56f] bg-[#3f2a19] text-[#f1d790]">
              <span className="font-semibold">{participant.name}</span>
              <span className="opacity-70">|</span>
              <span className="font-mono font-bold">{participant.usn}</span>
            </div>
          </div>
        ) : null}

        {matchmakingState === "found" ? (
          <div className="w-full max-w-5xl mx-auto rounded-2xl border-4 border-[#d7b56f] bg-[#5b3620]/95 shadow-[0_16px_0_0_#2d1b0f] p-8 md:p-12 text-center arena-reveal-in">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
              <div className="rounded-xl border-2 border-[#f3d487] bg-[#4f3622] p-6">
                <p className="text-[#e5c06e] text-sm uppercase tracking-widest mb-3">You</p>
                <p className="text-2xl text-white font-bold">{participant.name}</p>
                <p className="text-[#f4d17d] font-mono mt-2">{participant.usn}</p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="relative w-28 h-28 rounded-full border-4 border-[#f0cb74] bg-[#3e2413] flex items-center justify-center arena-vs-pulse">
                  <span className="text-4xl font-clash text-[#f5d36f]">VS</span>
                  <span className="arena-sword arena-sword-left">⚔</span>
                  <span className="arena-sword arena-sword-right">⚔</span>
                </div>
              </div>

              <div className="rounded-xl border-2 border-[#e88f7a] bg-[#5d2b23] p-6">
                <p className="text-[#f1b2a4] text-sm uppercase tracking-widest mb-3">Enemy</p>
                <p className="text-2xl text-white font-bold">{opponent?.name ?? "Unknown Raider"}</p>
                <p className="text-[#f8c9bc] font-mono mt-2">{opponent?.usn ?? "UNKNOWN"}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <LoadingRadar />
              <p className="text-[#d6b98a] animate-pulse">The battle horn has not sounded yet... Stand by, Warrior.</p>
            </div>
          </div>
        ) : null}

        {matchmakingState === "battle" ? (
          <div className="arena-reveal-in">
            <Phase1QuestionPanel
              questions={battleQuestions}
              socket={socket!}
              onSubmit={() => {
                // Submit completion is resolved by phase1:result; this callback only marks intent.
              }}
              externallyConfirmedQuestionId={lastConfirmedQuestionId}
            />
          </div>
        ) : null}

        {matchmakingState === "result" ? (
          <div className="w-full max-w-4xl mx-auto arena-reveal-in">
            {resultType === "qualified" ? (
              <div className="rounded-2xl border-4 border-[#e0be6f] bg-[#5a351f]/95 shadow-[0_16px_0_0_#2d1b0f] p-8 md:p-12 text-center qualified-gold-glow">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#3c2616] border-2 border-[#f0d487] flex items-center justify-center">
                    <Crown className="w-10 h-10 text-[#f7d26e]" />
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl text-[#f3cf78] mb-4 font-serif">You Have Survived the First Battle!</h1>
                <p className="text-2xl text-[#f3eee3] mb-2">{participant.name}</p>
                <p className="text-xl text-[#f4d17d] mb-6">Battle Score: {resultScore}</p>

                <div className="space-y-3 min-h-40 mb-8">
                  {visibleFinaleLines.map((line) => (
                    <p key={line} className="text-lg text-[#f0cf83] qualified-line-fade">
                      {line}
                    </p>
                  ))}
                </div>

                <div className="inline-flex items-center justify-center px-6 py-2 rounded-full border-2 border-[#f0cb74] bg-[#1f7f47] text-white font-bold tracking-widest uppercase animate-pulse">
                  Grand Finalist
                </div>

                <div className="mt-10 flex flex-col items-center gap-4">
                  <LoadingRadar />
                  <p className="text-[#cfb78a] animate-pulse">Awaiting the Grand Finale to begin...</p>
                </div>
              </div>
            ) : (
              <div className="card-clash w-full text-center space-y-6">
                <h2 className="text-4xl font-clash text-clash-red drop-shadow-md">Eliminated After Phase 1</h2>
                <p className="text-xl text-white">You fought bravely in the coding battlefield.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
                    <p className="text-gray-300 text-sm">Final Score</p>
                    <p className="text-white font-bold text-2xl">{resultScore}</p>
                  </div>
                  <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
                    <p className="text-gray-300 text-sm">Final Rank</p>
                    <p className="text-white font-bold text-2xl">{resultRank > 0 ? `#${resultRank}` : "-"}</p>
                  </div>
                </div>

                <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-5 text-left space-y-3">
                  <h3 className="text-2xl font-clash text-clash-gold">Your Opponent&apos;s Result</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-300 text-sm">Opponent Name</p>
                      <p className="text-white font-bold">{opponent?.name ?? "Unknown Rival"}</p>
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Opponent USN</p>
                      <p className="text-white font-bold">{opponent?.usn ?? "UNKNOWN"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-300 text-sm">Opponent Score</p>
                    <p className="text-white font-bold text-2xl">{opponentScore ?? "-"}</p>
                  </div>

                  <p className="text-[#f4d07d]">{opponentBattleLine}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ArenaPage;
