import crypto from "node:crypto";

/**
 * 32-character unambiguous uppercase alphanumeric alphabet (excluding 0, O, 1, I, L)
 */
export const CHECKIN_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates a random 6-character check-in code.
 */
export function generateCheckinCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    const byte = bytes[i] ?? 0;
    code += CHECKIN_ALPHABET[byte % CHECKIN_ALPHABET.length];
  }
  return code;
}

/**
 * Formats a Date into YYYY-MM-DD and HH:mm in WIB (UTC+7)
 */
export function toWibParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
} {
  // date.getTime() is already UTC epoch milliseconds
  const wibTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return {
    year: wibTime.getUTCFullYear(),
    month: wibTime.getUTCMonth() + 1,
    day: wibTime.getUTCDate(),
    hour: wibTime.getUTCHours(),
    minute: wibTime.getUTCMinutes(),
    dayOfWeek: wibTime.getUTCDay(),
  };
}

/**
 * Creates a Date from date string (YYYY-MM-DD) and time string (HH:mm) in WIB (UTC+7)
 */
export function createWibDate(dateStr: string, timeStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  const timeParts = timeStr.split(":").map(Number);

  const year = parts[0] ?? 2026;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;

  const hour = timeParts[0] ?? 0;
  const minute = timeParts[1] ?? 0;

  // UTC+7 timestamp:
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0));
}
