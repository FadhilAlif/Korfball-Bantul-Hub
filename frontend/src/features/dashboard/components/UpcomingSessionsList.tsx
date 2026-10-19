"use client";

import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { formatWibDate, formatWibTime } from "@/shared/lib/format-date";

interface UpcomingSessionsListProps {
  sessions: {
    id: number;
    title: string;
    sessionType: string;
    status: string;
    startsAt: string;
    endsAt: string;
    venue: string | null;
  }[];
}

export function UpcomingSessionsList({ sessions }: UpcomingSessionsListProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <h3 className="font-semibold text-[15px] text-foreground">Sesi Mendatang</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Jadwal sesi latihan & pertandingan berikutnya</p>
        </div>
        <Link
          href="/sessions"
          className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <span>Lihat Semua</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="divide-y divide-border flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Tidak ada sesi mendatang yang dijadwalkan.
          </div>
        ) : (
          sessions.map((s) => {
            const dateStr = formatWibDate(s.startsAt, {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const startTime = formatWibTime(s.startsAt);
            const endTime = formatWibTime(s.endsAt);

            return (
              <div
                key={s.id}
                className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center font-bold shrink-0 leading-none">
                    <Calendar size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{s.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap font-mono">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>
                        {startTime}–{endTime}
                      </span>
                      {s.venue && (
                        <span className="font-sans truncate max-w-[120px] text-muted-foreground/80">• {s.venue}</span>
                      )}
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] shrink-0">
                  {s.status}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
