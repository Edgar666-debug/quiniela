"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type MatchdayRow = {
  id: string;
  number: number;
  closesAtUtc: string;
  matchesCount: number;
};

export function MatchdaysClient(props: {
  tournamentId: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  initial: MatchdayRow[];
}) {
  const [rows, setRows] = useState(props.initial);
  const [loading, setLoading] = useState(false);
  const [number, setNumber] = useState("");
  const [closesAtLocal, setClosesAtLocal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canManage = useMemo(() => props.role === "OWNER" || props.role === "ORGANIZER", [props.role]);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/tournaments/${props.tournamentId}/matchdays/list`, { cache: "no-store" });
    const data = (await res.json()) as { matchdays?: MatchdayRow[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar jornadas");
    setRows(data.matchdays ?? []);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{rows.length} jornada(s)</p>
        <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refrescar
        </Button>
      </div>

      {canManage ? (
        <>
          <Separator />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="number">Número</Label>
              <Input id="number" inputMode="numeric" placeholder="1" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="closesAt">Cierre (hora local)</Label>
              <Input id="closesAt" type="datetime-local" value={closesAtLocal} onChange={(e) => setClosesAtLocal(e.target.value)} />
              <p className="text-xs text-zinc-500">Se convertirá a UTC al guardarse.</p>
            </div>
          </div>
          <Button
            className="w-fit"
            disabled={loading || !number.trim() || !closesAtLocal}
            type="button"
            onClick={async () => {
              setError(null);
              setLoading(true);
              const closesAtUtc = new Date(closesAtLocal).toISOString();
              const res = await fetch(`/api/tournaments/${props.tournamentId}/matchdays`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ number: Number(number), closesAtUtc }),
              });
              const data = (await res.json()) as { error?: string };
              setLoading(false);
              if (!res.ok) return setError(data.error ?? "No se pudo crear la jornada");
              setNumber("");
              setClosesAtLocal("");
              await refresh();
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Crear jornada
          </Button>
        </>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((m) => (
          <div key={m.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Jornada {m.number}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Cierra (UTC): {new Date(m.closesAtUtc).toISOString().replace("T", " ").slice(0, 16)}
                </p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{m.matchesCount} partido(s)</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/tournaments/${props.tournamentId}/matchdays/${m.id}`}>
                  <CalendarDays className="h-4 w-4" />
                  Abrir
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
