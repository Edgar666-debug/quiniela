import { KeyRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PasskeysClient } from "./passkeys-client";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";

export default function PasskeysPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <AppBreadcrumbs items={[{ label: "Mi cuenta", href: "/account" }, { label: "Passkeys" }]} />
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <KeyRound className="h-4 w-4" />
          <span className="text-sm">Seguridad</span>
        </div>
        <h1 className="text-2xl font-semibold">Passkeys</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Registra una passkey para iniciar sesión sin contraseña.
        </p>
      </div>

      <PasskeysClient />

      <div>
        <Button asChild variant="outline">
          <Link href="/account">Volver a mi cuenta</Link>
        </Button>
      </div>
    </main>
  );
}
