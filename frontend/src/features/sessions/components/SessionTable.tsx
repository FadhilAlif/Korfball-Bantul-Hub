"use client";

import { Ban, CalendarCheck2, ClipboardList, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ActionsMenu, MenuItem } from "@/shared/components/common";
import {
  Badge,
  buttonVariants,
  TableCell,
  TableEmptyRow,
  TableHeader,
  TableLoadingRow,
  TableRow,
  TableShell,
} from "@/shared/components/ui";
import type { SessionItem, SessionStatus, SessionType } from "../types";

const TYPE_LABEL: Record<SessionType, string> = {
  TRAINING: "Latihan",
  SCRIMMAGE: "Scrimmage",
  MATCH: "Match",
  OTHER: "Lainnya",
};

function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === "COMPLETED") {
    return (
      <Badge variant="success" dot>
        Selesai
      </Badge>
    );
  }
  if (status === "CANCELLED") {
    return (
      <Badge variant="danger" dot>
        Dibatalkan
      </Badge>
    );
  }
  return (
    <Badge variant="info" dot>
      Terjadwal
    </Badge>
  );
}

function formatWibDateTime(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateFmt = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(start);

  const timeFmt = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });

  return {
    dateLabel: dateFmt,
    timeLabel: `${timeFmt.format(start)} – ${timeFmt.format(end)} WIB`,
  };
}

interface SessionTableProps {
  sessions: SessionItem[];
  isFetching: boolean;
  isError?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAttendance: boolean;
  onEdit: (session: SessionItem) => void;
  onCancel: (session: SessionItem) => void;
  onDelete: (session: SessionItem) => void;
}

export const SessionTable = memo(function SessionTable({
  sessions,
  isFetching,
  isError,
  canEdit,
  canDelete,
  canViewAttendance,
  onEdit,
  onCancel,
  onDelete,
}: SessionTableProps) {
  return (
    <>
      {/* Mobile Card List (< md) */}
      <div className="flex flex-col gap-3 md:hidden">
        {isFetching && sessions.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Memuat jadwal sesi…
          </div>
        )}
        {!isFetching && !isError && sessions.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="text-sm font-semibold">Belum ada jadwal sesi</div>
            <div className="text-xs text-muted-foreground mt-1">
              Gunakan tombol Generate Sesi Rutin atau Buat Sesi untuk menjadwalkan latihan.
            </div>
          </div>
        )}
        {sessions.map((s) => {
          const { dateLabel, timeLabel } = formatWibDateTime(s.startsAt, s.endsAt);
          const sum = s.attendanceSummary;
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <Badge variant="outline">{TYPE_LABEL[s.type]}</Badge>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="font-semibold text-sm">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {dateLabel} · {timeLabel}
                  </div>
                  {s.venue && (
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <MapPin size={12} />
                      {s.venue}
                    </div>
                  )}
                </div>

                {(canEdit || canDelete) && (
                  <ActionsMenu>
                    {canEdit && s.status === "SCHEDULED" && (
                      <MenuItem icon={<Pencil size={14} />} onClick={() => onEdit(s)}>
                        Edit Sesi
                      </MenuItem>
                    )}
                    {canEdit && s.status === "SCHEDULED" && (
                      <MenuItem icon={<Ban size={14} />} destructive onClick={() => onCancel(s)}>
                        Batalkan Sesi
                      </MenuItem>
                    )}
                    {canDelete && (
                      <MenuItem icon={<Trash2 size={14} />} destructive onClick={() => onDelete(s)}>
                        Hapus Sesi
                      </MenuItem>
                    )}
                  </ActionsMenu>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-success font-medium">H:{sum.present}</span>
                  <span className="text-warning font-medium">T:{sum.late}</span>
                  <span className="text-primary font-medium">I:{sum.excused}</span>
                  <span className="text-destructive font-medium">A:{sum.absent}</span>
                </div>

                {canViewAttendance && (
                  <Link
                    href={`/sessions/${s.id}/attendance`}
                    className={buttonVariants({ variant: "primary", size: "sm", className: "h-8 text-xs gap-1.5" })}
                  >
                    <ClipboardList size={13} />
                    Presensi
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= md) */}
      <TableShell className="hidden md:block">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="w-12 px-4 py-2.5 border-b border-border" />
              <TableHeader>Sesi & Jadwal</TableHeader>
              <TableHeader>Jenis</TableHeader>
              <TableHeader>Kode Check-in</TableHeader>
              <TableHeader>Ringkasan Hadir</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="text-right">Aksi</TableHeader>
            </tr>
          </thead>
          <tbody>
            <TableLoadingRow isLoading={isFetching} colSpan={7} />
            {isError && !isFetching && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  Gagal memuat daftar sesi. Silakan muat ulang halaman.
                </td>
              </tr>
            )}
            <TableEmptyRow
              isEmpty={!isFetching && !isError && sessions.length === 0}
              colSpan={7}
              icon={<CalendarCheck2 size={24} strokeWidth={1.5} aria-hidden />}
              title="Belum ada jadwal sesi latihan"
              description="Klik tombol Generate Sesi Rutin (Selasa & Sabtu) atau Buat Sesi Baru."
            />
            {sessions.map((s) => {
              const { dateLabel, timeLabel } = formatWibDateTime(s.startsAt, s.endsAt);
              const sum = s.attendanceSummary;
              return (
                <TableRow key={s.id}>
                  <TableCell className="w-12">
                    {(canEdit || canDelete) && (
                      <ActionsMenu>
                        {canEdit && s.status === "SCHEDULED" && (
                          <MenuItem icon={<Pencil size={14} />} onClick={() => onEdit(s)}>
                            Edit Sesi
                          </MenuItem>
                        )}
                        {canEdit && s.status === "SCHEDULED" && (
                          <MenuItem icon={<Ban size={14} />} destructive onClick={() => onCancel(s)}>
                            Batalkan Sesi
                          </MenuItem>
                        )}
                        {canDelete && (
                          <MenuItem icon={<Trash2 size={14} />} destructive onClick={() => onDelete(s)}>
                            Hapus Sesi
                          </MenuItem>
                        )}
                      </ActionsMenu>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="font-semibold text-[13.5px]">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {dateLabel} · {timeLabel}
                    </div>
                    {s.venue && (
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                        <MapPin size={12} />
                        {s.venue}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{TYPE_LABEL[s.type]}</Badge>
                  </TableCell>

                  <TableCell>
                    <code className="font-mono font-bold tracking-widest text-xs bg-muted px-2.5 py-1 rounded-md border border-border">
                      {s.checkinCode}
                    </code>
                  </TableCell>

                  <TableCell>
                    <div className="inline-flex items-center gap-2 text-xs bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
                      <span className="text-success font-semibold" title="Hadir">
                        H: {sum.present}
                      </span>
                      <span className="text-border">·</span>
                      <span className="text-warning font-semibold" title="Terlambat">
                        T: {sum.late}
                      </span>
                      <span className="text-border">·</span>
                      <span className="text-primary font-semibold" title="Izin">
                        I: {sum.excused}
                      </span>
                      <span className="text-border">·</span>
                      <span className="text-destructive font-semibold" title="Absen">
                        A: {sum.absent}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>

                  <TableCell className="text-right">
                    {canViewAttendance && (
                      <Link
                        href={`/sessions/${s.id}/attendance`}
                        className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
                      >
                        <ClipboardList size={14} />
                        Lembar Presensi
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </table>
      </TableShell>
    </>
  );
});
