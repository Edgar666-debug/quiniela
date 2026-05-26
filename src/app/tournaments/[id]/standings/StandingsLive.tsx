"use client";

import { useCallback, useState } from "react";

import { useStandingsRealtime } from "@/hooks/useStandingsRealtime";

type StandingRow = {
  points: number;
  user: { id: string; name: string | null; email: string; image: string | null };
};

export function StandingsLive(props: { tournamentId: string; initial: StandingRow[] }) {
  const [rows, setRows] = useState(props.initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${props.tournamentId}/standings`, { cache: "no-store" });
    const data = (await res.json()) as { standings?: StandingRow[] };
    setLoading(false);
    if (data.standings) setRows(data.standings);
  }, [props.tournamentId]);

  useStandingsRealtime(props.tournamentId, refresh);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ranking</h2>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={refresh} type="button">
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left">Participante</th>
              <th className="px-3 py-2 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{r.user.name ?? r.user.email}</td>
                <td className="px-3 py-2 text-right font-medium">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        Se actualiza automáticamente cuando cambia la tabla `Standing` (Supabase Realtime).
      </p>
    </div>
  );
}

