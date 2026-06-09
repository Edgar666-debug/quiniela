import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
  actions?: React.ReactNode;
};

export function EmptyState(props: EmptyStateProps) {
  return (
    <div className={cn("empty-state-ui rounded-xl", props.compact ? "px-4 py-6" : "px-6 py-16", props.className)}>
      {props.icon ? <div className="mx-auto flex w-fit items-center justify-center">{props.icon}</div> : null}
      {props.title ? <p className={cn("font-medium", props.compact ? "mt-2 text-base" : "mt-4 text-lg")}>{props.title}</p> : null}
      <p className={cn("text-muted-ui", props.title ? "mt-1" : "", props.compact ? "text-sm" : "text-sm")}>{props.description}</p>
      {props.actions ? <div className="mt-6 flex flex-wrap justify-center gap-2">{props.actions}</div> : null}
    </div>
  );
}
