"use client";

import { ArrowLeft, CheckCheck, KeyRound, Lock, Maximize2, RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import { PageHeader, RefreshButton, SearchInput } from "@/shared/components/common";
import { Avatar, Badge, Button, buttonVariants, Input } from "@/shared/components/ui";
import { usePermission } from "@/shared/hooks";
import { CheckinCodeModal } from "./components/CheckinCodeModal";
import { FinalizeSessionModal } from "./components/FinalizeSessionModal";
import { useAttendanceSheetState } from "./hooks/useAttendanceSheetState";
import type { AttendanceMethod, AttendanceStatus } from "./types";

const STATUS_BUTTONS: Array<{
  value: AttendanceStatus;
  shortLabel: string;
  fullLabel: string;
  activeClass: string;
}> = [
  {
    value: "PRESENT",
    shortLabel: "H",
    fullLabel: "Hadir",
    activeClass: "bg-success text-white border-success shadow-xs",
  },
  {
    value: "LATE",
    shortLabel: "T",
    fullLabel: "Terlambat",
    activeClass: "bg-warning text-white border-warning shadow-xs",
  },
  {
    value: "EXCUSED",
    shortLabel: "I",
    fullLabel: "Izin",
    activeClass: "bg-primary text-white border-primary shadow-xs",
  },
  {
    value: "ABSENT",
    shortLabel: "A",
    fullLabel: "Absen",
    activeClass: "bg-destructive text-white border-destructive shadow-xs",
  },
];

function MethodBadge({
  method,
  isDirty,
  distanceMeters,
}: {
  method: AttendanceMethod | null;
  isDirty: boolean;
  distanceMeters?: number | null;
}) {
  if (isDirty) {
    return <Badge variant="warning">Belum Disimpan</Badge>;
  }
  if (method === "SELF_CHECKIN") {
    return (
      <Badge variant="info">
        {distanceMeters !== null && distanceMeters !== undefined
          ? `Self Check-in · GPS (${distanceMeters}m)`
          : "Self Check-in · Kode"}
      </Badge>
    );
  }
  if (method === "EXCUSE_REQUEST") {
    return <Badge variant="primary">Izin Mandiri</Badge>;
  }
  if (method === "OFFICIAL" || method === "MANUAL") {
    return <Badge variant="secondary">Official</Badge>;
  }
  return <span className="text-xs text-muted-foreground">Belum dicatat</span>;
}

interface AttendanceSheetPageProps {
  sessionId: number;
}

export function AttendanceSheetPage({ sessionId }: AttendanceSheetPageProps) {
  const {
    session,
    records,
    liveCounts,
    localEdits,
    dirtyCount,
    hasUnsavedChanges,
    search,
    setSearch,
    isCodeModalOpen,
    setCodeModalOpen,
    isFinalizeModalOpen,
    setFinalizeModalOpen,
    isFetching,
    isError,
    isSaving,
    isFinalizing,
    refetch,
    setAthleteStatus,
    setAthleteNote,
    markAllUnrecordedPresent,
    discardLocalEdits,
    handleSave,
    handleConfirmFinalize,
  } = useAttendanceSheetState(sessionId);

  const canRecord = usePermission("attendance:record");
  const isEditable = canRecord && session?.status !== "CANCELLED";

  if (isError) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
        <div className="text-sm font-semibold">Gagal memuat lembar presensi sesi</div>
        <Link href="/sessions" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Kembali ke Daftar Sesi
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link
          href="/sessions"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5 -ml-2 text-muted-foreground" })}
        >
          <ArrowLeft size={15} />
          Daftar Sesi
        </Link>
      </div>

      <PageHeader
        title={session?.title ?? "Lembar Presensi Sesi"}
        description={
          session
            ? `${new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Jakarta",
              }).format(new Date(session.startsAt))} WIB${session.venue ? ` · ${session.venue}` : ""}`
            : "Memuat detail sesi…"
        }
      >
        {session && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 font-mono font-bold"
              onClick={() => setCodeModalOpen(true)}
            >
              <KeyRound size={14} className="text-primary" />
              Kode: {session.checkinCode}
              <Maximize2 size={12} className="text-muted-foreground ml-0.5" />
            </Button>

            {session.status === "SCHEDULED" && canRecord && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setFinalizeModalOpen(true)}
              >
                <Lock size={14} />
                Finalisasi Sesi
              </Button>
            )}

            {session.status === "COMPLETED" && (
              <Badge variant="success" dot>
                Sesi Selesai (Final)
              </Badge>
            )}
          </div>
        )}
      </PageHeader>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="text-xs text-muted-foreground">Hadir (H)</div>
          <div className="text-2xl font-bold text-success mt-0.5">{liveCounts.present}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="text-xs text-muted-foreground">Terlambat (T)</div>
          <div className="text-2xl font-bold text-warning mt-0.5">{liveCounts.late}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="text-xs text-muted-foreground">Izin (I)</div>
          <div className="text-2xl font-bold text-primary mt-0.5">{liveCounts.excused}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="text-xs text-muted-foreground">Absen (A)</div>
          <div className="text-2xl font-bold text-destructive mt-0.5">{liveCounts.absent}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs text-muted-foreground">Belum Dicatat</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{liveCounts.unrecorded}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2.5 flex-wrap items-center p-3.5 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            placeholder="Cari nama atlet atau nomor punggung…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={search ? () => setSearch("") : undefined}
          />
        </div>

        <RefreshButton isLoading={isFetching} onClick={() => refetch()} />

        {isEditable && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={markAllUnrecordedPresent}
              disabled={liveCounts.unrecorded === 0}
            >
              <CheckCheck size={14} />
              Tandai Semua Hadir
            </Button>

            {hasUnsavedChanges && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={discardLocalEdits}>
                <RotateCcw size={14} />
                Reset ({dirtyCount})
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              isLoading={isSaving}
              disabled={!hasUnsavedChanges}
              onClick={handleSave}
            >
              <Save size={14} />
              Simpan Presensi {hasUnsavedChanges ? `(${dirtyCount})` : ""}
            </Button>
          </>
        )}
      </div>

      {/* Athlete Attendance Rows */}
      <div className="rounded-xl border border-border bg-card shadow-xs divide-y divide-border">
        {records.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {isFetching ? "Memuat daftar atlet…" : "Tidak ada atlet yang sesuai pencarian."}
          </div>
        )}

        {records.map((row) => {
          const isDirty = Boolean(localEdits[row.athleteId]);
          return (
            <div
              key={row.athleteId}
              className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 transition-colors ${
                isDirty ? "bg-primary/4" : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={row.fullName} size={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{row.fullName}</span>
                    {row.jerseyNumber !== null && (
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted border border-border font-semibold">
                        #{row.jerseyNumber}
                      </span>
                    )}
                    <Badge variant={row.sex === "MALE" ? "info" : "primary"}>{row.sex === "MALE" ? "L" : "P"}</Badge>
                    <MethodBadge method={row.method} isDirty={isDirty} distanceMeters={row.checkinDistanceMeters} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    {row.checkedInAt && (
                      <span>
                        Waktu:{" "}
                        {new Intl.DateTimeFormat("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Jakarta",
                        }).format(new Date(row.checkedInAt))}{" "}
                        WIB
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Segmented Control H / T / I / A */}
                <div className="grid grid-cols-4 gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
                  {STATUS_BUTTONS.map((btn) => {
                    const active = row.status === btn.value;
                    return (
                      <button
                        key={btn.value}
                        type="button"
                        disabled={!isEditable}
                        onClick={() => setAthleteStatus(row.athleteId, btn.value)}
                        title={btn.fullLabel}
                        className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          active
                            ? btn.activeClass
                            : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                        }`}
                      >
                        <span>{btn.shortLabel}</span>
                        <span className="hidden sm:inline font-normal text-[11px]">{btn.fullLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Note Input */}
                <Input
                  height="sm"
                  disabled={!isEditable}
                  value={row.note ?? ""}
                  onChange={(e) => setAthleteNote(row.athleteId, e.target.value)}
                  placeholder="Catatan / keterangan izin…"
                  className="sm:w-[210px]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Unsaved Banner on Mobile */}
      {hasUnsavedChanges && isEditable && (
        <div className="fixed bottom-16 left-0 right-0 z-30 p-3 bg-card/95 backdrop-blur-xs border-t border-border shadow-lg flex items-center justify-between gap-3 md:hidden">
          <div className="text-xs font-medium">
            <span className="font-bold text-primary">{dirtyCount}</span> perubahan belum disimpan
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={discardLocalEdits}>
              Batal
            </Button>
            <Button type="button" size="sm" isLoading={isSaving} onClick={handleSave}>
              Simpan
            </Button>
          </div>
        </div>
      )}

      {session && (
        <>
          <CheckinCodeModal
            isOpen={isCodeModalOpen}
            onClose={() => setCodeModalOpen(false)}
            sessionId={session.id}
            sessionTitle={session.title}
            checkinCode={session.checkinCode}
            canRegenerate={canRecord && session.status === "SCHEDULED"}
          />

          <FinalizeSessionModal
            isOpen={isFinalizeModalOpen}
            onClose={() => setFinalizeModalOpen(false)}
            onConfirm={handleConfirmFinalize}
            sessionTitle={session.title}
            unrecordedCount={liveCounts.unrecorded}
            presentCount={liveCounts.present}
            lateCount={liveCounts.late}
            excusedCount={liveCounts.excused}
            absentCount={liveCounts.absent}
            isLoading={isFinalizing}
          />
        </>
      )}
    </div>
  );
}
