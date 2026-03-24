"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Crown, ScrollText, Swords, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, jitteredInterval } from "@/lib/utils";
import ArenaLoadingCard from "@/components/ArenaLoadingCard";
import Phase1QuestionPanel, { type Phase1QuestionItem } from "@/components/Phase1QuestionPanel";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { apiRequest } from "@/lib/api";
import type { MatchmakingState, TournamentStatusResponse } from "@/types";
import LoadingRadar from "@/components/ui/loading-radar";

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

interface BotMatchmakingResponse {
  opponentName: string;
  opponentUSN: string;
  isBot: boolean;
}

interface QuestionResponse {
  questions: Phase1QuestionItem[];
  timeLimitMinutes: number;
  sessionCreatedAt: string;
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
    title: "Track and Opponent",
    text: "You are matched only within your track"
  },
  {
    title: "Question Format",
    text: "Questions are multiple-choice and shown in a participant-specific shuffled order."
  },
  {
    title: "Battle Timer",
    text: "You get 30 minutes. Watch the timer and manage your pace carefully."
  },
  {
    title: "Manual Submission",
    text: "Manual submit is allowed only when all required questions are answered. Partial manual submission is not accepted."
  },
  {
    title: "Auto-Submission on Timeout",
    text: "When the timer reaches 00:00, the system auto-submits only your confirmed answers. Unanswered questions receive zero points."
  },
  {
    title: "Ranking Rule",
    text: "Leaderboard rank is decided by score first. If scores are tied, earlier submission time ranks higher."
  },
  {
    title: "Qualification",
    text: "Top 16 participants in each track qualify for the next round."
  },
  {
    title: "Leaderboard Refresh",
    text: "Leaderboard updates are manual. Refresh the leaderboard page to see the latest standings."
  },
  {
    title: "Fair Play and Stability",
    text: "No AI tools, no external assistance, and no exploit attempts. Avoid refreshing or changing devices mid-battle; organizer decisions are final."
  },
  {
    title: "Regarding Start",
    text: "Till you get an announcement to start your match. Don't Click on the Button; Sound the Battle Horn"
  },
  {
    title: "Refresh",
    text: "Do not Refresh your page at any cost until someone from the team asks you to do so."
  },

];

const BACKGROUND_IMAGES: string[] = [
  "/assets/slides/slide1.webp",
  "/assets/slides/slide2.jpeg",
  "/assets/slides/slide3.jpg",
  "/assets/slides/slide4.webp",
  "/assets/slides/slide5.webp"
];

