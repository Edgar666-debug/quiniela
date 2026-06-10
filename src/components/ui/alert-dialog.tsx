import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

type AlertDialogOverlayProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Overlay>;
type AlertDialogContentProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Content>;
type AlertDialogTitleProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Title>;
type AlertDialogDescriptionProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Description>;
type AlertDialogCancelProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Cancel>;
type AlertDialogActionProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Action> & { variant?: "default" | "destructive" };

export function AlertDialogOverlay({ className, ref, ...props }: AlertDialogOverlayProps) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

export function AlertDialogContent({ className, ref, ...props }: AlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "surface-panel-ui fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] p-6 shadow-lg outline-none",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function AlertDialogTitle({ className, ref, ...props }: AlertDialogTitleProps) {
  return <AlertDialogPrimitive.Title ref={ref} className={cn("text-base font-semibold", className)} {...props} />;
}
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

export function AlertDialogDescription({ className, ref, ...props }: AlertDialogDescriptionProps) {
  return <AlertDialogPrimitive.Description ref={ref} className={cn("text-muted-ui text-sm", className)} {...props} />;
}
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

export function AlertDialogCancel({ className, ref, ...props }: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Cancel ref={ref} asChild>
      <Button variant="outline" className={className} {...props} />
    </AlertDialogPrimitive.Cancel>
  );
}
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export function AlertDialogAction({ className, variant = "default", ref, ...props }: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action ref={ref} asChild>
      <Button variant={variant === "destructive" ? "destructive" : "default"} className={className} {...props} />
    </AlertDialogPrimitive.Action>
  );
}
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

export function AlertDialogA11yHeader(props: {
  title: React.ReactNode;
  description: React.ReactNode;
  srOnly?: boolean;
  className?: string;
}) {
  const hidden = props.srOnly ? "sr-only" : undefined;
  return (
    <AlertDialogHeader className={props.className}>
      <AlertDialogTitle className={hidden}>{props.title}</AlertDialogTitle>
      <AlertDialogDescription className={hidden}>{props.description}</AlertDialogDescription>
    </AlertDialogHeader>
  );
}
