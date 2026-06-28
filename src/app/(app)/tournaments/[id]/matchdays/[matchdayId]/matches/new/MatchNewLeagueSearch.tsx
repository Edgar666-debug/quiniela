"use client";

import { useReducer } from "react";
import { Loader2, Search, Trophy, Users } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJsonOrThrow } from "@/lib/http";
import {
  createDefaultSearchDates,
  createSeasonOptions,
  type FixtureRow,
  type FixtureSelection,
  type SearchMode,
  type SearchTab,
} from "./match-new-types";
import { MatchNewEntityResults } from "./match-new-entity-results";
import { MatchNewFixtureFilters } from "./match-new-fixture-filters";
import { MatchNewFixtureResults } from "./match-new-fixture-results";
import { MatchNewSelectedEntity } from "./match-new-selected-entity";
import { useEntitySearch } from "./use-entity-search";

type SearchState = {
  tab: SearchTab;
  query: string;
  selectedId: string;
  selectedLabel: string | null;
  searchSeason: string;
  searchMode: SearchMode;
  searchDate: string;
  searchFrom: string;
  searchTo: string;
  fixturesLoading: boolean;
  fixturesError: string | null;
  fixtures: FixtureRow[];
  fixturesSearched: boolean;
};

type SearchAction =
  | { type: "set_tab"; tab: SearchTab }
  | { type: "set_query"; value: string }
  | { type: "select_entity"; id: string; label: string; season?: string }
  | { type: "clear_entity" }
  | { type: "set_season"; value: string }
  | { type: "set_mode"; mode: SearchMode }
  | { type: "set_date"; value: string }
  | { type: "set_from"; value: string }
  | { type: "set_to"; value: string }
  | { type: "fixtures_start" }
  | { type: "fixtures_ok"; fixtures: FixtureRow[] }
  | { type: "fixtures_fail"; error: string };

const TABS: { id: SearchTab; label: string; icon: typeof Trophy; placeholder: string; hint: string }[] = [
  { id: "league", label: "Liga", icon: Trophy, placeholder: "Liga MX, Premier League, Champions...", hint: "Busca por nombre de liga o país." },
  { id: "team", label: "Equipo", icon: Users, placeholder: "Real Madrid, América, Bayern...", hint: "Busca por nombre de equipo." },
];

function resetFixtures(state: SearchState) {
  return {
    ...state,
    fixturesLoading: false,
    fixturesError: null,
    fixtures: [],
    fixturesSearched: false,
  };
}

function reducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "set_tab":
      return resetFixtures({ ...state, tab: action.tab, query: "", selectedId: "", selectedLabel: null });
    case "set_query":
      return { ...state, query: action.value };
    case "select_entity":
      return resetFixtures({
        ...state,
        selectedId: action.id,
        selectedLabel: action.label,
        searchSeason: action.season ?? state.searchSeason,
      });
    case "clear_entity":
      return resetFixtures({ ...state, selectedId: "", selectedLabel: null });
    case "set_season":
      return resetFixtures({ ...state, searchSeason: action.value });
    case "set_mode":
      return resetFixtures({ ...state, searchMode: action.mode, fixturesError: null });
    case "set_date":
      return resetFixtures({ ...state, searchDate: action.value });
    case "set_from":
      return resetFixtures({ ...state, searchFrom: action.value });
    case "set_to":
      return resetFixtures({ ...state, searchTo: action.value });
    case "fixtures_start":
      return { ...state, fixturesLoading: true, fixturesError: null, fixturesSearched: false };
    case "fixtures_ok":
      return { ...state, fixturesLoading: false, fixtures: action.fixtures, fixturesSearched: true };
    case "fixtures_fail":
      return { ...state, fixturesLoading: false, fixturesError: action.error, fixturesSearched: true };
    default:
      return state;
  }
}

function createInitialState(fixedLeague?: MatchNewLeagueSearchProps["fixedLeague"]): SearchState {
  const defaults = createDefaultSearchDates();
  if (fixedLeague) {
    return {
      tab: "league",
      query: "",
      selectedId: String(fixedLeague.leagueId),
      selectedLabel: `${fixedLeague.leagueName} · Temporada ${fixedLeague.leagueSeason}`,
      searchSeason: String(fixedLeague.leagueSeason),
      searchMode: "range",
      searchDate: defaults.date,
      searchFrom: defaults.from,
      searchTo: defaults.to,
      fixturesLoading: false,
      fixturesError: null,
      fixtures: [],
      fixturesSearched: false,
    };
  }

  return {
    tab: "league",
    query: "",
    selectedId: "",
    selectedLabel: null,
    searchSeason: defaults.seasonYear,
    searchMode: "range",
    searchDate: defaults.date,
    searchFrom: defaults.from,
    searchTo: defaults.to,
    fixturesLoading: false,
    fixturesError: null,
    fixtures: [],
    fixturesSearched: false,
  };
}

type MatchNewLeagueSearchProps = {
  isClosed: boolean;
  selectedFixtureIds: number[];
  onToggleFixture: (fixture: FixtureSelection) => void;
  fixedLeague?: { leagueId: number; leagueName: string; leagueSeason: number } | null;
};

