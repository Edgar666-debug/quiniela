import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["ACTIVE", "FINISHED", "ARCHIVED"]).optional(),
  name: z.string().min(1).max(80).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  if (!body.data.status && !body.data.name) return NextResponse.json({ error: "No changes" }, { status: 400 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const current = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (current.status === "FINISHED" && body.data.status) {
    return NextResponse.json({ error: "Tournament is finished and cannot change status" }, { status: 409 });
  }

  if (body.data.status === "FINISHED" && current.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only ACTIVE tournaments can be finished" }, { status: 409 });
  }

  if (body.data.status === "ARCHIVED" && current.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only ACTIVE tournaments can be archived" }, { status: 409 });
  }

  const tournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: body.data.status,
      name: body.data.name,
    },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json({ tournament });
}
