import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import type { DrizzleDatabase } from "../../database/connection.js";
import { DRIZZLE_DB } from "../../database/database.module.js";
import type { MatchEventType, MatchSide, Sex } from "../../database/schema/enums.js";
import { athletes, matchEvents, matchPlayers, matches, teams } from "../../database/schema/index.js";
import { type TableSheet, buildWorkbook } from "../../lib/exporters/table-workbook.js";
import {
  type CalculatorEvent,
  type CalculatorMatchInfo,
  type CalculatorPlayer,
  calculateBoxScore,
} from "../matches/box-score.calculator.js";
import { parseWibDateRange } from "../sessions/sessions.utils.js";
import type { PlayerLeaderboardQuery, TeamStatsQuery } from "./statistics.schemas.js";

export interface PlayerLeaderboardItem {
  athleteId: number;
  athleteName: string;
  nickname: string | null;
  sex: Sex;
  sexLabel: "L" | "P";
  jerseyNumber: number | null;
  teamId: number;
  teamName: string;
  gp: number;
  pts: number;
  ppg: number;
  sm: number;
  sa: number;
  pctFgs: number | null;
  pctFgsFormatted: string;
  rim: number;
  ria: number;
  pctFgr: number | null;
  pctFgrFormatted: string;
  pm: number;
  pa: number;
  pctP: number | null;
  pctPFormatted: string;
  pctFgTotal: number | null;
  pctFgTotalFormatted: string;
  dr: number;
  or: number;
  tot: number;
  rpg: number;
  d: number;
  as: number;
  apg: number;
  it: number;
  tov: number;
  f: number;
  yc: number;
  rc: number;
  eff: number;
  epg: number;
}

export interface PlayerGameLogItem {
  matchId: number;
  scheduledAt: string;
  matchType: string;
  matchFormat: string;
  venue: string | null;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  opponentTeamName: string;
  side: MatchSide;
  teamScore: number;
  opponentScore: number;
  result: "W" | "L" | "D";
  isStarter: boolean;
  played: boolean;
  sm: number;
  sa: number;
  pctFgs: number | null;
  rim: number;
  ria: number;
  pctFgr: number | null;
  pm: number;
  pa: number;
  pctP: number | null;
  pctFg: number | null;
  dr: number;
  or: number;
  tot: number;
  d: number;
  as: number;
  it: number;
  tov: number;
  f: number;
  yc: number;
  rc: number;
  pts: number;
  eff: number;
}

export interface PlayerProfileStats {
  athlete: {
    id: number;
    fullName: string;
    nickname: string | null;
    sex: Sex;
    jerseyNumber: number | null;
    photoUrl: string | null;
    teamId: number;
    teamName: string;
    status: string;
  };
  summary: PlayerLeaderboardItem;
  gameLogs: PlayerGameLogItem[];
  effTrend: {
    matchId: number;
    scheduledAt: string;
    opponentTeam: string;
    eff: number;
    pts: number;
  }[];
}

export interface TeamStatsSummary {
  team: {
    id: number;
    name: string;
    shortName: string | null;
    isInternal: boolean;
    region: string | null;
  };
  overall: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    gfPerGame: number;
    gaPerGame: number;
  };
  scrimmageInternal: {
    matchesPlayed: number;
  };
  shooting: {
    sm: number;
    sa: number;
    pctFgs: number | null;
    rim: number;
    ria: number;
    pctFgr: number | null;
    pm: number;
    pa: number;
    pctP: number | null;
    totalMade: number;
    totalAttempts: number;
    pctFgTotal: number | null;
  };
  totals: {
    dr: number;
    or: number;
    tot: number;
    d: number;
    as: number;
    it: number;
    tov: number;
    tovt: number;
    totalTov: number;
    f: number;
    yc: number;
    rc: number;
    eff: number;
  };
}

