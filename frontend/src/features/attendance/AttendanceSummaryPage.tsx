"use client";

import { BarChart3, Download } from "lucide-react";
import { useState } from "react";
import { FilterDropdown, PageHeader, RefreshButton } from "@/shared/components/common";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Select,
  Spinner,
  TableCell,
  TableEmptyRow,
  TableHeader,
  TableLoadingRow,
  TableRow,
  TableShell,
} from "@/shared/components/ui";
import { usePermission } from "@/shared/hooks";
import { useAttendanceSummary, useExportAttendanceSummary } from "./hooks/useAttendance";

const TYPE_OPTIONS = [
  { value: "TRAINING", label: "Latihan Rutin" },
  { value: "SCRIMMAGE", label: "Scrimmage" },
  { value: "MATCH", label: "Pertandingan" },
  { value: "OTHER", label: "Lainnya" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Atlet Aktif" },
  { value: "INACTIVE", label: "Atlet Nonaktif" },
];

function getDefaultDateRange() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

export function AttendanceSummaryPage() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const canExport = usePermission("attendance:export");

  const { data, isFetching, isError, refetch } = useAttendanceSummary({
    from,
    to,
    type: type || undefined,
    status: status || undefined,
  });

  const { exportSummary, isExporting } = useExportAttendanceSummary();

  const athletes = data?.athletes ?? [];
  const activeFilterCount = (type ? 1 : 0) + (status ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Rekapitulasi Kehadiran Atlet"
        description="Analisis akumulasi kehadiran atlet Korfball Bantul berdasarkan rentang tanggal sesi yang telah selesai."
      >
        {canExport && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={isExporting || !from || !to}
            onClick={() => exportSummary({ from, to, type: type || undefined, status: status || undefined })}
          >
            {isExporting ? <Spinner size="sm" /> : <Download size={14} />}
            Export XLSX
          </Button>
        )}
      </PageHeader>

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

        <FilterDropdown
          activeCount={activeFilterCount}
          onClearAll={
            activeFilterCount > 0
              ? () => {
                  setType("");
                  setStatus("");
                }
              : undefined
          }
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              Jenis Sesi
            </span>
            <Select value={type} onChange={setType} options={TYPE_OPTIONS} placeholder="Semua jenis sesi" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              Status Atlet
            </span>
            <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} placeholder="Semua atlet" />
          </div>
        </FilterDropdown>

        <div className="flex-1 hidden sm:block" />

        {data && (
          <Badge variant="outline" className="text-xs">
            Total Sesi Selesai: {data.totalCompletedSessions}
          </Badge>
        )}

        <RefreshButton isLoading={isFetching} onClick={() => refetch()} />
      </div>

      <TableShell>
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <TableHeader>Atlet</TableHeader>
              <TableHeader>L / P</TableHeader>
              <TableHeader>Hadir (H)</TableHeader>
              <TableHeader>Terlambat (T)</TableHeader>
              <TableHeader>Izin (I)</TableHeader>
              <TableHeader>Absen (A)</TableHeader>
              <TableHeader>Total Sesi</TableHeader>
              <TableHeader>% Kehadiran</TableHeader>
            </tr>
          </thead>
          <tbody>
            <TableLoadingRow isLoading={isFetching} colSpan={8} />
            {isError && !isFetching && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  Gagal memuat rekap kehadiran. Pastikan rentang tanggal valid (maksimal 366 hari).
                </td>
              </tr>
            )}
            <TableEmptyRow
              isEmpty={!isFetching && !isError && athletes.length === 0}
              colSpan={8}
              icon={<BarChart3 size={24} strokeWidth={1.5} aria-hidden />}
              title="Belum ada data rekap kehadiran"
              description="Sesuaikan filter rentang tanggal atau status atlet."
            />
            {athletes.map((a) => (
              <TableRow key={a.athleteId}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={a.fullName} size={30} />
                    <div>
                      <div className="font-semibold text-[13.5px]">{a.fullName}</div>
                      {a.jerseyNumber !== null && (
                        <div className="text-xs text-muted-foreground font-mono">#{a.jerseyNumber}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={a.sex === "MALE" ? "info" : "pink"}>
                    {a.sex === "MALE" ? "Laki - Laki" : "Perempuan"}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-success">{a.present}</TableCell>
                <TableCell className="font-semibold text-warning">{a.late}</TableCell>
                <TableCell className="font-semibold text-primary">{a.excused}</TableCell>
                <TableCell className="font-semibold text-destructive">{a.absent}</TableCell>
                <TableCell className="text-muted-foreground">{a.totalSessions}</TableCell>
                <TableCell>
                  {a.attendanceRate !== null ? (
                    <Badge variant={a.attendanceRate >= 75 ? "success" : a.attendanceRate >= 50 ? "warning" : "danger"}>
                      {a.attendanceRate}%
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
