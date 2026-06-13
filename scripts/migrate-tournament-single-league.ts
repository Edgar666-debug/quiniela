/**
 * One-off data migration: set tournament scope to SINGLE_LEAGUE and backfill league fields on matches.
 *
 * Usage:
 *   npx tsx scripts/migrate-tournament-single-league.ts --dry-run
 *   npx tsx scripts/migrate-tournament-single-league.ts
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const TOURNAMENT_ID = "cmq648x0t000004l27hmtcvfq";

const LEAGUE = {
  scope: "SINGLE_LEAGUE" as const,
  externalLeagueId: 1,
  leagueName: "World Cup",
  leagueSeason: 2026,
  logoUrl: "https://media.api-sports.io/football/leagues/1.png",
};

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: TOURNAMENT_ID },
      select: {
        id: true,
        name: true,
        scope: true,
        externalLeagueId: true,
        leagueName: true,
        leagueSeason: true,
        logoUrl: true,
        matchdays: {
          select: {
            id: true,
            number: true,
            matches: {
              select: {
                id: true,
                externalFixtureId: true,
                homeTeam: true,
                awayTeam: true,
                externalLeagueId: true,
                leagueName: true,
                leagueSeason: true,
              },
              orderBy: { startsAtUtc: "asc" },
            },
          },
          orderBy: { number: "asc" },
        },
      },
    });

    if (!tournament) {
      throw new Error(`Tournament not found: ${TOURNAMENT_ID}`);
    }

    const matches = tournament.matchdays.flatMap((md) => md.matches);
    const matchesNeedingUpdate = matches.filter(
      (m) =>
        m.externalLeagueId !== LEAGUE.externalLeagueId ||
        m.leagueName !== LEAGUE.leagueName ||
        m.leagueSeason !== LEAGUE.leagueSeason,
    );

    const tournamentNeedsUpdate =
      tournament.scope !== LEAGUE.scope ||
      tournament.externalLeagueId !== LEAGUE.externalLeagueId ||
      tournament.leagueName !== LEAGUE.leagueName ||
      tournament.leagueSeason !== LEAGUE.leagueSeason;

    const logoNeedsUpdate = tournament.logoUrl !== LEAGUE.logoUrl;

    console.log(`Tournament: ${tournament.name} (${tournament.id})`);
    console.log("Current tournament scope:", {
      scope: tournament.scope,
      externalLeagueId: tournament.externalLeagueId,
      leagueName: tournament.leagueName,
      leagueSeason: tournament.leagueSeason,
    });
    console.log("Target:", LEAGUE);
    console.log(`Matchdays: ${tournament.matchdays.length}, matches: ${matches.length}`);
    console.log(`Matches to update: ${matchesNeedingUpdate.length}`);
    console.log(`Tournament row to update: ${tournamentNeedsUpdate || logoNeedsUpdate ? "yes" : "no"}`);
    if (LEAGUE.logoUrl) console.log(`League logo URL: ${LEAGUE.logoUrl}`);

    if (matchesNeedingUpdate.length > 0) {
      console.log("\nMatches pending update:");
      for (const match of matchesNeedingUpdate) {
        console.log(
          `  - ${match.homeTeam} vs ${match.awayTeam}` +
            (match.externalFixtureId ? ` (fixture ${match.externalFixtureId})` : "") +
            ` [${match.externalLeagueId ?? "null"} / ${match.leagueName ?? "null"} / ${match.leagueSeason ?? "null"}]`,
        );
      }
    }

    if (dryRun) {
      console.log("\nDry run only — no changes written.");
      return;
    }

    if (!tournamentNeedsUpdate && !logoNeedsUpdate && matchesNeedingUpdate.length === 0) {
      console.log("\nNothing to update.");
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedTournament =
        tournamentNeedsUpdate || logoNeedsUpdate
          ? await tx.tournament.update({
              where: { id: TOURNAMENT_ID },
              data: {
                scope: LEAGUE.scope,
                externalLeagueId: LEAGUE.externalLeagueId,
                leagueName: LEAGUE.leagueName,
                leagueSeason: LEAGUE.leagueSeason,
                ...(logoNeedsUpdate ? { logoUrl: LEAGUE.logoUrl } : {}),
              },
              select: {
                id: true,
                name: true,
                scope: true,
                externalLeagueId: true,
                leagueName: true,
                leagueSeason: true,
                logoUrl: true,
              },
            })
          : {
              id: tournament.id,
              name: tournament.name,
              scope: tournament.scope,
              externalLeagueId: tournament.externalLeagueId,
              leagueName: tournament.leagueName,
              leagueSeason: tournament.leagueSeason,
              logoUrl: tournament.logoUrl,
            };

      const matchUpdate =
        matchesNeedingUpdate.length > 0
          ? await tx.match.updateMany({
              where: { matchday: { tournamentId: TOURNAMENT_ID } },
              data: {
                externalLeagueId: LEAGUE.externalLeagueId,
                leagueName: LEAGUE.leagueName,
                leagueSeason: LEAGUE.leagueSeason,
              },
            })
          : { count: 0 };

      return { updatedTournament, matchUpdate };
    });

    console.log("\nMigration applied.");
    console.log("Tournament:", {
      scope: result.updatedTournament.scope,
      externalLeagueId: result.updatedTournament.externalLeagueId,
      leagueName: result.updatedTournament.leagueName,
      leagueSeason: result.updatedTournament.leagueSeason,
      logoUrl: result.updatedTournament.logoUrl,
    });
    console.log(`Matches updated: ${result.matchUpdate.count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
