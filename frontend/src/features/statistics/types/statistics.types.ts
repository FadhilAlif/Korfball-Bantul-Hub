export interface PlayerLeaderboardItem {
  athleteId: number;
  athleteName: string;
  nickname: string | null;
  photoUrl?: string | null;
  sex: "MALE" | "FEMALE";
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

export interface PlayerLeaderboardQuery {
  teamId?: number;
  from?: string;
  to?: string;
  types?: string;
  minGp?: number;
  sort?: string;
  direction?: "asc" | "desc";
  page?: number;
  limit?: number;
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
  side: "HOME" | "AWAY";
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

export interface EffTrendItem {
  matchId: number;
  scheduledAt: string;
  opponentTeam: string;
  eff: number;
  pts: number;
}

export interface PlayerProfileStats {
  athlete: {
    id: number;
    fullName: string;
    nickname: string | null;
    sex: "MALE" | "FEMALE";
    jerseyNumber: number | null;
    photoUrl: string | null;
    teamId: number;
    teamName: string;
    status: string;
  };
  summary: PlayerLeaderboardItem;
  gameLogs: PlayerGameLogItem[];
  effTrend: EffTrendItem[];
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

export interface TeamStatsQuery {
  teamId?: number;
  from?: string;
  to?: string;
  types?: string;
}

export interface AttendanceTrendItem {
  sessionId: number;
  sessionTitle: string;
  date: string;
  present: number;
  late: number;
  excused: number;
  absent: number;
  rate: number;
}

export interface AttendanceTrendQuery {
  from?: string;
  to?: string;
}

export interface DashboardSummary {
  role: "staff" | "athlete";
  internalTeamName: string;
  todaySession: {
    id: number;
    title: string;
    sessionType: string;
    status: string;
    startsAt: string;
    endsAt: string;
    venue: string | null;
    checkinCode?: string;
    myAttendance?: {
      status: "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";
      recordedMethod: string;
      checkedInAt: string | null;
      notes: string | null;
    } | null;
  } | null;
  upcomingSessions: {
    id: number;
    title: string;
    sessionType: string;
    status: string;
    startsAt: string;
    endsAt: string;
    venue: string | null;
  }[];
  activeOrUpcomingMatch: {
    id: number;
    scheduledAt: string;
    matchType: string;
    matchFormat: string;
    venue: string | null;
    status: "SCHEDULED" | "LIVE" | "FINISHED";
    currentPeriod: number | null;
    homeTeamId: number;
    homeTeamName: string;
    awayTeamId: number;
    awayTeamName: string;
    homeScore: number;
    awayScore: number;
  } | null;
  attendanceRate30d: number | null;
  activeAthletesCount?: number;
  teamSummary90d?: {
    matchesCount: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  myStats?: {
    gp: number;
    pts: number;
    fgPct: number | null;
    avgEff: number;
  };
  recentMatches: {
    id: number;
    scheduledAt: string;
    matchType: string;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: number;
    awayScore: number;
    teamScore?: number;
    opponentScore?: number;
    opponentName?: string;
    result?: "W" | "L" | "D";
  }[];
  attendanceTrend?: AttendanceTrendItem[];
  teamShooting?: {
    rim: number;
    ria: number;
    pctFgr: number | null;
    sm: number;
    sa: number;
    pctFgs: number | null;
    pm: number;
    pa: number;
    pctP: number | null;
    totalMade: number;
    totalAttempts: number;
    pctFg: number | null;
  } | null;
}
