"use client";

import { useEffect, useMemo, useReducer, useState } from "react"; 
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { MatchPickGroup, PickLegend, type PickValue } from "@/components/matches/pick-cards";
import { groupMatchesByLocalKickoff } from "@/lib/format";
import { FINISHED_STATUSES, outcomeFromScore, statusLabel, type Outcome } from "@/lib/football";

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
  myPick: Outcome | null;
};

type MatchdayState = {
  localRows: { source: MatchRow[]; value: MatchRow[] } | null;
  loading: boolean;
  error: string | null;
  message: string | null;
};

type MatchdayAction =
  | { type: "refresh_start" }
  | { type: "refresh_ok"; source: MatchRow[]; matches: MatchRow[] }
  | { type: "refresh_fail"; error: string }
  | { type: "pick_start" }
  | { type: "pick_ok"; source: MatchRow[]; matches: MatchRow[] }
  | { type: "pick_fail"; error: string };

function matchdayReducer(state: MatchdayState, action: MatchdayAction): MatchdayState {
  switch (action.type) {
    case "refresh_start":
      return { ...state, loading: true, error: null };
    case "refresh_ok":
      return { ...state, loading: false, localRows: { source: action.source, value: action.matches } };
    case "refresh_fail":
      return { ...state, loading: false, error: action.error };
    case "pick_start":
      return { ...state, loading: true, error: null, message: null };
    case "pick_ok":
      return {
        ...state,
        loading: false,
        message: "Pick guardado.",
        localRows: { source: action.source, value: action.matches },
      };
    case "pick_fail":
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

export function MatchdayClient(props: {
  matchdayId: string;
  initial: {
    role: "OWNER" | "ORGANIZER" | "PLAYER";
    matchday: { id: string; number: number; closesAtUtc: string };
    matches: MatchRow[];
  };
}) {
  const [state, dispatch] = useReducer(matchdayReducer, {
    localRows: null,
    loading: false,
    error: null,
    message: null,
  });
  const [nowMs, setNowMs] = useState(() => Date.now());

  const rows =
    state.localRows?.source === props.initial.matches ? state.localRows.value : props.initial.matches;

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const closesAtMs = new Date(props.initial.matchday.closesAtUtc).getTime();
  const isClosed = nowMs >= closesAtMs;

  const grouped = useMemo(() => groupMatchesByLocalKickoff(rows), [rows]);
  const hasFinishedMatch = rows.some(
    (m) => FINISHED_STATUSES.has(m.statusShort) && m.scoreHome != null && m.scoreAway != null,
  );

  async function refresh() {
    dispatch({ type: "refresh_start" });
    const res = await fetch(`/api/matchdays/${props.matchdayId}/detail`, { cache: "no-store" });
    const data = (await res.json()) as { matches?: MatchRow[]; error?: string };
    if (!res.ok) return dispatch({ type: "refresh_fail", error: data.error ?? "No se pudo cargar partidos" });
    dispatch({ type: "refresh_ok", source: props.initial.matches, matches: data.matches ?? [] });
  }

  async function pick(matchId: string, outcome: Outcome) {
    dispatch({ type: "pick_start" });
    const res = await fetch(`/api/matches/${matchId}/pick`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return dispatch({ type: "pick_fail", error: data.error ?? "No se pudo guardar el pick" });
    dispatch({
      type: "pick_ok",
      source: props.initial.matches,
      matches: rows.map((m) => (m.id === matchId ? { ...m, myPick: outcome } : m)),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <MatchdayClose closesAtUtc={props.initial.matchday.closesAtUtc} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-ui text-sm">{rows.length} partido(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={state.loading}>
          {state.loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
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
                    {m.myPick ? <p className="text-muted-ui text-xs">Tu pick: {m.myPick}</p> : null}
                  </div>

                  <MatchPickGroup
                    value={(m.myPick as PickValue | null) ?? null}
                    result={
                      FINISHED_STATUSES.has(m.statusShort) && m.scoreHome != null && m.scoreAway != null
                        ? outcomeFromScore(m.scoreHome, m.scoreAway)
                        : null
                    }
                    homeTeam={m.homeTeam}
                    homeLogoUrl={m.homeLogoUrl}
                    awayTeam={m.awayTeam}
                    awayLogoUrl={m.awayLogoUrl}
                    disabled={state.loading || isClosed}
                    onValueChange={(value) => pick(m.id, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isClosed ? <p className="text-muted-ui text-sm">La jornada está cerrada.</p> : null}
      {state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </div>
  );
}
