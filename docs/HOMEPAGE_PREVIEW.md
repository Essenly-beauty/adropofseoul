# Homepage preview — 2026-09-21

Local review: http://localhost:3101

The supplied Markdown and subsequent review define the copy and section order; the supplied screenshot is a visual reference. The existing Beauty → The Edit entry remains in both the header and category links.

## Implemented

- Full-width photographic hero with the revised headlines and `For my friends` as real, selectable handwritten text.
- Latest Drops: four newest published stories from the existing unified CMS/code catalog, with 4:3 images, topic/section labels, excerpts, and reading times.
- Latest Drops stays directly below the hero. The hero CTA jumps to a curated first-story section after Latest Drops, with compact image-and-text rows on mobile.
- Our Perspective uses “What Makes Seoul, Seoul?”, budget-coffee copy, and the existing rainy-street image; three category entrances retain their subcategory links.
- Header and footer copy introduce Korean life, culture and beauty, seen from Seoul. The closing statement reads “Little things make a big city feel human”.
- Larger header text, All Stories/About preview panels, and a My Seoul Drop explanation before the outbound link. Beauty is grouped into Read & discover, Build your routine, and Find your fit.
- Desktop hover/click dropdowns, Escape and outside-click dismissal, mobile accordions, and a search form connected to `/stories?q=...`.
- One-column mobile reading, responsive optimized images, separate desktop/mobile hero focal positions, and reduced-motion support.
- Existing article routes and homepage canonical preserved. Prepared for production publication after local review; the editor-note pilot is not included.

Fixed image sources and focal positions are in `lib/homepage.ts`. Latest Drops stays chronological. The document's proposed CMS homepage art-direction controls are a future content-management extension, not an implemented admin screen in this visual preview. English is displayed as the current language; no nonfunctional language switcher is shown.

## Hero asset provenance

Tool: built-in `image_gen` (not CLI). This is a generated editorial scene, not documentary evidence of a particular Seoul street.

Saved asset: `public/images/home/seoul-neighborhood-hero.png` (1672 × 941). The original generated output is retained under the image tool's generated-images directory. Next Image supplies responsive optimized delivery. The supplied brief recommends a 2400px master; the generated preview asset is smaller and should be replaced with a higher-resolution master if a final full-resolution photographic asset is selected.

Final generation prompt:

```text
Use case: photorealistic-natural
Asset type: full-bleed editorial homepage hero photograph, wide landscape 2560x1440 or larger 16:9
Primary request: Editorial documentary photograph of everyday Seoul seen from a lived-in residential neighborhood, a few people naturally walking away through a gently sloped street in late afternoon, layered homes and city buildings, subtle Namsan and Seoul Tower in the distance. Contemporary Seoul, sophisticated independent magazine, human-scale city, lived-in believable details.
Composition: shoot at pedestrian eye level looking down a winding small neighborhood street. Nearest brick house and soft shadow at left provide quiet dark negative space for an HTML headline (left 45%). A couple of small natural pedestrians farther down the street toward center-right. Skyline and tower far away and small. Right side buildings catch warm natural late-afternoon light. Keep composition useful for centered mobile crop too, no essential people at frame edge. Restrained color, muted warm concrete, textured brick, soft green trees, natural blue sky. Realistic proportions, ordinary modern clothes, imperfect lived-in street, subtle cinematic framing.
Avoid: any embedded lettering or typography, branding, readable signs, tourism postcard skyline, hanbok, cherry blossoms, cyberpunk neon, artificial orange color grade, posing, close faces, surreal architecture, glossy advertising aesthetics, fake film borders, watermarks. Image only, no UI or text.
```

Other homepage photography reuses existing project assets; article thumbnails remain tied to their original stories.
