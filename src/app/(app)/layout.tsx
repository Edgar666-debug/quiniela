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
  // Redirect through /api/auth/clear-session instead of directly to /sign-in.
  // This ensures the stale session cookie gets deleted before the user reaches
  // /sign-in, preventing the proxy's optimistic cookie check from looping them
  // back to /dashboard indefinitely (blank page).
  if (!session) redirect("/api/auth/clear-session");

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
