import { computeMatchdayAccuracy } from "@/lib/football";

export type ParticipantMatchdayStats = {
  pickCount: number;
  correctCount: number;
  scoredMatchesCount: number;
  accuracyPercent: number | null;
};

type MatchdayParticipantSource = {
  matches: Array<{
    statusShort: string;
    scoreHome: number | null;
    scoreAway: number | null;
    picks: Array<{ userId: string; outcome: "HOME" | "DRAW" | "AWAY" }>;
  }>;
};

export function matchdayParticipantSelect() {
  return {
    id: true,
    number: true,
    closesAtUtc: true,
    _count: { select: { matches: true } },
    matches: {
      select: {
        statusShort: true,
        scoreHome: true,
        scoreAway: true,
        picks: { select: { userId: true, outcome: true } },
      },
    },
  } as const;
}

export function computeParticipantMatchdayStats(matchday: MatchdayParticipantSource): Record<string, ParticipantMatchdayStats> {
  const userIds = new Set<string>();
  for (const match of matchday.matches) {
    for (const pick of match.picks) userIds.add(pick.userId);
  }

  const stats: Record<string, ParticipantMatchdayStats> = {};
  for (const userId of userIds) {
    const pickCount = matchday.matches.reduce(
      (sum, match) => sum + (match.picks.some((pick) => pick.userId === userId) ? 1 : 0),
      0,
    );
    const { correct, scoredMatches, percent } = computeMatchdayAccuracy(
      matchday.matches.map((match) => ({
        statusShort: match.statusShort,
        scoreHome: match.scoreHome,
        scoreAway: match.scoreAway,
        pickOutcome: match.picks.find((pick) => pick.userId === userId)?.outcome ?? null,
      })),
    );
    stats[userId] = {
      pickCount,
      correctCount: correct,
      scoredMatchesCount: scoredMatches,
      accuracyPercent: percent,
    };
  }
  return stats;
}

export function buildParticipantStatsByMatchday(
  matchdays: Array<{ id: string } & MatchdayParticipantSource>,
): Record<string, Record<string, ParticipantMatchdayStats>> {
  const result: Record<string, Record<string, ParticipantMatchdayStats>> = {};
  for (const matchday of matchdays) {
    result[matchday.id] = computeParticipantMatchdayStats(matchday);
  }
  return result;
}

export type MatchdayListRow = {
  id: string;
  number: number;
  closesAtUtc: string;
  matchesCount: number;
  myPicksCount: number;
  myCorrectCount: number;
  scoredMatchesCount: number;
  accuracyPercent: number | null;
};

type MatchdayListSource = {
  id: string;
  number: number;
  closesAtUtc: Date;
  _count: { matches: number };
  matches: Array<{
    statusShort: string;
    scoreHome: number | null;
    scoreAway: number | null;
    picks: Array<{ outcome: "HOME" | "DRAW" | "AWAY" }>;
  }>;
};

export function matchdayListSelect(userId: string) {
  return {
    id: true,
    number: true,
    closesAtUtc: true,
    _count: { select: { matches: true } },
    matches: {
      select: {
        statusShort: true,
        scoreHome: true,
        scoreAway: true,
        picks: {
          where: { userId },
          select: { outcome: true },
          take: 1,
        },
      },
    },
  } as const;
}

export function toMatchdayListRow(matchday: MatchdayListSource): MatchdayListRow {
  const myPicksCount = matchday.matches.reduce((sum, match) => sum + (match.picks.length > 0 ? 1 : 0), 0);
  const { correct, scoredMatches, percent } = computeMatchdayAccuracy(
    matchday.matches.map((match) => ({
      statusShort: match.statusShort,
      scoreHome: match.scoreHome,
      scoreAway: match.scoreAway,
      pickOutcome: match.picks[0]?.outcome ?? null,
    })),
  );

  return {
    id: matchday.id,
    number: matchday.number,
    closesAtUtc: matchday.closesAtUtc.toISOString(),
    matchesCount: matchday._count.matches,
    myPicksCount,
    myCorrectCount: correct,
    scoredMatchesCount: scoredMatches,
    accuracyPercent: percent,
  };
}
