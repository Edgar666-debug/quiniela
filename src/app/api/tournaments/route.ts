import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLeagueLogoUrl } from "@/lib/api-football";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTournamentScopeFields, parseTournamentScopeInput } from "@/lib/tournament-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    name: z.string().min(1).max(80),
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

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const scopeParsed = parseTournamentScopeInput(body.data);
  if (!scopeParsed.success) return NextResponse.json({ error: "Invalid tournament scope" }, { status: 400 });
  const scopeFields = normalizeTournamentScopeFields(scopeParsed.data);

  let logoUrl = body.data.logoUrl ?? null;
  if (scopeFields.scope === "SINGLE_LEAGUE" && !logoUrl && scopeFields.externalLeagueId) {
    logoUrl = await fetchLeagueLogoUrl(scopeFields.externalLeagueId, scopeFields.leagueSeason ?? undefined);
  }

  const tournament = await prisma.tournament.create({
    data: {
      name: body.data.name,
      logoUrl,
      ...scopeFields,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
      standings: {
        create: { userId: session.user.id, points: 0 },
      },
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      scope: true,
      externalLeagueId: true,
      leagueName: true,
      leagueSeason: true,
    },
  });

  return NextResponse.json({ tournament });
}
