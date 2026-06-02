"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

type DropdownMenuSubTriggerProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean };
type DropdownMenuSubContentProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.SubContent>;
type DropdownMenuContentProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.Content>;
type DropdownMenuItemProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean };
type DropdownMenuCheckboxItemProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.CheckboxItem>;
type DropdownMenuRadioItemProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.RadioItem>;
type DropdownMenuLabelProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean };
type DropdownMenuSeparatorProps = React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.Separator>;

export function DropdownMenuSubTrigger({ className, inset, children, ref, ...props }: DropdownMenuSubTriggerProps) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none focus:bg-zinc-100 data-[state=open]:bg-zinc-100 dark:focus:bg-zinc-900 dark:data-[state=open]:bg-zinc-900",
        inset ? "pl-8" : "",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

export function DropdownMenuSubContent({ className, ref, ...props }: DropdownMenuSubContentProps) {
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 text-zinc-950 shadow-lg dark:border-zinc-800 dark:bg-black dark:text-zinc-50",
        className,
      )}
      {...props}
    />
  );
}
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export function DropdownMenuContent({ className, sideOffset = 8, ref, ...props }: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 text-zinc-950 shadow-lg dark:border-zinc-800 dark:bg-black dark:text-zinc-50",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export function DropdownMenuItem({ className, inset, ref, ...props }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none transition-colors focus:bg-zinc-100 focus:text-zinc-950 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-900 dark:focus:text-zinc-50",
        inset ? "pl-8" : "",
        className,
      )}
      {...props}
    />
  );
}
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export function DropdownMenuCheckboxItem({ className, children, checked, ref, ...props }: DropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-900",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

export function DropdownMenuRadioItem({ className, children, ref, ...props }: DropdownMenuRadioItemProps) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-zinc-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-900",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

export function DropdownMenuLabel({ className, inset, ref, ...props }: DropdownMenuLabelProps) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn("px-2 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400", inset ? "pl-8" : "", className)}
      {...props}
    />
  );
}
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export function DropdownMenuSeparator({ className, ref, ...props }: DropdownMenuSeparatorProps) {
  return <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800", className)} {...props} />;
}
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-auto text-xs tracking-widest text-zinc-500 dark:text-zinc-400", className)} {...props} />;
}
