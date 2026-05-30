import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const found = await prisma.session.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

