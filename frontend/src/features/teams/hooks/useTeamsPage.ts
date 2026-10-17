"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useDebounce, usePermission } from "@/shared/hooks";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import type { TeamFilterState, TeamItem } from "../types";
import { useDeleteTeam, useTeams } from "./useTeams";

const EMPTY_FILTER: TeamFilterState = { isInternal: "" };

export function useTeamsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TeamFilterState>(EMPTY_FILTER);

  const [editingTeam, setEditingTeam] = useState<TeamItem | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<TeamItem | null>(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 400);

  const { data, isError } = useTeams({
    page,
    limit: 20,
    search: debouncedSearch,
    isInternal: filters.isInternal,
  });

  const isFetching = useIsFetching({ queryKey: ["teams"] }) > 0;
  const deleteTeam = useDeleteTeam();

  const canCreate = usePermission("teams:create");
  const canEdit = usePermission("teams:update");
  const canDelete = usePermission("teams:delete");

  const teams = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const activeFilterCount = filters.isInternal ? 1 : 0;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["teams"] });
  }, [queryClient]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((f: TeamFilterState) => {
    setFilters(f);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTER);
    setPage(1);
  }, []);

  const openCreate = useCallback(() => {
    setEditingTeam(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((team: TeamItem) => {
    setEditingTeam(team);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const openConfirmDelete = useCallback((team: TeamItem) => {
    setDeletingTeam(team);
  }, []);

  const closeConfirmDelete = useCallback(() => {
    setDeletingTeam(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingTeam) return;
    deleteTeam.mutate(deletingTeam.id, {
      onSuccess: () => {
        setDeletingTeam(null);
        toast.success("Tim berhasil dihapus", { description: deletingTeam.name });
      },
      onError: (err) => {
        toast.error("Gagal menghapus tim", { description: getErrorMessage(err) });
      },
    });
  }, [deletingTeam, deleteTeam]);

  return {
    page,
    setPage,
    search,
    filters,
    editingTeam,
    isModalOpen,
    deletingTeam,
    teams,
    meta,
    isFetching,
    isError,
    canCreate,
    canEdit,
    canDelete,
    activeFilterCount,
    clearFilters: activeFilterCount > 0 ? handleClearFilters : undefined,
    isDeletePending: deleteTeam.isPending,
    handleRefresh,
    handleSearchChange,
    handleFiltersChange,
    openCreate,
    openEdit,
    closeModal,
    openConfirmDelete,
    closeConfirmDelete,
    handleConfirmDelete,
  };
}
