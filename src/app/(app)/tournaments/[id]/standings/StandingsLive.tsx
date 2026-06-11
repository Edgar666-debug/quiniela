"use client";

import { useCallback, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { useStandingsRealtime } from "@/hooks/useStandingsRealtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/app/user-avatar";

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

export function StandingsLive(props: { tournamentId: string; initial: StandingRow[]; realtimeToken: string | null }) {
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

  useStandingsRealtime(props.tournamentId, props.realtimeToken, refresh);

  const maxPoints = Math.max(0, ...rows.map((r) => r.points));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Ranking</CardTitle>
          <CardDescription>Se actualiza automáticamente cuando cambian los puntos.</CardDescription>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Table>
            <TableHeader className="border-b bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="px-4 py-3">Participante</TableHead>
                <TableHead className="px-4 py-3 text-right">Puntos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const medal = medalForIndex(i);
                const width = maxPoints > 0 ? Math.round((r.points / maxPoints) * 100) : 0;
                return (
                  <TableRow key={r.user.id}>
                    <TableCell className="relative px-4 py-3">
                      <div className="absolute inset-y-0 left-0 -z-10 bg-zinc-50 dark:bg-zinc-900/30" style={{ width: `${width}%` }} />
                      <div className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-center text-sm">{medal ?? i + 1}</span>
                        <UserAvatar name={r.user.name} email={r.user.email} image={r.user.image} />
                        <span className="truncate font-medium">{r.user.name ?? r.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold tabular-nums">{r.points}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
