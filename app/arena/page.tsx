"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollText, Swords, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import LoadingRadar from "@/components/ui/loading-radar";
import Phase1QuestionPanel, { type Phase1QuestionItem } from "@/components/Phase1QuestionPanel";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { apiRequest } from "@/lib/api";
import type { MatchmakingState, TournamentStatusResponse } from "@/types";

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

const arenaSlides = [
  "/assets/slides/slide1.jpeg",
  "/assets/slides/slide2.jpeg",
  "/assets/slides/slide3.jpeg",
  "/assets/slides/slide4.jpg"
];

const ArenaPage: React.FC = () => {
  const router = useRouter();
  const { participant, updateParticipant } = useParticipant();

  const [arenaState, setArenaState] = useState<MatchmakingState>("searching");
  const [showRules, setShowRules] = useState<boolean>(false);
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [opponent, setOpponent] = useState<{ name: string; usn: string } | null>(null);
  const [battleQuestions, setBattleQuestions] = useState<Phase1QuestionItem[]>([]);
  const [hasStartedBattle, setHasStartedBattle] = useState<boolean>(false);
  const [isStartSubmitting, setIsStartSubmitting] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ submitted: number; total: number }>({ submitted: 0, total: 0 });
  const [currentSlide, setCurrentSlide] = useState<number>(0);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((previous) => (previous + 1) % searchingLines.length);
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (arenaState !== "searching") return;
    const slideTimer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % arenaSlides.length);
    }, 4000);
    
    return () => {
      window.clearInterval(slideTimer);
    };
  }, [arenaState]);

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

  useEffect(() => {
    if (arenaState !== "waiting") {
      clearIntervalRef(tournamentProgressPollRef);
      return;
    }

    let isActive = true;

    const pollTournamentStatus = async (): Promise<void> => {
      try {
        const response = await apiRequest<TournamentStatusResponse>("/api/tournament/status");
        if (!isActive) {
          return;
        }

        setProgress({ submitted: response.submitted, total: response.total });

        if (response.leaderboardVisible || response.allDone) {
          clearIntervalRef(tournamentProgressPollRef);
          router.push("/leaderboard");
        }
      } catch {
        // Retry on next cycle.
      }
    };

    void pollTournamentStatus();

    tournamentProgressPollRef.current = setInterval(() => {
      void pollTournamentStatus();
    }, 4000);

    return () => {
      isActive = false;
      clearIntervalRef(tournamentProgressPollRef);
    };
  }, [arenaState, router]);

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
    setArenaState("waiting");
  };

  const activeMessage = useMemo<string>(() => searchingLines[messageIndex], [messageIndex]);

  if (!participant) {
    return null;
  }

  return (
    <div className={cn("min-h-screen w-full flex items-center justify-center px-4 relative", arenaState !== "searching" ? "arena-bg-texture" : "bg-[#1A1A1A] overflow-hidden")}>
      
      {/* Background Slider for Searching State */}
      {arenaState === "searching" && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {arenaSlides.map((slide, index) => (
            <div
              key={slide}
              className={cn(
                "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out",
                index === currentSlide ? "opacity-100" : "opacity-0"
              )}
              style={{ backgroundImage: `url('${slide}')` }}
            />
          ))}
          {/* Dark overlay to make text readable */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}

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
        <div className="relative z-10 w-full max-w-3xl mx-auto rounded-2xl border-4 border-[#d7b56f] bg-[#6f4628]/80 backdrop-blur-md shadow-[0_16px_0_0_#2d1b0f] p-8 md:p-12 text-center">
          <h1 className="text-4xl md:text-5xl text-[#f4d17d] font-clash tracking-wide mb-8">Entering the Arena...</h1>
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

      {arenaState === "waiting" ? (
        <div className="w-full min-h-screen flex items-center justify-center px-4 py-10 bg-[radial-gradient(circle_at_top,#4a2b1a_0%,#26160f_60%,#1b110b_100%)]">
          <div className="w-full max-w-4xl rounded-[28px] border-[6px] border-[#d6ad5f] bg-gradient-to-b from-[#8b5a33] to-[#5f3c22] shadow-[0_20px_0_0_#2d1b0f,0_0_28px_rgba(214,173,95,0.2)] p-8 md:p-12 text-center">
            <div className="flex justify-center mb-7">
              <LoadingRadar />
            </div>

            <h2 className="text-3xl md:text-5xl text-[#f2c96f] font-cinzel mb-6">You Have Fought Bravely, Warrior.</h2>

            <div className="inline-flex px-5 py-2 rounded-full border-2 border-[#f0cb74] bg-[#3e2413] text-[#f5d98d] font-bold mb-6">
              Your Battle Score: {score ?? 0}
            </div>

            <p className="text-[#d9bf8e] text-lg animate-pulse mb-8">Waiting for other warriors to finish the battle...</p>

            <div className="flex items-end justify-center gap-3 mb-6">
              <span className="text-4xl md:text-6xl leading-none text-[#f2cd78] font-cinzel">{progress.submitted}</span>
              <span className="text-3xl md:text-4xl leading-none text-[#cbb083] font-cinzel">/</span>
              <span className="text-4xl md:text-6xl leading-none text-[#f2cd78] font-cinzel">{progress.total}</span>
              <span className="text-lg md:text-2xl leading-none text-[#cbb083] font-cinzel pb-1">Warriors Finished</span>
            </div>

            <div className="max-w-2xl mx-auto rounded-full border-2 border-[#d2ad61] bg-[#2c1b12] p-1.5 overflow-hidden">
              <div
                className="h-6 rounded-full bg-gradient-to-r from-[#2f7f2d] to-[#44b645] transition-all duration-500"
                style={{
                  width: `${progress.total > 0 ? Math.min(100, (progress.submitted / progress.total) * 100) : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ArenaPage;
