import { describe, expect, it } from "vitest";
import { calculateMatchBoxScore, calculatePlayerEff, formatClock, formatPercentage } from "../box-score.calculator.js";
import { getCourtState, isPlayerEligibleForEvent, validateSubstitution } from "../on-court.js";
import { buildGame2Events, game2MatchInfo, game2Players } from "./fixtures/game-2-bantul-vs-tangsel.js";
import { buildGame4Events, game4MatchInfo, game4Players } from "./fixtures/game-4-klaten-vs-bantul.js";

describe("BoxScoreCalculator - Helpers", () => {
  it("formats clock seconds into mm:ss", () => {
    expect(formatClock(1500)).toBe("25:00");
    expect(formatClock(296)).toBe("04:56");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(-10)).toBe("00:00");
  });

  it("calculates formatted and numeric percentages", () => {
    expect(formatPercentage(1, 2)).toEqual({ value: 50, formatted: "50%" });
    expect(formatPercentage(2, 22)).toEqual({ value: 9.1, formatted: "9%" });
    expect(formatPercentage(0, 0)).toEqual({ value: 0, formatted: "-" });
    expect(formatPercentage(3, 7)).toEqual({ value: 42.9, formatted: "43%" });
  });

  it("calculates individual player EFF accurately", () => {
    // Rukmi (Game 2): SM 1/2, RIM 0/1, PM 1/2, TOT 3, AS 0, IT 2, D 0, TOV 1
    // positive = 1 + 0 + 1 + 3 + 0 + 2 + 0 = 7
    // missed = (2-1) + (1-0) + (2-1) = 3
    // eff = 7 - 3 - 1 = 3
    const effRukmi = calculatePlayerEff({
      sm: 1,
      sa: 2,
      rim: 0,
      ria: 1,
      pm: 1,
      pa: 2,
      tot: 3,
      as: 0,
      it: 2,
      d: 0,
      tov: 1,
    });
    expect(effRukmi).toBe(3);

    // Prastama (Game 4): SA 9 (0 made), PA 1 (0 made), TOT 4, AS 1, IT 0, D 0, TOV 4
    // positive = 0 + 0 + 0 + 4 + 1 + 0 + 0 = 5
    // missed = 9 + 0 + 1 = 10
    // eff = 5 - 10 - 4 = -9
    const effPrastama = calculatePlayerEff({
      sm: 0,
      sa: 9,
      rim: 0,
      ria: 0,
      pm: 0,
      pa: 1,
      tot: 4,
      as: 1,
      it: 0,
      d: 0,
      tov: 4,
    });
    expect(effPrastama).toBe(-9);
  });
});

