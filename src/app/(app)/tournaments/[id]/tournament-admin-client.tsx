"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Archive, Flag, Loader2, MoreVertical, RefreshCw, Save, Trophy, Upload, Trash } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/app/inline-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TournamentAdminClient(props: {
  tournamentId: string;
  status: string;
  currentName: string;
  currentLogoUrl: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState<"archive" | "reactivate" | "finish" | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [name, setName] = useState(props.currentName);
  const [logoUrl, setLogoUrl] = useState(props.currentLogoUrl ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isActive = props.status === "ACTIVE";
  const isFinished = props.status === "FINISHED";
  const isArchived = props.status === "ARCHIVED";
  const previewLogoUrl = logoUrl.trim() ? logoUrl.trim() : null;

  async function saveDetails(nextLogoUrl?: string | null) {
    setMessage(null);
    setError(null);
    setSavingDetails(true);
    const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        logoUrl: nextLogoUrl !== undefined ? nextLogoUrl : (logoUrl.trim() ? logoUrl.trim() : null),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      tournament?: { name: string; logoUrl: string | null };
      error?: string;
    };
    setSavingDetails(false);
    if (!res.ok) return setError(data.error ?? "No se pudo actualizar el torneo.");
    setName(data.tournament?.name ?? name.trim());
    setLogoUrl(data.tournament?.logoUrl ?? "");
    setMessage("Torneo actualizado.");
  }

  async function uploadLogo(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("El logo no debe exceder 5 MB.");
      return;
    }

    setMessage(null);
    setError(null);
    setUploadingLogo(true);

    const signedRes = await fetch(`/api/tournaments/${props.tournamentId}/logo/upload-url`, {
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
      setUploadingLogo(false);
      setError(signedData.error ?? "No se pudo preparar la carga del logo.");
      return;
    }

    const upload = await supabase.storage.from("tournament-assets").uploadToSignedUrl(signedData.path, signedData.token, file);
    if (upload.error) {
      setUploadingLogo(false);
      setError(upload.error.message ?? "No se pudo subir el logo.");
      return;
    }

    const publicUrl = `${signedData.publicUrl}?v=${Date.now()}`;
    const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), logoUrl: publicUrl }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      tournament?: { name: string; logoUrl: string | null };
      error?: string;
    };
    setUploadingLogo(false);
    if (!res.ok) return setError(data.error ?? "No se pudo guardar el logo.");
    setLogoUrl(data.tournament?.logoUrl ?? publicUrl);
    setMessage("Logo actualizado.");
  }

  return (
    <div className="flex flex-col gap-4">
      {!isActive ? <InlineAlert variant="info" message={`Estado actual: ${props.status}`} /> : null}
      {message ? <InlineAlert variant="success" message={message} /> : null}
      {error ? <InlineAlert variant="error" message={error} /> : null}

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
            {previewLogoUrl ? (
              <Image src={previewLogoUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
            ) : (
              <Trophy className="size-6 text-zinc-500" />
            )}
          </div>
          <div className="flex items-center gap-2 justify-between w-full">
            <div>
            <p className="text-sm font-medium">Identidad del torneo</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Actualiza nombre y logo.</p>
            </div>
            <div className="flex items-center gap-2">
                           {/* Dropdown de opciones */}
             <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={loading || isFinished}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            disabled={!isActive}
            onSelect={() => setOpenDialog("archive")}
          >
            <Archive className="size-4" />
            Archivar
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isArchived}
            onSelect={() => setOpenDialog("reactivate")}
          >
            <RefreshCw className="size-4" />
            Reactivar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!isActive}
            className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            onSelect={() => setOpenDialog("finish")}
          >
            <Flag className="size-4" />
            Finalizar
          </DropdownMenuItem>
        </DropdownMenuContent>
             </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tournamentName">Nombre</Label>
            <Input id="tournamentName" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tournamentLogo">Logo (URL)</Label>
            <Input id="tournamentLogo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadLogo(file);
              event.currentTarget.value = "";
            }}
          />
          <Button type="button" variant="outline" disabled={savingDetails || uploadingLogo} onClick={() => fileInputRef.current?.click()}>
            {uploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Subir
          </Button>
          <Button type="button" variant="outline" disabled={savingDetails || uploadingLogo || !name.trim()} onClick={() => void saveDetails()}>
            {savingDetails ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={savingDetails || uploadingLogo || !logoUrl.trim()}
            onClick={() => {
              setLogoUrl("");
              void saveDetails(null);
            }}
          >
            <Trash className="size-4" />
            Borrar
          </Button>
        </div>
      </div>

      {/* Diálogo: Archivar */}
      <AlertDialog open={openDialog === "archive"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archivar torneo</AlertDialogTitle>
            <AlertDialogDescription>Esto archivará el torneo. Podrás reactivarlo después (solo si no está finalizado).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setOpenDialog(null);
                setError(null);
                setLoading(true);
                const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ status: "ARCHIVED" }),
                });
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                setLoading(false);
                if (!res.ok) return setError(data.error ?? "No se pudo archivar el torneo");
                window.location.reload();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: Reactivar */}
      <AlertDialog open={openDialog === "reactivate"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivar torneo</AlertDialogTitle>
            <AlertDialogDescription>Esto reactivará el torneo y lo pondrá de nuevo como activo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setOpenDialog(null);
                setError(null);
                setLoading(true);
                const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ status: "ACTIVE" }),
                });
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                setLoading(false);
                if (!res.ok) return setError(data.error ?? "No se pudo reactivar el torneo");
                window.location.reload();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo: Finalizar */}
      <AlertDialog open={openDialog === "finish"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar torneo</AlertDialogTitle>
            <AlertDialogDescription>
              Esto marcará el torneo como terminado y bloqueará cambios de estado. No podrás volver a activarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                setOpenDialog(null);
                setError(null);
                setLoading(true);
                const res = await fetch(`/api/tournaments/${props.tournamentId}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ status: "FINISHED" }),
                });
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                setLoading(false);
                if (!res.ok) return setError(data.error ?? "No se pudo finalizar el torneo");
                window.location.reload();
              }}
            >
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isFinished ? <InlineAlert variant="info" message="El torneo está finalizado. El estado ya no se puede cambiar." /> : null}
      {isArchived ? <InlineAlert variant="info" message="El torneo está archivado. Puedes reactivarlo." /> : null}
    </div>
  );
}
