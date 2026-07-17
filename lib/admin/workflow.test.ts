import { describe, it, expect } from "vitest";
import { POST_STATUSES, isLive, statusLabel, liveLabel } from "./workflow";

describe("workflow", () => {
  it("lists the current post statuses", () => {
    expect(POST_STATUSES.map((s) => s.value)).toEqual(["draft", "published"]);
  });
  it("treats only 'published' as live", () => {
    expect(isLive("published")).toBe(true);
    expect(isLive("draft")).toBe(false);
  });
  it("labels statuses for display", () => {
    expect(statusLabel("draft")).toBe("Draft");
    expect(statusLabel("published")).toBe("Published");
  });
  it("labels a boolean is_published uniformly", () => {
    expect(liveLabel(true)).toBe("Published");
    expect(liveLabel(false)).toBe("Hidden");
  });
});
