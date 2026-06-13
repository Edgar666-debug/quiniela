import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getApiFootballPlanConfig } from "@/lib/api-football-plan";
import { createWidgetAccessToken } from "@/lib/api-football-widget-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveWidgetProxyBaseUrl(reqHeaders: Headers): string {
  const host = reqHeaders.get("x-forwarded-host") ?? reqHeaders.get("host") ?? "localhost:3000";
  const proto = reqHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api/api-football/widget-proxy/`;
}

export async function GET() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getApiFootballPlanConfig();

  return NextResponse.json({
    widgetApiBaseUrl: resolveWidgetProxyBaseUrl(reqHeaders),
    widgetAccessToken: createWidgetAccessToken(session.user.id),
    lang: "es",
    refreshSeconds: plan.widgetGameRefreshSeconds,
    tier: plan.tier,
  });
}