const ArenaPage: React.FC = () => {
  const router = useRouter();
  const { participant, updateParticipant } = useParticipant();

  const [arenaState, setArenaState] = useState<MatchmakingState>("searching");
  const [showRules, setShowRules] = useState<boolean>(false);
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [opponent, setOpponent] = useState<{ name: string; usn: string } | null>(null);
  const [battleQuestions, setBattleQuestions] = useState<Phase1QuestionItem[]>([]);
  const [battleTimeLimitSeconds, setBattleTimeLimitSeconds] = useState<number>(30 * 60);
  const [battleDeadlineMs, setBattleDeadlineMs] = useState<number>(Date.now() + 30 * 60 * 1000);
  const [hasStartedBattle, setHasStartedBattle] = useState<boolean>(false);
  const [isStartSubmitting, setIsStartSubmitting] = useState<boolean>(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ submitted: number; total: number }>({ submitted: 0, total: 0 });
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [searchSeconds, setSearchSeconds] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null> = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchmakingTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null> = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tournamentProgressPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchmakingStartedForUsnRef = useRef<string | null>(null);
  const matchmakingStatusFailureCountRef = useRef<number>(0);
  const tournamentStatusFailureCountRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      BACKGROUND_IMAGES.forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const clearIntervalRef = (ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>): void => {
    if (ref.current) {
      clearInterval(ref.current);
      ref.current = null;
    }
  };

  const loadQuestionsAndStartBattle = async (usn: string): Promise<void> => {
    const response = await apiRequest<QuestionResponse>(`/api/phase1/questions?usn=${encodeURIComponent(usn)}`);
    const safeLimitMinutes = Number.isFinite(response.timeLimitMinutes) && response.timeLimitMinutes > 0
      ? Math.floor(response.timeLimitMinutes)
      : 30;
    const timeLimitSeconds = safeLimitMinutes * 60;
    const createdAtMs = Date.parse(response.sessionCreatedAt);
    const resolvedDeadlineMs = Number.isFinite(createdAtMs)
      ? createdAtMs + timeLimitSeconds * 1000
      : Date.now() + timeLimitSeconds * 1000;

    setBattleQuestions(response.questions);
    setBattleTimeLimitSeconds(timeLimitSeconds);
    setBattleDeadlineMs(resolvedDeadlineMs);
    setArenaState("battle");
  };

  const fetchBotOpponent = async (usn: string): Promise<{ name: string; usn: string } | null> => {
    try {
      const response = await fetch("/api/matchmaking/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn })
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as BotMatchmakingResponse;
      return { name: data.opponentName, usn: data.opponentUSN };
    } catch {
      return null;
    }
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
    if (matchmakingTimerRef.current) {
      clearTimeout(matchmakingTimerRef.current);
      matchmakingTimerRef.current = null;
    }
    updateParticipant({ mappedTo: status.mappedTo, mappedAt: new Date().toISOString() });
    setArenaState("found");
    return true;
  };

  const beginMatchmaking = async (usn: string): Promise<void> => {
    const firstMatchmakingRequest = apiRequest<MatchmakingResponse>("/api/matchmaking", {
      method: "POST",
      json: { usn }
    });
    matchmakingTimerRef.current = setTimeout(async () => {
      if (arenaState === "searching") {
        const botOpponent = await fetchBotOpponent(usn);
        if (botOpponent) {
          clearIntervalRef(pollingIntervalRef);
          setOpponent(botOpponent);
          setArenaState("found");
        }
      }
    }, 30000);
    let response: MatchmakingResponse | null = null;
    try {
      response = await firstMatchmakingRequest;
    } catch {
      response = null;
    }

    if (response?.status === "matched" && response.opponent) {
      if (matchmakingTimerRef.current) {
        clearTimeout(matchmakingTimerRef.current);
        matchmakingTimerRef.current = null;
      }
      setOpponent({ name: response.opponent.name, usn: response.opponent.usn });
      updateParticipant({ mappedTo: response.opponent.usn, mappedAt: response.matchedAt ?? new Date().toISOString() });
      setArenaState("found");
      return;
    }

    clearIntervalRef(pollingIntervalRef);

    const startMatchmakingStatusPolling = (baseMs: number): void => {
      clearIntervalRef(pollingIntervalRef);
      pollingIntervalRef.current = setInterval(() => {
        void (async () => {
          try {
            const matched = await resolveOpponentFromStatus(usn);
            matchmakingStatusFailureCountRef.current = 0;
            if (matched) {
              clearIntervalRef(pollingIntervalRef);
            }
          } catch {
            matchmakingStatusFailureCountRef.current += 1;
            if (matchmakingStatusFailureCountRef.current > 3) {
              matchmakingStatusFailureCountRef.current = 0;
              const nextBase = Math.min(baseMs * 2, 30000);
              startMatchmakingStatusPolling(nextBase);
            }
          }
        })();
      }, jitteredInterval(baseMs, 1000));
    };

    startMatchmakingStatusPolling(3000);
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
    const storedYear: string | null = window.localStorage.getItem("participant_year");
    const storedUsn: string | null = window.localStorage.getItem("participant_usn");

    if (!storedUsn) {
      router.replace("/");
      return;
    }

    if (storedYear !== "1st") {
      router.replace("/arena/2nd");
    }
  }, [router]);

  useEffect(() => {
    if (!participant?.usn) {
      router.replace("/");
      return;
    }

    if (matchmakingStartedForUsnRef.current === participant.usn) {
      return;
    }

    matchmakingStartedForUsnRef.current = participant.usn;

    setSearchSeconds(0);
    void beginMatchmaking(participant.usn);

    return () => {
      if (matchmakingTimerRef.current) {
        clearTimeout(matchmakingTimerRef.current);
        matchmakingTimerRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      clearIntervalRef(tournamentProgressPollRef);
      if (matchmakingStartedForUsnRef.current === participant.usn) {
        matchmakingStartedForUsnRef.current = null;
      }
    };
  }, [participant?.usn, router]);

  useEffect(() => {
    if (arenaState !== "searching") {
      return;
    }

    const searchInterval = setInterval(() => {
      setSearchSeconds((previous) => previous + 1);
    }, 1000);

    return () => {
      clearInterval(searchInterval);
    };
  }, [arenaState]);

  useEffect(() => {
    if (arenaState !== "waiting") {
      clearIntervalRef(tournamentProgressPollRef);
      return;
    }

    let isActive = true;
    tournamentStatusFailureCountRef.current = 0;

    const pollTournamentStatus = async (): Promise<void> => {
      try {
        const response = await apiRequest<TournamentStatusResponse>("/api/tournament/status");
        if (!isActive) {
          return;
        }

        setProgress({ submitted: response.submitted, total: response.total });

        if (response.leaderboardVisible || response.allDone) {
          clearIntervalRef(tournamentProgressPollRef);
          router.push("/leaderboard1");
        }
      } catch {
        // Retry on next cycle.
      }
    };

    void pollTournamentStatus();

    const startTournamentStatusPolling = (baseMs: number): void => {
      clearIntervalRef(tournamentProgressPollRef);
      tournamentProgressPollRef.current = setInterval(() => {
        void (async () => {
          try {
            await pollTournamentStatus();
            tournamentStatusFailureCountRef.current = 0;
          } catch {
            tournamentStatusFailureCountRef.current += 1;
            if (tournamentStatusFailureCountRef.current > 3) {
              tournamentStatusFailureCountRef.current = 0;
              const nextBase = Math.min(baseMs * 2, 30000);
              startTournamentStatusPolling(nextBase);
            }
          }
        })();
      }, jitteredInterval(baseMs, 2000));
    };

    startTournamentStatusPolling(4000);

    return () => {
      isActive = false;
      clearIntervalRef(tournamentProgressPollRef);
      tournamentStatusFailureCountRef.current = 0;
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
    updateParticipant({ phase1Score: battleScore });
    router.push("/leaderboard1");
  };

  const activeMessage = useMemo<string>(() => searchingLines[messageIndex], [messageIndex]);

  if (!participant) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Global Background Slideshow */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {BACKGROUND_IMAGES.map((src, index) => (
          <div
            key={src}
            className={cn(
              "absolute inset-0 transition-opacity duration-[2000ms] ease-in-out",
              index === activeIndex ? "opacity-100" : "opacity-0"
            )}
          >
            <Image
              src={src}
              alt="Arena Background"
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
        {/* Dark Overlay */}
        <div className="absolute inset-0 z-10 bg-black/55" />
        {/* Vignette Gradient */}
        <div 
          className="absolute inset-0 z-11"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.55) 100%)" }}
        />
      </div>

      <div className="relative z-20 min-h-screen w-full flex items-center justify-center px-4">
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
        <ArenaLoadingCard 
          name={participant?.name || "Warrior"}
          usn={participant?.usn || "N/A"}
          year="1ST YEAR"
        />
      ) : null}

      {arenaState === "found" ? (
        <div className="relative w-full max-w-5xl mx-auto rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 md:p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] animate-in fade-in zoom-in duration-500 flex flex-col items-center">
          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-3xl" />

          {/* Player Cards Container */}
          <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center mb-10">
            
            {/* YOU Card */}
            <div className="group relative rounded-2xl border-2 border-[#fac15b]/40 bg-gradient-to-b from-[#3a2610]/90 to-[#4d2f16]/60 p-8 flex flex-col items-center justify-center text-center backdrop-blur-lg shadow-[0_0_40px_rgba(250,193,91,0.1)] transition-transform hover:scale-[1.02]">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-[#2a1708] border border-[#fac15b] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] z-20">
                 <span className="text-[#fac15b] text-[11px] font-black tracking-[0.25em] uppercase drop-shadow-sm font-sans">YOU</span>
               </div>
               
               <h3 className="text-4xl md:text-5xl font-clash text-[#fac15b] drop-shadow-[0_2px_0px_rgba(0,0,0,0.5)] tracking-wide mb-1 mt-3">
                 {participant.name}
               </h3>
               
               <p className="text-white/40 font-mono text-sm tracking-[0.15em] uppercase font-semibold">{participant.usn}</p>

               {/* Inner Glow */}
               <div className="absolute inset-0 rounded-2xl bg-[#fac15b]/5 pointer-events-none mix-blend-overlay"></div>
            </div>

            {/* VS Badge */}
            <div className="relative flex items-center justify-center z-20 -my-4 md:my-0">
               <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-gradient-to-b from-[#e2e8f0] to-[#94a3b8] shadow-[0_10px_25px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,1)] border-[6px] border-[#cbd5e1] ring-1 ring-black/20">
                  {/* Inner Dark Circle */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
                     {/* Gloss Shine */}
                     <div className="absolute top-0 w-full h-1/2 bg-white/10 rounded-t-full pointer-events-none blur-[1px]"></div>
                     
                     <span className="relative z-10 text-5xl font-clash font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fcd34d] to-[#d97706] drop-shadow-[0_4px_2px_rgba(0,0,0,0.5)] transform -skew-x-6">VS</span>
                  </div>
                  
                  {/* Floating Crown */}
                  <div className="absolute -top-7 text-[#fcd34d] drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] animate-bounce-slow">
                    <Crown className="w-10 h-10 fill-[#fcd34d] stroke-[#78350f] stroke-[1.5px]" />
                  </div>
               </div>
            </div>

            {/* ENEMY Card */}
            <div className="group relative rounded-2xl border-2 border-[#ef4444]/40 bg-gradient-to-b from-[#2a0a0a]/90 to-[#450a0a]/60 p-8 flex flex-col items-center justify-center text-center backdrop-blur-lg shadow-[0_0_40px_rgba(239,68,68,0.15)] transition-transform hover:scale-[1.02]">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-[#1a0505] border border-[#ef4444] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] z-20">
                 <span className="text-[#ef4444] text-[11px] font-black tracking-[0.25em] uppercase drop-shadow-sm font-sans">ENEMY</span>
               </div>
               
               <h3 className="text-4xl md:text-5xl font-clash text-white/90 drop-shadow-[0_2px_0px_rgba(0,0,0,0.5)] tracking-wide mb-1 mt-3">
                 {opponent?.name ?? "Unknown"}
               </h3>
               
               <p className="text-white/40 font-mono text-sm tracking-[0.15em] uppercase font-semibold">{opponent?.usn ?? "???"}</p>
               
               {/* Inner Glow */}
               <div className="absolute inset-0 rounded-2xl bg-[#ef4444]/5 pointer-events-none mix-blend-overlay"></div>
            </div>
          </div>

          {/* New Custom Loader Logic */}
          <div className="relative mb-12 flex flex-col items-center">
             <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Track 1 */}
                <div className="absolute inset-0 rounded-full border-[6px] border-[#ffffff]/5"></div>
                {/* Track 2 */}
                <div className="absolute inset-3 rounded-full border-[4px] border-[#ffffff]/5"></div>
                
                {/* Spinner 1 (Outer) */}
                <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-[#4ade80] border-l-[#4ade80]/50 animate-spin transition-all duration-700"></div>
                
                {/* Spinner 2 (Inner) */}
                <div className="absolute inset-3 rounded-full border-[4px] border-transparent border-b-[#facc15] border-r-[#facc15]/50 animate-spin-slow-reverse transition-all duration-700"></div>
                
                {/* Center Dot */}
                <div className="w-3 h-3 bg-[#4ade80] rounded-full shadow-[0_0_15px_#4ade80] animate-pulse"></div>
             </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => void handleStartBattle()}
            disabled={isStartSubmitting || hasStartedBattle}
            className="group relative transition-transform active:scale-95 disabled:opacity-60 disabled:grayscale focus:outline-none"
          >
             <div className="relative w-[380px] md:w-[480px] h-[110px] md:h-[140px]">
               <Image 
                 src="/assets/soundbattle.png" 
                 alt={hasStartedBattle ? "Battling..." : "Sound the Battle Horn"}
                 fill
                 className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                 priority
               />
             </div>
          </button>
        </div>
      ) : null}

      {arenaState === "battle" ? (
        <Phase1QuestionPanel
          usn={participant.usn}
          questions={battleQuestions}
          timeLimitSeconds={battleTimeLimitSeconds}
          deadlineMs={battleDeadlineMs}
          onSubmitted={handleSubmitted}
        />
      ) : null}

      {arenaState === "waiting" ? null : null}
      </div>
    </div>
  );
};

export default ArenaPage;
