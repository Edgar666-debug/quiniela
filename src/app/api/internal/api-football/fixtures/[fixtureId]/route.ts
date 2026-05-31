import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { fetchFixtureById } from "@/lib/api-football";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  fixtureId: z.coerce.number().int().positive(),
});

function isAuthorized(req: Request) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const token = bearer || req.headers.get("x-cron-secret") || url.searchParams.get("cronSecret") || "";
  return token === env.CRON_SECRET;
}

export async function GET(req: Request, ctx: { params: Promise<{ fixtureId: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawParams = await ctx.params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) return NextResponse.json({ error: "Invalid fixtureId" }, { status: 400 });

  const fixture = await fetchFixtureById(parsed.data.fixtureId);
  if (!fixture) return NextResponse.json({ fixture: null }, { status: 200 });

  return NextResponse.json({
    fixture: {
      id: fixture.id,
      dateUtc: fixture.dateUtc.toISOString(),
      statusShort: fixture.statusShort,
      scoreHome: fixture.scoreHome,
      scoreAway: fixture.scoreAway,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      leagueId: fixture.leagueId ?? null,
      leagueName: fixture.leagueName ?? null,
      season: fixture.season ?? null,
      round: fixture.round ?? null,
    },
  });
}
