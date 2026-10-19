import { randomUUID } from "node:crypto";
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, count, desc, eq, gt, gte, inArray, isNull, lte, or } from "drizzle-orm";
import type { DrizzleDatabase } from "../../database/connection.js";
import { DRIZZLE_DB } from "../../database/database.module.js";
import {
  type MatchEventType,
  athletes,
  matchEvents,
  matchPlayers,
  matches,
  teams,
} from "../../database/schema/index.js";
import {
  type CalculatorEvent,
  type CalculatorMatchInfo,
  type CalculatorPlayer,
  type MatchBoxScore,
  calculateMatchBoxScore,
} from "./box-score.calculator.js";
import { parseWibDateRange } from "../sessions/sessions.utils.js";
import { buildMatchReportWorkbook } from "./matches.exporter.js";
import type {
  BatchEventsInput,
  ClockPatchInput,
  CreateMatchInput,
  ListMatchesQuery,
  SetLineupInput,
  StartMatchInput,
  UpdateEventInput,
  UpdateMatchInput,
} from "./matches.schemas.js";
import { getCourtState, isPlayerEligibleForEvent, validateSubstitution } from "./on-court.js";

const GOAL_EVENT_TYPES: MatchEventType[] = ["SHOT_MADE", "RUNNING_IN_MADE", "PENALTY_MADE"];

