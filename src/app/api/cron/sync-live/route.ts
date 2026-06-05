import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { runSyncLive } from "@/lib/sync-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const token = bearer || req.headers.get("x-cron-secret") || "";
  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.info("[cron/sync-live] Starting sync");
  const result = await runSyncLive();
  console.info("[cron/sync-live]", result);

  return NextResponse.json(result);
}
