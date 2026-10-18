import {
  BarChart3,
  CalendarCheck2,
  ClipboardCheck,
  FileText,
  Key,
  LayoutDashboard,
  Megaphone,
  Shield,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import type { NavEntry } from "./Sidebar.types";

export const NAV_CONFIG: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, permission: null },
  {
    href: "/sessions",
    label: "Sesi & Presensi",
    icon: <CalendarCheck2 size={18} />,
    permission: "sessions:read",
  },
  {
    href: "/attendance/me",
    label: "Kehadiran Saya",
    icon: <ClipboardCheck size={18} />,
    permission: "attendance:self",
  },
  {
    href: "/attendance/summary",
    label: "Rekap Presensi",
    icon: <BarChart3 size={18} />,
    permission: "attendance:export",
  },
  {
    href: "/matches",
    label: "Pertandingan",
    icon: <Trophy size={18} />,
    permission: "matches:read",
  },
  {
    href: "/stats",
    label: "Statistik",
    icon: <BarChart3 size={18} />,
    permission: "stats:read",
  },
  {
    href: "/stats/me",
    label: "Statistik Saya",
    icon: <BarChart3 size={18} />,
    permission: "stats:read_own",
  },
  {
    href: "/athletes",
    label: "Atlet",
    icon: <UserCheck size={18} />,
    permission: "athletes:read",
  },
  {
    href: "/teams",
    label: "Tim",
    icon: <UsersRound size={18} />,
    permission: "teams:read",
  },
  { href: "/users", label: "Users", icon: <Users size={18} />, permission: "users:read" },
  {
    label: "Access Control",
    icon: <Shield size={18} />,
    permissions: ["roles:read", "permissions:read"],
    children: [
      { href: "/roles", label: "Roles", icon: <ShieldCheck size={18} />, permission: "roles:read" },
      { href: "/permissions", label: "Permissions", icon: <Key size={18} />, permission: "permissions:read" },
    ],
  },
  {
    href: "/notifications/broadcast",
    label: "Broadcast",
    icon: <Megaphone size={18} />,
    permission: "notifications:create",
  },
  { href: "/audit-logs", label: "Audit Logs", icon: <FileText size={18} />, permission: "audit_logs:read" },
];
