import { env } from "@/lib/env";

export type ApiFootballPlanTier = "free" | "pro";

export type ApiFootballPlanConfig = {
  tier: ApiFootballPlanTier;
  planName: string | null;
  subscriptionActive: boolean | null;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
  reserveForInteractive: number;
  syncMaxMatches: number;
  syncMaxApiCalls: number;
  fixtureCacheMs: number;
  searchCacheMs: number;
  leagueCacheMs: number;
  teamCacheMs: number;
  widgetGameRefreshSeconds: number | false;
  allowParallelSyncChunks: boolean;
  source: "status" | "override" | "fallback";
};

export class ApiFootballQuotaError extends Error {
  readonly remaining: number;
  readonly dailyLimit: number;

  constructor(message: string, remaining: number, dailyLimit: number) {
    super(message);
    this.name = "ApiFootballQuotaError";
    this.remaining = remaining;
    this.dailyLimit = dailyLimit;
  }
}

type StatusResponse = {
  response?: {
    subscription?: { plan?: string; active?: boolean };
    requests?: { current?: number; limit_day?: number };
  };
};

const TIER_DEFAULTS: Record<
  ApiFootballPlanTier,
  Omit<
    ApiFootballPlanConfig,
    "tier" | "planName" | "subscriptionActive" | "dailyUsed" | "dailyRemaining" | "source"
  > & { dailyLimit: number }
> = {
  free: {
    dailyLimit: 100,
    reserveForInteractive: 35,
    syncMaxMatches: 15,
    syncMaxApiCalls: 2,
    fixtureCacheMs: 60_000,
    searchCacheMs: 120_000,
    leagueCacheMs: 12 * 60 * 60_000,
    teamCacheMs: 2 * 60 * 60_000,
    widgetGameRefreshSeconds: 120,
    allowParallelSyncChunks: false,
  },
  pro: {
    dailyLimit: 7500,
    reserveForInteractive: 500,
    syncMaxMatches: 200,
    syncMaxApiCalls: 15,
    fixtureCacheMs: 15_000,
    searchCacheMs: 30_000,
    leagueCacheMs: 6 * 60 * 60_000,
    teamCacheMs: 60 * 60_000,
    widgetGameRefreshSeconds: 30,
    allowParallelSyncChunks: true,
  },
};

const STATUS_CACHE_MS = 5 * 60_000;

let cachedPlan: { expiresAtMs: number; value: ApiFootballPlanConfig } | null = null;
let quotaSnapshot: { dailyLimit: number; dailyRemaining: number; updatedAtMs: number } | null = null;

function tierFromDailyLimit(limitDay: number): ApiFootballPlanTier {
  return limitDay <= 150 ? "free" : "pro";
}

function tierFromEnvOverride(): ApiFootballPlanTier | null {
  const value = env.API_FOOTBALL_PLAN;
  if (value === "free" || value === "pro") return value;
  return null;
}

function buildPlanConfig(input: {
  tier: ApiFootballPlanTier;
  planName: string | null;
  subscriptionActive: boolean | null;
  dailyUsed: number;
  dailyLimit: number;
  source: ApiFootballPlanConfig["source"];
}): ApiFootballPlanConfig {
  const defaults = TIER_DEFAULTS[input.tier];
  const dailyLimit = input.dailyLimit > 0 ? input.dailyLimit : defaults.dailyLimit;
  const dailyUsed = Math.max(0, Math.min(input.dailyUsed, dailyLimit));
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  return {
    tier: input.tier,
    planName: input.planName,
    subscriptionActive: input.subscriptionActive,
    dailyLimit,
    dailyUsed,
    dailyRemaining,
    reserveForInteractive: defaults.reserveForInteractive,
    syncMaxMatches: defaults.syncMaxMatches,
    syncMaxApiCalls: defaults.syncMaxApiCalls,
    fixtureCacheMs: defaults.fixtureCacheMs,
    searchCacheMs: defaults.searchCacheMs,
    leagueCacheMs: defaults.leagueCacheMs,
    teamCacheMs: defaults.teamCacheMs,
    widgetGameRefreshSeconds: defaults.widgetGameRefreshSeconds,
    allowParallelSyncChunks: defaults.allowParallelSyncChunks,
    source: input.source,
  };
}

async function fetchStatusFromApi(): Promise<StatusResponse["response"] | null> {
  const url = new URL("/status", env.API_FOOTBALL_BASE_URL);
  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": env.API_FOOTBALL_KEY },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as StatusResponse;
  return json.response ?? null;
}

