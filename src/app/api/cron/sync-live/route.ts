import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { fetchFixturesByIds } from "@/lib/api-football";
import { recalculateStandingsForTournament } from "@/lib/standings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FINISHED = new Set(["FT", "AET", "PEN"]);
const VOID = new Set(["PST", "CANC", "ABD", "AWD", "WO", "NF"]);

export async function POST(req: Request) {
  const startedAtMs = Date.now();
  const runId = `sync_${startedAtMs}_${Math.random().toString(16).slice(2, 8)}`;
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const token = bearer || req.headers.get("x-cron-secret") || "";
  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const lookbackMs = 72 * 60 * 60_000; // 72h
  const from = new Date(now.getTime() - lookbackMs);
  const matches = await prisma.match.findMany({
    where: {
      externalFixtureId: { not: null },
      startsAtUtc: { lte: now, gte: from },
      syncMisses: { lt: 3 },
      NOT: [{ statusShort: { in: Array.from(FINISHED) } }, { statusShort: { in: Array.from(VOID) } }],
    },
    select: {
      id: true,
      externalFixtureId: true,
      syncMisses: true,
      matchday: { select: { tournamentId: true } },
    },
    take: 200,
  });

  const checkedByTournamentId = new Map<string, number>();
  for (const match of matches) {
    checkedByTournamentId.set(match.matchday.tournamentId, (checkedByTournamentId.get(match.matchday.tournamentId) ?? 0) + 1);
  }

  const touchedTournamentIds = new Set<string>();
  const updatedByTournamentId = new Map<string, number>();
  let updatedMatches = 0;

  const matchesByFixtureId = new Map<number, typeof matches>();
  for (const match of matches) {
    const fixtureId = match.externalFixtureId!;
    const arr = matchesByFixtureId.get(fixtureId);
    if (arr) arr.push(match);
    else matchesByFixtureId.set(fixtureId, [match]);
  }

  const fixtureIds = Array.from(matchesByFixtureId.keys());
  const chunks = [];
  for (let i = 0; i < fixtureIds.length; i += 20) {
    chunks.push(fixtureIds.slice(i, i + 20));
  }

  const fixturesByChunk = await Promise.all(chunks.map((chunk) => fetchFixturesByIds(chunk)));

  const chunkResults = await Promise.all(
    chunks.map(async (chunk, index) => {
      const fixtures = fixturesByChunk[index];
      const touchedIds = new Set<string>();
      const updatedCounts = new Map<string, number>();
      let updated = 0;

      await Promise.all(
        chunk.map(async (fixtureId) => {
          const fixture = fixtures.get(fixtureId);
          const relatedMatches = matchesByFixtureId.get(fixtureId) ?? [];

          if (!fixture) {
            await prisma.$transaction(
              relatedMatches.map((match) =>
                prisma.match.update({
                  where: { id: match.id },
                  data: {
                    syncMisses: match.syncMisses + 1,
                    statusShort: match.syncMisses + 1 >= 3 ? "NF" : undefined,
                  },
                }),
              ),
            );
            return;
          }

          const results = await Promise.all(
            relatedMatches.map(async (match) => {
              const result = await prisma.match.updateMany({
                where: { id: match.id },
                data: {
                  startsAtUtc: fixture.dateUtc,
                  statusShort: fixture.statusShort,
                  scoreHome: fixture.scoreHome,
                  scoreAway: fixture.scoreAway,
                  homeTeam: fixture.homeTeam,
                  awayTeam: fixture.awayTeam,
                  homeLogoUrl: fixture.homeLogoUrl ?? null,
                  awayLogoUrl: fixture.awayLogoUrl ?? null,
                  syncMisses: 0,
                },
              });

              return { match, count: result.count };
            }),
          );

          for (const result of results) {
            if (result.count > 0) {
              updated += 1;
              touchedIds.add(result.match.matchday.tournamentId);
              updatedCounts.set(
                result.match.matchday.tournamentId,
                (updatedCounts.get(result.match.matchday.tournamentId) ?? 0) + 1,
              );
            }
          }
        }),
      );

      return { touchedIds, updatedCounts, updated };
    }),
  );

  for (const chunkResult of chunkResults) {
    updatedMatches += chunkResult.updated;
    for (const tournamentId of chunkResult.touchedIds) {
      touchedTournamentIds.add(tournamentId);
    }
    for (const [tournamentId, count] of chunkResult.updatedCounts) {
      updatedByTournamentId.set(tournamentId, (updatedByTournamentId.get(tournamentId) ?? 0) + count);
    }
  }

  await Promise.all(Array.from(touchedTournamentIds, (tournamentId) => recalculateStandingsForTournament(tournamentId)));

  const tournamentIds = Array.from(checkedByTournamentId.keys());
  if (tournamentIds.length > 0) {
    await prisma.syncRun.createMany({
      data: tournamentIds.map((tournamentId) => ({
        tournamentId,
        checkedMatches: checkedByTournamentId.get(tournamentId) ?? 0,
        updatedMatches: updatedByTournamentId.get(tournamentId) ?? 0,
        standingsRecalculated: touchedTournamentIds.has(tournamentId),
      })),
    });
  }

  console.info("[cron/sync-live]", {
    runId,
    checkedMatches: matches.length,
    updatedMatches,
    tournamentsRecalculated: touchedTournamentIds.size,
    durationMs: Date.now() - startedAtMs,
  });

  return NextResponse.json({
    checkedMatches: matches.length,
    updatedMatches,
    tournamentsRecalculated: touchedTournamentIds.size,
    runId,
    durationMs: Date.now() - startedAtMs,
  });
}