export function MatchNewLeagueSearch(props: MatchNewLeagueSearchProps) {
  const fixedLeague = props.fixedLeague ?? null;
  const [state, dispatch] = useReducer(reducer, fixedLeague, createInitialState);
  const entitySearch = useEntitySearch();

  const tab = TABS.find((item) => item.id === state.tab)!;
  const seasonOptions = createSeasonOptions();
  const hasSelectedEntity = Boolean(state.selectedId);
  const hasDateFilter = state.searchMode === "date" ? Boolean(state.searchDate.trim()) : Boolean(state.searchFrom.trim() && state.searchTo.trim());
  const fixturesSearchDisabled = props.isClosed || !hasDateFilter || (hasSelectedEntity && !state.searchSeason.trim());
  const hasEntityResults = entitySearch.leagueResults.length > 0 || entitySearch.teamResults.length > 0;

  function handleTabChange(tab: SearchTab) {
    dispatch({ type: "set_tab", tab });
    entitySearch.reset();
  }

  async function runFixturesSearch() {
    dispatch({ type: "fixtures_start" });

    const params = new URLSearchParams();
    if (hasSelectedEntity) {
      params.set(state.tab, state.selectedId);
      params.set("season", state.searchSeason.trim());
    }

    if (state.searchMode === "date") {
      params.set("date", state.searchDate.trim());
    } else {
      params.set("from", state.searchFrom.trim());
      params.set("to", state.searchTo.trim());
    }

    params.set("limit", "30");

    try {
      const data = await fetchJsonOrThrow<{ fixtures?: FixtureRow[] }>(
        `/api/api-football/fixtures/search?${params.toString()}`,
        { cache: "no-store" },
        "No se pudo buscar fixtures.",
      );
      dispatch({ type: "fixtures_ok", fixtures: data.fixtures ?? [] });
    } catch (searchError) {
      dispatch({
        type: "fixtures_fail",
        error: searchError instanceof Error ? searchError.message : "No se pudo buscar fixtures.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>1) Buscar fixture</CardTitle>
        <CardDescription>Busca por liga o equipo, o usa solo fecha/rango para encontrar el partido.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {props.isClosed ? <InlineAlert variant="error" message="La jornada está cerrada. Ya no puedes agregar partidos." /> : null}
        {fixedLeague ? (
          <InlineAlert
            variant="info"
            message={`Este torneo solo permite partidos de ${fixedLeague.leagueName} (${fixedLeague.leagueSeason}).`}
          />
        ) : null}

        {!fixedLeague ? (
          <Tabs value={state.tab} onValueChange={(value) => handleTabChange(value as SearchTab)}>
            <TabsList>
              {TABS.map((item) => (
                <TabsTrigger key={item.id} value={item.id}>
                  <item.icon className="size-3.5" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}

        {!fixedLeague ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tab.hint}</p>
            <div className="flex gap-2">
              <Input
                placeholder={tab.placeholder}
                value={state.query}
                onChange={(event) => dispatch({ type: "set_query", value: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void entitySearch.search(state.tab, state.query);
                }}
                disabled={entitySearch.loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void entitySearch.search(state.tab, state.query)}
                disabled={entitySearch.loading || state.query.trim().length < 3}
              >
                {entitySearch.loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Buscar
              </Button>
            </div>
            {entitySearch.error ? <InlineAlert variant="error" message={entitySearch.error} /> : null}
          </div>
        ) : null}

        {!fixedLeague && hasEntityResults ? (
          <MatchNewEntityResults
            tab={state.tab}
            leagueResults={entitySearch.leagueResults}
            teamResults={entitySearch.teamResults}
            onSelectLeague={(league, season) => {
              dispatch({
                type: "select_entity",
                id: String(league.id),
                label: `${league.name} (${league.countryName})`,
                season: season ? String(season) : undefined,
              });
              entitySearch.reset();
            }}
            onSelectTeam={(team) => {
              dispatch({ type: "select_entity", id: String(team.id), label: team.name });
              entitySearch.reset();
            }}
          />
        ) : null}

        <MatchNewSelectedEntity
          selectedLabel={state.selectedLabel}
          onClear={
            fixedLeague
              ? undefined
              : () => {
                  dispatch({ type: "clear_entity" });
                  entitySearch.reset();
                }
          }
        />

        <MatchNewFixtureFilters
          hasSelectedEntity={hasSelectedEntity}
          searchSeason={state.searchSeason}
          seasonOptions={seasonOptions}
          searchMode={state.searchMode}
          searchDate={state.searchDate}
          searchFrom={state.searchFrom}
          searchTo={state.searchTo}
          fixturesLoading={state.fixturesLoading}
          fixturesSearchDisabled={fixturesSearchDisabled}
          hasDateFilter={hasDateFilter}
          fixturesError={state.fixturesError}
          onSeasonChange={(value) => dispatch({ type: "set_season", value })}
          onModeChange={(value) => dispatch({ type: "set_mode", mode: value })}
          onDateChange={(value) => dispatch({ type: "set_date", value })}
          onFromChange={(value) => dispatch({ type: "set_from", value })}
          onToChange={(value) => dispatch({ type: "set_to", value })}
          onSearch={() => void runFixturesSearch()}
        />

        <MatchNewFixtureResults
          fixturesSearched={state.fixturesSearched}
          fixtures={state.fixtures}
          hasSelectedEntity={hasSelectedEntity}
          selectedFixtureIds={props.selectedFixtureIds}
          onToggleFixture={props.onToggleFixture}
        />
      </CardContent>
    </Card>
  );
}
