"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { UserAvatar } from "@/components/app/user-avatar";
import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { MatchPickGroup, PickLegend, type PickValue } from "@/components/matches/pick-cards";
import { groupMatchesByLocalKickoff } from "@/lib/format";
import { FINISHED_STATUSES, outcomeFromScore, statusLabel, type Outcome } from "@/lib/football";
import { MatchGameLink } from "@/components/api-football/match-game-link";

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
  initial: { matchday: { number: number; closesAtUtc: string }; participantLabel: string; participantImage: string | null; matches: MatchRow[] };
}) {
  const [localRows, setLocalRows] = useState<{ source: MatchRow[]; value: MatchRow[] } | null>(null);
  const rows = localRows?.source === props.initial.matches ? localRows.value : props.initial.matches;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => groupMatchesByLocalKickoff(rows), [rows]);
  const hasFinishedMatch = rows.some(
    (m) => FINISHED_STATUSES.has(m.statusShort) && m.scoreHome != null && m.scoreAway != null,
  );

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
        <InlineAlert variant="info" message="Los picks se revelan solo después del cierre de la jornada." />
      ) : null}
      <MatchdayClose closesAtUtc={props.initial.matchday.closesAtUtc} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={props.initial.participantLabel}
            email={props.initial.participantLabel}
            image={props.initial.participantImage}
          />
          <div>
            <p className="text-sm font-medium">{props.initial.participantLabel}</p>
            <p className="text-muted-ui text-xs">{rows.length} partido(s)</p>
          </div>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refrescar
        </Button>
      </div>

      {hasFinishedMatch ? <PickLegend /> : null}

      <div className="flex flex-col gap-6"> 
        {grouped.map((g) => ( 
          <div key={g.key} className="flex flex-col gap-3">
            <p className="text-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">{g.label}</p>
            <div className="grid gap-4">
              {g.matches.map((m) => (
                <div key={m.id} className="match-card-ui grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-muted-ui text-xs">
                      Estado: {statusLabel(m.statusShort)}
                      {m.scoreHome != null && m.scoreAway != null ? ` • ${m.scoreHome}-${m.scoreAway}` : ""}
                      {m.externalFixtureId ? ` • Fixture ${m.externalFixtureId}` : ""}
                    </p>
                    {m.pick ? <p className="text-muted-ui text-xs">Pick: {m.pick}</p> : null}
                    {m.externalFixtureId ? (
                      <MatchGameLink
                        tournamentId={props.tournamentId}
                        matchdayId={props.matchdayId}
                        matchId={m.id}
                      />
                    ) : null}
                  </div>

                  <MatchPickGroup
                    value={(m.pick as PickValue | null) ?? null}
                    result={
                      FINISHED_STATUSES.has(m.statusShort) && m.scoreHome != null && m.scoreAway != null
                        ? outcomeFromScore(m.scoreHome, m.scoreAway)
                        : null
                    }
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
