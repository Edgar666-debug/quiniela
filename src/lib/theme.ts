export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "app.theme.mode";

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return null;
}

export function setStoredTheme(mode: ThemeMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
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

