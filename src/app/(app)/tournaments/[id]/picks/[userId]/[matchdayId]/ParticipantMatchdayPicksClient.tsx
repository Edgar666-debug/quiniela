"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
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
  pick: Outcome | null;
};

export function ParticipantMatchdayPicksClient(props: {
  tournamentId: string;
  userId: string;
  matchdayId: string;
  initial: { matchday: { number: number; closesAtUtc: string }; participantLabel: string; matches: MatchRow[] };
}) {
  const [rows, setRows] = useState<MatchRow[]>(props.initial.matches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/matchdays/${props.matchdayId}/participants/${props.userId}`, { cache: "no-store" });
    const data = (await res.json()) as { matches?: MatchRow[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar picks");
    setRows(data.matches ?? []);
  }

  function TeamPickCard(props: { side: "HOME" | "AWAY"; name: string; logoUrl?: string | null; selected: boolean }) {
    return (
      <div
        className={cn(
          "w-full rounded-xl border p-3",
          props.selected ? "border-red-500 bg-red-50 dark:bg-red-950/30" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black",
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
      </div>
    );
  }

  function DrawPickCard(props: { selected: boolean }) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center rounded-xl border p-3",
          props.selected ? "border-red-500 bg-red-50 dark:bg-red-950/30" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black",
        )}
      >
        <p className="text-xl font-bold text-zinc-700 dark:text-zinc-200">X</p>
        <p className={cn("mt-2 w-full rounded-md px-2 py-1 text-center text-xs", props.selected ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")}>
          Empate
        </p>
      </div>
    );
  }

  const closesAtMs = useMemo(() => new Date(props.initial.matchday.closesAtUtc).getTime(), [props.initial.matchday.closesAtUtc]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const isClosed = useMemo(() => nowMs >= closesAtMs, [nowMs, closesAtMs]);

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
                    {m.pick ? <p className="text-xs text-zinc-600 dark:text-zinc-400">Pick: {m.pick}</p> : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_1fr]">
                    <TeamPickCard side="HOME" name={m.homeTeam} logoUrl={m.homeLogoUrl} selected={m.pick === "HOME"} />
                    <DrawPickCard selected={m.pick === "DRAW"} />
                    <TeamPickCard side="AWAY" name={m.awayTeam} logoUrl={m.awayLogoUrl} selected={m.pick === "AWAY"} />
                  </div>
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

