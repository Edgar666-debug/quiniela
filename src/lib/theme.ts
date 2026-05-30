export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "app.theme.mode";
const EVENT_NAME = "app-theme-change";

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return null;
}

export function setStoredTheme(mode: ThemeMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getSystemTheme(): Exclude<ThemeMode, "system"> {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeClass(mode: ThemeMode) {
  const root = document.documentElement;
  const resolved = mode === "system" ? getSystemTheme() : mode;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = mode;
}

export function subscribeTheme(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT_NAME, onCustom);

  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onMql = () => callback();
  mql?.addEventListener?.("change", onMql);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT_NAME, onCustom);
    mql?.removeEventListener?.("change", onMql);
  };
}

export function getThemeSnapshot(): ThemeMode {
  return getStoredTheme() ?? "system";
}

export function getThemeServerSnapshot(): ThemeMode {
  return "system";
}

export function themeInitScript() {
  // Keep this string small; runs before hydration.
  return `
(() => {
  try {
    const k = "${STORAGE_KEY}";
    const stored = localStorage.getItem(k);
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    const root = document.documentElement;
    if (resolved === "dark") root.classList.add("dark"); else root.classList.remove("dark");
    root.dataset.theme = mode;
  } catch {}
})();`.trim();
}
