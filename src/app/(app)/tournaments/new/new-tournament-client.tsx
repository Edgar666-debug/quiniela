"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SaveIcon, Trash, Trophy, Upload } from "lucide-react";

import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type TournamentState = {
  name: string;
  logoUrl: string;
  logoFile: File | null;
  loading: boolean;
  error: string | null;
  message: string | null;
  uploadedPreviewUrl: string | null;
};

type TournamentAction =
  | { type: "set_name"; value: string }
  | { type: "set_logo_url"; value: string }
  | { type: "set_logo_file"; file: File | null; previewUrl: string | null; message: string | null }
  | { type: "clear_logo" }
  | { type: "submit_start" }
  | { type: "submit_fail"; error: string };

function newTournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case "set_name":
      return { ...state, name: action.value };
    case "set_logo_url":
      return { ...state, logoUrl: action.value, logoFile: null, uploadedPreviewUrl: null };
    case "set_logo_file":
      return {
        ...state,
        error: null,
        logoUrl: "",
        logoFile: action.file,
        uploadedPreviewUrl: action.previewUrl,
        message: action.message,
      };
    case "clear_logo":
      return { ...state, logoUrl: "", logoFile: null, uploadedPreviewUrl: null, message: null, error: null };
    case "submit_start":
      return { ...state, loading: true, error: null, message: null };
    case "submit_fail":
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

export function NewTournamentClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedPreviewUrlRef = useRef<string | null>(null);
  const [state, dispatch] = useReducer(newTournamentReducer, {
    name: "",
    logoUrl: "",
    logoFile: null,
    loading: false,
    error: null,
    message: null,
    uploadedPreviewUrl: null,
  });

  useEffect(() => {
    const previewUrl = uploadedPreviewUrlRef.current;
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const previewLogoUrl = state.uploadedPreviewUrl ?? (state.logoUrl.trim() || null);

  async function createTournament() {
    dispatch({ type: "submit_start" });

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: state.name.trim(),
        logoUrl: state.logoFile ? null : (state.logoUrl.trim() || null),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      tournament?: { id: string; name: string; logoUrl: string | null };
      error?: string;
    };

    if (!res.ok || !data.tournament?.id) {
      return dispatch({ type: "submit_fail", error: data.error ?? "No se pudo crear el torneo." });
    }

    if (!state.logoFile) {
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

    const signedRes = await fetch(`/api/tournaments/${data.tournament.id}/logo/upload-url`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: state.logoFile.type, fileSize: state.logoFile.size }),
    });
    const signedData = (await signedRes.json().catch(() => ({}))) as {
      path?: string;
      token?: string;
      publicUrl?: string;
      error?: string;
    };

    if (!signedRes.ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
      dispatch({ type: "submit_fail", error: "El torneo se creó, pero no se pudo preparar la carga del logo. Puedes intentarlo otra vez desde administración." });
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

    const upload = await supabase.storage.from("tournament-assets").uploadToSignedUrl(signedData.path, signedData.token, state.logoFile);
    if (upload.error) {
      dispatch({ type: "submit_fail", error: "El torneo se creó, pero no se pudo subir el logo. Puedes intentarlo otra vez desde administración." });
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

    const publicUrl = `${signedData.publicUrl}?v=${Date.now()}`;
    const patchRes = await fetch(`/api/tournaments/${data.tournament.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: state.name.trim(), logoUrl: publicUrl }),
    });

    if (!patchRes.ok) {
      dispatch({ type: "submit_fail", error: "El torneo se creó, pero no se pudo guardar el logo. Puedes intentarlo otra vez desde administración." });
      router.push(`/tournaments/${data.tournament.id}`);
      router.refresh();
      return;
    }

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
        {state.message ? <InlineAlert variant="success" message={state.message} /> : null}
        {state.error ? <InlineAlert variant="error" message={state.error} /> : null}

        <div className="flex items-center gap-3">
          <div className="tournament-logo-frame size-14">
            {previewLogoUrl ? (
              <Image src={previewLogoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
            ) : (
              <Trophy className="size-6 text-zinc-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Identidad inicial</p>
            <p className="text-muted-ui text-xs">Puedes pegar una URL o subir un JPG, PNG o WebP de hasta 5 MB.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tournamentName">Nombre</Label>
            <Input
              id="tournamentName"
              placeholder="Liga MX • Clausura • Jornada 1"
              value={state.name}
              onChange={(event) => dispatch({ type: "set_name", value: event.target.value })}
              maxLength={80}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tournamentLogo">Logo (URL)</Label>
            <Input
              id="tournamentLogo"
              placeholder="https://..."
              value={state.logoUrl}
              onChange={(event) => {
                if (uploadedPreviewUrlRef.current) {
                  URL.revokeObjectURL(uploadedPreviewUrlRef.current);
                  uploadedPreviewUrlRef.current = null;
                }
                dispatch({ type: "set_logo_url", value: event.target.value });
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Seleccionar logo del torneo"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.currentTarget.value = "";

              if (!file) return;
              if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                dispatch({ type: "submit_fail", error: "Formato no soportado. Usa JPG, PNG o WebP." });
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                dispatch({ type: "submit_fail", error: "El logo no debe exceder 5 MB." });
                return;
              }

              if (uploadedPreviewUrlRef.current) {
                URL.revokeObjectURL(uploadedPreviewUrlRef.current);
              }

              const nextPreviewUrl = URL.createObjectURL(file);
              uploadedPreviewUrlRef.current = nextPreviewUrl;
              dispatch({ type: "set_logo_file", file, previewUrl: nextPreviewUrl, message: `Logo listo: ${file.name}` });
            }}
          />

          <Button type="button" variant="outline" disabled={state.loading} onClick={() => fileInputRef.current?.click()}>
            {state.loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Subir
          </Button>

          <Button type="button" variant="outline" disabled={state.loading || !state.name.trim()} onClick={() => void createTournament()}>
            {state.loading ? <Loader2 className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
            Guardar
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={state.loading || (!state.logoFile && !state.logoUrl.trim())}
            onClick={() => {
              if (uploadedPreviewUrlRef.current) {
                URL.revokeObjectURL(uploadedPreviewUrlRef.current);
                uploadedPreviewUrlRef.current = null;
              }
              dispatch({ type: "clear_logo" });
            }}
          >
            <Trash className="size-4" />
            Borrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
