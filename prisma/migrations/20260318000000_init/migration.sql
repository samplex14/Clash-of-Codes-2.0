-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "Participant" (
    "id" SERIAL NOT NULL,
    "usn" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "phase1Score" INTEGER NOT NULL DEFAULT 0,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "isMapped" BOOLEAN NOT NULL DEFAULT false,
    "mappedTo" TEXT,
    "mappedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "socketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Question" (
    "id" SERIAL NOT NULL,
    "questionText" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctOptionId" TEXT NOT NULL,
    "matchRound" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Match" (
    "id" SERIAL NOT NULL,
    "matchRound" INTEGER NOT NULL,
    "player1USN" TEXT NOT NULL,
    "player2USN" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "winner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Phase1Session" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Phase1Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Participant_usn_key" ON "Participant"("usn");

