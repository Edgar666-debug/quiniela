import { env } from "@/lib/env";

type ApiFootballFixtureResponse = {
  response: Array<{
    fixture: {
      id: number;
      date: string;
      status: { short: string; long: string };
    };
    goals: { home: number | null; away: number | null };
  }>;
};

export async function fetchFixtureById(fixtureId: number) {
  const url = new URL("/fixtures", env.API_FOOTBALL_BASE_URL);
  url.searchParams.set("id", String(fixtureId));

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": env.API_FOOTBALL_KEY,
    },
    cache: "no-store",
  });

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
  };
}

