# Seoul pillar / hub hero images

Drop hero photos here using these exact filenames. Until a file exists, the
article renders a branded placeholder frame automatically (no broken images),
so the post ships fine without them. Each hero also doubles as the article's
Open Graph / Twitter card image once present.

| File                            | Article                                       | Alt text (keep for SEO/accessibility)                                         |
| ------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `seoul-neighborhoods-guide.png` | Seoul by Neighborhood (Around Seoul · Common) | Original Seoul City Hall Plaza photograph, warm editorial grade and 16:9 crop |

## Non-article assets

| File                      | Used by                             | Notes                                                                                                                                                                                              |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seoul-skyline-dusk.avif` | Home page closing / newsletter band | Decorative (`alt=""`), sits under a scrim — see `CLOSING_SCRIM` in `app/page.tsx`. Unsplash License. Currently 1200×801; swap in the larger original if the band ever looks soft on wide displays. |

Alt text and captions live in `lib/articles/pillars.ts` (`heroAlt`, `heroCaption`).
Recommended: ~1600×900 (16:9), optimized JPG/WebP under ~300 KB.
