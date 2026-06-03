"use client";

import { useReducer } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineAlert } from "@/components/app/inline-alert";
import { statusLabel } from "@/lib/football";
import { createDefaultSearchDates, type FixtureRow, type FixtureSelection, type LeagueRow } from "./match-new-types";

type SearchState = {
  leagueQuery: string;
  leagueLoading: boolean;
  leagueError: string | null;
  leagueResults: LeagueRow[];
  searchLeague: string;
  selectedLeagueLabel: string | null;
  searchSeason: string;
  searchMode: "date" | "range";
  searchDate: string;
  searchFrom: string;
  searchTo: string;
  fixturesLoading: boolean;
  fixturesError: string | null;
  fixtures: FixtureRow[];
};

type SearchAction =
  | { type: "set_league_query"; value: string }
  | { type: "league_search_start" }
  | { type: "league_search_ok"; leagues: LeagueRow[] }
  | { type: "league_search_fail"; error: string }
  | { type: "select_league"; leagueId: string; label: string; season?: string }
  | { type: "set_search_league"; value: string }
  | { type: "set_search_season"; value: string }
  | { type: "set_search_mode"; mode: "date" | "range" }
  | { type: "set_search_date"; value: string }
  | { type: "set_search_from"; value: string }
  | { type: "set_search_to"; value: string }
  | { type: "fixtures_search_start" }
  | { type: "fixtures_search_ok"; fixtures: FixtureRow[] }
  | { type: "fixtures_search_fail"; error: string };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "set_league_query":
      return { ...state, leagueQuery: action.value };
    case "league_search_start":
      return { ...state, leagueLoading: true, leagueError: null, leagueResults: [] };
    case "league_search_ok":
      return { ...state, leagueLoading: false, leagueResults: action.leagues };
    case "league_search_fail":
      return { ...state, leagueLoading: false, leagueError: action.error };
    case "select_league":
      return {
        ...state,
        searchLeague: action.leagueId,
        selectedLeagueLabel: action.label,
        searchSeason: action.season ?? state.searchSeason,
      };
    case "set_search_league":
      return { ...state, searchLeague: action.value };
    case "set_search_season":
      return { ...state, searchSeason: action.value };
    case "set_search_mode":
      return { ...state, searchMode: action.mode };
    case "set_search_date":
      return { ...state, searchDate: action.value };
    case "set_search_from":
      return { ...state, searchFrom: action.value };
    case "set_search_to":
      return { ...state, searchTo: action.value };
    case "fixtures_search_start":
      return { ...state, fixturesLoading: true, fixturesError: null };
    case "fixtures_search_ok":
      return { ...state, fixturesLoading: false, fixtures: action.fixtures };
    case "fixtures_search_fail":
      return { ...state, fixturesLoading: false, fixturesError: action.error };
    default:
      return state;
  }
}

function createInitialSearchState(): SearchState {
  const defaults = createDefaultSearchDates();
  return {
    leagueQuery: "",
    leagueLoading: false,
    leagueError: null,
    leagueResults: [],
    searchLeague: "",
    selectedLeagueLabel: null,
    searchSeason: defaults.seasonYear,
    searchMode: "range",
    searchDate: defaults.date,
    searchFrom: defaults.from,
    searchTo: defaults.to,
    fixturesLoading: false,
    fixturesError: null,
    fixtures: [],
  };
}

