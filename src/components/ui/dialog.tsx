"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

type DialogOverlayProps = React.ComponentPropsWithRef<typeof DialogPrimitive.Overlay>;
type DialogContentProps = React.ComponentPropsWithRef<typeof DialogPrimitive.Content>;
type DialogTitleProps = React.ComponentPropsWithRef<typeof DialogPrimitive.Title>;
type DialogDescriptionProps = React.ComponentPropsWithRef<typeof DialogPrimitive.Description>;

export function DialogOverlay({ className, ref, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export function DialogContent({ className, children, ref, ...props }: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "surface-panel-ui fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 p-4 shadow-lg outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-200",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        <div className="absolute right-3 top-3">
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Cerrar">
              <X className="size-4" />
            </Button>
          </DialogClose>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-10", className)} {...props} />;
}

export function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
  return <DialogPrimitive.Title ref={ref} className={cn("text-base font-semibold", className)} {...props} />;
}
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export function DialogDescription({ className, ref, ...props }: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-muted-ui text-sm", className)}
      {...props}
    />
  );
}
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export function DialogA11yHeader(props: { title: React.ReactNode; description: React.ReactNode; srOnly?: boolean; className?: string }) {
  const hidden = props.srOnly ? "sr-only" : undefined;
  return (
    <DialogHeader className={props.className}>
      <DialogTitle className={hidden}>{props.title}</DialogTitle>
      <DialogDescription className={hidden}>{props.description}</DialogDescription>
    </DialogHeader>
  );
}
