"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Image as ImageIcon, Loader2, User as UserIcon, Upload, Trash, SaveIcon } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileClient(props: { initial: { name: string | null; image: string | null; email: string } }) {
  const [draft, setDraft] = useState<{
    sourceName: string | null;
    sourceImage: string | null;
    name: string;
    image: string;
  } | null>(null);

  const activeDraft =
    draft?.sourceName === props.initial.name && draft?.sourceImage === props.initial.image ? draft : null;
  const name = activeDraft?.name ?? props.initial.name ?? "";
  const image = activeDraft?.image ?? props.initial.image ?? "";

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imageUrl = image.trim() ? image.trim() : null;

  async function save() {
    setMessage(null);
    setError(null);
    setLoading(true);
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim() ? name.trim() : undefined,
        image: image.trim() ? image.trim() : null,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { user?: { name: string | null; image: string | null }; error?: string };
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "No se pudo guardar el perfil.");
    setMessage("Perfil actualizado.");
    setDraft({
      sourceName: props.initial.name,
      sourceImage: props.initial.image,
      name: data.user?.name ?? "",
      image: data.user?.image ?? "",
    });
  }

  async function uploadAvatar(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("El avatar no debe exceder 5 MB.");
      return;
    }

    setMessage(null);
    setError(null);
    setUploadingAvatar(true);

    const signedRes = await fetch("/api/me/avatar/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
    });
    const signedData = (await signedRes.json().catch(() => ({}))) as {
      path?: string;
      token?: string;
      publicUrl?: string;
      error?: string;
    };

    if (!signedRes.ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
      setUploadingAvatar(false);
      setError(signedData.error ?? "No se pudo preparar la carga del avatar.");
      return;
    }

    const upload = await supabase.storage.from("avatars").uploadToSignedUrl(signedData.path, signedData.token, file);
    if (upload.error) {
      setUploadingAvatar(false);
      setError(upload.error.message ?? "No se pudo subir el avatar.");
      return;
    }

    const imageUrlWithVersion = `${signedData.publicUrl}?v=${Date.now()}`;
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: imageUrlWithVersion }),
    });
    const data = (await res.json().catch(() => ({}))) as { user?: { name: string | null; image: string | null }; error?: string };
    setUploadingAvatar(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar el avatar.");
      return;
    }

    setDraft({
      sourceName: props.initial.name,
      sourceImage: props.initial.image,
      name,
      image: data.user?.image ?? imageUrlWithVersion,
    });
    setMessage("Avatar actualizado.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="avatar-frame-ui size-12">
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={48} height={48} className="h-full w-full object-cover" unoptimized />
          ) : (
            <UserIcon className="icon-muted-ui size-5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name.trim() || "Sin nombre"}</p>
          <p className="text-muted-ui truncate text-xs">{props.initial.email}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="profileName">Nombre</Label>
          <Input
            id="profileName"
            value={name}
            onChange={(e) =>
              setDraft({
                sourceName: props.initial.name,
                sourceImage: props.initial.image,
                name: e.target.value,
                image,
              })
            }
            placeholder="Tu nombre"
            maxLength={80}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profileImage">Avatar (URL)</Label>
          <Input
            id="profileImage"
            value={image}
            onChange={(e) =>
              setDraft({
                sourceName: props.initial.name,
                sourceImage: props.initial.image,
                name,
                image: e.target.value,
              })
            }
            placeholder="https://..."
            inputMode="url"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadAvatar(file);
            event.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={loading || uploadingAvatar}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingAvatar ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Subir
        </Button>
        <Button type="button" variant="outline" onClick={save} disabled={loading || uploadingAvatar}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
          Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || uploadingAvatar || !image.trim()}
          onClick={() =>
            setDraft({
              sourceName: props.initial.name,
              sourceImage: props.initial.image,
              name,
              image: "",
            })
          }
        >
          <Trash className="size-4" /> Quitar
        </Button>
        <div className="icon-muted-ui ml-auto flex items-center gap-2 text-xs">
          <ImageIcon className="size-4" />
          Storage o URL pública
        </div>
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
