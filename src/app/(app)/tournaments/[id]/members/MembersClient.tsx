"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Trash2 } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { UserAvatar } from "@/components/app/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sendJsonRequest } from "@/lib/http";
import { pushAndRefresh } from "@/lib/navigation";

type MemberRow = {
  role: "OWNER" | "ORGANIZER" | "PLAYER";
  user: { id: string; email: string; name: string | null; image: string | null };
};

export function MembersClient(props: { tournamentId: string; myUserId: string; myRole: "OWNER" | "ORGANIZER" | "PLAYER"; initial: MemberRow[] }) {
  const router = useRouter();
  const [localRows, setLocalRows] = useState<{ source: MemberRow[]; value: MemberRow[] } | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = localRows?.source === props.initial ? localRows.value : props.initial;

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

              const { response, data } = await sendJsonRequest<{ error?: string }>(`/api/tournaments/${props.tournamentId}/leave`, {
                method: "POST",
              });

              setLoadingUserId(null);

              if (!response.ok) {
                setError(data.error ?? "No se pudo salir del torneo");
                return;
              }

              pushAndRefresh(router, "/tournaments");
            }}
          >
            {loadingUserId === props.myUserId ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          </Button>
        ) : null}
      </div>

      {rows.map((member) => (
        <div key={member.user.id} className="list-row-ui flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <UserAvatar name={member.user.name} email={member.user.email} image={member.user.image} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.user.name ?? member.user.email}</p>
              <p className="text-muted-ui truncate text-xs">{member.user.email}</p>
            </div>
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

                  const { response, data } = await sendJsonRequest<{ error?: string }>(
                    `/api/tournaments/${props.tournamentId}/members/${member.user.id}`,
                    { method: "DELETE" },
                  );

                  setLoadingUserId(null);

                  if (!response.ok) {
                    setError(data.error ?? "No se pudo expulsar");
                    return;
                  }

                  setLocalRows({
                    source: props.initial,
                    value: rows.filter((row) => row.user.id !== member.user.id),
                  });
                }}
              >
                {loadingUserId === member.user.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
