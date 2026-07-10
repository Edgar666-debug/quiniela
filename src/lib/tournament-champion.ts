import { fetchCurrentRound, fetchFixturesByIds, fetchTeamsByLeague, type TeamSearchItem } from "@/lib/api-football";
import { FINISHED_STATUSES } from "@/lib/football";
import { prisma } from "@/lib/prisma";

export const CHAMPION_BONUS_POINTS = 3;

export type ChampionOption = {
  name: string;
  logoUrl: string | null;
};

export type ChampionPickState = {
  enabled: boolean;
  editable: boolean;
  scope: "OPEN" | "SINGLE_LEAGUE";
  status: "ACTIVE" | "FINISHED" | "ARCHIVED";
  myChampion: string | null;
  officialChampion: string | null;
  resolvedChampion: string | null;
  options: ChampionOption[];
};

type TournamentChampionContext = {
  id: string;
  scope: "OPEN" | "SINGLE_LEAGUE";
  status: "ACTIVE" | "FINISHED" | "ARCHIVED";
  champion: string | null;
  championPicksEnabled: boolean;
  externalLeagueId: number | null;
  leagueSeason: number | null;
};

export function normalizeChampionName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function dedupeChampionOptions(options: ChampionOption[]) {
  const unique = new Map<string, ChampionOption>();
  for (const option of options) {
    const key = normalizeChampionName(option.name);
    if (!key || unique.has(key)) continue;
    unique.set(key, { name: option.name.trim(), logoUrl: option.logoUrl ?? null });
  }
  return Array.from(unique.values()).sort((left, right) => left.name.localeCompare(right.name, "es"));
}

function withChampionOptions(options: ChampionOption[], ...champions: Array<string | null>) {
  return dedupeChampionOptions([
    ...champions.filter((champion): champion is string => Boolean(champion)).map((champion) => ({ name: champion, logoUrl: null })),
    ...options,
  ]);
}

function normalizeRoundName(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function isFinalRound(round: string | null | undefined) {
  const value = round?.trim();
  if (!value) return false;
  return /^final$/i.test(value);
}

function toChampionOptionsFromApiTeams(teams: TeamSearchItem[]) {
  return dedupeChampionOptions(
    teams.map((team) => ({
      name: team.name,
      logoUrl: team.logoUrl ?? null,
    })),
  );
}

export async function getTournamentChampionOptions(tournament: Pick<TournamentChampionContext, "id" | "externalLeagueId" | "leagueSeason">) {
  const matches = await prisma.match.findMany({
    where: { matchday: { tournamentId: tournament.id } },
    orderBy: [{ startsAtUtc: "asc" }],
    select: {
      externalFixtureId: true,
      homeTeam: true,
      awayTeam: true,
      homeLogoUrl: true,
      awayLogoUrl: true,
      statusShort: true,
    },
  });

  if (matches.length > 0) {
    const fixtureIds = matches
      .map((match) => match.externalFixtureId)
      .filter((fixtureId): fixtureId is number => fixtureId != null);

    const fixturesById = fixtureIds.length > 0 ? await fetchFixturesByIds(fixtureIds).catch(() => new Map()) : new Map();
    const currentRound =
      tournament.externalLeagueId && tournament.leagueSeason
        ? await fetchCurrentRound({
            league: tournament.externalLeagueId,
            season: tournament.leagueSeason,
          }).catch(() => null)
        : null;

    if (currentRound) {
      const currentRoundTeams = matches.filter((match) => {
        if (!match.externalFixtureId) return false;
        return normalizeRoundName(fixturesById.get(match.externalFixtureId)?.round) === normalizeRoundName(currentRound);
      });

      if (currentRoundTeams.length > 0) {
        return dedupeChampionOptions(
          currentRoundTeams.flatMap((match) => [
            { name: match.homeTeam, logoUrl: match.homeLogoUrl ?? null },
            { name: match.awayTeam, logoUrl: match.awayLogoUrl ?? null },
          ]),
        );
      }
    }

    return dedupeChampionOptions(
      matches.flatMap((match) => [
        { name: match.homeTeam, logoUrl: match.homeLogoUrl ?? null },
        { name: match.awayTeam, logoUrl: match.awayLogoUrl ?? null },
      ]),
    );
  }

  if (!tournament.externalLeagueId || !tournament.leagueSeason) return [];

  const teams = await fetchTeamsByLeague({
    league: tournament.externalLeagueId,
    season: tournament.leagueSeason,
  }).catch(() => []);

  return toChampionOptionsFromApiTeams(teams);
}

export async function inferTournamentChampion(tournamentId: string) {
  const matches = await prisma.match.findMany({
    where: { matchday: { tournamentId } },
    orderBy: [{ startsAtUtc: "desc" }],
    select: {
      externalFixtureId: true,
      startsAtUtc: true,
      homeTeam: true,
      awayTeam: true,
      statusShort: true,
      scoreHome: true,
      scoreAway: true,
    },
  });

  const fixtureIds = matches
    .map((match) => match.externalFixtureId)
    .filter((fixtureId): fixtureId is number => fixtureId != null);

  if (fixtureIds.length === 0) return null;

  const fixturesById = await fetchFixturesByIds(fixtureIds).catch(() => new Map());

  for (const match of matches) {
    if (!match.externalFixtureId) continue;
    if (!FINISHED_STATUSES.has(match.statusShort)) continue;

    const fixture = fixturesById.get(match.externalFixtureId);
    if (!fixture || !isFinalRound(fixture.round) || !fixture.winnerSide) continue;

    return fixture.winnerSide === "home" ? match.homeTeam : match.awayTeam;
  }

  return null;
}

export async function resolveTournamentChampion(tournament: TournamentChampionContext) {
  if (tournament.scope !== "SINGLE_LEAGUE") return null;
  if (tournament.champion) return tournament.champion;
  return inferTournamentChampion(tournament.id);
}

export async function getChampionPickState(tournamentId: string, userId: string) {
  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: { champion: true },
  });
  if (!membership) return null;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      scope: true,
      status: true,
      champion: true,
      championPicksEnabled: true,
      externalLeagueId: true,
      leagueSeason: true,
    },
  });
  if (!tournament) return null;

  const resolvedChampion = await resolveTournamentChampion(tournament);
  const options =
    tournament.scope === "SINGLE_LEAGUE"
      ? withChampionOptions(await getTournamentChampionOptions(tournament), tournament.champion, membership.champion ?? resolvedChampion)
      : [];

  return {
    enabled: tournament.scope === "SINGLE_LEAGUE" && tournament.championPicksEnabled,
    editable: tournament.scope === "SINGLE_LEAGUE" && tournament.championPicksEnabled && tournament.status === "ACTIVE",
    scope: tournament.scope,
    status: tournament.status,
    myChampion: membership.champion,
    officialChampion: tournament.champion,
    resolvedChampion,
    options,
  } satisfies ChampionPickState;
}

export async function validateChampionSelection(tournament: Pick<TournamentChampionContext, "id" | "externalLeagueId" | "leagueSeason">, champion: string) {
  const options = await getTournamentChampionOptions(tournament);
  const normalizedTarget = normalizeChampionName(champion);
  const match = options.find((option) => normalizeChampionName(option.name) === normalizedTarget);
  return { match: match ?? null, options };
}
