"use client";

import { ClipboardCheck, FileText, KeyRound, XCircle } from "lucide-react";
import { useState } from "react";
import { useSessions } from "@/features/sessions/hooks";
import { PageHeader, RefreshButton } from "@/shared/components/common";
import {
  Badge,
  Button,
  Input,
  TableCell,
  TableEmptyRow,
  TableHeader,
  TableLoadingRow,
  TableRow,
  TableShell,
} from "@/shared/components/ui";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { ExcuseRequestModal } from "./components/ExcuseRequestModal";
import { SelfCheckinModal } from "./components/SelfCheckinModal";
import { useCancelExcuse, useMyAttendanceHistory } from "./hooks/useAttendance";
import type { AttendanceMethod, AttendanceStatus } from "./types";

function StatusBadge({ status }: { status: AttendanceStatus }) {
  if (status === "PRESENT")
    return (
      <Badge variant="success" dot>
        Hadir
      </Badge>
    );
  if (status === "LATE")
    return (
      <Badge variant="warning" dot>
        Terlambat
      </Badge>
    );
  if (status === "EXCUSED")
    return (
      <Badge variant="info" dot>
        Izin
      </Badge>
    );
  return (
    <Badge variant="danger" dot>
      Absen
    </Badge>
  );
}

function MethodLabel({ method, distanceMeters }: { method: AttendanceMethod; distanceMeters?: number | null }) {
  if (method === "SELF_CHECKIN") {
    return distanceMeters !== null && distanceMeters !== undefined
      ? `Self Check-in · GPS (${distanceMeters}m)`
      : "Self Check-in · Kode";
  }
  if (method === "EXCUSE_REQUEST") return "Izin Mandiri";
  return "Dicatat Official";
}

export function MyAttendancePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isCheckinOpen, setCheckinOpen] = useState(false);
  const [excuseSession, setExcuseSession] = useState<{ id: number; title: string } | null>(null);

  const { data, isFetching, isError, refetch } = useMyAttendanceHistory({ from, to });
  const { data: scheduledData } = useSessions({ page: 1, limit: 10, status: "SCHEDULED" });
  const cancelExcuse = useCancelExcuse();

  const summary = data?.summary;
  const history = data?.history ?? [];
  const upcomingSessions = (scheduledData?.data ?? []).filter((s) => new Date() < new Date(s.startsAt));

  const handleCancelExcuse = (sessionId: number) => {
    cancelExcuse.mutate(sessionId, {
      onSuccess: () => toast.success("Pengajuan izin berhasil dibatalkan"),
      onError: (err) => toast.error("Gagal membatalkan izin", { description: getErrorMessage(err) }),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Kehadiran Saya"
        description="Lakukan check-in mandiri menggunakan lokasi GPS di WIFA Sport Center atau kode 6 karakter, ajukan izin sebelum sesi dimulai, dan pantau riwayat kehadiran Anda."
      >
        <Button type="button" size="sm" className="gap-1.5" onClick={() => setCheckinOpen(true)}>
          <KeyRound size={14} />
          Check-In Presensi
        </Button>
      </PageHeader>

      {isError && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          Akun Anda belum ditautkan ke profil atlet Korfball Bantul. Hubungi Pelatih/Admin untuk menautkan akun di menu
          Atlet.
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-xs text-muted-foreground">Tingkat Kehadiran</div>
            <div className="text-2xl font-bold text-primary mt-0.5">
              {summary.attendanceRate !== null ? `${summary.attendanceRate}%` : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="text-xs text-muted-foreground">Hadir Tepat Waktu</div>
            <div className="text-2xl font-bold text-success mt-0.5">{summary.present}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="text-xs text-muted-foreground">Terlambat</div>
            <div className="text-2xl font-bold text-warning mt-0.5">{summary.late}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="text-xs text-muted-foreground">Izin</div>
            <div className="text-2xl font-bold text-primary mt-0.5">{summary.excused}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="text-xs text-muted-foreground">Absen</div>
            <div className="text-2xl font-bold text-destructive mt-0.5">{summary.absent}</div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions for Excuse Submission */}
      {upcomingSessions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Jadwal Sesi Mendatang (Pengajuan Izin)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingSessions.slice(0, 4).map((s) => {
              const existing = history.find((h) => h.sessionId === s.id);
              return (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      }).format(new Date(s.startsAt))}{" "}
                      WIB
                    </div>
                  </div>

                  {existing?.method === "EXCUSE_REQUEST" ? (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      isLoading={cancelExcuse.isPending}
                      onClick={() => handleCancelExcuse(s.id)}
                    >
                      <XCircle size={13} />
                      Batal Izin
                    </Button>
                  ) : !existing ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExcuseSession({ id: s.id, title: s.title })}
                    >
                      <FileText size={13} />
                      Ajukan Izin
                    </Button>
                  ) : (
                    <StatusBadge status={existing.status} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Filter Toolbar */}
      <div className="flex gap-2.5 flex-wrap items-center p-3.5 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            height="sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[145px]"
            aria-label="Dari tanggal"
          />
          <span className="text-xs text-muted-foreground">s/d</span>
          <Input
            type="date"
            height="sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-[145px]"
            aria-label="Sampai tanggal"
          />
        </div>
        <div className="flex-1" />
        <RefreshButton isLoading={isFetching} onClick={() => refetch()} />
      </div>

      {/* History Table */}
      <TableShell>
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <TableHeader>Sesi Latihan</TableHeader>
              <TableHeader>Tanggal & Jam</TableHeader>
              <TableHeader>Status Kehadiran</TableHeader>
              <TableHeader>Metode Pencatatan</TableHeader>
              <TableHeader>Catatan</TableHeader>
            </tr>
          </thead>
          <tbody>
            <TableLoadingRow isLoading={isFetching} colSpan={5} />
            <TableEmptyRow
              isEmpty={!isFetching && history.length === 0}
              colSpan={5}
              icon={<ClipboardCheck size={24} strokeWidth={1.5} aria-hidden />}
              title="Belum ada riwayat kehadiran"
              description="Riwayat presensi akan muncul setelah Anda melakukan check-in atau sesi latihan difinalisasi."
            />
            {history.map((item) => (
              <TableRow key={item.sessionId}>
                <TableCell className="font-semibold">{item.sessionTitle}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Jakarta",
                  }).format(new Date(item.sessionStartsAt))}{" "}
                  WIB
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <MethodLabel method={item.method} distanceMeters={item.checkinDistanceMeters} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{item.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </TableShell>

      <SelfCheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setCheckinOpen(false)}
        session={scheduledData?.data?.[0] ?? null}
      />

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
