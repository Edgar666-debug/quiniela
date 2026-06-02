"use client";

import { useMemo, useState } from "react";
import { Image as ImageIcon, Loader2, Save, User as UserIcon, X } from "lucide-react";

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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imageUrl = useMemo(() => (image.trim() ? image.trim() : null), [image]);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-5 w-5 text-zinc-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name.trim() || "Sin nombre"}</p>
          <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{props.initial.email}</p>
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
        <Button type="button" onClick={save} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || !image.trim()}
          onClick={() =>
            setDraft({
              sourceName: props.initial.name,
              sourceImage: props.initial.image,
              name,
              image: "",
            })
          }
        >
          <X className="h-4 w-4" />
          Quitar avatar
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          <ImageIcon className="h-4 w-4" />
          URL pública
        </div>
      </div>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
