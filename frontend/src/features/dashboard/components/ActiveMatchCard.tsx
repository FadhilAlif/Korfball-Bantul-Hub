"use client";

import { Calendar, ChevronRight, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatWibDate, formatWibTime } from "@/shared/lib/format-date";

interface ActiveMatchCardProps {
  match: {
    id: number;
    scheduledAt: string;
    matchType: string;
    matchFormat: string;
    venue: string | null;
    status: "SCHEDULED" | "LIVE" | "FINISHED";
    currentPeriod: number | null;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: number;
    awayScore: number;
  } | null;
}

export function ActiveMatchCard({ match }: ActiveMatchCardProps) {
  if (!match) return null;

  const isLive = match.status === "LIVE";
  const dateStr = formatWibDate(match.scheduledAt, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = formatWibTime(match.scheduledAt);

  return (
    <div
      className={`border rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isLive ? "bg-rose-500/5 border-rose-500/40 dark:bg-rose-950/20" : "bg-card border-border"
      }`}
    >
      {isLive && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />}

      <div className="flex items-start sm:items-center gap-3.5 pl-1.5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isLive ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          {isLive ? <Play size={22} className="animate-pulse" /> : <Trophy size={22} />}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Live Babak {match.currentPeriod ?? 1}
              </span>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Pertandingan Terdekat
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {match.matchType} • {match.matchFormat}
            </span>
          </div>

          {/* Teams and score */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="font-bold text-base text-foreground">{match.homeTeamName}</span>
            {isLive ? (
              <span className="px-2 py-0.5 bg-background border border-border rounded-md font-mono font-bold text-lg text-primary shadow-xs">
                {match.homeScore} : {match.awayScore}
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">vs</span>
            )}
            <span className="font-bold text-base text-foreground">{match.awayTeamName}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Calendar size={13} />
            <span>
              {dateStr}, {timeStr} WIB
            </span>
            {match.venue && <span>• {match.venue}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
        {isLive ? (
          <>
            <Link href={`/matches/${match.id}/record`}>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5 shadow-xs">
                <Play size={13} fill="currentColor" />
                <span>Live Recorder</span>
              </Button>
            </Link>
            <Link href={`/matches/${match.id}/box-score`}>
              <Button size="sm" variant="outline">
                Box Score
              </Button>
            </Link>
          </>
        ) : (
          <Link href={`/matches/${match.id}`}>
            <Button size="sm" variant="outline" className="gap-1">
              <span>Detail Pertandingan</span>
              <ChevronRight size={14} />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
