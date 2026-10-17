"use client";

import { ConfirmDeleteModal, PageHeader } from "@/shared/components/common";
import { Pagination } from "@/shared/components/ui";
import { AthleteModal } from "./components/AthleteModal";
import { AthleteTable } from "./components/AthleteTable";
import { AthleteToolbar } from "./components/AthleteToolbar";
import { LinkAthleteUserModal } from "./components/LinkAthleteUserModal";
import { useAthletesPage } from "./hooks/useAthletesPage";

export function AthletesPage() {
  const {
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
    clearFilters,
    isDeletePending,
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
  } = useAthletesPage();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Daftar Atlet"
        description="Kelola profil atlet, nomor punggung, tautan akun login, dan pantau tingkat kehadiran 30 hari terakhir."
      />

      <AthleteToolbar
        search={search}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        teams={teams}
        canCreate={canCreate}
        isFetching={isFetching}
        onAddAthlete={openCreate}
        onRefresh={handleRefresh}
      />

      <AthleteTable
        athletes={athletes}
        isFetching={isFetching}
        isError={isError}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={openEdit}
        onLinkAccount={openLinkModal}
        onToggleStatus={handleToggleStatus}
        onDelete={openConfirmDelete}
      />

      {meta && <Pagination page={page} pageSize={meta.limit} total={meta.total} onPageChange={setPage} label="atlet" />}

      <AthleteModal isOpen={isAthleteModalOpen} onClose={closeAthleteModal} athlete={editingAthlete} teams={teams} />

      {linkingAthlete && (
        <LinkAthleteUserModal isOpen={!!linkingAthlete} onClose={closeLinkModal} athlete={linkingAthlete} />
      )}

      {deletingAthlete && (
        <ConfirmDeleteModal
          isOpen={!!deletingAthlete}
          onClose={closeConfirmDelete}
          onConfirm={handleConfirmDelete}
          title={`Hapus atlet ${deletingAthlete.fullName}?`}
          description="Atlet yang sudah memiliki histori presensi atau pertandingan tidak dapat dihapus (gunakan opsi Nonaktifkan Atlet)."
          confirmText={deletingAthlete.fullName}
          confirmLabel="Hapus Atlet"
          isLoading={isDeletePending}
        />
      )}
    </div>
  );
}
