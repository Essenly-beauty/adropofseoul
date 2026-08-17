import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MySeoulDropLink } from "./MySeoulDropLink";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({ outboundLinkClicked: track }));

describe("MySeoulDropLink", () => {
  beforeEach(() => track.mockClear());

  it("opens the official service with placement attribution", () => {
    render(
      <MySeoulDropLink source="home_hero">Open My Seoul Drop</MySeoulDropLink>
    );
    const link = screen.getByRole("link", { name: "Open My Seoul Drop" });
    const url = new URL(link.getAttribute("href") ?? "");
    expect(url.origin).toBe("https://myseouldrop.app");
    expect(url.searchParams.get("utm_content")).toBe("home_hero");
    expect(link.getAttribute("rel")).toContain("noopener");

    fireEvent.click(link);
    expect(track).toHaveBeenCalledWith({
      destinationHost: "myseouldrop.app",
      sourcePath: "home_hero",
    });
  });
});
