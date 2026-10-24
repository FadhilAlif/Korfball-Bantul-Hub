"use client";

import { Mail, User } from "lucide-react";
import { Alert, AvatarUpload, Button, FormField, Input, Modal } from "@/shared/components/ui";
import type { UserWithRoles } from "@/shared/types";
import { useUserModal } from "./useUserModal";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserWithRoles | null;
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const { isEditing, handleSubmit, onSubmit, errors, register, watch, setValue, isSubmitting } = useUserModal({
    isOpen,
    onClose,
    user,
  });

  const avatarUrl = watch("avatarUrl");
  const name = watch("name") || "User";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit pengguna" : "Tambah pengguna"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
        <p className="text-sm text-muted-foreground -mt-0.5">
          {isEditing
            ? "Perbarui informasi dan foto profil pengguna ini."
            : "Email undangan akan dikirim agar pengguna dapat mengatur kata sandinya sendiri."}
        </p>

        {errors.root && <Alert message={errors.root.message ?? "Terjadi kesalahan"} />}

        <AvatarUpload
          name={name}
          value={avatarUrl}
          onChange={(url) => setValue("avatarUrl", url, { shouldDirty: true })}
          folder="avatars"
          size={76}
          label="Foto Pengguna (Opsional)"
          helperText="Foto profil pengguna yang tersimpan di Neon Object Storage."
        />

        <FormField label="Nama Lengkap" htmlFor="user-name" required error={errors.name?.message}>
          <Input
            id="user-name"
            {...register("name")}
            placeholder="Ada Lovelace"
            iconLeft={<User size={15} />}
            error={errors.name?.message}
          />
        </FormField>

        <FormField label="Email" htmlFor="user-email" required error={errors.email?.message}>
          <Input
            id="user-email"
            type="email"
            {...register("email")}
            placeholder="ada@company.com"
            iconLeft={<Mail size={15} />}
            error={errors.email?.message}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Save changes" : "Send invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
