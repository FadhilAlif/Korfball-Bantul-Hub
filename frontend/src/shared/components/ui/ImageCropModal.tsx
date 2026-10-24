"use client";

import { Check, Circle, ImagePlus, Move, RotateCcw, RotateCw, Square, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Modal } from "./modal";
import type { ImageCropTransform } from "@/shared/lib/storage";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (transform: ImageCropTransform) => Promise<void> | void;
  onSelectAnotherFile?: () => void;
  isSubmitting?: boolean;
  defaultShape?: "circle" | "square";
  title?: string;
}

interface Dimensions {
  width: number;
  height: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

function getAspectRatioLabel(width: number, height: number): string {
  if (!width || !height) return "";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const rw = Math.round(width / divisor);
  const rh = Math.round(height / divisor);
  if (rw > 25 || rh > 25) {
    const ratio = (width / height).toFixed(2);
    return `${width}×${height} (${ratio}:1)`;
  }
  return `${width}×${height} (${rw}:${rh})`;
}

export const ImageCropModal = memo(function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  onSelectAnotherFile,
  isSubmitting = false,
  defaultShape = "circle",
  title = "Sesuaikan & Potong Foto",
}: ImageCropModalProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState(280);
  const [naturalSize, setNaturalSize] = useState<Dimensions>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [maskShape, setMaskShape] = useState<"circle" | "square">(defaultShape);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null);

  // Reset state whenever a new image is loaded into the modal
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setMaskShape(defaultShape);
    }
  }, [isOpen, imageSrc, defaultShape]);

  // Measure responsive viewport size
  useEffect(() => {
    if (!isOpen) return;
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setViewportSize(Math.round(rect.width));
      }
    };

    updateSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [isOpen]);

  const clampOffset = useCallback(
    (rawX: number, rawY: number, nextZoom: number, nextRotation: number, imgDim: Dimensions, vpSize: number) => {
      if (!imgDim.width || !imgDim.height || !vpSize) {
        return { x: 0, y: 0 };
      }
      const normRot = ((nextRotation % 360) + 360) % 360;
      const isRotated90 = normRot === 90 || normRot === 270;
      const rotW = isRotated90 ? imgDim.height : imgDim.width;
      const rotH = isRotated90 ? imgDim.width : imgDim.height;

      const baseScale = vpSize / Math.min(rotW, rotH);
      const totalScale = baseScale * Math.max(MIN_ZOOM, nextZoom);

      const dispW = rotW * totalScale;
      const dispH = rotH * totalScale;

      const maxDx = Math.max(0, (dispW - vpSize) / 2);
      const maxDy = Math.max(0, (dispH - vpSize) / 2);

      return {
        x: Math.min(maxDx, Math.max(-maxDx, rawX)),
        y: Math.min(maxDy, Math.max(-maxDy, rawY)),
      };
    },
    [],
  );

  // Re-clamp offsets when zoom, rotation, or viewport changes
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, rotation, naturalSize, viewportSize));
  }, [zoom, rotation, naturalSize, viewportSize, clampOffset]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const dims = {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    };
    setNaturalSize(dims);
    setOffset({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;
    const next = clampOffset(
      dragStartRef.current.startX + deltaX,
      dragStartRef.current.startY + deltaY,
      zoom,
      rotation,
      naturalSize,
      viewportSize,
    );
    setOffset(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isSubmitting) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Number(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)).toFixed(2)));
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    await onConfirm({
      dx: offset.x,
      dy: offset.y,
      zoom,
      rotation,
      viewportSize,
    });
  };

  // Compute live display scale for the preview
  const normRot = ((rotation % 360) + 360) % 360;
  const isRotated90 = normRot === 90 || normRot === 270;
  const rotW = isRotated90 ? naturalSize.height : naturalSize.width;
  const rotH = isRotated90 ? naturalSize.width : naturalSize.height;
  const baseScale = rotW > 0 && rotH > 0 ? viewportSize / Math.min(rotW, rotH) : 1;
  const displayScale = baseScale * zoom;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={title}
      maxWidth="md"
      className="z-[70]"
      overlayClassName="z-[65]"
    >
      <div className="flex flex-col gap-4">
        {/* Top Info & Shape Guide Selector */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Move size={13} className="text-primary shrink-0" />
            <span>Geser foto untuk mengatur posisi</span>
            {naturalSize.width > 0 && (
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                {getAspectRatioLabel(naturalSize.width, naturalSize.height)}
              </span>
            )}
          </div>

          <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => setMaskShape("circle")}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                maskShape === "circle"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Pratinjau Avatar Lingkaran"
            >
              <Circle size={11} />
              <span>Lingkaran</span>
            </button>
            <button
              type="button"
              onClick={() => setMaskShape("square")}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                maskShape === "square"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Pratinjau Kartu Persegi"
            >
              <Square size={11} />
              <span>Persegi</span>
            </button>
          </div>
        </div>

        {/* Interactive Crop Stage */}
        <div className="relative flex items-center justify-center bg-neutral-950/90 rounded-2xl p-4 sm:p-5 overflow-hidden select-none border border-border">
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className={`relative w-full max-w-[260px] sm:max-w-[280px] aspect-square overflow-hidden bg-neutral-900 touch-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${maskShape === "circle" ? "rounded-full" : "rounded-2xl"} ring-2 ring-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]`}
          >
            {imageSrc && (
              // biome-ignore lint/performance/noImgElement: direct DOM image required for exact 2D canvas crop coordinate mapping
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                onLoad={handleImageLoad}
                style={{
                  position: "absolute",
                  left: `calc(50% - ${naturalSize.width / 2}px)`,
                  top: `calc(50% - ${naturalSize.height / 2}px)`,
                  width: naturalSize.width ? `${naturalSize.width}px` : "auto",
                  height: naturalSize.height ? `${naturalSize.height}px` : "auto",
                  maxWidth: "none",
                  transformOrigin: "center center",
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg) scale(${displayScale})`,
                  opacity: naturalSize.width ? 1 : 0,
                }}
                className="pointer-events-none select-none transition-opacity duration-150"
              />
            )}

            {/* Rule-of-Thirds Grid Overlay */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                isDragging ? "opacity-75" : "opacity-25"
              }`}
            >
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-white/40" />
                <div className="border-r border-white/40" />
                <div />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Panel: Zoom & Rotation */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
          {/* Zoom Slider Row */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={zoom <= MIN_ZOOM || isSubmitting}
              onClick={() => setZoom((z) => Number(Math.max(MIN_ZOOM, z - ZOOM_STEP).toFixed(2)))}
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
              aria-label="Perkecil zoom"
            >
              <ZoomOut size={14} />
            </button>

            <div className="flex-1 flex items-center gap-2.5">
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.02}
                value={zoom}
                disabled={isSubmitting}
                onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                aria-label="Tingkat perbesaran foto"
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="font-mono text-xs font-semibold text-foreground w-11 text-right shrink-0">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              disabled={zoom >= MAX_ZOOM || isSubmitting}
              onClick={() => setZoom((z) => Number(Math.min(MAX_ZOOM, z + ZOOM_STEP).toFixed(2)))}
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
              aria-label="Perbesar zoom"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Rotation & Reset Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                disabled={isSubmitting}
                onClick={handleRotateLeft}
              >
                <RotateCcw size={12} />
                <span>-90°</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                disabled={isSubmitting}
                onClick={handleRotateRight}
              >
                <RotateCw size={12} />
                <span>+90°</span>
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
              disabled={isSubmitting || (zoom === 1 && rotation === 0 && offset.x === 0 && offset.y === 0)}
              onClick={handleReset}
            >
              <Undo2 size={12} />
              <span>Reset Posisi</span>
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {onSelectAnotherFile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={isSubmitting}
                onClick={onSelectAnotherFile}
              >
                <ImagePlus size={14} />
                <span>Pilih Foto Lain</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={isSubmitting} onClick={onClose}>
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              isLoading={isSubmitting}
              disabled={!naturalSize.width}
              onClick={handleConfirm}
            >
              <Check size={14} />
              <span>Terapkan & Unggah</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});
