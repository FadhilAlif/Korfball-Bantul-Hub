"use client";

import type * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "@/shared/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  bodyClassName?: string;
  overlayClassName?: string;
}

const maxWidthClass = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
  "2xl": "sm:max-w-4xl",
  "3xl": "sm:max-w-5xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  className,
  bodyClassName,
  overlayClassName,
}: ModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        overlayClassName={overlayClassName}
        className={cn(maxWidthClass[maxWidth], "max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden", className)}
      >
        <DialogHeader className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-border shrink-0 pr-12 text-left">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className={cn("px-5 sm:px-6 py-4 overflow-y-auto overscroll-contain flex-1", bodyClassName)}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
