/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow next/image to load images served over HTTPS from any host —
    // Supabase Storage, brand sites, and affiliate CDNs alike. This is broad by
    // design for editorial/affiliate content. To lock the image optimizer down
    // later, replace the wildcard with explicit { protocol, hostname } entries
    // (e.g. your Supabase Storage host and each known CDN).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Permanent (308) redirects from the pre-restructure IA to the new homes.
  // Legacy Beauty children still resolve to the current Skincare and Hair &
  // Scalp routes. Places + Around Seoul → Seoul, /articles → /stories. Old
  // article/place/ingredient detail slugs
  // are preserved (/articles/:slug, /ingredients/:slug are unchanged); only the
  // section roots move, so every legacy section URL 301s to its new home.
  async redirects() {
    return [
      // Legacy Beauty children → current subsection routes. /beauty itself is
      // now the umbrella landing and must not redirect.
      { source: "/beauty/skincare", destination: "/skincare", permanent: true },
      { source: "/beauty/hair", destination: "/haircare", permanent: true },
      {
        source: "/beauty/picks",
        destination: "/skincare/picks",
        permanent: true,
      },
      // Places → Seoul › Places (og image route first — more specific)
      { source: "/places", destination: "/seoul/places", permanent: true },
      {
        source: "/places/:slug/og",
        destination: "/seoul/places/:slug/og",
        permanent: true,
      },
      {
        source: "/places/:slug",
        destination: "/seoul/places/:slug",
        permanent: true,
      },
      // Around Seoul → Seoul › Neighborhoods
      {
        source: "/around-seoul",
        destination: "/seoul/neighborhoods",
        permanent: true,
      },
      {
        source: "/around-seoul/common",
        destination: "/seoul/neighborhoods/common",
        permanent: true,
      },
      {
        source: "/around-seoul/:slug",
        destination: "/seoul/neighborhoods/:slug",
        permanent: true,
      },
      // Stories feed moved off /articles (detail pages stay at /articles/:slug)
      { source: "/articles", destination: "/stories", permanent: true },
      // Retired article. `seoul-head-spa-ritual` shipped as published but never
      // got past a two-line stub — 14 words, no tags, no meta, no hero — so it
      // surfaced on Wellness, Haircare, and Stories as an empty card. It is now
      // unpublished in the DB; this keeps any inbound link working by sending it
      // to the finished guide. Do not re-point at a `head_spa` listing: the
      // reader clicked expecting an article.
      {
        source: "/articles/seoul-head-spa-ritual",
        destination: "/articles/korean-head-spa-first-timer-guide",
        permanent: true,
      },
      // Beauty Profile: Hair Profile moved under the Skin+Hair hub
      {
        source: "/hair-profile",
        destination: "/beauty-profile/hair",
        permanent: true,
      },
      // Legacy short links from the previous restructure
      { source: "/hair", destination: "/haircare", permanent: true },
      { source: "/picks", destination: "/skincare/picks", permanent: true },
      {
        source: "/head-spa",
        destination: "/seoul/places?type=head-spa",
        permanent: true,
      },
      {
        source: "/guides",
        destination: "/seoul/neighborhoods",
        permanent: true,
      },
      {
        source: "/guides/seongsu",
        destination: "/seoul/neighborhoods/seongsu",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
