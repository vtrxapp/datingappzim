const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['shared'],
  images: {
    // Cloudflare R2 (and local dev storage) serve already-compressed images;
    // remotePatterns is intentionally permissive for MVP and should be
    // tightened to the real R2 public hostname before production launch.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = withPWA(nextConfig);
