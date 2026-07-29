import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HairProfileResult } from "./HairProfileResult";
import { getHairProfile } from "@/lib/haircare/profiles";
import type { HairResultExplanation } from "@/lib/haircare/explain";

const profile = getHairProfile("hidden-wave")!;

const explanation: HairResultExplanation = {
  tags: ["Loose wave", "Fine strands"],
  reasons: ["Waves or curls become more visible", "Forms loose S-shaped bends"],
  advisory: false,
};

describe("HairProfileResult", () => {
  it("leads with the profile identity and summary", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(
      screen.getByRole("heading", { level: 1, name: profile.name })
    ).toBeTruthy();
    expect(screen.getByText(profile.tagline)).toBeTruthy();
  });

  it("shows the snapshot tags and the why-this-result reasons", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    for (const tag of explanation.tags)
      expect(screen.getByText(tag)).toBeTruthy();
    for (const reason of explanation.reasons)
      expect(screen.getByText(reason)).toBeTruthy();
  });

  it("renders the guidance panels and all four routine steps", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(screen.getByText(profile.care[0])).toBeTruthy();
    expect(screen.getByText(profile.lookFor[0])).toBeTruthy();
    expect(screen.getByText(profile.useCarefully[0])).toBeTruthy();
    for (const s of profile.routine) {
      expect(screen.getByText(s.step)).toBeTruthy();
      expect(screen.getByText(s.detail)).toBeTruthy();
    }
  });

  it("links to the profile's full guide and offers a retake", () => {
    const onRetake = vi.fn();
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={onRetake}
      />
    );
    const link = screen.getByRole("link", { name: /read the full guide/i });
    expect(link.getAttribute("href")).toBe("/haircare/profiles/hidden-wave");
    fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("always carries the educational limitation note", () => {
    render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(screen.getByText(/not a medical diagnosis/i)).toBeTruthy();
  });

  it("shows the professional-evaluation advisory only when raised", () => {
    const { unmount } = render(
      <HairProfileResult
        profile={profile}
        explanation={explanation}
        onRetake={vi.fn()}
      />
    );
    expect(screen.queryByRole("note")).toBe(null);
    unmount();

    render(
      <HairProfileResult
        profile={profile}
        explanation={{ ...explanation, advisory: true }}
        onRetake={vi.fn()}
      />
    );
    // Scoped to the note: the standing limitation note also mentions
    // professional evaluation, so a document-wide match would be ambiguous.
    expect(screen.getByRole("note").textContent).toMatch(
      /consider a professional evaluation/i
    );
  });

  it("falls back to the chooser when there is not enough signal", () => {
    render(
      <HairProfileResult
        profile={null}
        explanation={{ tags: [], reasons: [], advisory: false }}
        onRetake={vi.fn()}
      />
    );
    expect(screen.getByText(/not enough to place you/i)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /browse the profiles/i })
        .getAttribute("href")
    ).toBe("/beauty-profile/hair");
    expect(screen.getByRole("button", { name: /retake/i })).toBeTruthy();
  });
});
