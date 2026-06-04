"use client";

import { useReducer } from "react";
import Image from "next/image";
import { Loader2, RefreshCw, Search, Trophy, Users, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineAlert } from "@/components/app/inline-alert";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/football";
import {
  createDefaultSearchDates,
  type FixtureRow,
  type FixtureSelection,
  type LeagueRow,
  type PlayerRow,
  type TeamRow,
} from "./match-new-types";

type SearchTab = "league" | "team" | "player";

type SearchState = {
  tab: SearchTab;

  // Entity search
  query: string;
  entityLoading: boolean;
  entityError: string | null;
  leagueResults: LeagueRow[];
  teamResults: TeamRow[];
  playerResults: PlayerRow[];

  // Selected entity
  selectedId: string;
  selectedLabel: string | null;

  // Fixture filters
  searchSeason: string;
  searchMode: "date" | "range";
  searchDate: string;
  searchFrom: string;
  searchTo: string;

  // Fixtures
  fixturesLoading: boolean;
  fixturesError: string | null;
  fixtures: FixtureRow[];
  fixturesSearched: boolean;
  selectedFixtureId: number | null;
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
  | { type: "set_season"; value: string }
  | { type: "set_mode"; mode: "date" | "range" }
  | { type: "set_date"; value: string }
  | { type: "set_from"; value: string }
  | { type: "set_to"; value: string }
  | { type: "fixtures_start" }
  | { type: "fixtures_ok"; fixtures: FixtureRow[] }
  | { type: "fixtures_fail"; error: string }
  | { type: "select_fixture"; id: number };

function reducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "set_tab":
      return {
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
        fixtures: [],
        fixturesSearched: false,
        selectedFixtureId: null,
      };
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
      return {
        ...state,
        selectedId: action.id,
        selectedLabel: action.label,
        searchSeason: action.season ?? state.searchSeason,
        leagueResults: [],
        teamResults: [],
        playerResults: [],
      };
    case "set_season":
      return { ...state, searchSeason: action.value };
    case "set_mode":
      return { ...state, searchMode: action.mode };
    case "set_date":
      return { ...state, searchDate: action.value };
    case "set_from":
      return { ...state, searchFrom: action.value };
    case "set_to":
      return { ...state, searchTo: action.value };
    case "fixtures_start":
      return { ...state, fixturesLoading: true, fixturesError: null };
    case "fixtures_ok":
      return { ...state, fixturesLoading: false, fixtures: action.fixtures, fixturesSearched: true };
    case "fixtures_fail":
      return { ...state, fixturesLoading: false, fixturesError: action.error, fixturesSearched: true };
    case "select_fixture":
      return { ...state, selectedFixtureId: action.id };
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
    selectedFixtureId: null,
  };
}

const TABS: { id: SearchTab; label: string; icon: typeof Trophy; placeholder: string; hint: string }[] = [
  { id: "league", label: "Liga", icon: Trophy, placeholder: "Liga MX, Premier League, Champions...", hint: "Busca por nombre de liga o país." },
  { id: "team", label: "Equipo", icon: Users, placeholder: "Real Madrid, América, Bayern...", hint: "Busca por nombre de equipo." },
  { id: "player", label: "Jugador", icon: User, placeholder: "Messi, Ronaldo, Haaland...", hint: "Busca al jugador (usa temporada 2024). Luego filtra fixtures con el campo Temporada." },
];

