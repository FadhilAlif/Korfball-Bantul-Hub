"use client";

import { usePathname } from "next/navigation";
import { ROUTE_LABELS } from "./Breadcrumb.constants";

export function useBreadcrumb(): string {
  const pathname = usePathname();
  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname];
  }
  if (pathname.startsWith("/sessions/")) {
    return pathname.endsWith("/attendance") ? "Lembar Presensi" : "Detail Sesi";
  }
  if (pathname.startsWith("/matches/")) {
    if (pathname.endsWith("/record")) return "Live Recorder";
    if (pathname.endsWith("/box-score")) return "Box Score";
    if (pathname.endsWith("/report")) return "Laporan Pertandingan";
    return "Detail Pertandingan";
  }
  return "—";
}
