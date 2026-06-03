"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { DrawPickCard, TeamPickCard } from "@/components/matches/pick-cards";
import { kickoffDateFormatter } from "@/lib/format";
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

  const formatKickoff = kickoffDateFormatter;

  const grouped = useMemo(() => {
    const groups = new Map<string, MatchRow[]>();
    for (const m of rows) {
      const d = new Date(m.startsAtUtc);
      const key = d.toISOString().slice(0, 16);
      const arr = groups.get(key);
      if (arr) arr.push(m);
      else groups.set(key, [m]);
    }
    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([k, ms]) => ({ key: k, date: new Date(k + ":00.000Z"), matches: ms }));
  }, [rows]);

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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{rows.length} partido(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={state.loading}>
          {state.loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refrescar
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {grouped.map((g) => (
          <div key={g.key} className="flex flex-col gap-3">
            <p className="text-center text-sm font-semibold text-zinc-700 dark:text-zinc-200">{formatKickoff.format(g.date)}</p>
            <div className="grid gap-4">
              {g.matches.map((m) => (
                <div key={m.id} className="grid gap-3 rounded-2xl bg-zinc-50/70 p-4 dark:bg-zinc-950/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Estado: {statusLabel(m.statusShort)}
                      {m.scoreHome != null && m.scoreAway != null ? ` • ${m.scoreHome}-${m.scoreAway}` : ""}
                      {m.externalFixtureId ? ` • Fixture ${m.externalFixtureId}` : ""}
                    </p>
                    {m.myPick ? <p className="text-xs text-zinc-600 dark:text-zinc-400">Tu pick: {m.myPick}</p> : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_1fr]">
                    <TeamPickCard
                      side="HOME"
                      name={m.homeTeam}
                      logoUrl={m.homeLogoUrl}
                      selected={m.myPick === "HOME"}
                      disabled={state.loading || isClosed}
                      onClick={() => pick(m.id, "HOME")}
                    />
                    <DrawPickCard selected={m.myPick === "DRAW"} disabled={state.loading || isClosed} onClick={() => pick(m.id, "DRAW")} />
                    <TeamPickCard
                      side="AWAY"
                      name={m.awayTeam}
                      logoUrl={m.awayLogoUrl}
                      selected={m.myPick === "AWAY"}
                      disabled={state.loading || isClosed}
                      onClick={() => pick(m.id, "AWAY")}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isClosed ? <p className="text-sm text-zinc-600 dark:text-zinc-400">La jornada está cerrada.</p> : null}
      {state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </div>
  );
}
