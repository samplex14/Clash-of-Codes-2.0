import React from "react";

const Leaderboard = ({ players, title = "Phase 1 Leaderboard" }) => {
  if (!players || players.length === 0) {
    return (
      <div className="card-clash p-8 text-center">
        <h3 className="text-2xl font-clash text-gray-400">
          No data available yet
        </h3>
      </div>
    );
  }

  return (
    <div className="card-clash w-full overflow-hidden">
      <h3 className="text-3xl font-clash text-center text-clash-gold mb-6 border-b-2 border-clash-wood pb-4">
        {title}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#4a2e1b] text-clash-gold font-clash tracking-wider">
              <th className="p-4 rounded-tl-lg">Rank</th>
              <th className="p-4">Name</th>
              <th className="p-4">USN</th>
              <th className="p-4">Track</th>
              <th className="p-4">Score</th>
              <th className="p-4 rounded-tr-lg">Time (s)</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {players.map((player, index) => {
              const rank = player.rank || index + 1;
              const score =
                player.score !== undefined ? player.score : player.phase1Score;
              const time =
                player.phase1Time !== undefined
                  ? Number(player.phase1Time)
                  : null;
              const trackLabel =
                player.track === "1st_year"
                  ? "1st Year"
                  : player.track === "2nd_year"
                    ? "2nd Year"
                    : "-";

              // Highlight top 64 if qualified
              const isQualified =
                player.phase1Qualified !== undefined
                  ? player.phase1Qualified
                  : player.qualified;

              return (
                <tr
                  key={player.usn}
                  className={`
                    border-b border-[#4a2e1b] transition-colors
                    ${index % 2 === 0 ? "bg-[#6d4427]" : "bg-[#5e3a21]"}
                    ${isQualified ? "hover:bg-[#8b5a33]" : "opacity-80 hover:opacity-100"}
                  `}
                >
                  <td className="p-4 font-clash">
                    <span
                      className={`
                      inline-block min-w-[2rem] text-center rounded
                      ${index === 0 ? "bg-yellow-400 text-yellow-900 border-2 border-yellow-200" : ""}
                      ${index === 1 ? "bg-gray-300 text-gray-800 border-2 border-white" : ""}
                      ${index === 2 ? "bg-yellow-700 text-yellow-100 border-2 border-yellow-600" : ""}
                    `}
                    >
                      #{rank}
                    </span>
                  </td>
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
                  <td className="p-4 font-clash text-clash-gold text-xl">
                    {score}
                  </td>
                  <td className="p-4 font-mono">
                    {time !== null && !Number.isNaN(time)
                      ? `${time.toFixed(1)}s`
                      : "-"}
                  </td>
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
