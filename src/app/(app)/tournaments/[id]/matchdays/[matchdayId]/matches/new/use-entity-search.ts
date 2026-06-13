"use client";

import { useCallback, useState } from "react";

import { readJsonResponse } from "@/lib/http";
import type { LeagueRow, SearchTab, TeamRow } from "./match-new-types";

export type EntitySearchState = {
  loading: boolean;
  error: string | null;
  leagueResults: LeagueRow[];
  teamResults: TeamRow[];
};

const EMPTY_STATE: EntitySearchState = {
  loading: false,
  error: null,
  leagueResults: [],
  teamResults: [],
};

export function useEntitySearch() {
  const [state, setState] = useState<EntitySearchState>(EMPTY_STATE);

  const reset = useCallback(() => setState(EMPTY_STATE), []);

  const search = useCallback(async (tab: SearchTab, query: string) => {
    const q = query.trim();
    if (q.length < 3) {
      setState((s) => ({ ...s, error: "Escribe al menos 3 caracteres para buscar." }));
      return;
    }

    setState({ ...EMPTY_STATE, loading: true });

    if (tab === "league") {
      const res = await fetch(`/api/api-football/leagues/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await readJsonResponse<{ leagues?: LeagueRow[]; error?: string }>(res);
      if (!res.ok) {
        setState({ ...EMPTY_STATE, error: data.error ?? "No se pudo buscar ligas." });
        return;
      }
      setState({ ...EMPTY_STATE, leagueResults: data.leagues ?? [] });
      return;
    }

    const res = await fetch(`/api/api-football/teams/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await readJsonResponse<{ teams?: TeamRow[]; error?: string }>(res);
    if (!res.ok) {
      setState({ ...EMPTY_STATE, error: data.error ?? "No se pudo buscar equipos." });
      return;
    }
    setState({ ...EMPTY_STATE, teamResults: data.teams ?? [] });
  }, []);

  return { ...state, search, reset };
}
