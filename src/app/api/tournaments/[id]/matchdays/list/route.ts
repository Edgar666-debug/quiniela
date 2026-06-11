import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const matchdays = await prisma.matchday.findMany({
    where: { tournamentId },
    orderBy: [{ number: "desc" }],
    select: {
      id: true,
      number: true,
      closesAtUtc: true,
      _count: { select: { matches: true } },
      matches: {
        select: {
          _count: { select: { picks: { where: { userId: session.user.id } } } },
        },
      },
    },
  });

  return NextResponse.json({
    role: membership.role,
    matchdays: matchdays.map((m) => ({
      id: m.id,
      number: m.number,
      closesAtUtc: m.closesAtUtc.toISOString(),
      matchesCount: m._count.matches,
      myPicksCount: m.matches.reduce((sum, match) => sum + (match._count.picks > 0 ? 1 : 0), 0),
    })),
  });
}

