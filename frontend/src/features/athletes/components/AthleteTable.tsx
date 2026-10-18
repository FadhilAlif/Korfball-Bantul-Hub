"use client";

import { Link2, Pencil, Power, Trash2, UserCheck } from "lucide-react";
import { memo } from "react";
import { ActionsMenu, MenuItem } from "@/shared/components/common";
import {
  Avatar,
  Badge,
  Button,
  TableCell,
  TableEmptyRow,
  TableHeader,
  TableLoadingRow,
  TableRow,
  TableShell,
} from "@/shared/components/ui";
import type { AthleteItem } from "../types";

interface AthleteTableProps {
  athletes: AthleteItem[];
  isFetching: boolean;
  isError?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (athlete: AthleteItem) => void;
  onLinkAccount: (athlete: AthleteItem) => void;
  onToggleStatus: (athlete: AthleteItem) => void;
  onDelete: (athlete: AthleteItem) => void;
}

export const AthleteTable = memo(function AthleteTable({
  athletes,
  isFetching,
  isError,
  canEdit,
  canDelete,
  onEdit,
  onLinkAccount,
  onToggleStatus,
  onDelete,
}: AthleteTableProps) {
  return (
    <>
      {/* Mobile Card List (< md) */}
      <div className="flex flex-col gap-3 md:hidden">
        {isFetching && athletes.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Memuat daftar atlet…
          </div>
        )}
        {!isFetching && !isError && athletes.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="text-sm font-semibold">Belum ada atlet yang sesuai filter</div>
            <div className="text-xs text-muted-foreground mt-1">
              Tambahkan atlet baru atau bersihkan filter pencarian.
            </div>
          </div>
        )}
        {athletes.map((athlete) => (
          <div key={athlete.id} className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  {athlete.jerseyNumber !== null ? `#${athlete.jerseyNumber}` : "—"}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{athlete.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {athlete.nickname ? `"${athlete.nickname}" · ` : ""}
                    {athlete.teamName}
                  </div>
                </div>
              </div>

              {(canEdit || canDelete) && (
                <ActionsMenu>
                  {canEdit && (
                    <MenuItem icon={<Pencil size={14} />} onClick={() => onEdit(athlete)}>
                      Edit Profil
                    </MenuItem>
                  )}
                  {canEdit && (
                    <MenuItem icon={<Link2 size={14} />} onClick={() => onLinkAccount(athlete)}>
                      {athlete.userEmail ? "Kelola Tautan Akun" : "Tautkan Akun User"}
                    </MenuItem>
                  )}
                  {canEdit && (
                    <MenuItem icon={<Power size={14} />} onClick={() => onToggleStatus(athlete)}>
                      {athlete.status === "ACTIVE" ? "Nonaktifkan Atlet" : "Aktifkan Atlet"}
                    </MenuItem>
                  )}
                  {canDelete && (
                    <MenuItem icon={<Trash2 size={14} />} destructive onClick={() => onDelete(athlete)}>
                      Hapus Atlet
                    </MenuItem>
                  )}
                </ActionsMenu>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={athlete.sex === "MALE" ? "info" : "primary"}>
                  {athlete.sex === "MALE" ? "Putra (L)" : "Putri (P)"}
                </Badge>
                <Badge variant={athlete.status === "ACTIVE" ? "success" : "secondary"} dot>
                  {athlete.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                </Badge>
                {athlete.attendance30dRate !== null && (
                  <Badge variant="outline">Hadir 30H: {athlete.attendance30dRate}%</Badge>
                )}
              </div>

              {athlete.userEmail ? (
                <span className="text-[11.5px] text-muted-foreground truncate max-w-[160px]">{athlete.userEmail}</span>
              ) : (
                canEdit && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onLinkAccount(athlete)}>
                    <Link2 size={12} />
                    Tautkan Akun
                  </Button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table (>= md) */}
      <TableShell className="hidden md:block">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="w-12 px-4 py-2.5 border-b border-border" />
              <TableHeader>Atlet</TableHeader>
              <TableHeader>No. Punggung</TableHeader>
              <TableHeader>L / P</TableHeader>
              <TableHeader>Tim</TableHeader>
              <TableHeader>Akun Login</TableHeader>
              <TableHeader>Kehadiran 30H</TableHeader>
              <TableHeader>Status</TableHeader>
            </tr>
          </thead>
          <tbody>
            <TableLoadingRow isLoading={isFetching} colSpan={8} />
            {isError && !isFetching && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  Gagal memuat daftar atlet. Silakan muat ulang halaman.
                </td>
              </tr>
            )}
            <TableEmptyRow
              isEmpty={!isFetching && !isError && athletes.length === 0}
              colSpan={8}
              icon={<UserCheck size={24} strokeWidth={1.5} aria-hidden />}
              title="Belum ada atlet yang sesuai filter"
              description="Tambahkan atlet baru atau bersihkan filter pencarian."
            />
            {athletes.map((athlete) => (
              <TableRow key={athlete.id}>
                <TableCell className="w-12">
                  {(canEdit || canDelete) && (
                    <ActionsMenu>
                      {canEdit && (
                        <MenuItem icon={<Pencil size={14} />} onClick={() => onEdit(athlete)}>
                          Edit Profil
                        </MenuItem>
                      )}
                      {canEdit && (
                        <MenuItem icon={<Link2 size={14} />} onClick={() => onLinkAccount(athlete)}>
                          {athlete.userEmail ? "Kelola Tautan Akun" : "Tautkan Akun User"}
                        </MenuItem>
                      )}
                      {canEdit && (
                        <MenuItem icon={<Power size={14} />} onClick={() => onToggleStatus(athlete)}>
                          {athlete.status === "ACTIVE" ? "Nonaktifkan Atlet" : "Aktifkan Atlet"}
                        </MenuItem>
                      )}
                      {canDelete && (
                        <MenuItem icon={<Trash2 size={14} />} destructive onClick={() => onDelete(athlete)}>
                          Hapus Atlet
                        </MenuItem>
                      )}
                    </ActionsMenu>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={athlete.fullName} size={32} />
                    <div>
                      <div className="font-semibold text-[13.5px]">{athlete.fullName}</div>
                      {athlete.nickname && (
                        <div className="text-[12px] text-muted-foreground">Panggilan: {athlete.nickname}</div>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {athlete.jerseyNumber !== null ? (
                    <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-md bg-muted border border-border font-mono font-semibold text-xs">
                      #{athlete.jerseyNumber}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={athlete.sex === "MALE" ? "info" : "primary"}>
                    {athlete.sex === "MALE" ? "Putra (L)" : "Putri (P)"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="font-medium text-[13px]">{athlete.teamName}</span>
                </TableCell>

                <TableCell>
                  {athlete.userEmail ? (
                    <button
                      type="button"
                      onClick={() => canEdit && onLinkAccount(athlete)}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer"
                    >
                      <Link2 size={12} />
                      {athlete.userEmail}
                    </button>
                  ) : canEdit ? (
                    <button
                      type="button"
                      onClick={() => onLinkAccount(athlete)}
                      className="h-[22px] px-2 inline-flex items-center gap-1 rounded-full border border-dashed border-border text-[11.5px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                    >
                      <Link2 size={11} />
                      Tautkan
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Belum tertaut</span>
                  )}
                </TableCell>

                <TableCell>
                  {athlete.attendance30dRate !== null ? (
                    <Badge
                      variant={
                        athlete.attendance30dRate >= 75
                          ? "success"
                          : athlete.attendance30dRate >= 50
                            ? "warning"
                            : "danger"
                      }
                    >
                      {athlete.attendance30dRate}%
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={athlete.status === "ACTIVE" ? "success" : "secondary"} dot>
                    {athlete.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </TableShell>
    </>
  );
});