describe("BoxScoreCalculator - Game 2: Kab. Bantul vs Tangerang Selatan (PDF Match)", () => {
  const events = buildGame2Events();
  const boxScore = calculateMatchBoxScore(game2MatchInfo, game2Players, events);

  it("calculates exact final scores and period scores", () => {
    expect(boxScore.homeScore).toBe(8);
    expect(boxScore.awayScore).toBe(3);

    expect(boxScore.periods).toHaveLength(2);
    // Period 1: Bantul 4, Tangsel 3
    expect(boxScore.periods[0]).toEqual({
      period: 1,
      periodLabel: "B1",
      home: 4,
      away: 3,
    });
    // Period 2: Bantul 4, Tangsel 0
    expect(boxScore.periods[1]).toEqual({
      period: 2,
      periodLabel: "B2",
      home: 4,
      away: 0,
    });
  });

  it("calculates exact Kab. Bantul team totals matching PDF knowledge", () => {
    const home = boxScore.home;
    expect(home.teamName).toBe("Kab. Bantul");
    expect(home.sm).toBe(2);
    expect(home.sa).toBe(25);
    expect(home.pctFgsFormatted).toBe("8%");

    expect(home.rim).toBe(3);
    expect(home.ria).toBe(8);
    expect(home.pctFgrFormatted).toBe("38%");

    expect(home.pm).toBe(3);
    expect(home.pa).toBe(6);
    expect(home.pctPFormatted).toBe("50%");

    expect(home.dr).toBe(7);
    expect(home.or).toBe(11);
    expect(home.tot).toBe(18);

    expect(home.d).toBe(1);
    expect(home.as).toBe(4);
    expect(home.it).toBe(12);
    expect(home.tov).toBe(6);
    expect(home.f).toBe(2);
    expect(home.yc).toBe(0);
    expect(home.rc).toBe(0);
    expect(home.pts).toBe(8);
  });

  it("calculates exact Tangerang Selatan team totals matching PDF knowledge", () => {
    const away = boxScore.away;
    expect(away.teamName).toBe("Tangerang Selatan");
    expect(away.sm).toBe(2);
    expect(away.sa).toBe(12);
    expect(away.pctFgsFormatted).toBe("17%");

    expect(away.rim).toBe(0);
    expect(away.ria).toBe(4);
    expect(away.pctFgrFormatted).toBe("0%");

    expect(away.pm).toBe(1);
    expect(away.pa).toBe(2);
    expect(away.pctPFormatted).toBe("50%");

    expect(away.dr).toBe(10);
    expect(away.or).toBe(3);
    expect(away.tot).toBe(13);

    expect(away.d).toBe(0);
    expect(away.as).toBe(0);
    expect(away.it).toBe(6);
    expect(away.tov).toBe(18);
    expect(away.tovt).toBe(1); // Team Turnover
    expect(away.f).toBe(7);
    expect(away.pts).toBe(3);
  });

  it("verifies individual player statistics for Game 2", () => {
    const rukmi = boxScore.home.players.find((p) => p.athleteName === "Rukmi");
    expect(rukmi).toBeDefined();
    expect(rukmi?.sm).toBe(1);
    expect(rukmi?.sa).toBe(2);
    expect(rukmi?.pctFgsFormatted).toBe("50%");
    expect(rukmi?.rim).toBe(0);
    expect(rukmi?.ria).toBe(1);
    expect(rukmi?.pm).toBe(1);
    expect(rukmi?.pa).toBe(2);
    expect(rukmi?.dr).toBe(3);
    expect(rukmi?.tot).toBe(3);
    expect(rukmi?.it).toBe(2);
    expect(rukmi?.tov).toBe(1);
    expect(rukmi?.f).toBe(1);
    expect(rukmi?.eff).toBe(3);

    const dimas = boxScore.home.players.find((p) => p.athleteName === "Dimas");
    expect(dimas).toBeDefined();
    expect(dimas?.sm).toBe(1);
    expect(dimas?.sa).toBe(3);
    expect(dimas?.pctFgsFormatted).toBe("33%");
    expect(dimas?.dr).toBe(1);
    expect(dimas?.or).toBe(2);
    expect(dimas?.tot).toBe(3);
    expect(dimas?.it).toBe(1);
    expect(dimas?.tov).toBe(2);
    expect(dimas?.eff).toBe(1);

    const fevy = boxScore.away.players.find((p) => p.athleteName === "Fevy");
    expect(fevy).toBeDefined();
    expect(fevy?.sm).toBe(1);
    expect(fevy?.sa).toBe(1);
    expect(fevy?.pctFgsFormatted).toBe("100%");
    expect(fevy?.ria).toBe(1);
    expect(fevy?.pa).toBe(1);
    expect(fevy?.it).toBe(1);
    expect(fevy?.tov).toBe(2);
    expect(fevy?.eff).toBe(-2);
  });
});

