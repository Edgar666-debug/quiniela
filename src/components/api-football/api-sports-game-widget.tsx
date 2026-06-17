"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

import { FeedbackAlerts } from "@/components/app/feedback-alerts";
import {
  ensureApiSportsWidgetScript,
  mapAppThemeToWidgetTheme,
  mountApiSportsGameWidget,
  unmountApiSportsWidget,
} from "@/lib/api-sports-widget";
import { fetchJsonOrThrow } from "@/lib/http";
import { shouldRefreshGameWidget } from "@/lib/football";

type WidgetConfigResponse = {
  widgetApiBaseUrl?: string;
  widgetAccessToken?: string;
  lang?: string;
  refreshSeconds?: number | false;
};

export function ApiSportsGameWidgetPanel(props: { fixtureId: number; statusShort: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    let cancelled = false;

    async function loadWidget() {
      setLoading(true);
      setError(null);

      try {
        await ensureApiSportsWidgetScript();

        const data = await fetchJsonOrThrow<WidgetConfigResponse>(
          "/api/api-football/widget-config",
          { cache: "no-store" },
          "No se pudo cargar la configuración del widget.",
        );

        if (cancelled || !container) return;
        if (!data.widgetApiBaseUrl || !data.widgetAccessToken) {
          throw new Error("No se pudo cargar la configuración del widget.");
        }

        const refreshSeconds: number | false =
          shouldRefreshGameWidget(props.statusShort) && typeof data.refreshSeconds === "number" ? data.refreshSeconds : false;

        mountApiSportsGameWidget(container, {
          widgetApiBaseUrl: data.widgetApiBaseUrl,
          widgetAccessToken: data.widgetAccessToken,
          fixtureId: props.fixtureId,
          lang: data.lang ?? "es",
          theme: mapAppThemeToWidgetTheme(resolvedTheme),
          refreshSeconds,
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo mostrar el widget del partido.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadWidget();

    return () => {
      cancelled = true;
      if (container) unmountApiSportsWidget(container);
    };
  }, [props.fixtureId, props.statusShort, resolvedTheme]);

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          Cargando widget…
        </div>
      ) : null}
      <FeedbackAlerts error={error} />
      <div ref={containerRef} className="min-h-[360px]" />
    </div>
  );
}
