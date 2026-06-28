import { fetchFixturesByIds } from "@/lib/api-football";

type MatchInput = {
  id: string;
  externalFixtureId: number | null;
  startsAtUtc: Date;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  statusShort: string;
  scoreHome: number | null;
  scoreAway: number | null;
};

export type BracketMatch = MatchInput & {
  roundKey: string;
  roundLabel: string;
  roundOrder: number;
};

export type TournamentBracketData =
  | {
      available: false;
      reason: string;
      omittedCount: number;
    }
  | {
      available: true;
      rounds: Array<{
        key: string;
        label: string;
        order: number;
        matches: BracketMatch[];
      }>;
      omittedCount: number;
    };

type FixtureInfo = Awaited<ReturnType<typeof fetchFixturesByIds>> extends Map<number, infer T> ? T : never;

const ROUND_SPECS = [
  { key: "round_of_64", label: "Ronda de 64", order: 0, patterns: [/round of 64/i, /1\/32 finals?/i, /64th finals?/i] },
  { key: "round_of_32", label: "Ronda de 32", order: 1, patterns: [/round of 32/i, /1\/16 finals?/i, /32nd finals?/i] },
  { key: "round_of_16", label: "Octavos", order: 2, patterns: [/round of 16/i, /1\/8 finals?/i, /8th finals?/i] },
  { key: "quarter_finals", label: "Cuartos", order: 3, patterns: [/quarter-finals?/i, /^quarter finals$/i] },
  { key: "semi_finals", label: "Semifinales", order: 4, patterns: [/semi-finals?/i, /^semi finals$/i] },
  { key: "final", label: "Final", order: 5, patterns: [/^final$/i] },
];

function parseRound(round: string | null | undefined) {
  const value = round?.trim();
  if (!value) return null;

  for (const spec of ROUND_SPECS) {
    if (spec.patterns.some((pattern) => pattern.test(value))) {
      return spec;
    }
  }

  return null;
}

export async function buildTournamentBracket(matches: MatchInput[]): Promise<TournamentBracketData> {
  const fixtureIds = Array.from(
    new Set(
      matches
        .map((match) => match.externalFixtureId)
        .filter((fixtureId): fixtureId is number => fixtureId != null),
    ),
  );

  if (fixtureIds.length === 0) {
    return {
      available: false,
      reason: "Esta vista necesita partidos sincronizados desde API-Football para identificar la ronda.",
      omittedCount: matches.length,
    };
  }

  const fixturesById = new Map<number, FixtureInfo>();
  try {
    for (let index = 0; index < fixtureIds.length; index += 20) {
      const batch = await fetchFixturesByIds(fixtureIds.slice(index, index + 20));
      for (const [fixtureId, fixture] of batch) {
        fixturesById.set(fixtureId, fixture);
      }
    }
  } catch {
    return {
      available: false,
      reason: "No se pudo resolver la ronda de los fixtures en este momento.",
      omittedCount: matches.length,
    };
  }

  const rounds = new Map<string, { key: string; label: string; order: number; matches: BracketMatch[] }>();
  let omittedCount = 0;

  for (const match of matches) {
    if (!match.externalFixtureId) {
      omittedCount += 1;
      continue;
    }

    const fixture = fixturesById.get(match.externalFixtureId);
    const parsedRound = parseRound(fixture?.round);
    if (!parsedRound) {
      omittedCount += 1;
      continue;
    }

    const bucket = rounds.get(parsedRound.key) ?? {
      key: parsedRound.key,
      label: parsedRound.label,
      order: parsedRound.order,
      matches: [],
    };

    bucket.matches.push({
      ...match,
      roundKey: parsedRound.key,
      roundLabel: parsedRound.label,
      roundOrder: parsedRound.order,
    });
    rounds.set(parsedRound.key, bucket);
  }

  const orderedRounds = Array.from(rounds.values())
    .sort((left, right) => left.order - right.order)
    .map((round) => ({
      ...round,
      matches: round.matches.sort((left, right) => left.startsAtUtc.getTime() - right.startsAtUtc.getTime()),
    }));

  if (orderedRounds.length === 0) {
    return {
      available: false,
      reason: "Los partidos del torneo no pertenecen a rondas de eliminación directa reconocidas.",
      omittedCount,
    };
  }

  return {
    available: true,
    rounds: orderedRounds,
    omittedCount,
  };
}
