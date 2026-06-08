import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function InlineAlert(props: { variant: "error" | "success" | "info"; message: string; className?: string }) {
  const alertVariant = props.variant === "error" ? "destructive" : props.variant === "success" ? "success" : "info";

  return (
    <Alert variant={alertVariant} className={cn(props.className)}>
      <AlertDescription>{props.message}</AlertDescription>
    </Alert>
  );
}
