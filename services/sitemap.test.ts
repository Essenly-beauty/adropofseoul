import { expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/public";
import { listSitemapContent } from "./sitemap";

vi.mock("@/lib/supabase/public", () => ({ createClient: vi.fn() }));

function clientWithFailure(failingTable?: string) {
  const filters: Record<string, unknown[]> = {};
  const client = {
    from(table: string) {
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters[table] = [key, value];
          return query;
        },
        order: () => query,
        limit: () =>
          Promise.resolve({
            data: [
              {
                slug: `${table}-sample`,
                published_at: "2026-09-01",
                updated_at: "2026-09-20",
              },
            ],
            error:
              table === failingTable ? new Error(`${table} unavailable`) : null,
          }),
      };
      return query;
    },
  };
  vi.mocked(createClient).mockReturnValue(
    client as unknown as ReturnType<typeof createClient>
  );
  return filters;
}

it("uses explicit publish filters for all three public content types", async () => {
  const filters = clientWithFailure();
  const inventory = await listSitemapContent();
  expect(filters).toEqual({
    posts: ["status", "published"],
    places: ["is_published", true],
    ingredients: ["status", "published"],
  });
  expect(inventory.posts[0]).toEqual({
    slug: "posts-sample",
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-20",
  });
  expect(inventory.places[0].slug).toBe("places-sample");
  expect(inventory.ingredients[0].slug).toBe("ingredients-sample");
});

it.each(["posts", "places", "ingredients"])(
  "rejects an incomplete inventory when %s fails",
  async (table) => {
    clientWithFailure(table);
    await expect(listSitemapContent()).rejects.toThrow(`${table} unavailable`);
  }
);
