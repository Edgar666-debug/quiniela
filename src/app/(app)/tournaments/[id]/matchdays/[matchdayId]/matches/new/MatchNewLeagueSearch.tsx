"use client";

import { useReducer } from "react";
import { Loader2, Search, Trophy, User, Users } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createDefaultSearchDates,
  createSeasonOptions,
  type FixtureRow,
  type FixtureSelection,
  type LeagueRow,
  type PlayerRow,
  type TeamRow,
} from "./match-new-types";
import { MatchNewEntityResults } from "./match-new-entity-results";
import { MatchNewFixtureFilters } from "./match-new-fixture-filters";
import { MatchNewFixtureResults } from "./match-new-fixture-results";
import { MatchNewSelectedEntity } from "./match-new-selected-entity";

type SearchTab = "league" | "team" | "player";
type SearchMode = "date" | "range";

type SearchState = {
  tab: SearchTab;
  query: string;
  entityLoading: boolean;
  entityError: string | null;
  leagueResults: LeagueRow[];
  teamResults: TeamRow[];
  playerResults: PlayerRow[];
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
  | { type: "entity_start" }
  | { type: "league_ok"; leagues: LeagueRow[] }
  | { type: "team_ok"; teams: TeamRow[] }
  | { type: "player_ok"; players: PlayerRow[] }
  | { type: "entity_fail"; error: string }
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
  { id: "player", label: "Jugador", icon: User, placeholder: "Messi, Ronaldo, Haaland...", hint: "Busca al jugador y luego filtra fixtures por temporada." },
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
      return resetFixtures({
        ...state,
        tab: action.tab,
        query: "",
        entityLoading: false,
        entityError: null,
        leagueResults: [],
        teamResults: [],
        playerResults: [],
        selectedId: "",
        selectedLabel: null,
      });
    case "set_query":
      return { ...state, query: action.value };
    case "entity_start":
      return { ...state, entityLoading: true, entityError: null, leagueResults: [], teamResults: [], playerResults: [] };
    case "league_ok":
      return { ...state, entityLoading: false, leagueResults: action.leagues };
    case "team_ok":
      return { ...state, entityLoading: false, teamResults: action.teams };
    case "player_ok":
      return { ...state, entityLoading: false, playerResults: action.players };
    case "entity_fail":
      return { ...state, entityLoading: false, entityError: action.error };
    case "select_entity":
      return resetFixtures({
        ...state,
        selectedId: action.id,
        selectedLabel: action.label,
        searchSeason: action.season ?? state.searchSeason,
        leagueResults: [],
        teamResults: [],
        playerResults: [],
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

function createInitialState(): SearchState {
  const defaults = createDefaultSearchDates();
  return {
    tab: "league",
    query: "",
    entityLoading: false,
    entityError: null,
    leagueResults: [],
    teamResults: [],
    playerResults: [],
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

export function MatchNewLeagueSearch(props: {
  isClosed: boolean;
  selectedFixtureIds: number[];
  onToggleFixture: (fixture: FixtureSelection) => void;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const tab = TABS.find((item) => item.id === state.tab)!;
  const seasonOptions = createSeasonOptions();
  const hasSelectedEntity = Boolean(state.selectedId);
  const hasDateFilter = state.searchMode === "date" ? Boolean(state.searchDate.trim()) : Boolean(state.searchFrom.trim() && state.searchTo.trim());
  const fixturesSearchDisabled = props.isClosed || !hasDateFilter || (hasSelectedEntity && !state.searchSeason.trim());
  const hasEntityResults = state.leagueResults.length > 0 || state.teamResults.length > 0 || state.playerResults.length > 0;

  async function runEntitySearch() {
    const query = state.query.trim();
    if (query.length < 3) {
      dispatch({ type: "entity_fail", error: "Escribe al menos 3 caracteres para buscar." });
      return;
    }

    dispatch({ type: "entity_start" });

    if (state.tab === "league") {
      const res = await fetch(`/api/api-football/leagues/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { leagues?: LeagueRow[]; error?: string };
      if (!res.ok) {
        dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar ligas." });
        return;
      }
      dispatch({ type: "league_ok", leagues: data.leagues ?? [] });
      return;
    }

    if (state.tab === "team") {
      const res = await fetch(`/api/api-football/teams/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { teams?: TeamRow[]; error?: string };
      if (!res.ok) {
        dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar equipos." });
        return;
      }
      dispatch({ type: "team_ok", teams: data.teams ?? [] });
      return;
    }

    const res = await fetch(`/api/api-football/players/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { players?: PlayerRow[]; error?: string };
    if (!res.ok) {
      dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar jugadores." });
      return;
    }
    dispatch({ type: "player_ok", players: data.players ?? [] });
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

    const res = await fetch(`/api/api-football/fixtures/search?${params.toString()}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { fixtures?: FixtureRow[]; error?: string };
    if (!res.ok) {
      dispatch({ type: "fixtures_fail", error: data.error ?? "No se pudo buscar fixtures." });
      return;
    }

    dispatch({ type: "fixtures_ok", fixtures: data.fixtures ?? [] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>1) Buscar fixture</CardTitle>
        <CardDescription>Busca por liga, equipo o jugador, o usa solo fecha/rango para encontrar el partido.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {props.isClosed ? <InlineAlert variant="error" message="La jornada está cerrada. Ya no puedes agregar partidos." /> : null}

        <Tabs value={state.tab} onValueChange={(value) => dispatch({ type: "set_tab", tab: value as SearchTab })}>
          <TabsList>
            {TABS.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                <item.icon className="size-3.5" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tab.hint}</p>
          <div className="flex gap-2">
            <Input
              placeholder={tab.placeholder}
              value={state.query}
              onChange={(event) => dispatch({ type: "set_query", value: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") void runEntitySearch();
              }}
              disabled={state.entityLoading}
            />
            <Button type="button" variant="outline" onClick={() => void runEntitySearch()} disabled={state.entityLoading || state.query.trim().length < 3}>
              {state.entityLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Buscar
            </Button>
          </div>
          {state.entityError ? <InlineAlert variant="error" message={state.entityError} /> : null}
        </div>

        {hasEntityResults ? (
          <MatchNewEntityResults
            tab={state.tab}
            leagueResults={state.leagueResults}
            teamResults={state.teamResults}
            playerResults={state.playerResults}
            onSelectLeague={(league, season) =>
              dispatch({
                type: "select_entity",
                id: String(league.id),
                label: `${league.name} (${league.countryName})`,
                season: season ? String(season) : undefined,
              })
            }
            onSelectTeam={(team) => dispatch({ type: "select_entity", id: String(team.id), label: team.name })}
            onSelectPlayer={(player) => dispatch({ type: "select_entity", id: String(player.id), label: player.name })}
          />
        ) : null}

        <MatchNewSelectedEntity selectedLabel={state.selectedLabel} onClear={() => dispatch({ type: "clear_entity" })} />

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
