"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ticket, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinTournamentClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Token de invitación
        </CardTitle>
        <CardDescription>Los tokens suelen ser de un solo uso.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="inviteToken">Token</Label>
          <Input
            id="inviteToken"
            placeholder="pega-el-token..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={loading || !token.trim()}
            type="button"
            onClick={async () => {
              setMessage(null);
              setError(null);
              setLoading(true);
              const res = await fetch(`/api/invites/${encodeURIComponent(token.trim())}/join`, { method: "POST" });
              const data = (await res.json()) as { ok?: boolean; error?: string };
              setLoading(false);
              if (!res.ok) return setError(data.error ?? "No se pudo unir al torneo");
              setToken("");
              setMessage("Te uniste al torneo.");
              router.push("/tournaments");
              router.refresh();
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
            Unirme
          </Button>
        </div>

        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

