import { Badge } from "@/components/ui/badge";
import { formatTournamentScopeLabel, type TournamentLeagueConfig } from "@/lib/tournament-scope-shared";

export function TournamentScopeBadge(props: { tournament: TournamentLeagueConfig; className?: string }) {
  const label = formatTournamentScopeLabel(props.tournament);
  const variant = props.tournament.scope === "SINGLE_LEAGUE" ? "secondary" : "outline";

  return (
    <Badge variant={variant} className={props.className}>
      {label}
    </Badge>
  );
}
