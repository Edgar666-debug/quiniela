"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type TournamentStatusDialogKind = "archive" | "reactivate" | "finish";

const DIALOG_COPY: Record<
  TournamentStatusDialogKind,
  {
    title: string;
    description: string;
    actionLabel: string;
    actionVariant?: "default" | "destructive";
  }
> = {
  archive: {
    title: "Archivar torneo",
    description: "Esto archivará el torneo. Podrás reactivarlo después (solo si no está finalizado).",
    actionLabel: "Confirmar",
  },
  reactivate: {
    title: "Reactivar torneo",
    description: "Esto reactivará el torneo y lo pondrá de nuevo como activo.",
    actionLabel: "Confirmar",
  },
  finish: {
    title: "Finalizar torneo",
    description: "Esto marcará el torneo como terminado y bloqueará cambios de estado. No podrás volver a activarlo.",
    actionLabel: "Finalizar",
    actionVariant: "destructive",
  },
};

export function TournamentAdminStatusDialog(props: {
  kind: TournamentStatusDialogKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const copy = DIALOG_COPY[props.kind];

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={copy.actionVariant} onClick={props.onConfirm}>
            {copy.actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
