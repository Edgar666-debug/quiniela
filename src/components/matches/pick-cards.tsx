"use client";

import Image from "next/image";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils";
import { RadioGroup } from "@/components/ui/radio-group";

export type PickValue = "HOME" | "DRAW" | "AWAY";

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

const pickItemClassName =
  "group w-full rounded-xl border border-zinc-200 bg-white p-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950/30 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-black dark:data-[state=checked]:bg-red-950/30";

const drawItemClassName =
  "group flex h-full w-full flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950/30 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-black dark:data-[state=checked]:bg-red-950/30";

const sideBadgeClassName =
  "mt-1 w-fit rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 group-data-[state=checked]:bg-red-600 group-data-[state=checked]:text-white dark:bg-zinc-900 dark:text-zinc-200";

const drawBadgeClassName =
  "mt-2 w-full rounded-md bg-zinc-100 px-2 py-1 text-center text-xs text-zinc-700 group-data-[state=checked]:bg-red-600 group-data-[state=checked]:text-white dark:bg-zinc-900 dark:text-zinc-200";

export function MatchPickGroup(props: {
  value?: PickValue | null;
  homeTeam: string;
  homeLogoUrl?: string | null;
  awayTeam: string;
  awayLogoUrl?: string | null;
  disabled?: boolean;
  onValueChange?: (value: PickValue) => void;
  className?: string;
}) {
  const readOnly = !props.onValueChange;

  return (
    <RadioGroup
      value={props.value ?? ""}
      onValueChange={(value) => props.onValueChange?.(value as PickValue)}
      disabled={props.disabled || readOnly}
      className={cn("grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_1fr]", props.className)}
    >
      <RadioGroupPrimitive.Item value="HOME" className={pickItemClassName}>
        <div className="flex items-center gap-3">
          <TeamLogo name={props.homeTeam} logoUrl={props.homeLogoUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{props.homeTeam}</p>
            <p className={sideBadgeClassName}>Local</p>
          </div>
        </div>
      </RadioGroupPrimitive.Item>

      <RadioGroupPrimitive.Item value="DRAW" className={drawItemClassName}>
        <p className="text-xl font-bold text-zinc-700 dark:text-zinc-200">X</p>
        <p className={drawBadgeClassName}>Empate</p>
      </RadioGroupPrimitive.Item>

      <RadioGroupPrimitive.Item value="AWAY" className={pickItemClassName}>
        <div className="flex items-center gap-3">
          <TeamLogo name={props.awayTeam} logoUrl={props.awayLogoUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{props.awayTeam}</p>
            <p className={sideBadgeClassName}>Visita</p>
          </div>
        </div>
      </RadioGroupPrimitive.Item>
    </RadioGroup>
  );
}
