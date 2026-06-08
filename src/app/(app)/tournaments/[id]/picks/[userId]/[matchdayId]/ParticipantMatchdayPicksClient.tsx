"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { MatchPickGroup, type PickValue } from "@/components/matches/pick-cards";
import { groupMatchesByLocalKickoff } from "@/lib/format";
import { statusLabel, type Outcome } from "@/lib/football";

type MatchRow = {
  id: string;
  externalFixtureId: number | null;
  startsAtUtc: string;
  homeTeam: string;
  homeLogoUrl?: string | null;
  awayTeam: string;
  awayLogoUrl?: string | null;
  statusShort: string;
  scoreHome: number | null;
  scoreAway: number | null;
  pick: Outcome | null;
};

export function ParticipantMatchdayPicksClient(props: {
  tournamentId: string;
  userId: string;
  matchdayId: string;
  initial: { matchday: { number: number; closesAtUtc: string }; participantLabel: string; matches: MatchRow[] };
}) {
  const [localRows, setLocalRows] = useState<{ source: MatchRow[]; value: MatchRow[] } | null>(null);
  const rows = localRows?.source === props.initial.matches ? localRows.value : props.initial.matches;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => groupMatchesByLocalKickoff(rows), [rows]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/matchdays/${props.matchdayId}/participants/${props.userId}`, { cache: "no-store" });
    const data = (await res.json()) as { matches?: MatchRow[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar picks");
    setLocalRows({ source: props.initial.matches, value: data.matches ?? [] });
  }


  const closesAtMs = new Date(props.initial.matchday.closesAtUtc).getTime();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const isClosed = nowMs >= closesAtMs;

  return (
    <div className="flex flex-col gap-4">
      {!isClosed ? (
        <InlineAlert variant="info" message="Los picks se revelan solo después del cierre de la jornada (UTC)." />
      ) : null}
      <MatchdayClose closesAtUtc={props.initial.matchday.closesAtUtc} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{props.initial.participantLabel}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{rows.length} partido(s)</p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refrescar
        </Button>
      </div>

      <div className="flex flex-col gap-6"> 
        {grouped.map((g) => (
          <div key={g.key} className="flex flex-col gap-3">
            <p className="text-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">{g.label}</p>
            <div className="grid gap-4">
              {g.matches.map((m) => (
                <div key={m.id} className="grid gap-3 rounded-2xl bg-zinc-50/70 p-4 dark:bg-zinc-950/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Estado: {statusLabel(m.statusShort)}
                      {m.scoreHome != null && m.scoreAway != null ? ` • ${m.scoreHome}-${m.scoreAway}` : ""}
                      {m.externalFixtureId ? ` • Fixture ${m.externalFixtureId}` : ""}
                    </p>
                    {m.pick ? <p className="text-xs text-zinc-600 dark:text-zinc-400">Pick: {m.pick}</p> : null}
                  </div>

                  <MatchPickGroup
                    value={(m.pick as PickValue | null) ?? null}
                    homeTeam={m.homeTeam}
                    homeLogoUrl={m.homeLogoUrl}
                    awayTeam={m.awayTeam}
                    awayLogoUrl={m.awayLogoUrl}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
