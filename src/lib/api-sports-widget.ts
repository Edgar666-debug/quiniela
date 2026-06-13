const WIDGET_SCRIPT_URL = "https://widgets.api-sports.io/3.1.0/widgets.js";

let scriptPromise: Promise<void> | null = null;

export type ApiSportsWidgetTheme = "white" | "grey" | "dark" | "blue";

export function mapAppThemeToWidgetTheme(resolvedTheme: string | undefined): ApiSportsWidgetTheme {
  if (resolvedTheme === "dark") return "dark";
  return "white";
}

export function ensureApiSportsWidgetScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${WIDGET_SCRIPT_URL}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = WIDGET_SCRIPT_URL;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("No se pudo cargar el script de widgets de API-Football."));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function normalizeWidgetApiBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function mountApiSportsGameWidget(
  container: HTMLElement,
  input: {
    widgetApiBaseUrl: string;
    widgetAccessToken: string;
    fixtureId: number;
    lang: string;
    theme: ApiSportsWidgetTheme;
    refreshSeconds: number | false;
  },
) {
  container.replaceChildren();

  const configEl = document.createElement("api-sports-widget");
  configEl.setAttribute("data-type", "config");
  configEl.setAttribute("data-key", input.widgetAccessToken);
  configEl.setAttribute("data-sport", "football");
  configEl.setAttribute("data-url-football", normalizeWidgetApiBaseUrl(input.widgetApiBaseUrl));
  configEl.setAttribute("data-lang", input.lang);
  configEl.setAttribute("data-theme", input.theme);
  configEl.setAttribute("data-show-logos", "true");
  configEl.setAttribute("data-show-errors", "true");
  configEl.setAttribute("data-timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "utc");

  const gameEl = document.createElement("api-sports-widget");
  gameEl.setAttribute("data-type", "game");
  gameEl.setAttribute("data-game-id", String(input.fixtureId));
  if (input.refreshSeconds !== false) {
    gameEl.setAttribute("data-refresh", String(input.refreshSeconds));
  }

  container.appendChild(configEl);
  container.appendChild(gameEl);
}

export function unmountApiSportsWidget(container: HTMLElement) {
  container.replaceChildren();
}
