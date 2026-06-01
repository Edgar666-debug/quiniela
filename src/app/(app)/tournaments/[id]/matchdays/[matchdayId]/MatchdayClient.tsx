"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { cn } from "@/lib/utils";

type Outcome = "HOME" | "DRAW" | "AWAY";

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
  const [rows, setRows] = useState<MatchRow[]>(props.initial.matches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const closesAtMs = useMemo(() => new Date(props.initial.matchday.closesAtUtc).getTime(), [props.initial.matchday.closesAtUtc]);
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
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

  function statusLabel(short: string) {
    if (short === "FT") return "Final";
    if (short === "AET") return "Final (ET)";
    if (short === "PEN") return "Final (PEN)";
    if (short === "NS") return "No iniciado";
    if (short === "HT") return "Medio tiempo";
    if (short === "PST") return "Pospuesto";
    if (short === "CANC") return "Cancelado";
    if (short === "ABD") return "Abandonado";
    if (short === "AWD") return "Adjudicado";
    if (short === "WO") return "Walkover";
    if (short === "NF") return "No encontrado";
    return short;
  }

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

  function TeamPickCard(props: {
    side: "HOME" | "AWAY";
    name: string;
    logoUrl?: string | null;
    selected: boolean;
    disabled: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        disabled={props.disabled}
        onClick={props.onClick}
        className={cn(
          "group w-full rounded-xl border p-3 text-left transition-colors disabled:opacity-60",
          props.selected ? "border-red-500 bg-red-50 dark:bg-red-950/30" : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950/30",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30">
            {props.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.logoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">{props.name.slice(0, 2).toUpperCase()}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{props.name}</p>
            <p className={cn("mt-1 w-fit rounded-md px-2 py-1 text-xs", props.selected ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")}>
              {props.side === "HOME" ? "Local" : "Visita"}
            </p>
          </div>
        </div>
      </button>
    );
  }

  function DrawPickCard(props: { selected: boolean; disabled: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        disabled={props.disabled}
        onClick={props.onClick}
        className={cn(
          "flex h-full w-full flex-col items-center justify-center rounded-xl border p-3 transition-colors disabled:opacity-60",
          props.selected ? "border-red-500 bg-red-50 dark:bg-red-950/30" : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950/30",
        )}
      >
        <p className="text-xl font-bold text-zinc-700 dark:text-zinc-200">X</p>
        <p className={cn("mt-2 w-full rounded-md px-2 py-1 text-center text-xs", props.selected ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")}>
          Empate
        </p>
      </button>
    );
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/matchdays/${props.matchdayId}/detail`, { cache: "no-store" });
    const data = (await res.json()) as { matches?: MatchRow[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar partidos");
    setRows(data.matches ?? []);
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
    setRows((prev) => prev.map((m) => (m.id === matchId ? { ...m, myPick: outcome } : m)));
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
