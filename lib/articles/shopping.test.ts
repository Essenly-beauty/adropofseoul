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
    expect(listShoppingPosts()).toHaveLength(2);
  });
});
