import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ token: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await ctx.params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      maxUses: true,
      uses: true,
      expiresAt: true,
      tournament: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          status: true,
        },
      },
    },
  });

  if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });

  const isExpired = Boolean(invite.expiresAt && invite.expiresAt.getTime() < Date.now());

  return NextResponse.json({
    invite: {
      maxUses: invite.maxUses,
      uses: invite.uses,
      expiresAtUtc: invite.expiresAt ? invite.expiresAt.toISOString() : null,
      isExpired,
      tournament: invite.tournament,
    },
  });
}
