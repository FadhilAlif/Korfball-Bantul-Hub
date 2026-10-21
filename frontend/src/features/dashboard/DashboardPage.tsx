"use client";

import {
  Award,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Shield,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { AthleteTodaySessionCard } from "@/features/attendance";
import { useDashboardSummary } from "@/features/statistics";
import { PageHeader, PwaInstallBanner } from "@/shared/components/common";
import { Button, buttonVariants } from "@/shared/components/ui";
import { useAnyPermission, usePermission } from "@/shared/hooks";
import {
  ActiveMatchCard,
  ActivityFeed,
  AttendanceTrendChart,
  DashboardLeaderboard,
  MatchScoringChart,
  QuickActions,
  RecentMatchesList,
  RoleDistribution,
  ShotDistributionChart,
  StatCard,
  TodaySessionStaffCard,
  UpcomingSessionsList,
} from "./components";
import { useDashboardPage } from "./hooks";

export function DashboardPage() {
  const {
    firstName,
    activePermissions,
    recentActivity,
    isLoading: isTemplateLoading,
    isStatsError: isTemplateError,
    isExporting,
    exportDashboard,
  } = useDashboardPage();

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();

  const canInviteUser = usePermission("users:read");
  const canViewAuditLogs = usePermission("audit_logs:read");
  const hasAnyQuickAction = useAnyPermission(["users:read", "roles:read", "permissions:read", "audit_logs:read"]);

  const isStaff = summary?.role === "staff";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Selamat Datang, ${firstName}`}
        description="Pusat kendali presensi latihan & live statistik Korfball Bantul"
      >
        <div className="flex items-center gap-2">
          {canInviteUser && (
            <Link href="/users" className={buttonVariants({ size: "sm", className: "gap-1.5" })}>
              <UserPlus size={14} />
              <span>Undang Pengguna</span>
            </Link>
          )}
        </div>
      </PageHeader>

      {/* PWA Install Prompt Banner */}
      <PwaInstallBanner />

      {/* Sesi Hari Ini Widget */}
      {isStaff ? <TodaySessionStaffCard session={summary?.todaySession ?? null} /> : <AthleteTodaySessionCard />}

      {/* Live / Upcoming Match Widget */}
      <ActiveMatchCard match={summary?.activeOrUpcomingMatch ?? null} />

      {/* Korfball KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isStaff ? (
          <>
            <StatCard
              label="Kehadiran Tim (30 Hari)"
              value={
                summary?.attendanceRate30d !== null && summary?.attendanceRate30d !== undefined
                  ? `${summary.attendanceRate30d}%`
                  : "—"
              }
              sub="Kehadiran latihan tim internal"
              icon={<CalendarCheck2 size={16} />}
              isLoading={isSummaryLoading}
            />
            <StatCard
              label="Rekor Tim (90 Hari)"
              value={
                summary?.teamSummary90d
                  ? `${summary.teamSummary90d.wins}M - ${summary.teamSummary90d.losses}K - ${summary.teamSummary90d.draws}S`
                  : "0M - 0K - 0S"
              }
              sub={`Win Rate ${summary?.teamSummary90d?.winRate ?? 0}%`}
              icon={<Trophy size={16} />}
              isLoading={isSummaryLoading}
            />
            <StatCard
              label="Gol Tim (90 Hari)"
              value={
                summary?.teamSummary90d
                  ? `${summary.teamSummary90d.goalsFor} : ${summary.teamSummary90d.goalsAgainst}`
                  : "0 : 0"
              }
              sub={`Selisih ${
                (summary?.teamSummary90d?.goalsFor ?? 0) - (summary?.teamSummary90d?.goalsAgainst ?? 0) >= 0
                  ? `+${(summary?.teamSummary90d?.goalsFor ?? 0) - (summary?.teamSummary90d?.goalsAgainst ?? 0)}`
                  : (summary?.teamSummary90d?.goalsFor ?? 0) - (summary?.teamSummary90d?.goalsAgainst ?? 0)
              } Gol`}
              icon={<Target size={16} />}
              isLoading={isSummaryLoading}
            />
            <StatCard
              label="Atlet Aktif"
              value={`${summary?.activeAthletesCount ?? 0} Atlet`}
              sub="Tim Internal Korfball Bantul"
              icon={<UserCheck size={16} />}
              isLoading={isSummaryLoading}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Kehadiran Saya (30 Hari)"
              value={
                summary?.attendanceRate30d !== null && summary?.attendanceRate30d !== undefined
                  ? `${summary.attendanceRate30d}%`
                  : "—"
              }
              sub="Tingkat kehadiran latihan"
              icon={<CalendarCheck2 size={16} />}
              isLoading={isSummaryLoading}
            />
            <StatCard
              label="Pertandingan Dimainkan"
              value={`${summary?.myStats?.gp ?? 0} Game`}
              sub="Match resmi & uji coba"
              icon={<Trophy size={16} />}
              isLoading={isSummaryLoading}
            />
            <StatCard
              label="Total Poin (PTS)"
              value={`${summary?.myStats?.pts ?? 0} Poin`}
              sub={`Akurasi %FG ${
                summary?.myStats?.fgPct !== null && summary?.myStats?.fgPct !== undefined
                  ? `${summary.myStats.fgPct}%`
                  : "—"
              }`}
              icon={<Target size={16} />}
              isLoading={isSummaryLoading}
            />
            <StatCard
              label="Rata-rata Efisiensi"
              value={`${summary?.myStats?.avgEff ?? 0} EFF`}
              sub="Efisiensi rating per match"
              icon={<Award size={16} />}
              isLoading={isSummaryLoading}
            />
          </>
        )}
      </div>

      {/* Visual Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceTrendChart data={summary?.attendanceTrend} isLoading={isSummaryLoading} />
        <ShotDistributionChart data={summary?.teamShooting} isLoading={isSummaryLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MatchScoringChart matches={summary?.recentMatches} isLoading={isSummaryLoading} />
        <DashboardLeaderboard isStaff={isStaff} />
      </div>

      {/* Two Column Grid: Sesi Mendatang & Hasil Pertandingan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UpcomingSessionsList sessions={summary?.upcomingSessions ?? []} />
        <RecentMatchesList matches={summary?.recentMatches ?? []} />
      </div>

      {/* Admin Workspace Details (Collapsible for SuperAdmin / Admin) */}
      {canInviteUser && (
        <details className="group border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <span className="font-semibold text-sm">Administrasi Workspace & Sistem</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  exportDashboard();
                }}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                <span>{isExporting ? "Exporting..." : "Export"}</span>
              </Button>
              <ChevronDown size={16} className="text-muted-foreground group-open:rotate-180 transition-transform" />
            </div>
          </summary>

          <div className="p-5 border-t border-border grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h4 className="text-sm font-semibold">Aktivitas Terakhir</h4>
                  <p className="text-xs text-muted-foreground">Audit log seluruh workspace</p>
                </div>
                {canViewAuditLogs && (
                  <Link
                    href="/audit-logs"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "gap-1 text-xs",
                    })}
                  >
                    <span>Semua Log</span>
                    <ChevronRight size={13} />
                  </Link>
                )}
              </div>
              <div className="mt-3 max-h-72 overflow-y-auto">
                <ActivityFeed logs={recentActivity} isLoading={isTemplateLoading} isError={isTemplateError} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {hasAnyQuickAction && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="text-sm font-semibold mb-3">Aksi Cepat</h4>
                  <QuickActions activePermissions={activePermissions} />
                </div>
              )}
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-sm font-semibold mb-3">Distribusi Role</h4>
                <RoleDistribution />
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
