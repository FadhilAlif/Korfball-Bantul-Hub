import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/shared/stores/authStore";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

describe("BottomNav", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Rukmi",
        email: "rukmi@korfballbantul.id",
        roles: ["athlete"],
        permissions: ["sessions:read", "attendance:self", "matches:read"],
        athlete: null,
      },
      isAuthenticated: true,
    });
  });

  it("filters navigation items based on user permissions", () => {
    render(<BottomNav />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Presensi")).toBeInTheDocument();
    expect(screen.getByText("Kehadiran")).toBeInTheDocument();
    expect(screen.getByText("Match")).toBeInTheDocument();
    // Missing athletes:read permission -> Atlet should not be rendered
    expect(screen.queryByText("Atlet")).not.toBeInTheDocument();
  });

  it("renders Menu trigger when onOpenMenu is provided and caps items to 5 total", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Coach",
        email: "coach@korfballbantul.id",
        roles: ["coach"],
        permissions: ["sessions:read", "attendance:self", "matches:read", "athletes:read"],
        athlete: null,
      },
      isAuthenticated: true,
    });

    const onOpenMenu = vi.fn();
    render(<BottomNav onOpenMenu={onOpenMenu} />);

    const menuBtn = screen.getByRole("button", { name: /menu/i });
    expect(menuBtn).toBeInTheDocument();
    fireEvent.click(menuBtn);
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
  });
});
