import { supabase } from "@/lib/supabase/client";

const IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type SignedUploadPayload = {
  path?: string;
  token?: string;
  publicUrl?: string;
  error?: string;
};

export function validateImageFile(file: File, kind: string) {
  if (!IMAGE_CONTENT_TYPES.includes(file.type as (typeof IMAGE_CONTENT_TYPES)[number])) {
    return `Formato no soportado. Usa JPG, PNG o WebP para ${kind}.`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `El ${kind} no debe exceder 5 MB.`;
  }

  return null;
}

export async function requestSignedUploadUrl(url: string, file: File) {
  const signedRes = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
  });

  const signedData = (await signedRes.json().catch(() => ({}))) as SignedUploadPayload;

  return {
    ok: signedRes.ok && Boolean(signedData.path && signedData.token && signedData.publicUrl),
    data: signedData,
  };
}

export async function uploadFileWithSignedUrl(bucket: string, file: File, path: string, token: string, publicUrl: string) {
  const upload = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file);

  if (upload.error) {
    return { ok: false as const, error: upload.error.message ?? "No se pudo subir el archivo." };
  }

  return {
    ok: true as const,
    publicUrl: `${publicUrl}?v=${Date.now()}`,
  };
}
