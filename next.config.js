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
  async redirects() {
    return [
      { source: "/hair", destination: "/beauty/hair", permanent: true },
      { source: "/picks", destination: "/beauty/picks", permanent: true },
      {
        source: "/head-spa",
        destination: "/places?type=head-spa",
        permanent: true,
      },
      { source: "/guides", destination: "/around-seoul", permanent: true },
      {
        source: "/guides/seongsu",
        destination: "/around-seoul/seongsu",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