@Injectable()
export class MatchesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {}

  /**
   * Lists matches with pagination, filters, and team summaries.
   */
  async listMatches(query: Partial<ListMatchesQuery> = {}) {
    const page = query.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query.limit ? Math.max(1, Math.min(100, Number(query.limit))) : 20;
    const conditions = [isNull(matches.deletedAt)];

    if (query.teamId !== undefined) {
      const tid = Number(query.teamId);
      conditions.push(or(eq(matches.homeTeamId, tid), eq(matches.awayTeamId, tid))!);
    }

    if (query.type) {
      conditions.push(eq(matches.type, query.type));
    }

    if (query.format) {
      conditions.push(eq(matches.format, query.format));
    }

    if (query.status) {
      conditions.push(eq(matches.status, query.status));
    }

    const { fromDate, toDate } = parseWibDateRange(query.from, query.to);
    if (fromDate) {
      conditions.push(gte(matches.scheduledAt, fromDate));
    }

    if (toDate) {
      conditions.push(lte(matches.scheduledAt, toDate));
    }

    const whereClause = and(...conditions);

    const [totalRes] = await this.db.select({ count: count() }).from(matches).where(whereClause);
    const total = Number(totalRes?.count ?? 0);

    const rows = await this.db
      .select({
        id: matches.id,
        type: matches.type,
        format: matches.format,
        homeTeamId: matches.homeTeamId,
        awayTeamId: matches.awayTeamId,
        homeLabel: matches.homeLabel,
        awayLabel: matches.awayLabel,
        homeColor: matches.homeColor,
        awayColor: matches.awayColor,
        competition: matches.competition,
        gameNumber: matches.gameNumber,
        venue: matches.venue,
        scheduledAt: matches.scheduledAt,
        periodCount: matches.periodCount,
        periodDurationMinutes: matches.periodDurationMinutes,
        trackShotZone: matches.trackShotZone,
        status: matches.status,
        currentPeriod: matches.currentPeriod,
        clockRemainingSeconds: matches.clockRemainingSeconds,
        clockRunningSince: matches.clockRunningSince,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        homeHeadCoach: matches.homeHeadCoach,
        awayHeadCoach: matches.awayHeadCoach,
        createdAt: matches.createdAt,
        updatedAt: matches.updatedAt,
      })
      .from(matches)
      .where(whereClause)
      .orderBy(desc(matches.scheduledAt), desc(matches.id))
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch team names
    const teamIds = new Set<number>();
    for (const r of rows) {
      teamIds.add(r.homeTeamId);
      teamIds.add(r.awayTeamId);
    }

    const teamMap = new Map<number, string>();
    if (teamIds.size > 0) {
      const teamRows = await this.db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(inArray(teams.id, Array.from(teamIds)));
      for (const t of teamRows) {
        teamMap.set(t.id, t.name);
      }
    }

    const items = rows.map((r) => ({
      ...r,
      homeTeamName: r.homeLabel || teamMap.get(r.homeTeamId) || `Tim #${r.homeTeamId}`,
      awayTeamName: r.awayLabel || teamMap.get(r.awayTeamId) || `Tim #${r.awayTeamId}`,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves match detail by ID, including lineup and current court state.
   */
  async getMatch(id: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, id), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match dengan ID ${id} tidak ditemukan.`);
    }

    const [homeTeam] = await this.db
      .select({ id: teams.id, name: teams.name, isInternal: teams.isInternal })
      .from(teams)
      .where(eq(teams.id, match.homeTeamId));

    const [awayTeam] = await this.db
      .select({ id: teams.id, name: teams.name, isInternal: teams.isInternal })
      .from(teams)
      .where(eq(teams.id, match.awayTeamId));

    // Load lineup with athlete info
    const lineupRows = await this.db
      .select({
        id: matchPlayers.id,
        matchId: matchPlayers.matchId,
        athleteId: matchPlayers.athleteId,
        side: matchPlayers.side,
        jerseyNumber: matchPlayers.jerseyNumber,
        isStarter: matchPlayers.isStarter,
        athleteName: athletes.fullName,
        athleteNickname: athletes.nickname,
        sex: athletes.sex,
        status: athletes.status,
      })
      .from(matchPlayers)
      .innerJoin(athletes, eq(matchPlayers.athleteId, athletes.id))
      .where(eq(matchPlayers.matchId, id))
      .orderBy(matchPlayers.side, matchPlayers.jerseyNumber);

    // Load active events for court state derivation
    const activeEvents = await this.db
      .select({
        id: matchEvents.id,
        seq: matchEvents.seq,
        matchId: matchEvents.matchId,
        side: matchEvents.side,
        type: matchEvents.type,
        matchPlayerId: matchEvents.matchPlayerId,
        subInPlayerId: matchEvents.subInPlayerId,
        period: matchEvents.period,
        clockSeconds: matchEvents.clockSeconds,
        deletedAt: matchEvents.deletedAt,
      })
      .from(matchEvents)
      .where(and(eq(matchEvents.matchId, id), isNull(matchEvents.deletedAt)))
      .orderBy(matchEvents.seq);

    const calcPlayers: CalculatorPlayer[] = lineupRows.map((lp) => ({
      id: lp.id,
      athleteId: lp.athleteId,
      athleteName: lp.athleteName,
      sex: lp.sex,
      jerseyNumber: lp.jerseyNumber,
      side: lp.side,
      isStarter: lp.isStarter,
    }));

    const courtState = getCourtState(calcPlayers, activeEvents as CalculatorEvent[]);

    return {
      ...match,
      homeTeamName: match.homeLabel || homeTeam?.name || `Tim #${match.homeTeamId}`,
      awayTeamName: match.awayLabel || awayTeam?.name || `Tim #${match.awayTeamId}`,
      homeTeam,
      awayTeam,
      lineup: lineupRows,
      players: lineupRows,
      courtState,
    };
  }

  /**
   * Creates a new match.
   */
  async createMatch(input: CreateMatchInput, userId: number) {
    if (input.homeTeamId === input.awayTeamId && input.type !== "SCRIMMAGE") {
      throw new BadRequestException("Tim Home dan Away tidak boleh sama kecuali untuk tipe SCRIMMAGE.");
    }

    const [homeTeam] = await this.db.select({ id: teams.id }).from(teams).where(eq(teams.id, input.homeTeamId));
    if (!homeTeam) {
      throw new NotFoundException(`Tim Home #${input.homeTeamId} tidak ditemukan.`);
    }

    const [awayTeam] = await this.db.select({ id: teams.id }).from(teams).where(eq(teams.id, input.awayTeamId));
    if (!awayTeam) {
      throw new NotFoundException(`Tim Away #${input.awayTeamId} tidak ditemukan.`);
    }

    const [created] = await this.db
      .insert(matches)
      .values({
        type: input.type,
        format: input.format,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        homeLabel: input.homeLabel,
        awayLabel: input.awayLabel,
        homeColor: input.homeColor,
        awayColor: input.awayColor,
        competition: input.competition,
        gameNumber: input.gameNumber,
        venue: input.venue,
        scheduledAt: new Date(input.scheduledAt),
        periodCount: input.periodCount,
        periodDurationMinutes: input.periodDurationMinutes,
        trackShotZone: input.trackShotZone,
        status: "SCHEDULED",
        currentPeriod: 1,
        clockRemainingSeconds: input.periodDurationMinutes * 60,
        homeScore: 0,
        awayScore: 0,
        juryChair: input.juryChair,
        juryMembers: input.juryMembers,
        referees: input.referees,
        homeHeadCoach: input.homeHeadCoach,
        homeAssistantCoach: input.homeAssistantCoach,
        awayHeadCoach: input.awayHeadCoach,
        awayAssistantCoach: input.awayAssistantCoach,
        sessionId: input.sessionId,
        notes: input.notes,
        createdBy: userId,
      })
      .returning();

    return created;
  }

  /**
   * Updates match details.
   */
  async updateMatch(id: number, input: UpdateMatchInput, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, id), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match dengan ID ${id} tidak ditemukan.`);
    }

    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai. Buka kembali match terlebih dahulu untuk mengedit.");
    }

    const newHomeTeamId = input.homeTeamId ?? match.homeTeamId;
    const newAwayTeamId = input.awayTeamId ?? match.awayTeamId;
    const newType = input.type ?? match.type;

    if (newHomeTeamId === newAwayTeamId && newType !== "SCRIMMAGE") {
      throw new BadRequestException("Tim Home dan Away tidak boleh sama kecuali untuk tipe SCRIMMAGE.");
    }

    const [updated] = await this.db
      .update(matches)
      .set({
        ...input,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id))
      .returning();

    return updated;
  }

  /**
   * Deletes a match (soft delete).
   */
  async deleteMatch(id: number, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, id), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match dengan ID ${id} tidak ditemukan.`);
    }

    // Check if match has events
    const [eventCountRes] = await this.db
      .select({ count: count() })
      .from(matchEvents)
      .where(eq(matchEvents.matchId, id));

    if (Number(eventCountRes?.count ?? 0) > 0) {
      throw new ConflictException("Match memiliki riwayat event dan tidak dapat dihapus.");
    }

    if (match.status === "LIVE" || match.status === "FINISHED") {
      throw new ConflictException("Hanya match dengan status SCHEDULED atau CANCELLED yang dapat dihapus.");
    }

    await this.db.update(matches).set({ deletedAt: new Date() }).where(eq(matches.id, id));

    return { success: true, message: `Match #${id} berhasil dihapus.` };
  }

  /**
   * Sets lineup for a given side (HOME or AWAY).
   */
  async setLineup(id: number, input: SetLineupInput, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, id), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match dengan ID ${id} tidak ditemukan.`);
    }

    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai. Buka kembali match terlebih dahulu.");
    }

    const targetTeamId = input.side === "HOME" ? match.homeTeamId : match.awayTeamId;
    const athleteIds = input.players.map((p) => p.athleteId);

    // Verify all athletes belong to target team and internal athletes are ACTIVE
    const athleteRows = await this.db
      .select({
        id: athletes.id,
        teamId: athletes.teamId,
        status: athletes.status,
        fullName: athletes.fullName,
      })
      .from(athletes)
      .where(inArray(athletes.id, athleteIds));

    const athleteMap = new Map<number, (typeof athleteRows)[0]>();
    for (const a of athleteRows) {
      athleteMap.set(a.id, a);
    }

    for (const p of input.players) {
      const athlete = athleteMap.get(p.athleteId);
      if (!athlete) {
        throw new NotFoundException(`Atlet #${p.athleteId} tidak ditemukan.`);
      }
      if (athlete.teamId !== targetTeamId) {
        throw new BadRequestException(`Atlet "${athlete.fullName}" bukan anggota tim sisi ${input.side}.`);
      }
    }

    // Check if any athlete is on the opposite side
    const oppositeSide = input.side === "HOME" ? "AWAY" : "HOME";
    const oppositePlayers = await this.db
      .select({ athleteId: matchPlayers.athleteId })
      .from(matchPlayers)
      .where(and(eq(matchPlayers.matchId, id), eq(matchPlayers.side, oppositeSide)));

    const oppositeAthleteIds = new Set(oppositePlayers.map((p) => p.athleteId));
    for (const p of input.players) {
      if (oppositeAthleteIds.has(p.athleteId)) {
        const athlete = athleteMap.get(p.athleteId);
        throw new ConflictException(
          `Atlet "${athlete?.fullName || p.athleteId}" sudah terdaftar di sisi lawan (${oppositeSide}).`,
        );
      }
    }

    // Replace side lineup inside transaction
    await this.db.transaction(async (tx) => {
      await tx.delete(matchPlayers).where(and(eq(matchPlayers.matchId, id), eq(matchPlayers.side, input.side)));

      await tx.insert(matchPlayers).values(
        input.players.map((p) => ({
          matchId: id,
          athleteId: p.athleteId,
          side: input.side,
          jerseyNumber: p.jerseyNumber,
          isStarter: p.isStarter,
        })),
      );
    });

    return this.getMatch(id);
  }

  /**
   * Starts match (status SCHEDULED -> LIVE, starts Period 1).
   */
  async startMatch(id: number, input: StartMatchInput, userId: number) {
    const match = await this.getMatch(id);

    if (match.status === "LIVE") {
      return match;
    }
    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai.");
    }

    // BR-18: Validate starter composition
    const homeStarters = match.lineup.filter((p) => p.side === "HOME" && p.isStarter);
    const awayStarters = match.lineup.filter((p) => p.side === "AWAY" && p.isStarter);

    const validateStarters = (starters: typeof homeStarters, sideLabel: string) => {
      const maleCount = starters.filter((p) => p.sex === "MALE").length;
      const femaleCount = starters.filter((p) => p.sex === "FEMALE").length;

      if (match.format === "K8") {
        if (maleCount !== 4 || femaleCount !== 4) {
          return `Sisi ${sideLabel} memiliki ${maleCount}L / ${femaleCount}P (K8 wajib 4L dan 4P).`;
        }
      } else if (match.format === "K4") {
        if (maleCount !== 2 || femaleCount !== 2) {
          return `Sisi ${sideLabel} memiliki ${maleCount}L / ${femaleCount}P (K4 wajib 2L dan 2P).`;
        }
      }
      return null;
    };

    const homeErr = validateStarters(homeStarters, "HOME");
    const awayErr = validateStarters(awayStarters, "AWAY");

    if (homeErr || awayErr) {
      const errMsg = [homeErr, awayErr].filter(Boolean).join(" ");
      if (match.type === "OFFICIAL") {
        throw new BadRequestException(`Komposisi starter tidak valid untuk pertandingan OFFICIAL: ${errMsg}`);
      }
      if (!input.force) {
        throw new BadRequestException(
          `Peringatan komposisi starter: ${errMsg} Kirimkan force: true untuk melanjutkan.`,
        );
      }
    }

    const durationSeconds = match.periodDurationMinutes * 60;
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await tx
        .update(matches)
        .set({
          status: "LIVE",
          currentPeriod: 1,
          clockRemainingSeconds: durationSeconds,
          clockRunningSince: now,
          updatedAt: now,
        })
        .where(eq(matches.id, id));

      // Emit PERIOD_START for period 1 if not exists
      const [existingPeriodStart] = await tx
        .select({ id: matchEvents.id })
        .from(matchEvents)
        .where(
          and(
            eq(matchEvents.matchId, id),
            eq(matchEvents.type, "PERIOD_START"),
            eq(matchEvents.period, 1),
            isNull(matchEvents.deletedAt),
          ),
        );

      if (!existingPeriodStart) {
        await tx.insert(matchEvents).values({
          id: randomUUID(),
          matchId: id,
          side: "HOME",
          type: "PERIOD_START",
          period: 1,
          clockSeconds: durationSeconds,
          clientRecordedAt: now,
          createdBy: userId,
        });
      }
    });

    return this.getMatch(id);
  }

  /**
   * Starts a period (1..periodCount).
   */
  async startPeriod(id: number, periodNumber: number, userId: number) {
    const match = await this.getMatch(id);

    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai.");
    }

    if (periodNumber < 1 || periodNumber > match.periodCount) {
      throw new BadRequestException(`Nomor babak harus antara 1 dan ${match.periodCount}.`);
    }

    const durationSeconds = match.periodDurationMinutes * 60;
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await tx
        .update(matches)
        .set({
          status: "LIVE",
          currentPeriod: periodNumber,
          clockRemainingSeconds: durationSeconds,
          clockRunningSince: now,
          updatedAt: now,
        })
        .where(eq(matches.id, id));

      await tx.insert(matchEvents).values({
        id: randomUUID(),
        matchId: id,
        side: "HOME",
        type: "PERIOD_START",
        period: periodNumber,
        clockSeconds: durationSeconds,
        clientRecordedAt: now,
        createdBy: userId,
      });
    });

    return this.getMatch(id);
  }

  /**
   * Ends a period.
   */
  async endPeriod(id: number, periodNumber: number, userId: number) {
    const match = await this.getMatch(id);

    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai.");
    }

    if (periodNumber < 1 || periodNumber > match.periodCount) {
      throw new BadRequestException(`Nomor babak harus antara 1 dan ${match.periodCount}.`);
    }

    const now = new Date();

    await this.db.transaction(async (tx) => {
      await tx
        .update(matches)
        .set({
          clockRemainingSeconds: 0,
          clockRunningSince: null,
          updatedAt: now,
        })
        .where(eq(matches.id, id));

      await tx.insert(matchEvents).values({
        id: randomUUID(),
        matchId: id,
        side: "HOME",
        type: "PERIOD_END",
        period: periodNumber,
        clockSeconds: 0,
        clientRecordedAt: now,
        createdBy: userId,
      });
    });

    return this.getMatch(id);
  }

  /**
   * Updates game clock state.
   */
  async patchClock(id: number, input: ClockPatchInput, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, id), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match #${id} tidak ditemukan.`);
    }

    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai.");
    }

    const [updated] = await this.db
      .update(matches)
      .set({
        currentPeriod: input.currentPeriod ?? match.currentPeriod,
        clockRemainingSeconds:
          input.clockRemainingSeconds !== undefined ? input.clockRemainingSeconds : match.clockRemainingSeconds,
        clockRunningSince:
          input.clockRunningSince !== undefined
            ? input.clockRunningSince
              ? new Date(input.clockRunningSince)
              : null
            : match.clockRunningSince,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id))
      .returning();

    return updated;
  }

  /**
   * Recalculates denormalized match score from non-deleted events.
   */
  private async recalculateScoreInTx(tx: any, matchId: number): Promise<{ homeScore: number; awayScore: number }> {
    const goalEvents = await tx
      .select({ side: matchEvents.side })
      .from(matchEvents)
      .where(
        and(
          eq(matchEvents.matchId, matchId),
          inArray(matchEvents.type, GOAL_EVENT_TYPES),
          isNull(matchEvents.deletedAt),
        ),
      );

    let homeScore = 0;
    let awayScore = 0;
    for (const g of goalEvents) {
      if (g.side === "HOME") {
        homeScore += 1;
      } else {
        awayScore += 1;
      }
    }

    await tx.update(matches).set({ homeScore, awayScore, updatedAt: new Date() }).where(eq(matches.id, matchId));

    return { homeScore, awayScore };
  }

  /**
   * Finishes a match (status -> FINISHED, locks events, denormalizes scores).
   */
  async finishMatch(id: number, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, id), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match #${id} tidak ditemukan.`);
    }

    await this.db.transaction(async (tx) => {
      await this.recalculateScoreInTx(tx, id);

      await tx
        .update(matches)
        .set({
          status: "FINISHED",
          finishedAt: new Date(),
          finishedBy: userId,
          clockRunningSince: null,
          updatedAt: new Date(),
        })
        .where(eq(matches.id, id));
    });

    return this.getMatch(id);
  }

  /**
   * Reopens a finished match (status -> LIVE).
   */
  async reopenMatch(id: number, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, id), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match #${id} tidak ditemukan.`);
    }

    await this.db
      .update(matches)
      .set({
        status: "LIVE",
        finishedAt: null,
        finishedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id));

    return this.getMatch(id);
  }

  /**
   * Batch creates events idempotently (BR-20, BR-24).
   */
  async recordEventsBatch(id: number, input: BatchEventsInput, userId: number) {
    const match = await this.getMatch(id);

    if (match.status !== "LIVE") {
      throw new ConflictException(`Event hanya dapat dicatat saat match LIVE (status saat ini: ${match.status}).`);
    }

    const playerMap = new Map<number, (typeof match.lineup)[0]>();
    for (const p of match.lineup) {
      playerMap.set(p.id, p);
    }

    // Court state validation
    const courtState = match.courtState;

    for (const ev of input.events) {
      // Validate period & clock
      if (ev.period < 1 || ev.period > match.periodCount) {
        throw new BadRequestException(`Babak ${ev.period} tidak valid (maks. ${match.periodCount}).`);
      }
      if (ev.clockSeconds > match.periodDurationMinutes * 60) {
        throw new BadRequestException("Waktu jam melebihi durasi babak.");
      }

      // Validate player belongs to side
      if (ev.matchPlayerId) {
        const player = playerMap.get(ev.matchPlayerId);
        if (!player) {
          throw new BadRequestException(`Pemain #${ev.matchPlayerId} tidak ditemukan di lineup match ini.`);
        }
        if (player.side !== ev.side) {
          throw new BadRequestException(
            `Pemain #${ev.matchPlayerId} (${player.athleteName}) berada di sisi ${player.side}, bukan ${ev.side}.`,
          );
        }

        // BR-23: Red card check
        const sideCourt = ev.side === "HOME" ? courtState.home : courtState.away;
        if (ev.type !== "RED_CARD") {
          const eligibility = isPlayerEligibleForEvent(sideCourt, ev.matchPlayerId);
          if (!eligibility.eligible) {
            throw new ConflictException(eligibility.error);
          }
        }
      }

      // BR-22: Substitution check
      if (ev.type === "SUBSTITUTION") {
        if (!ev.matchPlayerId || !ev.subInPlayerId) {
          throw new BadRequestException("Substitusi wajib menyertakan pemain keluar dan pemain masuk.");
        }
        const outPlayer = playerMap.get(ev.matchPlayerId);
        const inPlayer = playerMap.get(ev.subInPlayerId);

        if (!outPlayer || !inPlayer) {
          throw new BadRequestException("Pemain substitusi tidak ditemukan di lineup.");
        }
        if (outPlayer.side !== ev.side || inPlayer.side !== ev.side) {
          throw new BadRequestException("Kedua pemain substitusi harus berasal dari sisi yang sama.");
        }

        const sideCourt = ev.side === "HOME" ? courtState.home : courtState.away;
        const subValidation = validateSubstitution(sideCourt, ev.matchPlayerId, ev.subInPlayerId);
        if (!subValidation.valid) {
          throw new BadRequestException(subValidation.error);
        }
      }
    }

    let updatedScores = { homeScore: match.homeScore, awayScore: match.awayScore };

    await this.db.transaction(async (tx) => {
      // Insert with ON CONFLICT (id) DO NOTHING (BR-20)
      for (const ev of input.events) {
        await tx
          .insert(matchEvents)
          .values({
            id: ev.id,
            matchId: id,
            side: ev.side,
            type: ev.type,
            matchPlayerId: ev.matchPlayerId,
            subInPlayerId: ev.subInPlayerId,
            relatedEventId: ev.relatedEventId,
            period: ev.period,
            clockSeconds: ev.clockSeconds,
            shotSector: ev.shotSector,
            shotDistanceZone: ev.shotDistanceZone,
            note: ev.note,
            clientRecordedAt: new Date(ev.clientRecordedAt),
            createdBy: userId,
          })
          .onConflictDoNothing({ target: matchEvents.id });
      }

      // Recalculate score denormalization in same tx (BR-24)
      updatedScores = await this.recalculateScoreInTx(tx, id);
    });

    return {
      success: true,
      homeScore: updatedScores.homeScore,
      awayScore: updatedScores.awayScore,
    };
  }

  /**
   * Updates a single event.
   */
  async updateEvent(matchId: number, eventId: string, input: UpdateEventInput, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, matchId), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match #${matchId} tidak ditemukan.`);
    }
    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai.");
    }

    const [event] = await this.db
      .select()
      .from(matchEvents)
      .where(and(eq(matchEvents.id, eventId), eq(matchEvents.matchId, matchId), isNull(matchEvents.deletedAt)));

    if (!event) {
      throw new NotFoundException(`Event #${eventId} tidak ditemukan.`);
    }

    let updatedScores = { homeScore: match.homeScore, awayScore: match.awayScore };

    await this.db.transaction(async (tx) => {
      await tx
        .update(matchEvents)
        .set({
          matchPlayerId: input.matchPlayerId !== undefined ? input.matchPlayerId : event.matchPlayerId,
          subInPlayerId: input.subInPlayerId !== undefined ? input.subInPlayerId : event.subInPlayerId,
          type: input.type !== undefined ? input.type : event.type,
          shotSector: input.shotSector !== undefined ? input.shotSector : event.shotSector,
          shotDistanceZone: input.shotDistanceZone !== undefined ? input.shotDistanceZone : event.shotDistanceZone,
          note: input.note !== undefined ? input.note : event.note,
        })
        .where(eq(matchEvents.id, eventId));

      updatedScores = await this.recalculateScoreInTx(tx, matchId);
    });

    return {
      success: true,
      eventId,
      homeScore: updatedScores.homeScore,
      awayScore: updatedScores.awayScore,
    };
  }

  /**
   * Soft-deletes a single event (BR-26).
   */
  async deleteEvent(matchId: number, eventId: string, userId: number) {
    const [match] = await this.db
      .select()
      .from(matches)
      .where(and(eq(matches.id, matchId), isNull(matches.deletedAt)));

    if (!match) {
      throw new NotFoundException(`Match #${matchId} tidak ditemukan.`);
    }
    if (match.status === "FINISHED") {
      throw new ConflictException("Match sudah selesai.");
    }

    const [event] = await this.db
      .select()
      .from(matchEvents)
      .where(and(eq(matchEvents.id, eventId), eq(matchEvents.matchId, matchId), isNull(matchEvents.deletedAt)));

    if (!event) {
      const [alreadyDeleted] = await this.db
        .select({ id: matchEvents.id })
        .from(matchEvents)
        .where(and(eq(matchEvents.id, eventId), eq(matchEvents.matchId, matchId)));

      if (alreadyDeleted) {
        return {
          success: true,
          deletedEventId: eventId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        };
      }

      throw new NotFoundException(`Event #${eventId} tidak ditemukan.`);
    }

    let updatedScores = { homeScore: match.homeScore, awayScore: match.awayScore };

    await this.db.transaction(async (tx) => {
      await tx
        .update(matchEvents)
        .set({
          deletedAt: new Date(),
          deletedBy: userId,
        })
        .where(eq(matchEvents.id, eventId));

      updatedScores = await this.recalculateScoreInTx(tx, matchId);
    });

    return {
      success: true,
      deletedEventId: eventId,
      homeScore: updatedScores.homeScore,
      awayScore: updatedScores.awayScore,
    };
  }

  /**
   * Lists events for polling / sync (includes afterSeq filter).
   */
  async listEvents(matchId: number, afterSeq?: number) {
    const conditions = [eq(matchEvents.matchId, matchId)];

    if (afterSeq !== undefined && afterSeq > 0) {
      conditions.push(gt(matchEvents.seq, afterSeq));
    }

    const rows = await this.db
      .select()
      .from(matchEvents)
      .where(and(...conditions))
      .orderBy(matchEvents.seq);

    return { items: rows };
  }

  /**
   * Computes complete box score for a match.
   */
  async getBoxScore(matchId: number): Promise<MatchBoxScore> {
    const match = await this.getMatch(matchId);

    const matchInfo: CalculatorMatchInfo = {
      id: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      homeHeadCoach: match.homeHeadCoach,
      homeAssistantCoach: match.homeAssistantCoach,
      awayHeadCoach: match.awayHeadCoach,
      awayAssistantCoach: match.awayAssistantCoach,
      periodCount: match.periodCount,
      periodDurationMinutes: match.periodDurationMinutes,
    };

    const calcPlayers: CalculatorPlayer[] = match.lineup.map((lp) => ({
      id: lp.id,
      athleteId: lp.athleteId,
      athleteName: lp.athleteName,
      sex: lp.sex,
      jerseyNumber: lp.jerseyNumber,
      side: lp.side,
      isStarter: lp.isStarter,
    }));

    const events = await this.db
      .select({
        id: matchEvents.id,
        seq: matchEvents.seq,
        matchId: matchEvents.matchId,
        side: matchEvents.side,
        type: matchEvents.type,
        matchPlayerId: matchEvents.matchPlayerId,
        subInPlayerId: matchEvents.subInPlayerId,
        relatedEventId: matchEvents.relatedEventId,
        period: matchEvents.period,
        clockSeconds: matchEvents.clockSeconds,
        shotSector: matchEvents.shotSector,
        shotDistanceZone: matchEvents.shotDistanceZone,
        note: matchEvents.note,
        clientRecordedAt: matchEvents.clientRecordedAt,
        deletedAt: matchEvents.deletedAt,
      })
      .from(matchEvents)
      .where(eq(matchEvents.matchId, matchId))
      .orderBy(matchEvents.seq);

    return calculateMatchBoxScore(matchInfo, calcPlayers, events as CalculatorEvent[]);
  }

  /**
   * Generates Excel workbook report for a match.
   */
  async exportMatchReport(matchId: number): Promise<Buffer> {
    const match = await this.getMatch(matchId);
    const boxScore = await this.getBoxScore(matchId);

    return buildMatchReportWorkbook(boxScore, {
      competition: match.competition,
      gameNumber: match.gameNumber,
      scheduledAt: match.scheduledAt,
      venue: match.venue,
      juryChair: match.juryChair,
      juryMembers: match.juryMembers,
      referees: match.referees,
      homeLabel: match.homeLabel,
      awayLabel: match.awayLabel,
    });
  }
}
