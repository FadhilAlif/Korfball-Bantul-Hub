"use client";

import { ConfirmDeleteModal, PageHeader } from "@/shared/components/common";
import { Pagination } from "@/shared/components/ui";
import { TeamModal } from "./components/TeamModal";
import { TeamTable } from "./components/TeamTable";
import { TeamToolbar } from "./components/TeamToolbar";
import { useTeamsPage } from "./hooks/useTeamsPage";

export function TeamsPage() {
  const {
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
    clearFilters,
    isDeletePending,
    handleRefresh,
    handleSearchChange,
    handleFiltersChange,
    openCreate,
    openEdit,
    closeModal,
    openConfirmDelete,
    closeConfirmDelete,
    handleConfirmDelete,
  } = useTeamsPage();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Daftar Tim"
        description="Kelola skuad internal Korfball Bantul beserta daftar tim lawan untuk pencatatan pertandingan."
      />

      <TeamToolbar
        search={search}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        canCreate={canCreate}
        isFetching={isFetching}
        onAddTeam={openCreate}
        onRefresh={handleRefresh}
      />

      <TeamTable
        teams={teams}
        isFetching={isFetching}
        isError={isError}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={openEdit}
        onDelete={openConfirmDelete}
      />

      {meta && <Pagination page={page} pageSize={meta.limit} total={meta.total} onPageChange={setPage} label="tim" />}

      <TeamModal isOpen={isModalOpen} onClose={closeModal} team={editingTeam} />

      {deletingTeam && (
        <ConfirmDeleteModal
          isOpen={!!deletingTeam}
          onClose={closeConfirmDelete}
          onConfirm={handleConfirmDelete}
          title={`Hapus tim ${deletingTeam.name}?`}
          description="Tim yang sudah memiliki histori atlet, sesi latihan, atau pertandingan tidak dapat dihapus."
          confirmText={deletingTeam.name}
          confirmLabel="Hapus Tim"
          isLoading={isDeletePending}
        />
      )}
    </div>
  );
}
