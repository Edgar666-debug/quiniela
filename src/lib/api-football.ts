import { env } from "@/lib/env";

type ApiFootballFixtureResponse = {
  response: Array<{
    fixture: {
      id: number;
      date: string;
      status: { short: string; long: string };
    };
    league?: { id?: number; name?: string; season?: number; round?: string };
    teams: {
      home: { name: string; logo?: string };
      away: { name: string; logo?: string };
    };
    goals: { home: number | null; away: number | null };
  }>;
};

type ApiFootballLeaguesResponse = {
  response: Array<{
    league: { id: number; name: string; type: string; logo?: string };
    country: { name: string; code?: string | null; flag?: string | null };
    seasons?: Array<{ year: number; start?: string; end?: string; current?: boolean }>;
  }>;
};

type FixtureData = {
  id: number;
  dateUtc: Date;
  statusShort: string;
  scoreHome: number | null;
  scoreAway: number | null;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  leagueId?: number;
  leagueName?: string;
  season?: number;
  round?: string;
};

type CacheEntry<T> = { expiresAtMs: number; value: T };
const responseCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

function stableCacheKey(url: URL) {
  const params = Array.from(url.searchParams.entries()).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1));
  const u = new URL(url.toString());
  u.search = "";
  for (const [k, v] of params) u.searchParams.append(k, v);
  return u.toString();
}

async function apiFootballRequest(url: URL, attempt = 0): Promise<Response> {
  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": env.API_FOOTBALL_KEY,
    },
    cache: "no-store",
  });

  if ((res.status === 429 || res.status >= 500) && attempt < 2) {
    const retryAfter = Number(res.headers.get("retry-after") ?? "");
    const delayMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 400 * (attempt + 1);
    await new Promise((r) => setTimeout(r, delayMs));
    return apiFootballRequest(url, attempt + 1);
  }

  return res;
}

async function requestJsonCached<T>(url: URL, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const key = stableCacheKey(url);
  const now = Date.now();

  const cached = responseCache.get(key);
  if (cached && now < cached.expiresAtMs) return cached.value as T;

  const existing = inFlight.get(key);
  if (existing) return (await existing) as T;

  const p = (async () => {
    const value = await fetcher();
    responseCache.set(key, { expiresAtMs: now + ttlMs, value });
    return value;
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, p);
  return (await p) as T;
}

export async function fetchFixturesByIds(fixtureIds: number[]): Promise<Map<number, FixtureData>> {
  const ids = Array.from(new Set(fixtureIds.filter((id) => Number.isFinite(id) && id > 0))).slice(0, 20);
  if (ids.length === 0) return new Map();

  async function fetchBatch(batch: number[]): Promise<Map<number, FixtureData>> {
    const url = new URL("/fixtures", env.API_FOOTBALL_BASE_URL);
    if (batch.length === 1) url.searchParams.set("id", String(batch[0]));
    else url.searchParams.set("ids", batch.join("-"));

    return requestJsonCached(url, 15_000, async () => {
      const res = await apiFootballRequest(url);

      // API-Football returns 204 for "No Content". In practice, we also occasionally see 204 for multi-id lookups
      // where only part of the batch is available. To avoid missing valid fixtures, we fall back to splitting.
      if (res.status === 204) return new Map<number, FixtureData>();

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`API-Football error ${res.status}: ${body}`);
      }

      const json = (await res.json()) as ApiFootballFixtureResponse;
      const out = new Map<number, FixtureData>();
      for (const row of json.response ?? []) {
        out.set(row.fixture.id, {
          id: row.fixture.id,
          dateUtc: new Date(row.fixture.date),
          statusShort: row.fixture.status.short,
          scoreHome: row.goals.home,
          scoreAway: row.goals.away,
          homeTeam: row.teams.home.name,
          awayTeam: row.teams.away.name,
          homeLogoUrl: row.teams.home.logo ?? null,
          awayLogoUrl: row.teams.away.logo ?? null,
          leagueId: row.league?.id,
          leagueName: row.league?.name,
          season: row.league?.season,
          round: row.league?.round,
        });
      }
      return out;
    });
  }

  async function fetchRobust(batch: number[], depth = 0): Promise<Map<number, FixtureData>> {
    const result = await fetchBatch(batch);
    if (result.size > 0 || batch.length <= 1 || depth >= 5) return result;

    const mid = Math.ceil(batch.length / 2);
    const left = batch.slice(0, mid);
    const right = batch.slice(mid);
    const [a, b] = await Promise.all([fetchRobust(left, depth + 1), fetchRobust(right, depth + 1)]);
    const merged = new Map<number, FixtureData>();
    for (const [k, v] of a) merged.set(k, v);
    for (const [k, v] of b) merged.set(k, v);
    return merged;
  }

  return fetchRobust(ids);
}

