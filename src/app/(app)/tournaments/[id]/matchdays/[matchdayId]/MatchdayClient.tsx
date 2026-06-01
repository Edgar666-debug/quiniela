"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchdayClose } from "@/components/matchdays/matchday-close";

type Outcome = "HOME" | "DRAW" | "AWAY";

type MatchRow = {
  id: string;
  externalFixtureId: number | null;
  startsAtUtc: string;
  homeTeam: string;
  awayTeam: string;
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

      <div className="grid gap-3">
        {rows.map((m) => (
          <div key={m.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {m.homeTeam} vs {m.awayTeam}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Inicio (UTC): {new Date(m.startsAtUtc).toISOString().replace("T", " ").slice(0, 16)} • Estado: {statusLabel(m.statusShort)}
                  {m.scoreHome != null && m.scoreAway != null ? ` • ${m.scoreHome}-${m.scoreAway}` : ""}
                  {m.externalFixtureId ? ` • Fixture ${m.externalFixtureId}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={m.myPick === "HOME" ? "secondary" : "outline"} disabled={loading || isClosed} type="button" onClick={() => pick(m.id, "HOME")}>
                  1
                </Button>
                <Button size="sm" variant={m.myPick === "DRAW" ? "secondary" : "outline"} disabled={loading || isClosed} type="button" onClick={() => pick(m.id, "DRAW")}>
                  X
                </Button>
                <Button size="sm" variant={m.myPick === "AWAY" ? "secondary" : "outline"} disabled={loading || isClosed} type="button" onClick={() => pick(m.id, "AWAY")}>
                  2
                </Button>
              </div>
            </div>
            {m.myPick ? <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">Tu pick: {m.myPick}</p> : null}
          </div>
        ))}
      </div>

      {isClosed ? <p className="text-sm text-zinc-600 dark:text-zinc-400">La jornada está cerrada.</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
