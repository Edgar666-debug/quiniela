export type Outcome = "HOME" | "DRAW" | "AWAY";

export const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

const VOID_STATUSES = new Set(["PST", "CANC", "ABD", "AWD", "WO", "NF"]);

/** Widget game: solo auto-refresh mientras el partido puede cambiar (en juego o por empezar). */
export function shouldRefreshGameWidget(statusShort: string): boolean {
  if (FINISHED_STATUSES.has(statusShort)) return false;
  if (VOID_STATUSES.has(statusShort)) return false;
  return true;
}

export function outcomeFromScore(scoreHome: number, scoreAway: number): Outcome {
  if (scoreHome > scoreAway) return "HOME";
  if (scoreHome < scoreAway) return "AWAY";
  return "DRAW";
}

export function computeMatchdayAccuracy(
  matches: Array<{
    statusShort: string;
    scoreHome: number | null;
    scoreAway: number | null;
    pickOutcome: Outcome | null;
  }>,
) {
  let correct = 0;
  let scoredMatches = 0;

  for (const match of matches) {
    if (!FINISHED_STATUSES.has(match.statusShort) || match.scoreHome == null || match.scoreAway == null) {
      continue;
    }
    scoredMatches += 1;
    if (match.pickOutcome && match.pickOutcome === outcomeFromScore(match.scoreHome, match.scoreAway)) {
      correct += 1;
    }
  }

  return {
    correct,
    scoredMatches,
    percent: scoredMatches > 0 ? Math.round((correct / scoredMatches) * 100) : null,
  };
}

export function statusLabel(short: string) {
  if (short === "FT") return "Final";
  if (short === "AET") return "Final (ET)";
  if (short === "PEN") return "Final (PEN)";
  if (short === "NS") return "No iniciado";
  if (short === "HT") return "Medio tiempo";
  if (short === "PST") return "Pospuesto";
  if (short === "CANC") return "Cancelado";
  if (short === "ABD") return "Abandonado";
  if (short === "AWD") return "Adjudicado";
  if (short === "WO") return "Walkover";
  if (short === "NF") return "No encontrado";
  return short;
}

