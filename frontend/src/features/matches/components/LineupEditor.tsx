"use client";

import { AlertTriangle, CheckCircle2, Loader2, Save, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAthletes } from "@/features/athletes/hooks";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import { useSetLineup } from "../hooks/useMatches";
import type { LineupPlayerItemInput, MatchDetail, MatchPlayerItem, MatchSide } from "../types";
import { QuickAddAthleteModal } from "./QuickAddAthleteModal";

interface LineupEditorProps {
  match: MatchDetail;
  onSaved?: () => void;
}

interface LocalLineupItem {
  athleteId: number;
  athleteName: string;
  athleteNickname?: string | null;
  sex: "MALE" | "FEMALE";
  jerseyNumber: number;
  selected: boolean;
  isStarter: boolean;
}

export function LineupEditor({ match, onSaved }: LineupEditorProps) {
  const [activeSide, setActiveSide] = useState<MatchSide>("HOME");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const activeTeamId = activeSide === "HOME" ? match.homeTeamId : match.awayTeamId;
  const activeTeamName = activeSide === "HOME" ? match.homeTeamName : match.awayTeamName;

  // Fetch athletes for BOTH teams so switching tabs never loses state or causes unnecessary refetches
  const {
    data: homeAthletesData,
    isLoading: isLoadingHomeAthletes,
    refetch: refetchHomeAthletes,
  } = useAthletes({
    teamId: match.homeTeamId,
    limit: 100,
    status: "ACTIVE",
  });

  const {
    data: awayAthletesData,
    isLoading: isLoadingAwayAthletes,
    refetch: refetchAwayAthletes,
  } = useAthletes({
    teamId: match.awayTeamId,
    limit: 100,
    status: "ACTIVE",
  });

  // Safely extract all saved players from match (supports both .players and .lineup)
  const allMatchPlayers = useMemo(() => match.players || match.lineup || [], [match.players, match.lineup]);

  // Independent state per side (prevents tab switching from clearing selections)
  const [lineups, setLineups] = useState<Record<MatchSide, LocalLineupItem[]>>({
    HOME: [],
    AWAY: [],
  });

  // Track if a side has local unsaved modifications
  const [dirtySides, setDirtySides] = useState<Record<MatchSide, boolean>>({
    HOME: false,
    AWAY: false,
  });

  // Sync state with server data whenever match or athletes update, preserving dirty side local edits
  useEffect(() => {
    const homeAthletes = homeAthletesData?.data ?? [];
    const awayAthletes = awayAthletesData?.data ?? [];

    setLineups((prev) => {
      const buildSide = (
        side: MatchSide,
        teamAthletes: typeof homeAthletes,
        currentSideItems: LocalLineupItem[],
        isDirty: boolean,
      ): LocalLineupItem[] => {
        // If user has unsaved edits on this side and items already exist, preserve local edits
        if (isDirty && currentSideItems.length > 0) {
          return currentSideItems;
        }

        const existingSidePlayers = allMatchPlayers.filter((p) => p.side === side);
        const existingMap = new Map<number, MatchPlayerItem>();
        for (const p of existingSidePlayers) {
          existingMap.set(p.athleteId, p);
        }

        const items: LocalLineupItem[] = teamAthletes.map((ath) => {
          const found = existingMap.get(ath.id);
          return {
            athleteId: ath.id,
            athleteName: ath.fullName,
            athleteNickname: ath.nickname,
            sex: ath.sex as "MALE" | "FEMALE",
            jerseyNumber: found?.jerseyNumber ?? ath.jerseyNumber ?? 0,
            selected: Boolean(found),
            isStarter: Boolean(found?.isStarter),
          };
        });

        // Also include any players in existingSidePlayers not in current team roster
        for (const p of existingSidePlayers) {
          if (!items.some((item) => item.athleteId === p.athleteId)) {
            items.push({
              athleteId: p.athleteId,
              athleteName: p.athleteName,
              athleteNickname: p.athleteNickname,
              sex: p.sex,
              jerseyNumber: p.jerseyNumber,
              selected: true,
              isStarter: p.isStarter,
            });
          }
        }

        return items;
      };

      return {
        HOME: buildSide("HOME", homeAthletes, prev.HOME, dirtySides.HOME),
        AWAY: buildSide("AWAY", awayAthletes, prev.AWAY, dirtySides.AWAY),
      };
    });
  }, [allMatchPlayers, homeAthletesData, awayAthletesData, dirtySides.HOME, dirtySides.AWAY]);

  const setLineupMutation = useSetLineup(match.id);

  // Active lineup items
  const lineupItems = lineups[activeSide] || [];

  // Opposite side lineup for cross-side conflict prevention (same athlete cannot be selected on both sides)
  const oppositeSide: MatchSide = activeSide === "HOME" ? "AWAY" : "HOME";
  const oppositeItems = lineups[oppositeSide] || [];
  const oppositeSelectedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const p of oppositeItems) {
      if (p.selected) {
        ids.add(p.athleteId);
      }
    }
    return ids;
  }, [oppositeItems]);

  // Target starters according to match format
  const isK8 = match.format === "K8";
  const targetMale = isK8 ? 4 : 2;
  const targetFemale = isK8 ? 4 : 2;
  const targetTotal = targetMale + targetFemale;

  // Starters count for HOME
  const homeStarters = (lineups.HOME || []).filter((i) => i.selected && i.isStarter);
  const homeMaleCount = homeStarters.filter((i) => i.sex === "MALE").length;
  const homeFemaleCount = homeStarters.filter((i) => i.sex === "FEMALE").length;
  const isHomeComplete = homeMaleCount === targetMale && homeFemaleCount === targetFemale;

  // Starters count for AWAY
  const awayStarters = (lineups.AWAY || []).filter((i) => i.selected && i.isStarter);
  const awayMaleCount = awayStarters.filter((i) => i.sex === "MALE").length;
  const awayFemaleCount = awayStarters.filter((i) => i.sex === "FEMALE").length;
  const isAwayComplete = awayMaleCount === targetMale && awayFemaleCount === targetFemale;

  // Active side starter counts
  const activeMaleCount = activeSide === "HOME" ? homeMaleCount : awayMaleCount;
  const activeFemaleCount = activeSide === "HOME" ? homeFemaleCount : awayFemaleCount;
  const isActiveComplete = activeSide === "HOME" ? isHomeComplete : isAwayComplete;

  // Check duplicate jersey numbers within active side
  const selectedJerseyNumbers = lineupItems.filter((i) => i.selected).map((i) => i.jerseyNumber);
  const duplicateJerseys = selectedJerseyNumbers.filter((n, idx) => n > 0 && selectedJerseyNumbers.indexOf(n) !== idx);
  const hasDuplicateJersey = duplicateJerseys.length > 0;

  const handleToggleSelect = (athleteId: number) => {
    setDirtySides((d) => ({ ...d, [activeSide]: true }));
    setLineups((prev) => ({
      ...prev,
      [activeSide]: prev[activeSide].map((item) =>
        item.athleteId === athleteId
          ? { ...item, selected: !item.selected, isStarter: !item.selected ? false : item.isStarter }
          : item,
      ),
    }));
  };

  const handleToggleStarter = (athleteId: number) => {
    setDirtySides((d) => ({ ...d, [activeSide]: true }));
    setLineups((prev) => ({
      ...prev,
      [activeSide]: prev[activeSide].map((item) => {
        if (item.athleteId !== athleteId) return item;
        const nextStarter = !item.isStarter;
        return {
          ...item,
          isStarter: nextStarter,
          selected: nextStarter ? true : item.selected,
        };
      }),
    }));
  };

  const handleJerseyChange = (athleteId: number, num: number) => {
    setDirtySides((d) => ({ ...d, [activeSide]: true }));
    setLineups((prev) => ({
      ...prev,
      [activeSide]: prev[activeSide].map((item) =>
        item.athleteId === athleteId ? { ...item, jerseyNumber: num } : item,
      ),
    }));
  };

  const handleSave = () => {
    const selectedPlayers = lineupItems.filter((i) => i.selected);
    if (selectedPlayers.length === 0) {
      toast.error("Minimal pilih 1 atlet untuk lineup tim.");
      return;
    }

    const payload: LineupPlayerItemInput[] = selectedPlayers.map((p) => ({
      athleteId: p.athleteId,
      jerseyNumber: p.jerseyNumber,
      isStarter: p.isStarter,
    }));

    setLineupMutation.mutate(
      { side: activeSide, players: payload },
      {
        onSuccess: () => {
          setDirtySides((d) => ({ ...d, [activeSide]: false }));
          toast.success(`Lineup ${activeSide} (${activeTeamName}) berhasil disimpan.`);
          onSaved?.();
        },
        onError: (err: unknown) => {
          // Extract specific error message from API response (e.g., conflicting player on opposite side)
          const errorResponse = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
          const errorMessage =
            errorResponse?.response?.data?.message ||
            errorResponse?.response?.data?.error ||
            errorResponse?.message ||
            "Gagal menyimpan lineup.";
          toast.error(errorMessage);
        },
      },
    );
  };

  const isLoadingAthletes = activeSide === "HOME" ? isLoadingHomeAthletes : isLoadingAwayAthletes;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
      {/* Side Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <Tabs value={activeSide} onValueChange={(val) => setActiveSide(val as MatchSide)} className="w-full sm:w-auto">
          <TabsList className="h-10">
            <TabsTrigger value="HOME" className="gap-2 font-bold text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match.homeColor || "#FACC15" }}
              />
              <span>HOME: {match.homeTeamName}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium",
                  isHomeComplete
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {homeStarters.length}/{targetTotal}
              </span>
              {dirtySides.HOME && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Ada perubahan belum disimpan" />
              )}
            </TabsTrigger>
            <TabsTrigger value="AWAY" className="gap-2 font-bold text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match.awayColor || "#3B82F6" }}
              />
              <span>AWAY: {match.awayTeamName}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium",
                  isAwayComplete
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {awayStarters.length}/{targetTotal}
              </span>
              {dirtySides.AWAY && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Ada perubahan belum disimpan" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Action button to quickly add athlete */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowQuickAdd(true)}
          className="gap-1.5 text-xs self-start sm:self-auto"
        >
          <UserPlus size={14} />
          <span>Tambah Atlet Cepat</span>
        </Button>
      </div>

      {/* Composition & Warning Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            Format {match.format}: Target Starter {targetMale}L & {targetFemale}P
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isActiveComplete ? (
            <Badge
              variant="outline"
              className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 text-xs"
            >
              <CheckCircle2 size={12} />
              <span>
                Starter Lengkap ({activeMaleCount}L / {activeFemaleCount}P)
              </span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1 text-xs"
            >
              <AlertTriangle size={12} />
              <span>
                Starter: {activeMaleCount}/{targetMale}L, {activeFemaleCount}/{targetFemale}P
              </span>
            </Badge>
          )}

          {hasDuplicateJersey && (
            <Badge
              variant="outline"
              className="text-rose-700 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 gap-1 text-xs"
            >
              <span>Nomor Jersey Duplikat</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Athletes Lineup Table / Roster */}
      {isLoadingAthletes ? (
        <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span>Memuat daftar atlet tim...</span>
        </div>
      ) : lineupItems.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">Belum ada atlet terdaftar di tim ini.</p>
          <Button size="sm" onClick={() => setShowQuickAdd(true)} className="gap-1.5 text-xs">
            <UserPlus size={14} />
            <span>Tambah Atlet Sekarang</span>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Ikut</th>
                <th className="py-2.5 px-3 w-20 text-center">Starter</th>
                <th className="py-2.5 px-3 w-24">No. Jersey</th>
                <th className="py-2.5 px-3">Nama Atlet</th>
                <th className="py-2.5 px-3 w-20">Gender</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineupItems.map((item) => {
                const isSelectedOnOpposite = oppositeSelectedIds.has(item.athleteId);
                return (
                  <tr
                    key={item.athleteId}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      item.isStarter
                        ? "bg-primary/5"
                        : item.selected
                          ? "bg-muted/10"
                          : isSelectedOnOpposite
                            ? "opacity-45 bg-muted/20"
                            : "opacity-60",
                    )}
                  >
                    <td className="py-2 px-3 text-center">
                      <Checkbox
                        checked={item.selected}
                        disabled={isSelectedOnOpposite}
                        onCheckedChange={() => handleToggleSelect(item.athleteId)}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        disabled={isSelectedOnOpposite}
                        onClick={() => handleToggleStarter(item.athleteId)}
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md transition-all",
                          item.isStarter
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : isSelectedOnOpposite
                              ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                              : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {item.isStarter ? "STARTER" : "BENCH"}
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        disabled={isSelectedOnOpposite}
                        value={item.jerseyNumber}
                        onChange={(e) => handleJerseyChange(item.athleteId, Number.parseInt(e.target.value, 10) || 0)}
                        className="h-8 w-18 font-mono text-xs text-center"
                      />
                    </td>
                    <td className="py-2 px-3 font-medium text-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.athleteName}</span>
                        {item.athleteNickname && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({item.athleteNickname})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-sm",
                          item.sex === "MALE"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            : "bg-pink-500/10 text-pink-700 dark:text-pink-400",
                        )}
                      >
                        {item.sex === "MALE" ? "Putra (L)" : "Putri (P)"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {isSelectedOnOpposite ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
                        >
                          Terdaftar di {oppositeSide}
                        </Badge>
                      ) : item.selected ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        >
                          Terdaftar
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted-foreground">
          {dirtySides[activeSide] ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle size={13} />
              <span>Ada perubahan pada lineup {activeSide} yang belum disimpan.</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Lineup {activeSide} tersimpan sesuai data server.</span>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={setLineupMutation.isPending || lineupItems.length === 0}
          className="gap-2 text-xs"
        >
          {setLineupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>Simpan Lineup {activeSide}</span>
        </Button>
      </div>

      {/* Quick Add Athlete Modal */}
      {showQuickAdd && (
        <QuickAddAthleteModal
          open={showQuickAdd}
          teamId={activeTeamId}
          teamName={activeTeamName}
          onSuccess={() => {
            void refetchHomeAthletes();
            void refetchAwayAthletes();
          }}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  );
}
