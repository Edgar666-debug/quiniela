import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { searchLeagues } from "@/lib/api-football";
import { TtlCache } from "@/lib/ttl-cache";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new TtlCache<Awaited<ReturnType<typeof searchLeagues>>>(300);

const querySchema = z.object({
  q: z.string().trim().min(3).max(64),
  season: z.coerce.number().int().min(1900).max(2100).optional(),
  current: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit({
    key: `api-football:leagues:search:${session.user.id}:${getRequestIp(req)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited", retryAfterSeconds: rl.retryAfterSeconds }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const key = `leagues:${parsed.data.q}:${parsed.data.season ?? ""}:${parsed.data.current ?? ""}:${parsed.data.limit ?? ""}`;
  const leagues = await cache.getOrSet(key, 6 * 60 * 60_000, () =>
    searchLeagues({
      search: parsed.data.q,
      season: parsed.data.season,
      current: parsed.data.current,
      limit: parsed.data.limit,
    }),
  );

  return NextResponse.json({ leagues });
}
