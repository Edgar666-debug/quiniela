"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewTournamentClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5" />
          Datos del torneo
        </CardTitle>
        <CardDescription>El nombre lo puedes cambiar después (si quieres).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tournamentName">Nombre</Label>
          <Input
            id="tournamentName"
            placeholder="Liga MX • Clausura • Jornada 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={loading || !name.trim()}
            type="button"
            onClick={async () => {
              setError(null);
              setLoading(true);
              const res = await fetch("/api/tournaments", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
              });
              const data = (await res.json()) as { tournament?: { id: string }; error?: string };
              setLoading(false);
              if (!res.ok) return setError(data.error ?? "No se pudo crear el torneo");
              router.push(`/tournaments/${data.tournament?.id ?? ""}`);
              router.refresh();
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
            Crear torneo
          </Button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

