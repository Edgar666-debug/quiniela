import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchFixtureById } from "@/lib/api-football";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const matchInputSchema = z.object({
  externalFixtureId: z.number().int().positive().optional(),
  startsAtUtc: z.iso.datetime(),
  homeTeam: z.string().min(1).max(80),
  awayTeam: z.string().min(1).max(80),
});

const bodySchema = z.union([
  matchInputSchema,
  z.object({
    matches: z.array(matchInputSchema).min(1).max(30),
  }),
]);

type NormalizedMatchInput = z.infer<typeof matchInputSchema>;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: matchdayId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const inputs: NormalizedMatchInput[] = "matches" in body.data ? body.data.matches : [body.data];

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

  const externalFixtureIds = inputs
    .map((item) => item.externalFixtureId)
    .filter((value): value is number => value !== undefined);

  if (new Set(externalFixtureIds).size !== externalFixtureIds.length) {
    return NextResponse.json({ error: "No puedes enviar el mismo fixture más de una vez en la misma solicitud." }, { status: 400 });
  }

  if (externalFixtureIds.length > 0) {
    const existingMatches = await prisma.match.findMany({
      where: { externalFixtureId: { in: externalFixtureIds } },
      select: { externalFixtureId: true },
    });
    if (existingMatches.length > 0) {
      const duplicateIds = existingMatches.map((item) => item.externalFixtureId).filter((value): value is number => value !== null);
      return NextResponse.json(
        { error: `Algunos fixtures ya existen en la base de datos: ${duplicateIds.join(", ")}.` },
        { status: 409 },
      );
    }
  }

  const preparedMatches = await Promise.all(
    inputs.map(async (input) => {
      let createData = {
        matchdayId,
        externalFixtureId: input.externalFixtureId ?? null,
        startsAtUtc: new Date(input.startsAtUtc),
        homeTeam: input.homeTeam,
        awayTeam: input.awayTeam,
        homeLogoUrl: null as string | null,
        awayLogoUrl: null as string | null,
      };

      if (input.externalFixtureId) {
        const fixture = await fetchFixtureById(input.externalFixtureId);
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

      if (createData.startsAtUtc.getTime() < matchday.closesAtUtc.getTime()) {
        throw new Error(
          `El fixture ${createData.externalFixtureId ?? `${createData.homeTeam} vs ${createData.awayTeam}`} inicia antes del cierre de la jornada (UTC).`,
        );
      }

      return createData;
    }),
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "No se pudieron preparar los partidos.";
    return NextResponse.json({ error: message }, { status: 409 });
  });

  if (preparedMatches instanceof NextResponse) return preparedMatches;

  const matches = await prisma.$transaction(
    preparedMatches.map((item) =>
      prisma.match.create({
        data: {
          matchdayId: item.matchdayId,
          externalFixtureId: item.externalFixtureId,
          startsAtUtc: item.startsAtUtc,
          homeTeam: item.homeTeam,
          awayTeam: item.awayTeam,
          homeLogoUrl: item.homeLogoUrl,
          awayLogoUrl: item.awayLogoUrl,
          createdByUserId: session.user.id,
        },
        select: { id: true },
      }),
    ),
  );

  if ("matches" in body.data) {
    return NextResponse.json({ matches, count: matches.length });
  }

  return NextResponse.json({ match: matches[0] });
}
