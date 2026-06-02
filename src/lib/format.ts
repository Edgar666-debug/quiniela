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

export const kickoffDateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "UTC",
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});
