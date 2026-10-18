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

  const {
    data: athletesData,
    isLoading: isLoadingAthletes,
    refetch: refetchAthletes,
  } = useAthletes({
    teamId: activeTeamId,
    limit: 100,
    status: "ACTIVE",
  });

  const availableAthletes = useMemo(() => athletesData?.data ?? [], [athletesData]);

  // Existing match players for active side
  const existingSidePlayers = useMemo(
    () => (match.players || []).filter((p) => p.side === activeSide),
    [match.players, activeSide],
  );

  // Local state for the active side lineup
  const [lineupItems, setLineupItems] = useState<LocalLineupItem[]>([]);

  useEffect(() => {
    const existingMap = new Map<number, MatchPlayerItem>();
    for (const p of existingSidePlayers) {
      existingMap.set(p.athleteId, p);
    }

    const items: LocalLineupItem[] = availableAthletes.map((ath) => {
      const existing = existingMap.get(ath.id);
      return {
        athleteId: ath.id,
        athleteName: ath.fullName,
        athleteNickname: ath.nickname,
        sex: ath.sex as "MALE" | "FEMALE",
        jerseyNumber: existing?.jerseyNumber ?? ath.jerseyNumber ?? 0,
        selected: Boolean(existing),
        isStarter: Boolean(existing?.isStarter),
      };
    });

    // Also include any match_players that might not be in the active roster query
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

    setLineupItems(items);
  }, [availableAthletes, existingSidePlayers]);

  const setLineupMutation = useSetLineup(match.id);

  // Count starters
  const starters = lineupItems.filter((i) => i.selected && i.isStarter);
  const maleStartersCount = starters.filter((i) => i.sex === "MALE").length;
  const femaleStartersCount = starters.filter((i) => i.sex === "FEMALE").length;

  const isK8 = match.format === "K8";
  const targetMale = isK8 ? 4 : 2;
  const targetFemale = isK8 ? 4 : 2;
  const isStarterComplete = maleStartersCount === targetMale && femaleStartersCount === targetFemale;

  // Check duplicate jersey numbers
  const selectedJerseyNumbers = lineupItems.filter((i) => i.selected).map((i) => i.jerseyNumber);
  const duplicateJerseys = selectedJerseyNumbers.filter((n, idx) => selectedJerseyNumbers.indexOf(n) !== idx);
  const hasDuplicateJersey = duplicateJerseys.length > 0;

  const handleToggleSelect = (athleteId: number) => {
    setLineupItems((prev) =>
      prev.map((item) =>
        item.athleteId === athleteId
          ? { ...item, selected: !item.selected, isStarter: !item.selected ? false : item.isStarter }
          : item,
      ),
    );
  };

  const handleToggleStarter = (athleteId: number) => {
    setLineupItems((prev) =>
      prev.map((item) => {
        if (item.athleteId !== athleteId) return item;
        const nextStarter = !item.isStarter;
        return {
          ...item,
          isStarter: nextStarter,
          selected: nextStarter ? true : item.selected, // Selecting as starter automatically selects for lineup
        };
      }),
    );
  };

  const handleJerseyChange = (athleteId: number, num: number) => {
    setLineupItems((prev) =>
      prev.map((item) => (item.athleteId === athleteId ? { ...item, jerseyNumber: num } : item)),
    );
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
          toast.success(`Lineup ${activeSide} (${activeTeamName}) berhasil disimpan.`);
          onSaved?.();
        },
        onError: () => {
          toast.error("Gagal menyimpan lineup.");
        },
      },
    );
  };

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
            </TabsTrigger>
            <TabsTrigger value="AWAY" className="gap-2 font-bold text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: match.awayColor || "#3B82F6" }}
              />
              <span>AWAY: {match.awayTeamName}</span>
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
          {isStarterComplete ? (
            <Badge
              variant="outline"
              className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 text-xs"
            >
              <CheckCircle2 size={12} />
              <span>
                Starter Lengkap ({maleStartersCount}L / {femaleStartersCount}P)
              </span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1 text-xs"
            >
              <AlertTriangle size={12} />
              <span>
                Starter: {maleStartersCount}/{targetMale}L, {femaleStartersCount}/{targetFemale}P
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineupItems.map((item) => (
                <tr
                  key={item.athleteId}
                  className={`hover:bg-muted/30 transition-colors ${
                    item.isStarter ? "bg-primary/5" : item.selected ? "bg-muted/10" : "opacity-60"
                  }`}
                >
                  <td className="py-2 px-3 text-center">
                    <Checkbox checked={item.selected} onCheckedChange={() => handleToggleSelect(item.athleteId)} />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStarter(item.athleteId)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                        item.isStarter
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {item.isStarter ? "STARTER" : "BENCH"}
                    </button>
                  </td>
                  <td className="py-2 px-3">
                    <Input
                      type="number"
                      min={0}
                      max={99}
                      value={item.jerseyNumber}
                      onChange={(e) => handleJerseyChange(item.athleteId, Number.parseInt(e.target.value, 10) || 0)}
                      className="h-8 w-18 font-mono text-xs text-center"
                    />
                  </td>
                  <td className="py-2 px-3 font-medium text-foreground">
                    <div>{item.athleteName}</div>
                    {item.athleteNickname && (
                      <div className="text-[10px] text-muted-foreground font-normal">({item.athleteNickname})</div>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                        item.sex === "MALE"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          : "bg-pink-500/10 text-pink-700 dark:text-pink-400"
                      }`}
                    >
                      {item.sex === "MALE" ? "Putra (L)" : "Putri (P)"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end pt-2">
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
            void refetchAthletes();
          }}
          onClose={() => setShowQuickAdd(false)}
        />
      )}
    </div>
  );
}
