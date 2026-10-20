"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isNavItemActive } from "./isNavItemActive";
import type { NavItemDef } from "./Sidebar.types";

interface UseNavGroupReturn {
  isOpen: boolean;
  isActiveParent: boolean;
  toggle: () => void;
}

export function useNavGroup(items: NavItemDef[]): UseNavGroupReturn {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActiveParent = items.some((item) => isNavItemActive(item.href, pathname));

  useEffect(() => {
    if (isActiveParent) setIsOpen(true);
  }, [isActiveParent]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, isActiveParent, toggle };
}
