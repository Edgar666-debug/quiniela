"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

function TeamLogo(props: { name: string; logoUrl?: string | null; className?: string }) {
  return (
    <div
      className={cn(
        "h-10 w-14 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30",
        props.className,
      )}
    >
      {props.logoUrl ? (
        <Image src={props.logoUrl} alt="" width={56} height={40} className="h-full w-full object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {props.name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function TeamPickCard(props: {
  side: "HOME" | "AWAY";
  name: string;
  logoUrl?: string | null;
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <div className="flex items-center gap-3">
      <TeamLogo name={props.name} logoUrl={props.logoUrl} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{props.name}</p>
        <p
          className={cn(
            "mt-1 w-fit rounded-md px-2 py-1 text-xs",
            props.selected ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
          )}
        >
          {props.side === "HOME" ? "Local" : "Visita"}
        </p>
      </div>
    </div>
  );

  const className = cn(
    "group w-full rounded-xl border p-3 text-left transition-colors",
    props.disabled ? "opacity-60" : "",
    props.selected
      ? "border-red-500 bg-red-50 dark:bg-red-950/30"
      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950/30",
  );

  if (props.onClick) {
    return (
      <button type="button" disabled={props.disabled} onClick={props.onClick} className={className}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

export function DrawPickCard(props: { selected: boolean; disabled?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <p className="text-xl font-bold text-zinc-700 dark:text-zinc-200">X</p>
      <p
        className={cn(
          "mt-2 w-full rounded-md px-2 py-1 text-center text-xs",
          props.selected ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
        )}
      >
        Empate
      </p>
    </>
  );

  const className = cn(
    "flex h-full w-full flex-col items-center justify-center rounded-xl border p-3 transition-colors",
    props.disabled ? "opacity-60" : "",
    props.selected
      ? "border-red-500 bg-red-50 dark:bg-red-950/30"
      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950/30",
  );

  if (props.onClick) {
    return (
      <button type="button" disabled={props.disabled} onClick={props.onClick} className={className}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

