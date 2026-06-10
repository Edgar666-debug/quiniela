import { formatUtcToLocalDateTime } from "@/lib/format";

export function formatUtcDateTime(iso: string) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm} UTC`;
}

/** Same instant as `iso`, shown in the user's local timezone. */
export function formatLocalDateTime(iso: string) {
  return formatUtcToLocalDateTime(iso);
}

