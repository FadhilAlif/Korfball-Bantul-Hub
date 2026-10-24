import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchPlayerItem } from "../../matches/types";
import { AssistSheet } from "./AssistSheet";

const mockPlayers: MatchPlayerItem[] = [
  {
    id: 1,
    matchId: 10,
    athleteId: 101,
    athleteName: "Bagas Adi",
    athleteNickname: "Bagas",
    jerseyNumber: 2,
    sex: "MALE",
    side: "HOME",
    isStarter: true,
    isOnCourt: true,
  },
  {
    id: 2,
    matchId: 10,
    athleteId: 102,
    athleteName: "Dimas Wahyu",
    athleteNickname: "Dimas",
    jerseyNumber: 5,
    sex: "MALE",
    side: "HOME",
    isStarter: true,
    isOnCourt: true,
  },
  {
    id: 3,
    matchId: 10,
    athleteId: 103,
    athleteName: "Alifa Nur",
    athleteNickname: "Alifa",
    jerseyNumber: 8,
    sex: "FEMALE",
    side: "HOME",
    isStarter: true,
    isOnCourt: false, // On bench, not eligible
  },
  {
    id: 4,
    matchId: 10,
    athleteId: 104,
    athleteName: "Dinda Ayu",
    athleteNickname: "Dinda",
    jerseyNumber: 15,
    sex: "FEMALE",
    side: "HOME",
    isStarter: true,
    isOnCourt: true,
  },
];

describe("AssistSheet", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders eligible on-court teammates excluding the scorer and bench players", () => {
    const handleSelectAssist = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <AssistSheet
        goalEventId="goal-123"
        side="HOME"
        scorerPlayerId={1} // Bagas is scorer
        players={mockPlayers}
        onSelectAssist={handleSelectAssist}
        onDismiss={handleDismiss}
      />,
    );

    // Dimas (#5) and Dinda (#15) should be visible as assist candidates
    expect(screen.getByText("Dimas")).toBeInTheDocument();
    expect(screen.getByText("Dinda")).toBeInTheDocument();

    // Bagas (scorer) and Alifa (bench) should not be options
    expect(screen.queryByRole("button", { name: /#2 Bagas/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Alifa")).not.toBeInTheDocument();
  });

  it("decrements timer and auto-closes when 6 seconds expire", () => {
    const handleSelectAssist = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <AssistSheet
        goalEventId="goal-123"
        side="HOME"
        scorerPlayerId={1}
        players={mockPlayers}
        onSelectAssist={handleSelectAssist}
        onDismiss={handleDismiss}
      />,
    );

    expect(screen.getByText(/Auto-close: 6s/i)).toBeInTheDocument();

    // Advance 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/Auto-close: 3s/i)).toBeInTheDocument();
    expect(handleDismiss).not.toHaveBeenCalled();

    // Advance another 3 seconds (reaches 0)
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not freeze or reset countdown timer when parent re-renders with new onDismiss reference", () => {
    const handleSelectAssist = vi.fn();
    const handleDismiss1 = vi.fn();
    const handleDismiss2 = vi.fn();

    const { rerender } = render(
      <AssistSheet
        goalEventId="goal-123"
        side="HOME"
        scorerPlayerId={1}
        players={mockPlayers}
        onSelectAssist={handleSelectAssist}
        onDismiss={handleDismiss1}
      />,
    );

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/Auto-close: 4s/i)).toBeInTheDocument();

    // Re-render with a new onDismiss reference (simulating match clock tick)
    rerender(
      <AssistSheet
        goalEventId="goal-123"
        side="HOME"
        scorerPlayerId={1}
        players={mockPlayers}
        onSelectAssist={handleSelectAssist}
        onDismiss={handleDismiss2}
      />,
    );

    // Should NOT reset back to 6s! Should continue from 4s
    expect(screen.getByText(/Auto-close: 4s/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    // Should call the latest dismiss handler
    expect(handleDismiss2).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectAssist when a teammate button is clicked", () => {
    const handleSelectAssist = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <AssistSheet
        goalEventId="goal-123"
        side="HOME"
        scorerPlayerId={1}
        players={mockPlayers}
        onSelectAssist={handleSelectAssist}
        onDismiss={handleDismiss}
      />,
    );

    const dimasBtn = screen.getByText("Dimas").closest("button");
    expect(dimasBtn).not.toBeNull();
    fireEvent.click(dimasBtn!);

    expect(handleSelectAssist).toHaveBeenCalledWith(2);
  });
});
