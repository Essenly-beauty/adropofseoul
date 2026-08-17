import { afterEach, describe, expect, it } from "vitest";
import { mySeoulDropUrl } from "./my-seoul-drop";

const originalUrl = process.env.NEXT_PUBLIC_MY_SEOUL_DROP_URL;

afterEach(() => {
  if (originalUrl === undefined)
    delete process.env.NEXT_PUBLIC_MY_SEOUL_DROP_URL;
  else process.env.NEXT_PUBLIC_MY_SEOUL_DROP_URL = originalUrl;
});

describe("mySeoulDropUrl", () => {
  it("uses the official domain and identifies the CTA placement", () => {
    delete process.env.NEXT_PUBLIC_MY_SEOUL_DROP_URL;
    const url = new URL(mySeoulDropUrl("home_hero"));
    expect(url.origin).toBe("https://myseouldrop.app");
    expect(url.searchParams.get("utm_source")).toBe("adropofseoul");
    expect(url.searchParams.get("utm_content")).toBe("home_hero");
  });

  it("allows a preview URL without changing call sites", () => {
    process.env.NEXT_PUBLIC_MY_SEOUL_DROP_URL = "https://preview.example/path";
    const url = new URL(mySeoulDropUrl("footer"));
    expect(url.origin).toBe("https://preview.example");
    expect(url.pathname).toBe("/path");
  });
});
