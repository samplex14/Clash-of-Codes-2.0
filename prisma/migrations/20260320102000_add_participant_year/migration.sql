ALTER TABLE "Participant"
ADD COLUMN "year" TEXT NOT NULL DEFAULT '2nd';

UPDATE "Participant"
SET "year" = CASE
  WHEN "track" = '1st_year' THEN '1st'
  ELSE '2nd'
END;