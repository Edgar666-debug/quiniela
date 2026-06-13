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

