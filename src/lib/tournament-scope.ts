import { prisma } from "@/lib/prisma";

export type {
  FixtureLeagueInfo,
  TournamentLeagueConfig,
  TournamentScopeValue,
} from "@/lib/tournament-scope-shared";
export {
  assertFixtureAllowedForTournament,
  formatTournamentScopeLabel,
  normalizeTournamentScopeFields,
  parseTournamentScopeInput,
  tournamentScopeFieldsChanged,
} from "@/lib/tournament-scope-shared";

export async function canEditTournamentScope(tournamentId: string): Promise<boolean> {
  const count = await prisma.match.count({ where: { matchday: { tournamentId } } });
  return count === 0;
}
