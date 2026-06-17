"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import useSWR from "swr";

import { MatchGameLink } from "@/components/api-football/match-game-link";
import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { InlineAlert } from "@/components/app/inline-alert";
import { UserAvatar } from "@/components/app/user-avatar";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { MatchPickGroup, PickLegend, type PickValue } from "@/components/matches/pick-cards";
import { Button } from "@/components/ui/button";
import { groupMatchesByLocalKickoff } from "@/lib/format";
import { FINISHED_STATUSES, outcomeFromScore, statusLabel, type Outcome } from "@/lib/football";
import { fetchJsonOrThrow } from "@/lib/http";

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
  const { data, isValidating, mutate } = useSWR(
    `/api/matchdays/${props.matchdayId}/participants/${props.userId}`,
    async (url: string) => {
      const payload = await fetchJsonOrThrow<{ matches?: MatchRow[] }>(url, { cache: "no-store" }, "No se pudo cargar picks");
      return payload.matches ?? [];
    },
    {
      fallbackData: props.initial.matches,
      revalidateOnFocus: false,
    },
  );
  const rows = data ?? props.initial.matches;
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => groupMatchesByLocalKickoff(rows), [rows]);
  const hasFinishedMatch = rows.some((match) => FINISHED_STATUSES.has(match.statusShort) && match.scoreHome != null && match.scoreAway != null);

  async function refresh() {
    setError(null);

    try {
      await mutate();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "No se pudo cargar picks");
    }
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
      {!isClosed ? <InlineAlert variant="info" message="Los picks se revelan solo después del cierre de la jornada." /> : null}
      <MatchdayClose closesAtUtc={props.initial.matchday.closesAtUtc} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={props.initial.participantLabel} email={props.initial.participantLabel} image={props.initial.participantImage} />
          <div>
            <p className="text-sm font-medium">{props.initial.participantLabel}</p>
            <p className="text-muted-ui text-xs">{rows.length} partido(s)</p>
          </div>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => void refresh()} disabled={isValidating}>
          {isValidating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refrescar
        </Button>
      </div>

      {hasFinishedMatch ? <PickLegend /> : null}

      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <div key={group.key} className="flex flex-col gap-3">
            <p className="text-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">{group.label}</p>
            <div className="grid gap-4">
              {group.matches.map((match) => (
                <div key={match.id} className="match-card-ui grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-muted-ui text-xs">
                      Estado: {statusLabel(match.statusShort)}
                      {match.scoreHome != null && match.scoreAway != null ? ` • ${match.scoreHome}-${match.scoreAway}` : ""}
                      {match.externalFixtureId ? ` • Fixture ${match.externalFixtureId}` : ""}
                    </p>
                    {match.pick ? <p className="text-muted-ui text-xs">Pick: {match.pick}</p> : null}
                    {match.externalFixtureId ? (
                      <MatchGameLink tournamentId={props.tournamentId} matchdayId={props.matchdayId} matchId={match.id} />
                    ) : null}
                  </div>

                  <MatchPickGroup
                    value={(match.pick as PickValue | null) ?? null}
                    result={
                      FINISHED_STATUSES.has(match.statusShort) && match.scoreHome != null && match.scoreAway != null
                        ? outcomeFromScore(match.scoreHome, match.scoreAway)
                        : null
                    }
                    homeTeam={match.homeTeam}
                    homeLogoUrl={match.homeLogoUrl}
                    awayTeam={match.awayTeam}
                    awayLogoUrl={match.awayLogoUrl}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FeedbackAlerts error={error} />
    </div>
  );
}
