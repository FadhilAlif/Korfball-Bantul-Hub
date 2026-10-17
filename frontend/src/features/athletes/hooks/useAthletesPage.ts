"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTeams } from "@/features/teams/hooks";
import { useDebounce, usePermission } from "@/shared/hooks";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import type { AthleteFilterState, AthleteItem } from "../types";
import { useAthletes, useDeleteAthlete, useUpdateAthlete } from "./useAthletes";

const EMPTY_FILTER: AthleteFilterState = { teamId: "", sex: "", status: "" };

export function useAthletesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AthleteFilterState>(EMPTY_FILTER);

  const [editingAthlete, setEditingAthlete] = useState<AthleteItem | null>(null);
  const [isAthleteModalOpen, setAthleteModalOpen] = useState(false);
  const [linkingAthlete, setLinkingAthlete] = useState<AthleteItem | null>(null);
  const [deletingAthlete, setDeletingAthlete] = useState<AthleteItem | null>(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 400);

  const { data, isError } = useAthletes({
    page,
    limit: 20,
    teamId: filters.teamId,
    sex: filters.sex,
    status: filters.status,
    search: debouncedSearch,
  });

  const { data: teamsData } = useTeams({ limit: 100 });
  const teams = useMemo(() => teamsData?.data ?? [], [teamsData]);

  const isFetching = useIsFetching({ queryKey: ["athletes"] }) > 0;
  const updateAthlete = useUpdateAthlete();
  const deleteAthlete = useDeleteAthlete();

  const canCreate = usePermission("athletes:create");
  const canEdit = usePermission("athletes:update");
  const canDelete = usePermission("athletes:delete");

  const athletes = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const activeFilterCount = (filters.teamId ? 1 : 0) + (filters.sex ? 1 : 0) + (filters.status ? 1 : 0);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["athletes"] });
  }, [queryClient]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((f: AthleteFilterState) => {
    setFilters(f);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTER);
    setPage(1);
  }, []);

  const openCreate = useCallback(() => {
    setEditingAthlete(null);
    setAthleteModalOpen(true);
  }, []);

  const openEdit = useCallback((athlete: AthleteItem) => {
    setEditingAthlete(athlete);
    setAthleteModalOpen(true);
  }, []);

  const closeAthleteModal = useCallback(() => {
    setAthleteModalOpen(false);
  }, []);

  const openLinkModal = useCallback((athlete: AthleteItem) => {
    setLinkingAthlete(athlete);
  }, []);

  const closeLinkModal = useCallback(() => {
    setLinkingAthlete(null);
  }, []);

  const openConfirmDelete = useCallback((athlete: AthleteItem) => {
    setDeletingAthlete(athlete);
  }, []);

  const closeConfirmDelete = useCallback(() => {
    setDeletingAthlete(null);
  }, []);

  const handleToggleStatus = useCallback(
    (athlete: AthleteItem) => {
      const nextStatus = athlete.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      updateAthlete.mutate(
        { id: athlete.id, payload: { status: nextStatus } },
        {
          onSuccess: () => {
            toast.success(nextStatus === "ACTIVE" ? "Atlet diaktifkan" : "Atlet dinonaktifkan", {
              description: athlete.fullName,
            });
          },
          onError: (err) => {
            toast.error("Gagal mengubah status atlet", { description: getErrorMessage(err) });
          },
        },
      );
    },
    [updateAthlete],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deletingAthlete) return;
    deleteAthlete.mutate(deletingAthlete.id, {
      onSuccess: () => {
        setDeletingAthlete(null);
        toast.success("Atlet berhasil dihapus", { description: deletingAthlete.fullName });
      },
      onError: (err) => {
        toast.error("Gagal menghapus atlet", { description: getErrorMessage(err) });
      },
    });
  }, [deletingAthlete, deleteAthlete]);

  return {
    page,
    setPage,
    search,
    filters,
    editingAthlete,
    isAthleteModalOpen,
    linkingAthlete,
    deletingAthlete,
    athletes,
    teams,
    meta,
    isFetching,
    isError,
    canCreate,
    canEdit,
    canDelete,
    activeFilterCount,
    clearFilters: activeFilterCount > 0 ? handleClearFilters : undefined,
    isDeletePending: deleteAthlete.isPending,
    handleRefresh,
    handleSearchChange,
    handleFiltersChange,
    openCreate,
    openEdit,
    closeAthleteModal,
    openLinkModal,
    closeLinkModal,
    openConfirmDelete,
    closeConfirmDelete,
    handleToggleStatus,
    handleConfirmDelete,
  };
}
