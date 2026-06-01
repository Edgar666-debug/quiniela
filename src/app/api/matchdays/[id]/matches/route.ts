import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchFixtureById } from "@/lib/api-football";

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
    select: { tournamentId: true, closesAtUtc: true, tournament: { select: { status: true } } },
  });
  if (!matchday) return NextResponse.json({ error: "Matchday not found" }, { status: 404 });

  if (matchday.tournament.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tournament is not active" }, { status: 409 });
  }

  if (Date.now() >= matchday.closesAtUtc.getTime()) {
    return NextResponse.json({ error: "Matchday is closed" }, { status: 409 });
  }

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId: matchday.tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let createData = {
    matchdayId,
    externalFixtureId: body.data.externalFixtureId ?? null,
    startsAtUtc: new Date(body.data.startsAtUtc),
    homeTeam: body.data.homeTeam,
    awayTeam: body.data.awayTeam,
    homeLogoUrl: null as string | null,
    awayLogoUrl: null as string | null,
  };

  if (body.data.externalFixtureId) {
    const fixture = await fetchFixtureById(body.data.externalFixtureId);
    if (fixture) {
      createData = {
        ...createData,
        startsAtUtc: fixture.dateUtc,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeLogoUrl: fixture.homeLogoUrl ?? null,
        awayLogoUrl: fixture.awayLogoUrl ?? null,
      };
    }
  }

  // Regla: el cierre debe ser antes de que inicie el primer partido.
  // Por lo tanto, no permitimos crear partidos que inicien antes del cierre.
  if (createData.startsAtUtc.getTime() < matchday.closesAtUtc.getTime()) {
    return NextResponse.json(
      {
        error:
          "El partido inicia antes del cierre de la jornada (UTC). Ajusta el cierre para que sea antes del primer partido o elige otro fixture.",
      },
      { status: 409 },
    );
  }

  const match = await prisma.match.create({
    data: {
      matchdayId: createData.matchdayId,
      externalFixtureId: createData.externalFixtureId,
      startsAtUtc: createData.startsAtUtc,
      homeTeam: createData.homeTeam,
      awayTeam: createData.awayTeam,
      homeLogoUrl: createData.homeLogoUrl,
      awayLogoUrl: createData.awayLogoUrl,
      createdByUserId: session.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ match });
}
