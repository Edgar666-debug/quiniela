import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    number: z.number().int().min(1).max(100).optional(),
    closesAtUtc: z.iso.datetime().optional(),
  })
  .refine((data) => data.number !== undefined || data.closesAtUtc !== undefined, {
    message: "At least one field is required",
  });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: matchdayId } = await ctx.params;
  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    select: { id: true, tournamentId: true, number: true, closesAtUtc: true },
  });
  if (!matchday) return NextResponse.json({ error: "Matchday not found" }, { status: 404 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: matchday.tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: matchday.tournamentId },
    select: { status: true },
  });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tournament is not active" }, { status: 409 });
  }

  const nextNumber = body.data.number ?? matchday.number;
  if (nextNumber !== matchday.number) {
    const conflict = await prisma.matchday.findFirst({
      where: { tournamentId: matchday.tournamentId, number: nextNumber, NOT: { id: matchdayId } },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "Ya existe una jornada con ese número." }, { status: 409 });
  }

  let nextClosesAt = matchday.closesAtUtc;
  if (body.data.closesAtUtc) {
    const closesAt = new Date(body.data.closesAtUtc);
    if (Number.isNaN(closesAt.getTime())) return NextResponse.json({ error: "Invalid closesAtUtc" }, { status: 400 });
    nextClosesAt = closesAt;
  }

  const updated = await prisma.matchday.update({
    where: { id: matchdayId },
    data: {
      number: nextNumber,
      closesAtUtc: nextClosesAt,
    },
    select: { id: true, number: true, closesAtUtc: true, tournamentId: true },
  });

  return NextResponse.json({
    matchday: {
      id: updated.id,
      tournamentId: updated.tournamentId,
      number: updated.number,
      closesAtUtc: updated.closesAtUtc.toISOString(),
    },
  });
}
