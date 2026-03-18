"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollText, Swords, X } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingRadar from "@/components/ui/loading-radar";
import Phase1QuestionPanel, { type Phase1QuestionItem } from "@/components/Phase1QuestionPanel";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { apiRequest } from "@/lib/api";

type ArenaState = "searching" | "found" | "battle" | "submitted";

interface MatchmakingResponse {
  status: "matched" | "waiting";
  message?: string;
  opponent?: {
    name: string;
    usn: string;
  };
  matchedAt?: string;
}

interface MatchmakingStatusResponse {
  isMapped: boolean;
  mappedTo: string | null;
  opponentName: string | null;
}

interface QuestionResponse {
  questions: Phase1QuestionItem[];
}

interface TournamentProgressResponse {
  submitted: number;
  total: number;
  allDone: boolean;
  leaderboardVisible: boolean;
}

interface RuleItem {
  title: string;
  text: string;
}

const searchingLines = [
  "Scanning the battlefield...",
  "Summoning a worthy opponent...",
  "Checking enemy strength...",
  "Preparing your weapons...",
  "Locking onto target..."
] as const;

const rules: RuleItem[] = [
  {
    title: "Enter the Arena",
    text: "Register with your USN to enter the battlefield. You will be matched with a fellow warrior before the battle begins."
  },
  {
    title: "The Rapid Fire Round",
    text: "When the Warchief sounds the horn, questions will appear on your screen. Every warrior gets the same questions but in a different order."
  },
  {
    title: "Lock Your Answers",
    text: "Click Confirm Answer to lock in your choice for each question. Once locked, you cannot change it. Think before you lock."
  },
  {
    title: "Moving Between Questions",
    text: "Use the Next button to move to the next question without locking. You can go back and answer skipped questions anytime."
  },
  {
    title: "The Final Strike",
    text: "On the last question, the Submit button will appear. You can only submit after you have locked all previous answers. Once you submit, your battle is over."
  },
  {
    title: "Scoring",
    text: "Every correct answer earns you one point. Speed matters only if two warriors finish with the same score."
  },
  {
    title: "Top 8 Advance",
    text: "The 8 warriors with the highest scores will advance to the Grand Finale on HackerRank."
  },
  {
    title: "No Cheating",
    text: "No AI tools, no external help, no searching the internet. Warriors caught cheating will be immediately disqualified."
  },
  {
    title: "Stay on the Page",
    text: "Do not refresh the page or close the tab during the battle. Your progress may be lost."
  },
  {
    title: "Warchief Decides",
    text: "All decisions made by the organizing team are final. Respect your fellow warriors and the organizers at all times."
  }
];

