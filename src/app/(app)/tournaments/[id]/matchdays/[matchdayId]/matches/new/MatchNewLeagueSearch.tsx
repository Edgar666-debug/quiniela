"use client";

import Image from "next/image";
import { useReducer } from "react";
import { Loader2, RefreshCw, Search, Trophy, User, Users, X } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUtcToLocal } from "@/lib/format";
import { statusLabel } from "@/lib/football";
import { cn } from "@/lib/utils";
import {
  createDefaultSearchDates,
  createSeasonOptions,
  type FixtureRow,
  type FixtureSelection,
  type LeagueRow,
  type PlayerRow,
  type TeamRow,
} from "./match-new-types";

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
      return resetFixtures({
        ...state,
        selectedId: "",
        selectedLabel: null,
      });
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

const TABS: { id: SearchTab; label: string; icon: typeof Trophy; placeholder: string; hint: string }[] = [
  { id: "league", label: "Liga", icon: Trophy, placeholder: "Liga MX, Premier League, Champions...", hint: "Busca por nombre de liga o país." },
  { id: "team", label: "Equipo", icon: Users, placeholder: "Real Madrid, América, Bayern...", hint: "Busca por nombre de equipo." },
  { id: "player", label: "Jugador", icon: User, placeholder: "Messi, Ronaldo, Haaland...", hint: "Busca al jugador y luego filtra fixtures por temporada." },
];

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
  const needsSeason = hasSelectedEntity;
  const fixturesSearchDisabled = props.isClosed || !hasDateFilter || (needsSeason && !state.searchSeason.trim());
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
      if (!res.ok) return dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar ligas." });
      dispatch({ type: "league_ok", leagues: data.leagues ?? [] });
      return;
    }

    if (state.tab === "team") {
      const res = await fetch(`/api/api-football/teams/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { teams?: TeamRow[]; error?: string };
      if (!res.ok) return dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar equipos." });
      dispatch({ type: "team_ok", teams: data.teams ?? [] });
      return;
    }

    const res = await fetch(`/api/api-football/players/search?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { players?: PlayerRow[]; error?: string };
    if (!res.ok) return dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar jugadores." });
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
    if (!res.ok) return dispatch({ type: "fixtures_fail", error: data.error ?? "No se pudo buscar fixtures." });
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

        <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => dispatch({ type: "set_tab", tab: item.id })}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                state.tab === item.id
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>

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
          <div className="max-h-56 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {state.tab === "league" &&
                state.leagueResults.map((league) => {
                  const season = league.currentSeasons[0] ?? league.seasonYears[0];
                  return (
                    <li key={league.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {league.name} <span className="text-zinc-500">({league.countryName})</span>
                        </p>
                        <p className="text-xs text-zinc-500">{league.type}{season ? ` · Temporada ${season}` : ""}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "select_entity",
                            id: String(league.id),
                            label: `${league.name} (${league.countryName})`,
                            season: season ? String(season) : undefined,
                          })
                        }
                      >
                        Seleccionar
                      </Button>
                    </li>
                  );
                })}

              {state.tab === "team" &&
                state.teamResults.map((team) => (
                  <li key={team.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      {team.logoUrl ? (
                        <Image src={team.logoUrl} alt={team.name} width={24} height={24} className="size-6 object-contain" unoptimized />
                      ) : (
                        <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{team.name}</p>
                        {team.city || team.country ? <p className="text-xs text-zinc-500">{[team.city, team.country].filter(Boolean).join(", ")}</p> : null}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" type="button" onClick={() => dispatch({ type: "select_entity", id: String(team.id), label: team.name })}>
                      Seleccionar
                    </Button>
                  </li>
                ))}

              {state.tab === "player" &&
                state.playerResults.map((player) => (
                  <li key={player.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      {player.photoUrl ? (
                        <Image src={player.photoUrl} alt={player.name} width={24} height={24} className="size-6 rounded-full object-cover" unoptimized />
                      ) : (
                        <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{player.name}</p>
                        {player.teamName ? <p className="text-xs text-zinc-500">{player.teamName}</p> : null}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" type="button" onClick={() => dispatch({ type: "select_entity", id: String(player.id), label: player.name })}>
                      Seleccionar
                    </Button>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {state.selectedLabel ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <div className="min-w-0">
              <span className="font-medium">Seleccionado:</span> <span className="truncate">{state.selectedLabel}</span>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">La búsqueda de fixtures usará este ID y exigirá temporada.</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100" onClick={() => dispatch({ type: "clear_entity" })}>
              <X className="size-4" />
              <span className="sr-only">Quitar selección</span>
            </Button>
          </div>
        ) : (
          <InlineAlert variant="info" message="También puedes buscar fixtures solo por fecha o rango, sin seleccionar entidad." />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="search-season">Temporada {hasSelectedEntity ? "*" : "(opcional)"}</Label>
            <select
              id="search-season"
              value={state.searchSeason}
              onChange={(event) => dispatch({ type: "set_season", value: event.target.value })}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] dark:border-zinc-800"
            >
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {hasSelectedEntity ? "Obligatoria cuando eliges liga, equipo o jugador." : "Si no seleccionas entidad, no se enviará al backend."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Modo de fecha</Label>
            <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              {(["date", "range"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => dispatch({ type: "set_mode", mode })}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    state.searchMode === mode
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                  )}
                >
                  {mode === "date" ? "Fecha exacta" : "Rango"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {state.searchMode === "date" ? (
          <div className="grid gap-2">
            <Label htmlFor="search-date">Fecha *</Label>
            <Input id="search-date" type="date" value={state.searchDate} onChange={(event) => dispatch({ type: "set_date", value: event.target.value })} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="search-from">Desde *</Label>
              <Input id="search-from" type="date" value={state.searchFrom} onChange={(event) => dispatch({ type: "set_from", value: event.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="search-to">Hasta *</Label>
              <Input id="search-to" type="date" value={state.searchTo} onChange={(event) => dispatch({ type: "set_to", value: event.target.value })} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => void runFixturesSearch()} disabled={state.fixturesLoading || fixturesSearchDisabled}>
              {state.fixturesLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Buscar fixtures
            </Button>
          </div>
          {!hasDateFilter ? <InlineAlert variant="info" message="Debes capturar una fecha exacta o un rango antes de buscar fixtures." /> : null}
          {hasSelectedEntity && !state.searchSeason.trim() ? <InlineAlert variant="info" message="La temporada es obligatoria cuando buscas por liga, equipo o jugador." /> : null}
          {state.fixturesError ? <InlineAlert variant="error" message={state.fixturesError} /> : null}
        </div>

        <div className="max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          {!state.fixturesSearched ? (
            <p className="p-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
              {hasSelectedEntity
                ? "Completa temporada y fecha/rango, luego presiona “Buscar fixtures”."
                : "Captura una fecha o rango y presiona “Buscar fixtures”."}
            </p>
          ) : state.fixtures.length === 0 ? (
            <p className="p-4 text-center text-sm text-zinc-500">Sin resultados para los filtros aplicados.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {state.fixtures.map((fixture) => {
                const isSelected = props.selectedFixtureIds.includes(fixture.id);
                const localDate = formatUtcToLocal(fixture.dateUtc, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <li
                    key={fixture.id}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 transition-colors",
                      isSelected ? "bg-emerald-50 dark:bg-emerald-950/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {fixture.homeLogoUrl ? (
                          <Image src={fixture.homeLogoUrl} alt={fixture.homeTeam} width={18} height={18} className="size-[18px] object-contain" unoptimized />
                        ) : null}
                        <span className="text-sm font-medium">{fixture.homeTeam}</span>
                        <span className="text-xs text-zinc-400">vs</span>
                        {fixture.awayLogoUrl ? (
                          <Image src={fixture.awayLogoUrl} alt={fixture.awayTeam} width={18} height={18} className="size-[18px] object-contain" unoptimized />
                        ) : null}
                        <span className="text-sm font-medium">{fixture.awayTeam}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {localDate}
                        {fixture.leagueName ? ` · ${fixture.leagueName}` : ""}
                        {fixture.round ? ` · ${fixture.round}` : ""}
                        {" · "}
                        {statusLabel(fixture.statusShort)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      type="button"
                      onClick={() => {
                        props.onToggleFixture({
                          id: fixture.id,
                          dateUtc: fixture.dateUtc,
                          homeTeam: fixture.homeTeam,
                          awayTeam: fixture.awayTeam,
                        });
                      }}
                    >
                      {isSelected ? "✓ Seleccionado" : "Seleccionar"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
