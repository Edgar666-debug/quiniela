import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  outcome: z.enum(["HOME", "DRAW", "AWAY"]),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: matchId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      matchday: { select: { id: true, closesAtUtc: true, tournamentId: true } },
    },
  });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: match.matchday.tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (Date.now() >= match.matchday.closesAtUtc.getTime()) {
    return NextResponse.json({ error: "Matchday is closed" }, { status: 409 });
  }

  const pick = await prisma.pick.upsert({
    where: { matchId_userId: { matchId, userId: session.user.id } },
    create: { matchId, userId: session.user.id, outcome: body.data.outcome },
    update: { outcome: body.data.outcome },
    select: { id: true, outcome: true },
  });

  return NextResponse.json({ pick });
}

