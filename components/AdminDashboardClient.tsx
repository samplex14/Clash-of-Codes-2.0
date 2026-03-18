"use client";

// Phase 2 has been removed; only Phase 1 logic is active.
import React, { useEffect, useState } from "react";
import Leaderboard, { type LeaderboardPlayer } from "@/components/Leaderboard";
import LoadingCard from "@/components/LoadingCard";
import { apiRequest } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

interface SessionStatusResponse {
  status: string;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardPlayer[];
}

interface MatchmakingStatusResponse {
  mappedCount: number;
  waitingCount: number;
  pairs: Array<{
    playerAUSN: string;
    playerAName: string;
    playerBUSN: string;
    playerBName: string;
  }>;
}

const AdminDashboardClient: React.FC = () => {
  const { socket } = useSocket("/phase1");
  const [token, setToken] = useState<string>("");
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [phase1Status, setPhase1Status] = useState<string>("idle");
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [matchmakingStatus, setMatchmakingStatus] = useState<MatchmakingStatusResponse | null>(null);

  useEffect(() => {
    const cached = window.localStorage.getItem("adminToken");
    if (cached) {
      setToken(cached);
      setAuthenticated(true);
    }
  }, []);

  const getHeaders = (): HeadersInit => ({
    "x-admin-token": token
  });

  const fetchStatus = async (): Promise<void> => {
    const response = await apiRequest<SessionStatusResponse>("/api/admin/phase1/status", {
      headers: getHeaders()
    });
    setPhase1Status(response.status);
  };

  const fetchLeaderboard = async (): Promise<void> => {
    const response = await apiRequest<LeaderboardResponse>("/api/phase1/leaderboard", {
      headers: getHeaders()
    });
    setLeaderboard(response.leaderboard);
  };

  const fetchMatchmakingStatus = async (): Promise<void> => {
    const response = await apiRequest<MatchmakingStatusResponse>("/api/admin/matchmaking-status", {
      headers: getHeaders()
    });

    setMatchmakingStatus(response);
  };

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    const run = async (): Promise<void> => {
      setLoading(true);
      try {
        await Promise.all([fetchStatus(), fetchLeaderboard(), fetchMatchmakingStatus()]);
      } finally {
        setLoading(false);
      }
    };

    void run();

    const interval = window.setInterval(() => {
      void fetchStatus();
      void fetchLeaderboard();
      void fetchMatchmakingStatus();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [authenticated]);

  const onLogin = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    window.localStorage.setItem("adminToken", token);
    setAuthenticated(true);
  };

  const startPhase1 = async (): Promise<void> => {
    try {
      await apiRequest("/api/admin/phase1/start", {
        method: "POST",
        headers: getHeaders()
      });

      if (socket) {
        socket.emit("phase1:start", { adminToken: token }, (response) => {
          if (!response.ok) {
            window.alert(response.error ?? "Error pushing questions via socket");
          }
        });
      }

      setPhase1Status("active");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to start phase";
      window.alert(message);
    }
  };

  const endPhase1 = async (): Promise<void> => {
    if (!window.confirm("Are you sure you want to end Phase 1? This will lock submissions and compute the Top 8 qualifiers.")) {
      return;
    }

    if (!socket) {
      window.alert("Phase 1 socket is not connected. Please retry.");
      return;
    }

    socket.emit("phase1:end", { adminToken: token }, async (response) => {
      if (!response.ok) {
        window.alert(response.error ?? "Unknown error ending Phase 1");
        return;
      }

      setPhase1Status("ended");
      await Promise.all([fetchLeaderboard(), fetchMatchmakingStatus()]);
    });
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="card-clash max-w-sm w-full">
          <h2 className="text-3xl font-clash text-center text-clash-gold mb-6 border-b-2 border-clash-wood pb-2">Town Hall Access</h2>
          <form onSubmit={onLogin} className="space-y-4">
            <input
              type="password"
              className="input-clash w-full text-center"
              placeholder="Admin Secret"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
            <button type="submit" className="btn-clash w-full py-3">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingCard message="Accessing Command Center..." subMessage="Verifying credentials..." />;
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] w-full max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between w-full mb-4 pr-2">
        <h2 className="text-4xl font-clash text-clash-gold drop-shadow-md">Admin Town Hall</h2>
        <button
          type="button"
          onClick={() => {
            setAuthenticated(false);
            window.localStorage.removeItem("adminToken");
          }}
          className="bg-clash-wood border-2 border-clash-dark text-white px-4 py-2 font-bold rounded hover:bg-clash-woodlight transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="card-clash border-t-8 border-t-clash-green w-full">
        <h3 className="text-2xl font-clash text-white mb-2">Phase 1 Control</h3>
        <p className="text-gray-300 font-medium mb-6 border-b-2 border-[#4a2e1b] pb-4">
          Status: <span className="font-clash text-xl tracking-wider uppercase ml-2 text-clash-gold">{phase1Status}</span>
        </p>

        <div className="flex gap-4">
          {phase1Status !== "active" ? (
            <button type="button" onClick={() => void startPhase1()} className="btn-clash flex-1 shrink-0">
              Start Phase 1
            </button>
          ) : (
            <button type="button" onClick={() => void endPhase1()} className="btn-clash-danger flex-1 shrink-0">
              End Phase 1
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void fetchStatus();
              void fetchLeaderboard();
              void fetchMatchmakingStatus();
            }}
            className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-4 rounded-lg shadow-sm hover:bg-clash-wood transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="w-full">
        <Leaderboard players={leaderboard} />
      </div>

      <div className="card-clash w-full border-t-8 border-t-clash-gold">
        <h3 className="text-2xl font-clash text-white mb-4">Matchmaking Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-clash-wood border-2 border-[#4a2e1b] rounded-lg p-4">
            <p className="text-sm text-gray-300">Mapped Participants</p>
            <p className="text-3xl font-clash text-clash-gold">{matchmakingStatus?.mappedCount ?? 0}</p>
          </div>
          <div className="bg-clash-wood border-2 border-[#4a2e1b] rounded-lg p-4">
            <p className="text-sm text-gray-300">Waiting For Opponent</p>
            <p className="text-3xl font-clash text-clash-gold">{matchmakingStatus?.waitingCount ?? 0}</p>
          </div>
          <div className="bg-clash-wood border-2 border-[#4a2e1b] rounded-lg p-4">
            <p className="text-sm text-gray-300">Total Pairs</p>
            <p className="text-3xl font-clash text-clash-gold">{matchmakingStatus?.pairs.length ?? 0}</p>
          </div>
        </div>

        <h4 className="text-xl font-clash text-clash-gold mb-3">Current Pairs</h4>
        <div className="overflow-x-auto rounded-lg border-2 border-[#4a2e1b]">
          <table className="w-full text-left">
            <thead className="bg-clash-wood">
              <tr>
                <th className="px-3 py-2 text-sm text-gray-200">Player A USN</th>
                <th className="px-3 py-2 text-sm text-gray-200">Player A Name</th>
                <th className="px-3 py-2 text-sm text-gray-200">Player B USN</th>
                <th className="px-3 py-2 text-sm text-gray-200">Player B Name</th>
              </tr>
            </thead>
            <tbody>
              {(matchmakingStatus?.pairs ?? []).map((pair) => (
                <tr key={`${pair.playerAUSN}-${pair.playerBUSN}`} className="border-t border-[#4a2e1b]">
                  <td className="px-3 py-2 text-sm text-white">{pair.playerAUSN}</td>
                  <td className="px-3 py-2 text-sm text-white">{pair.playerAName}</td>
                  <td className="px-3 py-2 text-sm text-white">{pair.playerBUSN}</td>
                  <td className="px-3 py-2 text-sm text-white">{pair.playerBName}</td>
                </tr>
              ))}
              {matchmakingStatus && matchmakingStatus.pairs.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-sm text-gray-300" colSpan={4}>
                    No complete pairs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardClient;
