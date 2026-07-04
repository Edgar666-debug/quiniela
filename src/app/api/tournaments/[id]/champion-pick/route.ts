import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChampionPickState, validateChampionSelection } from "@/lib/tournament-champion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  champion: z.string().trim().min(1).max(120).nullable(),
});

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;
  const state = await getChampionPickState(tournamentId, session.user.id);

  if (!state) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!state.enabled) return NextResponse.json({ error: "Este torneo no usa selección de campeón." }, { status: 409 });

  return NextResponse.json(state);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { userId: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      scope: true,
      status: true,
      externalLeagueId: true,
      leagueSeason: true,
    },
  });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  if (tournament.scope !== "SINGLE_LEAGUE") {
    return NextResponse.json({ error: "Este torneo no usa selección de campeón." }, { status: 409 });
  }
  if (tournament.status !== "ACTIVE") {
    return NextResponse.json({ error: "La selección de campeón ya está cerrada." }, { status: 409 });
  }

  let champion = body.data.champion;
  if (champion) {
    const validation = await validateChampionSelection(tournament, champion);
    if (!validation.match) {
      return NextResponse.json({ error: "Elige un equipo válido de la liga del torneo." }, { status: 409 });
    }
    champion = validation.match.name;
  }

  await prisma.tournamentMember.update({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    data: { champion },
  });

  const state = await getChampionPickState(tournamentId, session.user.id);
  return NextResponse.json({ ok: true, state });
}
