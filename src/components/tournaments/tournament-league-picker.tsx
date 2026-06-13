"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Search, Trophy } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { readJsonResponse } from "@/lib/http";

export type TournamentScopeMode = "OPEN" | "SINGLE_LEAGUE";

export type TournamentLeagueSelection = {
  externalLeagueId: number;
  leagueName: string;
  leagueSeason: number;
  logoUrl?: string | null;
};

type LeagueRow = {
  id: number;
  name: string;
  countryName: string;
  type: string;
  logoUrl?: string | null;
  currentSeasons: number[];
  seasonYears: number[];
};

export function TournamentLeaguePicker(props: {
  scope: TournamentScopeMode;
  onScopeChange: (scope: TournamentScopeMode) => void;
  selection: TournamentLeagueSelection | null;
  onSelectionChange: (selection: TournamentLeagueSelection | null) => void;
  disabled?: boolean;
  locked?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LeagueRow[]>([]);

  async function searchLeagues() {
    const q = query.trim();
    if (q.length < 3) {
      setError("Escribe al menos 3 caracteres para buscar.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/api-football/leagues/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await readJsonResponse<{ leagues?: LeagueRow[]; error?: string }>(res);
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo buscar ligas.");
      setResults([]);
      return;
    }

    setResults(data.leagues ?? []);
  }

  function handleScopeChange(nextScope: TournamentScopeMode) {
    props.onScopeChange(nextScope);
    if (nextScope === "OPEN") {
      props.onSelectionChange(null);
      setResults([]);
      setError(null);
    }
  }

  return (
    <div className="grid gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="space-y-1">
        <p className="text-sm font-medium">Modo del torneo</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {props.locked
            ? "El modo y la liga quedan bloqueados después de agregar el primer partido."
            : "En liga única solo se pueden agregar partidos de la competición elegida."}
        </p>
      </div>

      {props.locked ? (
        <InlineAlert
          variant="info"
          message={
            props.scope === "SINGLE_LEAGUE" && props.selection
              ? `Liga única: ${props.selection.leagueName} (${props.selection.leagueSeason})`
              : "Torneo abierto: cualquier competición."
          }
        />
      ) : (
        <RadioGroup
          value={props.scope}
          onValueChange={(value) => handleScopeChange(value as TournamentScopeMode)}
          className="grid gap-3"
          disabled={props.disabled}
        >
          <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <RadioGroupItem value="OPEN" id="scope-open" className="mt-0.5" />
            <div>
              <Label htmlFor="scope-open" className="font-medium">
                Torneo abierto
              </Label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Puedes mezclar partidos de distintas ligas y temporadas.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <RadioGroupItem value="SINGLE_LEAGUE" id="scope-single" className="mt-0.5" />
            <div>
              <Label htmlFor="scope-single" className="font-medium">
                Liga única
              </Label>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Todos los partidos deben pertenecer a la misma liga y temporada.</p>
            </div>
          </label>
        </RadioGroup>
      )}

      {props.scope === "SINGLE_LEAGUE" && !props.locked ? (
        <div className="grid gap-3">
          {props.selection ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex min-w-0 items-center gap-2">
                {props.selection.logoUrl ? (
                  <Image
                    src={props.selection.logoUrl}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0 object-contain"
                    unoptimized
                  />
                ) : (
                  <Trophy className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                )}
                <p className="truncate text-sm font-medium">
                  {props.selection.leagueName} · Temporada {props.selection.leagueSeason}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={props.disabled} onClick={() => props.onSelectionChange(null)}>
                Cambiar
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder="Liga MX, Premier League, Champions..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void searchLeagues();
                  }}
                  disabled={props.disabled || loading}
                />
                <Button type="button" variant="outline" disabled={props.disabled || loading || query.trim().length < 3} onClick={() => void searchLeagues()}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Buscar
                </Button>
              </div>
              {error ? <InlineAlert variant="error" message={error} /> : null}
              {results.length > 0 ? (
                <div className="max-h-48 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                    {results.map((league) => {
                      const season = league.currentSeasons[0] ?? league.seasonYears[0];
                      return (
                        <li key={league.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-2">
                            {league.logoUrl ? (
                              <Image
                                src={league.logoUrl}
                                alt=""
                                width={24}
                                height={24}
                                className="size-6 shrink-0 object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="size-6 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {league.name} <span className="text-zinc-500">({league.countryName})</span>
                              </p>
                              <p className="text-xs text-zinc-500">
                                {league.type}
                                {season ? ` · Temporada ${season}` : ""}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            disabled={!season || props.disabled}
                            onClick={() => {
                              if (!season) return;
                              props.onSelectionChange({
                                externalLeagueId: league.id,
                                leagueName: league.name,
                                leagueSeason: season,
                                logoUrl: league.logoUrl ?? null,
                              });
                              setResults([]);
                              setQuery("");
                            }}
                          >
                            Seleccionar
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
