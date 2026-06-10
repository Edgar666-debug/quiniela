"use client";

import { Archive, Flag, Loader2, MoreVertical, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TournamentStatusDialogKind } from "./tournament-admin-status-dialog";

export function TournamentAdminStatusMenu(props: {
  busy: boolean;
  isActive: boolean;
  isArchived: boolean;
  isFinished: boolean;
  onSelect: (kind: TournamentStatusDialogKind) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={props.busy || props.isFinished}>
          {props.busy ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
          <span className="sr-only">Opciones de estado</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem disabled={!props.isActive} onSelect={() => props.onSelect("archive")}>
          <Archive className="size-4" />
          Archivar
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!props.isArchived} onSelect={() => props.onSelect("reactivate")}>
          <RefreshCw className="size-4" />
          Reactivar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!props.isActive}
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          onSelect={() => props.onSelect("finish")}
        >
          <Flag className="size-4" />
          Finalizar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
