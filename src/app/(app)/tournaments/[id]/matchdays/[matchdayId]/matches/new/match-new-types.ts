export type LeagueRow = {
  id: number;
  name: string;
  type: string;
  countryName: string;
  seasonYears: number[];
  currentSeasons: number[];
};

export type FixtureRow = {
  id: number;
  dateUtc: string;
  homeTeam: string;
  awayTeam: string;
  statusShort: string;
};

export function toLocalDateTimeInputValue(date: Date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

const DAY_MS = 24 * 60 * 60_000;

export function createDefaultSearchDates() {
  const now = Date.now();
  return {
    seasonYear: String(new Date(now).getUTCFullYear()),
    date: new Date(now).toISOString().slice(0, 10),
    from: new Date(now - 7 * DAY_MS).toISOString().slice(0, 10),
    to: new Date(now + 7 * DAY_MS).toISOString().slice(0, 10),
  };
}

export type FixtureSelection = {
  id: number;
  dateUtc: string;
  homeTeam: string;
  awayTeam: string;
};
