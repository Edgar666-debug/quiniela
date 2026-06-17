"use client";

import { useReducer } from "react";
import { Clipboard, Loader2, Mail, Plus, Ticket } from "lucide-react";
import useSWR from "swr";

import { EmptyState } from "@/components/app/empty-state";
import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatLocalDateTime } from "@/lib/date";
import { sendJsonRequest } from "@/lib/http";

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
  | { type: "create_fail"; error: string }
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
  const { data, mutate } = useSWR(
    `/api/tournaments/${props.tournamentId}/invites`,
    async () => props.initialInvites,
    {
      fallbackData: props.initialInvites,
      revalidateOnFocus: false,
    },
  );
  const invites = data ?? props.initialInvites;

  const [state, dispatch] = useReducer(invitesReducer, {
    loading: false,
    emailLoading: false,
    recipientEmail: "",
    message: null,
    error: null,
  });

  const hasAvailable = invites.some((invite) => invite.uses < invite.maxUses);
  const canGenerate = props.tournamentStatus === "ACTIVE";

  async function createInvite(email?: string) {
    dispatch({ type: "reset_feedback" });

    if (!canGenerate) {
      dispatch({ type: "create_fail", error: "El torneo no está activo. No se pueden generar invitaciones." });
      return;
    }

    const mode = email ? "email" : "token";
    dispatch({ type: "create_start", mode });

    try {
      const { response, data: responseData } = await sendJsonRequest<{
        invite?: { token: string; maxUses: number; uses: number; expiresAt: string | null };
        error?: string;
      }>(`/api/tournaments/${props.tournamentId}/invites`, {
        method: "POST",
        body: { maxUses: 1, ...(email ? { email } : {}) },
      });

      if (!response.ok) {
        dispatch({ type: "create_fail", error: responseData.error ?? "No se pudo crear la invitación" });
        return;
      }

      if (!responseData.invite?.token) {
        dispatch({ type: "create_fail", error: "Respuesta inválida del servidor" });
        return;
      }

      const nextInvite: InviteItem = {
        token: responseData.invite.token,
        maxUses: responseData.invite.maxUses ?? 1,
        uses: responseData.invite.uses ?? 0,
        expiresAtUtc: responseData.invite.expiresAt ?? null,
        createdAtUtc: new Date().toISOString(),
      };

      await mutate([nextInvite, ...invites].slice(0, 20), { revalidate: false });

      if (email) {
        dispatch({ type: "create_success", mode: "email", message: `Invitación enviada a ${email}` });
        return;
      }

      await navigator.clipboard.writeText(nextInvite.token).catch(() => {});
      dispatch({ type: "create_success", mode: "token", message: `Token copiado: ${nextInvite.token}` });
    } catch (createError) {
      dispatch({
        type: "create_fail",
        error: createError instanceof Error ? createError.message : "No se pudo crear la invitación",
      });
    }
  }

  async function copyInviteToken(token: string) {
    await navigator.clipboard.writeText(token).catch(() => {});
    dispatch({ type: "create_success", mode: "token", message: `Token copiado: ${token}` });
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
            <Button className="w-fit" disabled={state.loading || state.emailLoading || !canGenerate} type="button" onClick={() => void createInvite()}>
              {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Generar token
            </Button>
            {hasAvailable ? <p className="text-subtle-ui text-xs">Tip: si ya tienes tokens sin usar, también puedes reutilizarlos.</p> : null}
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
                  onChange={(event) => dispatch({ type: "set_recipient_email", value: event.target.value })}
                  disabled={state.emailLoading || !canGenerate}
                  className="max-w-72"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.emailLoading || state.loading || !canGenerate || !state.recipientEmail.trim()}
                  onClick={() => void createInvite(state.recipientEmail.trim())}
                >
                  {state.emailLoading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Enviar
                </Button>
              </div>
            </div>
          </div>

          <FeedbackAlerts message={state.message} error={state.error} />
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
              {invites.map((invite) => (
                <li key={invite.token} className="list-row-ui">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm">{invite.token}</p>
                      <p className="text-muted-ui text-xs">
                        Usos: {invite.uses}/{invite.maxUses}
                        {invite.expiresAtUtc ? ` • Expira: ${formatLocalDateTime(invite.expiresAtUtc)}` : ""}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" type="button" onClick={() => void copyInviteToken(invite.token)}>
                      <Clipboard className="size-4" />
                      Copiar
                    </Button>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-subtle-ui text-xs">Creado: {formatLocalDateTime(invite.createdAtUtc)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
