import { describe, it, expect } from "vitest";
import { parseRedditSearch, formatGathered, redditQueryFor } from "./sources";

const redditFixture = {
  data: {
    children: [
      {
        data: {
          title: "Best head spa in Seongsu?",
          selftext: "Just tried Sool Loft — incredible scalp treatment.",
          permalink: "/r/seoul/comments/abc123/best_head_spa/",
          removed_by_category: null,
          url: "https://i.redd.it/photo1.jpg",
          preview: {
            images: [
              {
                source: {
                  url: "https://preview.redd.it/p1.jpg?width=640&amp;s=x",
                },
              },
            ],
          },
        },
      },
      {
        data: {
          title: "[removed post]",
          selftext: "",
          permalink: "/r/seoul/comments/gone/removed/",
          removed_by_category: "moderator",
        },
      },
      {
        data: {
          title: "Empty body still counts (title-only)",
          selftext: "",
          permalink: "/r/seoul/comments/def456/title_only/",
          removed_by_category: null,
        },
      },
    ],
  },
};

describe("parseRedditSearch", () => {
  it("maps posts to SourceDocs with absolute URLs", () => {
    const docs = parseRedditSearch(redditFixture);
    expect(docs[0].url).toBe(
      "https://www.reddit.com/r/seoul/comments/abc123/best_head_spa/"
    );
    expect(docs[0].title).toBe("Best head spa in Seongsu?");
    expect(docs[0].text).toContain("Sool Loft");
  });
  it("skips removed posts but keeps title-only posts", () => {
    const docs = parseRedditSearch(redditFixture);
    expect(docs).toHaveLength(2);
    expect(docs.map((d) => d.title)).not.toContain("[removed post]");
  });
  it("tolerates malformed payloads", () => {
    expect(parseRedditSearch({})).toEqual([]);
    expect(parseRedditSearch(null)).toEqual([]);
  });
  it("collects direct-link and preview images, unescaping &amp;", () => {
    const docs = parseRedditSearch(redditFixture);
    expect(docs[0].images).toEqual([
      "https://i.redd.it/photo1.jpg",
      "https://preview.redd.it/p1.jpg?width=640&s=x",
    ]);
    expect(docs[1].images).toEqual([]);
  });
  it("rejects non-http(s) image schemes", () => {
    const docs = parseRedditSearch({
      data: {
        children: [
          {
            data: {
              title: "sneaky",
              selftext: "",
              permalink: "/r/seoul/comments/zzz/sneaky/",
              removed_by_category: null,
              url: "javascript:fetch(1)//pic.jpg",
              preview: {
                images: [{ source: { url: "data:text/html,x.jpg" } }],
              },
            },
          },
        ],
      },
    });
    expect(docs[0].images).toEqual([]);
  });
});

describe("formatGathered", () => {
  it("labels each block with its URL so the extractor can cite it", () => {
    const s = formatGathered([
      { url: "https://a.example", title: "T1", text: "body one", images: [] },
      {
        url: "https://b.example",
        title: "T2",
        text: "body two",
        images: ["https://i.redd.it/x.jpg"],
      },
    ]);
    expect(s).toContain("[1] https://a.example");
    expect(s).toContain("[2] https://b.example");
    expect(s).toContain("body two");
    expect(s).toContain("images: https://i.redd.it/x.jpg");
  });
});

describe("redditQueryFor", () => {
  it("includes the area and beauty-domain terms", () => {
    const q = redditQueryFor("Seongsu");
    expect(q).toContain("Seongsu");
    expect(q.toLowerCase()).toMatch(/spa|salon|beauty|cafe/);
  });
});
