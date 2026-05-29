import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { fetchFixtureById } from "@/lib/api-football";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ fixtureId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fixtureId } = await ctx.params;
  const id = Number(fixtureId);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "Invalid fixtureId" }, { status: 400 });

  const fixture = await fetchFixtureById(id);
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
    },
  });
}

