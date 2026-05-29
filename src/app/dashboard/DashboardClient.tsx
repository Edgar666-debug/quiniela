"use client";

import { useMemo, useState } from "react";
import { Clipboard, Loader2, Plus, RefreshCw, Ticket, Trophy, Users, KeyRound } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type MyTournament = {
  tournamentId: string;
  name: string;
  role: "OWNER" | "ORGANIZER" | "PLAYER";
};

export function DashboardClient(props: { initialTournaments: MyTournament[] }) {
  const [tournaments, setTournaments] = useState<MyTournament[]>(props.initialTournaments);
  const [loading, setLoading] = useState(false);
  const [createName, setCreateName] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreateInvite = useMemo(() => new Set<MyTournament["role"]>(["OWNER", "ORGANIZER"]), []);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/me/tournaments", { cache: "no-store" });
    const data = (await res.json()) as { tournaments?: MyTournament[]; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo cargar tus torneos");
    setTournaments(data.tournaments ?? []);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Crear torneo
            </CardTitle>
            <CardDescription>Crea un torneo y comparte invitaciones con tus amigos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="createName">Nombre</Label>
              <Input
                id="createName"
                placeholder="Liga MX • Jornada 1"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <Button
              disabled={loading || !createName.trim()}
              type="button"
              onClick={async () => {
                setMessage(null);
                setError(null);
                setLoading(true);
                const res = await fetch("/api/tournaments", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ name: createName }),
                });
                const data = (await res.json()) as { tournament?: { id: string; name: string }; error?: string };
                setLoading(false);
                if (!res.ok) return setError(data.error ?? "No se pudo crear el torneo");
                setCreateName("");
                setMessage(`Torneo creado: ${data.tournament?.name ?? ""}`);
                await refresh();
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crear
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Unirse
            </CardTitle>
            <CardDescription>Pega el token de invitación y entra al torneo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="joinToken">Token</Label>
              <Input
                id="joinToken"
                placeholder="token..."
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                spellCheck={false}
              />
            </div>
            <Button
              variant="outline"
              disabled={loading || !joinToken.trim()}
              type="button"
              onClick={async () => {
                setMessage(null);
                setError(null);
                setLoading(true);
                const res = await fetch(`/api/invites/${encodeURIComponent(joinToken.trim())}/join`, { method: "POST" });
                const data = (await res.json()) as { ok?: boolean; error?: string };
                setLoading(false);
                if (!res.ok) return setError(data.error ?? "No se pudo unir al torneo");
                setJoinToken("");
                setMessage("Te uniste al torneo.");
                await refresh();
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              Unirme
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Mis torneos
            </CardTitle>
            <CardDescription>Accede al ranking y genera invitaciones si eres organizador.</CardDescription>
          </div>
          <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refrescar
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tournaments.length === 0 ? (
            <p className="text-sm text-zinc-600">Aún no participas en torneos.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {tournaments.map((t) => (
                <li key={t.tournamentId} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">Rol: {t.role}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/tournaments/${t.tournamentId}/standings`}>Ranking</a>
                    </Button>
                  </div>

                  {canCreateInvite.has(t.role) ? (
                    <>
                      <Separator className="my-3" />
                      <Button
                        size="sm"
                        disabled={loading}
                        type="button"
                        onClick={async () => {
                          setMessage(null);
                          setError(null);
                          setLoading(true);
                          const res = await fetch(`/api/tournaments/${t.tournamentId}/invites`, {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ maxUses: 1 }),
                          });
                          const data = (await res.json()) as { invite?: { token: string }; error?: string };
                          setLoading(false);
                          if (!res.ok) return setError(data.error ?? "No se pudo crear la invitación");
                          const token = data.invite?.token;
                          if (token) {
                            await navigator.clipboard.writeText(token).catch(() => {});
                            setMessage(`Invitación creada (token copiado): ${token}`);
                          } else {
                            setMessage("Invitación creada.");
                          }
                        }}
                      >
                        <Clipboard className="h-4 w-4" />
                        Generar invitación
                      </Button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Passkey
          </CardTitle>
          <CardDescription>Agrega una passkey para entrar sin contraseña.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="w-fit"
            disabled={loading}
            type="button"
            onClick={async () => {
              setMessage(null);
              setError(null);
              setLoading(true);
              const { error } = await authClient.passkey.addPasskey({ name: "Mi passkey" });
              setLoading(false);
              if (error) return setError(error.message ?? "No se pudo registrar la passkey");
              setMessage("Passkey registrada.");
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Agregar passkey
          </Button>
          <p className="text-xs text-zinc-500">Requiere HTTPS en producción. En local funciona en `localhost`.</p>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

