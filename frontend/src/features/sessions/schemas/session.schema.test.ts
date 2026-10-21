import { describe, expect, it } from "vitest";
import { DEFAULT_VENUE_PRESET } from "../types";
import { sessionFormSchema } from "./session.schema";

describe("sessionFormSchema", () => {
  it("validates a valid Tuesday routine training session at WIFA SPORT CENTER with GPS geofence", () => {
    const res = sessionFormSchema.safeParse({
      type: "TRAINING",
      title: "Latihan Rutin Selasa",
      date: "2026-04-21",
      startTime: "18:00",
      endTime: "20:00",
      venue: DEFAULT_VENUE_PRESET.venue,
      latitude: DEFAULT_VENUE_PRESET.latitude,
      longitude: DEFAULT_VENUE_PRESET.longitude,
      radiusMeters: DEFAULT_VENUE_PRESET.radiusMeters,
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
      venue: "WIFA SPORT CENTER",
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("Jam selesai harus setelah jam mulai");
    }
  });

  it("BR-35: rejects session when only latitude is provided without longitude", () => {
    const res = sessionFormSchema.safeParse({
      type: "TRAINING",
      title: "Latihan Rutin Selasa",
      date: "2026-04-21",
      startTime: "18:00",
      endTime: "20:00",
      venue: "WIFA SPORT CENTER",
      latitude: -7.900181586573576,
      longitude: null,
      radiusMeters: 100,
    });

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toContain("Koordinat latitude dan longitude harus diisi berpasangan");
    }
  });
});
