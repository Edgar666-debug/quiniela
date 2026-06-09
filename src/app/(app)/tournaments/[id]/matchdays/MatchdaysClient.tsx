"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MatchdayClose } from "@/components/matchdays/matchday-close";

type MatchdayRow = {
  id: string;
  number: number;
  closesAtUtc: string;
  matchesCount: number;
};

export function MatchdaysClient(props: {
  tournamentId: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  tournamentStatus: "ACTIVE" | "FINISHED" | "ARCHIVED";
  initial: MatchdayRow[];
}) {
  const [localRows, setLocalRows] = useState<{ source: MatchdayRow[]; value: MatchdayRow[] } | null>(null);
  const rows = localRows?.source === props.initial ? localRows.value : props.initial;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = props.role === "OWNER" || props.role === "ORGANIZER";
  const canCreateMatchday = canManage && props.tournamentStatus === "ACTIVE";

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/tournaments/${props.tournamentId}/matchdays/list`, { cache: "no-store" });
    const data = (await res.json()) as { matchdays?: MatchdayRow[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar jornadas");
    setLocalRows({ source: props.initial, value: data.matchdays ?? [] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{rows.length} jornada(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refrescar
        </Button>
      </div>

      {canCreateMatchday ? (
        <>
          <Separator />
          <Button asChild className="w-fit" variant="outline" size="sm">
            <Link href={`/tournaments/${props.tournamentId}/matchdays/new`}>
              <Plus className="size-4" />
              Crear jornada
            </Link>
          </Button>
        </>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((m) => (
          <div key={m.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Jornada {m.number}</p>
                <MatchdayClose closesAtUtc={m.closesAtUtc} compact />
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{m.matchesCount} partido(s)</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tournaments/${props.tournamentId}/matchdays/${m.id}`}>
                    <CalendarDays className="size-4" />
                    Abrir
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
