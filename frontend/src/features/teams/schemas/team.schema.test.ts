import { describe, expect, it } from "vitest";
import { teamFormSchema } from "./team.schema";

describe("teamFormSchema", () => {
  it("validates a valid team payload", () => {
    const result = teamFormSchema.safeParse({
      name: "Korfball Bantul",
      shortName: "BANTUL",
      region: "Kab. Bantul, DIY",
      isInternal: true,
      color: "#FACC15",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Korfball Bantul");
      expect(result.data.shortName).toBe("BANTUL");
    }
  });

  it("rejects name shorter than 2 characters or invalid hex color", () => {
    const badName = teamFormSchema.safeParse({
      name: "A",
      color: "#3B82F6",
    });
    expect(badName.success).toBe(false);

    const badColor = teamFormSchema.safeParse({
      name: "Kab. Klaten",
      color: "blue",
    });
    expect(badColor.success).toBe(false);
  });
});
