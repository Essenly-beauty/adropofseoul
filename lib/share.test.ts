import { describe, it, expect } from "vitest";
import { withUtm, SHARE_CHANNELS } from "./share";

describe("withUtm", () => {
  it("appends utm params to a bare url", () => {
    expect(withUtm("https://adropofseoul.com/places/soo", "copy")).toBe(
      "https://adropofseoul.com/places/soo?utm_source=share&utm_medium=copy"
    );
  });

  it("preserves existing query params", () => {
    const out = withUtm("https://adropofseoul.com/places?area=seongsu", "x");
    expect(out).toContain("area=seongsu");
    expect(out).toContain("utm_source=share");
    expect(out).toContain("utm_medium=x");
  });
});

describe("SHARE_CHANNELS", () => {
  const url = "https://adropofseoul.com/places/soo";
  const title = "Soo Head Spa — A Drop of Seoul";

  it("lists all 9 channels in priority order", () => {
    expect(SHARE_CHANNELS.map((c) => c.key)).toEqual([
      "whatsapp",
      "pinterest",
      "x",
      "threads",
      "facebook",
      "reddit",
      "line",
      "telegram",
      "email",
    ]);
  });

  it("every channel href carries its own utm_medium", () => {
    for (const c of SHARE_CHANNELS) {
      const href = c.href(url, title);
      expect(decodeURIComponent(href)).toContain(`utm_medium=${c.key}`);
    }
  });

  it("points each channel at the right endpoint", () => {
    const hrefs = Object.fromEntries(
      SHARE_CHANNELS.map((c) => [c.key, c.href(url, title)])
    );
    expect(hrefs.whatsapp).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(hrefs.pinterest).toMatch(
      /^https:\/\/www\.pinterest\.com\/pin\/create\/button\/\?url=/
    );
    expect(hrefs.x).toMatch(/^https:\/\/twitter\.com\/intent\/tweet\?/);
    expect(hrefs.threads).toMatch(
      /^https:\/\/www\.threads\.net\/intent\/post\?text=/
    );
    expect(hrefs.facebook).toMatch(
      /^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=/
    );
    expect(hrefs.reddit).toMatch(/^https:\/\/www\.reddit\.com\/submit\?url=/);
    expect(hrefs.line).toMatch(
      /^https:\/\/social-plugins\.line\.me\/lineit\/share\?url=/
    );
    expect(hrefs.telegram).toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    expect(hrefs.email).toMatch(/^mailto:\?subject=/);
  });

  it("encodes the title into text-bearing channels", () => {
    const x = SHARE_CHANNELS.find((c) => c.key === "x")!;
    expect(x.href(url, title)).toContain(encodeURIComponent(title));
  });

  it("pinterest includes media only when imageUrl is given", () => {
    const pin = SHARE_CHANNELS.find((c) => c.key === "pinterest")!;
    expect(pin.href(url, title)).not.toContain("media=");
    expect(pin.href(url, title, "https://img.example/a.jpg")).toContain(
      `media=${encodeURIComponent("https://img.example/a.jpg")}`
    );
  });
});
