# Editorial navigation and classification

Approved structure: **Seoul, Explained · Places · Beauty**. All Stories and About are secondary links. The companion planning CTA stays in the header. Desktop and mobile expose one submenu level; individual neighborhoods and Skin/Hair Profile choices live on their landing pages.

## One primary home per article

Choose the home by what the reader gains, not by a brand mentioned in the article.

| Section          | Topics                                               | Reader intent                                              |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Seoul, Explained | Everyday Life; Food & Drink; Shopping                | Understand everyday Korea, food culture, or how to shop    |
| Places           | Places; Neighborhoods                                | Choose a location, neighborhood, walk, or itinerary        |
| Beauty           | The Edit; Skincare; Hair & Scalp; Ingredients; Picks | Understand beauty, choose care, or compare beauty products |

The Edit aggregates **every Beauty article**. It is not a series or a category that excludes Skincare, Hair & Scalp, Ingredients, or Picks. General beauty industry, brand, interview, and trend features use The Edit as their primary home when a focused topic would be misleading. Beauty Profile is a tool, not an article category.

Picks covers skincare and hair product recommendations. Hair & Scalp also surfaces hair-related Picks through the Haircare keyword. Ingredients retains its dictionary and can additionally surface ingredient articles. All Stories is the complete, newest-first archive with search, section filters, keyword filters, and pagination.

## Boundary examples

- Daiso shopping guide and mixed souvenirs/travel purchases → Shopping.
- Why Daiso's beauty business changed → Beauty / The Edit. It explains an industry change, rather than reviewing a shortlist.
- Daiso versus Olive Young shopping strategy → Shopping.
- A recommended serum or hair-mask shortlist → Beauty / Picks, regardless of retailer.
- A specific store, salon, park, or neighborhood visit → Places.
- Bathhouse etiquette and Korean wellness habits → Everyday Life.
- Selecting bathhouses to visit → Places.
- Scalp care or what a head-spa treatment involves → Hair & Scalp.

There is no separate Daiso Edit or Culture Edit series. Existing article URLs and substantive article content stay intact. Historical tracking numbers can remain internal to analytics; they are not reader-facing series labels.

## Shared keywords

Keywords connect articles across primary sections. Use a small controlled vocabulary of brands, neighborhoods, and meaningful recurring interests; do not create duplicate keyword spellings or turn every incidental mention into a keyword.

- Canonical brand keys: `daiso`, `olive-young`. Their old spellings (Daiso Korea, Daiso Seoul, Korean Daiso) resolve to the same keyword.
- Neighborhoods include Seongsu, Hongdae, Hannam, Myeongdong, and Gangnam & Cheongdam.
- Recurring topics include Wellness & Rituals, Jjimjilbang, Slow Aging, Coffee & Cafés, Skincare Routines, Scalp Care, and KPop Demon Hunters.
- Keyword links go to `/stories?keyword=<key>`, where they can be combined with a section and a text search.
- Archive keyword menus show keywords with at least two matching articles, plus the selected keyword. An article's keyword links still work when only one article currently matches.
- Public keyword discovery uses reviewed overrides, existing tag aliases, and title matches. It never scans body text or automatically assigns a primary section from keywords.
- Internal facets such as `region:common`, `format:how-to`, audience, and season remain internal; they are not displayed as public keyword chips.

## Editing and maintenance

The CMS editor has an **Editorial home** selector and **Related keywords** checkboxes. The primary choice is saved as one `topic:<key>` tag. Keyword choices are saved as `keyword:<key>` tags plus `keywords:manual`, so unchecking a keyword actually removes it rather than allowing inference to add it back. The explicit editor choice overrides the launch audit. Other tags remain intact.

The storage category enum is preserved for compatibility. Reclassification is a presentation change and does not require rewriting all CMS rows or applying a database migration. `data/editorial-classification.json` explicitly assigns all 81 public articles reviewed at launch and the three unpublished local treatment drafts. New articles can use the CMS controls; code-defined articles should add a reviewed assignment or an explicit topic tag.

The shared catalog in `services/editorial.ts` fetches every published CMS page, merges code articles in the same precedence as the article renderer, deduplicates by slug, and sorts before filtering or pagination. It never publishes a local draft just because it has a classification. Query failure must not silently produce a successful partial archive.

Legacy paths:

- `/seoul/culture-edit` → `/seoul-explained`
- `/stories/shopping` → `/seoul-explained/shopping`
- `/wellness` → `/stories?keyword=wellness`
- Old Stories `seoul`, `shopping`, and `wellness` filters remain usable.

See [the full launch audit](EDITORIAL_CLASSIFICATION_AUDIT_2026-09-20.md) for every article's primary home and shared keywords.
