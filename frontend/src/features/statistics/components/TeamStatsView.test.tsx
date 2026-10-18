import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TeamStatsSummary } from "../types";
import { TeamStatsView } from "./TeamStatsView";

const mockTeamStats: TeamStatsSummary = {
  team: {
    id: 1,
    name: "Korfball Bantul",
    shortName: "Bantul",
    isInternal: true,
    region: "Bantul, DIY",
  },
  overall: {
    matchesPlayed: 4,
    wins: 3,
    losses: 1,
    draws: 0,
    winRate: 75.0,
    goalsFor: 32,
    goalsAgainst: 22,
    goalDifference: 10,
    gfPerGame: 8.0,
    gaPerGame: 5.5,
  },
  scrimmageInternal: {
    matchesPlayed: 1,
  },
  shooting: {
    sm: 18,
    sa: 36,
    pctFgs: 50.0,
    rim: 8,
    ria: 16,
    pctFgr: 50.0,
    pm: 6,
    pa: 8,
    pctP: 75.0,
    totalMade: 32,
    totalAttempts: 60,
    pctFgTotal: 53.3,
  },
  totals: {
    dr: 24,
    or: 12,
    tot: 36,
    d: 14,
    as: 18,
    it: 10,
    tov: 8,
    tovt: 2,
    totalTov: 10,
    f: 12,
    yc: 1,
    rc: 0,
    eff: 68,
  },
};

describe("TeamStatsView", () => {
  it("renders team name, W-L-D record, and win rate correctly", () => {
    render(<TeamStatsView stats={mockTeamStats} />);

    expect(screen.getByText("Korfball Bantul")).toBeInTheDocument();
    expect(screen.getByText("Tim Internal")).toBeInTheDocument();
    expect(screen.getByText("3M")).toBeInTheDocument();
    expect(screen.getByText("1K")).toBeInTheDocument();
    expect(screen.getByText("0S")).toBeInTheDocument();
    expect(screen.getAllByText(/75\.0%/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("32:22")).toBeInTheDocument();
  });

  it("renders shooting and action totals", () => {
    render(<TeamStatsView stats={mockTeamStats} />);

    expect(screen.getByText("53.3%")).toBeInTheDocument();
    expect(screen.getByText("Total EFF 68")).toBeInTheDocument();
    expect(screen.getByText("1 Kuning")).toBeInTheDocument();
    expect(screen.getByText("0 Merah")).toBeInTheDocument();
  });
});
