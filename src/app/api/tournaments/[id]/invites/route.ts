import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  maxUses: z.number().int().min(1).max(10).default(1),
  expiresAtUtc: z.string().datetime().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tournament is not active" }, { status: 409 });
  }

  const memberCount = await prisma.tournamentMember.count({ where: { tournamentId } });
  const remaining = Math.max(0, 10 - memberCount);
  if (remaining <= 0) return NextResponse.json({ error: "Tournament is full" }, { status: 409 });
  if (body.data.maxUses > remaining) {
    return NextResponse.json({ error: `Not enough slots. Remaining: ${remaining}` }, { status: 409 });
  }

  const token = randomBytes(18).toString("base64url");
  const invite = await prisma.invite.create({
    data: {
      tournamentId,
      token,
      maxUses: body.data.maxUses,
      expiresAt: body.data.expiresAtUtc ? new Date(body.data.expiresAtUtc) : null,
      createdByUserId: session.user.id,
    },
    select: { token: true, maxUses: true, uses: true, expiresAt: true },
  });

  return NextResponse.json({ invite });
}
