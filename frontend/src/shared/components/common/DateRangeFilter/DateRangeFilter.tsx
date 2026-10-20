"use client";

import { Calendar, Check, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Dropdown, Input } from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

export type DateRangePreset = "WEEKLY" | "MONTHLY" | "YEARLY" | "ALL_TIME" | "CUSTOM";

export interface DateRangeValue {
  preset: DateRangePreset;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  defaultPreset?: DateRangePreset;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_PRESETS: { id: DateRangePreset; label: string; sub: string }[] = [
  { id: "WEEKLY", label: "Mingguan", sub: "7 Hari" },
  { id: "MONTHLY", label: "Bulanan", sub: "30 Hari" },
  { id: "YEARLY", label: "Tahunan", sub: "Musim Berjalan" },
  { id: "ALL_TIME", label: "Semua", sub: "Semua Data" },
];

/**
 * Menghitung tanggal YYYY-MM-DD berdasarkan preset waktu.
 */
export function getPresetDateRange(preset: DateRangePreset): { from?: string; to?: string } {
  const now = new Date();
  const formatYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYmd(now);

  if (preset === "WEEKLY") {
    const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: formatYmd(fromDate), to: todayStr };
  }
  if (preset === "MONTHLY") {
    const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: formatYmd(fromDate), to: todayStr };
  }
  if (preset === "YEARLY") {
    return { from: `${now.getFullYear()}-01-01`, to: todayStr };
  }
  return { from: undefined, to: undefined };
}

/**
 * Format label tombol filter untuk UX yang ringkas dan informatif.
 */
export function formatDateRangeLabel(value: DateRangeValue): string {
  if (value.preset === "WEEKLY") return "Mingguan";
  if (value.preset === "MONTHLY") return "Bulanan";
  if (value.preset === "YEARLY") return "Tahun Ini";
  if (value.preset === "ALL_TIME") return "Semua Waktu";

  if (value.from && value.to) {
    const d1 = new Date(`${value.from}T00:00:00`);
    const d2 = new Date(`${value.to}T00:00:00`);
    if (!Number.isNaN(d1.getTime()) && !Number.isNaN(d2.getTime())) {
      const f1 = d1.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const f2 = d2.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: d1.getFullYear() !== d2.getFullYear() ? "numeric" : undefined,
      });
      return `${f1} – ${f2}`;
    }
    return `${value.from} s/d ${value.to}`;
  }
  if (value.from) return `Sejak ${value.from}`;
  if (value.to) return `Hingga ${value.to}`;
  return "Pilih Tanggal";
}

export function DateRangeFilter({
  value,
  onChange,
  defaultPreset = "ALL_TIME",
  className,
  disabled = false,
}: DateRangeFilterProps) {
  const [localFrom, setLocalFrom] = useState(value.from ?? "");
  const [localTo, setLocalTo] = useState(value.to ?? "");

  // Sinkronkan input lokal saat value prop berubah
  useEffect(() => {
    setLocalFrom(value.from ?? "");
    setLocalTo(value.to ?? "");
  }, [value.from, value.to]);

  const handleSelectPreset = (preset: DateRangePreset, close: () => void) => {
    const range = getPresetDateRange(preset);
    onChange({ preset, ...range });
    close();
  };

  const handleApplyCustom = (close: () => void) => {
    if (!localFrom && !localTo) return;
    onChange({
      preset: "CUSTOM",
      from: localFrom || undefined,
      to: localTo || undefined,
    });
    close();
  };

  const handleReset = (close: () => void) => {
    const range = getPresetDateRange(defaultPreset);
    onChange({ preset: defaultPreset, ...range });
    setLocalFrom(range.from ?? "");
    setLocalTo(range.to ?? "");
    close();
  };

  const isFiltered = value.preset !== defaultPreset || value.preset === "CUSTOM";

  return (
    <Dropdown
      placement="bottom-end"
      offsetPx={6}
      trigger={(open) => (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 px-2.5 text-xs font-medium border-border/80 bg-background hover:bg-muted/50 transition-colors shadow-2xs",
            open && "border-primary ring-1 ring-primary/20",
            isFiltered && "text-foreground font-semibold border-primary/50 bg-primary/5",
            className,
          )}
          disabled={disabled}
        >
          <Calendar size={13} className="text-primary shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[200px]">{formatDateRangeLabel(value)}</span>
          <ChevronDown
            size={12}
            className={cn("text-muted-foreground transition-transform duration-200 shrink-0", open && "rotate-180")}
          />
        </Button>
      )}
    >
      {({ close }) => (
        <div className="w-72 sm:w-80 rounded-xl border border-border bg-card p-3.5 shadow-lg flex flex-col gap-3 text-xs">
          {/* Header Popover */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Calendar size={14} className="text-primary" />
              <span>Rentang Waktu</span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={() => handleReset(close)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pilihan Cepat
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_PRESETS.map((p) => {
                const isActive = value.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id, close)}
                    className={cn(
                      "flex flex-col items-start px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60",
                    )}
                  >
                    <span className="text-xs">{p.label}</span>
                    <span
                      className={cn("text-[10px]", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}
                    >
                      {p.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Datepicker Section */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Pilih Tanggal Kustom
              </span>
              {value.preset === "CUSTOM" && (
                <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                  <Check size={11} /> Aktif
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="filter-from-date" className="text-[10px] text-muted-foreground">
                  Dari Tanggal
                </label>
                <Input
                  id="filter-from-date"
                  type="date"
                  height="sm"
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  className="text-xs h-7.5 px-2 bg-background"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="filter-to-date" className="text-[10px] text-muted-foreground">
                  Sampai Tanggal
                </label>
                <Input
                  id="filter-to-date"
                  type="date"
                  height="sm"
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  className="text-xs h-7.5 px-2 bg-background"
                />
              </div>
            </div>

            <Button
              size="sm"
              className="w-full h-7 text-xs font-medium gap-1.5 mt-1 cursor-pointer"
              disabled={!localFrom && !localTo}
              onClick={() => handleApplyCustom(close)}
            >
              <Check size={13} />
              <span>Terapkan Rentang Tanggal</span>
            </Button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}
