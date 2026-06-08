import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { searchFixtures } from "@/lib/api-football";
import { TtlCache } from "@/lib/ttl-cache";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new TtlCache<Awaited<ReturnType<typeof searchFixtures>>>(500);

const querySchema = z.object({
  league: z.coerce.number().int().positive().optional(),
  season: z.coerce.number().int().min(1900).max(2100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  team: z.coerce.number().int().positive().optional(),
  player: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.string().min(1).max(8).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit({
    key: `api-football:fixtures:search:${session.user.id}:${getRequestIp(req)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited", retryAfterSeconds: rl.retryAfterSeconds }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const q = parsed.data;
  const hasEntity = q.league !== undefined || q.team !== undefined || q.player !== undefined;
  const hasDate = q.date !== undefined;
  const hasFrom = q.from !== undefined;
  const hasTo = q.to !== undefined;
  const hasRange = hasFrom || hasTo;

  if (hasEntity && q.season === undefined) {
    return NextResponse.json({ error: "Season is required when filtering by league, team or player." }, { status: 400 });
  }
  if (!hasDate && !hasRange) {
    return NextResponse.json({ error: "Provide either date or from/to." }, { status: 400 });
  }
  if (hasDate && hasRange) {
    return NextResponse.json({ error: "Use either date or from/to, not both." }, { status: 400 });
  }
  if (hasRange && (!hasFrom || !hasTo)) {
    return NextResponse.json({ error: "Both from and to are required for range searches." }, { status: 400 });
  }

  const key = `fixtures:${q.league ?? ""}:${q.season ?? ""}:${q.date ?? ""}:${q.from ?? ""}:${q.to ?? ""}:${q.team ?? ""}:${q.player ?? ""}:${q.status ?? ""}:${q.limit ?? ""}`;

  let fixtures: Awaited<ReturnType<typeof searchFixtures>>;
  try {
    // Short TTL to protect API quota. Users can always hit refresh/search again.
    fixtures = await cache.getOrSet(key, 30_000, () => searchFixtures({ ...q, player: q.player }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al buscar fixtures.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  return NextResponse.json({
    fixtures: fixtures.map((f) => ({
      id: f.id,
      dateUtc: f.dateUtc.toISOString(),
      statusShort: f.statusShort,
      scoreHome: f.scoreHome,
      scoreAway: f.scoreAway,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      homeLogoUrl: f.homeLogoUrl ?? null,
      awayLogoUrl: f.awayLogoUrl ?? null,
      leagueId: f.leagueId ?? null,
      leagueName: f.leagueName ?? null,
      season: f.season ?? null,
      round: f.round ?? null,
    })),
  });
}
