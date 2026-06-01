-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "ranAtUtc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "message" TEXT,
    "checkedMatches" INTEGER NOT NULL DEFAULT 0,
    "updatedMatches" INTEGER NOT NULL DEFAULT 0,
    "standingsRecalculated" BOOLEAN NOT NULL DEFAULT false,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncRun_tournamentId_ranAtUtc_idx" ON "SyncRun"("tournamentId", "ranAtUtc");

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
