import { z } from "zod";

export type TournamentScopeValue = "OPEN" | "SINGLE_LEAGUE";

export type TournamentLeagueConfig = {
  scope: TournamentScopeValue;
  externalLeagueId: number | null;
  leagueName: string | null;
  leagueSeason: number | null;
};

export type FixtureLeagueInfo = {
  leagueId?: number | null;
  leagueName?: string | null;
  season?: number | null;
};

const scopeFieldsSchema = z
  .object({
    scope: z.enum(["OPEN", "SINGLE_LEAGUE"]).default("OPEN"),
    externalLeagueId: z.number().int().positive().optional().nullable(),
    leagueName: z.string().trim().min(1).max(120).optional().nullable(),
    leagueSeason: z.number().int().min(1900).max(2100).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === "SINGLE_LEAGUE") {
      if (!value.externalLeagueId) {
        ctx.addIssue({ code: "custom", message: "externalLeagueId is required for SINGLE_LEAGUE", path: ["externalLeagueId"] });
      }
      if (!value.leagueSeason) {
        ctx.addIssue({ code: "custom", message: "leagueSeason is required for SINGLE_LEAGUE", path: ["leagueSeason"] });
      }
    }
  });

export function parseTournamentScopeInput(input: unknown) {
  return scopeFieldsSchema.safeParse(input);
}

export function normalizeTournamentScopeFields(parsed: z.infer<typeof scopeFieldsSchema>) {
  if (parsed.scope === "OPEN") {
    return {
      scope: "OPEN" as const,
      externalLeagueId: null,
      leagueName: null,
      leagueSeason: null,
    };
  }

  return {
    scope: "SINGLE_LEAGUE" as const,
    externalLeagueId: parsed.externalLeagueId ?? null,
    leagueName: parsed.leagueName ?? null,
    leagueSeason: parsed.leagueSeason ?? null,
  };
}

export function assertFixtureAllowedForTournament(
  tournament: TournamentLeagueConfig,
  fixture: FixtureLeagueInfo,
): void {
  if (tournament.scope !== "SINGLE_LEAGUE") return;

  if (tournament.externalLeagueId == null || tournament.leagueSeason == null) {
    throw new Error("El torneo no tiene una liga configurada correctamente.");
  }

  if (fixture.leagueId == null || fixture.season == null) {
    throw new Error("No se pudo verificar la liga del fixture seleccionado.");
  }

  if (fixture.leagueId !== tournament.externalLeagueId || fixture.season !== tournament.leagueSeason) {
    const label = tournament.leagueName ?? `Liga ${tournament.externalLeagueId}`;
    throw new Error(
      `Este torneo solo permite partidos de ${label} (${tournament.leagueSeason}). El fixture pertenece a otra competición.`,
    );
  }
}

export function formatTournamentScopeLabel(tournament: TournamentLeagueConfig): string {
  if (tournament.scope === "OPEN") return "Torneo abierto";
  const name = tournament.leagueName ?? `Liga ${tournament.externalLeagueId ?? ""}`.trim();
  const season = tournament.leagueSeason ? ` · ${tournament.leagueSeason}` : "";
  return `${name}${season}`;
}

export function tournamentScopeFieldsChanged(
  current: TournamentLeagueConfig,
  next: ReturnType<typeof normalizeTournamentScopeFields>,
): boolean {
  return (
    current.scope !== next.scope ||
    current.externalLeagueId !== next.externalLeagueId ||
    current.leagueName !== next.leagueName ||
    current.leagueSeason !== next.leagueSeason
  );
}
