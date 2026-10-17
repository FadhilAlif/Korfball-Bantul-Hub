import { describe, expect, it } from "vitest";
import type { AttendanceSheetRow } from "../types";
import { mergeServerRecordsWithLocalEdits } from "./useAttendanceSheetState";

describe("mergeServerRecordsWithLocalEdits", () => {
  const serverRows: AttendanceSheetRow[] = [
    {
      athleteId: 1,
      fullName: "Rukmi Sari",
      nickname: "Rukmi",
      sex: "FEMALE",
      jerseyNumber: 7,
      athleteStatus: "ACTIVE",
      status: "PRESENT",
      method: "SELF_CHECKIN",
      checkedInAt: "2026-04-21T11:05:00.000Z",
      note: null,
      recordedBy: null,
    },
    {
      athleteId: 2,
      fullName: "Guntur Pratama",
      nickname: "Guntur",
      sex: "MALE",
      jerseyNumber: 10,
      athleteStatus: "ACTIVE",
      status: null,
      method: null,
      checkedInAt: null,
      note: null,
      recordedBy: null,
    },
  ];

  it("preserves unsaved local edits while accepting fresh server check-ins for untouched rows", () => {
    const localEdits = {
      2: { status: "LATE" as const, note: "Macet di jalan" },
    };

    const merged = mergeServerRecordsWithLocalEdits(serverRows, localEdits);

    // Athlete 1 retains server SELF_CHECKIN status
    expect(merged[0]?.status).toBe("PRESENT");
    expect(merged[0]?.method).toBe("SELF_CHECKIN");

    // Athlete 2 reflects unsaved local edit
    expect(merged[1]?.status).toBe("LATE");
    expect(merged[1]?.note).toBe("Macet di jalan");
  });
});