export function MatchNewLeagueSearch(props: { isClosed: boolean; onSelectFixture: (fixture: FixtureSelection) => void }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const tab = TABS.find((t) => t.id === state.tab)!;

  async function runEntitySearch() {
    const q = state.query.trim();
    if (q.length < 3) {
      dispatch({ type: "entity_fail", error: "Escribe al menos 3 caracteres para buscar." });
      return;
    }
    dispatch({ type: "entity_start" });

    if (state.tab === "league") {
      const res = await fetch(`/api/api-football/leagues/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { leagues?: LeagueRow[]; error?: string };
      if (!res.ok) return dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar ligas." });
      dispatch({ type: "league_ok", leagues: data.leagues ?? [] });
    } else if (state.tab === "team") {
      const res = await fetch(`/api/api-football/teams/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { teams?: TeamRow[]; error?: string };
      if (!res.ok) return dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar equipos." });
      dispatch({ type: "team_ok", teams: data.teams ?? [] });
    } else {
      const res = await fetch(`/api/api-football/players/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { players?: PlayerRow[]; error?: string };
      if (!res.ok) return dispatch({ type: "entity_fail", error: data.error ?? "No se pudo buscar jugadores." });
      dispatch({ type: "player_ok", players: data.players ?? [] });
    }
  }

  async function runFixturesSearch() {
    dispatch({ type: "fixtures_start" });
    const params = new URLSearchParams();
    params.set("date", state.searchDate.trim());
    params.set("limit", "30");

    const res = await fetch(`/api/api-football/fixtures/search?${params}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { fixtures?: FixtureRow[]; error?: string };
    if (!res.ok) return dispatch({ type: "fixtures_fail", error: data.error ?? "No se pudo buscar fixtures." });
    dispatch({ type: "fixtures_ok", fixtures: data.fixtures ?? [] });
  }

  const fixturesSearchDisabled = props.isClosed || !state.searchDate.trim();

  const hasEntityResults =
    state.leagueResults.length > 0 || state.teamResults.length > 0 || state.playerResults.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>1) Buscar fixture</CardTitle>
        <CardDescription>Busca por liga, equipo o jugador y selecciona el partido.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {props.isClosed ? (
          <InlineAlert variant="error" message="La jornada está cerrada. Ya no puedes agregar partidos." />
        ) : null}

        {/* Tab selector */}
        <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => dispatch({ type: "set_tab", tab: t.id })}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                state.tab === t.id
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Entity search */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tab.hint}</p>
          <div className="flex gap-2">
            <Input
              placeholder={tab.placeholder}
              value={state.query}
              onChange={(e) => dispatch({ type: "set_query", value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") runEntitySearch();
              }}
              disabled={state.entityLoading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={runEntitySearch}
              disabled={state.entityLoading || state.query.trim().length < 3}
            >
              {state.entityLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Buscar
            </Button>
          </div>
          {state.entityError ? <InlineAlert variant="error" message={state.entityError} /> : null}
        </div>

        {/* Entity results */}
        {hasEntityResults ? (
          <div className="max-h-56 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {state.tab === "league" &&
                state.leagueResults.map((l) => {
                  const season = l.currentSeasons[0] ?? l.seasonYears[0];
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.name} <span className="text-zinc-500">({l.countryName})</span></p>
                        <p className="text-xs text-zinc-500">{l.type}{season ? ` · Temporada ${season}` : ""}</p>
                      </div>
                      <Button
                        size="sm" variant="outline" type="button"
                        onClick={() => dispatch({ type: "select_entity", id: String(l.id), label: `${l.name} (${l.countryName})`, season: season ? String(season) : undefined })}
                      >
                        Seleccionar
                      </Button>
                    </li>
                  );
                })}

              {state.tab === "team" &&
                state.teamResults.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      {t.logoUrl ? (
                        <Image src={t.logoUrl} alt={t.name} width={24} height={24} className="size-6 object-contain" unoptimized />
                      ) : (
                        <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        {t.city || t.country ? (
                          <p className="text-xs text-zinc-500">{[t.city, t.country].filter(Boolean).join(", ")}</p>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      size="sm" variant="outline" type="button"
                      onClick={() => dispatch({ type: "select_entity", id: String(t.id), label: t.name })}
                    >
                      Seleccionar
                    </Button>
                  </li>
                ))}

              {state.tab === "player" &&
                state.playerResults.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      {p.photoUrl ? (
                        <Image src={p.photoUrl} alt={p.name} width={24} height={24} className="size-6 rounded-full object-cover" unoptimized />
                      ) : (
                        <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        {p.teamName ? <p className="text-xs text-zinc-500">{p.teamName}</p> : null}
                      </div>
                    </div>
                    <Button
                      size="sm" variant="outline" type="button"
                      onClick={() => dispatch({ type: "select_entity", id: String(p.id), label: p.name })}
                    >
                      Seleccionar
                    </Button>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {/* Selected entity badge */}
        {state.selectedLabel ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="font-medium">Seleccionado:</span>
            <span className="truncate">{state.selectedLabel}</span>
          </div>
        ) : null}

        {/* Fixture filters */}
        <div className="grid gap-2">
          <Label htmlFor="search-date">Fecha</Label>
          <Input
            id="search-date"
            type="date"
            value={state.searchDate}
            onChange={(e) => dispatch({ type: "set_date", value: e.target.value })}
          />
        </div>

        {/* Search fixtures button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={runFixturesSearch}
            disabled={state.fixturesLoading || fixturesSearchDisabled}
          >
            {state.fixturesLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Buscar fixtures
          </Button>
          {!state.selectedId && !fixturesSearchDisabled ? null : null}
          {state.fixturesError ? <InlineAlert variant="error" message={state.fixturesError} /> : null}
        </div>

        {/* Fixtures list */}
        <div className="max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          {!state.fixturesSearched ? (
            <p className="p-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Selecciona una {state.tab === "league" ? "liga" : state.tab === "team" ? "equipo" : "jugador"} y presiona &quot;Buscar fixtures&quot;.
            </p>
          ) : state.fixtures.length === 0 ? (
            <p className="p-4 text-center text-sm text-zinc-500">Sin resultados para los filtros aplicados.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {state.fixtures.map((f) => {
                const isSelected = state.selectedFixtureId === f.id;
                const localDate = new Date(f.dateUtc).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <li
                    key={f.id}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 transition-colors",
                      isSelected ? "bg-emerald-50 dark:bg-emerald-950/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {f.homeLogoUrl ? (
                          <Image src={f.homeLogoUrl} alt={f.homeTeam} width={18} height={18} className="size-[18px] object-contain" unoptimized />
                        ) : null}
                        <span className="text-sm font-medium">{f.homeTeam}</span>
                        <span className="text-xs text-zinc-400">vs</span>
                        {f.awayLogoUrl ? (
                          <Image src={f.awayLogoUrl} alt={f.awayTeam} width={18} height={18} className="size-[18px] object-contain" unoptimized />
                        ) : null}
                        <span className="text-sm font-medium">{f.awayTeam}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {localDate}
                        {f.leagueName ? ` · ${f.leagueName}` : ""}
                        {f.round ? ` · ${f.round}` : ""}
                        {" · "}{statusLabel(f.statusShort)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      type="button"
                      onClick={() => {
                        dispatch({ type: "select_fixture", id: f.id });
                        props.onSelectFixture({ id: f.id, dateUtc: f.dateUtc, homeTeam: f.homeTeam, awayTeam: f.awayTeam });
                      }}
                    >
                      {isSelected ? "✓ Usar" : "Usar"}
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
