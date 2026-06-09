"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle, Trash, Trophy, Upload} from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

export function NewTournamentClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedPreviewUrlRef = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (uploadedPreviewUrlRef.current) {
        URL.revokeObjectURL(uploadedPreviewUrlRef.current);
      }
    };
  }, []);

  const previewLogoUrl = uploadedPreviewUrl ?? (logoUrl.trim() || null);

  async function createTournament() {
    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        logoUrl: logoFile ? null : (logoUrl.trim() || null),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      tournament?: { id: string; name: string; logoUrl: string | null };
      error?: string;
    };

    if (!res.ok || !data.tournament?.id) {
      setLoading(false);
      setError(data.error ?? "No se pudo crear el torneo.");
      return;
    }

    if (!logoFile) {
      setLoading(false);
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

    const signedRes = await fetch(`/api/tournaments/${data.tournament.id}/logo/upload-url`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: logoFile.type, fileSize: logoFile.size }),
    });
    const signedData = (await signedRes.json().catch(() => ({}))) as {
      path?: string;
      token?: string;
      publicUrl?: string;
      error?: string;
    };

    if (!signedRes.ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
      setLoading(false);
      setError("El torneo se creó, pero no se pudo preparar la carga del logo. Puedes intentarlo otra vez desde administración.");
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

    const upload = await supabase.storage.from("tournament-assets").uploadToSignedUrl(signedData.path, signedData.token, logoFile);
    if (upload.error) {
      setLoading(false);
      setError("El torneo se creó, pero no se pudo subir el logo. Puedes intentarlo otra vez desde administración.");
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

    const publicUrl = `${signedData.publicUrl}?v=${Date.now()}`;
    const patchRes = await fetch(`/api/tournaments/${data.tournament.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), logoUrl: publicUrl }),
    });

    if (!patchRes.ok) {
      setLoading(false);
      setError("El torneo se creó, pero no se pudo guardar el logo. Puedes intentarlo otra vez desde administración.");
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

    setLoading(false);
    router.push(`/tournaments/${data.tournament.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5" />
          Datos del torneo
        </CardTitle>
        <CardDescription>El nombre y el logo los puedes cambiar después si hace falta.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {message ? <InlineAlert variant="success" message={message} /> : null}
        {error ? <InlineAlert variant="error" message={error} /> : null}

        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
            {previewLogoUrl ? (
              <Image src={previewLogoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
            ) : (
              <Trophy className="size-6 text-zinc-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Identidad inicial</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Puedes pegar una URL o subir un JPG, PNG o WebP de hasta 5 MB.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tournamentName">Nombre</Label>
            <Input
              id="tournamentName"
              placeholder="Liga MX • Clausura • Jornada 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tournamentLogo">Logo (URL)</Label>
            <Input
              id="tournamentLogo"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => {
                if (uploadedPreviewUrlRef.current) {
                  URL.revokeObjectURL(uploadedPreviewUrlRef.current);
                  uploadedPreviewUrlRef.current = null;
                }
                setLogoUrl(e.target.value);
                if (logoFile) setLogoFile(null);
                setUploadedPreviewUrl(null);
              }}
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
              const file = event.target.files?.[0] ?? null;
              event.currentTarget.value = "";

              if (!file) return;
              if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                setError("Formato no soportado. Usa JPG, PNG o WebP.");
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setError("El logo no debe exceder 5 MB.");
                return;
              }

              if (uploadedPreviewUrlRef.current) {
                URL.revokeObjectURL(uploadedPreviewUrlRef.current);
              }

              const nextPreviewUrl = URL.createObjectURL(file);
              uploadedPreviewUrlRef.current = nextPreviewUrl;
              setError(null);
              setLogoUrl("");
              setLogoFile(file);
              setUploadedPreviewUrl(nextPreviewUrl);
              setMessage(`Logo listo: ${file.name}`);
            }}
          />

          <Button type="button" variant="outline" disabled={loading} onClick={() => fileInputRef.current?.click()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Subir
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading || (!logoFile && !logoUrl.trim())}
            onClick={() => {
              if (uploadedPreviewUrlRef.current) {
                URL.revokeObjectURL(uploadedPreviewUrlRef.current);
                uploadedPreviewUrlRef.current = null;
              }
              setLogoFile(null);
              setUploadedPreviewUrl(null);
              setLogoUrl("");
              setMessage(null);
              setError(null);
            }}
          >
            <Trash className="size-4" />
            Borrar
          </Button>

          <Button disabled={loading || !name.trim()} type="button" onClick={() => void createTournament()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
            Crear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
