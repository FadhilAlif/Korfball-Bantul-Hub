import { describe, expect, it } from "vitest";
import { sessionFormSchema } from "./session.schema";

describe("sessionFormSchema", () => {
  it("validates a valid Tuesday routine training session", () => {
    const res = sessionFormSchema.safeParse({
      type: "TRAINING",
      title: "Latihan Rutin Selasa",
      date: "2026-04-21",
      startTime: "18:00",
      endTime: "20:00",
      venue: "GOR Stadion Sultan Agung Bantul",
      lateToleranceMinutes: 15,
    });

    expect(res.success).toBe(true);
  });

  it("rejects session when endTime is not after startTime", () => {
    const res = sessionFormSchema.safeParse({
      type: "TRAINING",
      title: "Latihan Rutin Sabtu",
      date: "2026-04-25",
      startTime: "20:00",
      endTime: "19:00",
      venue: "GOR Stadion Sultan Agung Bantul",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("Jam selesai harus setelah jam mulai");
    }
  });
});
