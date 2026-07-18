import { describe, it, expect, vi } from "vitest";
import { livenessFromStatus, checkUrlLiveness } from "./verify-sources";

describe("livenessFromStatus", () => {
  it("treats 404/410 as dead", () => {
    expect(livenessFromStatus(404)).toBe("dead");
    expect(livenessFromStatus(410)).toBe("dead");
  });
  it("treats 2xx/3xx as alive", () => {
    expect(livenessFromStatus(200)).toBe("alive");
    expect(livenessFromStatus(301)).toBe("alive");
  });
  it("treats bot-blocking / rate-limit / server errors as unknown (kept)", () => {
    expect(livenessFromStatus(403)).toBe("unknown");
    expect(livenessFromStatus(429)).toBe("unknown");
    expect(livenessFromStatus(500)).toBe("unknown");
  });
});

describe("checkUrlLiveness", () => {
  it("reports dead on a 404 response", async () => {
    const f = vi.fn().mockResolvedValue({ status: 404 });
    expect(await checkUrlLiveness("https://x.example/gone", f as never)).toBe(
      "dead"
    );
  });
  it("reports alive on a 200 response", async () => {
    const f = vi.fn().mockResolvedValue({ status: 200 });
    expect(await checkUrlLiveness("https://x.example/ok", f as never)).toBe(
      "alive"
    );
  });
  it("reports unknown when the fetch throws (timeout/DNS)", async () => {
    const f = vi.fn().mockRejectedValue(new Error("timeout"));
    expect(await checkUrlLiveness("https://x.example", f as never)).toBe(
      "unknown"
    );
  });
});
