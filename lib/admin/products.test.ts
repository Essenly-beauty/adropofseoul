import { describe, it, expect } from "vitest";
import { parseProductForm } from "./products";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const valid = { name: "Snail Mucin Essence" };

describe("parseProductForm", () => {
  it("requires a name", () => {
    const res = parseProductForm(fd({ ...valid, name: " " }), {
      mode: "create",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.name).toBeTruthy();
  });

  it("derives slug from name on create when slug blank", () => {
    const res = parseProductForm(fd({ ...valid, name: "COSRX Snail Mucin" }), {
      mode: "create",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.slug).toBe("cosrx-snail-mucin");
  });

  it("slugifies a provided slug on create", () => {
    const res = parseProductForm(fd({ ...valid, slug: "My Custom Slug!" }), {
      mode: "create",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.slug).toBe("my-custom-slug");
  });

  it("accepts free-text category with no enum check", () => {
    const res = parseProductForm(fd({ ...valid, category: "anything goes" }), {
      mode: "create",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.category).toBe("anything goes");
  });

  it("normalizes empty text fields to null and trims", () => {
    const res = parseProductForm(
      fd({ ...valid, brand: "  COSRX  ", description: "" }),
      { mode: "create" }
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.brand).toBe("COSRX");
      expect(res.value.description).toBeNull();
    }
  });

  it("validates rating range", () => {
    const bad = parseProductForm(fd({ ...valid, rating: "9" }), {
      mode: "create",
    });
    expect(bad.ok).toBe(false);
    const ok = parseProductForm(fd({ ...valid, rating: "4.5" }), {
      mode: "create",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.rating).toBe(4.5);
  });

  it("rejects a non-http image url", () => {
    const res = parseProductForm(fd({ ...valid, image: "ftp://x" }), {
      mode: "create",
    });
    expect(res.ok).toBe(false);
  });

  it("rejects a non-http affiliateUrl", () => {
    const res = parseProductForm(fd({ ...valid, affiliateUrl: "ftp://x" }), {
      mode: "create",
    });
    expect(res.ok).toBe(false);
  });

  it("reads disclosureRequired and isPublished from checkbox values", () => {
    const on = parseProductForm(
      fd({ ...valid, disclosureRequired: "on", isPublished: "on" }),
      { mode: "create" }
    );
    expect(on.ok && on.value.disclosureRequired).toBe(true);
    expect(on.ok && on.value.isPublished).toBe(true);
    const off = parseProductForm(fd({ ...valid }), { mode: "create" });
    expect(off.ok && off.value.disclosureRequired).toBe(false);
    expect(off.ok && off.value.isPublished).toBe(false);
  });
});
