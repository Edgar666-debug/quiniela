"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { LeagueRow, PlayerRow, SearchTab, TeamRow } from "./match-new-types";

export function MatchNewEntityResults(props: {
  tab: SearchTab;
  leagueResults: LeagueRow[];
  teamResults: TeamRow[];
  playerResults: PlayerRow[];
  onSelectLeague: (league: LeagueRow, season?: number) => void;
  onSelectTeam: (team: TeamRow) => void;
  onSelectPlayer: (player: PlayerRow) => void;
}) {
  return (
    <div className="max-h-56 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {props.tab === "league" &&
          props.leagueResults.map((league) => {
            const season = league.currentSeasons[0] ?? league.seasonYears[0];
            return (
              <li key={league.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {league.name} <span className="text-zinc-500">({league.countryName})</span>
                  </p>
                  <p className="text-xs text-zinc-500">{league.type}{season ? ` · Temporada ${season}` : ""}</p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => props.onSelectLeague(league, season)}>
                  Seleccionar
                </Button>
              </li>
            );
          })}

        {props.tab === "team" &&
          props.teamResults.map((team) => (
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
              <Button size="sm" variant="outline" type="button" onClick={() => props.onSelectTeam(team)}>
                Seleccionar
              </Button>
            </li>
          ))}

        {props.tab === "player" &&
          props.playerResults.map((player) => (
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
              <Button size="sm" variant="outline" type="button" onClick={() => props.onSelectPlayer(player)}>
                Seleccionar
              </Button>
            </li>
          ))}
      </ul>
    </div>
  );
}
