"use client";

import React, { useEffect, useState } from "react";
import Leaderboard, { type LeaderboardPlayer } from "@/components/Leaderboard";
import LoadingCard from "@/components/LoadingCard";
import { apiRequest } from "@/lib/api";

interface LeaderboardResponse {
  leaderboard: LeaderboardPlayer[];
}

const LeaderboardPage: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const response = await apiRequest<LeaderboardResponse>("/api/phase1/leaderboard");
        setPlayers(response.leaderboard);
      } catch (requestError: unknown) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return <LoadingCard message="Gathering Leaderboard..." />;
  }

  if (error) {
    return (
      <div className="card-clash text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-clash text-clash-red mb-4">Leaderboard Unavailable</h2>
        <p className="text-white">{error}</p>
      </div>
    );
  }

  return <Leaderboard players={players} title="Phase 1 Leaderboard" />;
};

export default LeaderboardPage;
