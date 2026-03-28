/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Images are served as-is (SVGs + local PNGs) — no server-side resize = zero image compute cost
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Next.js static chunks — immutable, cache 1 year
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Public images folder
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        // Uploaded files served from /data volume
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
