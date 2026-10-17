import { describe, expect, it } from "vitest";
import { excuseFormSchema, selfCheckinFormSchema } from "./attendance.schema";

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

  it("validates excuse reason length between 5 and 250 chars", () => {
    expect(excuseFormSchema.safeParse({ reason: "Ujian kuliah sore" }).success).toBe(true);
    expect(excuseFormSchema.safeParse({ reason: "Skt" }).success).toBe(false);
  });
});