const ArenaPage: React.FC = () => {
  const router = useRouter();
  const { participant, updateParticipant } = useParticipant();

  const [arenaState, setArenaState] = useState<ArenaState>("searching");
  const [showRules, setShowRules] = useState<boolean>(false);
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [opponent, setOpponent] = useState<{ name: string; usn: string } | null>(null);
  const [battleQuestions, setBattleQuestions] = useState<Phase1QuestionItem[]>([]);
  const [hasStartedBattle, setHasStartedBattle] = useState<boolean>(false);
  const [isStartSubmitting, setIsStartSubmitting] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ submitted: number; total: number }>({ submitted: 0, total: 0 });

  const matchmakingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tournamentProgressPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearIntervalRef = (ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>): void => {
    if (ref.current) {
      clearInterval(ref.current);
      ref.current = null;
    }
  };

  const loadQuestionsAndStartBattle = async (usn: string): Promise<void> => {
    const response = await apiRequest<QuestionResponse>(`/api/phase1/questions?usn=${encodeURIComponent(usn)}`);
    setBattleQuestions(response.questions);
    setArenaState("battle");
  };

  const resolveOpponentFromStatus = async (usn: string): Promise<boolean> => {
    const status = await apiRequest<MatchmakingStatusResponse>(`/api/matchmaking/status?usn=${encodeURIComponent(usn)}`);
    if (!status.isMapped || !status.mappedTo || status.mappedTo === "WAITING_FOR_OPPONENT") {
      return false;
    }

    setOpponent({
      name: status.opponentName ?? "Unknown Raider",
      usn: status.mappedTo
    });
    updateParticipant({ mappedTo: status.mappedTo, mappedAt: new Date().toISOString() });
    setArenaState("found");
    return true;
  };

  const beginMatchmaking = async (usn: string): Promise<void> => {
    const response = await apiRequest<MatchmakingResponse>("/api/matchmaking", {
      method: "POST",
      json: { usn }
    });

    if (response.status === "matched" && response.opponent) {
      setOpponent({ name: response.opponent.name, usn: response.opponent.usn });
      updateParticipant({ mappedTo: response.opponent.usn, mappedAt: response.matchedAt ?? new Date().toISOString() });
      setArenaState("found");
      return;
    }

    clearIntervalRef(matchmakingPollRef);
    matchmakingPollRef.current = setInterval(() => {
      void (async () => {
        try {
          const matched = await resolveOpponentFromStatus(usn);
          if (matched) {
            clearIntervalRef(matchmakingPollRef);
          }
        } catch {
          // Keep polling; the next cycle may succeed.
        }
      })();
    }, 3000);
  };

  const startTournamentProgressPolling = (): void => {
    clearIntervalRef(tournamentProgressPollRef);
    tournamentProgressPollRef.current = setInterval(() => {
      void (async () => {
        try {
          const response = await apiRequest<TournamentProgressResponse>("/api/tournament/status");
          setProgress({ submitted: response.submitted, total: response.total });
          if (response.allDone || response.leaderboardVisible) {
            clearIntervalRef(tournamentProgressPollRef);
            router.push("/leaderboard");
          }
        } catch {
          // Retry on next polling cycle.
        }
      })();
    }, 5000);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((previous) => (previous + 1) % searchingLines.length);
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!participant?.usn) {
      router.replace("/");
      return;
    }

    void beginMatchmaking(participant.usn);

    return () => {
      clearIntervalRef(matchmakingPollRef);
      clearIntervalRef(tournamentProgressPollRef);
    };
  }, [participant?.usn, router]);

  const handleStartBattle = async (): Promise<void> => {
    if (!participant?.usn || isStartSubmitting || hasStartedBattle) {
      return;
    }

    setIsStartSubmitting(true);
    try {
      await apiRequest<{ success: boolean }>("/api/tournament/start", {
        method: "POST"
      });
      setHasStartedBattle(true);
      await loadQuestionsAndStartBattle(participant.usn);
    } finally {
      setIsStartSubmitting(false);
    }
  };

  const handleSubmitted = (battleScore: number): void => {
    setScore(battleScore);
    updateParticipant({ phase1Score: battleScore });
    setArenaState("submitted");
    startTournamentProgressPolling();
  };

  const activeMessage = useMemo<string>(() => searchingLines[messageIndex], [messageIndex]);

  if (!participant) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 arena-bg-texture">
      {/* Fixed positioning keeps Rules reachable above every arena state, even while polling transitions happen. */}
      <button
        type="button"
        onClick={() => setShowRules(true)}
        className="fixed top-4 right-4 z-50 min-w-[140px] py-3 px-5 border-2 border-[#f0cb74] bg-[#4a7c3f] hover:bg-[#3d6b34] text-[#f4d17d] font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-2"
      >
        <ScrollText className="w-5 h-5" />
        Rules
      </button>

      {showRules ? (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
          <div
            className="relative w-full max-w-[600px] max-h-[80vh] overflow-y-auto bg-[#3e2413] border-4 border-[#d8b46b] rounded-2xl p-6 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-[#f0cc78] hover:text-[#ffe6a9]"
              onClick={() => setShowRules(false)}
              aria-label="Close rules"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <ScrollText className="w-7 h-7 text-[#f0cc78]" />
              <h2 className="text-3xl font-serif text-[#f2d081]">Rules of Battle</h2>
            </div>
            <div className="h-[2px] bg-[#d8b46b] mb-5" />

            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div key={rule.title} className="space-y-4">
                  <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border-2 border-[#d8b46b] bg-[#5b3620] text-[#f0cc78] font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-[#f0cc78] font-bold text-lg">{rule.title}</p>
                      <p className="text-[#f5e7c2]">{rule.text}</p>
                    </div>
                  </div>
                  {index < rules.length - 1 ? <div className="h-px bg-[#b99552]" /> : null}
                </div>
              ))}
            </div>

            <div className="pt-6 flex justify-center">
              <Swords className="w-8 h-8 text-[#a88b4f]" />
            </div>
          </div>
        </div>
      ) : null}

      {arenaState === "searching" ? (
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

      {arenaState === "found" ? (
        <div className="w-full max-w-5xl mx-auto rounded-2xl border-4 border-[#d7b56f] bg-[#5b3620]/95 shadow-[0_16px_0_0_#2d1b0f] p-8 md:p-12 text-center arena-reveal-in">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
            <div className="rounded-xl border-2 border-[#f3d487] bg-[#4f3622] p-6">
              <p className="text-[#e5c06e] text-sm uppercase tracking-widest mb-3">You</p>
              <p className="text-2xl text-white font-bold">{participant.name}</p>
              <p className="text-[#f4d17d] font-mono mt-2">{participant.usn}</p>
            </div>

            <div className="relative w-28 h-28 rounded-full border-4 border-[#f0cb74] bg-[#3e2413] flex items-center justify-center arena-vs-pulse mx-auto">
              <span className="text-4xl font-clash text-[#f5d36f]">VS</span>
              <span className="arena-sword arena-sword-left">⚔</span>
              <span className="arena-sword arena-sword-right">⚔</span>
            </div>

            <div className="rounded-xl border-2 border-[#e88f7a] bg-[#5d2b23] p-6">
              <p className="text-[#f1b2a4] text-sm uppercase tracking-widest mb-3">Enemy</p>
              <p className="text-2xl text-white font-bold">{opponent?.name ?? "Unknown Raider"}</p>
              <p className="text-[#f8c9bc] font-mono mt-2">{opponent?.usn ?? "UNKNOWN"}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <LoadingRadar />

            <button
              type="button"
              onClick={() => {
                void handleStartBattle();
              }}
              disabled={isStartSubmitting || hasStartedBattle}
              className="min-w-[240px] py-4 px-6 border-2 border-[#f0cb74] bg-[#4a7c3f] hover:bg-[#3d6b34] text-[#f4d17d] font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasStartedBattle ? "Battle Horn Sounded" : "Sound the Battle Horn"}
            </button>
          </div>
        </div>
      ) : null}

      {arenaState === "battle" ? <Phase1QuestionPanel usn={participant.usn} questions={battleQuestions} onSubmitted={handleSubmitted} /> : null}

      {arenaState === "submitted" ? (
        <div className="w-full max-w-3xl rounded-2xl border-4 border-[#d7b56f] bg-[#5b3620]/95 shadow-[0_16px_0_0_#2d1b0f] p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <LoadingRadar />
          </div>
          <p className="text-2xl text-[#f4d17d] mb-4">You have fought bravely, Warrior. Waiting for others to finish the battle...</p>
          <div className="inline-flex px-4 py-2 rounded-full border-2 border-[#f0cb74] bg-[#3e2413] text-[#f5d98d] font-bold mb-4">
            Your Battle Score: {score ?? 0}
          </div>
          <p className="text-[#e9d5ac]">
            {progress.submitted} out of {progress.total} warriors have finished
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ArenaPage;
