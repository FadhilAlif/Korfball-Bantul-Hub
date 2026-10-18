import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPad } from "./ActionPad";

describe("ActionPad", () => {
  it("renders all major Korfball action buttons and triggers appropriate callbacks", () => {
    const onActionClick = vi.fn();
    const onTeamTurnover = vi.fn();
    const onTeamTimeout = vi.fn();

    render(
      <ActionPad
        hasSelectedPlayer={true}
        selectedAction={null}
        onActionClick={onActionClick}
        onTeamTurnover={onTeamTurnover}
        onTeamTimeout={onTeamTimeout}
      />,
    );

    // Verify Shot Made
    const smButton = screen.getByText("SM (+1)");
    fireEvent.click(smButton);
    expect(onActionClick).toHaveBeenCalledWith("SHOT_MADE");

    // Verify Rebound Def
    const drButton = screen.getByText("DR");
    fireEvent.click(drButton);
    expect(onActionClick).toHaveBeenCalledWith("REBOUND_DEF");

    // Verify Turnover
    const tovButton = screen.getByText("TOV");
    fireEvent.click(tovButton);
    expect(onActionClick).toHaveBeenCalledWith("TURNOVER_PERSONAL");

    // Verify Team Turnover
    const tovtButton = screen.getByText("Team Turnover (TOVT)");
    fireEvent.click(tovtButton);
    expect(onTeamTurnover).toHaveBeenCalled();

    // Verify Team Timeout
    const toButton = screen.getByText("Time-out Tim");
    fireEvent.click(toButton);
    expect(onTeamTimeout).toHaveBeenCalled();
  });
});
