import { describe, it, expect } from "vitest";
import { parseAdminEmails, isAllowedAdmin } from "./auth";

describe("parseAdminEmails", () => {
  it("splits, trims, lowercases, drops blanks", () => {
    expect(parseAdminEmails(" A@x.com, b@Y.com ,")).toEqual([
      "a@x.com",
      "b@y.com",
    ]);
  });
  it("returns [] for undefined", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
  });
});

describe("isAllowedAdmin", () => {
  it("is true for a listed email (case-insensitive)", () => {
    expect(isAllowedAdmin("A@x.com", "a@x.com,b@y.com")).toBe(true);
  });
  it("is false for an unlisted email", () => {
    expect(isAllowedAdmin("c@z.com", "a@x.com")).toBe(false);
  });
  it("is false for null", () => {
    expect(isAllowedAdmin(null, "a@x.com")).toBe(false);
  });
});
