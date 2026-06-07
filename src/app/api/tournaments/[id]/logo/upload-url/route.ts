import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTournamentLogoObjectPath, getTournamentLogoPublicUrl, TOURNAMENT_LOGOS_BUCKET } from "@/lib/supabase/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSize: z.number().int().min(1).max(5 * 1024 * 1024),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tournamentId } = await ctx.params;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const membership = await prisma.tournamentMember.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const path = getTournamentLogoObjectPath(tournamentId);
  const { data, error } = await supabaseAdmin.storage.from(TOURNAMENT_LOGOS_BUCKET).createSignedUploadUrl(path, {
    upsert: true,
  });

  if (error || !data?.token) {
    return NextResponse.json({ error: "No se pudo preparar la carga del logo." }, { status: 500 });
  }

  return NextResponse.json({
    path,
    token: data.token,
    publicUrl: getTournamentLogoPublicUrl(path),
  });
}
