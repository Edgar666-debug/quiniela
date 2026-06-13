"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchNewConfirmForm } from "./MatchNewConfirmForm";
import { MatchNewLeagueSearch } from "./MatchNewLeagueSearch";
import type { FixtureSelection } from "./match-new-types";

export function MatchNewClient(props: {
  tournamentId: string;
  matchdayId: string;
  matchdayNumber: number;
  matchdayClosesAtUtc: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  fixedLeague?: { leagueId: number; leagueName: string; leagueSeason: number } | null;
}) {
  const canManage = props.role === "OWNER" || props.role === "ORGANIZER";
  const closesAtMs = new Date(props.matchdayClosesAtUtc).getTime();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedFixtures, setSelectedFixtures] = useState<FixtureSelection[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isClosed = nowMs >= closesAtMs;

  function handleToggleFixture(fixture: FixtureSelection) {
    setSelectedFixtures((current) => {
      const exists = current.some((item) => item.id === fixture.id);
      if (exists) return current.filter((item) => item.id !== fixture.id);
      return [...current, fixture];
    });
  }

  function handleRemoveFixture(fixtureId: number) {
    setSelectedFixtures((current) => current.filter((item) => item.id !== fixtureId));
  }

  if (!canManage) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sin permisos</CardTitle>
            <CardDescription>Solo OWNER/ORGANIZER pueden agregar partidos.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-muted-ui flex items-center gap-2">
            <CalendarDays className="size-4" />
            <span className="text-sm">Jornada {props.matchdayNumber}</span>
          </div>
          <h1 className="text-2xl font-semibold">Agregar partido</h1>
          <p className="text-muted-ui text-sm">Busca fixtures y guarda el partido en la jornada.</p>
        </div>
      </div>

      <MatchNewLeagueSearch
        isClosed={isClosed}
        selectedFixtureIds={selectedFixtures.map((fixture) => fixture.id)}
        onToggleFixture={handleToggleFixture}
        fixedLeague={props.fixedLeague}
      />
      <MatchNewConfirmForm
        tournamentId={props.tournamentId}
        matchdayId={props.matchdayId}
        closesAtMs={closesAtMs}
        isClosed={isClosed}
        selectedFixtures={selectedFixtures}
        onRemoveFixture={handleRemoveFixture}
      />
    </main>
  );
}
