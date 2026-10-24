"use client";

import { Mail, User } from "lucide-react";
import { Alert, AvatarUpload, Button, FormField, Input, Modal } from "@/shared/components/ui";
import { useEditProfileModal } from "./useEditProfileModal";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { register, handleSubmit, onSubmit, watch, setValue, errors, isSubmitting } = useEditProfileModal({
    isOpen,
    onClose,
  });

  const avatarUrl = watch("avatarUrl");
  const name = watch("name") || "User";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profil">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
        <p className="text-sm text-muted-foreground -mt-0.5">Perbarui foto profil, nama, dan alamat email Anda.</p>

        {errors.root && <Alert message={errors.root.message ?? "An error occurred"} />}

        <AvatarUpload
          name={name}
          value={avatarUrl}
          onChange={(url) => setValue("avatarUrl", url, { shouldDirty: true })}
          folder="avatars"
          size={76}
          label="Foto Profil"
          helperText="Format JPG, PNG, atau WebP (maks. 8MB). Anda dapat menggeser, zoom, dan crop foto (16:9, landscape, portrait) agar pas sebelum disimpan."
        />

        <FormField label="Nama Lengkap" htmlFor="profile-name" required error={errors.name?.message}>
          <Input
            id="profile-name"
            {...register("name")}
            placeholder="Ada Lovelace"
            iconLeft={<User size={15} />}
            error={errors.name?.message}
          />
        </FormField>

        <FormField label="Email" htmlFor="profile-email" required error={errors.email?.message}>
          <Input
            id="profile-email"
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
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
