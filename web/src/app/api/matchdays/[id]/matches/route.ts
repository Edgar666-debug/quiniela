import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  externalFixtureId: z.number().int().positive().optional(),
  startsAtUtc: z.string().datetime(),
  homeTeam: z.string().min(1).max(80),
  awayTeam: z.string().min(1).max(80),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: matchdayId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { tournamentId: true },
  });
  if (!matchday) return NextResponse.json({ error: "Matchday not found" }, { status: 404 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: matchday.tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const match = await prisma.match.create({
    data: {
      matchdayId,
      externalFixtureId: body.data.externalFixtureId ?? null,
      startsAtUtc: new Date(body.data.startsAtUtc),
      homeTeam: body.data.homeTeam,
      awayTeam: body.data.awayTeam,
    },
    select: { id: true },
  });

  return NextResponse.json({ match });
}

