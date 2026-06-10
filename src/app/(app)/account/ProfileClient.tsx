"use client";

import { useReducer, useRef } from "react";
import Image from "next/image";
import { Image as ImageIcon, Loader2, SaveIcon, Trash, Upload, User as UserIcon } from "lucide-react";

import { requestSignedUploadUrl, uploadFileWithSignedUrl, validateImageFile } from "@/lib/storage-upload";
import { sendJsonRequest } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DraftState = {
  sourceName: string | null;
  sourceImage: string | null;
  name: string;
  image: string;
};

type ProfileState = {
  draft: DraftState | null;
  loading: boolean;
  uploadingAvatar: boolean;
  message: string | null;
  error: string | null;
};

type ProfileAction =
  | { type: "set_name"; sourceName: string | null; sourceImage: string | null; value: string; image: string }
  | { type: "set_image"; sourceName: string | null; sourceImage: string | null; name: string; value: string }
  | { type: "clear_image"; sourceName: string | null; sourceImage: string | null; name: string }
  | { type: "save_start" }
  | { type: "save_fail"; error: string }
  | { type: "save_success"; sourceName: string | null; sourceImage: string | null; name: string; image: string; message: string }
  | { type: "upload_start" }
  | { type: "upload_fail"; error: string }
  | { type: "upload_success"; sourceName: string | null; sourceImage: string | null; name: string; image: string; message: string };

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case "set_name":
      return {
        ...state,
        draft: {
          sourceName: action.sourceName,
          sourceImage: action.sourceImage,
          name: action.value,
          image: action.image,
        },
      };
    case "set_image":
      return {
        ...state,
        draft: {
          sourceName: action.sourceName,
          sourceImage: action.sourceImage,
          name: action.name,
          image: action.value,
        },
      };
    case "clear_image":
      return {
        ...state,
        draft: {
          sourceName: action.sourceName,
          sourceImage: action.sourceImage,
          name: action.name,
          image: "",
        },
      };
    case "save_start":
      return { ...state, loading: true, message: null, error: null };
    case "save_fail":
      return { ...state, loading: false, uploadingAvatar: false, error: action.error };
    case "save_success":
      return {
        ...state,
        loading: false,
        uploadingAvatar: false,
        message: action.message,
        error: null,
        draft: {
          sourceName: action.sourceName,
          sourceImage: action.sourceImage,
          name: action.name,
          image: action.image,
        },
      };
    case "upload_start":
      return { ...state, uploadingAvatar: true, message: null, error: null };
    case "upload_fail":
      return { ...state, uploadingAvatar: false, error: action.error };
    case "upload_success":
      return {
        ...state,
        uploadingAvatar: false,
        message: action.message,
        error: null,
        draft: {
          sourceName: action.sourceName,
          sourceImage: action.sourceImage,
          name: action.name,
          image: action.image,
        },
      };
    default:
      return state;
  }
}

export function ProfileClient(props: { initial: { name: string | null; image: string | null; email: string } }) {
  const [state, dispatch] = useReducer(profileReducer, {
    draft: null,
    loading: false,
    uploadingAvatar: false,
    message: null,
    error: null,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDraft =
    state.draft?.sourceName === props.initial.name && state.draft?.sourceImage === props.initial.image ? state.draft : null;
  const name = activeDraft?.name ?? props.initial.name ?? "";
  const image = activeDraft?.image ?? props.initial.image ?? "";
  const imageUrl = image.trim() ? image.trim() : null;

  async function save() {
    dispatch({ type: "save_start" });
    const { response, data } = await sendJsonRequest<{ user?: { name: string | null; image: string | null }; error?: string }>(
      "/api/me/profile",
      {
      method: "PATCH",
      body: {
        name: name.trim() ? name.trim() : undefined,
        image: image.trim() ? image.trim() : null,
      },
    });
    if (!response.ok) return dispatch({ type: "save_fail", error: data.error ?? "No se pudo guardar el perfil." });

    dispatch({
      type: "save_success",
      sourceName: props.initial.name,
      sourceImage: props.initial.image,
      name: data.user?.name ?? "",
      image: data.user?.image ?? "",
      message: "Perfil actualizado.",
    });
  }

  async function uploadAvatar(file: File) {
    const fileError = validateImageFile(file, "avatar");
    if (fileError) return dispatch({ type: "upload_fail", error: fileError });

    dispatch({ type: "upload_start" });

    const { ok, data: signedData } = await requestSignedUploadUrl("/api/me/avatar/upload-url", file);

    if (!ok || !signedData.path || !signedData.token || !signedData.publicUrl) {
      return dispatch({ type: "upload_fail", error: signedData.error ?? "No se pudo preparar la carga del avatar." });
    }

    const upload = await uploadFileWithSignedUrl("avatars", file, signedData.path, signedData.token, signedData.publicUrl);
    if (!upload.ok) {
      return dispatch({ type: "upload_fail", error: upload.error ?? "No se pudo subir el avatar." });
    }

    const imageUrlWithVersion = upload.publicUrl;
    const { response, data } = await sendJsonRequest<{ user?: { name: string | null; image: string | null }; error?: string }>(
      "/api/me/profile",
      {
      method: "PATCH",
      body: { image: imageUrlWithVersion },
    });

    if (!response.ok) {
      return dispatch({ type: "upload_fail", error: data.error ?? "No se pudo guardar el avatar." });
    }

    dispatch({
      type: "upload_success",
      sourceName: props.initial.name,
      sourceImage: props.initial.image,
      name,
      image: data.user?.image ?? imageUrlWithVersion,
      message: "Avatar actualizado.",
    });
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
            onChange={(event) =>
              dispatch({
                type: "set_name",
                sourceName: props.initial.name,
                sourceImage: props.initial.image,
                value: event.target.value,
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
            onChange={(event) =>
              dispatch({
                type: "set_image",
                sourceName: props.initial.name,
                sourceImage: props.initial.image,
                name,
                value: event.target.value,
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
          aria-label="Seleccionar avatar"
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
          disabled={state.loading || state.uploadingAvatar}
          onClick={() => fileInputRef.current?.click()}
        >
          {state.uploadingAvatar ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Subir
        </Button>
        <Button type="button" variant="outline" onClick={save} disabled={state.loading || state.uploadingAvatar}>
          {state.loading ? <Loader2 className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
          Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={state.loading || state.uploadingAvatar || !image.trim()}
          onClick={() =>
            dispatch({
              type: "clear_image",
              sourceName: props.initial.name,
              sourceImage: props.initial.image,
              name,
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

      {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
    </div>
  );
}
