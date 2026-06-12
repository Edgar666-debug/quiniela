"use client";

import Image from "next/image";
import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ticket, Trophy, Users } from "lucide-react";
import useSWR from "swr";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLocalDateTime } from "@/lib/date";
import { readJsonResponse, sendJsonRequest } from "@/lib/http";
import { pushAndRefresh } from "@/lib/navigation";

type JoinState = {
  token: string;
  loading: boolean;
  message: string | null;
  error: string | null;
};

type JoinAction =
  | { type: "set_token"; value: string }
  | { type: "clear_feedback" }
  | { type: "join_start" }
  | { type: "join_fail"; error: string }
  | { type: "join_success"; message: string };

type InvitePreview = {
  maxUses: number;
  uses: number;
  expiresAtUtc: string | null;
  isExpired: boolean;
  tournament: {
    id: string;
    name: string;
    logoUrl: string | null;
    status: "ACTIVE" | "FINISHED" | "ARCHIVED";
  };
};

type InvitePreviewResponse = {
  invite?: InvitePreview | null;
};

function joinTournamentReducer(state: JoinState, action: JoinAction): JoinState {
  switch (action.type) {
    case "set_token":
      return { ...state, token: action.value };
    case "clear_feedback":
      return { ...state, message: null, error: null };
    case "join_start":
      return { ...state, loading: true, message: null, error: null };
    case "join_fail":
      return { ...state, loading: false, error: action.error };
    case "join_success":
      return { ...state, loading: false, token: "", error: null, message: action.message };
    default:
      return state;
  }
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

async function invitePreviewFetcher(url: string): Promise<InvitePreviewResponse> {
  const res = await fetch(url);
  const data = await readJsonResponse<InvitePreviewResponse & { error?: string }>(res);

  if (!res.ok) {
    throw new Error(data.error ?? "No se pudo validar la invitación.");
  }

  return data;
}

export function JoinTournamentClient(props: { initialToken?: string }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(joinTournamentReducer, {
    token: props.initialToken ?? "",
    loading: false,
    message: null,
    error: null,
  });

  const trimmedToken = state.token.trim();
  const debouncedToken = useDebouncedValue(trimmedToken, 300);
  const previewKey = debouncedToken ? `/api/invites/${encodeURIComponent(debouncedToken)}` : null;

  const { data: previewData, error: previewRequestError, isLoading: previewLoading } = useSWR(previewKey, invitePreviewFetcher, {
    revalidateOnFocus: false,
  });

  const previewSettled = debouncedToken === trimmedToken;
  const showPreviewLoading = Boolean(trimmedToken) && (!previewSettled || previewLoading);
  const preview = previewSettled ? previewData?.invite ?? null : null;
  const previewError = previewSettled && trimmedToken ? previewRequestError?.message ?? null : null;

  const canJoin = Boolean(
    trimmedToken &&
      preview &&
      !showPreviewLoading &&
      preview.tournament.status === "ACTIVE" &&
      !preview.isExpired &&
      preview.uses < preview.maxUses,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
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
            value={state.token}
            onChange={(event) => {
              dispatch({ type: "clear_feedback" });
              dispatch({ type: "set_token", value: event.target.value });
            }}
            spellCheck={false}
          />
        </div>

        {showPreviewLoading ? <InlineAlert variant="info" message="Validando invitación..." /> : null}

        {preview ? (
          <div className="border-subtle-ui rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <div className="tournament-logo-frame size-14">
                {preview.tournament.logoUrl ? (
                  <Image src={preview.tournament.logoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <Trophy className="icon-muted-ui size-6" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-muted-ui text-sm">Vista previa del torneo</p>
                <p className="truncate text-lg font-semibold">{preview.tournament.name}</p>
                <p className="text-muted-ui text-sm">
                  Estado: {preview.tournament.status} · Usos: {preview.uses}/{preview.maxUses}
                  {preview.expiresAtUtc ? ` · Expira: ${formatLocalDateTime(preview.expiresAtUtc)}` : ""}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={state.loading || !canJoin}
            type="button"
            onClick={async () => {
              dispatch({ type: "join_start" });
              const { response, data } = await sendJsonRequest<{ ok?: boolean; error?: string }>(
                `/api/invites/${encodeURIComponent(trimmedToken)}/join`,
                { method: "POST" },
              );
              if (!response.ok) {
                dispatch({ type: "join_fail", error: data.error ?? "No se pudo unir al torneo" });
                return;
              }
              dispatch({ type: "join_success", message: "Te uniste al torneo." });
              pushAndRefresh(router, "/tournaments");
            }}
          >
            {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />}
            Unirme
          </Button>
        </div>

        <FeedbackAlerts message={state.message} error={state.error} />
        {previewError ? <InlineAlert variant="error" message={previewError} /> : null}
      </CardContent>
    </Card>
  );
}

