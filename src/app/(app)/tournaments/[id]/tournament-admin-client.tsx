"use client";

import { useState } from "react";
import { Archive, Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/app/inline-alert";
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

export function TournamentAdminClient(props: { tournamentId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isActive = props.status === "ACTIVE";
  const isFinished = props.status === "FINISHED";
  const isArchived = props.status === "ARCHIVED";

  return (
    <div className="flex flex-col gap-3">
      {!isActive ? <InlineAlert variant="info" message={`Estado actual: ${props.status}`} /> : null}
      {error ? <InlineAlert variant="error" message={error} /> : null}

      <div className="flex flex-wrap gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={loading || !isActive}>
              <Archive className="size-4" />
              Archivar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archivar torneo</AlertDialogTitle>
              <AlertDialogDescription>Esto archivará el torneo. Podrás reactivarlo después (solo si no está finalizado).</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ status: "ARCHIVED" }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { error?: string };
                  setLoading(false);
                  if (!res.ok) return setError(data.error ?? "No se pudo archivar el torneo");
                  window.location.reload();
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={loading || props.status !== "ARCHIVED"}>
              Reactivar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reactivar torneo</AlertDialogTitle>
              <AlertDialogDescription>Esto reactivará el torneo. Solo es posible si no está finalizado.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ status: "ACTIVE" }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { error?: string };
                  setLoading(false);
                  if (!res.ok) return setError(data.error ?? "No se pudo reactivar el torneo");
                  window.location.reload();
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loading || !isActive}>
              <Flag className="size-4" />
              Finalizar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar torneo</AlertDialogTitle>
              <AlertDialogDescription>
                Esto marcará el torneo como terminado y bloqueará cambios de estado. No podrás volver a activarlo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ status: "FINISHED" }),
                  });
                  const data = (await res.json().catch(() => ({}))) as { error?: string };
                  setLoading(false);
                  if (!res.ok) return setError(data.error ?? "No se pudo finalizar el torneo");
                  window.location.reload();
                }}
              >
                Finalizar torneo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isFinished ? <InlineAlert variant="info" message="El torneo está finalizado. El estado ya no se puede cambiar." /> : null}
      {isArchived ? <InlineAlert variant="info" message="El torneo está archivado. Puedes reactivarlo." /> : null}
    </div>
  );
}