export async function fetchFixtureById(fixtureId: number) {
  const url = new URL("/fixtures", env.API_FOOTBALL_BASE_URL);
  url.searchParams.set("id", String(fixtureId));

  return requestJsonCached(url, 15_000, async () => {
    const res = await apiFootballRequest(url);
    if (res.status === 204) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API-Football error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as ApiFootballFixtureResponse;
    const fixture = json.response?.[0];
    if (!fixture) return null;

    return {
      id: fixture.fixture.id,
      dateUtc: new Date(fixture.fixture.date),
      statusShort: fixture.fixture.status.short,
      scoreHome: fixture.goals.home,
      scoreAway: fixture.goals.away,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeLogoUrl: fixture.teams.home.logo ?? null,
      awayLogoUrl: fixture.teams.away.logo ?? null,
      leagueId: fixture.league?.id,
      leagueName: fixture.league?.name,
      season: fixture.league?.season,
      round: fixture.league?.round,
    } satisfies FixtureData;
  });
}

export async function searchFixtures(params: {
  league?: number;
  season?: number;
  date?: string; // YYYY-MM-DD
  team?: number;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  status?: string;
  limit?: number;
}): Promise<FixtureData[]> {
  const url = new URL("/fixtures", env.API_FOOTBALL_BASE_URL);
  if (params.league) url.searchParams.set("league", String(params.league));
  if (params.season) url.searchParams.set("season", String(params.season));
  if (params.date) url.searchParams.set("date", params.date);
  if (params.team) url.searchParams.set("team", String(params.team));
  if (params.from) url.searchParams.set("from", params.from);
  if (params.to) url.searchParams.set("to", params.to);
  if (params.status) url.searchParams.set("status", params.status);

  const out = await requestJsonCached(url, 30_000, async () => {
    const res = await apiFootballRequest(url);
    if (res.status === 204) return [] as FixtureData[];
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API-Football error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as ApiFootballFixtureResponse;
    const arr: FixtureData[] = [];
    for (const row of json.response ?? []) {
      arr.push({
        id: row.fixture.id,
        dateUtc: new Date(row.fixture.date),
        statusShort: row.fixture.status.short,
        scoreHome: row.goals.home,
        scoreAway: row.goals.away,
        homeTeam: row.teams.home.name,
        awayTeam: row.teams.away.name,
        homeLogoUrl: row.teams.home.logo ?? null,
        awayLogoUrl: row.teams.away.logo ?? null,
        leagueId: row.league?.id,
        leagueName: row.league?.name,
        season: row.league?.season,
        round: row.league?.round,
      });
    }
    return arr;
  });

  const limit = Math.min(Math.max(params.limit ?? 25, 1), 50);
  return out.slice(0, limit);
}

export type LeagueSearchItem = {
  id: number;
  name: string;
  type: string;
  countryName: string;
  countryCode?: string | null;
  seasonYears: number[];
  currentSeasons: number[];
};

export async function searchLeagues(params: { search: string; season?: number; current?: boolean; limit?: number }) {
  const url = new URL("/leagues", env.API_FOOTBALL_BASE_URL);
  url.searchParams.set("search", params.search);
  if (params.season) url.searchParams.set("season", String(params.season));
  if (params.current !== undefined) url.searchParams.set("current", String(params.current));

  const out = await requestJsonCached(url, 6 * 60 * 60_000, async () => {
    const res = await apiFootballRequest(url);
    if (res.status === 204) return [] as LeagueSearchItem[];
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API-Football error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as ApiFootballLeaguesResponse;
    const arr: LeagueSearchItem[] = [];
    for (const row of json.response ?? []) {
      const years: number[] = [];
      const currentYears: number[] = [];
      for (const s of row.seasons ?? []) {
        if (Number.isFinite(s.year)) years.push(s.year);
        if (s.current) currentYears.push(s.year);
      }
      arr.push({
        id: row.league.id,
        name: row.league.name,
        type: row.league.type,
        countryName: row.country.name,
        countryCode: row.country.code ?? null,
        seasonYears: Array.from(new Set(years)).sort((a, b) => b - a),
        currentSeasons: Array.from(new Set(currentYears)).sort((a, b) => b - a),
      });
    }
    return arr;
  });

  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  return out.slice(0, limit);
}
