import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLeagueLogoUrl } from "@/lib/api-football";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getManagedTournamentLogoObjectPath, TOURNAMENT_LOGOS_BUCKET } from "@/lib/supabase/storage";
import {
  canEditTournamentScope,
  normalizeTournamentScopeFields,
  parseTournamentScopeInput,
  tournamentScopeFieldsChanged,
} from "@/lib/tournament-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    status: z.enum(["ACTIVE", "FINISHED", "ARCHIVED"]).optional(),
    name: z.string().min(1).max(80).optional(),
    logoUrl: z.string().trim().url().max(500).nullable().optional(),
    scope: z.enum(["OPEN", "SINGLE_LEAGUE"]).optional(),
    externalLeagueId: z.number().int().positive().optional().nullable(),
    leagueName: z.string().trim().min(1).max(120).optional().nullable(),
    leagueSeason: z.number().int().min(1900).max(2100).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "SINGLE_LEAGUE") {
      if (!value.externalLeagueId) {
        ctx.addIssue({ code: "custom", message: "externalLeagueId is required for SINGLE_LEAGUE", path: ["externalLeagueId"] });
      }
      if (!value.leagueSeason) {
        ctx.addIssue({ code: "custom", message: "leagueSeason is required for SINGLE_LEAGUE", path: ["leagueSeason"] });
      }
    }
  });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const hasScopeChange =
    body.data.scope !== undefined ||
    body.data.externalLeagueId !== undefined ||
    body.data.leagueName !== undefined ||
    body.data.leagueSeason !== undefined;

  if (
    body.data.status === undefined &&
    body.data.name === undefined &&
    body.data.logoUrl === undefined &&
    !hasScopeChange
  ) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const current = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      status: true,
      logoUrl: true,
      scope: true,
      externalLeagueId: true,
      leagueName: true,
      leagueSeason: true,
    },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (current.status === "FINISHED" && body.data.status) {
    return NextResponse.json({ error: "Tournament is finished and cannot change status" }, { status: 409 });
  }

  if (body.data.status === "FINISHED" && current.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only ACTIVE tournaments can be finished" }, { status: 409 });
  }

  if (body.data.status === "ARCHIVED" && current.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only ACTIVE tournaments can be archived" }, { status: 409 });
  }

  let scopeUpdate: ReturnType<typeof normalizeTournamentScopeFields> | undefined;
  if (hasScopeChange) {
    const scopeParsed = parseTournamentScopeInput({
      scope: body.data.scope ?? current.scope,
      externalLeagueId: body.data.externalLeagueId !== undefined ? body.data.externalLeagueId : current.externalLeagueId,
      leagueName: body.data.leagueName !== undefined ? body.data.leagueName : current.leagueName,
      leagueSeason: body.data.leagueSeason !== undefined ? body.data.leagueSeason : current.leagueSeason,
    });
    if (!scopeParsed.success) return NextResponse.json({ error: "Invalid tournament scope" }, { status: 400 });

    scopeUpdate = normalizeTournamentScopeFields(scopeParsed.data);
    if (tournamentScopeFieldsChanged(current, scopeUpdate)) {
      const editable = await canEditTournamentScope(tournamentId);
      if (!editable) {
        return NextResponse.json(
          { error: "El modo y la liga del torneo no se pueden cambiar después de agregar el primer partido." },
          { status: 409 },
        );
      }
    }
  }

  let logoUrl = body.data.logoUrl;
  const nextScope = scopeUpdate ?? current;
  if (
    logoUrl === undefined &&
    nextScope.scope === "SINGLE_LEAGUE" &&
    nextScope.externalLeagueId &&
    (hasScopeChange || !current.logoUrl)
  ) {
    logoUrl = await fetchLeagueLogoUrl(nextScope.externalLeagueId, nextScope.leagueSeason ?? undefined);
  }

  const tournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: body.data.status,
      name: body.data.name,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(scopeUpdate ?? {}),
    },
    select: {
      id: true,
      name: true,
      status: true,
      logoUrl: true,
      scope: true,
      externalLeagueId: true,
      leagueName: true,
      leagueSeason: true,
    },
  });

  const previousManagedPath = getManagedTournamentLogoObjectPath(current.logoUrl);
  const nextManagedPath = getManagedTournamentLogoObjectPath(tournament.logoUrl);
  if (previousManagedPath && previousManagedPath !== nextManagedPath) {
    await supabaseAdmin.storage.from(TOURNAMENT_LOGOS_BUCKET).remove([previousManagedPath]).catch(() => {});
  }

  return NextResponse.json({ tournament });
}
