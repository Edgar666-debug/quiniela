import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { KeyRound, LogOut, Shield } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <AppBreadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Mi cuenta" }]} />
      <Card>
        <CardHeader>
          <CardTitle>Mi cuenta</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Administra seguridad y acceso. Próximamente: perfil y ajustes.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/account/passkeys">
                <Shield className="h-4 w-4" />
                Passkeys
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <KeyRound className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <form
              action={async () => {
                "use server";
                await auth.api.signOut({ headers: await headers() });
                redirect("/");
              }}
            >
              <Button type="submit" variant="outline">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
