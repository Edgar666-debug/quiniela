import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  image: z.string().trim().url().max(500).nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(body.data.image !== undefined ? { image: body.data.image } : {}),
    },
    select: { name: true, image: true, email: true },
  });

  return NextResponse.json({ user: updated });
}

