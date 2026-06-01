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
  console.log("matchdayId", matchdayId);
  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: {
      id: true,
      number: true,
      closesAtUtc: true,
      tournamentId: true,
    },
  });
  console.log("matchday", matchday);
  if (!matchday) return NextResponse.json({ error: "Matchday not found" }, { status: 404 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: matchday.tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  console.log("membership", membership);
  if (Date.now() < matchday.closesAtUtc.getTime()) {
    return NextResponse.json({ error: "Matchday is not closed yet" }, { status: 409 });
  }

  const members = await prisma.tournamentMember.findMany({
    where: { tournamentId: matchday.tournamentId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    select: { userId: true, user: { select: { name: true, email: true, image: true } } },
  });

  const matches = await prisma.match.findMany({
    where: { matchdayId },
    orderBy: [{ startsAtUtc: "asc" }],
    select: { id: true, startsAtUtc: true, homeTeam: true, awayTeam: true, statusShort: true, scoreHome: true, scoreAway: true },
  });

  const picks = await prisma.pick.findMany({
    where: { matchId: { in: matches.map((m) => m.id) } },
    select: { matchId: true, userId: true, outcome: true },
  });

  return NextResponse.json({
    matchday: {
      id: matchday.id,
      number: matchday.number,
      closesAtUtc: matchday.closesAtUtc.toISOString(),
    },
    members: members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
    })),
    matches: matches.map((m) => ({
      id: m.id,
      startsAtUtc: m.startsAtUtc.toISOString(),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      statusShort: m.statusShort,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
    })),
    picks,
  });
}

