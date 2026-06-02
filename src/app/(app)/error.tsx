"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(props.error);
  }, [props.error]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-600" />
            Ocurrió un error
          </CardTitle>
          <CardDescription>Intenta recargar esta sección. Si persiste, revisa los logs del servidor.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <pre className="max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
            {props.error.message}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => props.reset()}>
              <RefreshCw className="size-4" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

