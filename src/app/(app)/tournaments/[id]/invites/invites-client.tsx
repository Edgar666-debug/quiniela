"use client";

import { useState } from "react";
import { Clipboard, Loader2, Plus, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type InviteItem = {
  token: string;
  maxUses: number;
  uses: number;
  expiresAtUtc: string | null;
  createdAtUtc: string;
};

export function InvitesClient(props: { tournamentId: string; tournamentStatus: "ACTIVE" | "FINISHED" | "ARCHIVED"; initialInvites: InviteItem[] }) {
  const [localInvites, setLocalInvites] = useState<{ source: InviteItem[]; value: InviteItem[] } | null>(null);
  const invites = localInvites?.source === props.initialInvites ? localInvites.value : props.initialInvites;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAvailable = invites.some((i) => i.uses < i.maxUses);
  const canGenerate = props.tournamentStatus === "ACTIVE";

  async function generate() {
    setMessage(null);
    setError(null);
    if (!canGenerate) return setError("El torneo no estÃ¡ activo. No se pueden generar invitaciones.");
    setLoading(true);
    const res = await fetch(`/api/tournaments/${props.tournamentId}/invites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ maxUses: 1 }),
    });
    const data = (await res.json()) as { invite?: { token: string; maxUses: number; uses: number; expiresAt: string | null }; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo crear la invitación");
    if (!data.invite?.token) return setError("Respuesta inválida del servidor");

    const item: InviteItem = {
      token: data.invite.token,
      maxUses: data.invite.maxUses ?? 1,
      uses: data.invite.uses ?? 0,
      expiresAtUtc: data.invite.expiresAt ?? null,
      createdAtUtc: new Date().toISOString(),
    };
    setLocalInvites({
      source: props.initialInvites,
      value: [item, ...invites].slice(0, 20),
    });
    await navigator.clipboard.writeText(item.token).catch(() => {});
    setMessage(`Invitación creada y copiada: ${item.token}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Generar invitación
          </CardTitle>
          <CardDescription>Por ahora, cada invitación es de 1 uso.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button className="w-fit" disabled={loading || !canGenerate} type="button" onClick={generate}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Generar token
          </Button>
          {hasAvailable ? (
            <p className="text-xs text-zinc-500">Tip: si ya tienes tokens sin usar, también puedes reutilizarlos.</p>
          ) : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recientes</CardTitle>
          <CardDescription>Últimos tokens generados (máximo 20).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {invites.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Aún no hay invitaciones.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {invites.map((i) => (
                <li key={i.token} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm">{i.token}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Usos: {i.uses}/{i.maxUses}
                        {i.expiresAtUtc ? ` • Expira: ${i.expiresAtUtc}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(i.token).catch(() => {});
                        setMessage(`Token copiado: ${i.token}`);
                      }}
                    >
                      <Clipboard className="h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-xs text-zinc-500">Creado (UTC): {i.createdAtUtc}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
