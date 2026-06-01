import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawParams = await ctx.params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

  const { id: tournamentId, userId } = parsed.data;
  if (userId === session.user.id) return NextResponse.json({ error: "Use leave endpoint" }, { status: 409 });

  const [actor, target] = await Promise.all([
    prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
      select: { role: true },
    }),
    prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
      select: { role: true },
    }),
  ]);

  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const actorCanManage = actor.role === "OWNER" || actor.role === "ORGANIZER";
  if (!actorCanManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (target.role === "OWNER") return NextResponse.json({ error: "Cannot remove owner" }, { status: 409 });
  if (actor.role === "ORGANIZER" && target.role !== "PLAYER") {
    return NextResponse.json({ error: "Organizer can only remove players" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.pick.deleteMany({
      where: { userId, match: { matchday: { tournamentId } } },
    }),
    prisma.standing.deleteMany({
      where: { tournamentId, userId },
    }),
    prisma.tournamentMember.delete({
      where: { tournamentId_userId: { tournamentId, userId } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

