"use client";

import { CalendarCheck2, CheckCircle2, FileText, KeyRound, MapPin, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSessions } from "@/features/sessions/hooks";
import { Badge, Button, buttonVariants } from "@/shared/components/ui";
import { usePermission } from "@/shared/hooks";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { useAuthStore } from "@/shared/stores/authStore";
import { useCancelExcuse, useMyAttendanceHistory } from "../hooks";
import { ExcuseRequestModal } from "./ExcuseRequestModal";
import { SelfCheckinModal } from "./SelfCheckinModal";

export function AthleteTodaySessionCard() {
  const canSelfCheckin = usePermission("attendance:self");
  const user = useAuthStore((s) => s.user);
  const [isCheckinOpen, setCheckinOpen] = useState(false);
  const [excuseSession, setExcuseSession] = useState<{ id: number; title: string } | null>(null);

  const { data: sessionsData } = useSessions({
    page: 1,
    limit: 5,
    status: "SCHEDULED",
  });

  const { data: myHistoryData } = useMyAttendanceHistory();
  const cancelExcuse = useCancelExcuse();

  if (!canSelfCheckin || !user?.athlete) {
    return null;
  }

  const scheduledSessions = sessionsData?.data ?? [];
  // Pick the nearest upcoming/active scheduled session
  const nextSession = [...scheduledSessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )[0];

  const myRecordForNext = nextSession ? myHistoryData?.history.find((h) => h.sessionId === nextSession.id) : undefined;

  const isBeforeStart = nextSession ? new Date() < new Date(nextSession.startsAt) : false;

  const handleCancelExcuse = (sessionId: number) => {
    cancelExcuse.mutate(sessionId, {
      onSuccess: () => toast.success("Pengajuan izin dibatalkan"),
      onError: (err) => toast.error("Gagal membatalkan izin", { description: getErrorMessage(err) }),
    });
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
            <CalendarCheck2 size={14} />
            Panel Presensi Atlet — {user.athlete.fullName}
            {user.athlete.jerseyNumber !== null ? ` (#${user.athlete.jerseyNumber})` : ""}
          </div>
          {nextSession ? (
            <>
              <h2 className="text-base font-semibold">{nextSession.title}</h2>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <span>
                  {new Intl.DateTimeFormat("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Jakarta",
                  }).format(new Date(nextSession.startsAt))}{" "}
                  WIB
                </span>
                {nextSession.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {nextSession.venue}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Saat ini belum ada sesi latihan terjadwal berikutnya. Anda tetap dapat memasukkan kode check-in jika sesi
              sedang berlangsung.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={() => setCheckinOpen(true)} className="gap-1.5">
            <KeyRound size={14} />
            Check-In Kode 6 Digit
          </Button>

          {nextSession && !myRecordForNext && isBeforeStart && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExcuseSession({ id: nextSession.id, title: nextSession.title })}
              className="gap-1.5"
            >
              <FileText size={14} />
              Ajukan Izin
            </Button>
          )}

          {nextSession && myRecordForNext?.method === "EXCUSE_REQUEST" && isBeforeStart && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={cancelExcuse.isPending}
              onClick={() => handleCancelExcuse(nextSession.id)}
              className="gap-1.5"
            >
              <XCircle size={14} />
              Batalkan Izin
            </Button>
          )}

          <Link href="/attendance/me" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Riwayat Saya
          </Link>
        </div>
      </div>

      {myRecordForNext && (
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span className="text-muted-foreground">Status Anda pada sesi ini:</span>
            <Badge
              variant={
                myRecordForNext.status === "PRESENT"
                  ? "success"
                  : myRecordForNext.status === "LATE"
                    ? "warning"
                    : myRecordForNext.status === "EXCUSED"
                      ? "info"
                      : "danger"
              }
              dot
            >
              {myRecordForNext.status === "PRESENT"
                ? "HADIR"
                : myRecordForNext.status === "LATE"
                  ? "TERLAMBAT"
                  : myRecordForNext.status === "EXCUSED"
                    ? "IZIN"
                    : "ABSEN"}
            </Badge>
          </div>
          {myRecordForNext.note && <span className="text-muted-foreground italic">"{myRecordForNext.note}"</span>}
        </div>
      )}

      <SelfCheckinModal isOpen={isCheckinOpen} onClose={() => setCheckinOpen(false)} />

      {excuseSession && (
        <ExcuseRequestModal
          isOpen={!!excuseSession}
          onClose={() => setExcuseSession(null)}
          sessionId={excuseSession.id}
          sessionTitle={excuseSession.title}
        />
      )}
    </div>
  );
}
