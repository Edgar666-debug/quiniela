"use client";

import { useReducer, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash, Trophy, Upload } from "lucide-react";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { InlineAlert } from "@/components/app/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendJsonRequest } from "@/lib/http";
import { requestSignedUploadUrl, uploadFileWithSignedUrl, validateImageFile } from "@/lib/storage-upload";
import { TournamentAdminStatusDialog, type TournamentStatusDialogKind } from "./tournament-admin-status-dialog";
import { TournamentAdminStatusMenu } from "./tournament-admin-status-menu";

type AdminState = {
  loading: boolean;
  openDialog: TournamentStatusDialogKind | null;
  savingDetails: boolean;
  uploadingLogo: boolean;
  draftName: string;
  draftLogoUrl: string;
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
    case "clear_feedback":
      return { ...state, message: null, error: null };
    default:
      return state;
  }
}

function createInitialState(props: { currentName: string; currentLogoUrl: string | null }): AdminState {
  return {
    loading: false,
    openDialog: null,
    savingDetails: false,
    uploadingLogo: false,
    draftName: props.currentName,
    draftLogoUrl: props.currentLogoUrl ?? "",
    message: null,
    error: null,
  };
}

export function TournamentAdminClient(props: {
  tournamentId: string;
  status: string;
  currentName: string;
  currentLogoUrl: string | null;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(tournamentAdminReducer, props, createInitialState);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isActive = props.status === "ACTIVE";
  const isFinished = props.status === "FINISHED";
  const isArchived = props.status === "ARCHIVED";
  const previewLogoUrl = state.draftLogoUrl.trim() || null;
  const actionsDisabled = state.savingDetails || state.uploadingLogo;

  async function saveDetails(nextLogoUrl?: string | null) {
    dispatch({ type: "save_start" });

    const { response, data } = await sendJsonRequest<{
      tournament?: { name: string; logoUrl: string | null };
      error?: string;
    }>(`/api/tournaments/${props.tournamentId}`, {
      method: "PATCH",
      body: {
        name: state.draftName.trim(),
        logoUrl: nextLogoUrl !== undefined ? nextLogoUrl : state.draftLogoUrl.trim() || null,
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
  }

  async function uploadLogo(file: File) {
    const fileError = validateImageFile(file, "logo");
    if (fileError) {
      dispatch({ type: "upload_error", error: fileError });
      return;
    }

    dispatch({ type: "upload_start" });

    const { ok, data: signedData } = await requestSignedUploadUrl(`/api/tournaments/${props.tournamentId}/logo/upload-url`, file);

    if (!ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
      dispatch({ type: "upload_error", error: signedData.error ?? "No se pudo preparar la carga del logo." });
      return;
    }

    const upload = await uploadFileWithSignedUrl("tournament-assets", file, signedData.path, signedData.token, signedData.publicUrl);
    if (!upload.ok) {
      dispatch({ type: "upload_error", error: upload.error ?? "No se pudo subir el logo." });
      return;
    }

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
  }

  async function updateStatus(nextStatus: "ACTIVE" | "ARCHIVED" | "FINISHED", fallbackError: string) {
    dispatch({ type: "set_dialog", value: null });
    dispatch({ type: "clear_feedback" });
    dispatch({ type: "set_loading", value: true });

    const { response, data } = await sendJsonRequest<{ error?: string }>(`/api/tournaments/${props.tournamentId}`, {
      method: "PATCH",
      body: { status: nextStatus },
    });

    dispatch({ type: "set_loading", value: false });

    if (!response.ok) {
      dispatch({ type: "save_error", error: data.error ?? fallbackError });
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {!isActive ? <InlineAlert variant="info" message={`Estado actual: ${props.status}`} /> : null}
      <FeedbackAlerts message={state.message} error={state.error} />

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
            {previewLogoUrl ? (
              <Image src={previewLogoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
            ) : (
              <Trophy className="size-6 text-zinc-500" />
            )}
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
            <Input
              id="tournamentName"
              value={state.draftName}
              onChange={(event) => dispatch({ type: "set_name", value: event.target.value })}
              maxLength={80}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tournamentLogo">Logo (URL)</Label>
            <Input
              id="tournamentLogo"
              value={state.draftLogoUrl}
              onChange={(event) => dispatch({ type: "set_logo_url", value: event.target.value })}
              placeholder="https://..."
            />
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
          <Button
            type="button"
            variant="outline"
            disabled={actionsDisabled || !state.draftName.trim()}
            onClick={() => void saveDetails()}
          >
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

      <TournamentAdminStatusDialog
        kind="archive"
        open={state.openDialog === "archive"}
        onOpenChange={(open) => dispatch({ type: "set_dialog", value: open ? "archive" : null })}
        onConfirm={() => void updateStatus("ARCHIVED", "No se pudo archivar el torneo")}
      />
      <TournamentAdminStatusDialog
        kind="reactivate"
        open={state.openDialog === "reactivate"}
        onOpenChange={(open) => dispatch({ type: "set_dialog", value: open ? "reactivate" : null })}
        onConfirm={() => void updateStatus("ACTIVE", "No se pudo reactivar el torneo")}
      />
      <TournamentAdminStatusDialog
        kind="finish"
        open={state.openDialog === "finish"}
        onOpenChange={(open) => dispatch({ type: "set_dialog", value: open ? "finish" : null })}
        onConfirm={() => void updateStatus("FINISHED", "No se pudo finalizar el torneo")}
      />

      {isFinished ? <InlineAlert variant="info" message="El torneo está finalizado. El estado ya no se puede cambiar." /> : null}
      {isArchived ? <InlineAlert variant="info" message="El torneo está archivado. Puedes reactivarlo." /> : null}
    </div>
  );
}
