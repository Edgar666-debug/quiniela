/*
  Safe enum migration for Tournament.status without data loss.
  Assumes existing values are among: ACTIVE, ARCHIVED.
*/

DO $$ BEGIN
  CREATE TYPE "TournamentStatus" AS ENUM ('ACTIVE', 'FINISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Tournament" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tournament"
  ALTER COLUMN "status" TYPE "TournamentStatus"
  USING ("status"::"TournamentStatus");
ALTER TABLE "Tournament" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

