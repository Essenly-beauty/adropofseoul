import { describe, it, expect } from "vitest";
import { parsePlaceForm } from "./places";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const valid = {
  name: "Test Salon",
  category: "salon",
  entryType: "place",
};

describe("parsePlaceForm", () => {
  it("requires a name", () => {
    const res = parsePlaceForm(fd({ ...valid, name: "  " }), {
      mode: "create",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.name).toBeTruthy();
  });

  it("rejects an unknown category and entryType", () => {
    const bad = parsePlaceForm(fd({ ...valid, category: "wat" }), {
      mode: "create",
    });
    expect(bad.ok).toBe(false);
    const badKind = parsePlaceForm(fd({ ...valid, entryType: "nope" }), {
      mode: "create",
    });
    expect(badKind.ok).toBe(false);
  });

  it("derives slug from name on create when slug blank", () => {
    const res = parsePlaceForm(fd({ ...valid, name: "Sool Loft Head Spa" }), {
      mode: "create",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.slug).toBe("sool-loft-head-spa");
  });

  it("slugifies a provided slug on create", () => {
    const res = parsePlaceForm(fd({ ...valid, slug: "My Custom Slug!" }), {
      mode: "create",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.slug).toBe("my-custom-slug");
  });

  it("normalizes empty text fields to null and trims", () => {
    const res = parsePlaceForm(
      fd({ ...valid, nameKr: "  더테스트  ", address: "" }),
      { mode: "create" }
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.nameKr).toBe("더테스트");
      expect(res.value.address).toBeNull();
    }
  });

  it("validates rating range and reviewCount", () => {
    const bad = parsePlaceForm(fd({ ...valid, rating: "9" }), {
      mode: "create",
    });
    expect(bad.ok).toBe(false);
    const ok = parsePlaceForm(
      fd({ ...valid, rating: "4.7", reviewCount: "12" }),
      {
        mode: "create",
      }
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.rating).toBe(4.7);
      expect(ok.value.reviewCount).toBe(12);
    }
  });

  it("rejects a non-http url", () => {
    const res = parsePlaceForm(fd({ ...valid, naverMapUrl: "ftp://x" }), {
      mode: "create",
    });
    expect(res.ok).toBe(false);
  });

  it("splits languages and images by newline, dropping blanks", () => {
    const res = parsePlaceForm(
      fd({
        ...valid,
        languages: "English\n\nKorean\n",
        images: "https://a.com/1.jpg\nhttps://a.com/2.jpg",
      }),
      { mode: "create" }
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.languages).toEqual(["English", "Korean"]);
      expect(res.value.images).toEqual([
        "https://a.com/1.jpg",
        "https://a.com/2.jpg",
      ]);
    }
  });

  it("reads isPublished from a checkbox value", () => {
    const on = parsePlaceForm(fd({ ...valid, isPublished: "on" }), {
      mode: "create",
    });
    expect(on.ok && on.value.isPublished).toBe(true);
    const off = parsePlaceForm(fd({ ...valid }), { mode: "create" });
    expect(off.ok && off.value.isPublished).toBe(false);
  });
});