@Injectable()
export class StatisticsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDatabase) {}

  /**
   * Resolves target team ID: either query.teamId or the default internal team.
   */
  async getDefaultTeamId(): Promise<number> {
    const [internalTeam] = await this.db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.isInternal, true), isNull(teams.deletedAt)))
      .limit(1);
    return internalTeam?.id ?? 1;
  }

  /**
   * Leaderboard of players across FINISHED matches (BR-28).
   */
  async getPlayerLeaderboard(query: PlayerLeaderboardQuery) {
    const targetTeamId = query.teamId ?? (await this.getDefaultTeamId());

    // 1. Build where conditions for matches
    const matchConditions = [eq(matches.status, "FINISHED"), isNull(matches.deletedAt)];

    const { fromDate, toDate } = parseWibDateRange(query.from, query.to);
    if (fromDate) {
      matchConditions.push(gte(matches.scheduledAt, fromDate));
    }
    if (toDate) {
      matchConditions.push(lte(matches.scheduledAt, toDate));
    }
    if (query.types) {
      const typeList = query.types
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) as any[];
      if (typeList.length > 0) {
        matchConditions.push(inArray(matches.type, typeList));
      }
    }

    // Filter matches involving the target team
    matchConditions.push(or(eq(matches.homeTeamId, targetTeamId), eq(matches.awayTeamId, targetTeamId))!);

    const finishedMatches = await this.db
      .select({
        id: matches.id,
        homeTeamId: matches.homeTeamId,
        awayTeamId: matches.awayTeamId,
        periodCount: matches.periodCount,
        periodDurationMinutes: matches.periodDurationMinutes,
        matchType: matches.type,
        matchFormat: matches.format,
        scheduledAt: matches.scheduledAt,
      })
      .from(matches)
      .where(and(...matchConditions))
      .orderBy(matches.scheduledAt);

    if (finishedMatches.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page: query.page,
          limit: query.limit,
          totalPages: 0,
        },
      };
    }

    const matchIds = finishedMatches.map((m) => m.id);

    // 2. Fetch all teams involved
    const allTeams = await this.db.select({ id: teams.id, name: teams.name }).from(teams);
    const teamNameMap = new Map(allTeams.map((t) => [t.id, t.name]));

    // 3. Batch fetch match players joined with athletes
    const playersRaw = await this.db
      .select({
        id: matchPlayers.id,
        matchId: matchPlayers.matchId,
        athleteId: matchPlayers.athleteId,
        side: matchPlayers.side,
        jerseyNumber: matchPlayers.jerseyNumber,
        isStarter: matchPlayers.isStarter,
        athleteName: athletes.fullName,
        nickname: athletes.nickname,
        sex: athletes.sex,
        athleteTeamId: athletes.teamId,
      })
      .from(matchPlayers)
      .innerJoin(athletes, eq(matchPlayers.athleteId, athletes.id))
      .where(inArray(matchPlayers.matchId, matchIds));

    // Group players by matchId
    const playersByMatch = new Map<number, typeof playersRaw>();
    for (const p of playersRaw) {
      const list = playersByMatch.get(p.matchId) ?? [];
      list.push(p);
      playersByMatch.set(p.matchId, list);
    }

    // 4. Batch fetch match events
    const eventsRaw = await this.db
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
        deletedAt: matchEvents.deletedAt,
      })
      .from(matchEvents)
      .where(and(inArray(matchEvents.matchId, matchIds), isNull(matchEvents.deletedAt)))
      .orderBy(matchEvents.seq);

    const eventsByMatch = new Map<number, CalculatorEvent[]>();
    for (const e of eventsRaw) {
      const list = eventsByMatch.get(e.matchId) ?? [];
      list.push({
        id: e.id,
        seq: Number(e.seq),
        matchId: e.matchId,
        side: e.side as MatchSide,
        type: e.type as MatchEventType,
        matchPlayerId: e.matchPlayerId,
        subInPlayerId: e.subInPlayerId,
        relatedEventId: e.relatedEventId,
        period: e.period,
        clockSeconds: e.clockSeconds,
        shotSector: e.shotSector,
        shotDistanceZone: e.shotDistanceZone,
        note: e.note,
        deletedAt: e.deletedAt,
      });
      eventsByMatch.set(e.matchId, list);
    }

    // 5. Calculate box scores and accumulate player totals
    interface AccumulatedPlayer {
      athleteId: number;
      athleteName: string;
      nickname: string | null;
      sex: Sex;
      jerseyNumber: number | null;
      teamId: number;
      teamName: string;
      gp: number;
      sm: number;
      sa: number;
      rim: number;
      ria: number;
      pm: number;
      pa: number;
      dr: number;
      or: number;
      tot: number;
      d: number;
      as: number;
      it: number;
      tov: number;
      f: number;
      yc: number;
      rc: number;
      pts: number;
      eff: number;
    }

    const playerAccumMap = new Map<number, AccumulatedPlayer>();

    for (const m of finishedMatches) {
      const matchPl = playersByMatch.get(m.id) ?? [];
      const matchEv = eventsByMatch.get(m.id) ?? [];

      const calcMatch: CalculatorMatchInfo = {
        id: m.id,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeTeamName: teamNameMap.get(m.homeTeamId) ?? "Home",
        awayTeamName: teamNameMap.get(m.awayTeamId) ?? "Away",
        periodCount: m.periodCount,
        periodDurationMinutes: m.periodDurationMinutes,
      };

      const calcPlayers: CalculatorPlayer[] = matchPl.map((p) => ({
        id: p.id,
        athleteId: p.athleteId,
        athleteName: p.nickname || p.athleteName,
        sex: p.sex as Sex,
        jerseyNumber: p.jerseyNumber,
        side: p.side as MatchSide,
        isStarter: p.isStarter,
      }));

      const boxScore = calculateBoxScore(calcMatch, calcPlayers, matchEv);

      // Find players who actually played in this match (PRD §5.12.A: starter OR subbed-in OR >= 1 event)
      const subIns = new Set(
        matchEv.filter((e) => e.type === "SUBSTITUTION" && !e.deletedAt && e.subInPlayerId).map((e) => e.subInPlayerId),
      );
      const playerEventCount = new Map<number, number>();
      for (const ev of matchEv) {
        if (ev.matchPlayerId && !ev.deletedAt) {
          playerEventCount.set(ev.matchPlayerId, (playerEventCount.get(ev.matchPlayerId) || 0) + 1);
        }
      }

      const allBoxPlayers = [...boxScore.home.players, ...boxScore.away.players];

      for (const bp of allBoxPlayers) {
        // Find raw match player record for team ownership & athlete ID
        const rawPl = matchPl.find((p) => p.id === bp.id);
        if (!rawPl) continue;

        // Filter by target team if specified
        if (rawPl.athleteTeamId !== targetTeamId) {
          continue;
        }

        const played = bp.isStarter || subIns.has(bp.id) || (playerEventCount.get(bp.id) ?? 0) > 0;

        let accum = playerAccumMap.get(rawPl.athleteId);
        if (!accum) {
          accum = {
            athleteId: rawPl.athleteId,
            athleteName: rawPl.athleteName,
            nickname: rawPl.nickname,
            sex: rawPl.sex as Sex,
            jerseyNumber: rawPl.jerseyNumber,
            teamId: rawPl.athleteTeamId,
            teamName: teamNameMap.get(rawPl.athleteTeamId) ?? "",
            gp: 0,
            sm: 0,
            sa: 0,
            rim: 0,
            ria: 0,
            pm: 0,
            pa: 0,
            dr: 0,
            or: 0,
            tot: 0,
            d: 0,
            as: 0,
            it: 0,
            tov: 0,
            f: 0,
            yc: 0,
            rc: 0,
            pts: 0,
            eff: 0,
          };
          playerAccumMap.set(rawPl.athleteId, accum);
        }

        if (played) {
          accum.gp += 1;
        }

        accum.sm += bp.sm;
        accum.sa += bp.sa;
        accum.rim += bp.rim;
        accum.ria += bp.ria;
        accum.pm += bp.pm;
        accum.pa += bp.pa;
        accum.dr += bp.dr;
        accum.or += bp.or;
        accum.tot += bp.tot;
        accum.d += bp.d;
        accum.as += bp.as;
        accum.it += bp.it;
        accum.tov += bp.tov;
        accum.f += bp.f;
        accum.yc += bp.yc;
        accum.rc += bp.rc;
        accum.pts += bp.pts;
        accum.eff += bp.eff;
      }
    }

    // 6. Format and calculate percentages / averages
    const items: PlayerLeaderboardItem[] = [];

    for (const p of playerAccumMap.values()) {
      if (p.gp < query.minGp) {
        continue;
      }

      const pctFgs = p.sa > 0 ? Number(((p.sm / p.sa) * 100).toFixed(1)) : null;
      const pctFgr = p.ria > 0 ? Number(((p.rim / p.ria) * 100).toFixed(1)) : null;
      const pctP = p.pa > 0 ? Number(((p.pm / p.pa) * 100).toFixed(1)) : null;

      const totalFgMade = p.sm + p.rim + p.pm;
      const totalFgAttempts = p.sa + p.ria + p.pa;
      const pctFgTotal = totalFgAttempts > 0 ? Number(((totalFgMade / totalFgAttempts) * 100).toFixed(1)) : null;

      const ppg = p.gp > 0 ? Number((p.pts / p.gp).toFixed(1)) : 0;
      const rpg = p.gp > 0 ? Number((p.tot / p.gp).toFixed(1)) : 0;
      const apg = p.gp > 0 ? Number((p.as / p.gp).toFixed(1)) : 0;
      const epg = p.gp > 0 ? Number((p.eff / p.gp).toFixed(1)) : 0;

      items.push({
        athleteId: p.athleteId,
        athleteName: p.athleteName,
        nickname: p.nickname,
        sex: p.sex,
        sexLabel: p.sex === "MALE" ? "L" : "P",
        jerseyNumber: p.jerseyNumber,
        teamId: p.teamId,
        teamName: p.teamName,
        gp: p.gp,
        pts: p.pts,
        ppg,
        sm: p.sm,
        sa: p.sa,
        pctFgs,
        pctFgsFormatted: pctFgs !== null ? `${pctFgs.toFixed(1)}%` : "-",
        rim: p.rim,
        ria: p.ria,
        pctFgr,
        pctFgrFormatted: pctFgr !== null ? `${pctFgr.toFixed(1)}%` : "-",
        pm: p.pm,
        pa: p.pa,
        pctP,
        pctPFormatted: pctP !== null ? `${pctP.toFixed(1)}%` : "-",
        pctFgTotal,
        pctFgTotalFormatted: pctFgTotal !== null ? `${pctFgTotal.toFixed(1)}%` : "-",
        dr: p.dr,
        or: p.or,
        tot: p.tot,
        rpg,
        d: p.d,
        as: p.as,
        apg,
        it: p.it,
        tov: p.tov,
        f: p.f,
        yc: p.yc,
        rc: p.rc,
        eff: p.eff,
        epg,
      });
    }

    // 7. Sort
    const sortKey = query.sort;
    const isAsc = query.direction === "asc";

    items.sort((a, b) => {
      let valA: any = a[sortKey as keyof PlayerLeaderboardItem];
      let valB: any = b[sortKey as keyof PlayerLeaderboardItem];

      if (valA === null || valA === undefined) valA = isAsc ? Infinity : -Infinity;
      if (valB === null || valB === undefined) valB = isAsc ? Infinity : -Infinity;

      if (typeof valA === "string" && typeof valB === "string") {
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return isAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });

    const total = items.length;
    const offset = (query.page - 1) * query.limit;
    const paginated = items.slice(offset, offset + query.limit);

    return {
      data: paginated,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Detailed player statistics profile, game log, and EFF trend (BR-29).
   */
  async getPlayerProfile(
    athleteId: number,
    currentUserId?: number,
    hasFullAccess = false,
  ): Promise<PlayerProfileStats> {
    // 1. Fetch athlete details
    const [athlete] = await this.db
      .select({
        id: athletes.id,
        fullName: athletes.fullName,
        nickname: athletes.nickname,
        sex: athletes.sex,
        jerseyNumber: athletes.jerseyNumber,
        teamId: athletes.teamId,
        status: athletes.status,
        userId: athletes.userId,
      })
      .from(athletes)
      .where(and(eq(athletes.id, athleteId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!athlete) {
      throw new NotFoundException("Profil atlet tidak ditemukan.");
    }

    // Check BR-29 permission
    if (!hasFullAccess) {
      if (!currentUserId || athlete.userId !== currentUserId) {
        throw new ForbiddenException("Anda tidak memiliki izin untuk melihat statistik pemain lain.");
      }
    }

    const [team] = await this.db.select({ name: teams.name }).from(teams).where(eq(teams.id, athlete.teamId)).limit(1);
    const teamName = team?.name ?? "";

    // 2. Find all FINISHED matches where this athlete is on the lineup
    const playerMatches = await this.db
      .select({
        matchPlayerId: matchPlayers.id,
        side: matchPlayers.side,
        jerseyNumber: matchPlayers.jerseyNumber,
        isStarter: matchPlayers.isStarter,
        matchId: matches.id,
        scheduledAt: matches.scheduledAt,
        matchType: matches.type,
        matchFormat: matches.format,
        venue: matches.venue,
        homeTeamId: matches.homeTeamId,
        awayTeamId: matches.awayTeamId,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        periodCount: matches.periodCount,
        periodDurationMinutes: matches.periodDurationMinutes,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .where(and(eq(matchPlayers.athleteId, athleteId), eq(matches.status, "FINISHED"), isNull(matches.deletedAt)))
      .orderBy(desc(matches.scheduledAt));

    const defaultSummary: PlayerLeaderboardItem = {
      athleteId: athlete.id,
      athleteName: athlete.fullName,
      nickname: athlete.nickname,
      sex: athlete.sex as Sex,
      sexLabel: athlete.sex === "MALE" ? "L" : "P",
      jerseyNumber: athlete.jerseyNumber,
      teamId: athlete.teamId,
      teamName,
      gp: 0,
      pts: 0,
      ppg: 0,
      sm: 0,
      sa: 0,
      pctFgs: null,
      pctFgsFormatted: "-",
      rim: 0,
      ria: 0,
      pctFgr: null,
      pctFgrFormatted: "-",
      pm: 0,
      pa: 0,
      pctP: null,
      pctPFormatted: "-",
      pctFgTotal: null,
      pctFgTotalFormatted: "-",
      dr: 0,
      or: 0,
      tot: 0,
      rpg: 0,
      d: 0,
      as: 0,
      apg: 0,
      it: 0,
      tov: 0,
      f: 0,
      yc: 0,
      rc: 0,
      eff: 0,
      epg: 0,
    };

    if (playerMatches.length === 0) {
      return {
        athlete: {
          id: athlete.id,
          fullName: athlete.fullName,
          nickname: athlete.nickname,
          sex: athlete.sex as Sex,
          jerseyNumber: athlete.jerseyNumber,
          photoUrl: null,
          teamId: athlete.teamId,
          teamName,
          status: athlete.status,
        },
        summary: defaultSummary,
        gameLogs: [],
        effTrend: [],
      };
    }

    const matchIds = playerMatches.map((m) => m.matchId);

    // Fetch team names
    const allTeams = await this.db.select({ id: teams.id, name: teams.name }).from(teams);
    const teamNameMap = new Map(allTeams.map((t) => [t.id, t.name]));

    // Fetch lineups and events for these matches
    const allLineupPlayers = await this.db
      .select({
        id: matchPlayers.id,
        matchId: matchPlayers.matchId,
        athleteId: matchPlayers.athleteId,
        side: matchPlayers.side,
        jerseyNumber: matchPlayers.jerseyNumber,
        isStarter: matchPlayers.isStarter,
        athleteName: athletes.fullName,
        nickname: athletes.nickname,
        sex: athletes.sex,
      })
      .from(matchPlayers)
      .innerJoin(athletes, eq(matchPlayers.athleteId, athletes.id))
      .where(inArray(matchPlayers.matchId, matchIds));

    const playersByMatch = new Map<number, typeof allLineupPlayers>();
    for (const p of allLineupPlayers) {
      const list = playersByMatch.get(p.matchId) ?? [];
      list.push(p);
      playersByMatch.set(p.matchId, list);
    }

    const allEvents = await this.db
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
        deletedAt: matchEvents.deletedAt,
      })
      .from(matchEvents)
      .where(and(inArray(matchEvents.matchId, matchIds), isNull(matchEvents.deletedAt)))
      .orderBy(matchEvents.seq);

    const eventsByMatch = new Map<number, CalculatorEvent[]>();
    for (const e of allEvents) {
      const list = eventsByMatch.get(e.matchId) ?? [];
      list.push({
        id: e.id,
        seq: Number(e.seq),
        matchId: e.matchId,
        side: e.side as MatchSide,
        type: e.type as MatchEventType,
        matchPlayerId: e.matchPlayerId,
        subInPlayerId: e.subInPlayerId,
        relatedEventId: e.relatedEventId,
        period: e.period,
        clockSeconds: e.clockSeconds,
        shotSector: e.shotSector,
        shotDistanceZone: e.shotDistanceZone,
        note: e.note,
        deletedAt: e.deletedAt,
      });
      eventsByMatch.set(e.matchId, list);
    }

    const gameLogs: PlayerGameLogItem[] = [];
    const effTrend: {
      matchId: number;
      scheduledAt: string;
      opponentTeam: string;
      eff: number;
      pts: number;
    }[] = [];

    let gpCount = 0;
    const totals = {
      sm: 0,
      sa: 0,
      rim: 0,
      ria: 0,
      pm: 0,
      pa: 0,
      dr: 0,
      or: 0,
      tot: 0,
      d: 0,
      as: 0,
      it: 0,
      tov: 0,
      f: 0,
      yc: 0,
      rc: 0,
      pts: 0,
      eff: 0,
    };

    for (const pm of playerMatches) {
      const matchPl = playersByMatch.get(pm.matchId) ?? [];
      const matchEv = eventsByMatch.get(pm.matchId) ?? [];

      const homeTeamName = teamNameMap.get(pm.homeTeamId) ?? "Home";
      const awayTeamName = teamNameMap.get(pm.awayTeamId) ?? "Away";

      const calcMatch: CalculatorMatchInfo = {
        id: pm.matchId,
        homeTeamId: pm.homeTeamId,
        awayTeamId: pm.awayTeamId,
        homeTeamName,
        awayTeamName,
        periodCount: pm.periodCount,
        periodDurationMinutes: pm.periodDurationMinutes,
      };

      const calcPlayers: CalculatorPlayer[] = matchPl.map((p) => ({
        id: p.id,
        athleteId: p.athleteId,
        athleteName: p.nickname || p.athleteName,
        sex: p.sex as Sex,
        jerseyNumber: p.jerseyNumber,
        side: p.side as MatchSide,
        isStarter: p.isStarter,
      }));

      const boxScore = calculateBoxScore(calcMatch, calcPlayers, matchEv);

      const subIns = new Set(
        matchEv.filter((e) => e.type === "SUBSTITUTION" && !e.deletedAt && e.subInPlayerId).map((e) => e.subInPlayerId),
      );
      const playerEventCount = matchEv.filter((e) => e.matchPlayerId === pm.matchPlayerId && !e.deletedAt).length;

      const played = pm.isStarter || subIns.has(pm.matchPlayerId) || playerEventCount > 0;

      const playerBox =
        boxScore.home.players.find((p) => p.id === pm.matchPlayerId) ||
        boxScore.away.players.find((p) => p.id === pm.matchPlayerId);

      const isHome = pm.side === "HOME";
      const teamScore = isHome ? boxScore.homeScore : boxScore.awayScore;
      const oppScore = isHome ? boxScore.awayScore : boxScore.homeScore;
      const opponentTeamName = isHome ? awayTeamName : homeTeamName;

      let result: "W" | "L" | "D" = "D";
      if (teamScore > oppScore) result = "W";
      else if (teamScore < oppScore) result = "L";

      const logItem: PlayerGameLogItem = {
        matchId: pm.matchId,
        scheduledAt: pm.scheduledAt.toISOString(),
        matchType: pm.matchType,
        matchFormat: pm.matchFormat,
        venue: pm.venue,
        homeTeamId: pm.homeTeamId,
        homeTeamName,
        awayTeamId: pm.awayTeamId,
        awayTeamName,
        opponentTeamName,
        side: pm.side as MatchSide,
        teamScore,
        opponentScore: oppScore,
        result,
        isStarter: pm.isStarter,
        played,
        sm: playerBox?.sm ?? 0,
        sa: playerBox?.sa ?? 0,
        pctFgs: playerBox?.pctFgs ?? null,
        rim: playerBox?.rim ?? 0,
        ria: playerBox?.ria ?? 0,
        pctFgr: playerBox?.pctFgr ?? null,
        pm: playerBox?.pm ?? 0,
        pa: playerBox?.pa ?? 0,
        pctP: playerBox?.pctP ?? null,
        pctFg:
          (playerBox?.sa ?? 0) + (playerBox?.ria ?? 0) + (playerBox?.pa ?? 0) > 0
            ? Number(
                (
                  (((playerBox?.sm ?? 0) + (playerBox?.rim ?? 0) + (playerBox?.pm ?? 0)) /
                    ((playerBox?.sa ?? 0) + (playerBox?.ria ?? 0) + (playerBox?.pa ?? 0))) *
                  100
                ).toFixed(1),
              )
            : null,
        dr: playerBox?.dr ?? 0,
        or: playerBox?.or ?? 0,
        tot: playerBox?.tot ?? 0,
        d: playerBox?.d ?? 0,
        as: playerBox?.as ?? 0,
        it: playerBox?.it ?? 0,
        tov: playerBox?.tov ?? 0,
        f: playerBox?.f ?? 0,
        yc: playerBox?.yc ?? 0,
        rc: playerBox?.rc ?? 0,
        pts: playerBox?.pts ?? 0,
        eff: playerBox?.eff ?? 0,
      };

      gameLogs.push(logItem);

      if (played) {
        gpCount++;
      }

      totals.sm += logItem.sm;
      totals.sa += logItem.sa;
      totals.rim += logItem.rim;
      totals.ria += logItem.ria;
      totals.pm += logItem.pm;
      totals.pa += logItem.pa;
      totals.dr += logItem.dr;
      totals.or += logItem.or;
      totals.tot += logItem.tot;
      totals.d += logItem.d;
      totals.as += logItem.as;
      totals.it += logItem.it;
      totals.tov += logItem.tov;
      totals.f += logItem.f;
      totals.yc += logItem.yc;
      totals.rc += logItem.rc;
      totals.pts += logItem.pts;
      totals.eff += logItem.eff;

      effTrend.push({
        matchId: pm.matchId,
        scheduledAt: pm.scheduledAt.toISOString(),
        opponentTeam: opponentTeamName,
        eff: logItem.eff,
        pts: logItem.pts,
      });
    }

    // Chronological order for trend
    effTrend.reverse();

    // Summary calculations
    const pctFgs = totals.sa > 0 ? Number(((totals.sm / totals.sa) * 100).toFixed(1)) : null;
    const pctFgr = totals.ria > 0 ? Number(((totals.rim / totals.ria) * 100).toFixed(1)) : null;
    const pctP = totals.pa > 0 ? Number(((totals.pm / totals.pa) * 100).toFixed(1)) : null;

    const totalFgMade = totals.sm + totals.rim + totals.pm;
    const totalFgAttempts = totals.sa + totals.ria + totals.pa;
    const pctFgTotal = totalFgAttempts > 0 ? Number(((totalFgMade / totalFgAttempts) * 100).toFixed(1)) : null;

    const ppg = gpCount > 0 ? Number((totals.pts / gpCount).toFixed(1)) : 0;
    const rpg = gpCount > 0 ? Number((totals.tot / gpCount).toFixed(1)) : 0;
    const apg = gpCount > 0 ? Number((totals.as / gpCount).toFixed(1)) : 0;
    const epg = gpCount > 0 ? Number((totals.eff / gpCount).toFixed(1)) : 0;

    const summary: PlayerLeaderboardItem = {
      athleteId: athlete.id,
      athleteName: athlete.fullName,
      nickname: athlete.nickname,
      sex: athlete.sex as Sex,
      sexLabel: athlete.sex === "MALE" ? "L" : "P",
      jerseyNumber: athlete.jerseyNumber,
      teamId: athlete.teamId,
      teamName,
      gp: gpCount,
      pts: totals.pts,
      ppg,
      sm: totals.sm,
      sa: totals.sa,
      pctFgs,
      pctFgsFormatted: pctFgs !== null ? `${pctFgs.toFixed(1)}%` : "-",
      rim: totals.rim,
      ria: totals.ria,
      pctFgr,
      pctFgrFormatted: pctFgr !== null ? `${pctFgr.toFixed(1)}%` : "-",
      pm: totals.pm,
      pa: totals.pa,
      pctP,
      pctPFormatted: pctP !== null ? `${pctP.toFixed(1)}%` : "-",
      pctFgTotal,
      pctFgTotalFormatted: pctFgTotal !== null ? `${pctFgTotal.toFixed(1)}%` : "-",
      dr: totals.dr,
      or: totals.or,
      tot: totals.tot,
      rpg,
      d: totals.d,
      as: totals.as,
      apg,
      it: totals.it,
      tov: totals.tov,
      f: totals.f,
      yc: totals.yc,
      rc: totals.rc,
      eff: totals.eff,
      epg,
    };

    return {
      athlete: {
        id: athlete.id,
        fullName: athlete.fullName,
        nickname: athlete.nickname,
        sex: athlete.sex as Sex,
        jerseyNumber: athlete.jerseyNumber,
        photoUrl: null,
        teamId: athlete.teamId,
        teamName,
        status: athlete.status,
      },
      summary,
      gameLogs,
      effTrend,
    };
  }

  /**
   * Stats for current logged-in user linked to athlete (GET /api/stats/me).
   */
  async getMyStats(userId: number): Promise<PlayerProfileStats> {
    const [athlete] = await this.db
      .select({ id: athletes.id })
      .from(athletes)
      .where(and(eq(athletes.userId, userId), isNull(athletes.deletedAt)))
      .limit(1);

    if (!athlete) {
      throw new NotFoundException("Akun Anda belum ditautkan ke profil atlet internal.");
    }

    return this.getPlayerProfile(athlete.id, userId, true);
  }

  /**
   * Aggregate statistics for a team across FINISHED matches (PRD §5.12.B).
   */
  async getTeamStats(query: TeamStatsQuery): Promise<TeamStatsSummary> {
    const targetTeamId = query.teamId ?? (await this.getDefaultTeamId());

    const [team] = await this.db
      .select({
        id: teams.id,
        name: teams.name,
        shortName: teams.shortName,
        isInternal: teams.isInternal,
        region: teams.region,
      })
      .from(teams)
      .where(and(eq(teams.id, targetTeamId), isNull(teams.deletedAt)))
      .limit(1);

    if (!team) {
      throw new NotFoundException("Tim tidak ditemukan.");
    }

    const matchConditions = [
      eq(matches.status, "FINISHED"),
      isNull(matches.deletedAt),
      or(eq(matches.homeTeamId, targetTeamId), eq(matches.awayTeamId, targetTeamId))!,
    ];

    const { fromDate, toDate } = parseWibDateRange(query.from, query.to);
    if (fromDate) {
      matchConditions.push(gte(matches.scheduledAt, fromDate));
    }
    if (toDate) {
      matchConditions.push(lte(matches.scheduledAt, toDate));
    }
    if (query.types) {
      const typeList = query.types
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) as any[];
      if (typeList.length > 0) {
        matchConditions.push(inArray(matches.type, typeList));
      }
    }

    const finishedMatches = await this.db
      .select()
      .from(matches)
      .where(and(...matchConditions))
      .orderBy(matches.scheduledAt);

    let regularMatchesCount = 0;
    let internalScrimmageCount = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    const shootingTotals = {
      sm: 0,
      sa: 0,
      rim: 0,
      ria: 0,
      pm: 0,
      pa: 0,
    };

    const actionTotals = {
      dr: 0,
      or: 0,
      tot: 0,
      d: 0,
      as: 0,
      it: 0,
      tov: 0,
      tovt: 0,
      f: 0,
      yc: 0,
      rc: 0,
      eff: 0,
    };

    if (finishedMatches.length > 0) {
      const matchIds = finishedMatches.map((m) => m.id);

      const lineupRaw = await this.db
        .select({
          id: matchPlayers.id,
          matchId: matchPlayers.matchId,
          athleteId: matchPlayers.athleteId,
          side: matchPlayers.side,
          jerseyNumber: matchPlayers.jerseyNumber,
          isStarter: matchPlayers.isStarter,
          athleteName: athletes.fullName,
          nickname: athletes.nickname,
          sex: athletes.sex,
        })
        .from(matchPlayers)
        .innerJoin(athletes, eq(matchPlayers.athleteId, athletes.id))
        .where(inArray(matchPlayers.matchId, matchIds));

      const playersByMatch = new Map<number, typeof lineupRaw>();
      for (const p of lineupRaw) {
        const list = playersByMatch.get(p.matchId) ?? [];
        list.push(p);
        playersByMatch.set(p.matchId, list);
      }

      const eventsRaw = await this.db
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
          deletedAt: matchEvents.deletedAt,
        })
        .from(matchEvents)
        .where(and(inArray(matchEvents.matchId, matchIds), isNull(matchEvents.deletedAt)))
        .orderBy(matchEvents.seq);

      const eventsByMatch = new Map<number, CalculatorEvent[]>();
      for (const e of eventsRaw) {
        const list = eventsByMatch.get(e.matchId) ?? [];
        list.push({
          id: e.id,
          seq: Number(e.seq),
          matchId: e.matchId,
          side: e.side as MatchSide,
          type: e.type as MatchEventType,
          matchPlayerId: e.matchPlayerId,
          subInPlayerId: e.subInPlayerId,
          relatedEventId: e.relatedEventId,
          period: e.period,
          clockSeconds: e.clockSeconds,
          shotSector: e.shotSector,
          shotDistanceZone: e.shotDistanceZone,
          note: e.note,
          deletedAt: e.deletedAt,
        });
        eventsByMatch.set(e.matchId, list);
      }

      for (const m of finishedMatches) {
        const isInternalScrimmage = m.homeTeamId === targetTeamId && m.awayTeamId === targetTeamId;

        if (isInternalScrimmage) {
          internalScrimmageCount++;
        } else {
          regularMatchesCount++;
          const isHome = m.homeTeamId === targetTeamId;
          const myScore = isHome ? m.homeScore : m.awayScore;
          const oppScore = isHome ? m.awayScore : m.homeScore;

          if (myScore > oppScore) wins++;
          else if (myScore < oppScore) losses++;
          else draws++;

          goalsFor += myScore;
          goalsAgainst += oppScore;
        }

        const matchPl = playersByMatch.get(m.id) ?? [];
        const matchEv = eventsByMatch.get(m.id) ?? [];

        const calcMatch: CalculatorMatchInfo = {
          id: m.id,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeTeamName: "Home",
          awayTeamName: "Away",
          periodCount: m.periodCount,
          periodDurationMinutes: m.periodDurationMinutes,
        };

        const calcPlayers: CalculatorPlayer[] = matchPl.map((p) => ({
          id: p.id,
          athleteId: p.athleteId,
          athleteName: p.nickname || p.athleteName,
          sex: p.sex as Sex,
          jerseyNumber: p.jerseyNumber,
          side: p.side as MatchSide,
          isStarter: p.isStarter,
        }));

        const boxScore = calculateBoxScore(calcMatch, calcPlayers, matchEv);

        const sides: ("home" | "away")[] = [];
        if (m.homeTeamId === targetTeamId) sides.push("home");
        if (m.awayTeamId === targetTeamId) sides.push("away");

        for (const s of sides) {
          const tBox = boxScore[s];
          shootingTotals.sm += tBox.sm;
          shootingTotals.sa += tBox.sa;
          shootingTotals.rim += tBox.rim;
          shootingTotals.ria += tBox.ria;
          shootingTotals.pm += tBox.pm;
          shootingTotals.pa += tBox.pa;

          actionTotals.dr += tBox.dr;
          actionTotals.or += tBox.or;
          actionTotals.tot += tBox.tot;
          actionTotals.d += tBox.d;
          actionTotals.as += tBox.as;
          actionTotals.it += tBox.it;
          actionTotals.tov += tBox.tov;
          actionTotals.tovt += tBox.tovt;
          actionTotals.f += tBox.f;
          actionTotals.yc += tBox.yc;
          actionTotals.rc += tBox.rc;
          actionTotals.eff += tBox.eff;
        }
      }
    }

    const winRate = regularMatchesCount > 0 ? Number(((wins / regularMatchesCount) * 100).toFixed(1)) : 0;
    const gfPerGame = regularMatchesCount > 0 ? Number((goalsFor / regularMatchesCount).toFixed(1)) : 0;
    const gaPerGame = regularMatchesCount > 0 ? Number((goalsAgainst / regularMatchesCount).toFixed(1)) : 0;

    const pctFgs = shootingTotals.sa > 0 ? Number(((shootingTotals.sm / shootingTotals.sa) * 100).toFixed(1)) : null;
    const pctFgr = shootingTotals.ria > 0 ? Number(((shootingTotals.rim / shootingTotals.ria) * 100).toFixed(1)) : null;
    const pctP = shootingTotals.pa > 0 ? Number(((shootingTotals.pm / shootingTotals.pa) * 100).toFixed(1)) : null;

    const totalMade = shootingTotals.sm + shootingTotals.rim + shootingTotals.pm;
    const totalAttempts = shootingTotals.sa + shootingTotals.ria + shootingTotals.pa;
    const pctFgTotal = totalAttempts > 0 ? Number(((totalMade / totalAttempts) * 100).toFixed(1)) : null;

    return {
      team,
      overall: {
        matchesPlayed: regularMatchesCount,
        wins,
        losses,
        draws,
        winRate,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        gfPerGame,
        gaPerGame,
      },
      scrimmageInternal: {
        matchesPlayed: internalScrimmageCount,
      },
      shooting: {
        sm: shootingTotals.sm,
        sa: shootingTotals.sa,
        pctFgs,
        rim: shootingTotals.rim,
        ria: shootingTotals.ria,
        pctFgr,
        pm: shootingTotals.pm,
        pa: shootingTotals.pa,
        pctP,
        totalMade,
        totalAttempts,
        pctFgTotal,
      },
      totals: {
        dr: actionTotals.dr,
        or: actionTotals.or,
        tot: actionTotals.tot,
        d: actionTotals.d,
        as: actionTotals.as,
        it: actionTotals.it,
        tov: actionTotals.tov,
        tovt: actionTotals.tovt,
        totalTov: actionTotals.tov + actionTotals.tovt,
        f: actionTotals.f,
        yc: actionTotals.yc,
        rc: actionTotals.rc,
        eff: actionTotals.eff,
      },
    };
  }

  /**
   * Exports player leaderboard to formatted Excel sheet (BR-30).
   */
  async exportPlayerLeaderboard(query: PlayerLeaderboardQuery): Promise<Buffer> {
    const result = await this.getPlayerLeaderboard({
      ...query,
      page: 1,
      limit: 1000,
    });

    const columns = [
      "No",
      "Nama Pemain",
      "L/P",
      "No. Punggung",
      "Tim",
      "GP",
      "PTS",
      "PPG",
      "SM",
      "SA",
      "%FGS",
      "RIM",
      "RIA",
      "%FGR",
      "PM",
      "PA",
      "%P",
      "%FG Total",
      "DR",
      "OR",
      "TOT",
      "RPG",
      "D",
      "AS",
      "APG",
      "IT",
      "TOV",
      "F",
      "YC",
      "RC",
      "EFF",
      "EPG",
    ];

    const rows: (string | number | null)[][] = result.data.map((p, idx) => [
      idx + 1,
      p.athleteName,
      p.sexLabel,
      p.jerseyNumber ?? "-",
      p.teamName,
      p.gp,
      p.pts,
      p.ppg,
      p.sm,
      p.sa,
      p.pctFgsFormatted,
      p.rim,
      p.ria,
      p.pctFgrFormatted,
      p.pm,
      p.pa,
      p.pctPFormatted,
      p.pctFgTotalFormatted,
      p.dr,
      p.or,
      p.tot,
      p.rpg,
      p.d,
      p.as,
      p.apg,
      p.it,
      p.tov,
      p.f,
      p.yc,
      p.rc,
      p.eff,
      p.epg,
    ]);

    const sheet: TableSheet = {
      sheetName: "Leaderboard Pemain",
      tableName: "LeaderboardPemain",
      columns,
      rows,
    };

    return buildWorkbook([sheet]);
  }
}
