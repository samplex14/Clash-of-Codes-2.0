# API Routes and Socket Surface

## REST Routes

### Public

- GET /api/health
- POST /api/participants/register
- GET /api/participants/[usn]
- GET /api/phase1/status
- GET /api/phase1/questions
- POST /api/phase1/submit
- GET /api/phase1/leaderboard
- GET /api/leaderboard
- POST /api/matchmaking

### Admin

- GET /api/admin/participants
- GET /api/admin/participants/qualified
- GET /api/admin/phase1/status
- POST /api/admin/phase1/start
- POST /api/admin/phase1/end
- GET /api/admin/phase1/questions
- POST /api/admin/phase1/questions
- DELETE /api/admin/phase1/questions/[id]
- GET /api/admin/matchmaking-status

## Socket Namespace

- Namespace: /phase1
- Arena page now listens for phase1:questions and transitions inline to battle UI.
- No client navigation occurs in response to phase1:questions.
