# Components

## app/arena/page.tsx

Single-page participant state machine.

- state: matchmakingState = 'searching' | 'found' | 'battle' | 'result'
- state: isTransitioning boolean for opacity choreography
- state: resultType = 'qualified' | 'eliminated' | null
- listens to matchmaking and phase1 socket events from mount
- triggers inline state transitions only (no route changes)

## components/Phase1QuestionPanel.tsx

Reusable battle question panel.

### Props

- questions: Phase1QuestionsEvent[]
- socket: Socket<ServerToClientEvents, ClientToServerEvents>
- onSubmit: () => void
- externallyConfirmedQuestionId?: string | null

### Internal State

- current question index
- selected answers map
- confirmed question set
- submit error
- submitting flag

### Emits

- phase1:confirm_answer
- phase1:submit

### Behavior

- lock answers per question
- submit enabled only on last question when all prior questions are confirmed
- battle-themed labels: Lock Answer, Send to Battle

## components/AdminDashboardClient.tsx

- starts/ends phase1
- fetches leaderboard
- fetches matchmaking status

## components/HomeRegisterClient.tsx

- registers participant
- routes to /arena after successful registration
