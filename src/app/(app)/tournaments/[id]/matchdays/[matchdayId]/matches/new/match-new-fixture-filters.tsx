"use client";

import { Loader2, RefreshCw } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SearchMode } from "./match-new-types";

export function MatchNewFixtureFilters(props: {
  hasSelectedEntity: boolean;
  searchSeason: string;
  seasonOptions: string[];
  searchMode: SearchMode;
  searchDate: string;
  searchFrom: string;
  searchTo: string;
  fixturesLoading: boolean;
  fixturesSearchDisabled: boolean;
  hasDateFilter: boolean;
  fixturesError: string | null;
  onSeasonChange: (value: string) => void;
  onModeChange: (value: SearchMode) => void;
  onDateChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="search-season">Temporada {props.hasSelectedEntity ? "*" : "(opcional)"}</Label>
          <Select value={props.searchSeason} onValueChange={props.onSeasonChange}>
            <SelectTrigger id="search-season">
              <SelectValue placeholder="Selecciona temporada" />
            </SelectTrigger>
            <SelectContent>
              {props.seasonOptions.map((season) => (
                <SelectItem key={season} value={season}>
                  {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {props.hasSelectedEntity ? "Obligatoria cuando eliges liga, equipo o jugador." : "Si no seleccionas entidad, no se enviará al backend."}
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Modo de fecha</Label>
          <ToggleGroup
            type="single"
            value={props.searchMode}
            onValueChange={(value) => {
              if (value) props.onModeChange(value as SearchMode);
            }}
          >
            <ToggleGroupItem value="date">Fecha exacta</ToggleGroupItem>
            <ToggleGroupItem value="range">Rango</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {props.searchMode === "date" ? (
        <div className="grid gap-2">
          <Label htmlFor="search-date">Fecha *</Label>
          <Input id="search-date" type="date" value={props.searchDate} onChange={(event) => props.onDateChange(event.target.value)} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="search-from">Desde *</Label>
            <Input id="search-from" type="date" value={props.searchFrom} onChange={(event) => props.onFromChange(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="search-to">Hasta *</Label>
            <Input id="search-to" type="date" value={props.searchTo} onChange={(event) => props.onToChange(event.target.value)} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" onClick={props.onSearch} disabled={props.fixturesLoading || props.fixturesSearchDisabled}>
            {props.fixturesLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Buscar fixtures
          </Button>
        </div>
        {!props.hasDateFilter ? <InlineAlert variant="info" message="Debes capturar una fecha exacta o un rango antes de buscar fixtures." /> : null}
        {props.hasSelectedEntity && !props.searchSeason.trim() ? <InlineAlert variant="info" message="La temporada es obligatoria cuando buscas por liga, equipo o jugador." /> : null}
        {props.fixturesError ? <InlineAlert variant="error" message={props.fixturesError} /> : null}
      </div>
    </>
  );
}
