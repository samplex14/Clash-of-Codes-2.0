-- Add indexes to speed up matchmaking candidate selection and lookups
CREATE INDEX "Participant_year_idx" ON "Participant"("year");

CREATE INDEX "Participant_isMapped_idx" ON "Participant"("isMapped");

CREATE INDEX "Participant_mappedTo_idx" ON "Participant"("mappedTo");

CREATE INDEX "Participant_year_isMapped_mappedTo_idx" ON "Participant"("year", "isMapped", "mappedTo");
