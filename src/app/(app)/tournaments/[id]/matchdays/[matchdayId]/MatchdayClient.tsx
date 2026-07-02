"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock, RefreshCw, Unlock } from "lucide-react";
import useSWR from "swr";

import { MatchGameLink } from "@/components/api-football/match-game-link";
import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { MatchPickGroup, PickLegend, type PickValue } from "@/components/matches/pick-cards";
import { groupMatchesByLocalKickoff } from "@/lib/format";
import { FINISHED_STATUSES, outcomeFromScore, statusLabel, type Outcome } from "@/lib/football";
import { fetchJsonOrThrow, sendJsonRequest } from "@/lib/http";

type MatchRow = {
  id: string;
  externalFixtureId: number | null;
  startsAtUtc: string;
  homeTeam: string;
  homeLogoUrl?: string | null;
  awayTeam: string;
  awayLogoUrl?: string | null;
  leagueName?: string | null;
  statusShort: string;
  scoreHome: number | null;
  scoreAway: number | null;
  isEditable: boolean;
  myPick: Outcome | null;
};

export function MatchdayClient(props: {
  tournamentId: string;
  matchdayId: string;
  initial: {
    role: "OWNER" | "ORGANIZER" | "PLAYER";
    matchday: { id: string; number: number; closesAtUtc: string };
    matches: MatchRow[];
  };
}) {
  const { data, isValidating, mutate } = useSWR(
    `/api/matchdays/${props.matchdayId}/detail`,
    async (url: string) => {
      const payload = await fetchJsonOrThrow<{ matches?: MatchRow[] }>(url, { cache: "no-store" }, "No se pudo cargar partidos");
      return payload.matches ?? [];
    },
    {
      fallbackData: props.initial.matches,
      revalidateOnFocus: false,
    },
  );
  const rows = data ?? props.initial.matches;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [submittingPickId, setSubmittingPickId] = useState<string | null>(null);
  const [togglingEditableId, setTogglingEditableId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = props.initial.role === "OWNER" || props.initial.role === "ORGANIZER";

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const closesAtMs = new Date(props.initial.matchday.closesAtUtc).getTime();
  const isClosed = nowMs >= closesAtMs;

  const grouped = useMemo(() => groupMatchesByLocalKickoff(rows), [rows]);
  const hasFinishedMatch = rows.some((match) => FINISHED_STATUSES.has(match.statusShort) && match.scoreHome != null && match.scoreAway != null);

  async function refresh() {
    setError(null);
    setMessage(null);

    try {
      await mutate();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "No se pudo cargar partidos");
    }
  }

  async function pick(matchId: string, outcome: Outcome) {
    setSubmittingPickId(matchId);
    setError(null);
    setMessage(null);

    const optimisticRows = rows.map((match) => (match.id === matchId ? { ...match, myPick: outcome } : match));
    await mutate(optimisticRows, { revalidate: false });

    try {
      const { response, data: responseData } = await sendJsonRequest<{ error?: string }>(`/api/matches/${matchId}/pick`, {
        method: "POST",
        body: { outcome },
      });

      if (!response.ok) {
        await mutate();
        setError(responseData.error ?? "No se pudo guardar el pick");
        return;
      }

      setMessage("Pick guardado.");
    } catch (pickError) {
      await mutate();
      setError(pickError instanceof Error ? pickError.message : "No se pudo guardar el pick");
    } finally {
      setSubmittingPickId(null);
    }
  }

  async function toggleEditable(matchId: string, nextEditable: boolean) {
    setTogglingEditableId(matchId);
    setError(null);
    setMessage(null);

    const optimisticRows = rows.map((match) => (match.id === matchId ? { ...match, isEditable: nextEditable } : match));
    await mutate(optimisticRows, { revalidate: false });

    try {
      const { response, data: responseData } = await sendJsonRequest<{ error?: string }>(`/api/matches/${matchId}`, {
        method: "PATCH",
        body: { isEditable: nextEditable },
      });

      if (!response.ok) {
        await mutate();
        setError(responseData.error ?? "No se pudo actualizar el partido");
        return;
      }

      setMessage(nextEditable ? "Partido desbloqueado para edición y sincronización." : "Partido bloqueado.");
      await mutate();
    } catch (toggleError) {
      await mutate();
      setError(toggleError instanceof Error ? toggleError.message : "No se pudo actualizar el partido");
    } finally {
      setTogglingEditableId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <MatchdayClose closesAtUtc={props.initial.matchday.closesAtUtc} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-ui text-sm">{rows.length} partido(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={() => void refresh()} disabled={isValidating || Boolean(submittingPickId)}>
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
                      {match.leagueName ? ` • ${match.leagueName}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {!match.isEditable ? <Badge variant="secondary">Bloqueado</Badge> : null}
                      {match.myPick ? <p className="text-muted-ui text-xs">Tu pick: {match.myPick}</p> : null}
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="h-7 px-2 text-xs"
                          disabled={Boolean(togglingEditableId) || Boolean(submittingPickId) || isValidating}
                          onClick={() => void toggleEditable(match.id, !match.isEditable)}
                        >
                          {togglingEditableId === match.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : match.isEditable ? (
                            <Lock className="size-3.5" />
                          ) : (
                            <Unlock className="size-3.5" />
                          )}
                          {match.isEditable ? "Bloquear" : "Desbloquear"}
                        </Button>
                      ) : null}
                      {match.externalFixtureId ? (
                        <MatchGameLink tournamentId={props.tournamentId} matchdayId={props.matchdayId} matchId={match.id} />
                      ) : null}
                    </div>
                  </div>

                  <MatchPickGroup
                    value={(match.myPick as PickValue | null) ?? null}
                    result={
                      FINISHED_STATUSES.has(match.statusShort) && match.scoreHome != null && match.scoreAway != null
                        ? outcomeFromScore(match.scoreHome, match.scoreAway)
                        : null
                    }
                    homeTeam={match.homeTeam}
                    homeLogoUrl={match.homeLogoUrl}
                    awayTeam={match.awayTeam}
                    awayLogoUrl={match.awayLogoUrl}
                    disabled={isValidating || Boolean(submittingPickId) || isClosed}
                    onValueChange={(value) => void pick(match.id, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isClosed ? <p className="text-muted-ui text-sm">La jornada está cerrada.</p> : null}
      <FeedbackAlerts message={message} error={error} />
    </div>
  );
}
