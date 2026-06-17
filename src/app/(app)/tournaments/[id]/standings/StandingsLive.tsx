"use client";

import { useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import useSWR from "swr";

import { InlineAlert } from "@/components/app/inline-alert";
import { UserAvatar } from "@/components/app/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStandingsRealtime } from "@/hooks/useStandingsRealtime";
import { fetchJsonOrThrow } from "@/lib/http";

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
  const { data, error, isValidating, mutate } = useSWR(
    `/api/tournaments/${props.tournamentId}/standings`,
    async (url: string) => {
      const payload = await fetchJsonOrThrow<{ standings?: StandingRow[] }>(url, { cache: "no-store" }, "No se pudo cargar el ranking.");
      return payload.standings ?? [];
    },
    {
      fallbackData: props.initial,
      revalidateOnFocus: false,
    },
  );

  const rows = data ?? props.initial;

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  useStandingsRealtime(props.tournamentId, props.realtimeToken, refresh);

  const maxPoints = Math.max(0, ...rows.map((row) => row.points));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Ranking</CardTitle>
          <CardDescription>Se actualiza automáticamente cuando cambian los puntos.</CardDescription>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => void refresh()} disabled={isValidating}>
          {isValidating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {error ? <InlineAlert variant="error" message={error.message} className="mb-4" /> : null}

        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Table>
            <TableHeader className="border-b bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                <TableHead className="px-4 py-3">Participante</TableHead>
                <TableHead className="px-4 py-3 text-right">Puntos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const medal = medalForIndex(index);
                const width = maxPoints > 0 ? Math.round((row.points / maxPoints) * 100) : 0;

                return (
                  <TableRow key={row.user.id}>
                    <TableCell className="relative px-4 py-3">
                      <div className="absolute inset-y-0 left-0 -z-10 bg-zinc-50 dark:bg-zinc-900/30" style={{ width: `${width}%` }} />
                      <div className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-center text-sm">{medal ?? index + 1}</span>
                        <UserAvatar name={row.user.name} email={row.user.email} image={row.user.image} />
                        <span className="truncate font-medium">{row.user.name ?? row.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold tabular-nums">{row.points}</TableCell>
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
