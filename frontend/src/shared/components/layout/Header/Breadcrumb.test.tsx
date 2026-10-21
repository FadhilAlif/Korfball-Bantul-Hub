import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb } from "./Breadcrumb";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("Breadcrumb", () => {
  it("shows Dashboard label for /dashboard", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<Breadcrumb />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows Users label for /users", () => {
    vi.mocked(usePathname).mockReturnValue("/users");
    render(<Breadcrumb />);
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("shows Audit Logs label for /audit-logs", () => {
    vi.mocked(usePathname).mockReturnValue("/audit-logs");
    render(<Breadcrumb />);
    expect(screen.getByText("Audit Logs")).toBeInTheDocument();
  });

  it("shows fallback — for unknown route", () => {
    vi.mocked(usePathname).mockReturnValue("/unknown-page");
    render(<Breadcrumb />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("does not render static 'RBAC' prefix", () => {
    vi.mocked(usePathname).mockReturnValue("/matches/9/report");
    render(<Breadcrumb />);
    expect(screen.queryByText("RBAC")).not.toBeInTheDocument();
    expect(screen.getByText("Pertandingan")).toBeInTheDocument();
    expect(screen.getByText("Detail Pertandingan")).toBeInTheDocument();
    expect(screen.getByText("Laporan Pertandingan")).toBeInTheDocument();
  });

  it("renders hierarchical trail for /stats/me", () => {
    vi.mocked(usePathname).mockReturnValue("/stats/me");
    render(<Breadcrumb />);
    expect(screen.getByText("Statistik")).toBeInTheDocument();
    expect(screen.getByText("Statistik Saya")).toBeInTheDocument();
  });

  it("renders hierarchical trail for /roles", () => {
    vi.mocked(usePathname).mockReturnValue("/roles");
    render(<Breadcrumb />);
    expect(screen.getByText("Access Control")).toBeInTheDocument();
    expect(screen.getByText("Roles")).toBeInTheDocument();
  });
});
