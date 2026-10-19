export const TIMEZONE_WIB = "Asia/Jakarta";
export const LOCALE_ID = "id-ID";

function toDate(input?: string | Date | number | null): Date {
  if (input instanceof Date) return input;
  if (typeof input === "string" || typeof input === "number") return new Date(input);
  return new Date();
}

/**
 * Converts a Date or ISO string into a YYYY-MM-DDTHH:mm string in WIB (Asia/Jakarta)
 * Suitable for HTML `<input type="datetime-local" />`.
 */
export function toWibDateTimeInput(dateOrIso?: string | Date | number | null): string {
  const d = toDate(dateOrIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/**
 * Converts a YYYY-MM-DDTHH:mm input string (from datetime-local) to an ISO string
 * explicitly anchored to WIB (+07:00).
 */
export function fromWibDateTimeInput(dateTimeLocalStr: string): string {
  if (!dateTimeLocalStr) return "";
  // If it already has timezone indicator (+ or Z), parse directly
  if (dateTimeLocalStr.includes("+") || dateTimeLocalStr.includes("Z")) {
    return new Date(dateTimeLocalStr).toISOString();
  }
  // Otherwise append +07:00 (WIB offset)
  const withSeconds = dateTimeLocalStr.length === 16 ? `${dateTimeLocalStr}:00` : dateTimeLocalStr;
  return new Date(`${withSeconds}+07:00`).toISOString();
}

/**
 * Converts a Date or ISO string into a YYYY-MM-DD string in WIB (Asia/Jakarta)
 * Suitable for HTML `<input type="date" />`.
 */
export function toWibDateInput(dateOrIso?: string | Date | number | null): string {
  const d = toDate(dateOrIso);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Formats a Date or ISO string into an Indonesian date string in WIB (Asia/Jakarta).
 * e.g. "Senin, 19 Oktober 2026" or "19 Okt 2026"
 */
export function formatWibDate(dateOrIso?: string | Date | number | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateOrIso) return "-";
  try {
    const d = toDate(dateOrIso);
    return new Intl.DateTimeFormat(LOCALE_ID, {
      timeZone: TIMEZONE_WIB,
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    }).format(d);
  } catch {
    return String(dateOrIso);
  }
}

/**
 * Formats a Date or ISO string into an Indonesian time string in WIB (Asia/Jakarta).
 * e.g. "09:35" or "09:35 WIB"
 */
export function formatWibTime(dateOrIso?: string | Date | number | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateOrIso) return "-";
  try {
    const d = toDate(dateOrIso);
    return new Intl.DateTimeFormat(LOCALE_ID, {
      timeZone: TIMEZONE_WIB,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...options,
    }).format(d);
  } catch {
    return String(dateOrIso);
  }
}

/**
 * Formats a Date or ISO string into a full date and time string in WIB (Asia/Jakarta).
 * e.g. "Sen, 19 Okt 2026 · 09:35 WIB"
 */
export function formatWibDateTime(
  dateOrIso?: string | Date | number | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateOrIso) return "-";
  try {
    const d = toDate(dateOrIso);
    const datePart = new Intl.DateTimeFormat(LOCALE_ID, {
      timeZone: TIMEZONE_WIB,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    }).format(d);

    const timePart = new Intl.DateTimeFormat(LOCALE_ID, {
      timeZone: TIMEZONE_WIB,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);

    return `${datePart} · ${timePart} WIB`;
  } catch {
    return String(dateOrIso);
  }
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}h lalu`;
  return formatWibDate(dateStr, { month: "short", day: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  return formatWibDateTime(dateStr);
}
