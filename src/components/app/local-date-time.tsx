"use client";

import { formatLocalDateTime } from "@/lib/date";
import { getUserTimeZone } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LocalDateTimeText(props: {
  iso: string;
  className?: string;
  prefix?: string;
  showTimeZone?: boolean;
}) {
  const label = formatLocalDateTime(props.iso);
  const suffix = props.showTimeZone ? ` (${getUserTimeZone()})` : "";
  const text = props.prefix ? `${props.prefix}: ${label}${suffix}` : `${label}${suffix}`;

  return <span className={cn(props.className)}>{text}</span>;
}
