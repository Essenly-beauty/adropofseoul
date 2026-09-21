import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlannerPreview } from "./PlannerPreview";

describe("PlannerPreview", () => {
  it("explains the companion before exposing its external destination and restores focus on Escape", () => {
    render(<PlannerPreview onNavigate={vi.fn()} onOpen={vi.fn()} />);
    expect(screen.queryByRole("link")).toBeNull();
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    expect(
      screen.getByText(
        "Find Seoul places and beauty experiences to suit your interests"
      )
    ).toBeTruthy();
    const link = screen.getByRole("link", { name: /Explore My Seoul Drop/ });
    expect(new URL(link.getAttribute("href")!).hostname).toBe(
      "myseouldrop.app"
    );
    expect(link.getAttribute("target")).toBe("_blank");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it("dismisses on an outside interaction", () => {
    render(<PlannerPreview onNavigate={vi.fn()} onOpen={vi.fn()} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe(
      "false"
    );
  });
});
