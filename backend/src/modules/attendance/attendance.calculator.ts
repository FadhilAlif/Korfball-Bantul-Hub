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

/**
 * Calculates the great-circle distance in meters between two GPS coordinates
 * using the Haversine formula (BR-34).
 *
 * Returns integer distance in meters (rounded to nearest meter).
 */
export function calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const EARTH_RADIUS_METERS = 6_371_000;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return Math.round(EARTH_RADIUS_METERS * c);
}
