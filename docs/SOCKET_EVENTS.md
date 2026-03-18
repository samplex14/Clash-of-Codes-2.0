# Socket Events

## Namespace

- /phase1

## Client -> Server

- matchmaking:enter_arena
  - payload: { usn: string }
  - handled by: lib/socketHandler.ts

- matchmaking:find_opponent
  - payload: { usn: string }
  - handled by: lib/socketHandler.ts

- phase1:start
  - payload: { adminToken: string }
  - emitted by: admin dashboard

- phase1:end
  - payload: { adminToken: string }
  - emitted by: admin dashboard

- phase1:confirm_answer
  - payload: { questionId: string, selectedOptionId: string }
  - emitted by: Phase1QuestionPanel

- phase1:submit
  - payload: { questionId: string, selectedOptionId: string }
  - emitted by: Phase1QuestionPanel

## Server -> Client

- matchmaking:searching
  - payload: { message: string }
  - consumed by: app/arena/page.tsx

- matchmaking:waiting_in_queue
  - payload: { message: string }
  - consumed by: app/arena/page.tsx

- matchmaking:opponent_found
  - payload: { opponentName: string, opponentUSN: string, matchedAt: string }
  - consumed by: app/arena/page.tsx

- matchmaking:timeout
  - payload: { ghostOpponent: { name: string, usn: string } }
  - consumed by: app/arena/page.tsx

- phase1:started
  - signal event

- phase1:questions
  - payload: Phase1QuestionsEvent[]
  - consumed by: app/arena/page.tsx
  - behavior: triggers inline found -> battle transition without navigation

- phase1:answer_confirmed
  - payload: { questionId: string }
  - consumed by: app/arena/page.tsx and forwarded into Phase1QuestionPanel

- phase1:submit_error
  - payload: { message: string, missingQuestions: string[] }
  - consumed by: Phase1QuestionPanel

- phase1:result
  - payload: { score: number, total: number, qualified?: boolean, rank?: number, breakdown: [...] }
  - consumed by: app/arena/page.tsx
  - behavior: triggers inline transition to result state

- phase1:qualified
  - payload: { usn: string, name: string, rank: number, score: number }
  - consumed by: app/arena/page.tsx

- phase1:eliminated
  - payload: { usn: string, name: string, rank: number, score: number }
  - consumed by: app/arena/page.tsx

- phase3:start
  - signal event for finalists
