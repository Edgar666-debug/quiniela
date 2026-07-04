"use client";

import Image from "next/image";

import type { ChampionOption } from "@/lib/tournament-champion";

export function ChampionOptionLabel(props: { option: ChampionOption }) {
  return (
    <div className="flex items-center gap-2">
      {props.option.logoUrl ? <Image src={props.option.logoUrl} alt="" width={18} height={18} className="size-[18px] object-contain" unoptimized /> : null}
      <span>{props.option.name}</span>
    </div>
  );
}
