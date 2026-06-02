import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { passkeyDateFormatter } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActiveSessionsClient, type SessionItem } from "./ActiveSessionsClient";
import { CredentialsClient } from "./CredentialsClient";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Mi cuenta",
};

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const current = (session as unknown as { session?: { id?: string; token?: string } }).session ?? null;

  const [passkeys, sessions] = await Promise.all([
    prisma.passkey.findMany({
      where: { userId: session.user.id },
      orderBy: [{ createdAt: "desc" }],
      select: { id: true, name: true, createdAt: true },
      take: 20,
    }),
    prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: [{ updatedAt: "desc" }],
      select: { id: true, token: true, ipAddress: true, userAgent: true, createdAt: true, updatedAt: true, expiresAt: true },
      take: 30,
    }),
  ]);

  const initialSessions: SessionItem[] = sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
    createdAtUtc: s.createdAt.toISOString(),
    updatedAtUtc: s.updatedAt.toISOString(),
    expiresAtUtc: s.expiresAt.toISOString(),
    isCurrent: (current?.id && s.id === current.id) || (current?.token && s.token === current.token) || false,
  }));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{session.user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Actualiza tu nombre y avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileClient initial={{ name: session.user.name ?? null, image: session.user.image ?? null, email: session.user.email }} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Email y contraseña</CardTitle>
            <CardDescription>Actualiza tu email o cambia tu contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            <CredentialsClient currentEmail={session.user.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Passkeys</CardTitle>
            <CardDescription>Gestiona tus passkeys para autenticación segura y sin contraseña</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link href="/account/passkeys">
                <Shield className="size-4" />
                Añadir Passkey
              </Link>
            </Button>

            <div className="space-y-2">
              <p className="text-sm font-medium">Passkeys registradas</p>
              {passkeys.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No hay passkeys registradas</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {passkeys.slice(0, 5).map((p) => (
                    <li key={p.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <p className="text-sm font-medium">{p.name ?? "Passkey"}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Creado:{" "}
                        {passkeyDateFormatter.format(p.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sesiones activas</CardTitle>
            <CardDescription>Gestiona tus sesiones activas en diferentes dispositivos y navegadores</CardDescription>
          </CardHeader>
          <CardContent>
            <ActiveSessionsClient initial={initialSessions} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
