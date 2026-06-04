import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { searchPlayers } from "@/lib/api-football";
import { TtlCache } from "@/lib/ttl-cache";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new TtlCache<Awaited<ReturnType<typeof searchPlayers>>>(200);

const querySchema = z.object({
  q: z.string().trim().min(3).max(64),
  season: z.coerce.number().int().min(1900).max(2100).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit({
    key: `api-football:players:search:${session.user.id}:${getRequestIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited", retryAfterSeconds: rl.retryAfterSeconds }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const key = `players:${parsed.data.q}:${parsed.data.season ?? ""}:${parsed.data.limit ?? ""}`;
  const players = await cache.getOrSet(key, 60 * 60_000, () =>
    searchPlayers({ search: parsed.data.q, season: parsed.data.season, limit: parsed.data.limit }),
  );

  return NextResponse.json({ players });
}
