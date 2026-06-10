import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function InlineSpinner(props: { label?: string; className?: string }) {
  return (
    <div className={cn("text-muted-ui flex items-center gap-2 text-sm", props.className)}>
      <Loader2 className="size-4 animate-spin" />
      <span>{props.label ?? "Cargando..."}</span>
    </div>
  );
}

