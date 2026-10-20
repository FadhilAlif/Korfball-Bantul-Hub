"use client";

import { usePathname } from "next/navigation";
import { type BreadcrumbSegment, ROUTE_LABELS } from "./Breadcrumb.constants";

export function getBreadcrumbsForPath(pathname: string): BreadcrumbSegment[] {
  // Direct top-level single-item mappings
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];
  if (pathname === "/teams") return [{ label: "Tim" }];
  if (pathname === "/athletes") return [{ label: "Atlet" }];
  if (pathname === "/users") return [{ label: "Users" }];
  if (pathname === "/audit-logs") return [{ label: "Audit Logs" }];
  if (pathname === "/profile") return [{ label: "Profile" }];

  // Access Control mappings
  if (pathname === "/roles") {
    return [{ label: "Access Control" }, { label: "Roles" }];
  }
  if (pathname === "/permissions") {
    return [{ label: "Access Control" }, { label: "Permissions" }];
  }

  // Notifications mapping
  if (pathname === "/notifications/broadcast") {
    return [{ label: "Notifikasi" }, { label: "Broadcast" }];
  }

  // Attendance mappings
  if (pathname === "/attendance/me") {
    return [{ label: "Sesi & Presensi", href: "/sessions" }, { label: "Kehadiran Saya" }];
  }
  if (pathname === "/attendance/summary") {
    return [{ label: "Sesi & Presensi", href: "/sessions" }, { label: "Rekap Presensi" }];
  }

  // Sessions hierarchy
  if (pathname === "/sessions") {
    return [{ label: "Sesi & Presensi" }];
  }
  if (pathname.startsWith("/sessions/")) {
    const parts = pathname.split("/").filter(Boolean);
    const sessionId = parts[1];
    if (parts.length >= 3 && parts[2] === "attendance") {
      return [
        { label: "Sesi & Presensi", href: "/sessions" },
        { label: "Detail Sesi", href: `/sessions/${sessionId}` },
        { label: "Lembar Presensi" },
      ];
    }
    return [{ label: "Sesi & Presensi", href: "/sessions" }, { label: "Detail Sesi" }];
  }

  // Matches hierarchy
  if (pathname === "/matches") {
    return [{ label: "Pertandingan" }];
  }
  if (pathname === "/matches/new") {
    return [{ label: "Pertandingan", href: "/matches" }, { label: "Buat Pertandingan" }];
  }
  if (pathname.startsWith("/matches/")) {
    const parts = pathname.split("/").filter(Boolean);
    const matchId = parts[1];
    const subAction = parts[2];

    const matchSegments: BreadcrumbSegment[] = [{ label: "Pertandingan", href: "/matches" }];

    if (!subAction) {
      matchSegments.push({ label: "Detail Pertandingan" });
      return matchSegments;
    }

    matchSegments.push({ label: "Detail Pertandingan", href: `/matches/${matchId}` });

    if (subAction === "box-score") {
      matchSegments.push({ label: "Box Score" });
    } else if (subAction === "record") {
      matchSegments.push({ label: "Live Recorder" });
    } else if (subAction === "report") {
      matchSegments.push({ label: "Laporan Pertandingan" });
    } else if (subAction === "edit") {
      matchSegments.push({ label: "Edit Pertandingan" });
    } else {
      matchSegments.push({ label: subAction });
    }

    return matchSegments;
  }

  // Statistics hierarchy
  if (pathname === "/stats") {
    return [{ label: "Statistik" }];
  }
  if (pathname === "/stats/me") {
    return [{ label: "Statistik", href: "/stats" }, { label: "Statistik Saya" }];
  }
  if (pathname.startsWith("/stats/players/")) {
    return [{ label: "Statistik", href: "/stats" }, { label: "Profil Pemain" }];
  }

  // Fallback for any other static route
  if (ROUTE_LABELS[pathname]) {
    return [{ label: ROUTE_LABELS[pathname] }];
  }

  return [{ label: "—" }];
}

export function useBreadcrumbs(): BreadcrumbSegment[] {
  const pathname = usePathname();
  return getBreadcrumbsForPath(pathname);
}

export function useBreadcrumb(): string {
  const items = useBreadcrumbs();
  return items[items.length - 1]?.label ?? "—";
}
