# Places photo rollout

## Collected photo batch — reviewed 2026-09-27

The 2026-09-26 Drive inventory contained 846 images in 230 numbered place
folders. This rollout connects **787 photos to 216 distinct Places entries**:
123 existing CMS places and 93 additional photo-backed places. The 152 published
CMS records plus the 93 additions give 245 directory entries; places without
photos retain their text cards.

- 13 source records (52 images) remain on publication hold.
- Seven images were left out: the previously rejected mirror selfie, one
  duplicate reception view, one photograph showing a different salon brand,
  and four matching interiors whose assignment to differently named places
  needs confirmation.
- Common IDs 034 and 321 both describe ARGYOL Seongsu. Their photos share the
  existing `argyol-seongsu` detail page; the newer verified room photos lead.
- The itemized audit is `data/place-photo-rollout.json`. No download failures
  remain. This is a fixed inventory snapshot, not a live Drive sync.

## Display and data

`data/place-photos.json` maps exact slugs to local images, cover first, with
Drive file IDs, review dates, source common IDs, and source pages where known.
`lib/place-images.ts` uses this manifest only when CMS `places.images` is empty.
An administrator's nonempty image list keeps its original order and wins over
the fallback.

`data/collected-places.json` contains the 93 additions, based on the existing
place registry and its ADOS/MSD source snapshots. The public Places service
merges these with the CMS by exact slug; CMS descriptions and booking links
win. Directory filters, detail routes, and the sitemap include the additions.
No rating, review count, or price was invented for these entries.

The directory puts photo cards first, preserving alphabetical order within
each group. Cards use a 3:2 crop. The detail gallery preserves the whole image,
including portrait photographs, and offers thumbnail selection and a counter.
Places without photos have no empty gallery. Images load lazily on the list;
the selected detail image receives priority.

Assets live at `public/images/places/<slug>/`. Imported files are EXIF-oriented
WebP images, resized down to a maximum 1600-pixel edge without upscaling. Source
watermarks remain visible. Original downloads and review contact sheets are
retained in `work/places-rollout/`. Historical JPG URLs from the original
five-photo JUNO/OROSYFUSS batch remain available.

This implementation bundles assets and supplemental records with the app. It
does not write to Supabase or deploy the production site. Collection records
still mark republication permissions as unverified.

## Maintaining a place

1. Match the exact branch, address, and common ID before adding photos.
2. Review the source images and place the representative cover first.
3. Add local assets and provenance to `data/place-photos.json`.
4. Add an approved supplemental place only when no matching CMS slug exists.
5. Run the image, directory, gallery, and sitemap tests; check list/detail views.

To retire a supplemental place, remove it from `data/collected-places.json` as
well as unpublishing any CMS record. Remove its photo manifest entry to retire
the fallback. Clearing an administrator's image list restores the fallback.

## Validation

36 focused tests and ESLint passed in the isolated rollout branch. The full
TypeScript check reports two pre-existing `ByRoleOptions.exact` errors in
`components/editorial/SiteHeader.test.tsx` (lines 14 and 60); that unrelated
file is unchanged in this rollout. All 787 WebP assets decoded successfully. Browser checks confirmed 245 directory entries,
216 photo cards, no failed loaded images, working thumbnail selection, and no
horizontal overflow at a 390-pixel mobile viewport. Local preview runs on
`http://127.0.0.1:3002/seoul/places` in its own build directory.
