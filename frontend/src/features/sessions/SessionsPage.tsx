"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { ConfirmDeleteModal, PageHeader } from "@/shared/components/common";
import { buttonVariants, Pagination } from "@/shared/components/ui";
import { usePermission } from "@/shared/hooks";
import { GenerateRoutineModal } from "./components/GenerateRoutineModal";
import { SessionModal } from "./components/SessionModal";
import { SessionTable } from "./components/SessionTable";
import { SessionToolbar } from "./components/SessionToolbar";
import { useSessionsPage } from "./hooks/useSessionsPage";

export function SessionsPage() {
  const {
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
    canViewAttendance,
    activeFilterCount,
    clearFilters,
    isDeletePending,
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
  } = useSessionsPage();

  const canExportSummary = usePermission("attendance:export");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Sesi Latihan & Presensi"
        description="Kelola jadwal latihan rutin Selasa & Sabtu, tampilkan kode check-in 6 karakter, dan catat kehadiran atlet."
      >
        {canExportSummary && (
          <Link href="/attendance/summary" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <BarChart3 size={14} />
            Rekap & Export XLSX
          </Link>
        )}
      </PageHeader>

      <SessionToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        canCreate={canCreate}
        isFetching={isFetching}
        onAddSession={openCreate}
        onOpenRoutineGenerator={openRoutineModal}
        onRefresh={handleRefresh}
      />

      <SessionTable
        sessions={sessions}
        isFetching={isFetching}
        isError={isError}
        canEdit={canEdit}
        canDelete={canDelete}
        canViewAttendance={canViewAttendance}
        onEdit={openEdit}
        onCancel={handleCancelSession}
        onDelete={openConfirmDelete}
      />

      {meta && <Pagination page={page} pageSize={meta.limit} total={meta.total} onPageChange={setPage} label="sesi" />}

      <SessionModal isOpen={isSessionModalOpen} onClose={closeSessionModal} session={editingSession} />

      <GenerateRoutineModal isOpen={isRoutineModalOpen} onClose={closeRoutineModal} />

      {deletingSession && (
        <ConfirmDeleteModal
          isOpen={!!deletingSession}
          onClose={closeConfirmDelete}
          onConfirm={handleConfirmDelete}
          title={`Hapus sesi ${deletingSession.title}?`}
          description="Sesi yang sudah memiliki data presensi tidak dapat dihapus (gunakan opsi Batalkan Sesi)."
          confirmText={deletingSession.title}
          confirmLabel="Hapus Sesi"
          isLoading={isDeletePending}
        />
      )}
    </div>
  );
}
