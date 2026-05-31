import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function InlineSpinner(props: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400", props.className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{props.label ?? "Cargando..."}</span>
    </div>
  );
}

