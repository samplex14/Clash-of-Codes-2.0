# Participant Flow

1. Register on home page with USN and name.
2. Enter arena.
3. Client calls POST /api/matchmaking.
4. If unmatched, client polls /api/matchmaking/status every 3 seconds.
5. When opponent appears, versus card is shown inline.
6. Arena polls /api/tournament/state every 3 seconds while phase is inactive.
7. Any warrior can press Sound the Battle Horn.
8. POST /api/tournament/start sets phase1Active and pre-generates sessions.
9. Arena loads shuffled questions from GET /api/phase1/questions?usn=...
10. Warrior locks answers via POST /api/phase1/confirm.
11. Warrior submits final strike via POST /api/phase1/submit.
12. Arena shows waiting-for-others card with score.
13. Arena polls /api/tournament/status every 5 seconds.
14. When all warriors finish, qualification runs automatically and leaderboard unlocks.
15. Arena redirects to /leaderboard final standings.
