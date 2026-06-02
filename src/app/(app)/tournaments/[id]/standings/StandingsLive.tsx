"use client";

import { useCallback, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { useStandingsRealtime } from "@/hooks/useStandingsRealtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StandingRow = {
  points: number;
  user: { id: string; name: string | null; email: string; image: string | null };
};

function medalForIndex(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return null;
}

export function StandingsLive(props: { tournamentId: string; initial: StandingRow[] }) {
  const [localRows, setLocalRows] = useState<{ source: StandingRow[]; value: StandingRow[] } | null>(null);
  const rows = localRows?.source === props.initial ? localRows.value : props.initial;

  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${props.tournamentId}/standings`, { cache: "no-store" });
    const data = (await res.json()) as { standings?: StandingRow[] };
    setLoading(false);
    if (data.standings) setLocalRows({ source: props.initial, value: data.standings });
  }, [props.initial, props.tournamentId]);

  useStandingsRealtime(props.tournamentId, refresh);

  const maxPoints = Math.max(0, ...rows.map((r) => r.points));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Ranking</CardTitle>
          <CardDescription>Se actualiza automáticamente cuando cambian los puntos.</CardDescription>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Participante</th>
                <th className="px-4 py-3 text-right font-medium">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const medal = medalForIndex(i);
                const width = maxPoints > 0 ? Math.round((r.points / maxPoints) * 100) : 0;
                return (
                  <tr key={r.user.id} className="border-b last:border-b-0 dark:border-zinc-800">
                    <td className="relative px-4 py-3">
                      <div className="absolute inset-y-0 left-0 -z-10 bg-zinc-50 dark:bg-zinc-900/30" style={{ width: `${width}%` }} />
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-center text-sm">{medal ?? i + 1}</span>
                        <span className="truncate font-medium">{r.user.name ?? r.user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
