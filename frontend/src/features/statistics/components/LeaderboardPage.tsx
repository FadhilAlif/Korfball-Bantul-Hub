"use client";

import { ChevronLeft, ChevronRight, Download, Loader2, Search, Trophy, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useTeams } from "@/features/teams";
import { PageHeader } from "@/shared/components/common";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useExportPlayerLeaderboard, usePlayerLeaderboard, useTeamStats } from "../hooks/useStatistics";
import { LeaderboardCards } from "./LeaderboardCards";
import { LeaderboardTable } from "./LeaderboardTable";
import { TeamStatsView } from "./TeamStatsView";

const PAGE_LIMIT = 50;

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"players" | "team">("players");
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined);
  const [minGp, setMinGp] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("pts");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Load teams for dropdown
  const { data: teamsData } = useTeams({ limit: 50 });
  const teams = teamsData?.data ?? [];

  // Query player leaderboard
  const query = useMemo(
    () => ({
      teamId: selectedTeamId,
      minGp,
      sort: sortField,
      direction: sortDirection,
      page,
      limit: PAGE_LIMIT,
    }),
    [selectedTeamId, minGp, sortField, sortDirection, page],
  );

  const { data: leaderboardData, isLoading: isLeaderboardLoading } = usePlayerLeaderboard(query);
  const exportMutation = useExportPlayerLeaderboard();

  // Query team stats
  const { data: teamStats, isLoading: isTeamStatsLoading } = useTeamStats({
    teamId: selectedTeamId,
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleExport = () => {
    exportMutation.mutate({
      teamId: selectedTeamId,
      minGp,
      sort: sortField,
      direction: sortDirection,
    });
  };

  // Filter client-side search by name/nickname
  const filteredPlayers = useMemo(() => {
    const list = leaderboardData?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.athleteName.toLowerCase().includes(q) ||
        (p.nickname && p.nickname.toLowerCase().includes(q)) ||
        (p.jerseyNumber !== null && p.jerseyNumber.toString().includes(q)),
    );
  }, [leaderboardData?.data, search]);

  const totalPages = leaderboardData?.meta.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Statistik Pertandingan"
        description="Analisis dan evaluasi performa individu pemain serta rekap agregat tim Korfball Bantul"
      >
        <div className="flex items-center gap-2">
          {activeTab === "players" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="gap-1.5"
            >
              {exportMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{exportMutation.isPending ? "Mengunduh..." : "Export XLSX"}</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("players")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "players"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy size={15} />
          <span>Leaderboard Pemain</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "team"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UsersRound size={15} />
          <span>Statistik Agregat Tim</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
          {/* Search box for player tab */}
          {activeTab === "players" && (
            <div className="relative min-w-[180px] max-w-xs flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari pemain / no. punggung..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8.5"
              />
            </div>
          )}

          {/* Team Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground shrink-0">Tim:</span>
            <select
              value={selectedTeamId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setSelectedTeamId(val);
                setPage(1);
              }}
              className="h-8.5 px-2.5 text-xs rounded-md border border-input bg-background font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="">Tim Internal (Korfball Bantul)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isInternal ? "(Internal)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Min GP filter for player tab */}
          {activeTab === "players" && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground shrink-0">Min GP:</span>
              <select
                value={minGp}
                onChange={(e) => {
                  setMinGp(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8.5 px-2 text-xs rounded-md border border-input bg-background font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value={0}>0 (Semua)</option>
                <option value={1}>≥ 1 Game</option>
                <option value={3}>≥ 3 Game</option>
                <option value={5}>≥ 5 Game</option>
              </select>
            </div>
          )}
        </div>

        {/* Counter */}
        {activeTab === "players" && (
          <div className="text-xs text-muted-foreground">
            Menampilkan <strong>{filteredPlayers.length}</strong> pemain
          </div>
        )}
      </div>

      {/* Main Content */}
      {activeTab === "players" ? (
        <div className="flex flex-col gap-4">
          {isLeaderboardLoading ? (
            <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin mr-2" />
              <span>Memuat leaderboard pemain...</span>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <LeaderboardTable
                  players={filteredPlayers}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  offset={(page - 1) * PAGE_LIMIT}
                />
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <LeaderboardCards players={filteredPlayers} offset={(page - 1) * PAGE_LIMIT} />
              </div>

              {/* Pagination (if multi-page) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                  <div>
                    Halaman {page} dari {totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div>{teamStats && <TeamStatsView stats={teamStats} isLoading={isTeamStatsLoading} />}</div>
      )}
    </div>
  );
}
