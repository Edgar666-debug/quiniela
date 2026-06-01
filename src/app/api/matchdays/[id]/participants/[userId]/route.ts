import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: matchdayId, userId } = await ctx.params;

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { id: true, closesAtUtc: true, tournamentId: true },
  });
  if (!matchday) return NextResponse.json({ error: "Matchday not found" }, { status: 404 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: matchday.tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const participant = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: matchday.tournamentId, userId } },
    select: { id: true },
  });
  if (!participant) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

  if (Date.now() < matchday.closesAtUtc.getTime())
    return NextResponse.json({ error: "Matchday is not closed" }, { status: 409 });

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
      statusShort: true,
      scoreHome: true,
      scoreAway: true,
      picks: { where: { userId }, select: { outcome: true }, take: 1 },
    },
  });

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      externalFixtureId: m.externalFixtureId,
      startsAtUtc: m.startsAtUtc.toISOString(),
      homeTeam: m.homeTeam,
      homeLogoUrl: m.homeLogoUrl,
      awayTeam: m.awayTeam,
      awayLogoUrl: m.awayLogoUrl,
      statusShort: m.statusShort,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      pick: m.picks[0]?.outcome ?? null,
    })),
  });
}

