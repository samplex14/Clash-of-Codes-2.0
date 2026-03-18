# Participant Flow

## Single Page Journey on /arena

1. Searching state
   - Player lands on /arena.
   - Client emits matchmaking:enter_arena.
   - Searching messages and LoadingRadar animate.

2. Found state
   - Opponent reveal appears.
   - Player remains on this screen with waiting indicator.
   - Text: The battle horn has not sounded yet... Stand by, Warrior.

3. Battle state
   - Triggered only by phase1:questions from server.
   - Found layout fades out and question panel fades in.
   - URL remains /arena.

4. Result state
   - Triggered by phase1:result.
   - Qualified and eliminated outcomes render inline.
   - URL remains /arena.

No button, link, or auto-redirect moves participants between found and battle.
