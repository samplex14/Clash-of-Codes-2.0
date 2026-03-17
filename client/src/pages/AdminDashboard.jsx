import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useSocket } from "../hooks/useSocket";
import Leaderboard from "../components/Leaderboard";

const AdminDashboard = () => {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Phase 1 specific state
  const [phase1Status, setPhase1Status] = useState("idle"); // idle, active, ended
  const [leaderboard, setLeaderboard] = useState([]);
  const [matchmakingPairs, setMatchmakingPairs] = useState([]);
  const [phase2Locked, setPhase2Locked] = useState(false);
  const [phase2Generating, setPhase2Generating] = useState(false);
  const [phase2Finalists, setPhase2Finalists] = useState([]);
  const { socket } = useSocket("/phase1");

  // Phase 1 control functions
  const fetchPhase1Status = async () => {
    try {
      const res = await api.get("/admin/phase1/status", {
        headers: { "x-admin-token": token },
      });
      setPhase1Status(res.data.status);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) setIsAuthenticated(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get("/phase1/leaderboard", {
        headers: { "x-admin-token": token },
      });
      setLeaderboard(res.data);
    } catch (err) {
      console.error("Failed to get leaderboard", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhase1Status();
      fetchLeaderboard();
      // Poll leaderboard
      const interval = setInterval(fetchLeaderboard, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!socket) return;

    const handleMatchmakingReady = ({ pairs }) => {
      setMatchmakingPairs(Array.isArray(pairs) ? pairs : []);
      setPhase2Generating(false);
    };

    const handlePhase2Started = () => {
      setPhase2Locked(true);
      setPhase2Generating(false);
    };

    const handlePhase2Complete = ({ players }) => {
      setPhase2Finalists(Array.isArray(players) ? players : []);
      setPhase2Generating(false);
    };

    const handleFinalLeaderboard = ({ players }) => {
      setPhase2Finalists(Array.isArray(players) ? players : []);
    };

    socket.on("phase2:matchmaking_ready", handleMatchmakingReady);
    socket.on("phase2:started", handlePhase2Started);
    socket.on("phase2:complete", handlePhase2Complete);
    socket.on("phase2:final_leaderboard", handleFinalLeaderboard);

    return () => {
      socket.off("phase2:matchmaking_ready", handleMatchmakingReady);
      socket.off("phase2:started", handlePhase2Started);
      socket.off("phase2:complete", handlePhase2Complete);
      socket.off("phase2:final_leaderboard", handleFinalLeaderboard);
    };
  }, [socket]);

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem("adminToken", token);
    setIsAuthenticated(true);
  };

  const startPhase1 = async () => {
    try {
      // Still call REST to maintain DB state history if needed, though Socket.IO handles the active session
      await api.post(
        "/admin/phase1/start",
        {},
        { headers: { "x-admin-token": token } },
      );

      // Critical: Tell Socket.IO to start pushing questions to everyone
      if (socket) {
        socket.emit("phase1:start", { adminToken: token }, (res) => {
          if (res && res.error) {
            console.error("Socket start error:", res.error);
            alert("Error pushing questions via socket: " + res.error);
          } else {
            console.log(
              `Socket started successfully: ${res.questionCount} questions to ${res.participantCount} users`,
            );
          }
        });
      }

      setPhase1Status("active");
    } catch (err) {
      alert(
        "Error starting phase 1: " + (err.response?.data?.error || err.message),
      );
    }
  };

  const endPhase1 = async () => {
    if (
      !window.confirm(
        "Are you sure you want to end Phase 1? This will lock submissions and compute the top 64.",
      )
    )
      return;
    try {
      if (!socket) {
        alert("Phase 1 socket is not connected. Please retry.");
        return;
      }

      socket.emit("phase1:end", { adminToken: token }, async (res) => {
        if (!res?.ok) {
          alert("Error ending phase 1: " + (res?.error || "Unknown error"));
          return;
        }

        setPhase1Status("ended");
        setPhase2Locked(false);
        await fetchLeaderboard();
      });
    } catch (err) {
      alert(
        "Error ending phase 1: " + (err.response?.data?.error || err.message),
      );
    }
  };

  const generateMatchmaking = () => {
    if (!socket) {
      alert("Phase 1 socket is not connected. Please retry.");
      return;
    }

    setPhase2Generating(true);
    socket.emit("phase2:generate_matchmaking", { adminToken: token }, (res) => {
      if (!res?.ok) {
        setPhase2Generating(false);
        alert(
          "Failed to generate matchmaking: " + (res?.error || "Unknown error"),
        );
        return;
      }

      setMatchmakingPairs(Array.isArray(res.pairs) ? res.pairs : []);
      setPhase2Generating(false);
    });
  };

  const startPhase2 = () => {
    if (!socket) {
      alert("Phase 1 socket is not connected. Please retry.");
      return;
    }

    socket.emit("phase2:start", { adminToken: token }, (res) => {
      if (!res?.ok) {
        alert("Failed to start Phase 2: " + (res?.error || "Unknown error"));
        return;
      }

      setPhase2Locked(true);
    });
  };

  const refreshPhase2Leaderboard = () => {
    if (!socket) {
      alert("Phase 1 socket is not connected. Please retry.");
      return;
    }

    socket.emit("phase2:refresh_leaderboard", { adminToken: token }, (res) => {
      if (!res?.ok) {
        alert(
          "Failed to refresh Phase 2 leaderboard: " +
            (res?.error || "Unknown error"),
        );
        return;
      }

      setPhase2Finalists(Array.isArray(res.players) ? res.players : []);
    });
  };

  const endPhase2 = () => {
    if (!socket) {
      alert("Phase 1 socket is not connected. Please retry.");
      return;
    }

    socket.emit("phase2:end", { adminToken: token }, (res) => {
      if (!res?.ok) {
        alert("Failed to end Phase 2: " + (res?.error || "Unknown error"));
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="card-clash max-w-sm w-full">
          <h2 className="text-3xl font-clash text-center text-clash-gold mb-6 border-b-2 border-clash-wood pb-2">
            Town Hall Access
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="input-clash w-full text-center"
              placeholder="Admin Secret"
              value={token}
              onChange={(e) => setToken(e.target.value)}
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

  return (
    <div className="flex flex-col items-center min-h-[80vh] w-full max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between w-full mb-4 pr-2">
        <h2 className="text-4xl font-clash text-clash-gold drop-shadow-md">
          Admin Town Hall
        </h2>
        <button
          onClick={() => {
            setIsAuthenticated(false);
            localStorage.removeItem("adminToken");
          }}
          className="bg-clash-wood border-2 border-clash-dark text-white px-4 py-2 font-bold rounded hover:bg-clash-woodlight transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Phase 1 Panel */}
        <div className="card-clash border-t-8 border-t-clash-green">
          <h3 className="text-2xl font-clash text-white mb-2">
            Phase 1 Control
          </h3>
          <p className="text-gray-300 font-medium mb-6 border-b-2 border-[#4a2e1b] pb-4">
            Status:{" "}
            <span className="font-clash text-xl tracking-wider uppercase ml-2 text-clash-gold">
              {phase1Status}
            </span>
          </p>

          <div className="flex gap-4">
            {phase1Status !== "active" ? (
              <button
                onClick={startPhase1}
                className="btn-clash flex-1 shrink-0"
              >
                Start Phase 1
              </button>
            ) : (
              <button
                onClick={endPhase1}
                className="btn-clash-danger flex-1 shrink-0"
              >
                End Phase 1
              </button>
            )}

            <button className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-4 rounded-lg shadow-sm hover:bg-clash-wood transition-colors">
              Refresh
            </button>
          </div>
        </div>

        <div className="card-clash border-t-8 border-t-clash-elixir">
          <h3 className="text-2xl font-clash text-white mb-2">
            Phase 2 Matrix
          </h3>
          <p className="text-gray-300 font-medium mb-6 border-b-2 border-[#4a2e1b] pb-4">
            Status:{" "}
            <span className="font-clash text-xl tracking-wider uppercase ml-2 text-clash-gold">
              {phase2Locked ? "LOCKED" : "READY"}
            </span>
          </p>
          <div className="flex gap-4">
            <button
              onClick={generateMatchmaking}
              disabled={
                phase2Locked || phase2Generating || phase1Status !== "ended"
              }
              className="btn-clash flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phase2Generating ? "Generating..." : "Refresh Matchmaking"}
            </button>
            <button
              onClick={startPhase2}
              disabled={phase2Locked || matchmakingPairs.length === 0}
              className="bg-clash-green text-white font-bold border-2 border-green-700 px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Phase 2
            </button>
            <button
              onClick={refreshPhase2Leaderboard}
              className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-4 rounded-lg shadow-sm"
            >
              Refresh Final 8
            </button>
            <button
              onClick={endPhase2}
              className="btn-clash-danger"
            >
              Phase 2 Over
            </button>
          </div>
        </div>
      </div>

      <div className="card-clash w-full overflow-hidden">
        <h3 className="text-3xl font-clash text-center text-clash-gold mb-6 border-b-2 border-clash-wood pb-4">
          Phase 2 Matchmaking Leaderboard
        </h3>
        {matchmakingPairs.length === 0 ? (
          <div className="p-6 text-center text-gray-300">
            Generate matchmaking after ending Phase 1 to view 32 random pairs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#4a2e1b] text-clash-gold font-clash tracking-wider">
                  <th className="p-4 rounded-tl-lg">Pair</th>
                  <th className="p-4">Player 1</th>
                  <th className="p-4">USN</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Player 2</th>
                  <th className="p-4">USN</th>
                  <th className="p-4 rounded-tr-lg">Score</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {matchmakingPairs.map((pair, index) => {
                  const p1 = pair.players?.[0];
                  const p2 = pair.players?.[1];
                  return (
                    <tr
                      key={pair.pairNumber}
                      className={`border-b border-[#4a2e1b] ${index % 2 === 0 ? "bg-[#6d4427]" : "bg-[#5e3a21]"}`}
                    >
                      <td className="p-4 font-clash">Pair {pair.pairNumber}</td>
                      <td className="p-4 font-bold">{p1?.name || "-"}</td>
                      <td className="p-4 font-mono text-sm">
                        {p1?.usn || "-"}
                      </td>
                      <td className="p-4 font-clash text-clash-gold text-xl">
                        {p1?.phase1Score ?? "-"}
                      </td>
                      <td className="p-4 font-bold">{p2?.name || "-"}</td>
                      <td className="p-4 font-mono text-sm">
                        {p2?.usn || "-"}
                      </td>
                      <td className="p-4 font-clash text-clash-gold text-xl">
                        {p2?.phase1Score ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-clash w-full overflow-hidden">
        <h3 className="text-3xl font-clash text-center text-clash-gold mb-6 border-b-2 border-clash-wood pb-4">
          Phase 2 Finalists Leaderboard
        </h3>
        {phase2Finalists.length === 0 ? (
          <div className="p-6 text-center text-gray-300">
            Final leaderboard appears after 8 players remain.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#4a2e1b] text-clash-gold font-clash tracking-wider">
                  <th className="p-4 rounded-tl-lg">Rank</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">USN</th>
                  <th className="p-4">Phase 2 Wins</th>
                  <th className="p-4">Phase 2 Score</th>
                  <th className="p-4 rounded-tr-lg">Phase 1 Score</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {phase2Finalists.map((p, idx) => (
                  <tr
                    key={p.usn}
                    className={`border-b border-[#4a2e1b] ${idx % 2 === 0 ? "bg-[#6d4427]" : "bg-[#5e3a21]"}`}
                  >
                    <td className="p-4 font-clash">#{idx + 1}</td>
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 font-mono text-sm">{p.usn}</td>
                    <td className="p-4 font-clash text-clash-gold text-xl">{p.phase2Wins ?? 0}</td>
                    <td className="p-4 font-clash text-clash-gold text-xl">{p.phase2TotalScore ?? 0}</td>
                    <td className="p-4 font-clash text-clash-gold text-xl">{p.phase1Score ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="w-full">
        <Leaderboard players={leaderboard} />
      </div>
    </div>
  );
};

export default AdminDashboard;
