import type { MatchEventType, MatchSide, Sex } from "../../database/schema/enums.js";

export interface CalculatorMatchInfo {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeHeadCoach?: string | null;
  homeAssistantCoach?: string | null;
  awayHeadCoach?: string | null;
  awayAssistantCoach?: string | null;
  periodCount: number;
  periodDurationMinutes: number;
}

export interface CalculatorPlayer {
  id: number; // match_players.id
  athleteId: number;
  athleteName: string;
  sex: Sex;
  jerseyNumber: number;
  side: MatchSide;
  isStarter: boolean;
}

export interface CalculatorEvent {
  id: string;
  seq: number;
  matchId: number;
  side: MatchSide;
  type: MatchEventType;
  matchPlayerId?: number | null | undefined;
  subInPlayerId?: number | null | undefined;
  relatedEventId?: string | null | undefined;
  period: number;
  clockSeconds: number;
  shotSector?: number | null | undefined;
  shotDistanceZone?: number | null | undefined;
  note?: string | null | undefined;
  clientRecordedAt?: Date | string | undefined;
  deletedAt?: Date | string | null | undefined;
}

export interface PlayerBoxScore {
  id: number;
  athleteId: number;
  athleteName: string;
  sex: Sex;
  sexLabel: "L" | "P";
  jerseyNumber: number;
  side: MatchSide;
  isStarter: boolean;
  sm: number;
  sa: number;
  pctFgs: number;
  pctFgsFormatted: string;
  rim: number;
  ria: number;
  pctFgr: number;
  pctFgrFormatted: string;
  pm: number;
  pa: number;
  pctP: number;
  pctPFormatted: string;
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

export interface TeamBoxScore {
  side: MatchSide;
  teamId: number;
  teamName: string;
  coach: string | null;
  assistantCoach: string | null;
  sm: number;
  sa: number;
  pctFgs: number;
  pctFgsFormatted: string;
  rim: number;
  ria: number;
  pctFgr: number;
  pctFgrFormatted: string;
  pm: number;
  pa: number;
  pctP: number;
  pctPFormatted: string;
  dr: number;
  or: number;
  tot: number;
  d: number;
  as: number;
  it: number;
  tov: number;
  tovt: number;
  f: number;
  yc: number;
  rc: number;
  pts: number;
  eff: number;
  players: PlayerBoxScore[];
}

export interface PeriodScore {
  period: number;
  periodLabel: string;
  home: number;
  away: number;
}

export interface RunningScoreEntry {
  eventId: string;
  seq: number;
  period: number;
  periodLabel: string;
  clockSeconds: number;
  clockFormatted: string;
  side: MatchSide;
  matchPlayerId: number | null;
  athleteName: string;
  jerseyNumber: number | null;
  actionType: "SHOT_MADE" | "RUNNING_IN_MADE" | "PENALTY_MADE";
  actionLabel: string;
  shotSector: number | null;
  shotDistanceZone: number | null;
  homeScore: number;
  awayScore: number;
}

export interface SubstitutionTimeoutLog {
  eventId: string;
  seq: number;
  period: number;
  periodLabel: string;
  clockSeconds: number;
  clockFormatted: string;
  side: MatchSide;
  type: "SUBSTITUTION" | "TIMEOUT";
  description: string;
}

export interface MatchBoxScore {
  matchId: number;
  homeScore: number;
  awayScore: number;
  home: TeamBoxScore;
  away: TeamBoxScore;
  periods: PeriodScore[];
  runningScore: RunningScoreEntry[];
  logs: SubstitutionTimeoutLog[];
}

/** Formats clock seconds into mm:ss */
export function formatClock(clockSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(clockSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/** Calculates percentage string: e.g. 50% or '-' if attempts === 0 */
export function formatPercentage(made: number, attempts: number): { value: number; formatted: string } {
  if (attempts <= 0) {
    return { value: 0, formatted: "-" };
  }
  const pct = Math.round((made / attempts) * 100);
  return {
    value: Number(((made / attempts) * 100).toFixed(1)),
    formatted: `${pct}%`,
  };
}

/**
 * Calculates individual Player Efficiency (EFF) according to standard Korfball formula:
 * EFF = (SM + RIM + PM + TOT + AS + IT + D) - (SA + RIA + PA - SM - RIM - PM) - TOV
 */
export function calculatePlayerEff(stats: {
  sm: number;
  sa: number;
  rim: number;
  ria: number;
  pm: number;
  pa: number;
  tot: number;
  as: number;
  it: number;
  d: number;
  tov: number;
}): number {
  const positive = stats.sm + stats.rim + stats.pm + stats.tot + stats.as + stats.it + stats.d;
  const missed = stats.sa - stats.sm + (stats.ria - stats.rim) + (stats.pa - stats.pm);
  return positive - missed - stats.tov;
}

/**
 * Pure function: calculates the complete box score, running score, and logs for a match.
 */
export function calculateMatchBoxScore(
  match: CalculatorMatchInfo,
  players: CalculatorPlayer[],
  events: CalculatorEvent[],
): MatchBoxScore {
  // 1. Filter out soft-deleted events and sort by seq/chronology
  const activeEvents = events
    .filter((e) => !e.deletedAt)
    .sort((a, b) => {
      if (a.seq !== b.seq) return a.seq - b.seq;
      return 0;
    });

  // 2. Prepare player map
  const playerMap = new Map<number, CalculatorPlayer>();
  const playerStatsMap = new Map<
    number,
    {
      sm: number;
      sa: number;
      rim: number;
      ria: number;
      pm: number;
      pa: number;
      dr: number;
      or: number;
      d: number;
      as: number;
      it: number;
      tov: number;
      f: number;
      yc: number;
      rc: number;
    }
  >();

  for (const p of players) {
    playerMap.set(p.id, p);
    playerStatsMap.set(p.id, {
      sm: 0,
      sa: 0,
      rim: 0,
      ria: 0,
      pm: 0,
      pa: 0,
      dr: 0,
      or: 0,
      d: 0,
      as: 0,
      it: 0,
      tov: 0,
      f: 0,
      yc: 0,
      rc: 0,
    });
  }

  // 3. Process events
  let homeTeamTovt = 0;
  let awayTeamTovt = 0;

  let currentHomeScore = 0;
  let currentAwayScore = 0;

  const runningScore: RunningScoreEntry[] = [];
  const logs: SubstitutionTimeoutLog[] = [];

  // Period scores accumulator
  const periodScoresMap = new Map<number, { home: number; away: number }>();
  const periodCount = Math.max(1, match.periodCount || 2);
  for (let p = 1; p <= periodCount; p++) {
    periodScoresMap.set(p, { home: 0, away: 0 });
  }

  for (const event of activeEvents) {
    const isHome = event.side === "HOME";
    const period = event.period;

    if (!periodScoresMap.has(period)) {
      periodScoresMap.set(period, { home: 0, away: 0 });
    }
    const currentPeriodScore = periodScoresMap.get(period)!;

    // Track player stats if matchPlayerId provided
    const stats = event.matchPlayerId ? playerStatsMap.get(event.matchPlayerId) : undefined;

    switch (event.type) {
      case "SHOT_MADE": {
        if (stats) {
          stats.sm += 1;
          stats.sa += 1;
        }
        if (isHome) {
          currentHomeScore += 1;
          currentPeriodScore.home += 1;
        } else {
          currentAwayScore += 1;
          currentPeriodScore.away += 1;
        }
        const player = event.matchPlayerId ? playerMap.get(event.matchPlayerId) : undefined;
        runningScore.push({
          eventId: event.id,
          seq: event.seq,
          period: event.period,
          periodLabel: `B${event.period}`,
          clockSeconds: event.clockSeconds,
          clockFormatted: formatClock(event.clockSeconds),
          side: event.side,
          matchPlayerId: event.matchPlayerId ?? null,
          athleteName: player?.athleteName ?? (isHome ? match.homeTeamName : match.awayTeamName),
          jerseyNumber: player?.jerseyNumber ?? null,
          actionType: "SHOT_MADE",
          actionLabel: "Shoot",
          shotSector: event.shotSector ?? null,
          shotDistanceZone: event.shotDistanceZone ?? null,
          homeScore: currentHomeScore,
          awayScore: currentAwayScore,
        });
        break;
      }

      case "SHOT_MISSED": {
        if (stats) {
          stats.sa += 1;
        }
        break;
      }

      case "RUNNING_IN_MADE": {
        if (stats) {
          stats.rim += 1;
          stats.ria += 1;
        }
        if (isHome) {
          currentHomeScore += 1;
          currentPeriodScore.home += 1;
        } else {
          currentAwayScore += 1;
          currentPeriodScore.away += 1;
        }
        const player = event.matchPlayerId ? playerMap.get(event.matchPlayerId) : undefined;
        runningScore.push({
          eventId: event.id,
          seq: event.seq,
          period: event.period,
          periodLabel: `B${event.period}`,
          clockSeconds: event.clockSeconds,
          clockFormatted: formatClock(event.clockSeconds),
          side: event.side,
          matchPlayerId: event.matchPlayerId ?? null,
          athleteName: player?.athleteName ?? (isHome ? match.homeTeamName : match.awayTeamName),
          jerseyNumber: player?.jerseyNumber ?? null,
          actionType: "RUNNING_IN_MADE",
          actionLabel: "Running In",
          shotSector: event.shotSector ?? null,
          shotDistanceZone: event.shotDistanceZone ?? null,
          homeScore: currentHomeScore,
          awayScore: currentAwayScore,
        });
        break;
      }

      case "RUNNING_IN_MISSED": {
        if (stats) {
          stats.ria += 1;
        }
        break;
      }

      case "PENALTY_MADE": {
        if (stats) {
          stats.pm += 1;
          stats.pa += 1;
        }
        if (isHome) {
          currentHomeScore += 1;
          currentPeriodScore.home += 1;
        } else {
          currentAwayScore += 1;
          currentPeriodScore.away += 1;
        }
        const player = event.matchPlayerId ? playerMap.get(event.matchPlayerId) : undefined;
        runningScore.push({
          eventId: event.id,
          seq: event.seq,
          period: event.period,
          periodLabel: `B${event.period}`,
          clockSeconds: event.clockSeconds,
          clockFormatted: formatClock(event.clockSeconds),
          side: event.side,
          matchPlayerId: event.matchPlayerId ?? null,
          athleteName: player?.athleteName ?? (isHome ? match.homeTeamName : match.awayTeamName),
          jerseyNumber: player?.jerseyNumber ?? null,
          actionType: "PENALTY_MADE",
          actionLabel: "Penalty",
          shotSector: event.shotSector ?? null,
          shotDistanceZone: event.shotDistanceZone ?? null,
          homeScore: currentHomeScore,
          awayScore: currentAwayScore,
        });
        break;
      }

      case "PENALTY_MISSED": {
        if (stats) {
          stats.pa += 1;
        }
        break;
      }

      case "REBOUND_DEF": {
        if (stats) {
          stats.dr += 1;
        }
        break;
      }

      case "REBOUND_OFF": {
        if (stats) {
          stats.or += 1;
        }
        break;
      }

      case "DECK": {
        if (stats) {
          stats.d += 1;
        }
        break;
      }

      case "ASSIST": {
        if (stats) {
          stats.as += 1;
        }
        break;
      }

      case "INTERCEPT": {
        if (stats) {
          stats.it += 1;
        }
        break;
      }

      case "TURNOVER": {
        if (stats) {
          stats.tov += 1;
        }
        break;
      }

      case "TEAM_TURNOVER": {
        if (isHome) {
          homeTeamTovt += 1;
        } else {
          awayTeamTovt += 1;
        }
        break;
      }

      case "FOUL": {
        if (stats) {
          stats.f += 1;
        }
        break;
      }

      case "YELLOW_CARD": {
        if (stats) {
          stats.yc += 1;
        }
        break;
      }

      case "RED_CARD": {
        if (stats) {
          stats.rc += 1;
        }
        break;
      }

      case "SUBSTITUTION": {
        const teamLabel = isHome ? match.homeTeamName : match.awayTeamName;
        const outPlayer = event.matchPlayerId ? playerMap.get(event.matchPlayerId) : undefined;
        const inPlayer = event.subInPlayerId ? playerMap.get(event.subInPlayerId) : undefined;

        const outText = outPlayer ? `#${outPlayer.jerseyNumber} ${outPlayer.athleteName}` : "pemain";
        const inText = inPlayer ? `#${inPlayer.jerseyNumber} ${inPlayer.athleteName}` : "pemain";

        logs.push({
          eventId: event.id,
          seq: event.seq,
          period: event.period,
          periodLabel: `B${event.period}`,
          clockSeconds: event.clockSeconds,
          clockFormatted: formatClock(event.clockSeconds),
          side: event.side,
          type: "SUBSTITUTION",
          description: `Substitusi ${teamLabel} — keluar ${outText}, masuk ${inText}`,
        });
        break;
      }

      case "TIMEOUT": {
        const teamLabel = isHome ? match.homeTeamName : match.awayTeamName;
        logs.push({
          eventId: event.id,
          seq: event.seq,
          period: event.period,
          periodLabel: `B${event.period}`,
          clockSeconds: event.clockSeconds,
          clockFormatted: formatClock(event.clockSeconds),
          side: event.side,
          type: "TIMEOUT",
          description: `Time-out ${teamLabel}`,
        });
        break;
      }

      case "PERIOD_START":
      case "PERIOD_END":
        // Clock markers, not in player stat/sub log
        break;
    }
  }

  // 4. Build Player Box Scores
  const homePlayers: PlayerBoxScore[] = [];
  const awayPlayers: PlayerBoxScore[] = [];

  for (const player of players) {
    const raw = playerStatsMap.get(player.id) ?? {
      sm: 0,
      sa: 0,
      rim: 0,
      ria: 0,
      pm: 0,
      pa: 0,
      dr: 0,
      or: 0,
      d: 0,
      as: 0,
      it: 0,
      tov: 0,
      f: 0,
      yc: 0,
      rc: 0,
    };

    const tot = raw.dr + raw.or;
    const pts = raw.sm + raw.rim + raw.pm;
    const fgs = formatPercentage(raw.sm, raw.sa);
    const fgr = formatPercentage(raw.rim, raw.ria);
    const p = formatPercentage(raw.pm, raw.pa);
    const eff = calculatePlayerEff({
      sm: raw.sm,
      sa: raw.sa,
      rim: raw.rim,
      ria: raw.ria,
      pm: raw.pm,
      pa: raw.pa,
      tot,
      as: raw.as,
      it: raw.it,
      d: raw.d,
      tov: raw.tov,
    });

    const boxScore: PlayerBoxScore = {
      id: player.id,
      athleteId: player.athleteId,
      athleteName: player.athleteName,
      sex: player.sex,
      sexLabel: player.sex === "MALE" ? "L" : "P",
      jerseyNumber: player.jerseyNumber,
      side: player.side,
      isStarter: player.isStarter,
      sm: raw.sm,
      sa: raw.sa,
      pctFgs: fgs.value,
      pctFgsFormatted: fgs.formatted,
      rim: raw.rim,
      ria: raw.ria,
      pctFgr: fgr.value,
      pctFgrFormatted: fgr.formatted,
      pm: raw.pm,
      pa: raw.pa,
      pctP: p.value,
      pctPFormatted: p.formatted,
      dr: raw.dr,
      or: raw.or,
      tot,
      d: raw.d,
      as: raw.as,
      it: raw.it,
      tov: raw.tov,
      f: raw.f,
      yc: raw.yc,
      rc: raw.rc,
      pts,
      eff,
    };

    if (player.side === "HOME") {
      homePlayers.push(boxScore);
    } else {
      awayPlayers.push(boxScore);
    }
  }

  // Helper to build team aggregates
  const buildTeamBoxScore = (
    side: MatchSide,
    teamId: number,
    teamName: string,
    coach: string | null | undefined,
    assistantCoach: string | null | undefined,
    playerList: PlayerBoxScore[],
    tovt: number,
  ): TeamBoxScore => {
    let sm = 0;
    let sa = 0;
    let rim = 0;
    let ria = 0;
    let pm = 0;
    let pa = 0;
    let dr = 0;
    let or = 0;
    let tot = 0;
    let d = 0;
    let as = 0;
    let it = 0;
    let tov = 0;
    let f = 0;
    let yc = 0;
    let rc = 0;
    let pts = 0;
    let eff = 0;

    for (const p of playerList) {
      sm += p.sm;
      sa += p.sa;
      rim += p.rim;
      ria += p.ria;
      pm += p.pm;
      pa += p.pa;
      dr += p.dr;
      or += p.or;
      tot += p.tot;
      d += p.d;
      as += p.as;
      it += p.it;
      tov += p.tov;
      f += p.f;
      yc += p.yc;
      rc += p.rc;
      pts += p.pts;
      eff += p.eff;
    }

    const fgs = formatPercentage(sm, sa);
    const fgr = formatPercentage(rim, ria);
    const p = formatPercentage(pm, pa);

    return {
      side,
      teamId,
      teamName,
      coach: coach ?? null,
      assistantCoach: assistantCoach ?? null,
      sm,
      sa,
      pctFgs: fgs.value,
      pctFgsFormatted: fgs.formatted,
      rim,
      ria,
      pctFgr: fgr.value,
      pctFgrFormatted: fgr.formatted,
      pm,
      pa,
      pctP: p.value,
      pctPFormatted: p.formatted,
      dr,
      or,
      tot,
      d,
      as,
      it,
      tov,
      tovt,
      f,
      yc,
      rc,
      pts,
      eff,
      players: playerList,
    };
  };

  const home = buildTeamBoxScore(
    "HOME",
    match.homeTeamId,
    match.homeTeamName,
    match.homeHeadCoach,
    match.homeAssistantCoach,
    homePlayers,
    homeTeamTovt,
  );

  const away = buildTeamBoxScore(
    "AWAY",
    match.awayTeamId,
    match.awayTeamName,
    match.awayHeadCoach,
    match.awayAssistantCoach,
    awayPlayers,
    awayTeamTovt,
  );

  // 5. Build Period Scores array
  const periods: PeriodScore[] = [];
  const sortedPeriods = Array.from(periodScoresMap.keys()).sort((a, b) => a - b);
  for (const p of sortedPeriods) {
    const sc = periodScoresMap.get(p)!;
    periods.push({
      period: p,
      periodLabel: `B${p}`,
      home: sc.home,
      away: sc.away,
    });
  }

  return {
    matchId: match.id,
    homeScore: currentHomeScore,
    awayScore: currentAwayScore,
    home,
    away,
    periods,
    runningScore,
    logs,
  };
}

export { calculateMatchBoxScore as calculateBoxScore };
