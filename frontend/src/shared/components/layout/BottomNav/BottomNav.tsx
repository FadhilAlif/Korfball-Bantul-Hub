"use client";

import { CalendarCheck2, ClipboardCheck, LayoutDashboard, Menu, Trophy, UserCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, type ReactNode } from "react";
import { useAuthStore } from "@/shared/stores/authStore";

export interface BottomNavItemDef {
  href: string;
  label: string;
  icon: ReactNode;
  permission: string | null;
}

export const BOTTOM_NAV_ITEMS: BottomNavItemDef[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} />, permission: null },
  { href: "/sessions", label: "Presensi", icon: <CalendarCheck2 size={19} />, permission: "sessions:read" },
  {
    href: "/attendance/me",
    label: "Kehadiran",
    icon: <ClipboardCheck size={19} />,
    permission: "attendance:self",
  },
  { href: "/matches", label: "Match", icon: <Trophy size={19} />, permission: "matches:read" },
  { href: "/athletes", label: "Atlet", icon: <UserCheck size={19} />, permission: "athletes:read" },
];

interface BottomNavProps {
  onOpenMenu?: () => void;
}

export const BottomNav = memo(function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname();
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  const visibleItems = BOTTOM_NAV_ITEMS.filter(
    (item) => item.permission === null || permissions.includes(item.permission),
  ).slice(0, onOpenMenu ? 4 : 5);

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xs md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate max-w-[68px]">{item.label}</span>
            </Link>
          );
        })}

        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Menu size={19} />
            <span className="truncate max-w-[68px]">Menu</span>
          </button>
        )}
      </div>
    </nav>
  );
});
