import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = {
  title: "App",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const memberships = await prisma.tournamentMember.findMany({
    where: { userId: session.user.id },
    select: { role: true, tournament: { select: { id: true, name: true, logoUrl: true, status: true } } },
    orderBy: { joinedAt: "desc" },
  });

  const tournaments = memberships.map((m) => ({
    id: m.tournament.id,
    name: m.tournament.name,
    logoUrl: m.tournament.logoUrl,
    status: m.tournament.status,
    role: m.role,
  }));

  return (
    <AppShell user={{ email: session.user.email, name: session.user.name ?? null }} tournaments={tournaments}>
      {children}
    </AppShell>
  );
}
