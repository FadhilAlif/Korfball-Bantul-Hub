import { describe, expect, it } from "vitest";
import { createMatchFormSchema, quickAddOpponentAthleteSchema } from "./match.schema";

describe("match.schema", () => {
  it("rejects identical home and away team for OFFICIAL and FRIENDLY matches (BR-16)", () => {
    const invalidOfficial = {
      type: "OFFICIAL" as const,
      format: "K8" as const,
      homeTeamId: 1,
      awayTeamId: 1, // Same team
      scheduledAt: "2026-10-25T14:00",
      periodCount: 4,
      periodDurationMinutes: 10,
      trackShotZone: false,
    };

    const res = createMatchFormSchema.safeParse(invalidOfficial);
    expect(res.success).toBe(false);
  });

  it("allows identical home and away team for SCRIMMAGE matches (BR-16)", () => {
    const validScrimmage = {
      type: "SCRIMMAGE" as const,
      format: "K8" as const,
      homeTeamId: 1,
      awayTeamId: 1, // Allowed for scrimmage
      scheduledAt: "2026-10-25T14:00",
      periodCount: 2,
      periodDurationMinutes: 25,
      trackShotZone: false,
    };

    const res = createMatchFormSchema.safeParse(validScrimmage);
    expect(res.success).toBe(true);
  });

  it("validates quickAddOpponentAthleteSchema jersey numbers between 0 and 99", () => {
    expect(
      quickAddOpponentAthleteSchema.safeParse({
        fullName: "Budi Santoso",
        sex: "MALE",
        jerseyNumber: 10,
      }).success,
    ).toBe(true);

    expect(
      quickAddOpponentAthleteSchema.safeParse({
        fullName: "Budi Santoso",
        sex: "MALE",
        jerseyNumber: 150, // Invalid > 99
      }).success,
    ).toBe(false);
  });
});
