"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/app/inline-alert";

type MemberRow = { userId: string; name: string | null; email: string; image: string | null };
type MatchRow = {
  id: string;
  startsAtUtc: string;
  homeTeam: string;
  awayTeam: string;
  statusShort: string;
  scoreHome: number | null;
  scoreAway: number | null;
};
type PickRow = { matchId: string; userId: string; outcome: "HOME" | "DRAW" | "AWAY" };

function abbrevOutcome(o: "HOME" | "DRAW" | "AWAY") {
  if (o === "HOME") return "1";
  if (o === "DRAW") return "X";
  return "2";
}

export function PicksRevealClient(props: {
  matchdayId: string;
  initial?: { members: MemberRow[]; matches: MatchRow[]; picks: PickRow[] };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>(props.initial?.members ?? []);
  const [matches, setMatches] = useState<MatchRow[]>(props.initial?.matches ?? []);
  const [picks, setPicks] = useState<PickRow[]>(props.initial?.picks ?? []);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/matchdays/${props.matchdayId}/picks`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      members?: MemberRow[];
      matches?: MatchRow[];
      picks?: PickRow[];
    };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudieron cargar los picks");
    setMembers(data.members ?? []);
    setMatches(data.matches ?? []);
    setPicks(data.picks ?? []);
  }

  const pickByMatchUser = useMemo(() => {
    const map = new Map<string, "HOME" | "DRAW" | "AWAY">();
    for (const p of picks) map.set(`${p.matchId}:${p.userId}`, p.outcome);
    return map;
  }, [picks]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {members.length} participante(s) • {matches.length} partido(s)
        </p>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refrescar
        </Button>
      </div>

      {error ? <InlineAlert variant="error" message={error} /> : null}

      {members.length === 0 || matches.length === 0 ? (
        <InlineAlert variant="info" message="Aún no hay datos para mostrar. Si la jornada ya cerró, prueba con Refrescar." />
      ) : null}

      <div className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-white dark:bg-black">
            <tr>
              <th className="min-w-[240px] border-b border-zinc-200 px-4 py-3 text-left font-semibold dark:border-zinc-800">Partido</th>
              {members.map((m) => (
                <th key={m.userId} className="min-w-[140px] border-b border-zinc-200 px-4 py-3 text-left font-semibold dark:border-zinc-800">
                  <div className="min-w-0">
                    <p className="truncate">{m.name ?? m.email}</p>
                    <p className="truncate text-xs font-normal text-zinc-600 dark:text-zinc-400">{m.email}</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30">
                <td className="border-b border-zinc-200 px-4 py-3 align-top dark:border-zinc-800">
                  <p className="font-medium">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(match.startsAtUtc).toISOString().replace("T", " ").slice(0, 16)} UTC • {match.statusShort}
                    {match.scoreHome != null && match.scoreAway != null ? ` • ${match.scoreHome}-${match.scoreAway}` : ""}
                  </p>
                </td>
                {members.map((m) => {
                  const outcome = pickByMatchUser.get(`${match.id}:${m.userId}`) ?? null;
                  return (
                    <td key={m.userId} className="border-b border-zinc-200 px-4 py-3 align-top dark:border-zinc-800">
                      {outcome ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 font-semibold dark:border-zinc-800">
                          {abbrevOutcome(outcome)}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

