"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { formatUtcToLocalShort } from "@/lib/format";
import { statusLabel } from "@/lib/football";
import { cn } from "@/lib/utils";
import type { FixtureRow, FixtureSelection } from "./match-new-types";

export function MatchNewFixtureResults(props: {
  fixturesSearched: boolean;
  fixtures: FixtureRow[];
  hasSelectedEntity: boolean;
  selectedFixtureIds: number[];
  onToggleFixture: (fixture: FixtureSelection) => void;
}) {
  return (
    <div className="max-h-[50vh] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      {!props.fixturesSearched ? (
        <p className="p-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
          {props.hasSelectedEntity
            ? "Completa temporada y fecha/rango, luego presiona “Buscar fixtures”."
            : "Captura una fecha o rango y presiona “Buscar fixtures”."}
        </p>
      ) : props.fixtures.length === 0 ? (
        <p className="p-4 text-center text-sm text-zinc-500">Sin resultados para los filtros aplicados.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {props.fixtures.map((fixture) => {
            const isSelected = props.selectedFixtureIds.includes(fixture.id);
            const localDate = formatUtcToLocalShort(fixture.dateUtc);

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
  );
}
