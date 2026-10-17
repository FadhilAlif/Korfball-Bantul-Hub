"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { memo } from "react";
import type { TeamItem } from "@/features/teams/types";
import { FilterDropdown, RefreshButton, SearchInput } from "@/shared/components/common";
import { Button, Select } from "@/shared/components/ui";
import type { AthleteFilterState } from "../types";

const SEX_OPTIONS = [
  { value: "MALE", label: "Putra (L)" },
  { value: "FEMALE", label: "Putri (P)" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Nonaktif" },
];

interface AthleteToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters: AthleteFilterState;
  onFiltersChange: (f: AthleteFilterState) => void;
  activeFilterCount: number;
  onClearFilters?: () => void;
  teams: TeamItem[];
  canCreate: boolean;
  isFetching: boolean;
  onAddAthlete: () => void;
  onRefresh: () => void;
}

export const AthleteToolbar = memo(function AthleteToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  activeFilterCount,
  onClearFilters,
  teams,
  canCreate,
  isFetching,
  onAddAthlete,
  onRefresh,
}: AthleteToolbarProps) {
  return (
    <div className="flex gap-2.5 flex-wrap items-center p-3.5 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex-1 min-w-[200px]">
        <SearchInput
          placeholder="Cari nama lengkap atau panggilan atlet…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={search ? () => onSearchChange("") : undefined}
        />
      </div>

      <FilterDropdown activeCount={activeFilterCount} onClearAll={onClearFilters}>
        {teams.length > 0 && (
          <FilterField label="Tim">
            <Select
              searchable
              value={filters.teamId}
              onChange={(v) => onFiltersChange({ ...filters, teamId: v })}
              options={teams.map((t) => ({ value: String(t.id), label: t.name }))}
              placeholder="Semua tim"
              searchPlaceholder="Cari tim…"
            />
          </FilterField>
        )}

        <FilterField label="Kategori (L/P)">
          <Select
            value={filters.sex}
            onChange={(v) => onFiltersChange({ ...filters, sex: v })}
            options={SEX_OPTIONS}
            placeholder="Semua kategori"
          />
        </FilterField>

        <FilterField label="Status">
          <Select
            value={filters.status}
            onChange={(v) => onFiltersChange({ ...filters, status: v })}
            options={STATUS_OPTIONS}
            placeholder="Semua status"
          />
        </FilterField>
      </FilterDropdown>

      <div className="flex-1 hidden sm:block" />

      <RefreshButton isLoading={isFetching} onClick={onRefresh} />

      {canCreate && (
        <Button size="sm" className="gap-1.5" onClick={onAddAthlete}>
          <Plus size={14} />
          Tambah Atlet
        </Button>
      )}
    </div>
  );
});

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
