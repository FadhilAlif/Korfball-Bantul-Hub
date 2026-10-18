"use client";

import { MapPin, Pencil, Trash2, UsersRound } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { ActionsMenu, MenuItem } from "@/shared/components/common";
import {
  Badge,
  TableCell,
  TableEmptyRow,
  TableHeader,
  TableLoadingRow,
  TableRow,
  TableShell,
} from "@/shared/components/ui";
import type { TeamItem } from "../types";

interface TeamTableProps {
  teams: TeamItem[];
  isFetching: boolean;
  isError?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (team: TeamItem) => void;
  onDelete: (team: TeamItem) => void;
}

export const TeamTable = memo(function TeamTable({
  teams,
  isFetching,
  isError,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: TeamTableProps) {
  return (
    <TableShell>
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="w-12 px-4 py-2.5 border-b border-border" />
            <TableHeader>Nama Tim</TableHeader>
            <TableHeader>Singkatan</TableHeader>
            <TableHeader>Kategori</TableHeader>
            <TableHeader>Daerah / Asal</TableHeader>
            <TableHeader>Atlet Aktif</TableHeader>
          </tr>
        </thead>
        <tbody>
          <TableLoadingRow isLoading={isFetching} colSpan={6} />
          {isError && !isFetching && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                Gagal memuat daftar tim. Silakan coba muat ulang.
              </td>
            </tr>
          )}
          <TableEmptyRow
            isEmpty={!isFetching && !isError && teams.length === 0}
            colSpan={6}
            icon={<UsersRound size={24} strokeWidth={1.5} aria-hidden />}
            title="Belum ada tim yang sesuai filter"
            description="Tambahkan tim baru atau bersihkan filter pencarian."
          />
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="w-12">
                {(canEdit || canDelete) && (
                  <ActionsMenu>
                    {canEdit && (
                      <MenuItem icon={<Pencil size={14} />} onClick={() => onEdit(team)}>
                        Edit Tim
                      </MenuItem>
                    )}
                    {canDelete && (
                      <MenuItem icon={<Trash2 size={14} />} destructive onClick={() => onDelete(team)}>
                        Hapus Tim
                      </MenuItem>
                    )}
                  </ActionsMenu>
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: team.color || "#3B82F6" }}
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-[13.5px]">{team.name}</span>
                </div>
              </TableCell>

              <TableCell>
                {team.shortName ? (
                  <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">
                    {team.shortName}
                  </code>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>

              <TableCell>
                {team.isInternal ? (
                  <Badge variant="primary" dot>
                    Internal Klub
                  </Badge>
                ) : (
                  <Badge variant="secondary">Tim Lawan</Badge>
                )}
              </TableCell>

              <TableCell>
                {team.region ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[13px]">
                    <MapPin size={13} />
                    {team.region}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>

              <TableCell>
                <Link
                  href={`/athletes?teamId=${team.id}`}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline text-[13px]"
                >
                  {team.activeAthletesCount} atlet
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
});
