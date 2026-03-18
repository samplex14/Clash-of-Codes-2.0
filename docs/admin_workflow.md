# Admin Workflow

1. Open /admin and authenticate with ADMIN_SECRET.
2. Validate participant count and matchmaking status.
3. Start Phase 1 when all participants are ready.
4. Starting Phase 1 triggers server-side per-user shuffling and direct question emission.
5. Monitor leaderboard and submissions.
6. End Phase 1.
7. Review Top 8 qualifiers and final standings.

## Matchmaking Monitoring

Admin panel shows:

- mapped participant count
- waiting queue count
- paired table (A vs B)
