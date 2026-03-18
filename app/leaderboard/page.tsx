"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Crown } from "lucide-react";
import LoadingRadar from "@/components/ui/loading-radar";
import { apiRequest } from "@/lib/api";

interface LeaderboardEntry {
  rank: number;
  usn: string;
  name: string;
  score: number;
  qualified: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

interface TournamentStateResponse {
  phase1Active: boolean;
  leaderboardVisible: boolean;
}

const LeaderboardPage: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visible, setVisible] = useState<boolean>(false);

  const loadLeaderboard = async (): Promise<void> => {
    try {
      const response = await apiRequest<LeaderboardResponse>("/api/leaderboard");
      setPlayers(response.leaderboard);
      setVisible(true);
      setLoading(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.toLowerCase().includes("leaderboard locked")) {
        setVisible(false);
        setLoading(false);
        return;
      }

      setVisible(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  useEffect(() => {
    if (visible) {
      return;
    }

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const state = await apiRequest<TournamentStateResponse>("/api/tournament/state");
          if (state.leaderboardVisible) {
            await loadLeaderboard();
          }
        } catch {
          // continue polling
        }
      })();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [visible]);

  const topEight = useMemo<LeaderboardEntry[]>(() => players.filter((player) => player.qualified).slice(0, 8), [players]);
  const others = useMemo<LeaderboardEntry[]>(() => players.filter((player) => !player.qualified), [players]);

  if (loading) {
    return (
      <div className="card-clash max-w-3xl mx-auto text-center py-12">
        <LoadingRadar />
        <p className="text-[#f2d081] mt-4">Gathering the war chronicles...</p>
      </div>
    );
  }

  if (!visible) {
    return (
      <div className="card-clash max-w-3xl mx-auto text-center py-12">
        <LoadingRadar />
        <h2 className="text-4xl font-clash text-clash-gold mb-4">The battle is still raging... Check back when the dust settles.</h2>
        <p className="text-[#e4cf9f]">Scouts refresh every 5 seconds.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="card-clash text-center">
        <h1 className="text-4xl md:text-5xl text-clash-gold font-serif">The Dust Has Settled. The Warriors Have Spoken.</h1>
        <p className="text-[#dbc69c] mt-2">Final Standings</p>
      </div>

      <section className="card-clash border-4 border-[#e2bf6e]">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-7 h-7 text-[#f0cc78]" />
          <h2 className="text-3xl font-clash text-[#f0cc78]">Top 8 Grand Finalists</h2>
        </div>
        <div className="space-y-3">
          {topEight.map((player) => (
            <div key={player.usn} className="rounded-lg border-2 border-[#d8b46b] bg-[#4a2d1b] p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[#f6da97] font-bold text-xl">#{player.rank} {player.name}</p>
                <p className="text-[#f2ddb1] font-mono">{player.usn}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[#f8de9c] font-bold">Score: {player.score}</p>
                <span className="px-2 py-1 rounded border border-[#2b7a3f] bg-[#1f7f47] text-white text-xs font-bold">Grand Finalist</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-clash">
        <h3 className="text-2xl font-clash text-[#cdb58a] mb-4">Remaining Warriors</h3>
        <div className="space-y-2">
          {others.map((player) => (
            <div key={player.usn} className="rounded-lg border border-[#6a4a31] bg-[#3d2718] p-3 flex items-center justify-between">
              <p className="text-[#d4c2a0]">#{player.rank} {player.name} ({player.usn})</p>
              <p className="text-[#cfb58a]">Score: {player.score}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LeaderboardPage;
