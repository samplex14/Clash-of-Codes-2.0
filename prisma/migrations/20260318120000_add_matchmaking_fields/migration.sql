-- Add matchmaking illusion fields for participant mapping
ALTER TABLE "Participant"
ADD COLUMN IF NOT EXISTS "isMapped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "mappedTo" TEXT,
ADD COLUMN IF NOT EXISTS "mappedAt" TIMESTAMP(3);
