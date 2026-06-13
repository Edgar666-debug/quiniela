-- CreateEnum
CREATE TYPE "TournamentScope" AS ENUM ('OPEN', 'SINGLE_LEAGUE');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "scope" "TournamentScope" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "externalLeagueId" INTEGER,
ADD COLUMN "leagueName" TEXT,
ADD COLUMN "leagueSeason" INTEGER;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "externalLeagueId" INTEGER,
ADD COLUMN "leagueName" TEXT,
ADD COLUMN "leagueSeason" INTEGER;
