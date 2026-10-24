"use client";

import type { ReactNode } from "react";
import { useNotificationSSE } from "@/features/notifications/hooks";
import { BottomNav } from "../BottomNav";
import { Header } from "../Header";
import { Sidebar } from "../Sidebar";
import { useSidebar } from "./useSidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { collapsed, mobileOpen, toggleCollapsed, openMobile, closeMobile } = useSidebar();
  useNotificationSSE();

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:block">
      {/* Desktop sidebar */}
      <div className="hidden md:flex print:hidden">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 animate-fade-in md:hidden print:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={closeMobile} aria-hidden="true" />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] animate-slide-left">
            <Sidebar onMobileClose={closeMobile} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0 print:block print:overflow-visible print:h-auto">
        <div className="print:hidden">
          <Header onToggleSidebar={toggleCollapsed} onOpenMobileNav={openMobile} />
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full p-4 pb-22 md:p-6 md:pb-6 print:p-0 print:m-0 print:overflow-visible print:block print:h-auto">
          {children}
        </main>
        <div className="print:hidden">
          <BottomNav onOpenMenu={openMobile} />
        </div>
      </div>
    </div>
  );
}
