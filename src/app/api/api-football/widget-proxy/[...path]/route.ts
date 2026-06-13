import { NextResponse } from "next/server";

import { verifyWidgetAccessToken } from "@/lib/api-football-widget-token";
import { env } from "@/lib/env";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildTargetUrl(pathSegments: string[], search: string) {
  const base = env.API_FOOTBALL_BASE_URL.replace(/\/+$/, "");
  const path = pathSegments.filter(Boolean).join("/");
  const url = new URL(path ? `${base}/${path}` : base);
  url.search = search;
  return url;
}

async function proxyRequest(req: Request, pathSegments: string[]) {
  const widgetKey = req.headers.get("x-apisports-key") ?? "";
  const token = verifyWidgetAccessToken(widgetKey);
  if (!token.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit({
    key: `api-football:widget-proxy:${token.userId}:${getRequestIp(req)}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited", retryAfterSeconds: rl.retryAfterSeconds }, { status: 429 });
  }

  const incoming = new URL(req.url);
  const target = buildTargetUrl(pathSegments, incoming.search);

  const upstream = await fetch(target.toString(), {
    headers: {
      "x-apisports-key": env.API_FOOTBALL_KEY,
      accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=15",
    },
  });
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyRequest(req, path ?? []);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, x-apisports-key",
      "Access-Control-Max-Age": "3600",
    },
  });
}
