"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ticket, Trophy, Users } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function JoinTournamentClient(props: { initialToken?: string }) {
  const router = useRouter();
  const [token, setToken] = useState(props.initialToken ?? "");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<InvitePreview | null>(null);

  useEffect(() => {
    const nextToken = token.trim();

    if (!nextToken) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setPreviewLoading(true);
      const res = await fetch(`/api/invites/${encodeURIComponent(nextToken)}`, { signal: controller.signal });
      const data = (await res.json().catch(() => ({}))) as { invite?: InvitePreview; error?: string };
      setPreviewLoading(false);

      if (!res.ok) {
        setPreview(null);
        setError(data.error ?? "No se pudo validar la invitación.");
        return;
      }

      setError(null);
      setPreview(data.invite ?? null);
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [token]);

  const canJoin = Boolean(
    token.trim() &&
      preview &&
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
            value={token}
            onChange={(e) => {
              const nextValue = e.target.value;
              setMessage(null);
              setError(null);
              if (!nextValue.trim()) setPreview(null);
              setToken(nextValue);
            }}
            spellCheck={false}
          />
        </div>

        {previewLoading ? <InlineAlert variant="info" message="Validando invitación..." /> : null}

        {preview ? (
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                {preview.tournament.logoUrl ? (
                  <Image src={preview.tournament.logoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <Trophy className="size-6 text-zinc-500" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Vista previa del torneo</p>
                <p className="truncate text-lg font-semibold">{preview.tournament.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Estado: {preview.tournament.status} · Usos: {preview.uses}/{preview.maxUses}
                  {preview.expiresAtUtc ? ` · Expira: ${preview.expiresAtUtc}` : ""}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={loading || !canJoin}
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
              setPreview(null);
              setMessage("Te uniste al torneo.");
              router.push("/tournaments");
              router.refresh();
            }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />}
            Unirme
          </Button>
        </div>

        {message ? <InlineAlert variant="success" message={message} /> : null}
        {error ? <InlineAlert variant="error" message={error} /> : null}
      </CardContent>
    </Card>
  );
}
