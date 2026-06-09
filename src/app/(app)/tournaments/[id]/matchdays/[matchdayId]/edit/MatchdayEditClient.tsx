"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { MatchdayFormFields } from "@/components/matchdays/matchday-form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { datetimeLocalToIso, isoToDatetimeLocalValue } from "@/lib/matchday-form";

export function MatchdayEditClient(props: {
  tournamentId: string;
  matchdayId: string;
  initialNumber: number;
  initialClosesAtUtc: string;
  matchesCount: number;
}) {
  const router = useRouter();
  const [number, setNumber] = useState(String(props.initialNumber));
  const [closesAtLocal, setClosesAtLocal] = useState(() => isoToDatetimeLocalValue(props.initialClosesAtUtc));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isClosed = useMemo(() => {
    const closesAtMs = new Date(props.initialClosesAtUtc).getTime();
    const nowMs = new Date().getTime();
    return nowMs >= closesAtMs;
  }, [props.initialClosesAtUtc]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar jornada {props.initialNumber}</CardTitle>
        <CardDescription>
          Ajusta el número o la fecha de cierre. {props.matchesCount} partido(s) en esta jornada.
          {isClosed ? " La jornada ya está cerrada; cambiar el cierre puede afectar cuándo se revelan picks." : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <MatchdayFormFields
          number={number}
          closesAtLocal={closesAtLocal}
          onNumberChange={setNumber}
          onClosesAtChange={setClosesAtLocal}
          numberId="edit-number"
          closesAtId="edit-closesAt"
        />

        {message ? <InlineAlert variant="success" message={message} /> : null}
        {error ? <InlineAlert variant="error" message={error} /> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={loading || !number.trim() || !closesAtLocal}
            type="button"
            onClick={async () => {
              setError(null);
              setMessage(null);
              setLoading(true);
              const res = await fetch(`/api/matchdays/${props.matchdayId}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  number: Number(number),
                  closesAtUtc: datetimeLocalToIso(closesAtLocal),
                }),
              });
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              setLoading(false);
              if (!res.ok) return setError(data.error ?? "No se pudo actualizar la jornada");
              setMessage("Jornada actualizada.");
              router.refresh();
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar cambios
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href={`/tournaments/${props.tournamentId}/matchdays/${props.matchdayId}`}>Volver a la jornada</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
