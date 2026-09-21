import { describe, it, expect } from "vitest";
import { parsePostForm } from "./posts";

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}
const valid = { title: "Hello World", category: "beauty", status: "draft" };

describe("parsePostForm", () => {
  it("requires a title", () => {
    const r = parsePostForm(fd({ ...valid, title: " " }), { mode: "create" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.title).toBeTruthy();
  });
  it("rejects an unknown category and status", () => {
    expect(
      parsePostForm(fd({ ...valid, category: "x" }), { mode: "create" }).ok
    ).toBe(false);
    expect(
      parsePostForm(fd({ ...valid, status: "x" }), { mode: "create" }).ok
    ).toBe(false);
  });
  it("derives slug from title on create", () => {
    const r = parsePostForm(fd({ ...valid, title: "My First Post" }), {
      mode: "create",
    });
    expect(r.ok && r.value.slug).toBe("my-first-post");
  });
  it("splits tags by newline and trims/nulls text", () => {
    const r = parsePostForm(
      fd({ ...valid, tags: "kbeauty\n\nseoul\n", subtitle: "  " }),
      { mode: "create" }
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.tags).toEqual(["kbeauty", "seoul"]);
      expect(r.value.subtitle).toBeNull();
    }
  });
  it("rejects a non-http featuredImage", () => {
    expect(
      parsePostForm(fd({ ...valid, featuredImage: "ftp://x" }), {
        mode: "create",
      }).ok
    ).toBe(false);
  });
  it("passes publishedAt through unchanged", () => {
    const r = parsePostForm(
      fd({ ...valid, publishedAt: "2026-01-01T00:00:00Z" }),
      { mode: "create" }
    );
    expect(r.ok && r.value.publishedAt).toBe("2026-01-01T00:00:00Z");
  });
});

describe("editorial assignments", () => {
  it("saves one primary topic and canonical keywords while preserving other tags", () => {
    const input = fd({
      ...valid,
      editorialTopic: "picks",
      tags: "topic:shopping\nregion:common\nCulture Edit",
      keywordsProvided: "true",
    });
    input.append("editorialKeywords", "daiso");
    input.append("editorialKeywords", "olive-young");
    const result = parsePostForm(input, { mode: "edit" });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.tags).toEqual([
        "region:common",
        "Culture Edit",
        "topic:picks",
        "keywords:manual",
        "keyword:daiso",
        "keyword:olive-young",
      ]);
  });
  it("rejects unsupported homes and keywords", () => {
    expect(
      parsePostForm(fd({ ...valid, editorialTopic: "not-a-topic" }), {
        mode: "create",
      }).ok
    ).toBe(false);
    expect(
      parsePostForm(fd({ ...valid, editorialKeywords: "not-a-keyword" }), {
        mode: "create",
      }).ok
    ).toBe(false);
  });
});
