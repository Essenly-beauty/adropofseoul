import { describe, it, expect } from "vitest";
import { POST_STATUSES, isLive, statusLabel, liveLabel } from "./workflow";

describe("workflow", () => {
  it("lists the current post statuses", () => {
    expect(POST_STATUSES.map((s) => s.value)).toEqual([
      "draft",
      "research",
      "ai_review",
      "ready",
      "published",
      "archived",
    ]);
  });
  it("treats only 'published' as live", () => {
    expect(isLive("published")).toBe(true);
    expect(isLive("draft")).toBe(false);
    expect(isLive("research")).toBe(false);
    expect(isLive("ai_review")).toBe(false);
    expect(isLive("ready")).toBe(false);
    expect(isLive("archived")).toBe(false);
  });
  it("labels statuses for display", () => {
    expect(statusLabel("draft")).toBe("Draft");
    expect(statusLabel("published")).toBe("Published");
    expect(statusLabel("research")).toBe("Research");
    expect(statusLabel("ai_review")).toBe("AI Review");
    expect(statusLabel("ready")).toBe("Ready");
    expect(statusLabel("archived")).toBe("Archived");
  });
  it("labels a boolean is_published uniformly", () => {
    expect(liveLabel(true)).toBe("Published");
    expect(liveLabel(false)).toBe("Hidden");
  });
});
