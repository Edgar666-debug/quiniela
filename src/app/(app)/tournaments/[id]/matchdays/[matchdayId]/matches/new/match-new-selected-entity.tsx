"use client";

import { X } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";

export function MatchNewSelectedEntity(props: { selectedLabel: string | null; onClear?: () => void }) {
  if (!props.selectedLabel) {
    return <InlineAlert variant="info" message="También puedes buscar fixtures solo por fecha o rango, sin seleccionar entidad." />;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
      <div className="min-w-0">
        <span className="font-medium">Seleccionado:</span> <span className="truncate">{props.selectedLabel}</span>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">La búsqueda de fixtures usará este ID y exigirá temporada.</p>
      </div>
      {props.onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
          onClick={props.onClear}
        >
          <X className="size-4" />
          <span className="sr-only">Quitar selección</span>
        </Button>
      ) : null}
    </div>
  );
}
