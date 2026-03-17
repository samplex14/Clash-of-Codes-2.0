# API Routes & Socket Events

## REST API

### Health
- `GET /api/health`

### Participants
- `POST /api/participants/register` - Register a participant.
- `GET /api/participants/:usn` - Get participant by USN.
- `GET /api/admin/participants` - (Admin) List all participants.
- `GET /api/admin/participants/qualified` - (Admin) Qualified list.

### Phase 1
- `POST /api/admin/phase1/start` - (Admin) Start Phase 1.
- `POST /api/admin/phase1/end` - (Admin) End Phase 1.
- `GET /api/admin/phase1/status` - (Admin) Current session status.
- `GET /api/phase1/status` - Public phase status.
- `GET /api/phase1/questions` - Active questions (no answers exposed).
- `POST /api/phase1/submit` - Submit Phase 1 answers.
- `GET /api/phase1/leaderboard` - Leaderboard.

### Question Management (Admin)
- `POST /api/admin/phase1/questions`
- `GET /api/admin/phase1/questions`
- `DELETE /api/admin/phase1/questions/:id`

## Socket.IO

### Namespace: `/phase1`

#### Client -> Server
- `phase1:rejoin` `{ usn }`
- `phase1:join` `{ usn }`
- `phase1:start` `{ adminToken }`
- `phase1:end` `{ adminToken }`
- `phase1:confirm_answer` `{ questionId, selectedOptionId }`
- `phase1:submit` `{ questionId, selectedOptionId }`

#### Server -> Client
- `phase1:started`
- `phase1:ended`
- `phase1:not_started`
- `phase1:unauthorized`
- `phase1:questions`
- `phase1:answer_confirmed`
- `phase1:submit_error`
- `phase1:result`
- `phase1:qualified`
- `phase1:eliminated`
