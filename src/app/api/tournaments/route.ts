import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(80),
  logoUrl: z.string().trim().url().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const tournament = await prisma.tournament.create({
    data: {
      name: body.data.name,
      logoUrl: body.data.logoUrl ?? null,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
      standings: {
        create: { userId: session.user.id, points: 0 },
      },
    },
    select: { id: true, name: true, logoUrl: true },
  });

  return NextResponse.json({ tournament });
}
