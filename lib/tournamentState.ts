import { db } from "@/lib/db";

export const TOURNAMENT_STATE_ID = 1;

export const getOrCreateTournamentState = async () => {
  return db.tournamentState.upsert({
    where: { id: TOURNAMENT_STATE_ID },
    update: {},
    create: {
      id: TOURNAMENT_STATE_ID,
      phase1Active: false,
      leaderboardVisible: false
    }
  });
};

export const setPhase1Active = async (): Promise<void> => {
  await db.tournamentState.upsert({
    where: { id: TOURNAMENT_STATE_ID },
    update: {
      phase1Active: true,
      phase1StartedAt: new Date()
    },
    create: {
      id: TOURNAMENT_STATE_ID,
      phase1Active: true,
      phase1StartedAt: new Date(),
      leaderboardVisible: false
    }
  });
};

export const setLeaderboardVisible = async (): Promise<void> => {
  await db.tournamentState.update({
    where: { id: TOURNAMENT_STATE_ID },
    data: {
      leaderboardVisible: true,
      phase1Active: false,
      phase1EndedAt: new Date()
    }
  });
};
