import React from "react";
import LoadingRadar from "@/components/ui/loading-radar";

export interface LeaderboardPlayer {
  rank?: number;
  usn: string;
  name: string;
  score?: number;
  track?: string;
  qualified?: boolean;
  phase1Score?: number;
  phase1Qualified?: boolean;
  hasSubmitted?: true;
}

interface LeaderboardProps {
  players: LeaderboardPlayer[];
  title?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players, title = "Phase 1 Leaderboard" }) => {
  // Submitted-only leaderboard rule safety net: never render rows that are not fully submitted.
  const completedPlayers = players.filter(
    (player) => player.hasSubmitted === true && typeof player.phase1Score === "number" && Number.isInteger(player.phase1Score)
  );

  if (completedPlayers.length === 0) {
    return (
      <div className="card-clash p-8 text-center">
        <div className="flex justify-center mb-4">
          <LoadingRadar />
        </div>
        <h3 className="text-xl font-clash text-[#d6be92]">
          No warriors have completed the battle yet. The leaderboard will populate as submissions arrive.
        </h3>
      </div>
    );
  }

  return (
    <div className="card-clash w-full overflow-hidden">
      <h3 className="text-3xl font-clash text-center text-clash-gold mb-6 border-b-2 border-clash-wood pb-4">{title}</h3>
      <p className="text-center text-sm text-[#d6be92] mb-4">Showing completed submissions only</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#4a2e1b] text-clash-gold font-clash tracking-wider">
              <th className="p-4 rounded-tl-lg">Rank</th>
              <th className="p-4">Name</th>
              <th className="p-4">USN</th>
              <th className="p-4">Track</th>
              <th className="p-4 rounded-tr-lg">Score</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {completedPlayers.map((player, index) => {
              const rank = player.rank ?? index + 1;
              const score = player.score ?? player.phase1Score ?? 0;
              const isQualified = player.qualified ?? player.phase1Qualified ?? false;
              const trackLabel =
                player.track === "1st_year" ? "1st Year" : player.track === "2nd_year" ? "2nd Year" : "-";

              return (
                <tr
                  key={player.usn}
                  className={`border-b border-[#4a2e1b] transition-colors ${
                    index % 2 === 0 ? "bg-[#6d4427]" : "bg-[#5e3a21]"
                  } ${isQualified ? "hover:bg-[#8b5a33]" : "opacity-80 hover:opacity-100"}`}
                >
                  <td className="p-4 font-clash">#{rank}</td>
                  <td className="p-4 font-bold">
                    {player.name}
                    {isQualified && (
                      <span className="ml-2 text-xs bg-clash-green text-white px-2 py-1 rounded border border-[#166534]">
                        QUALIFIED
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-sm">{player.usn}</td>
                  <td className="p-4 text-gray-300">{trackLabel}</td>
                  <td className="p-4 font-clash text-clash-gold text-xl">{score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
