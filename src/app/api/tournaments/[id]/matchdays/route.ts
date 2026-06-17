import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { matchdayListSelect, toMatchdayListRow } from "@/lib/matchday-list";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  number: z.number().int().min(1).max(100),
  closesAtUtc: z.iso.datetime(),
});

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
    select: matchdayListSelect(session.user.id),
  });

  return NextResponse.json({
    role: membership.role,
    matchdays: matchdays.map(toMatchdayListRow),
  });
}

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

  const closesAt = new Date(body.data.closesAtUtc);
  if (Number.isNaN(closesAt.getTime())) return NextResponse.json({ error: "Invalid closesAtUtc" }, { status: 400 });
  if (closesAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "El cierre debe ser una fecha futura." }, { status: 409 });
  }
  // Guardrail: evita cierres absurdamente lejanos por error de captura.
  const maxFutureMs = 180 * 24 * 60 * 60_000; // 180 días
  if (closesAt.getTime() - Date.now() > maxFutureMs) {
    return NextResponse.json({ error: "El cierre está demasiado lejos. Revisa la fecha." }, { status: 409 });
  }

  const matchday = await prisma.matchday.create({
    data: { tournamentId, number: body.data.number, closesAtUtc: closesAt, createdByUserId: session.user.id },
    select: { id: true, number: true, closesAtUtc: true },
  });

  return NextResponse.json({ matchday });
}
