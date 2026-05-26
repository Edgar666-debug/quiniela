import { prisma } from "@/lib/prisma";
import { PickOutcome } from "@/generated/prisma/enums";

const FINISHED = new Set(["FT", "AET", "PEN"]);

function outcomeFromScore(scoreHome: number, scoreAway: number): PickOutcome {
  if (scoreHome > scoreAway) return "HOME";
  if (scoreHome < scoreAway) return "AWAY";
  return "DRAW";
}

export async function recalculateStandingsForTournament(tournamentId: string) {
  const members = await prisma.tournamentMember.findMany({
    where: { tournamentId },
    select: { userId: true },
  });

  const finishedMatches = await prisma.match.findMany({
    where: {
      matchday: { tournamentId },
      statusShort: { in: Array.from(FINISHED) },
      scoreHome: { not: null },
      scoreAway: { not: null },
    },
    select: { id: true, scoreHome: true, scoreAway: true },
  });

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