export function recordApiFootballQuotaFromHeaders(headers: Headers) {
  const remainingHeader = headers.get("x-ratelimit-requests-remaining");
  const limitHeader = headers.get("x-ratelimit-requests-limit");

  const remaining = remainingHeader !== null ? Number(remainingHeader) : NaN;
  const limit = limitHeader !== null ? Number(limitHeader) : NaN;

  if (!Number.isFinite(remaining) || !Number.isFinite(limit) || limit <= 0) return;

  quotaSnapshot = {
    dailyLimit: limit,
    dailyRemaining: Math.max(0, remaining),
    updatedAtMs: Date.now(),
  };
}

export async function refreshApiFootballPlanConfig(): Promise<ApiFootballPlanConfig> {
  const override = tierFromEnvOverride();
  const status = await fetchStatusFromApi();

  if (status?.requests) {
    const limitDay = status.requests.limit_day ?? (override ? TIER_DEFAULTS[override].dailyLimit : TIER_DEFAULTS.free.dailyLimit);
    const tier = override ?? tierFromDailyLimit(limitDay);
    const current = status.requests.current ?? 0;

    const plan = buildPlanConfig({
      tier,
      planName: status.subscription?.plan ?? null,
      subscriptionActive: status.subscription?.active ?? null,
      dailyUsed: current,
      dailyLimit: limitDay,
      source: override ? "override" : "status",
    });

    quotaSnapshot = {
      dailyLimit: plan.dailyLimit,
      dailyRemaining: plan.dailyRemaining,
      updatedAtMs: Date.now(),
    };
    cachedPlan = { expiresAtMs: Date.now() + STATUS_CACHE_MS, value: plan };
    return plan;
  }

  const tier = override ?? "free";
  const fallback = buildPlanConfig({
    tier,
    planName: null,
    subscriptionActive: null,
    dailyUsed: 0,
    dailyLimit: TIER_DEFAULTS[tier].dailyLimit,
    source: override ? "override" : "fallback",
  });

  cachedPlan = { expiresAtMs: Date.now() + STATUS_CACHE_MS, value: fallback };
  return fallback;
}

export async function getApiFootballPlanConfig(): Promise<ApiFootballPlanConfig> {
  const now = Date.now();
  if (cachedPlan && now < cachedPlan.expiresAtMs) {
    const plan = cachedPlan.value;
    if (quotaSnapshot && quotaSnapshot.dailyLimit === plan.dailyLimit) {
      return {
        ...plan,
        dailyRemaining: quotaSnapshot.dailyRemaining,
        dailyUsed: Math.max(0, plan.dailyLimit - quotaSnapshot.dailyRemaining),
      };
    }
    return plan;
  }
  return refreshApiFootballPlanConfig();
}

export type ApiFootballCacheKind = "fixture" | "search" | "league" | "team";

export async function getPlanCacheTtl(kind: ApiFootballCacheKind): Promise<number> {
  const plan = await getApiFootballPlanConfig();
  switch (kind) {
    case "fixture":
      return plan.fixtureCacheMs;
    case "search":
      return plan.searchCacheMs;
    case "league":
      return plan.leagueCacheMs;
    case "team":
      return plan.teamCacheMs;
  }
}

export async function canAffordApiCalls(required: number): Promise<{
  ok: boolean;
  reason?: string;
  plan: ApiFootballPlanConfig;
}> {
  const plan = await getApiFootballPlanConfig();
  const available = plan.dailyRemaining - plan.reserveForInteractive;

  if (required > available) {
    return {
      ok: false,
      plan,
      reason:
        plan.tier === "free"
          ? `Cuota diaria de API-Football casi agotada (${plan.dailyRemaining}/${plan.dailyLimit} restantes). La sincronización se pospone para reservar llamadas a las búsquedas.`
          : `Cuota diaria de API-Football insuficiente (${plan.dailyRemaining}/${plan.dailyLimit} restantes).`,
    };
  }

  return { ok: true, plan };
}

export function quotaErrorMessage(err: ApiFootballQuotaError): string {
  if (err.dailyLimit <= 150) {
    return `Cuota diaria de API-Football agotada (${err.remaining} restantes). Vuelve a intentarlo mañana o revisa tu plan en api-football.com.`;
  }
  return `Cuota diaria de API-Football agotada (${err.remaining}/${err.dailyLimit} restantes).`;
}
