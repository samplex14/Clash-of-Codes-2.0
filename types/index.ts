export * from "@/types/participant";
export * from "@/types/question";
export * from "@/types/match";

export type MatchmakingState = "searching" | "found" | "battle" | "waiting" | "result";

export interface TournamentStatusResponse {
	submitted: number;
	total: number;
	allDone: boolean;
	leaderboardVisible: boolean;
}

export interface LeaderboardParticipant {
	rank: number;
	name: string;
	usn: string;
	phase1Score: number;
	qualified: boolean;
	hasSubmitted: true;
	submittedAt: string;
}

export interface LeaderboardResponse {
	visible: boolean;
	participants: LeaderboardParticipant[];
	totalEligible: number;
	totalRegistered: number;
	message?: string;
}

export interface Phase1SubmitResponse {
	success: boolean;
	score: number;
	total: number;
	year: string;
}
