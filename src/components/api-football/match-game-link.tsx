import Link from "next/link";
import { Tv } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MatchGameLink(props: { tournamentId: string; matchdayId: string; matchId: string }) {
  const href = `/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}/matches/${props.matchId}`;

  return (
    <Button type="button" variant="outline" size="sm" asChild>
      <Link href={href}>
        <Tv className="size-4" />
        Detalles
      </Link>
    </Button>
  );
}
