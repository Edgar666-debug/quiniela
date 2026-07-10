import { prisma } from "@/lib/prisma";
import { CHAMPION_BONUS_POINTS, normalizeChampionName, resolveTournamentChampion } from "@/lib/tournament-champion";
import { PickOutcome } from "@/generated/prisma/enums";

const FINISHED = new Set(["FT", "AET", "PEN"]);

function outcomeFromScore(scoreHome: number, scoreAway: number): PickOutcome {
  if (scoreHome > scoreAway) return "HOME";
  if (scoreHome < scoreAway) return "AWAY";
  return "DRAW";
}

export async function recalculateStandingsForTournament(tournamentId: string) {
  const [tournament, members, finishedMatches] = await Promise.all([
    prisma.tournament.findUnique({
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
    }),
    prisma.tournamentMember.findMany({
      where: { tournamentId },
      select: { userId: true, champion: true },
    }),
    prisma.match.findMany({
      where: {
        matchday: { tournamentId },
        statusShort: { in: Array.from(FINISHED) },
        scoreHome: { not: null },
        scoreAway: { not: null },
      },
      select: { id: true, scoreHome: true, scoreAway: true },
    }),
  ]);
  if (!tournament) return;

  const matchOutcomeById = new Map<string, PickOutcome>();
  for (const match of finishedMatches) {
    matchOutcomeById.set(match.id, outcomeFromScore(match.scoreHome!, match.scoreAway!));
  }

  const picks = await prisma.pick.findMany({
    where: {
      matchId: { in: finishedMatches.map((m) => m.id) },
      userId: { in: members.map((m) => m.userId) },
    },
    select: { userId: true, matchId: true, outcome: true },
  });

  const pointsByUser = new Map<string, number>();
  for (const member of members) pointsByUser.set(member.userId, 0);

  for (const pick of picks) {
    const actual = matchOutcomeById.get(pick.matchId);
    if (!actual) continue;
    if (pick.outcome === actual) {
      pointsByUser.set(pick.userId, (pointsByUser.get(pick.userId) ?? 0) + 1);
    }
  }

  if (tournament.status === "FINISHED" && tournament.championPicksEnabled) {
    const resolvedChampion = await resolveTournamentChampion(tournament);
    const normalizedChampion = resolvedChampion ? normalizeChampionName(resolvedChampion) : null;

    if (normalizedChampion) {
      for (const member of members) {
        if (!member.champion) continue;
        if (normalizeChampionName(member.champion) !== normalizedChampion) continue;
        pointsByUser.set(member.userId, (pointsByUser.get(member.userId) ?? 0) + CHAMPION_BONUS_POINTS);
      }
    }
  }

  await prisma.$transaction(
    Array.from(pointsByUser.entries()).map(([userId, points]) =>
      prisma.standing.upsert({
        where: { tournamentId_userId: { tournamentId, userId } },
        create: { tournamentId, userId, points },
        update: { points },
      }),
    ),
  );
}
