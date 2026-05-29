import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.tournamentMember.findMany({
    where: { userId: session.user.id },
    select: { role: true, tournament: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json({
    tournaments: memberships.map((m) => ({
      tournamentId: m.tournament.id,
      name: m.tournament.name,
      role: m.role,
    })),
  });
}

