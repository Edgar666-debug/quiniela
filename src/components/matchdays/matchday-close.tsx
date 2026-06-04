"use client";

import { useEffect, useState } from "react";
import { Lock, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatLocalDateTime, formatUtcDateTime } from "@/lib/date";
import { getUserTimeZone } from "@/lib/format";

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function MatchdayClose(props: { closesAtUtc: string; compact?: boolean; className?: string }) {
  const closesAtMs = new Date(props.closesAtUtc).getTime();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = closesAtMs - nowMs;
  const isClosed = remainingMs <= 0;

  if (props.compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs", props.className)}>
        {isClosed ? <Lock className="size-3.5 text-zinc-500" /> : <Timer className="size-3.5 text-emerald-500" />}
        <span className={cn(isClosed ? "text-zinc-500" : "text-emerald-400")}>{isClosed ? "Cerrada" : "Abierta"}</span>
        <span className="text-zinc-600 dark:text-zinc-400">•</span>
        <span className="text-zinc-600 dark:text-zinc-400" title={formatUtcDateTime(props.closesAtUtc)}>
          {formatLocalDateTime(props.closesAtUtc)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800", props.className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isClosed ? <Lock className="size-4 text-zinc-500" /> : <Timer className="size-4 text-emerald-500" />}
          <p className="text-sm font-medium">{isClosed ? "Jornada cerrada" : "Jornada abierta"}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            isClosed ? "bg-zinc-900/30 text-zinc-300" : "bg-emerald-900/30 text-emerald-300",
          )}
        >
          {isClosed ? "Cerrada" : "Abierta"}
        </span>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Cierre: {formatLocalDateTime(props.closesAtUtc)} ({getUserTimeZone()})
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">Referencia UTC: {formatUtcDateTime(props.closesAtUtc)}</p>
      {isClosed ? null : (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Tiempo restante: {formatRemaining(remainingMs)}</p>
      )}
    </div>
  );
}
