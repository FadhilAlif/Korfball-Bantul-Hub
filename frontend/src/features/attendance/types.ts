import type { AthleteSex, AthleteStatus } from "@/features/athletes/types";
import type { SessionStatus, SessionType } from "@/features/sessions/types";

export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
export type AttendanceMethod = "OFFICIAL" | "SELF_CHECKIN" | "EXCUSE_REQUEST";

export interface AttendanceSheetRow {
  athleteId: number;
  fullName: string;
  nickname: string | null;
  sex: AthleteSex;
  jerseyNumber: number | null;
  athleteStatus: AthleteStatus;
  status: AttendanceStatus | null;
  method: AttendanceMethod | null;
  checkedInAt: string | null;
  note: string | null;
  recordedBy: number | null;
  recordedByName?: string | null;
}

export interface AttendanceSheetResponse {
  session: {
    id: number;
    teamId: number;
    teamName: string;
    title: string;
    type: SessionType;
    startsAt: string;
    endsAt: string;
    venue: string | null;
    lateToleranceMinutes: number;
    checkinCode: string;
    status: SessionStatus;
    finalizedAt: string | null;
  };
  summary: {
    present: number;
    late: number;
    excused: number;
    absent: number;
    attended: number;
    unrecorded: number;
    totalAthletes: number;
  };
  records: AttendanceSheetRow[];
}

export interface LocalAttendanceEdit {
  status: AttendanceStatus;
  note: string | null;
}

export interface MyAttendanceHistoryItem {
  sessionId: number;
  sessionTitle: string;
  sessionType: SessionType;
  sessionStartsAt: string;
  sessionEndsAt: string;
  sessionStatus: SessionStatus;
  status: AttendanceStatus;
  method: AttendanceMethod;
  checkedInAt: string | null;
  note: string | null;
}

export interface MyAttendanceHistoryResponse {
  athlete: {
    id: number;
    fullName: string;
  };
  summary: {
    present: number;
    late: number;
    excused: number;
    absent: number;
    totalCompletedSessions: number;
    attendanceRate: number | null;
  };
  history: MyAttendanceHistoryItem[];
}

export interface AthleteAttendanceSummaryItem {
  athleteId: number;
  fullName: string;
  nickname: string | null;
  sex: AthleteSex;
  jerseyNumber: number | null;
  status: AthleteStatus;
  present: number;
  late: number;
  excused: number;
  absent: number;
  totalSessions: number;
  attendanceRate: number | null;
}

export interface AttendanceSummaryResponse {
  dateRange: {
    from: string;
    to: string;
  };
  totalCompletedSessions: number;
  athletes: AthleteAttendanceSummaryItem[];
}
