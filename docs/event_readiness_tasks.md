# Event Readiness Tasks

Current Status: **Phase 1 active and supported.**

## Critical Tasks

### 1. Content
- [ ] Prepare and validate full Phase 1 question set.
- [ ] Verify question quality and answer keys.

### 2. Dry Run
- [ ] Register test users.
- [ ] Start Phase 1.
- [ ] Confirm question delivery and submission flow.
- [ ] End Phase 1 and verify leaderboard ordering.

### 3. Infrastructure
- [ ] Verify production env vars (`MONGO_URI`, `ADMIN_SECRET`, `PORT`).
- [ ] Verify `/api/health` on deployed server.
- [ ] Verify frontend to backend connectivity.

## Testing Checklist

- [ ] Participant can rejoin during active Phase 1.
- [ ] Admin start/end controls work from dashboard.
- [ ] Submit validation blocks incomplete submissions.
- [ ] Qualification emits are received by participants.
- [ ] Browser compatibility check (Chrome, Firefox, Edge).
