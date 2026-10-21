export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
export type MatchType = "OFFICIAL" | "FRIENDLY" | "SCRIMMAGE";
export type MatchFormat = "K8" | "K4";
export type MatchSide = "HOME" | "AWAY";
export type Sex = "MALE" | "FEMALE";

export type MatchEventType =
  | "SHOT_MADE"
  | "SHOT_MISSED"
  | "RUNNING_IN_MADE"
  | "RUNNING_IN_MISSED"
  | "PENALTY_MADE"
  | "PENALTY_MISSED"
  | "REBOUND_DEF"
  | "REBOUND_OFF"
  | "DECK"
  | "ASSIST"
  | "INTERCEPT"
  | "TURNOVER"
  | "TEAM_TURNOVER"
  | "TURNOVER_PERSONAL"
  | "TURNOVER_TEAM"
  | "FOUL"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "SUBSTITUTION"
  | "TIMEOUT"
  | "PERIOD_START"
  | "PERIOD_END";

export interface MatchPlayerItem {
  id: number;
  matchId: number;
  athleteId: number;
  athleteName: string;
  athleteNickname?: string | null;
  sex: Sex;
  jerseyNumber: number;
  side: MatchSide;
  isStarter: boolean;
  isOnCourt: boolean;
  hasRedCard?: boolean;
}

export interface MatchItem {
  id: number;
  type: MatchType;
  format: MatchFormat;
  status: MatchStatus;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeLabel?: string | null;
  awayLabel?: string | null;
  homeColor: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  currentPeriod: number;
  periodCount: number;
  periodDurationMinutes: number;
  clockRemainingSeconds: number;
  clockIsRunning?: boolean;
  competition?: string | null;
  gameNumber?: string | null;
  venue?: string | null;
  scheduledAt: string;
  trackShotZone: boolean;
  homePlayersCount?: number;
  awayPlayersCount?: number;
}

export interface SideCourtState {
  side: MatchSide;
  onCourtPlayerIds: number[];
  benchPlayerIds: number[];
  redCardPlayerIds: number[];
}

export interface MatchCourtState {
  home: SideCourtState;
  away: SideCourtState;
}

export interface MatchDetail extends MatchItem {
  clockRunningSince?: string | null;
  juryChair?: string | null;
  juryMembers?: string | null;
  referees?: string | null;
  homeHeadCoach?: string | null;
  homeAssistantCoach?: string | null;
  awayHeadCoach?: string | null;
  awayAssistantCoach?: string | null;
  sessionId?: number | null;
  notes?: string | null;
  lineup?: MatchPlayerItem[];
  players?: MatchPlayerItem[];
  courtState?: MatchCourtState;
  events?: BatchEventItem[];
}

export interface LineupPlayerItemInput {
  athleteId: number;
  jerseyNumber: number;
  isStarter: boolean;
}

export interface SetLineupPayload {
  side: MatchSide;
  players: LineupPlayerItemInput[];
}

export interface BatchEventItem {
  id: string;
  side: MatchSide;
  type: MatchEventType;
  matchPlayerId?: number | null;
  subInPlayerId?: number | null;
  relatedEventId?: string | null;
  period: number;
  clockSeconds: number;
  shotSector?: number | null;
  shotDistanceZone?: number | null;
  note?: string | null;
  clientRecordedAt: string;
}

export interface BatchEventsResponse {
  events: {
    id: string;
    seq: number;
    side: MatchSide;
    type: MatchEventType;
    period: number;
    clockSeconds: number;
  }[];
  homeScore: number;
  awayScore: number;
  lastSeq: number;
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

export interface BoxScoreData {
  matchId?: number;
  match?: MatchDetail;
  homeScore?: number;
  awayScore?: number;
  home: TeamBoxScore;
  away: TeamBoxScore;
  periods?: PeriodScore[];
  periodScores?: PeriodScore[];
  runningScore: RunningScoreEntry[];
  logs: SubstitutionTimeoutLog[];
}

export type OutboxSyncStatus = "synced" | "syncing" | "offline" | "error";
