import { env } from "@/lib/env";

export const AVATARS_BUCKET = "avatars";
export const TOURNAMENT_LOGOS_BUCKET = "tournament-assets";

function getPublicBucketUrl(bucket: string, path: string) {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function getAvatarObjectPath(userId: string) {
  return `users/${userId}/avatar`;
}

export function getAvatarPublicUrl(path: string) {
  return getPublicBucketUrl(AVATARS_BUCKET, path);
}

export function getTournamentLogoObjectPath(tournamentId: string) {
  return `tournaments/${tournamentId}/logo`;
}

export function getTournamentLogoPublicUrl(path: string) {
  return getPublicBucketUrl(TOURNAMENT_LOGOS_BUCKET, path);
}

function getManagedBucketObjectPath(imageUrl: string | null | undefined, bucket: string) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const projectOrigin = new URL(env.NEXT_PUBLIC_SUPABASE_URL).origin;
    const prefix = `/storage/v1/object/public/${bucket}/`;

    if (url.origin !== projectOrigin || !url.pathname.startsWith(prefix)) return null;

    return decodeURIComponent(url.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export function getManagedAvatarObjectPath(imageUrl: string | null | undefined) {
  return getManagedBucketObjectPath(imageUrl, AVATARS_BUCKET);
}

export function getManagedTournamentLogoObjectPath(imageUrl: string | null | undefined) {
  return getManagedBucketObjectPath(imageUrl, TOURNAMENT_LOGOS_BUCKET);
}
