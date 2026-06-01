import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PARTICIPANTS = 10;

export async function POST(_: Request, ctx: { params: Promise<{ token: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await ctx.params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { id: true, tournamentId: true, maxUses: true, uses: true, expiresAt: true },
  });
  if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }
  if (invite.uses >= invite.maxUses) {
    return NextResponse.json({ error: "Invite already used" }, { status: 409 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: invite.tournamentId },
    select: { status: true },
  });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tournament is not active" }, { status: 409 });
  }

  const memberCount = await prisma.tournamentMember.count({ where: { tournamentId: invite.tournamentId } });
  if (memberCount >= MAX_PARTICIPANTS) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 409 });
  }

  const existing = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: invite.tournamentId, userId: session.user.id } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.tournamentMember.create({
      data: { tournamentId: invite.tournamentId, userId: session.user.id, role: "PLAYER" },
    }),
    prisma.standing.upsert({
      where: { tournamentId_userId: { tournamentId: invite.tournamentId, userId: session.user.id } },
      create: { tournamentId: invite.tournamentId, userId: session.user.id, points: 0 },
      update: {},
    }),
    prisma.invite.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } }),
  ]);

  return NextResponse.json({ ok: true, tournamentId: invite.tournamentId });
}
