import { describe, expect, it } from "vitest";
import {
  estimateDistanceMetersUi,
  excuseFormSchema,
  selfCheckinFormSchema,
  selfCheckinGpsSchema,
} from "./attendance.schema";

describe("attendance schemas", () => {
  it("normalizes 6-char check-in code to uppercase and rejects invalid lengths", () => {
    const valid = selfCheckinFormSchema.safeParse({ code: "k7m4x9" });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.code).toBe("K7M4X9");
    }

    const invalid = selfCheckinFormSchema.safeParse({ code: "ABC" });
    expect(invalid.success).toBe(false);
  });

  it("validates GPS check-in payload and estimates UI distance to WIFA Sport Center", () => {
    const wifaLat = -7.900181586573576;
    const wifaLng = 110.32812616243315;

    const validGps = selfCheckinGpsSchema.safeParse({
      sessionId: 12,
      latitude: wifaLat,
      longitude: wifaLng,
    });
    expect(validGps.success).toBe(true);

    expect(estimateDistanceMetersUi(wifaLat, wifaLng, wifaLat, wifaLng)).toBe(0);
  });

  it("validates excuse reason length between 5 and 250 chars", () => {
    expect(excuseFormSchema.safeParse({ reason: "Ujian kuliah sore" }).success).toBe(true);
    expect(excuseFormSchema.safeParse({ reason: "Skt" }).success).toBe(false);
  });
});
