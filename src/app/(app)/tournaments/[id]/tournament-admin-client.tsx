"use client";

import { useReducer, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash, Trophy, Upload } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { InlineAlert } from "@/components/app/inline-alert";
import { ChampionOptionLabel } from "@/components/tournaments/champion-option-label";
import { TournamentLeaguePicker, type TournamentLeagueSelection, type TournamentScopeMode } from "@/components/tournaments/tournament-league-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendJsonRequest } from "@/lib/http";
import { uploadFileFromSignedUrlRequest, validateImageFile } from "@/lib/storage-upload";
import type { ChampionOption } from "@/lib/tournament-champion";
import { TournamentAdminStatusDialog, type TournamentStatusDialogKind } from "./tournament-admin-status-dialog";
import { TournamentAdminStatusMenu } from "./tournament-admin-status-menu";

type AdminState = {
  loading: boolean;
  openDialog: TournamentStatusDialogKind | null;
  savingDetails: boolean;
  uploadingLogo: boolean;
  draftName: string;
  draftLogoUrl: string;
  draftScope: TournamentScopeMode;
  draftLeagueSelection: TournamentLeagueSelection | null;
  draftChampion: string;
  message: string | null;
  error: string | null;
};

type AdminAction =
  | { type: "set_loading"; value: boolean }
  | { type: "set_dialog"; value: TournamentStatusDialogKind | null }
  | { type: "save_start" }
  | { type: "save_success"; name: string; logoUrl: string | null; message: string }
  | { type: "save_error"; error: string }
  | { type: "upload_start" }
  | { type: "upload_success"; logoUrl: string; message: string }
  | { type: "upload_error"; error: string }
  | { type: "set_name"; value: string }
  | { type: "set_logo_url"; value: string }
  | { type: "set_scope"; value: TournamentScopeMode }
  | { type: "set_league_selection"; value: TournamentLeagueSelection | null }
  | { type: "set_champion"; value: string }
  | { type: "clear_feedback" };

function tournamentAdminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case "set_loading":
      return { ...state, loading: action.value };
    case "set_dialog":
      return { ...state, openDialog: action.value };
    case "save_start":
      return { ...state, savingDetails: true, message: null, error: null };
    case "save_success":
      return {
        ...state,
        savingDetails: false,
        draftName: action.name,
        draftLogoUrl: action.logoUrl ?? "",
        message: action.message,
        error: null,
      };
    case "save_error":
      return { ...state, savingDetails: false, error: action.error };
    case "upload_start":
      return { ...state, uploadingLogo: true, message: null, error: null };
    case "upload_success":
      return { ...state, uploadingLogo: false, draftLogoUrl: action.logoUrl, message: action.message, error: null };
    case "upload_error":
      return { ...state, uploadingLogo: false, error: action.error };
    case "set_name":
      return { ...state, draftName: action.value };
    case "set_logo_url":
      return { ...state, draftLogoUrl: action.value };
    case "set_scope":
      return {
        ...state,
        draftScope: action.value,
        draftLeagueSelection: action.value === "OPEN" ? null : state.draftLeagueSelection,
        draftChampion: action.value === "OPEN" ? "" : state.draftChampion,
      };
    case "set_league_selection":
      return {
        ...state,
        draftLeagueSelection: action.value,
        draftLogoUrl: action.value?.logoUrl ?? state.draftLogoUrl,
        message: action.value?.logoUrl ? "Logo de la liga aplicado." : state.message,
      };
    case "set_champion":
      return { ...state, draftChampion: action.value };
    case "clear_feedback":
      return { ...state, message: null, error: null };
    default:
      return state;
  }
}

function createInitialState(props: {
  currentName: string;
  currentLogoUrl: string | null;
  currentScope: TournamentScopeMode;
  currentLeagueSelection: TournamentLeagueSelection | null;
  currentChampion: string | null;
}): AdminState {
  return {
    loading: false,
    openDialog: null,
    savingDetails: false,
    uploadingLogo: false,
    draftName: props.currentName,
    draftLogoUrl: props.currentLogoUrl ?? "",
    draftScope: props.currentScope,
    draftLeagueSelection: props.currentLeagueSelection,
    draftChampion: props.currentChampion ?? "",
    message: null,
    error: null,
  };
}

