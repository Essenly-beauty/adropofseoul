const SUPABASE_HOSTNAME = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname;
  } catch {
    return null;
  }
})();

const remotePatterns = [];
if (SUPABASE_HOSTNAME) {
  remotePatterns.push({ protocol: "https", hostname: SUPABASE_HOSTNAME });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns },
};

module.exports = nextConfig;
