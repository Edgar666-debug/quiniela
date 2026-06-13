"use client";

import Image from "next/image";
import { useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SaveIcon, Trash, Trophy, Upload } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { TournamentLeaguePicker, type TournamentLeagueSelection, type TournamentScopeMode } from "@/components/tournaments/tournament-league-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendJsonRequest } from "@/lib/http";
import { pushAndRefresh } from "@/lib/navigation";
import { requestSignedUploadUrl, uploadFileWithSignedUrl, validateImageFile } from "@/lib/storage-upload";

type TournamentState = {
  name: string;
  logoUrl: string;
  logoFile: File | null;
  scope: TournamentScopeMode;
  leagueSelection: TournamentLeagueSelection | null;
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
  | { type: "set_scope"; value: TournamentScopeMode }
  | { type: "set_league_selection"; value: TournamentLeagueSelection | null }
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
    case "set_scope":
      return { ...state, scope: action.value, leagueSelection: action.value === "OPEN" ? null : state.leagueSelection };
    case "set_league_selection":
      return {
        ...state,
        leagueSelection: action.value,
        logoUrl:
          action.value?.logoUrl && !state.logoFile
            ? action.value.logoUrl
            : state.logoUrl,
        message: action.value?.logoUrl ? "Logo de la liga aplicado." : state.message,
      };
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
    scope: "OPEN",
    leagueSelection: null,
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

  function goToTournament(tournamentId: string) {
    pushAndRefresh(router, `/tournaments/${tournamentId}`);
  }

  async function createTournament() {
    if (state.scope === "SINGLE_LEAGUE" && !state.leagueSelection) {
      dispatch({ type: "submit_fail", error: "Selecciona una liga y temporada para el modo liga única." });
      return;
    }

    dispatch({ type: "submit_start" });

    const { response: res, data } = await sendJsonRequest<{
      tournament?: { id: string; name: string; logoUrl: string | null };
      error?: string;
    }>("/api/tournaments", {
      method: "POST",
      body: {
        name: state.name.trim(),
        logoUrl: state.logoFile ? null : (state.logoUrl.trim() || state.leagueSelection?.logoUrl || null),
        scope: state.scope,
        externalLeagueId: state.leagueSelection?.externalLeagueId ?? null,
        leagueName: state.leagueSelection?.leagueName ?? null,
        leagueSeason: state.leagueSelection?.leagueSeason ?? null,
      },
    });

    if (!res.ok || !data.tournament?.id) {
      return dispatch({ type: "submit_fail", error: data.error ?? "No se pudo crear el torneo." });
    }

    if (!state.logoFile) {
      goToTournament(data.tournament.id);
      return;
    }

    const { ok, data: signedData } = await requestSignedUploadUrl(`/api/tournaments/${data.tournament.id}/logo/upload-url`, state.logoFile);
    if (!ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
      dispatch({ type: "submit_fail", error: "El torneo se creó, pero no se pudo preparar la carga del logo. Puedes intentarlo otra vez desde administración." });
      goToTournament(data.tournament.id);
      return;
    }

    const upload = await uploadFileWithSignedUrl("tournament-assets", state.logoFile, signedData.path, signedData.token, signedData.publicUrl);
    if (!upload.ok) {
      dispatch({ type: "submit_fail", error: "El torneo se creó, pero no se pudo subir el logo. Puedes intentarlo otra vez desde administración." });
      goToTournament(data.tournament.id);
      return;
    }

    const { response: patchRes } = await sendJsonRequest(`/api/tournaments/${data.tournament.id}`, {
      method: "PATCH",
      body: { name: state.name.trim(), logoUrl: upload.publicUrl },
    });

    if (!patchRes.ok) {
      dispatch({ type: "submit_fail", error: "El torneo se creó, pero no se pudo guardar el logo. Puedes intentarlo otra vez desde administración." });
      goToTournament(data.tournament.id);
      return;
    }

    goToTournament(data.tournament.id);
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
        <FeedbackAlerts message={state.message} error={state.error} />

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

        <TournamentLeaguePicker
          scope={state.scope}
          onScopeChange={(value) => dispatch({ type: "set_scope", value })}
          selection={state.leagueSelection}
          onSelectionChange={(value) => dispatch({ type: "set_league_selection", value })}
          disabled={state.loading}
        />

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

              const fileError = validateImageFile(file, "logo");
              if (fileError) {
                dispatch({ type: "submit_fail", error: fileError });
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
