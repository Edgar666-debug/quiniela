import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; matchdayId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId, matchdayId } = await ctx.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { id: true, tournamentId: true, _count: { select: { matches: true } } },
  });
  if (!matchday || matchday.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Jornada no encontrada" }, { status: 404 });
  }
  if (matchday._count.matches > 0) {
    return NextResponse.json({ error: "No se puede borrar una jornada con partidos" }, { status: 409 });
  }

  await prisma.matchday.delete({ where: { id: matchdayId } });

  return NextResponse.json({ ok: true });
}
