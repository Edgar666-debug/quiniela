export type SearchTab = "league" | "team";
export type SearchMode = "date" | "range";

export type LeagueRow = {
  id: number;
  name: string;
  type: string;
  countryName: string;
  logoUrl?: string | null;
  seasonYears: number[];
  currentSeasons: number[];
};

export type TeamRow = {
  id: number;
  name: string;
  logoUrl?: string | null;
  city?: string | null;
  country?: string | null;
};

export type FixtureRow = {
  id: number;
  dateUtc: string;
  homeTeam: string;
  awayTeam: string;
  statusShort: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  leagueName?: string | null;
  round?: string | null;
};

export function toLocalDateTimeInputValue(date: Date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

const DAY_MS = 24 * 60 * 60_000;

export function createSeasonOptions(currentYear = new Date().getUTCFullYear(), span = 8) {
  return Array.from({ length: span + 1 }, (_, index) => String(currentYear - index));
}

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
