"use client";

import { Calendar, Check, Clock, Copy, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatWibTime } from "@/shared/lib/format-date";

interface TodaySessionStaffCardProps {
  session: {
    id: number;
    title: string;
    sessionType: string;
    status: string;
    startsAt: string;
    endsAt: string;
    venue: string | null;
    checkinCode?: string;
  } | null;
}

export function TodaySessionStaffCard({ session }: TodaySessionStaffCardProps) {
  const [copied, setCopied] = useState(false);

  if (!session) {
    return (
      <div className="bg-card border border-dashed border-border rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Tidak Ada Jadwal Sesi Hari Ini</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jadwal rutin Korfball Bantul: Selasa 18.00–20.00 WIB & Sabtu 19.00–21.00 WIB.
            </p>
          </div>
        </div>
        <Link href="/sessions">
          <Button variant="outline" size="sm">
            Kelola Sesi Latihan
          </Button>
        </Link>
      </div>
    );
  }

  const startTime = formatWibTime(session.startsAt);
  const endTime = formatWibTime(session.endsAt);

  const handleCopyCode = () => {
    if (!session.checkinCode) return;
    navigator.clipboard.writeText(session.checkinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />

      <div className="flex items-start sm:items-center gap-3.5 pl-1.5">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
          <Users size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Sesi Hari Ini</span>
            <Badge
              variant={session.status === "COMPLETED" ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0 h-4"
            >
              {session.status}
            </Badge>
          </div>
          <h3 className="font-bold text-base text-foreground mt-0.5">{session.title}</h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Clock size={13} />
              {startTime} – {endTime} WIB
            </span>
            {session.venue && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {session.venue}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
        {session.checkinCode && (
          <div className="flex items-center gap-1.5 bg-muted/60 border border-border px-3 py-1.5 rounded-lg text-xs">
            <span className="text-muted-foreground">Kode:</span>
            <strong className="font-mono text-sm tracking-widest text-foreground">{session.checkinCode}</strong>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
              title="Salin Kode Presensi"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        )}

        <Link href={`/sessions/${session.id}/attendance`}>
          <Button size="sm" className="font-semibold shadow-xs">
            Buka Presensi
          </Button>
        </Link>
      </div>
    </div>
  );
}
