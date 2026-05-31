import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { searchFixtures } from "@/lib/api-football";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  league: z.coerce.number().int().positive().optional(),
  season: z.coerce.number().int().min(1900).max(2100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  team: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.string().min(1).max(8).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const fixtures = await searchFixtures(parsed.data);

  return NextResponse.json({
    fixtures: fixtures.map((f) => ({
      id: f.id,
      dateUtc: f.dateUtc.toISOString(),
      statusShort: f.statusShort,
      scoreHome: f.scoreHome,
      scoreAway: f.scoreAway,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      leagueId: f.leagueId ?? null,
      leagueName: f.leagueName ?? null,
      season: f.season ?? null,
      round: f.round ?? null,
    })),
  });
}
