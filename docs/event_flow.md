# Event Flow

1. **Registration**
   - Players register using USN, name, and year.
   - Participant data is stored and track is auto-assigned.

2. **Round Start**
   - Admin starts Phase 1.
   - Server broadcasts round start to participants.
   - Participants receive shuffled question sets.

3. **Answering and Submission**
   - Participants confirm answers per question.
   - Final submit is accepted only when all questions are confirmed.
   - Server grades and stores score.

4. **Round End and Qualification**
   - Admin ends Phase 1.
   - Server computes ranking and qualification.
   - Participants receive either `phase1:qualified` or `phase1:eliminated`.

5. **Leaderboard**
   - Admin views final leaderboard and qualified list.
