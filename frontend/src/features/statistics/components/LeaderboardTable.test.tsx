import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlayerLeaderboardItem } from "../types";
import { LeaderboardTable } from "./LeaderboardTable";

const mockPlayers: PlayerLeaderboardItem[] = [
  {
    athleteId: 1,
    athleteName: "Budi Santoso",
    nickname: "Budi",
    sex: "MALE",
    sexLabel: "L",
    jerseyNumber: 10,
    teamId: 1,
    teamName: "Korfball Bantul",
    gp: 3,
    pts: 12,
    ppg: 4.0,
    sm: 6,
    sa: 10,
    pctFgs: 60.0,
    pctFgsFormatted: "60.0%",
    rim: 3,
    ria: 5,
    pctFgr: 60.0,
    pctFgrFormatted: "60.0%",
    pm: 3,
    pa: 4,
    pctP: 75.0,
    pctPFormatted: "75.0%",
    pctFgTotal: 63.2,
    pctFgTotalFormatted: "63.2%",
    dr: 8,
    or: 4,
    tot: 12,
    rpg: 4.0,
    d: 3,
    as: 5,
    apg: 1.7,
    it: 4,
    tov: 2,
    f: 3,
    yc: 0,
    rc: 0,
    eff: 22,
    epg: 7.3,
  },
  {
    athleteId: 2,
    athleteName: "Rukmi Wijaya",
    nickname: "Rukmi",
    sex: "FEMALE",
    sexLabel: "P",
    jerseyNumber: 7,
    teamId: 1,
    teamName: "Korfball Bantul",
    gp: 3,
    pts: 9,
    ppg: 3.0,
    sm: 4,
    sa: 8,
    pctFgs: 50.0,
    pctFgsFormatted: "50.0%",
    rim: 2,
    ria: 4,
    pctFgr: 50.0,
    pctFgrFormatted: "50.0%",
    pm: 3,
    pa: 3,
    pctP: 100.0,
    pctPFormatted: "100.0%",
    pctFgTotal: 60.0,
    pctFgTotalFormatted: "60.0%",
    dr: 5,
    or: 2,
    tot: 7,
    rpg: 2.3,
    d: 2,
    as: 3,
    apg: 1.0,
    it: 2,
    tov: 1,
    f: 2,
    yc: 0,
    rc: 0,
    eff: 15,
    epg: 5.0,
  },
];

describe("LeaderboardTable", () => {
  it("renders player names, jersey numbers, and points correctly", () => {
    const onSort = vi.fn();
    render(<LeaderboardTable players={mockPlayers} sortField="pts" sortDirection="desc" onSort={onSort} />);

    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getAllByText("12").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Rukmi")).toBeInTheDocument();
    expect(screen.getByText("#7")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("calls onSort callback when clicking on a column header", () => {
    const onSort = vi.fn();
    render(<LeaderboardTable players={mockPlayers} sortField="pts" sortDirection="desc" onSort={onSort} />);

    const effHeader = screen.getByText("EFF");
    fireEvent.click(effHeader);

    expect(onSort).toHaveBeenCalledWith("eff");
  });

  it("renders empty state when players list is empty", () => {
    const onSort = vi.fn();
    render(<LeaderboardTable players={[]} sortField="pts" sortDirection="desc" onSort={onSort} />);

    expect(screen.getByText("Tidak ada data pemain untuk filter ini.")).toBeInTheDocument();
  });
});
