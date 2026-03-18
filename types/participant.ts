import type { Participant as PrismaParticipant } from "@prisma/client";

export interface Participant extends PrismaParticipant {
	isMapped: boolean;
	mappedTo: string | null;
	mappedAt: Date | null;
}
