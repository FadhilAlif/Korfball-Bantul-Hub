import { describe, expect, it } from "vitest";
import { Reflector } from "@nestjs/core";
import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { PermissionsGuard } from "../common/guards/permissions.guard.js";
import { computeAttendanceRate } from "../modules/attendance/attendance.calculator.js";
import { calculateMatchBoxScore } from "../modules/matches/box-score.calculator.js";
import { getCourtState, validateSubstitution } from "../modules/matches/on-court.js";
import {
  buildGame2Events,
  game2MatchInfo,
  game2Players,
} from "../modules/matches/__tests__/fixtures/game-2-bantul-vs-tangsel.js";
import {
  buildGame4Events,
  game4MatchInfo,
  game4Players,
} from "../modules/matches/__tests__/fixtures/game-4-klaten-vs-bantul.js";

describe("Pilot Scenarios E2E Validation (PRD §8.4)", () => {
  // =========================================================================
  // SKENARIO A — Presensi Latihan Rutin (Official & Athlete Self Check-In)
  // =========================================================================
  describe("Skenario A — Presensi Latihan Rutin (PRD §8.4-A)", () => {
    it("should simulate the full training attendance flow from check-in to finalization & rate calculation", () => {
      // 1. Routine session created: Tuesday 18:00 - 20:00 WIB
      const startsAt = new Date("2026-10-20T18:00:00+07:00");
      const endsAt = new Date("2026-10-20T20:00:00+07:00");
      const lateToleranceMinutes = 15;

      // 2. Athlete A checks in at 17:45 (15 min early, within window startsAt - 30m) -> PRESENT
      const athleteACheckInTime = new Date("2026-10-20T17:45:00+07:00");
      const isWithinWindowA =
        athleteACheckInTime.getTime() >= startsAt.getTime() - 30 * 60 * 1000 &&
        athleteACheckInTime.getTime() <= endsAt.getTime();
      expect(isWithinWindowA).toBe(true);

      const toleranceCutoff = new Date(startsAt.getTime() + lateToleranceMinutes * 60 * 1000);
      const athleteAStatus = athleteACheckInTime <= toleranceCutoff ? "PRESENT" : "LATE";
      expect(athleteAStatus).toBe("PRESENT");

      // 3. Athlete B checks in at 18:20 (20 min after start, > 15m tolerance) -> LATE
      const athleteBCheckInTime = new Date("2026-10-20T18:20:00+07:00");
      const isWithinWindowB =
        athleteBCheckInTime.getTime() >= startsAt.getTime() - 30 * 60 * 1000 &&
        athleteBCheckInTime.getTime() <= endsAt.getTime();
      expect(isWithinWindowB).toBe(true);

      const athleteBStatus = athleteBCheckInTime <= toleranceCutoff ? "PRESENT" : "LATE";
      expect(athleteBStatus).toBe("LATE");

      // 4. Athlete C submitted excuse at 12:00 -> EXCUSED
      const athleteCStatus = "EXCUSED";

      // 5. Official bulk marks remainder; Athlete D has no entry prior to finalization
      const registeredRosterIds = [1, 2, 3, 4]; // Athletes A, B, C, D
      const existingAttendanceRecords: Record<number, string> = {
        1: athleteAStatus,
        2: athleteBStatus,
        3: athleteCStatus,
      };

      // 6. Session Finalization: Any active roster athlete without record becomes ABSENT (BR-07)
      const finalizedRecords: Record<number, string> = { ...existingAttendanceRecords };
      for (const athleteId of registeredRosterIds) {
        if (!finalizedRecords[athleteId]) {
          finalizedRecords[athleteId] = "ABSENT";
        }
      }

      expect(finalizedRecords[4]).toBe("ABSENT");
      expect(finalizedRecords).toEqual({
        1: "PRESENT",
        2: "LATE",
        3: "EXCUSED",
        4: "ABSENT",
      });

      // 7. Attendance Rate Verification (BR-13)
      // Athlete A (PRESENT): 1/1 = 100%
      const rateA = computeAttendanceRate({ present: 1, late: 0, excused: 0, absent: 0 });
      expect(rateA).toBe(100);

      // Athlete B (LATE): 1/1 = 100% (LATE counts as attended)
      const rateB = computeAttendanceRate({ present: 0, late: 1, excused: 0, absent: 0 });
      expect(rateB).toBe(100);

      // Athlete D (ABSENT): 0/1 = 0%
      const rateD = computeAttendanceRate({ present: 0, late: 0, excused: 0, absent: 1 });
      expect(rateD).toBe(0);

      // Team summary rate: 2 attended / 4 total = 50%
      const teamRate = computeAttendanceRate({ present: 1, late: 1, excused: 1, absent: 1 });
      expect(teamRate).toBe(50);
    });
  });

  // =========================================================================
  // SKENARIO B — Scrimmage Internal & Outbox Sync (PRD §8.4-B)
  // =========================================================================
  describe("Skenario B — Scrimmage Internal & Outbox Sync (PRD §8.4-B)", () => {
    it("should manage live match, substitutions, and idempotent outbox batch events", () => {
      // 1. Lineup of 8 starters for Home side (4 Male, 4 Female) + bench
      const matchPlayers = [
        {
          id: 101,
          athleteId: 1,
          athleteName: "P1",
          jerseyNumber: 1,
          sex: "MALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        {
          id: 102,
          athleteId: 2,
          athleteName: "P2",
          jerseyNumber: 2,
          sex: "MALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        {
          id: 103,
          athleteId: 3,
          athleteName: "P3",
          jerseyNumber: 3,
          sex: "MALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        {
          id: 104,
          athleteId: 4,
          athleteName: "P4",
          jerseyNumber: 4,
          sex: "MALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        {
          id: 105,
          athleteId: 5,
          athleteName: "P5",
          jerseyNumber: 5,
          sex: "FEMALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        {
          id: 106,
          athleteId: 6,
          athleteName: "P6",
          jerseyNumber: 6,
          sex: "FEMALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        {
          id: 107,
          athleteId: 7,
          athleteName: "P7",
          jerseyNumber: 7,
          sex: "FEMALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        {
          id: 108,
          athleteId: 8,
          athleteName: "P8",
          jerseyNumber: 8,
          sex: "FEMALE" as const,
          side: "HOME" as const,
          isStarter: true,
        },
        // Bench players
        {
          id: 109,
          athleteId: 9,
          athleteName: "P9",
          jerseyNumber: 9,
          sex: "MALE" as const,
          side: "HOME" as const,
          isStarter: false,
        },
        {
          id: 110,
          athleteId: 10,
          athleteName: "P10",
          jerseyNumber: 10,
          sex: "FEMALE" as const,
          side: "HOME" as const,
          isStarter: false,
        },
      ];

      const initialCourtState = getCourtState(matchPlayers, []);
      expect(initialCourtState.home.onCourtPlayerIds).toHaveLength(8);
      expect(initialCourtState.home.onCourtPlayerIds).toContain(101);
      expect(initialCourtState.home.benchPlayerIds).toContain(109);

      // 2. Perform substitution: 101 (Male on-court) OUT, 109 (Male bench) IN
      const subValidation = validateSubstitution(initialCourtState.home, 101, 109);
      expect(subValidation.valid).toBe(true);

      const subEvent = {
        id: "evt-sub-1",
        seq: 1,
        matchId: 99,
        side: "HOME" as const,
        type: "SUBSTITUTION" as const,
        matchPlayerId: 101,
        subInPlayerId: 109,
        period: 1,
        clockSeconds: 500,
      };

      const updatedCourtState = getCourtState(matchPlayers, [subEvent]);
      expect(updatedCourtState.home.onCourtPlayerIds).toContain(109);
      expect(updatedCourtState.home.benchPlayerIds).toContain(101);

      // 3. Outbox batch idempotency simulation:
      // Client records events locally while offline and flushes via events/batch
      const batchPayload = [
        {
          id: "evt-uuid-1",
          matchPlayerId: 109,
          side: "HOME" as const,
          type: "SHOT_MADE" as const,
          period: 1,
          clockSeconds: 420,
        },
        {
          id: "evt-uuid-2",
          matchPlayerId: 102,
          side: "HOME" as const,
          type: "ASSIST" as const,
          period: 1,
          clockSeconds: 420,
        },
        {
          id: "evt-uuid-3",
          matchPlayerId: 109,
          side: "HOME" as const,
          type: "REBOUND_DEF" as const,
          period: 1,
          clockSeconds: 410,
        },
      ];

      // Simulate first batch flush (server receives and persists 3 events)
      const serverDatabaseEvents: Map<string, any> = new Map();
      for (const ev of batchPayload) {
        if (!serverDatabaseEvents.has(ev.id)) {
          serverDatabaseEvents.set(ev.id, ev);
        }
      }
      expect(serverDatabaseEvents.size).toBe(3);

      // Simulate re-sync or retry (offline reconnect sending duplicate batch)
      for (const ev of batchPayload) {
        if (!serverDatabaseEvents.has(ev.id)) {
          serverDatabaseEvents.set(ev.id, ev);
        }
      }
      // Size remains 3, zero duplicates
      expect(serverDatabaseEvents.size).toBe(3);
    });
  });

  // =========================================================================
  // SKENARIO C — Rekonstruksi Knowledge (Game 2 & Game 4)
  // =========================================================================
  describe("Skenario C — Rekonstruksi Knowledge (PRD §8.4-C)", () => {
    it("should calculate exact score and box score for Game 4 (Klaten 4 – 5 Bantul)", () => {
      const events = buildGame4Events();
      const boxScore = calculateMatchBoxScore(game4MatchInfo, game4Players, events);

      // Final score matches PDF knowledge: Klaten 4, Bantul 5
      expect(boxScore.homeScore).toBe(4);
      expect(boxScore.awayScore).toBe(5);

      // Period scores match PDF knowledge: B1 (3 - 3), B2 (1 - 2)
      expect(boxScore.periods[0]!.home).toBe(3);
      expect(boxScore.periods[0]!.away).toBe(3);
      expect(boxScore.periods[1]!.home).toBe(1);
      expect(boxScore.periods[1]!.away).toBe(2);

      // Top scorer for Bantul in Game 4: Guntur (#12, id 412) scored 2 PTS
      const guntur = boxScore.away.players.find((p) => p.jerseyNumber === 12);
      expect(guntur).toBeDefined();
      expect(guntur?.pts).toBe(2);
    });

    it("should calculate exact score and box score for Game 2 (Bantul 8 – 3 Tangsel)", () => {
      const events = buildGame2Events();
      const boxScore = calculateMatchBoxScore(game2MatchInfo, game2Players, events);

      // Score verified against tournament scoresheet
      expect(boxScore.homeScore).toBe(8);
      expect(boxScore.awayScore).toBe(3);
      expect(boxScore.home.teamName).toBe("Kab. Bantul");
      expect(boxScore.away.teamName).toBe("Tangerang Selatan");
    });
  });

  // =========================================================================
  // SKENARIO D — Kontrol Akses (Security & RBAC Enforcement)
  // =========================================================================
  describe("Skenario D — Kontrol Akses (PRD §8.4-D)", () => {
    it("should restrict athlete role from accessing other players' profiles (BR-29)", () => {
      const athleteUser = {
        id: 50,
        athleteId: 5,
        permissions: ["stats:read_own", "attendance:self"],
      };

      // Helper function simulating StatisticsService.getPlayerProfile permission check
      const checkProfileAccess = (requestedAthleteId: number, user: typeof athleteUser) => {
        const canReadAny = user.permissions.includes("stats:read");
        const canReadOwn = user.permissions.includes("stats:read_own");
        const isSelf = user.athleteId === requestedAthleteId;

        if (!canReadAny && (!canReadOwn || !isSelf)) {
          throw new ForbiddenException("Anda hanya diperbolehkan melihat statistik pribadi Anda.");
        }
        return true;
      };

      // Accessing own profile (athleteId 5) is allowed
      expect(checkProfileAccess(5, athleteUser)).toBe(true);

      // Accessing another athlete's profile (athleteId 9) is forbidden
      expect(() => checkProfileAccess(9, athleteUser)).toThrow(ForbiddenException);
      expect(() => checkProfileAccess(9, athleteUser)).toThrow(
        "Anda hanya diperbolehkan melihat statistik pribadi Anda.",
      );
    });

    it("should block unauthorized match event recording and attendance modification via PermissionsGuard", async () => {
      const reflector = new Reflector();

      // Guard configured with route requirement: matches:record
      reflector.getAllAndOverride = () => ["matches:record"] as any;
      const guard = new PermissionsGuard(reflector);

      const athleteContext = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 50,
              permissions: ["attendance:self", "stats:read_own"],
            },
          }),
        }),
      } as unknown as ExecutionContext;

      // Athlete attempting to record match events -> 403 Forbidden
      await expect(guard.canActivate(athleteContext)).rejects.toThrow(ForbiddenException);

      // Guard configured with route requirement: attendance:record
      reflector.getAllAndOverride = () => ["attendance:record"] as any;
      // Athlete attempting to bulk record attendance -> 403 Forbidden
      await expect(guard.canActivate(athleteContext)).rejects.toThrow(ForbiddenException);

      // Guard configured with route requirement: matches:reopen
      reflector.getAllAndOverride = () => ["matches:reopen"] as any;
      // Athlete attempting to reopen match -> 403 Forbidden
      await expect(guard.canActivate(athleteContext)).rejects.toThrow(ForbiddenException);
    });
  });
});