describe("BoxScoreCalculator - Game 4: Kab Klaten vs Kab. Bantul (PDF Match)", () => {
  const events = buildGame4Events();
  const boxScore = calculateMatchBoxScore(game4MatchInfo, game4Players, events);

  it("calculates exact final scores and period scores", () => {
    expect(boxScore.homeScore).toBe(4);
    expect(boxScore.awayScore).toBe(5);

    expect(boxScore.periods).toHaveLength(2);
    // Period 1: Klaten 3, Bantul 3
    expect(boxScore.periods[0]).toEqual({
      period: 1,
      periodLabel: "B1",
      home: 3,
      away: 3,
    });
    // Period 2: Klaten 1, Bantul 2
    expect(boxScore.periods[1]).toEqual({
      period: 2,
      periodLabel: "B2",
      home: 1,
      away: 2,
    });
  });

  it("calculates exact Kab Klaten team totals matching PDF knowledge", () => {
    const home = boxScore.home;
    expect(home.teamName).toBe("Kab Klaten");
    expect(home.sm).toBe(3);
    expect(home.sa).toBe(23);
    expect(home.pctFgsFormatted).toBe("13%");

    expect(home.rim).toBe(1);
    expect(home.ria).toBe(5);
    expect(home.pctFgrFormatted).toBe("20%");

    expect(home.pm).toBe(0);
    expect(home.pa).toBe(1);
    expect(home.pctPFormatted).toBe("0%");

    expect(home.dr).toBe(16);
    expect(home.or).toBe(10);
    expect(home.tot).toBe(26);

    expect(home.d).toBe(2);
    expect(home.as).toBe(2);
    expect(home.it).toBe(0);
    expect(home.tov).toBe(13);
    expect(home.f).toBe(6);
    expect(home.pts).toBe(4);
  });

  it("calculates exact Kab. Bantul team totals matching PDF knowledge", () => {
    const away = boxScore.away;
    expect(away.teamName).toBe("Kab. Bantul");
    expect(away.sm).toBe(3);
    expect(away.sa).toBe(49);
    expect(away.pctFgsFormatted).toBe("6%");

    expect(away.rim).toBe(2);
    expect(away.ria).toBe(4);
    expect(away.pctFgrFormatted).toBe("50%");

    expect(away.pm).toBe(0);
    expect(away.pa).toBe(4);
    expect(away.pctPFormatted).toBe("0%");

    expect(away.dr).toBe(13);
    expect(away.or).toBe(30);
    expect(away.tot).toBe(43);

    expect(away.d).toBe(2);
    expect(away.as).toBe(4);
    expect(away.it).toBe(3);
    expect(away.tov).toBe(6);
    expect(away.f).toBe(9);
    expect(away.pts).toBe(5);
  });

  it("verifies substitution logs matching PDF", () => {
    expect(boxScore.logs).toHaveLength(3);
    expect(boxScore.logs[0]!.description).toBe("Substitusi Kab. Bantul — keluar #13 Viki, masuk #1 Rukmi");
    expect(boxScore.logs[0]!.periodLabel).toBe("B1");
    expect(boxScore.logs[0]!.clockFormatted).toBe("04:56");

    expect(boxScore.logs[1]!.description).toBe("Substitusi Kab Klaten — keluar #6 Bayu, masuk #22 Elness");
    expect(boxScore.logs[1]!.periodLabel).toBe("B2");
    expect(boxScore.logs[1]!.clockFormatted).toBe("05:34");

    expect(boxScore.logs[2]!.description).toBe("Substitusi Kab Klaten — keluar #10 Nugraha, masuk #6 Bayu");
    expect(boxScore.logs[2]!.periodLabel).toBe("B2");
    expect(boxScore.logs[2]!.clockFormatted).toBe("03:33");
  });
});

describe("OnCourtTracker", () => {
  it("tracks starters and substitutions correctly", () => {
    const events = buildGame4Events();
    const courtState = getCourtState(game4Players, events);

    // Initial starters for Bantul: Maya, Ririn, Dimas, Thea, Guntur, Viki, Rakha, Putra (8 starters)
    // Viki (#13, id 413) substituted out for Rukmi (#1, id 401)
    expect(courtState.away.onCourtPlayerIds).toContain(401); // Rukmi now on court
    expect(courtState.away.benchPlayerIds).toContain(413); // Viki now on bench

    // Klaten: Bayu (#6, id 304) subbed out for Elness (#22, id 313), then Nugraha (#10, id 307) subbed out for Bayu (#6)
    expect(courtState.home.onCourtPlayerIds).toContain(304); // Bayu back on court
    expect(courtState.home.onCourtPlayerIds).toContain(313); // Elness on court
    expect(courtState.home.benchPlayerIds).toContain(307); // Nugraha on bench
  });

  it("validates valid and invalid substitutions (BR-22)", () => {
    const events = buildGame4Events();
    const courtState = getCourtState(game4Players, events);

    // Currently Rukmi (id 401) is on court, Viki (id 413) is on bench
    const validSub = validateSubstitution(courtState.away, 401, 413);
    expect(validSub.valid).toBe(true);

    // Invalid: both are on bench or out player is not on court
    const invalidSub = validateSubstitution(courtState.away, 413, 402);
    expect(invalidSub.valid).toBe(false);
    expect(invalidSub.error).toContain("harus sedang berada di lapangan");
  });

  it("handles red cards and prevents disqualified players from events (BR-23)", () => {
    const players = [...game2Players];
    const events = [
      ...buildGame2Events(),
      {
        id: "rc-1",
        seq: 9999,
        matchId: 1,
        side: "HOME" as const,
        type: "RED_CARD" as const,
        matchPlayerId: 101, // Rukmi
        period: 2,
        clockSeconds: 100,
      },
    ];

    const courtState = getCourtState(players, events);
    expect(courtState.home.redCardPlayerIds).toContain(101);
    expect(courtState.home.onCourtPlayerIds).not.toContain(101);

    const eligibility = isPlayerEligibleForEvent(courtState.home, 101);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.error).toContain("kartu merah");
  });
});
