"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasskeysClient() {
  const [name, setName] = useState("Mi passkey");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function registerPasskey() {
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { error: registerError } = await authClient.passkey.addPasskey({ name: name.trim() });

      if (registerError) {
        setError(registerError.message ?? "No se pudo registrar la passkey");
        return;
      }

      setMessage("Passkey registrada.");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "No se pudo registrar la passkey");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5" />
          Registrar passkey
        </CardTitle>
        <CardDescription>En local funciona en `localhost`. En producción requiere HTTPS.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="passkeyName">Nombre</Label>
          <Input id="passkeyName" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </div>
        <Button
          className="w-fit"
          variant="outline"
          disabled={loading || !name.trim()}
          type="button"
          onClick={() => void registerPasskey()}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Agregar passkey
        </Button>

        <FeedbackAlerts message={message} error={error} />
      </CardContent>
    </Card>
  );
}

