# SEO publishing workflow

The site generates canonical URLs, Open Graph/Twitter metadata, structured
data, breadcrumbs, related stories, and sitemap entries from the article model.
Authors should not hand-write HTML metadata.

## Required frontmatter for published articles

Every file in `content/articles/` must provide `title`, `slug`, `excerpt`,
`category`, non-empty `tags`, `seo_title`, `meta_description`, `author`,
`status: "published"`, and `published_at`. The automated frontmatter test fails
when one is missing. Drafts belong in `content/drafts/`.

`featured_image` is recommended but not required. Articles without one use the
1200x630 `/og.png` social fallback. When an article image is added, add its
descriptive alt/credit record to `lib/article-images.ts`; never use a filename
as alt text.

## Publish checklist

1. Edit and fact-check the article; confirm internal links resolve.
2. Run `npm test -- scripts/frontmatter.test.mjs`.
3. Seed/publish through the existing posts workflow.
4. Verify the article URL, title, description, canonical, social image, visible
   date and breadcrumbs, related stories, and sitemap entry.
5. Use Search Console URL Inspection for important new articles; the sitemap is
   already referenced by robots.txt.
6. Confirm `page_view` and `article_view` in GA4 DebugView/Realtime.

## Production configuration

- `NEXT_PUBLIC_SITE_URL=https://adropofseoul.com`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...`
- Sitemap: `https://adropofseoul.com/sitemap.xml`
- Robots: `https://adropofseoul.com/robots.txt`

GA4 loads only on the production Vercel deployment at `adropofseoul.com`.
Editorial events use controlled slugs/categories and must never contain email,
free text, quiz responses, or other personal data.

`llms.txt` is intentionally deferred. It is not a substitute for crawlable
content, sitemap, canonical metadata, structured data, or internal links.
