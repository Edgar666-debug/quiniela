import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AVATARS_BUCKET, getManagedAvatarObjectPath } from "@/lib/supabase/storage";

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

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const nextImage = body.data.image !== undefined ? body.data.image : currentUser.image;
  const previousManagedPath = getManagedAvatarObjectPath(currentUser.image);
  const nextManagedPath = getManagedAvatarObjectPath(nextImage);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(body.data.image !== undefined ? { image: body.data.image } : {}),
    },
    select: { name: true, image: true, email: true },
  });

  if (previousManagedPath && previousManagedPath !== nextManagedPath) {
    await supabaseAdmin.storage.from(AVATARS_BUCKET).remove([previousManagedPath]).catch(() => {});
  }

  return NextResponse.json({ user: updated });
}
