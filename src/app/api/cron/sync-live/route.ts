import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { fetchFixturesByIds } from "@/lib/api-football";
import { recalculateStandingsForTournament } from "@/lib/standings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FINISHED = new Set(["FT", "AET", "PEN"]);
const VOID = new Set(["PST", "CANC", "ABD", "AWD", "WO"]);

export async function POST(req: Request) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const token = bearer || req.headers.get("x-cron-secret") || url.searchParams.get("cronSecret") || "";
  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const matches = await prisma.match.findMany({
    where: {
      externalFixtureId: { not: null },
      startsAtUtc: { lte: now },
      NOT: [{ statusShort: { in: Array.from(FINISHED) } }, { statusShort: { in: Array.from(VOID) } }],
    },
    select: {
      id: true,
      externalFixtureId: true,
      matchday: { select: { tournamentId: true } },
    },
    take: 200,
  });

  const touchedTournamentIds = new Set<string>();
  let updatedMatches = 0;

  const matchesByFixtureId = new Map<number, typeof matches>();
  for (const match of matches) {
    const fixtureId = match.externalFixtureId!;
    const arr = matchesByFixtureId.get(fixtureId);
    if (arr) arr.push(match);
    else matchesByFixtureId.set(fixtureId, [match]);
  }

  const fixtureIds = Array.from(matchesByFixtureId.keys());
  for (let i = 0; i < fixtureIds.length; i += 20) {
    const chunk = fixtureIds.slice(i, i + 20);
    const fixtures = await fetchFixturesByIds(chunk);

    for (const fixtureId of chunk) {
      const fixture = fixtures.get(fixtureId);
      if (!fixture) continue;

      const relatedMatches = matchesByFixtureId.get(fixtureId) ?? [];
      for (const match of relatedMatches) {
        const result = await prisma.match.updateMany({
          where: { id: match.id },
          data: {
            startsAtUtc: fixture.dateUtc,
            statusShort: fixture.statusShort,
            scoreHome: fixture.scoreHome,
            scoreAway: fixture.scoreAway,
          },
        });

        if (result.count > 0) {
          updatedMatches += 1;
          touchedTournamentIds.add(match.matchday.tournamentId);
        }
      }
    }
  }

  for (const tournamentId of touchedTournamentIds) {
    await recalculateStandingsForTournament(tournamentId);
  }

  return NextResponse.json({
    checkedMatches: matches.length,
    updatedMatches,
    tournamentsRecalculated: touchedTournamentIds.size,
  });
}
