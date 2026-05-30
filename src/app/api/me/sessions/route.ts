import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = (session as unknown as { session?: { id?: string; token?: string } }).session ?? null;

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, token: true, ipAddress: true, userAgent: true, createdAt: true, updatedAt: true, expiresAt: true },
    take: 30,
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAtUtc: s.createdAt.toISOString(),
      updatedAtUtc: s.updatedAt.toISOString(),
      expiresAtUtc: s.expiresAt.toISOString(),
      isCurrent: (current?.id && s.id === current.id) || (current?.token && s.token === current.token) || false,
    })),
  });
}

