import { apiClient } from "./api-client";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

export interface ImageCropTransform {
  /** Horizontal pan offset in viewport pixels */
  dx: number;
  /** Vertical pan offset in viewport pixels */
  dy: number;
  /** Zoom multiplier (1.0 to 3.0) */
  zoom: number;
  /** Rotation angle in degrees (0, 90, 180, 270) */
  rotation: number;
  /** Side length of the square crop viewport in CSS pixels */
  viewportSize: number;
}

/**
 * Resolves a stored media URL (such as `/api/storage/view/avatars/...` or an absolute URL)
 * so that it works seamlessly in both Next.js rewrite mode (`/api`) and direct cross-origin mode (`http://localhost:3001/api`).
 */
export function resolveStorageUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }
  if (src.startsWith("/api/")) {
    return `${API_BASE}${src.slice(4)}`;
  }
  if (src.startsWith("/")) {
    return `${API_BASE}${src}`;
  }
  return src;
}

/**
 * Validates that a selected File is a supported image within the size limit.
 */
export function validateImageFile(file: File, maxBytes = 8 * 1024 * 1024): void {
  if (!file.type.startsWith("image/")) {
    throw new Error("File yang dipilih harus berupa gambar (JPG, PNG, atau WebP).");
  }
  if (file.size > maxBytes) {
    throw new Error("Ukuran file gambar maksimal 8 MB.");
  }
}

/**
 * Crops and compresses an image according to interactive pan, zoom, and rotation parameters
 * into a crisp square (max 512x512) WebP/JPEG data URL.
 */
export async function cropAndCompressImage(
  imageSrc: string,
  transform: ImageCropTransform,
  maxDimension = 512,
  quality = 0.88,
): Promise<{ base64Data: string; contentType: "image/webp" | "image/jpeg" }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("Gagal memuat gambar untuk pemotongan."));
    img.onload = () => {
      const W = img.naturalWidth || img.width;
      const H = img.naturalHeight || img.height;
      const normRot = ((transform.rotation % 360) + 360) % 360;
      const isRotated90 = normRot === 90 || normRot === 270;
      const rotW = isRotated90 ? H : W;
      const rotH = isRotated90 ? W : H;

      const V = transform.viewportSize > 0 ? transform.viewportSize : 280;
      const baseScale = V / Math.min(rotW, rotH);
      const S = baseScale * Math.max(1, transform.zoom);

      const targetSize = maxDimension;
      const R = targetSize / V;

      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Gagal menginisialisasi canvas gambar."));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.save();
      ctx.translate(targetSize / 2 + transform.dx * R, targetSize / 2 + transform.dy * R);
      ctx.rotate((normRot * Math.PI) / 180);
      ctx.scale(S * R, S * R);
      ctx.drawImage(img, -W / 2, -H / 2, W, H);
      ctx.restore();

      let dataUrl = canvas.toDataURL("image/webp", quality);
      let contentType: "image/webp" | "image/jpeg" = "image/webp";

      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
        contentType = "image/jpeg";
      }

      resolve({ base64Data: dataUrl, contentType });
    };
    img.src = imageSrc;
  });
}

/**
 * Compresses and center-crops an image file to a square (max 512x512) WebP/JPEG data URL on the client
 * for fast, crisp avatar uploads.
 */
export async function compressAvatarImage(
  file: File,
  maxDimension = 512,
  quality = 0.86,
): Promise<{ base64Data: string; contentType: "image/webp" | "image/jpeg" }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      cropAndCompressImage(
        reader.result as string,
        { dx: 0, dy: 0, zoom: 1, rotation: 0, viewportSize: 280 },
        maxDimension,
        quality,
      )
        .then(resolve)
        .catch(reject);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads pre-processed base64 image data to Neon Object Storage via `POST /api/storage/upload`
 * and returns the stored relative URL (`/api/storage/view/<folder>/<filename>`).
 */
export async function uploadBase64ImageToStorage(
  base64Data: string,
  contentType: "image/webp" | "image/jpeg",
  folder: "avatars" | "athletes" = "avatars",
): Promise<string> {
  const res = await apiClient.post("/storage/upload", {
    folder,
    contentType,
    base64Data,
  });

  return res.data.data.url as string;
}

/**
 * Uploads an image file to Neon Object Storage via `POST /api/storage/upload`
 * and returns the stored relative URL (`/api/storage/view/<folder>/<filename>`).
 */
export async function uploadImageToStorage(file: File, folder: "avatars" | "athletes" = "avatars"): Promise<string> {
  validateImageFile(file);

  const { base64Data, contentType } = await compressAvatarImage(file);
  return uploadBase64ImageToStorage(base64Data, contentType, folder);
}
