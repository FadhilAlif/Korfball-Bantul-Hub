"use client";

import { Link2, Link2Off, Mail } from "lucide-react";
import { useState } from "react";
import { useUsers } from "@/features/users/hooks/useUsers";
import { SearchInput } from "@/shared/components/common";
import { Alert, Avatar, Badge, Button, Modal } from "@/shared/components/ui";
import { useDebounce } from "@/shared/hooks";
import { getErrorMessage } from "@/shared/lib/api-error";
import { toast } from "@/shared/lib/toast";
import { useLinkAthleteUser, useUnlinkAthleteUser } from "../hooks";
import type { AthleteItem } from "../types";

interface LinkAthleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteItem;
}

export function LinkAthleteUserModal({ isOpen, onClose, athlete }: LinkAthleteUserModalProps) {
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: usersData, isFetching } = useUsers({
    page: 1,
    limit: 10,
    search: debouncedSearch,
  });

  const linkMutation = useLinkAthleteUser();
  const unlinkMutation = useUnlinkAthleteUser();

  const users = usersData?.data ?? [];

  const handleLink = (userId: number, email: string) => {
    setErrorMsg(null);
    linkMutation.mutate(
      { athleteId: athlete.id, userId },
      {
        onSuccess: () => {
          toast.success("Akun berhasil ditautkan", {
            description: `${athlete.fullName} ↔ ${email} (role athlete otomatis diberikan)`,
          });
          onClose();
        },
        onError: (err) => setErrorMsg(getErrorMessage(err)),
      },
    );
  };

  const handleUnlink = () => {
    setErrorMsg(null);
    unlinkMutation.mutate(athlete.id, {
      onSuccess: () => {
        toast.success("Tautan akun dilepas", { description: athlete.fullName });
        onClose();
      },
      onError: (err) => setErrorMsg(getErrorMessage(err)),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tautkan Akun Login — ${athlete.fullName}`}>
      <div className="flex flex-col gap-3.5 pt-1">
        <p className="text-sm text-muted-foreground -mt-0.5">
          Menautkan akun user akan mengizinkan atlet melakukan self check-in presensi mandiri dan melihat statistik
          pribadinya.
        </p>

        {errorMsg && <Alert message={errorMsg} />}

        {athlete.userId && athlete.userEmail && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/50">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={15} className="text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Tertaut saat ini:</div>
                <div className="text-sm font-semibold truncate">{athlete.userEmail}</div>
              </div>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={unlinkMutation.isPending}
              onClick={handleUnlink}
            >
              <Link2Off size={14} />
              Lepas Tautan
            </Button>
          </div>
        )}

        <SearchInput
          placeholder="Cari nama atau email akun user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={search ? () => setSearch("") : undefined}
        />

        <div className="max-h-60 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {isFetching && users.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">Mencari akun user…</div>
          )}
          {!isFetching && users.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Tidak ada akun user yang cocok. Buat akun terlebih dahulu di menu Users.
            </div>
          )}
          {users.map((user) => {
            const isCurrent = athlete.userId === user.id;
            return (
              <div key={user.id} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={user.name} src={user.avatarUrl} size={28} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>
                {isCurrent ? (
                  <Badge variant="success" dot>
                    Tertaut
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    isLoading={linkMutation.isPending}
                    onClick={() => handleLink(user.id, user.email)}
                  >
                    <Link2 size={13} />
                    Pilih
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
