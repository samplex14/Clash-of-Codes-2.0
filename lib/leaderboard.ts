import { db } from "@/lib/db";

export interface LeaderboardEntry {
  rank: number;
  usn: string;
  name: string;
  score: number;
  track: string;
  qualified: boolean;
}

export const buildPhase1Leaderboard = async (qualifiedOnly: boolean): Promise<LeaderboardEntry[]> => {
  const participants = await db.participant.findMany({
    orderBy: [{ phase1Score: "desc" }, { submittedAt: "asc" }, { id: "asc" }]
  });

  const ranked = participants.map((participant, index) => ({
    rank: index + 1,
    usn: participant.usn,
    name: participant.name,
    score: participant.phase1Score,
    track: participant.track,
    qualified: participant.qualified
  }));

  if (!qualifiedOnly) {
    return ranked;
  }

  return ranked.filter((participant) => participant.qualified);
};
