"use client";

import { Plus } from "lucide-react";
import { memo } from "react";
import { FilterDropdown, RefreshButton, SearchInput } from "@/shared/components/common";
import { Button, Select } from "@/shared/components/ui";
import type { TeamFilterState } from "../types";

const TYPE_OPTIONS = [
  { value: "true", label: "Tim Internal (Klub)" },
  { value: "false", label: "Tim Lawan / Eksternal" },
];

interface TeamToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters: TeamFilterState;
  onFiltersChange: (f: TeamFilterState) => void;
  activeFilterCount: number;
  onClearFilters?: () => void;
  canCreate: boolean;
  isFetching: boolean;
  onAddTeam: () => void;
  onRefresh: () => void;
}

export const TeamToolbar = memo(function TeamToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  activeFilterCount,
  onClearFilters,
  canCreate,
  isFetching,
  onAddTeam,
  onRefresh,
}: TeamToolbarProps) {
  return (
    <div className="flex gap-2.5 flex-wrap items-center p-3.5 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex-1 min-w-[200px]">
        <SearchInput
          placeholder="Cari nama tim, singkatan, atau daerah…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={search ? () => onSearchChange("") : undefined}
        />
      </div>

      <FilterDropdown activeCount={activeFilterCount} onClearAll={onClearFilters}>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
            Kategori Tim
          </span>
          <Select
            value={filters.isInternal}
            onChange={(v) => onFiltersChange({ ...filters, isInternal: v })}
            options={TYPE_OPTIONS}
            placeholder="Semua kategori"
          />
        </div>
      </FilterDropdown>

      <div className="flex-1 hidden sm:block" />

      <RefreshButton isLoading={isFetching} onClick={onRefresh} />

      {canCreate && (
        <Button size="sm" className="gap-1.5" onClick={onAddTeam}>
          <Plus size={14} />
          Tambah Tim
        </Button>
      )}
    </div>
  );
});
