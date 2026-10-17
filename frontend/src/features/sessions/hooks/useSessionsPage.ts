"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { usePermission } from "@/shared/hooks";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import type { SessionFilterState, SessionItem } from "../types";
import { useCancelSession, useDeleteSession, useSessions } from "./useSessions";

const EMPTY_FILTER: SessionFilterState = { type: "", status: "", from: "", to: "" };

export function useSessionsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SessionFilterState>(EMPTY_FILTER);

  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [isSessionModalOpen, setSessionModalOpen] = useState(false);
  const [isRoutineModalOpen, setRoutineModalOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);

  const queryClient = useQueryClient();
  const { data, isError } = useSessions({
    page,
    limit: 20,
    type: filters.type,
    status: filters.status,
    from: filters.from,
    to: filters.to,
  });

  const isFetching = useIsFetching({ queryKey: ["sessions"] }) > 0;
  const cancelSession = useCancelSession();
  const deleteSession = useDeleteSession();

  const canCreate = usePermission("sessions:create");
  const canEdit = usePermission("sessions:update");
  const canDelete = usePermission("sessions:delete");
  const canRecordAttendance = usePermission("attendance:record");
  const canViewAttendance = usePermission("attendance:read");
  const canSelfCheckin = usePermission("attendance:self");

  const sessions = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const activeFilterCount =
    (filters.type ? 1 : 0) + (filters.status ? 1 : 0) + (filters.from ? 1 : 0) + (filters.to ? 1 : 0);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
  }, [queryClient]);

  const handleFiltersChange = useCallback((f: SessionFilterState) => {
    setFilters(f);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTER);
    setPage(1);
  }, []);

  const openCreate = useCallback(() => {
    setEditingSession(null);
    setSessionModalOpen(true);
  }, []);

  const openEdit = useCallback((session: SessionItem) => {
    setEditingSession(session);
    setSessionModalOpen(true);
  }, []);

  const closeSessionModal = useCallback(() => {
    setSessionModalOpen(false);
  }, []);

  const openRoutineModal = useCallback(() => {
    setRoutineModalOpen(true);
  }, []);

  const closeRoutineModal = useCallback(() => {
    setRoutineModalOpen(false);
  }, []);

  const openConfirmDelete = useCallback((session: SessionItem) => {
    setDeletingSession(session);
  }, []);

  const closeConfirmDelete = useCallback(() => {
    setDeletingSession(null);
  }, []);

  const handleCancelSession = useCallback(
    (session: SessionItem) => {
      cancelSession.mutate(session.id, {
        onSuccess: () => {
          toast.success("Sesi dibatalkan", { description: session.title });
        },
        onError: (err) => {
          toast.error("Gagal membatalkan sesi", { description: getErrorMessage(err) });
        },
      });
    },
    [cancelSession],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deletingSession) return;
    deleteSession.mutate(deletingSession.id, {
      onSuccess: () => {
        setDeletingSession(null);
        toast.success("Sesi berhasil dihapus", { description: deletingSession.title });
      },
      onError: (err) => {
        toast.error("Gagal menghapus sesi", { description: getErrorMessage(err) });
      },
    });
  }, [deletingSession, deleteSession]);

  return {
    page,
    setPage,
    filters,
    editingSession,
    isSessionModalOpen,
    isRoutineModalOpen,
    deletingSession,
    sessions,
    meta,
    isFetching,
    isError,
    canCreate,
    canEdit,
    canDelete,
    canRecordAttendance,
    canViewAttendance,
    canSelfCheckin,
    activeFilterCount,
    clearFilters: activeFilterCount > 0 ? handleClearFilters : undefined,
    isDeletePending: deleteSession.isPending,
    handleRefresh,
    handleFiltersChange,
    openCreate,
    openEdit,
    closeSessionModal,
    openRoutineModal,
    closeRoutineModal,
    openConfirmDelete,
    closeConfirmDelete,
    handleCancelSession,
    handleConfirmDelete,
  };
}
