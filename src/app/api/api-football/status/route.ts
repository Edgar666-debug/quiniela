import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getApiFootballPlanConfig, refreshApiFootballPlanConfig } from "@/lib/api-football-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";

  const plan = refresh ? await refreshApiFootballPlanConfig() : await getApiFootballPlanConfig();

  return NextResponse.json({
    tier: plan.tier,
    planName: plan.planName,
    subscriptionActive: plan.subscriptionActive,
    dailyLimit: plan.dailyLimit,
    dailyUsed: plan.dailyUsed,
    dailyRemaining: plan.dailyRemaining,
    reserveForInteractive: plan.reserveForInteractive,
    syncMaxMatches: plan.syncMaxMatches,
    syncMaxApiCalls: plan.syncMaxApiCalls,
    widgetGameRefreshSeconds: plan.widgetGameRefreshSeconds,
    source: plan.source,
  });
}
