import { env } from "@/lib/env";

type ApiFootballFixtureResponse = {
  response: Array<{
    fixture: {
      id: number;
      date: string;
      status: { short: string; long: string };
    };
    teams: {
      home: { name: string };
      away: { name: string };
    };
    goals: { home: number | null; away: number | null };
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
  } satisfies FixtureData;
}
