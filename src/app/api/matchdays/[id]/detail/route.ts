import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: matchdayId } = await ctx.params;

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: {
      id: true,
      number: true,
      closesAtUtc: true,
      tournamentId: true,
    },
  });
  if (!matchday) return NextResponse.json({ error: "Matchday not found" }, { status: 404 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: matchday.tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const matches = await prisma.match.findMany({
    where: { matchdayId },
    orderBy: [{ startsAtUtc: "asc" }],
    select: {
      id: true,
      externalFixtureId: true,
      startsAtUtc: true,
      homeTeam: true,
      homeLogoUrl: true,
      awayTeam: true,
      awayLogoUrl: true,
      leagueName: true,
      statusShort: true,
      scoreHome: true,
      scoreAway: true,
      picks: {
        where: { userId: session.user.id },
        select: { outcome: true },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    role: membership.role,
    matchday: {
      id: matchday.id,
      number: matchday.number,
      closesAtUtc: matchday.closesAtUtc.toISOString(),
    },
    matches: matches.map((m) => ({
      id: m.id,
      externalFixtureId: m.externalFixtureId,
      startsAtUtc: m.startsAtUtc.toISOString(),
      homeTeam: m.homeTeam,
      homeLogoUrl: m.homeLogoUrl,
      awayTeam: m.awayTeam,
      awayLogoUrl: m.awayLogoUrl,
      leagueName: m.leagueName,
      statusShort: m.statusShort,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      myPick: m.picks[0]?.outcome ?? null,
    })),
  });
}
