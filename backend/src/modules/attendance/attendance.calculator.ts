export interface AttendanceCounts {
  present: number;
  late: number;
  excused: number;
  absent: number;
}

/**
 * Calculates the Attendance Rate according to BR-13:
 * Attendance Rate = (PRESENT + LATE) / (PRESENT + LATE + EXCUSED + ABSENT) * 100
 *
 * Rules:
 * - Only sessions that are COMPLETED are counted.
 * - LATE is considered attended.
 * - EXCUSED is included in the denominator (represents planned commitment).
 * - If denominator is 0, returns null (displayed as "—" in UI).
 * - Rounded to 1 decimal place.
 */
export function computeAttendanceRate(counts: AttendanceCounts): number | null {
  const attended = counts.present + counts.late;
  const denominator = counts.present + counts.late + counts.excused + counts.absent;

  if (denominator === 0) {
    return null;
  }

  const rate = (attended / denominator) * 100;
  return Math.round(rate * 10) / 10;
}
