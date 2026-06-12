"use client";

import { useReducer, useState } from "react";
import { Clipboard, Loader2, Mail, Plus, Ticket } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatLocalDateTime } from "@/lib/date";

type InviteItem = {
  token: string;
  maxUses: number;
  uses: number;
  expiresAtUtc: string | null;
  createdAtUtc: string;
};

type InviteState = {
  loading: boolean;
  emailLoading: boolean;
  recipientEmail: string;
  message: string | null;
  error: string | null;
};

type InviteAction =
  | { type: "set_recipient_email"; value: string }
  | { type: "reset_feedback" }
  | { type: "create_start"; mode: "token" | "email" }
  | { type: "create_fail"; mode: "token" | "email"; error: string }
  | { type: "create_success"; mode: "token" | "email"; message: string };

function invitesReducer(state: InviteState, action: InviteAction): InviteState {
  switch (action.type) {
    case "set_recipient_email":
      return { ...state, recipientEmail: action.value };
    case "reset_feedback":
      return { ...state, message: null, error: null };
    case "create_start":
      return {
        ...state,
        loading: action.mode === "token",
        emailLoading: action.mode === "email",
        message: null,
        error: null,
      };
    case "create_fail":
      return {
        ...state,
        loading: false,
        emailLoading: false,
        error: action.error,
      };
    case "create_success":
      return {
        ...state,
        loading: false,
        emailLoading: false,
        recipientEmail: action.mode === "email" ? "" : state.recipientEmail,
        message: action.message,
        error: null,
      };
    default:
      return state;
  }
}

export function InvitesClient(props: { tournamentId: string; tournamentStatus: "ACTIVE" | "FINISHED" | "ARCHIVED"; initialInvites: InviteItem[] }) {
  const [localInvites, setLocalInvites] = useState<{ source: InviteItem[]; value: InviteItem[] } | null>(null);
  const invites = localInvites?.source === props.initialInvites ? localInvites.value : props.initialInvites;
  const [state, dispatch] = useReducer(invitesReducer, {
    loading: false,
    emailLoading: false,
    recipientEmail: "",
    message: null,
    error: null,
  });

  const hasAvailable = invites.some((i) => i.uses < i.maxUses);
  const canGenerate = props.tournamentStatus === "ACTIVE";

  async function createInvite(email?: string) {
    dispatch({ type: "reset_feedback" });
    if (!canGenerate) return dispatch({ type: "create_fail", mode: email ? "email" : "token", error: "El torneo no está activo. No se pueden generar invitaciones." });

    dispatch({ type: "create_start", mode: email ? "email" : "token" });

    const res = await fetch(`/api/tournaments/${props.tournamentId}/invites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ maxUses: 1, ...(email ? { email } : {}) }),
    });
    const data = (await res.json()) as { invite?: { token: string; maxUses: number; uses: number; expiresAt: string | null }; error?: string };
    if (!res.ok) return dispatch({ type: "create_fail", mode: email ? "email" : "token", error: data.error ?? "No se pudo crear la invitación" });
    if (!data.invite?.token) return dispatch({ type: "create_fail", mode: email ? "email" : "token", error: "Respuesta inválida del servidor" });

    const item: InviteItem = {
      token: data.invite.token,
      maxUses: data.invite.maxUses ?? 1,
      uses: data.invite.uses ?? 0,
      expiresAtUtc: data.invite.expiresAt ?? null,
      createdAtUtc: new Date().toISOString(),
    };
    setLocalInvites({ source: props.initialInvites, value: [item, ...invites].slice(0, 20) });

    if (email) {
      dispatch({ type: "create_success", mode: "email", message: `Invitación enviada a ${email}` });
    } else {
      await navigator.clipboard.writeText(item.token).catch(() => {});
      dispatch({ type: "create_success", mode: "token", message: `Token copiado: ${item.token}` });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="size-5" />
            Generar invitación
          </CardTitle>
          <CardDescription>Cada invitación es de 1 uso. Puedes copiar el token o enviarlo por correo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Button className="w-fit" disabled={state.loading || state.emailLoading || !canGenerate} type="button" onClick={() => createInvite()}>
              {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Generar token
            </Button>
            {hasAvailable ? (
              <p className="text-subtle-ui text-xs">Tip: si ya tienes tokens sin usar, también puedes reutilizarlos.</p>
            ) : null}
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail">Enviar por correo</Label>
              <div className="flex gap-2">
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="invitado@ejemplo.com"
                  value={state.recipientEmail}
                  onChange={(e) => dispatch({ type: "set_recipient_email", value: e.target.value })}
                  disabled={state.emailLoading || !canGenerate}
                  className="max-w-72"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.emailLoading || state.loading || !canGenerate || !state.recipientEmail.trim()}
                  onClick={() => createInvite(state.recipientEmail.trim())}
                >
                  {state.emailLoading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Enviar
                </Button>
              </div>
            </div>
          </div>

          {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recientes</CardTitle>
          <CardDescription>Últimos tokens generados (máximo 20).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {invites.length === 0 ? (
            <EmptyState compact description="Aún no hay invitaciones." />
          ) : (
            <ul className="flex flex-col gap-3">
              {invites.map((i) => (
                <li key={i.token} className="list-row-ui">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm">{i.token}</p>
                      <p className="text-muted-ui text-xs">
                        Usos: {i.uses}/{i.maxUses}
                        {i.expiresAtUtc ? ` • Expira: ${formatLocalDateTime(i.expiresAtUtc)}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(i.token).catch(() => {});
                        dispatch({ type: "create_success", mode: "token", message: `Token copiado: ${i.token}` });
                      }}
                    >
                      <Clipboard className="size-4" />
                      Copiar
                    </Button>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-subtle-ui text-xs">Creado: {formatLocalDateTime(i.createdAtUtc)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
