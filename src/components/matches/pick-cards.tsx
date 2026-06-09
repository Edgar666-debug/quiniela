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

type ItemState = "correct" | "wrong" | "selected" | "default";

function getItemState(
  itemValue: PickValue,
  selectedValue: PickValue | null | undefined,
  result: PickValue | null | undefined,
): ItemState {
  const isSelected = selectedValue === itemValue;
  const hasResult = result != null;

  if (hasResult && result === itemValue) return "correct";
  if (isSelected && hasResult && result !== itemValue) return "wrong";
  if (isSelected && !hasResult) return "selected";
  return "default";
}

function itemClassName(state: ItemState, draw = false) {
  const base = draw
    ? "group flex h-full w-full flex-col items-center justify-center rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-black"
    : "group w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-black";

  if (state === "correct")
    return cn(base, "border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40");
  if (state === "wrong")
    return cn(base, "border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/30");
  if (state === "selected")
    return cn(base, "border-zinc-500 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800/60");
  return cn(base, "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-950/30");
}

function badgeClassName(state: ItemState, draw = false) {
  const base = draw
    ? "mt-2 w-full rounded-md px-2 py-1 text-center text-xs"
    : "mt-1 w-fit rounded-md px-2 py-1 text-xs";

  if (state === "correct") return cn(base, "bg-emerald-600 text-white");
  if (state === "wrong") return cn(base, "bg-red-600 text-white");
  if (state === "selected") return cn(base, "bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900");
  return cn(base, "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200");
}

export function PickLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
      <span className="text-zinc-500 dark:text-zinc-400">Simbología:</span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" />
        <span className="text-zinc-600 dark:text-zinc-300">Correcto</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-red-500 bg-red-50 dark:bg-red-950/30" />
        <span className="text-zinc-600 dark:text-zinc-300">Incorrecto</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/60" />
        <span className="text-zinc-600 dark:text-zinc-300">Pendiente</span>
      </span>
    </div>
  );
}

export function MatchPickGroup(props: {
  value?: PickValue | null;
  /** Resultado real del partido (HOME/DRAW/AWAY). null/undefined = partido no finalizado. */
  result?: PickValue | null;
  homeTeam: string;
  homeLogoUrl?: string | null;
  awayTeam: string;
  awayLogoUrl?: string | null;
  disabled?: boolean;
  onValueChange?: (value: PickValue) => void;
  className?: string;
}) {
  const readOnly = !props.onValueChange;
  const { value, result } = props;

  const homeState = getItemState("HOME", value, result);
  const drawState = getItemState("DRAW", value, result);
  const awayState = getItemState("AWAY", value, result);

  return (
    <RadioGroup
      value={props.value ?? ""}
      onValueChange={(v) => props.onValueChange?.(v as PickValue)}
      disabled={props.disabled || readOnly}
      className={cn("grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_1fr]", props.className)}
    >
      <RadioGroupPrimitive.Item value="HOME" className={itemClassName(homeState)}>
        <div className="flex items-center gap-3">
          <TeamLogo name={props.homeTeam} logoUrl={props.homeLogoUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{props.homeTeam}</p>
            <p className={badgeClassName(homeState)}>Local</p>
          </div>
        </div>
      </RadioGroupPrimitive.Item>

      <RadioGroupPrimitive.Item value="DRAW" className={itemClassName(drawState, true)}>
        <p className="text-xl font-bold text-zinc-700 dark:text-zinc-200">X</p>
        <p className={badgeClassName(drawState, true)}>Empate</p>
      </RadioGroupPrimitive.Item>

      <RadioGroupPrimitive.Item value="AWAY" className={itemClassName(awayState)}>
        <div className="flex items-center gap-3">
          <TeamLogo name={props.awayTeam} logoUrl={props.awayLogoUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{props.awayTeam}</p>
            <p className={badgeClassName(awayState)}>Visita</p>
          </div>
        </div>
      </RadioGroupPrimitive.Item>
    </RadioGroup>
  );
}
