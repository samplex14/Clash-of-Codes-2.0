# Database Schema

## Participant

- id: Int, primary key
- usn: String, unique warrior identifier
- name: String
- track: String (1st_year or 2nd_year)
- phase1Score: Int, battle score
- qualified: Boolean, Top 8 flag
- isMapped: Boolean, matchmaking completion flag
- mappedTo: String?, rival USN or waiting marker
- mappedAt: DateTime?, mapping timestamp
- submittedAt: DateTime?, submission timestamp
- createdAt: DateTime
- updatedAt: DateTime

## TournamentState

Single-row global phase state.

- id: Int, primary key default 1
- phase1Active: Boolean
- phase1StartedAt: DateTime?
- phase1EndedAt: DateTime?
- leaderboardVisible: Boolean
- updatedAt: DateTime

## ParticipantSession

Per-warrior Phase 1 serverless session state.

- id: Int, primary key
- usn: String, unique, relation to Participant.usn
- shuffledQuestionIds: Json, question order array
- confirmedAnswers: Json, map of questionId to optionId
- currentQuestionIndex: Int
- hasSubmitted: Boolean
- submittedAt: DateTime?
- createdAt: DateTime

## Question

- id: Int, primary key
- questionText: String
- options: Json
- correctOptionId: String
- matchRound: Int?
- createdAt: DateTime

## Match

- id: Int, primary key
- matchRound: Int
- player1USN: String
- player2USN: String
- status: String
- winner: String?
- createdAt: DateTime
- updatedAt: DateTime

## Phase1Session

Legacy model retained for compatibility but not used in serverless flow.
