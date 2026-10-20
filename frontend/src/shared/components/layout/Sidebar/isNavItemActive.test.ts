import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./isNavItemActive";

describe("isNavItemActive", () => {
  const sampleHrefs = [
    "/dashboard",
    "/sessions",
    "/attendance/me",
    "/attendance/summary",
    "/matches",
    "/stats",
    "/stats/me",
    "/athletes",
    "/teams",
    "/users",
    "/roles",
    "/permissions",
  ];

  it("activates /stats only when on /stats, not when on /stats/me", () => {
    expect(isNavItemActive("/stats", "/stats", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/stats/me", "/stats", sampleHrefs)).toBe(false);

    expect(isNavItemActive("/stats", "/stats/me", sampleHrefs)).toBe(false);
    expect(isNavItemActive("/stats/me", "/stats/me", sampleHrefs)).toBe(true);
  });

  it("activates /stats on subroute /stats/players/1", () => {
    expect(isNavItemActive("/stats", "/stats/players/1", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/stats/me", "/stats/players/1", sampleHrefs)).toBe(false);
  });

  it("activates /dashboard only on exact /dashboard match", () => {
    expect(isNavItemActive("/dashboard", "/dashboard", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/dashboard", "/dashboard/settings", sampleHrefs)).toBe(false);
  });

  it("activates /matches on nested routes", () => {
    expect(isNavItemActive("/matches", "/matches", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/matches", "/matches/9", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/matches", "/matches/9/report", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/matches", "/matches/new", sampleHrefs)).toBe(true);
  });

  it("differentiates attendance subroutes properly", () => {
    expect(isNavItemActive("/attendance/me", "/attendance/me", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/attendance/summary", "/attendance/me", sampleHrefs)).toBe(false);
    expect(isNavItemActive("/sessions", "/attendance/me", sampleHrefs)).toBe(false);

    expect(isNavItemActive("/attendance/summary", "/attendance/summary", sampleHrefs)).toBe(true);
    expect(isNavItemActive("/attendance/me", "/attendance/summary", sampleHrefs)).toBe(false);
  });
});
