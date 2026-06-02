"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { DrawPickCard, TeamPickCard } from "@/components/matches/pick-cards";
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

export function MatchdayClient(props: {
  matchdayId: string;
  initial: {
    role: "OWNER" | "ORGANIZER" | "PLAYER";
    matchday: { id: string; number: number; closesAtUtc: string };
    matches: MatchRow[];
  };
}) {
  const [localRows, setLocalRows] = useState<{ source: MatchRow[]; value: MatchRow[] } | null>(null);
  const rows = localRows?.source === props.initial.matches ? localRows.value : props.initial.matches;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const closesAtMs = useMemo(() => new Date(props.initial.matchday.closesAtUtc).getTime(), [props.initial.matchday.closesAtUtc]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const isClosed = useMemo(() => nowMs >= closesAtMs, [nowMs, closesAtMs]);

  const formatKickoff = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        timeZone: "UTC",
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, MatchRow[]>();
    for (const m of rows) {
      const d = new Date(m.startsAtUtc);
      const key = d.toISOString().slice(0, 16); // stable UTC minute bucket
      const arr = groups.get(key);
      if (arr) arr.push(m);
      else groups.set(key, [m]);
    }
    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([k, ms]) => ({ key: k, date: new Date(k + ":00.000Z"), matches: ms }));
  }, [rows]);


  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/matchdays/${props.matchdayId}/detail`, { cache: "no-store" });
    const data = (await res.json()) as { matches?: MatchRow[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar partidos");
    setLocalRows({ source: props.initial.matches, value: data.matches ?? [] });
  }

  async function pick(matchId: string, outcome: Outcome) {
    setMessage(null);
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/matches/${matchId}/pick`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo guardar el pick");
    setLocalRows({
      source: props.initial.matches,
      value: rows.map((m) => (m.id === matchId ? { ...m, myPick: outcome } : m)),
    });
    setMessage("Pick guardado.");
  }

  return (
    <div className="flex flex-col gap-4">
      <MatchdayClose closesAtUtc={props.initial.matchday.closesAtUtc} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{rows.length} partido(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
                      disabled={loading || isClosed}
                      onClick={() => pick(m.id, "HOME")}
                    />
                    <DrawPickCard selected={m.myPick === "DRAW"} disabled={loading || isClosed} onClick={() => pick(m.id, "DRAW")} />
                    <TeamPickCard
                      side="AWAY"
                      name={m.awayTeam}
                      logoUrl={m.awayLogoUrl}
                      selected={m.myPick === "AWAY"}
                      disabled={loading || isClosed}
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
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
