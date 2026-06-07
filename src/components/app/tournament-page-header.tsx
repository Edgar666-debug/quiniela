import Image from "next/image";
import { Trophy } from "lucide-react";

type TournamentPageHeaderProps = {
  name: string;
  logoUrl?: string | null;
  eyebrow: string;
  description?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

export function TournamentPageHeader(props: TournamentPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
          {props.logoUrl ? (
            <Image src={props.logoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
          ) : (
            <Trophy className="size-6 text-zinc-500" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Trophy className="size-4" />
            <span className="text-sm">{props.eyebrow}</span>
          </div>
          <h1 className="text-2xl font-semibold">{props.name}</h1>
          {props.description ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{props.description}</p> : null}
          {props.meta}
        </div>
      </div>
      {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
    </div>
  );
}
