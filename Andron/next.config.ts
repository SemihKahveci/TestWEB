/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // basePath sadece production'da aktif olsun
  basePath: process.env.NODE_ENV === 'production' ? '/home' : '',
  // assetPrefix basePath ile aynı olmalı (production'da)
  assetPrefix: process.env.NODE_ENV === 'production' ? '/home' : '',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
};

export default nextConfig;
