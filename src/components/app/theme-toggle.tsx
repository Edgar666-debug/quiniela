"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";

import { applyThemeClass, getStoredTheme, setStoredTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MODES: ThemeMode[] = ["system", "light", "dark"];

function modeIcon(mode: ThemeMode) {
  if (mode === "dark") return <Moon className="h-4 w-4" />;
  if (mode === "light") return <Sun className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}

function modeLabel(mode: ThemeMode) {
  if (mode === "dark") return "Dark";
  if (mode === "light") return "Light";
  return "System";
}

export function ThemeToggle(props: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ThemeMode>(() => (typeof window === "undefined" ? "system" : (getStoredTheme() ?? "system")));

  useEffect(() => {
    applyThemeClass(mode);
  }, [mode]);

  useEffect(() => {
    if (mode === "system") {
      const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
      if (!mql) return;
      const onChange = () => applyThemeClass("system");
      mql.addEventListener?.("change", onChange);
      return () => mql.removeEventListener?.("change", onChange);
    }
  }, [mode]);

  const items = useMemo(
    () =>
      MODES.map((m) => ({
        mode: m,
        label: modeLabel(m),
        icon: modeIcon(m),
        active: m === mode,
      })),
    [mode],
  );

  function setTheme(next: ThemeMode) {
    setMode(next);
    setStoredTheme(next);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size={props.collapsed ? "icon" : "sm"}
        className={cn(props.collapsed ? "" : "w-full justify-start gap-2")}
        onClick={() => setOpen((v) => !v)}
        aria-label="Cambiar tema"
      >
        {modeIcon(mode)}
        {props.collapsed ? null : <span className="text-sm"></span>}
      </Button>

      {open ? (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-black",
            props.collapsed ? "left-12" : "",
          )}
        >
          {items.map((i) => (
            <button
              key={i.mode}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900",
                i.active ? "font-medium" : "text-zinc-700 dark:text-zinc-200",
              )}
              onClick={() => setTheme(i.mode)}
            >
              {i.icon}
              <span className="flex-1">{i.label}</span>
              {i.active ? <Check className="h-4 w-4 text-emerald-600" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
