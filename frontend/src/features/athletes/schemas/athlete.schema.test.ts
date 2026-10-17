import { describe, expect, it } from "vitest";
import { athleteFormSchema } from "./athlete.schema";

describe("athleteFormSchema", () => {
  it("parses valid athlete form input and coerces jerseyNumber", () => {
    const res = athleteFormSchema.safeParse({
      teamId: "1",
      fullName: "Rukmi Sari",
      nickname: "Rukmi",
      sex: "FEMALE",
      jerseyNumber: "7",
      birthDate: "2003-05-14",
      status: "ACTIVE",
      notes: "Starter putri",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.teamId).toBe(1);
      expect(res.data.jerseyNumber).toBe(7);
      expect(res.data.sex).toBe("FEMALE");
    }
  });

  it("allows empty optional fields and converts them to null", () => {
    const res = athleteFormSchema.safeParse({
      teamId: 1,
      fullName: "Guntur Pratama",
      nickname: "",
      sex: "MALE",
      jerseyNumber: "",
      birthDate: "",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.nickname).toBeNull();
      expect(res.data.jerseyNumber).toBeNull();
      expect(res.data.birthDate).toBeNull();
    }
  });

  it("rejects out-of-range jerseyNumber or future birthDate", () => {
    const badJersey = athleteFormSchema.safeParse({
      teamId: 1,
      fullName: "Irfan",
      sex: "MALE",
      jerseyNumber: "105",
    });
    expect(badJersey.success).toBe(false);

    const futureBirth = athleteFormSchema.safeParse({
      teamId: 1,
      fullName: "Irfan",
      sex: "MALE",
      birthDate: "2099-01-01",
    });
    expect(futureBirth.success).toBe(false);
  });
});
