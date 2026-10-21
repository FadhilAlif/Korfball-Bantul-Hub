export type SessionType = "TRAINING" | "SCRIMMAGE" | "MATCH" | "OTHER";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface VenuePreset {
  id: string;
  label: string;
  venue: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  mapsUrl?: string;
}

export const DEFAULT_VENUE_PRESET: VenuePreset = {
  id: "wifa-sport-center",
  label: "WIFA Sport Center (Default)",
  venue: "WIFA SPORT CENTER",
  latitude: -7.900181586573576,
  longitude: 110.32812616243315,
  radiusMeters: 100,
  mapsUrl: "https://maps.app.goo.gl/zWFWcu9doExq8UP26",
};

export const VENUE_PRESETS: VenuePreset[] = [
  DEFAULT_VENUE_PRESET,
  {
    id: "gor-ssa-bantul",
    label: "GOR Stadion Sultan Agung",
    venue: "GOR Stadion Sultan Agung Bantul",
    latitude: -7.8753,
    longitude: 110.3519,
    radiusMeters: 120,
  },
  {
    id: "lapangan-paseban",
    label: "Lapangan Paseban Bantul",
    venue: "Lapangan Paseban Bantul",
    latitude: -7.8878,
    longitude: 110.3289,
    radiusMeters: 100,
  },
];

export interface AttendanceCountsSummary {
  present: number;
  late: number;
  excused: number;
  absent: number;
  attended: number;
  total: number;
}

export interface SessionItem {
  id: number;
  teamId: number;
  teamName: string;
  type: SessionType;
  title: string;
  startsAt: string;
  endsAt: string;
  venue: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  lateToleranceMinutes: number;
  checkinCode: string | null;
  status: SessionStatus;
  notes: string | null;
  createdBy: number | null;
  createdByName?: string | null;
  finalizedAt: string | null;
  finalizedBy: number | null;
  attendanceSummary: AttendanceCountsSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SessionFilterState {
  type: string;
  status: string;
  from: string;
  to: string;
}
