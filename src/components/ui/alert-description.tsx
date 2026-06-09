import * as React from "react";

import { cn } from "@/lib/utils";

type AlertDescriptionProps = React.ComponentPropsWithRef<"div">;

export function AlertDescription({ className, ref, ...props }: AlertDescriptionProps) {
  return <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

AlertDescription.displayName = "AlertDescription";
