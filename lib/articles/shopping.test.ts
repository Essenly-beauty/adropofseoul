import { describe, expect, it } from "vitest";
import {
  SHOPPING_ARTICLE_SLUGS,
  getShoppingArticle,
  listShoppingPosts,
} from "./shopping";

describe("Shopping editorial registry", () => {
  it("publishes Article 01 as Shopping with independent series metadata", () => {
    const article = getShoppingArticle("daiso-korea-guide");
    expect(article).toBeDefined();
    expect(article?.category).toBe("shopping");
    expect(article?.series.displayName).toBe("THE DAISO EDIT");
    expect(article?.series.number).toBe("01");
    expect(SHOPPING_ARTICLE_SLUGS).toContain("daiso-korea-guide");
  });

  it("publishes Article 02 and links Article 01 to it", () => {
    const first = getShoppingArticle("daiso-korea-guide");
    const second = getShoppingArticle("daiso-korea-must-buys");
    expect(first?.body).toContain("](/articles/daiso-korea-must-buys)");
    expect(second?.series.number).toBe("02");
    expect(second?.seoTitle).toBe("20 Best Daiso Korea Must-Buys (2026)");
    expect(second?.body).not.toContain("IMAGE SLOT");
    expect(listShoppingPosts()).toHaveLength(4);
  });

  it("registers Article 03 without exposing production notes", () => {
    const article = getShoppingArticle("daiso-korea-beauty");
    expect(article?.series.number).toBe("03");
    expect(article?.seoTitle).toBe(
      "Daiso Korea Beauty: Why ₩5,000 K-Beauty Is Getting Good"
    );
    expect(article?.body).toContain("](/articles/daiso-korea-guide)");
    expect(article?.body).not.toContain("IMAGE SLOT");
    expect(article?.body).not.toContain("Item No.");
    expect(article?.heroImage).toBe(
      "/images/articles/daiso-korea-beauty/hero.png"
    );
  });

  it("publishes Article 04 as a clean Daiso versus Olive Young comparison", () => {
    const article = getShoppingArticle("daiso-vs-olive-young-korea");
    expect(article?.series.number).toBe("04");
    expect(article?.heroImage).toBe(
      "/images/articles/daiso-vs-olive-young-korea/hero.png"
    );
    expect(article?.body).toContain("| Best for |");
    expect(article?.body).toContain("](/articles/daiso-korea-beauty)");
    expect(article?.body).not.toContain("IMAGE SLOT");
    expect(article?.body).not.toContain("IMPLEMENTATION NOTES");
    expect(article?.body).not.toContain("33% of offline sales");
  });
});
