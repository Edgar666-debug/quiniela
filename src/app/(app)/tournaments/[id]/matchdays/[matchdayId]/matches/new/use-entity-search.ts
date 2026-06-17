"use client";

import { useCallback, useState } from "react";

import { searchApiFootballLeagues, searchApiFootballTeams } from "@/lib/api-football-search";
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

    try {
      if (tab === "league") {
        setState({ ...EMPTY_STATE, leagueResults: await searchApiFootballLeagues<LeagueRow>(q) });
        return;
      }

      setState({ ...EMPTY_STATE, teamResults: await searchApiFootballTeams<TeamRow>(q) });
    } catch (searchError) {
      setState({
        ...EMPTY_STATE,
        error: searchError instanceof Error ? searchError.message : tab === "league" ? "No se pudo buscar ligas." : "No se pudo buscar equipos.",
      });
    }
  }, []);

  return { ...state, search, reset };
}
