export type SessionType = "TRAINING" | "SCRIMMAGE" | "MATCH" | "OTHER";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

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
  lateToleranceMinutes: number;
  checkinCode: string;
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
