import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const config = require("../next.config.js");

describe("legacy production hostname", () => {
  it("permanently redirects every legacy-host path without matching preview hosts", async () => {
    const redirects = await config.redirects();
    expect(redirects[0]).toEqual({
      source: "/:path*",
      has: [{ type: "host", value: "adropofseoul.vercel.app" }],
      destination: "https://adropofseoul.com/:path*",
      permanent: true,
    });
    expect(
      redirects.some(
        (r: { source: string; destination: string }) =>
          r.source === "/articles" && r.destination === "/stories"
      )
    ).toBe(true);
  });
});
