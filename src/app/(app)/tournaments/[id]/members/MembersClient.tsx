"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Save, Trash2, Trophy } from "lucide-react";
import useSWR from "swr";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { UserAvatar } from "@/components/app/user-avatar";
import { ChampionOptionLabel } from "@/components/tournaments/champion-option-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendJsonRequest } from "@/lib/http";
import { pushAndRefresh } from "@/lib/navigation";
import type { ChampionPickState } from "@/lib/tournament-champion";

type MemberRow = {
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  champion: string | null;
  user: { id: string; email: string; name: string | null; image: string | null };
};

export function MembersClient(props: {
  tournamentId: string;
  myUserId: string;
  myRole: "OWNER" | "ORGANIZER" | "PLAYER";
  championState: ChampionPickState | null;
  initial: MemberRow[];
}) {
  const router = useRouter();
  const { data, mutate } = useSWR(`tournament-members:${props.tournamentId}`, async () => props.initial, {
    fallbackData: props.initial,
    revalidateOnFocus: false,
  });
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [savingChampion, setSavingChampion] = useState(false);
  const [championValue, setChampionValue] = useState(props.championState?.myChampion ?? "");
  const [championMessage, setChampionMessage] = useState<string | null>(null);
  const [championError, setChampionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = data ?? props.initial;
  const championOptions = props.championState?.options ?? [];
  const selectedChampionOption = championOptions.find((option) => option.name === championValue) ?? null;
  const championState = props.championState;
  const showChampionSection = props.championState?.enabled ?? false;

  const canManage = props.myRole === "OWNER" || props.myRole === "ORGANIZER";

  function canRemove(target: MemberRow) {
    if (!canManage) return false;
    if (target.user.id === props.myUserId) return false;
    if (target.role === "OWNER") return false;
    if (props.myRole === "ORGANIZER" && target.role !== "PLAYER") return false;
    return true;
  }

  return (
    <div className="flex flex-col gap-3">
      {showChampionSection && championState ? (
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <p className="text-sm font-medium">Tu campeón</p>
              </div>
              <p className="text-muted-ui text-xs">Elige al campeón del torneo. Vale 3 puntos al final.</p>
            </div>
            {championState.resolvedChampion ? <Badge variant="secondary">Oficial: {championState.resolvedChampion}</Badge> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="memberChampion">Equipo</Label>
            <Select value={championValue || "__none__"} onValueChange={(value) => setChampionValue(value === "__none__" ? "" : value)} disabled={savingChampion || !championState.editable}>
              <SelectTrigger id="memberChampion">
                {selectedChampionOption ? <ChampionOptionLabel option={selectedChampionOption} /> : <SelectValue placeholder="Selecciona un campeón" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin definir</SelectItem>
                {championOptions.map((option) => (
                  <SelectItem key={option.name} value={option.name}>
                    <ChampionOptionLabel option={option} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={savingChampion || !championState.editable}
              onClick={async () => {
                setChampionError(null);
                setChampionMessage(null);
                setSavingChampion(true);

                try {
                  const { response, data: responseData } = await sendJsonRequest<{
                    error?: string;
                    state?: ChampionPickState;
                  }>(`/api/tournaments/${props.tournamentId}/champion-pick`, {
                    method: "PATCH",
                    body: { champion: championValue || null },
                  });

                  if (!response.ok) {
                    setChampionError(responseData.error ?? "No se pudo guardar el campeón.");
                    return;
                  }

                  setChampionValue(responseData.state?.myChampion ?? championValue);
                  setChampionMessage("Campeón guardado.");
                  router.refresh();
                } catch (saveError) {
                  setChampionError(saveError instanceof Error ? saveError.message : "No se pudo guardar el campeón.");
                } finally {
                  setSavingChampion(false);
                }
              }}
            >
              {savingChampion ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar campeón
            </Button>
            {!championState.editable ? <Badge variant="outline">Bloqueado por estado: {championState.status}</Badge> : null}
          </div>

          <FeedbackAlerts message={championMessage} error={championError} className="mt-3" />
        </div>
      ) : null}

      <FeedbackAlerts error={error} />

      <div className="flex flex-wrap gap-2">
        {props.myRole !== "OWNER" ? (
          <Button
            variant="outline"
            type="button"
            disabled={Boolean(loadingUserId)}
            onClick={async () => {
              setError(null);
              setLoadingUserId(props.myUserId);

              try {
                const { response, data: responseData } = await sendJsonRequest<{ error?: string }>(`/api/tournaments/${props.tournamentId}/leave`, {
                  method: "POST",
                });

                if (!response.ok) {
                  setError(responseData.error ?? "No se pudo salir del torneo");
                  return;
                }

                pushAndRefresh(router, "/tournaments");
              } catch (leaveError) {
                setError(leaveError instanceof Error ? leaveError.message : "No se pudo salir del torneo");
              } finally {
                setLoadingUserId(null);
              }
            }}
          >
            {loadingUserId === props.myUserId ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          </Button>
        ) : null}
      </div>

      {rows.map((member) => {
        const memberChampionOption = member.champion
          ? championOptions.find((option) => option.name === member.champion) ?? { name: member.champion, logoUrl: null }
          : null;

        return (
          <div key={member.user.id} className="list-row-ui flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <UserAvatar name={member.user.name} email={member.user.email} image={member.user.image} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.user.name ?? member.user.email}</p>
                <p className="text-muted-ui truncate text-xs">{member.user.email}</p>
              </div>
            </div>

              <div className="min-w-0 flex-1">
                <p className="text-muted-ui text-xs">Campeón elegido</p>
                {memberChampionOption ? <ChampionOptionLabel option={memberChampionOption} /> : <Label>Sin definir</Label>}
              </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{member.role}</Badge>
              {canRemove(member) ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingUserId === member.user.id}
                  onClick={async () => {
                    setError(null);
                    setLoadingUserId(member.user.id);
                    const optimisticRows = rows.filter((row) => row.user.id !== member.user.id);
                    await mutate(optimisticRows, { revalidate: false });

                    try {
                      const { response, data: responseData } = await sendJsonRequest<{ error?: string }>(
                        `/api/tournaments/${props.tournamentId}/members/${member.user.id}`,
                        { method: "DELETE" },
                      );

                      if (!response.ok) {
                        await mutate();
                        setError(responseData.error ?? "No se pudo expulsar");
                      }
                    } catch (removeError) {
                      await mutate();
                      setError(removeError instanceof Error ? removeError.message : "No se pudo expulsar");
                    } finally {
                      setLoadingUserId(null);
                    }
                  }}
                >
                  {loadingUserId === member.user.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
