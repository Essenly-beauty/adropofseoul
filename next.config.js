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
};

module.exports = nextConfig;
