"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import useSWR from "swr";

import { EmptyState } from "@/components/app/empty-state";
import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { passkeyDateFormatter } from "@/lib/format";

type PasskeyItem = {
  id: string;
  name: string | null;
  createdAt: Date;
};

export function PasskeysListClient({ passkeys: initialPasskeys }: { passkeys: PasskeyItem[] }) {
  const router = useRouter();
  const { data, mutate } = useSWR("account-passkeys", async () => initialPasskeys, {
    fallbackData: initialPasskeys,
    revalidateOnFocus: false,
  });
  const passkeys = data ?? initialPasskeys;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    const optimisticPasskeys = passkeys.filter((passkey) => passkey.id !== id);
    await mutate(optimisticPasskeys, { revalidate: false });

    const { error: deleteError } = await authClient.passkey.deletePasskey({ id });

    if (deleteError) {
      await mutate();
      setError(deleteError.message ?? "No se pudo eliminar la passkey.");
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    router.refresh();
  }

  if (passkeys.length === 0) {
    return <EmptyState compact description="No hay passkeys registradas." />;
  }

  return (
    <div className="flex flex-col gap-2">
      <FeedbackAlerts error={error} />
      <ul className="flex flex-col gap-2">
        {passkeys.map((passkey) => (
          <li key={passkey.id} className="list-row-ui flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{passkey.name ?? "Passkey"}</p>
              <p className="text-subtle-ui text-xs">Creada: {passkeyDateFormatter.format(passkey.createdAt)}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="icon-muted-ui shrink-0 hover:text-red-500 dark:hover:text-red-400"
              disabled={deletingId === passkey.id}
              onClick={() => void handleDelete(passkey.id)}
              aria-label={`Eliminar passkey ${passkey.name ?? ""}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