export function MatchNewLeagueSearch(props: { isClosed: boolean; onSelectFixture: (fixture: FixtureSelection) => void }) {
  const [state, dispatch] = useReducer(searchReducer, undefined, createInitialSearchState);

  async function runLeagueSearch() {
    const q = state.leagueQuery.trim();
    if (q.length < 3) {
      dispatch({ type: "league_search_fail", error: "Escribe al menos 3 caracteres para buscar." });
      return;
    }

    dispatch({ type: "league_search_start" });
    const params = new URLSearchParams({ q, limit: "15" });
    const res = await fetch(`/api/api-football/leagues/search?${params.toString()}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { leagues?: LeagueRow[]; error?: string };
    if (!res.ok) return dispatch({ type: "league_search_fail", error: data.error ?? "No se pudo buscar ligas." });
    dispatch({ type: "league_search_ok", leagues: data.leagues ?? [] });
  }

  async function runFixturesSearch() {
    dispatch({ type: "fixtures_search_start" });
    const params = new URLSearchParams();
    if (state.searchLeague.trim()) params.set("league", state.searchLeague.trim());
    if (state.searchSeason.trim()) params.set("season", state.searchSeason.trim());
    if (state.searchMode === "date") {
      if (state.searchDate.trim()) params.set("date", state.searchDate.trim());
    } else {
      if (state.searchFrom.trim()) params.set("from", state.searchFrom.trim());
      if (state.searchTo.trim()) params.set("to", state.searchTo.trim());
    }
    params.set("limit", "25");

    const res = await fetch(`/api/api-football/fixtures/search?${params.toString()}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { fixtures?: FixtureRow[]; error?: string };
    if (!res.ok) return dispatch({ type: "fixtures_search_fail", error: data.error ?? "No se pudo buscar fixtures." });
    dispatch({ type: "fixtures_search_ok", fixtures: data.fixtures ?? [] });
  }

  const fixturesSearchDisabled =
    props.isClosed ||
    !state.searchLeague.trim() ||
    !state.searchSeason.trim() ||
    (state.searchMode === "date" ? !state.searchDate.trim() : !state.searchFrom.trim() || !state.searchTo.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>1) Buscar liga / competencia</CardTitle>
        <CardDescription>Escribe el nombre de la liga o país y selecciona una opción.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {props.isClosed ? <InlineAlert variant="error" message="La jornada está cerrada. Ya no puedes agregar partidos." /> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Ej. Liga MX, Premier, Mexico..."
            value={state.leagueQuery}
            onChange={(e) => dispatch({ type: "set_league_query", value: e.target.value })}
          />
          <Button
            type="button"
            variant="outline"
            onClick={runLeagueSearch}
            disabled={state.leagueLoading || state.leagueQuery.trim().length < 3}
          >
            {state.leagueLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Buscar
          </Button>
        </div>
        {state.leagueError ? <InlineAlert variant="error" message={state.leagueError} /> : null}

        {state.leagueResults.length > 0 ? (
          <div className="max-h-[40vh] overflow-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
            <ul className="flex flex-col gap-2">
              {state.leagueResults.map((l) => {
                const suggestedSeason = l.currentSeasons[0] ?? l.seasonYears[0];
                return (
                  <li key={l.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {l.name} <span className="text-zinc-600 dark:text-zinc-400">({l.countryName})</span>
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          League {l.id} • {l.type}
                          {suggestedSeason ? ` • Season sugerida: ${suggestedSeason}` : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "select_league",
                            leagueId: String(l.id),
                            label: `${l.name} (${l.countryName})`,
                            season: suggestedSeason ? String(suggestedSeason) : undefined,
                          })
                        }
                      >
                        Usar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="leagueId">League ID</Label>
            <Input
              id="leagueId"
              inputMode="numeric"
              placeholder="ej. 262"
              value={state.searchLeague}
              onChange={(e) => dispatch({ type: "set_search_league", value: e.target.value })}
            />
            {state.selectedLeagueLabel ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Seleccionada: {state.selectedLeagueLabel}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              inputMode="numeric"
              placeholder="2026"
              value={state.searchSeason}
              onChange={(e) => dispatch({ type: "set_search_season", value: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Fecha</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={state.searchMode === "range" ? "default" : "outline"}
                onClick={() => dispatch({ type: "set_search_mode", mode: "range" })}
              >
                Rango
              </Button>
              <Button
                type="button"
                size="sm"
                variant={state.searchMode === "date" ? "default" : "outline"}
                onClick={() => dispatch({ type: "set_search_mode", mode: "date" })}
              >
                Día exacto
              </Button>
            </div>
            {state.searchMode === "date" ? (
              <Input
                id="date"
                type="date"
                value={state.searchDate}
                onChange={(e) => dispatch({ type: "set_search_date", value: e.target.value })}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="from"
                  type="date"
                  value={state.searchFrom}
                  onChange={(e) => dispatch({ type: "set_search_from", value: e.target.value })}
                />
                <Input
                  id="to"
                  type="date"
                  value={state.searchTo}
                  onChange={(e) => dispatch({ type: "set_search_to", value: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={runFixturesSearch} disabled={state.fixturesLoading || fixturesSearchDisabled}>
            {state.fixturesLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Buscar fixtures
          </Button>
          {state.fixturesError ? <InlineAlert variant="error" message={state.fixturesError} /> : null}
        </div>

        <div className="max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
          {state.fixtures.length === 0 ? (
            <p className="p-2 text-sm text-zinc-600 dark:text-zinc-400">Sin resultados.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {state.fixtures.map((f) => (
                <li key={f.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {f.homeTeam} vs {f.awayTeam}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Fixture {f.id} • {statusLabel(f.statusShort)} • {new Date(f.dateUtc).toISOString().replace("T", " ").slice(0, 16)} UTC
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() =>
                        props.onSelectFixture({
                          id: f.id,
                          dateUtc: f.dateUtc,
                          homeTeam: f.homeTeam,
                          awayTeam: f.awayTeam,
                        })
                      }
                    >
                      Usar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
