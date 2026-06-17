"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import useSWR from "swr";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { MatchdayClose } from "@/components/matchdays/matchday-close";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { fetchJsonOrThrow, sendJsonRequest } from "@/lib/http";
import type { MatchdayListRow } from "@/lib/matchday-list";

export function MatchdaysClient(props: {
  tournamentId: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  tournamentStatus: "ACTIVE" | "FINISHED" | "ARCHIVED";
  initial: MatchdayListRow[];
}) {
  const { data, isValidating, mutate } = useSWR(
    `/api/tournaments/${props.tournamentId}/matchdays`,
    async (url: string) => {
      const payload = await fetchJsonOrThrow<{ matchdays?: MatchdayListRow[] }>(url, { cache: "no-store" }, "No se pudo cargar jornadas");
      return payload.matchdays ?? [];
    },
    {
      fallbackData: props.initial,
      revalidateOnFocus: false,
    },
  );
  const rows = data ?? props.initial;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const canManage = props.role === "OWNER" || props.role === "ORGANIZER";
  const canCreateMatchday = canManage && props.tournamentStatus === "ACTIVE";

  async function deleteMatchday(matchdayId: string) {
    setDeletingId(matchdayId);
    setError(null);

    const optimisticRows = rows.filter((row) => row.id !== matchdayId);
    await mutate(optimisticRows, { revalidate: false });

    try {
      const { response, data: responseData } = await sendJsonRequest<{ error?: string }>(
        `/api/tournaments/${props.tournamentId}/matchdays/${matchdayId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        await mutate();
        setError(responseData.error ?? "No se pudo borrar la jornada");
      }
    } catch (deleteError) {
      await mutate();
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo borrar la jornada");
    } finally {
      setDeletingId(null);
    }
  }

  async function refresh() {
    setError(null);

    try {
      await mutate();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "No se pudo cargar jornadas");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-ui text-sm">{rows.length} jornada(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={() => void refresh()} disabled={isValidating || Boolean(deletingId)}>
          {isValidating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
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

      <FeedbackAlerts error={error} />

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((matchday) => {
          const total = matchday.matchesCount;
          const isClosed = nowMs >= new Date(matchday.closesAtUtc).getTime();
          const done = matchday.myPicksCount;
          const fillPercent = total > 0 ? Math.round((done / total) * 100) : 0;
          const complete = total > 0 && done >= total;
          const showAccuracy = isClosed && matchday.scoredMatchesCount > 0;
          const percent = showAccuracy ? (matchday.accuracyPercent ?? 0) : fillPercent;
          const label = showAccuracy
            ? `${matchday.myCorrectCount}/${matchday.scoredMatchesCount} aciertos`
            : complete
              ? "✓ Completo"
              : `${done}/${total} picks`;
          const barClass = showAccuracy
            ? percent >= 70
              ? "bg-emerald-500"
              : percent > 0
                ? "bg-amber-400"
                : "bg-zinc-200 dark:bg-zinc-700"
            : complete
              ? "bg-emerald-500"
              : done > 0
                ? "bg-amber-400"
                : "bg-zinc-200 dark:bg-zinc-700";
          const labelClass = showAccuracy
            ? percent >= 70
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-ui"
            : complete
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-ui";

          return (
            <div key={matchday.id} className="list-card-ui bg-white dark:bg-zinc-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Jornada {matchday.number}</p>
                  <MatchdayClose closesAtUtc={matchday.closesAtUtc} compact />
                  <p className="text-muted-ui mt-1 text-xs">{total} partido(s)</p>

                  {total > 0 ? (
                    <div className="mt-2 flex flex-col gap-1">
                      {isClosed && matchday.scoredMatchesCount === 0 ? (
                        <p className="text-muted-ui text-xs">Esperando resultados</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-medium ${labelClass}`}>{label}</span>
                            <span className="text-muted-ui text-xs">{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${percent}%` }} />
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tournaments/${props.tournamentId}/matchdays/${matchday.id}`}>
                      <CalendarDays className="size-4" />
                      Abrir
                    </Link>
                  </Button>

                  {canManage && matchday.matchesCount === 0 ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={deletingId === matchday.id}>
                          {deletingId === matchday.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Borrar jornada {matchday.number}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La jornada se eliminará permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void deleteMatchday(matchday.id)}>Borrar</AlertDialogAction>
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
