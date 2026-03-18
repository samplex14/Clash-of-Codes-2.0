# API Routes

## Matchmaking

- POST /api/matchmaking
  - body: { usn }
  - returns: matched with opponent or waiting status
  - side effects: may map two participants

- GET /api/matchmaking/status?usn=...
  - returns: { isMapped, mappedTo, opponentName }

## Tournament

- GET /api/tournament/state
  - returns: { phase1Active, leaderboardVisible }

- POST /api/tournament/start
  - returns: { success, phase1Active }
  - side effects: idempotently activates phase and preloads ParticipantSession rows

- GET /api/tournament/status
  - returns: { submitted, total, allDone, leaderboardVisible }
  - side effects: when allDone and not qualified yet, computes Top 8 and reveals leaderboard

## Phase 1

- GET /api/phase1/questions?usn=...
  - returns: shuffled questions without correct answers
  - side effects: creates ParticipantSession if missing

- POST /api/phase1/confirm
  - body: { usn, questionId, selectedOptionId }
  - returns: updated confirmedAnswers map
  - side effects: persists answer lock in ParticipantSession.confirmedAnswers

- POST /api/phase1/submit
  - body: { usn, lastQuestionId, lastSelectedOptionId }
  - returns: { success, score, total }
  - validates all previous questions are confirmed
  - side effects: stores final score and submission flags

## Leaderboard

- GET /api/leaderboard
  - gated until TournamentState.leaderboardVisible is true
  - returns ranked participants with qualified flags

## Participants

- POST /api/participants/register
  - body: { usn, name, year }
  - returns created participant

- GET /api/participants/[usn]
  - returns participant record