export function TournamentAdminClient(props: {
  tournamentId: string;
  status: string;
  currentName: string;
  currentLogoUrl: string | null;
  currentScope: TournamentScopeMode;
  currentLeagueSelection: TournamentLeagueSelection | null;
  currentChampion: string | null;
  championConfig: { options: ChampionOption[]; resolvedChampion: string | null } | null;
  scopeLocked: boolean;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(tournamentAdminReducer, props, createInitialState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isActive = props.status === "ACTIVE";
  const isFinished = props.status === "FINISHED";
  const isArchived = props.status === "ARCHIVED";
  const previewLogoUrl = state.draftLogoUrl.trim() || null;
  const actionsDisabled = state.savingDetails || state.uploadingLogo;
  const selectedOfficialChampion = props.championConfig?.options.find((option) => option.name === state.draftChampion) ?? null;

  async function saveDetails(nextLogoUrl?: string | null) {
    if (state.draftScope === "SINGLE_LEAGUE" && !state.draftLeagueSelection) {
      dispatch({ type: "save_error", error: "Selecciona una liga y temporada para el modo liga única." });
      return;
    }

    dispatch({ type: "save_start" });

    try {
      const { response, data } = await sendJsonRequest<{
        tournament?: { name: string; logoUrl: string | null };
        error?: string;
      }>(`/api/tournaments/${props.tournamentId}`, {
        method: "PATCH",
        body: {
          name: state.draftName.trim(),
          logoUrl: nextLogoUrl !== undefined ? nextLogoUrl : state.draftLogoUrl.trim() || state.draftLeagueSelection?.logoUrl || null,
          scope: state.draftScope,
          externalLeagueId: state.draftLeagueSelection?.externalLeagueId ?? null,
          leagueName: state.draftLeagueSelection?.leagueName ?? null,
          leagueSeason: state.draftLeagueSelection?.leagueSeason ?? null,
          champion: state.draftScope === "SINGLE_LEAGUE" ? state.draftChampion || null : null,
        },
      });

      if (!response.ok) {
        dispatch({ type: "save_error", error: data.error ?? "No se pudo actualizar el torneo." });
        return;
      }

      dispatch({
        type: "save_success",
        name: data.tournament?.name ?? state.draftName.trim(),
        logoUrl: data.tournament?.logoUrl ?? ((nextLogoUrl ?? state.draftLogoUrl.trim()) || null),
        message: "Torneo actualizado.",
      });
    } catch (saveError) {
      dispatch({
        type: "save_error",
        error: saveError instanceof Error ? saveError.message : "No se pudo actualizar el torneo.",
      });
    }
  }

  async function uploadLogo(file: File) {
    const fileError = validateImageFile(file, "logo");
    if (fileError) {
      dispatch({ type: "upload_error", error: fileError });
      return;
    }

    dispatch({ type: "upload_start" });

    const upload = await uploadFileFromSignedUrlRequest(`/api/tournaments/${props.tournamentId}/logo/upload-url`, "tournament-assets", file, {
      prepareError: "No se pudo preparar la carga del logo.",
      uploadError: "No se pudo subir el logo.",
    });

    if (!upload.ok) {
      dispatch({ type: "upload_error", error: upload.error ?? "No se pudo subir el logo." });
      return;
    }

    try {
      const { response, data } = await sendJsonRequest<{
        tournament?: { name: string; logoUrl: string | null };
        error?: string;
      }>(`/api/tournaments/${props.tournamentId}`, {
        method: "PATCH",
        body: { name: state.draftName.trim(), logoUrl: upload.publicUrl },
      });

      if (!response.ok) {
        dispatch({ type: "upload_error", error: data.error ?? "No se pudo guardar el logo." });
        return;
      }

      dispatch({ type: "upload_success", logoUrl: data.tournament?.logoUrl ?? upload.publicUrl, message: "Logo actualizado." });
    } catch (uploadError) {
      dispatch({
        type: "upload_error",
        error: uploadError instanceof Error ? uploadError.message : "No se pudo guardar el logo.",
      });
    }
  }

  async function updateStatus(nextStatus: "ACTIVE" | "ARCHIVED" | "FINISHED", fallbackError: string) {
    dispatch({ type: "set_dialog", value: null });
    dispatch({ type: "clear_feedback" });
    dispatch({ type: "set_loading", value: true });

    try {
      const { response, data } = await sendJsonRequest<{ error?: string }>(`/api/tournaments/${props.tournamentId}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });

      if (!response.ok) {
        dispatch({ type: "save_error", error: data.error ?? fallbackError });
        return;
      }

      router.refresh();
    } catch (statusError) {
      dispatch({
        type: "save_error",
        error: statusError instanceof Error ? statusError.message : fallbackError,
      });
    } finally {
      dispatch({ type: "set_loading", value: false });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!isActive ? <InlineAlert variant="info" message={`Estado actual: ${props.status}`} /> : null}
      <FeedbackAlerts message={state.message} error={state.error} />

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
            {previewLogoUrl ? <Image src={previewLogoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized /> : <Trophy className="size-6 text-zinc-500" />}
          </div>

          <div className="flex w-full items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Identidad del torneo</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Actualiza nombre y logo.</p>
            </div>
            <TournamentAdminStatusMenu
              busy={state.loading}
              isActive={isActive}
              isArchived={isArchived}
              isFinished={isFinished}
              onSelect={(kind) => dispatch({ type: "set_dialog", value: kind })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tournamentName">Nombre</Label>
            <Input id="tournamentName" value={state.draftName} onChange={(event) => dispatch({ type: "set_name", value: event.target.value })} maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tournamentLogo">Logo (URL)</Label>
            <Input id="tournamentLogo" value={state.draftLogoUrl} onChange={(event) => dispatch({ type: "set_logo_url", value: event.target.value })} placeholder="https://..." />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Seleccionar logo del torneo"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadLogo(file);
              event.currentTarget.value = "";
            }}
          />

          <Button type="button" variant="outline" disabled={actionsDisabled} onClick={() => fileInputRef.current?.click()}>
            {state.uploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Subir
          </Button>
          <Button type="button" variant="outline" disabled={actionsDisabled || !state.draftName.trim()} onClick={() => void saveDetails()}>
            {state.savingDetails ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={actionsDisabled || !state.draftLogoUrl.trim()}
            onClick={() => {
              dispatch({ type: "set_logo_url", value: "" });
              void saveDetails(null);
            }}
          >
            <Trash className="size-4" />
            Borrar
          </Button>
        </div>
      </div>

      <TournamentLeaguePicker
        scope={state.draftScope}
        onScopeChange={(value) => dispatch({ type: "set_scope", value })}
        selection={state.draftLeagueSelection}
        onSelectionChange={(value) => dispatch({ type: "set_league_selection", value })}
        disabled={actionsDisabled}
        locked={props.scopeLocked}
      />

      {state.draftScope === "SINGLE_LEAGUE" ? (
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3">
            <p className="text-sm font-medium">Campeón oficial</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Fallback manual si no se puede inferir automáticamente.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="officialChampion">Equipo</Label>
            <Select value={state.draftChampion || "__none__"} onValueChange={(value) => dispatch({ type: "set_champion", value: value === "__none__" ? "" : value })} disabled={actionsDisabled}>
              <SelectTrigger id="officialChampion">
                {selectedOfficialChampion ? <ChampionOptionLabel option={selectedOfficialChampion} /> : <SelectValue placeholder="Sin definir" />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin definir</SelectItem>
                {(props.championConfig?.options ?? []).map((option) => (
                  <SelectItem key={option.name} value={option.name}>
                    <ChampionOptionLabel option={option} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {props.championConfig?.resolvedChampion ? <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">Resuelto actualmente: {props.championConfig.resolvedChampion}</p> : null}
        </div>
      ) : null}

      <TournamentAdminStatusDialog kind="archive" open={state.openDialog === "archive"} onOpenChange={(open) => dispatch({ type: "set_dialog", value: open ? "archive" : null })} onConfirm={() => void updateStatus("ARCHIVED", "No se pudo archivar el torneo")} />
      <TournamentAdminStatusDialog kind="reactivate" open={state.openDialog === "reactivate"} onOpenChange={(open) => dispatch({ type: "set_dialog", value: open ? "reactivate" : null })} onConfirm={() => void updateStatus("ACTIVE", "No se pudo reactivar el torneo")} />
      <TournamentAdminStatusDialog kind="finish" open={state.openDialog === "finish"} onOpenChange={(open) => dispatch({ type: "set_dialog", value: open ? "finish" : null })} onConfirm={() => void updateStatus("FINISHED", "No se pudo finalizar el torneo")} />

      {isFinished ? <InlineAlert variant="info" message="El torneo está finalizado. El estado ya no se puede cambiar." /> : null}
      {isArchived ? <InlineAlert variant="info" message="El torneo está archivado. Puedes reactivarlo." /> : null}
    </div>
  );
}
