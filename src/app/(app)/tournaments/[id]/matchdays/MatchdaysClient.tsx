"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { readJsonResponse, sendJsonRequest } from "@/lib/http";

type MatchdayRow = {
  id: string;
  number: number;
  closesAtUtc: string;
  matchesCount: number;
  myPicksCount: number;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = props.role === "OWNER" || props.role === "ORGANIZER";
  const canCreateMatchday = canManage && props.tournamentStatus === "ACTIVE";

  async function deleteMatchday(matchdayId: string) {
    setDeletingId(matchdayId);
    setError(null);
    const { response, data } = await sendJsonRequest<{ error?: string }>(
      `/api/tournaments/${props.tournamentId}/matchdays/${matchdayId}`,
      { method: "DELETE" },
    );
    setDeletingId(null);
    if (!response.ok) return setError(data.error ?? "No se pudo borrar la jornada");
    setLocalRows({ source: props.initial, value: rows.filter((r) => r.id !== matchdayId) });
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/tournaments/${props.tournamentId}/matchdays/list`, { cache: "no-store" });
    const data = await readJsonResponse<{ matchdays?: MatchdayRow[]; error?: string }>(res);
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar jornadas");
    setLocalRows({ source: props.initial, value: data.matchdays ?? [] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-ui text-sm">{rows.length} jornada(s)</p>
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
        {rows.map((m) => {
          const total = m.matchesCount;
          const done = m.myPicksCount;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const complete = total > 0 && done >= total;
          return (
            <div key={m.id} className="list-card-ui bg-white dark:bg-zinc-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Jornada {m.number}</p>
                  <MatchdayClose closesAtUtc={m.closesAtUtc} compact />
                  <p className="text-muted-ui mt-1 text-xs">{total} partido(s)</p>

                  {total > 0 ? (
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-medium ${complete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-ui"}`}>
                          {complete ? "✓ Completo" : `${done}/${total} picks`}
                        </span>
                        <span className="text-muted-ui text-xs">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${complete ? "bg-emerald-500" : done > 0 ? "bg-amber-400" : "bg-zinc-200 dark:bg-zinc-700"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tournaments/${props.tournamentId}/matchdays/${m.id}`}>
                      <CalendarDays className="size-4" />
                      Abrir
                    </Link>
                  </Button>
                  {canManage && m.matchesCount === 0 ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={deletingId === m.id}>
                          {deletingId === m.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Borrar jornada {m.number}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La jornada se eliminará permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMatchday(m.id)}>
                            Borrar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
