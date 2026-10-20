"use client";

import { FloatingPortal, type Placement } from "@floating-ui/react";
import type { ReactNode } from "react";
import { useDropdown } from "./useDropdown";

interface DropdownProps {
  /** Elemen pemicu — bisa ReactNode atau fungsi (open: boolean) => ReactNode */
  trigger: ReactNode | ((open: boolean) => ReactNode);
  /** Konten dropdown yang akan ditampilkan — bisa ReactNode atau fungsi ({ close, open }: { close: () => void; open: boolean }) => ReactNode */
  children: ReactNode | ((helpers: { close: () => void; open: boolean }) => ReactNode);
  /** Posisi dropdown relatif terhadap trigger */
  placement?: Placement;
  /** Jarak antara trigger dan dropdown dalam piksel */
  offsetPx?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Komponen Dropdown generik menggunakan @floating-ui/react.
 * Mendukung keyboard navigation, dismissal otomatis, dan portal rendering.
 */
export function Dropdown({
  trigger,
  children,
  placement = "bottom-end",
  offsetPx = 6,
  open: controlledOpen,
  onOpenChange,
}: DropdownProps) {
  const { open, setOpen, refs, floatingStyles, getReferenceProps, getFloatingProps } = useDropdown({
    placement,
    offsetPx,
    open: controlledOpen,
    onOpenChange,
  });

  const close = () => setOpen(false);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} className="inline-flex">
        {typeof trigger === "function" ? trigger(open) : trigger}
      </div>
      {open && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()} className="z-50">
            {typeof children === "function" ? children({ close, open }) : children}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
