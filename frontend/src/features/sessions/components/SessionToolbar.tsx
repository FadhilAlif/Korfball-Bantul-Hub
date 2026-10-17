"use client";

import { CalendarPlus2, Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { memo } from "react";
import { FilterDropdown, RefreshButton } from "@/shared/components/common";
import { Button, Input, Select } from "@/shared/components/ui";
import type { SessionFilterState } from "../types";

const TYPE_OPTIONS = [
  { value: "TRAINING", label: "Latihan Rutin" },
  { value: "SCRIMMAGE", label: "Scrimmage / Latihan Tanding" },
  { value: "MATCH", label: "Pertandingan" },
  { value: "OTHER", label: "Lainnya" },
];

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Terjadwal" },
  { value: "COMPLETED", label: "Selesai (Final)" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

interface SessionToolbarProps {
  filters: SessionFilterState;
  onFiltersChange: (f: SessionFilterState) => void;
  activeFilterCount: number;
  onClearFilters?: () => void;
  canCreate: boolean;
  isFetching: boolean;
  onAddSession: () => void;
  onOpenRoutineGenerator: () => void;
  onRefresh: () => void;
}

export const SessionToolbar = memo(function SessionToolbar({
  filters,
  onFiltersChange,
  activeFilterCount,
  onClearFilters,
  canCreate,
  isFetching,
  onAddSession,
  onOpenRoutineGenerator,
  onRefresh,
}: SessionToolbarProps) {
  return (
    <div className="flex gap-2.5 flex-wrap items-center p-3.5 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          type="date"
          height="sm"
          value={filters.from}
          onChange={(e) => onFiltersChange({ ...filters, from: e.target.value })}
          className="w-[145px]"
          aria-label="Dari tanggal"
        />
        <span className="text-xs text-muted-foreground">s/d</span>
        <Input
          type="date"
          height="sm"
          value={filters.to}
          onChange={(e) => onFiltersChange({ ...filters, to: e.target.value })}
          className="w-[145px]"
          aria-label="Sampai tanggal"
        />
      </div>

      <FilterDropdown activeCount={activeFilterCount} onClearAll={onClearFilters}>
        <FilterField label="Jenis Sesi">
          <Select
            value={filters.type}
            onChange={(v) => onFiltersChange({ ...filters, type: v })}
            options={TYPE_OPTIONS}
            placeholder="Semua jenis"
          />
        </FilterField>

        <FilterField label="Status Sesi">
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
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenRoutineGenerator}>
            <Sparkles size={14} />
            Generate Sesi Rutin
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onAddSession}>
            <Plus size={14} />
            Buat Sesi
          </Button>
        </>
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
