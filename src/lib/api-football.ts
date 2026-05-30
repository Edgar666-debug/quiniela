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
      home: { name: string };
      away: { name: string };
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
  leagueId?: number;
  leagueName?: string;
  season?: number;
  round?: string;
};

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

export async function fetchFixturesByIds(fixtureIds: number[]): Promise<Map<number, FixtureData>> {
  const ids = Array.from(new Set(fixtureIds.filter((id) => Number.isFinite(id) && id > 0))).slice(0, 20);
  if (ids.length === 0) return new Map();

  const url = new URL("/fixtures", env.API_FOOTBALL_BASE_URL);
  if (ids.length === 1) url.searchParams.set("id", String(ids[0]));
  else url.searchParams.set("ids", ids.join("-"));

  const res = await apiFootballRequest(url);

  if (res.status === 204) return new Map();

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
      leagueId: row.league?.id,
      leagueName: row.league?.name,
      season: row.league?.season,
      round: row.league?.round,
    });
  }
  return out;
}

export async function fetchFixtureById(fixtureId: number) {
  const url = new URL("/fixtures", env.API_FOOTBALL_BASE_URL);
  url.searchParams.set("id", String(fixtureId));

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
    leagueId: fixture.league?.id,
    leagueName: fixture.league?.name,
    season: fixture.league?.season,
    round: fixture.league?.round,
  } satisfies FixtureData;
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

  const res = await apiFootballRequest(url);
  if (res.status === 204) return [];
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API-Football error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as ApiFootballFixtureResponse;
  const out: FixtureData[] = [];
  for (const row of json.response ?? []) {
    out.push({
      id: row.fixture.id,
      dateUtc: new Date(row.fixture.date),
      statusShort: row.fixture.status.short,
      scoreHome: row.goals.home,
      scoreAway: row.goals.away,
      homeTeam: row.teams.home.name,
      awayTeam: row.teams.away.name,
      leagueId: row.league?.id,
      leagueName: row.league?.name,
      season: row.league?.season,
      round: row.league?.round,
    });
  }

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

  const res = await apiFootballRequest(url);
  if (res.status === 204) return [];
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API-Football error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as ApiFootballLeaguesResponse;
  const out: LeagueSearchItem[] = [];
  for (const row of json.response ?? []) {
    const years = (row.seasons ?? []).map((s) => s.year).filter((y) => Number.isFinite(y));
    const currentYears = (row.seasons ?? []).filter((s) => s.current).map((s) => s.year);
    out.push({
      id: row.league.id,
      name: row.league.name,
      type: row.league.type,
      countryName: row.country.name,
      countryCode: row.country.code ?? null,
      seasonYears: Array.from(new Set(years)).sort((a, b) => b - a),
      currentSeasons: Array.from(new Set(currentYears)).sort((a, b) => b - a),
    });
  }

  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  return out.slice(0, limit);
}
