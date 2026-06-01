import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 404 });
  if (membership.role === "OWNER") return NextResponse.json({ error: "Owner cannot leave" }, { status: 409 });

  await prisma.$transaction([
    prisma.pick.deleteMany({
      where: { userId: session.user.id, match: { matchday: { tournamentId } } },
    }),
    prisma.standing.deleteMany({
      where: { tournamentId, userId: session.user.id },
    }),
    prisma.tournamentMember.delete({
      where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

