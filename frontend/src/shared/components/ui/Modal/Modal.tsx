"use client";

import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/shared/components/ui";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  bodyClassName?: string;
}

const maxWidthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-4xl",
  "3xl": "max-w-5xl",
};

export function Modal({ isOpen, onClose, title, children, maxWidth = "md", className, bodyClassName }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop uses click-to-close; keyboard handled via document keydown in useEffect
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${maxWidthClass[maxWidth]} max-h-[92vh] flex flex-col rounded-xl bg-card border border-border shadow-2xl overflow-hidden ${className ?? ""}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-card">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">{title}</h2>
          <Button
            variant="ghost"
            size="iconOnly"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg text-muted-foreground hover:text-foreground h-8 w-8"
          >
            ✕
          </Button>
        </div>
        <div className={`px-5 sm:px-6 py-4 overflow-y-auto overscroll-contain flex-1 ${bodyClassName ?? ""}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
