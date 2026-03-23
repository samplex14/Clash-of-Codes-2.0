"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Crown, Swords } from "lucide-react";
import LoadingRadar from "@/components/ui/loading-radar";
import type { LeaderboardParticipant, LeaderboardResponse } from "@/types";

type ViewState = "loading" | "holding" | "ready";

const LeaderboardPage: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardParticipant[]>([]);
  const [totalEligible, setTotalEligible] = useState<number>(0);
  const [viewState, setViewState] = useState<ViewState>("loading");

  const fetchLeaderboard = async (): Promise<LeaderboardResponse | null> => {
    const response = await fetch("/api/leaderboard?year=2nd", {
      method: "GET",
      cache: "no-store"
    });

    if (response.status === 403) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to load leaderboard");
    }

    const data = (await response.json()) as LeaderboardResponse;
    if (!data.visible) {
      return null;
    }

    return data;
  };

  const loadLeaderboard = async (): Promise<void> => {
    try {
      const data = await fetchLeaderboard();
      if (!data) {
        setViewState("holding");
        return;
      }

      // Submitted-only leaderboard rule safety net: keep only completed submissions before rendering.
      const eligibleParticipants = data.participants.filter(
        (participant) =>
          participant.hasSubmitted === true &&
          participant.phase1Score !== null &&
          Number.isInteger(participant.phase1Score)
      );

      setPlayers(eligibleParticipants);
      setTotalEligible(eligibleParticipants.length);

      setViewState("ready");
    } catch {
      setViewState("holding");
    }
  };

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  const finalists = useMemo<LeaderboardParticipant[]>(() => players.filter((player) => player.qualified).slice(0, 16), [players]);
  const leaderboard = useMemo<LeaderboardParticipant[]>(() => players, [players]);

  if (viewState === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,#3a2417_0%,#22150f_55%,#140d09_100%)]">
        <div className="rounded-2xl border-4 border-[#d6ad5f] bg-[#5b3620]/95 px-10 py-12 text-center">
          <LoadingRadar />
          <p className="text-[#e9cf9b] mt-5">Gathering the battle records...</p>
        </div>
      </div>
    );
  }

  if (viewState === "holding") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,#3a2417_0%,#22150f_55%,#140d09_100%)]">
        <div className="w-full max-w-3xl rounded-3xl border-[6px] border-[#d6ad5f] bg-gradient-to-b from-[#8a5a34] to-[#5a3922] shadow-[0_18px_0_0_#2a1a10,0_0_24px_rgba(214,173,95,0.16)] px-8 py-12 text-center">
          <div className="flex justify-center mb-5">
            <LoadingRadar />
          </div>
          <p className="text-[#f1cc7a] text-xl md:text-2xl font-cinzel animate-pulse">
            The battle is still raging... The leaderboard will appear when all warriors have finished.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full py-12 px-4 md:px-8 arena-bg-texture">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="text-center">
          <h1
            className="text-4xl md:text-6xl font-cinzel-decorative text-[#f2ca73]"
            style={{
              textShadow: "0 0 12px rgba(139,92,246,0.6), 2px 2px 0 #2e2e3a, 4px 4px 0 #1a1a2e, 6px 6px 6px rgba(0,0,0,0.75)"
            }}
          >
            SECOND YEAR STANDINGS
          </h1>
          <p className="mt-3 text-[#d6be92] tracking-[0.18em] uppercase text-sm md:text-base">
            The strongest coders have emerged from the battlefield.
          </p>
          <div className="mt-6 flex items-center justify-center gap-5 flex-wrap">
            <span className="px-4 py-2 rounded-full border border-[#d9b86c] bg-[#2a1a12]/80 text-[#f1cd79] font-cinzel text-sm md:text-base">
              {totalEligible} Warriors Completed
            </span>
          </div>
          <div className="mt-4 inline-flex items-center rounded-full border border-[#9d7a47] bg-[#2a1a12]/85 px-4 py-2 text-xs md:text-sm text-[#d6be92]">
            Only participants who completed all questions are shown.
          </div>
        </header>

        <section className="rounded-3xl border-4 border-[#d9b86c] bg-[#5b3923]/95 shadow-[0_16px_0_0_#2d1b0f] p-6 md:p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Crown className="w-8 h-8 text-[#f1cd79]" />
            <h2 className="text-3xl md:text-4xl font-cinzel text-[#f1cd79]">Grand Finalists</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalists.map((player) => {
              const isChampion = player.rank === 1;
              return (
                <div
                  key={player.usn}
                  className={`rounded-2xl border-2 p-4 md:p-5 flex items-center justify-between gap-4 bg-[#2e1d14] ${
                    isChampion
                      ? "border-[#f5d989] shadow-[inset_0_0_0_1px_rgba(245,217,137,0.45),0_0_18px_rgba(245,217,137,0.3)]"
                      : "border-[#c9a65e] shadow-[inset_0_0_0_1px_rgba(201,166,94,0.35)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[62px]">
                      {isChampion ? <Crown className="w-5 h-5 mx-auto text-[#f7dd91] mb-1" /> : null}
                      <p className={`text-[#f2cd78] font-cinzel ${isChampion ? "text-4xl" : "text-3xl"}`}>#{player.rank}</p>
                    </div>
                    <div>
                      <p className={`text-white font-cinzel ${isChampion ? "text-2xl" : "text-xl"}`}>{player.name}</p>
                      <p className="text-[#c9b084] text-xs md:text-sm tracking-wide">{player.usn}</p>
                    </div>
                  </div>

                  <p className={`text-[#f2cd78] font-cinzel ${isChampion ? "text-2xl" : "text-xl"}`}>Score: {player.phase1Score}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border-4 border-[#b69257] bg-[#4a2e1d]/95 shadow-[0_14px_0_0_#26180f] p-6 md:p-8">
          <div className="h-px w-full bg-[#9d7a47] mb-5" />
          <h3 className="text-2xl md:text-3xl font-cinzel text-[#d4b573] mb-4">All Warriors</h3>

          <div className="space-y-3">
            {leaderboard.map((player) => (
              <div
                key={player.usn}
                className="rounded-xl border border-[#87643d] bg-[#2a1a12]/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-4">
                  <p className="text-[#efc86f] font-cinzel text-xl min-w-[56px]">#{player.rank}</p>
                  <div>
                    <p className="text-white font-cinzel text-lg">{player.name}</p>
                    <p className="text-[#c9b084] text-xs md:text-sm tracking-wide">{player.usn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-[#efc86f] font-cinzel text-lg">Score: {player.phase1Score}</p>
                  {player.qualified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[#d0b068] bg-[#1f7b3f] text-white">Qualified</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border border-[#8a3d39] bg-[#6b211d] text-white">Eliminated</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center pt-4 text-[#cdb287] text-sm md:text-base flex items-center justify-center gap-2">
          <Swords className="w-4 h-4" />
          <span>Clash of Codes 2.0 · Tournament Complete</span>
          <Swords className="w-4 h-4" />
        </footer>
      </div>
    </div>
  );
};

export default LeaderboardPage;
