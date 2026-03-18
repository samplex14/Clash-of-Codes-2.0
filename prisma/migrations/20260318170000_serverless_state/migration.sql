-- Serverless tournament state and participant session storage
CREATE TABLE IF NOT EXISTS "TournamentState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "phase1Active" BOOLEAN NOT NULL DEFAULT false,
    "phase1StartedAt" TIMESTAMP(3),
    "phase1EndedAt" TIMESTAMP(3),
    "leaderboardVisible" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TournamentState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ParticipantSession" (
    "id" SERIAL NOT NULL,
    "usn" TEXT NOT NULL,
    "shuffledQuestionIds" JSONB NOT NULL,
    "confirmedAnswers" JSONB NOT NULL DEFAULT '{}',
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "hasSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParticipantSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantSession_usn_key" ON "ParticipantSession"("usn");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ParticipantSession_usn_fkey'
  ) THEN
    ALTER TABLE "ParticipantSession"
    ADD CONSTRAINT "ParticipantSession_usn_fkey"
    FOREIGN KEY ("usn") REFERENCES "Participant"("usn") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
