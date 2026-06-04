"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes"; 

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ThemeMode = "system" | "light" | "dark";
const MODES: ThemeMode[] = ["system", "light", "dark"];

const emptySubscribe = () => () => {};

function modeIcon(mode: ThemeMode) {
  if (mode === "dark") return <Moon className="size-4" />;
  if (mode === "light") return <Sun className="size-4" />;
  return <Laptop className="size-4" />;
}

function modeLabel(mode: ThemeMode) {
  if (mode === "dark") return "Dark";
  if (mode === "light") return "Light";
  return "System";
}

export function ThemeToggle(props: { collapsed?: boolean; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const items = MODES.map((m) => ({
    mode: m,
    label: modeLabel(m),
    icon: modeIcon(m),
    active: m === theme,
  }));

  function setThemeAndClose(next: ThemeMode) {
    setTheme(next);
    setOpen(false);
  }

  const safeMode: ThemeMode =
    mounted && (theme === "system" || theme === "light" || theme === "dark") ? (theme as ThemeMode) : "system";

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
        {modeIcon(safeMode)}
        {props.collapsed ? null : <span className="text-sm">Tema</span>}
      </Button>

      {mounted && open ? (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950",
            props.align === "right" ? "right-0" : props.collapsed ? "left-12" : "left-0",
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
              onClick={() => setThemeAndClose(i.mode)}
            >
              {i.icon}
              <span className="flex-1">{i.label}</span>
              {i.active ? <Check className="size-4 text-emerald-600" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
