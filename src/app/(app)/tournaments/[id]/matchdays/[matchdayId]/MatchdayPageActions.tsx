"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function MatchdayPageActions(props: {
  tournamentId: string;
  matchdayId: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  closesAtUtc: string;
}) {
  const closesAtMs = new Date(props.closesAtUtc).getTime();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isClosed = nowMs >= closesAtMs;
  const canManage = props.role === "OWNER" || props.role === "ORGANIZER";

  return (
    <div className="flex flex-wrap gap-2">
      {!isClosed && canManage ? (
        <Button asChild size="sm">
          <Link href={`/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}/matches/new`}>
            <Plus className="h-4 w-4" />
            Agregar partido
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="outline" size="sm">
        <Link href={`/tournaments/${props.tournamentId}/picks`}>
          <Users className="h-4 w-4" />
          Participantes
        </Link>
      </Button>
    </div>
  );
}
