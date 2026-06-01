import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { fetchFixtureById } from "@/lib/api-football";
import { TtlCache } from "@/lib/ttl-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new TtlCache<Awaited<ReturnType<typeof fetchFixtureById>>>(500);

export async function GET(_: Request, ctx: { params: Promise<{ fixtureId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fixtureId } = await ctx.params;
  const id = Number(fixtureId);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "Invalid fixtureId" }, { status: 400 });

  // Short TTL to reduce repeated calls from UI while the user is selecting fixtures.
  const fixture = await cache.getOrSet(`fixture:${id}`, 15_000, () => fetchFixtureById(id));
  if (!fixture) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    fixture: {
      id: fixture.id,
      dateUtc: fixture.dateUtc.toISOString(),
      statusShort: fixture.statusShort,
      scoreHome: fixture.scoreHome,
      scoreAway: fixture.scoreAway,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeLogoUrl: fixture.homeLogoUrl ?? null,
      awayLogoUrl: fixture.awayLogoUrl ?? null,
    },
  });
}
