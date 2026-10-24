"use client";

import { Camera, Crop, Loader2, Trash2, Upload } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { ImageCropModal } from "./ImageCropModal";
import {
  cropAndCompressImage,
  type ImageCropTransform,
  resolveStorageUrl,
  uploadBase64ImageToStorage,
  validateImageFile,
} from "@/shared/lib/storage";
import { toast } from "@/shared/lib/toast";

interface AvatarUploadProps {
  name: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: "avatars" | "athletes";
  size?: number;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

export const AvatarUpload = memo(function AvatarUpload({
  name,
  value,
  onChange,
  folder = "avatars",
  size = 80,
  label = "Foto Profil",
  helperText = "Format JPG, PNG, atau WebP (maks. 8MB). Anda dapat menggeser & memotong (crop) foto sebelum diunggah.",
  disabled = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [lastOriginalSrc, setLastOriginalSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (pendingImageSrc?.startsWith("blob:") && pendingImageSrc !== lastOriginalSrc) {
        URL.revokeObjectURL(pendingImageSrc);
      }
    };
  }, [pendingImageSrc, lastOriginalSrc]);

  useEffect(() => {
    return () => {
      if (lastOriginalSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(lastOriginalSrc);
      }
    };
  }, [lastOriginalSrc]);

  const openFilePicker = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      if (pendingImageSrc?.startsWith("blob:") && pendingImageSrc !== lastOriginalSrc) {
        URL.revokeObjectURL(pendingImageSrc);
      }
      setPendingImageSrc(objectUrl);
      setCropModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "File gambar tidak valid.";
      toast.error("Gagal memuat foto", { description: msg });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmCrop = async (transform: ImageCropTransform) => {
    if (!pendingImageSrc) return;

    try {
      setIsUploading(true);
      const { base64Data, contentType } = await cropAndCompressImage(pendingImageSrc, transform);
      const uploadedUrl = await uploadBase64ImageToStorage(base64Data, contentType, folder);

      if (lastOriginalSrc?.startsWith("blob:") && lastOriginalSrc !== pendingImageSrc) {
        URL.revokeObjectURL(lastOriginalSrc);
      }
      setLastOriginalSrc(pendingImageSrc);
      onChange(uploadedUrl);
      setCropModalOpen(false);
      toast.success("Foto berhasil disesuaikan dan diunggah");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah foto.";
      toast.error("Gagal upload foto", { description: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseCropModal = () => {
    if (isUploading) return;
    setCropModalOpen(false);
    if (pendingImageSrc?.startsWith("blob:") && pendingImageSrc !== lastOriginalSrc) {
      URL.revokeObjectURL(pendingImageSrc);
      setPendingImageSrc(null);
    }
  };

  const handleOpenCrop = async () => {
    if (disabled || isUploading) return;
    if (lastOriginalSrc) {
      setPendingImageSrc(lastOriginalSrc);
      setCropModalOpen(true);
      return;
    }
    if (value) {
      const resolved = resolveStorageUrl(value);
      if (!resolved) return;
      try {
        setIsUploading(true);
        const res = await fetch(resolved);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          setPendingImageSrc(blobUrl);
          setCropModalOpen(true);
          return;
        }
      } catch {
        // Fallback to resolved URL directly
      } finally {
        setIsUploading(false);
      }
      setPendingImageSrc(resolved);
      setCropModalOpen(true);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (lastOriginalSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(lastOriginalSrc);
    }
    setLastOriginalSrc(null);
    setPendingImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs font-semibold text-foreground">{label}</span>}

      <div className="flex items-center gap-4">
        {/* Avatar Preview with Hover Overlay */}
        <div className="relative group shrink-0">
          <Avatar name={name || "User"} src={value} size={size} className="ring-2 ring-border/70" />

          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white backdrop-blur-[1px] animate-fade-in">
              <Loader2 className="animate-spin" size={Math.round(size * 0.35)} />
            </div>
          )}

          {!disabled && !isUploading && (
            <button
              type="button"
              onClick={openFilePicker}
              aria-label="Pilih atau ganti foto"
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            >
              <Camera size={Math.round(size * 0.3)} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              disabled={disabled || isUploading}
              onClick={openFilePicker}
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span>{value ? "Ganti Foto" : "Unggah Foto"}</span>
            </Button>

            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                disabled={disabled || isUploading}
                onClick={handleOpenCrop}
              >
                <Crop size={13} />
                <span>Crop / Sesuaikan Foto</span>
              </Button>
            )}

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={disabled || isUploading}
                onClick={handleRemove}
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </Button>
            )}
          </div>

          {helperText && <p className="text-[11px] text-muted-foreground leading-relaxed">{helperText}</p>}
        </div>
      </div>

      {/* Interactive Crop & Adjust Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={pendingImageSrc}
        onClose={handleCloseCropModal}
        onConfirm={handleConfirmCrop}
        onSelectAnotherFile={openFilePicker}
        isSubmitting={isUploading}
        defaultShape={folder === "athletes" ? "square" : "circle"}
        title={folder === "athletes" ? "Sesuaikan & Potong Foto Atlet" : "Sesuaikan & Potong Foto Profil"}
      />
    </div>
  );
});
