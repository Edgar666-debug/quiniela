import Image from "next/image";

import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, { frame: string; px: number; text: string }> = {
  sm: { frame: "size-7", px: 28, text: "text-xs" },
  md: { frame: "size-9", px: 36, text: "text-sm" },
  lg: { frame: "size-11", px: 44, text: "text-base" },
};

export function UserAvatar(props: {
  name: string | null;
  email: string;
  image: string | null | undefined;
  size?: Size;
  className?: string;
}) {
  const { frame, px, text } = SIZE_MAP[props.size ?? "sm"];
  const initial = ((props.name ?? props.email) || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={cn(
        "avatar-frame-ui shrink-0 overflow-hidden font-semibold text-zinc-700 dark:text-zinc-200",
        frame,
        text,
        props.className,
      )}
    >
      {props.image ? (
        <Image src={props.image} alt="" width={px} height={px} className="h-full w-full object-cover" unoptimized />
      ) : (
        initial
      )}
    </div>
  );
}
