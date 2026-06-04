const UTC_SHORT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export const utcShortFormatter = new Intl.DateTimeFormat("es-MX", UTC_SHORT_OPTIONS);

export function formatUtcShort(iso: string) {
  return utcShortFormatter.format(new Date(iso));
}

export const passkeyDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Kickoff labels in UTC (admin / reference). */
export const kickoffUtcFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "UTC",
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** @deprecated Use `kickoffUtcFormatter` or `kickoffLocalFormatter`. */
export const kickoffDateFormatter = kickoffUtcFormatter;

/** Kickoff labels in the user's local timezone (browser / device). */
export const kickoffLocalFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formats a UTC ISO instant in the user's local timezone. */
export function formatUtcToLocal(iso: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-MX", options).format(new Date(iso));
}

/** Long kickoff label in local time, e.g. for matchday group headers. */
export function formatKickoffLocal(iso: string) {
  return kickoffLocalFormatter.format(new Date(iso));
}

/** IANA timezone of the current environment (e.g. `America/Mexico_City`). */
export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Minute bucket in local time for grouping matches on the same kickoff slot. */
export function kickoffLocalGroupKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function groupMatchesByLocalKickoff<T extends { startsAtUtc: string }>(matches: T[]) {
  const groups = new Map<string, T[]>();
  for (const m of matches) {
    const key = kickoffLocalGroupKey(m.startsAtUtc);
    const arr = groups.get(key);
    if (arr) arr.push(m);
    else groups.set(key, [m]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({
      key,
      label: formatKickoffLocal(items[0]!.startsAtUtc),
      matches: items,
    }));
}
