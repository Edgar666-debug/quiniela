import { cn } from "@/lib/utils";

export function InlineAlert(props: { variant: "error" | "success" | "info"; message: string; className?: string }) {
  const styles =
    props.variant === "error"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-950/50 dark:bg-red-950/30 dark:text-red-200"
    : props.variant === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950/50 dark:bg-emerald-950/30 dark:text-emerald-200"
        : "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200";

  return <div className={cn("rounded-lg border px-3 py-2 text-sm", styles, props.className)}>{props.message}</div>;
}
