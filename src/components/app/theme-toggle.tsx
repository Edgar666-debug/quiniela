"use client";

import { useSyncExternalStore } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const safeMode: ThemeMode =
    mounted && (theme === "system" || theme === "light" || theme === "dark") ? (theme as ThemeMode) : "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={props.collapsed ? "icon" : "sm"}
          className={cn(props.collapsed ? "" : "w-full justify-start gap-2")}
          aria-label="Cambiar tema"
        >
          {modeIcon(safeMode)}
          {props.collapsed ? null : <span className="text-sm">Tema</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={props.align === "right" ? "end" : "start"}
        side={props.collapsed ? "right" : "top"}
        className="w-44"
      >
        <DropdownMenuRadioGroup value={safeMode} onValueChange={(value) => setTheme(value as ThemeMode)}>
          {MODES.map((mode) => (
            <DropdownMenuRadioItem key={mode} value={mode} className="gap-2">
              {modeIcon(mode)}
              {modeLabel(mode)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
