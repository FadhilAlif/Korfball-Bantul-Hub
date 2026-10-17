"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import type { AttendanceSheetRow, AttendanceStatus, LocalAttendanceEdit } from "../types";
import { useAttendanceSheet, useBulkSaveAttendance, useFinalizeSession } from "./useAttendance";

export function mergeServerRecordsWithLocalEdits(
  serverRecords: AttendanceSheetRow[],
  localEdits: Record<number, LocalAttendanceEdit>,
): AttendanceSheetRow[] {
  return serverRecords.map((row) => {
    const local = localEdits[row.athleteId];
    if (!local) return row;
    return {
      ...row,
      status: local.status,
      note: local.note,
    };
  });
}

export function useAttendanceSheetState(sessionId: number) {
  const [localEdits, setLocalEdits] = useState<Record<number, LocalAttendanceEdit>>({});
  const [search, setSearch] = useState("");
  const [isCodeModalOpen, setCodeModalOpen] = useState(false);
  const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);

  const initialQuery = useAttendanceSheet(sessionId, false);
  const isScheduled = initialQuery.data?.session.status === "SCHEDULED";
  const { data, isFetching, isError, refetch } = useAttendanceSheet(sessionId, isScheduled);

  const bulkSave = useBulkSaveAttendance(sessionId);
  const finalizeMutation = useFinalizeSession(sessionId);

  const dirtyCount = Object.keys(localEdits).length;
  const hasUnsavedChanges = dirtyCount > 0;

  // Warn before closing browser tab if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const mergedRecords = useMemo(() => {
    const serverRecords = data?.records ?? [];
    return mergeServerRecordsWithLocalEdits(serverRecords, localEdits);
  }, [data?.records, localEdits]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mergedRecords;
    return mergedRecords.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.nickname && r.nickname.toLowerCase().includes(q)) ||
        (r.jerseyNumber !== null && String(r.jerseyNumber).includes(q)),
    );
  }, [mergedRecords, search]);

  const liveCounts = useMemo(() => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;
    let unrecorded = 0;

    for (const r of mergedRecords) {
      if (r.status === "PRESENT") present++;
      else if (r.status === "LATE") late++;
      else if (r.status === "EXCUSED") excused++;
      else if (r.status === "ABSENT") absent++;
      else unrecorded++;
    }

    return {
      present,
      late,
      excused,
      absent,
      attended: present + late,
      unrecorded,
      totalAthletes: mergedRecords.length,
    };
  }, [mergedRecords]);

  const setAthleteStatus = useCallback(
    (athleteId: number, status: AttendanceStatus) => {
      const serverRow = data?.records.find((r) => r.athleteId === athleteId);
      setLocalEdits((prev) => {
        const currentNote = prev[athleteId]?.note ?? serverRow?.note ?? null;
        return {
          ...prev,
          [athleteId]: { status, note: currentNote },
        };
      });
    },
    [data?.records],
  );

  const setAthleteNote = useCallback(
    (athleteId: number, note: string) => {
      const serverRow = data?.records.find((r) => r.athleteId === athleteId);
      const currentStatus = localEdits[athleteId]?.status ?? serverRow?.status ?? "PRESENT";
      setLocalEdits((prev) => ({
        ...prev,
        [athleteId]: { status: currentStatus, note: note || null },
      }));
    },
    [data?.records, localEdits],
  );

  const markAllUnrecordedPresent = useCallback(() => {
    const serverRecords = data?.records ?? [];
    setLocalEdits((prev) => {
      const next = { ...prev };
      for (const row of serverRecords) {
        const effectiveStatus = next[row.athleteId]?.status ?? row.status;
        if (!effectiveStatus) {
          next[row.athleteId] = {
            status: "PRESENT",
            note: row.note ?? null,
          };
        }
      }
      return next;
    });
  }, [data?.records]);

  const discardLocalEdits = useCallback(() => {
    setLocalEdits({});
  }, []);

  const handleSave = useCallback(() => {
    const payload = Object.entries(localEdits).map(([idStr, edit]) => ({
      athleteId: Number(idStr),
      status: edit.status,
      note: edit.note,
    }));

    if (payload.length === 0) return;

    bulkSave.mutate(payload, {
      onSuccess: () => {
        setLocalEdits({});
        toast.success("Presensi berhasil disimpan", {
          description: `${payload.length} data kehadiran atlet diperbarui.`,
        });
      },
      onError: (err) => {
        toast.error("Gagal menyimpan presensi", { description: getErrorMessage(err) });
      },
    });
  }, [localEdits, bulkSave]);

  const handleConfirmFinalize = useCallback(() => {
    const finalizeAfterSave = () => {
      finalizeMutation.mutate(undefined, {
        onSuccess: () => {
          setLocalEdits({});
          setFinalizeModalOpen(false);
          toast.success("Sesi latihan berhasil difinalisasi");
        },
        onError: (err) => {
          toast.error("Gagal memfinalisasi sesi", { description: getErrorMessage(err) });
        },
      });
    };

    const payload = Object.entries(localEdits).map(([idStr, edit]) => ({
      athleteId: Number(idStr),
      status: edit.status,
      note: edit.note,
    }));

    if (payload.length > 0) {
      bulkSave.mutate(payload, {
        onSuccess: () => finalizeAfterSave(),
        onError: (err) =>
          toast.error("Gagal menyimpan perubahan sebelum finalisasi", { description: getErrorMessage(err) }),
      });
    } else {
      finalizeAfterSave();
    }
  }, [localEdits, bulkSave, finalizeMutation]);

  return {
    session: data?.session ?? null,
    records: filteredRecords,
    liveCounts,
    localEdits,
    dirtyCount,
    hasUnsavedChanges,
    search,
    setSearch,
    isCodeModalOpen,
    setCodeModalOpen,
    isFinalizeModalOpen,
    setFinalizeModalOpen,
    isFetching,
    isError,
    isSaving: bulkSave.isPending,
    isFinalizing: finalizeMutation.isPending || bulkSave.isPending,
    refetch,
    setAthleteStatus,
    setAthleteNote,
    markAllUnrecordedPresent,
    discardLocalEdits,
    handleSave,
    handleConfirmFinalize,
  };
}
