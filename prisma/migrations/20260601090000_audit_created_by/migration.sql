-- Add audit fields to track who created records (nullable for backfill safety)

ALTER TABLE "Invite"
ADD COLUMN     "createdByUserId" TEXT;

ALTER TABLE "Matchday"
ADD COLUMN     "createdByUserId" TEXT;

ALTER TABLE "Match"
ADD COLUMN     "createdByUserId" TEXT;

ALTER TABLE "Invite"
ADD CONSTRAINT "Invite_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Matchday"
ADD CONSTRAINT "Matchday_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Match"
ADD CONSTRAINT "Match_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Invite_createdByUserId_idx" ON "Invite"("createdByUserId");
CREATE INDEX "Matchday_createdByUserId_idx" ON "Matchday"("createdByUserId");
CREATE INDEX "Match_createdByUserId_idx" ON "Match"("createdByUserId");

